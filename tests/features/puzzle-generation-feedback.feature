# Traces to: SPEC-008
Feature: Visible feedback while a puzzle is being generated or imported
  As a player
  I want to see that the app is working when a new puzzle is being generated
  So that I am not left staring at a frozen UI during the synchronous generator workload

  Background:
    Given the Oduku app is loaded

  Scenario: The loading overlay is visible while a new game is being generated
    Given no game is currently being generated
    When I tap the "New Game" button in the header
    Then the loading overlay becomes visible before the generator starts running
    And the overlay displays a spinner and a "Generating puzzle..." label
    And the overlay disappears once the new puzzle is ready

  Scenario: The loading overlay is hidden when idle
    Given no game is currently being generated
    Then the loading overlay is not visible

  Scenario: The loading overlay appears when the app auto-starts its first game
    Given the app has just been loaded and no board exists yet
    When the app auto-triggers a new game on mount
    Then the loading overlay is visible during generation
    And the loading overlay is hidden once the initial board is shown

  # Traces to: SPEC-008, SPEC-010 — the win modal was removed per SPEC-010, so
  # starting a new game after completion now flows exclusively through the header.
  Scenario: The loading overlay appears when starting a new game after completion via the header
    Given the previous game has been won and no congratulation modal is visible
    When I tap the "New Game" button in the header
    Then the loading overlay becomes visible before the generator starts running
    And the overlay disappears once the new puzzle is ready

  Scenario: The loading overlay appears while importing a puzzle
    Given the import modal is open with a valid 81-character puzzle string
    When I tap the "Import" button
    Then the loading overlay becomes visible before the solver starts running
    And the overlay disappears once the imported puzzle is ready

  Scenario: The loading overlay is cleared when an import is rejected as invalid
    Given the import modal is open with an invalid 81-character string
    When I tap the "Import" button
    Then the loading overlay briefly appears
    And the loading overlay is hidden after the import is rejected
    And the board remains unchanged

  Scenario: The loading overlay is cleared even if the generator throws
    Given the generator is configured to throw on the next call
    When I tap the "New Game" button in the header
    Then the loading overlay becomes visible
    And the loading overlay is hidden after the error propagates
    And the isGeneratingAtom is false

  Scenario: Clicking the overlay does not interact with the board underneath
    Given a new game is being generated and the overlay is visible
    When I click on the center of the overlay at the same screen position as a cell
    Then no cell becomes selected
    And the overlay itself exposes no interactive controls

  Scenario: Tapping New Game a second time during generation keeps the overlay visible
    Given a new game is being generated and the overlay is visible
    When I tap the "New Game" button again
    Then the loading overlay remains visible
    And the overlay is hidden only after the latest generation completes

  Scenario: The generator call yields to the event loop before blocking
    Given the local provider's generator is synchronous and blocks for at least 200 ms
    When I tap the "New Game" button in the header
    Then React commits the loading overlay in a frame before the generator returns
    And the user observes the overlay rather than a frozen UI
