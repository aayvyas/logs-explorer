'use client';

import { useState, useMemo, useEffect } from 'react';
import { Play, Code, X, ChevronUp, Search } from 'lucide-react';
import { Button } from "@/components/ui/button"
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { autocompletion, CompletionContext } from '@codemirror/autocomplete';
import { cn } from '@/lib/utils';

interface QueryPanelProps {
    onSearch: (query: string) => void;
    loading: boolean;
    fields?: string[];
}

export default function QueryPanel({ onSearch, loading, fields = [] }: QueryPanelProps) {
    const [query, setQuery] = useState('');
    const [expanded, setExpanded] = useState(false);

    const handleSearch = () => {
        onSearch(query);
        setExpanded(false); // Auto-collapse on run
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleSearch();
        }
    };

    // Custom completion source
    const logFieldsCompletion = useMemo(() => {
        return (context: CompletionContext) => {
            const word = context.matchBefore(/[\w\.]*$/); // Match alphabets and dots
            if (!word || (word.from === word.to && !context.explicit)) return null;

            return {
                from: word.from,
                options: fields.map(field => ({
                    label: field,
                    type: 'property',
                    apply: `"${field}"` // Wrap in quotes for JSON key convenience
                }))
            };
        };
    }, [fields]);

    if (!expanded) {
        return (
            <div
                className="flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-md border border-border/50 shadow-lg rounded-full cursor-pointer hover:border-blue-500/50 transition-all group"
                onClick={() => setExpanded(true)}
            >
                <Search className="h-4 w-4 text-muted-foreground group-hover:text-blue-500" />
                <span className="text-xs font-mono text-muted-foreground max-w-[200px] truncate">
                    {query || 'Filter logs...'}
                </span>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900"
                    onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
                >
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>
        )
    }

    return (
        <div className="w-[600px] max-w-[90vw] flex flex-col bg-background border border-border shadow-2xl rounded-xl overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-5 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b">
                <div className="flex items-center gap-2">
                    <Code className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-semibold text-muted-foreground">JSON Query</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Editor */}
            <div className="relative">
                <CodeMirror
                    value={query}
                    height="180px"
                    extensions={[
                        json(),
                        autocompletion({ override: [logFieldsCompletion] })
                    ]}
                    onChange={(val) => setQuery(val)}
                    onKeyDown={handleKeyDown as any}
                    className="text-sm font-mono border-b"
                    theme="light"
                    placeholder='// Enter JSON query...
{
  "severity": "ERROR"
}'
                />
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-2 bg-muted/10">
                <span className="text-[10px] text-muted-foreground px-2">
                    Fields auto-complete enabled
                </span>
                <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 h-8 text-xs shadow-md"
                    size="sm"
                >
                    <Play className="mr-1 h-3 w-3" />
                    Run Query
                </Button>
            </div>
        </div>
    );
}
