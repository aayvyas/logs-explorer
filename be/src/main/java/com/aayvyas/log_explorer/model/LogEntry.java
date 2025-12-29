package com.aayvyas.log_explorer.model;

import org.springframework.boot.logging.LogLevel;

import com.fasterxml.jackson.annotation.JsonAlias;

import java.time.Instant;
import java.util.Map;

/**
 * 
 * Simple log entry
 */
public record LogEntry(
        Instant timestamp,

        @JsonAlias( {
                "level", "severity", "loglevel" }) LogLevel logLevel,

        @JsonAlias({ "service", "svc" }) String serviceName,

        @JsonAlias({ "msg", "text", "textPayload" }) String message,

        @JsonAlias({ "jsonPayload", "json", "metadata" }) Map<String, Object> metadata){
}
