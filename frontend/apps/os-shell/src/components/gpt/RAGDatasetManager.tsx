// TerraFusionGPT Suite: RAG Dataset Management Component
// Elite Government OS Engineering - Document & Knowledge Base Management

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Upload,
  FileText,
  Database,
  Search,
  Trash2,
  Edit,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2,
  FolderOpen,
  FileCode,
  Book,
  Settings,
  BarChart3,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { gptHub } from '@/services/gptHub';
import { ragAPI, RAGServiceUnavailableError } from '@/services/ragAPI';
import type { RAGDataset, RAGDocument, RAGDocumentChunk } from '@/services/ragAPI';

interface RAGDatasetManagerProps {
  onSelectDataset?: (dataset: RAGDataset) => void;
}

type ViewMode = 'datasets' | 'documents' | 'chunks';

/**
 * RAG Dataset Manager - Manage document collections and embeddings
 */
export const RAGDatasetManager: React.FC<RAGDatasetManagerProps> = ({ onSelectDataset }) => {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('datasets');
  const [datasets, setDatasets] = useState<RAGDataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<RAGDataset | null>(null);
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<RAGDocument | null>(null);
  const [chunks, setChunks] = useState<RAGDocumentChunk[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Create Dataset Dialog
  const [createDatasetDialogOpen, setCreateDatasetDialogOpen] = useState(false);
  const [newDatasetForm, setNewDatasetForm] = useState({
    name: '',
    description: '',
    category: '',
    embeddingProvider: 'OpenAI',
    embeddingModel: 'text-embedding-3-small',
  });

  // Upload Document Dialog
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    content: '',
    sourceUrl: '',
    documentType: '',
    author: '',
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDataset, setEditingDataset] = useState<RAGDataset | null>(null);

  // Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Load datasets on mount
   */
  useEffect(() => {
    loadDatasets();
  }, []);

  /**
   * Connect to SignalR for RAG processing updates
   */
  useEffect(() => {
    const connectHub = async () => {
      try {
        if (!gptHub.isConnected()) {
          await gptHub.start({
            onRAGProcessingStatus: (status) => {
              // Update processing status
              console.debug('RAG Processing Status:', status);

              // Refresh data if processing completed
              if (status.status === 'Completed') {
                loadDatasets();
                if (selectedDataset) {
                  loadDocuments(selectedDataset.id);
                }
              }
            },
          });
        }
      } catch (err) {
        console.error('Failed to connect to GPT Hub:', err);
      }
    };

    connectHub();
  }, [selectedDataset]);

  /**
   * Load all datasets
   */
  const loadDatasets = async () => {
    setIsLoading(true);

    try {
      const data = await ragAPI.getDatasets();
      setDatasets(data);
    } catch (err) {
      if (err instanceof RAGServiceUnavailableError) {
        // Backend RAG endpoints not deployed yet — show empty state, not an error
        setDatasets([]);
        console.info('RAG service not configured — showing empty dataset list');
      } else {
        setErrorMessage('Failed to load datasets');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load documents for a dataset
   */
  const loadDocuments = async (datasetId: number) => {
    setIsLoading(true);

    try {
      const data = await ragAPI.getDocuments(datasetId);
      setDocuments(data);
    } catch (err) {
      if (err instanceof RAGServiceUnavailableError) {
        setDocuments([]);
        console.info('RAG service not configured — showing empty document list');
      } else {
        setErrorMessage('Failed to load documents');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load chunks for a document
   */
  const loadChunks = async (documentId: number) => {
    setIsLoading(true);

    try {
      const data = await ragAPI.getChunks(documentId);
      setChunks(data);
    } catch (err) {
      if (err instanceof RAGServiceUnavailableError) {
        setChunks([]);
        console.info('RAG service not configured — showing empty chunk list');
      } else {
        setErrorMessage('Failed to load chunks');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle create dataset
   */
  const handleCreateDataset = async () => {
    try {
      await ragAPI.createDataset(newDatasetForm);

      setSuccessMessage('Dataset created successfully');
      setCreateDatasetDialogOpen(false);
      setNewDatasetForm({
        name: '',
        description: '',
        category: '',
        embeddingProvider: 'OpenAI',
        embeddingModel: 'text-embedding-3-small',
      });
      await loadDatasets();
    } catch (err) {
      if (err instanceof RAGServiceUnavailableError) {
        setErrorMessage('RAG service not configured — cannot create dataset');
      } else {
        setErrorMessage('Failed to create dataset');
      }
      console.error(err);
    }
  };

  /**
   * Handle upload document
   */
  const handleUploadDocument = async () => {
    if (!selectedDataset) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setUploadProgress(i);
      }

      await ragAPI.uploadDocument(selectedDataset.id, uploadForm);

      setSuccessMessage('Document uploaded and processing started');
      setUploadDialogOpen(false);
      setUploadForm({
        title: '',
        content: '',
        sourceUrl: '',
        documentType: '',
        author: '',
      });
      await loadDocuments(selectedDataset.id);
    } catch (err) {
      if (err instanceof RAGServiceUnavailableError) {
        setErrorMessage('RAG service not configured — cannot upload document');
      } else {
        setErrorMessage('Failed to upload document');
      }
      console.error(err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  /**
   * Handle delete dataset
   */
  const handleDeleteDataset = async (dataset: RAGDataset) => {
    if (!confirm(`Are you sure you want to delete "${dataset.name}"? This will delete all documents and embeddings.`)) {
      return;
    }

    try {
      await ragAPI.deleteDataset(dataset.id);

      setSuccessMessage('Dataset deleted successfully');
      await loadDatasets();
    } catch (err) {
      if (err instanceof RAGServiceUnavailableError) {
        setErrorMessage('RAG service not configured — cannot delete dataset');
      } else {
        setErrorMessage('Failed to delete dataset');
      }
      console.error(err);
    }
  };

  /**
   * Handle delete document
   */
  const handleDeleteDocument = async (document: RAGDocument) => {
    if (!confirm(`Are you sure you want to delete "${document.title}"?`)) {
      return;
    }

    try {
      await ragAPI.deleteDocument(document.id);

      setSuccessMessage('Document deleted successfully');
      if (selectedDataset) {
        await loadDocuments(selectedDataset.id);
      }
    } catch (err) {
      if (err instanceof RAGServiceUnavailableError) {
        setErrorMessage('RAG service not configured — cannot delete document');
      } else {
        setErrorMessage('Failed to delete document');
      }
      console.error(err);
    }
  };

  /**
   * Handle reindex dataset
   */
  const handleReindex = async (dataset: RAGDataset) => {
    try {
      await ragAPI.reindexDataset(dataset.id);

      setSuccessMessage('Reindexing started');
    } catch (err) {
      if (err instanceof RAGServiceUnavailableError) {
        setErrorMessage('RAG service not configured — cannot reindex dataset');
      } else {
        setErrorMessage('Failed to start reindexing');
      }
      console.error(err);
    }
  };

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
    return `${(bytes / 1073741824).toFixed(2)} GB`;
  };

  /**
   * Render datasets view
   */
  const renderDatasetsView = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">RAG Datasets</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Manage document collections for semantic search
            </p>
          </div>
          <Button onClick={() => setCreateDatasetDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Dataset
          </Button>
        </div>

        {datasets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No datasets yet. Create your first dataset to get started.
              </p>
              <Button onClick={() => setCreateDatasetDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Dataset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((dataset) => (
              <Card
                key={dataset.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  setSelectedDataset(dataset);
                  setViewMode('documents');
                  loadDocuments(dataset.id);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{dataset.name}</CardTitle>
                      {dataset.category && (
                        <Badge variant="secondary" className="mt-1">
                          {dataset.category}
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingDataset(dataset);
                        setEditDialogOpen(true);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <CardDescription className="line-clamp-2 mb-4">
                    {dataset.description}
                  </CardDescription>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Documents:</span>
                      <span className="font-semibold">{dataset.documentCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Chunks:</span>
                      <span className="font-semibold">{dataset.totalChunks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storage:</span>
                      <span className="font-semibold">{formatFileSize(dataset.storageSize)}</span>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Badge variant="outline">{dataset.embeddingProvider}</Badge>
                      <Badge variant="outline">{dataset.embeddingModel}</Badge>
                    </div>
                    <Badge variant={dataset.status === 'Active' ? 'default' : 'secondary'}>
                      {dataset.status}
                    </Badge>
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDataset(dataset);
                      setUploadDialogOpen(true);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReindex(dataset);
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDataset(dataset);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  /**
   * Render documents view
   */
  const renderDocumentsView = () => {
    if (!selectedDataset) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => setViewMode('datasets')}>
              ← Back to Datasets
            </Button>
            <h2 className="text-2xl font-bold mt-2">{selectedDataset.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">{documents.length} documents</p>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No documents yet. Upload your first document to get started.
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Chunks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        {doc.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{doc.documentType || 'Text'}</Badge>
                    </TableCell>
                    <TableCell>{doc.author || '-'}</TableCell>
                    <TableCell>{doc.chunkCount}</TableCell>
                    <TableCell>
                      <Badge variant={doc.status === 'Indexed' ? 'default' : 'secondary'}>
                        {doc.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setViewMode('chunks');
                            loadChunks(doc.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    );
  };

  /**
   * Render chunks view
   */
  const renderChunksView = () => {
    if (!selectedDocument) return null;

    return (
      <div className="space-y-4">
        <div>
          <Button variant="ghost" onClick={() => setViewMode('documents')}>
            ← Back to Documents
          </Button>
          <h2 className="text-2xl font-bold mt-2">{selectedDocument.title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{chunks.length} chunks</p>
        </div>

        <div className="space-y-3">
          {chunks.map((chunk) => (
            <Card key={chunk.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    Chunk {chunk.chunkIndex + 1}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{chunk.tokenCount} tokens</Badge>
                    {chunk.hasEmbedding ? (
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Embedded
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processing
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300">{chunk.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render create dataset dialog
   */
  const renderCreateDatasetDialog = () => {
    return (
      <Dialog open={createDatasetDialogOpen} onOpenChange={setCreateDatasetDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Create RAG Dataset</DialogTitle>
            <DialogDescription>
              Create a new document collection for semantic search
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="dataset-name">Name *</Label>
              <Input
                id="dataset-name"
                value={newDatasetForm.name}
                onChange={(e) =>
                  setNewDatasetForm({ ...newDatasetForm, name: e.target.value })
                }
                placeholder="Government Policies"
              />
            </div>

            <div>
              <Label htmlFor="dataset-description">Description</Label>
              <Textarea
                id="dataset-description"
                value={newDatasetForm.description}
                onChange={(e) =>
                  setNewDatasetForm({ ...newDatasetForm, description: e.target.value })
                }
                placeholder="County government policies and procedures"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="dataset-category">Category</Label>
              <Input
                id="dataset-category"
                value={newDatasetForm.category}
                onChange={(e) =>
                  setNewDatasetForm({ ...newDatasetForm, category: e.target.value })
                }
                placeholder="Policy, Assessment, Legal, etc."
              />
            </div>

            <div>
              <Label htmlFor="embedding-provider">Embedding Provider</Label>
              <Select
                value={newDatasetForm.embeddingProvider}
                onValueChange={(value) =>
                  setNewDatasetForm({ ...newDatasetForm, embeddingProvider: value })
                }
              >
                <SelectTrigger id="embedding-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OpenAI">OpenAI</SelectItem>
                  <SelectItem value="Azure">Azure OpenAI</SelectItem>
                  <SelectItem value="Local">Local (Sentence Transformers)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="embedding-model">Embedding Model</Label>
              <Select
                value={newDatasetForm.embeddingModel}
                onValueChange={(value) =>
                  setNewDatasetForm({ ...newDatasetForm, embeddingModel: value })
                }
              >
                <SelectTrigger id="embedding-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {newDatasetForm.embeddingProvider === 'OpenAI' && (
                    <>
                      <SelectItem value="text-embedding-3-small">
                        text-embedding-3-small (1536 dimensions)
                      </SelectItem>
                      <SelectItem value="text-embedding-3-large">
                        text-embedding-3-large (3072 dimensions)
                      </SelectItem>
                      <SelectItem value="text-embedding-ada-002">
                        text-embedding-ada-002 (1536 dimensions)
                      </SelectItem>
                    </>
                  )}
                  {newDatasetForm.embeddingProvider === 'Local' && (
                    <>
                      <SelectItem value="all-MiniLM-L6-v2">
                        all-MiniLM-L6-v2 (384 dimensions)
                      </SelectItem>
                      <SelectItem value="all-mpnet-base-v2">
                        all-mpnet-base-v2 (768 dimensions)
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDatasetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDataset} disabled={!newDatasetForm.name}>
              Create Dataset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  /**
   * Render upload document dialog
   */
  const renderUploadDialog = () => {
    return (
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Add a new document to {selectedDataset?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="doc-title">Title *</Label>
              <Input
                id="doc-title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                placeholder="Property Assessment Manual"
              />
            </div>

            <div>
              <Label htmlFor="doc-content">Content *</Label>
              <Textarea
                id="doc-content"
                value={uploadForm.content}
                onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
                placeholder="Paste document content here..."
                rows={10}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doc-type">Document Type</Label>
                <Input
                  id="doc-type"
                  value={uploadForm.documentType}
                  onChange={(e) => setUploadForm({ ...uploadForm, documentType: e.target.value })}
                  placeholder="PDF, Word, Text, etc."
                />
              </div>

              <div>
                <Label htmlFor="doc-author">Author</Label>
                <Input
                  id="doc-author"
                  value={uploadForm.author}
                  onChange={(e) => setUploadForm({ ...uploadForm, author: e.target.value })}
                  placeholder="Author name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="doc-source">Source URL</Label>
              <Input
                id="doc-source"
                value={uploadForm.sourceUrl}
                onChange={(e) => setUploadForm({ ...uploadForm, sourceUrl: e.target.value })}
                placeholder="https://example.com/document.pdf"
              />
            </div>

            {isUploading && (
              <div>
                <Label>Upload Progress</Label>
                <Progress value={uploadProgress} className="mt-2" />
                <p className="text-sm text-gray-600 mt-1">{uploadProgress}%</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadDocument}
              disabled={!uploadForm.title || !uploadForm.content || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Process
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="h-full flex flex-col p-6">
      {/* Messages */}
      {successMessage && (
        <Alert className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {viewMode === 'datasets' && renderDatasetsView()}
          {viewMode === 'documents' && renderDocumentsView()}
          {viewMode === 'chunks' && renderChunksView()}
        </>
      )}

      {/* Dialogs */}
      {renderCreateDatasetDialog()}
      {renderUploadDialog()}
    </div>
  );
};

export default RAGDatasetManager;
