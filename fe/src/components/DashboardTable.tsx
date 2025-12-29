'use client';

import { LogFile } from '@/types';
import { columns } from "./dashboard/columns" // Create this path if needed
import { DataTable } from "@/components/ui/data-table"

interface DashboardTableProps {
    files: LogFile[];
    loading: boolean;
}

export default function DashboardTable({ files, loading }: DashboardTableProps) {
    if (loading) {
        return <div className="p-8 text-center text-muted-foreground text-sm">Loading logs...</div>;
    }

    return (
        <div className="container mx-auto py-2">
            <DataTable columns={columns} data={files} />
        </div>
    );
}
