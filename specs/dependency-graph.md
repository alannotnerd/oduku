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
```

Graph is acyclic. Implementation order (topological): SPEC-006 → SPEC-001 → SPEC-002 → SPEC-004 → SPEC-005 → SPEC-003 → SPEC-007.
