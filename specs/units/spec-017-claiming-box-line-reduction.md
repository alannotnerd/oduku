# Claiming (Box-Line Reduction)

- **Unit ID**: `SPEC-017`
- **Category**: behavior
- **Priority**: standard
- **Purpose**: Implement the Claiming (Box-Line Reduction) technique, which is the reverse of Pointing Pair. When a candidate in a row or column is confined to a single box, that candidate can be eliminated from all other cells in that box (outside the row/column).
- **Scope**:
  - Included:
    - Detect claiming patterns in rows (candidate confined to one box within a row).
    - Detect claiming patterns in columns (candidate confined to one box within a column).
    - Return eliminations from the rest of the box.
    - Add technique weight to `score.ts`.
  - Excluded:
    - Pointing Pair (already implemented — that technique goes box→line; this goes line→box).
- **Dependencies**: None.

## Preconditions
- The board is a valid `GameBoard` with candidates populated for all empty cells.

## Behavior

### Definition
A **Claiming** (Box-Line Reduction) occurs when:
1. A candidate `n` appears in a row (or column).
2. All occurrences of `n` in that row (or column) fall within a single box.
3. Other cells in that box (outside the row/column) also contain `n`.

In this case, `n` can be eliminated from those other cells in the box.

### Distinction from Pointing Pair
- **Pointing Pair**: Starts from a box, observes a candidate is confined to one row/col, eliminates from the rest of that row/col.
- **Claiming**: Starts from a row/col, observes a candidate is confined to one box, eliminates from the rest of that box.

### Return Value
The function MUST return a `HintStep` with:
- `technique`: `"Claiming"`.
- `description`: `"Eliminate <n> from box <box-number>"` where box-number is 1-9 (left-to-right, top-to-bottom).
- `explanation`: A user-friendly sentence explaining that candidate `n` in row/column X is confined to box Y, so it can be removed from other cells in box Y.
- `affectedCells`: Cells in the box (outside the originating row/column) from which `n` is eliminated. Each entry has `row`, `col`, `eliminated: [n]`.

### Search Order
Search rows first (0-8), then columns (0-8). For each row/column, check candidates 1-9. The FIRST claiming pattern producing at least one elimination is returned.

### No-Result Condition
If no claiming pattern producing eliminations exists, return `null`.

## Postconditions
- Each affected cell is in the same box as the claiming cells but NOT in the same row/column.
- Each affected cell had `n` in its notes.

## Invariants
- The claiming cells (the ones in the row/column within the box) are never in `affectedCells`.
- `eliminated` always contains exactly one value: the claimed candidate.

## Error Conditions

| Trigger | Expected Behavior |
|---------|-------------------|
| No row or column has a candidate confined to a single box with further eliminations | Return `null` |
| A candidate is confined to one box in a row but no other cell in that box has the candidate | Skip, continue |

## Examples

### Example A — Row Claiming
Given row 2: candidate 5 appears only in R2C1 and R2C3 (both in box 1).
Box 1 also has R1C2 notes containing 5 and R3C1 notes containing 5.

The function returns:
```
technique: "Claiming"
description: "Eliminate 5 from box 1"
explanation: "In row 2, the number 5 can only appear in box 1. Therefore, 5 can be eliminated from other cells in box 1 that are not in row 2."
affectedCells: [
  { row: 0, col: 1, eliminated: [5] },
  { row: 2, col: 0, eliminated: [5] }
]
```

### Example B — Column Claiming
Given column 6: candidate 3 appears only in R4C6 and R5C6 (both in box 5, rows 3-5 cols 6-8).
Box 5 also has R3C7 notes containing 3.

The function returns:
```
technique: "Claiming"
description: "Eliminate 3 from box 6"
explanation: "In column 6, the number 3 can only appear in box 6. Therefore, 3 can be eliminated from other cells in box 6 that are not in column 6."
affectedCells: [
  { row: 2, col: 6, eliminated: [3] }
]
```
(Note: Box numbering here — cols 6-8 rows 3-5 is box 6 in 1-based indexing.)

## Score Weight
`"Claiming"`: weight `50` in `TECHNIQUE_WEIGHTS` (same complexity as Pointing Pair).

## Related Units
- Pointing Pair (existing code) — the reverse direction.
