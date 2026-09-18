package com.example.backend.service;

import com.example.backend.dto.TaskRequest;
import com.example.backend.exception.ResourceNotFoundException;
import com.example.backend.model.Task;
import com.example.backend.model.TaskStatus;
import com.example.backend.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    public Task createTask(TaskRequest request) {
        Task task = new Task(
                request.title(),
                request.description(),
                request.status() != null ? request.status() : TaskStatus.TODO
        );
        return taskRepository.save(task);
    }

    public Task updateTask(Long id, TaskRequest request) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id " + id));
        task.setTitle(request.title());
        task.setDescription(request.description());
        if (request.status() != null) {
            task.setStatus(request.status());
        }
        return taskRepository.save(task);
    }

    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new ResourceNotFoundException("Task not found with id " + id);
        }
        taskRepository.deleteById(id);
    }
}
