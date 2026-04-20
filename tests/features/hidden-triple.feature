# Traces to: SPEC-016
Feature: Hidden Triple detection in all units
  As a player requesting a hint
  I want the solver to detect hidden triples in rows, columns, and boxes
  So that I can reduce cells to only the triple's candidates

  Background:
    Given a 9x9 Sudoku board with candidates populated

  Scenario: Hidden Triple in a column eliminates non-triple candidates
    Given column 5 has empty cells where candidates 2, 6, and 9 each appear only in rows 1, 4, and 7:
      | cell  | candidates  |
      | R1C5  | 2,5,6,9     |
      | R4C5  | 2,6,8       |
      | R7C5  | 3,6,9       |
    And no simpler technique applies
    When I request a hint
    Then the technique is "Hidden Triple (Column)"
    And the description contains "Hidden Triple {2,6,9} in column 5"
    And the affected cells include R1C5 with eliminated [5]
    And the affected cells include R4C5 with eliminated [8]
    And the affected cells include R7C5 with eliminated [3]

  Scenario: Hidden Triple in a row
    Given row 2 has three candidates that appear only in three cells
    And at least one of those cells has extra candidates
    And no simpler technique applies
    When I request a hint
    Then the technique is "Hidden Triple (Row)"

  Scenario: Hidden Triple in a box
    Given box 3 has three candidates confined to exactly three cells
    And at least one cell has extra candidates beyond the triple
    And no simpler technique applies
    When I request a hint
    Then the technique is "Hidden Triple (Box)"

  Scenario: Hidden triple where all cells already have only the triple candidates
    Given three candidates appear in exactly three cells in a unit
    And all three cells have notes that are subsets of {a,b,c}
    When I request a hint
    Then no Hidden Triple hint is returned for that unit

  Scenario: No hidden triple exists
    Given no unit has three candidates confined to exactly three cells
    When I request a hint
    Then no Hidden Triple hint is returned
