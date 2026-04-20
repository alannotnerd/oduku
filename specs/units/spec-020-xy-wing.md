# XY-Wing

- **Unit ID**: `SPEC-020`
- **Category**: behavior
- **Priority**: standard
- **Purpose**: Implement the XY-Wing solving technique. An XY-Wing consists of a pivot cell with exactly 2 candidates {X,Y} that sees two wing cells: one with candidates {X,Z} and one with candidates {Y,Z}. Since the pivot must be either X or Y, one of the wings will always be Z. Therefore, Z can be eliminated from any cell that sees BOTH wings.
- **Scope**:
  - Included:
    - Detect XY-Wing patterns across the board.
    - Return eliminations of the shared candidate Z.
    - Provide `links` array showing the pivot-wing connections.
    - Add technique weight to `score.ts`.
  - Excluded:
    - XYZ-Wing and other wing variants.
- **Dependencies**: None.

## Preconditions
- The board is a valid `GameBoard` with candidates populated for all empty cells.

## Behavior

### Definition
An **XY-Wing** consists of three cells:
1. **Pivot**: An empty cell with exactly 2 candidates {X, Y}.
2. **Wing 1**: An empty cell that shares a unit (row, column, or box) with the pivot and has exactly 2 candidates {X, Z} (shares X with the pivot, plus a different value Z).
3. **Wing 2**: An empty cell that shares a unit with the pivot (may be a different unit than Wing 1) and has exactly 2 candidates {Y, Z} (shares Y with the pivot, plus the SAME Z as Wing 1).

The key insight: The pivot is either X or Y. If the pivot is X, then Wing 1 must be Z. If the pivot is Y, then Wing 2 must be Z. Either way, at least one wing is Z.

### "Sees" Relationship
Cell A "sees" cell B if they share a row, column, or box (i.e., B is a peer of A).

### Elimination Rule
Any empty cell that sees BOTH Wing 1 AND Wing 2 (is a peer of both), and contains Z in its candidates, can have Z eliminated.

### Return Value
The function MUST return a `HintStep` with:
- `technique`: `"XY-Wing"`.
- `description`: `"XY-Wing: pivot R<p_r>C<p_c> ({X,Y}), wings R<w1_r>C<w1_c> ({X,Z}) and R<w2_r>C<w2_c> ({Y,Z}) → eliminate <Z>"` (1-based coordinates).
- `explanation`: A user-friendly explanation of the pivot-wing logic and why Z can be eliminated.
- `affectedCells`: Cells from which Z is eliminated. Each has `row`, `col`, `eliminated: [Z]`.
- `links`: An array of `CandidateLink` entries:
  - Pivot→Wing1: strong link on candidate X
  - Pivot→Wing2: strong link on candidate Y
  - Wing1→(elimination zone): weak link on candidate Z
  - Wing2→(elimination zone): weak link on candidate Z
  
  Simplified to 2 links (pivot-to-each-wing):
  - `{ from: pivot(X), to: wing1(X), type: 'strong' }`
  - `{ from: pivot(Y), to: wing2(Y), type: 'strong' }`

### Search Order
For each empty cell with exactly 2 candidates (potential pivot), for each pair of peers with exactly 2 candidates that satisfy the wing criteria, check for eliminations. The FIRST XY-Wing producing at least one elimination is returned.

Iterate pivots in reading order (row 0 col 0 through row 8 col 8).

### No-Result Condition
Return `null` if no XY-Wing producing eliminations is found.

## Postconditions
- Each affected cell sees both wings and had Z in its notes.
- The pivot and wings are never in `affectedCells`.

## Invariants
- The pivot has exactly 2 candidates.
- Each wing has exactly 2 candidates.
- The pivot shares exactly 1 candidate with each wing.
- The wings share exactly 1 candidate (Z) with each other, and that candidate is NOT in the pivot.

## Error Conditions

| Trigger | Expected Behavior |
|---------|-------------------|
| No cell with 2 candidates has a valid wing pair | Return `null` |
| XY-Wing exists but no cell sees both wings and has Z | Skip, continue |

## Examples

### Example A — Basic XY-Wing
- Pivot: R1C1 notes={3,7}
- Wing 1: R1C5 notes={3,9} (shares row with pivot, shares candidate 3)
- Wing 2: R4C1 notes={7,9} (shares column with pivot, shares candidate 7)
- Z = 9
- R4C5 notes={1,5,9} — sees both wings (same row as wing2, same column as wing1)

The function returns:
```
technique: "XY-Wing"
description: "XY-Wing: pivot R1C1 ({3,7}), wings R1C5 ({3,9}) and R4C1 ({7,9}) → eliminate 9"
affectedCells: [
  { row: 3, col: 4, eliminated: [9] }
]
links: [
  { from: {row:0,col:0,candidate:3}, to: {row:0,col:4,candidate:3}, type:'strong' },
  { from: {row:0,col:0,candidate:7}, to: {row:3,col:0,candidate:7}, type:'strong' }
]
```

### Example B — Box-based wing connection
- Pivot: R5C5 notes={2,6}
- Wing 1: R5C8 notes={2,4} (shares row with pivot)
- Wing 2: R4C4 notes={4,6} (shares box with pivot — both in box 5)
- Z = 4
- R4C8 notes={3,4,7} — sees Wing 1 (same column 8) and Wing 2 (same row 4)

## Score Weight
`"XY-Wing"`: weight `140` in `TECHNIQUE_WEIGHTS`.

## Related Units
- None directly. XY-Wing is a standalone chain-like technique.
