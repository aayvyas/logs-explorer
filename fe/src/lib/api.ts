import { LogFile, LogEntry, SearchOptions } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export class ApiClient {
    static async uploadFile(file: File, options?: { description?: string; tags?: string }): Promise<LogFile> {
        const formData = new FormData();
        formData.append('file', file);
        if (options?.description) formData.append('description', options.description);
        if (options?.tags) formData.append('tags', options.tags);

        const res = await fetch(`${API_BASE_URL}/api/logs/upload`, {
            method: 'POST',
            body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');
        return res.json();
    }

    static async getFiles(): Promise<LogFile[]> {
        const res = await fetch(`${API_BASE_URL}/api/logs/files`);
        if (!res.ok) throw new Error('Failed to fetch files');
        return res.json();
    }

    static async searchLogs(fileId: string, query: any, onChunk: (chunk: LogEntry[]) => void): Promise<void> {
        // If query is empty string, send empty object to fetch all
        const requestBody = query === '' ? {} : query;

        const res = await fetch(`${API_BASE_URL}/api/logs/${fileId}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody), // Send body directly as requested
        });

        if (!res.ok) throw new Error('Search failed');

        const reader = res.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            const chunk: LogEntry[] = [];
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (Array.isArray(json)) {
                        chunk.push(...json);
                    } else {
                        chunk.push(json);
                    }
                } catch (e) {
                    console.error("Error parsing NDJSON line", e);
                }
            }

            if (chunk.length > 0) {
                onChunk(chunk);
            }
        }
    }

    static async getLogFields(fileId: string): Promise<string[]> {
        const res = await fetch(`${API_BASE_URL}/api/logs/${fileId}/fields`);
        if (!res.ok) throw new Error('Failed to fetch fields');
        return res.json();
    }
}
