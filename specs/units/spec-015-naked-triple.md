# Naked Triple

- **Unit ID**: `SPEC-015`
- **Category**: behavior
- **Priority**: standard
- **Purpose**: Implement the Naked Triple solving technique. A Naked Triple occurs when three cells in a unit collectively contain exactly three distinct candidates (the union of their candidate sets has size 3). Each individual cell may have 2 or 3 of those candidates. The three candidates can be eliminated from all other cells in the unit.
- **Scope**:
  - Included:
    - Detect naked triples in rows, columns, and boxes.
    - Return eliminations from other cells in the unit.
    - Add technique weight to `score.ts`.
  - Excluded:
    - Naked Quads or higher.
    - Naked Pairs (SPEC-013).
- **Dependencies**: None.

## Preconditions
- The board is a valid `GameBoard` with candidates populated for all empty cells.

## Behavior

### Definition
A **Naked Triple** in a unit (row, column, or box) consists of exactly three empty cells such that:
1. Each cell has 2 or 3 candidates (cells with 1 candidate are naked singles and would be caught earlier; cells with 4+ candidates cannot form a naked triple).
2. The union of the three cells' candidate sets contains exactly 3 distinct numbers.

Note: Not every cell needs all 3 candidates. For example, cells with notes {1,2}, {2,3}, {1,3} form a valid naked triple with union {1,2,3}.

### Elimination Rule
When a Naked Triple is found, the three union candidates MUST be eliminated from all OTHER empty cells in the same unit.

### Return Value
The function MUST return a `HintStep` with:
- `technique`: One of `"Naked Triple (Row)"`, `"Naked Triple (Column)"`, or `"Naked Triple (Box)"`.
- `description`: `"Naked Triple {a,b,c} in <unit-type> <unit-number>"` where a,b,c are sorted ascending.
- `explanation`: A user-friendly sentence identifying the three cells, the triple values, and the unit.
- `affectedCells`: An array of cells from which candidates are eliminated. Each entry has `row`, `col`, and `eliminated` (the subset of {a,b,c} present in that cell's notes). Cells with no candidates to eliminate MUST NOT appear.

### Search Order
Search units in order: rows (0-8), columns (0-8), boxes (0-8). Within a unit, enumerate all combinations of 3 empty cells with 2-3 candidates. The FIRST naked triple producing at least one elimination is returned.

### No-Result Condition
If no naked triple producing eliminations exists, return `null`.

## Postconditions
- Each affected cell's `eliminated` array is a non-empty subset of the triple's three candidates.
- The three cells forming the triple are NEVER included in `affectedCells`.

## Invariants
- The union of the three cells' notes is exactly 3 distinct values.
- The three cells each have between 2 and 3 candidates.

## Error Conditions

| Trigger | Expected Behavior |
|---------|-------------------|
| No unit contains 3 cells whose union has exactly 3 candidates | Return `null` |
| A naked triple exists but no other cell in the unit contains any of the triple's candidates | Skip, continue; return `null` if none found |

## Examples

### Example A — Row Naked Triple
Given row 1 has empty cells:
- R1C2 notes={1,4}, R1C5 notes={1,7}, R1C8 notes={4,7}
- Union = {1,4,7}, size = 3 — valid naked triple.
- R1C3 notes={1,3,5}, R1C6 notes={4,8}

The function returns:
```
technique: "Naked Triple (Row)"
description: "Naked Triple {1,4,7} in row 1"
affectedCells: [
  { row: 0, col: 2, eliminated: [1] },
  { row: 0, col: 5, eliminated: [4] }
]
```

### Example B — Subset variant
Given row 5 has cells:
- R5C1 notes={2,5}, R5C3 notes={2,5,8}, R5C7 notes={5,8}
- Union = {2,5,8}, size = 3 — valid triple even though not all cells have all 3.

## Score Weight
`"Naked Triple"`: weight `80` in `TECHNIQUE_WEIGHTS`.

## Related Units
- SPEC-013 (Naked Pair Fix) — Naked Triple generalizes Naked Pair.
- SPEC-016 (Hidden Triple) — the complement technique.
