'use client';

import { LogEntry } from '@/types';
import { memo, useState } from 'react';
import clsx from 'clsx';
import { ChevronDown, ChevronUp, Info, TriangleAlert, CircleX, Bug, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import dynamic from 'next/dynamic';

const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

interface LogEntryRowProps {
    entry: LogEntry;
}

const SeverityIcon = ({ severity }: { severity: string }) => {
    switch (severity) {
        case 'INFO': return <Info className="h-4 w-4 text-blue-500" />;
        case 'WARNING': return <TriangleAlert className="h-4 w-4 text-amber-500" />;
        case 'ERROR': return <AlertCircle className="h-4 w-4 text-red-500" />;
        case 'CRITICAL':
        case 'ALERT':
        case 'EMERGENCY': return <Bug className="h-4 w-4 text-red-700" />;
        default: return <Info className="h-4 w-4 text-gray-400" />;
    }
};

function LogEntryRow({ entry }: LogEntryRowProps) {
    const [isOpen, setIsOpen] = useState(false);

    const displayTime = new Date(entry.timestamp).toISOString();

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className={clsx(
            "border-b transition-colors font-mono text-sm",
            isOpen ? "bg-muted/30" : "hover:bg-muted/10"
        )}>
            <div className="flex items-start py-1 px-2 gap-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="w-6 flex-shrink-0 pt-0.5">
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0 hover:bg-transparent">
                            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </CollapsibleTrigger>
                </div>
                <div className="w-6 flex-shrink-0 pt-1" title={entry.severity}>
                    <SeverityIcon severity={entry.severity} />
                </div>
                <div className="w-48 flex-shrink-0 text-muted-foreground truncate pt-1 select-text text-xs">
                    {displayTime}
                </div>
                <div className="flex-1 min-w-0 pt-1 break-words whitespace-pre-wrap select-text text-foreground text-xs leading-5">
                    {entry.textPayload || (entry.jsonPayload ? JSON.stringify(entry.jsonPayload) : 'No Content')}
                </div>
            </div>

            <CollapsibleContent>
                <div className="pl-14 pr-4 pb-4 pt-2 text-xs">
                    <div className="rounded-md border bg-white p-2">
                        <ReactJson
                            src={entry}
                            name={false}
                            displayDataTypes={false}
                            displayObjectSize={false}
                            enableClipboard={true}
                            collapsed={2}
                            theme="rjv-default"
                            style={{ fontFamily: 'monospace', fontSize: '11px' }}
                        />
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
}

export default memo(LogEntryRow);
