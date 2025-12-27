import { useSetAtom, useAtomValue } from 'jotai';
import { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { 
  historyTreeAtom,
  gameStateAtom,
  clearManualLinksAtom,
  manualLinksAtom,
  linksAtom,
  hiddenLinkIndicesAtom,
  toggleLinkVisibilityAtom,
  removeLinkAtom,
  panelModeAtom,
  setPanelModeAtom,
  restoreToNodeAtom,
  type PanelMode,
  type HistoryNode,
} from '../store/game';

// Layout constants for tree visualization
const NODE_RADIUS = 16;
const NODE_GAP_X = 50;
const NODE_GAP_Y = 50;
const CANVAS_PADDING = 40;

// Calculate tree layout positions
interface NodePosition {
  id: string;
  x: number;
  y: number;
  node: HistoryNode;
}

interface TreeLayout {
  positions: NodePosition[];
  edges: Array<{ from: NodePosition; to: NodePosition }>;
  width: number;
  height: number;
}

function calculateTreeLayout(
  nodes: Record<string, HistoryNode>,
  rootId: string
): TreeLayout {
  const positions: NodePosition[] = [];
  const edges: Array<{ from: NodePosition; to: NodePosition }> = [];
  
  // Calculate subtree width for each node
  const subtreeWidths = new Map<string, number>();
  
  function calcWidth(nodeId: string): number {
    const node = nodes[nodeId];
    if (!node) return 0;
    
    if (node.childrenIds.length === 0) {
      subtreeWidths.set(nodeId, 1);
      return 1;
    }
    
    let totalWidth = 0;
    for (const childId of node.childrenIds) {
      totalWidth += calcWidth(childId);
    }
    subtreeWidths.set(nodeId, totalWidth);
    return totalWidth;
  }
  
  calcWidth(rootId);
  
  // Position nodes
  function positionNode(nodeId: string, depth: number, leftOffset: number): NodePosition | null {
    const node = nodes[nodeId];
    if (!node) return null;
    
    const subtreeWidth = subtreeWidths.get(nodeId) || 1;
    const x = CANVAS_PADDING + (leftOffset + subtreeWidth / 2) * NODE_GAP_X;
    const y = CANVAS_PADDING + depth * NODE_GAP_Y;
    
    const pos: NodePosition = { id: nodeId, x, y, node };
    positions.push(pos);
    
    // Position children
    let childOffset = leftOffset;
    for (const childId of node.childrenIds) {
      const childPos = positionNode(childId, depth + 1, childOffset);
      if (childPos) {
        edges.push({ from: pos, to: childPos });
        childOffset += subtreeWidths.get(childId) || 1;
      }
    }
    
    return pos;
  }
  
  positionNode(rootId, 0, 0);
  
  // Calculate canvas size
  const maxX = Math.max(...positions.map(p => p.x), 0);
  const maxY = Math.max(...positions.map(p => p.y), 0);
  
  return {
    positions,
    edges,
    width: maxX + CANVAS_PADDING,
    height: maxY + CANVAS_PADDING,
  };
}

// Draggable Tree Canvas
function DraggableTreeCanvas({
  historyTree,
  currentNode,
  nodeCount,
  branchCount,
  onRestore,
}: {
  historyTree: { nodes: Record<string, HistoryNode>; currentNodeId: string; rootId: string };
  currentNode: HistoryNode | undefined;
  nodeCount: number;
  branchCount: number;
  onRestore: (nodeId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  
  // Calculate layout
  const layout = useMemo(() => 
    calculateTreeLayout(historyTree.nodes, historyTree.rootId),
    [historyTree.nodes, historyTree.rootId]
  );
  
  // Find current node position
  const currentPos = useMemo(() => 
    layout.positions.find(p => p.id === historyTree.currentNodeId),
    [layout.positions, historyTree.currentNodeId]
  );
  
  // Center on current node when it changes
  useEffect(() => {
    if (currentPos && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      
      setOffset({
        x: containerWidth / 2 - currentPos.x,
        y: containerHeight / 2 - currentPos.y,
      });
    }
  }, [currentPos?.id]);
  
  // Mouse/touch handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [offset]);
  
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    setOffset({
      x: dragStartRef.current.offsetX + dx,
      y: dragStartRef.current.offsetY + dy,
    });
  }, [isDragging]);
  
  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);
  
  // Node click handler
  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDragging) {
      onRestore(nodeId);
    }
  }, [isDragging, onRestore]);
  
  if (!currentNode) {
    return <div className="text-center text-grid/50 py-4">No history yet</div>;
  }

  return (
    <div className="space-y-2">
      {/* Current state info */}
      <div className="px-3 py-2 bg-accent/10 rounded-lg flex items-center justify-between">
        <span className="font-mono text-xs text-ink">{currentNode.description}</span>
        <span className="text-accent font-bold text-sm">{currentNode.filledCount}/81</span>
      </div>
      
      {/* Tree canvas */}
      <div 
        ref={containerRef}
        className="relative h-[200px] bg-paper border border-grid/10 rounded-xl overflow-hidden cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{ touchAction: 'none' }}
      >
        <svg
          width={layout.width}
          height={layout.height}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          }}
          className="absolute"
        >
          {/* Edges */}
          {layout.edges.map((edge, idx) => (
            <line
              key={idx}
              x1={edge.from.x}
              y1={edge.from.y + NODE_RADIUS}
              x2={edge.to.x}
              y2={edge.to.y - NODE_RADIUS}
              stroke="#dfe6e9"
              strokeWidth={2}
            />
          ))}
          
          {/* Nodes */}
          {layout.positions.map(pos => {
            const isCurrent = pos.id === historyTree.currentNodeId;
            const isRoot = pos.id === historyTree.rootId;
            
            return (
              <g
                key={pos.id}
                onClick={(e) => handleNodeClick(pos.id, e)}
                className="cursor-pointer"
              >
                {/* Node circle */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={NODE_RADIUS}
                  fill={isCurrent ? '#e17055' : '#dfe6e9'}
                  stroke={isCurrent ? '#e17055' : '#b2bec3'}
                  strokeWidth={isCurrent ? 3 : 1}
                />
                
                {/* Current node glow */}
                {isCurrent && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={NODE_RADIUS + 4}
                    fill="none"
                    stroke="#e17055"
                    strokeWidth={2}
                    opacity={0.3}
                  />
                )}
                
                {/* Node label */}
                <text
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={10}
                  fontFamily="monospace"
                  fill={isCurrent ? '#fff' : '#2d3436'}
                  fontWeight={isCurrent ? 'bold' : 'normal'}
                >
                  {isRoot ? '⦿' : pos.node.filledCount}
                </text>
              </g>
            );
          })}
        </svg>
        
        {/* Center button */}
        <button
          onClick={() => {
            if (currentPos && containerRef.current) {
              setOffset({
                x: containerRef.current.clientWidth / 2 - currentPos.x,
                y: containerRef.current.clientHeight / 2 - currentPos.y,
              });
            }
          }}
          className="absolute bottom-2 right-2 w-8 h-8 bg-paper border border-grid/20 rounded-full flex items-center justify-center text-grid/50 hover:text-accent hover:border-accent transition-colors shadow-sm"
          title="Center on current"
        >
          ⦿
        </button>
      </div>
      
      {/* Stats */}
      <div className="text-center text-[10px] text-grid/40">
        {nodeCount} states
        {branchCount > 0 && ` · ${branchCount} branch${branchCount > 1 ? 'es' : ''}`}
        {' · '} Drag to pan · Tap node to restore
        </div>
    </div>
  );
}

export function BottomPanel() {
  const historyTree = useAtomValue(historyTreeAtom);
  const gameState = useAtomValue(gameStateAtom);
  const clearManualLinks = useSetAtom(clearManualLinksAtom);
  const manualLinks = useAtomValue(manualLinksAtom);
  const hintLinks = useAtomValue(linksAtom);
  const hiddenIndices = useAtomValue(hiddenLinkIndicesAtom);
  const toggleLinkVisibility = useSetAtom(toggleLinkVisibilityAtom);
  const panelMode = useAtomValue(panelModeAtom);
  const setPanelMode = useSetAtom(setPanelModeAtom);
  const restoreToNode = useSetAtom(restoreToNodeAtom);

  // Check if a link endpoint is still valid
  const isEndpointValid = (endpoint: { row: number; col: number; candidate: number }) => {
    if (gameState.board.length === 0) return false;
    const cell = gameState.board[endpoint.row]?.[endpoint.col];
    if (!cell || cell.value !== null) return false;
    return cell.notes.has(endpoint.candidate);
  };

  // Get valid links
  const validLinks = useMemo(() => {
    const allLinks = [...hintLinks, ...manualLinks];
    return allLinks.filter(link => 
      isEndpointValid(link.from) && isEndpointValid(link.to)
    );
  }, [hintLinks, manualLinks, gameState.board]);

  const currentNode = historyTree.nodes[historyTree.currentNodeId];
  const rootNode = historyTree.nodes[historyTree.rootId];
  const nodeCount = Object.keys(historyTree.nodes).length;
  const branchCount = Object.values(historyTree.nodes).filter(n => n.childrenIds.length > 1).length;

  // Remove a specific link by index
  const removeLink = useSetAtom(removeLinkAtom);

  const tabs: { id: PanelMode; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      id: 'reason',
      label: 'Reason',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'History',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      badge: branchCount > 0 ? `⑂${branchCount}` : undefined,
    },
  ];

  return (
    <div className="w-full max-w-[min(90vw,400px)] mx-auto mt-4 space-y-3">
      {/* Mode Tabs */}
      <div className="flex bg-highlight/50 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setPanelMode(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg
              text-sm font-medium transition-all duration-150 touch-manipulation
              ${panelMode === tab.id
                ? 'bg-paper text-ink shadow-sm'
                : 'text-grid hover:text-ink'}
            `}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            {tab.badge && (
              <span className={`
                ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold
                ${panelMode === tab.id ? 'bg-accent/20 text-accent' : 'bg-grid/20'}
              `}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="min-h-[80px]">
        {/* Reason Mode - Link Badges */}
        {panelMode === 'reason' && (
          <div className="space-y-3">
            {validLinks.length > 0 ? (
            <div className="space-y-2">
              {/* Link badges */}
              <div className="flex flex-wrap gap-3 justify-center">
                  {validLinks.map((link, idx) => {
                    const isStrong = link.type === 'strong';
                    const isHidden = hiddenIndices.has(idx);
                    return (
                      <div
                        key={idx}
                        className={`
                          relative flex items-center gap-2 px-3 py-2 rounded-xl
                          text-sm font-medium shadow-sm
                          transition-all duration-150
                          ${isHidden 
                            ? 'bg-gray-100 text-gray-400 opacity-50' 
                            : isStrong 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-orange-400 text-white'}
                        `}
                      >
                        {/* Link content */}
                        <button
                          onClick={() => toggleLinkVisibility(idx)}
                          className="touch-manipulation"
                        >
                          <span className={isHidden ? 'line-through' : ''}>
                            {link.from.candidate}
                            <span className="opacity-70 text-xs mx-0.5">R{link.from.row + 1}C{link.from.col + 1}</span>
                            <span className="opacity-50 mx-1">→</span>
                            {link.to.candidate}
                            <span className="opacity-70 text-xs mx-0.5">R{link.to.row + 1}C{link.to.col + 1}</span>
                          </span>
                        </button>
                        
                        {/* Close button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeLink(idx);
                          }}
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-white/30 hover:bg-white/50 transition-colors touch-manipulation"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  {/* Clear All button inline */}
                  {validLinks.length > 1 && (
                    <button
                      onClick={() => clearManualLinks()}
                      className="px-3 py-2 rounded-xl text-sm font-medium bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors touch-manipulation"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-grid/50">
                <p>Swipe up on a candidate to mark links</p>
                <p className="text-xs mt-1 text-grid/40">Strong (━) or Weak (┄)</p>
              </div>
            )}
          </div>
        )}

        {/* History Mode - Draggable Tree */}
        {panelMode === 'history' && rootNode && (
          <DraggableTreeCanvas
            historyTree={historyTree}
            currentNode={currentNode}
            nodeCount={nodeCount}
            branchCount={branchCount}
                onRestore={restoreToNode}
              />
        )}
      </div>
    </div>
  );
}

