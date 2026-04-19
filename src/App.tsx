import { useEffect } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { NumberPad } from './components/NumberPad';
import { BottomPanel } from './components/BottomPanel';
import { HintPanel } from './components/HintPanel';
import { LoadingOverlay } from './components/LoadingOverlay';
import { newGameAtom, gameStateAtom, setCellValueAtom, selectedCellAtom, clearCellAtom } from './store/game';

function App() {
  const newGame = useSetAtom(newGameAtom);
  const gameState = useAtomValue(gameStateAtom);
  const setCellValue = useSetAtom(setCellValueAtom);
  const selected = useAtomValue(selectedCellAtom);
  const clearCell = useSetAtom(clearCellAtom);

  // Initialize game on first load
  useEffect(() => {
    if (gameState.board.length === 0) {
      newGame();
    }
  }, [gameState.board.length, newGame]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selected) return;

      const key = e.key;
      
      if (key >= '1' && key <= '9') {
        setCellValue(parseInt(key));
      } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
        clearCell();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, setCellValue, clearCell]);

  return (
    // Traces to: SPEC-005. The whole game surface opts out of the global
    // touchmove preventDefault so in-app handlers receive events normally.
    <div className="flex flex-col min-h-[100dvh] px-4 pb-safe" data-touch-handled>
      <Header />
      
      {/* Board + NumberPad are pinned to the top of <main> so they never
          shift when BottomPanel's content height changes (e.g., switching
          between the Reason tab and History tab's 200px tree canvas). */}
      <main className="flex-1 flex flex-col gap-4 py-4 min-h-0">
        <Board />
        <NumberPad />
        <BottomPanel />
      </main>

      <HintPanel />
      {/* Traces to: SPEC-008, SPEC-010. Overlay is mounted for the app lifetime
          and toggled via isGeneratingAtom; it has no dependencies on any caller.
          The prior WinModal sibling was removed per SPEC-010 (no congratulation
          modal is rendered on completion). */}
      <LoadingOverlay />
    </div>
  );
}

export default App;
