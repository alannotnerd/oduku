# Traces to: SPEC-015
Feature: Naked Triple detection in all units
  As a player requesting a hint
  I want the solver to detect naked triples in rows, columns, and boxes
  So that I can eliminate triple candidates from other cells in the unit

  Background:
    Given a 9x9 Sudoku board with candidates populated

  Scenario: Naked Triple in a row with full 3-candidate cells
    Given row 1 has empty cells with these candidates:
      | cell  | candidates |
      | R1C2  | 1,4,7      |
      | R1C5  | 1,4,7      |
      | R1C8  | 1,4,7      |
      | R1C3  | 1,3,5      |
      | R1C6  | 4,8        |
    And no simpler technique applies
    When I request a hint
    Then the technique is "Naked Triple (Row)"
    And the description contains "Naked Triple {1,4,7} in row 1"
    And the affected cells include R1C3 with eliminated [1]
    And the affected cells include R1C6 with eliminated [4]
    And the affected cells do not include R1C2, R1C5, or R1C8

  Scenario: Naked Triple with subset candidates (not all cells have all 3)
    Given row 5 has empty cells with these candidates:
      | cell  | candidates |
      | R5C1  | 2,5        |
      | R5C3  | 2,5,8      |
      | R5C7  | 5,8        |
      | R5C4  | 2,6        |
    And the union of {2,5}, {2,5,8}, {5,8} is {2,5,8} with size 3
    And no simpler technique applies
    When I request a hint
    Then the technique is "Naked Triple (Row)"
    And the description contains "Naked Triple {2,5,8} in row 5"
    And the affected cells include R5C4 with eliminated [2]

  Scenario: Naked Triple in a column
    Given column 4 has three empty cells with union of candidates = {3,6,9}
    And other cells in column 4 contain some of those candidates
    And no simpler technique applies
    When I request a hint
    Then the technique is "Naked Triple (Column)"

  Scenario: Naked Triple in a box
    Given box 7 (rows 7-9, cols 1-3) has three empty cells with union = {1,5,7}
    And other cells in that box contain some of {1,5,7}
    And no simpler technique applies
    When I request a hint
    Then the technique is "Naked Triple (Box)"

  Scenario: No naked triple exists
    Given no unit contains three cells whose candidate union has exactly 3 values
    When I request a hint
    Then no Naked Triple hint is returned

  Scenario: Naked triple exists but produces no eliminations
    Given three cells form a naked triple but all other cells in the unit lack those candidates
    When I request a hint
    Then no Naked Triple hint is returned for that unit
