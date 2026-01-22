package com.aayvyas.log_explorer.core.ingestion;

import java.io.InputStream;
import java.util.Map;
import java.util.function.Consumer;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Component
public class JacksonStreamLogParser implements LogParser {

    private final ObjectMapper objectMapper;
    private final JsonFactory jsonFactory;

    public JacksonStreamLogParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.objectMapper.registerModule(new JavaTimeModule());
        this.jsonFactory = objectMapper.getFactory();
    }

    @Override
    public void parse(InputStream inputStream, Consumer<IndexedLogMap> onLogFound) {
        try (JsonParser parser = jsonFactory.createParser(inputStream)) {

            // 1. Check if the file starts with an array '['
            if (parser.nextToken() != JsonToken.START_ARRAY) {
                throw new IllegalStateException("Expected content to be an array");
            }

            // 2. Iterate over every object in the array
            while (parser.nextToken() == JsonToken.START_OBJECT) {

                // CRITICAL: Capture the byte offset of the '{' token
                // This 'pointer' allows us to jump back here later instantly.
                long offset = parser.getTokenLocation().getByteOffset();

                parser.setCodec(objectMapper);

                // 3. Parse the object into our Java Record
                // readValueAs is efficient enough here because it only loads ONE object into
                // RAM
                Map<String, Object> log = parser.readValueAs(Map.class);

                // 4. Send it to the consumer (callback)
                onLogFound.accept(new IndexedLogMap(log, offset));
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to stream parse log file", e);
        }
    }
}
