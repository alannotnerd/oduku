# Puzzle Generation Loading Feedback

- **Unit ID**: `SPEC-008`
- **Category**: behavior
- **Priority**: critical
- **Purpose**: Guarantee that whenever a new puzzle is being generated or imported, the user sees a visible loading indicator, and that the indicator becomes visible BEFORE the synchronous generator workload begins blocking the main thread. Today the generator is synchronous and can block for several hundred ms to multiple seconds (especially on `master` difficulty on low-end devices), leaving the UI frozen with no feedback.
- **Scope**:
  - Included:
    - A boolean loading-state atom (`isGeneratingAtom`) reflecting whether puzzle generation/import is in progress.
    - Mandatory main-thread yield between marking the loading state and invoking the generator/solver, so React is permitted to paint the loading UI.
    - A visible loading indicator component rendered while the atom is true.
    - Entry and exit conditions for the loading state covering both success and thrown-error paths.
  - Excluded:
    - Cancellation of an in-flight generation.
    - Retry logic on failure.
    - Progress bars or percent-complete indicators.
    - Moving the generator to a Web Worker (noted as a future improvement in "Related Notes", not required here).
    - Per-operation loading states (hint generation, solve, etc.) — this unit covers `newGameAtom` and `importPuzzleAtom` only.
- **Dependencies**: None (independent of SPEC-001..007).

## Preconditions
- The application is mounted.
- `gameStateAtom`, `newGameAtom`, and `importPuzzleAtom` exist in `src/store/game.ts` as already-async write atoms.

## Behavior

### Loading state atom
- The store MUST expose a read-only-from-components boolean atom `isGeneratingAtom`, initialised to `false`.
- `newGameAtom` and `importPuzzleAtom` MUST:
  1. Set `isGeneratingAtom` to `true` as their first action.
  2. Yield to the browser event loop before invoking `activeProvider.generator.generate(...)` / `activeProvider.solver.solve(...)`, using `await new Promise(resolve => setTimeout(resolve, 0))`. This yield is MANDATORY — without it, React has no opportunity to commit and paint the loading UI before the synchronous generator blocks the main thread.
  3. Run the generation/import workload.
  4. Clear `isGeneratingAtom` to `false` in a `finally`-semantic manner so the loading state is cleared on both success and exception.
- `isGeneratingAtom` MUST NOT be set to `true` by any other code path.
- Concurrent invocations of `newGameAtom` (e.g. user spams the New Game button) MUST NOT corrupt the loading state. The atom remains `true` until the latest invocation completes.

### Loading indicator UI
- A dedicated component MUST render a full-viewport overlay when `isGeneratingAtom` is `true`, and render nothing when it is `false`.
- The overlay MUST:
  - Cover the entire viewport.
  - Be visually distinct enough to communicate "the app is working" (centered spinner plus a short label such as "Generating puzzle...").
  - Use existing Tailwind design tokens (`bg-paper`, `text-ink`, `text-accent`, `border-accent`) — no new colours introduced.
  - Sit at a z-index above the board and number pad. (The win modal previously referenced here was removed per SPEC-010; no layering coordination is required.)
  - Be non-interactive: pointer events on the overlay MUST NOT reach the board underneath, and the overlay itself MUST NOT expose any interactive controls.
- The component MUST be rendered in `App.tsx` so the overlay is mounted for the entire app lifetime and toggled by the atom. (Prior revisions of this spec placed it as a sibling of `<WinModal />`; `WinModal` was removed per SPEC-010.)

### Main-thread yield guarantee
- After `isGeneratingAtom` is set to `true`, at least one microtask + one macrotask tick (`await new Promise(r => setTimeout(r, 0))`) MUST elapse before any synchronous generator code runs.
- Rationale: Jotai write atoms run synchronously up to the first `await`. A synchronous generator invoked in the same tick would prevent React from ever committing the `isGenerating=true` render — the user would see nothing until the generator returns. The yield is the load-bearing part of this spec; the atom and component alone do not produce visible feedback without it.

## Postconditions
- After `newGameAtom` completes (success): `gameStateAtom` holds the new puzzle and `isGeneratingAtom === false`.
- After `importPuzzleAtom` completes with a valid input (success): `gameStateAtom` holds the imported puzzle and `isGeneratingAtom === false`.
- After `importPuzzleAtom` completes with an invalid input (rejection): `gameStateAtom` is unchanged and `isGeneratingAtom === false`.
- If the generator throws: `isGeneratingAtom === false`. The exception MAY propagate to the caller.

## Invariants
- `isGeneratingAtom` is `true` during generation and `false` at every other time.
- The loading overlay is visible if and only if `isGeneratingAtom === true`.

## Error Conditions

| Trigger | Error | Expected Behavior |
|---------|-------|-------------------|
| Generator throws synchronously or rejects | Unhandled generation error | The write atom MUST clear `isGeneratingAtom` to `false` before the error propagates (use a `try`/`finally` block). No puzzle state is mutated if the error occurs before `gameStateAtom` is set. |
| Import receives an unparseable or unsolvable string | `importPuzzleAtom` returns `false` | `isGeneratingAtom` MUST be cleared to `false` before the function returns. `gameStateAtom` is unchanged. |
| User clicks "New Game" a second time while the first is in flight | Concurrent invocation | Both invocations set `isGeneratingAtom` to `true`. The atom becomes `false` once the later-completing invocation finishes. The UI stays in the loading state throughout. Final `gameStateAtom` reflects the later-completing result — no additional mutex is required. |
| Synchronous generator blocks main thread | UI freeze | Mitigated by the mandatory yield. The yield does NOT make generation faster, but it makes the loading UI paint before the freeze, so the user sees the feedback. |

## State Transitions

```
idle (isGenerating=false)
   │
   │ user triggers newGameAtom or importPuzzleAtom
   ▼
generating (isGenerating=true, overlay visible)
   │
   │ generator resolves OR rejects OR invalid input
   ▼
idle (isGenerating=false, overlay hidden)
```

## Constraints
- The yield MUST be `await new Promise(resolve => setTimeout(resolve, 0))`. Do not use `queueMicrotask` or `Promise.resolve()` — a microtask alone is not sufficient to let React commit in all browsers. Macrotask is required.
- The loading atom MUST NOT be persisted to storage.
- The overlay component MUST NOT import the generator directly — it only subscribes to `isGeneratingAtom`.
- Implementation MUST follow existing Tailwind and component conventions (function components, named exports, no inline styles unless already used in the codebase).

## Examples

### Example A — New Game happy path
1. User taps the "New Game" icon in `Header`.
2. `newGameAtom` sets `isGeneratingAtom = true`.
3. `newGameAtom` awaits `setTimeout(0)`.
4. React commits: overlay becomes visible with a spinner and "Generating puzzle..." label.
5. `newGameAtom` calls `activeProvider.generator.generate('master')` — main thread blocks for ~800 ms, but the overlay is already on-screen.
6. Generator returns; `newGameAtom` writes `gameStateAtom`, resets history, and in its `finally` block sets `isGeneratingAtom = false`.
7. React commits: overlay disappears, fresh board renders.

### Example B — Import invalid input
1. User pastes a bad 81-char string and taps Import.
2. `importPuzzleAtom` sets `isGeneratingAtom = true`, yields.
3. Overlay appears briefly.
4. `parseSudokuString` returns `null`.
5. `importPuzzleAtom` sets `isGeneratingAtom = false` (via `finally`) and returns `false`.
6. Overlay disappears. The caller (`ImportModal`) shows its usual error text.

### Example C — Error during generation
1. User taps New Game.
2. `newGameAtom` sets `isGeneratingAtom = true`, yields.
3. Generator throws.
4. `finally` sets `isGeneratingAtom = false`.
5. Overlay disappears. The error propagates to the caller (no retry logic in this spec).

## Related Units
- None. SPEC-008 is independent of the gesture lockdown spec series.

## Related Notes (non-normative)
- A future improvement is to move `generatePuzzle` into a Web Worker so the main thread is not blocked at all during generation. That would change the characteristics of the yield but NOT the observable contract defined here (`isGeneratingAtom` still flips from `true` to `false` around the async boundary, and the overlay is still bound to it). No change to this specification would be required for that refactor.
