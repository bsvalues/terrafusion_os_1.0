import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BatchDocumentProcessor } from './batch-document-processor';
import { DocumentVersionControl } from './document-version-control';
import { DocumentParcelManager } from './document-parcel-manager';
import { DocumentClassificationResult } from './document-classification-result';
import { DocumentGridView } from './document-grid-view';
import { IllustratedTooltip } from '@/components/ui/illustrated-tooltip';
import { getDocumentTypeLabel, getDocumentTypeIcon } from '@/lib/document-utils';
import { illustrations } from '@/lib/illustrations';
import { formatDistanceToNow } from 'date-fns';
import { FileText, 
  Upload, 
  Clock, 
  Tag, 
  Search, 
  Eye, 
  History, 
  Map, 
  Warning, 
  UploadCloud,
  LayoutGrid,
  List
 } from '@mui/icons-material';
import { Document, Workflow } from '@shared/schema';

// Extended Document type with optional classification
interface DocumentWithClassification extends Document {
  classification?: {
    documentType: string;
    confidence: number;
    wasManuallyClassified: boolean;
    classifiedAt: string;
  };
  updatedAt?: Date;
  contentType?: string;
}

interface EnhancedDocumentManagementProps {
  workflow: Workflow;
}

export function EnhancedDocumentManagement({ workflow }: EnhancedDocumentManagementProps) {
  const [showBatchUploader, setShowBatchUploader] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithClassification | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  
  // Fetch documents for the workflow
  const { 
    data: documents = [] as DocumentWithClassification[],
    isLoading,
    error,
    refetch
  } = useQuery<DocumentWithClassification[]>({
    queryKey: [`/api/workflows/${workflow.id}/documents`],
    enabled: !!workflow.id,
  });
  
  // Filter documents based on search query and document type
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      // Apply search query filter
      const matchesSearch = searchQuery === '' || 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.classification?.documentType || doc.type).toLowerCase().includes(searchQuery.toLowerCase());
      
      // Apply document type filter
      const matchesType = filterType === null || 
        doc.type === filterType || 
        doc.classification?.documentType === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [documents, searchQuery, filterType]);
  
  const handleBatchUploaderComplete = () => {
    setShowBatchUploader(false);
    refetch();
  };
  
  const handleViewDocument = (document: DocumentWithClassification) => {
    setSelectedDocument(document);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <Warning className="h-12 w-12 mx-auto text-red-500 mb-4" /><>

        <h3 className="text-lg font-medium mb-2">Error Loading Documents</h3>
        <p
</> className="text-slate-500">
          There was a problem fetching documents for this workflow
        </p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => refetch()}
        >
          Try Again
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div><>

            <h2 className="text-2xl font-bold tracking-tight mb-1">Document Management</h2>
            <p
</> className="text-muted-foreground">
              Manage documents for {workflow.title}
            </p>
          </div>
          <IllustratedTooltip
            illustration={illustrations.document.general}
            title="Document Management Help"
            content={
              <div><>

                <p className="mb-1">• View and organize documents by type</p>
                <p
</> className="mb-1">• Track document versions with the version history feature</p><>

                <p className="mb-1">• Associate parcels with documents for easy cross-referencing</p>
                <p
</>>• Batch upload multiple documents for automatic classification</p>
              </div>
            }
            position="right"
            iconSize={18}
          />
        </div>
        
        <Button onClick={() => setShowBatchUploader(true)}>
          <UploadCloud className="h-4 w-4 mr-2" />
          Batch Upload
        </Button>
      </div>
      
      {/* Document List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2"><>

              <FileText className="h-5 w-5 text-primary" />
              Workflow Documents
            </CardTitle>
            <CardDescription
</>>
              {filteredDocuments.length} of {documents.length} document{documents.length !== 1 ? 's' : ''} {searchQuery || filterType ? 'matching your filters' : 'in this workflow'}
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-slate-500" /><>

              <input 
                type="text" 
                placeholder="Search documents..." 
                className="h-9 pl-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div
</> className="relative">
              <select
                className="h-9 pl-3 pr-8 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-1 focus:ring-primary focus:border-primary appearance-none"
                value={filterType || ""}
                onChange={(e) => setFilterType(e.target.value === "" ? null : e.target.value)}
              ><>

                <option value="">All Types</option>
                <option
</> value="deed">Deed</option><>

                <option value="plat">Plat</option>
                <option
</> value="survey">Survey</option><>

                <option value="boundary_line_adjustment">Boundary Line Adjustment</option>
                <option
</> value="legal_document">Legal Document</option><>

                <option value="report">Report</option>
                <option
</> value="image">Image</option>
              </select><>

              <Tag className="h-4 w-4 absolute right-2.5 top-2.5 text-slate-500 pointer-events-none" />
            </div>
            
            <motion
</>.div
              className="bg-slate-100 dark:bg-slate-800 rounded-md p-1 flex"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8"
                onClick={() => setViewMode('cards')}
              ><>

                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
</>
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </CardHeader>
        
        <CardContent>
          {documents.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {filteredDocuments.length > 0 ? (
                <>
                  {viewMode === 'table' ? (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow><>

                            <TableHead>Name</TableHead>
                            <TableHead
</>>Type</TableHead><>

                            <TableHead>Uploaded</TableHead>
                            <TableHead
</> className="w-24 text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDocuments.map((document) => (
                            <TableRow key={document.id} className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900"><>

                              <TableCell 
                                className="font-medium"
                                onClick={() => handleViewDocument(document)}
                              >
                                {document.name}
                              </TableCell>
                              <TableCell
</>>
                                <Badge variant="outline" className="capitalize">
                                  {document.type.replace(/_/g, ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center text-sm text-slate-500">
                                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                                  {formatDistanceToNow(new Date(document.uploadedAt))} ago
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8"
                                  onClick={() => handleViewDocument(document)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <DocumentGridView
                      documents={filteredDocuments}
                      onViewDocument={handleViewDocument}
                    />
                  )}
                </>
              ) : (
                <div className="text-center py-12 border rounded-md">
                  <Search className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" /><>

                  <h3 className="text-lg font-medium mb-2">No Matching Documents</h3>
                  <p
</> className="text-slate-500 mb-6">
                    No documents match your search criteria
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterType(null);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-12 border rounded-md">
              <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" /><>

              <h3 className="text-lg font-medium mb-2">No Documents Found</h3>
              <p
</> className="text-slate-500 mb-6">
                This workflow doesn't have any documents yet
              </p>
              <Button onClick={() => setShowBatchUploader(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Batch Document Uploader Dialog */}
      <Dialog 
        open={showBatchUploader} 
        onOpenChange={setShowBatchUploader}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><>

            <DialogTitle>Batch Document Upload</DialogTitle>
            <DialogDescription
</>>
              Upload and classify multiple documents at once
            </DialogDescription>
          </DialogHeader>
          
          <BatchDocumentProcessor 
            workflowId={workflow.id} 
            onComplete={handleBatchUploaderComplete} 
          />
        </DialogContent>
      </Dialog>
      
      {/* Document Detail View */}
      <Dialog 
        open={selectedDocument !== null} 
        onOpenChange={(open) => !open && setSelectedDocument(null)}
      >
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><>

            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription
</>>
              {selectedDocument?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDocument && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="details" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span>Details</span>
                </TabsTrigger>
                <TabsTrigger value="versions" className="flex items-center gap-1">
                  <History className="h-4 w-4" />
                  <span>Version History</span>
                </TabsTrigger>
                <TabsTrigger value="parcels" className="flex items-center gap-1">
                  <Map className="h-4 w-4" />
                  <span>Linked Parcels</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Document Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div><>

                        <h4 className="text-sm font-medium mb-1">Name</h4>
                        <p
</> className="text-slate-800 dark:text-slate-200">
                          {selectedDocument.name}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div><>

                          <h4 className="text-sm font-medium mb-1">Type</h4>
                          <Badge
</> className="capitalize">
                            {getDocumentTypeLabel(selectedDocument.type)}
                          </Badge>
                        </div>
                        
                        <div><>

                          <h4 className="text-sm font-medium mb-1">Content Type</h4>
                          <p
</> className="text-slate-600 dark:text-slate-400 text-sm">
                            {selectedDocument.contentType}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div><>

                          <h4 className="text-sm font-medium mb-1">Uploaded</h4>
                          <p
</> className="text-slate-600 dark:text-slate-400 text-sm">
                            {new Date(selectedDocument.uploadedAt).toLocaleString()}
                          </p>
                        </div>
                        
                        <div><>

                          <h4 className="text-sm font-medium mb-1">Last Updated</h4>
                          <p
</> className="text-slate-600 dark:text-slate-400 text-sm">
                            {selectedDocument.updatedAt 
                              ? new Date(selectedDocument.updatedAt).toLocaleString() 
                              : 'Not updated'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        Classification Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedDocument.classification ? (
                        <DocumentClassificationResult 
                          classification={{
                            documentType: selectedDocument.classification.documentType,
                            confidence: selectedDocument.classification.confidence,
                            documentTypeLabel: getDocumentTypeLabel(selectedDocument.classification.documentType),
                            wasManuallyClassified: selectedDocument.classification.wasManuallyClassified
                          }}
                        />
                      ) : (
                        <div className="text-center py-6">
                          <Tag className="h-10 w-10 mx-auto text-slate-300 dark:text-slate-600 mb-3" /><>

                          <h3 className="text-base font-medium mb-1">Not Classified</h3>
                          <p
</> className="text-sm text-slate-500">
                            This document hasn't been classified yet
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="h-5 w-5 text-primary" />
                      Document Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96 bg-slate-100 dark:bg-slate-800 rounded-md flex items-center justify-center">
                      <FileText className="h-12 w-12 text-slate-400" />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end">
                    <Button variant="outline">
                      Download Document
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="versions"><>

                <DocumentVersionControl document={selectedDocument} />
              </TabsContent>
              
              <TabsContent
</> value="parcels">
                <DocumentParcelManager document={selectedDocument} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}