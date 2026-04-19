# Traces to: SPEC-007
Feature: Scoped scroll escape for legitimately scrollable regions
  As a future feature author
  I want a sanctioned way to make a sub-region scroll
  So that I can add long lists without breaking the global lockdown

  Background:
    Given the Oduku app is loaded
    And a test fixture renders a sub-region with class "scroll-allowed" and attribute data-scroll-allowed
    And that sub-region contains content taller than its visible height

  Scenario: Opted-in region scrolls internally
    When I drag inside the opted-in region upward by 200 pixels
    Then the region's scrollTop increases
    And the page's scrollTop remains 0

  Scenario: Opted-in region does not rubber-band onto the page
    Given the opted-in region is already scrolled to its top
    When I drag inside the opted-in region downward by 200 pixels
    Then the region does not visually bounce
    And the page does not scroll
    And no refresh indicator appears

  Scenario: Opted-in region bypasses global preventDefault
    When I drag inside the opted-in region
    Then the global touchmove listener returns without calling preventDefault
