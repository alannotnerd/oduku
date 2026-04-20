# Traces to: SPEC-017
Feature: Claiming (Box-Line Reduction)
  As a player requesting a hint
  I want the solver to detect when a candidate in a row or column is confined to one box
  So that the candidate can be eliminated from other cells in that box

  Background:
    Given a 9x9 Sudoku board with candidates populated

  Scenario: Row claiming eliminates from the rest of the box
    Given in row 2, candidate 5 appears only in R2C1 and R2C3 (both in box 1)
    And box 1 also has R1C2 with candidate 5 and R3C1 with candidate 5
    And no simpler technique applies
    When I request a hint
    Then the technique is "Claiming"
    And the description contains "Eliminate 5 from box 1"
    And the explanation mentions that 5 in row 2 is confined to box 1
    And the affected cells include R1C2 with eliminated [5]
    And the affected cells include R3C1 with eliminated [5]
    And the affected cells do not include R2C1 or R2C3

  Scenario: Column claiming eliminates from the rest of the box
    Given in column 6, candidate 3 appears only in R4C6 and R5C6 (both in box 5)
    And box 5 also has R3C7 with candidate 3
    And no simpler technique applies
    When I request a hint
    Then the technique is "Claiming"
    And the description contains "Eliminate 3 from box"
    And the affected cells include a cell in box 5 outside column 6

  Scenario: Claiming vs Pointing Pair distinction
    Given in box 1, candidate 8 is confined to row 1 (pointing pair direction)
    And in row 4, candidate 8 is confined to box 2 (claiming direction)
    When the solver checks for Pointing Pair first
    Then the Pointing Pair is returned for the box-to-row case
    And the Claiming technique would be used for the row-to-box case

  Scenario: No claiming pattern exists
    Given no row or column has a candidate confined to a single box with further eliminations
    When I request a hint
    Then no Claiming hint is returned

  Scenario: Candidate confined to one box but no eliminations in the box
    Given in row 5, candidate 7 appears only in cells within box 5
    And no other cell in box 5 outside row 5 has candidate 7
    When I request a hint
    Then no Claiming hint is returned for that pattern
