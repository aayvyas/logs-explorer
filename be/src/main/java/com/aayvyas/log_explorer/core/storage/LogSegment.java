package com.aayvyas.log_explorer.core.storage;

import java.io.FileReader;
import java.io.RandomAccessFile;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Stream;

import com.aayvyas.log_explorer.core.ingestion.JsonFlattener;
import com.aayvyas.log_explorer.model.LogEntry;
import com.fasterxml.jackson.databind.ObjectMapper;

public class LogSegment implements AutoCloseable {

    private final String fileId;
    private final Path filePath;
    private final ObjectMapper objectMapper;
    /**
     * Not using normal {@link FileReader}, as it reads the whole file
     * we are using RandomAccessFile to say , hey I want to go to 'some' byte and
     * read it.
     */
    private RandomAccessFile randomAccessFile; //

    private final Map<String, Map<String, List<Long>>> universalIndex = new ConcurrentHashMap<>();

    // tracking all known fields for autocompletion
    private final Set<String> knownFields = ConcurrentHashMap.newKeySet();

    private final List<Long> allOffsets = Collections.synchronizedList(new ArrayList<>());

    public LogSegment(String fileId, Path filePath, ObjectMapper objectMapper) {
        this.fileId = fileId;
        this.filePath = filePath;
        this.objectMapper = objectMapper;
    }

    public void init() throws Exception {
        this.randomAccessFile = new RandomAccessFile(filePath.toFile(), "r");
    }

    @Override
    public void close() throws Exception {
        if (randomAccessFile != null) {
            randomAccessFile.close();
        }
    }

    /**
     * @param level
     * @param timestamp
     * @param byteOffset
     */
    public void addToIndex(Map<String, Object> rawLogMap, long byteOffset) {
        allOffsets.add(byteOffset);
        Map<String, String> flatFields = JsonFlattener.flatten(rawLogMap);

        for (Map.Entry<String, String> entry : flatFields.entrySet()) {
            String field = entry.getKey();
            String value = entry.getValue();

            // record that this field exists
            knownFields.add(field);

            // add to the inverted index
            universalIndex
                    .computeIfAbsent(field, k -> new ConcurrentHashMap<>())
                    .computeIfAbsent(value, k -> new ArrayList<>())
                    .add(byteOffset);

        }

    }

    private Map<String, Object> readLogAt(long offset) throws Exception {

        synchronized (randomAccessFile) {
            randomAccessFile.seek(offset);

            return objectMapper.readValue(new FileSegmentInputStream(randomAccessFile, offset), Map.class);
        }

    }

    private List<Map<String, Object>> readLogsAt(List<Long> offsets) {
        List<Map<String, Object>> results = new ArrayList<>();
        Collections.sort(offsets);
        for (Long offset : offsets) {
            try {
                results.add(readLogAt(offset));
            } catch (Exception e) {
                System.err.println("Read error at " + offset);
            }
        }

        return results;

    }

    private Map<String, Object> safeRead(Long offset) {
        try {
            return readLogAt(offset);
        } catch (Exception e) {
            return null;
        }
    }

    public Set<String> getIndexedFields() {
        return Collections.unmodifiableSet(universalIndex.keySet());
    }

    public Stream<Map<String, Object>> search(Map<String, String> queryFilters) {

        if (queryFilters == null || queryFilters.isEmpty()) {

            return allOffsets.stream().map(this::safeRead).filter(Objects::nonNull);

        }

        List<Long> resultOffsets = null;

        System.out.println("--- SEARCH DEBUG ---");
        System.out.println("Query: " + queryFilters);

        for (Map.Entry<String, String> filter : queryFilters.entrySet()) {
            String field = filter.getKey();
            String value = filter.getValue();

            // 1. Check if Field Exists
            Map<String, List<Long>> valueMap = universalIndex.get(field);
            if (valueMap == null) {
                System.out.println("Field NOT FOUND in Index: " + field);
                System.out.println("Known Fields: " + universalIndex.keySet());
                return Stream.empty(); // If one field is missing, AND fails.
            }

            // 2. Check if Value Exists
            List<Long> offsetsForCondition = valueMap.get(value);
            if (offsetsForCondition == null || offsetsForCondition.isEmpty()) {
                System.out.println("Value NOT FOUND for field " + field + ": " + value);
                System.out.println("Known Values: " + valueMap.keySet());
                return Stream.empty(); // If one value missing, AND fails.
            }

            System.out.println("Found " + offsetsForCondition.size() + " matches for " + field + "=" + value);

            // 3. Intersection
            if (resultOffsets == null) {
                resultOffsets = new ArrayList<>(offsetsForCondition);
            } else {
                resultOffsets.retainAll(offsetsForCondition);
                if (resultOffsets.isEmpty()) {
                    System.out.println("Intersection resulted in empty set.");
                    return Stream.empty();
                }
            }
        }

        if (resultOffsets == null || resultOffsets.isEmpty()) {
            System.out.println("Final Result: 0 logs.");
            return Stream.empty();
        }

        System.out.println("Final Result: " + resultOffsets.size() + " logs.");

        return resultOffsets.stream().map(offset -> {
            try {
                return readLogAt(offset);
            } catch (Exception e) {
                e.printStackTrace();
                return null;
            }
        }).filter(Objects::nonNull);
    }

}
