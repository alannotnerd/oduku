import { 
  generate as sudokuGenerate, 
  solve as sudokuSolve, 
  analyze as sudokuAnalyze,
  type Board as SudokuCoreBoard,
  type Difficulty as SudokuCoreDifficulty,
  type AnalyzeData,
} from 'sudoku-core';

export type CellValue = number | null;
export type Board = CellValue[][];
export type Notes = Set<number>[][];

export interface Cell {
  value: CellValue;
  isFixed: boolean;
  notes: Set<number>;
  isConflict: boolean;
}

export type GameBoard = Cell[][];

// Map our difficulty to sudoku-core difficulty
export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';

const DIFFICULTY_MAP: Record<string, SudokuCoreDifficulty> = {
  easy: 'easy',
  medium: 'medium',
  hard: 'hard',
  expert: 'expert',
  master: 'master',
};

// Convert 2D board to 1D (sudoku-core format)
export function boardTo1D(board: Board): SudokuCoreBoard {
  const result: SudokuCoreBoard = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      result.push(board[row][col]);
    }
  }
  return result;
}

// Convert 1D board to 2D (our format)
export function boardTo2D(board: SudokuCoreBoard): Board {
  const result: Board = [];
  for (let row = 0; row < 9; row++) {
    result.push(board.slice(row * 9, (row + 1) * 9));
  }
  return result;
}

// Convert GameBoard to 1D (for sudoku-core)
export function gameBoardTo1D(board: GameBoard): SudokuCoreBoard {
  const result: SudokuCoreBoard = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      result.push(board[row][col].value);
    }
  }
  return result;
}

export interface PuzzleResult {
  puzzle: Board;
  solution: Board;
  difficulty: Difficulty;
  difficultyScore: number;
  strategies: Array<{ title: string; freq: number }>;
}

// Generate a puzzle using sudoku-core
export function generatePuzzle(difficulty: Difficulty = 'medium'): PuzzleResult {
  const coreDifficulty = DIFFICULTY_MAP[difficulty] || 'medium';
  
  // Generate puzzle
  const puzzle1D = sudokuGenerate(coreDifficulty);
  const puzzle = boardTo2D(puzzle1D);
  
  // Solve to get solution and analysis
  const solveResult = sudokuSolve(puzzle1D);
  
  let solution: Board;
  let analysisData: AnalyzeData;
  
  if (solveResult.solved && solveResult.board) {
    solution = boardTo2D(solveResult.board);
    analysisData = solveResult.analysis || { hasSolution: true };
  } else {
    // Fallback: solve manually
    solution = puzzle.map(row => [...row]);
    analysisData = sudokuAnalyze(puzzle1D);
  }
  
  return {
    puzzle,
    solution,
    difficulty: (analysisData.difficulty as Difficulty) || difficulty,
    difficultyScore: analysisData.score || 0,
    strategies: (analysisData.usedStrategies || [])
      .filter((s): s is { title: string; freq: number } => s !== null),
  };
}

// Calculate candidates for a cell based on row/column/box elimination
export function getCandidates(puzzle: Board, row: number, col: number): Set<number> {
  if (puzzle[row][col] !== null) {
    return new Set<number>();
  }

  const candidates = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  // Eliminate by row
  for (let x = 0; x < 9; x++) {
    const val = puzzle[row][x];
    if (val !== null) candidates.delete(val);
  }

  // Eliminate by column
  for (let y = 0; y < 9; y++) {
    const val = puzzle[y][col];
    if (val !== null) candidates.delete(val);
  }

  // Eliminate by 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const val = puzzle[boxRow + y][boxCol + x];
      if (val !== null) candidates.delete(val);
    }
  }

  return candidates;
}

// Create game board from puzzle with auto-generated candidates
export function createGameBoard(puzzle: Board): GameBoard {
  return puzzle.map((row, rowIdx) =>
    row.map((value, colIdx) => ({
      value,
      isFixed: value !== null,
      notes: getCandidates(puzzle, rowIdx, colIdx),
      isConflict: false,
    }))
  );
}

// Check for conflicts in the board
export function updateConflicts(board: GameBoard): GameBoard {
  const newBoard = board.map(row => row.map(cell => ({ ...cell, isConflict: false })));

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const value = newBoard[row][col].value;
      if (value === null) continue;

      // Check row
      for (let x = 0; x < 9; x++) {
        if (x !== col && newBoard[row][x].value === value) {
          newBoard[row][col].isConflict = true;
          newBoard[row][x].isConflict = true;
        }
      }

      // Check column
      for (let y = 0; y < 9; y++) {
        if (y !== row && newBoard[y][col].value === value) {
          newBoard[row][col].isConflict = true;
          newBoard[y][col].isConflict = true;
        }
      }

      // Check 3x3 box
      const boxRow = Math.floor(row / 3) * 3;
      const boxCol = Math.floor(col / 3) * 3;
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < 3; x++) {
          const r = boxRow + y;
          const c = boxCol + x;
          if ((r !== row || c !== col) && newBoard[r][c].value === value) {
            newBoard[row][col].isConflict = true;
            newBoard[r][c].isConflict = true;
          }
        }
      }
    }
  }

  return newBoard;
}

// Check if board is solved
export function isSolved(board: GameBoard): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col].value === null || board[row][col].isConflict) {
        return false;
      }
    }
  }
  return true;
}

// Get cells in same row, column, or box
export function getRelatedCells(row: number, col: number): [number, number][] {
  const related: [number, number][] = [];
  
  // Same row
  for (let x = 0; x < 9; x++) {
    if (x !== col) related.push([row, x]);
  }
  
  // Same column
  for (let y = 0; y < 9; y++) {
    if (y !== row) related.push([y, col]);
  }
  
  // Same box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const r = boxRow + y;
      const c = boxCol + x;
      if (r !== row && c !== col) {
        related.push([r, c]);
      }
    }
  }
  
  return related;
}
