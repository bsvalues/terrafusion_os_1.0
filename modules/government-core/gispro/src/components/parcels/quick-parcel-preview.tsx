import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  Progress,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
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
  Navigation,
  ChevronRight,
  ChevronLeft,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';

// Enhanced parcel data interface for preview
interface QuickParcelData {
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
  recentActivity?: Array<{
    type: 'sale' | 'permit' | 'tax' | 'document' | 'zoning';
    date: Date;
    description: string;
    value?: number;
  }>;
  neighborParcels?: Array<{
    id: string;
    parcelNumber: string;
    distance: number;
    relationship: 'adjacent' | 'nearby' | 'same-owner';
  }>;
  trends?: {
    valueChange: number;
    marketTrend: 'increasing' | 'decreasing' | 'stable';
    neighborhood: string;
  };
  quickStats?: {
    averageNeighborhoodValue: number;
    comparativeRanking: number;
    daysOnMarket?: number;
  };
}

interface QuickParcelPreviewProps {
  parcelId?: string;
  parcelData?: QuickParcelData;
  isVisible: boolean;
  position?: {
    x: number;
    y: number;
  };
  onClose: () => void;
  onExpand?: () => void;
  onNavigateToParcel?: (parcelId: string) => void;
  onEditParcel?: (parcelId: string) => void;
  onViewDocuments?: (parcelId: string) => void;
  onBookmark?: (parcelId: string, bookmarked: boolean) => void;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * Quick Parcel Preview component for rapid parcel information display
 * Optimized for map hover states and quick reference viewing
 * Provides essential parcel data in a compact, responsive format.
 */
export function QuickParcelPreview({
  parcelId,
  parcelData: providedData,
  isVisible,
  position = { x: 0, y: 0 },
  onClose,
  onExpand,
  onNavigateToParcel,
  onEditParcel,
  onViewDocuments,
  onBookmark,
  size = 'medium',
  className
}: QuickParcelPreviewProps) {
  const [parcelData, setParcelData] = useState<QuickParcelData | null>(providedData || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'activity' | 'neighbors'>('overview');
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch parcel data if not provided
  useEffect(() => {
    if (isVisible && parcelId && !providedData) {
      fetchQuickParcelData();
    }
  }, [isVisible, parcelId, providedData]);

  const fetchQuickParcelData = async () => {
    if (!parcelId) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate API call - replace with actual service
      const response = await fetch(`/api/parcels/${parcelId}/quick`);
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

  // Format compact currency (e.g., $1.2M)
  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {
      return formatCurrency(amount);
    }
  };

  // Format date
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Handle bookmark toggle
  const handleBookmark = useCallback(() => {
    if (!parcelData) return;
    
    const newBookmarkedState = !isBookmarked;
    setIsBookmarked(newBookmarkedState);
    onBookmark?.(parcelData.id, newBookmarkedState);
  }, [isBookmarked, parcelData, onBookmark]);

  // Calculate position for preview popup
  const getPreviewStyle = () => {
    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      maxHeight: '80vh',
      overflowY: 'auto'
    };

    if (position) {
      // Position to the right and below the cursor
      style.left = position.x + 10;
      style.top = position.y + 10;
      
      // Ensure it doesn't go off screen
      if (typeof window !== 'undefined') {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust if too close to right edge
        if (position.x + 350 > viewportWidth) {
          style.left = position.x - 360;
        }
        
        // Adjust if too close to bottom edge
        if (position.y + 400 > viewportHeight) {
          style.top = position.y - 410;
        }
      }
    }

    return style;
  };

  // Size configurations
  const sizeConfig = {
    small: {
      width: 'w-72',
      padding: 'p-3',
      titleSize: 'text-sm font-semibold',
      textSize: 'text-xs'
    },
    medium: {
      width: 'w-80',
      padding: 'p-4',
      titleSize: 'text-base font-semibold',
      textSize: 'text-sm'
    },
    large: {
      width: 'w-96',
      padding: 'p-5',
      titleSize: 'text-lg font-semibold',
      textSize: 'text-sm'
    }
  };

  const config = sizeConfig[size];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        style={getPreviewStyle()}
        className={cn(
          'bg-background border rounded-lg shadow-lg',
          config.width,
          className
        )}
      >
        {loading ? (
          <div className={cn('space-y-3', config.padding)}>
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : error ? (
          <div className={config.padding}>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className={config.textSize}>{error}</AlertDescription>
            </Alert>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={fetchQuickParcelData}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        ) : !parcelData ? (
          <div className={cn('text-center text-muted-foreground', config.padding)}>
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className={config.textSize}>No parcel data available</p>
          </div>
        ) : (
          <div className={config.padding}>
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className={cn(config.titleSize, 'truncate')}>{parcelData.parcelNumber}</h3>
                {parcelData.address && (
                  <p className={cn(config.textSize, 'text-muted-foreground truncate')}>
                    {parcelData.address}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {parcelData.metadata?.verified && (
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {parcelData.trends?.marketTrend && (
                    <Badge 
                      variant={parcelData.trends.marketTrend === 'increasing' ? 'default' : 
                              parcelData.trends.marketTrend === 'decreasing' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      <TrendingUp className={cn(
                        'h-3 w-3 mr-1',
                        parcelData.trends.marketTrend === 'decreasing' && 'rotate-180'
                      )} />
                      {parcelData.trends.marketTrend}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1 ml-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBookmark}
                        className="h-8 w-8 p-0"
                      >
                        {isBookmarked ? (
                          <Bookmark className="h-4 w-4 fill-current" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {onExpand && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setIsExpanded(!isExpanded);
                            onExpand();
                          }}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <Minimize2 className="h-4 w-4" />
                          ) : (
                            <Maximize2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isExpanded ? 'Minimize' : 'Expand details'}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* View selector for larger sizes */}
            {size !== 'small' && (
              <div className="flex border rounded-lg p-1 mb-4 bg-muted/30">
                {(['overview', 'activity', 'neighbors'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setCurrentView(view)}
                    className={cn(
                      'flex-1 px-2 py-1 rounded text-xs transition-colors',
                      currentView === view
                        ? 'bg-background shadow-sm font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {view.charAt(0).toUpperCase() + view.slice(1)}
                  </button>
                ))}
              </div>
            )}

            {/* Content based on current view */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                {(currentView === 'overview' || size === 'small') && (
                  <React.Fragment>
                    {/* Key metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className={cn(config.textSize, 'text-muted-foreground')}>Owner</p>
                        <p className={cn(config.textSize, 'font-medium truncate')}>{parcelData.owner}</p>
                      </div>
                      <div className="space-y-1">
                        <p className={cn(config.textSize, 'text-muted-foreground')}>Acreage</p>
                        <p className={cn(config.textSize, 'font-medium')}>{parcelData.acreage.toFixed(2)} ac</p>
                      </div>
                      <div className="space-y-1">
                        <p className={cn(config.textSize, 'text-muted-foreground')}>Tax Value</p>
                        <p className={cn(config.textSize, 'font-medium text-blue-600')}>
                          {formatCompactCurrency(parcelData.taxValue)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className={cn(config.textSize, 'text-muted-foreground')}>Type</p>
                        <p className={cn(config.textSize, 'font-medium truncate')}>{parcelData.propertyType}</p>
                      </div>
                    </div>

                    {/* Quick stats for medium/large */}
                    {size !== 'small' && parcelData.quickStats && (
                      <div className="border rounded-lg p-3 bg-muted/30">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Neighborhood Avg</p>
                            <p className="font-medium">
                              {formatCompactCurrency(parcelData.quickStats.averageNeighborhoodValue)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Ranking</p>
                            <p className="font-medium">
                              Top {parcelData.quickStats.comparativeRanking}%
                            </p>
                          </div>
                        </div>
                        
                        {parcelData.trends && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <p className="text-muted-foreground text-xs">Value Change</p>
                              <p className={cn(
                                'text-xs font-medium',
                                parcelData.trends.valueChange > 0 ? 'text-green-600' : 
                                parcelData.trends.valueChange < 0 ? 'text-red-600' : 'text-gray-600'
                              )}>
                                {parcelData.trends.valueChange > 0 ? '+' : ''}
                                {parcelData.trends.valueChange.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                )}

                {currentView === 'activity' && size !== 'small' && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <History className="h-4 w-4" />
                      Recent Activity
                    </h4>
                    {parcelData.recentActivity && parcelData.recentActivity.length > 0 ? (
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {parcelData.recentActivity.slice(0, 5).map((activity, index) => (
                            <div key={index} className="flex items-start gap-2 p-2 border rounded">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium">{activity.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatDate(activity.date)}
                                </p>
                              </div>
                              {activity.value && (
                                <p className="text-xs font-medium text-green-600">
                                  {formatCompactCurrency(activity.value)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No recent activity
                      </p>
                    )}
                  </div>
                )}

                {currentView === 'neighbors' && size !== 'small' && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Nearby Parcels
                    </h4>
                    {parcelData.neighborParcels && parcelData.neighborParcels.length > 0 ? (
                      <ScrollArea className="h-32">
                        <div className="space-y-2">
                          {parcelData.neighborParcels.slice(0, 4).map((neighbor) => (
                            <div key={neighbor.id} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{neighbor.parcelNumber}</p>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-xs">
                                    {neighbor.relationship}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {neighbor.distance.toFixed(0)}ft
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => onNavigateToParcel?.(neighbor.id)}
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No nearby parcels found
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex gap-2 pt-3 border-t mt-4">
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => onNavigateToParcel?.(parcelData.id)}
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
              
              {size !== 'small' && (
                <React.Fragment>
                  {onEditParcel && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="px-2"
                            onClick={() => onEditParcel(parcelData.id)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit parcel</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  {onViewDocuments && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="px-2"
                            onClick={() => onViewDocuments(parcelData.id)}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View documents</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="px-2"
                          onClick={() => {
                            navigator.clipboard.writeText(parcelData.parcelNumber);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy parcel number</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </React.Fragment>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default QuickParcelPreview;
