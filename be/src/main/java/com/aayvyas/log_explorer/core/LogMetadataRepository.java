package com.aayvyas.log_explorer.core;

import jakarta.persistence.EntityManager;

import com.aayvyas.log_explorer.model.LogFileMetadata;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LogMetadataRepository extends JpaRepository<LogFileMetadata, String> {
    List<LogFileMetadata> findAllByOrderByIngestedAtDesc();
}
