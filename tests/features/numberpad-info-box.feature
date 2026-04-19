# Traces to: SPEC-009
Feature: NumberPad info box always shows the selected cell's location
  As a player using the NumberPad
  I want the left-edge info box to always display the selected cell's row/column label
  So that I always know which cell the pad is operating on, and I am not shown
  a value that is already visible in the grid itself.

  Background:
    Given the Oduku app is loaded
    And a puzzle is on the board

  Scenario: An empty non-fixed cell is selected
    Given the cell at row 1 column 5 is not a fixed clue
    And the cell at row 1 column 5 has no value
    When I select the cell at row 1 column 5
    Then the NumberPad is visible
    And the info box on the left edge of the NumberPad shows the text "R1C5"
    And the info box does not show any digit from 1 to 9

  Scenario: A non-fixed cell that already holds a user-entered value is selected
    Given the cell at row 4 column 4 is not a fixed clue
    And the cell at row 4 column 4 holds the value 7
    When I select the cell at row 4 column 4
    Then the NumberPad is visible
    And the info box on the left edge of the NumberPad shows the text "R4C4"
    And the info box does not show the digit "7"

  Scenario: Selection changes from an empty cell to a filled cell
    Given the cell at row 1 column 1 is selected and empty
    And the info box shows "R1C1"
    When I select the cell at row 9 column 9 which holds the value 3
    Then the info box shows "R9C9"
    And the info box does not show the digit "3"
