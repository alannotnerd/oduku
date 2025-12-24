import { useEffect } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import { Header } from './components/Header';
import { Board } from './components/Board';
import { NumberPad } from './components/NumberPad';
import { BottomPanel } from './components/BottomPanel';
import { WinModal } from './components/WinModal';
import { HintPanel } from './components/HintPanel';
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
    <div className="flex flex-col min-h-[100dvh] px-4 pb-safe">
      <Header />
      
      <main className="flex-1 flex flex-col justify-center gap-4 py-4">
        <Board />
        <NumberPad />
        <BottomPanel />
      </main>

      <footer className="text-center text-xs text-grid/50 py-3">
        <p>Sudoku · Mobile First</p>
      </footer>

      <WinModal />
      <HintPanel />
    </div>
  );
}

export default App;
