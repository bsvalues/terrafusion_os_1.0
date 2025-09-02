import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { FileText, Map, Warning, FileSymlink, Link  } from '@mui/icons-material';
import { Document, Parcel } from '@shared/schema';

interface DocumentWithParcels extends Document {
  linkedParcels: {
    id: number;
    parcelNumber: string;
    address?: string;
    linkType: string;
    linkId: number;
  }[];
}

interface ParcelWithDocuments extends Parcel {
  linkedDocuments: {
    id: number;
    name: string;
    type: string;
    uploadedAt: string;
    linkType: string;
    linkId: number;
  }[];
}

interface DocumentParcelRelationshipVisualizationProps {
  documentId?: number;
  parcelId?: number;
  showHeader?: boolean;
}

const documentTypeLabels: Record<string, string> = {
  "reference": "General Reference",
  "related": "Related",
  "legal_description": "Legal Description",
  "ownership": "Ownership",
  "subdivision": "Subdivision",
  "transaction": "Transaction",
  "other": "Other"
};

export function DocumentParcelRelationshipVisualization({ 
  documentId, 
  parcelId,
  showHeader = true
}: DocumentParcelRelationshipVisualizationProps) {
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string | undefined>();
  const [linkTypeFilter, setLinkTypeFilter] = useState<string | undefined>();
  
  // Fetch document-parcel relationship data
  const { 
    data: documentRelationships,
    isLoading: isLoadingDocumentRelationships,
    error: documentRelationshipsError
  } = useQuery({
    queryKey: documentId ? [`/api/documents/${documentId}/relationships`] : ['no-document'],
    enabled: !!documentId,
  });
  
  const { 
    data: parcelRelationships,
    isLoading: isLoadingParcelRelationships,
    error: parcelRelationshipsError
  } = useQuery({
    queryKey: parcelId ? [`/api/parcels/${parcelId}/relationships`] : ['no-parcel'],
    enabled: !!parcelId,
  });
  
  // Loading state
  if ((documentId && isLoadingDocumentRelationships) || (parcelId && isLoadingParcelRelationships)) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-8">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Error state
  if ((documentId && documentRelationshipsError) || (parcelId && parcelRelationshipsError)) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Warning className="h-12 w-12 text-destructive mb-2" /><>

            <h3 className="text-lg font-semibold">Error Loading Relationships</h3>
            <p
</> className="text-sm text-muted-foreground">
              Failed to load relationship data. Please try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // If we have a document ID, show parcels related to document
  if (documentId && documentRelationships) {
    const document = documentRelationships as DocumentWithParcels;
    const parcels = document.linkedParcels || [];
    
    // Filter parcels by link type if filter is active
    const filteredParcels = linkTypeFilter
      ? parcels.filter(p => p.linkType === linkTypeFilter)
      : parcels;
      
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>{document.name}</CardTitle>
            </div>
            <CardDescription>
              Parcels linked to this document
            </CardDescription>
          </CardHeader>
        )}
        
        <CardContent>
          {filteredParcels.length > 0 ? (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><>

                  <Label htmlFor="link-type" className="whitespace-nowrap">Filter by relationship:</Label>
                  <Select
</>
                    value={linkTypeFilter}
                    onValueChange={setLinkTypeFilter}
                  >
                    <SelectTrigger id="link-type" className="w-[180px]"><>

                      <SelectValue placeholder="All relationships" />
                    </SelectTrigger>
                    <SelectContent
</>>
                      <SelectItem value={undefined}>All relationships</SelectItem>
                      {Object.entries(documentTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Parcels table */}
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow><>

                      <TableHead>Parcel Number</TableHead>
                      <TableHead
</>>Address</TableHead>
                      <TableHead>Relationship</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParcels.map((parcel) => (
                      <TableRow key={parcel.linkId}><>

                        <TableCell className="font-medium">{parcel.parcelNumber}</TableCell>
                        <TableCell
</>>{parcel.address || 'No address'}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {documentTypeLabels[parcel.linkType] || parcel.linkType}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md">
              <Map className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" /><>

              <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-1">
                No linked parcels found
              </h3>
              <p
</> className="text-sm text-slate-500 dark:text-slate-400">
                This document is not linked to any parcels
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // If we have a parcel ID, show documents related to parcel
  if (parcelId && parcelRelationships) {
    const parcel = parcelRelationships as ParcelWithDocuments;
    const documents = parcel.linkedDocuments || [];
    
    // Apply filters
    let filteredDocuments = documents;
    
    // Filter by document type if enabled
    if (documentTypeFilter) {
      filteredDocuments = filteredDocuments.filter(doc => doc.type === documentTypeFilter);
    }
    
    // Filter by link type if enabled
    if (linkTypeFilter) {
      filteredDocuments = filteredDocuments.filter(doc => doc.linkType === linkTypeFilter);
    }
    
    return (
      <Card>
        {showHeader && (
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Map className="h-5 w-5 text-primary" />
              <CardTitle>Parcel {parcel.parcelNumber}</CardTitle>
            </div>
            <CardDescription>
              Documents linked to this parcel
            </CardDescription>
          </CardHeader>
        )}
        
        <CardContent>
          {filteredDocuments.length > 0 ? (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2"><>

                  <Label htmlFor="document-type" className="whitespace-nowrap">Filter by type:</Label>
                  <Select
</>
                    value={documentTypeFilter}
                    onValueChange={setDocumentTypeFilter}
                  >
                    <SelectTrigger id="document-type" className="w-[180px]"><>

                      <SelectValue placeholder="All documents" />
                    </SelectTrigger>
                    <SelectContent
</>><>

                      <SelectItem value={undefined}>All documents</SelectItem>
                      <SelectItem
</> value="plat_map">Plat Map</SelectItem><>

                      <SelectItem value="deed">Deed</SelectItem>
                      <SelectItem
</> value="survey">Survey</SelectItem><>

                      <SelectItem value="legal_description">Legal Description</SelectItem>
                      <SelectItem
</> value="boundary_line_adjustment">Boundary Line Adjustment</SelectItem>
                      <SelectItem value="tax_form">Tax Form</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2"><>

                  <Label htmlFor="relationship-type" className="whitespace-nowrap">Filter by relationship:</Label>
                  <Select
</>
                    value={linkTypeFilter}
                    onValueChange={setLinkTypeFilter}
                  >
                    <SelectTrigger id="relationship-type" className="w-[180px]"><>

                      <SelectValue placeholder="All relationships" />
                    </SelectTrigger>
                    <SelectContent
</>>
                      <SelectItem value={undefined}>All relationships</SelectItem>
                      {Object.entries(documentTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Documents table */}
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow><>

                      <TableHead>Document Name</TableHead>
                      <TableHead
</>>Type</TableHead><>

                      <TableHead>Relationship</TableHead>
                      <TableHead
</>>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocuments.map((document) => (
                      <TableRow key={document.linkId}>
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-primary" />
                            {document.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {document.type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {documentTypeLabels[document.linkType] || document.linkType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(document.uploadedAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 border rounded-md">
              <FileSymlink className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" /><>

              <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-1">
                No linked documents found
              </h3>
              <p
</> className="text-sm text-slate-500 dark:text-slate-400">
                This parcel is not linked to any documents
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  // Fallback (no document or parcel ID provided)
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Link className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-3" /><>

          <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-1">
            No relationship data
          </h3>
          <p
</> className="text-sm text-slate-500 dark:text-slate-400">
            Please provide a document ID or parcel ID to view relationships
          </p>
        </div>
      </CardContent>
    </Card>
  );
}