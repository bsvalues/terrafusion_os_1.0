import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Separator,
  Skeleton,
  Alert,
  AlertDescription,
  AlertTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Progress
} from '../ui';
import {
  MapPin,
  Home,
  DollarSign,
  Calendar,
  User,
  FileText,
  AlertCircle,
  ExternalLink,
  Eye,
  Edit,
  Copy,
  Share2,
  Download,
  Bookmark,
  BookmarkPlus,
  Info,
  TrendingUp,
  Building,
  Ruler,
  Map,
  History,
  Tag,
  Clock,
  CheckCircle,
  Layers,
  Search,
  Navigation
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Enhanced parcel data interface
interface ParcelData {
  id: string;
  parcelNumber: string;
  address?: string;
  owner: string;
  ownerAddress?: string;
  acreage: number;
  taxValue: number;
  marketValue: number;
  yearBuilt?: number;
  propertyType: string;
  zoning?: string;
  legalDescription: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  boundaries?: Array<{
    lat: number;
    lng: number;
  }>;
  metadata?: {
    lastUpdated: Date;
    dataSource: string;
    accuracy: number;
    verified: boolean;
    confidenceScore?: number;
  };
  associatedDocuments?: Array<{
    id: string;
    name: string;
    type: string;
    uploadDate: Date;
  }>;
  taxHistory?: Array<{
    year: number;
    assessedValue: number;
    taxesPaid: number;
  }>;
  sales?: Array<{
    date: Date;
    price: number;
    type: string;
  }>;
  improvements?: Array<{
    type: string;
    yearBuilt: number;
    sqft?: number;
    value: number;
  }>;
}

interface ParcelQuickViewProps {
  parcelId: string;
  triggerElement: React.ReactNode;
  viewType?: 'popover' | 'dialog' | 'drawer';
  showFullDetails?: boolean;
  onParcelSelect?: (parcelId: string) => void;
  onEditParcel?: (parcelId: string) => void;
  onViewDocuments?: (parcelId: string) => void;
  className?: string;
}

/**
 * Parcel Quick View component with responsive display modes
 * Provides comprehensive parcel information in popover, dialog, or drawer format
 * based on screen size and user preference.
 */
export function ParcelQuickView({
  parcelId,
  triggerElement,
  viewType = 'popover',
  showFullDetails = false,
  onParcelSelect,
  onEditParcel,
  onViewDocuments,
  className
}: ParcelQuickViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [parcelData, setParcelData] = useState<ParcelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fetch parcel data
  useEffect(() => {
    if (isOpen && parcelId) {
      fetchParcelData();
    }
  }, [isOpen, parcelId]);

  const fetchParcelData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual service
      const response = await fetch(`/api/parcels/${parcelId}`);
      if (!response.ok) throw new Error('Failed to fetch parcel data');
      
      const data = await response.json();
      setParcelData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load parcel data');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Content component that can be reused across different view types
  const ParcelContent = () => {
    if (loading) {
      return (
        <div className="space-y-4 p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-3"
            onClick={fetchParcelData}
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (!parcelData) {
      return (
        <div className="p-4 text-center text-muted-foreground">
          No parcel data available
        </div>
      );
    }

    // Compact view for popover
    if (viewType === 'popover' && !showFullDetails) {
      return (
        <div className="w-80 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-base">{parcelData.parcelNumber}</h3>
              {parcelData.address && (
                <p className="text-sm text-muted-foreground">{parcelData.address}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsBookmarked(!isBookmarked)}
              >
                {isBookmarked ? (
                  <Bookmark className="h-4 w-4 fill-current" />
                ) : (
                  <BookmarkPlus className="h-4 w-4" />
                )}
              </Button>
              {parcelData.metadata?.verified && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
          </div>

          {/* Key information */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Owner</p>
              <p className="font-medium">{parcelData.owner}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Acreage</p>
              <p className="font-medium">{parcelData.acreage.toFixed(2)} ac</p>
            </div>
            <div>
              <p className="text-muted-foreground">Tax Value</p>
              <p className="font-medium">{formatCurrency(parcelData.taxValue)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium">{parcelData.propertyType}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onParcelSelect?.(parcelId)}
            >
              <Eye className="h-3 w-3 mr-1" />
              View Full
            </Button>
            {onEditParcel && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onEditParcel(parcelId)}
              >
                <Edit className="h-3 w-3" />
              </Button>
            )}
            {onViewDocuments && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onViewDocuments(parcelId)}
              >
                <FileText className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      );
    }

    // Full detailed view for dialog/drawer
    return (
      <div className="space-y-6">
        {/* Header with actions */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{parcelData.parcelNumber}</h2>
            {parcelData.address && (
              <p className="text-muted-foreground">{parcelData.address}</p>
            )}
            {parcelData.metadata && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {parcelData.metadata.dataSource}
                </Badge>
                {parcelData.metadata.verified && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {parcelData.metadata.confidenceScore && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    {(parcelData.metadata.confidenceScore * 100).toFixed(0)}% confidence
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBookmarked(!isBookmarked)}
            >
              {isBookmarked ? (
                <Bookmark className="h-4 w-4 fill-current" />
              ) : (
                <BookmarkPlus className="h-4 w-4" />
              )}
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabbed content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ownership">Ownership</TabsTrigger>
            <TabsTrigger value="valuation">Valuation</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <Ruler className="h-4 w-4" />
                    Property Size
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{parcelData.acreage.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">acres</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    Property Type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-semibold">{parcelData.propertyType}</div>
                  {parcelData.zoning && (
                    <p className="text-xs text-muted-foreground">Zone: {parcelData.zoning}</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Year Built
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {parcelData.yearBuilt || 'N/A'}
                  </div>
                  {parcelData.yearBuilt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date().getFullYear() - parcelData.yearBuilt} years old
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Legal Description */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Legal Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {parcelData.legalDescription}
                </p>
              </CardContent>
            </Card>

            {/* Improvements */}
            {parcelData.improvements && parcelData.improvements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Home className="h-4 w-4" />
                    Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {parcelData.improvements.map((improvement, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium">{improvement.type}</p>
                          <p className="text-xs text-muted-foreground">
                            Built: {improvement.yearBuilt}
                            {improvement.sqft && ` • ${improvement.sqft.toLocaleString()} sq ft`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(improvement.value)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Ownership Tab */}
          <TabsContent value="ownership" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Current Owner
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold">{parcelData.owner}</p>
                  {parcelData.ownerAddress && (
                    <p className="text-sm text-muted-foreground">{parcelData.ownerAddress}</p>
                  )}
                </div>
                
                {parcelData.metadata?.lastUpdated && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    Last updated: {formatDate(parcelData.metadata.lastUpdated)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sales History */}
            {parcelData.sales && parcelData.sales.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <History className="h-4 w-4" />
                    Sales History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {parcelData.sales.map((sale, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium">{formatDate(sale.date)}</p>
                          <p className="text-xs text-muted-foreground">{sale.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">{formatCurrency(sale.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Valuation Tab */}
          <TabsContent value="valuation" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Tax Value
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(parcelData.taxValue)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Market Value
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(parcelData.marketValue)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tax History */}
            {parcelData.taxHistory && parcelData.taxHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    Tax History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {parcelData.taxHistory.slice(0, 5).map((tax, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                        <div>
                          <p className="font-medium">{tax.year}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(tax.assessedValue)}</p>
                          <p className="text-xs text-muted-foreground">
                            Tax: {formatCurrency(tax.taxesPaid)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4">
            {parcelData.associatedDocuments && parcelData.associatedDocuments.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    Associated Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {parcelData.associatedDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.type} • {formatDate(doc.uploadDate)}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No documents associated with this parcel</p>
                  {onViewDocuments && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3"
                      onClick={() => onViewDocuments(parcelId)}
                    >
                      Browse Documents
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Action buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={() => onParcelSelect?.(parcelId)}>
            <Map className="h-4 w-4 mr-1" />
            View on Map
          </Button>
          {onEditParcel && (
            <Button variant="outline" onClick={() => onEditParcel(parcelId)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit Details
            </Button>
          )}
          {onViewDocuments && (
            <Button variant="outline" onClick={() => onViewDocuments(parcelId)}>
              <FileText className="h-4 w-4 mr-1" />
              View Documents
            </Button>
          )}
        </div>
      </div>
    );
  };

  // Responsive view selection
  if (viewType === 'popover') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          {triggerElement}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <ParcelContent />
        </PopoverContent>
      </Popover>
    );
  }

  if (viewType === 'dialog') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {triggerElement}
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <ParcelContent />
        </DialogContent>
      </Dialog>
    );
  }

  // Drawer view (mobile)
  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        {triggerElement}
      </DrawerTrigger>
      <DrawerContent>
        <div className="px-4 py-4 max-w-md mx-auto w-full">
          <ParcelContent />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default ParcelQuickView;