# Disable Page-Level Vertical and Horizontal Scrolling

- **Unit ID**: `SPEC-001`
- **Category**: constraint
- **Priority**: critical
- **Purpose**: Guarantee that neither the document scrolling root (`html`/`body`) nor the React root container can scroll, so all touch/pointer drags inside the app do not translate into page scroll.
- **Scope**:
  - Included: `html`, `body`, `#root` scroll containment; default browser scrollbars; mouse-wheel, trackpad two-finger, and touch-drag page-scroll paths.
  - Excluded: Intra-component scrollable regions explicitly declared scrollable (see SPEC-007).
- **Dependencies**: SPEC-006 (viewport configuration establishes the full-screen layout that makes zero-scroll viable).

## Preconditions
- The application is rendered in a supported browser (iOS Safari 15+, Android Chrome 100+, desktop Chromium/Firefox/Safari current) or installed as a PWA.
- The root document contains a `<div id="root">` mounted by React.

## Behavior
- The document scrolling root MUST have `overflow: hidden` on both axes.
- Both `html` and `body` MUST have `height: 100%` (or equivalent dynamic-viewport equivalent such as `100dvh`) and `width: 100%`, so the viewport cannot grow beyond the visible area.
- The `body` MUST have `position: fixed` with `inset: 0` on touch platforms where `overflow: hidden` alone is insufficient to suppress rubber-banding (iOS Safari). This is an additional belt-and-braces measure, not a replacement.
- Neither `html`, `body`, nor `#root` MAY set `overflow: auto` or `overflow: scroll` on itself.
- The application's top-level container MUST fit inside `100dvh` and `100vw` so that content never overflows the viewport.

## Postconditions
- Calling `window.scrollY` or `document.documentElement.scrollTop` always returns `0`.
- `window.innerHeight === document.documentElement.clientHeight`.
- No horizontal scrollbar is ever rendered.

## Invariants
- For the lifetime of the page, `document.documentElement.scrollHeight <= document.documentElement.clientHeight`.
- `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.

## Error Conditions

| Trigger | Error | Expected Behavior |
|---------|-------|-------------------|
| Content overflows viewport due to a layout bug | Silent content clipping (no scroll available) | Do NOT re-enable scrolling; the layout bug MUST be fixed instead. Scroll MUST remain disabled. |
| A child component sets `overflow: auto` without opt-in | Unintended scrollable ancestor chain | The child MUST use SPEC-007 opt-in or MUST be refactored to not require scrolling. |

## State Transitions
Not applicable — static CSS constraint.

## Constraints
- `overflow: hidden` and `position: fixed` MUST be applied via CSS in the global stylesheet, not inline styles, so they persist across React re-renders and cannot be accidentally overridden by utility classes.
- The fix MUST NOT rely on JavaScript event listeners for this requirement alone (JS is used only for SPEC-003 pull-to-refresh prevention); the page MUST be unscrollable even before JS executes.

## Examples
- Example A: User performs a two-finger trackpad swipe downward on the desktop browser while the mouse is over a Sudoku cell. No page scroll occurs; the event is consumed as a non-effect (no element in the app reacts).
- Example B: User touches an empty area of the page on mobile and drags down 200 px. The page does not move; no scrollbar appears.

## Related Units
- SPEC-002 (overscroll) — layered defense against bounce.
- SPEC-006 (viewport) — provides the `100dvh` foundation.
- SPEC-007 (scroll escape) — the only sanctioned way to permit scrolling in a sub-region.
