# Disable Pull-to-Refresh (Android Chrome)

- **Unit ID**: `SPEC-003`
- **Category**: constraint
- **Priority**: critical
- **Purpose**: Prevent the "pull down at top of page to refresh" gesture on Android Chrome from reloading the app mid-game.
- **Scope**:
  - Included: Android Chrome pull-to-refresh; equivalent behavior on Samsung Internet and other Chromium-based Android browsers.
  - Excluded: Desktop browser refresh shortcuts; PWA standalone reload from the OS.
- **Dependencies**: SPEC-002 (primary mechanism), SPEC-005 (must not break real touch input).

## Preconditions
- The user agent honors `overscroll-behavior-y: contain` or `none` as the pull-to-refresh suppressor.

## Behavior
- Pull-to-refresh MUST be suppressed by `overscroll-behavior-y: none` on `html` and `body` (already required by SPEC-002).
- Because some Android Chrome versions historically required the effect on the scrolling element (which in our case is the body with `position: fixed`), the application MUST also attach a passive-false `touchmove` listener on `document` that calls `event.preventDefault()` for touch events that occur outside any element opted into scrolling (SPEC-007) or into dedicated touch handling (SPEC-005).
- The listener MUST be installed exactly once at application bootstrap and removed on application tear-down.
- The listener MUST NOT call `preventDefault()` if the touch target or one of its ancestors is marked as scroll-allowed (SPEC-007) or touch-handled (SPEC-005).

## Postconditions
- Dragging from the top edge of the viewport toward the bottom on Android Chrome does NOT show the circular refresh indicator and does NOT trigger a reload.
- Interactive controls inside the app continue to receive `touchstart` / `touchmove` / `touchend` events (SPEC-005).

## Invariants
- At most one `touchmove` listener for the purpose of pull-to-refresh suppression is installed at a time.

## Error Conditions

| Trigger | Error | Expected Behavior |
|---------|-------|-------------------|
| Listener installed as passive by default | `preventDefault()` has no effect; pull-to-refresh still fires | Listener MUST be attached with `{ passive: false }`. |
| Listener blocks legitimate in-app scrolling in a sub-region | User cannot scroll a scrollable panel | The listener MUST detect the scroll-allowed ancestor and return without preventing. |

## State Transitions
Not applicable.

## Constraints
- The listener MUST be attached on `document`, not `window`, to guarantee the target of the event is always an `Element` rather than the window.
- The listener MUST tolerate events whose target is the document itself (e.g. touching outside all rendered elements in edge cases) by treating such events as safe to prevent.
- The listener MUST NOT call `preventDefault()` on a `touchmove` with more than one touch point — pinch/zoom and two-finger scroll in opted-in regions could be affected. Since multi-touch pinch-zoom is already disabled by the viewport meta (SPEC-006), this is belt-and-braces.

## Examples
- Example A: User on a Pixel phone opens Oduku in Chrome and drags down from the top 150 px. No refresh indicator; no reload.
- Example B: User scrolls within an opted-in scrollable panel (SPEC-007). The scroll works normally. Pulling that inner panel past its top does not trigger page refresh.

## Related Units
- SPEC-002 (primary CSS-level defense).
- SPEC-005 (input handling must not be starved).
- SPEC-007 (opt-in scroll regions must remain functional).
