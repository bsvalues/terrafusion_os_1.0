import { useState, useCallback, useRef } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { DocumentConfidenceIndicator } from './document-confidence-indicator';
import { cn } from '@/lib/utils';
import { AlertCircle, File, FileCheck, X, UploadCloud, Refresh, Tag, Link } from '@mui/icons-material';

interface BatchDocumentProcessorProps {
  onClose?: () => void;
}

type FileStatus = 'queued' | 'processing' | 'completed' | 'failed';

interface ProcessingFile {
  file: File;
  status: FileStatus;
  id: string;
  error?: string;
  documentType?: string;
  documentTypeLabel?: string;
  confidence?: number;
  tags?: string[];
  parcelIds?: string[];
}

export function BatchDocumentProcessor({ onClose }: BatchDocumentProcessorProps) {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(-1);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [showTagOptions, setShowTagOptions] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [autoClassify, setAutoClassify] = useState(true);
  const [autoParcelLink, setAutoParcelLink] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();

  // Mock document classification function
  const classifyDocument = useCallback(async (file: File): Promise<{
    documentType: string;
    documentTypeLabel: string;
    confidence: number;
    tags: string[];
    parcelIds: string[];
  }> => {
    // Simulate API processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Mock classification based on filename
    const filename = file.name.toLowerCase();
    
    if (filename.includes('deed')) {
      return {
        documentType: 'deed',
        documentTypeLabel: 'Property Deed',
        confidence: 0.92 + Math.random() * 0.08,
        tags: ['property_transfer', 'legal_document'],
        parcelIds: [`P${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`]
      };
    } else if (filename.includes('survey')) {
      return {
        documentType: 'survey',
        documentTypeLabel: 'Land Survey',
        confidence: 0.88 + Math.random() * 0.12,
        tags: ['boundary', 'survey', 'measurement'],
        parcelIds: [`P${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`]
      };
    } else if (filename.includes('permit')) {
      return {
        documentType: 'permit',
        documentTypeLabel: 'Building Permit',
        confidence: 0.85 + Math.random() * 0.15,
        tags: ['construction', 'permit', 'building'],
        parcelIds: [`P${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`]
      };
    } else if (filename.includes('easement')) {
      return {
        documentType: 'easement',
        documentTypeLabel: 'Easement Agreement',
        confidence: 0.90 + Math.random() * 0.10,
        tags: ['easement', 'rights', 'access'],
        parcelIds: [`P${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`]
      };
    } else {
      return {
        documentType: 'unknown',
        documentTypeLabel: 'Unknown Document',
        confidence: 0.45 + Math.random() * 0.3,
        tags: ['unclassified'],
        parcelIds: []
      };
    }
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles: ProcessingFile[] = selectedFiles.map(file => ({
      file,
      status: 'queued' as FileStatus,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
    
    if (event.target) {
      event.target.value = '';
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const newFiles: ProcessingFile[] = droppedFiles.map(file => ({
      file,
      status: 'queued' as FileStatus,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }));
    
    setFiles(prevFiles => [...prevFiles, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const processFiles = useCallback(async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setProcessingIndex(0);
    
    try {
      for (let i = 0; i < files.length; i++) {
        if (files[i].status !== 'queued') continue;
        
        setProcessingIndex(i);
        
        // Update file status to processing
        setFiles(prevFiles => 
          prevFiles.map((f, idx) => 
            idx === i ? { ...f, status: 'processing' as FileStatus } : f
          )
        );
        
        try {
          let classification = null;
          
          if (autoClassify) {
            classification = await classifyDocument(files[i].file);
          }
          
          // Simulate upload/save process
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Update file status to completed
          setFiles(prevFiles => 
            prevFiles.map((f, idx) => 
              idx === i ? { 
                ...f, 
                status: 'completed' as FileStatus,
                ...classification
              } : f
            )
          );
          
        } catch (error) {
          // Update file status to failed
          setFiles(prevFiles => 
            prevFiles.map((f, idx) => 
              idx === i ? { 
                ...f, 
                status: 'failed' as FileStatus,
                error: error instanceof Error ? error.message : 'Processing failed'
              } : f
            )
          );
        }
      }
      
      toast({
        title: "Processing Complete",
        description: `Successfully processed ${files.filter(f => f.status === 'completed').length} documents.`
      });
      
    } catch (error) {
      toast({
        title: "Processing Error",
        description: "An error occurred during batch processing.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProcessingIndex(-1);
    }
  }, [files, autoClassify, classifyDocument, toast]);

  const removeFile = useCallback((fileId: string) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
    setSelectedFileIds(prevSelected => prevSelected.filter(id => id !== fileId));
  }, []);

  const retryFile = useCallback(async (fileId: string) => {
    const fileToRetry = files.find(f => f.id === fileId);
    if (!fileToRetry) return;
    
    setFiles(prevFiles => 
      prevFiles.map(f => 
        f.id === fileId ? { ...f, status: 'processing' as FileStatus, error: undefined } : f
      )
    );
    
    try {
      let classification = null;
      
      if (autoClassify) {
        classification = await classifyDocument(fileToRetry.file);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: 'completed' as FileStatus,
            error: undefined,
            ...classification
          } : f
        )
      );
      
      toast({
        title: "Retry Successful",
        description: "Document processed successfully."
      });
      
    } catch (error) {
      setFiles(prevFiles => 
        prevFiles.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: 'failed' as FileStatus,
            error: error instanceof Error ? error.message : 'Processing failed'
          } : f
        )
      );
      
      toast({
        title: "Retry Failed",
        description: "Failed to process document.",
        variant: "destructive"
      });
    }
  }, [files, autoClassify, classifyDocument, toast]);

  const clearCompleted = useCallback(() => {
    setFiles(prevFiles => prevFiles.filter(f => f.status !== 'completed'));
    setSelectedFileIds([]);
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setSelectedFileIds([]);
  }, []);

  const handleFileSelection = useCallback((fileId: string, selected: boolean) => {
    setSelectedFileIds(prevSelected => {
      if (selected) {
        return [...prevSelected, fileId];
      } else {
        return prevSelected.filter(id => id !== fileId);
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedFileIds(files.map(f => f.id));
  }, [files]);

  const deselectAll = useCallback(() => {
    setSelectedFileIds([]);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: FileStatus) => {
    switch (status) {
      case 'queued': return 'bg-gray-100 text-gray-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'queued': return File;
      case 'processing': return UploadCloud;
      case 'completed': return FileCheck;
      case 'failed': return AlertCircle;
      default: return File;
    }
  };

  const completedCount = files.filter(f => f.status === 'completed').length;
  const failedCount = files.filter(f => f.status === 'failed').length;
  const processingProgress = files.length > 0 ? (completedCount + failedCount) / files.length * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Options</CardTitle>
          <CardDescription>
            Configure how documents should be processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="auto-classify" 
              checked={autoClassify}
              onCheckedChange={setAutoClassify}
            />
            <Label htmlFor="auto-classify">
              Automatically classify documents using AI
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="auto-parcel-link" 
              checked={autoParcelLink}
              onCheckedChange={setAutoParcelLink}
            />
            <Label htmlFor="auto-parcel-link">
              Automatically link documents to parcels
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Select multiple files or drag and drop them here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <UploadCloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600 mb-2">
              Drag files here or click to browse
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Supports PDF, DOCX, TXT, and image files
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Select Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.tiff"
              onChange={handleFileSelect}
            />
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Document Queue</CardTitle>
                <CardDescription>
                  {files.length} documents ready for processing
                </CardDescription>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectedFileIds.length === files.length ? deselectAll : selectAll}
                >
                  {selectedFileIds.length === files.length ? 'Deselect All' : 'Select All'}
                </Button>
                
                {completedCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCompleted}
                  >
                    Clear Completed
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAll}
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing documents...</span>
                  <span>{completedCount + failedCount}/{files.length}</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {files.map((file, index) => {
                const StatusIcon = getStatusIcon(file.status);
                const isCurrentlyProcessing = isProcessing && index === processingIndex;
                
                return (
                  <div
                    key={file.id}
                    className={cn(
                      "flex items-center space-x-3 p-3 border rounded-lg",
                      isCurrentlyProcessing && "border-blue-300 bg-blue-50",
                      file.status === 'completed' && "border-green-300 bg-green-50",
                      file.status === 'failed' && "border-red-300 bg-red-50"
                    )}
                  >
                    <Checkbox
                      checked={selectedFileIds.includes(file.id)}
                      onCheckedChange={(checked) => handleFileSelection(file.id, !!checked)}
                    />
                    
                    <StatusIcon className="h-5 w-5 flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{file.file.name}</p>
                        <Badge className={getStatusColor(file.status)}>
                          {file.status}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatFileSize(file.file.size)}</span>
                        {file.documentTypeLabel && (
                          <span className="text-blue-600">{file.documentTypeLabel}</span>
                        )}
                      </div>
                      
                      {file.confidence && (
                        <DocumentConfidenceIndicator confidence={file.confidence} />
                      )}
                      
                      {file.error && (
                        <p className="text-xs text-red-600 mt-1">{file.error}</p>
                      )}
                      
                      {file.tags && file.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {file.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {file.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{file.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {file.parcelIds && file.parcelIds.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Link className="h-3 w-3" />
                          <div className="flex gap-1">
                            {file.parcelIds.slice(0, 2).map(parcelId => (
                              <Badge key={parcelId} variant="outline" className="text-xs">
                                {parcelId}
                              </Badge>
                            ))}
                            {file.parcelIds.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{file.parcelIds.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      {file.status === 'failed' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryFile(file.id)}
                          disabled={isProcessing}
                        >
                          <Refresh className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        disabled={isProcessing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
          
          <CardFooter>
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500">
                {completedCount} completed, {failedCount} failed, {files.filter(f => f.status === 'queued').length} pending
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                
                <Button
                  onClick={processFiles}
                  disabled={isProcessing || files.filter(f => f.status === 'queued').length === 0}
                >
                  {isProcessing ? 'Processing...' : 'Start Processing'}
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
