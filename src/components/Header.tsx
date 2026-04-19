/*
 * Header — primary-action-only layout.
 *
 * Traces to:
 *   SPEC-011 (header re-layout: title + difficulty indicator on the left;
 *             timer, explicit hint button, new-game button, hamburger trigger
 *             on the right; easter-egg score button and inline strategies
 *             panel removed; difficulty dropdown and import button moved out
 *             into the drawer)
 *   SPEC-012 (owns drawerOpen/importOpen useState; renders <SettingsDrawer />
 *             and <ImportModal />; the hamburger's aria-expanded tracks
 *             drawerOpen)
 *   SPEC-008 (new-game button continues to fire newGameAtom which triggers
 *             LoadingOverlay)
 *   SPEC-010 (no congratulation modal — unchanged; timer freeze on
 *             isComplete preserved)
 */

import { useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import {
  difficultyAtom,
  newGameAtom,
  gameStateAtom,
  showHintAtom,
  type Difficulty,
} from '../store/game';
import { ImportModal } from './ImportModal';
import { SettingsDrawer } from './SettingsDrawer';

// Traces to: SPEC-011. Difficulty indicator label mapping.
const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
  master: 'Master',
};

export function Header() {
  // Traces to: SPEC-011. Read-only reads of difficulty and game state; write
  // via newGameAtom and showHintAtom. Difficulty writes now live in the drawer.
  const difficulty = useAtomValue(difficultyAtom);
  const newGame = useSetAtom(newGameAtom);
  const showHint = useSetAtom(showHintAtom);
  const gameState = useAtomValue(gameStateAtom);
  const [elapsed, setElapsed] = useState(0);
  // Traces to: SPEC-012. Drawer open/close state — local useState, no atom.
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Traces to: SPEC-012. ImportModal open state — still owned by Header, so
  // the drawer can request it via onOpenImport prop.
  const [importOpen, setImportOpen] = useState(false);

  // Traces to: SPEC-011. Timer interval — unchanged from prior behavior;
  // gated on isComplete and empty board (SPEC-010 preserves this freeze).
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

  // Traces to: SPEC-011. Hint button is disabled when no puzzle or complete.
  const hintDisabled = gameState.isComplete || gameState.board.length === 0;

  return (
    <header className="w-full max-w-[min(90vw,400px)] mx-auto py-4">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Left: title + informational difficulty pill. */}
        <div className="flex items-center gap-2 min-w-0 justify-self-start">
          <h1 className="text-2xl font-bold text-ink tracking-tight">Sudoku</h1>
          <span className="px-2 py-0.5 text-xs font-medium bg-highlight text-grid rounded-full">
            {difficultyLabels[difficulty] || 'Medium'}
          </span>
        </div>

        {/* Center: timer doubles as the hint trigger. */}
        <button
          onClick={() => showHint()}
          disabled={hintDisabled}
          aria-label="Hint"
          title="Tap for a hint"
          className="justify-self-center font-mono text-lg text-grid tabular-nums px-3 py-1 rounded-lg hover:bg-highlight active:scale-95 transition-all touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {formatTime(elapsed)}
        </button>

        {/* Right: new-game + hamburger. */}
        <div className="flex items-center gap-2 justify-self-end">
          <button
            onClick={() => newGame()}
            className="p-2 bg-accent text-white rounded-lg shadow-md hover:bg-accent-light active:scale-95 transition-all touch-manipulation"
            aria-label="New Game"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={() => setDrawerOpen((prev) => !prev)}
            aria-label="Open settings"
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            className="p-2 bg-highlight text-grid rounded-lg active:scale-95 transition-all touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Traces to: SPEC-012. Drawer and modal — rendered inside the header
          React subtree so a single component owns both states. */}
      <SettingsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenImport={() => setImportOpen(true)}
      />
      <ImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </header>
  );
}
