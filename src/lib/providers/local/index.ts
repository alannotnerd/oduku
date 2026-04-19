import { solvePuzzle, type Board, type Difficulty, type GameBoard } from '../../sudoku';
import type { HintStep, PuzzleGenerator, PuzzleSolver, SudokuProvider } from '../types';
import { generatePuzzle } from './generator';
import { getHint } from './solver';

const localGenerator: PuzzleGenerator = {
  name: 'local',
  generate(difficulty: Difficulty) {
    return generatePuzzle(difficulty);
  },
};

const localSolver: PuzzleSolver = {
  name: 'local',
  solve(puzzle: Board) {
    return solvePuzzle(puzzle);
  },
  hint(board: GameBoard): HintStep | null {
    return getHint(board);
  },
};

export const localProvider: SudokuProvider = {
  name: 'local',
  generator: localGenerator,
  solver: localSolver,
};
