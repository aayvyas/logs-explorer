export interface LogFile {
  fileId: string;
  fileName: string;
  description?: string;
  ingestedAt: string; // ISO Date
  fileSizeBytes: number;
  source?: string | null;
  storagePath?: string;
  tags?: string[];
  // Removed fields not in response: status, errorCount
}

export interface LogEntry {
  insertId: string;
  timestamp: string;
  severity: 'DEFAULT' | 'DEBUG' | 'INFO' | 'NOTICE' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'ALERT' | 'EMERGENCY';
  textPayload?: string;
  jsonPayload?: Record<string, any>;
  resource?: {
    type: string;
    labels: Record<string, string>;
  };
  labels?: Record<string, string>;
}

export interface SearchOptions {
  query?: string;
  startTime?: string;
  endTime?: string;
  severity?: string[];
}
