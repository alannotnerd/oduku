# Fix Naked Pair to Check All Units

- **Unit ID**: `SPEC-013`
- **Category**: bug-fix
- **Priority**: critical
- **Purpose**: The existing `findNakedPair` implementation only searches rows for naked pairs. Per standard Sudoku technique definitions (sudoku.com), Naked Pair MUST be detected in all three unit types: rows, columns, and boxes. This spec mandates extending the implementation to cover columns and boxes while preserving the existing row behavior.
- **Scope**:
  - Included:
    - Detect naked pairs in columns.
    - Detect naked pairs in boxes.
    - Preserve existing naked pair detection in rows.
    - Update `technique` label to include the unit type (e.g. "Naked Pair (Row)", "Naked Pair (Column)", "Naked Pair (Box)").
  - Excluded:
    - Changing the Naked Pair weight in `score.ts` (already mapped under "Naked Pair").
    - Naked Triples (covered by SPEC-015).
- **Dependencies**: None.

## Preconditions
- The board is a valid `GameBoard` with candidates (`cell.notes`) populated for all empty cells.
- At least two empty cells exist in some unit.

## Behavior

### Definition
A **Naked Pair** in a unit (row, column, or box) consists of exactly two cells in that unit where:
1. Both cells are empty (value === null).
2. Both cells have exactly 2 candidates in their `notes` Set.
3. The two `notes` Sets contain the same two numbers.

### Elimination Rule
When a Naked Pair is found in a unit, the two paired candidates MUST be eliminated from the `notes` of all OTHER empty cells in that same unit.

### Return Value
The function MUST return a `HintStep` with:
- `technique`: One of `"Naked Pair (Row)"`, `"Naked Pair (Column)"`, or `"Naked Pair (Box)"`.
- `description`: `"Eliminate {a,b} from <unit-type> <unit-number>"` where a,b are the paired candidates sorted ascending.
- `explanation`: A user-friendly sentence identifying the two cells and the unit, explaining why the eliminations follow.
- `affectedCells`: An array of cells from which candidates are eliminated. Each entry has `row`, `col`, and `eliminated` (array of numbers removed). Cells where no candidates would be eliminated MUST NOT appear.

### Search Order
The function MUST search units in this order: rows (0-8), then columns (0-8), then boxes (0-8, box indexed left-to-right top-to-bottom). The FIRST naked pair found that produces at least one elimination is returned. If a naked pair exists but produces no eliminations (all other cells already lack those candidates), it is skipped.

### No-Result Condition
If no naked pair producing eliminations exists in any unit, the function MUST return `null`.

## Postconditions
- The returned `HintStep.affectedCells` contains only cells that actually have at least one of the paired candidates in their notes.
- The `eliminated` array for each affected cell contains only candidates that are present in the cell's notes AND are part of the naked pair.

## Invariants
- The two cells forming the pair are NEVER included in `affectedCells` (they keep their candidates).
- The `eliminated` values are always a subset of the pair's candidates.
- The technique label always includes the unit type in parentheses.

## Error Conditions

| Trigger | Expected Behavior |
|---------|-------------------|
| Board has no empty cells | Return `null` |
| No unit contains two cells with identical 2-candidate sets | Return `null` |
| Naked pair exists but all other cells in the unit already lack those candidates | Skip that pair, continue searching; return `null` if none found |

## Examples

### Example A — Column Naked Pair
Given column 3 has:
- R1C3 notes={4,7}, R5C3 notes={4,7}
- R2C3 notes={4,6,7}, R8C3 notes={1,4}

The function returns:
```
technique: "Naked Pair (Column)"
description: "Eliminate {4,7} from column 3"
affectedCells: [
  { row: 1, col: 2, eliminated: [4, 7] },
  { row: 7, col: 2, eliminated: [4] }
]
```

### Example B — Box Naked Pair
Given box 5 (rows 3-5, cols 3-5) has:
- R4C4 notes={2,9}, R5C5 notes={2,9}
- R4C5 notes={2,3,5}

The function returns:
```
technique: "Naked Pair (Box)"
description: "Eliminate {2,9} from box 5"
affectedCells: [
  { row: 3, col: 4, eliminated: [2] }
]
```

## Related Units
- SPEC-015 (Naked Triple) generalizes this to three cells/candidates.
- SPEC-016 (Hidden Triple) is the complement.
