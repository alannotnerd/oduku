import { solvePuzzle, countSolutions, type Board, type Difficulty } from '../../sudoku';
import type { PuzzleResult } from '../types';
import { traceTechniqueScore } from './score';

function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function generateSolvedGrid(): Board {
  const grid = new Array(81).fill(0);

  for (let box = 0; box < 3; box++) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    shuffle(nums);

    let idx = 0;
    const startRow = box * 3;
    const startCol = box * 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        grid[(startRow + r) * 9 + (startCol + c)] = nums[idx++];
      }
    }
  }

  const partial: Board = [];
  for (let row = 0; row < 9; row++) {
    partial.push([]);
    for (let col = 0; col < 9; col++) {
      const val = grid[row * 9 + col];
      partial[row].push(val === 0 ? null : val);
    }
  }

  return solvePuzzle(partial) || partial;
}

function createPuzzle(solved: Board, difficulty: Difficulty): Board {
  const puzzle: Board = solved.map(row => [...row]);

  const targetClues: Record<Difficulty, [number, number]> = {
    easy: [36, 42],
    medium: [30, 36],
    hard: [26, 30],
    expert: [22, 26],
    master: [17, 22],
  };

  const [minClues, maxClues] = targetClues[difficulty];
  const targetClueCount = minClues + Math.floor(Math.random() * (maxClues - minClues + 1));

  const cells = Array.from({ length: 81 }, (_, i) => i);
  shuffle(cells);

  let clueCount = 81;

  for (const cell of cells) {
    if (clueCount <= targetClueCount) break;

    const row = Math.floor(cell / 9);
    const col = cell % 9;

    if (puzzle[row][col] === null) continue;

    const saved = puzzle[row][col];
    puzzle[row][col] = null;

    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[row][col] = saved;
    } else {
      clueCount--;
    }
  }

  return puzzle;
}

const MAX_ATTEMPTS = 10;

export function generatePuzzle(difficulty: Difficulty = 'medium'): PuzzleResult {
  let fallback: { puzzle: Board; solution: Board } | null = null;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const solution = generateSolvedGrid();
    const puzzle = createPuzzle(solution, difficulty);
    const trace = traceTechniqueScore(puzzle);

    if (trace) {
      return {
        puzzle,
        solution,
        difficulty,
        difficultyScore: trace.score,
        strategies: trace.strategies,
      };
    }

    fallback = { puzzle, solution };
  }

  // All attempts needed techniques beyond our hint engine. Ship the last puzzle
  // with a zeroed score so callers can tell the score is not trustworthy.
  return {
    puzzle: fallback!.puzzle,
    solution: fallback!.solution,
    difficulty,
    difficultyScore: 0,
    strategies: [],
  };
}
