# Traces to: SPEC-012
Feature: Settings drawer for secondary and infrequent actions
  As a player
  I want secondary actions in a discoverable side drawer
  So that changing difficulty, importing a puzzle, or inspecting the techniques
  required are all one consistent tap away and never block the board

  Background:
    Given the Oduku app is loaded
    And an active game is in progress with difficulty "medium"
    And the settings drawer is closed

  Scenario: Tapping the hamburger opens the drawer from the right edge
    When I tap the header button with aria-label "Open settings"
    Then an element with role "dialog" and aria-label "Settings" is rendered
    And a scrim covering the viewport is rendered behind the drawer
    And the drawer panel is anchored to the right edge of the viewport
    And the drawer panel carries the attribute data-touch-handled

  Scenario: Tapping the scrim closes the drawer
    Given the settings drawer is open
    When I tap the scrim
    Then the drawer is closed
    And no drawer DOM remains in the tree

  Scenario: Tapping the dedicated close button closes the drawer
    Given the settings drawer is open
    When I tap the drawer button with aria-label "Close settings"
    Then the drawer is closed

  Scenario: Pressing Escape while the drawer is open closes the drawer
    Given the settings drawer is open
    When I press Escape
    Then the drawer is closed

  Scenario: Choosing a different difficulty writes the atom and closes the drawer
    Given the settings drawer is open
    And the current difficulty is "medium"
    When I tap the "Hard" row in the Difficulty section
    Then difficultyAtom becomes "hard"
    And the drawer is closed
    And the header difficulty indicator now reads "Hard"
    And newGameAtom is not invoked as a side effect

  Scenario: Choosing the currently selected difficulty still closes the drawer
    Given the settings drawer is open
    And the current difficulty is "medium"
    When I tap the "Medium" row in the Difficulty section
    Then difficultyAtom remains "medium"
    And the drawer is closed

  Scenario: The currently selected difficulty is visually distinguished
    Given the current difficulty is "expert"
    When I open the settings drawer
    Then the "Expert" row uses the accent background styling
    And the "Expert" row has aria-pressed "true"
    And every other difficulty row has aria-pressed "false"

  Scenario: Import opens the existing ImportModal and closes the drawer
    Given the settings drawer is open
    When I tap the "Import puzzle…" row in the Puzzle section
    Then the drawer is closed
    And ImportModal becomes visible

  Scenario: Puzzle details show the difficulty score and technique breakdown
    Given gameState.difficultyScore is 142
    And gameState.strategies is [{ title: "Naked Single", freq: 12 }, { title: "Hidden Pair", freq: 3 }]
    When I open the settings drawer
    Then the Puzzle details section displays "★142"
    And a chip displays "Naked Single ×12"
    And a chip displays "Hidden Pair ×3"

  Scenario: Puzzle details show a placeholder when no puzzle is loaded
    Given gameState.board.length is 0
    When I open the settings drawer
    Then the Puzzle details section displays "Puzzle details will appear once a game is loaded."
    And no difficulty-score line is rendered

  Scenario: Puzzle details handle imported puzzles with no strategy breakdown
    Given gameState.strategies is []
    And gameState.difficultyScore is 110
    When I open the settings drawer
    Then the Puzzle details section displays "★110"
    And the techniques block displays "No technique breakdown available for this puzzle."

  Scenario: The drawer cooperates with the global gesture listener
    Given the settings drawer is open
    When I touchmove inside the drawer panel
    Then the global touchmove listener walks the DOM ancestors and finds data-touch-handled
    And the global listener does not call preventDefault on the event
    And the drawer's internal scrollable region carries data-scroll-allowed

  Scenario: The drawer closes cleanly and is removed from the DOM
    Given the settings drawer is open
    When I tap the scrim
    Then no element with role "dialog" and aria-label "Settings" remains in the DOM
    And no element with the drawer scrim z-40 background remains in the DOM

  Scenario: No new Jotai atom is used for drawer state
    When I inspect src/store/game.ts
    Then no new atom named "drawerOpenAtom" or similar drawer-state atom exists
    And the drawer's open state is owned by a useState in Header.tsx

  Scenario: No new external dependency is added
    When I inspect package.json
    Then the dependencies list is unchanged relative to before this change
    And no drawer / sidebar / modal library has been added
