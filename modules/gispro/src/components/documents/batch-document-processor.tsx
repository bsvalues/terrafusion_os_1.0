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
import { useDocumentClassifier } from '@/hooks/use-document-classifier';
import { DocumentConfidenceIndicator } from './document-confidence-indicator';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { AlertCircle, File, FileCheck, X, UploadCloud, Refresh, Tag, Link  } from '@mui/icons-material';

interface BatchDocumentProcessorProps {
  workflowId: number;
  onComplete?: () => void;
}

type FileStatus = 'queued' | 'processing' | 'completed' | 'failed';

interface ProcessingFile {
  file: File;
  status: FileStatus;
  id?: number;
  error?: string;
  documentType?: string;
  documentTypeLabel?: string;
  confidence?: number;
}

export function BatchDocumentProcessor({ workflowId, onComplete }: BatchDocumentProcessorProps) {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingIndex, setProcessingIndex] = useState(-1);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [showTagOptions, setShowTagOptions] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  const { uploadWithClassification, isUploading } = useDocumentClassifier();
  
  // Calculate processing progress
  const progress = files.length > 0 
    ? Math.round((files.filter(f => f.status === 'completed').length / files.length) * 100)
    : 0;

  // Batch tag mutation
  const batchTagMutation = useMutation({
    mutationFn: async ({ documentIds, tag }: { documentIds: number[]; tag: string }) => {
      const response = await fetch(`/api/documents/batch/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds,
          documentType: tag,
          wasManuallyClassified: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to apply batch tags');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Documents tagged successfully',
        description: `Applied "${selectedTag}" tag to ${selectedDocumentIds.length} documents`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/documents`] });
      setShowTagOptions(false);
      setSelectedDocumentIds([]);
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast({
        title: 'Failed to tag documents',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Batch parcel link mutation
  const batchParcelLinkMutation = useMutation({
    mutationFn: async ({ documentIds, parcelId }: { documentIds: number[]; parcelId: number }) => {
      const response = await fetch(`/api/documents/batch/link-parcel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds,
          parcelId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to link documents to parcel');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Documents linked successfully',
        description: `Linked ${selectedDocumentIds.length} documents to parcel`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/documents`] });
      setSelectedDocumentIds([]);
      if (onComplete) onComplete();
    },
    onError: (error) => {
      toast({
        title: 'Failed to link documents',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });
  
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const selectedFiles = Array.from(event.target.files);
    const newFiles: ProcessingFile[] = selectedFiles.map(file => ({
      file,
      status: 'queued'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);
  
  const handleProcessFiles = useCallback(async () => {
    if (files.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    setProcessingIndex(0);
    
    const updatedFiles = [...files];
    
    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status !== 'queued') continue;
      
      setProcessingIndex(i);
      updatedFiles[i].status = 'processing';
      setFiles([...updatedFiles]);
      
      try {
        const result = await uploadWithClassification({
          file: updatedFiles[i].file,
          workflowId
        });
        
        if (result) {
          updatedFiles[i] = {
            ...updatedFiles[i],
            status: 'completed',
            id: result.id,
            documentType: result.documentType,
            documentTypeLabel: result.documentTypeLabel,
            confidence: result.confidence,
          };
        } else {
          throw new Error('Upload failed with no result');
        }
      } catch (error) {
        updatedFiles[i] = {
          ...updatedFiles[i],
          status: 'failed',
          error: error instanceof Error ? error.message : 'Upload failed'
        };
      }
      
      setFiles([...updatedFiles]);
    }
    
    setIsProcessing(false);
    setProcessingIndex(-1);
    
    // After processing, select all successfully uploaded documents
    const newDocumentIds = updatedFiles
      .filter(f => f.status === 'completed' && f.id !== undefined)
      .map(f => f.id as number);
    
    setSelectedDocumentIds(newDocumentIds);
    
    // Show tagging options if documents were successfully processed
    if (newDocumentIds.length > 0) {
      setShowTagOptions(true);
    }
    
    toast({
      title: 'Batch processing complete',
      description: `Processed ${updatedFiles.length} documents. ${updatedFiles.filter(f => f.status === 'completed').length} succeeded, ${updatedFiles.filter(f => f.status === 'failed').length} failed.`,
    });
    
    // Refresh document list
    queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/documents`] });
    
  }, [files, isProcessing, uploadWithClassification, workflowId, toast]);
  
  const handleRemoveFile = useCallback((index: number) => {
    if (isProcessing) return;
    
    setFiles(prev => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  }, [isProcessing]);
  
  const toggleDocumentSelection = useCallback((id: number | undefined) => {
    if (!id) return;
    
    setSelectedDocumentIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(docId => docId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);
  
  const applyBatchTag = useCallback(() => {
    if (selectedDocumentIds.length === 0 || !selectedTag) return;
    
    batchTagMutation.mutate({
      documentIds: selectedDocumentIds,
      tag: selectedTag
    });
  }, [selectedDocumentIds, selectedTag, batchTagMutation]);
  
  const clearAll = useCallback(() => {
    if (isProcessing) return;
    setFiles([]);
    setSelectedDocumentIds([]);
    setShowTagOptions(false);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [isProcessing]);
  
  // Group documents by type for better organization
  const documentTypes = files
    .filter(f => f.status === 'completed' && f.documentType)
    .reduce<Record<string, number>>((acc, file) => {
      const type = file.documentType as string;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><>

          <UploadCloud className="h-5 w-5 text-primary" />
          Batch Document Processor
        </CardTitle>
        <CardDescription
</>
</>>
          Upload, classify, and tag multiple documents at once
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* File Input */}
        <div className="flex flex-col gap-2"><>

          <Label htmlFor="file-upload" className="font-medium">
            Select files to process
          </Label>
          <div
</>
className="flex items-center gap-2">
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={isProcessing}
              aria-label="Select files"
            />
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            ><>

              <File className="h-4 w-4 mr-2" />
              Select Files
            </Button>
            
            <Button
</>

              onClick={clearAll}
              variant="outline" 
              disabled={isProcessing || files.length === 0}
            >
              Clear All
            </Button>
          </div>
        </div>
        
        {/* File List */}
        {files.length > 0 && (
          <div className="border rounded-md divide-y">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
              <div className="font-medium">
                Files ({files.length})
              </div>
              {!isProcessing && files.some(f => f.status === 'queued') && (
                <Button 
                  size="sm" 
                  onClick={handleProcessFiles}
                >
                  <Refresh className="h-4 w-4 mr-2" />
                  Process Files
                </Button>
              )}
            </div>
            
            {isProcessing && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-2"><>

                  <span className="text-sm">
                    Processing file {processingIndex + 1} of {files.length}...
                  </span>
                  <span
</>
className="text-sm font-medium">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
            
            <div className="max-h-64 overflow-y-auto">
              {files.map((file /* , index */) => (
                <div 
                  key={`${file.file.name}-${index}`}
                  className={cn(
                    "p-3 flex items-center gap-3",
                    processingIndex === index && "bg-blue-50 dark:bg-blue-950/30",
                    file.status === 'completed' && "bg-green-50 dark:bg-green-950/30",
                    file.status === 'failed' && "bg-red-50 dark:bg-red-950/30"
                  )}
                >
                  {file.status === 'completed' && file.id !== undefined && (
                    <Checkbox 
                      id={`select-${file.id}`}
                      checked={selectedDocumentIds.includes(file.id)}
                      onCheckedChange={() => toggleDocumentSelection(file.id)}
                    />
                  )}
                  
                  {file.status === 'queued' && (
                    <div className="h-5 w-5 flex-shrink-0" /> // Placeholder for checkbox
                  )}
                  
                  <div className="flex-1 min-w-0"><>

                    <div className="text-sm font-medium truncate">{file.file.name}</div>
                    <div
</>
className="text-xs text-gray-500">
                      {file.status === 'queued' && 'Queued for processing'}
                      {file.status === 'processing' && 'Processing...'}
                      {file.status === 'completed' && file.documentTypeLabel && (
                        <div className="flex items-center gap-1.5">
                          <span>{file.documentTypeLabel}</span>
                          {file.confidence !== undefined && (
                            <DocumentConfidenceIndicator 
                              confidence={file.confidence} 
                              size="sm" 
                              showPercentage={false}
                            />
                          )}
                        </div>
                      )}
                      {file.status === 'failed' && (
                        <span className="text-red-600 dark:text-red-400">
                          Failed: {file.error || 'Unknown error'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {file.status === 'queued' && (
                      <Badge variant="outline">Queued</Badge>
                    )}
                    {file.status === 'processing' && (
                      <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900">
                        Processing
                      </Badge>
                    )}
                    {file.status === 'completed' && (
                      <Badge variant="outline" className="bg-green-100 dark:bg-green-900">
                        Completed
                      </Badge>
                    )}
                    {file.status === 'failed' && (
                      <Badge variant="outline" className="bg-red-100 dark:bg-red-900">
                        Failed
                      </Badge>
                    )}
                  </div>
                  
                  {file.status !== 'processing' && !isProcessing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFile(index)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Batch Operations */}
        {showTagOptions && selectedDocumentIds.length > 0 && (
          <div className="border rounded-md p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                Batch Operations ({selectedDocumentIds.length} documents selected)
              </h3>
            </div>
            
            {/* Document type summary */}
            {Object.keys(documentTypes).length > 0 && (
              <div className="space-y-2"><>

                <h4 className="text-xs font-medium text-slate-500">Document Types</h4>
                <div
</>
className="flex flex-wrap gap-2">
                  {Object.entries(documentTypes).map(([type, count]) => (
                    <Badge key={type} variant="outline" className="flex items-center gap-1">
                      {type.replace('_', ' ')}
                      <span className="h-4 w-4 rounded-full bg-slate-200 dark:bg-slate-700 text-xs flex items-center justify-center">
                        {count}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              {/* Apply Tags Section */}
              <div className="space-y-2"><>

                <h4 className="text-xs font-medium text-slate-500">Apply Tags</h4>
                <div
</>
className="flex items-center gap-2">
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                  ><>

                    <option value="">Select document type...</option>
                    <option
</>
value="plat_map">Plat Map</option><>

                    <option value="deed">Deed</option>
                    <option
</>
value="survey">Survey</option><>

                    <option value="legal_description">Legal Description</option>
                    <option
</>
value="boundary_line_adjustment">Boundary Line Adjustment</option>
                    <option value="tax_form">Tax Form</option>
                  </select>
                  
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={applyBatchTag}
                    disabled={!selectedTag || batchTagMutation.isPending}
                  >
                    <Tag className="h-4 w-4 mr-2" />
                    Apply Tags
                  </Button>
                </div>
              </div>
              
              {/* Link to Parcel Section - placeholder for next feature phase */}
              <div className="space-y-2"><>

                <h4 className="text-xs font-medium text-slate-500">Link to Parcel</h4>
                <div
</>
className="flex items-center gap-2 opacity-50">
                  <input
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Search for parcel..."
                    disabled
                  />
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Link
                  </Button>
                </div>
                <p className="text-xs text-slate-500">Parcel linking will be available in the next update</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {files.length === 0 && (
          <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center text-center">
            <UploadCloud className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" /><>

            <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-1">No Files Selected</h3>
            <p
</>
className="text-sm text-slate-500 dark:text-slate-400 mb-4 max-w-md">
              Select multiple document files to process them in batch. Supported formats include PDF, JPG, PNG, and TIFF.
            </p>
            <Button 
              variant="outline" 
              onClick={() => fileInputRef.current?.click()}
            >
              Select Files
            </Button>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        <div className="text-sm text-slate-500">
          {files.filter(f => f.status === 'completed').length} of {files.length} files processed
        </div>
        
        {files.length > 0 && !isProcessing && (
          <Button
            variant="secondary"
            onClick={onComplete}
          >
            <FileCheck className="h-4 w-4 mr-2" />
            Done
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}