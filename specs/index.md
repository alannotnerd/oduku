# Specification Index

Scope: Four independent concerns.

- **SPEC-001..007 — Gesture & Scroll Lockdown**: Full-screen PWA gesture lockdown. All page-level browser scrolling, bouncing, pull-to-refresh, and back-navigation gestures MUST be suppressed. Touch and swipe input MUST be delivered only to the in-app game surfaces.
- **SPEC-008 — Puzzle Generation Feedback**: Visible loading indicator while puzzle generation/import is in progress, with a mandatory main-thread yield so the indicator actually paints before the synchronous generator blocks.
- **SPEC-009 — NumberPad info box content**: The fixed-width info box on the left of the NumberPad always displays the selected cell's location (`R{row+1}C{col+1}`), never the cell's value.
- **SPEC-010 — No congratulation modal on completion**: On puzzle completion, no modal/dialog/banner announcing the win is rendered. Completion-driven side effects (timer freeze, input disabling) remain unchanged.
- **SPEC-011..012 — Header re-layout and settings drawer**: Primary gameplay controls (timer, explicit hint, new-game, menu trigger) remain always visible in the header. Secondary/infrequent controls (difficulty selection, import, puzzle-details / techniques-required) move into a right-edge drawer. The cryptic `★{score}` easter-egg that used to trigger hint is replaced with an explicit labeled hint button.
- **SPEC-013..020 — Solver Technique Expansion**: Fix and add Sudoku solving techniques to the hint engine: fix Naked Pair to check all units, then add Hidden Pair, Naked Triple, Hidden Triple, Claiming (Box-Line Reduction), X-Wing, Swordfish, and XY-Wing. Each technique returns a `HintStep` with proper metadata, eliminations, and (for chain techniques) visualization links.

| ID | Title | Category | Priority | File |
|----|-------|----------|----------|------|
| SPEC-001 | Disable page-level vertical and horizontal scrolling | constraint | critical | units/spec-001-disable-page-scrolling.md |
| SPEC-002 | Disable overscroll / bounce behavior | constraint | critical | units/spec-002-disable-overscroll.md |
| SPEC-003 | Disable pull-to-refresh (Android Chrome) | constraint | critical | units/spec-003-disable-pull-to-refresh.md |
| SPEC-004 | Disable touch-based navigation gestures (iOS edge-swipe, two-finger swipe) | constraint | critical | units/spec-004-disable-navigation-gestures.md |
| SPEC-005 | Preserve in-app touch and swipe input to game surfaces | behavior | critical | units/spec-005-preserve-in-app-touch.md |
| SPEC-006 | Cross-platform viewport and PWA display configuration | integration | critical | units/spec-006-viewport-and-pwa-config.md |
| SPEC-007 | Scoped scroll escape hatch for legitimately scrollable regions | constraint | standard | units/spec-007-scoped-scroll-escape.md |
| SPEC-008 | Puzzle generation loading feedback | behavior | critical | units/spec-008-puzzle-generation-loading-feedback.md |
| SPEC-009 | NumberPad info box always shows cell location | behavior | standard | units/spec-009-numberpad-info-box-shows-location.md |
| SPEC-010 | No congratulation modal on puzzle completion | behavior | critical | units/spec-010-no-congratulation-modal.md |
| SPEC-011 | Header re-layout with explicit primary actions | behavior | critical | units/spec-011-header-relayout.md |
| SPEC-012 | Settings drawer for secondary and infrequent actions | behavior | critical | units/spec-012-settings-drawer.md |
| SPEC-013 | Fix Naked Pair to check all units (rows, columns, boxes) | bug-fix | critical | units/spec-013-naked-pair-fix.md |
| SPEC-014 | Hidden Pair | behavior | critical | units/spec-014-hidden-pair.md |
| SPEC-015 | Naked Triple | behavior | standard | units/spec-015-naked-triple.md |
| SPEC-016 | Hidden Triple | behavior | standard | units/spec-016-hidden-triple.md |
| SPEC-017 | Claiming (Box-Line Reduction) | behavior | standard | units/spec-017-claiming-box-line-reduction.md |
| SPEC-018 | X-Wing | behavior | standard | units/spec-018-x-wing.md |
| SPEC-019 | Swordfish | behavior | standard | units/spec-019-swordfish.md |
| SPEC-020 | XY-Wing | behavior | standard | units/spec-020-xy-wing.md |

Status: SPEC-001..012 IMPLEMENTED (Gates 1, 2, 3 passed). SPEC-013..020 IMPLEMENTED (Gates 1, 2, 3 passed).

## Implementation Traceability

| Spec | Implemented in |
|---|---|
| SPEC-001 | `src/index.css` (html/body/#root overflow, dimensions) |
| SPEC-002 | `src/index.css` (overscroll-behavior on html/body, position: fixed on body) |
| SPEC-003 | `src/lib/gestureLockdown.ts`; `src/main.tsx` (bootstrap); `src/index.css` (CSS layer) |
| SPEC-004 | `src/index.css` (touch-action: none on #root; user-select/touch-callout: none on body); `index.html` (viewport meta); `public/manifest.json` (display: standalone — already correct) |
| SPEC-005 | `src/App.tsx`, `src/components/NumberPad.tsx`, `src/components/BottomPanel.tsx` (data-touch-handled); `src/lib/gestureLockdown.ts` (opt-out algorithm) |
| SPEC-006 | `index.html` (viewport + apple-* + mobile-web-app-capable meta); `public/manifest.json` (already correct) |
| SPEC-007 | `src/index.css` (`.scroll-allowed` class) |
| SPEC-008 | `src/store/game.ts` (`isGeneratingAtom`, yield + `try/finally` in `newGameAtom` and `importPuzzleAtom`); `src/components/LoadingOverlay.tsx`; `src/App.tsx` (mount) |
| SPEC-009 | `src/components/NumberPad.tsx` (info box renders `R{row+1}C{col+1}` unconditionally when the candidate preview bar is visible) |
| SPEC-010 | `src/App.tsx` (removed `WinModal` import and `<WinModal />` mount); `src/components/WinModal.tsx` deleted |
| SPEC-011 | `src/components/Header.tsx` (rewritten: difficulty indicator, explicit hint button, new-game button, hamburger trigger; easter-egg score button and inline strategies panel removed) |
| SPEC-012 | `src/components/SettingsDrawer.tsx` (new drawer component with difficulty/puzzle/puzzle-details sections); `src/components/Header.tsx` (drawer state ownership, scrim, Escape handler, ImportModal relocation) |
| SPEC-013 | `src/lib/providers/local/solver.ts` (`findNakedPair` rewritten to iterate all 27 units via `allUnits` generator; technique label includes unit type); `src/lib/providers/local/score.ts` (weight entries for `Naked Pair (Row/Column/Box)`) |
| SPEC-014 | `src/lib/providers/local/solver.ts` (`findHiddenPair`); `src/lib/providers/local/score.ts` (`Hidden Pair (Row/Column/Box)` weight 60) |
| SPEC-015 | `src/lib/providers/local/solver.ts` (`findNakedTriple`); `src/lib/providers/local/score.ts` (`Naked Triple (Row/Column/Box)` weight 80) |
| SPEC-016 | `src/lib/providers/local/solver.ts` (`findHiddenTriple`); `src/lib/providers/local/score.ts` (`Hidden Triple (Row/Column/Box)` weight 100) |
| SPEC-017 | `src/lib/providers/local/solver.ts` (`findClaiming`); `src/lib/providers/local/score.ts` (`Claiming` weight 50) |
| SPEC-018 | `src/lib/providers/local/solver.ts` (`findXWing`); `src/lib/providers/local/score.ts` (`X-Wing` weight 120) |
| SPEC-019 | `src/lib/providers/local/solver.ts` (`findSwordfish`); `src/lib/providers/local/score.ts` (`Swordfish` weight 150) |
| SPEC-020 | `src/lib/providers/local/solver.ts` (`findXYWing`); `src/lib/providers/local/score.ts` (`XY-Wing` weight 140) |

