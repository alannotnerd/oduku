# Traces to: SPEC-019
Feature: Swordfish detection
  As a player requesting a hint
  I want the solver to detect Swordfish patterns
  So that candidates can be eliminated from the target columns or rows

  Background:
    Given a 9x9 Sudoku board with candidates populated

  Scenario: Row-based Swordfish eliminates from columns
    Given candidate 4 positions in the board:
      | row | columns |
      | 1   | 2,6     |
      | 4   | 2,6,9   |
      | 8   | 6,9     |
    And the union of columns is {2,6,9} with size 3
    And column 2 has candidate 4 in row 7
    And column 9 has candidate 4 in row 3
    And no simpler technique applies
    When I request a hint
    Then the technique is "Swordfish"
    And the description contains "Swordfish on 4"
    And the description mentions rows 1,4,8 and columns 2,6,9
    And the affected cells are in columns 2,6,9 but outside rows 1,4,8 with eliminated [4]
    And the hint includes links connecting the pattern cells

  Scenario: Column-based Swordfish eliminates from rows
    Given a Swordfish pattern exists in 3 columns with union of rows = 3
    And there are eliminations in those rows outside the 3 columns
    And no simpler technique applies
    When I request a hint
    Then the technique is "Swordfish"

  Scenario: No Swordfish exists
    Given no candidate can form a valid 3-row or 3-column Swordfish
    When I request a hint
    Then no Swordfish hint is returned

  Scenario: Swordfish exists but no eliminations
    Given a Swordfish pattern exists but all cells in the target columns outside the pattern rows already lack the candidate
    When I request a hint
    Then no Swordfish hint is returned for that pattern

  Scenario: Swordfish with 2-position rows is valid
    Given each of the 3 rows in the Swordfish has only 2 positions for the candidate
    And the union of those positions spans exactly 3 columns
    And no simpler technique applies
    When I request a hint
    Then the technique is "Swordfish"
