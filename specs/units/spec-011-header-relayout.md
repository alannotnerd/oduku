# Header re-layout with explicit primary actions

- **Unit ID**: `SPEC-011`
- **Category**: behavior
- **Priority**: critical
- **Purpose**: Replace the current single-row `Header` that commingles primary gameplay actions (timer, hint) with secondary configuration actions (difficulty selector, import) and hides the hint action behind an undiscoverable easter-egg "score badge". After this change, the header MUST contain only controls used during active play plus a single trigger that opens a settings drawer (SPEC-012) for secondary / infrequently used actions.
- **Scope**:
  - Included:
    - `src/components/Header.tsx`: removal of the difficulty selector dropdown, import button, and the `★{difficultyScore}` easter-egg button; addition of an explicit labeled hint button; addition of a non-interactive current-difficulty indicator; addition of a hamburger/menu trigger that opens the drawer owned by SPEC-012.
    - Inline "Techniques Required" strategies panel currently rendered in `Header.tsx` — removed from the header (its content moves into the drawer per SPEC-012).
    - Timer behaviour: no change — same `useEffect` interval gated on `gameState.isComplete` and `gameState.board.length === 0`.
    - `ImportModal` mount: moves out of the header; the modal's open/close state is owned by the drawer component per SPEC-012 and the modal continues to render via React portal-less fixed overlay as today.
  - Excluded:
    - `gameState` shape, any store atom, `selectedCellAtom`, the global gesture listener, the PWA manifest.
    - `Board`, `NumberPad`, `BottomPanel`, `HintPanel`, `LoadingOverlay`, `ImportModal` internals.
    - Design tokens — only existing Tailwind classes and the color tokens already defined in `src/index.css` (`bg-paper`, `bg-highlight`, `text-ink`, `text-grid`, `text-accent`, `bg-accent`, `accent-light`, `grid/20`, `grid/50`, `grid/80`, `accent/10`, `accent/20`) MUST be used. No new tokens.
- **Dependencies**: SPEC-012 (drawer — the hamburger trigger and the drawer-content contract).

## Preconditions
- The app is mounted and `gameStateAtom` is readable (may be in the initial empty-board state when the app is still bootstrapping its first puzzle).
- The atoms `difficultyAtom`, `newGameAtom`, `showHintAtom`, `gameStateAtom` exist with their current semantics (SPEC-011 does NOT redefine them).

## Behavior

### Layout (single row, flex, space-between)

The header MUST render exactly one flex row with the following children, left to right:

1. **Title + difficulty indicator group** (left cluster):
   - The text `"Sudoku"` rendered as `<h1>` with existing typography classes (`text-2xl font-bold text-ink tracking-tight`).
   - A small difficulty label rendered as a non-interactive `<span>` showing the capitalised current difficulty (`Easy` / `Medium` / `Hard` / `Expert` / `Master`), using existing `bg-highlight text-grid` styling at `text-xs` size, in a `rounded-full` pill. MUST NOT be a `<button>`, MUST NOT have `onClick`, MUST NOT have `onContextMenu`. Its purpose is purely informational — difficulty selection is in the drawer.
   - MUST NOT render the `★{difficultyScore}` pill. MUST NOT render any element whose primary click action is to call `showHint()`.
2. **Right cluster** (actions), in order:
   1. **Timer**: existing mm:ss display, styling preserved (`font-mono text-lg text-grid tabular-nums`), semantics unchanged (timer freezes on `isComplete` or empty board, same as before).
   2. **Hint button**: an explicit `<button>` that, on click, calls the existing `showHintAtom` setter. It MUST have `aria-label="Hint"` and MUST be reachable without opening any menu or drawer. It is disabled when `gameState.isComplete` is `true` OR `gameState.board.length === 0` (no puzzle yet). Styling: the same icon-button size and classes already used for the existing header icon-buttons (`p-2 bg-highlight text-grid rounded-lg active:scale-95 transition-all touch-manipulation`). Disabled state adds `disabled:opacity-40 disabled:cursor-not-allowed`. The icon is a lightbulb-style SVG rendered inline (no new asset).
   3. **New-game button**: an explicit `<button>` calling `newGameAtom`. Visual emphasis preserved (`p-2 bg-accent text-white rounded-lg shadow-md hover:bg-accent-light active:scale-95 transition-all touch-manipulation`), `aria-label="New Game"`. Icon unchanged.
   4. **Menu (hamburger) trigger**: an explicit `<button>` that opens the drawer (SPEC-012). It MUST carry `aria-label="Open settings"`, `aria-haspopup="dialog"`, and `aria-expanded` reflecting the drawer's open state. Styling matches the hint button (`p-2 bg-highlight text-grid rounded-lg active:scale-95 transition-all touch-manipulation`). Icon is a three-bar hamburger SVG rendered inline.

### Removals

- The easter-egg score button (the `★{difficultyScore}` pill with `onClick={showHint}` and `onContextMenu={toggleInfo}`) MUST be removed. There MUST NOT be any click or context-menu binding that toggles either hint invocation or a strategies panel from a rendered score-badge element.
- The difficulty dropdown menu (`setShowMenu` local state and its `<div>`/`<button>` cluster with `DIFFICULTIES.map`) MUST be removed from the header.
- The import-puzzle button and its owned `useState` MUST be removed from the header.
- The inline "Techniques Required" panel (the `{showInfo && gameState.strategies.length > 0 && ...}` block) MUST be removed from the header.
- The local `showMenu`, `showInfo`, and `showImport` `useState` declarations in `Header.tsx` MUST be deleted (their responsibilities move to SPEC-012's drawer component).

### Re-use of existing atoms

- The hint button MUST call the existing `showHintAtom` set action. No new hint atom is introduced.
- The new-game button MUST call the existing `newGameAtom` set action. No behavior change.
- The difficulty label MUST read from the existing `difficultyAtom` (no write binding).

## Postconditions

- The rendered header is a single row with the elements listed above, in the listed order.
- Every primary-gameplay action (see title) has at least one always-visible, labeled trigger reachable with zero additional taps from any app state where the header is visible.
- No right-click / `onContextMenu` handler exists anywhere inside `Header.tsx`.
- No element inside `Header.tsx` has `onClick` bound to `showHintAtom` other than the explicit hint button defined above.

## Invariants

- The header's DOM height MUST NOT exceed the height of the header prior to this change (one row of controls plus existing `py-4` padding). The previous layout already reserved space for a possibly-expanded strategies panel; that space MUST NOT be reserved in the new header (the panel is gone).
- No element in `Header.tsx` may hold or render any puzzle strategies list (`gameState.strategies`). That list is consumed only by the drawer component per SPEC-012.
- The header container MUST remain inside the `data-touch-handled` root and MUST NOT itself introduce `data-scroll-allowed` (it has nothing to scroll).

## Error Conditions

| Trigger | Error | Expected Behavior |
|---------|-------|-------------------|
| `gameState.board.length === 0` (initial bootstrap before first puzzle) | Hint button tapped | Button is rendered `disabled`; click is a no-op. No thrown error. |
| `gameState.isComplete === true` | Hint button tapped | Button is rendered `disabled`; click is a no-op. Matches the no-op behavior already present in `showHintAtom`. |
| User performs a right-click / long-press on any header element | Any | No custom handler fires. Default browser context menu suppression is already handled globally via CSS (`user-select: none`, `-webkit-touch-callout: none` per SPEC-004). Header MUST NOT re-introduce an `onContextMenu` handler. |
| User taps the menu trigger while the drawer is already open | Drawer close | The drawer's open-state toggle is owned by SPEC-012. The header's `aria-expanded` MUST track that state. |

## State Transitions

```
collapsed (drawer closed, aria-expanded="false")
   │
   │ user taps hamburger
   ▼
expanded (drawer open, aria-expanded="true")  — owned by SPEC-012
   │
   │ drawer close event (scrim tap / Escape / swipe)
   ▼
collapsed
```

The header itself holds no other states. Difficulty changes and imports affect `difficultyAtom` / `importPuzzleAtom` but do not change header rendering beyond the value shown in the difficulty indicator.

## Constraints

- MUST NOT introduce any new Jotai atom.
- MUST NOT introduce any new dependency (no new libraries, no headless-ui, no portal library).
- MUST NOT add any cross-component shared state for the drawer's open/closed state (a local `useState` inside the drawer component or inside the header is sufficient — see SPEC-012 for the actual ownership choice).
- MUST reuse only Tailwind classes already used in the repository (classes enumerated in the Scope section, plus standard layout utilities `flex`, `items-center`, `justify-between`, `gap-*`, `px-*`, `py-*`, `rounded-lg`, `rounded-full`, `text-xs`, `w-5`, `h-5`, `mx-auto`, `w-full`, `max-w-[...]`, `hidden`, `sm:inline`, and similar pre-existing Tailwind primitives).
- MUST preserve `touch-manipulation` on every interactive button in the header.
- The hint and hamburger icons MUST be inline SVGs authored inside `Header.tsx` with `fill="none" stroke="currentColor" viewBox="0 0 24 24"` to match the existing icon pattern used for import/new-game.

## Examples

### Example A — Normal play
1. The app has finished bootstrapping; `gameState.board.length === 81` and `isComplete === false`.
2. The user sees: `Sudoku   [Medium]   01:23   [lightbulb]   [refresh]   [hamburger]`.
3. The user taps the lightbulb. `showHintAtom` fires; `HintPanel` opens. No drawer was involved.
4. The user dismisses the hint and taps the refresh icon. `newGameAtom` fires; the loading overlay appears (SPEC-008); a fresh puzzle replaces the board.
5. The hamburger was never required for either primary action.

### Example B — Completed puzzle
1. `isComplete === true`.
2. The hint button is rendered `disabled` with the `disabled:opacity-40 disabled:cursor-not-allowed` modifier.
3. The new-game button remains enabled. The timer is frozen (unchanged from prior behavior).

### Example C — Accessibility walk
1. A screen reader user focuses the hint button. It announces "Hint, button" (from `aria-label="Hint"`).
2. The user moves to the new-game button. It announces "New Game, button".
3. The user moves to the menu trigger. It announces "Open settings, button, collapsed" (from `aria-label` + `aria-expanded="false"`).

## Related Units

- **SPEC-012** — Settings drawer. This unit owns the secondary actions that used to live in the header.
- **SPEC-005** — In-app touch preservation. The header is inside `data-touch-handled`; this unit does not change that.
- **SPEC-008** — Puzzle generation loading feedback. Pressing new-game still triggers the loading overlay via the same atom.
- **SPEC-010** — No congratulation modal. The header's "new game after completion" flow is exactly the same; this unit does not alter it.
