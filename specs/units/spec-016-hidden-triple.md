# Hidden Triple

- **Unit ID**: `SPEC-016`
- **Category**: behavior
- **Priority**: standard
- **Purpose**: Implement the Hidden Triple solving technique. A Hidden Triple occurs when three candidates each appear in exactly 2 or 3 cells within a unit, and the union of the cells containing those candidates totals exactly 3 cells. Those three cells can be reduced to contain only those three candidates.
- **Scope**:
  - Included:
    - Detect hidden triples in rows, columns, and boxes.
    - Return eliminations of non-triple candidates from the three cells.
    - Add technique weight to `score.ts`.
  - Excluded:
    - Hidden Pairs (SPEC-014).
    - Hidden Quads or higher.
- **Dependencies**: None.

## Preconditions
- The board is a valid `GameBoard` with candidates populated for all empty cells.

## Behavior

### Definition
A **Hidden Triple** in a unit (row, column, or box) consists of three candidates (a, b, c) such that:
1. Each of a, b, c appears in at most 3 cells within the unit.
2. The union of cells containing any of {a, b, c} is exactly 3 cells.
3. At least one of the three cells has candidates OTHER than {a, b, c} (otherwise this is a Naked Triple and would be caught earlier or produces no eliminations).

### Elimination Rule
When a Hidden Triple is found, all candidates OTHER than {a, b, c} MUST be eliminated from the three cells.

### Return Value
The function MUST return a `HintStep` with:
- `technique`: One of `"Hidden Triple (Row)"`, `"Hidden Triple (Column)"`, or `"Hidden Triple (Box)"`.
- `description`: `"Hidden Triple {a,b,c} in <unit-type> <unit-number>"` where a,b,c are sorted ascending.
- `explanation`: A user-friendly sentence identifying the three cells, the triple values, and the unit.
- `affectedCells`: The cells that have candidates eliminated. Each entry has `row`, `col`, and `eliminated` containing the candidates removed (all notes minus {a,b,c}). Cells whose notes are already a subset of {a,b,c} MUST NOT appear.

### Search Order
Search units in order: rows (0-8), columns (0-8), boxes (0-8). Within a unit, enumerate candidate triples (a,b,c) with a < b < c in ascending order. The FIRST hidden triple producing at least one elimination is returned.

### No-Result Condition
If no hidden triple producing eliminations exists, return `null`.

## Postconditions
- Each affected cell retains only {a, b, c} ∩ (original notes).
- The `eliminated` array for each affected cell is non-empty.

## Invariants
- The three triple candidates appear ONLY within the three identified cells in the unit.
- `eliminated` values never include a, b, or c.

## Error Conditions

| Trigger | Expected Behavior |
|---------|-------------------|
| No unit has three candidates confined to exactly three cells | Return `null` |
| A hidden triple exists but all three cells already have notes ⊆ {a,b,c} | This is a naked triple; skip, return `null` |

## Examples

### Example A — Column Hidden Triple
Given column 5 has 6 empty cells, and candidates 2, 6, 9 each appear only in rows 1, 4, 7:
- R1C5 notes={2,5,6,9}, R4C5 notes={2,6,8}, R7C5 notes={3,6,9}

The function returns:
```
technique: "Hidden Triple (Column)"
description: "Hidden Triple {2,6,9} in column 5"
affectedCells: [
  { row: 0, col: 4, eliminated: [5] },
  { row: 3, col: 4, eliminated: [8] },
  { row: 6, col: 4, eliminated: [3] }
]
```

## Score Weight
`"Hidden Triple"`: weight `100` in `TECHNIQUE_WEIGHTS`.

## Related Units
- SPEC-014 (Hidden Pair) — Hidden Triple generalizes Hidden Pair.
- SPEC-015 (Naked Triple) — the complement technique.
