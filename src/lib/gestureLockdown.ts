/*
 * Gesture lockdown — global touchmove suppressor.
 *
 * Traces to:
 *   SPEC-003 (pull-to-refresh)
 *   SPEC-005 (preserve in-app touch)
 *   SPEC-007 (scoped scroll escape)
 *
 * Purpose: On Android Chrome, the CSS rules in index.css are not always
 * sufficient to stop pull-to-refresh because it is evaluated on the
 * scrolling element and can fire even when the root is non-scrollable via
 * `position: fixed`. This module attaches one `touchmove` listener on
 * `document` with `{ passive: false }` and calls `preventDefault()` unless
 * the touch target (or one of its ancestors) has explicitly opted out.
 *
 * Opt-out markers:
 *   - data-touch-handled    : component owns this touch (e.g. swipe gesture)
 *   - data-scroll-allowed   : SPEC-007 scrollable sub-region
 *
 * Multi-touch events are passed through unchanged so pinch/zoom (currently
 * disabled via viewport meta but possible in future) and any multi-finger
 * component handler are never preempted.
 */

const OPT_OUT_ATTRS = ['data-touch-handled', 'data-scroll-allowed'] as const;

function hasOptOutAncestor(start: EventTarget | null): boolean {
  let node: Node | null = start instanceof Node ? start : null;
  while (node && node.nodeType !== Node.DOCUMENT_NODE) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      for (const attr of OPT_OUT_ATTRS) {
        if (el.hasAttribute(attr)) return true;
      }
    }
    node = node.parentNode;
  }
  return false;
}

function onTouchMove(event: TouchEvent): void {
  // Do not interfere with multi-touch gestures.
  if (event.touches.length > 1) return;
  if (hasOptOutAncestor(event.target)) return;
  if (event.cancelable) event.preventDefault();
}

let installed = false;

export function installGestureLockdown(): () => void {
  if (installed) return () => {};
  installed = true;
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  return () => {
    document.removeEventListener('touchmove', onTouchMove);
    installed = false;
  };
}
