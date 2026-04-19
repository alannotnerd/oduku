# Specification Index — Gesture & Scroll Lockdown

Scope: Full-screen PWA gesture lockdown for Oduku. All page-level browser scrolling, bouncing, pull-to-refresh, and back-navigation gestures MUST be suppressed. Touch and swipe input MUST be delivered only to the in-app game surfaces.

| ID | Title | Category | Priority | File |
|----|-------|----------|----------|------|
| SPEC-001 | Disable page-level vertical and horizontal scrolling | constraint | critical | units/spec-001-disable-page-scrolling.md |
| SPEC-002 | Disable overscroll / bounce behavior | constraint | critical | units/spec-002-disable-overscroll.md |
| SPEC-003 | Disable pull-to-refresh (Android Chrome) | constraint | critical | units/spec-003-disable-pull-to-refresh.md |
| SPEC-004 | Disable touch-based navigation gestures (iOS edge-swipe, two-finger swipe) | constraint | critical | units/spec-004-disable-navigation-gestures.md |
| SPEC-005 | Preserve in-app touch and swipe input to game surfaces | behavior | critical | units/spec-005-preserve-in-app-touch.md |
| SPEC-006 | Cross-platform viewport and PWA display configuration | integration | critical | units/spec-006-viewport-and-pwa-config.md |
| SPEC-007 | Scoped scroll escape hatch for legitimately scrollable regions | constraint | standard | units/spec-007-scoped-scroll-escape.md |

Status: All units IMPLEMENTED. Gates 1, 2, 3 passed.

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

