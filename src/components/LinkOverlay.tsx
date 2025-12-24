import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState, useMemo } from 'react';
import { linksAtom, manualLinksAtom, showLinksAtom, hiddenLinkIndicesAtom, gameStateAtom, panelModeAtom } from '../store/game';

interface Point {
  x: number;
  y: number;
}

// Calculate position at the edge of a candidate cell (not center)
function getCandidateEdgePosition(
  cellRect: DOMRect,
  boardRect: DOMRect,
  candidate: number,
  targetX: number,
  targetY: number
): Point {
  // Candidates are arranged in a 3x3 grid within the cell
  const row = Math.floor((candidate - 1) / 3);
  const col = (candidate - 1) % 3;
  
  const cellWidth = cellRect.width;
  const cellHeight = cellRect.height;
  const candidateWidth = cellWidth / 3;
  const candidateHeight = cellHeight / 3;
  
  // Center position of the candidate
  const centerX = cellRect.left - boardRect.left + (col + 0.5) * candidateWidth;
  const centerY = cellRect.top - boardRect.top + (row + 0.5) * candidateHeight;
  
  // Calculate direction to target
  const dx = targetX - centerX;
  const dy = targetY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return { x: centerX, y: centerY };
  
  // Offset from center to edge (half of candidate cell size, with some padding)
  const radius = Math.min(candidateWidth, candidateHeight) * 0.45;
  
  return {
    x: centerX + (dx / distance) * radius,
    y: centerY + (dy / distance) * radius,
  };
}

// Get center position of a candidate
function getCandidateCenter(
  cellRect: DOMRect,
  boardRect: DOMRect,
  candidate: number
): Point {
  const row = Math.floor((candidate - 1) / 3);
  const col = (candidate - 1) % 3;
  
  const candidateWidth = cellRect.width / 3;
  const candidateHeight = cellRect.height / 3;
  
  return {
    x: cellRect.left - boardRect.left + (col + 0.5) * candidateWidth,
    y: cellRect.top - boardRect.top + (row + 0.5) * candidateHeight,
  };
}

export function LinkOverlay() {
  const hintLinks = useAtomValue(linksAtom);
  const manualLinks = useAtomValue(manualLinksAtom);
  const showLinks = useAtomValue(showLinksAtom);
  const hiddenIndices = useAtomValue(hiddenLinkIndicesAtom);
  const gameState = useAtomValue(gameStateAtom);
  const panelMode = useAtomValue(panelModeAtom);
  
  const [cellRects, setCellRects] = useState<Map<string, DOMRect>>(new Map());
  const [boardRect, setBoardRect] = useState<DOMRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if a link endpoint is still valid (candidate exists in notes)
  const isEndpointValid = (endpoint: { row: number; col: number; candidate: number }) => {
    if (gameState.board.length === 0) return false;
    const cell = gameState.board[endpoint.row]?.[endpoint.col];
    if (!cell) return false;
    if (cell.value !== null) return false;
    return cell.notes.has(endpoint.candidate);
  };

  // Filter links to only include valid ones (not hidden and endpoints exist)
  const allLinks = useMemo(() => {
    const combined = [...hintLinks, ...manualLinks];
    return combined
      .map((link, idx) => ({ link, idx }))
      .filter(({ link, idx }) => 
        isEndpointValid(link.from) && 
        isEndpointValid(link.to) &&
        !hiddenIndices.has(idx)
      )
      .map(({ link }) => link);
  }, [hintLinks, manualLinks, gameState.board, hiddenIndices]);

  // Only show links when showLinks is true and in reason mode or have hint links
  const shouldShow = showLinks && (panelMode === 'reason' || hintLinks.length > 0);
  const links = shouldShow ? allLinks : [];

  // Calculate cell positions when links change
  useEffect(() => {
    if (links.length === 0 || !containerRef.current) {
      setCellRects(new Map());
      setBoardRect(null);
      return;
    }

    const board = containerRef.current.parentElement?.querySelector('[role="grid"]');
    if (!board) return;

    const newBoardRect = board.getBoundingClientRect();
    setBoardRect(newBoardRect);

    const cells = board.querySelectorAll('button');
    const newCellRects = new Map<string, DOMRect>();

    links.forEach(link => {
      const fromIndex = link.from.row * 9 + link.from.col;
      const toIndex = link.to.row * 9 + link.to.col;
      
      const fromCell = cells[fromIndex];
      const toCell = cells[toIndex];
      
      if (fromCell) {
        newCellRects.set(`${link.from.row}-${link.from.col}`, fromCell.getBoundingClientRect());
      }
      if (toCell) {
        newCellRects.set(`${link.to.row}-${link.to.col}`, toCell.getBoundingClientRect());
      }
    });

    setCellRects(newCellRects);
  }, [links]);

  if (links.length === 0 || !boardRect) return null;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-10"
      aria-hidden="true"
    >
      <svg className="w-full h-full" style={{ overflow: 'visible' }}>
        {links.map((link, index) => {
          const fromCellRect = cellRects.get(`${link.from.row}-${link.from.col}`);
          const toCellRect = cellRects.get(`${link.to.row}-${link.to.col}`);

          if (!fromCellRect || !toCellRect) return null;

          // Get centers first to calculate direction
          const fromCenter = getCandidateCenter(fromCellRect, boardRect, link.from.candidate);
          const toCenter = getCandidateCenter(toCellRect, boardRect, link.to.candidate);

          // Get edge positions (lines start from edges, not centers)
          const fromPos = getCandidateEdgePosition(fromCellRect, boardRect, link.from.candidate, toCenter.x, toCenter.y);
          const toPos = getCandidateEdgePosition(toCellRect, boardRect, link.to.candidate, fromCenter.x, fromCenter.y);

          const isStrong = link.type === 'strong';
          const strokeColor = isStrong ? '#0984e3' : '#e17055';
          const strokeDash = isStrong ? 'none' : '5,3';

          // Calculate control point for curved line
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // Curve offset perpendicular to line (more curve for longer lines)
          const curveOffset = Math.min(distance * 0.15, 15);
          const perpX = distance > 0 ? -dy / distance * curveOffset : 0;
          const perpY = distance > 0 ? dx / distance * curveOffset : 0;
          
          const ctrlX = midX + perpX;
          const ctrlY = midY + perpY;

          return (
            <g key={index}>
              {/* Glow effect */}
              <path
                d={`M ${fromPos.x} ${fromPos.y} Q ${ctrlX} ${ctrlY} ${toPos.x} ${toPos.y}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth="4"
                strokeOpacity="0.15"
                strokeLinecap="round"
              />
              {/* Main line - no arrow, bidirectional */}
              <path
                d={`M ${fromPos.x} ${fromPos.y} Q ${ctrlX} ${ctrlY} ${toPos.x} ${toPos.y}`}
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.5"
                strokeDasharray={strokeDash}
                strokeLinecap="round"
              />
              {/* End points - small dots */}
              <circle
                cx={fromPos.x}
                cy={fromPos.y}
                r="2"
                fill={strokeColor}
              />
              <circle
                cx={toPos.x}
                cy={toPos.y}
                r="2"
                fill={strokeColor}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
