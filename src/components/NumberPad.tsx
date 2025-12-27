import { useSetAtom, useAtomValue } from 'jotai';
import { useState, useRef, useCallback } from 'react';
import { 
  selectedCellAtom, 
  gameStateAtom, 
  toggleNoteAtom,
  setCandidateColorMarkAtom,
  setCandidateLinkMarkAtom,
  candidateMarksAtom,
  pendingLinkMarkAtom,
  markKey,
  type CandidateMark,
} from '../store/game';

// Scroll wheel options (vertical list)
interface WheelOption {
  mark: CandidateMark;
  color: string;
  bgColor: string;
  label: string;
  isLink: boolean; // true for strong/weak links
}

const WHEEL_OPTIONS: WheelOption[] = [
  { mark: 'none', color: 'text-gray-400', bgColor: 'bg-gray-100', label: '清除', isLink: false },
  { mark: 'strong', color: 'text-blue-600', bgColor: 'bg-blue-100', label: '强链', isLink: true },
  { mark: 'weak', color: 'text-orange-500', bgColor: 'bg-orange-100', label: '弱链', isLink: true },
  { mark: 'red', color: 'text-red-600', bgColor: 'bg-red-200', label: '红色', isLink: false },
  { mark: 'green', color: 'text-green-600', bgColor: 'bg-green-200', label: '绿色', isLink: false },
  { mark: 'blue', color: 'text-blue-500', bgColor: 'bg-blue-200', label: '蓝色', isLink: false },
  { mark: 'yellow', color: 'text-yellow-600', bgColor: 'bg-yellow-200', label: '黄色', isLink: false },
];

const ITEM_HEIGHT = 36;
const VISIBLE_ITEMS = 5;

interface ScrollWheelProps {
  visible: boolean;
  position: { x: number; y: number };
  selectedIndex: number;
  candidateNum: number;
}

function ScrollWheel({ visible, position, selectedIndex, candidateNum }: ScrollWheelProps) {
  if (!visible) return null;
  
  const wheelHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
  const centerOffset = Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT;
  
  return (
    <div 
      className="fixed z-50 pointer-events-none"
      style={{ 
        left: position.x - 50, 
        top: position.y - wheelHeight - 20,
      }}
    >
      {/* Wheel container */}
      <div 
        className="relative bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-grid/20 overflow-hidden"
        style={{ width: 100, height: wheelHeight }}
      >
        {/* Gradient overlays for 3D effect */}
        <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
        
        {/* Selection highlight */}
        <div 
          className="absolute inset-x-1 bg-accent/20 rounded-lg border border-accent/30 z-0"
          style={{ 
            top: centerOffset,
            height: ITEM_HEIGHT,
          }}
        />
        
        {/* Scrolling items */}
        <div 
          className="absolute inset-x-0 transition-transform duration-75 ease-out"
          style={{ 
            transform: `translateY(${centerOffset - selectedIndex * ITEM_HEIGHT}px)`,
          }}
        >
          {WHEEL_OPTIONS.map((option, index) => {
            const isSelected = index === selectedIndex;
            const distance = Math.abs(index - selectedIndex);
            const opacity = 1 - distance * 0.25;
            const scale = 1 - distance * 0.1;
            
            return (
              <div
                key={option.mark}
                className={`
                  flex items-center justify-center gap-2
                  transition-all duration-75
                  ${isSelected ? 'font-bold' : 'font-medium'}
                  ${option.color}
                `}
                style={{
                  height: ITEM_HEIGHT,
                  opacity: Math.max(0.3, opacity),
                  transform: `scale(${Math.max(0.8, scale)})`,
                }}
              >
                <span 
                  className={`w-5 h-5 rounded-full ${option.bgColor} flex items-center justify-center text-xs`}
                >
                  {option.mark === 'strong' ? '━' : option.mark === 'weak' ? '┄' : option.mark === 'none' ? '✕' : '●'}
                </span>
                <span className="text-sm">{option.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Arrow pointing to button */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-grid/20 rotate-45"
        style={{ bottom: -6 }}
      />
      
      {/* Candidate number indicator */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-2 py-1 rounded-full">
        {candidateNum}
      </div>
    </div>
  );
}

export function NumberPad() {
  const selected = useAtomValue(selectedCellAtom);
  const gameState = useAtomValue(gameStateAtom);
  const toggleNote = useSetAtom(toggleNoteAtom);
  const setCandidateColorMark = useSetAtom(setCandidateColorMarkAtom);
  const setCandidateLinkMark = useSetAtom(setCandidateLinkMarkAtom);
  const candidateMarks = useAtomValue(candidateMarksAtom);
  const pendingLinkMark = useAtomValue(pendingLinkMarkAtom);

  // Swipe gesture state
  const [wheelVisible, setWheelVisible] = useState(false);
  const [wheelPosition, setWheelPosition] = useState({ x: 0, y: 0 });
  const [selectedWheelIndex, setSelectedWheelIndex] = useState(0);
  const [swipingNum, setSwipingNum] = useState<number | null>(null);
  
  const touchStartRef = useRef<{ x: number; y: number; num: number } | null>(null);
  const wheelActivatedRef = useRef(false);
  const initialIndexRef = useRef(0);

  // Get selected cell data
  const selectedCell = selected && gameState.board.length > 0 
    ? gameState.board[selected[0]][selected[1]] 
    : null;

  // Determine if we should show the candidate bar
  const showCandidates = selected && selectedCell && !selectedCell.isFixed;
  const cellHasValue = selectedCell?.value !== null;

  const handleNumberClick = (num: number) => {
    if (!selected || !selectedCell) return;
    
    // Toggle note (same behavior in all modes)
    if (!cellHasValue) {
      toggleNote(num);
    }
  };

  // Get current mark index for a candidate
  const getCurrentMarkIndex = useCallback((num: number): number => {
    if (!selected) return 0;
    const key = markKey(selected[0], selected[1], num);
    const mark = candidateMarks.get(key);
    if (!mark) return 0;
    const index = WHEEL_OPTIONS.findIndex(o => o.mark === mark);
    return index >= 0 ? index : 0;
  }, [selected, candidateMarks]);

  // Touch handlers for swipe gesture
  const handleTouchStart = useCallback((num: number, e: React.TouchEvent) => {
    if (!selected || cellHasValue) return;
    if (!selectedCell?.notes.has(num)) return; // Only for candidates
    
    // Prevent scrolling from the start
    e.preventDefault();
    
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, num };
    wheelActivatedRef.current = false;
    initialIndexRef.current = getCurrentMarkIndex(num);
    setSwipingNum(num);
  }, [selected, cellHasValue, selectedCell, getCurrentMarkIndex]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !selected) return;
    
    // Always prevent scrolling when we have a touch start
    e.preventDefault();
    
    const touch = e.touches[0];
    const dy = touch.clientY - touchStartRef.current.y;
    
    // Activate wheel when dragged up enough
    if (dy < -25 && !wheelActivatedRef.current) {
      wheelActivatedRef.current = true;
      setWheelVisible(true);
      setWheelPosition({ x: touchStartRef.current.x, y: touchStartRef.current.y });
      setSelectedWheelIndex(initialIndexRef.current);
    }
    
    if (wheelActivatedRef.current) {
      
      // Calculate selected index based on vertical movement
      // Moving up = positive index change, moving down = negative
      const offsetFromStart = -(dy + 25); // Start counting after activation threshold
      const indexOffset = Math.round(offsetFromStart / 30); // 30px per item
      const newIndex = Math.max(0, Math.min(WHEEL_OPTIONS.length - 1, initialIndexRef.current + indexOffset));
      setSelectedWheelIndex(newIndex);
    }
  }, [selected]);

  const handleTouchEnd = useCallback(() => {
    if (wheelActivatedRef.current && touchStartRef.current && selected) {
      const option = WHEEL_OPTIONS[selectedWheelIndex];
      if (option) {
        if (option.isLink && (option.mark === 'strong' || option.mark === 'weak')) {
          // Link mark - will create pair or set pending
          setCandidateLinkMark({
            row: selected[0],
            col: selected[1],
            candidate: touchStartRef.current.num,
            type: option.mark,
          });
        } else {
          // Color mark
          setCandidateColorMark({
            row: selected[0],
            col: selected[1],
            candidate: touchStartRef.current.num,
            mark: option.mark as 'none' | 'red' | 'green' | 'blue' | 'yellow',
          });
        }
      }
    }
    
    // Reset state
    touchStartRef.current = null;
    wheelActivatedRef.current = false;
    setWheelVisible(false);
    setSelectedWheelIndex(0);
    setSwipingNum(null);
  }, [selectedWheelIndex, selected, setCandidateColorMark, setCandidateLinkMark]);

  // Don't show if no cell selected or cell is fixed
  if (!showCandidates) {
    return (
      <div className="w-full max-w-[min(90vw,400px)] mx-auto mt-4">
        <div className="flex items-center justify-center h-14 text-sm text-grid/40 bg-highlight/30 rounded-xl">
          Select a cell to play
        </div>
      </div>
    );
  }

  // Check if this candidate is the pending link source
  const isPendingLinkSource = (num: number): { isPending: boolean; type: 'strong' | 'weak' | null } => {
    if (!selected || !pendingLinkMark) return { isPending: false, type: null };
    if (pendingLinkMark.row === selected[0] && 
        pendingLinkMark.col === selected[1] && 
        pendingLinkMark.candidate === num) {
      return { isPending: true, type: pendingLinkMark.type };
    }
    return { isPending: false, type: null };
  };
  
  // Get color mark style for a candidate button
  const getMarkStyle = (num: number): { style: string; indicator: string | null } => {
    if (!selected) return { style: '', indicator: null };
    
    // Check pending link mark first
    const { isPending, type } = isPendingLinkSource(num);
    if (isPending && type) {
      return { 
        style: type === 'strong' 
          ? 'ring-2 ring-blue-500 bg-blue-100 animate-pulse' 
          : 'ring-2 ring-orange-400 bg-orange-100 animate-pulse',
        indicator: '→?' 
      };
    }
    
    // Check color mark
    const key = markKey(selected[0], selected[1], num);
    const colorMark = candidateMarks.get(key);
    if (!colorMark || colorMark === 'none') return { style: '', indicator: null };
    
    switch (colorMark) {
      case 'red': 
        return { style: 'bg-red-400 text-white border-red-500', indicator: null };
      case 'green': 
        return { style: 'bg-green-400 text-white border-green-500', indicator: null };
      case 'blue': 
        return { style: 'bg-blue-400 text-white border-blue-500', indicator: null };
      case 'yellow': 
        return { style: 'bg-yellow-300 text-yellow-900 border-yellow-500', indicator: null };
      default: 
        return { style: '', indicator: null };
    }
  };

  return (
    <div className="w-full max-w-[min(90vw,400px)] mx-auto mt-4">
      {/* Scroll Wheel */}
      <ScrollWheel
        visible={wheelVisible}
        position={wheelPosition}
        selectedIndex={selectedWheelIndex}
        candidateNum={swipingNum || 0}
      />
      
      {/* Candidate Preview Bar - fixed label + scrollable numbers */}
      <div className="flex items-center bg-highlight/50 rounded-xl overflow-hidden">
        {/* Cell info - fixed */}
        <div className="flex items-center justify-center px-3 py-3 min-w-[48px] shrink-0 border-r border-grid/10">
          {cellHasValue ? (
            <span className="text-lg font-bold text-accent">
              {selectedCell.value}
            </span>
          ) : (
            <span className="text-[10px] text-grid/50 font-mono whitespace-nowrap">
              R{selected[0] + 1}C{selected[1] + 1}
            </span>
          )}
        </div>

        {/* Number buttons - scrollable on small screens */}
        <div 
          className="flex-1 overflow-x-auto py-3 px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex items-center justify-start gap-1.5 min-w-max">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
          const hasNote = !cellHasValue && selectedCell.notes.has(num);
          const isSwiping = swipingNum === num;
          const { style: markStyle, indicator: markIndicator } = getMarkStyle(num);

          // Determine button style based on state (unified for all modes)
          let buttonStyle = '';
          let isClickable = true;

          if (cellHasValue) {
            // Cell already has a value - disabled
            buttonStyle = 'bg-grid/5 text-grid/20 cursor-not-allowed';
            isClickable = false;
          } else if (hasNote) {
            // Has candidate - show as active
            buttonStyle = markStyle || 'bg-accent text-white shadow-md hover:bg-accent-light hover:shadow-lg';
          } else {
            // No candidate - show as inactive
            buttonStyle = 'bg-paper text-grid/40 border border-grid/10 hover:bg-green-50 hover:text-green-600 hover:border-green-300';
          }

          return (
                <div key={num} className="relative shrink-0">
              <button
                onClick={() => !wheelActivatedRef.current && isClickable && handleNumberClick(num)}
                onTouchStart={(e) => handleTouchStart(num, e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                disabled={!isClickable}
                className={`
                  w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center
                  text-base sm:text-lg font-medium rounded-lg
                  transition-all duration-100 touch-manipulation select-none
                  ${buttonStyle}
                  ${isSwiping ? 'scale-110 shadow-lg' : ''}
                `}
                title={hasNote ? 'Swipe up to mark' : 'Add candidate'}
              >
                {num}
              </button>
              {/* Mark indicator */}
              {markIndicator && hasNote && (
                <span className="absolute -top-1 -right-1 text-[8px] bg-white rounded-full w-3 h-3 flex items-center justify-center shadow border">
                  {markIndicator}
                </span>
              )}
            </div>
          );
        })}
          </div>
        </div>
      </div>
    </div>
  );
}
