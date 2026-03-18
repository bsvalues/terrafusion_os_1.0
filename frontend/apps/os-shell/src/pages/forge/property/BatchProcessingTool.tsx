import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface BatchResult {
  parcelId: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

interface BatchStatus {
  jobId: string;
  totalRecords: number;
  processedRecords: number;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  results: BatchResult[];
}

export function BatchProcessingTool() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setError(null);
    setBatchStatus(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const res = await fetch('/api/batch/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const job: BatchStatus = await res.json();
      setBatchStatus(job);
      pollStatus(job.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const pollStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/batch/status/${jobId}`);
        if (!res.ok) return;
        const status: BatchStatus = await res.json();
        setBatchStatus(status);
        if (status.status === 'processing' || status.status === 'pending') {
          setTimeout(poll, 2000);
        }
      } catch {
        // polling silently fails
      }
    };
    poll();
  };

  const progress = batchStatus
    ? batchStatus.totalRecords > 0
      ? (batchStatus.processedRecords / batchStatus.totalRecords) * 100
      : 0
    : 0;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Batch Processing</h1>
          <p className="text-muted-foreground">Upload and process property data in bulk</p>
        </div>
        <Badge variant="outline">BIV-106</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle>Upload File</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.json"
            onChange={handleFileSelect}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? 'Uploading...' : 'Start Processing'}
          </Button>
          {error && <div className="text-destructive text-sm">{error}</div>}
        </CardContent>
      </Card>

      {batchStatus && (
        <>
          <Card>
            <CardHeader><CardTitle>Progress</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status: <Badge variant="secondary">{batchStatus.status}</Badge></span>
                <span>{batchStatus.processedRecords} / {batchStatus.totalRecords} records</span>
              </div>
              <Progress value={progress} />
            </CardContent>
          </Card>

          {batchStatus.results.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Results</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parcel ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchStatus.results.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-sm">{r.parcelId}</TableCell>
                        <TableCell>
                          <Badge variant={r.status === 'success' ? 'default' : r.status === 'error' ? 'destructive' : 'secondary'}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{r.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
