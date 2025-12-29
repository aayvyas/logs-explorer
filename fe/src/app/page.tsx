'use client';

import { useEffect, useState } from 'react';
import { ApiClient } from '@/lib/api';
import { LogFile } from '@/types';
import DashboardTable from '@/components/DashboardTable';
import UploadModal from '@/components/UploadModal';
import { Button } from "@/components/ui/button";
import { Add, Refresh, Assessment } from '@mui/icons-material';
import { LogIn, Logs, RefreshCcw, Plus } from 'lucide-react';

export default function Dashboard() {
  const [files, setFiles] = useState<LogFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiClient.getFiles();
      setFiles(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load log files. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900/30">
              <Logs className="text-blue-600 h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Logs Explorer</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className='cursor-pointer' onClick={fetchFiles} disabled={loading}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setUploadOpen(true)} className="cursor-pointer bg-blue-600 w-fit hover:bg-blue-700 shadow-md border-2 border-blue-700">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error ? (
          <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-destructive/5 text-destructive">
            <h3 className="font-semibold mb-2">Error Loading Logs</h3>
            <p className="text-sm mb-4">{error}</p>
            <Button variant="outline" onClick={fetchFiles}>Retry</Button>
          </div>
        ) : (
          <DashboardTable files={files} loading={loading} />
        )}

        <UploadModal
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onUploadSuccess={() => {
            fetchFiles();
            setUploadOpen(false);
          }}
        />
      </div>
    </div>
  );
}
