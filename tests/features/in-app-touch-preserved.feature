# Traces to: SPEC-005, SPEC-007
Feature: In-app touch input continues to work after lockdown
  As a player
  I want all existing taps, swipes, and drags inside the game to keep working
  So that the lockdown does not regress gameplay

  Background:
    Given the Oduku app is loaded
    And a new game has been started

  Scenario: Tapping a Sudoku cell selects it
    When I tap the cell at row 3, column 5
    Then the cell at row 3, column 5 is visually selected

  Scenario: Tapping a number-pad button enters that number
    Given I have selected an empty editable cell at row 3, column 5
    When I tap the number-pad button for 7
    Then the cell at row 3, column 5 displays the value 7

  Scenario: Swiping up on a candidate opens the candidate-mark wheel
    Given I have selected an empty cell at row 3, column 5
    And that cell has a candidate note for the number 4
    When I touch the number-pad button for 4
    And I drag upward by 30 pixels
    Then the candidate-mark scroll wheel appears anchored at my touch point
    And the global touchmove listener does not preempt this gesture

  Scenario: BottomPanel drag gesture continues to work
    Given the bottom panel is visible
    When I drag on the bottom panel's draggable surface
    Then the panel responds to the drag

  Scenario: The root game surface opts out of global preventDefault
    When I inspect the root application container
    Then it carries the attribute data-touch-handled
    And its descendants with their own touch handlers also carry data-touch-handled
