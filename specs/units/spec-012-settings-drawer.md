# Settings drawer for secondary and infrequent actions

- **Unit ID**: `SPEC-012`
- **Category**: behavior
- **Priority**: critical
- **Purpose**: Introduce a right-edge drawer that houses the secondary / infrequently used actions removed from the header by SPEC-011: difficulty selection, puzzle import, and the read-only "Techniques Required" puzzle-details panel. The drawer provides a single discoverable location for one-per-game operations and supports a minimal, tap-to-dismiss interaction model appropriate for a casual mobile-first PWA.
- **Scope**:
  - Included:
    - A new component file `src/components/SettingsDrawer.tsx` that renders the drawer.
    - The drawer's open/closed state, scrim, entry/exit animation, and close triggers (scrim tap, Escape key).
    - The drawer's internal sections: difficulty selector (radio-group style list), import-puzzle entry point (opens the existing `ImportModal`), techniques-required read-only section (uses `gameState.strategies` and `gameState.difficultyScore`), and an "about" footer (single short line; no external links).
    - The integration point: the drawer component is rendered by `Header.tsx` (or as a sibling of it inside the same `<header>`) so that a single `useState` in `Header.tsx` owns the open/closed state and passes it down. No Jotai atom is added.
  - Excluded:
    - Swipe-to-close gesture. Close is via scrim tap or Escape only. Rationale in Open Issues.
    - Focus trap / full modal semantics. The drawer has `role="dialog"` and `aria-modal="true"` but does not trap focus. Rationale: the input is "casual game" per the user's explicit instruction.
    - Any new Jotai atom.
    - Any change to `ImportModal`, `HintPanel`, `LoadingOverlay`, `BottomPanel`.
- **Dependencies**: SPEC-011 (hamburger trigger), SPEC-005 (must not break global gesture listener).

## Preconditions

- `Header.tsx` renders a hamburger button per SPEC-011.
- `gameStateAtom`, `difficultyAtom`, `importPuzzleAtom`, `newGameAtom` are readable / writable with their existing semantics.
- `ImportModal` is available for import.

## Behavior

### State ownership

- A single `useState<boolean>` named `drawerOpen` in `Header.tsx` owns the drawer's open state. It MUST NOT live in a Jotai atom. Rationale: the state is purely visual, never read from outside the header subtree, and introducing a global atom would add surface area without benefit.
- A second `useState<boolean>` named `importOpen` in `Header.tsx` owns the `ImportModal`'s open state. The drawer triggers it by calling a prop callback. (Alternative: colocate both states in `SettingsDrawer.tsx` and render `<ImportModal>` there. Implementation chooses the `Header.tsx` ownership model because `ImportModal` was already mounted by `Header.tsx` prior to this change and relocating it further is unnecessary scope.)

### Rendering contract

When `drawerOpen === false`:
- No drawer DOM is rendered. (The component may still be mounted; when closed it returns `null` or renders elements with `aria-hidden="true"` and `pointer-events: none` — either is acceptable. Implementation choice: render `null` when closed to keep the DOM minimal.)

When `drawerOpen === true`:
- A scrim (`<div>`) covers the viewport using `fixed inset-0 bg-ink/40 z-40`. Tap on the scrim MUST close the drawer.
- A panel (`<aside>` with `role="dialog"` and `aria-modal="true"` and `aria-label="Settings"`) is rendered as `fixed top-0 right-0 h-full w-[min(85vw,320px)] bg-paper shadow-xl z-50` with the SPEC-005 opt-out attribute `data-touch-handled` on its root so the global touchmove listener does not preempt the user's taps inside it.
- The panel MUST carry `data-scroll-allowed` and the `.scroll-allowed` class on its scrollable inner content wrapper (per SPEC-007) so a user whose settings content exceeds the viewport can scroll the panel's inner list. (The drawer content is short; this is defensive and trivially satisfied by adding the class.)

### Drawer contents (top to bottom)

1. **Header row** inside the drawer:
   - `<h2>` with the text `Settings`, styled `text-lg font-bold text-ink`.
   - A close `<button>` with `aria-label="Close settings"` rendered as an `X` icon (inline SVG same pattern as existing icons). Tap closes the drawer.
2. **Section: Difficulty** (heading `<h3>Difficulty</h3>`, `text-sm font-medium text-grid/80 mb-2`):
   - A vertical list of five `<button>` rows, one per difficulty in order `easy, medium, hard, expert, master`.
   - Each row shows the capitalised label. The currently-selected row MUST be visually distinguished with `bg-accent text-white`; other rows use `bg-highlight text-grid hover:bg-grid/10`. The row MUST have `aria-pressed` reflecting whether it is the current difficulty.
   - Tapping a non-current row MUST call the `difficultyAtom` setter with that value AND close the drawer (consistent with prior UX where picking from the dropdown closed the menu). It MUST NOT call `newGameAtom` — difficulty governs the *next* generated puzzle, exactly as before.
   - A short hint line below the list: `"Applies to the next new game"`, `text-xs text-grid/50`.
3. **Section: Puzzle** (heading `<h3>Puzzle</h3>`, same styling as the Difficulty heading):
   - One `<button>` row labelled `Import puzzle…` with the existing import icon. Tap closes the drawer AND opens `ImportModal` via the parent's `setImportOpen(true)` prop. (Closing the drawer first avoids stacking two overlays; the modal is the active surface afterwards.)
4. **Section: Puzzle details** (heading `<h3>Puzzle details</h3>`):
   - If `gameState.board.length === 0` or `gameState.difficultyScore <= 0`: renders a muted placeholder: `"Puzzle details will appear once a game is loaded."` (`text-xs text-grid/50`).
   - Otherwise:
     - A line showing `"Difficulty score: ★{Math.round(gameState.difficultyScore)}"`, styled `text-sm text-grid font-mono`.
     - If `gameState.strategies.length > 0`, a labelled block `"Techniques required:"` followed by the same chip layout currently used inside the header's info panel: `flex flex-wrap gap-1`, each chip `px-2 py-0.5 bg-highlight rounded text-xs text-grid/80` with `{title} ×{freq}`.
     - If `gameState.strategies.length === 0`, the technique block is replaced with a single line `"No technique breakdown available for this puzzle."` (covers the import path where `strategies` is empty).
5. **About footer**: a `<p>` at the bottom with `text-xs text-grid/50` containing `"Sudoku · Mobile First"`. (The existing `<footer>` line in `App.tsx` remains unchanged; this is simply a matching label in the drawer.)

### Close triggers

The drawer MUST close when any of:
- The scrim is tapped.
- The dedicated close (`X`) button is tapped.
- A difficulty row is tapped (after writing the new difficulty).
- The `Import puzzle…` row is tapped (after opening the modal).
- The user presses the `Escape` key while the drawer is open.

### Keyboard

- Opening the drawer MUST NOT move keyboard focus by default. (Rationale: this is a touch-first PWA and the user instructed no full focus trap. An initial focus move would conflict with an ongoing keyboard input flow on the board.)
- An `Escape` keypress while `drawerOpen === true` MUST close the drawer. Implementation via a `useEffect` installing `window.addEventListener('keydown', ...)` when `drawerOpen` is true and cleaning up on unmount / when it flips back to false.

### Animation

- The drawer's entry MUST use a CSS transform transition. When mounted (`drawerOpen` flips to `true`), the panel transitions from `translate-x-full` to `translate-x-0` over `transition-transform duration-200 ease-out`.
- On close, the panel is unmounted immediately (`return null`). A bidirectional slide-out animation is out of scope; the scrim's instant disappearance is acceptable for this iteration. (Consistent with how `HintPanel` and `ImportModal` are currently handled — both unmount immediately on close.)

### Accessibility

- The drawer panel root MUST carry `role="dialog"`, `aria-modal="true"`, `aria-label="Settings"`.
- Each icon-only button MUST carry a meaningful `aria-label` (`"Close settings"` for the X button; others are text-labeled and need no extra `aria-label`).
- The hamburger in the header (per SPEC-011) MUST carry `aria-expanded` that tracks `drawerOpen`.
- MUST NOT implement a focus trap.
- Headings inside the drawer MUST use semantic `<h2>`/`<h3>` so assistive tech can skim sections.

## Postconditions

- Every action removed from the header by SPEC-011 (difficulty change, import, techniques-required view, difficulty-score view) is reachable via at most two taps: one to open the drawer, one to choose the action.
- No Jotai atom was added for drawer state.
- No new library / dependency was added.
- The global gesture listener continues to function unchanged — the drawer's root carries `data-touch-handled` so the listener does not preempt touches inside the drawer.

## Invariants

- When `drawerOpen === false`, there is zero drawer DOM rendered. (No hidden off-screen panel hogging a stacking context.)
- When `drawerOpen === true`, exactly one scrim and one panel are rendered; they are siblings under the same React subtree rooted in `SettingsDrawer`.
- Opening the drawer while a game is in the middle of generating (SPEC-008 `isGeneratingAtom === true`) MUST NOT break the loading overlay's z-index priority: `LoadingOverlay` is rendered in `App.tsx` below the drawer in source order but uses `z-[...]` high enough to sit above the drawer. (Validation: if the overlay's z-index is lower than the drawer's `z-50`, update the overlay rather than the drawer, outside the scope of this unit. As of writing, `LoadingOverlay` in the repo renders with `z-[1000]` — higher than `z-50` — so no conflict.)

## Error Conditions

| Trigger | Error | Expected Behavior |
|---------|-------|-------------------|
| User taps a difficulty row while `isGeneratingAtom === true` | No guard | The `difficultyAtom` write still proceeds; this affects only the *next* generation and has no observable effect on the in-flight generation (same as before). Drawer still closes. |
| User taps `Import puzzle…` while `isGeneratingAtom === true` | No guard | The drawer closes and the modal opens. If the user actually submits, `importPuzzleAtom` will begin a second concurrent generation; SPEC-008's "last finisher wins" semantics apply. No specific guard needed here. |
| User taps the scrim AND the panel simultaneously (e.g., a two-finger tap straddling them) | Ambiguous close | Because the panel uses `onClick={e => e.stopPropagation()}` on its root, only the scrim's click handler fires. Drawer closes. |
| The drawer is opened, then the app receives a new-game trigger (e.g., via `Header.tsx` new-game button — but that button closes nothing automatically) | Visual overlap | New-game continues in background; `LoadingOverlay` appears on top; the drawer stays open until the user dismisses it. Acceptable — new-game is not a drawer operation. |
| Escape pressed while both drawer and ImportModal are open | Ambiguous close | Drawer was already closed when ImportModal was opened (the `Import puzzle…` tap closes it). So this state is unreachable by design. If reached via a future change, Escape MUST close only the drawer. |

## State Transitions

```
closed
   │
   │ hamburger tapped in Header
   ▼
open
   ├── scrim tapped        ──▶ closed
   ├── close (X) tapped    ──▶ closed
   ├── difficulty chosen   ──▶ (writes difficultyAtom) ──▶ closed
   ├── "Import…" tapped    ──▶ (sets importOpen=true) ──▶ closed
   └── Escape pressed      ──▶ closed
```

## Constraints

- The drawer width MUST be `min(85vw, 320px)`. Rationale: on a 360px viewport, 85vw leaves a 15vw (~54px) scrim visible at the left for tap-to-close; on wider viewports the drawer caps at 320px to avoid a comically wide panel on a tablet.
- The panel MUST open from the right edge only. Left-edge is avoided because iOS edge-swipe-back is suppressed per SPEC-004 but can confuse muscle memory; right-edge is unambiguous.
- No Jotai atom. No new library. No new Tailwind token.
- The root of the panel and scrim MUST be rendered as fixed-position elements so they render above `<main>`. `z-40` (scrim) and `z-50` (panel) MUST be used — same stacking tokens already used by `ImportModal`.

## Examples

### Example A — Changing difficulty and starting a new game
1. User taps the hamburger in the header. `drawerOpen` flips to `true`.
2. Drawer appears from the right edge with a slide animation. The current difficulty `Medium` is highlighted with `bg-accent text-white`.
3. User taps `Hard`. `difficultyAtom` becomes `"hard"`. Drawer closes.
4. Header's difficulty indicator now reads `Hard`.
5. User taps the new-game button in the header. `newGameAtom` fires; loading overlay appears (SPEC-008); a fresh hard puzzle is generated.

### Example B — Importing a puzzle
1. User taps the hamburger. Drawer opens.
2. User taps `Import puzzle…`. Drawer closes and `ImportModal` opens.
3. User pastes a string, taps `Import`. `importPuzzleAtom` runs; modal closes on success.

### Example C — Viewing techniques required
1. The current game was generated with `strategies = [{title: "Naked Single", freq: 12}, {title: "Hidden Pair", freq: 3}]` and `difficultyScore = 142`.
2. User taps the hamburger. Drawer opens.
3. User scrolls to the Puzzle details section. Sees `★142` and two chips `Naked Single ×12` and `Hidden Pair ×3`.
4. User taps the scrim. Drawer closes.

### Example D — Escape closes the drawer
1. Drawer is open.
2. User presses Escape on a physical keyboard (desktop).
3. The keydown listener fires; `drawerOpen` flips to `false`; drawer unmounts.

## Related Units

- **SPEC-011** — Header re-layout. Owns the hamburger trigger and the post-header visual state.
- **SPEC-005** — Preserve in-app touch. The drawer root carries `data-touch-handled`.
- **SPEC-007** — Scoped scroll escape. The drawer's scrollable content region carries `data-scroll-allowed` + the `.scroll-allowed` class for defensive internal scrolling.
- **SPEC-008** — Puzzle generation loading feedback. Drawer does not interfere with the overlay's z-order.
- **SPEC-010** — No congratulation modal. Unchanged by this unit.
