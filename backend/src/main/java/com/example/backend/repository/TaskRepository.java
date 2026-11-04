package com.example.backend.repository;

import com.example.backend.model.Task;
import com.example.backend.model.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("""
            select t from Task t
            where (:status is null or t.status = :status)
              and (:q is null
                   or lower(t.title) like lower(concat('%', :q, '%'))
                   or lower(coalesce(t.description, '')) like lower(concat('%', :q, '%')))
            """)
    Page<Task> search(@Param("status") TaskStatus status, @Param("q") String q, Pageable pageable);
}
