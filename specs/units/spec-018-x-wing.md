# X-Wing

- **Unit ID**: `SPEC-018`
- **Category**: behavior
- **Priority**: standard
- **Purpose**: Implement the X-Wing solving technique. An X-Wing pattern occurs when a candidate appears in exactly 2 cells in each of 2 rows, and those 4 cells share exactly 2 columns (forming a rectangle). The candidate can then be eliminated from all other cells in those 2 columns. The same logic applies with rows and columns swapped.
- **Scope**:
  - Included:
    - Detect X-Wing patterns in rows (eliminate from columns).
    - Detect X-Wing patterns in columns (eliminate from rows).
    - Provide `links` array showing the rectangular pattern.
    - Add technique weight to `score.ts`.
  - Excluded:
    - Swordfish (SPEC-019) — the 3-row generalization.
- **Dependencies**: None.

## Preconditions
- The board is a valid `GameBoard` with candidates populated for all empty cells.

## Behavior

### Definition (Row-based)
An **X-Wing** on candidate `n` occurs when:
1. In row `r1`, candidate `n` appears in exactly 2 columns: `c1` and `c2`.
2. In row `r2` (r2 > r1), candidate `n` appears in exactly 2 columns: the same `c1` and `c2`.
3. At least one other cell in column `c1` or `c2` (outside rows r1, r2) contains candidate `n`.

Elimination: Remove `n` from all cells in columns `c1` and `c2` that are NOT in rows r1 or r2.

### Definition (Column-based)
The symmetric case: candidate `n` appears in exactly 2 rows in each of 2 columns, and those rows match. Eliminate from those rows outside the 2 columns.

### Return Value
The function MUST return a `HintStep` with:
- `technique`: `"X-Wing"`.
- `description`: `"X-Wing on <n> in rows <r1>,<r2> / columns <c1>,<c2>"` (or the transposed version for column-based).
- `explanation`: A user-friendly explanation of the rectangular pattern and why eliminations follow.
- `affectedCells`: Cells from which `n` is eliminated. Each has `row`, `col`, `eliminated: [n]`.
- `links`: An array of 4 `CandidateLink` entries forming the rectangle:
  - (r1,c1)→(r1,c2) strong link
  - (r1,c2)→(r2,c2) strong link
  - (r2,c2)→(r2,c1) strong link
  - (r2,c1)→(r1,c1) strong link

### Search Order
1. Row-based: For each candidate 1-9, for each pair of rows (r1 < r2), check if both rows have exactly 2 positions for the candidate and those positions match.
2. Column-based: Same logic transposed.
The FIRST X-Wing producing at least one elimination is returned.

### No-Result Condition
Return `null` if no X-Wing producing eliminations is found.

## Postconditions
- Each affected cell is in one of the two X-Wing columns (or rows for column-based) but NOT in either X-Wing row (or column).
- The 4 corner cells of the X-Wing are never in `affectedCells`.

## Invariants
- The `links` array always has exactly 4 entries forming a closed rectangle.
- All 4 links have `type: 'strong'`.
- The candidate in all links is `n`.

## Error Conditions

| Trigger | Expected Behavior |
|---------|-------------------|
| No candidate appears in exactly 2 positions in 2 rows sharing the same columns | Return `null` |
| X-Wing exists but no other cells in those columns contain the candidate | Skip, continue |

## Examples

### Example A — Row-based X-Wing
Candidate 6 appears in exactly 2 cells in row 1 (cols 2,7) and exactly 2 cells in row 5 (cols 2,7).
Column 2 also has candidate 6 in row 8. Column 7 also has candidate 6 in rows 3,8.

The function returns:
```
technique: "X-Wing"
description: "X-Wing on 6 in rows 2,6 / columns 3,8"
affectedCells: [
  { row: 7, col: 1, eliminated: [6] },
  { row: 2, col: 6, eliminated: [6] },
  { row: 7, col: 6, eliminated: [6] }
]
links: [
  { from: {row:0,col:1,candidate:6}, to: {row:0,col:6,candidate:6}, type:'strong' },
  { from: {row:0,col:6,candidate:6}, to: {row:4,col:6,candidate:6}, type:'strong' },
  { from: {row:4,col:6,candidate:6}, to: {row:4,col:1,candidate:6}, type:'strong' },
  { from: {row:4,col:1,candidate:6}, to: {row:0,col:1,candidate:6}, type:'strong' }
]
```
(Display labels are 1-based; data indices are 0-based.)

## Score Weight
`"X-Wing"`: weight `120` in `TECHNIQUE_WEIGHTS`.

## Related Units
- SPEC-019 (Swordfish) — generalizes X-Wing to 3 rows/columns.
