import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FileText, 
  MapPin, 
  Plus, 
  Link, 
  Link2Off, 
  Search, 
  Info,
  ArrowUpDown,
  Check,
  Trash2 
 } from '@mui/icons-material';
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapboxMap } from "@/components/maps/mapbox/mapbox-map";

// Type definitions
interface Document {
  id: number;
  name: string;
  type: "legal_description" | "plat_map" | "deed" | "survey" | "boundary_line_adjustment" | "tax_form" | "unclassified";
  content: string | null;
  workflowId: number | null;
  uploadedAt: string;
}

interface Parcel {
  id: number;
  parcelNumber: string;
  workflowId: number | null;
  parentParcelId: string | null;
  legalDescription: string | null;
  acreage: string | null;
  acres: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  propertyType: string | null;
  owner: string | null;
  zoning: string | null;
  assessedValue: string | null;
  geometry: any | null;
  isActive: boolean;
  createdAt: string;
}

interface Link {
  id: number;
  documentId: number;
  parcelId: number;
  linkType: "legal_description" | "related" | "reference" | "ownership" | "subdivision" | "transaction" | "other" | null;
  notes: string | null;
  createdAt: string;
}

interface ParcelWithDocuments extends Parcel {
  documents: Document[];
}

interface DocumentWithParcels extends Document {
  parcels: Parcel[];
}

// Helper functions
const formatDate = (dateString: string | Date) => {
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error, dateString);
    return "Invalid date";
  }
};

const getLinkTypeBadge = (linkType: string | null) => {
  const types: Record<string, { color: string, label: string }> = {
    legal_description: { color: "bg-blue-500", label: "Legal Description" },
    related: { color: "bg-gray-500", label: "Related" },
    reference: { color: "bg-purple-500", label: "Reference" },
    ownership: { color: "bg-green-500", label: "Ownership" },
    subdivision: { color: "bg-yellow-500", label: "Subdivision" },
    transaction: { color: "bg-orange-500", label: "Transaction" },
    other: { color: "bg-red-500", label: "Other" }
  };
  
  const type = linkType ? types[linkType] : { color: "bg-gray-500", label: "Undefined" };
  
  return (
    <Badge className={`${type.color} text-white`}>
      {type.label}
    </Badge>
  );
};

const getDocumentTypeIcon = (type: string) => {
  switch (type) {
    case "legal_description":
      return <FileText className="h-4 w-4 text-blue-500" />;
    case "plat_map":
      return <MapPin className="h-4 w-4 text-green-500" />;
    case "deed":
      return <FileText className="h-4 w-4 text-yellow-500" />;
    case "survey":
      return <FileText className="h-4 w-4 text-purple-500" />;
    case "boundary_line_adjustment":
      return <FileText className="h-4 w-4 text-orange-500" />;
    case "tax_form":
      return <FileText className="h-4 w-4 text-red-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
};

export default function DocumentParcelManagementPage() {
  const [selectedTab, setSelectedTab] = useState("documents");
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState<number | null>(null);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [linkType, setLinkType] = useState<string>("reference");
  const [linkNotes, setLinkNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"document" | "parcel">("document");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Queries
  const { 
    data: documents,
    isLoading: isLoadingDocuments
  } = useQuery({
    queryKey: ['/api/documents'],
    select: (data: Document[]) => {
      // Filter documents if search query is specified
      if (searchQuery && searchType === "document") {
        return data.filter(doc => 
          doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.type.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      return data;
    }
  });
  
  const { 
    data: parcels,
    isLoading: isLoadingParcels
  } = useQuery({
    queryKey: ['/api/parcels'],
    select: (data: Parcel[]) => {
      // Filter parcels if search query is specified
      if (searchQuery && searchType === "parcel") {
        return data.filter(parcel => 
          (parcel.parcelNumber && parcel.parcelNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (parcel.address && parcel.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (parcel.owner && parcel.owner.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      return data;
    }
  });
  
  const { 
    data: selectedDocument,
    isLoading: isLoadingSelectedDocument
  } = useQuery({
    queryKey: ['/api/documents', selectedDocumentId, 'parcels'],
    enabled: !!selectedDocumentId,
  });
  
  const { 
    data: selectedParcel,
    isLoading: isLoadingSelectedParcel
  } = useQuery({
    queryKey: ['/api/parcels', selectedParcelId, 'documents'],
    enabled: !!selectedParcelId,
  });
  
  // Mutations
  const createLinkMutation = useMutation({
    mutationFn: (linkData: { documentId: number, parcelId: number, linkType: string, notes: string }) => {
      return apiRequest('/api/document-parcel-links', 'POST', linkData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document-parcel link created successfully",
      });
      if (selectedDocumentId) {
        queryClient.invalidateQueries({ queryKey: ['/api/documents', selectedDocumentId, 'parcels'] });
      }
      if (selectedParcelId) {
        queryClient.invalidateQueries({ queryKey: ['/api/parcels', selectedParcelId, 'documents'] });
      }
      setIsLinkDialogOpen(false);
      setLinkNotes("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create link: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  const removeLinkMutation = useMutation({
    mutationFn: (linkData: { documentId: number, parcelId: number }) => {
      return apiRequest('/api/document-parcel-links', 'DELETE', linkData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document-parcel link removed successfully",
      });
      if (selectedDocumentId) {
        queryClient.invalidateQueries({ queryKey: ['/api/documents', selectedDocumentId, 'parcels'] });
      }
      if (selectedParcelId) {
        queryClient.invalidateQueries({ queryKey: ['/api/parcels', selectedParcelId, 'documents'] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to remove link: ${error}`,
        variant: "destructive",
      });
    }
  });
  
  // Effects
  useEffect(() => {
    // Reset selections when changing tabs
    if (selectedTab === "documents") {
      setSelectedParcelId(null);
      if (documents && documents.length > 0 && !selectedDocumentId) {
        setSelectedDocumentId(documents[0].id);
      }
    } else {
      setSelectedDocumentId(null);
      if (parcels && parcels.length > 0 && !selectedParcelId) {
        setSelectedParcelId(parcels[0].id);
      }
    }
  }, [selectedTab, documents, parcels]);
  
  // Handle link creation
  const handleCreateLink = () => {
    if (!selectedDocumentId || !selectedParcelId) {
      toast({
        title: "Error",
        description: "Both document and parcel must be selected",
        variant: "destructive",
      });
      return;
    }
    
    createLinkMutation.mutate({
      documentId: selectedDocumentId,
      parcelId: selectedParcelId,
      linkType,
      notes: linkNotes
    });
  };
  
  // Handle link removal
  const handleRemoveLink = (documentId: number, parcelId: number) => {
    removeLinkMutation.mutate({ documentId, parcelId });
  };
  
  // Handle document selection
  const handleDocumentSelect = (documentId: number) => {
    setSelectedDocumentId(documentId);
  };
  
  // Handle parcel selection
  const handleParcelSelect = (parcelId: number) => {
    setSelectedParcelId(parcelId);
  };
  
  // Open link dialog with the right context
  const openLinkDialog = (documentId?: number, parcelId?: number) => {
    if (documentId) setSelectedDocumentId(documentId);
    if (parcelId) setSelectedParcelId(parcelId);
    setIsLinkDialogOpen(true);
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Trigger a refetch of the data with the current search term
    if (searchType === "document") {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['/api/parcels'] });
    }
  };
  
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Document-Parcel Management</h1>
        
        {/* Search form */}
        <form onSubmit={handleSearch} className="flex items-center space-x-2">
          <Select
            value={searchType}
            onValueChange={(value) => setSearchType(value as "document" | "parcel")}
          >
            <SelectTrigger className="w-[150px]"><>

              <SelectValue placeholder="Search type" />
            </SelectTrigger>
            <SelectContent
</>><>

              <SelectItem value="document">Documents</SelectItem>
              <SelectItem
</> value="parcel">Parcels</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[250px]"
          />
          
          <Button type="submit" variant="secondary" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="documents">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </div>
          </TabsTrigger>
          <TabsTrigger value="parcels">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>Parcels</span>
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents" className="space-y-4">
          <div className="grid grid-cols-3 gap-4 h-[calc(100vh-300px)]">
            {/* Document list */}
            <Card className="col-span-1">
              <CardHeader><>

                <CardTitle>Documents</CardTitle>
                <CardDescription
</>>Select a document to view linked parcels</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-450px)]">
                  {isLoadingDocuments ? (
                    // Show skeletons when loading
                    Array(5).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center space-x-2 mb-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                      </div>
                    ))
                  ) : documents && documents.length > 0 ? (
                    <div className="space-y-1">
                      {documents.map((doc) => (
                        <Button
                          key={doc.id}
                          variant={selectedDocumentId === doc.id ? "default" : "ghost"}
                          className="w-full justify-start text-left"
                          onClick={() => handleDocumentSelect(doc.id)}
                        >
                          <div className="flex items-center">
                            {getDocumentTypeIcon(doc.type)}
                            <div className="ml-2"><>

                              <p className="font-medium">{doc.name}</p>
                              <p
</> className="text-xs text-muted-foreground">{doc.type}</p>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No documents found
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Document details and linked parcels */}
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {isLoadingSelectedDocument ? (<>

                        <Skeleton className="h-6 w-[200px]" />
                      ) : selectedDocument ? (
                        selectedDocument.name
                      ) : (
                        "Select a document"
                      )}
                    </CardTitle>
                    <CardDescription
</>>
                      {isLoadingSelectedDocument ? (
                        <Skeleton className="h-4 w-[150px]" />
                      ) : selectedDocument ? (
                        `${selectedDocument.type} • Uploaded on ${formatDate(selectedDocument.uploadedAt)}`
                      ) : (
                        "Document details will appear here"
                      )}
                    </CardDescription>
                  </div>
                  
                  {selectedDocument && (
                    <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-1 h-4 w-4" />
                          Link to Parcel
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><>

                          <DialogTitle>Link Document to Parcel</DialogTitle>
                          <DialogDescription
</>>
                            Select a parcel and link type to establish a relationship between this document and a parcel.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4"><>

                            <Label htmlFor="parcel" className="text-right">
                              Parcel
                            </Label>
                            <div
</> className="col-span-3">
                              <Select
                                value={selectedParcelId?.toString() || ""}
                                onValueChange={(value) => setSelectedParcelId(parseInt(value))}
                              >
                                <SelectTrigger><>

                                  <SelectValue placeholder="Select a parcel" />
                                </SelectTrigger>
                                <SelectContent
</>>
                                  {parcels?.map((parcel) => (
                                    <SelectItem key={parcel.id} value={parcel.id.toString()}>
                                      {parcel.parcelNumber} {parcel.address ? `- ${parcel.address}` : ''}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 items-center gap-4"><>

                            <Label htmlFor="linkType" className="text-right">
                              Link Type
                            </Label>
                            <div
</> className="col-span-3">
                              <Select
                                value={linkType}
                                onValueChange={setLinkType}
                              >
                                <SelectTrigger><>

                                  <SelectValue placeholder="Select a link type" />
                                </SelectTrigger>
                                <SelectContent
</>><>

                                  <SelectItem value="legal_description">Legal Description</SelectItem>
                                  <SelectItem
</> value="reference">Reference</SelectItem><>

                                  <SelectItem value="related">Related</SelectItem>
                                  <SelectItem
</> value="ownership">Ownership</SelectItem><>

                                  <SelectItem value="subdivision">Subdivision</SelectItem>
                                  <SelectItem
</> value="transaction">Transaction</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 items-center gap-4"><>

                            <Label htmlFor="notes" className="text-right">
                              Notes
                            </Label>
                            <div
</> className="col-span-3">
                              <Input
                                id="notes"
                                value={linkNotes}
                                onChange={(e) => setLinkNotes(e.target.value)}
                                placeholder="Optional notes about this link"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <DialogFooter><>

                          <Button 
                            variant="outline" 
                            onClick={() => setIsLinkDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
</> 
                            onClick={handleCreateLink}
                            disabled={!selectedParcelId || !selectedDocumentId}
                          >
                            Create Link
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">Linked Parcels</h3>
                
                {isLoadingSelectedDocument ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : selectedDocument && selectedDocument.parcels?.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow><>

                          <TableHead>Parcel Number</TableHead>
                          <TableHead
</>>Address</TableHead><>

                          <TableHead>Link Type</TableHead>
                          <TableHead
</>>Notes</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedDocument.parcels.map((parcel) => (
                          <TableRow key={parcel.id}><>

                            <TableCell className="font-medium">{parcel.parcelNumber}</TableCell>
                            <TableCell
</>>{parcel.address || "N/A"}</TableCell><>

                            <TableCell>{getLinkTypeBadge(parcel.linkType)}</TableCell>
                            <TableCell
</>>{parcel.notes || "N/A"}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleParcelSelect(parcel.id)}
                                ><>

                                  <Info className="h-4 w-4" />
                                </Button>
                                <Button
</> 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleRemoveLink(selectedDocumentId!, parcel.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground border rounded-md">
                    No parcels linked to this document.
                  </div>
                )}
                
                {/* Show content preview for documents that have content */}
                {selectedDocument && selectedDocument.content && (
                  <div className="mt-4"><>

                    <h3 className="text-lg font-semibold mb-2">Document Content</h3>
                    <div
</> className="border rounded-md p-4 max-h-[300px] overflow-auto bg-muted/50">
                      <pre className="text-sm whitespace-pre-wrap">{selectedDocument.content}</pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="parcels" className="space-y-4">
          <div className="grid grid-cols-3 gap-4 h-[calc(100vh-300px)]">
            {/* Parcel list */}
            <Card className="col-span-1">
              <CardHeader><>

                <CardTitle>Parcels</CardTitle>
                <CardDescription
</>>Select a parcel to view linked documents</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-450px)]">
                  {isLoadingParcels ? (
                    // Show skeletons when loading
                    Array(5).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center space-x-2 mb-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[200px]" />
                          <Skeleton className="h-4 w-[150px]" />
                        </div>
                      </div>
                    ))
                  ) : parcels && parcels.length > 0 ? (
                    <div className="space-y-1">
                      {parcels.map((parcel) => (
                        <Button
                          key={parcel.id}
                          variant={selectedParcelId === parcel.id ? "default" : "ghost"}
                          className="w-full justify-start text-left"
                          onClick={() => handleParcelSelect(parcel.id)}
                        >
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 text-primary" />
                            <div className="ml-2"><>

                              <p className="font-medium">{parcel.parcelNumber}</p>
                              <p
</> className="text-xs text-muted-foreground">
                                {parcel.address || (parcel.owner ? `Owner: ${parcel.owner}` : "No address")}
                              </p>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No parcels found
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
            
            {/* Parcel details and linked documents */}
            <Card className="col-span-2">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>
                      {isLoadingSelectedParcel ? (<>

                        <Skeleton className="h-6 w-[200px]" />
                      ) : selectedParcel ? (
                        `Parcel ${selectedParcel.parcelNumber}`
                      ) : (
                        "Select a parcel"
                      )}
                    </CardTitle>
                    <CardDescription
</>>
                      {isLoadingSelectedParcel ? (
                        <Skeleton className="h-4 w-[150px]" />
                      ) : selectedParcel ? (
                        `${selectedParcel.address || 'No address'} • ${selectedParcel.owner ? `Owner: ${selectedParcel.owner}` : 'No owner information'}`
                      ) : (
                        "Parcel details will appear here"
                      )}
                    </CardDescription>
                  </div>
                  
                  {selectedParcel && (
                    <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-1 h-4 w-4" />
                          Link to Document
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><>

                          <DialogTitle>Link Parcel to Document</DialogTitle>
                          <DialogDescription
</>>
                            Select a document and link type to establish a relationship between this parcel and a document.
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4"><>

                            <Label htmlFor="document" className="text-right">
                              Document
                            </Label>
                            <div
</> className="col-span-3">
                              <Select
                                value={selectedDocumentId?.toString() || ""}
                                onValueChange={(value) => setSelectedDocumentId(parseInt(value))}
                              >
                                <SelectTrigger><>

                                  <SelectValue placeholder="Select a document" />
                                </SelectTrigger>
                                <SelectContent
</>>
                                  {documents?.map((doc) => (
                                    <SelectItem key={doc.id} value={doc.id.toString()}>
                                      {doc.name} ({doc.type})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 items-center gap-4"><>

                            <Label htmlFor="linkType" className="text-right">
                              Link Type
                            </Label>
                            <div
</> className="col-span-3">
                              <Select
                                value={linkType}
                                onValueChange={setLinkType}
                              >
                                <SelectTrigger><>

                                  <SelectValue placeholder="Select a link type" />
                                </SelectTrigger>
                                <SelectContent
</>><>

                                  <SelectItem value="legal_description">Legal Description</SelectItem>
                                  <SelectItem
</> value="reference">Reference</SelectItem><>

                                  <SelectItem value="related">Related</SelectItem>
                                  <SelectItem
</> value="ownership">Ownership</SelectItem><>

                                  <SelectItem value="subdivision">Subdivision</SelectItem>
                                  <SelectItem
</> value="transaction">Transaction</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-4 items-center gap-4"><>

                            <Label htmlFor="notes" className="text-right">
                              Notes
                            </Label>
                            <div
</> className="col-span-3">
                              <Input
                                id="notes"
                                value={linkNotes}
                                onChange={(e) => setLinkNotes(e.target.value)}
                                placeholder="Optional notes about this link"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <DialogFooter><>

                          <Button 
                            variant="outline" 
                            onClick={() => setIsLinkDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
</> 
                            onClick={handleCreateLink}
                            disabled={!selectedParcelId || !selectedDocumentId}
                          >
                            Create Link
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedParcel && (
                  <>
                    {/* Parcel map and details */}
                    <div className="mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div><>

                          <h3 className="text-lg font-semibold mb-2">Property Details</h3>
                          <div
</> className="border rounded-md p-4 bg-muted/50">
                            <dl className="grid grid-cols-2 gap-2 text-sm"><>

                              <dt className="font-semibold">Parcel Number:</dt>
                              <dd
</>>{selectedParcel.parcelNumber}</dd><>

                              
                              <dt className="font-semibold">Address:</dt>
                              <dd
</>>{selectedParcel.address || "N/A"}</dd><>

                              
                              <dt className="font-semibold">Owner:</dt>
                              <dd
</>>{selectedParcel.owner || "N/A"}</dd><>

                              
                              <dt className="font-semibold">Acreage:</dt>
                              <dd
</>>{selectedParcel.acreage || "N/A"}</dd><>

                              
                              <dt className="font-semibold">Property Type:</dt>
                              <dd
</>>{selectedParcel.propertyType || "N/A"}</dd><>

                              
                              <dt className="font-semibold">Zoning:</dt>
                              <dd
</>>{selectedParcel.zoning || "N/A"}</dd><>

                              
                              <dt className="font-semibold">Assessed Value:</dt>
                              <dd
</>>{selectedParcel.assessedValue || "N/A"}</dd>
                            </dl>
                          </div>
                        </div>
                        
                        <div><>

                          <h3 className="text-lg font-semibold mb-2">Parcel Map</h3>
                          <div
</> className="border rounded-md overflow-hidden h-[200px]">
                            {selectedParcel.geometry ? (
                              <MapboxMap
                                height={200}
                                geoJsonData={selectedParcel.geometry}
                                initialZoom={14}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-muted/50 text-muted-foreground">
                                No geometry data available
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold mb-2">Linked Documents</h3>
                    
                    {isLoadingSelectedParcel ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : selectedParcel.documents?.length > 0 ? (
                      <div className="border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow><>

                              <TableHead>Document Name</TableHead>
                              <TableHead
</>>Type</TableHead><>

                              <TableHead>Link Type</TableHead>
                              <TableHead
</>>Notes</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedParcel.documents.map((doc) => (
                              <TableRow key={doc.id}><>

                                <TableCell className="font-medium">{doc.name}</TableCell>
                                <TableCell
</> className="flex items-center">
                                  {getDocumentTypeIcon(doc.type)}
                                  <span className="ml-1">{doc.type}</span>
                                </TableCell><>

                                <TableCell>{getLinkTypeBadge(doc.linkType)}</TableCell>
                                <TableCell
</>>{doc.notes || "N/A"}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleDocumentSelect(doc.id)}
                                    ><>

                                      <Info className="h-4 w-4" />
                                    </Button>
                                    <Button
</> 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleRemoveLink(doc.id, selectedParcelId!)}
                                    >
                                      <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground border rounded-md">
                        No documents linked to this parcel.
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}