import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { DocumentParcelLink, Document, InsertDocumentParcelLink } from '@shared/schema';
import { useEnhancedWebSocket } from '@/hooks/use-enhanced-websocket';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { FileText, Link as LinkIcon, MapPin, Search, Plus, Trash2  } from '@mui/icons-material';

interface DocumentParcelLinkerProps {
  roomId: string;
  parcelId?: number;
  documentId?: number;
  showLinkButton?: boolean;
  onLinksChanged?: () => void;
}

/**
 * DocumentParcelLinker Component
 * 
 * This component allows linking documents to parcels in a collaborative environment
 * It broadcasts link changes via WebSocket to all participants in the same room
 */
export function DocumentParcelLinker({
  roomId,
  parcelId,
  documentId,
  showLinkButton = true,
  onLinksChanged
}: DocumentParcelLinkerProps) {
  const { toast } = useToast();
  const [selectedParcelId, setSelectedParcelId] = useState<number | undefined>(parcelId);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | undefined>(documentId);
  const [linkType, setLinkType] = useState<string>('reference');
  const [notes, setNotes] = useState<string>('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Set up WebSocket for collaborative features
  const { send, messages, connectionStatus } = useEnhancedWebSocket({
    roomId,
    autoConnect: true
  });

  // Fetch documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/documents');
      const data = await response.json();
      return data;
    }
  });

  // Fetch parcels
  const { data: parcels, isLoading: isLoadingParcels } = useQuery({
    queryKey: ['/api/parcels'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/parcels');
      const data = await response.json();
      return data;
    }
  });

  // Fetch existing links
  const { data: links, isLoading: isLoadingLinks } = useQuery({
    queryKey: ['/api/document-parcel-links', selectedParcelId, selectedDocumentId],
    queryFn: async () => {
      let url = '/api/document-parcel-links';
      if (selectedParcelId) {
        url += `?parcelId=${selectedParcelId}`;
      } else if (selectedDocumentId) {
        url += `?documentId=${selectedDocumentId}`;
      }
      const response = await apiRequest('GET', url);
      const data = await response.json();
      return data;
    },
    enabled: !!selectedParcelId || !!selectedDocumentId
  });

  // Create link mutation
  const linkMutation = useMutation({
    mutationFn: async (linkData: InsertDocumentParcelLink) => {
      const response = await apiRequest('POST', '/api/document-parcel-links', linkData);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-parcel-links'] });
      
      // Broadcast the new link to room members
      send({
        type: 'document_parcel_link_created',
        roomId,
        payload: {
          link: data
        }
      });
      
      toast({
        title: 'Success',
        description: 'Document-parcel link created successfully',
      });
      
      if (onLinksChanged) {
        onLinksChanged();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create document-parcel link',
        variant: 'destructive'
      });
    }
  });

  // Delete link mutation
  const deleteMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const response = await apiRequest('DELETE', `/api/document-parcel-links/${linkId}`);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/document-parcel-links'] });
      
      // Broadcast the deletion to room members
      send({
        type: 'document_parcel_link_deleted',
        roomId,
        payload: {
          linkId: variables
        }
      });
      
      toast({
        title: 'Success',
        description: 'Document-parcel link deleted successfully',
      });
      
      if (onLinksChanged) {
        onLinksChanged();
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete document-parcel link',
        variant: 'destructive'
      });
    }
  });

  // Update selected parcel ID when prop changes
  useEffect(() => {
    if (parcelId !== undefined) {
      setSelectedParcelId(parcelId);
    }
  }, [parcelId]);
  
  // Update selected document ID when prop changes
  useEffect(() => {
    if (documentId !== undefined) {
      setSelectedDocumentId(documentId);
    }
  }, [documentId]);

  // Listen for WebSocket messages related to document-parcel links
  useEffect(() => {
    if (messages.length > 0) {
      const latest = messages[messages.length - 1];
      
      if (latest.type === 'document_parcel_link_created' || 
          latest.type === 'document_parcel_link_deleted') {
        // Refresh the links data
        queryClient.invalidateQueries({ queryKey: ['/api/document-parcel-links'] });
        
        if (onLinksChanged) {
          onLinksChanged();
        }
      }
    }
  }, [messages, onLinksChanged]);

  // Create a new document-parcel link
  const handleCreateLink = () => {
    if (!selectedDocumentId || !selectedParcelId) {
      toast({
        title: 'Error',
        description: 'Both document and parcel must be selected',
        variant: 'destructive'
      });
      return;
    }
    
    linkMutation.mutate({
      documentId: selectedDocumentId,
      parcelId: selectedParcelId,
      linkType: linkType as any,
      notes
    });
    
    // Reset form and close dialog
    setLinkDialogOpen(false);
    setNotes('');
    setLinkType('reference');
  };

  // Handle link deletion
  const handleDeleteLink = (linkId: number) => {
    deleteMutation.mutate(linkId);
  };

  // Filtered lists based on search term
  const filteredDocuments = searchTerm.trim() === '' 
    ? documents 
    : documents?.filter((doc: Document) => 
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredParcels = searchTerm.trim() === ''
    ? parcels
    : parcels?.filter((parcel: any) =>
        parcel.parcelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (parcel.address && parcel.address.toLowerCase().includes(searchTerm.toLowerCase())));

  // Determine if the component is in loading state
  const isLoading = isLoadingDocuments || isLoadingParcels || isLoadingLinks;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Document-Parcel Links</h3>
        
        {showLinkButton && (
          <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center">
                <Plus className="mr-1 h-4 w-4" />
                Create Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><>

                <DialogTitle>Create Document-Parcel Link</DialogTitle>
                <DialogDescription
</>
</>>
                  Link a document to a parcel to establish their relationship.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Search field */}
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search documents or parcels..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Document selection */}
                <div className="space-y-2"><>

                  <Label>Document</Label>
                  <Select
</>

                    value={selectedDocumentId?.toString()}
                    onValueChange={(value) => setSelectedDocumentId(parseInt(value))}
                    disabled={isLoadingDocuments}
                  >
                    <SelectTrigger><>

                      <SelectValue placeholder="Select a document" />
                    </SelectTrigger>
                    <SelectContent
</>
</>>
                      <ScrollArea className="h-[200px]">
                        {filteredDocuments?.map((doc: Document) => (
                          <SelectItem key={doc.id} value={doc.id.toString()}>
                            <div className="flex items-center">
                              <FileText className="mr-2 h-4 w-4" />
                              <span>{doc.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Parcel selection */}
                <div className="space-y-2"><>

                  <Label>Parcel</Label>
                  <Select
</>

                    value={selectedParcelId?.toString()}
                    onValueChange={(value) => setSelectedParcelId(parseInt(value))}
                    disabled={isLoadingParcels}
                  >
                    <SelectTrigger><>

                      <SelectValue placeholder="Select a parcel" />
                    </SelectTrigger>
                    <SelectContent
</>
</>>
                      <ScrollArea className="h-[200px]">
                        {filteredParcels?.map((parcel: any) => (
                          <SelectItem key={parcel.id} value={parcel.id.toString()}>
                            <div className="flex items-center">
                              <MapPin className="mr-2 h-4 w-4" />
                              <span>{parcel.parcelNumber}</span>
                              {parcel.address && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({parcel.address})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Link type */}
                <div className="space-y-2"><>

                  <Label>Link Type</Label>
                  <Select
</>

                    value={linkType}
                    onValueChange={setLinkType}
                  >
                    <SelectTrigger><>

                      <SelectValue placeholder="Select link type" />
                    </SelectTrigger>
                    <SelectContent
</>
</>><>

                      <SelectItem value="reference">Reference</SelectItem>
                      <SelectItem
</>
value="related">Related</SelectItem><>

                      <SelectItem value="legal_description">Legal Description</SelectItem>
                      <SelectItem
</>
value="ownership">Ownership</SelectItem><>

                      <SelectItem value="subdivision">Subdivision</SelectItem>
                      <SelectItem
</>
value="transaction">Transaction</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Notes */}
                <div className="space-y-2"><>

                  <Label>Notes</Label>
                  <Input
</>

                    placeholder="Optional notes about this relationship"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
              
              <DialogFooter><>

                <Button
                  variant="outline"
                  onClick={() => setLinkDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
</>

                  onClick={handleCreateLink}
                  disabled={!selectedDocumentId || !selectedParcelId || linkMutation.isPending}
                >
                  {linkMutation.isPending ? 'Creating...' : 'Create Link'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* Display existing links */}
      <Card>
        <CardHeader className="py-3"><>

          <CardTitle className="text-md">Linked Items</CardTitle>
          <CardDescription
</>
</>>
            {selectedParcelId 
              ? 'Documents linked to this parcel' 
              : selectedDocumentId 
                ? 'Parcels linked to this document'
                : 'Select a document or parcel to see links'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin h-6 w-6 border-b-2 border-primary rounded-full"></div>
            </div>
          ) : !links || links.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <LinkIcon className="mx-auto h-12 w-12 opacity-20 mb-2" /><>

              <p>No links found</p>
              <p
</>
className="text-sm">
                {selectedParcelId || selectedDocumentId 
                  ? 'Create a new link to connect documents and parcels' 
                  : 'Select a document or parcel to view its links'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><>

                  <TableHead>
                    {selectedParcelId ? 'Document' : 'Parcel'}
                  </TableHead>
                  <TableHead
</>
</>>Type</TableHead><>

                  <TableHead>Notes</TableHead>
                  <TableHead
</>
className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((link: DocumentParcelLink) => (
                  <TableRow key={link.id}>
                    <TableCell>
                      {selectedParcelId ? (
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          <span>
                            {documents?.find((d: Document) => d.id === link.documentId)?.name || 
                              `Document #${link.documentId}`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4" />
                          <span>
                            {parcels?.find((p: any) => p.id === link.parcelId)?.parcelNumber || 
                              `Parcel #${link.parcelId}`}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {link.linkType ? link.linkType.replace('_', ' ') : 'Unknown'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm truncate max-w-[200px] block">
                        {link.notes || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLink(link.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DocumentParcelLinker;