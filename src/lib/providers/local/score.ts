import { createGameBoard, getRelatedCells, type Board, type GameBoard } from '../../sudoku';
import type { HintStep } from '../types';
import { getHint } from './solver';

const TECHNIQUE_WEIGHTS: Record<string, number> = {
  'Naked Single': 10,
  'Hidden Single (Row)': 15,
  'Hidden Single (Column)': 15,
  'Hidden Single (Box)': 15,
  'Pointing Pair': 50,
  'Claiming': 50,
  'Naked Pair (Row)': 40,
  'Naked Pair (Column)': 40,
  'Naked Pair (Box)': 40,
  'Hidden Pair (Row)': 60,
  'Hidden Pair (Column)': 60,
  'Hidden Pair (Box)': 60,
  'Naked Triple (Row)': 80,
  'Naked Triple (Column)': 80,
  'Naked Triple (Box)': 80,
  'Hidden Triple (Row)': 100,
  'Hidden Triple (Column)': 100,
  'Hidden Triple (Box)': 100,
  'X-Wing': 120,
  'XY-Wing': 140,
  'Swordfish': 150,
};

export interface TechniqueTrace {
  score: number;
  strategies: Array<{ title: string; freq: number }>;
}

export function traceTechniqueScore(puzzle: Board): TechniqueTrace | null {
  const board = createGameBoard(puzzle);
  let score = 0;
  const freq = new Map<string, number>();

  // Hard cap on steps guards against any pathological non-progressing loop.
  for (let step = 0; step < 200; step++) {
    const hint = getHint(board);
    if (!hint) {
      return {
        score,
        strategies: Array.from(freq, ([title, f]) => ({ title, freq: f })),
      };
    }
    if (hint.technique === 'Solution Check') return null;

    score += TECHNIQUE_WEIGHTS[hint.technique] ?? 0;
    const label = canonicalLabel(hint.technique);
    freq.set(label, (freq.get(label) ?? 0) + 1);

    if (!applyHint(board, hint)) return null;
  }

  return null;
}

function canonicalLabel(technique: string): string {
  return technique.replace(/ \(.+\)$/, '');
}

function applyHint(board: GameBoard, hint: HintStep): boolean {
  let progressed = false;

  for (const cell of hint.affectedCells) {
    const target = board[cell.row][cell.col];

    if (cell.value !== undefined) {
      if (target.value !== null) continue;
      target.value = cell.value;
      target.notes = new Set();
      progressed = true;
      for (const [pr, pc] of getRelatedCells(cell.row, cell.col)) {
        board[pr][pc].notes.delete(cell.value);
      }
    } else if (cell.eliminated) {
      for (const n of cell.eliminated) {
        if (target.notes.delete(n)) progressed = true;
      }
    }
  }

  return progressed;
}
