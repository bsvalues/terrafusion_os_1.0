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
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/versions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}`] });
      setShowNewVersionDialog(false);
      setVersionNotes('');
      setSelectedFile(null);
      toast({
        title: "Version Created",
        description: "New document version has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create new version. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Revert to version mutation
  const revertMutation = useMutation({
    mutationFn: async (versionId: number) => {
      const res = await apiRequest(
        'POST',
        `/api/documents/${document.id}/revert/${versionId}`
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/versions`] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}`] });
      setIsRevertDialogOpen(false);
      setSelectedVersion(null);
      toast({
        title: "Document Reverted",
        description: "Document has been reverted to the selected version.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to revert document. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete version mutation
  const deleteVersionMutation = useMutation({
    mutationFn: async (versionId: number) => {
      const res = await apiRequest(
        'DELETE',
        `/api/documents/${document.id}/versions/${versionId}`
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/versions`] });
      toast({
        title: "Version Deleted",
        description: "Document version has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete version. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedFile) return;

    try {
      const content = await selectedFile.text();
      createVersionMutation.mutate({
        documentId: document.id,
        content,
        notes: versionNotes,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read file content. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRevert = () => {
    if (!selectedVersion) return;
    revertMutation.mutate(selectedVersion.id);
  };

  const handleDeleteVersion = (versionId: number) => {
    deleteVersionMutation.mutate(versionId);
  };

  const toggleCompareVersion = (version: DocumentVersion) => {
    setCompareVersions(prev => {
      const exists = prev.find(v => v.id === version.id);
      if (exists) {
        return prev.filter(v => v.id !== version.id);
      } else if (prev.length < 2) {
        return [...prev, version];
      } else {
        return [prev[1], version];
      }
    });
  };

  const getVersionStatusBadge = (version: DocumentVersion) => {
    if (version.isCurrent) {
      return <Badge variant="default">Current</Badge>;
    }
    if (version.status === 'draft') {
      return <Badge variant="secondary">Draft</Badge>;
    }
    if (version.status === 'published') {
      return <Badge variant="outline">Published</Badge>;
    }
    if (version.status === 'archived') {
      return <Badge variant="destructive">Archived</Badge>;
    }
    return null;
  };

  const calculateVersionDiff = (version1: DocumentVersion, version2: DocumentVersion) => {
    // Simple character-based diff calculation
    const content1 = version1.content || '';
    const content2 = version2.content || '';
    
    let changes = 0;
    const maxLength = Math.max(content1.length, content2.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (content1[i] !== content2[i]) {
        changes++;
      }
    }
    
    return {
      additions: content2.length - content1.length,
      deletions: content1.length - content2.length,
      changes: changes
    };
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            <span className="ml-2">Loading versions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <Warning className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load document versions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Version History
        </CardTitle>
        <CardDescription>
          Manage and track all versions of this document
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <Dialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  New Version
                </Button>
              </DialogTrigger>
            </Dialog>
            
            {compareVersions.length === 2 && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setIsComparing(!isComparing)}
              >
                <GitCompare className="h-4 w-4 mr-1" />
                {isComparing ? 'Hide Comparison' : 'Compare Versions'}
              </Button>
            )}
            
            {selectedVersion && !selectedVersion.isCurrent && (
              <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Revert to This Version
                  </Button>
                </AlertDialogTrigger>
              </AlertDialog>
            )}
          </div>

          {/* Version comparison view */}
          {isComparing && compareVersions.length === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Version Comparison</CardTitle>
                <CardDescription>
                  Comparing version {compareVersions[0].versionNumber} with version {compareVersions[1].versionNumber}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const diff = calculateVersionDiff(compareVersions[0], compareVersions[1]);
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">
                          Version {compareVersions[0].versionNumber}
                        </h4>
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded border text-sm">
                          <pre className="whitespace-pre-wrap">
                            {compareVersions[0].content?.substring(0, 500)}
                            {(compareVersions[0].content?.length || 0) > 500 && '...'}
                          </pre>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">
                          Version {compareVersions[1].versionNumber}
                        </h4>
                        <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded border text-sm">
                          <pre className="whitespace-pre-wrap">
                            {compareVersions[1].content?.substring(0, 500)}
                            {(compareVersions[1].content?.length || 0) > 500 && '...'}
                          </pre>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <div className="flex gap-4 text-sm">
                          <span className="text-green-600">
                            +{Math.max(0, diff.additions)} additions
                          </span>
                          <span className="text-red-600">
                            -{Math.max(0, -diff.deletions)} deletions
                          </span>
                          <span className="text-blue-600">
                            {diff.changes} changes
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Versions list */}
          <Tabs defaultValue="list">
            <TabsList className="mb-4">
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="timeline">Timeline View</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="space-y-3">
              {sortedVersions.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                  <p className="text-slate-500 dark:text-slate-400">No versions found</p>
                </div>
              ) : (
                sortedVersions.map((version) => (
                  <div key={version.id} className="border rounded-md p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={compareVersions.some(v => v.id === version.id)}
                          onCheckedChange={() => toggleCompareVersion(version)}
                          disabled={compareVersions.length >= 2 && !compareVersions.some(v => v.id === version.id)}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">Version {version.versionNumber}</h4>
                            {getVersionStatusBadge(version)}
                          </div>
                          <div className="mt-4 text-sm">
                            <p className="text-slate-600 dark:text-slate-400">
                              Created by {version.createdBy} • {formatDistanceToNow(new Date(version.createdAt))} ago
                            </p>
                            {version.notes && (
                              <p className="mt-2 text-slate-800 dark:text-slate-200">{version.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedVersion(version)}
                        >
                          View
                        </Button>
                        {!version.isCurrent && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteVersion(version.id)}
                            disabled={deleteVersionMutation.isPending}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="timeline" className="space-y-4">
              <div className="relative">
                {sortedVersions.map((version, index) => (
                  <div key={version.id} className="relative flex items-start gap-4 pb-8">
                    <div className="flex-shrink-0">
                      <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-slate-900" />
                      {index < sortedVersions.length - 1 && (
                        <div className="w-0.5 h-8 bg-slate-200 dark:bg-slate-700 mx-auto mt-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Collapsible>
                        <CollapsibleTrigger className="flex items-center justify-between w-full text-left p-3 border rounded-md hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <div>
                            <h4 className="font-medium">Version {version.versionNumber}</h4>
                            <div className="mb-2 text-sm">
                              <p className="text-slate-600 dark:text-slate-400">
                                {formatDistanceToNow(new Date(version.createdAt))} ago by {version.createdBy}
                              </p>
                            </div>
                          </div>
                          <ChevronDown className="h-4 w-4" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="p-3 border rounded-md bg-slate-50 dark:bg-slate-900">
                            {version.notes && (
                              <div className="mb-3">
                                <h5 className="font-medium text-sm mb-1">Version Notes:</h5>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{version.notes}</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline">
                                View Content
                              </Button>
                              {!version.isCurrent && (
                                <Button size="sm" variant="outline">
                                  Revert to This
                                </Button>
                              )}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      
      {/* Version details dialog */}
      {selectedVersion && (
        <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Version {selectedVersion.versionNumber} Details</DialogTitle>
              <DialogDescription>
                Created {formatDistanceToNow(new Date(selectedVersion.createdAt))} ago by {selectedVersion.createdBy}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {selectedVersion.notes && (
                <div>
                  <Label className="text-sm font-medium">Version Notes</Label>
                  <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                    {selectedVersion.notes}
                  </p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium">Content</Label>
                <div className="mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded border max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
                    {selectedVersion.content}
                  </pre>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Version Information</Label>
                <div className="mt-1 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Version:</span> {selectedVersion.versionNumber}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {selectedVersion.status}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {selectedVersion.content?.length || 0} characters
                  </div>
                  <div>
                    <span className="font-medium">Current:</span> {selectedVersion.isCurrent ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedVersion(null)}>
                  Close
                </Button>
                {!selectedVersion.isCurrent && (
                  <Button onClick={() => setIsRevertDialogOpen(true)}>
                    Revert to This Version
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* New version dialog */}
      <Dialog open={showNewVersionDialog} onOpenChange={setShowNewVersionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Upload a new version of this document
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="version-file">Document File</Label>
              <div className="mt-1">
                <Input
                  id="version-file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".txt,.md,.doc,.docx,.pdf"
                />
              </div>
              {selectedFile && (
                <div className="mt-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <div className="flex items-center gap-2">
                    <FileCheck className="h-8 w-8 mx-auto text-green-500 mb-2" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!selectedFile && (
                <div className="mt-2 p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded text-center">
                  <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Choose a file to upload
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                    Supported formats: TXT, MD, DOC, DOCX, PDF
                  </p>
                </div>
              )}
            </div>
            
            <div>
              <Label htmlFor="version-notes">Version Notes (Optional)</Label>
              <Textarea
                id="version-notes"
                placeholder="Describe the changes in this version..."
                value={versionNotes}
                onChange={(e) => setVersionNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewVersionDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateVersion}
              disabled={!selectedFile || createVersionMutation.isPending}
            >
              {createVersionMutation.isPending ? 'Creating...' : 'Create Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revert confirmation dialog */}
      <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revert this document to version {selectedVersion?.versionNumber}? 
              This will create a new version with the content from the selected version.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevert} disabled={revertMutation.isPending}>
              {revertMutation.isPending ? 'Reverting...' : 'Revert'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default DocumentVersionControl;
