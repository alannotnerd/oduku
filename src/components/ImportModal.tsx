import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { importPuzzleAtom } from '../store/game';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportModal({ open, onClose }: ImportModalProps) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const importPuzzle = useSetAtom(importPuzzleAtom);

  if (!open) return null;

  const handleImport = () => {
    setError('');
    const result = importPuzzle(input);
    if (result) {
      setInput('');
      onClose();
    } else {
      setError('Invalid puzzle. Check the format: 81 digits (1-9 for clues, 0 or . for empty), with a unique solution.');
    }
  };

  const handleClose = () => {
    setInput('');
    setError('');
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-paper rounded-xl shadow-xl w-full max-w-sm p-5" onClick={e => e.stopPropagation()}>
          <h2 className="text-lg font-bold text-ink mb-3">Import Puzzle</h2>
          <p className="text-sm text-grid mb-3">
            Paste an 81-character string. Use 1-9 for clues, 0 or . for empty cells.
          </p>
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); setError(''); }}
            placeholder="530070000600195000098000060..."
            className="w-full h-28 p-3 border border-grid/20 rounded-lg text-sm font-mono bg-highlight resize-none focus:outline-none focus:ring-2 focus:ring-accent/40"
            autoFocus
          />
          {error && (
            <p className="text-xs text-red-500 mt-2">{error}</p>
          )}
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm rounded-lg border border-grid/20 text-grid hover:bg-highlight"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={input.replace(/\s/g, '').length !== 81}
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-accent text-white font-medium hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
