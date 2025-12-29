package com.aayvyas.log_explorer.core.ingestion;

import java.io.InputStream;
import java.util.function.Consumer;

public interface LogParser {
    void parse(InputStream i, Consumer<IndexedLogMap> onLogFound);
}
