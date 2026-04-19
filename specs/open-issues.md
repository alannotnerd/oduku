# Open Issues

## Resolved via stated assumption
1. **Canvas vs DOM grid**: The user's brief referenced a "game canvas". The current codebase renders the Sudoku grid as a DOM grid (React components), not a `<canvas>`. The specification treats "game canvas" as "the logical game surface" — which is the DOM grid plus number pad plus bottom panel. No separate HTMLCanvasElement exists. No clarification requested; the lockdown spec applies equally well either way.
2. **iOS Safari in browser tab edge-swipe residual animation**: On iOS Safari in a browser tab (not installed as PWA), `overscroll-behavior-x: none` reliably prevents navigation, but a small visual artifact may still appear on some iOS versions. Documented in SPEC-004 Error Conditions as a known platform limitation; PWA install is the recommended full mitigation.
3. **Multi-touch (pinch) events**: `user-scalable=no` + `maximum-scale=1.0` disable pinch-zoom per SPEC-006. The global touchmove listener per SPEC-003 additionally short-circuits on multi-touch to avoid interfering with any future multi-finger gestures.

## No open blocking questions
All input-plan requirements are specifiable without further user input. Proceeding to Phase 2.
