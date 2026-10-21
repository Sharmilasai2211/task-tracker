Feature: getTasks builds query string based on options
  The frontend API helper should build the /tasks request URL with optional
  paging, sorting, and filtering query parameters.

  Background:
    Given the API base URL is configured

  Scenario: Paging query parameters are included when provided
    When getTasks is called with options:
      | page | 0  |
      | size | 10 |
    Then the request URL should include the query string "page=0&size=10"

  Scenario: Sort query parameter is included when provided
    When getTasks is called with options:
      | sort.field     | title |
      | sort.direction | asc   |
    Then the request URL should include the query string "sort=title,asc"

  Scenario: Filter query parameters are included when provided
    When getTasks is called with options:
      | status | DONE   |
      | title  | report |
    Then the request URL should include "status=DONE" as a query parameter
    And the request URL should include "title=report" as a query parameter

  Scenario: No query string is added when options are not provided
    When getTasks is called with no options
    Then the request URL should end with "/tasks" with no query string
    And the function should return the response data
