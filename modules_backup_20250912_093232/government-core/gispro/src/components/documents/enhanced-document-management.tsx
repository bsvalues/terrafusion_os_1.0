import {useState, useMemo} from 'react';
import {useQuery} from '@tanstack/react-query';
import {motion} from 'framer-motion';
import {Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,} from '@/components/ui/dialog';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,} from '@/components/ui/table';
import {BatchDocumentProcessor} from './batch-document-processor';
import {DocumentVersionControl} from './document-version-control';
import {DocumentParcelManager} from './document-parcel-manager';
import {DocumentClassificationResult} from './document-classification-result';
import {DocumentGridView} from './document-grid-view';
import {IllustratedTooltip} from '@/components/ui/illustrated-tooltip';
import {getDocumentTypeLabel, getDocumentTypeIcon} from '@/lib/document-utils';
import {illustrations} from '@/lib/illustrations';
import {formatDistanceToNow} from 'date-fns';
import {FileText,
  Upload,
  Clock,
  Tag,
  Search,
  Eye,
  History,
  Filter,
  Grid,
  List,
  Calendar,
  User,
  FileCheck,
  Download,
  Paperclip,
  AlertCircle,
  CheckCircle,} from '@mui/icons-material';

interface Document {id: string;
  title: string;
  type: 'deed' | 'easement' | 'survey' | 'permit' | 'legal_description' | 'map' | 'photo';
  size: number;
  uploadedAt: string;
  status: 'processing' | 'completed' | 'error';
  parcelIds?: string[];
  tags: string[];
  version: number;
  classification?: {
    confidence: number;
    aiSuggestions: string[];};
  lastModifiedBy: string;
  path: string;
}

interface EnhancedDocumentManagementProps {className?: string;}

export const EnhancedDocumentManagement = ({className}: EnhancedDocumentManagementProps) => {const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showBatchProcessor, setShowBatchProcessor] = useState(false);
  const [showParcelManager, setShowParcelManager] = useState(false);

  // Mock document data
  const { data: documents = [], isLoading} = useQuery({queryKey: ['documents', searchTerm, selectedType, selectedStatus],
    queryFn: async () =>{
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockDocuments: Document[] = [
        {
          id: '1',
          title: 'Property Deed - 123 Main St',
          type: 'deed',
          size: 2048000,
          uploadedAt: new Date(Date.now() - 86400000).toISOString(),
          status: 'completed',
          parcelIds: ['P001', 'P002'],
          tags: ['residential', 'transfer'],
          version: 1,
          classification: {
            confidence: 0.95,
            aiSuggestions: ['Property Transfer', 'Warranty Deed'],},
          lastModifiedBy: 'John Smith',
          path: '/documents/deeds/deed_123_main_st.pdf',
        },
        {id: '2',
          title: 'Utility Easement Agreement',
          type: 'easement',
          size: 1536000,
          uploadedAt: new Date(Date.now() - 172800000).toISOString(),
          status: 'completed',
          parcelIds: ['P003'],
          tags: ['utility', 'power_line'],
          version: 2,
          classification: {
            confidence: 0.88,
            aiSuggestions: ['Utility Easement', 'Power Line Access'],},
          lastModifiedBy: 'Jane Doe',
          path: '/documents/easements/utility_easement_p003.pdf',
        },
        {id: '3',
          title: 'Boundary Survey - Lot 45',
          type: 'survey',
          size: 8192000,
          uploadedAt: new Date(Date.now() - 259200000).toISOString(),
          status: 'processing',
          parcelIds: ['P045'],
          tags: ['boundary', 'survey'],
          version: 1,
          lastModifiedBy: 'Survey Team',
          path: '/documents/surveys/boundary_survey_lot45.pdf',},
        {id: '4',
          title: 'Building Permit - Commercial',
          type: 'permit',
          size: 3072000,
          uploadedAt: new Date(Date.now() - 345600000).toISOString(),
          status: 'completed',
          parcelIds: ['P012', 'P013'],
          tags: ['commercial', 'construction'],
          version: 1,
          classification: {
            confidence: 0.92,
            aiSuggestions: ['Building Permit', 'Commercial Construction'],},
          lastModifiedBy: 'City Planning',
          path: '/documents/permits/building_permit_commercial.pdf',
        },
        {id: '5',
          title: 'Legal Description - Subdivision',
          type: 'legal_description',
          size: 1024000,
          uploadedAt: new Date(Date.now() - 432000000).toISOString(),
          status: 'error',
          parcelIds: ['P020', 'P021', 'P022'],
          tags: ['subdivision', 'legal'],
          version: 1,
          lastModifiedBy: 'Legal Team',
          path: '/documents/legal/subdivision_description.pdf',},
      ];

      return mockDocuments.filter(doc => {const matchesSearch =
          doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = selectedType === 'all' || doc.type === selectedType;
        const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;

        return matchesSearch && matchesType && matchesStatus;});
    },
  });

  const filteredDocuments = useMemo(() => documents, [documents]);

  const documentStats = useMemo(() => {const total = documents.length;
    const completed = documents.filter(d => d.status === 'completed').length;
    const processing = documents.filter(d => d.status === 'processing').length;
    const errors = documents.filter(d => d.status === 'error').length;

    return { total, completed, processing, errors};
  }, [documents]);

  const handleDocumentClick = (doc: Document) => {setSelectedDocument(doc);};

  const handleCloseDocumentDialog = () => {setSelectedDocument(null);
    setShowVersionHistory(false);};

  const formatFileSize = (bytes: number) => {if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];};

  const getStatusColor = (status: string) => {switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';}
  };

  const getStatusIcon = (status: string) => {switch (status) {
      case 'completed':
        return CheckCircle;
      case 'processing':
        return Clock;
      case 'error':
        return AlertCircle;
      default:
        return FileText;}
  };

  if (isLoading) {return (<div className="flex items-center justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>);}

  return (<div className={`space-y-6 ${className}`}>{/* Header Section */}<div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold tracking-tight">Document Management</h2><p className="text-muted-foreground">Manage and organize your legal documents, surveys, and permits.</p></div><div className="flex gap-2"><IllustratedTooltip
            content={<div className="space-y-2"><p className="font-medium">Batch Processing</p><p className="text-sm">Process multiple documents simultaneously with AI classification.</p></div>}
            illustration={illustrations.analytics}
          ><Button onClick={() => setShowBatchProcessor(true)}><Upload className="h-4 w-4 mr-2" />Batch Upload</Button></IllustratedTooltip><IllustratedTooltip
            content={<div className="space-y-2"><p className="font-medium">Parcel Management</p><p className="text-sm">Link documents to specific parcels for better organization.</p></div>}
            illustration={illustrations.features}
          ><Button variant="outline" onClick={() => setShowParcelManager(true)}><Tag className="h-4 w-4 mr-2" />Manage Parcels</Button></IllustratedTooltip></div></div>{/* Statistics Cards */}<div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Card><CardContent className="p-4"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" /><div><p className="text-sm font-medium">Total Documents</p><p className="text-2xl font-bold">{documentStats.total}</p></div></div></CardContent></Card><Card><CardContent className="p-4"><div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-600" /><div><p className="text-sm font-medium">Completed</p><p className="text-2xl font-bold">{documentStats.completed}</p></div></div></CardContent></Card><Card><CardContent className="p-4"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-yellow-600" /><div><p className="text-sm font-medium">Processing</p><p className="text-2xl font-bold">{documentStats.processing}</p></div></div></CardContent></Card><Card><CardContent className="p-4"><div className="flex items-center gap-2"><AlertCircle className="h-5 w-5 text-red-600" /><div><p className="text-sm font-medium">Errors</p><p className="text-2xl font-bold">{documentStats.errors}</p></div></div></CardContent></Card></div>{/* Filters and Search */}<Card><CardContent className="p-4"><div className="flex flex-col md:flex-row gap-4 items-center"><div className="flex-1"><div className="relative"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" /><input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                /></div></div><div className="flex gap-2"><select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              ><option value="all">All Types</option><option value="deed">Deeds</option><option value="easement">Easements</option><option value="survey">Surveys</option><option value="permit">Permits</option><option value="legal_description">Legal Descriptions</option><option value="map">Maps</option><option value="photo">Photos</option></select><select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              ><option value="all">All Status</option><option value="completed">Completed</option><option value="processing">Processing</option><option value="error">Error</option></select><div className="flex border border-gray-300 rounded-lg"><Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                ><Grid className="h-4 w-4" /></Button><Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-l-none"
                ><List className="h-4 w-4" /></Button></div></div></div></CardContent></Card>{/* Document Display */}
      {viewMode === 'grid' ? (<DocumentGridView
          documents={filteredDocuments}
          onDocumentClick={handleDocumentClick}
          formatFileSize={formatFileSize}
          getStatusColor={getStatusColor}
          getStatusIcon={getStatusIcon} />) : (<Card><CardHeader><CardTitle>Documents</CardTitle><CardDescription>{filteredDocuments.length} documents found</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Size</TableHead><TableHead>Parcels</TableHead><TableHead>Modified</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{filteredDocuments.map(doc => {
                  const StatusIcon = getStatusIcon(doc.status);
                  return (<TableRow key={doc.id} className="cursor-pointer hover:bg-gray-50"><TableCell><div className="flex items-center gap-2"><FileText className="h-4 w-4" /><span className="font-medium">{doc.title}</span></div></TableCell><TableCell><Badge variant="outline">{getDocumentTypeLabel(doc.type)}</Badge></TableCell><TableCell><div className="flex items-center gap-2"><StatusIcon className="h-4 w-4" /><Badge className={getStatusColor(doc.status)}>{doc.status}</Badge></div></TableCell><TableCell>{formatFileSize(doc.size)}</TableCell><TableCell><div className="flex gap-1">{doc.parcelIds?.slice(0, 2).map(parcelId => (<Badge key={parcelId} variant="secondary" className="text-xs">{parcelId}</Badge>))}
                          {doc.parcelIds && doc.parcelIds.length > 2 && (<Badge variant="secondary" className="text-xs">+{doc.parcelIds.length - 2}</Badge>)}</div></TableCell><TableCell><div className="text-sm text-gray-600">{formatDistanceToNow(new Date(doc.uploadedAt), {addSuffix: true})}</div></TableCell><TableCell><div className="flex gap-1"><Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDocumentClick(doc)}
                          ><Eye className="h-4 w-4" /></Button><Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setShowVersionHistory(true);}}
                          ><History className="h-4 w-4" /></Button></div></TableCell></TableRow>);
                })}</TableBody></Table></CardContent></Card>)}

      {/* Document Details Dialog */}<Dialog open={!!selectedDocument} onOpenChange={handleCloseDocumentDialog}><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>{selectedDocument?.title}</DialogTitle><DialogDescription>Document details and classification information</DialogDescription></DialogHeader>{selectedDocument && (<Tabs defaultValue="details" className="w-full"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="classification">Classification</TabsTrigger><TabsTrigger value="version">Version History</TabsTrigger></TabsList><TabsContent value="details" className="space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-3"><div><label className="text-sm font-medium text-gray-600">Document Type</label><p className="text-sm">{getDocumentTypeLabel(selectedDocument.type)}</p></div><div><label className="text-sm font-medium text-gray-600">File Size</label><p className="text-sm">{formatFileSize(selectedDocument.size)}</p></div><div><label className="text-sm font-medium text-gray-600">Upload Date</label><p className="text-sm">{formatDistanceToNow(new Date(selectedDocument.uploadedAt), {addSuffix: true,})}</p></div><div><label className="text-sm font-medium text-gray-600">Last Modified By</label><p className="text-sm">{selectedDocument.lastModifiedBy}</p></div></div><div className="space-y-3"><div><label className="text-sm font-medium text-gray-600">Status</label><div className="flex items-center gap-2">{React.createElement(getStatusIcon(selectedDocument.status), {className: 'h-4 w-4',})}<Badge className={getStatusColor(selectedDocument.status)}>{selectedDocument.status}</Badge></div></div><div><label className="text-sm font-medium text-gray-600">Associated Parcels</label><div className="flex gap-1 flex-wrap">{selectedDocument.parcelIds?.map(parcelId => (<Badge key={parcelId} variant="secondary">{parcelId}</Badge>))}</div></div><div><label className="text-sm font-medium text-gray-600">Tags</label><div className="flex gap-1 flex-wrap">{selectedDocument.tags.map(tag => (<Badge key={tag} variant="outline">{tag}</Badge>))}</div></div><div><label className="text-sm font-medium text-gray-600">File Path</label><p className="text-sm font-mono bg-gray-100 p-2 rounded">{selectedDocument.path}</p></div></div></div><div className="flex gap-2 pt-4 border-t"><Button><Download className="h-4 w-4 mr-2" />Download</Button><Button variant="outline"><Paperclip className="h-4 w-4 mr-2" />Link to Parcel</Button><Button variant="outline"><Tag className="h-4 w-4 mr-2" />Add Tags</Button></div></TabsContent><TabsContent value="classification">{selectedDocument.classification ? (<DocumentClassificationResult
                    document={selectedDocument}
                    classification={selectedDocument.classification} />) : (<div className="text-center py-8 text-gray-500"><FileCheck className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No classification data available for this document.</p></div>)}</TabsContent><TabsContent value="version"><DocumentVersionControl documentId={selectedDocument.id} /></TabsContent></Tabs>)}</DialogContent></Dialog>{/* Batch Processor Dialog */}<Dialog open={showBatchProcessor} onOpenChange={setShowBatchProcessor}><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Batch Document Processing</DialogTitle><DialogDescription>Upload and process multiple documents with AI classification</DialogDescription></DialogHeader><BatchDocumentProcessor onClose={() => setShowBatchProcessor(false)} /></DialogContent></Dialog>{/* Parcel Manager Dialog */}<Dialog open={showParcelManager} onOpenChange={setShowParcelManager}><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Document-Parcel Management</DialogTitle><DialogDescription>Link documents to specific parcels for better organization</DialogDescription></DialogHeader><DocumentParcelManager onClose={() => setShowParcelManager(false)} /></DialogContent></Dialog></div>
  );
};
