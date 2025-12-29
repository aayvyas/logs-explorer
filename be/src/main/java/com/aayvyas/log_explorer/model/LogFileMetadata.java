package com.aayvyas.log_explorer.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LogFileMetadata {

    @Id
    private String fileId; // The UUID

    private String fileName; // Original filename (e.g. "prod_logs.json")

    private String description; // User provided name/note

    @ElementCollection
    private List<String> tags; // e.g., ["incident-2024", "prod"]

    private long fileSizeBytes;

    private Instant ingestedAt;

    @Enumerated(EnumType.STRING)
    private LogSource source; // ENUM: LOCAL_UPLOAD, S3, GCS

    // Store where the actual indexed file sits on disk
    private String storagePath;
}
