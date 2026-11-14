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
                .andExpect(jsonPath("$[0].title").value("Buy groceries"));
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
    void createTask_withInvalidStatus_returns400WithStatusFieldError() throws Exception {
        String body = """
                {"title": "Valid title", "status": "DONEE"}
                """;

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.fieldErrors.status").isNotEmpty());
    }

    @Test
    void updateTask_withInvalidStatus_returns400WithStatusFieldError() throws Exception {
        String body = """
                {"title": "Valid title", "status": "DONEE"}
                """;

        mockMvc.perform(put("/api/tasks/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.fieldErrors.status").isNotEmpty());
    }

    @Test
    void createTask_withMalformedJson_returns400WithoutFieldErrors() throws Exception {
        String body = "{\"title\": \"Valid title\", ";

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").isNotEmpty())
                .andExpect(jsonPath("$.fieldErrors").isEmpty());
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
