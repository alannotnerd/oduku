# Traces to: SPEC-003, SPEC-002
Feature: Pull-to-refresh is disabled on Android Chrome
  As a player
  I want to drag the top of the page without accidentally reloading the game
  So that my game state is never lost mid-session

  Background:
    Given the Oduku app is loaded in Android Chrome
    And I have an in-progress game with 12 cells filled

  Scenario: Dragging down from the top does not refresh
    When I place my finger at y=10 pixels from the top of the viewport
    And I drag downward by 150 pixels
    And I release
    Then the circular refresh indicator does not appear
    And the page does not reload
    And my 12 filled cells remain filled

  Scenario: Dragging down from mid-page does not refresh
    When I place my finger at y=400 pixels from the top
    And I drag downward by 150 pixels
    And I release
    Then the circular refresh indicator does not appear
    And the page does not reload

  Scenario: Multi-touch drag does not trigger the global prevent
    When I place two fingers on the board
    And I drag them both downward
    Then the global touchmove listener does not call preventDefault
    And any component handling multi-touch still receives its events
