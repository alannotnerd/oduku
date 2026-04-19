# Traceability Matrix — Feature Scenarios to Specification Units

| Feature file | Scenario | Spec units |
|---|---|---|
| page-scroll-lockdown.feature | Vertical page scroll is disabled | SPEC-001 |
| page-scroll-lockdown.feature | Horizontal page scroll is disabled | SPEC-001 |
| page-scroll-lockdown.feature | Overscroll bounce is suppressed on iOS | SPEC-002 |
| page-scroll-lockdown.feature | Overscroll bounce is suppressed on Android | SPEC-002 |
| page-scroll-lockdown.feature | Viewport meta disables pinch-zoom | SPEC-006 |
| page-scroll-lockdown.feature | PWA installed in standalone mode shows no browser chrome | SPEC-006 |
| pull-to-refresh.feature | Dragging down from the top does not refresh | SPEC-003 |
| pull-to-refresh.feature | Dragging down from mid-page does not refresh | SPEC-003 |
| pull-to-refresh.feature | Multi-touch drag does not trigger the global prevent | SPEC-003, SPEC-005 |
| navigation-gestures.feature | iOS edge-swipe from the left does not navigate back (PWA) | SPEC-004, SPEC-006 |
| navigation-gestures.feature | iOS edge-swipe from the right does not navigate forward (PWA) | SPEC-004, SPEC-006 |
| navigation-gestures.feature | Android two-finger horizontal swipe does not navigate | SPEC-004, SPEC-002 |
| navigation-gestures.feature | Long-press does not open a text-selection callout | SPEC-004 |
| in-app-touch-preserved.feature | Tapping a Sudoku cell selects it | SPEC-005 |
| in-app-touch-preserved.feature | Tapping a number-pad button enters that number | SPEC-005 |
| in-app-touch-preserved.feature | Swiping up on a candidate opens the candidate-mark wheel | SPEC-005 |
| in-app-touch-preserved.feature | BottomPanel drag gesture continues to work | SPEC-005 |
| in-app-touch-preserved.feature | The root game surface opts out of global preventDefault | SPEC-005 |
| scoped-scroll-escape.feature | Opted-in region scrolls internally | SPEC-007 |
| scoped-scroll-escape.feature | Opted-in region does not rubber-band onto the page | SPEC-007, SPEC-002 |
| scoped-scroll-escape.feature | Opted-in region bypasses global preventDefault | SPEC-007, SPEC-005 |
| puzzle-generation-feedback.feature | The loading overlay is visible while a new game is being generated | SPEC-008 |
| puzzle-generation-feedback.feature | The loading overlay is hidden when idle | SPEC-008 |
| puzzle-generation-feedback.feature | The loading overlay appears when the app auto-starts its first game | SPEC-008 |
| puzzle-generation-feedback.feature | The loading overlay appears when starting a new game after completion via the header | SPEC-008, SPEC-010 |
| puzzle-generation-feedback.feature | The loading overlay appears while importing a puzzle | SPEC-008 |
| puzzle-generation-feedback.feature | The loading overlay is cleared when an import is rejected as invalid | SPEC-008 |
| puzzle-generation-feedback.feature | The loading overlay is cleared even if the generator throws | SPEC-008 |
| puzzle-generation-feedback.feature | Clicking the overlay does not interact with the board underneath | SPEC-008 |
| puzzle-generation-feedback.feature | Tapping New Game a second time during generation keeps the overlay visible | SPEC-008 |
| puzzle-generation-feedback.feature | The generator call yields to the event loop before blocking | SPEC-008 |
| numberpad-info-box.feature | An empty non-fixed cell is selected | SPEC-009 |
| numberpad-info-box.feature | A non-fixed cell that already holds a user-entered value is selected | SPEC-009 |
| numberpad-info-box.feature | Selection changes from an empty cell to a filled cell | SPEC-009 |
| no-congratulation-modal.feature | Completing the puzzle does not render a congratulation modal | SPEC-010 |
| no-congratulation-modal.feature | The timer freezes on completion even though no modal is shown | SPEC-010 |
| no-congratulation-modal.feature | Further cell-input attempts after completion are ignored and do not reveal a modal | SPEC-010 |
| no-congratulation-modal.feature | Starting a new game via the header works after completion | SPEC-010, SPEC-008 |
| no-congratulation-modal.feature | The WinModal component is absent from the codebase | SPEC-010 |

## Coverage by spec unit

| Spec | Priority | Covered by scenarios |
|---|---|---|
| SPEC-001 | critical | yes (2 scenarios) |
| SPEC-002 | critical | yes (4 scenarios) |
| SPEC-003 | critical | yes (3 scenarios) |
| SPEC-004 | critical | yes (4 scenarios) |
| SPEC-005 | critical | yes (5 scenarios) |
| SPEC-006 | critical | yes (4 scenarios) |
| SPEC-007 | standard | yes (3 scenarios) |
| SPEC-008 | critical | yes (10 scenarios) |
| SPEC-009 | standard | yes (3 scenarios) |
| SPEC-010 | critical | yes (5 scenarios) |

Every critical unit has at least one scenario. No orphan scenarios.
