# Traces to: SPEC-014
Feature: Hidden Pair detection in all units
  As a player requesting a hint
  I want the solver to detect hidden pairs in rows, columns, and boxes
  So that I can narrow down candidates in cells with extra values

  Background:
    Given a 9x9 Sudoku board with candidates populated

  Scenario: Hidden Pair in a row eliminates non-pair candidates
    Given row 3 has empty cells with these candidates:
      | cell  | candidates  |
      | R3C1  | 1,3,5,8     |
      | R3C4  | 1,3,6,9     |
      | R3C2  | 5,6,8       |
      | R3C7  | 5,6,9       |
    And candidates 1 and 3 appear only in R3C1 and R3C4 within row 3
    And no simpler technique applies
    When I request a hint
    Then the technique is "Hidden Pair (Row)"
    And the description contains "Hidden Pair {1,3} in row 3"
    And the affected cells include R3C1 with eliminated [5,8]
    And the affected cells include R3C4 with eliminated [6,9]

  Scenario: Hidden Pair in a column
    Given column 5 has empty cells where candidates 4 and 8 appear only in R2C5 and R7C5
    And R2C5 has candidates {3,4,8} and R7C5 has candidates {1,4,8}
    And no simpler technique applies
    When I request a hint
    Then the technique is "Hidden Pair (Column)"
    And the description contains "Hidden Pair {4,8} in column 5"
    And the affected cells include R2C5 with eliminated [3]
    And the affected cells include R7C5 with eliminated [1]

  Scenario: Hidden Pair in a box
    Given box 1 (rows 1-3, cols 1-3) has empty cells where candidates 2 and 7 appear only in R1C2 and R2C3
    And R1C2 has candidates {2,5,7} and R2C3 has candidates {2,7,8}
    And no simpler technique applies
    When I request a hint
    Then the technique is "Hidden Pair (Box)"
    And the description contains "Hidden Pair {2,7} in box 1"
    And the affected cells include R1C2 with eliminated [5]
    And the affected cells include R2C3 with eliminated [8]

  Scenario: Hidden pair where both cells already equal {a,b} is skipped
    Given row 1 has candidates 3 and 6 appearing only in R1C2 and R1C8
    And R1C2 has candidates {3,6} and R1C8 has candidates {3,6}
    When I request a hint
    Then no Hidden Pair hint is returned for that unit

  Scenario: No hidden pair exists
    Given no unit has two candidates co-occurring in exactly two cells
    When I request a hint
    Then no Hidden Pair hint is returned
