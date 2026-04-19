# Coverage Report: Input Plan → Specification Units

## Gesture & scroll lockdown plan

| Input plan requirement (verbatim) | Covered by |
|-----------------------------------|------------|
| "Disable page scrolling" | SPEC-001, SPEC-006 |
| "overscroll behavior" | SPEC-002 |
| "pull-to-refresh" | SPEC-003, SPEC-002 |
| "touch-based navigation gestures" | SPEC-004, SPEC-006 |
| "All touch and swipe input should be captured and handled exclusively within the game" | SPEC-005, SPEC-007 |
| Cross-platform (iOS Safari, Android Chrome, desktop, standalone vs tab) | SPEC-006 (viewport/PWA), SPEC-002 (cross-engine overscroll), SPEC-003 (Android specific), SPEC-004 (iOS specific) |

## Puzzle generation feedback plan

| Input plan requirement (verbatim / paraphrased) | Covered by |
|-------------------------------------------------|------------|
| "Show the user some feedback while we are generating the Sudoku" | SPEC-008 (loading overlay bound to `isGeneratingAtom`) |
| "A loading state atom set while the generator is running" | SPEC-008 (`isGeneratingAtom`) |
| "The generator call must yield to the browser before starting, otherwise React never paints" | SPEC-008 (mandatory `setTimeout(0)` yield) |
| "Visible loading UI, minimal, consistent with Tailwind/paper/accent" | SPEC-008 (LoadingOverlay with existing design tokens) |
| "Also cover importPuzzleAtom if it has the same issue" | SPEC-008 (import wrapped in same pattern) |

Every explicit requirement is covered. No orphan requirements remain.

## NumberPad info box plan

| Input plan requirement (verbatim / paraphrased) | Covered by |
|-------------------------------------------------|------------|
| "It should always show cell location in left if numpad shown rather than the unique candidate" | SPEC-009 (info box renders `R{row+1}C{col+1}` unconditionally when the NumberPad's candidate preview bar is visible) |
| Keep the location label's existing small-monospace styling | SPEC-009 (styling preserved from the previous empty-cell branch) |
| Do not touch 1..9 buttons / disabled styling / auto-commit behavior | SPEC-009 scope explicitly excludes these |

## Remove congratulation modal plan

| Input plan requirement (verbatim / paraphrased) | Covered by |
|-------------------------------------------------|------------|
| "Remove congratulation modal" | SPEC-010 (no modal/overlay rendered on completion; `WinModal` file and its two references removed) |
| Do NOT touch `isComplete` / `isSolved` / timer-freeze / input-disabling | SPEC-010 scope explicitly excludes these — side effects preserved |
| Keep the change minimal, no replacement UI | SPEC-010 constraints forbid introducing alternative celebration UI |

## Header reorganization plan

| Input plan requirement (verbatim / paraphrased) | Covered by |
|-------------------------------------------------|------------|
| "Reorganize the header, current layout isn't intuitive" | SPEC-011 (header redesigned to contain only primary-gameplay controls + a hamburger trigger) |
| "Consider adding a sidebar to house secondary or infrequently used features" | SPEC-012 (right-edge drawer with Difficulty, Puzzle, Puzzle details, About sections) |
| Easter-egg `★{score}` → explicit hint | SPEC-011 (score button removed; explicit labeled hint button added with `aria-label="Hint"`) |
| Techniques-required panel moved into discoverable place | SPEC-012 (Puzzle details section renders `gameState.difficultyScore` and `gameState.strategies`) |
| Mobile-first 360–420px; right-edge drawer | SPEC-012 (panel width `min(85vw, 320px)`, right-edge slide-in) |
| Cooperate with gesture lockdown (SPEC-001..007) | SPEC-012 (panel root carries `data-touch-handled`, scrollable inner carries `data-scroll-allowed` + `.scroll-allowed`) |
| `ImportModal`, `LoadingOverlay`, `HintPanel`, `BottomPanel` remain where they are | SPEC-011 scope explicitly excludes them; SPEC-012 triggers `ImportModal` via the existing component unchanged |
| Drawer opens via hamburger; closes via scrim tap, swipe, or Escape | SPEC-012 (scrim tap / Escape; swipe-to-close excluded — rationale in Open Issues) |
| Use a CSS transform + backdrop, no portal library | SPEC-012 (fixed-position scrim + panel, `translate-x-full → translate-x-0` transition, no portal) |
| State in local `useState`, no new Jotai atom | SPEC-012 (state ownership via `useState` in `Header.tsx`, explicit constraint against new atoms) |
| Accessibility: `aria-label`, `role="dialog"`, `aria-modal`, Escape; no focus trap | SPEC-011 (header button labels + `aria-expanded`), SPEC-012 (drawer ARIA + Escape; focus trap explicitly excluded) |
| No new dependencies / design-system tokens | SPEC-011, SPEC-012 (both enumerate constraints against new deps / tokens) |
| Do NOT touch `gameState` shape, `selectedCellAtom`, non-header component logic, global gesture listener, PWA manifest | SPEC-011 / SPEC-012 scope sections explicitly exclude these |
