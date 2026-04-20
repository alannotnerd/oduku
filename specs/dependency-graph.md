# Dependency Graph

```
SPEC-006 (viewport & PWA config)
   ├── depended-on by SPEC-001
   └── depended-on by SPEC-004

SPEC-001 (disable page scroll)
   ├── depends on SPEC-006
   └── depended-on by SPEC-002, SPEC-007

SPEC-002 (disable overscroll)
   ├── depends on SPEC-001
   └── depended-on by SPEC-003, SPEC-004

SPEC-003 (pull-to-refresh)
   ├── depends on SPEC-002, SPEC-005
   └── depended-on by SPEC-007

SPEC-004 (navigation gestures)
   ├── depends on SPEC-002, SPEC-006
   └── depended-on by SPEC-005 (indirectly — in-app touch must coexist)

SPEC-005 (preserve in-app touch)
   ├── depends on SPEC-001, SPEC-002, SPEC-003, SPEC-004
   └── depended-on by SPEC-007

SPEC-007 (scoped scroll escape)
   └── depends on SPEC-001, SPEC-003, SPEC-005

SPEC-008 (puzzle generation loading feedback)
   └── no dependencies (independent of the gesture-lockdown series)

SPEC-009 (NumberPad info box always shows cell location)
   └── no dependencies (independent of all other units)

SPEC-010 (No congratulation modal on puzzle completion)
   └── no dependencies (independent of all other units); updates SPEC-005 postcondition wording and SPEC-008 sibling-of-WinModal note for accuracy only

SPEC-011 (Header re-layout with explicit primary actions)
   ├── depends on SPEC-012 (hamburger trigger opens the drawer)
   └── cooperates with SPEC-005 (header inside data-touch-handled root), SPEC-008 (new-game still fires loading overlay), SPEC-010 (new-game-after-completion flow preserved)

SPEC-012 (Settings drawer for secondary and infrequent actions)
   ├── depends on SPEC-011 (hamburger trigger is the only open-path)
   ├── depends on SPEC-005 (drawer root must carry data-touch-handled)
   └── depends on SPEC-007 (drawer scrollable content carries data-scroll-allowed)
```

SPEC-013 (Naked Pair Fix — rows, columns, boxes)
   └── no dependencies (extends existing findNakedPair)

SPEC-014 (Hidden Pair)
   └── no dependencies

SPEC-015 (Naked Triple)
   └── no dependencies

SPEC-016 (Hidden Triple)
   └── no dependencies

SPEC-017 (Claiming / Box-Line Reduction)
   └── no dependencies

SPEC-018 (X-Wing)
   └── no dependencies

SPEC-019 (Swordfish)
   └── no dependencies (conceptually generalizes SPEC-018 but no code dependency)

SPEC-020 (XY-Wing)
   └── no dependencies
```

Graph is acyclic. Implementation order (topological): SPEC-006 → SPEC-001 → SPEC-002 → SPEC-004 → SPEC-005 → SPEC-003 → SPEC-007. SPEC-008, SPEC-009, and SPEC-010 may be implemented at any point; they have no ordering relationship to the others. SPEC-011 and SPEC-012 are mutually referential at the UI contract level but not at the implementation dependency level — they ship in a single change because the hamburger and the drawer are two sides of the same interaction. Implementation order within that change: build the drawer component first (pure presentational given props), then wire it into the header.

SPEC-013..020 are all independent of each other and of SPEC-001..012. They all modify `solver.ts` and `score.ts` within the local provider. Implementation order follows the `getHint()` cascade order: SPEC-013 → SPEC-014 → SPEC-015 → SPEC-016 → SPEC-017 → SPEC-018 → SPEC-019 → SPEC-020.
