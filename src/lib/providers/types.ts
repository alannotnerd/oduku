import type { Board, Difficulty, GameBoard } from '../sudoku';

export interface CandidateLink {
  from: { row: number; col: number; candidate: number };
  to: { row: number; col: number; candidate: number };
  type: 'strong' | 'weak';
}

export interface HintStep {
  technique: string;
  description: string;
  explanation: string;
  affectedCells: { row: number; col: number; value?: number; eliminated?: number[] }[];
  links?: CandidateLink[];
}

export interface PuzzleResult {
  puzzle: Board;
  solution: Board;
  difficulty: Difficulty;
  difficultyScore: number;
  strategies: Array<{ title: string; freq: number }>;
}

export interface PuzzleGenerator {
  readonly name: string;
  generate(difficulty: Difficulty): Promise<PuzzleResult> | PuzzleResult;
}

export interface PuzzleSolver {
  readonly name: string;
  solve(puzzle: Board): Promise<Board | null> | Board | null;
  hint(board: GameBoard): Promise<HintStep | null> | HintStep | null;
}

export interface SudokuProvider {
  readonly name: string;
  readonly generator: PuzzleGenerator;
  readonly solver: PuzzleSolver;
}
