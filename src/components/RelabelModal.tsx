import { useState, useEffect } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { gameStateAtom, relabelPuzzleAtom } from '../store/game';
import {
  createIdentityMapping,
  isIdentityMapping,
  countDigitFrequency,
  generateRandomPermutation,
} from '../lib/sudoku';

interface RelabelModalProps {
  open: boolean;
  onClose: () => void;
}

export function RelabelModal({ open, onClose }: RelabelModalProps) {
  const [mapping, setMapping] = useState<Map<number, number>>(createIdentityMapping);
  const relabelPuzzle = useSetAtom(relabelPuzzleAtom);
  const gameState = useAtomValue(gameStateAtom);

  useEffect(() => {
    if (open) setMapping(createIdentityMapping());
  }, [open]);

  if (!open) return null;

  const freq = countDigitFrequency(gameState.board);

  const cycleTarget = (sourceDigit: number) => {
    const currentTarget = mapping.get(sourceDigit) ?? sourceDigit;
    const usedTargets = new Set<number>();
    for (const [src, tgt] of mapping) {
      if (src !== sourceDigit) usedTargets.add(tgt);
    }
    for (let offset = 1; offset <= 9; offset++) {
      const candidate = ((currentTarget - 1 + offset) % 9) + 1;
      if (!usedTargets.has(candidate)) {
        setMapping(new Map(mapping).set(sourceDigit, candidate));
        return;
      }
    }
  };

  const handleShuffle = () => setMapping(generateRandomPermutation());
  const handleReset = () => setMapping(createIdentityMapping());
  const handleApply = () => {
    relabelPuzzle(mapping);
    onClose();
  };

  const isIdentity = isIdentityMapping(mapping);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-paper rounded-xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-ink">Relabel Numbers</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-2 bg-highlight text-grid rounded-lg active:scale-95 transition-all touch-manipulation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-grid mb-4">
            Remap digits to create an isomorphic puzzle. Each digit must map to a unique target.
          </p>

          <div className="grid grid-cols-9 gap-x-1 gap-y-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
              <div key={`src-${d}`} className="flex flex-col items-center gap-0.5">
                <span className="text-xl font-bold text-ink leading-none">{d}</span>
                <span className="text-[10px] text-grid/60 leading-none">×{freq.get(d) ?? 0}</span>
              </div>
            ))}

            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => (
              <div key={`arrow-${d}`} className="flex items-center justify-center text-grid/40 text-sm leading-none">
                ↓
              </div>
            ))}

            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(d => {
              const target = mapping.get(d) ?? d;
              const isChanged = target !== d;
              return (
                <button
                  key={`tgt-${d}`}
                  onClick={() => cycleTarget(d)}
                  className={`h-10 rounded-lg text-lg font-bold touch-manipulation active:scale-95 transition-all ${
                    isChanged
                      ? 'bg-accent/20 text-accent ring-1 ring-accent/30'
                      : 'bg-highlight text-grid'
                  }`}
                >
                  {target}
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={handleReset}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-grid/20 text-grid hover:bg-highlight touch-manipulation"
            >
              Reset to identity
            </button>
            <button
              onClick={handleShuffle}
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-grid/20 text-grid hover:bg-highlight touch-manipulation"
            >
              Shuffle
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm rounded-lg border border-grid/20 text-grid hover:bg-highlight"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isIdentity}
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-accent text-white font-medium hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
