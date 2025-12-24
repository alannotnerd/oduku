import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { 
  difficultyAtom, 
  newGameAtom, 
  gameStateAtom,
  type Difficulty,
} from '../store/game';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master'];

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
  master: 'Master',
};

export function Header() {
  const [difficulty, setDifficulty] = useAtom(difficultyAtom);
  const newGame = useSetAtom(newGameAtom);
  const gameState = useAtomValue(gameStateAtom);
  const [elapsed, setElapsed] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (gameState.isComplete || gameState.board.length === 0) return;
    
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - gameState.startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.startTime, gameState.isComplete, gameState.board.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDifficultyChange = (d: Difficulty) => {
    setDifficulty(d);
    setShowMenu(false);
  };

  return (
    <header className="w-full max-w-[min(90vw,400px)] mx-auto py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-ink tracking-tight">
            Sudoku
          </h1>
          {/* Difficulty Score Badge */}
          {gameState.difficultyScore > 0 && (
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="px-2 py-0.5 text-xs font-mono bg-accent/10 text-accent rounded-full touch-manipulation"
              title="Difficulty score based on solving techniques"
            >
              ★{Math.round(gameState.difficultyScore)}
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="font-mono text-lg text-grid tabular-nums">
            {formatTime(elapsed)}
          </div>
          
          {/* Difficulty selector */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-1 px-3 py-1.5 bg-highlight rounded-lg text-sm font-medium text-grid touch-manipulation"
            >
              {difficultyLabels[difficulty] || 'Medium'}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-paper border border-grid/20 rounded-lg shadow-lg overflow-hidden z-20">
                  {DIFFICULTIES.map(d => (
                    <button
                      key={d}
                      onClick={() => handleDifficultyChange(d)}
                      className={`
                        block w-full px-4 py-2 text-left text-sm
                        ${d === difficulty ? 'bg-accent text-white' : 'hover:bg-highlight'}
                      `}
                    >
                      {difficultyLabels[d]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* New game button */}
          <button
            onClick={() => newGame()}
            className="p-2 bg-accent text-white rounded-lg shadow-md hover:bg-accent-light active:scale-95 transition-all touch-manipulation"
            aria-label="New Game"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Strategy Info Panel */}
      {showInfo && gameState.strategies.length > 0 && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowInfo(false)}
          />
          <div className="mt-2 p-3 bg-highlight/80 backdrop-blur rounded-lg text-sm relative z-20">
            <div className="font-medium text-grid mb-2">Techniques Required:</div>
            <div className="flex flex-wrap gap-1">
              {gameState.strategies.map(s => (
                <span 
                  key={s.title}
                  className="px-2 py-0.5 bg-paper rounded text-xs text-grid/80"
                >
                  {s.title} ×{s.freq}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
