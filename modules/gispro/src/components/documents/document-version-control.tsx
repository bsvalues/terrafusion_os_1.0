import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Clock, 
  FileText, 
  History, 
  Upload, 
  RotateCcw, 
  GitCompare, 
  Plus,
  FileCheck,
  Warning,
  ChevronDown,
  ChevronUp
 } from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Document, DocumentVersion } from '@shared/schema';

interface DocumentVersionControlProps {
  document: Document;
}

export function DocumentVersionControl({ document }: DocumentVersionControlProps) {
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [compareVersions, setCompareVersions] = useState<DocumentVersion[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [showNewVersionDialog, setShowNewVersionDialog] = useState(false);
  const [versionNotes, setVersionNotes] = useState('');
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  // Fetch document versions
  const { 
    data: versions = [], 
    isLoading,
    error 
  } = useQuery({
    queryKey: [`/api/documents/${document.id}/versions`],
    enabled: !!document.id,
  });
  
  // Sort versions by version number in descending order
  const sortedVersions = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);
  
  // Create new version mutation
  const createVersionMutation = useMutation({
    mutationFn: async ({
      documentId,
      content,
      notes
    }: {
      documentId: number;
      content: string;
      notes?: string;
    }) => {
      const res = await apiRequest(
        'POST',
        `/api/documents/${documentId}/versions`,
        { content, notes }
      );
      return res.json();
    },
    onSuccess: () => {
      // Clear form
      setSelectedFile(null);
      setVersionNotes('');
      setShowNewVersionDialog(false);
      
      // Refresh versions
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/versions`] });
      
      // Show success toast
      toast({
        title: 'Version Created',
        description: 'New document version was successfully created'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Creating Version',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  // Revert to version mutation
  const revertToVersionMutation = useMutation({
    mutationFn: async ({
      documentId,
      versionId
    }: {
      documentId: number;
      versionId: number;
    }) => {
      const res = await apiRequest(
        'POST',
        `/api/documents/${documentId}/revert`,
        { versionId }
      );
      return res.json();
    },
    onSuccess: () => {
      // Close dialog
      setIsRevertDialogOpen(false);
      
      // Refresh versions
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/versions`] });
      
      // Refresh document
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}`] });
      
      // Show success toast
      toast({
        title: 'Document Reverted',
        description: 'Successfully reverted to previous version'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Reverting Document',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleCreateVersion = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file to upload',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      // Read file as base64
      const base64Content = await readFileAsBase64(selectedFile);
      
      // Create new version
      await createVersionMutation.mutateAsync({
        documentId: document.id,
        content: base64Content,
        notes: versionNotes
      });
    } catch (error) {
      toast({
        title: 'Upload Error',
        description: error instanceof Error ? error.message : 'Failed to read file',
        variant: 'destructive'
      });
    }
  };
  
  const handleRevert = () => {
    if (!selectedVersion) return;
    
    revertToVersionMutation.mutate({
      documentId: document.id,
      versionId: selectedVersion.id
    });
  };
  
  const toggleVersionSelection = (version: DocumentVersion) => {
    // If already selected, remove from selection
    if (compareVersions.some(v => v.id === version.id)) {
      setCompareVersions(prev => prev.filter(v => v.id !== version.id));
    } 
    // Otherwise add to selection (max 2)
    else if (compareVersions.length < 2) {
      setCompareVersions(prev => [...prev, version]);
    }
  };
  
  const startComparing = () => {
    if (compareVersions.length !== 2) return;
    setIsComparing(true);
  };
  
  const stopComparing = () => {
    setIsComparing(false);
    setCompareVersions([]);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-500">
            <Warning className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading document versions</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><>

          <History className="h-5 w-5 text-primary" />
          Version History
        </CardTitle>
        <CardDescription
</>
</>>
          Track and manage document changes over time
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Version control actions */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowNewVersionDialog(true)}
            className="flex-grow sm:flex-grow-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Version
          </Button>
          
          {compareVersions.length > 0 ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={startComparing}
              disabled={compareVersions.length !== 2}
              className="flex-grow sm:flex-grow-0"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              Compare Selected ({compareVersions.length}/2)
            </Button>
          ) : null}
          
          {isComparing && (
            <Button
              variant="outline"
              size="sm"
              onClick={stopComparing}
              className="flex-grow sm:flex-grow-0"
            >
              Cancel Comparison
            </Button>
          )}
        </div>
        
        {/* Version comparison view */}
        {isComparing && compareVersions.length === 2 && (
          <Card className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Version Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="side-by-side">
                <TabsList className="mb-4"><>

                  <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
                  <TabsTrigger
</>
value="unified">Unified View</TabsTrigger>
                </TabsList>
                
                <TabsContent value="side-by-side" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {compareVersions.map((version) => (
                      <div key={version.id} className="border rounded-md p-4"><>

                        <div className="font-medium mb-2">Version {version.versionNumber}</div>
                        <div
</>
className="text-sm text-slate-500 mb-4">
                          Created {formatDistanceToNow(new Date(version.createdAt))} ago
                        </div>
                        
                        {/* Document preview would go here */}
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-4 h-40 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-slate-400" />
                        </div>
                        
                        {version.notes && (
                          <div className="mt-4 text-sm"><>

                            <div className="font-medium">Notes:</div>
                            <p
</>
className="text-slate-600 dark:text-slate-400">{version.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="unified" className="space-y-4">
                  <div className="border rounded-md p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div><>

                        <span className="text-green-600 dark:text-green-400 font-medium">
                          Version {compareVersions[0].versionNumber}
                        </span>
                        <span
</>
className="mx-2">→</span>
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          Version {compareVersions[1].versionNumber}
                        </span>
                      </div>
                      <Badge variant="outline">Unified View</Badge>
                    </div>
                    
                    {/* Unified diff view would go here */}
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-md p-4 h-60 overflow-auto">
                      <p className="text-center text-slate-500 my-8">
                        Document comparison would be displayed here
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
        
        {/* Version list */}
        {!isComparing && sortedVersions.length > 0 ? (
          <div className="space-y-3">
            {sortedVersions.map((version) => (
              <Collapsible key={version.id}>
                <div className="flex items-center gap-2 border rounded-md p-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                  <div className="flex-shrink-0"><>

                    <Checkbox
                      checked={compareVersions.some(v => v.id === version.id)}
                      onCheckedChange={() => toggleVersionSelection(version)}
                      id={`compare-${version.id}`}
                      aria-label={`Compare Version ${version.versionNumber}`}
                    />
                  </div>
                  
                  <FileText
</>
className="h-5 w-5 text-slate-400 flex-shrink-0" />
                  
                  <div 
                    className="flex-grow cursor-pointer"
                    onClick={() => setSelectedVersion(version)}
                  ><>

                    <div className="font-medium">Version {version.versionNumber}</div>
                    <div
</>
className="text-xs text-slate-500">
                      {formatDistanceToNow(new Date(version.createdAt))} ago
                    </div>
                  </div>
                  
                  <CollapsibleTrigger className="flex-shrink-0">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
                
                <CollapsibleContent>
                  <div className="border-x border-b rounded-b-md p-3 bg-slate-50 dark:bg-slate-900 mt-[-1px]">
                    {version.notes ? (
                      <div className="mb-2 text-sm"><>

                        <div className="font-medium mb-1">Notes:</div>
                        <p
</>
className="text-slate-600 dark:text-slate-400">
                          {version.notes}
                        </p>
                      </div>
                    ) : (
                      <div className="mb-2 text-sm text-slate-500">
                        No notes for this version
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => {
                          setSelectedVersion(version);
                          setIsRevertDialogOpen(true);
                        }}
                      ><>

                        <RotateCcw className="h-3 w-3 mr-1" />
                        Revert to This Version
                      </Button>
                      
                      <Button
</>

                        variant="ghost" 
                        size="sm"
                        className="text-xs h-7"
                      >
                        <FileCheck className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        ) : !isComparing ? (
          <div className="text-center py-6">
            <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" /><>

            <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-1">
              No Versions Found
            </h3>
            <p
</>
className="text-sm text-slate-500 dark:text-slate-400">
              This document doesn't have any version history yet
            </p>
          </div>
        ) : null}
        
        {/* Version details dialog */}
        <Dialog 
          open={selectedVersion !== null && !isRevertDialogOpen} 
          onOpenChange={(open) => !open && setSelectedVersion(null)}
        >
          <DialogContent>
            <DialogHeader><>

              <DialogTitle>Version Details</DialogTitle>
              <DialogDescription
</>
</>>
                Information about document version {selectedVersion?.versionNumber}
              </DialogDescription>
            </DialogHeader>
            
            {selectedVersion && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><>

                    <div className="text-sm font-medium mb-1">Version</div>
                    <div
</>
className="text-xl font-semibold">{selectedVersion.versionNumber}</div>
                  </div>
                  
                  <div><>

                    <div className="text-sm font-medium mb-1">Created</div>
                    <div
</>
className="flex items-center text-slate-600 dark:text-slate-400">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatDistanceToNow(new Date(selectedVersion.createdAt))} ago
                    </div>
                  </div>
                </div>
                
                <div><>

                  <div className="text-sm font-medium mb-1">Hash</div>
                  <div
</>
className="text-xs font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded overflow-x-auto">
                    {selectedVersion.contentHash}
                  </div>
                </div>
                
                {selectedVersion.notes && (
                  <div><>

                    <div className="text-sm font-medium mb-1">Notes</div>
                    <div
</>
className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-slate-800 dark:text-slate-200">
                      {selectedVersion.notes}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2"><>

                  <Button 
                    variant="outline"
                    onClick={() => setSelectedVersion(null)}
                  >
                    Close
                  </Button>
                  <Button
</>

                    variant="default"
                    onClick={() => {
                      setIsRevertDialogOpen(true);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Revert to This Version
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* New Version Dialog */}
        <Dialog
          open={showNewVersionDialog}
          onOpenChange={setShowNewVersionDialog}
        >
          <DialogContent>
            <DialogHeader><>

              <DialogTitle>Create New Version</DialogTitle>
              <DialogDescription
</>
</>>
                Upload a new version of this document with changes
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div><>

                <Label htmlFor="file-upload">Upload new version</Label>
                <div
</>

                  className="border-2 border-dashed rounded-md p-6 mt-2 text-center cursor-pointer hover:border-primary"
                  onClick={handleBrowseClick}
                >
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    aria-label="Upload new version"
                  />
                  
                  {selectedFile ? (
                    <div>
                      <FileCheck className="h-8 w-8 mx-auto text-green-500 mb-2" /><>

                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p
</>
className="text-xs text-slate-500 mt-1">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" /><>

                      <p className="text-sm font-medium">Click to upload a file</p>
                      <p
</>
className="text-xs text-slate-500 mt-1">
                        PDF, Word, Excel, or image files
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div><>

                <Label htmlFor="version-notes">Version notes</Label>
                <Textarea
</>

                  id="version-notes"
                  placeholder="Describe what changed in this version"
                  value={versionNotes}
                  onChange={(e) => setVersionNotes(e.target.value)}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </div>
            
            <DialogFooter><>

              <Button
                variant="outline"
                onClick={() => {
                  setSelectedFile(null);
                  setVersionNotes('');
                  setShowNewVersionDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button
</>

                onClick={handleCreateVersion}
                disabled={!selectedFile || createVersionMutation.isPending}
              >
                {createVersionMutation.isPending ? 'Saving...' : 'Save New Version'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Revert Confirmation Dialog */}
        <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader><>

              <AlertDialogTitle>Revert Document Version</AlertDialogTitle>
              <AlertDialogDescription
</>
</>>
                This will create a new version that matches the content of version {selectedVersion?.versionNumber}.
                The current version will remain in the version history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter><>

              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
</>
onClick={handleRevert}>
                Confirm
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// Helper function to read a file as base64
async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error('Failed to read file'));
        return;
      }
      
      // Convert to base64 string, removing the data URL prefix
      const base64 = event.target.result.toString().split(',')[1];
      resolve(base64);
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsDataURL(file);
  });
}