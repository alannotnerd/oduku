# Traces to: SPEC-013, SPEC-014, SPEC-015, SPEC-016, SPEC-017, SPEC-018, SPEC-019, SPEC-020
Feature: Hint cascade order (simplest technique first)
  As a player requesting a hint
  I want the solver to return the simplest applicable technique
  So that I learn techniques progressively from easy to advanced

  Scenario: Full cascade order
    Given the getHint function checks techniques in this order:
      | order | technique             |
      | 1     | Naked Single          |
      | 2     | Hidden Single         |
      | 3     | Pointing Pair         |
      | 4     | Claiming              |
      | 5     | Naked Pair            |
      | 6     | Hidden Pair           |
      | 7     | Naked Triple          |
      | 8     | Hidden Triple         |
      | 9     | X-Wing               |
      | 10    | Swordfish             |
      | 11    | XY-Wing              |
      | 12    | Solution Check        |
    Then a simpler technique is always preferred over a more complex one

  Scenario: Claiming is tried before Naked Pair
    Given both a Claiming pattern and a Naked Pair exist on the board
    When I request a hint
    Then the technique returned is "Claiming"

  Scenario: Hidden Pair is tried after Naked Pair
    Given both a Naked Pair and a Hidden Pair exist but no Claiming or simpler technique
    When I request a hint
    Then the technique returned is "Naked Pair" (or its variant)

  Scenario: X-Wing is tried after all pair/triple techniques
    Given both a Hidden Triple and an X-Wing exist but no simpler technique
    When I request a hint
    Then the technique returned is "Hidden Triple" (or its variant)

  Scenario: Solution Check is the last resort
    Given no analytical technique produces a result
    When I request a hint
    Then the technique is "Solution Check"
    And the hint provides the correct value from the brute-force solution
