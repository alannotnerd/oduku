# Traces to: SPEC-018
Feature: X-Wing detection
  As a player requesting a hint
  I want the solver to detect X-Wing patterns
  So that candidates can be eliminated from the crossing columns or rows

  Background:
    Given a 9x9 Sudoku board with candidates populated

  Scenario: Row-based X-Wing eliminates from columns
    Given candidate 6 appears in exactly 2 cells in row 1 at columns 3 and 8
    And candidate 6 appears in exactly 2 cells in row 5 at columns 3 and 8
    And column 3 has candidate 6 in row 8
    And column 8 has candidate 6 in rows 3 and 8
    And no simpler technique applies
    When I request a hint
    Then the technique is "X-Wing"
    And the description contains "X-Wing on 6"
    And the description mentions rows and columns of the pattern
    And the affected cells include cells in columns 3 and 8 outside rows 1 and 5 with eliminated [6]
    And the hint includes 4 strong links forming a rectangle

  Scenario: Column-based X-Wing eliminates from rows
    Given candidate 3 appears in exactly 2 cells in column 2 at rows 1 and 7
    And candidate 3 appears in exactly 2 cells in column 6 at rows 1 and 7
    And row 1 has candidate 3 in column 4
    And no simpler technique applies
    When I request a hint
    Then the technique is "X-Wing"
    And the affected cells include cells in rows 1 and 7 outside columns 2 and 6

  Scenario: X-Wing links array has 4 entries
    Given a valid row-based X-Wing exists on candidate 5 at rows 2,6 and columns 4,9
    And no simpler technique applies
    When I request a hint
    Then the hint has exactly 4 links
    And each link has type "strong"
    And all links reference candidate 5

  Scenario: No X-Wing exists
    Given no candidate appears in exactly 2 positions in 2 rows sharing the same columns
    And no candidate appears in exactly 2 positions in 2 columns sharing the same rows
    When I request a hint
    Then no X-Wing hint is returned

  Scenario: X-Wing pattern exists but no eliminations
    Given an X-Wing pattern exists on candidate 2
    And no other cell in the target columns has candidate 2
    When I request a hint
    Then no X-Wing hint is returned for that pattern
