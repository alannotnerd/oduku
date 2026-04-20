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

  const handleCellClick = () => {
    setSelected([row, col]);
  };

  // State wash lives on a child overlay, not the button. The board's grid
  // lines are drawn via gaps over a sepia `bg-grid` backing, so any low-alpha
  // background on the button itself composites against sepia — not ivory —
  // making every "subtle" state read as a dark sepia block. Keeping the
  // button solid `bg-paper` and painting the state on an absolute child
  // composites the alpha against paper, which is what the opacity numbers
  // actually look like.
  const overlayClass = cell.isConflict
    ? 'bg-conflict/25 ring-[1.5px] ring-conflict/80 ring-inset'
    : isSelected
      ? 'bg-accent/25 ring-[1.5px] ring-accent/70 ring-inset'
      : isSameValue
        ? 'bg-accent-light/40'
        : isRelated
          ? 'bg-ink/[0.04]'
          : '';

  return (
    <button
      onClick={handleCellClick}
      data-row={row}
      data-col={col}
      className={`
        relative aspect-square w-full bg-paper
        flex items-center justify-center
        text-lg sm:text-xl md:text-2xl font-medium
        outline-none focus:outline-none
        active:scale-95 touch-manipulation
        ${(isSelected || cell.isConflict) ? 'z-10' : ''}
        ${cell.isFixed ? 'text-fixed font-semibold' : 'text-user'}
      `}
      aria-label={`Cell ${row + 1}, ${col + 1}${cell.value ? `, value ${cell.value}` : ', empty'}`}
    >
      {overlayClass && (
        <span
          aria-hidden
          className={`absolute inset-0 pointer-events-none transition-colors duration-100 ${overlayClass}`}
        />
      )}
      {cell.value !== null ? (
        <span className={`relative z-10 ${cell.isConflict ? 'text-conflict' : ''}`}>
          {cell.value}
        </span>
      ) : (
        <div className="relative z-10 grid grid-cols-3 grid-rows-3 w-full h-full p-0.5">
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
                ? 'ring-2 ring-blue-600 bg-blue-400/50 text-blue-900 font-bold animate-pulse'
                : 'ring-2 ring-orange-600 bg-orange-400/50 text-orange-900 font-bold animate-pulse';
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
