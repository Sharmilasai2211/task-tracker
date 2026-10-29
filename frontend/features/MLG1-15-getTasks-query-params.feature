Feature: getTasks builds query parameters for paging, sorting, and filtering

  Background:
    Given the frontend API helper getTasks exists

  Scenario: Adds paging query params
    When getTasks is called with options:
      | page | size |
      | 0    | 10   |
    Then the request URL includes "?page=0&size=10"

  Scenario: Adds sort query param
    When getTasks is called with options:
      | sort.field     | sort.direction |
      | title          | asc            |
    Then the request URL includes "?sort=title,asc"

  Scenario: Adds filter query params
    When getTasks is called with options:
      | status | title  |
      | DONE   | report |
    Then the request URL includes query parameter "status" with value "DONE"
    And the request URL includes query parameter "title" with value "report"

  Scenario: No options keeps URL without query string and returns data
    Given the API responds successfully with an array of tasks
    When getTasks is called with no options
    Then the request URL is "/tasks" with no query string
    And getTasks returns the tasks array

