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

const WHEEL_WIDTH = 124;
const WHEEL_GAP = 10; // space between button top and wheel bottom

function ScrollWheel({ visible, position, selectedIndex, candidateNum }: ScrollWheelProps) {
  const wheelHeight = ITEM_HEIGHT * VISIBLE_ITEMS;
  const centerOffset = Math.floor(VISIBLE_ITEMS / 2) * ITEM_HEIGHT;

  // position.y is the touch start (~button center); put wheel's bottom edge
  // WHEEL_GAP above the button top (~18px above the touch y).
  const bottomAnchor = position.y - 18 - WHEEL_GAP;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: position.x - WHEEL_WIDTH / 2,
        top: bottomAnchor - wheelHeight,
        width: WHEEL_WIDTH,
        height: wheelHeight,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.35)',
        transformOrigin: '50% calc(100% + 18px)',
        transition:
          'transform 200ms cubic-bezier(0.22, 1.1, 0.36, 1), opacity 140ms ease-out',
        willChange: 'transform, opacity',
      }}
    >
      {/* Wheel body — matches the numberpad palette (bg-paper + sepia border)
          so it reads as a continuation of the button's border rather than a
          floating popover. */}
      <div className="relative w-full h-full bg-paper rounded-xl border border-grid/30 shadow-[0_10px_30px_-8px_rgba(58,47,36,0.4)] overflow-hidden">
        {/* Top/bottom fades in the paper color so items melt into the border */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-paper to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-paper to-transparent z-10 pointer-events-none" />

        {/* Selection highlight */}
        <div
          className="absolute inset-x-2 bg-accent/15 rounded-md border border-accent/40 z-0"
          style={{ top: centerOffset, height: ITEM_HEIGHT }}
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
            const scale = 1 - distance * 0.08;

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
                  transform: `scale(${Math.max(0.82, scale)})`,
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

        {/* Candidate chip — lives inside the wheel's border so it reads as
            part of the same expanded surface. */}
        <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-20 shadow-sm">
          候选 {candidateNum}
        </div>
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
    
    const touch = e.touches[0];
    const dy = touch.clientY - touchStartRef.current.y;
    const dx = touch.clientX - touchStartRef.current.x;
    
    // If the movement is more horizontal than vertical and the wheel
    // hasn't activated yet, release the touch so the browser can scroll
    // the numpad bar instead.
    if (!wheelActivatedRef.current && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      touchStartRef.current = null;
      setSwipingNum(null);
      return; // no preventDefault — let the browser scroll
    }
    
    // Vertical gesture — prevent browser scrolling while we handle the wheel
    e.preventDefault();
    
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
          ? 'ring-2 ring-blue-600 bg-blue-400/50 text-blue-900 font-bold animate-pulse'
          : 'ring-2 ring-orange-600 bg-orange-400/50 text-orange-900 font-bold animate-pulse',
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
      
      {/* Candidate Preview Bar — the entire bar scrolls horizontally as one unit.
          When the mark wheel is visible, horizontal scroll is locked so it
          doesn't interfere with the vertical swipe-to-select gesture. */}
      <div
        className="flex items-center bg-highlight/50 rounded-xl overflow-y-hidden"
        style={{
          overflowX: wheelVisible ? 'hidden' : 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          overscrollBehavior: 'contain',
          touchAction: wheelVisible ? 'none' : 'pan-x',
        }}
        data-scroll-allowed
      >
        {/* Number buttons */}
        <div className="flex-1 py-3 px-2 min-w-0">
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
              {/* Traces to: SPEC-005. data-touch-handled signals the global
                  touchmove listener to leave this element's swipe gesture alone. */}
              <button
                onClick={() => !wheelActivatedRef.current && isClickable && handleNumberClick(num)}
                onTouchStart={(e) => handleTouchStart(num, e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                disabled={!isClickable}
                data-touch-handled
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
