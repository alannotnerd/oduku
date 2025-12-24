import { useAtom, useAtomValue } from 'jotai';
import { 
  selectedCellAtom, 
  gameStateAtom, 
  candidateMarksAtom,
  pendingLinkMarkAtom,
  markKey,
} from '../store/game';

interface CellProps {
  row: number;
  col: number;
}

export function Cell({ row, col }: CellProps) {
  const [selected, setSelected] = useAtom(selectedCellAtom);
  const gameState = useAtomValue(gameStateAtom);
  const candidateMarks = useAtomValue(candidateMarksAtom);
  const pendingLinkMark = useAtomValue(pendingLinkMarkAtom);
  
  if (gameState.board.length === 0) return null;
  
  const cell = gameState.board[row][col];
  const isSelected = selected?.[0] === row && selected?.[1] === col;
  const isRelated = selected && (
    selected[0] === row || 
    selected[1] === col ||
    (Math.floor(selected[0] / 3) === Math.floor(row / 3) && 
     Math.floor(selected[1] / 3) === Math.floor(col / 3))
  );
  
  // Get the selected cell's value (for highlighting)
  const selectedValue = selected ? gameState.board[selected[0]][selected[1]].value : null;
  
  const isSameValue = selected && 
    cell.value !== null && 
    selectedValue === cell.value;

  // Border logic for 3x3 boxes
  const borderRight = col % 3 === 2 && col !== 8;
  const borderBottom = row % 3 === 2 && row !== 8;

  const handleCellClick = () => {
    setSelected([row, col]);
  };

  return (
    <button
      onClick={handleCellClick}
      className={`
        relative aspect-square w-full
        flex items-center justify-center
        text-lg sm:text-xl md:text-2xl font-medium
        transition-colors duration-100
        outline-none focus:outline-none
        active:scale-95 touch-manipulation
        ${borderRight ? 'border-r-2 border-r-grid' : 'border-r border-r-grid/30'}
        ${borderBottom ? 'border-b-2 border-b-grid' : 'border-b border-b-grid/30'}
        ${isSelected 
          ? 'bg-selected/60 z-10' 
          : isSameValue 
            ? 'bg-same-value/50' 
            : isRelated 
              ? 'bg-highlight/50' 
              : 'bg-paper'}
        ${cell.isConflict ? 'bg-conflict/40' : ''}
        ${cell.isFixed ? 'text-fixed font-semibold' : 'text-user'}
      `}
      aria-label={`Cell ${row + 1}, ${col + 1}${cell.value ? `, value ${cell.value}` : ', empty'}`}
    >
      {cell.value !== null ? (
        <span className={cell.isConflict ? 'text-conflict' : ''}>
          {cell.value}
        </span>
      ) : (
        <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => {
            const hasNote = cell.notes.has(n);
            const isHighlighted = hasNote && selectedValue === n;
            
            // Check if this is the pending link mark source
            const isPendingLinkSource = hasNote && pendingLinkMark && 
              pendingLinkMark.row === row && 
              pendingLinkMark.col === col && 
              pendingLinkMark.candidate === n;
            
            // Get color mark for this candidate
            const colorMark = candidateMarks.get(markKey(row, col, n));
            let markStyle = '';
            if (hasNote && colorMark && colorMark !== 'none') {
              switch (colorMark) {
                case 'red': markStyle = 'bg-red-300 text-red-900'; break;
                case 'green': markStyle = 'bg-green-300 text-green-900'; break;
                case 'blue': markStyle = 'bg-blue-300 text-blue-900'; break;
                case 'yellow': markStyle = 'bg-yellow-200 text-yellow-900'; break;
              }
            }
            
            // Pending link source styling (stronger highlight)
            let pendingLinkStyle = '';
            if (isPendingLinkSource) {
              pendingLinkStyle = pendingLinkMark.type === 'strong' 
                ? 'ring-2 ring-blue-500 bg-blue-100 animate-pulse' 
                : 'ring-2 ring-orange-400 bg-orange-100 animate-pulse';
            }
            
            return (
              <span 
                key={n}
                className={`
                  text-[8px] sm:text-[10px] flex items-center justify-center rounded-sm relative
                  ${isPendingLinkSource
                    ? pendingLinkStyle
                    : isHighlighted 
                      ? 'bg-accent/25 text-accent font-bold' 
                      : markStyle || 'text-notes'}
                `}
              >
                {hasNote ? n : '\u00A0'}
                {/* Pending link indicator */}
                {isPendingLinkSource && (
                  <span className="absolute -top-1 -right-1 text-[6px] bg-white rounded px-0.5 shadow border">
                    →?
                  </span>
                )}
              </span>
            );
          })}
        </div>
      )}
    </button>
  );
}
