package com.aayvyas.log_explorer.core.search;

import java.util.Map;
import java.util.regex.Pattern;

// TODO : implement query parser with structured query language support
public class QueryParser {

    // TODO : Improve this regex matching , as may not handle nested quotes or
    // escapred characters
    private static final Pattern PAIR_PATTERN = Pattern.compile("([\\w\\.]+)=[\"']([^\"']+)[\"']");

    public static Map<String, String> parse(String queryString) throws Exception {
        throw new Exception("not implemented yet");
    }
}
