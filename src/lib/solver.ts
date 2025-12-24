/**
 * Sudoku Solver using sudoku-core library
 * Provides hint functionality with step-by-step explanations
 */

import { 
  hint as sudokuHint,
  solve as sudokuSolve,
  analyze as sudokuAnalyze,
} from 'sudoku-core';
import { type GameBoard, gameBoardTo1D, boardTo2D } from './sudoku';

// Link between two candidates for visualization
export interface CandidateLink {
  from: { row: number; col: number; candidate: number };
  to: { row: number; col: number; candidate: number };
  type: 'strong' | 'weak';
}

// Hint step with explanation
export interface HintStep {
  technique: string;
  description: string;
  explanation: string;
  affectedCells: { row: number; col: number; value?: number; eliminated?: number[] }[];
  links?: CandidateLink[];
}

// Strategy explanations
const STRATEGY_EXPLANATIONS: Record<string, string> = {
  'Single Remaining Cell Strategy': 
    'This cell is the only empty cell in its row, column, or box that can contain this number.',
  'Single Candidate Cell Strategy': 
    'This cell has only one possible candidate number remaining after elimination.',
  'Single Candidate Value Strategy':
    'This number can only go in one cell within its row, column, or box.',
  'Pointing Elimination Strategy':
    'When a candidate in a box is limited to one row/column, it can be eliminated from that row/column outside the box.',
  'Box Line Reduction Strategy':
    'When a candidate in a row/column is limited to one box, it can be eliminated from other cells in that box.',
  'Naked Pair Strategy':
    'Two cells in a unit with the same two candidates - these candidates can be eliminated from other cells in the unit.',
  'Hidden Pair Strategy':
    'Two candidates that only appear in two cells of a unit - other candidates can be eliminated from these cells.',
  'Naked Triple Strategy':
    'Three cells in a unit sharing three candidates - these candidates can be eliminated from other cells.',
  'X-Wing Strategy':
    'A candidate appears in exactly two cells in two different rows, forming a rectangle - eliminations possible.',
};

// Convert 1D index to row/col
function indexToRowCol(index: number): { row: number; col: number } {
  return {
    row: Math.floor(index / 9),
    col: index % 9,
  };
}

// Get hint from sudoku-core and format it for our UI
export function getHint(board: GameBoard): HintStep | null {
  const board1D = gameBoardTo1D(board);
  
  // Check if puzzle is already solved
  const hasEmpty = board1D.some(cell => cell === null);
  if (!hasEmpty) return null;
  
  const result = sudokuHint(board1D);
  
  if (!result.solved && result.error) {
    return null;
  }
  
  if (!result.steps || result.steps.length === 0) {
    return null;
  }
  
  const step = result.steps[0];
  const affectedCells: HintStep['affectedCells'] = [];
  
  for (const update of step.updates) {
    const { row, col } = indexToRowCol(update.index);
    
    if (step.type === 'value' && update.filledValue) {
      affectedCells.push({ row, col, value: update.filledValue });
    } else if (step.type === 'elimination' && update.eliminatedCandidate) {
      affectedCells.push({ row, col, eliminated: [update.eliminatedCandidate] });
    }
  }
  
  const explanation = STRATEGY_EXPLANATIONS[step.strategy] || 
    `The solver found a move using ${step.strategy}.`;
  
  let description: string;
  if (step.type === 'value' && affectedCells.length > 0) {
    const cell = affectedCells[0];
    description = `Place ${cell.value} at R${cell.row + 1}C${cell.col + 1}`;
  } else if (step.type === 'elimination') {
    description = `Eliminate candidates from ${affectedCells.length} cell(s)`;
  } else {
    description = step.strategy;
  }
  
  return {
    technique: step.strategy,
    description,
    explanation,
    affectedCells,
    links: [], // sudoku-core doesn't provide link visualization
  };
}

// Full solve result with analysis
export interface SolveResult {
  solved: boolean;
  board: (number | null)[][];
  difficulty: string;
  score: number;
  strategies: Array<{ title: string; freq: number }>;
}

// Solve the puzzle completely
export function solvePuzzle(board: GameBoard): SolveResult {
  const board1D = gameBoardTo1D(board);
  const result = sudokuSolve(board1D);
  
  if (result.solved && result.board) {
    return {
      solved: true,
      board: boardTo2D(result.board),
      difficulty: result.analysis?.difficulty || 'unknown',
      score: result.analysis?.score || 0,
      strategies: (result.analysis?.usedStrategies || [])
        .filter((s): s is { title: string; freq: number } => s !== null),
    };
  }
  
  return {
    solved: false,
    board: board.map(row => row.map(cell => cell.value)),
    difficulty: 'unsolvable',
    score: 0,
    strategies: [],
  };
}

// Analyze puzzle difficulty
export function analyzePuzzle(board: GameBoard): {
  hasSolution: boolean;
  hasUniqueSolution: boolean;
  difficulty: string;
  score: number;
  strategies: Array<{ title: string; freq: number }>;
} {
  const board1D = gameBoardTo1D(board);
  const analysis = sudokuAnalyze(board1D);
  
  return {
    hasSolution: analysis.hasSolution,
    hasUniqueSolution: analysis.hasUniqueSolution || false,
    difficulty: analysis.difficulty || 'unknown',
    score: analysis.score || 0,
    strategies: (analysis.usedStrategies || [])
      .filter((s): s is { title: string; freq: number } => s !== null),
  };
}

// Find naked singles (cells with only one candidate)
export function findNakedSingles(board: GameBoard): Array<{ row: number; col: number; value: number }> {
  const singles: Array<{ row: number; col: number; value: number }> = [];
  
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = board[row][col];
      if (cell.value === null && cell.notes.size === 1) {
        const value = Array.from(cell.notes)[0];
        singles.push({ row, col, value });
      }
    }
  }
  
  return singles;
}

// Get difficulty label from score
export function getDifficultyLabel(score: number): string {
  if (score < 100) return 'Easy';
  if (score < 300) return 'Medium';
  if (score < 700) return 'Hard';
  if (score < 1500) return 'Expert';
  return 'Master';
}
