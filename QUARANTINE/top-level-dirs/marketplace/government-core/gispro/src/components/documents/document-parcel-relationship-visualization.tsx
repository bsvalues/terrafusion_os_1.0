import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
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
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Map, 
  Warning, 
  FileSymlink, 
  Link,
  Search,
  Filter,
  MapPin,
  CalendarIcon,
  ExternalLink,
  Archive,
  Eye,
  Download,
  BarChart3,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Document, Parcel } from '@shared/schema';

interface DocumentWithParcels extends Document {
  linkedParcels: {
    id: number;
    parcelNumber: string;
    address?: string;
    linkType: string;
    linkId: number;
    createdAt?: string;
    confidence?: number;
    status?: 'active' | 'archived' | 'pending';
    owner?: string;
    acreage?: number;
    zoning?: string;
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
    fileSize?: number;
    confidence?: number;
    status?: 'active' | 'archived' | 'pending';
    author?: string;
    classification?: string;
  }[];
}

interface DocumentParcelRelationshipVisualizationProps {
  documentId?: number;
  parcelId?: number;
  showHeader?: boolean;
  compact?: boolean;
  maxHeight?: string;
  onRelationshipClick?: (documentId: number, parcelId: number) => void;
  enableFiltering?: boolean;
  enableSearch?: boolean;
  showActions?: boolean;
  refreshInterval?: number;
}

// Enhanced relationship type labels with descriptions
const documentTypeLabels: Record<string, { label: string; description: string; color: string }> = {
  PROPERTY_DEED: { 
    label: 'Property Deed', 
    description: 'Legal ownership document',
    color: 'bg-blue-100 text-blue-800'
  },
  TAX_RECORD: { 
    label: 'Tax Record', 
    description: 'Property tax assessment',
    color: 'bg-green-100 text-green-800'
  },
  ZONING_PERMIT: { 
    label: 'Zoning Permit', 
    description: 'Land use authorization',
    color: 'bg-purple-100 text-purple-800'
  },
  BUILDING_PERMIT: { 
    label: 'Building Permit', 
    description: 'Construction authorization',
    color: 'bg-orange-100 text-orange-800'
  },
  SURVEY_MAP: { 
    label: 'Survey Map', 
    description: 'Property boundary survey',
    color: 'bg-cyan-100 text-cyan-800'
  },
  EASEMENT: { 
    label: 'Easement', 
    description: 'Property access rights',
    color: 'bg-yellow-100 text-yellow-800'
  },
  ENVIRONMENTAL_REPORT: { 
    label: 'Environmental Report', 
    description: 'Environmental assessment',
    color: 'bg-emerald-100 text-emerald-800'
  },
  APPRAISAL: { 
    label: 'Appraisal', 
    description: 'Property valuation',
    color: 'bg-rose-100 text-rose-800'
  },
  LEGAL_NOTICE: { 
    label: 'Legal Notice', 
    description: 'Legal proceedings or notices',
    color: 'bg-red-100 text-red-800'
  },
  reference: { 
    label: 'General Reference', 
    description: 'General reference document',
    color: 'bg-slate-100 text-slate-800'
  },
  related: { 
    label: 'Related', 
    description: 'Related documentation',
    color: 'bg-gray-100 text-gray-800'
  },
  legal_description: { 
    label: 'Legal Description', 
    description: 'Legal property description',
    color: 'bg-indigo-100 text-indigo-800'
  },
  ownership: { 
    label: 'Ownership', 
    description: 'Ownership records',
    color: 'bg-blue-100 text-blue-800'
  },
  subdivision: { 
    label: 'Subdivision', 
    description: 'Subdivision documentation',
    color: 'bg-teal-100 text-teal-800'
  },
  transaction: { 
    label: 'Transaction', 
    description: 'Property transaction records',
    color: 'bg-amber-100 text-amber-800'
  },
  other: { 
    label: 'Other', 
    description: 'Miscellaneous document',
    color: 'bg-slate-100 text-slate-800'
  }
};

// Status configurations
const statusConfig = {
  active: { label: 'Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-800', icon: Archive },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
};

// Utility functions
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return 'Unknown size';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

const formatConfidence = (confidence?: number): string => {
  if (confidence === undefined) return 'N/A';
  return `${Math.round(confidence * 100)}%`;
};

const getConfidenceColor = (confidence?: number): string => {
  if (confidence === undefined) return 'bg-gray-100 text-gray-800';
  if (confidence >= 0.9) return 'bg-green-100 text-green-800';
  if (confidence >= 0.7) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.3 }
  })
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// API functions
const fetchDocumentRelationships = async (documentId: number): Promise<DocumentWithParcels> => {
  const response = await fetch(`/api/documents/${documentId}/relationships`);
  if (!response.ok) {
    throw new Error('Failed to fetch document relationships');
  }
  return response.json();
};

const fetchParcelRelationships = async (parcelId: number): Promise<ParcelWithDocuments> => {
  const response = await fetch(`/api/parcels/${parcelId}/relationships`);
  if (!response.ok) {
    throw new Error('Failed to fetch parcel relationships');
  }
  return response.json();
};

export function DocumentParcelRelationshipVisualization({ 
  documentId, 
  parcelId,
  showHeader = true,
  compact = false,
  maxHeight = "600px",
  onRelationshipClick,
  enableFiltering = true,
  enableSearch = true,
  showActions = true,
  refreshInterval = 0
}: DocumentParcelRelationshipVisualizationProps) {
  const [linkTypeFilter, setLinkTypeFilter] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'confidence' | 'type'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Query for document relationships
  const { 
    data: documentRelationships, 
    isLoading: isLoadingDocument, 
    error: documentError,
    refetch: refetchDocument
  } = useQuery({
    queryKey: ['documentRelationships', documentId],
    queryFn: () => fetchDocumentRelationships(documentId!),
    enabled: !!documentId,
    refetchInterval: refreshInterval || undefined
  });

  // Query for parcel relationships
  const { 
    data: parcelRelationships, 
    isLoading: isLoadingParcel, 
    error: parcelError,
    refetch: refetchParcel
  } = useQuery({
    queryKey: ['parcelRelationships', parcelId],
    queryFn: () => fetchParcelRelationships(parcelId!),
    enabled: !!parcelId,
    refetchInterval: refreshInterval || undefined
  });

  const isLoading = isLoadingDocument || isLoadingParcel;
  const error = documentError || parcelError;

  // Filter and sort parcels for document view
  const filteredParcels = useMemo(() => {
    if (!documentRelationships?.linkedParcels) return [];
    
    let filtered = documentRelationships.linkedParcels;
    
    // Apply filters
    if (linkTypeFilter) {
      filtered = filtered.filter(p => p.linkType === linkTypeFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.parcelNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.owner?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';
      
      switch (sortBy) {
        case 'name':
          aValue = a.parcelNumber;
          bValue = b.parcelNumber;
          break;
        case 'date':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'confidence':
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        case 'type':
          aValue = a.linkType;
          bValue = b.linkType;
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  }, [documentRelationships?.linkedParcels, linkTypeFilter, statusFilter, searchTerm, sortBy, sortOrder]);

  // Filter and sort documents for parcel view
  const filteredDocuments = useMemo(() => {
    if (!parcelRelationships?.linkedDocuments) return [];
    
    let filtered = parcelRelationships.linkedDocuments;
    
    // Apply filters
    if (linkTypeFilter) {
      filtered = filtered.filter(d => d.linkType === linkTypeFilter);
    }
    if (statusFilter) {
      filtered = filtered.filter(d => d.status === statusFilter);
    }
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.author?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';
      
      switch (sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'date':
          aValue = new Date(a.uploadedAt);
          bValue = new Date(b.uploadedAt);
          break;
        case 'confidence':
          aValue = a.confidence || 0;
          bValue = b.confidence || 0;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  }, [parcelRelationships?.linkedDocuments, linkTypeFilter, statusFilter, searchTerm, sortBy, sortOrder]);

  // Handle refresh
  const handleRefresh = () => {
    if (documentId) refetchDocument();
    if (parcelId) refetchParcel();
  };

  // Clear filters
  const clearFilters = () => {
    setLinkTypeFilter(undefined);
    setStatusFilter(undefined);
    setSearchTerm('');
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className={compact ? 'h-full' : ''}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="h-8 w-8 text-primary" />
            </motion.div>
            <p className="text-sm text-muted-foreground mt-4">Loading relationships...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className={compact ? 'h-full' : ''}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Error Loading Relationships</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Failed to load relationship data. Please try again.
              </p>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Document relationships view (showing parcels linked to document)
  if (documentId && documentRelationships) {
    const document = documentRelationships as DocumentWithParcels;
    
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className={compact ? 'h-full' : ''}>
          {showHeader && (
            <CardHeader className={compact ? 'pb-3' : ''}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className={compact ? 'text-base' : ''}>{document.name}</CardTitle>
                    <CardDescription>
                      {filteredParcels.length} parcel{filteredParcels.length !== 1 ? 's' : ''} linked to this document
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {showActions && (
                    <Button onClick={handleRefresh} variant="ghost" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Badge variant="secondary">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {document.linkedParcels?.length || 0} total
                  </Badge>
                </div>
              </div>
            </CardHeader>
          )}
          
          <CardContent className={compact ? 'px-4 pb-4' : ''}>
            {filteredParcels.length > 0 ? (
              <div className="space-y-4">
                {/* Filters and Search */}
                {enableFiltering && (
                  <motion.div 
                    className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {enableSearch && (
                      <motion.div variants={rowVariants} className="flex-1 min-w-[200px]">
                        <div className="relative">
                          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                          <Input
                            placeholder="Search parcels..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </motion.div>
                    )}
                    
                    <motion.div variants={rowVariants} className="flex items-center gap-2">
                      <Label htmlFor="link-type" className="whitespace-nowrap">Relationship:</Label>
                      <Select value={linkTypeFilter} onValueChange={setLinkTypeFilter}>
                        <SelectTrigger id="link-type" className="w-[160px]">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={undefined}>All types</SelectItem>
                          {Object.entries(documentTypeLabels).map(([value, config]) => (
                            <SelectItem key={value} value={value}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <motion.div variants={rowVariants} className="flex items-center gap-2">
                      <Label htmlFor="status" className="whitespace-nowrap">Status:</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger id="status" className="w-[120px]">
                          <SelectValue placeholder="All status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={undefined}>All status</SelectItem>
                          {Object.entries(statusConfig).map(([value, config]) => (
                            <SelectItem key={value} value={value}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <motion.div variants={rowVariants} className="flex items-center gap-2">
                      <Label htmlFor="sort" className="whitespace-nowrap">Sort by:</Label>
                      <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger id="sort" className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="confidence">Confidence</SelectItem>
                          <SelectItem value="type">Type</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </Button>
                    </motion.div>

                    {(linkTypeFilter || statusFilter || searchTerm) && (
                      <motion.div variants={rowVariants}>
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
                
                {/* Parcels table */}
                <div 
                  className="border rounded-md overflow-hidden"
                  style={{ maxHeight: compact ? maxHeight : undefined, overflow: 'auto' }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcel Number</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Relationship</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Confidence</TableHead>
                        {showActions && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredParcels.map((parcel, index) => {
                          const relationshipConfig = documentTypeLabels[parcel.linkType] || documentTypeLabels.other;
                          const statusConf = statusConfig[parcel.status || 'active'];
                          
                          return (
                            <motion.tr
                              key={parcel.linkId}
                              variants={rowVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              custom={index}
                              className="group hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  <span className="font-mono">{parcel.parcelNumber}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div>{parcel.address || 'No address'}</div>
                                  {parcel.acreage && (
                                    <div className="text-xs text-muted-foreground">
                                      {parcel.acreage} acres
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div>{parcel.owner || 'Unknown'}</div>
                                  {parcel.zoning && (
                                    <Badge variant="outline" className="text-xs">
                                      {parcel.zoning}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge className={relationshipConfig.color}>
                                        {relationshipConfig.label}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{relationshipConfig.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>
                                <Badge className={statusConf.color}>
                                  <statusConf.icon className="h-3 w-3 mr-1" />
                                  {statusConf.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getConfidenceColor(parcel.confidence)}>
                                  {formatConfidence(parcel.confidence)}
                                </Badge>
                              </TableCell>
                              {showActions && (
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onRelationshipClick?.(documentId, parcel.id)}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <motion.div 
                className="text-center py-8 border rounded-md"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <FileSymlink className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-base font-medium mb-2">No linked parcels found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || linkTypeFilter || statusFilter
                    ? 'No parcels match your current filters'
                    : 'This document is not linked to any parcels'
                  }
                </p>
                {(searchTerm || linkTypeFilter || statusFilter) && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Parcel relationships view (showing documents linked to parcel)
  if (parcelId && parcelRelationships) {
    const parcel = parcelRelationships as ParcelWithDocuments;
    
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
      >
        <Card className={compact ? 'h-full' : ''}>
          {showHeader && (
            <CardHeader className={compact ? 'pb-3' : ''}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className={compact ? 'text-base' : ''}>
                      Parcel {parcel.parcelNumber}
                    </CardTitle>
                    <CardDescription>
                      {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''} linked to this parcel
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {showActions && (
                    <Button onClick={handleRefresh} variant="ghost" size="sm">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                  <Badge variant="secondary">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {parcel.linkedDocuments?.length || 0} total
                  </Badge>
                </div>
              </div>
            </CardHeader>
          )}
          
          <CardContent className={compact ? 'px-4 pb-4' : ''}>
            {filteredDocuments.length > 0 ? (
              <div className="space-y-4">
                {/* Filters and Search */}
                {enableFiltering && (
                  <motion.div 
                    className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {enableSearch && (
                      <motion.div variants={rowVariants} className="flex-1 min-w-[200px]">
                        <div className="relative">
                          <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                          <Input
                            placeholder="Search documents..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                      </motion.div>
                    )}
                    
                    <motion.div variants={rowVariants} className="flex items-center gap-2">
                      <Label htmlFor="link-type" className="whitespace-nowrap">Relationship:</Label>
                      <Select value={linkTypeFilter} onValueChange={setLinkTypeFilter}>
                        <SelectTrigger id="link-type" className="w-[160px]">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={undefined}>All types</SelectItem>
                          {Object.entries(documentTypeLabels).map(([value, config]) => (
                            <SelectItem key={value} value={value}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <motion.div variants={rowVariants} className="flex items-center gap-2">
                      <Label htmlFor="status" className="whitespace-nowrap">Status:</Label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger id="status" className="w-[120px]">
                          <SelectValue placeholder="All status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={undefined}>All status</SelectItem>
                          {Object.entries(statusConfig).map(([value, config]) => (
                            <SelectItem key={value} value={value}>{config.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <motion.div variants={rowVariants} className="flex items-center gap-2">
                      <Label htmlFor="sort" className="whitespace-nowrap">Sort by:</Label>
                      <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger id="sort" className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="name">Name</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="confidence">Confidence</SelectItem>
                          <SelectItem value="type">Type</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </Button>
                    </motion.div>

                    {(linkTypeFilter || statusFilter || searchTerm) && (
                      <motion.div variants={rowVariants}>
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
                
                {/* Documents table */}
                <div 
                  className="border rounded-md overflow-hidden"
                  style={{ maxHeight: compact ? maxHeight : undefined, overflow: 'auto' }}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Relationship</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Date</TableHead>
                        {showActions && <TableHead>Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredDocuments.map((document, index) => {
                          const relationshipConfig = documentTypeLabels[document.linkType] || documentTypeLabels.other;
                          const statusConf = statusConfig[document.status || 'active'];
                          
                          return (
                            <motion.tr
                              key={document.linkId}
                              variants={rowVariants}
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              custom={index}
                              className="group hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <div className="space-y-1">
                                    <div>{document.name}</div>
                                    {document.fileSize && (
                                      <div className="text-xs text-muted-foreground">
                                        {formatFileSize(document.fileSize)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {document.type.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {document.author || 'Unknown'}
                              </TableCell>
                              <TableCell>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge className={relationshipConfig.color}>
                                        {relationshipConfig.label}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{relationshipConfig.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </TableCell>
                              <TableCell>
                                <Badge className={statusConf.color}>
                                  <statusConf.icon className="h-3 w-3 mr-1" />
                                  {statusConf.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getConfidenceColor(document.confidence)}>
                                  {formatConfidence(document.confidence)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {new Date(document.uploadedAt).toLocaleDateString()}
                              </TableCell>
                              {showActions && (
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => onRelationshipClick?.(document.id, parcelId)}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <Download className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <motion.div 
                className="text-center py-8 border rounded-md"
                variants={cardVariants}
                initial="hidden"
                animate="visible"
              >
                <FileSymlink className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-base font-medium mb-2">No linked documents found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || linkTypeFilter || statusFilter
                    ? 'No documents match your current filters'
                    : 'This parcel is not linked to any documents'
                  }
                </p>
                {(searchTerm || linkTypeFilter || statusFilter) && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Fallback (no document or parcel ID provided)
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className={compact ? 'h-full' : ''}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Link className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-base font-medium mb-2">No relationship data</h3>
            <p className="text-sm text-muted-foreground">
              Please provide a document ID or parcel ID to view relationships
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}