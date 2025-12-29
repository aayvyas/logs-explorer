'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ApiClient } from '@/lib/api';
import { LogEntry } from '@/types';
import LogEntryRow from './LogEntryRow';
import QueryPanel from './QueryPanel';
import { Button } from "@/components/ui/button";
import { ArrowDown } from 'lucide-react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { Loader2 } from 'lucide-react';

interface LogViewerProps {
    fileId: string;
}

export default function LogViewer({ fileId }: LogViewerProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fields, setFields] = useState<string[]>([]);

    // Virtuoso ref for manual control
    const virtuosoRef = useRef<VirtuosoHandle>(null);
    const [atBottom, setAtBottom] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);

    // Fetch available fields for autocomplete
    useEffect(() => {
        ApiClient.getLogFields(fileId)
            .then(setFields)
            .catch(err => console.error("Failed to fetch fields for autocomplete", err));
    }, [fileId]);

    const handleSearch = useCallback(async (queryInput: string) => {
        setLoading(true);
        setStreaming(true);
        setLogs([]);
        setError(null);
        setAtBottom(true);

        try {
            let queryPayload: any;
            try {
                queryPayload = queryInput.trim() ? JSON.parse(queryInput) : {};
            } catch (e) {
                if (queryInput.trim()) {
                    queryPayload = { textPayload: queryInput };
                } else {
                    queryPayload = {};
                }
            }

            await ApiClient.searchLogs(fileId, queryPayload, (chunk) => {
                setLogs(prev => [...prev, ...chunk]);
                setLoading(false);
            });
        } catch (err) {
            console.error(err);
            setError('Failed to fetch logs. Backend might be unreachable.');
        } finally {
            setLoading(false);
            setStreaming(false);
        }
    }, [fileId]);

    // Initial load
    useEffect(() => {
        handleSearch('');
    }, [handleSearch]);

    return (
        <div className="flex flex-col h-full bg-background relative">

            {/* Results Area */}
            <div className="flex-1 overflow-hidden relative">
                {logs.length === 0 && !loading && !streaming && !error && (
                    <div className="flex justify-center items-center h-full text-muted-foreground pb-20">
                        <p>No logs found. Try adjusting your query.</p>
                    </div>
                )}

                {error && (
                    <div className="flex justify-center items-center h-full text-destructive pb-20">
                        <p>{error}</p>
                    </div>
                )}

                {/* Virtualized List */}
                <Virtuoso
                    ref={virtuosoRef}
                    data={logs}
                    style={{ height: '100%' }}
                    totalCount={logs.length}
                    overscan={200}
                    followOutput={false}
                    atBottomStateChange={(isAtBottom) => {
                        setAtBottom(isAtBottom);
                        setShowScrollButton(!isAtBottom);
                    }}
                    itemContent={(index, log) => (
                        <LogEntryRow key={`${log.insertId}-${index}`} entry={log} />
                    )}
                    // Add padding at bottom for floating styling
                    components={{
                        Footer: () => <div className="h-32" />
                    }}
                />

                {showScrollButton && (
                    <Button
                        size="sm"
                        className="absolute bottom-24 right-8 rounded-full z-20 shadow-lg bg-blue-600 hover:bg-blue-700"
                        onClick={() => {
                            virtuosoRef.current?.scrollToIndex({ index: logs.length - 1, behavior: 'smooth' });
                        }}
                    >
                        <ArrowDown className="mr-2 h-4 w-4" />
                        Jump to Latest
                    </Button>
                )}
            </div>

            {/* Floating Query Panel & Streaming Indicator */}
            <div className="absolute bottom-6 left-0 right-0 z-50 px-4 pointer-events-none">
                <div className="flex flex-col items-center gap-2 pointer-events-auto">
                    {streaming && (
                        <div className="px-3 py-1 bg-blue-50/90 backdrop-blur text-blue-600 rounded-full text-xs font-medium border border-blue-100 flex items-center shadow-sm animate-in fade-in slide-in-from-bottom-2">
                            <Loader2 className="h-3 w-3 animate-spin mr-2" />
                            Streaming... {logs.length.toLocaleString()}
                        </div>
                    )}
                    <QueryPanel onSearch={handleSearch} loading={streaming} fields={fields} />
                </div>
            </div>
        </div>
    );
}
