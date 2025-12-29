"use client"

import { ColumnDef } from "@tanstack/react-table"
import { LogFile } from "@/types"
import { ArrowUpDown, MoreHorizontal, FileText, Eye, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'

export const columns: ColumnDef<LogFile>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "fileName",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    File Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-medium flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground" /> {row.getValue("fileName")}</div>,
    },
    {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => {
            const tags = row.getValue("tags") as string[] | undefined;
            if (!tags || tags.length === 0) return <div className="text-muted-foreground text-xs">-</div>;
            return (
                <div className="flex flex-wrap gap-1">
                    {tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1 h-5">{tag}</Badge>
                    ))}
                    {tags.length > 2 && (
                        <Badge variant="outline" className="text-[10px] px-1 h-5">+{tags.length - 2}</Badge>
                    )}
                </div>
            )
        }
    },
    {
        accessorKey: "fileSizeBytes",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Size
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            const size = parseFloat(row.getValue("fileSizeBytes"))
            const formatted = (size / 1024 / 1024).toFixed(2) + " MB"
            return <div className="font-mono text-xs">{formatted}</div>
        },
    },
    {
        accessorKey: "source",
        header: "Source",
        cell: ({ row }) => {
            return row.getValue("source") ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {row.getValue("source")}
                </div>
            ) : <div className="text-muted-foreground text-xs">-</div>
        }
    },
    {
        accessorKey: "ingestedAt",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Ingested At
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => {
            return <div className="text-xs text-muted-foreground">{new Date(row.getValue("ingestedAt")).toLocaleString()}</div>
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const file = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(file.fileId)}
                        >
                            <Copy className="mr-2 h-4 w-4" />
                            Copy File ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <Link href={`/logs/${file.fileId}`}>
                            <DropdownMenuItem className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                View Logs
                            </DropdownMenuItem>
                        </Link>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
