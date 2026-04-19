# Traces to: SPEC-001, SPEC-002, SPEC-006
Feature: Page-level scroll and bounce lockdown
  As a player of Oduku
  I want the page to stay still under my finger
  So that my scrolls and drags do not move the game chrome

  Background:
    Given the Oduku app is loaded in a supported browser
    And the viewport is 390x844 (iPhone 13 class)

  Scenario: Vertical page scroll is disabled
    When I drag from the center of the board downward by 200 pixels
    Then document.documentElement.scrollTop remains 0
    And no scrollbar is rendered

  Scenario: Horizontal page scroll is disabled
    When I drag from the center of the board rightward by 200 pixels
    Then document.documentElement.scrollLeft remains 0
    And the page content remains visually anchored

  Scenario: Overscroll bounce is suppressed on iOS
    Given I am running iOS Safari
    When I drag from the top of the viewport downward by 80 pixels
    Then no white space appears above the content
    And no rubber-band animation plays

  Scenario: Overscroll bounce is suppressed on Android
    Given I am running Android Chrome
    When I drag from the bottom of the viewport upward by 80 pixels
    Then no rubber-band animation plays
    And the browser URL bar does not hide-then-show

  Scenario: Viewport meta disables pinch-zoom
    When I perform a two-finger pinch-out gesture on the board
    Then the page does not scale
    And the visual viewport remains at scale 1.0

  Scenario: PWA installed in standalone mode shows no browser chrome
    Given the app is installed as a PWA
    And I launch it from the home screen
    Then no address bar is visible
    And no tab bar is visible
    And the app occupies the full viewport including safe areas
