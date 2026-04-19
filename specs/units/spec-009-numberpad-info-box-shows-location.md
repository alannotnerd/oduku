# NumberPad info box always shows cell location

- **Unit ID**: `SPEC-009`
- **Category**: behavior
- **Priority**: standard
- **Purpose**: Define the content of the fixed-width info box on the left edge of the `NumberPad` component. The info box MUST always display the selected cell's location (`R{row+1}C{col+1}`) whenever the NumberPad is mounted, regardless of whether the selected cell currently has a committed value. The cell's value is already rendered in the grid itself, so duplicating it in the pad is redundant; location is always useful orientation context.
- **Scope**:
  - Included:
    - The fixed-width info box rendered on the left edge of the NumberPad's candidate preview bar.
    - The text content, format, and styling of that info box when the NumberPad is visible.
  - Excluded:
    - The 1..9 number buttons to the right of the info box. Their enabled/disabled styling is governed by pre-existing logic (`cellHasValue` → disabled styling) and is NOT changed by this unit.
    - The visibility rules of the NumberPad itself (`showCandidates` guard). When the NumberPad is not visible, this unit does not apply.
    - The auto-commit-on-value-change behavior of `selectedCellAtom` in `src/store/game.ts`. Orthogonal.
    - Any other component (grid, header, bottom panel, modals).
- **Dependencies**: None. Independent of SPEC-001..008.

## Preconditions
- The `NumberPad` component is mounted.
- `showCandidates === true`, i.e. a cell is selected (`selected` is a `[row, col]` tuple) and the selected cell exists and is not a fixed clue. This is the existing guard at `src/components/NumberPad.tsx:155` that causes the info-box-bearing bar to render at all.

## Behavior
- While `showCandidates === true`, the info box on the left edge of the candidate preview bar MUST render exactly one text node containing `R{selected[0] + 1}C{selected[1] + 1}`.
- The info box MUST NOT render the selected cell's `value`, even when `cellHasValue === true`.
- The info box MUST NOT render any other text (no placeholders, no icons, no conditional branches).
- The label MUST use the existing small-monospace styling previously used for the empty-cell branch: `text-[10px] text-grid/50 font-mono whitespace-nowrap`.
- The prior accent-colored large-digit styling (`text-lg font-bold text-accent`) MUST be removed from the info box since it no longer has a case that uses it.
- The container element wrapping the label (`flex items-center justify-center px-3 py-3 min-w-[48px] shrink-0 border-r border-grid/10`) is preserved unchanged so the layout width and divider of the candidate bar remain stable.

## Postconditions
- After any render in which the NumberPad is visible, the DOM subtree of the info box contains exactly the text `R{r}C{c}` where `r = selected[0] + 1` and `c = selected[1] + 1`.

## Invariants
- For all `(row, col)` in `[0..8] x [0..8]`, the info box text equals `R{row+1}C{col+1}`. It is never blank, never the cell's value, and never any other string.
- The info box content depends ONLY on `selected`. It does NOT depend on `selectedCell.value`, `selectedCell.notes`, `selectedCell.isFixed`, `candidateMarks`, or `pendingLinkMark`.

## Error Conditions

| Trigger | Error | Expected Behavior |
|---------|-------|-------------------|
| `selected` is `null` (no cell selected) | NumberPad visibility guard (`showCandidates`) already evaluates to false | The candidate preview bar (and therefore the info box) is not rendered. The existing "Select a cell to play" placeholder renders instead. This unit does not apply. |
| The selected cell is a fixed clue (`selectedCell.isFixed === true`) | NumberPad visibility guard `showCandidates` evaluates to false | As above: the candidate bar is not rendered; this unit does not apply. |

## State Transitions
N/A — the info box is a pure function of `selected` while the NumberPad is mounted.

## Constraints
- The label format MUST be `R{row+1}C{col+1}` (1-indexed). The 0-indexed internal coordinates MUST NOT leak into the UI.
- Implementation MUST follow existing code style in `src/components/NumberPad.tsx` (function component, Tailwind classes, no inline styles unless already present).
- The change MUST be confined to `src/components/NumberPad.tsx`. No other file may be modified by this unit.

## Examples

### Example A — Empty selected cell
1. User taps the cell at row index 0, column index 4 (top row, 5th column).
2. `selected === [0, 4]`; `selectedCell.value === null`; cell is not fixed.
3. The NumberPad renders its candidate preview bar.
4. The info box on the left shows `R1C5`.

### Example B — Selected cell with user-entered value
1. User has entered `7` in the cell at row index 3, column index 3.
2. User taps that same cell to select it.
3. `selected === [3, 3]`; `selectedCell.value === 7`; cell is not fixed (`isFixed === false`).
4. The NumberPad renders its candidate preview bar (the `!selectedCell.isFixed` guard passes).
5. The info box on the left shows `R4C4`. It does NOT show `7`. The `7` is already visible in the grid itself.
6. The 1..9 buttons to the right still render in their disabled styling because `cellHasValue` is true — that behavior is governed by a separate code path and is unchanged.

### Example C — Selection changes from empty to filled
1. Initially `selected === [0, 0]`, value `null`. Info box shows `R1C1`.
2. User selects cell `[8, 8]`, value `3`, not fixed. Info box re-renders to show `R9C9` (not `3`).

## Related Units
- None. SPEC-009 is independent.
