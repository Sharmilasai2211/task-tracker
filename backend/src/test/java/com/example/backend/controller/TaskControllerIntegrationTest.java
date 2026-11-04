package com.example.backend.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TaskControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void createAndFetchTask() throws Exception {
        String body = """
                {"title": "Buy groceries", "description": "Milk, eggs, bread"}
                """;

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Buy groceries"))
                .andExpect(jsonPath("$.status").value("TODO"));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.title == 'Buy groceries')]").isNotEmpty())
                .andExpect(jsonPath("$.totalElements").exists());
    }

    @Test
    void listTasks_filtersByStatus() throws Exception {
        createTask("Status filter todo", null, "TODO");
        createTask("Status filter done", null, "DONE");

        mockMvc.perform(get("/api/tasks").param("status", "TODO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.status != 'TODO')]").isEmpty())
                .andExpect(jsonPath("$.content[?(@.title == 'Status filter todo')]").isNotEmpty());
    }

    @Test
    void listTasks_searchMatchesTitleCaseInsensitive() throws Exception {
        createTask("Buy groceries", "Milk, eggs, bread", null);

        mockMvc.perform(get("/api/tasks").param("q", "GROCER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.title == 'Buy groceries')]").isNotEmpty());
    }

    @Test
    void listTasks_searchMatchesDescription() throws Exception {
        createTask("Shopping", "Milk, eggs, bread", null);

        mockMvc.perform(get("/api/tasks").param("q", "eggs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.description == 'Milk, eggs, bread')]").isNotEmpty());
    }

    @Test
    void listTasks_combinesStatusAndSearch_andToleratesNullDescriptions() throws Exception {
        createTask("Quarterly report", null, "IN_PROGRESS");
        createTask("Other work", "Weekly report notes", "IN_PROGRESS");
        createTask("Report draft", null, "DONE");

        mockMvc.perform(get("/api/tasks").param("status", "IN_PROGRESS").param("q", "report"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[?(@.status != 'IN_PROGRESS')]").isEmpty())
                .andExpect(jsonPath("$.content[?(@.title == 'Quarterly report')]").isNotEmpty())
                .andExpect(jsonPath("$.content[?(@.title == 'Other work')]").isNotEmpty())
                .andExpect(jsonPath("$.content[?(@.title == 'Report draft')]").isEmpty());
    }

    @Test
    void listTasks_withInvalidStatus_returns400() throws Exception {
        mockMvc.perform(get("/api/tasks").param("status", "INVALID"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Invalid status")));
    }

    private void createTask(String title, String description, String taskStatus) throws Exception {
        String descriptionJson = description == null ? "null" : "\"" + description + "\"";
        String statusJson = taskStatus == null ? "null" : "\"" + taskStatus + "\"";
        String body = "{\"title\": \"" + title + "\", \"description\": " + descriptionJson
                + ", \"status\": " + statusJson + "}";

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
    }

    @Test
    void createTask_withBlankTitle_returns400WithFieldErrors() throws Exception {
        String body = """
                {"title": "", "description": null}
                """;

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists());
    }

    @Test
    void updateTask_whenNotFound_returns404() throws Exception {
        String body = """
                {"title": "Does not exist"}
                """;

        mockMvc.perform(put("/api/tasks/{id}", 999999)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void deleteTask_whenNotFound_returns404() throws Exception {
        mockMvc.perform(delete("/api/tasks/{id}", 999999))
                .andExpect(status().isNotFound());
    }
}
