# Traces to: SPEC-020
Feature: XY-Wing detection
  As a player requesting a hint
  I want the solver to detect XY-Wing patterns
  So that the shared candidate Z can be eliminated from cells seeing both wings

  Background:
    Given a 9x9 Sudoku board with candidates populated

  Scenario: Basic XY-Wing with row and column wings
    Given R1C1 has candidates {3,7} (pivot)
    And R1C5 has candidates {3,9} (wing 1 shares row with pivot)
    And R4C1 has candidates {7,9} (wing 2 shares column with pivot)
    And R4C5 has candidates {1,5,9} (sees both wings)
    And no simpler technique applies
    When I request a hint
    Then the technique is "XY-Wing"
    And the description contains "pivot R1C1"
    And the description contains "eliminate 9"
    And the affected cells include R4C5 with eliminated [9]
    And the hint includes 2 strong links from pivot to each wing

  Scenario: XY-Wing with box-based wing connection
    Given R5C5 has candidates {2,6} (pivot)
    And R5C8 has candidates {2,4} (wing 1 shares row with pivot)
    And R4C4 has candidates {4,6} (wing 2 shares box with pivot)
    And R4C8 has candidates {3,4,7} (sees both wings)
    And no simpler technique applies
    When I request a hint
    Then the technique is "XY-Wing"
    And the affected cells include R4C8 with eliminated [4]

  Scenario: Pivot and wings are not in affected cells
    Given a valid XY-Wing pattern with pivot, wing1, wing2, and elimination targets
    And no simpler technique applies
    When I request a hint
    Then the affected cells do not include the pivot cell
    And the affected cells do not include either wing cell

  Scenario: Multiple cells see both wings
    Given a valid XY-Wing exists where Z=5
    And three cells see both wings and contain candidate 5
    And no simpler technique applies
    When I request a hint
    Then the technique is "XY-Wing"
    And all three cells appear in affected cells with eliminated [5]

  Scenario: No XY-Wing exists
    Given no cell with 2 candidates has two peers forming a valid wing pair
    When I request a hint
    Then no XY-Wing hint is returned

  Scenario: XY-Wing pattern exists but no cell sees both wings
    Given a valid pivot-wing1-wing2 configuration exists
    But no empty cell with Z in its candidates sees both wings
    When I request a hint
    Then no XY-Wing hint is returned for that pattern

  Scenario: XY-Wing links show pivot-wing connections
    Given a valid XY-Wing with pivot {X,Y}, wing1 {X,Z}, wing2 {Y,Z}
    And no simpler technique applies
    When I request a hint
    Then the hint has exactly 2 links
    And one link connects pivot to wing1 on candidate X with type "strong"
    And one link connects pivot to wing2 on candidate Y with type "strong"
