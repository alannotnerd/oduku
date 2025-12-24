import { useAtomValue, useSetAtom } from 'jotai';
import { currentHintAtom, applyHintAtom, closeHintAtom } from '../store/game';

export function HintPanel() {
  const hint = useAtomValue(currentHintAtom);
  const applyHint = useSetAtom(applyHintAtom);
  const closeHint = useSetAtom(closeHintAtom);

  if (!hint) return null;

  // Check if we have a value to place
  const hasValueToPlace = hint.affectedCells.some(c => c.value !== undefined);
  const firstCell = hint.affectedCells[0];

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4">
      <div 
        className="bg-paper rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hint-title"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b bg-accent/10 border-accent/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <h2 id="hint-title" className="font-semibold text-accent">
                {hint.technique}
              </h2>
            </div>
          </div>
          <p className="text-sm mt-1 text-grid/80">{hint.description}</p>
        </div>

        {/* Explanation */}
        <div className="px-4 py-4">
          <p className="text-sm text-grid leading-relaxed">
            {hint.explanation}
          </p>

          {/* Action preview */}
          {hasValueToPlace && firstCell && firstCell.value !== undefined && (
            <div className="mt-4 p-3 bg-highlight/50 rounded-lg">
              <div className="text-xs text-grid/70 mb-1">Suggested Action:</div>
              <div className="font-mono text-lg font-semibold text-accent">
                R{firstCell.row + 1}C{firstCell.col + 1} = {firstCell.value}
              </div>
            </div>
          )}

          {/* Elimination preview */}
          {!hasValueToPlace && firstCell && firstCell.eliminated && firstCell.eliminated.length > 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-xs text-orange-700 mb-1">Eliminate candidates:</div>
              <div className="text-sm text-orange-800">
                {hint.affectedCells.map((cell, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    R{cell.row + 1}C{cell.col + 1}: {cell.eliminated?.join(', ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-highlight/30 flex gap-2">
          <button
            onClick={() => closeHint()}
            className="flex-1 py-2.5 px-4 rounded-xl font-medium text-grid bg-paper border border-grid/20 hover:bg-highlight transition-colors touch-manipulation"
          >
            Got it
          </button>
          {hasValueToPlace && (
            <button
              onClick={() => applyHint()}
              className="flex-1 py-2.5 px-4 rounded-xl font-medium text-white bg-accent hover:bg-accent-light transition-colors touch-manipulation"
            >
              Apply
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
