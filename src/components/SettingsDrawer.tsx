/*
 * Settings drawer — right-edge panel housing secondary / infrequent actions.
 *
 * Traces to:
 *   SPEC-012 (drawer behavior, contents, accessibility, close triggers)
 *   SPEC-011 (hamburger in Header.tsx is the only open-path)
 *   SPEC-005 (drawer root carries data-touch-handled so the global
 *             touchmove listener does not preempt taps inside it)
 *   SPEC-007 (drawer's scrollable content wrapper carries
 *             data-scroll-allowed + .scroll-allowed for defensive internal
 *             scrolling)
 */

import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import {
  difficultyAtom,
  gameStateAtom,
  newGameAtom,
  relabelPuzzleAtom,
  type Difficulty,
} from '../store/game';
import { gameBoardToPuzzleString } from '../lib/sudoku';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'expert', 'master'];

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
  master: 'Master',
};

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  onOpenImport: () => void;
  onOpenRelabel?: () => void;
}

export function SettingsDrawer({ open, onClose, onOpenImport, onOpenRelabel }: SettingsDrawerProps) {
  // Traces to: SPEC-012. read-only for puzzle details; write for difficulty.
  const [difficulty, setDifficulty] = useAtom(difficultyAtom);
  const newGame = useSetAtom(newGameAtom);
  const relabelPuzzle = useSetAtom(relabelPuzzleAtom);
  const gameState = useAtomValue(gameStateAtom);

  const hasPuzzle = gameState.board.length > 0 && gameState.difficultyScore > 0;
  const [copied, setCopied] = useState(false);

  // Traces to: SPEC-012 — Escape closes the drawer when open.
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Traces to: SPEC-012. When closed, render nothing — no off-screen DOM.
  if (!open) return null;

  // Picking a difficulty writes the atom, immediately generates a new puzzle,
  // and closes the drawer. This replaces the standalone refresh button — any
  // difficulty tap (including the currently-selected one) starts a fresh game.
  const handleDifficultyPick = (d: Difficulty) => {
    setDifficulty(d);
    newGame();
    onClose();
  };

  // Traces to: SPEC-012. Import flow: close the drawer, then open the modal
  // (the parent owns modal state). Avoids stacked overlays.
  const handleImport = () => {
    onClose();
    onOpenImport();
  };

  const handleRelabel = () => {
    relabelPuzzle();
    onClose();
  };

  const handleCustomRelabel = () => {
    onClose();
    onOpenRelabel?.();
  };

  const handleCopyPuzzle = async () => {
    const code = gameBoardToPuzzleString(gameState.board);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers / non-HTTPS
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Traces to: SPEC-012. Scrim covers the viewport; tap closes.
          z-40 mirrors the existing ImportModal scrim stacking. */}
      <div
        className="fixed inset-0 bg-ink/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Traces to: SPEC-012. Panel — right-edge, 85vw capped at 320px.
          data-touch-handled so global listener (SPEC-005) lets taps through.
          role/aria-modal/aria-label per SPEC-012 Accessibility. */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        data-touch-handled
        className="fixed top-0 right-0 h-full w-[min(85vw,320px)] bg-paper shadow-xl z-50 flex flex-col transition-transform duration-200 ease-out translate-x-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Traces to: SPEC-012. Drawer header row with title + close button. */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-grid/20">
          <h2 className="text-lg font-bold text-ink">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-2 bg-highlight text-grid rounded-lg active:scale-95 transition-all touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Traces to: SPEC-012, SPEC-007. Scrollable content wrapper. */}
        <div
          data-scroll-allowed
          className="scroll-allowed flex-1 px-4 py-4 flex flex-col gap-6"
        >
          {/* Traces to: SPEC-012. Difficulty section. */}
          <section>
            <h3 className="text-sm font-medium text-grid/80 mb-2">Difficulty</h3>
            <div className="flex flex-col gap-1">
              {DIFFICULTIES.map((d) => {
                const isCurrent = d === difficulty;
                return (
                  <button
                    key={d}
                    onClick={() => handleDifficultyPick(d)}
                    aria-pressed={isCurrent}
                    className={
                      isCurrent
                        ? 'w-full text-left px-3 py-2 rounded-lg text-sm font-medium bg-accent text-white touch-manipulation'
                        : 'w-full text-left px-3 py-2 rounded-lg text-sm font-medium bg-highlight text-grid hover:bg-grid/10 touch-manipulation'
                    }
                  >
                    {difficultyLabels[d]}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-grid/50 mt-2">Tap a difficulty to start a new game</p>
          </section>

          {/* Traces to: SPEC-012. Puzzle section — import + copy. */}
          <section>
            <h3 className="text-sm font-medium text-grid/80 mb-2">Puzzle</h3>
            <div className="flex flex-col gap-1">
              <button
                onClick={handleImport}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-highlight text-grid hover:bg-grid/10 touch-manipulation"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import puzzle…
              </button>
              {hasPuzzle && (
                <button
                  onClick={handleCopyPuzzle}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-highlight text-grid hover:bg-grid/10 touch-manipulation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copied ? 'Copied!' : 'Copy puzzle code'}
                </button>
              )}
              {hasPuzzle && (
                <button
                  onClick={handleCustomRelabel}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-highlight text-grid hover:bg-grid/10 touch-manipulation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Custom relabel…
                </button>
              )}
              {hasPuzzle && (
                <button
                  onClick={handleRelabel}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-highlight text-grid hover:bg-grid/10 touch-manipulation"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Random relabel
                </button>
              )}
            </div>
          </section>

          {/* Traces to: SPEC-012. Puzzle details — score + techniques. */}
          <section>
            <h3 className="text-sm font-medium text-grid/80 mb-2">Puzzle details</h3>
            {!hasPuzzle ? (
              <p className="text-xs text-grid/50">
                Puzzle details will appear once a game is loaded.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="text-sm text-grid font-mono">
                  Difficulty score: ★{Math.round(gameState.difficultyScore)}
                </div>
                {gameState.strategies.length > 0 ? (
                  <div>
                    <div className="text-xs text-grid/80 mb-1">Techniques required:</div>
                    <div className="flex flex-wrap gap-1">
                      {gameState.strategies.map((s) => (
                        <span
                          key={s.title}
                          className="px-2 py-0.5 bg-highlight rounded text-xs text-grid/80"
                        >
                          {s.title} ×{s.freq}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-grid/50">
                    No technique breakdown available for this puzzle.
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Traces to: SPEC-012. About footer. */}
        <div className="px-4 py-3 border-t border-grid/20">
          <p className="text-xs text-grid/50">Sudoku · Mobile First</p>
        </div>
      </aside>
    </>
  );
}
