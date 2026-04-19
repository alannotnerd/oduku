# Disable Overscroll / Bounce Behavior

- **Unit ID**: `SPEC-002`
- **Category**: constraint
- **Priority**: critical
- **Purpose**: Eliminate the rubber-band / elastic-overscroll effect on iOS Safari and Android Chrome, and block the overscroll-chain that can scroll an ancestor when a child hits a scroll boundary.
- **Scope**:
  - Included: Document-level overscroll on both axes; any ancestor overscroll chain propagation.
  - Excluded: Internal scroll containers' own overscroll (those MUST also contain per SPEC-007, but fall under a separate scope).
- **Dependencies**: SPEC-001.

## Preconditions
- SPEC-001 is satisfied: the page itself does not scroll.

## Behavior
- The `html` and `body` elements MUST set `overscroll-behavior: none` (shorthand that covers `overscroll-behavior-x` and `overscroll-behavior-y`).
- On iOS Safari, the `body` MUST additionally have `position: fixed; inset: 0` (per SPEC-001) because iOS historically honors `overscroll-behavior` only on scrollable containers, not the root when the root is not scrolling. `position: fixed` prevents the viewport from moving.
- `-webkit-overflow-scrolling` MUST NOT be set to `touch` on any root-level container, because that re-enables elastic scrolling on iOS.

## Postconditions
- Attempting to drag the page past its edge produces no visible movement and no bounce-back animation on any supported browser.
- Events generated during such an attempted drag are either consumed by the underlying touch handlers (SPEC-005) or produce no effect.

## Invariants
- `overscroll-behavior` on the scrolling root resolves to `none` at all times.

## Error Conditions

| Trigger | Error | Expected Behavior |
|---------|-------|-------------------|
| A third-party CSS reset unsets `overscroll-behavior` | Rubber-band returns on iOS | The global stylesheet MUST be ordered after any reset and MUST re-assert `overscroll-behavior: none`. |

## State Transitions
Not applicable.

## Constraints
- `overscroll-behavior: none` MUST be declared on both `html` and `body` to cover browser engines that resolve the property on only one of them.
- The rule MUST use the shorthand `overscroll-behavior: none`, not `contain`. `contain` still allows the bounce animation on some browsers; only `none` suppresses it entirely.

## Examples
- Example A: On an iPhone in Safari (non-PWA), the user drags down from the top of the Sudoku board by 80 px. The page does not slide, revealing no white space under the status bar.
- Example B: On Android Chrome, the user drags up from the bottom. The page does not rubber-band; the Chrome nav bar does not hide-then-show.

## Related Units
- SPEC-001 (parent constraint).
- SPEC-003 (pull-to-refresh is a specific overscroll artifact on Android Chrome).
