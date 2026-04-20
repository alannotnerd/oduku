# Open Issues

## Resolved via stated assumption
1. **Canvas vs DOM grid**: The user's brief referenced a "game canvas". The current codebase renders the Sudoku grid as a DOM grid (React components), not a `<canvas>`. The specification treats "game canvas" as "the logical game surface" — which is the DOM grid plus number pad plus bottom panel. No separate HTMLCanvasElement exists. No clarification requested; the lockdown spec applies equally well either way.
2. **iOS Safari in browser tab edge-swipe residual animation**: On iOS Safari in a browser tab (not installed as PWA), `overscroll-behavior-x: none` reliably prevents navigation, but a small visual artifact may still appear on some iOS versions. Documented in SPEC-004 Error Conditions as a known platform limitation; PWA install is the recommended full mitigation.
3. **Multi-touch (pinch) events**: `user-scalable=no` + `maximum-scale=1.0` disable pinch-zoom per SPEC-006. The global touchmove listener per SPEC-003 additionally short-circuits on multi-touch to avoid interfering with any future multi-finger gestures.

## No open blocking questions
All input-plan requirements are specifiable without further user input. Proceeding to Phase 2.

## SPEC-008 (puzzle generation feedback) — resolved via stated assumption
1. **Yield mechanism**: The plan allowed "setTimeout(0) yield OR Web Worker". The spec mandates `setTimeout(0)` for this iteration and explicitly flags the Web Worker option as a non-normative future improvement, per the user's "first pass" direction. No clarification requested.
2. **Overlay vs header badge**: The plan said "a centered spinner overlay or a header badge is enough". The spec picks the full-viewport overlay because it also prevents the user from tapping cells / number pad while generation is in flight (which otherwise leads to confusing behavior on the stale board). This is a minimal choice, not a redesign.
3. **Concurrent invocations**: The spec specifies that concurrent invocations do not need a mutex — a later-completing generation overwrites the earlier result and `isGeneratingAtom` stays `true` until all are done. This matches current `newGameAtom` semantics and avoids adding cancellation logic (which the user explicitly excluded).

## SPEC-011 / SPEC-012 (header re-layout + drawer) — resolved via stated assumption

1. **Swipe-to-close gesture**: The user's brief said "tap scrim or swipe to close". Implementing swipe-to-close on the drawer requires either (a) an inline touch gesture handler that translates the panel while the user drags and commits-or-reverts on release, or (b) a library. Option (a) has real complexity risk — it interacts with the global `touchmove` listener per SPEC-005 and must handle cancellation. Option (b) violates the "no new dependencies" constraint. This iteration ships with scrim tap + Escape only, and flags swipe-to-close as a non-normative future improvement. The scrim is ~54px wide on a 360px viewport, which is a generous tap target, so the discoverability cost is low. Explicitly called out in SPEC-012 Scope (Excluded).
2. **Focus trap**: The user explicitly said "Don't build a full focus-trap — this is a casual game." Spec honored as-is. The drawer has `role="dialog"` / `aria-modal="true"` ARIA but does not steal focus on open or trap it inside.
3. **Drawer state as Jotai atom vs `useState`**: The user preferred local `useState` unless there's a cross-component reason. There is none — no other component reads the drawer's open state. Spec requires local state; a violation (adding a new atom for this) is explicitly forbidden in SPEC-011 Constraints and SPEC-012 Constraints.
4. **ImportModal ownership**: The user said "Existing components `ImportModal`, ..., `HintPanel`, `BottomPanel` should remain where they are unless there's a real reason to touch them." Interpretation: the existing `ImportModal.tsx` file is not touched; its mount point moves from the header's JSX to the drawer-wired state in `Header.tsx` (still rendered by `Header.tsx`, still the same component). This is the minimal interpretation that still satisfies "header cluttered with too many controls".
5. **Difficulty-indicator click behavior**: A reasonable alternative design would be to make the difficulty pill itself a tappable shortcut to the drawer's Difficulty section. Rejected in this iteration because (a) the hamburger already does exactly this in one tap, (b) an interactive pill re-introduces the "what does this do?" ambiguity the user is trying to eliminate, and (c) the pill is small and easy to mis-tap on mobile. Spec mandates it MUST NOT be a `<button>` and MUST NOT have `onClick`. A future iteration may promote it if user research shows the hamburger is not discovered.

## SPEC-009 (NumberPad info box) — resolved via stated assumption
1. **Meaning of "unique candidate"**: The user's brief used the phrase "unique candidate" to refer to the digit currently rendered in the info box. Reading `src/components/NumberPad.tsx`, the info box's value branch shows `selectedCell.value` — which for a non-fixed cell is a user-committed value (possibly an auto-placed single candidate per `selectedCellAtom` logic). The spec treats "unique candidate" as "the committed cell value" and simply removes the value branch entirely so that the location label is the only thing ever shown.
2. **Styling for the single surviving branch**: Per the user's explicit instruction, the small monospace `text-[10px] text-grid/50 font-mono whitespace-nowrap` styling is retained. The prior accent-colored large-digit styling is removed.
3. **Layout**: The container element and its dimensions are preserved unchanged so the candidate bar's layout width is stable.

## SPEC-013..020 (Solver technique expansion) — resolved via stated assumption

1. **Cascade order**: The plan says "Naked Pair fix and Hidden Pair should go right after the existing Naked Pair slot. X-Wing/Swordfish/XY-Wing at the end before Solution Check." The spec interprets this as the following cascade order within `getHint()`: Naked Single → Hidden Single → Pointing Pair → Claiming → Naked Pair → Hidden Pair → Naked Triple → Hidden Triple → X-Wing → Swordfish → XY-Wing → Solution Check. Claiming is placed right after Pointing Pair since it is the same complexity class. Naked/Hidden Triples come after the pairs. This matches standard Sudoku difficulty ordering per sudoku.com.

2. **Score weights**: The plan does not specify exact weight values. The spec assigns weights based on relative difficulty: Hidden Pair 60, Naked Triple 80, Hidden Triple 100, X-Wing 120, XY-Wing 140, Swordfish 150, Claiming 50 (same as Pointing Pair). These are consistent with the existing weight scale (Naked Single 10, Hidden Single 15, Naked Pair 40, Pointing Pair 50).

3. **Technique label format**: The plan says "technique name matching sudoku.com's terminology." For pair/triple techniques, the existing code adds unit type in parentheses (e.g. "Hidden Single (Row)"). The spec follows this pattern: "Naked Pair (Row)", "Hidden Pair (Box)", etc. The `canonicalLabel()` function in `score.ts` strips parentheticals, so the weight map uses the base name only. For X-Wing, Swordfish, XY-Wing, and Claiming, no parenthetical is added since the unit type is implicit in the pattern.

4. **Swordfish links**: The plan says "links array for chain-based techniques." For Swordfish, the spec defines links connecting cells within rows and within columns of the pattern, forming a grid. The exact link topology visualizes the fish pattern.

5. **Box numbering**: Throughout, boxes are numbered 1-9 (1-based) in user-facing strings, left-to-right top-to-bottom. In code, box indices are computed as `Math.floor(row/3) * 3 + Math.floor(col/3)` (0-based). Display label = box_index + 1.
