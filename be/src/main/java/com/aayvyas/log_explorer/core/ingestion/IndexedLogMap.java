package com.aayvyas.log_explorer.core.ingestion;

import java.util.Map;

/**
 * A wrapper that holds the log data AND exactly where it lives in the file.
 * We need the 'byteOffset' so we can point our Index to this location.
 */
public record IndexedLogMap(Map<String, Object> logEntry, long offset) {
}
