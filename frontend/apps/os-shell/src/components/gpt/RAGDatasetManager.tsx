// TerraFusionGPT Suite: RAG Dataset Management Component
// Wave 2 canonical routed lane for dataset and document operations.

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Database,
  Eye,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
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
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ragAPI,
  type RAGDataset,
  type RAGDocument,
  type RAGDocumentChunk,
} from '@/services/ragAPI';

interface RAGDatasetManagerProps {
  onSelectDataset?: (dataset: RAGDataset) => void;
}

type ViewMode = 'datasets' | 'documents' | 'chunks';

type DatasetFormState = {
  name: string;
  description: string;
  category: string;
  embeddingProvider: string;
  embeddingModel: string;
};

type DocumentFormState = {
  title: string;
  content: string;
  sourceUrl: string;
  documentType: string;
  author: string;
};

const DEFAULT_DATASET_FORM: DatasetFormState = {
  name: '',
  description: '',
  category: '',
  embeddingProvider: 'OpenAI',
  embeddingModel: 'text-embedding-3-small',
};

const DEFAULT_DOCUMENT_FORM: DocumentFormState = {
  title: '',
  content: '',
  sourceUrl: '',
  documentType: '',
  author: '',
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = error as {
      response?: { data?: { error?: string; message?: string } };
      message?: string;
    };
    return (
      maybeResponse.response?.data?.error ||
      maybeResponse.response?.data?.message ||
      maybeResponse.message ||
      fallback
    );
  }
  return fallback;
}

function trimOptional(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

export const RAGDatasetManager: React.FC<RAGDatasetManagerProps> = ({ onSelectDataset }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('datasets');
  const [datasets, setDatasets] = useState<RAGDataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<RAGDataset | null>(null);
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<RAGDocument | null>(null);
  const [chunks, setChunks] = useState<RAGDocumentChunk[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingDataset, setIsCreatingDataset] = useState(false);
  const [isSavingDocument, setIsSavingDocument] = useState(false);
  const [createDatasetDialogOpen, setCreateDatasetDialogOpen] = useState(false);
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [newDatasetForm, setNewDatasetForm] = useState<DatasetFormState>(DEFAULT_DATASET_FORM);
  const [documentForm, setDocumentForm] = useState<DocumentFormState>(DEFAULT_DOCUMENT_FORM);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void loadDatasets();
  }, []);

  const clearMessages = () => {
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const loadDatasets = async () => {
    setIsLoading(true);

    try {
      const data = await ragAPI.getDatasets();
      setDatasets(data);
      if (selectedDataset) {
        const refreshed = data.find((dataset) => dataset.id === selectedDataset.id) || null;
        setSelectedDataset(refreshed);
        if (refreshed) {
          onSelectDataset?.(refreshed);
        }
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to load datasets'));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSelectedDataset = async (datasetId: number) => {
    try {
      const dataset = await ragAPI.getDataset(datasetId);
      setSelectedDataset(dataset);
      onSelectDataset?.(dataset);
    } catch {
      // Dataset refetch is best-effort; the list view remains the source of truth.
    }
  };

  const loadDocuments = async (datasetId: number) => {
    setIsLoading(true);

    try {
      const data = await ragAPI.getDocuments(datasetId);
      setDocuments(data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to load documents'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadChunks = async (documentId: number) => {
    setIsLoading(true);

    try {
      const data = await ragAPI.getChunks(documentId);
      setChunks(data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to load chunks'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDataset = async (dataset: RAGDataset) => {
    clearMessages();
    setSelectedDataset(dataset);
    setSelectedDocument(null);
    setChunks([]);
    setViewMode('documents');
    onSelectDataset?.(dataset);
    await loadDocuments(dataset.id);
    await refreshSelectedDataset(dataset.id);
  };

  const handleCreateDataset = async () => {
    clearMessages();
    setIsCreatingDataset(true);

    try {
      const createdDataset = await ragAPI.createDataset({
        name: newDatasetForm.name.trim(),
        description: trimOptional(newDatasetForm.description),
        category: trimOptional(newDatasetForm.category),
        embeddingProvider: newDatasetForm.embeddingProvider,
        embeddingModel: newDatasetForm.embeddingModel,
      });

      setSuccessMessage(`Dataset "${createdDataset.name}" created successfully`);
      setCreateDatasetDialogOpen(false);
      setNewDatasetForm(DEFAULT_DATASET_FORM);
      await loadDatasets();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to create dataset'));
    } finally {
      setIsCreatingDataset(false);
    }
  };

  const handleAddDocument = async () => {
    if (!selectedDataset) return;

    clearMessages();
    setIsSavingDocument(true);

    try {
      const document = await ragAPI.addDocument(selectedDataset.id, {
        title: documentForm.title.trim(),
        content: documentForm.content.trim(),
        sourceUrl: trimOptional(documentForm.sourceUrl),
        documentType: trimOptional(documentForm.documentType),
        author: trimOptional(documentForm.author),
      });

      setSuccessMessage(`Document "${document.title}" added and indexed successfully`);
      setDocumentDialogOpen(false);
      setDocumentForm(DEFAULT_DOCUMENT_FORM);
      await Promise.all([
        loadDocuments(selectedDataset.id),
        loadDatasets(),
        refreshSelectedDataset(selectedDataset.id),
      ]);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to add document'));
    } finally {
      setIsSavingDocument(false);
    }
  };

  const handleDeleteDataset = async (dataset: RAGDataset) => {
    const confirmed = window.confirm(
      `Delete "${dataset.name}" from active datasets? The current backend route removes it from active lists.`,
    );
    if (!confirmed) return;

    clearMessages();

    try {
      await ragAPI.deleteDataset(dataset.id);
      if (selectedDataset?.id === dataset.id) {
        setSelectedDataset(null);
        setSelectedDocument(null);
        setDocuments([]);
        setChunks([]);
        setViewMode('datasets');
      }
      setSuccessMessage(`Dataset "${dataset.name}" deleted from active collections`);
      await loadDatasets();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to delete dataset'));
    }
  };

  const handleDeleteDocument = async (document: RAGDocument) => {
    const confirmed = window.confirm(`Delete document "${document.title}"?`);
    if (!confirmed || !selectedDataset) return;

    clearMessages();

    try {
      await ragAPI.deleteDocument(document.id);
      if (selectedDocument?.id === document.id) {
        setSelectedDocument(null);
        setChunks([]);
        setViewMode('documents');
      }
      setSuccessMessage(`Document "${document.title}" deleted successfully`);
      await Promise.all([
        loadDocuments(selectedDataset.id),
        loadDatasets(),
        refreshSelectedDataset(selectedDataset.id),
      ]);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to delete document'));
    }
  };

  const handleReindex = async (dataset: RAGDataset) => {
    clearMessages();

    try {
      await ragAPI.reindexDataset(dataset.id);
      setSuccessMessage(`Dataset "${dataset.name}" reindexed successfully`);
      await Promise.all([
        loadDatasets(),
        refreshSelectedDataset(dataset.id),
        selectedDataset?.id === dataset.id ? loadDocuments(dataset.id) : Promise.resolve(),
      ]);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, 'Failed to reindex dataset'));
    }
  };

  const renderDatasetsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">RAG Datasets</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Create, browse, reindex, and remove dataset collections backed by the canonical RAG API.
          </p>
        </div>
        <Button onClick={() => setCreateDatasetDialogOpen(true)} aria-label="Create dataset">
          <Plus className="mr-2 h-4 w-4" />
          Create Dataset
        </Button>
      </div>

      {datasets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Database className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p className="mb-4 text-gray-600 dark:text-gray-400">
              No datasets yet. Create the first dataset to start adding source documents.
            </p>
            <Button onClick={() => setCreateDatasetDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Dataset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {datasets.map((dataset) => (
            <Card
              key={dataset.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => {
                void handleSelectDataset(dataset);
              }}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{dataset.name}</CardTitle>
                    {dataset.category ? (
                      <Badge variant="secondary" className="mt-1">
                        {dataset.category}
                      </Badge>
                    ) : null}
                  </div>
                  <Badge variant={dataset.status === 'Active' ? 'default' : 'secondary'}>
                    {dataset.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <CardDescription className="mb-4 line-clamp-2">
                  {dataset.description || 'No description provided for this dataset.'}
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

                <div className="flex flex-wrap items-center gap-1 text-xs">
                  <Badge variant="outline">{dataset.embeddingProvider}</Badge>
                  <Badge variant="outline">{dataset.embeddingModel}</Badge>
                </div>
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  aria-label={`Add document to ${dataset.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedDataset(dataset);
                    onSelectDataset?.(dataset);
                    setDocumentDialogOpen(true);
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Add Document
                </Button>
                <Button
                  variant="outline"
                  aria-label={`Reindex dataset ${dataset.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleReindex(dataset);
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  aria-label={`Delete dataset ${dataset.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    void handleDeleteDataset(dataset);
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

  const renderDocumentsView = () => {
    if (!selectedDataset) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              onClick={() => {
                setViewMode('datasets');
                setSelectedDocument(null);
                setChunks([]);
              }}
            >
              ← Back to Datasets
            </Button>
            <h2 className="mt-2 text-2xl font-bold">{selectedDataset.name}</h2>
            <p className="text-gray-600 dark:text-gray-400">{documents.length} documents</p>
          </div>
          <Button onClick={() => setDocumentDialogOpen(true)} aria-label="Add document">
            <Upload className="mr-2 h-4 w-4" />
            Add Document
          </Button>
        </div>

        {documents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                No documents yet. Add a document by pasting content and optional metadata.
              </p>
              <Button onClick={() => setDocumentDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Add First Document
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
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        {document.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{document.documentType || 'Text'}</Badge>
                    </TableCell>
                    <TableCell>{document.author || '-'}</TableCell>
                    <TableCell>{document.chunkCount}</TableCell>
                    <TableCell>
                      <Badge variant={document.status === 'Indexed' ? 'default' : 'secondary'}>
                        {document.status || 'Processing'}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(document.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`View chunks for ${document.title}`}
                          onClick={() => {
                            setSelectedDocument(document);
                            setViewMode('chunks');
                            void loadChunks(document.id);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Delete document ${document.title}`}
                          onClick={() => {
                            void handleDeleteDocument(document);
                          }}
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

  const renderChunksView = () => {
    if (!selectedDocument) return null;

    return (
      <div className="space-y-4">
        <div>
          <Button variant="ghost" onClick={() => setViewMode('documents')}>
            ← Back to Documents
          </Button>
          <h2 className="mt-2 text-2xl font-bold">{selectedDocument.title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{chunks.length} chunks</p>
        </div>

        {chunks.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Chunk browsing is live, but the current backend route can still return an empty list until indexed chunk
              projections are present.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          {chunks.map((chunk) => (
            <Card key={chunk.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Chunk {chunk.chunkIndex + 1}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{chunk.tokenCount} tokens</Badge>
                    {chunk.hasEmbedding ? (
                      <Badge variant="default">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Embedded
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending embedding</Badge>
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

  const renderCreateDatasetDialog = () => (
    <Dialog open={createDatasetDialogOpen} onOpenChange={setCreateDatasetDialogOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create RAG Dataset</DialogTitle>
          <DialogDescription>
            Create a new document collection for semantic search. Dataset metadata editing is not exposed by the
            current backend contract.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="dataset-name">Dataset name</Label>
            <Input
              id="dataset-name"
              value={newDatasetForm.name}
              onChange={(event) => setNewDatasetForm({ ...newDatasetForm, name: event.target.value })}
              placeholder="Government Policies"
            />
          </div>

          <div>
            <Label htmlFor="dataset-description">Dataset description</Label>
            <Textarea
              id="dataset-description"
              value={newDatasetForm.description}
              onChange={(event) =>
                setNewDatasetForm({ ...newDatasetForm, description: event.target.value })
              }
              placeholder="County government policies and procedures"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="dataset-category">Dataset category</Label>
            <Input
              id="dataset-category"
              value={newDatasetForm.category}
              onChange={(event) => setNewDatasetForm({ ...newDatasetForm, category: event.target.value })}
              placeholder="Policy, Assessment, Legal"
            />
          </div>

          <div>
            <Label htmlFor="embedding-provider">Embedding provider</Label>
            <Select
              value={newDatasetForm.embeddingProvider}
              onValueChange={(value) => setNewDatasetForm({ ...newDatasetForm, embeddingProvider: value })}
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
            <Label htmlFor="embedding-model">Embedding model</Label>
            <Select
              value={newDatasetForm.embeddingModel}
              onValueChange={(value) => setNewDatasetForm({ ...newDatasetForm, embeddingModel: value })}
            >
              <SelectTrigger id="embedding-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {newDatasetForm.embeddingProvider === 'OpenAI' ? (
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
                ) : null}
                {newDatasetForm.embeddingProvider === 'Local' ? (
                  <>
                    <SelectItem value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 (384 dimensions)</SelectItem>
                    <SelectItem value="all-mpnet-base-v2">all-mpnet-base-v2 (768 dimensions)</SelectItem>
                  </>
                ) : null}
                {newDatasetForm.embeddingProvider === 'Azure' ? (
                  <SelectItem value="text-embedding-3-small">text-embedding-3-small (1536 dimensions)</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setCreateDatasetDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void handleCreateDataset()} disabled={!newDatasetForm.name.trim() || isCreatingDataset}>
            {isCreatingDataset ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Dataset'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderDocumentDialog = () => (
    <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
          <DialogDescription>
            Add a new document to {selectedDataset?.name}. The current backend route accepts pasted content and
            metadata, not binary file uploads.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="doc-title">Document title</Label>
            <Input
              id="doc-title"
              value={documentForm.title}
              onChange={(event) => setDocumentForm({ ...documentForm, title: event.target.value })}
              placeholder="Property Assessment Manual"
            />
          </div>

          <div>
            <Label htmlFor="doc-content">Document content</Label>
            <Textarea
              id="doc-content"
              value={documentForm.content}
              onChange={(event) => setDocumentForm({ ...documentForm, content: event.target.value })}
              placeholder="Paste document content here..."
              rows={10}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="doc-type">Document type</Label>
              <Input
                id="doc-type"
                value={documentForm.documentType}
                onChange={(event) => setDocumentForm({ ...documentForm, documentType: event.target.value })}
                placeholder="Policy, Manual, Memo"
              />
            </div>

            <div>
              <Label htmlFor="doc-author">Author</Label>
              <Input
                id="doc-author"
                value={documentForm.author}
                onChange={(event) => setDocumentForm({ ...documentForm, author: event.target.value })}
                placeholder="Author name"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="doc-source">Source URL</Label>
            <Input
              id="doc-source"
              value={documentForm.sourceUrl}
              onChange={(event) => setDocumentForm({ ...documentForm, sourceUrl: event.target.value })}
              placeholder="https://example.gov/document"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDocumentDialogOpen(false)} disabled={isSavingDocument}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleAddDocument()}
            disabled={!documentForm.title.trim() || !documentForm.content.trim() || isSavingDocument}
          >
            {isSavingDocument ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Add & Index
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="flex h-full flex-col p-6">
      <Alert className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Live in this slice: dataset list, create, delete, document add, document delete, and dataset reindex through
          the canonical RAG API. Not supported by current backend truth: dataset metadata edit, binary file upload,
          and live push updates, so this view refetches after each mutation.
        </AlertDescription>
      </Alert>

      {successMessage ? (
        <Alert className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}

      {errorMessage ? (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {viewMode === 'datasets' ? renderDatasetsView() : null}
          {viewMode === 'documents' ? renderDocumentsView() : null}
          {viewMode === 'chunks' ? renderChunksView() : null}
        </>
      )}

      {renderCreateDatasetDialog()}
      {renderDocumentDialog()}
    </div>
  );
};

export default RAGDatasetManager;
