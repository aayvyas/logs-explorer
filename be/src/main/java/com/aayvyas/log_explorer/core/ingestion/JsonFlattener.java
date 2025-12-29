package com.aayvyas.log_explorer.core.ingestion;

import java.util.HashMap;
import java.util.Map;

public class JsonFlattener {

    public static Map<String, String> flatten(Map<String, Object> json) {
        Map<String, String> result = new HashMap<>();
        flattenRecursive("", json, result);
        return result;
    }

    private static void flattenRecursive(String prefix, Map<String, Object> current, Map<String, String> result) {
        for (Map.Entry<String, Object> entry : current.entrySet()) {
            String key = prefix.isEmpty() ? entry.getKey() : prefix + "." + entry.getKey();
            Object value = entry.getValue();

            if (value instanceof Map) {
                // Go deeper
                flattenRecursive(key, (Map<String, Object>) value, result);
            } else {
                // Base case: It's a primitive (String, Number, Boolean)
                // We convert everything to String for the MVP index
                result.put(key, String.valueOf(value));
            }
        }
    }
}
