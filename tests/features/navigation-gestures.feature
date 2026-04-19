# Traces to: SPEC-004, SPEC-006
Feature: Touch-based navigation gestures are disabled
  As a player
  I want edge-swipes and two-finger history swipes to not navigate away
  So that my game is never interrupted by a back/forward action

  Background:
    Given the Oduku app is loaded

  Scenario: iOS edge-swipe from the left does not navigate back (PWA)
    Given I am running iOS Safari with Oduku installed as a PWA
    When I touch at x=5 pixels from the left edge
    And I drag rightward by 200 pixels
    Then the app does not navigate back
    And the current game state is preserved

  Scenario: iOS edge-swipe from the right does not navigate forward (PWA)
    Given I am running iOS Safari with Oduku installed as a PWA
    When I touch within 20 pixels of the right edge
    And I drag leftward by 200 pixels
    Then the app does not navigate forward
    And the current game state is preserved

  Scenario: Android two-finger horizontal swipe does not navigate
    Given I am running Android Chrome
    When I place two fingers on the page
    And I swipe them rightward by 200 pixels
    Then the browser does not show a back-navigation animation
    And the current URL does not change

  Scenario: Long-press does not open a text-selection callout
    When I touch and hold a Sudoku cell for 800 milliseconds
    Then no iOS "Copy · Share" callout appears
    And no selection handles appear
