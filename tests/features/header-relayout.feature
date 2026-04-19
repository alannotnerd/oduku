# Traces to: SPEC-011
Feature: Header re-layout with explicit primary actions
  As a player on a 360–420px mobile viewport
  I want the header to show only the controls I use during active play
  So that I never hunt for a hint, the timer, or a new-game button

  Background:
    Given the Oduku app is loaded
    And an active game is in progress with difficulty "medium"

  Scenario: Primary actions are reachable without opening the drawer
    Then the header displays the title "Sudoku"
    And the header displays a non-interactive difficulty indicator reading "Medium"
    And the header displays the running timer in mm:ss form
    And the header displays an explicit button with aria-label "Hint"
    And the header displays an explicit button with aria-label "New Game"
    And the header displays an explicit button with aria-label "Open settings"

  Scenario: Tapping the explicit hint button opens the hint panel
    When I tap the header button with aria-label "Hint"
    Then showHintAtom is invoked
    And the HintPanel becomes visible
    And no settings drawer is opened as a side effect

  Scenario: The cryptic score-badge easter egg is removed
    Then no element rendered by Header.tsx contains the text pattern "★" followed by digits
    And no onContextMenu handler is bound to any header descendant
    And no click handler inside Header.tsx invokes showHintAtom other than the explicit hint button

  Scenario: Tapping new-game still triggers the loading overlay
    When I tap the header button with aria-label "New Game"
    Then newGameAtom is invoked
    And the LoadingOverlay appears while the puzzle is generated

  Scenario: The difficulty indicator is informational only
    Then the difficulty indicator is not rendered as a <button>
    And the difficulty indicator has no onClick binding
    And the difficulty indicator displays "Medium" while difficultyAtom is "medium"

  Scenario: The hint button is disabled when no puzzle is loaded
    Given gameState.board.length is 0
    Then the header button with aria-label "Hint" carries the disabled attribute
    And tapping it is a no-op

  Scenario: The hint button is disabled when the puzzle is complete
    Given gameState.isComplete is true
    Then the header button with aria-label "Hint" carries the disabled attribute
    And no HintPanel opens when I tap it

  Scenario: The hamburger trigger's aria-expanded reflects the drawer state
    Given the settings drawer is closed
    Then the header button with aria-label "Open settings" has aria-expanded "false"
    When I tap the header button with aria-label "Open settings"
    Then the header button with aria-label "Open settings" has aria-expanded "true"

  Scenario: The inline "Techniques Required" panel no longer appears in the header
    When I inspect the rendered Header subtree
    Then no element inside the header contains the text "Techniques Required:"
    And no element inside the header renders entries from gameState.strategies

  Scenario: Tapping the title does nothing
    When I tap the "Sudoku" title
    Then no drawer opens
    And no hint is requested
    And no new game is started
