import React, {useState, useEffect, useCallback} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,} from '@/components/ui/select';
import {useDropzone} from 'react-dropzone';
import {Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  Filter,
  BarChart3,
  Settings,
  Search,
  Trash2,
  RefreshCw,} from '@mui/icons-material';

interface DocumentFile {id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  classification?: DocumentClassification;
  content?: string;
  error?: string;}

interface DocumentClassification {category: string;
  subcategory: string;
  confidence: number;
  tags: string[];
  metadata: {
    pageCount?: number;
    wordCount?: number;
    language?: string;
    documentType?: string;
    extractedText?: string;
    entities?: string[];};
  suggestedActions: string[];
}

interface ClassificationStats {totalDocuments: number;
  processedDocuments: number;
  categories: { [key: string]: number};
  averageConfidence: number;
  processingTime: number;
}

export default function DocumentClassificationPage() {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState<ClassificationStats>({
    totalDocuments: 0,
    processedDocuments: 0,
    categories: {},
    averageConfidence: 0,
    processingTime: 0,
  });
  const [filters, setFilters] = useState({category: '',
    status: '',
    searchTerm: '',});
  const [selectedTab, setSelectedTab] = useState('upload');

  // Document categories
  const documentCategories = [
    'Legal Documents',
    'Property Deeds',
    'Survey Reports',
    'Environmental Reports',
    'Zoning Documents',
    'Building Permits',
    'Tax Records',
    'Maps and Plans',
    'Correspondence',
    'Other',
  ];

  // File drop zone configuration
  const onDrop = useCallback((acceptedFiles: File[]) =>{
    const newDocuments: DocumentFile[] = acceptedFiles.map(file => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      status: 'pending',
      progress: 0,
    }));

    setDocuments(prev => [...prev, ...newDocuments]);

    // Start processing uploaded files
    newDocuments.forEach(doc => processDocument(doc));
  }, []);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/tiff': ['.tiff', '.tif'],},
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  });

  // Simulate document processing
  const processDocument = async (document: DocumentFile) => {setDocuments(prev =>
      prev.map(doc =>
        doc.id === document.id ? { ...doc, status: 'processing', progress: 10} : doc
      )
    );

    // Simulate processing steps
    const steps = [
      {progress: 25, delay: 1000},
      {progress: 50, delay: 1500},
      {progress: 75, delay: 1000},
      {progress: 90, delay: 800},
      {progress: 100, delay: 500},
    ];

    for (const step of steps) {await new Promise(resolve => setTimeout(resolve, step.delay));
      setDocuments(prev =>
        prev.map(doc => (doc.id === document.id ? { ...doc, progress: step.progress} : doc))
      );
    }

    // Generate mock classification results
    const mockClassification = generateMockClassification(document);

    setDocuments(prev =>
      prev.map(doc =>
        doc.id === document.id
          ? {...doc,
              status: 'completed',
              progress: 100,
              classification: mockClassification,
              content: generateMockContent(document.name),}
          : doc
      )
    );

    updateStats();
  };

  // Generate mock classification
  const generateMockClassification = (document: DocumentFile): DocumentClassification => {const categories = documentCategories;
    const category = categories[Math.floor(Math.random() * categories.length)];
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%

    const subcategories: { [key: string]: string[]} = {'Legal Documents': ['Contract', 'Agreement', 'License', 'Permit'],
      'Property Deeds': ['Warranty Deed', 'Quitclaim Deed', 'Trust Deed'],
      'Survey Reports': ['Boundary Survey', 'Topographic Survey', 'ALTA Survey'],
      'Environmental Reports': ['Environmental Impact', 'Soil Analysis', 'Water Quality'],
      'Zoning Documents': ['Zoning Map', 'Variance Request', 'Special Use Permit'],
      'Building Permits': ['Residential Permit', 'Commercial Permit', 'Renovation Permit'],
      'Tax Records': ['Assessment Record', 'Tax Bill', 'Exemption Certificate'],
      'Maps and Plans': ['Site Plan', 'Floor Plan', 'Subdivision Map'],
      Correspondence: ['Email', 'Letter', 'Memo'],
      Other: ['Miscellaneous', 'Unclassified'],};

    const subcategory = subcategories[category]?.[0] || 'General';

    const tags = [
      'processed',
      'reviewed',
      category.toLowerCase().replace(' ', '-'),
      document.type.includes('pdf') ? 'pdf-document' : 'image-document',
    ];

    return {category,
      subcategory,
      confidence,
      tags,
      metadata: {
        pageCount: Math.floor(Math.random() * 10) + 1,
        wordCount: Math.floor(Math.random() * 5000) + 500,
        language: 'en',
        documentType: document.type,
        extractedText: 'Sample extracted text content...',
        entities: ['Benton County', 'Washington State', 'Property ID: 12345'],},
      suggestedActions: [
        'Review classification accuracy',
        'Verify extracted data',
        'Archive to appropriate location',
        'Notify relevant stakeholders',
      ],
    };
  };

  // Generate mock content
  const generateMockContent = (filename: string): string => {
    return `Document Content Preview for ${filename}

This is a sample document that has been processed by the classification system. The content includes various elements that have been extracted and analyzed:

- Document metadata
- Key entities and information
- Classification results
- Suggested next steps

The actual document processing would extract real text content, identify key information, and provide accurate classification results based on the document type and content.`;
  };

  // Update statistics
  const updateStats = () => {const completed = documents.filter(doc => doc.status === 'completed');
    const categories: { [key: string]: number} = {};
    let totalConfidence = 0;

    completed.forEach(doc => {if (doc.classification) {
        const category = doc.classification.category;
        categories[category] = (categories[category] || 0) + 1;
        totalConfidence += doc.classification.confidence;}
    });

    setStats({totalDocuments: documents.length,
      processedDocuments: completed.length,
      categories,
      averageConfidence: completed.length > 0 ? totalConfidence / completed.length : 0,
      processingTime: completed.length * 2.5, // Mock processing time});
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {if (filters.status && doc.status !== filters.status) return false;
    if (filters.category && doc.classification?.category !== filters.category) return false;
    if (filters.searchTerm && !doc.name.toLowerCase().includes(filters.searchTerm.toLowerCase()))
      return false;
    return true;});

  // Delete document
  const deleteDocument = (documentId: string) => {setDocuments(prev => prev.filter(doc => doc.id !== documentId));
    if (selectedDocument?.id === documentId) {
      setSelectedDocument(null);}
  };

  // Reprocess document
  const reprocessDocument = (document: DocumentFile) => {const resetDoc = {
      ...document,
      status: 'pending' as const,
      progress: 0,
      classification: undefined,
      error: undefined,};

    setDocuments(prev => prev.map(doc => (doc.id === document.id ? resetDoc : doc)));

    processDocument(resetDoc);
  };

  // Clear all documents
  const clearAllDocuments = () => {setDocuments([]);
    setSelectedDocument(null);};

  // Update stats when documents change
  useEffect(() => {updateStats();}, [documents]);

  // Get status color
  const getStatusColor = (status: DocumentFile['status']) => {switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'processing':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-yellow-600';}
  };

  // Get status icon
  const getStatusIcon = (status: DocumentFile['status']) => {switch (status) {
      case 'completed':
        return<CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return (
          <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />);
      case 'failed':
        return<AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-yellow-600" />;}
  };

  // Format file size
  const formatFileSize = (bytes: number) =>{if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];};

  return (<div className="container mx-auto p-6 space-y-6"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Document Classification</h1><p className="text-muted-foreground">AI-powered document analysis and categorization</p></div><div className="flex items-center gap-2"><Badge variant="outline">{documents.length} Documents</Badge><Badge variant="outline">{stats.processedDocuments} Processed</Badge></div></div>{/* Statistics Dashboard */}<div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Total Documents</p><p className="text-2xl font-bold">{stats.totalDocuments}</p></div><FileText className="h-8 w-8 text-blue-600" /></div></CardContent></Card><Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Processed</p><p className="text-2xl font-bold">{stats.processedDocuments}</p></div><CheckCircle className="h-8 w-8 text-green-600" /></div></CardContent></Card><Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Avg Confidence</p><p className="text-2xl font-bold">{Math.round(stats.averageConfidence)}%</p></div><BarChart3 className="h-8 w-8 text-purple-600" /></div></CardContent></Card><Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-muted-foreground">Processing Time</p><p className="text-2xl font-bold">{stats.processingTime.toFixed(1)}s</p></div><Settings className="h-8 w-8 text-orange-600" /></div></CardContent></Card></div><Tabs value={selectedTab} onValueChange={setSelectedTab}><TabsList className="grid w-full grid-cols-4"><TabsTrigger value="upload">Upload</TabsTrigger><TabsTrigger value="documents">Documents</TabsTrigger><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="analytics">Analytics</TabsTrigger></TabsList><TabsContent value="upload" className="space-y-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Upload Documents</CardTitle></CardHeader><CardContent><div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'}`}
              ><input {...getInputProps()} /><Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">{isDragActive ? 'Drop files here' : 'Drag & drop documents'}</h3><p className="text-muted-foreground mb-4">or click to browse and select files</p><div className="text-sm text-muted-foreground"><p>Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, TIFF</p><p>Maximum file size: 50MB per file</p></div></div>{documents.length > 0 && (<div className="mt-6"><div className="flex items-center justify-between mb-4"><h4 className="text-lg font-medium">Recent Uploads</h4><Button onClick={clearAllDocuments} variant="outline" size="sm"><Trash2 className="h-4 w-4 mr-2" />Clear All</Button></div><div className="space-y-2">{documents.slice(-5).map(doc => (<div key={doc.id} className="flex items-center gap-3 p-3 border rounded-lg">{getStatusIcon(doc.status)}<div className="flex-1 min-w-0"><p className="font-medium truncate">{doc.name}</p><p className="text-sm text-muted-foreground">{formatFileSize(doc.size)} • {doc.uploadedAt.toLocaleTimeString()}</p>{doc.status === 'processing' && (<Progress value={doc.progress} className="mt-2" />)}</div><Badge variant="outline" className={getStatusColor(doc.status)}>{doc.status}</Badge></div>))}</div></div>)}</CardContent></Card></TabsContent><TabsContent value="documents" className="space-y-6"><Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Document Library</CardTitle></CardHeader><CardContent>{/* Filters */}<div className="flex flex-col sm:flex-row gap-4 mb-6"><div className="flex-1"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input
                      placeholder="Search documents..."
                      value={filters.searchTerm}
                      onChange={e => setFilters(prev => ({ ...prev, searchTerm: e.target.value}))}
                      className="pl-10"
                    /></div></div><Select
                  value={filters.status}
                  onValueChange={value => setFilters(prev => ({ ...prev, status: value}))}
                ><SelectTrigger className="w-40"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="">All Status</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="processing">Processing</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="failed">Failed</SelectItem></SelectContent></Select><Select
                  value={filters.category}
                  onValueChange={value => setFilters(prev => ({ ...prev, category: value}))}
                ><SelectTrigger className="w-48"><SelectValue placeholder="All Categories" /></SelectTrigger><SelectContent><SelectItem value="">All Categories</SelectItem>{documentCategories.map(category => (<SelectItem key={category} value={category}>{category}</SelectItem>))}</SelectContent></Select></div>{/* Documents List */}<div className="space-y-2">{filteredDocuments.map(doc => (<div
                    key={doc.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedDocument?.id === doc.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:border-gray-300'}`}
                    onClick={() => {
                      setSelectedDocument(doc);
                      setSelectedTab('details');}}
                  ><div className="flex items-start justify-between"><div className="flex items-start gap-3 flex-1">{getStatusIcon(doc.status)}<div className="flex-1 min-w-0"><h3 className="font-medium truncate">{doc.name}</h3><div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground"><span>{formatFileSize(doc.size)}</span><span>{doc.uploadedAt.toLocaleDateString()}</span>{doc.classification && (<><Badge variant="outline">{doc.classification.category}</Badge><span>{doc.classification.confidence}% confidence</span></>)}</div></div></div><div className="flex items-center gap-2"><Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            setSelectedDocument(doc);
                            setSelectedTab('details');}}
                        ><Eye className="h-4 w-4" /></Button>{doc.status === 'failed' && (<Button
                            size="sm"
                            variant="outline"
                            onClick={e => {
                              e.stopPropagation();
                              reprocessDocument(doc);}}
                          ><RefreshCw className="h-4 w-4" /></Button>)}<Button
                          size="sm"
                          variant="outline"
                          onClick={e => {
                            e.stopPropagation();
                            deleteDocument(doc.id);}}
                        ><Trash2 className="h-4 w-4" /></Button></div></div></div>))}</div>{filteredDocuments.length === 0 && (<div className="text-center py-8"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No Documents Found</h3><p className="text-muted-foreground">{documents.length === 0
                      ? 'Upload some documents to get started.'
                      : 'No documents match your current filters.'}</p></div>)}</CardContent></Card></TabsContent><TabsContent value="details" className="space-y-6">{selectedDocument ? (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><Card><CardHeader><CardTitle>Document Information</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label>File Name</Label><p className="text-sm font-medium">{selectedDocument.name}</p></div><div><Label>File Size</Label><p className="text-sm">{formatFileSize(selectedDocument.size)}</p></div><div><Label>Upload Date</Label><p className="text-sm">{selectedDocument.uploadedAt.toLocaleString()}</p></div><div><Label>Status</Label><div className="flex items-center gap-2">{getStatusIcon(selectedDocument.status)}<Badge variant="outline" className={getStatusColor(selectedDocument.status)}>{selectedDocument.status}</Badge></div></div>{selectedDocument.status === 'processing' && (<div><Label>Processing Progress</Label><Progress value={selectedDocument.progress} className="mt-2" /><p className="text-sm text-muted-foreground mt-1">{selectedDocument.progress}% complete</p></div>)}</CardContent></Card>{selectedDocument.classification && (<Card><CardHeader><CardTitle>Classification Results</CardTitle></CardHeader><CardContent className="space-y-4"><div><Label>Category</Label><p className="text-sm font-medium">{selectedDocument.classification.category}</p></div><div><Label>Subcategory</Label><p className="text-sm">{selectedDocument.classification.subcategory}</p></div><div><Label>Confidence Score</Label><div className="flex items-center gap-2"><Progress
                          value={selectedDocument.classification.confidence}
                          className="flex-1" /><span className="text-sm font-medium">{selectedDocument.classification.confidence}%</span></div></div><div><Label>Tags</Label><div className="flex flex-wrap gap-2 mt-2">{selectedDocument.classification.tags.map(tag => (<Badge key={tag} variant="secondary">{tag}</Badge>))}</div></div><div><Label>Metadata</Label><div className="text-sm space-y-1">{selectedDocument.classification.metadata.pageCount && (<p>Pages: {selectedDocument.classification.metadata.pageCount}</p>)}
                        {selectedDocument.classification.metadata.wordCount && (<p>Words: {selectedDocument.classification.metadata.wordCount}</p>)}
                        {selectedDocument.classification.metadata.language && (<p>Language: {selectedDocument.classification.metadata.language}</p>)}</div></div></CardContent></Card>)}

              {selectedDocument.content && (<Card className="lg:col-span-2"><CardHeader><CardTitle>Document Content Preview</CardTitle></CardHeader><CardContent><div className="max-h-64 overflow-y-auto p-4 bg-gray-50 rounded border"><pre className="text-sm whitespace-pre-wrap">{selectedDocument.content}</pre></div></CardContent></Card>)}

              {selectedDocument.classification?.suggestedActions && (<Card className="lg:col-span-2"><CardHeader><CardTitle>Suggested Actions</CardTitle></CardHeader><CardContent><ul className="space-y-2">{selectedDocument.classification.suggestedActions.map((action, index) => (<li key={index} className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-600 rounded-full" /><span className="text-sm">{action}</span></li>))}</ul></CardContent></Card>)}</div>) : (<Card><CardContent className="p-8 text-center"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No Document Selected</h3><p className="text-muted-foreground">Select a document from the Documents tab to view its details and classification
                  results.</p></CardContent></Card>)}</TabsContent><TabsContent value="analytics" className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><Card><CardHeader><CardTitle>Document Categories</CardTitle></CardHeader><CardContent><div className="space-y-3">{Object.entries(stats.categories).map(([category, count]) => (<div key={category} className="flex items-center justify-between"><span className="text-sm">{category}</span><div className="flex items-center gap-2"><div className="w-20 bg-gray-200 rounded-full h-2"><div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(count / stats.processedDocuments) * 100}%` }} /></div><span className="text-sm font-medium">{count}</span></div></div>))}</div></CardContent></Card><Card><CardHeader><CardTitle>Processing Statistics</CardTitle></CardHeader><CardContent className="space-y-4"><div className="flex justify-between"><span>Total Documents</span><span className="font-medium">{stats.totalDocuments}</span></div><div className="flex justify-between"><span>Successfully Processed</span><span className="font-medium">{stats.processedDocuments}</span></div><div className="flex justify-between"><span>Average Confidence</span><span className="font-medium">{Math.round(stats.averageConfidence)}%</span></div><div className="flex justify-between"><span>Total Processing Time</span><span className="font-medium">{stats.processingTime.toFixed(1)}s</span></div><div className="flex justify-between"><span>Success Rate</span><span className="font-medium">{stats.totalDocuments > 0
                      ? Math.round((stats.processedDocuments / stats.totalDocuments) * 100)
                      : 0}
                    %</span></div></CardContent></Card></div><Card><CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader><CardContent><div className="space-y-3">{documents
                  .slice(-10)
                  .reverse()
                  .map(doc => (<div
                      key={doc.id}
                      className="flex items-center gap-3 py-2 border-b last:border-0"
                    >{getStatusIcon(doc.status)}<div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{doc.name}</p><p className="text-xs text-muted-foreground">{doc.status === 'completed'
                            ? 'Classified as ' + doc.classification?.category
                            : doc.status === 'processing'
                              ? 'Processing...'
                              : doc.status === 'failed'
                                ? 'Failed to process'
                                : 'Waiting to process'}</p></div><span className="text-xs text-muted-foreground">{doc.uploadedAt.toLocaleTimeString()}</span></div>))}</div></CardContent></Card></TabsContent></Tabs></div>
  );
}
