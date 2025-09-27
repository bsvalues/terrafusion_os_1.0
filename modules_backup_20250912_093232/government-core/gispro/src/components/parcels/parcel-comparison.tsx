import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Card,
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
  TooltipTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
  Switch,
  Slider,} from '../ui';
import {MapPin,
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
  RefreshCw,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Settings,
  MoreVertical,
  Plus,
  Minus,
  Save,
  RotateCcw,} from 'lucide-react';
import {cn} from '../../lib/utils';

// Parcel comparison data interface
interface ParcelComparisonData {id: string;
  parcelNumber: string;
  address?: string;
  owner: string;
  acreage: number;
  taxValue: number;
  marketValue: number;
  yearBuilt?: number;
  propertyType: string;
  zoning?: string;
  lastSaleDate?: Date;
  lastSalePrice?: number;
  coordinates?: {
    lat: number;
    lng: number;};
  metadata?: {verified: boolean;
    dataSource: string;
    lastUpdated: Date;
    confidenceScore?: number;};
  trends?: {valueChange: number;
    marketTrend: 'increasing' | 'decreasing' | 'stable';};
  score?: number; // Comparison match score
  distance?: number; // Distance from reference parcel
}

interface ComparisonCriteria {propertyType: boolean;
  priceRange: boolean;
  acreageRange: boolean;
  yearBuiltRange: boolean;
  location: boolean;
  zoning: boolean;
  marketTrend: boolean;}

interface ComparisonFilters {maxDistance: number; // miles
  priceVariance: number; // percentage
  acreageVariance: number; // percentage
  yearBuiltRange: number; // years
  includeUnverified: boolean;
  minConfidenceScore: number;
  propertyTypes: string[];
  zoningTypes: string[];}

interface ParcelComparisonProps {referenceParcels: string[]; // IDs of parcels to compare against
  className?: string;
  maxComparisons?: number;
  autoRefresh?: boolean;
  onParcelSelect?: (parcelId: string) => void;
  onComparisonSave?: (comparisonData: any) => void;
  onExportComparison?: (format: 'pdf' | 'excel' | 'csv') => void;}

/**
 * Parcel Comparison component for side-by-side parcel analysis
 * Provides comprehensive comparison tools with customizable criteria,
 * filtering options, and detailed analysis capabilities.
 */
export function ParcelComparison({referenceParcels,
  className,
  maxComparisons = 10,
  autoRefresh = false,
  onParcelSelect,
  onComparisonSave,
  onExportComparison,}: ParcelComparisonProps) {const [comparisonData, setComparisonData] = useState<ParcelComparisonData[]>([]);
  const [referenceData, setReferenceData] = useState<ParcelComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'grid' | 'list' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'score' | 'price' | 'acreage' | 'distance' | 'year'>(
    'score'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Comparison criteria and filters
  const [criteria, setCriteria] = useState<ComparisonCriteria>({
    propertyType: true,
    priceRange: true,
    acreageRange: true,
    yearBuiltRange: false,
    location: true,
    zoning: false,
    marketTrend: false,});

  const [filters, setFilters] = useState<ComparisonFilters>({maxDistance: 5.0,
    priceVariance: 25,
    acreageVariance: 50,
    yearBuiltRange: 10,
    includeUnverified: false,
    minConfidenceScore: 0.7,
    propertyTypes: [],
    zoningTypes: [],});

  // Fetch comparison data
  useEffect(() =>{if (referenceParcels.length > 0) {
      fetchComparisonData();}
  }, [referenceParcels, criteria, filters]);

  // Auto-refresh functionality
  useEffect(() => {if (autoRefresh) {
      const interval = setInterval(fetchComparisonData, 30000); // 30 seconds
      return () => clearInterval(interval);}
  }, [autoRefresh, criteria, filters]);

  const fetchComparisonData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch reference parcel data
      const referencePromises = referenceParcels.map(id =>
        fetch(`/api/parcels/${id}`).then(res => res.json())
      );
      const referenceResults = await Promise.all(referencePromises);
      setReferenceData(referenceResults);

      // Fetch comparison parcels based on criteria and filters
      const comparisonResponse = await fetch('/api/parcels/compare', {method: 'POST',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify({referenceParcels,
          criteria,
          filters,
          maxResults: maxComparisons,}),
      });

      if (!comparisonResponse.ok) throw new Error('Failed to fetch comparison data');

      const comparisonResults = await comparisonResponse.json();
      setComparisonData(comparisonResults);
    } catch (err) {setError(err instanceof Error ? err.message : 'Failed to load comparison data');} finally {setLoading(false);}
  };

  // Format currency
  const formatCurrency = (amount: number) => {return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,}).format(amount);
  };

  // Format compact currency
  const formatCompactCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    } else {return formatCurrency(amount);}
  };

  // Format date
  const formatDate = (date: Date) => {return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',});
  };

  // Calculate comparison score color
  const getScoreColor = (score: number) => {if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';};

  // Sort comparison data
  const sortedData = useMemo(() => {return [...comparisonData].sort((a, b) => {
      let aVal: number, bVal: number;

      switch (sortBy) {
        case 'score':
          aVal = a.score || 0;
          bVal = b.score || 0;
          break;
        case 'price':
          aVal = a.taxValue;
          bVal = b.taxValue;
          break;
        case 'acreage':
          aVal = a.acreage;
          bVal = b.acreage;
          break;
        case 'distance':
          aVal = a.distance || 0;
          bVal = b.distance || 0;
          break;
        case 'year':
          aVal = a.yearBuilt || 0;
          bVal = b.yearBuilt || 0;
          break;
        default:
          return 0;}

      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }, [comparisonData, sortBy, sortOrder]);

  // Criteria toggle handler
  const handleCriteriaChange = (key: keyof ComparisonCriteria, value: boolean) => {setCriteria(prev => ({ ...prev, [key]: value}));
  };

  // Filter change handler
  const handleFilterChange = (key: keyof ComparisonFilters, value: any) => {setFilters(prev => ({ ...prev, [key]: value}));
  };

  // Reset filters to defaults
  const resetFilters = () => {setFilters({
      maxDistance: 5.0,
      priceVariance: 25,
      acreageVariance: 50,
      yearBuiltRange: 10,
      includeUnverified: false,
      minConfidenceScore: 0.7,
      propertyTypes: [],
      zoningTypes: [],});
  };

  // Save comparison configuration
  const saveComparison = () => {const comparisonConfig = {
      referenceParcels,
      criteria,
      filters,
      results: comparisonData,
      savedAt: new Date(),};
    onComparisonSave?.(comparisonConfig);
  };

  if (referenceParcels.length === 0) {
    return (<Card className={className}><CardContent className="text-center py-8"><Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">No Reference Parcels Selected</h3><p className="text-muted-foreground">Select one or more parcels to begin comparison analysis</p></CardContent></Card>);
  }

  return (<div className={cn('space-y-6', className)}>{/* Header and Controls */}<div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold">Parcel Comparison</h2><p className="text-muted-foreground">Comparing against {referenceParcels.length} reference parcel
            {referenceParcels.length > 1 ? 's' : ''}</p></div><div className="flex items-center gap-2">{/* View toggle */}<div className="flex border rounded-lg p-1">{[
              {key: 'grid', icon: Grid},
              {key: 'list', icon: List},
              {key: 'table', icon: FileText},
            ].map(({key, icon: Icon}) => (<button
                key={key}
                onClick={() => setCurrentView(key as any)}
                className={cn(
                  'p-2 rounded transition-colors',
                  currentView === key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
              ><Icon className="h-4 w-4" /></button>))}</div>{/* Sort controls */}<Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="score">Match Score</SelectItem><SelectItem value="price">Price</SelectItem><SelectItem value="acreage">Acreage</SelectItem><SelectItem value="distance">Distance</SelectItem><SelectItem value="year">Year Built</SelectItem></SelectContent></Select><Button
            variant="outline"
            size="sm"
            onClick={() =>setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? (<SortAsc className="h-4 w-4" />) : (<SortDesc className="h-4 w-4" />)}</Button>{/* Filter toggle */}<Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}><Filter className="h-4 w-4 mr-1" />Filters</Button>{/* Settings */}<Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}><Settings className="h-4 w-4" /></Button>{/* Refresh */}<Button variant="outline" size="sm" onClick={fetchComparisonData} disabled={loading}><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></Button>{/* Actions menu */}<TooltipProvider><Tooltip><TooltipTrigger asChild><Button variant="outline" size="sm"><MoreVertical className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><div className="space-y-1"><Button variant="ghost" size="sm" onClick={saveComparison}><Save className="h-3 w-3 mr-1" />Save Comparison</Button><Button variant="ghost" size="sm" onClick={() => onExportComparison?.('pdf')}><Download className="h-3 w-3 mr-1" />Export PDF</Button><Button variant="ghost" size="sm" onClick={() => onExportComparison?.('excel')}><Download className="h-3 w-3 mr-1" />Export Excel</Button></div></TooltipContent></Tooltip></TooltipProvider></div></div>{/* Filters Panel */}<AnimatePresence>{showFilters && (<motion.div
            initial={{ opacity: 0, height: 0}}
            animate={{ opacity: 1, height: 'auto'}}
            exit={{ opacity: 0, height: 0}}
            transition={{ duration: 0.2}}
          ><Card><CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><Filter className="h-5 w-5" />Comparison Filters</CardTitle></CardHeader><CardContent className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{/* Distance filter */}<div className="space-y-2"><Label>Maximum Distance (miles)</Label><Slider
                      value={[filters.maxDistance]}
                      onValueChange={([value]) => handleFilterChange('maxDistance', value)}
                      max={50}
                      min={0.5}
                      step={0.5}
                      className="w-full"
                    /><div className="text-sm text-muted-foreground">{filters.maxDistance} miles</div></div>{/* Price variance */}<div className="space-y-2"><Label>Price Variance (%)</Label><Slider
                      value={[filters.priceVariance]}
                      onValueChange={([value]) => handleFilterChange('priceVariance', value)}
                      max={100}
                      min={5}
                      step={5}
                      className="w-full"
                    /><div className="text-sm text-muted-foreground">±{filters.priceVariance}%</div></div>{/* Acreage variance */}<div className="space-y-2"><Label>Acreage Variance (%)</Label><Slider
                      value={[filters.acreageVariance]}
                      onValueChange={([value]) => handleFilterChange('acreageVariance', value)}
                      max={200}
                      min={10}
                      step={10}
                      className="w-full"
                    /><div className="text-sm text-muted-foreground">±{filters.acreageVariance}%</div></div>{/* Year built range */}<div className="space-y-2"><Label>Year Built Range (years)</Label><Slider
                      value={[filters.yearBuiltRange]}
                      onValueChange={([value]) => handleFilterChange('yearBuiltRange', value)}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    /><div className="text-sm text-muted-foreground">±{filters.yearBuiltRange} years</div></div>{/* Confidence score */}<div className="space-y-2"><Label>Minimum Confidence Score</Label><Slider
                      value={[filters.minConfidenceScore]}
                      onValueChange={([value]) => handleFilterChange('minConfidenceScore', value)}
                      max={1}
                      min={0}
                      step={0.1}
                      className="w-full"
                    /><div className="text-sm text-muted-foreground">{(filters.minConfidenceScore * 100).toFixed(0)}%</div></div>{/* Include unverified */}<div className="space-y-2"><div className="flex items-center space-x-2"><Switch
                        id="include-unverified"
                        checked={filters.includeUnverified}
                        onCheckedChange={checked =>
                          handleFilterChange('includeUnverified', checked)}
                      /><Label htmlFor="include-unverified">Include Unverified Data</Label></div></div></div><div className="flex justify-end gap-2 pt-4 border-t"><Button variant="outline" onClick={resetFilters}><RotateCcw className="h-4 w-4 mr-1" />Reset Filters</Button><Button onClick={fetchComparisonData}>Apply Filters</Button></div></CardContent></Card></motion.div>)}</AnimatePresence>{/* Criteria Selection Panel */}<AnimatePresence>{showSettings && (<motion.div
            initial={{ opacity: 0, height: 0}}
            animate={{ opacity: 1, height: 'auto'}}
            exit={{ opacity: 0, height: 0}}
            transition={{ duration: 0.2}}
          ><Card><CardHeader className="pb-4"><CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5" />Comparison Criteria</CardTitle></CardHeader><CardContent><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Object.entries(criteria).map(([key, value]) => (<div key={key} className="flex items-center space-x-2"><Switch
                        id={key}
                        checked={value}
                        onCheckedChange={checked =>
                          handleCriteriaChange(key as keyof ComparisonCriteria, checked)}
                      /><Label htmlFor={key} className="text-sm">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label></div>))}</div></CardContent></Card></motion.div>)}</AnimatePresence>{/* Reference Parcels Summary */}
      {referenceData.length > 0 && (<Card><CardHeader><CardTitle className="text-lg">Reference Parcels</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{referenceData.map(parcel => (<div key={parcel.id} className="p-3 border rounded-lg bg-muted/30"><h4 className="font-semibold">{parcel.parcelNumber}</h4>{parcel.address && (<p className="text-sm text-muted-foreground">{parcel.address}</p>)}<div className="grid grid-cols-2 gap-2 mt-2 text-xs"><div><span className="text-muted-foreground">Owner:</span><p className="font-medium truncate">{parcel.owner}</p></div><div><span className="text-muted-foreground">Value:</span><p className="font-medium">{formatCompactCurrency(parcel.taxValue)}</p></div><div><span className="text-muted-foreground">Acreage:</span><p className="font-medium">{parcel.acreage.toFixed(2)} ac</p></div><div><span className="text-muted-foreground">Type:</span><p className="font-medium">{parcel.propertyType}</p></div></div></div>))}</div></CardContent></Card>)}

      {/* Comparison Results */}<Card><CardHeader><CardTitle className="text-lg">Comparison Results ({sortedData.length} parcels)</CardTitle></CardHeader><CardContent>{loading ? (<div className="space-y-4">{Array.from({length: 3}).map((_, i) => (<div key={i} className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-20 w-full" /></div>))}</div>) : error ? (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>) : sortedData.length === 0 ? (<div className="text-center py-8"><Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">No Comparison Results</h3><p className="text-muted-foreground">No parcels match the current criteria and filters</p><Button variant="outline" className="mt-4" onClick={() =>setShowFilters(true)}>
                Adjust Filters</Button></div>) : (<div className="space-y-4">{currentView === 'grid' && (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{sortedData.map(parcel => (<Card key={parcel.id} className="hover:shadow-md transition-shadow"><CardHeader className="pb-3"><div className="flex items-start justify-between"><div className="flex-1 min-w-0"><CardTitle className="text-base truncate">{parcel.parcelNumber}</CardTitle>{parcel.address && (<CardDescription className="truncate">{parcel.address}</CardDescription>)}</div>{parcel.score && (<Badge variant="outline" className={getScoreColor(parcel.score)}>{(parcel.score * 100).toFixed(0)}% match</Badge>)}</div></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-2 text-sm"><div><p className="text-muted-foreground">Owner</p><p className="font-medium truncate">{parcel.owner}</p></div><div><p className="text-muted-foreground">Type</p><p className="font-medium">{parcel.propertyType}</p></div><div><p className="text-muted-foreground">Tax Value</p><p className="font-medium text-green-600">{formatCompactCurrency(parcel.taxValue)}</p></div><div><p className="text-muted-foreground">Acreage</p><p className="font-medium">{parcel.acreage.toFixed(2)} ac</p></div>{parcel.distance && (<div className="col-span-2"><p className="text-muted-foreground">Distance</p><p className="font-medium">{parcel.distance.toFixed(1)} miles</p></div>)}</div><div className="flex gap-2 pt-2 border-t"><Button
                            size="sm"
                            className="flex-1"
                            onClick={() => onParcelSelect?.(parcel.id)}
                          ><Eye className="h-3 w-3 mr-1" />View</Button><Button variant="outline" size="sm"><Copy className="h-3 w-3" /></Button></div></CardContent></Card>))}</div>)}

              {currentView === 'list' && (<div className="space-y-2">{sortedData.map(parcel => (<div
                      key={parcel.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    ><div className="flex-1 min-w-0"><div className="flex items-center gap-3"><div className="flex-1 min-w-0"><h4 className="font-semibold truncate">{parcel.parcelNumber}</h4>{parcel.address && (<p className="text-sm text-muted-foreground truncate">{parcel.address}</p>)}</div>{parcel.score && (<Badge variant="outline" className={getScoreColor(parcel.score)}>{(parcel.score * 100).toFixed(0)}%</Badge>)}</div><div className="flex items-center gap-6 mt-2 text-sm"><span><span className="text-muted-foreground">Owner:</span>{parcel.owner}</span><span><span className="text-muted-foreground">Value:</span>{' '}
                            {formatCompactCurrency(parcel.taxValue)}
                          </span><span><span className="text-muted-foreground">Acreage:</span>{' '}
                            {parcel.acreage.toFixed(2)} ac
                          </span>{parcel.distance && (<span><span className="text-muted-foreground">Distance:</span>{' '}
                              {parcel.distance.toFixed(1)} mi
                            </span>)}</div></div><div className="flex items-center gap-2 ml-4"><Button size="sm" onClick={() => onParcelSelect?.(parcel.id)}><Eye className="h-3 w-3 mr-1" />View</Button><Button variant="outline" size="sm"><Copy className="h-3 w-3" /></Button></div></div>))}</div>)}

              {currentView === 'table' && (<div className="overflow-x-auto"><table className="w-full border-collapse"><thead><tr className="border-b"><th className="text-left p-2">Parcel #</th><th className="text-left p-2">Owner</th><th className="text-left p-2">Type</th><th className="text-right p-2">Tax Value</th><th className="text-right p-2">Acreage</th><th className="text-right p-2">Distance</th><th className="text-center p-2">Match</th><th className="text-center p-2">Actions</th></tr></thead><tbody>{sortedData.map(parcel => (<tr key={parcel.id} className="border-b hover:bg-muted/50"><td className="p-2"><div><p className="font-medium">{parcel.parcelNumber}</p>{parcel.address && (<p className="text-xs text-muted-foreground truncate max-w-32">{parcel.address}</p>)}</div></td><td className="p-2 truncate max-w-32">{parcel.owner}</td><td className="p-2">{parcel.propertyType}</td><td className="p-2 text-right font-medium text-green-600">{formatCompactCurrency(parcel.taxValue)}</td><td className="p-2 text-right">{parcel.acreage.toFixed(2)} ac</td><td className="p-2 text-right">{parcel.distance ? `${parcel.distance.toFixed(1)} mi` : '-'}</td><td className="p-2 text-center">{parcel.score && (<Badge variant="outline" className={getScoreColor(parcel.score)}>{(parcel.score * 100).toFixed(0)}%</Badge>)}</td><td className="p-2 text-center"><div className="flex items-center gap-1 justify-center"><Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2"
                                onClick={() => onParcelSelect?.(parcel.id)}
                              ><Eye className="h-3 w-3" /></Button><Button size="sm" variant="outline" className="h-7 px-2"><Copy className="h-3 w-3" /></Button></div></td></tr>))}</tbody></table></div>)}</div>)}</CardContent></Card></div>
  );
}

export default ParcelComparison;
