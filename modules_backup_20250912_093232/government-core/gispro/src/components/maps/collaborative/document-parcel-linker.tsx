import React, {useState, useEffect} from 'react';
import {useQuery, useMutation} from '@tanstack/react-query';
import {apiRequest, queryClient} from '@/lib/queryClient';
import {DocumentParcelLink, Document, InsertDocumentParcelLink} from '@shared/schema';
import {useEnhancedWebSocket} from '@/hooks/use-enhanced-websocket';
import {Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,} from '@/components/ui/table';
import {Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,} from '@/components/ui/dialog';
import {Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,} from '@/components/ui/card';
import {Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,} from '@/components/ui/select';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {ScrollArea} from '@/components/ui/scroll-area';
import {useToast} from '@/hooks/use-toast';
import {FileText, Link as LinkIcon, MapPin, Search, Plus, Trash2} from '@mui/icons-material';

interface DocumentParcelLinkerProps {roomId: string;
  parcelId?: number;
  documentId?: number;
  showLinkButton?: boolean;
  onLinksChanged?: () => void;}

/**
 * DocumentParcelLinker Component
 *
 * This component allows linking documents to parcels in a collaborative environment
 * It broadcasts link changes via WebSocket to all participants in the same room
 */
export function DocumentParcelLinker({roomId,
  parcelId,
  documentId,
  showLinkButton = true,
  onLinksChanged,}: DocumentParcelLinkerProps) {const { toast} = useToast();
  const [selectedParcelId, setSelectedParcelId] = useState<number | undefined>(parcelId);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | undefined>(documentId);
  const [linkType, setLinkType] = useState<string>('reference');
  const [notes, setNotes] = useState<string>('');
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Set up WebSocket for collaborative features
  const {send, messages, connectionStatus} = useEnhancedWebSocket({roomId,
    autoConnect: true,});

  // Fetch existing links
  const {data: links = [],
    isLoading: linksLoading,
    refetch: refetchLinks,} = useQuery({
    queryKey: ['document-parcel-links', selectedParcelId, selectedDocumentId],
    queryFn: async () =>{
      const params = new URLSearchParams();
      if (selectedParcelId) params.append('parcelId', selectedParcelId.toString());
      if (selectedDocumentId) params.append('documentId', selectedDocumentId.toString());

      const response = await apiRequest('GET', `/api/document-parcel-links?${params}`);
      if (!response.ok) throw new Error('Failed to fetch links');
      return response.json();
    },
    enabled: !!(selectedParcelId || selectedDocumentId),
  });

  // Fetch documents for selection
  const {data: documents = []} = useQuery({
    queryKey: ['documents', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await apiRequest('GET', `/api/documents?${params}`);
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    },
  });

  // Fetch parcels for selection
  const {data: parcels = []} = useQuery({
    queryKey: ['parcels', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await apiRequest('GET', `/api/parcels?${params}`);
      if (!response.ok) throw new Error('Failed to fetch parcels');
      return response.json();
    },
  });

  // Create link mutation
  const createLinkMutation = useMutation({mutationFn: async (linkData: InsertDocumentParcelLink) => {
      const response = await apiRequest('POST', '/api/document-parcel-links', linkData);
      if (!response.ok) throw new Error('Failed to create link');
      return response.json();},
    onSuccess: data => {toast({
        title: 'Link Created',
        description: 'Document and parcel have been successfully linked.',});

      // Broadcast the new link to other users
      send({type: 'document_parcel_link_created',
        data: { link: data, roomId},
      });

      refetchLinks();
      onLinksChanged?.();
      setLinkDialogOpen(false);
      resetForm();
    },
    onError: error => {toast({
        title: 'Link Creation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',});
    },
  });

  // Delete link mutation
  const deleteLinkMutation = useMutation({
    mutationFn: async (linkId: number) => {
      const response = await apiRequest('DELETE', `/api/document-parcel-links/${linkId}`);
      if (!response.ok) throw new Error('Failed to delete link');
      return response.json();
    },
    onSuccess: (_, linkId) => {toast({
        title: 'Link Deleted',
        description: 'Document-parcel link has been removed.',});

      // Broadcast the deletion to other users
      send({type: 'document_parcel_link_deleted',
        data: { linkId, roomId},
      });

      refetchLinks();
      onLinksChanged?.();
    },
    onError: error => {toast({
        title: 'Link Deletion Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',});
    },
  });

  // Handle WebSocket messages for real-time updates
  useEffect(() => {const handleWebSocketMessage = (message: any) => {
      if (
        message.type === 'document_parcel_link_created' ||
        message.type === 'document_parcel_link_deleted'
      ) {
        // Refresh links when other users make changes
        refetchLinks();
        onLinksChanged?.();}
    };

    if (messages.length > 0) {const latestMessage = messages[messages.length - 1];
      handleWebSocketMessage(latestMessage);}
  }, [messages, refetchLinks, onLinksChanged]);

  // Reset form
  const resetForm = () => {setSelectedParcelId(parcelId);
    setSelectedDocumentId(documentId);
    setLinkType('reference');
    setNotes('');};

  // Handle link creation
  const handleCreateLink = () => {if (!selectedParcelId || !selectedDocumentId) {
      toast({
        title: 'Missing Information',
        description: 'Please select both a document and a parcel.',
        variant: 'destructive',});
      return;
    }

    const linkData: InsertDocumentParcelLink = {documentId: selectedDocumentId,
      parcelId: selectedParcelId,
      linkType,
      notes: notes.trim() || undefined,
      createdBy: 'current-user', // This should come from auth context};

    createLinkMutation.mutate(linkData);
  };

  // Get link type badge variant
  const getLinkTypeBadge = (type: string) => {switch (type) {
      case 'ownership':
        return { variant: 'default', label: 'Ownership'};
      case 'deed':
        return {variant: 'secondary', label: 'Deed'};
      case 'survey':
        return {variant: 'outline', label: 'Survey'};
      case 'legal':
        return {variant: 'destructive', label: 'Legal'};
      default:
        return {variant: 'outline', label: 'Reference'};
    }
  };

  return (<div className="space-y-6">{/* Header */}<div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold tracking-tight">Document-Parcel Links</h2><p className="text-muted-foreground">Manage relationships between documents and parcels</p></div><div className="flex items-center gap-2"><Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>{connectionStatus === 'connected' ? 'Live' : 'Offline'}</Badge>{showLinkButton && (<Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Create Link</Button></DialogTrigger><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Create Document-Parcel Link</DialogTitle><DialogDescription>Link a document to a parcel with additional context information</DialogDescription></DialogHeader><div className="space-y-4">{/* Document Selection */}<div className="space-y-2"><Label htmlFor="document-select">Document</Label><Select
                      value={selectedDocumentId?.toString()}
                      onValueChange={value => setSelectedDocumentId(parseInt(value))}
                    ><SelectTrigger><SelectValue placeholder="Select a document" /></SelectTrigger><SelectContent><div className="p-2"><Input
                            placeholder="Search documents..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="mb-2"
                          /></div>{documents.map((doc: Document) => (<SelectItem key={doc.id} value={doc.id.toString()}><div className="flex items-center gap-2"><FileText className="h-4 w-4" /><span>{doc.title}</span></div></SelectItem>))}</SelectContent></Select></div>{/* Parcel Selection */}<div className="space-y-2"><Label htmlFor="parcel-select">Parcel</Label><Select
                      value={selectedParcelId?.toString()}
                      onValueChange={value => setSelectedParcelId(parseInt(value))}
                    ><SelectTrigger><SelectValue placeholder="Select a parcel" /></SelectTrigger><SelectContent><div className="p-2"><Input
                            placeholder="Search parcels..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="mb-2"
                          /></div>{parcels.map((parcel: any) => (<SelectItem key={parcel.id} value={parcel.id.toString()}><div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><span>{parcel.parcelNumber} - {parcel.address}</span></div></SelectItem>))}</SelectContent></Select></div>{/* Link Type */}<div className="space-y-2"><Label htmlFor="link-type">Link Type</Label><Select value={linkType} onValueChange={setLinkType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="reference">Reference</SelectItem><SelectItem value="ownership">Ownership</SelectItem><SelectItem value="deed">Deed</SelectItem><SelectItem value="survey">Survey</SelectItem><SelectItem value="legal">Legal Document</SelectItem><SelectItem value="permit">Permit</SelectItem><SelectItem value="zoning">Zoning</SelectItem></SelectContent></Select></div>{/* Notes */}<div className="space-y-2"><Label htmlFor="notes">Notes (Optional)</Label><Input
                      id="notes"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Additional context or description..."
                    /></div></div><DialogFooter><Button onClick={() =>setLinkDialogOpen(false)} variant="outline">
                    Cancel</Button><Button
                    onClick={handleCreateLink}
                    disabled={createLinkMutation.isPending || !selectedParcelId || !selectedDocumentId}
                  >{createLinkMutation.isPending ? 'Creating...' : 'Create Link'}</Button></DialogFooter></DialogContent></Dialog>)}</div></div>{/* Search and Filter */}<Card><CardHeader><CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />Search and Filter</CardTitle></CardHeader><CardContent><div className="flex gap-4"><div className="flex-1"><Input
                placeholder="Search documents and parcels..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              /></div><Button variant="outline" onClick={() =>setSearchTerm('')}>
              Clear</Button></div></CardContent></Card>{/* Links Table */}<Card><CardHeader><CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" />Active Links
            {links.length > 0 &&<Badge variant="secondary">{links.length}</Badge>}
          </CardTitle><CardDescription>Current document-parcel relationships</CardDescription></CardHeader><CardContent>{linksLoading ? (<div className="flex items-center justify-center py-8"><div className="text-muted-foreground">Loading links...</div></div>) : links.length === 0 ? (<div className="text-center py-8"><LinkIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">No Links Found</h3><p className="text-muted-foreground mb-4">No document-parcel relationships have been created yet.</p>{showLinkButton && (<Button onClick={() => setLinkDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Create First Link</Button>)}</div>) : (<ScrollArea className="h-96"><Table><TableHeader><TableRow><TableHead>Document</TableHead><TableHead>Parcel</TableHead><TableHead>Type</TableHead><TableHead>Created</TableHead><TableHead>Notes</TableHead><TableHead className="w-[100px]">Actions</TableHead></TableRow></TableHeader><TableBody>{links.map((link: DocumentParcelLink & {document: Document; parcel: any}) => {
                    const linkBadge = getLinkTypeBadge(link.linkType);
                    return (<TableRow key={link.id}><TableCell><div className="flex items-center gap-2"><FileText className="h-4 w-4" /><div><div className="font-medium">{link.document.title}</div><div className="text-sm text-muted-foreground">{link.document.fileName}</div></div></div></TableCell><TableCell><div className="flex items-center gap-2"><MapPin className="h-4 w-4" /><div><div className="font-medium">{link.parcel.parcelNumber}</div><div className="text-sm text-muted-foreground">{link.parcel.address}</div></div></div></TableCell><TableCell><Badge variant={linkBadge.variant as any}>{linkBadge.label}</Badge></TableCell><TableCell><div className="text-sm">{new Date(link.createdAt).toLocaleDateString()}</div><div className="text-xs text-muted-foreground">by {link.createdBy}</div></TableCell><TableCell>{link.notes && (<div className="text-sm max-w-xs truncate" title={link.notes}>{link.notes}</div>)}</TableCell><TableCell><Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteLinkMutation.mutate(link.id)}
                            disabled={deleteLinkMutation.isPending}
                          ><Trash2 className="h-4 w-4" /></Button></TableCell></TableRow>);
                  })}</TableBody></Table></ScrollArea>)}</CardContent></Card>{/* Statistics */}
      {links.length > 0 && (<div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Card><CardContent className="p-4"><div className="flex items-center gap-2"><LinkIcon className="h-5 w-5 text-blue-600" /><div><div className="text-2xl font-bold">{links.length}</div><div className="text-sm text-muted-foreground">Total Links</div></div></div></CardContent></Card><Card><CardContent className="p-4"><div className="flex items-center gap-2"><FileText className="h-5 w-5 text-green-600" /><div><div className="text-2xl font-bold">{new Set(links.map(l => l.documentId)).size}</div><div className="text-sm text-muted-foreground">Linked Documents</div></div></div></CardContent></Card><Card><CardContent className="p-4"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-purple-600" /><div><div className="text-2xl font-bold">{new Set(links.map(l => l.parcelId)).size}</div><div className="text-sm text-muted-foreground">Linked Parcels</div></div></div></CardContent></Card><Card><CardContent className="p-4"><div className="flex items-center gap-2"><div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center"><div className="w-2 h-2 bg-blue-600 rounded-full"></div></div><div><div className="text-2xl font-bold">{connectionStatus === 'connected' ? 'Live' : 'Offline'}</div><div className="text-sm text-muted-foreground">Collaboration Status</div></div></div></CardContent></Card></div>)}</div>
  );
}
