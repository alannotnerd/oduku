# Specification Index

Scope: Three independent concerns so far.

- **SPEC-001..007 — Gesture & Scroll Lockdown**: Full-screen PWA gesture lockdown. All page-level browser scrolling, bouncing, pull-to-refresh, and back-navigation gestures MUST be suppressed. Touch and swipe input MUST be delivered only to the in-app game surfaces.
- **SPEC-008 — Puzzle Generation Feedback**: Visible loading indicator while puzzle generation/import is in progress, with a mandatory main-thread yield so the indicator actually paints before the synchronous generator blocks.
- **SPEC-009 — NumberPad info box content**: The fixed-width info box on the left of the NumberPad always displays the selected cell's location (`R{row+1}C{col+1}`), never the cell's value.
- **SPEC-010 — No congratulation modal on completion**: On puzzle completion, no modal/dialog/banner announcing the win is rendered. Completion-driven side effects (timer freeze, input disabling) remain unchanged.

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

Status: SPEC-001..007 IMPLEMENTED. SPEC-008 IMPLEMENTED. SPEC-009 IMPLEMENTED. SPEC-010 IMPLEMENTED. Gates 1, 2, 3 passed for all units.

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

