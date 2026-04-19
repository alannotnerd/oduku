# Preserve In-App Touch and Swipe Input to Game Surfaces

- **Unit ID**: `SPEC-005`
- **Category**: behavior
- **Priority**: critical
- **Purpose**: Guarantee that the game's existing and future touch interactions — cell taps, number-pad taps, the swipe-up gesture on candidate buttons in `NumberPad`, and the drag gesture in `BottomPanel` — continue to receive events and work correctly after the page-level lockdown is applied.
- **Scope**:
  - Included: All React components under `src/components/` that consume `onClick`, `onTouchStart`, `onTouchMove`, `onTouchEnd`, or pointer events.
  - Excluded: New game features not yet implemented.
- **Dependencies**: SPEC-001, SPEC-002, SPEC-003, SPEC-004.

## Preconditions
- All SPEC-001..004 mechanisms are active.
- The React tree is mounted under `#root`.

## Behavior
- Cell taps (`Cell.tsx` `onClick`) MUST continue to select the cell.
- Number-pad number taps MUST continue to place values / toggle notes.
- The number-pad swipe-up gesture (`NumberPad.tsx` `handleTouchStart` / `handleTouchMove` / `handleTouchEnd`) MUST continue to activate the scroll wheel and mark candidates.
- The `BottomPanel` drag gesture (currently using `touchAction: 'none'`) MUST continue to work.
- The `touchmove` listener installed per SPEC-003 MUST NOT call `preventDefault()` on events whose target chain contains an element carrying the `data-game-surface` attribute OR an element that has attached its own `onTouchMove` handler. The simplest deterministic rule, which this specification mandates, is: the global listener MUST call `preventDefault()` ONLY when the target is the `body`, `html`, `#root`, or an element explicitly opted into being "page background" (no game handler attached). Since our root container covers the whole viewport and carries `data-game-surface`, most in-app touches will NOT be globally prevented — they fall through to the component handlers.
- Components that implement their own swipe gestures MUST call `event.preventDefault()` in their `onTouchStart`/`onTouchMove` (already done in `NumberPad.tsx`) to signal to the browser that they consume the touch.

## Postconditions
- All regression scenarios for `Cell`, `NumberPad`, `BottomPanel`, `Header`, `HintPanel`, `WinModal`, `ImportModal` pass.
- No touch input is blocked by the lockdown layer.

## Invariants
- For every element `E` with an `onTouchStart`/`onTouchMove`/`onTouchEnd` React handler, a touchmove originating in `E` is delivered to that handler before any global prevention logic can cancel the event.

## Error Conditions

| Trigger | Error | Expected Behavior |
|---------|-------|-------------------|
| Global listener preempts a component's `onTouchMove` | Swipe gesture broken | Global listener MUST be attached with `{ passive: false }` on `document` using `addEventListener`, and MUST use the "opt-out via target walk" algorithm below to avoid preempting component handlers. |
| A new component forgets to `preventDefault()` in its touch handler | Page tries to scroll (but is already locked) | No user-visible effect because scrolling is already disabled. No remediation required at global listener level. |

### Opt-out Algorithm (global `touchmove` listener)

```
on touchmove(event):
    if event.touches.length > 1:
        return  # do not interfere with multi-touch
    target = event.target
    walk up the DOM from target:
        if element has attribute data-scroll-allowed:
            return  # SPEC-007 opt-in
        if element has attribute data-touch-handled:
            return  # component owns this touch
    event.preventDefault()
```

## State Transitions
Not applicable.

## Constraints
- Every React component that owns a touch gesture MUST render its root element with the attribute `data-touch-handled` so the global listener respects it.
- Adding the attribute MUST NOT change the element's styling or accessibility tree.

## Examples
- Example A: User swipes up on a candidate number in `NumberPad`. The component's `handleTouchMove` fires and the scroll wheel appears. The global listener sees `data-touch-handled` on the ancestor and does not call `preventDefault()` itself (the component already did).
- Example B: User touches an empty margin outside any game surface and drags. The global listener walks up the DOM, finds no `data-touch-handled` / `data-scroll-allowed`, and calls `preventDefault()` to block any pull-to-refresh attempt.

## Related Units
- SPEC-003 (global listener).
- SPEC-007 (opt-in scroll regions).
