import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { FileText, 
  LinkIcon, 
  Map, 
  Search, 
  Warning, 
  Home,
  User, 
  Unlink,
  Edit2,
  Settings,
  Link2
 } from '@mui/icons-material';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Document, Parcel, DocumentParcelLink } from '@shared/schema';

interface DocumentParcelManagerProps {
  document: Document;
  showLinkTypeOptions?: boolean;
}

interface ParcelWithLinkInfo extends Parcel {
  linkId?: number;
  linkType?: string;
  linkNotes?: string;
}

const documentLinkTypes = [
  { value: "reference", label: "General Reference" },
  { value: "related", label: "Related" },
  { value: "legal_description", label: "Legal Description" },
  { value: "ownership", label: "Ownership" },
  { value: "subdivision", label: "Subdivision" },
  { value: "transaction", label: "Transaction" },
  { value: "other", label: "Other" }
];

export function DocumentParcelManager({ document, showLinkTypeOptions = false }: DocumentParcelManagerProps) {
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [isLinkOptionsDialogOpen, setIsLinkOptionsDialogOpen] = useState(false);
  const [isEditLinkDialogOpen, setIsEditLinkDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParcelToUnlink, setSelectedParcelToUnlink] = useState<Parcel | null>(null);
  const [selectedParcelToLink, setSelectedParcelToLink] = useState<Parcel | null>(null);
  const [selectedParcelToEdit, setSelectedParcelToEdit] = useState<ParcelWithLinkInfo | null>(null);
  const [linkType, setLinkType] = useState<string>("reference");
  const [linkNotes, setLinkNotes] = useState<string>("");
  const { toast } = useToast();
  
  // Fetch linked parcels with link information
  const { 
    data: linkedParcels = [], 
    isLoading: isLoadingLinkedParcels,
    error: linkedParcelsError 
  } = useQuery({
    queryKey: [`/api/documents/${document.id}/parcels`],
    enabled: !!document.id,
  });
  
  // Fetch parcel-document links 
  const {
    data: documentParcelLinks = [],
    isLoading: isLoadingLinks
  } = useQuery({
    queryKey: [`/api/documents/${document.id}/parcel-links`],
    enabled: !!document.id && showLinkTypeOptions,
  });
  
  // Parcel search query
  const { 
    data: searchResults = [], 
    isLoading: isSearching,
    refetch: performSearch,
    isFetching: isSearchFetching
  } = useQuery({
    queryKey: ['/api/parcels/search', searchQuery],
    enabled: false, // Don't run automatically
  });
  
  // Create document-parcel link mutation with link type options
  const createLinkMutation = useMutation({
    mutationFn: async ({
      documentId,
      parcelId,
      linkType,
      notes
    }: {
      documentId: number;
      parcelId: number;
      linkType?: string;
      notes?: string;
    }) => {
      const res = await apiRequest(
        'POST',
        `/api/documents/${documentId}/parcels`,
        { 
          parcelIds: [parcelId],
          linkType,
          notes 
        }
      );
      return res.json();
    },
    onSuccess: () => {
      // Reset current selections
      setSelectedParcelToLink(null);
      setLinkType("reference");
      setLinkNotes("");
      setIsLinkOptionsDialogOpen(false);
      
      // Refresh linked parcels and links
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/parcels`] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/parcel-links`] });
      
      // Show success toast
      toast({
        title: 'Parcel Linked',
        description: 'Successfully linked document to parcel'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Linking Parcel',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  // Update document-parcel link mutation
  const updateLinkMutation = useMutation({
    mutationFn: async ({
      id,
      linkType,
      notes
    }: {
      id: number;
      linkType?: string;
      notes?: string;
    }) => {
      const res = await apiRequest(
        'PATCH',
        `/api/document-parcel-links/${id}`,
        { 
          linkType,
          notes 
        }
      );
      return res.json();
    },
    onSuccess: () => {
      // Reset current selections
      setSelectedParcelToEdit(null);
      setIsEditLinkDialogOpen(false);
      
      // Refresh links
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/parcels`] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/parcel-links`] });
      
      // Show success toast
      toast({
        title: 'Link Updated',
        description: 'Successfully updated document-parcel relationship'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Updating Link',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  // Unlink document from parcel mutation
  const unlinkParcelMutation = useMutation({
    mutationFn: async ({
      documentId,
      parcelId
    }: {
      documentId: number;
      parcelId: number;
    }) => {
      const res = await apiRequest(
        'DELETE',
        `/api/documents/${documentId}/parcels`,
        { parcelIds: [parcelId] }
      );
      return res.json();
    },
    onSuccess: () => {
      // Reset selected parcel
      setSelectedParcelToUnlink(null);
      
      // Refresh linked parcels and links
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/parcels`] });
      queryClient.invalidateQueries({ queryKey: [`/api/documents/${document.id}/parcel-links`] });
      
      // Show success toast
      toast({
        title: 'Parcel Unlinked',
        description: 'Successfully removed link between document and parcel'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error Unlinking Parcel',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive'
      });
    }
  });
  
  // Enhance parcels with link information if available
  const enhancedParcels: ParcelWithLinkInfo[] = linkedParcels.map(parcel => {
    // Find matching link if available
    const link = documentParcelLinks.find(link => link.parcelId === parcel.id);
    
    if (link) {
      return {
        ...parcel,
        linkId: link.id,
        linkType: link.linkType,
        linkNotes: link.notes || undefined
      };
    }
    
    return parcel;
  });
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: 'Search Query Required',
        description: 'Please enter a parcel number or address to search',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      await performSearch();
    } catch (error) {
      toast({
        title: 'Search Error',
        description: error instanceof Error ? error.message : 'Failed to search parcels',
        variant: 'destructive'
      });
    }
  };
  
  const handleOpenLinkOptions = (parcel: Parcel) => {
    setSelectedParcelToLink(parcel);
    setLinkType("reference");
    setLinkNotes("");
    setIsLinkOptionsDialogOpen(true);
  };
  
  const handleOpenEditLink = (parcel: ParcelWithLinkInfo) => {
    setSelectedParcelToEdit(parcel);
    setLinkType(parcel.linkType || "reference");
    setLinkNotes(parcel.linkNotes || "");
    setIsEditLinkDialogOpen(true);
  };
  
  const handleLinkParcel = async (parcelId: number) => {
    if (showLinkTypeOptions) {
      // If link options enabled, open the options dialog instead of linking directly
      const parcel = searchResults.find(p => p.id === parcelId);
      if (parcel) {
        handleOpenLinkOptions(parcel);
      }
      return;
    }
    
    // Direct linking without options
    try {
      await createLinkMutation.mutateAsync({
        documentId: document.id,
        parcelId
      });
    } catch (error) {
      console.error('Error linking parcel:', error);
    }
  };
  
  const handleSubmitLinkWithOptions = async () => {
    if (!selectedParcelToLink) return;
    
    try {
      await createLinkMutation.mutateAsync({
        documentId: document.id,
        parcelId: selectedParcelToLink.id,
        linkType,
        notes: linkNotes.trim() || undefined
      });
    } catch (error) {
      console.error('Error linking parcel with options:', error);
    }
  };
  
  const handleSubmitEditLink = async () => {
    if (!selectedParcelToEdit || !selectedParcelToEdit.linkId) return;
    
    try {
      await updateLinkMutation.mutateAsync({
        id: selectedParcelToEdit.linkId,
        linkType,
        notes: linkNotes.trim() || undefined
      });
    } catch (error) {
      console.error('Error updating link:', error);
    }
  };
  
  const handleUnlinkParcel = async () => {
    if (!selectedParcelToUnlink) return;
    
    try {
      await unlinkParcelMutation.mutateAsync({
        documentId: document.id,
        parcelId: selectedParcelToUnlink.id
      });
    } catch (error) {
      console.error('Error unlinking parcel:', error);
    }
  };
  
  const isParcelLinked = (parcelId: number) => {
    return linkedParcels.some(p => p.id === parcelId);
  };
  
  const getLinkTypeBadge = (type?: string) => {
    if (!type) return null;
    
    const linkTypeInfo = documentLinkTypes.find(t => t.value === type);
    return (
      <Badge variant="outline" className="whitespace-nowrap">
        {linkTypeInfo?.label || type}
      </Badge>
    );
  };
  
  if (isLoadingLinkedParcels) {
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
  
  if (linkedParcelsError) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center text-red-500">
            <Warning className="h-8 w-8 mx-auto mb-2" />
            <p>Error loading linked parcels</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><>

              <Map className="h-5 w-5 text-primary" />
              Linked Parcels
            </CardTitle>
            <CardDescription
</>>
              Manage parcel associations for this document
            </CardDescription>
          </div>
          
          <Button variant="outline" size="sm" onClick={() => setIsSearchDialogOpen(true)}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Add Parcel Link
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {enhancedParcels.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow><>

                  <TableHead>Parcel Number</TableHead>
                  <TableHead
</>>Address</TableHead>
                  {showLinkTypeOptions && <TableHead>Relationship Type</TableHead>}<>

                  <TableHead>Owner</TableHead>
                  <TableHead
</> className="w-36 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enhancedParcels.map((parcel) => (
                  <TableRow key={parcel.id}><>

                    <TableCell className="font-medium">{parcel.parcelNumber}</TableCell>
                    <TableCell
</>>{parcel.address || 'No address'}</TableCell>
                    {showLinkTypeOptions && (
                      <TableCell>{getLinkTypeBadge(parcel.linkType)}</TableCell>
                    )}<>

                    <TableCell>{parcel.owner || 'Unknown'}</TableCell>
                    <TableCell
</> className="text-right">
                      <div className="flex justify-end space-x-1">
                        {showLinkTypeOptions && parcel.linkId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleOpenEditLink(parcel)}
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-1" />
                            Edit Link
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setSelectedParcelToUnlink(parcel)}
                        >
                          <Unlink className="h-3.5 w-3.5 mr-1" />
                          Unlink
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 border rounded-md">
            <Map className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" /><>

            <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-1">
              No Linked Parcels
            </h3>
            <p
</> className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              This document isn't linked to any parcels yet
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSearchDialogOpen(true)}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              Add Parcel Link
            </Button>
          </div>
        )}
      </CardContent>
      
      {/* Parcel Search Dialog */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><>

            <DialogTitle>Link Document to Parcels</DialogTitle>
            <DialogDescription
</>>
              Search for parcels to associate with this document
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Search Form */}
            <div className="flex gap-3">
              <div className="flex-grow"><>

                <Label htmlFor="parcel-search" className="sr-only">
                  Search Parcels
                </Label>
                <Input
</>
                  id="parcel-search"
                  placeholder="Search by parcel number or address"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button 
                onClick={handleSearch}
                disabled={isSearchFetching || !searchQuery.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                {isSearchFetching ? 'Searching...' : 'Search'}
              </Button>
            </div>
            
            {/* Search Results */}
            {(searchResults.length > 0 || isSearchFetching) && (
              <div>
                <h3 className="text-sm font-medium mb-3">Search Results</h3>
                
                {isSearchFetching ? (
                  <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow><>

                          <TableHead>Parcel Number</TableHead>
                          <TableHead
</>>Address</TableHead><>

                          <TableHead>Owner</TableHead>
                          <TableHead
</> className="w-24 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.map((parcel) => (
                          <TableRow key={parcel.id}><>

                            <TableCell className="font-medium">{parcel.parcelNumber}</TableCell>
                            <TableCell
</>>{parcel.address || 'No address'}</TableCell><>

                            <TableCell>{parcel.owner || 'Unknown'}</TableCell>
                            <TableCell
</> className="text-right">
                              {isParcelLinked(parcel.id) ? (
                                <Badge variant="secondary">Linked</Badge>
                              ) : showLinkTypeOptions ? (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleOpenLinkOptions(parcel)}
                                >
                                  <Link2 className="h-3.5 w-3.5 mr-1" />
                                  Link Options
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleLinkParcel(parcel.id)}
                                  disabled={createLinkMutation.isPending}
                                >
                                  <LinkIcon className="h-3.5 w-3.5 mr-1" />
                                  Link
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            )}
            
            {searchQuery && !isSearchFetching && searchResults.length === 0 && (
              <div className="text-center py-8 border rounded-md">
                <Search className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" /><>

                <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-1">
                  No Results Found
                </h3>
                <p
</> className="text-sm text-slate-500 dark:text-slate-400">
                  Try a different search term or parcel number
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsSearchDialogOpen(false);
                setSearchQuery('');
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Link Options Dialog */}
      <Dialog open={isLinkOptionsDialogOpen} onOpenChange={setIsLinkOptionsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><>

            <DialogTitle>Configure Link Options</DialogTitle>
            <DialogDescription
</>>
              Set the relationship type between document and parcel
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div><>

                  <h4 className="font-medium">Document</h4>
                  <p
</> className="text-sm text-muted-foreground">{document.name}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><>

              <div className="h-px flex-1 bg-border"></div>
              <Link2
</> className="h-4 w-4" />
              <div className="h-px flex-1 bg-border"></div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div><>

                  <h4 className="font-medium">Parcel</h4>
                  <p
</> className="text-sm text-muted-foreground">
                    {selectedParcelToLink?.parcelNumber} 
                    {selectedParcelToLink?.address && ` - ${selectedParcelToLink.address}`}
                  </p>
                </div>
                <Map className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><>

                <Label htmlFor="link-type">Link Type</Label>
                <Select
</> value={linkType} onValueChange={setLinkType}>
                  <SelectTrigger id="link-type"><>

                    <SelectValue placeholder="Select relationship type" />
                  </SelectTrigger>
                  <SelectContent
</>>
                    {documentLinkTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2"><>

                <Label htmlFor="link-notes">Notes</Label>
                <Textarea
</> 
                  id="link-notes"
                  placeholder="Additional information about this relationship (optional)"
                  value={linkNotes}
                  onChange={(e) => setLinkNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter><>

            <Button
              variant="outline"
              onClick={() => setIsLinkOptionsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
</>
              onClick={handleSubmitLinkWithOptions}
              disabled={createLinkMutation.isPending}
            >
              {createLinkMutation.isPending ? 'Creating...' : 'Create Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Link Dialog */}
      <Dialog open={isEditLinkDialogOpen} onOpenChange={setIsEditLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><>

            <DialogTitle>Edit Document-Parcel Relationship</DialogTitle>
            <DialogDescription
</>>
              Update the relationship details between this document and parcel
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div><>

                  <h4 className="font-medium">Document</h4>
                  <p
</> className="text-sm text-muted-foreground">{document.name}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><>

              <div className="h-px flex-1 bg-border"></div>
              <Link2
</> className="h-4 w-4" />
              <div className="h-px flex-1 bg-border"></div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div><>

                  <h4 className="font-medium">Parcel</h4>
                  <p
</> className="text-sm text-muted-foreground">
                    {selectedParcelToEdit?.parcelNumber} 
                    {selectedParcelToEdit?.address && ` - ${selectedParcelToEdit.address}`}
                  </p>
                </div>
                <Map className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            
            <div className="space-y-4 pt-4">
              <div className="space-y-2"><>

                <Label htmlFor="edit-link-type">Link Type</Label>
                <Select
</> value={linkType} onValueChange={setLinkType}>
                  <SelectTrigger id="edit-link-type"><>

                    <SelectValue placeholder="Select relationship type" />
                  </SelectTrigger>
                  <SelectContent
</>>
                    {documentLinkTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2"><>

                <Label htmlFor="edit-link-notes">Notes</Label>
                <Textarea
</> 
                  id="edit-link-notes"
                  placeholder="Additional information about this relationship (optional)"
                  value={linkNotes}
                  onChange={(e) => setLinkNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter><>

            <Button
              variant="outline"
              onClick={() => setIsEditLinkDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
</>
              onClick={handleSubmitEditLink}
              disabled={updateLinkMutation.isPending}
            >
              {updateLinkMutation.isPending ? 'Updating...' : 'Update Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Unlink Confirmation Dialog */}
      <AlertDialog 
        open={selectedParcelToUnlink !== null} 
        onOpenChange={(open) => !open && setSelectedParcelToUnlink(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader><>

            <AlertDialogTitle>Confirm Unlink</AlertDialogTitle>
            <AlertDialogDescription
</>>
              Are you sure you want to unlink this document from parcel{' '}
              <span className="font-semibold">{selectedParcelToUnlink?.parcelNumber}</span>?
              This action does not delete the parcel or document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><>

            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
</> 
              onClick={handleUnlinkParcel}
              disabled={unlinkParcelMutation.isPending}
            >
              {unlinkParcelMutation.isPending ? 'Unlinking...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}