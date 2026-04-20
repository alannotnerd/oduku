# Traces to: SPEC-013
Feature: Naked Pair detection in all units (rows, columns, boxes)
  As a player requesting a hint
  I want the solver to detect naked pairs in rows, columns, and boxes
  So that I receive elimination hints regardless of which unit the pair appears in

  Background:
    Given a 9x9 Sudoku board with candidates populated

  Scenario: Naked Pair detected in a row eliminates from other cells in the row
    Given row 1 has empty cells with these candidates:
      | cell  | candidates |
      | R1C2  | 4,7        |
      | R1C5  | 4,7        |
      | R1C3  | 3,4,7      |
      | R1C8  | 1,7        |
    When I request a hint
    Then the technique is "Naked Pair (Row)"
    And the description contains "Eliminate {4,7} from row 1"
    And the affected cells include R1C3 with eliminated [4,7]
    And the affected cells include R1C8 with eliminated [7]
    And the affected cells do not include R1C2 or R1C5

  Scenario: Naked Pair detected in a column eliminates from other cells in the column
    Given column 3 has empty cells with these candidates:
      | cell  | candidates |
      | R1C3  | 4,7        |
      | R5C3  | 4,7        |
      | R2C3  | 4,6,7      |
      | R8C3  | 1,4        |
    And no simpler technique applies
    When I request a hint
    Then the technique is "Naked Pair (Column)"
    And the description contains "Eliminate {4,7} from column 3"
    And the affected cells include R2C3 with eliminated [4,7]
    And the affected cells include R8C3 with eliminated [4]

  Scenario: Naked Pair detected in a box eliminates from other cells in the box
    Given box 5 (rows 4-6, cols 4-6) has empty cells with these candidates:
      | cell  | candidates |
      | R4C4  | 2,9        |
      | R5C5  | 2,9        |
      | R4C5  | 2,3,5      |
    And no simpler technique applies
    When I request a hint
    Then the technique is "Naked Pair (Box)"
    And the description contains "Eliminate {2,9} from box 5"
    And the affected cells include R4C5 with eliminated [2]
    And the affected cells do not include R4C4 or R5C5

  Scenario: Rows are searched before columns and boxes
    Given a naked pair exists in row 2 with eliminations
    And a naked pair exists in column 5 with eliminations
    When I request a hint
    Then the technique is "Naked Pair (Row)"

  Scenario: No naked pair exists
    Given no unit contains two cells with identical 2-candidate sets
    When I request a hint
    Then no Naked Pair hint is returned

  Scenario: Naked pair exists but produces no eliminations
    Given row 3 has R3C1 candidates {5,8} and R3C4 candidates {5,8}
    And all other empty cells in row 3 lack candidates 5 and 8
    When I request a hint
    Then no Naked Pair hint is returned for that unit
