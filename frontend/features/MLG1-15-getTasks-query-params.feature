Feature: getTasks builds query parameters
  As a user
  I want the UI to request tasks with paging, sorting, and filtering
  So the task list reflects my selected controls


  Scenario: Paging query parameters are added
    Given the frontend API helper getTasks accepts an options object
    When getTasks is called with:
      | page | size |
      | 0   | 10   |
    Then the request URL includes "?page=0&size=10"


  Scenario: Sort query parameter is added
    Given the frontend API helper getTasks accepts sort options
    When getTasks is called with sort:
      | field | direction |
      | title | asc       |
    Then the request URL includes "?sort=title,asc"


  Scenario: Filter query parameters are added
    Given the frontend API helper getTasks accepts filter options
    When getTasks is called with:
      | status | title  |
      | DONE   | report |
    Then the request URL includes "status=DONE"
    And the request URL includes "title=report"

  Scenario: No options keeps no query string
    Given getTasks is called with no options
    When the request is made
    Then the request URL is "/tasks" with no query string
    And the function returns data successfully
