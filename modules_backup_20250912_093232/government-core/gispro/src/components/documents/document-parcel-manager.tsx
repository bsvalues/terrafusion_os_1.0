import {useState} from 'react';
import {useQuery, useMutation} from '@tanstack/react-query';
import {Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Textarea} from '@/components/ui/textarea';
import {Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,} from '@/components/ui/dialog';
import {AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,} from '@/components/ui/alert-dialog';
import {Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,} from '@/components/ui/table';
import {Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,} from '@/components/ui/select';
import {useToast} from '@/hooks/use-toast';
import {FileText,
  LinkIcon,
  Map,
  Search,
  Warning,
  Home,
  User,
  Unlink,
  Edit2,
  Settings,
  Link2,} from '@mui/icons-material';
import {apiRequest, queryClient} from '@/lib/queryClient';
import {Document, Parcel, DocumentParcelLink} from '@shared/schema';

interface DocumentParcelManagerProps {document: Document;
  showLinkTypeOptions?: boolean;}

interface ParcelWithLinkInfo extends Parcel {linkId?: number;
  linkType?: string;
  linkNotes?: string;}

const documentLinkTypes = [
  {value: 'reference', label: 'General Reference'},
  {value: 'related', label: 'Related'},
  {value: 'legal_description', label: 'Legal Description'},
  {value: 'ownership', label: 'Ownership'},
  {value: 'subdivision', label: 'Subdivision'},
  {value: 'transaction', label: 'Transaction'},
  {value: 'other', label: 'Other'},
];

export function DocumentParcelManager({document,
  showLinkTypeOptions = false,}: DocumentParcelManagerProps) {const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isLinkOptionsDialogOpen, setIsLinkOptionsDialogOpen] = useState(false);
  const [isEditLinkDialogOpen, setIsEditLinkDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParcelToUnlink, setSelectedParcelToUnlink] = useState<Parcel | null>(null);
  const [selectedParcelToLink, setSelectedParcelToLink] = useState<Parcel | null>(null);
  const [selectedParcelToEdit, setSelectedParcelToEdit] = useState<ParcelWithLinkInfo | null>(null);
  const [linkType, setLinkType] = useState<string>('reference');
  const [linkNotes, setLinkNotes] = useState<string>('');
  const { toast} = useToast();

  // Fetch linked parcels with link information
  const {data: linkedParcels = [], isLoading: isLoadingLinkedParcels} = useQuery({
    queryKey: ['document-parcels', document.id],
    queryFn: async () =>{
      const response = await apiRequest(`/documents/${document.id}/parcels`);
      return response.data;
    },
  });

  // Fetch search results for parcels
  const {data: searchResults = [], isLoading: isSearching} = useQuery({
    queryKey: ['parcel-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await apiRequest(`/parcels/search?q=${encodeURIComponent(searchQuery)}`);
      return response.data;
    },
    enabled: !!searchQuery.trim(),
  });

  // Link parcel to document mutation
  const linkParcelMutation = useMutation({mutationFn: async ({
      parcelId,
      linkType,
      notes,}: {parcelId: number;
      linkType?: string;
      notes?: string;}) => {
      const response = await apiRequest(`/documents/${document.id}/parcels`, {method: 'POST',
        body: JSON.stringify({
          parcelId,
          linkType: linkType || 'reference',
          notes: notes || '',}),
      });
      return response.data;
    },
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['document-parcels', document.id]});
      setIsSearchDialogOpen(false);
      setIsLinkOptionsDialogOpen(false);
      setSelectedParcelToLink(null);
      setLinkType('reference');
      setLinkNotes('');
      toast({title: 'Parcel Linked',
        description: 'The parcel has been successfully linked to this document.',});
    },
    onError: (error: any) => {toast({
        title: 'Link Failed',
        description: error.message || 'Failed to link parcel to document.',
        variant: 'destructive',});
    },
  });

  // Unlink parcel from document mutation
  const unlinkParcelMutation = useMutation({
    mutationFn: async (parcelId: number) => {
      const response = await apiRequest(`/documents/${document.id}/parcels/${parcelId}`, {method: 'DELETE',});
      return response.data;
    },
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['document-parcels', document.id]});
      setSelectedParcelToUnlink(null);
      toast({title: 'Parcel Unlinked',
        description: 'The parcel has been unlinked from this document.',});
    },
    onError: (error: any) => {toast({
        title: 'Unlink Failed',
        description: error.message || 'Failed to unlink parcel from document.',
        variant: 'destructive',});
    },
  });

  // Update parcel link mutation
  const updateLinkMutation = useMutation({mutationFn: async ({
      parcelId,
      linkType,
      notes,}: {parcelId: number;
      linkType: string;
      notes: string;}) => {
      const response = await apiRequest(`/documents/${document.id}/parcels/${parcelId}`, {method: 'PATCH',
        body: JSON.stringify({
          linkType,
          notes,}),
      });
      return response.data;
    },
    onSuccess: () => {queryClient.invalidateQueries({ queryKey: ['document-parcels', document.id]});
      setIsEditLinkDialogOpen(false);
      setSelectedParcelToEdit(null);
      toast({title: 'Link Updated',
        description: 'The parcel link has been successfully updated.',});
    },
    onError: (error: any) => {toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update parcel link.',
        variant: 'destructive',});
    },
  });

  const handleLinkParcel = (parcel: Parcel) => {if (showLinkTypeOptions) {
      setSelectedParcelToLink(parcel);
      setIsLinkOptionsDialogOpen(true);
      setIsSearchDialogOpen(false);} else {linkParcelMutation.mutate({ parcelId: parcel.id});
    }
  };

  const handleConfirmLink = () => {if (selectedParcelToLink) {
      linkParcelMutation.mutate({
        parcelId: selectedParcelToLink.id,
        linkType,
        notes: linkNotes,});
    }
  };

  const handleUnlinkParcel = () => {if (selectedParcelToUnlink) {
      unlinkParcelMutation.mutate(selectedParcelToUnlink.id);}
  };

  const handleEditLink = (parcel: ParcelWithLinkInfo) => {setSelectedParcelToEdit(parcel);
    setLinkType(parcel.linkType || 'reference');
    setLinkNotes(parcel.linkNotes || '');
    setIsEditLinkDialogOpen(true);};

  const handleUpdateLink = () => {if (selectedParcelToEdit) {
      updateLinkMutation.mutate({
        parcelId: selectedParcelToEdit.id,
        linkType,
        notes: linkNotes,});
    }
  };

  const getBadgeVariant = (linkType?: string) => {switch (linkType) {
      case 'ownership':
        return 'default';
      case 'legal_description':
        return 'secondary';
      case 'subdivision':
        return 'outline';
      case 'transaction':
        return 'destructive';
      default:
        return 'outline';}
  };

  const formatParcelId = (parcel: Parcel) => {
    if (parcel.pin) return `PIN: ${parcel.pin}`;
    if (parcel.parcelNumber) return `Parcel: ${parcel.parcelNumber}`;
    return `ID: ${parcel.id}`;
  };

  const formatAddress = (parcel: Parcel) => {const parts = [];
    if (parcel.address) parts.push(parcel.address);
    if (parcel.city) parts.push(parcel.city);
    if (parcel.state) parts.push(parcel.state);
    if (parcel.zipCode) parts.push(parcel.zipCode);
    return parts.join(', ') || 'No address available';};

  // Filter search results to exclude already linked parcels
  const availableParcels = searchResults.filter(
    (searchParcel: Parcel) =>
      !linkedParcels.some((linkedParcel: ParcelWithLinkInfo) => linkedParcel.id === searchParcel.id)
  );

  return (<div className="space-y-4"><Card><CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" />Linked Parcels
              {linkedParcels.length > 0 && (<Badge variant="secondary">{linkedParcels.length}</Badge>)}</CardTitle><Button
              onClick={() => setIsSearchDialogOpen(true)}
              size="sm"
              className="flex items-center gap-1"
            ><Link2 className="h-4 w-4" />Link Parcel</Button></div><CardDescription>Parcels that are associated with this document</CardDescription></CardHeader><CardContent>{isLoadingLinkedParcels ? (<div className="flex items-center justify-center py-8"><div className="text-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div><p className="text-sm text-muted-foreground">Loading linked parcels...</p></div></div>) : linkedParcels.length === 0 ? (<div className="text-center py-8"><Map className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" /><h3 className="text-lg font-medium mb-2">No parcels linked</h3><p className="text-muted-foreground text-sm mb-4">This document is not currently linked to any parcels.</p><Button
                onClick={() => setIsSearchDialogOpen(true)}
                variant="outline"
                className="flex items-center gap-1"
              ><Link2 className="h-4 w-4" />Link a Parcel</Button></div>) : (<Table><TableHeader><TableRow><TableHead>Parcel ID</TableHead><TableHead>Address</TableHead><TableHead>Owner</TableHead>{showLinkTypeOptions &&<TableHead>Relationship Type</TableHead>}
                  <TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{linkedParcels.map((parcel: ParcelWithLinkInfo) => (<TableRow key={parcel.id}><TableCell className="font-medium">{formatParcelId(parcel)}</TableCell><TableCell>{formatAddress(parcel)}</TableCell><TableCell><div className="flex items-center gap-1"><User className="h-4 w-4 text-muted-foreground" />{parcel.owner || 'Unknown Owner'}</div></TableCell>{showLinkTypeOptions && (<TableCell><Badge variant={getBadgeVariant(parcel.linkType)}>{documentLinkTypes.find(type => type.value === parcel.linkType)?.label ||
                            'Reference'}</Badge></TableCell>)}<TableCell><div className="flex items-center gap-1">{showLinkTypeOptions && (<Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLink(parcel)}
                            className="flex items-center gap-1"
                          ><Edit2 className="h-3 w-3" />Edit</Button>)}<AlertDialog><AlertDialogTrigger asChild><Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedParcelToUnlink(parcel)}
                              className="flex items-center gap-1 text-destructive hover:text-destructive"
                            ><Unlink className="h-3 w-3" />Unlink</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Unlink Parcel</AlertDialogTitle><AlertDialogDescription>Are you sure you want to unlink {formatParcelId(parcel)} from this
                                document? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction
                                onClick={handleUnlinkParcel}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >Unlink Parcel</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></div></TableCell></TableRow>))}</TableBody></Table>)}</CardContent></Card>{/* Search Dialog */}<Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}><DialogContent className="max-w-4xl max-h-[80vh] flex flex-col"><DialogHeader><DialogTitle>Search and Link Parcels</DialogTitle><DialogDescription>Search for parcels to link to this document</DialogDescription></DialogHeader><div className="space-y-4 flex-1 min-h-0"><div className="flex items-center gap-2"><div className="flex-grow"><Input
                  placeholder="Search by parcel number, PIN, address, or owner name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full"
                /></div><Button
                variant="outline"
                size="icon"
                onClick={() => setSearchQuery('')}
                disabled={!searchQuery}
              ><Search className="h-4 w-4" /></Button></div><div className="border rounded-lg flex-1 min-h-0 flex flex-col">{isSearching ? (<div className="flex items-center justify-center py-8"><div className="text-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div><p className="text-sm text-muted-foreground">Searching parcels...</p></div></div>) : searchQuery && availableParcels.length === 0 ? (<div className="text-center py-8"><Search className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" /><h3 className="text-lg font-medium mb-2">No parcels found</h3><p className="text-muted-foreground text-sm">Try a different search term or check your spelling.</p></div>) : searchQuery && availableParcels.length > 0 ? (<div className="flex-1 min-h-0"><Table><TableHeader><TableRow><TableHead>Parcel ID</TableHead><TableHead>Address</TableHead><TableHead>Owner</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>{availableParcels.map((parcel: Parcel) => (<TableRow key={parcel.id}><TableCell className="font-medium">{formatParcelId(parcel)}</TableCell><TableCell>{formatAddress(parcel)}</TableCell><TableCell><div className="flex items-center gap-1"><User className="h-4 w-4 text-muted-foreground" />{parcel.owner || 'Unknown Owner'}</div></TableCell><TableCell><Button
                              size="sm"
                              onClick={() =>handleLinkParcel(parcel)}
                              disabled={linkParcelMutation.isPending}
                            >
                              {linkParcelMutation.isPending ? 'Linking...' : 'Link'}</Button></TableCell></TableRow>))}</TableBody></Table></div>) : (<div className="text-center py-8"><Search className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" /><h3 className="text-lg font-medium mb-2">Start searching</h3><p className="text-muted-foreground text-sm">Enter a search term above to find parcels to link to this document.</p></div>)}</div></div></DialogContent></Dialog>{/* Link Options Dialog */}
      {showLinkTypeOptions && (<Dialog open={isLinkOptionsDialogOpen} onOpenChange={setIsLinkOptionsDialogOpen}><DialogContent><DialogHeader><DialogTitle>Link Parcel to Document</DialogTitle><DialogDescription>Configure how this parcel relates to the document</DialogDescription></DialogHeader>{selectedParcelToLink && (<div className="space-y-4"><div><h4 className="font-medium mb-2">Selected Parcel</h4><div className="p-3 bg-muted rounded-lg"><p className="font-medium">{formatParcelId(selectedParcelToLink)}</p><p className="text-sm text-muted-foreground">{formatAddress(selectedParcelToLink)}</p></div></div><div className="flex items-center gap-2 text-sm text-muted-foreground"><LinkIcon className="h-4 w-4" /><span>will be linked to</span></div><div><h4 className="font-medium mb-2">Document</h4><div className="p-3 bg-muted rounded-lg"><p className="font-medium">{document.title}</p><p className="text-sm text-muted-foreground">{document.description || 'No description available'}</p></div></div><div className="space-y-2"><Label htmlFor="link-type">Relationship Type</Label><Select value={linkType} onValueChange={setLinkType}><SelectTrigger id="link-type"><SelectValue /></SelectTrigger><SelectContent>{documentLinkTypes.map(type => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="link-notes">Notes (Optional)</Label><Textarea
                    id="link-notes"
                    placeholder="Add any additional context about this relationship..."
                    value={linkNotes}
                    onChange={e => setLinkNotes(e.target.value)}
                    rows={3}
                  /></div></div>)}<DialogFooter><Button variant="outline" onClick={() =>setIsLinkOptionsDialogOpen(false)}>
                Cancel</Button><Button onClick={handleConfirmLink} disabled={linkParcelMutation.isPending}>{linkParcelMutation.isPending ? 'Linking...' : 'Link Parcel'}</Button></DialogFooter></DialogContent></Dialog>)}

      {/* Edit Link Dialog */}
      {showLinkTypeOptions && (<Dialog open={isEditLinkDialogOpen} onOpenChange={setIsEditLinkDialogOpen}><DialogContent><DialogHeader><DialogTitle>Edit Parcel Link</DialogTitle><DialogDescription>Update the relationship details for this parcel link</DialogDescription></DialogHeader>{selectedParcelToEdit && (<div className="space-y-4"><div><h4 className="font-medium mb-2">Parcel</h4><div className="p-3 bg-muted rounded-lg"><p className="font-medium">{formatParcelId(selectedParcelToEdit)}</p><p className="text-sm text-muted-foreground">{formatAddress(selectedParcelToEdit)}</p></div></div><div className="space-y-2"><Label htmlFor="edit-link-type">Relationship Type</Label><Select value={linkType} onValueChange={setLinkType}><SelectTrigger id="edit-link-type"><SelectValue /></SelectTrigger><SelectContent>{documentLinkTypes.map(type => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="edit-link-notes">Notes</Label><Textarea
                    id="edit-link-notes"
                    placeholder="Add any additional context about this relationship..."
                    value={linkNotes}
                    onChange={e => setLinkNotes(e.target.value)}
                    rows={3}
                  /></div></div>)}<DialogFooter><Button variant="outline" onClick={() =>setIsEditLinkDialogOpen(false)}>
                Cancel</Button><Button onClick={handleUpdateLink} disabled={updateLinkMutation.isPending}>{updateLinkMutation.isPending ? 'Updating...' : 'Update Link'}</Button></DialogFooter></DialogContent></Dialog>)}</div>
  );
}

export default DocumentParcelManager;
