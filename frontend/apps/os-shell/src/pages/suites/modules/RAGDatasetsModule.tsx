/**
 * RAG Datasets Module -- Knowledge Base Management for RAG-enabled GPTs
 * ===================================================================
 * Constitutional module of TerraGPT (Article V Section 5.1).
 * Owns: Dataset CRUD, document ingestion, embedding status, chunk preview.
 */

import { useCallback, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  FileText,
  Upload,
  RefreshCw,
  Search,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  HardDrive,
  Layers,
  Eye,
} from 'lucide-react';
import api from '@/services/api';

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface RagDataset {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  chunkCount: number;
  embeddingModel: string;
  status: 'ready' | 'processing' | 'error' | 'empty';
  sizeBytes: number;
  createdAt: string;
  lastUpdated: string;
  linkedGpts: number;
}

interface RagDocument {
  id: string;
  filename: string;
  type: string;
  chunks: number;
  sizeBytes: number;
  status: 'embedded' | 'processing' | 'failed';
  addedAt: string;
}

/* -------------------------------------------------------------------------- */
/* Mock data (Benton County RAG sets)                                          */
/* -------------------------------------------------------------------------- */

const DATASETS: RagDataset[] = [
  {
    id: 'ds-rcw',
    name: 'Washington RCW Statutes',
    description: 'Complete WA Revised Code of Washington for property tax law (Title 84)',
    documentCount: 48,
    chunkCount: 3420,
    embeddingModel: 'text-embedding-3-small',
    status: 'ready',
    sizeBytes: 14_200_000,
    createdAt: '2026-01-10T00:00:00Z',
    lastUpdated: '2026-02-20T00:00:00Z',
    linkedGpts: 3,
  },
  {
    id: 'ds-wac',
    name: 'WAC Assessment Standards',
    description: 'WA Administrative Code: DOR assessment standards & ratio guidelines',
    documentCount: 22,
    chunkCount: 1580,
    embeddingModel: 'text-embedding-3-small',
    status: 'ready',
    sizeBytes: 6_800_000,
    createdAt: '2026-01-15T00:00:00Z',
    lastUpdated: '2026-02-18T00:00:00Z',
    linkedGpts: 2,
  },
  {
    id: 'ds-benton-cama',
    name: 'Benton County CAMA Manual',
    description: 'County appraisal procedures, cost tables, and field guide',
    documentCount: 12,
    chunkCount: 890,
    embeddingModel: 'text-embedding-3-small',
    status: 'ready',
    sizeBytes: 3_200_000,
    createdAt: '2026-02-01T00:00:00Z',
    lastUpdated: '2026-02-25T00:00:00Z',
    linkedGpts: 4,
  },
  {
    id: 'ds-uspap',
    name: 'USPAP Standards',
    description: 'Uniform Standards of Professional Appraisal Practice (current edition)',
    documentCount: 8,
    chunkCount: 620,
    embeddingModel: 'text-embedding-3-small',
    status: 'ready',
    sizeBytes: 2_100_000,
    createdAt: '2026-01-20T00:00:00Z',
    lastUpdated: '2026-02-10T00:00:00Z',
    linkedGpts: 2,
  },
  {
    id: 'ds-market',
    name: 'Benton County Market Data',
    description: 'Sales, permits, and market trends (auto-refreshed weekly from PACS)',
    documentCount: 156,
    chunkCount: 8400,
    embeddingModel: 'text-embedding-3-small',
    status: 'processing',
    sizeBytes: 28_500_000,
    createdAt: '2026-02-15T00:00:00Z',
    lastUpdated: '2026-02-26T00:00:00Z',
    linkedGpts: 1,
  },
];

const DOCUMENTS: Record<string, RagDocument[]> = {
  'ds-rcw': [
    { id: 'd1', filename: 'RCW_Title84_Ch01.pdf', type: 'pdf', chunks: 142, sizeBytes: 580_000, status: 'embedded', addedAt: '2026-01-10' },
    { id: 'd2', filename: 'RCW_Title84_Ch04.pdf', type: 'pdf', chunks: 98, sizeBytes: 420_000, status: 'embedded', addedAt: '2026-01-10' },
    { id: 'd3', filename: 'RCW_Title84_Ch33.pdf', type: 'pdf', chunks: 76, sizeBytes: 310_000, status: 'embedded', addedAt: '2026-01-11' },
    { id: 'd4', filename: 'RCW_Title84_Ch36.pdf', type: 'pdf', chunks: 112, sizeBytes: 480_000, status: 'embedded', addedAt: '2026-01-11' },
    { id: 'd5', filename: 'RCW_Title84_Ch40.pdf', type: 'pdf', chunks: 88, sizeBytes: 360_000, status: 'embedded', addedAt: '2026-01-12' },
  ],
  'ds-benton-cama': [
    { id: 'd10', filename: 'Benton_Field_Guide_2026.pdf', type: 'pdf', chunks: 210, sizeBytes: 820_000, status: 'embedded', addedAt: '2026-02-01' },
    { id: 'd11', filename: 'Cost_Tables_Residential.xlsx', type: 'xlsx', chunks: 180, sizeBytes: 540_000, status: 'embedded', addedAt: '2026-02-01' },
    { id: 'd12', filename: 'Commercial_Procedures.docx', type: 'docx', chunks: 95, sizeBytes: 280_000, status: 'embedded', addedAt: '2026-02-05' },
    { id: 'd13', filename: 'Agricultural_Land_Manual.pdf', type: 'pdf', chunks: 145, sizeBytes: 520_000, status: 'processing', addedAt: '2026-02-20' },
  ],
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const fmtSize = (bytes: number) => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
};

const statusIcon = (s: RagDataset['status']) => {
  switch (s) {
    case 'ready':
      return <CheckCircle2 size={14} style={{ color: 'hsl(var(--tf-accent-success))' }} />;
    case 'processing':
      return <Clock size={14} className="animate-spin" style={{ color: 'hsl(var(--tf-suite-gpt))' }} />;
    case 'error':
      return <AlertTriangle size={14} style={{ color: 'hsl(var(--tf-accent-danger))' }} />;
    case 'empty':
      return <Database size={14} style={{ color: 'hsl(var(--tf-muted))' }} />;
  }
};

const docStatusBadge = (s: RagDocument['status']) => {
  switch (s) {
    case 'embedded':
      return <Badge variant="outline" className="text-xs" style={{ borderColor: 'hsl(var(--tf-accent-success) / 0.4)', color: 'hsl(var(--tf-accent-success))' }}>Embedded</Badge>;
    case 'processing':
      return <Badge variant="outline" className="text-xs" style={{ borderColor: 'hsl(var(--tf-suite-gpt) / 0.4)', color: 'hsl(var(--tf-suite-gpt))' }}>Processing</Badge>;
    case 'failed':
      return <Badge variant="outline" className="text-xs" style={{ borderColor: 'hsl(var(--tf-accent-danger) / 0.4)', color: 'hsl(var(--tf-accent-danger))' }}>Failed</Badge>;
  }
};

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function RAGDatasetsModule() {
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDatasets = DATASETS.filter((ds) => {
    if (filterStatus !== 'all' && ds.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return ds.name.toLowerCase().includes(q) || ds.description.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedDs = selectedDataset ? DATASETS.find((d) => d.id === selectedDataset) : null;
  const selectedDocs = selectedDataset ? (DOCUMENTS[selectedDataset] ?? []) : [];

  const totalChunks = DATASETS.reduce((acc, ds) => acc + ds.chunkCount, 0);
  const totalSize = DATASETS.reduce((acc, ds) => acc + ds.sizeBytes, 0);
  const readyCount = DATASETS.filter((ds) => ds.status === 'ready').length;

  const handleUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/gpt/rag/ingest', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Reset input so the same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--tf-fg))' }}>
            <Database size={24} style={{ color: 'hsl(var(--tf-suite-gpt))' }} />
            RAG Datasets
          </h2>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--tf-muted))' }}>
            Knowledge bases powering RAG-enabled GPTs
          </p>
        </div>
        <Button onClick={handleUpload} disabled={uploading} style={{ background: 'hsl(var(--tf-suite-gpt))', color: 'white' }}>
          {uploading ? <RefreshCw size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
          {uploading ? 'Ingesting…' : 'Ingest Documents'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,.csv,.json,.docx"
          className="hidden"
          onChange={handleFileSelected}
        />
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'hsl(var(--tf-accent-danger) / 0.1)', color: 'hsl(var(--tf-accent-danger))' }}>
          <AlertTriangle size={14} />
          {uploadError}
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Datasets', value: DATASETS.length, icon: Database },
          { label: 'Ready', value: readyCount, icon: CheckCircle2 },
          { label: 'Total Chunks', value: totalChunks.toLocaleString(), icon: Layers },
          { label: 'Storage', value: fmtSize(totalSize), icon: HardDrive },
        ].map((card) => (
          <Card key={card.label} style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: 'hsl(var(--tf-suite-gpt) / 0.1)' }}>
                <card.icon size={20} style={{ color: 'hsl(var(--tf-suite-gpt))' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{card.label}</p>
                <p className="text-lg font-semibold" style={{ color: 'hsl(var(--tf-fg))' }}>{card.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(var(--tf-muted))' }} />
          <Input
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40" style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Dataset list */}
        <div className="col-span-2 space-y-3">
          {filteredDatasets.map((ds) => (
            <Card
              key={ds.id}
              className="cursor-pointer transition-colors"
              onClick={() => setSelectedDataset(ds.id === selectedDataset ? null : ds.id)}
              style={{
                background: ds.id === selectedDataset ? 'hsl(var(--tf-suite-gpt) / 0.05)' : 'hsl(var(--tf-card-bg))',
                borderColor: ds.id === selectedDataset ? 'hsl(var(--tf-suite-gpt) / 0.3)' : 'hsl(var(--tf-border))',
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {statusIcon(ds.status)}
                    <h3 className="font-medium" style={{ color: 'hsl(var(--tf-fg))' }}>{ds.name}</h3>
                    <Badge variant="outline" className="text-xs" style={{ borderColor: 'hsl(var(--tf-suite-gpt) / 0.3)', color: 'hsl(var(--tf-suite-gpt))' }}>
                      {ds.linkedGpts} GPT{ds.linkedGpts !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  <span className="text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>{fmtSize(ds.sizeBytes)}</span>
                </div>
                <p className="text-sm mt-1" style={{ color: 'hsl(var(--tf-muted))' }}>{ds.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'hsl(var(--tf-muted))' }}>
                  <span>{ds.documentCount} docs</span>
                  <span>{ds.chunkCount.toLocaleString()} chunks</span>
                  <span>{ds.embeddingModel}</span>
                </div>
                {ds.status === 'processing' && (
                  <Progress value={65} className="h-1 mt-2" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Document detail panel */}
        <div>
          {selectedDs ? (
            <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2" style={{ color: 'hsl(var(--tf-fg))' }}>
                  <FileText size={16} style={{ color: 'hsl(var(--tf-suite-gpt))' }} />
                  Documents
                </CardTitle>
                <CardDescription style={{ color: 'hsl(var(--tf-muted))' }}>
                  {selectedDs.name} — {selectedDocs.length} document{selectedDocs.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedDocs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">File</TableHead>
                        <TableHead className="text-xs text-right">Chunks</TableHead>
                        <TableHead className="text-xs text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedDocs.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="text-xs font-mono" style={{ color: 'hsl(var(--tf-fg))' }}>
                            {doc.filename}
                          </TableCell>
                          <TableCell className="text-xs text-right" style={{ color: 'hsl(var(--tf-muted))' }}>
                            {doc.chunks}
                          </TableCell>
                          <TableCell className="text-right">
                            {docStatusBadge(doc.status)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm py-4 text-center" style={{ color: 'hsl(var(--tf-muted))' }}>
                    No documents available for preview
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" onClick={handleUpload}>
                    <Upload size={14} className="mr-1" /> Add Docs
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye size={14} className="mr-1" /> Preview Chunks
                  </Button>
                  <Button size="sm" variant="outline">
                    <RefreshCw size={14} className="mr-1" /> Re-embed
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card style={{ background: 'hsl(var(--tf-card-bg))', borderColor: 'hsl(var(--tf-border))' }}>
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[300px]">
                <Database size={32} style={{ color: 'hsl(var(--tf-muted) / 0.3)' }} />
                <p className="text-sm mt-3" style={{ color: 'hsl(var(--tf-muted))' }}>
                  Select a dataset to view documents
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
