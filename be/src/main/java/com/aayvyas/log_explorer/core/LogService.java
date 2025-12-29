package com.aayvyas.log_explorer.core;

import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;

import com.aayvyas.log_explorer.core.ingestion.JacksonStreamLogParser;
import com.aayvyas.log_explorer.core.ingestion.LogParser;
import com.aayvyas.log_explorer.core.storage.LogSegment;

import com.aayvyas.log_explorer.model.LogFileMetadata;
import com.aayvyas.log_explorer.model.LogSource;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.annotation.PostConstruct;

@Service
public class LogService {

    private final LogParser logParser;

    private final ObjectMapper objectMapper;

    private final ConcurrentHashMap<String, LogSegment> activeSegments = new ConcurrentHashMap<>();

    private final LogMetadataRepository metadataRepository;

    // Directory where we store raw logs
    private final Path storageDir = Paths.get("log_storage");

    public LogService(JacksonStreamLogParser logParser, ObjectMapper objectMapper,
            LogMetadataRepository metadataRepository) {
        this.logParser = logParser;
        storageDir.toFile().mkdirs();
        this.objectMapper = objectMapper;
        this.metadataRepository = metadataRepository;
    }

    // Rehydration
    @PostConstruct
    public void loadExistingSegments() {
        List<LogFileMetadata> allFiles = metadataRepository.findAll();
        for (LogFileMetadata meta : allFiles) {
            try {
                Path filePath = Paths.get(meta.getStoragePath());
                if (filePath.toFile().exists()) {
                    System.out.println("Reloading Segment: " + meta.getFileId());

                    // right now we are re-indexing file from scratch, but we need to serialise this
                    // to disk
                    // so that we can read universalIndexes from disk

                    processLogFile(meta.getFileId(), filePath.toFile(), false);
                }
            } catch (Exception e) {
                System.err.println("Failed to reload file: " + meta.getFileId());
            }
        }

    }

    private void processLogFile(String fileId, File file, boolean isNew) throws Exception {
        LogSegment segment = new LogSegment(fileId, file.toPath(), objectMapper);
        segment.init();

        try (FileInputStream fis = new FileInputStream(file)) {
            logParser.parse(fis, entry -> {
                Map<String, Object> log = entry.logEntry();
                long offset = entry.offset();
                Map<String, Object> mapToIndex = objectMapper.convertValue(log, Map.class);
                segment.addToIndex(mapToIndex, offset);
            });
        }

        activeSegments.put(fileId, segment);
    }

    public String processUploadedFile(File file, String originalName, String description, List<String> tags)
            throws Exception {

        String fileId = UUID.randomUUID().toString();

        processLogFile(fileId, file, true);

        LogFileMetadata metadata = LogFileMetadata.builder().fileId(fileId).fileName(originalName)
                .source(LogSource.LOCAL_UPLOAD)
                .description(description).tags(tags).fileSizeBytes(file.length()).ingestedAt(Instant.now())
                .storagePath(file.getAbsolutePath()).build();

        metadataRepository.save(metadata);

        return fileId;

    }

    public List<LogFileMetadata> getAllFiles() {
        return metadataRepository.findAllByOrderByIngestedAtDesc();
    }

    public String processLogFile(File uploadedFile) throws Exception {

        System.out.println(uploadedFile.getName().length());

        String fileId = UUID.randomUUID().toString();

        // create a new segment
        LogSegment logSegment = new LogSegment(fileId, uploadedFile.toPath(), objectMapper);
        logSegment.init();

        // stream the file and build the index
        try (FileInputStream fis = new FileInputStream(uploadedFile)) {
            logParser.parse(fis, entry -> {
                Map<String, Object> log = entry.logEntry();
                long offset = entry.offset();
                // 3. Update the In-Memory Indices
                // We are indexing by LEVEL and TIME
                Map<String, Object> mapToIndex = objectMapper.convertValue(log, Map.class);
                logSegment.addToIndex(mapToIndex, offset);
            });
        }

        activeSegments.put(fileId, logSegment);

        return fileId;

    }

    public Stream<Map<String, Object>> searchLogs(String fileId, Map<String, String> queryFilters) {
        LogSegment logSegment = activeSegments.get(fileId);
        if (logSegment == null) {
            throw new IllegalArgumentException("File not found: " + fileId);
        }

        return logSegment.search(queryFilters);
    }

    public Set<String> getAvailableFields(String fileId) {
        LogSegment segment = activeSegments.get(fileId);
        if (segment == null) {
            throw new IllegalArgumentException("File ID not found: " + fileId);
        }
        return segment.getIndexedFields();
    }
}
