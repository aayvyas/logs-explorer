'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UploadCloud } from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { Progress } from "@/components/ui/progress"

interface UploadModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUploadSuccess: () => void;
}

export default function UploadModal({ open, onOpenChange, onUploadSuccess }: UploadModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file');
            return;
        }

        setUploading(true);
        setError(null);
        setProgress(10);

        try {
            const timer = setInterval(() => setProgress((p) => Math.min(p + 10, 90)), 200);

            await ApiClient.uploadFile(file, { description, tags });

            clearInterval(timer);
            setProgress(100);

            setTimeout(() => {
                onUploadSuccess();
                resetForm();
            }, 500);

        } catch (err) {
            setError('Failed to upload file. Please try again.');
            setUploading(false);
            setProgress(0);
        }
    };

    const resetForm = () => {
        setFile(null);
        setDescription('');
        setTags('');
        setError(null);
        setProgress(0);
        setUploading(false);
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!uploading) {
            onOpenChange(isOpen);
            if (!isOpen) resetForm();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Upload Log File</DialogTitle>
                    <DialogDescription>
                        Upload generic JSON or NDJSON log files here.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {!file ? (
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-gray-500" />
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-gray-500">NDJSON, JSON, LOG</p>
                                </div>
                                <input type="file" className="hidden" onChange={handleFileChange} />
                            </label>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 border rounded-md bg-blue-50/50">
                            <span className="truncate text-sm font-medium w-full">{file.name}</span>
                            <Button variant="ghost" size="sm" onClick={() => setFile(null)} disabled={uploading} className="ml-2">Change</Button>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the logs"
                            disabled={uploading}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                            id="tags"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="production, error, v1.0 (comma separated)"
                            disabled={uploading}
                        />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {uploading && (
                        <div className="space-y-1">
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground text-center">Uploading...</p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={uploading}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={!file || uploading} className="bg-blue-600 hover:bg-blue-700">Upload</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
