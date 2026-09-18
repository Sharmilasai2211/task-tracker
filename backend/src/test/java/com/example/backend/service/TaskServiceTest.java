package com.example.backend.service;

import com.example.backend.dto.TaskRequest;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.Task;
import com.example.backend.model.TaskStatus;
import com.example.backend.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TaskService taskService;

    @Test
    void createTask_defaultsStatusToTodoWhenNotProvided() {
        TaskRequest request = new TaskRequest("Write report", "Quarterly report", null);
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Task created = taskService.createTask(request);

        assertThat(created.getTitle()).isEqualTo("Write report");
        assertThat(created.getStatus()).isEqualTo(TaskStatus.TODO);
    }

    @Test
    void updateTask_throwsWhenTaskDoesNotExist() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());
        TaskRequest request = new TaskRequest("Anything", null, TaskStatus.DONE);

        assertThatThrownBy(() -> taskService.updateTask(99L, request))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteTask_throwsWhenTaskDoesNotExist() {
        when(taskRepository.existsById(42L)).thenReturn(false);

        assertThatThrownBy(() -> taskService.deleteTask(42L))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
