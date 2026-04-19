# Traces to: SPEC-010
Feature: No congratulation modal on puzzle completion
  As a player
  I want to finish a puzzle without being interrupted by a celebratory modal
  So that the completed board stays visible and I remain in control of when to start the next game

  Background:
    Given the Oduku app is loaded
    And an active game is in progress

  Scenario: Completing the puzzle does not render a congratulation modal
    Given every cell except one is correctly filled
    When I enter the final correct digit in the remaining cell
    Then gameState.isComplete becomes true
    And no element with role "dialog" announcing completion is present in the DOM
    And no overlay, banner, toast, or inline "Congratulations" message is rendered
    And the completed board remains visible exactly as it was at the moment of completion

  Scenario: The timer freezes on completion even though no modal is shown
    Given every cell except one is correctly filled
    When I enter the final correct digit in the remaining cell
    Then the header timer stops advancing
    And no congratulation modal is rendered

  Scenario: Further cell-input attempts after completion are ignored and do not reveal a modal
    Given the puzzle has just been completed
    When I tap a non-fixed cell and press digit "5"
    Then the cell value is not changed
    And no congratulation modal appears as a result of the tap

  Scenario: Starting a new game via the header works after completion
    Given the puzzle has just been completed and no modal is visible
    When I tap the "New Game" button in the header
    Then newGameAtom is invoked
    And the loading overlay appears while the new puzzle is generated
    And once generation finishes, a fresh board is rendered
    And no congratulation modal is rendered at any point in this flow

  Scenario: The WinModal component is absent from the codebase
    When the application bundle is built
    Then the file "src/components/WinModal.tsx" does not exist
    And "src/App.tsx" does not import "./components/WinModal"
    And the rendered App tree contains no "<WinModal />" element
