import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Upload, 
  Send, 
  FileText, 
  Trash2, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_RAG_API_URL || 'http://localhost:5001';

interface HealthStatus {
  status: string;
  services: {
    ollama: string;
    chromadb: string;
    document_count: number;
  };
  timestamp: string;
}

interface QueryResponse {
  query: string;
  answer: string;
  confidence: number;
  sources: Array<{
    filename: string;
    relevance: number;
  }>;
  timestamp: string;
}

interface Document {
  filename: string;
  chunks: number;
  upload_time: string;
}

interface Stats {
  total_documents: number;
  total_chunks: number;
  sources: Record<string, number>;
}

export const RAGPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [showSources, setShowSources] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch health status
  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error('Failed to fetch health:', err);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Fetch documents
  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/documents`);
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchHealth();
    fetchStats();
    fetchDocuments();

    const interval = setInterval(() => {
      fetchHealth();
      fetchStats();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle query submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!res.ok) {
        throw new Error(`Query failed: ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/add_document`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.statusText}`);
      }

      const data = await res.json();
      
      // Refresh documents and stats
      await fetchDocuments();
      await fetchStats();
      
      setError(null);
      // Show success message instead of alert
      setError(`Successfully uploaded ${data.filename} (${data.chunks_created} chunks created)`);
      setTimeout(() => setError(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/delete_document`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });

      if (!res.ok) {
        throw new Error(`Delete failed: ${res.statusText}`);
      }

      // Refresh documents and stats
      await fetchDocuments();
      await fetchStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  // Get health badge variant
  const getHealthVariant = () => {
    if (!health) return 'secondary';
    if (health.status === 'healthy' && health.services.ollama === 'connected') {
      return 'default';
    }
    if (health.status === 'healthy') return 'secondary';
    return 'destructive';
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Search className="h-6 w-6" />
        <h2 className="text-2xl font-semibold">Knowledge Base Assistant</h2>
      </div>

      {/* Health and Stats Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant={getHealthVariant()}>
                {health?.status === 'healthy' ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1" />
                )}
                System {health?.status || 'unknown'}
              </Badge>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">{stats?.total_documents || 0} Documents</span>
              </div>

              <Badge variant="outline">{stats?.total_chunks || 0} Chunks</Badge>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                fetchHealth();
                fetchStats();
                fetchDocuments();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".txt,.pdf,.docx,.md,.json,.csv,.xlsx"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload Document
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Supported: txt, pdf, docx, md, json, csv, xlsx
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDocuments(!showDocuments)}
            >
              {documents.length} Documents
              {showDocuments ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
            </Button>
          </div>

          {/* Documents List */}
          {showDocuments && (
            <>
              <Separator className="my-4" />
              <ScrollArea className="h-48">
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.filename}
                      className="flex items-center justify-between p-2 rounded hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium">{doc.filename}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.chunks} chunks • {new Date(doc.upload_time).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDocument(doc.filename)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>

      {/* Query Section */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Ask about permits, zoning, regulations..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" disabled={loading || !query.trim()}>
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert variant={error.includes('Successfully') ? 'default' : 'destructive'}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Response Display */}
      {response && (
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-4 h-full overflow-auto">
            <div className="space-y-4">
              {/* Question */}
              <div>
                <p className="text-sm text-muted-foreground">Your Question:</p>
                <p className="font-medium">{response.query}</p>
              </div>

              <Separator />

              {/* Answer */}
              <div>
                <p className="text-sm text-muted-foreground">Answer:</p>
                <p className="whitespace-pre-wrap">{response.answer}</p>
              </div>

              {/* Confidence */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Confidence: {(response.confidence * 100).toFixed(0)}%
                </p>
                <Progress value={response.confidence * 100} className="h-2" />
              </div>

              {/* Sources */}
              {response.sources.length > 0 && (
                <div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSources(!showSources)}
                    className="mb-2"
                  >
                    {response.sources.length} Sources
                    {showSources ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                  </Button>

                  {showSources && (
                    <div className="space-y-2">
                      {response.sources.map((source, idx) => (
                        <div key={idx} className="p-2 bg-accent rounded">
                          <p className="font-medium">{source.filename}</p>
                          <p className="text-sm text-muted-foreground">
                            Relevance: {(source.relevance * 100).toFixed(0)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Initial State */}
      {!response && !loading && !error && (
        <Card className="flex-1">
          <CardContent className="h-full flex items-center justify-center">
            <div className="text-center">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle>TerraFusion Knowledge Base</CardTitle>
              <CardDescription className="mt-2">
                Upload documents and ask questions about Benton County permits,
                zoning regulations, and development standards.
              </CardDescription>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};