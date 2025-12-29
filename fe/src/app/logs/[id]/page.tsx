import LogViewer from '@/components/LogViewer/LogViewer';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button"
import Link from 'next/link';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function LogDetailsPage({ params }: PageProps) {
    const { id } = await params;

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
            {/* Minimalist Header */}
            <div className="flex items-center h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shrink-0 z-20 gap-4">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-muted-foreground">Logs</span>
                    <span className="text-muted-foreground">/</span>
                    <div className="flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-md">
                        <FileText className="h-3 w-3 text-blue-500" />
                        <span className="font-mono text-xs">{id}</span>
                    </div>
                </div>
            </div>

            {/* Viewer */}
            <div className="flex-1 overflow-hidden relative">
                <LogViewer fileId={id} />
            </div>
        </div>
    );
}
