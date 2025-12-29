
package com.aayvyas.log_explorer.config;

import com.fasterxml.jackson.databind.ObjectMapper;

import com.fasterxml.jackson.databind.DeserializationFeature;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

@Configuration
public class AppConfig {

    @Bean
    @Primary
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();

        // 2. Ignore unknown fields (robustness)
        // If JSON has fields we didn't define in LogEntry, don't crash.
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        return mapper;
    }
}
