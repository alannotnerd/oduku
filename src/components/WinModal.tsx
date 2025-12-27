import { useAtomValue, useSetAtom } from 'jotai';
import { useState } from 'react';
import { gameStateAtom, newGameAtom, difficultyAtom } from '../store/game';

const difficultyLabels: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
  master: 'Master',
};

export function WinModal() {
  const gameState = useAtomValue(gameStateAtom);
  const newGame = useSetAtom(newGameAtom);
  const difficulty = useAtomValue(difficultyAtom);
  const [dismissed, setDismissed] = useState(false);

  // Reset dismissed state when a new game starts
  if (!gameState.isComplete && dismissed) {
    setDismissed(false);
  }

  // Don't show if not complete or if user dismissed
  if (!gameState.isComplete || dismissed) return null;

  const elapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="bg-paper rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-in zoom-in-95 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="win-title"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 id="win-title" className="text-2xl font-bold text-ink mb-2">
          Congratulations!
        </h2>
        <p className="text-grid mb-6">
          Completed on <span className="font-semibold text-accent">{difficultyLabels[difficulty]}</span>
          <br />
          Time: <span className="font-mono font-semibold">{mins}m {secs}s</span>
          <br />
          Moves: <span className="font-semibold">{gameState.moveCount}</span>
        </p>
        
        <div className="space-y-3">
        <button
          onClick={() => newGame()}
          className="w-full py-3 bg-accent text-white font-semibold rounded-xl shadow-lg hover:bg-accent-light active:scale-95 transition-all touch-manipulation"
        >
          New Game
        </button>
          
          <button
            onClick={() => setDismissed(true)}
            className="w-full py-2.5 bg-highlight text-grid font-medium rounded-xl hover:bg-grid/10 active:scale-95 transition-all touch-manipulation"
          >
            Review Solution
          </button>
        </div>
      </div>
    </div>
  );
}

