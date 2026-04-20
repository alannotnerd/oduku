import { type GameBoard, solvePuzzle, gameBoardToBoard } from '../../sudoku';
import type { HintStep, CandidateLink } from '../types';

// ---------------------------------------------------------------------------
// Unit helpers
// ---------------------------------------------------------------------------

type UnitType = 'Row' | 'Column' | 'Box';

interface UnitInfo {
  type: UnitType;
  index: number; // 0-based
  cells: [number, number][]; // (row, col) pairs for empty cells with candidates
}

/** Yield all 27 units (9 rows, 9 columns, 9 boxes). */
function* allUnits(board: GameBoard): Generator<UnitInfo> {
  // Rows
  for (let row = 0; row < 9; row++) {
    const cells: [number, number][] = [];
    for (let col = 0; col < 9; col++) {
      if (board[row][col].value === null && board[row][col].notes.size > 0) {
        cells.push([row, col]);
      }
    }
    yield { type: 'Row', index: row, cells };
  }

  // Columns
  for (let col = 0; col < 9; col++) {
    const cells: [number, number][] = [];
    for (let row = 0; row < 9; row++) {
      if (board[row][col].value === null && board[row][col].notes.size > 0) {
        cells.push([row, col]);
      }
    }
    yield { type: 'Column', index: col, cells };
  }

  // Boxes
  for (let box = 0; box < 9; box++) {
    const boxRow = Math.floor(box / 3) * 3;
    const boxCol = (box % 3) * 3;
    const cells: [number, number][] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const row = boxRow + r;
        const col = boxCol + c;
        if (board[row][col].value === null && board[row][col].notes.size > 0) {
          cells.push([row, col]);
        }
      }
    }
    yield { type: 'Box', index: box, cells };
  }
}

function unitLabel(type: UnitType, index: number): string {
  switch (type) {
    case 'Row': return `row ${index + 1}`;
    case 'Column': return `column ${index + 1}`;
    case 'Box': return `box ${index + 1}`;
  }
}

function sameBox(r1: number, c1: number, r2: number, c2: number): boolean {
  return Math.floor(r1 / 3) === Math.floor(r2 / 3) &&
         Math.floor(c1 / 3) === Math.floor(c2 / 3);
}

function sees(r1: number, c1: number, r2: number, c2: number): boolean {
  return r1 === r2 || c1 === c2 || sameBox(r1, c1, r2, c2);
}

// ---------------------------------------------------------------------------
// SPEC: Existing — Naked Single
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SPEC: Existing — Hidden Single
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SPEC: Existing — Pointing Pair
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SPEC-017: Claiming (Box-Line Reduction)
// ---------------------------------------------------------------------------

function findClaiming(board: GameBoard): HintStep | null {
  // Check rows
  for (let row = 0; row < 9; row++) {
    for (let num = 1; num <= 9; num++) {
      const boxes = new Set<number>();
      const positions: [number, number][] = [];

      for (let col = 0; col < 9; col++) {
        const cell = board[row][col];
        if (cell.value === null && cell.notes.has(num)) {
          boxes.add(Math.floor(col / 3));
          positions.push([row, col]);
        }
      }

      if (positions.length < 2 || boxes.size !== 1) continue;

      const boxCol = Array.from(boxes)[0];
      const boxRow = Math.floor(row / 3);
      const boxIndex = boxRow * 3 + boxCol;

      const eliminations: { row: number; col: number; eliminated: number[] }[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const br = boxRow * 3 + r;
          const bc = boxCol * 3 + c;
          if (br === row) continue; // Same row as the claiming cells
          const cell = board[br][bc];
          if (cell.value === null && cell.notes.has(num)) {
            eliminations.push({ row: br, col: bc, eliminated: [num] });
          }
        }
      }

      if (eliminations.length > 0) {
        return {
          technique: 'Claiming',
          description: `Eliminate ${num} from box ${boxIndex + 1}`,
          explanation: `In row ${row + 1}, the number ${num} can only appear in box ${boxIndex + 1}. Therefore, ${num} can be eliminated from other cells in box ${boxIndex + 1} that are not in row ${row + 1}.`,
          affectedCells: eliminations,
        };
      }
    }
  }

  // Check columns
  for (let col = 0; col < 9; col++) {
    for (let num = 1; num <= 9; num++) {
      const boxes = new Set<number>();
      const positions: [number, number][] = [];

      for (let row = 0; row < 9; row++) {
        const cell = board[row][col];
        if (cell.value === null && cell.notes.has(num)) {
          boxes.add(Math.floor(row / 3));
          positions.push([row, col]);
        }
      }

      if (positions.length < 2 || boxes.size !== 1) continue;

      const boxRow = Array.from(boxes)[0];
      const boxCol = Math.floor(col / 3);
      const boxIndex = boxRow * 3 + boxCol;

      const eliminations: { row: number; col: number; eliminated: number[] }[] = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const br = boxRow * 3 + r;
          const bc = boxCol * 3 + c;
          if (bc === col) continue; // Same column as the claiming cells
          const cell = board[br][bc];
          if (cell.value === null && cell.notes.has(num)) {
            eliminations.push({ row: br, col: bc, eliminated: [num] });
          }
        }
      }

      if (eliminations.length > 0) {
        return {
          technique: 'Claiming',
          description: `Eliminate ${num} from box ${boxIndex + 1}`,
          explanation: `In column ${col + 1}, the number ${num} can only appear in box ${boxIndex + 1}. Therefore, ${num} can be eliminated from other cells in box ${boxIndex + 1} that are not in column ${col + 1}.`,
          affectedCells: eliminations,
        };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// SPEC-013: Naked Pair (fixed — rows, columns, boxes)
// ---------------------------------------------------------------------------

function findNakedPair(board: GameBoard): HintStep | null {
  for (const unit of allUnits(board)) {
    const pairs: [number, number, Set<number>][] = []; // [row, col, notes]

    for (const [row, col] of unit.cells) {
      const notes = board[row][col].notes;
      if (notes.size === 2) {
        pairs.push([row, col, notes]);
      }
    }

    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const [r1, c1, notes1] = pairs[i];
        const [r2, c2, notes2] = pairs[j];

        if (notes1.size === notes2.size &&
            Array.from(notes1).every(n => notes2.has(n))) {
          const nums = Array.from(notes1).sort((a, b) => a - b);
          const eliminations: { row: number; col: number; eliminated: number[] }[] = [];

          for (const [row, col] of unit.cells) {
            if ((row === r1 && col === c1) || (row === r2 && col === c2)) continue;
            const cell = board[row][col];
            if (cell.value === null) {
              const toEliminate = nums.filter(n => cell.notes.has(n));
              if (toEliminate.length > 0) {
                eliminations.push({ row, col, eliminated: toEliminate });
              }
            }
          }

          if (eliminations.length > 0) {
            return {
              technique: `Naked Pair (${unit.type})`,
              description: `Eliminate {${nums.join(',')}} from ${unitLabel(unit.type, unit.index)}`,
              explanation: `Cells R${r1 + 1}C${c1 + 1} and R${r2 + 1}C${c2 + 1} both contain only candidates {${nums.join(',')}}. These two numbers must go in these two cells, so they can be eliminated from other cells in ${unitLabel(unit.type, unit.index)}.`,
              affectedCells: eliminations,
            };
          }
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// SPEC-014: Hidden Pair
// ---------------------------------------------------------------------------

function findHiddenPair(board: GameBoard): HintStep | null {
  for (const unit of allUnits(board)) {
    // Build a map: candidate → list of (row, col) positions in this unit
    const candidatePositions = new Map<number, [number, number][]>();
    for (const [row, col] of unit.cells) {
      for (const n of board[row][col].notes) {
        if (!candidatePositions.has(n)) candidatePositions.set(n, []);
        candidatePositions.get(n)!.push([row, col]);
      }
    }

    // Find pairs of candidates that appear in exactly 2 cells, same 2 cells
    const candidates = Array.from(candidatePositions.keys()).sort((a, b) => a - b);
    for (let i = 0; i < candidates.length; i++) {
      const a = candidates[i];
      const posA = candidatePositions.get(a)!;
      if (posA.length !== 2) continue;

      for (let j = i + 1; j < candidates.length; j++) {
        const b = candidates[j];
        const posB = candidatePositions.get(b)!;
        if (posB.length !== 2) continue;

        // Check if same two cells
        if (posA[0][0] !== posB[0][0] || posA[0][1] !== posB[0][1] ||
            posA[1][0] !== posB[1][0] || posA[1][1] !== posB[1][1]) continue;

        const [r1, c1] = posA[0];
        const [r2, c2] = posA[1];
        const pairSet = new Set([a, b]);

        // Check if at least one cell has extra candidates
        const elim1 = Array.from(board[r1][c1].notes).filter(n => !pairSet.has(n)).sort((x, y) => x - y);
        const elim2 = Array.from(board[r2][c2].notes).filter(n => !pairSet.has(n)).sort((x, y) => x - y);

        if (elim1.length === 0 && elim2.length === 0) continue; // Already a naked pair

        const affectedCells: { row: number; col: number; eliminated: number[] }[] = [];
        if (elim1.length > 0) affectedCells.push({ row: r1, col: c1, eliminated: elim1 });
        if (elim2.length > 0) affectedCells.push({ row: r2, col: c2, eliminated: elim2 });

        return {
          technique: `Hidden Pair (${unit.type})`,
          description: `Hidden Pair {${a},${b}} in ${unitLabel(unit.type, unit.index)}`,
          explanation: `In ${unitLabel(unit.type, unit.index)}, candidates ${a} and ${b} can only appear in cells R${r1 + 1}C${c1 + 1} and R${r2 + 1}C${c2 + 1}. These two cells must contain ${a} and ${b}, so all other candidates can be eliminated from them.`,
          affectedCells,
        };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// SPEC-015: Naked Triple
// ---------------------------------------------------------------------------

function findNakedTriple(board: GameBoard): HintStep | null {
  for (const unit of allUnits(board)) {
    // Collect cells with 2 or 3 candidates
    const eligible: [number, number, Set<number>][] = [];
    for (const [row, col] of unit.cells) {
      const notes = board[row][col].notes;
      if (notes.size === 2 || notes.size === 3) {
        eligible.push([row, col, notes]);
      }
    }

    // Try all combinations of 3
    for (let i = 0; i < eligible.length; i++) {
      for (let j = i + 1; j < eligible.length; j++) {
        for (let k = j + 1; k < eligible.length; k++) {
          const [r1, c1, n1] = eligible[i];
          const [r2, c2, n2] = eligible[j];
          const [r3, c3, n3] = eligible[k];

          // Compute union
          const union = new Set([...n1, ...n2, ...n3]);
          if (union.size !== 3) continue;

          const tripleNums = Array.from(union).sort((a, b) => a - b);
          const tripleSet = new Set([[r1, c1], [r2, c2], [r3, c3]].map(([r, c]) => `${r},${c}`));

          const eliminations: { row: number; col: number; eliminated: number[] }[] = [];
          for (const [row, col] of unit.cells) {
            if (tripleSet.has(`${row},${col}`)) continue;
            const cell = board[row][col];
            if (cell.value === null) {
              const toEliminate = tripleNums.filter(n => cell.notes.has(n));
              if (toEliminate.length > 0) {
                eliminations.push({ row, col, eliminated: toEliminate });
              }
            }
          }

          if (eliminations.length > 0) {
            return {
              technique: `Naked Triple (${unit.type})`,
              description: `Naked Triple {${tripleNums.join(',')}} in ${unitLabel(unit.type, unit.index)}`,
              explanation: `Cells R${r1 + 1}C${c1 + 1}, R${r2 + 1}C${c2 + 1}, and R${r3 + 1}C${c3 + 1} together contain only candidates {${tripleNums.join(',')}}. These three numbers must go in these three cells, so they can be eliminated from other cells in ${unitLabel(unit.type, unit.index)}.`,
              affectedCells: eliminations,
            };
          }
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// SPEC-016: Hidden Triple
// ---------------------------------------------------------------------------

function findHiddenTriple(board: GameBoard): HintStep | null {
  for (const unit of allUnits(board)) {
    // Build candidate → positions map
    const candidatePositions = new Map<number, [number, number][]>();
    for (const [row, col] of unit.cells) {
      for (const n of board[row][col].notes) {
        if (!candidatePositions.has(n)) candidatePositions.set(n, []);
        candidatePositions.get(n)!.push([row, col]);
      }
    }

    // Candidates that appear in 2 or 3 cells (eligible for hidden triple)
    const eligible = Array.from(candidatePositions.entries())
      .filter(([, pos]) => pos.length >= 2 && pos.length <= 3)
      .map(([n]) => n)
      .sort((a, b) => a - b);

    // Try all combinations of 3 candidates
    for (let i = 0; i < eligible.length; i++) {
      for (let j = i + 1; j < eligible.length; j++) {
        for (let k = j + 1; k < eligible.length; k++) {
          const a = eligible[i], b = eligible[j], c = eligible[k];
          const tripleSet = new Set([a, b, c]);

          // Union of cells containing any of a, b, c
          const cellSet = new Set<string>();
          for (const n of [a, b, c]) {
            for (const [r, col] of candidatePositions.get(n)!) {
              cellSet.add(`${r},${col}`);
            }
          }

          if (cellSet.size !== 3) continue;

          // Parse cells back
          const cells = Array.from(cellSet).map(s => {
            const [r, col] = s.split(',').map(Number);
            return [r, col] as [number, number];
          });

          // Check if at least one cell has candidates outside the triple
          const affectedCells: { row: number; col: number; eliminated: number[] }[] = [];
          for (const [r, col] of cells) {
            const eliminated = Array.from(board[r][col].notes)
              .filter(n => !tripleSet.has(n))
              .sort((x, y) => x - y);
            if (eliminated.length > 0) {
              affectedCells.push({ row: r, col, eliminated });
            }
          }

          if (affectedCells.length === 0) continue; // Already a naked triple

          return {
            technique: `Hidden Triple (${unit.type})`,
            description: `Hidden Triple {${a},${b},${c}} in ${unitLabel(unit.type, unit.index)}`,
            explanation: `In ${unitLabel(unit.type, unit.index)}, candidates ${a}, ${b}, and ${c} can only appear in cells ${cells.map(([r, col]) => `R${r + 1}C${col + 1}`).join(', ')}. These three cells must contain those values, so all other candidates can be eliminated from them.`,
            affectedCells,
          };
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// SPEC-018: X-Wing
// ---------------------------------------------------------------------------

function findXWing(board: GameBoard): HintStep | null {
  // Row-based X-Wing
  for (let num = 1; num <= 9; num++) {
    // Find rows where num appears in exactly 2 columns
    const rowPositions: Map<number, number[]> = new Map();
    for (let row = 0; row < 9; row++) {
      const cols: number[] = [];
      for (let col = 0; col < 9; col++) {
        if (board[row][col].value === null && board[row][col].notes.has(num)) {
          cols.push(col);
        }
      }
      if (cols.length === 2) {
        rowPositions.set(row, cols);
      }
    }

    const rows = Array.from(rowPositions.keys()).sort((a, b) => a - b);
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        const r1 = rows[i], r2 = rows[j];
        const cols1 = rowPositions.get(r1)!;
        const cols2 = rowPositions.get(r2)!;

        if (cols1[0] !== cols2[0] || cols1[1] !== cols2[1]) continue;

        const c1 = cols1[0], c2 = cols1[1];

        const eliminations: { row: number; col: number; eliminated: number[] }[] = [];
        for (let row = 0; row < 9; row++) {
          if (row === r1 || row === r2) continue;
          for (const col of [c1, c2]) {
            if (board[row][col].value === null && board[row][col].notes.has(num)) {
              eliminations.push({ row, col, eliminated: [num] });
            }
          }
        }

        if (eliminations.length > 0) {
          const links: CandidateLink[] = [
            { from: { row: r1, col: c1, candidate: num }, to: { row: r1, col: c2, candidate: num }, type: 'strong' },
            { from: { row: r1, col: c2, candidate: num }, to: { row: r2, col: c2, candidate: num }, type: 'strong' },
            { from: { row: r2, col: c2, candidate: num }, to: { row: r2, col: c1, candidate: num }, type: 'strong' },
            { from: { row: r2, col: c1, candidate: num }, to: { row: r1, col: c1, candidate: num }, type: 'strong' },
          ];

          return {
            technique: 'X-Wing',
            description: `X-Wing on ${num} in rows ${r1 + 1},${r2 + 1} / columns ${c1 + 1},${c2 + 1}`,
            explanation: `Candidate ${num} appears in exactly two cells in both row ${r1 + 1} and row ${r2 + 1}, and those cells share columns ${c1 + 1} and ${c2 + 1}. This forms a rectangle — ${num} must occupy two diagonal corners, so it can be eliminated from other cells in columns ${c1 + 1} and ${c2 + 1}.`,
            affectedCells: eliminations,
            links,
          };
        }
      }
    }

    // Column-based X-Wing
    const colPositions: Map<number, number[]> = new Map();
    for (let col = 0; col < 9; col++) {
      const rowsForCol: number[] = [];
      for (let row = 0; row < 9; row++) {
        if (board[row][col].value === null && board[row][col].notes.has(num)) {
          rowsForCol.push(row);
        }
      }
      if (rowsForCol.length === 2) {
        colPositions.set(col, rowsForCol);
      }
    }

    const colKeys = Array.from(colPositions.keys()).sort((a, b) => a - b);
    for (let i = 0; i < colKeys.length; i++) {
      for (let j = i + 1; j < colKeys.length; j++) {
        const c1 = colKeys[i], c2 = colKeys[j];
        const rows1 = colPositions.get(c1)!;
        const rows2 = colPositions.get(c2)!;

        if (rows1[0] !== rows2[0] || rows1[1] !== rows2[1]) continue;

        const r1 = rows1[0], r2 = rows1[1];

        const eliminations: { row: number; col: number; eliminated: number[] }[] = [];
        for (let col = 0; col < 9; col++) {
          if (col === c1 || col === c2) continue;
          for (const row of [r1, r2]) {
            if (board[row][col].value === null && board[row][col].notes.has(num)) {
              eliminations.push({ row, col, eliminated: [num] });
            }
          }
        }

        if (eliminations.length > 0) {
          const links: CandidateLink[] = [
            { from: { row: r1, col: c1, candidate: num }, to: { row: r1, col: c2, candidate: num }, type: 'strong' },
            { from: { row: r1, col: c2, candidate: num }, to: { row: r2, col: c2, candidate: num }, type: 'strong' },
            { from: { row: r2, col: c2, candidate: num }, to: { row: r2, col: c1, candidate: num }, type: 'strong' },
            { from: { row: r2, col: c1, candidate: num }, to: { row: r1, col: c1, candidate: num }, type: 'strong' },
          ];

          return {
            technique: 'X-Wing',
            description: `X-Wing on ${num} in columns ${c1 + 1},${c2 + 1} / rows ${r1 + 1},${r2 + 1}`,
            explanation: `Candidate ${num} appears in exactly two cells in both column ${c1 + 1} and column ${c2 + 1}, and those cells share rows ${r1 + 1} and ${r2 + 1}. This forms a rectangle — ${num} must occupy two diagonal corners, so it can be eliminated from other cells in rows ${r1 + 1} and ${r2 + 1}.`,
            affectedCells: eliminations,
            links,
          };
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// SPEC-019: Swordfish
// ---------------------------------------------------------------------------

function findSwordfish(board: GameBoard): HintStep | null {
  // Row-based Swordfish
  for (let num = 1; num <= 9; num++) {
    // Find rows where num appears in 2-3 columns
    const rowPositions: Map<number, number[]> = new Map();
    for (let row = 0; row < 9; row++) {
      const cols: number[] = [];
      for (let col = 0; col < 9; col++) {
        if (board[row][col].value === null && board[row][col].notes.has(num)) {
          cols.push(col);
        }
      }
      if (cols.length >= 2 && cols.length <= 3) {
        rowPositions.set(row, cols);
      }
    }

    const rows = Array.from(rowPositions.keys()).sort((a, b) => a - b);
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) {
        for (let k = j + 1; k < rows.length; k++) {
          const r1 = rows[i], r2 = rows[j], r3 = rows[k];
          const colUnion = new Set([
            ...rowPositions.get(r1)!,
            ...rowPositions.get(r2)!,
            ...rowPositions.get(r3)!,
          ]);

          if (colUnion.size !== 3) continue;

          const fishCols = Array.from(colUnion).sort((a, b) => a - b);
          const fishRows = [r1, r2, r3];

          const eliminations: { row: number; col: number; eliminated: number[] }[] = [];
          for (const col of fishCols) {
            for (let row = 0; row < 9; row++) {
              if (fishRows.includes(row)) continue;
              if (board[row][col].value === null && board[row][col].notes.has(num)) {
                eliminations.push({ row, col, eliminated: [num] });
              }
            }
          }

          if (eliminations.length > 0) {
            // Build links: connect cells within each row and within each column
            const links: CandidateLink[] = [];
            for (const row of fishRows) {
              const positions = rowPositions.get(row)!.filter(c => fishCols.includes(c));
              for (let p = 0; p < positions.length - 1; p++) {
                links.push({
                  from: { row, col: positions[p], candidate: num },
                  to: { row, col: positions[p + 1], candidate: num },
                  type: 'strong',
                });
              }
            }

            return {
              technique: 'Swordfish',
              description: `Swordfish on ${num} in rows ${fishRows.map(r => r + 1).join(',')} / columns ${fishCols.map(c => c + 1).join(',')}`,
              explanation: `Candidate ${num} forms a Swordfish pattern across rows ${fishRows.map(r => r + 1).join(', ')} and columns ${fishCols.map(c => c + 1).join(', ')}. In each row, ${num} can only appear in these columns. Therefore, ${num} can be eliminated from other cells in columns ${fishCols.map(c => c + 1).join(', ')}.`,
              affectedCells: eliminations,
              links,
            };
          }
        }
      }
    }

    // Column-based Swordfish
    const colPositions: Map<number, number[]> = new Map();
    for (let col = 0; col < 9; col++) {
      const rowsForCol: number[] = [];
      for (let row = 0; row < 9; row++) {
        if (board[row][col].value === null && board[row][col].notes.has(num)) {
          rowsForCol.push(row);
        }
      }
      if (rowsForCol.length >= 2 && rowsForCol.length <= 3) {
        colPositions.set(col, rowsForCol);
      }
    }

    const colKeys = Array.from(colPositions.keys()).sort((a, b) => a - b);
    for (let i = 0; i < colKeys.length; i++) {
      for (let j = i + 1; j < colKeys.length; j++) {
        for (let k = j + 1; k < colKeys.length; k++) {
          const c1 = colKeys[i], c2 = colKeys[j], c3 = colKeys[k];
          const rowUnion = new Set([
            ...colPositions.get(c1)!,
            ...colPositions.get(c2)!,
            ...colPositions.get(c3)!,
          ]);

          if (rowUnion.size !== 3) continue;

          const fishRows = Array.from(rowUnion).sort((a, b) => a - b);
          const fishCols = [c1, c2, c3];

          const eliminations: { row: number; col: number; eliminated: number[] }[] = [];
          for (const row of fishRows) {
            for (let col = 0; col < 9; col++) {
              if (fishCols.includes(col)) continue;
              if (board[row][col].value === null && board[row][col].notes.has(num)) {
                eliminations.push({ row, col, eliminated: [num] });
              }
            }
          }

          if (eliminations.length > 0) {
            const links: CandidateLink[] = [];
            for (const col of fishCols) {
              const positions = colPositions.get(col)!.filter(r => fishRows.includes(r));
              for (let p = 0; p < positions.length - 1; p++) {
                links.push({
                  from: { row: positions[p], col, candidate: num },
                  to: { row: positions[p + 1], col, candidate: num },
                  type: 'strong',
                });
              }
            }

            return {
              technique: 'Swordfish',
              description: `Swordfish on ${num} in columns ${fishCols.map(c => c + 1).join(',')} / rows ${fishRows.map(r => r + 1).join(',')}`,
              explanation: `Candidate ${num} forms a Swordfish pattern across columns ${fishCols.map(c => c + 1).join(', ')} and rows ${fishRows.map(r => r + 1).join(', ')}. In each column, ${num} can only appear in these rows. Therefore, ${num} can be eliminated from other cells in rows ${fishRows.map(r => r + 1).join(', ')}.`,
              affectedCells: eliminations,
              links,
            };
          }
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// SPEC-020: XY-Wing
// ---------------------------------------------------------------------------

function findXYWing(board: GameBoard): HintStep | null {
  // Collect all cells with exactly 2 candidates
  const biValueCells: [number, number, Set<number>][] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = board[row][col];
      if (cell.value === null && cell.notes.size === 2) {
        biValueCells.push([row, col, cell.notes]);
      }
    }
  }

  // For each potential pivot
  for (const [pr, pc, pivotNotes] of biValueCells) {
    const [x, y] = Array.from(pivotNotes).sort((a, b) => a - b);

    // Find wing candidates among peers of the pivot
    const wing1Candidates: [number, number, number][] = []; // [row, col, z] where wing has {x, z}
    const wing2Candidates: [number, number, number][] = []; // [row, col, z] where wing has {y, z}

    for (const [wr, wc, wingNotes] of biValueCells) {
      if (wr === pr && wc === pc) continue;
      if (!sees(pr, pc, wr, wc)) continue;

      const wingArr = Array.from(wingNotes).sort((a, b) => a - b);
      if (wingNotes.has(x) && !wingNotes.has(y)) {
        const z = wingArr[0] === x ? wingArr[1] : wingArr[0];
        wing1Candidates.push([wr, wc, z]);
      }
      if (wingNotes.has(y) && !wingNotes.has(x)) {
        const z = wingArr[0] === y ? wingArr[1] : wingArr[0];
        wing2Candidates.push([wr, wc, z]);
      }
    }

    // Try all wing1 + wing2 combinations
    for (const [w1r, w1c, z1] of wing1Candidates) {
      for (const [w2r, w2c, z2] of wing2Candidates) {
        if (z1 !== z2) continue; // Wings must share the same Z
        if (w1r === w2r && w1c === w2c) continue; // Must be different cells

        const z = z1;

        // Find cells that see both wings and have Z
        const eliminations: { row: number; col: number; eliminated: number[] }[] = [];
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            if (row === pr && col === pc) continue;
            if (row === w1r && col === w1c) continue;
            if (row === w2r && col === w2c) continue;
            const cell = board[row][col];
            if (cell.value === null && cell.notes.has(z) &&
                sees(row, col, w1r, w1c) && sees(row, col, w2r, w2c)) {
              eliminations.push({ row, col, eliminated: [z] });
            }
          }
        }

        if (eliminations.length > 0) {
          const links: CandidateLink[] = [
            { from: { row: pr, col: pc, candidate: x }, to: { row: w1r, col: w1c, candidate: x }, type: 'strong' },
            { from: { row: pr, col: pc, candidate: y }, to: { row: w2r, col: w2c, candidate: y }, type: 'strong' },
          ];

          const pivotArr = Array.from(pivotNotes).sort((a, b) => a - b);
          const w1Notes = Array.from(board[w1r][w1c].notes).sort((a, b) => a - b);
          const w2Notes = Array.from(board[w2r][w2c].notes).sort((a, b) => a - b);

          return {
            technique: 'XY-Wing',
            description: `XY-Wing: pivot R${pr + 1}C${pc + 1} ({${pivotArr.join(',')}}), wings R${w1r + 1}C${w1c + 1} ({${w1Notes.join(',')}}) and R${w2r + 1}C${w2c + 1} ({${w2Notes.join(',')}}) → eliminate ${z}`,
            explanation: `R${pr + 1}C${pc + 1} (pivot) has candidates {${pivotArr.join(',')}}. It sees R${w1r + 1}C${w1c + 1} ({${w1Notes.join(',')}}) and R${w2r + 1}C${w2c + 1} ({${w2Notes.join(',')}}). The pivot must be ${x} or ${y} — either way, one wing becomes ${z}. So ${z} can be eliminated from any cell that sees both wings.`,
            affectedCells: eliminations,
            links,
          };
        }
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Fallback: Solution Check
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Cascade: getHint (simplest technique first)
// ---------------------------------------------------------------------------

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
    findClaiming(board) ??
    findNakedPair(board) ??
    findHiddenPair(board) ??
    findNakedTriple(board) ??
    findHiddenTriple(board) ??
    findXWing(board) ??
    findSwordfish(board) ??
    findXYWing(board) ??
    findSolutionHint(board)
  );
}
