# Swordfish

- **Unit ID**: `SPEC-019`
- **Category**: behavior
- **Priority**: standard
- **Purpose**: Implement the Swordfish solving technique, which generalizes X-Wing from 2 rows/columns to 3. A Swordfish occurs when a candidate appears in 2 or 3 cells in each of 3 rows, and the union of the columns containing those cells totals exactly 3 columns. The candidate can be eliminated from all other cells in those 3 columns.
- **Scope**:
  - Included:
    - Detect Swordfish patterns in rows (eliminate from columns).
    - Detect Swordfish patterns in columns (eliminate from rows).
    - Provide `links` array showing the pattern connections.
    - Add technique weight to `score.ts`.
  - Excluded:
    - Jellyfish (4-row generalization) — not in scope.
- **Dependencies**: None.

## Preconditions
- The board is a valid `GameBoard` with candidates populated for all empty cells.

## Behavior

### Definition (Row-based)
A **Swordfish** on candidate `n` occurs when:
1. There exist 3 rows (r1, r2, r3) where candidate `n` appears in 2 or 3 positions each.
2. The union of the columns where `n` appears across all 3 rows contains exactly 3 columns (c1, c2, c3).
3. At least one cell in those 3 columns (outside rows r1, r2, r3) contains candidate `n`.

Elimination: Remove `n` from all cells in columns c1, c2, c3 that are NOT in rows r1, r2, or r3.

### Definition (Column-based)
The symmetric case: 3 columns where candidate `n` appears in 2-3 positions, and the union of rows is exactly 3. Eliminate from those rows outside the 3 columns.

### Return Value
The function MUST return a `HintStep` with:
- `technique`: `"Swordfish"`.
- `description`: `"Swordfish on <n> in rows <r1>,<r2>,<r3> / columns <c1>,<c2>,<c3>"` (or transposed).
- `explanation`: A user-friendly explanation of the pattern and why eliminations follow.
- `affectedCells`: Cells from which `n` is eliminated. Each has `row`, `col`, `eliminated: [n]`.
- `links`: An array of `CandidateLink` entries connecting the cells that form the Swordfish pattern. For each row in the pattern, create strong links between the cells in that row. For each column in the pattern, create strong links between the cells in that column. This visualizes the "fish" grid.

### Search Order
1. Row-based: For each candidate 1-9, find all rows where the candidate appears in 2-3 positions. For each combination of 3 such rows, check if the union of columns is exactly 3.
2. Column-based: Same logic transposed.
The FIRST Swordfish producing at least one elimination is returned.

### No-Result Condition
Return `null` if no Swordfish producing eliminations is found.

## Postconditions
- Each affected cell is in one of the 3 Swordfish columns (or rows) but NOT in any of the 3 Swordfish rows (or columns).
- The pattern cells are never in `affectedCells`.

## Invariants
- The union of columns across the 3 rows is exactly 3 distinct values.
- Each of the 3 rows has 2 or 3 occurrences of the candidate within those columns.

## Error Conditions

| Trigger | Expected Behavior |
|---------|-------------------|
| No candidate can form a Swordfish | Return `null` |
| Swordfish exists but no eliminations | Skip, continue |

## Examples

### Example A — Row-based Swordfish
Candidate 4 positions:
- Row 0: cols {1, 5}
- Row 3: cols {1, 5, 8}
- Row 7: cols {5, 8}
Union of columns = {1, 5, 8} — size 3, valid Swordfish.

Column 1 has candidate 4 in row 6. Column 8 has candidate 4 in row 2.

The function returns:
```
technique: "Swordfish"
description: "Swordfish on 4 in rows 1,4,8 / columns 2,6,9"
affectedCells: [
  { row: 5, col: 0, eliminated: [4] },
  { row: 1, col: 7, eliminated: [4] }
]
```

## Score Weight
`"Swordfish"`: weight `150` in `TECHNIQUE_WEIGHTS`.

## Related Units
- SPEC-018 (X-Wing) — Swordfish generalizes X-Wing.
