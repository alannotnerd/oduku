import { Cell } from './Cell';
import { LinkOverlay } from './LinkOverlay';

export function Board() {
  return (
    <div className="w-full max-w-[min(90vw,400px)] mx-auto">
      <div className="relative">
        <div 
          className="grid grid-cols-9 border-2 border-grid bg-grid/10 rounded-lg overflow-hidden shadow-lg"
          role="grid"
          aria-label="Sudoku board"
        >
          {Array.from({ length: 9 }, (_, row) =>
            Array.from({ length: 9 }, (_, col) => (
              <Cell key={`${row}-${col}`} row={row} col={col} />
            ))
          )}
        </div>
        <LinkOverlay />
      </div>
    </div>
  );
}

