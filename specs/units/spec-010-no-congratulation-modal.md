# Remove Congratulation Modal on Puzzle Completion

- **Unit ID**: `SPEC-010`
- **Category**: behavior
- **Priority**: critical
- **Purpose**: Eliminate the congratulation modal previously rendered on puzzle completion. When the player completes the puzzle, no modal, overlay, dialog, toast, or other visual celebration MUST appear. The existing game-completion internal state (timer freeze, input disabling, hint disabling) remains unchanged; only the celebratory UI surface is removed.
- **Scope**:
  - Included:
    - Removal of the `WinModal` component (`src/components/WinModal.tsx`) and all references to it from the rendered React tree (`src/App.tsx`).
    - Assertion that no alternative replacement UI (toast, banner, inline message, audio cue, confetti) is introduced.
    - Preservation of the completion-side-effects already tied to `gameStateAtom.isComplete`.
  - Excluded:
    - `gameStateAtom.isComplete` and the `isSolved()` predicate — these MUST remain and keep their current semantics.
    - Timer freeze on completion in `Header.tsx` — MUST keep working.
    - Disabling of cell input / hint action on completion inside `src/store/game.ts` — MUST keep working.
    - Any other component (`Header`, `Board`, `NumberPad`, `BottomPanel`, `HintPanel`, `ImportModal`, `LoadingOverlay`).
- **Dependencies**: None. Supersedes the implicit prior behavior that assumed a `<WinModal />` mount in `App.tsx`.

## Preconditions
- The player has an active game whose `gameStateAtom.isComplete` can transition from `false` to `true` via `isSolved(board)` becoming true after a cell write.

## Behavior
- When `gameStateAtom.isComplete` becomes `true`, the application MUST NOT render any modal, dialog, overlay, banner, toast, inline message, or visual effect announcing the completion.
- The React tree rendered by `App.tsx` MUST NOT contain a `<WinModal />` element, and MUST NOT import `WinModal`.
- The file `src/components/WinModal.tsx` MUST NOT exist in the repository.
- The completed board MUST remain visible on screen exactly as the player left it at the moment of completion.
- The player MUST be able to start a new game via the existing "New Game" control in the header (`Header.tsx`) at any time, including immediately after completion.
- The completion-driven side effects in non-UI code paths — timer freeze in `Header.tsx` (`if (gameState.isComplete || gameState.board.length === 0) return;` inside the interval effect), cell-input no-op in `setCellValueAtom` / `clearCellAtom` in `src/store/game.ts`, and hint no-op in `showHintAtom` — MUST continue to behave as before.

## Postconditions
- After puzzle completion:
  - No win modal is present in the DOM.
  - The timer has stopped advancing (unchanged from prior behavior).
  - Further cell input attempts are ignored (unchanged from prior behavior).
  - The "New Game" button in the header remains operable and, when pressed, invokes `newGameAtom` and replaces `gameStateAtom` with a fresh puzzle.

## Invariants
- For any value of `gameStateAtom.isComplete`, the rendered React tree contains zero elements whose purpose is to announce completion.
- Removal of the modal does not alter any behavior gated on `isComplete` elsewhere in the codebase.

## Error Conditions

| Trigger | Error | Expected Behavior |
|---------|-------|-------------------|
| Any code path attempts to import `./components/WinModal` | Module not found (TypeScript / build error) | The build MUST fail loudly. The fix is to delete the offending import, not to restore `WinModal`. |
| A future contributor re-adds a celebratory UI | Spec violation | Any such addition MUST be preceded by a new or updated spec unit superseding SPEC-010. |

## State Transitions
```
playing (isComplete=false)
   │
   │ last cell write causes isSolved(board) === true
   ▼
complete (isComplete=true)  — no UI celebration rendered; timer frozen; input ignored
   │
   │ user taps "New Game" in header
   ▼
playing (isComplete=false, fresh puzzle)
```

## Constraints
- The deletion MUST be the minimal change needed to satisfy the spec: remove the component file and its two references (import and JSX usage) in `src/App.tsx`.
- The explanatory comment in `src/App.tsx` that currently says "Placed below WinModal so win state takes visual priority" MUST be updated or removed because `WinModal` no longer exists.
- No new dependency, atom, component, or test helper is introduced.

## Examples

### Example A — Player completes the puzzle
1. Player enters the final correct digit.
2. `setCellValueAtom` updates the board and recomputes `isComplete` to `true`.
3. `gameStateAtom.isComplete` flips to `true`.
4. The timer in `Header.tsx` stops advancing.
5. No modal appears. The completed board stays on screen.
6. Player taps the "New Game" icon in the header; a new puzzle replaces the board.

### Example B — Player completes, then tries to keep editing
1. Same as Example A through step 4.
2. Player taps a non-fixed cell and presses a digit.
3. `setCellValueAtom` sees `isComplete === true` and returns without mutation.
4. No modal appears at any point.

## Related Units
- Supersedes the prior implicit win-modal surface. SPEC-005's postcondition list previously included `WinModal` among components whose touch regressions must pass — that entry is now vacuous and is updated accordingly.
- SPEC-008's note about `LoadingOverlay` being a sibling of `<WinModal />` in `App.tsx` is updated: the overlay remains an `App.tsx` child, simply no longer next to a WinModal.
