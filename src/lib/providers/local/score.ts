import { createGameBoard, getRelatedCells, type Board, type GameBoard } from '../../sudoku';
import type { HintStep } from '../types';
import { getHint } from './solver';

// Weights calibrated so each tier is an order of magnitude harder to spot than
// the previous one. Paired with peak-dominated scoring below, the hardest
// technique a puzzle requires sets its overall tier and the rest acts as a
// tiebreaker. Without this spread, a single X-Wing gets drowned out by fifty
// trivial singles and the final score stops reflecting actual difficulty.
const TECHNIQUE_WEIGHTS: Record<string, number> = {
  'Naked Single': 2,
  'Hidden Single (Row)': 5,
  'Hidden Single (Column)': 5,
  'Hidden Single (Box)': 5,
  'Pointing Pair': 30,
  'Claiming': 30,
  'Naked Pair (Row)': 50,
  'Naked Pair (Column)': 50,
  'Naked Pair (Box)': 50,
  'Hidden Pair (Row)': 70,
  'Hidden Pair (Column)': 70,
  'Hidden Pair (Box)': 70,
  'Naked Triple (Row)': 100,
  'Naked Triple (Column)': 100,
  'Naked Triple (Box)': 100,
  'Hidden Triple (Row)': 130,
  'Hidden Triple (Column)': 130,
  'Hidden Triple (Box)': 130,
  'X-Wing': 180,
  'XY-Wing': 220,
  'Swordfish': 260,
};

// Peak technique dominates the score; accumulated weight acts as a tiebreaker.
// Rough tiers: easy ~150, medium ~450, hard ~750, expert ~1300, master ~2000+.
const PEAK_MULTIPLIER = 10;
const TOTAL_DIVISOR = 2;

export interface TechniqueTrace {
  score: number;
  strategies: Array<{ title: string; freq: number }>;
}

export function traceTechniqueScore(puzzle: Board): TechniqueTrace | null {
  const board = createGameBoard(puzzle);
  let totalWeight = 0;
  let peakWeight = 0;
  const freq = new Map<string, number>();

  // Hard cap on steps guards against any pathological non-progressing loop.
  for (let step = 0; step < 200; step++) {
    const hint = getHint(board);
    if (!hint) {
      const score = peakWeight * PEAK_MULTIPLIER + totalWeight / TOTAL_DIVISOR;
      return {
        score,
        strategies: Array.from(freq, ([title, f]) => ({ title, freq: f })),
      };
    }
    if (hint.technique === 'Solution Check') return null;

    const weight = TECHNIQUE_WEIGHTS[hint.technique] ?? 0;
    totalWeight += weight;
    if (weight > peakWeight) peakWeight = weight;

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
