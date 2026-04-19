import { type GameBoard, solvePuzzle, gameBoardToBoard } from '../../sudoku';
import type { HintStep } from '../types';

function findNakedSingle(board: GameBoard): HintStep | null {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = board[row][col];
      if (cell.value === null && cell.notes.size === 1) {
        const value = Array.from(cell.notes)[0];
        return {
          technique: 'Naked Single',
          description: `R${row + 1}C${col + 1} = ${value}`,
          explanation: `Cell R${row + 1}C${col + 1} has only one possible candidate: ${value}. This is the only number that can go here.`,
          affectedCells: [{ row, col, value }],
        };
      }
    }
  }
  return null;
}

function findHiddenSingle(board: GameBoard): HintStep | null {
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      const places: number[] = [];
      for (let col = 0; col < 9; col++) {
        const cell = board[row][col];
        if (cell.value === null && cell.notes.has(num)) {
          places.push(col);
        }
      }
      if (places.length === 1) {
        const col = places[0];
        return {
          technique: 'Hidden Single (Row)',
          description: `R${row + 1}C${col + 1} = ${num}`,
          explanation: `In row ${row + 1}, the number ${num} can only go in column ${col + 1}. No other cell in this row can contain ${num}.`,
          affectedCells: [{ row, col, value: num }],
        };
      }
    }
  }

  for (let col = 0; col < 9; col++) {
    for (let num = 1; num <= 9; num++) {
      const places: number[] = [];
      for (let row = 0; row < 9; row++) {
        const cell = board[row][col];
        if (cell.value === null && cell.notes.has(num)) {
          places.push(row);
        }
      }
      if (places.length === 1) {
        const row = places[0];
        return {
          technique: 'Hidden Single (Column)',
          description: `R${row + 1}C${col + 1} = ${num}`,
          explanation: `In column ${col + 1}, the number ${num} can only go in row ${row + 1}. No other cell in this column can contain ${num}.`,
          affectedCells: [{ row, col, value: num }],
        };
      }
    }
  }

  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      for (let num = 1; num <= 9; num++) {
        const places: [number, number][] = [];
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = boxRow * 3 + r;
            const col = boxCol * 3 + c;
            const cell = board[row][col];
            if (cell.value === null && cell.notes.has(num)) {
              places.push([row, col]);
            }
          }
        }
        if (places.length === 1) {
          const [row, col] = places[0];
          return {
            technique: 'Hidden Single (Box)',
            description: `R${row + 1}C${col + 1} = ${num}`,
            explanation: `In box ${boxRow * 3 + boxCol + 1}, the number ${num} can only go at R${row + 1}C${col + 1}. No other cell in this box can contain ${num}.`,
            affectedCells: [{ row, col, value: num }],
          };
        }
      }
    }
  }

  return null;
}

function findPointingPair(board: GameBoard): HintStep | null {
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      for (let num = 1; num <= 9; num++) {
        const places: [number, number][] = [];

        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const row = boxRow * 3 + r;
            const col = boxCol * 3 + c;
            const cell = board[row][col];
            if (cell.value === null && cell.notes.has(num)) {
              places.push([row, col]);
            }
          }
        }

        if (places.length < 2 || places.length > 3) continue;

        const rows = new Set(places.map(p => p[0]));
        if (rows.size === 1) {
          const row = places[0][0];
          const eliminations: { row: number; col: number; eliminated: number[] }[] = [];

          for (let col = 0; col < 9; col++) {
            if (Math.floor(col / 3) !== boxCol) {
              const cell = board[row][col];
              if (cell.value === null && cell.notes.has(num)) {
                eliminations.push({ row, col, eliminated: [num] });
              }
            }
          }

          if (eliminations.length > 0) {
            return {
              technique: 'Pointing Pair',
              description: `Eliminate ${num} from row ${row + 1}`,
              explanation: `In box ${boxRow * 3 + boxCol + 1}, the number ${num} is confined to row ${row + 1}. Therefore, ${num} can be eliminated from other cells in row ${row + 1} outside this box.`,
              affectedCells: eliminations,
            };
          }
        }

        const cols = new Set(places.map(p => p[1]));
        if (cols.size === 1) {
          const col = places[0][1];
          const eliminations: { row: number; col: number; eliminated: number[] }[] = [];

          for (let row = 0; row < 9; row++) {
            if (Math.floor(row / 3) !== boxRow) {
              const cell = board[row][col];
              if (cell.value === null && cell.notes.has(num)) {
                eliminations.push({ row, col, eliminated: [num] });
              }
            }
          }

          if (eliminations.length > 0) {
            return {
              technique: 'Pointing Pair',
              description: `Eliminate ${num} from column ${col + 1}`,
              explanation: `In box ${boxRow * 3 + boxCol + 1}, the number ${num} is confined to column ${col + 1}. Therefore, ${num} can be eliminated from other cells in column ${col + 1} outside this box.`,
              affectedCells: eliminations,
            };
          }
        }
      }
    }
  }

  return null;
}

function findNakedPair(board: GameBoard): HintStep | null {
  for (let row = 0; row < 9; row++) {
    const pairs: [number, Set<number>][] = [];

    for (let col = 0; col < 9; col++) {
      const cell = board[row][col];
      if (cell.value === null && cell.notes.size === 2) {
        pairs.push([col, cell.notes]);
      }
    }

    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const [col1, notes1] = pairs[i];
        const [col2, notes2] = pairs[j];

        if (notes1.size === notes2.size &&
            Array.from(notes1).every(n => notes2.has(n))) {
          const nums = Array.from(notes1);
          const eliminations: { row: number; col: number; eliminated: number[] }[] = [];

          for (let col = 0; col < 9; col++) {
            if (col !== col1 && col !== col2) {
              const cell = board[row][col];
              if (cell.value === null) {
                const toEliminate = nums.filter(n => cell.notes.has(n));
                if (toEliminate.length > 0) {
                  eliminations.push({ row, col, eliminated: toEliminate });
                }
              }
            }
          }

          if (eliminations.length > 0) {
            return {
              technique: 'Naked Pair',
              description: `Eliminate {${nums.join(',')}} from row ${row + 1}`,
              explanation: `Cells R${row + 1}C${col1 + 1} and R${row + 1}C${col2 + 1} both contain only candidates {${nums.join(',')}}. These two numbers must go in these two cells, so they can be eliminated from other cells in row ${row + 1}.`,
              affectedCells: eliminations,
            };
          }
        }
      }
    }
  }

  return null;
}

function findSolutionHint(board: GameBoard): HintStep | null {
  const puzzleBoard = gameBoardToBoard(board);
  const solution = solvePuzzle(puzzleBoard);

  if (!solution) return null;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col].value === null && solution[row][col] !== null) {
        return {
          technique: 'Solution Check',
          description: `R${row + 1}C${col + 1} = ${solution[row][col]}`,
          explanation: `Based on the complete solution, the value at R${row + 1}C${col + 1} is ${solution[row][col]}.`,
          affectedCells: [{ row, col, value: solution[row][col]! }],
        };
      }
    }
  }

  return null;
}

export function getHint(board: GameBoard): HintStep | null {
  let hasEmpty = false;
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col].value === null) {
        hasEmpty = true;
        break;
      }
    }
    if (hasEmpty) break;
  }

  if (!hasEmpty) return null;

  return (
    findNakedSingle(board) ??
    findHiddenSingle(board) ??
    findPointingPair(board) ??
    findNakedPair(board) ??
    findSolutionHint(board)
  );
}
