package com.aayvyas.log_explorer.api.controller;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import com.aayvyas.log_explorer.core.LogService;
import com.aayvyas.log_explorer.model.LogEntry;
import com.aayvyas.log_explorer.model.LogFileMetadata;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/logs")
@CrossOrigin(origins = "*")
public class LogController {
    private final LogService logService;
    private final ObjectMapper objectMapper;

    public LogController(LogService logService, ObjectMapper objectMapper) {

        this.logService = logService;
        this.objectMapper = objectMapper;

    }

    @PostMapping("/upload")
    public ResponseEntity<String> uploadLogFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "tags", required = false) List<String> tags // format: tag1,tag2
    ) {
        try {
            File destinationFile = File.createTempFile("log_" + System.currentTimeMillis() + "_", ".json");
            file.transferTo(destinationFile);

            String fileId = logService.processUploadedFile(
                    destinationFile,
                    file.getOriginalFilename(),
                    description,
                    tags);

            return ResponseEntity.ok(fileId);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Failed: " + e.getMessage());
        }
    }

    // Endpoint to list all files
    @GetMapping("/files")
    public ResponseEntity<List<LogFileMetadata>> listFiles() {
        return ResponseEntity.ok(logService.getAllFiles());
    }

    @PostMapping("/{fileId}/search")
    public ResponseEntity<StreamingResponseBody> searchLogs(@PathVariable String fileId,
            @RequestBody Map<String, String> queryFilters) {
        Stream<Map<String, Object>> logStream = logService.searchLogs(fileId, queryFilters);

        StreamingResponseBody responseBody = outputStream -> {
            try {
                logStream.forEach(log -> {
                    try {

                        String json = objectMapper.writeValueAsString(log);
                        System.out.println(json);
                        byte[] jsonBytes = json.getBytes(StandardCharsets.UTF_8);

                        outputStream.write(jsonBytes);

                        outputStream.write('\n');

                        outputStream.flush();

                    } catch (IOException e) {
                        throw new RuntimeException("Client disconnected", e);
                    }
                });
            } catch (Exception e) {
                System.err.println("Streaming error: " + e.getMessage());
            } finally {
                logStream.close();
            }
        };

        return ResponseEntity.ok()
                .header("Content-Type", "application/x-ndjson")
                .body(responseBody);
    }

    @GetMapping("/{fileId}/fields")
    public ResponseEntity<Set<String>> getFields(@PathVariable String fileId) {
        try {
            Set<String> fields = logService.getAvailableFields(fileId);
            return ResponseEntity.ok(fields);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
