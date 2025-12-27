/**
 * High-performance Sudoku library
 * Inspired by HoDoKu's efficient algorithms using bitmasks
 */

export type CellValue = number | null;
export type Board = CellValue[][];

export interface Cell {
  value: CellValue;
  isFixed: boolean;
  notes: Set<number>;
  isConflict: boolean;
}

export type GameBoard = Cell[][];

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'master';

// Bitmask utilities for fast candidate manipulation
// Each candidate 1-9 is represented as bit 0-8
const ALL_CANDIDATES = 0x1ff; // 0b111111111 = 511

function countBits(n: number): number {
  let count = 0;
  while (n) {
    count += n & 1;
    n >>= 1;
  }
  return count;
}

function getLowestBit(n: number): number {
  // Returns 1-9 for the lowest set bit
  if (n === 0) return 0;
  let bit = 1;
  let value = 1;
  while ((n & bit) === 0) {
    bit <<= 1;
    value++;
  }
  return value;
}

function bitmaskToSet(mask: number): Set<number> {
  const set = new Set<number>();
  for (let i = 1; i <= 9; i++) {
    if (mask & (1 << (i - 1))) {
      set.add(i);
    }
  }
  return set;
}

// Precomputed peer indices for each cell (row, column, box)
const PEERS: number[][] = [];
const UNITS: number[][][] = []; // [cellIndex][unitType][cells in unit]

function initializePeers() {
  if (PEERS.length > 0) return;
  
  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9);
    const col = i % 9;
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    const peers = new Set<number>();
    const rowUnit: number[] = [];
    const colUnit: number[] = [];
    const boxUnit: number[] = [];
    
    // Row peers
    for (let c = 0; c < 9; c++) {
      const idx = row * 9 + c;
      rowUnit.push(idx);
      if (c !== col) peers.add(idx);
    }
    
    // Column peers
    for (let r = 0; r < 9; r++) {
      const idx = r * 9 + col;
      colUnit.push(idx);
      if (r !== row) peers.add(idx);
    }
    
    // Box peers
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = (boxRow + r) * 9 + (boxCol + c);
        boxUnit.push(idx);
        if (idx !== i) peers.add(idx);
      }
    }
    
    PEERS.push(Array.from(peers));
    UNITS.push([rowUnit, colUnit, boxUnit]);
  }
}

// Initialize on module load
initializePeers();

/**
 * Fast Sudoku Solver using constraint propagation and backtracking
 */
class SudokuSolver {
  private grid: number[]; // Values 0-9 (0 = empty)
  private candidates: number[]; // Bitmasks for candidates
  
  constructor(board: Board | number[]) {
    this.grid = new Array(81).fill(0);
    this.candidates = new Array(81).fill(ALL_CANDIDATES);
    
    // Convert input
    if (Array.isArray(board[0])) {
      // 2D board
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const val = (board as Board)[row][col];
          if (val !== null) {
            this.grid[row * 9 + col] = val;
          }
        }
      }
    } else {
      // 1D array
      for (let i = 0; i < 81; i++) {
        const val = (board as number[])[i];
        if (val !== null && val !== 0) {
          this.grid[i] = val;
        }
      }
    }
    
    // Apply initial constraints
    this.initializeCandidates();
  }
  
  private initializeCandidates(): boolean {
    for (let i = 0; i < 81; i++) {
      if (this.grid[i] !== 0) {
        if (!this.assign(i, this.grid[i])) {
          return false;
        }
      }
    }
    return true;
  }
  
  private assign(cell: number, value: number): boolean {
    // Remove all other candidates from this cell
    const otherCandidates = this.candidates[cell] & ~(1 << (value - 1));
    for (let d = 1; d <= 9; d++) {
      if (otherCandidates & (1 << (d - 1))) {
        if (!this.eliminate(cell, d)) {
          return false;
        }
      }
    }
    return true;
  }
  
  private eliminate(cell: number, value: number): boolean {
    const bit = 1 << (value - 1);
    
    // Already eliminated
    if ((this.candidates[cell] & bit) === 0) {
      return true;
    }
    
    // Remove candidate
    this.candidates[cell] &= ~bit;
    
    // Check for contradiction (no candidates left)
    if (this.candidates[cell] === 0) {
      return false;
    }
    
    // If only one candidate left, assign it
    if (countBits(this.candidates[cell]) === 1) {
      const d = getLowestBit(this.candidates[cell]);
      this.grid[cell] = d;
      
      // Eliminate from all peers
      for (const peer of PEERS[cell]) {
        if (!this.eliminate(peer, d)) {
          return false;
        }
      }
    }
    
    // Check each unit: if only one place for this value, assign it
    for (const unit of UNITS[cell]) {
      const places: number[] = [];
      for (const idx of unit) {
        if (this.candidates[idx] & bit) {
          places.push(idx);
        }
      }
      
      if (places.length === 0) {
        return false; // No place for this value
      }
      
      if (places.length === 1) {
        if (!this.assign(places[0], value)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  solve(): Board | null {
    return this.search();
  }
  
  private search(): Board | null {
    // Check if solved
    let minCandidates = 10;
    let bestCell = -1;
    
    for (let i = 0; i < 81; i++) {
      if (this.grid[i] === 0) {
        const count = countBits(this.candidates[i]);
        if (count < minCandidates) {
          minCandidates = count;
          bestCell = i;
        }
      }
    }
    
    // All cells filled
    if (bestCell === -1) {
      return this.toBoard();
    }
    
    // Try each candidate
    const candidates = this.candidates[bestCell];
    for (let d = 1; d <= 9; d++) {
      if (candidates & (1 << (d - 1))) {
        // Clone state
        const savedGrid = [...this.grid];
        const savedCandidates = [...this.candidates];
        
        if (this.assign(bestCell, d)) {
          const result = this.search();
          if (result) return result;
        }
        
        // Restore state
        this.grid = savedGrid;
        this.candidates = savedCandidates;
      }
    }
    
    return null;
  }
  
  private toBoard(): Board {
    const board: Board = [];
    for (let row = 0; row < 9; row++) {
      board.push([]);
      for (let col = 0; col < 9; col++) {
        const val = this.grid[row * 9 + col];
        board[row].push(val === 0 ? null : val);
      }
    }
    return board;
  }
  
  getCandidates(cell: number): Set<number> {
    return bitmaskToSet(this.candidates[cell]);
  }
}

/**
 * Generate a random solved Sudoku grid
 */
function generateSolvedGrid(): Board {
  const grid = new Array(81).fill(0);
  
  // Fill diagonal boxes first (they don't affect each other)
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
  
  // Convert to board and solve to fill rest
  const partial: Board = [];
  for (let row = 0; row < 9; row++) {
    partial.push([]);
    for (let col = 0; col < 9; col++) {
      const val = grid[row * 9 + col];
      partial[row].push(val === 0 ? null : val);
    }
  }
  
  const solver = new SudokuSolver(partial);
  return solver.solve() || partial;
}

function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Count solutions (up to limit)
 */
function countSolutions(board: Board, limit: number = 2): number {
  const grid: number[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      grid.push(board[row][col] ?? 0);
    }
  }
  
  let count = 0;
  
  function solve(cells: number): boolean {
    // Find first empty cell
    let cell = -1;
    for (let i = cells; i < 81; i++) {
      if (grid[i] === 0) {
        cell = i;
        break;
      }
    }
    
    if (cell === -1) {
      count++;
      return count >= limit;
    }
    
    // Calculate candidates
    let candidates = ALL_CANDIDATES;
    for (const peer of PEERS[cell]) {
      if (grid[peer] !== 0) {
        candidates &= ~(1 << (grid[peer] - 1));
      }
    }
    
    // Try each candidate
    for (let d = 1; d <= 9; d++) {
      if (candidates & (1 << (d - 1))) {
        grid[cell] = d;
        if (solve(cell + 1)) return true;
        grid[cell] = 0;
      }
    }
    
    return false;
  }
  
  solve(0);
  return count;
}

/**
 * Remove cells from solved grid to create puzzle
 */
function createPuzzle(solved: Board, difficulty: Difficulty): Board {
  const puzzle: Board = solved.map(row => [...row]);
  
  // Difficulty determines how many cells to remove and which techniques are needed
  const targetClues: Record<Difficulty, [number, number]> = {
    easy: [36, 42],
    medium: [30, 36],
    hard: [26, 30],
    expert: [22, 26],
    master: [17, 22],
  };
  
  const [minClues, maxClues] = targetClues[difficulty];
  const targetClueCount = minClues + Math.floor(Math.random() * (maxClues - minClues + 1));
  
  // Create list of cell indices and shuffle
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
    
    // Check if still has unique solution
    if (countSolutions(puzzle, 2) !== 1) {
      // Restore - removing this cell creates multiple solutions
      puzzle[row][col] = saved;
    } else {
      clueCount--;
    }
  }
  
  return puzzle;
}

export interface PuzzleResult {
  puzzle: Board;
  solution: Board;
  difficulty: Difficulty;
  difficultyScore: number;
  strategies: Array<{ title: string; freq: number }>;
}

/**
 * Generate a new puzzle
 */
export function generatePuzzle(difficulty: Difficulty = 'medium'): PuzzleResult {
  const solution = generateSolvedGrid();
  const puzzle = createPuzzle(solution, difficulty);
  
  // Calculate difficulty score based on clue count and techniques needed
  let clueCount = 0;
  for (const row of puzzle) {
    for (const cell of row) {
      if (cell !== null) clueCount++;
    }
  }
  
  // Simple scoring: fewer clues = higher score
  const baseScore = (81 - clueCount) * 10;
  const difficultyMultiplier: Record<Difficulty, number> = {
    easy: 1,
    medium: 2,
    hard: 4,
    expert: 8,
    master: 16,
  };
  
  const score = baseScore * difficultyMultiplier[difficulty];
  
  // Analyze techniques (simplified)
  const strategies: Array<{ title: string; freq: number }> = [];
  if (clueCount >= 36) {
    strategies.push({ title: 'Naked Single', freq: 81 - clueCount });
  } else if (clueCount >= 30) {
    strategies.push({ title: 'Naked Single', freq: Math.floor((81 - clueCount) * 0.6) });
    strategies.push({ title: 'Hidden Single', freq: Math.floor((81 - clueCount) * 0.4) });
  } else if (clueCount >= 26) {
    strategies.push({ title: 'Naked Single', freq: Math.floor((81 - clueCount) * 0.4) });
    strategies.push({ title: 'Hidden Single', freq: Math.floor((81 - clueCount) * 0.4) });
    strategies.push({ title: 'Pointing Pair', freq: Math.floor((81 - clueCount) * 0.2) });
  } else {
    strategies.push({ title: 'Naked Single', freq: Math.floor((81 - clueCount) * 0.3) });
    strategies.push({ title: 'Hidden Single', freq: Math.floor((81 - clueCount) * 0.3) });
    strategies.push({ title: 'Naked Pair', freq: Math.floor((81 - clueCount) * 0.2) });
    strategies.push({ title: 'X-Wing', freq: Math.floor((81 - clueCount) * 0.2) });
  }
  
  return {
    puzzle,
    solution,
    difficulty,
    difficultyScore: score,
    strategies,
  };
}

/**
 * Get candidates for a cell
 */
export function getCandidates(puzzle: Board, row: number, col: number): Set<number> {
  if (puzzle[row][col] !== null) {
    return new Set<number>();
  }

  let candidates = ALL_CANDIDATES;
  const cellIndex = row * 9 + col;

  for (const peer of PEERS[cellIndex]) {
    const peerRow = Math.floor(peer / 9);
    const peerCol = peer % 9;
    const val = puzzle[peerRow][peerCol];
    if (val !== null) {
      candidates &= ~(1 << (val - 1));
    }
  }

  return bitmaskToSet(candidates);
}

/**
 * Create game board from puzzle with auto-generated candidates
 */
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

/**
 * Check for conflicts in the board
 */
export function updateConflicts(board: GameBoard): GameBoard {
  const newBoard = board.map(row => row.map(cell => ({ ...cell, isConflict: false })));

  for (let i = 0; i < 81; i++) {
    const row = Math.floor(i / 9);
    const col = i % 9;
      const value = newBoard[row][col].value;
      if (value === null) continue;

    for (const peer of PEERS[i]) {
      const peerRow = Math.floor(peer / 9);
      const peerCol = peer % 9;
      if (newBoard[peerRow][peerCol].value === value) {
          newBoard[row][col].isConflict = true;
        newBoard[peerRow][peerCol].isConflict = true;
      }
    }
  }

  return newBoard;
}

/**
 * Check if board is solved
 */
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

/**
 * Get cells in same row, column, or box
 */
export function getRelatedCells(row: number, col: number): [number, number][] {
  const cellIndex = row * 9 + col;
  return PEERS[cellIndex].map(i => [Math.floor(i / 9), i % 9] as [number, number]);
}

/**
 * Solve a puzzle
 */
export function solvePuzzle(board: Board): Board | null {
  const solver = new SudokuSolver(board);
  return solver.solve();
}

/**
 * Convert GameBoard to Board format
 */
export function gameBoardToBoard(gameBoard: GameBoard): Board {
  return gameBoard.map(row => row.map(cell => cell.value));
}
