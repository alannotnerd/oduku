# Disable Touch-Based Navigation Gestures

- **Unit ID**: `SPEC-004`
- **Category**: constraint
- **Priority**: critical
- **Purpose**: Prevent iOS Safari edge-swipe (swipe-from-left-edge → back, swipe-from-right-edge → forward), Android Chrome two-finger history swipe, and equivalent gestures from navigating away from the game mid-session.
- **Scope**:
  - Included: iOS edge-swipe back/forward; Android Chrome two-finger horizontal history swipe; text-selection callouts that can be triggered by long-press drags.
  - Excluded: Hardware back button (Android); OS-level swipe-from-home-bar; keyboard Alt-Left/Right (these are not touch gestures).
- **Dependencies**: SPEC-002 (horizontal overscroll suppression is part of the mechanism); SPEC-006 (PWA standalone display is the strongest defense).

## Preconditions
- On iOS, the edge-swipe gesture is triggered only by a touch that starts within ~20 px of the left or right viewport edge.
- On Android Chrome, the history-swipe is triggered only by a horizontal overscroll at the root scroller when the root can't scroll horizontally.

## Behavior
- Horizontal document-level overscroll MUST be disabled (`overscroll-behavior-x: none` on `html` and `body`, already required by SPEC-002).
- The app MUST be installable as a PWA with `display: standalone` or `display: fullscreen` (SPEC-006). In standalone/fullscreen mode, iOS edge-swipe does not navigate history (there is no history stack within the PWA chrome).
- When the app is loaded in a browser tab (not installed), the app MUST set `touch-action: none` on the root scrolling container for the areas outside opt-in zones, which prevents the browser from treating horizontal touch drags there as navigation gestures.
- Text selection via long-press MUST be suppressed on the game surfaces to avoid selection callouts that interfere with tap handling. The app MUST set `-webkit-user-select: none`, `user-select: none`, and `-webkit-touch-callout: none` on the root container (with a narrow opt-in for any region that must remain selectable, such as future text inputs).

## Postconditions
- Swiping from the left edge on iOS Safari in a browser tab: horizontal overscroll is blocked; the back-navigation animation may still appear marginally on certain iOS versions but MUST NOT navigate away (any residual animation is a known iOS-browser limitation, mitigated by recommending PWA install).
- Swiping from the left edge on iOS Safari installed as a PWA: no back-navigation is attempted (there is no history).
- Two-finger horizontal swipe on Android Chrome does NOT navigate history.
- Long-pressing any cell, button, or label does NOT open a context menu or text-selection callout.

## Invariants
- `touch-action` on the root app container resolves to `none` (or a value that excludes `pan-x` at document level).
- `user-select` on the root app container resolves to `none`.

## Error Conditions

| Trigger | Error | Expected Behavior |
|---------|-------|-------------------|
| User is in a browser tab (not PWA) on iOS and triggers edge-swipe | Partial back-navigation animation | App SHOULD show a PWA-install prompt or rely on `overscroll-behavior-x: none`. This MUST be documented as a known iOS Safari limitation that can only be fully mitigated by installing as a PWA. |
| A component uses `touch-action: auto` to re-enable panning in a sub-region | Navigation gesture may re-trigger in that sub-region | Sub-region MUST use `touch-action: pan-y` (vertical-only) or `touch-action: none`, never `auto`, unless SPEC-007 scroll escape is explicitly needed. |

## State Transitions
Not applicable.

## Constraints
- The PWA manifest MUST declare `"display": "standalone"` or `"display": "fullscreen"` (already `"standalone"` in current manifest — verify SPEC-006).
- The `apple-mobile-web-app-capable` meta tag MUST be `yes` (already present in index.html — verify SPEC-006).
- `touch-action: none` MUST be applied on the root container, not per-component, so that it cascades and does not have to be re-applied on every interactive element.
- Interactive elements that rely on native click MUST NOT have `touch-action: none` applied in a way that breaks click synthesis; `touch-action: manipulation` is acceptable on buttons that only need taps.

## Examples
- Example A: User on iPhone with Oduku installed as PWA swipes from the left edge. App does not navigate; the touch is either consumed by a cell/button or ignored.
- Example B: User long-presses a Sudoku cell. No iOS callout ("Copy · Share · ...") appears.
- Example C: User on Android Chrome two-finger-swipes right. No back-navigation.

## Related Units
- SPEC-002 (horizontal overscroll suppression).
- SPEC-005 (in-app swipes on the number pad must still work).
- SPEC-006 (PWA manifest/meta).
