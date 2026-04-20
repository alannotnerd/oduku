import { Cell } from './Cell';
import { LinkOverlay } from './LinkOverlay';

export function Board() {
  return (
    <div className="w-full max-w-[min(90vw,400px)] mx-auto">
      <div className="relative">
        <div
          className="grid grid-cols-3 grid-rows-3 gap-[2px] bg-grid border-2 border-grid rounded-lg overflow-hidden shadow-lg"
          role="grid"
          aria-label="Sudoku board"
        >
          {Array.from({ length: 3 }, (_, boxRow) =>
            Array.from({ length: 3 }, (_, boxCol) => (
              <div
                key={`box-${boxRow}-${boxCol}`}
                className="grid grid-cols-3 grid-rows-3 gap-px bg-grid/30"
              >
                {Array.from({ length: 3 }, (_, cr) =>
                  Array.from({ length: 3 }, (_, cc) => {
                    const row = boxRow * 3 + cr;
                    const col = boxCol * 3 + cc;
                    return <Cell key={`${row}-${col}`} row={row} col={col} />;
                  })
                )}
              </div>
            ))
          )}
        </div>
        <LinkOverlay />
      </div>
    </div>
  );
}

