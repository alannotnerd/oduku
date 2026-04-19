# Scoped Scroll Escape Hatch for Legitimately Scrollable Regions

- **Unit ID**: `SPEC-007`
- **Category**: constraint
- **Priority**: standard
- **Purpose**: Define the single, controlled mechanism by which a sub-region is allowed to scroll, so that future panels (e.g., long hint lists) can scroll without violating page-level lockdown.
- **Scope**:
  - Included: An opt-in CSS class and/or data attribute that re-enables scroll within a specific sub-region.
  - Excluded: Global scroll re-enablement; any mechanism that modifies `html`/`body` scrolling.
- **Dependencies**: SPEC-001, SPEC-003, SPEC-005.

## Preconditions
- A component genuinely requires a scrollable viewport larger than its visible area (long list, scrollable help).

## Behavior
- The sub-region MUST apply both the CSS class `scroll-allowed` (or equivalent utility styling) AND the attribute `data-scroll-allowed`.
- The CSS class MUST set `overflow: auto`, `overscroll-behavior: contain`, and `touch-action: pan-y` (or `pan-x` / `pan-x pan-y` as appropriate).
- The attribute `data-scroll-allowed` MUST cause the global SPEC-003 touchmove listener to skip `preventDefault()` for events originating inside.
- The opt-in MUST NOT propagate overscroll to the ancestor page (via `overscroll-behavior: contain`).

## Postconditions
- A touch drag inside the opted-in region scrolls the region.
- A touch drag inside the opted-in region that reaches the region's scroll boundary does NOT scroll the page (blocked by SPEC-001) and does NOT rubber-band the page (blocked by SPEC-002 + `overscroll-behavior: contain`).

## Invariants
- `overscroll-behavior` on the opted-in region is never `auto`.

## Error Conditions

| Trigger | Error | Expected Behavior |
|---------|-------|-------------------|
| Region has `data-scroll-allowed` but no CSS overflow | Region cannot scroll despite opt-in | Developer MUST add `scroll-allowed` class (or equivalent styling). |
| Region has CSS overflow but no `data-scroll-allowed` | Global touchmove listener cancels scroll | Developer MUST add the attribute. |

## State Transitions
Not applicable.

## Constraints
- The opt-in MUST be composable with existing utility class systems (Tailwind v4 in this project).

## Examples
- Example A: A future settings panel lists many options. Wrap the list in `<div className="scroll-allowed overflow-auto" data-scroll-allowed>...</div>`. The list scrolls; the page does not; the page does not rubber-band.

## Related Units
- SPEC-001, SPEC-003, SPEC-005.
