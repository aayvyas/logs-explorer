package com.aayvyas.log_explorer;

import java.io.File;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import com.aayvyas.log_explorer.core.LogService;
import com.aayvyas.log_explorer.core.ingestion.JacksonStreamLogParser;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootApplication
public class LogExplorerApplication {
	@Autowired
	private static ObjectMapper objectMapper = new ObjectMapper();

	public static void main(String[] args) {
		SpringApplication.run(LogExplorerApplication.class, args);
	}

}
