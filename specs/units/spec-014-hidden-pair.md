# Hidden Pair

- **Unit ID**: `SPEC-014`
- **Category**: behavior
- **Priority**: critical
- **Purpose**: Implement the Hidden Pair solving technique. A Hidden Pair occurs when two candidates appear in exactly two cells within a unit and nowhere else in that unit. Those two cells can be reduced to contain ONLY those two candidates, eliminating all other candidates from them.
- **Scope**:
  - Included:
    - Detect hidden pairs in rows, columns, and boxes.
    - Return eliminations of non-pair candidates from the two cells.
    - Add technique weight to `score.ts`.
  - Excluded:
    - Hidden Singles (already in SPEC via existing code).
    - Hidden Triples (covered by SPEC-016).
- **Dependencies**: None.

## Preconditions
- The board is a valid `GameBoard` with candidates populated for all empty cells.
- At least two empty cells exist in some unit.

## Behavior

### Definition
A **Hidden Pair** in a unit (row, column, or box) consists of two candidates (a, b) such that:
1. Candidate `a` appears in exactly 2 cells in the unit.
2. Candidate `b` appears in exactly 2 cells in the unit.
3. Both `a` and `b` appear in the SAME two cells.
4. At least one of those two cells has candidates OTHER than {a, b} (otherwise there is nothing to eliminate, and the pair is already a Naked Pair).

### Elimination Rule
When a Hidden Pair is found, all candidates OTHER than the pair values MUST be eliminated from the two cells containing the pair.

### Return Value
The function MUST return a `HintStep` with:
- `technique`: One of `"Hidden Pair (Row)"`, `"Hidden Pair (Column)"`, or `"Hidden Pair (Box)"`.
- `description`: `"Hidden Pair {a,b} in <unit-type> <unit-number>"` where a,b are sorted ascending.
- `explanation`: A user-friendly sentence identifying the two cells, the pair values, and why other candidates can be eliminated.
- `affectedCells`: The two cells containing the pair. Each entry has `row`, `col`, and `eliminated` containing the candidates removed (all candidates in the cell's notes except a and b). Cells where no elimination occurs (notes already exactly {a,b}) MUST NOT appear in `affectedCells`.

### Search Order
Search units in order: rows (0-8), columns (0-8), boxes (0-8). Within a unit, enumerate candidate pairs (a,b) with a < b in ascending order. The FIRST hidden pair producing at least one elimination is returned.

### No-Result Condition
If no hidden pair producing eliminations exists, return `null`.

## Postconditions
- Each affected cell's `eliminated` array contains all candidates from that cell's notes EXCEPT the two pair values.
- The pair values are never listed in `eliminated`.

## Invariants
- If a hidden pair is found, both pair values appear in exactly 2 cells in the unit, and those cells are the same two cells.
- The `eliminated` array for each affected cell is non-empty (cells with notes already equal to {a,b} are excluded from affectedCells).

## Error Conditions

| Trigger | Expected Behavior |
|---------|-------------------|
| No unit has two candidates co-occurring in exactly 2 cells | Return `null` |
| A hidden pair exists but both cells already have notes = {a,b} | This is actually a naked pair; skip it, return `null` for hidden pair (the naked pair finder handles it) |

## Examples

### Example A — Row Hidden Pair
Given row 3:
- R3C1 notes={1,3,5,8}, R3C4 notes={1,3,6,9}
- Candidate 1 appears only in R3C1 and R3C4 in this row.
- Candidate 3 appears only in R3C1 and R3C4 in this row.

The function returns:
```
technique: "Hidden Pair (Row)"
description: "Hidden Pair {1,3} in row 3"
affectedCells: [
  { row: 2, col: 0, eliminated: [5, 8] },
  { row: 2, col: 3, eliminated: [6, 9] }
]
```
(Note: row index is 0-based in the data, 1-based in the display label.)

### Example B — Box Hidden Pair
Given box 1 (rows 0-2, cols 0-2):
- R1C2 notes={2,5,7}, R2C3 notes={2,7,8}
- Candidates 2 and 7 appear only in these two cells within the box.

The function returns:
```
technique: "Hidden Pair (Box)"
description: "Hidden Pair {2,7} in box 1"
affectedCells: [
  { row: 0, col: 1, eliminated: [5] },
  { row: 1, col: 2, eliminated: [8] }
]
```

## Score Weight
`"Hidden Pair"`: weight `60` in `TECHNIQUE_WEIGHTS`. The canonical label (stripping the parenthetical) is `"Hidden Pair"`, matching the `canonicalLabel()` function in `score.ts`.

## Related Units
- SPEC-013 (Naked Pair Fix) — Naked Pair is the complement technique.
- SPEC-016 (Hidden Triple) — generalizes to three candidates.
