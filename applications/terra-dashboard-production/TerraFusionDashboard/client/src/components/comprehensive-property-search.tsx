import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, DollarSign, Calendar, Building, Home, Filter, Download  } from '@mui/icons-material';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Property {
  id: string;
  parcelId: string;
  address: string;
  ownerName?: string | null;
  assessedValue: string;
  marketValue?: string;
  landValue?: string;
  improvementValue?: string;
  squareFootage?: number | null;
  yearBuilt?: number | null;
  propertyType: string;
  coordinates?: {
    latitude: number;
    longitude: number;
    elevation?: number;
  } | null;
  countyName?: string;
  active: boolean;
  lastSyncAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SearchResponse {
  results: Property[];
  total: number;
  showing: number;
  query: string;
}

interface ComprehensivePropertySearchProps {
  onPropertySelect?: (property: Property) => void;
}

export default function ComprehensivePropertySearch({ onPropertySelect }: ComprehensivePropertySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [showingResults, setShowingResults] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [resultLimit, setResultLimit] = useState(50);
  const [hasSearched, setHasSearched] = useState(false);

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numValue);
  };

  const performSearch = useCallback(async (query: string, filter: string = 'all', limit: number = 50) => {
    if (!query.trim()) {
      setSearchResults([]);
      setTotalResults(0);
      setShowingResults(0);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      // Use the comprehensive search endpoint to access full dataset
      const response = await fetch(`/api/properties/search/all?q=${encodeURIComponent(query)}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      
      let filteredResults = data.results;

      // Apply frontend filter if needed
      if (filter !== 'all') {
        filteredResults = data.results.filter(property => {
          switch (filter) {
            case 'residential':
              return property.propertyType?.toLowerCase().includes('residential') || 
                     property.propertyType?.toLowerCase().includes('single');
            case 'commercial':
              return property.propertyType?.toLowerCase().includes('commercial');
            case 'agricultural':
              return property.propertyType?.toLowerCase().includes('agricultural') || 
                     property.propertyType?.toLowerCase().includes('ag');
            case 'government':
              return property.propertyType?.toLowerCase().includes('government') || 
                     property.propertyType?.toLowerCase().includes('public');
            case 'high-value':
              return parseFloat(property.assessedValue) > 1000000;
            default:
              return true;
          }
        });
      }

      setSearchResults(filteredResults);
      setTotalResults(data.total);
      setShowingResults(filteredResults.length);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalResults(0);
      setShowingResults(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery, selectedFilter, resultLimit);
      } else if (searchQuery.length === 0) {
        setSearchResults([]);
        setTotalResults(0);
        setShowingResults(0);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedFilter, resultLimit, performSearch]);

  const handlePropertyClick = (property: Property) => {
    onPropertySelect?.(property);
  };

  const getPropertyTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('residential') || type.includes('Single')) return <Home className="w-4 h-4" />;
    if (type.toLowerCase().includes('commercial')) return <Building className="w-4 h-4" />;
    return <MapPin className="w-4 h-4" />;
  };

  const getPropertyTypeColor = (type: string) => {
    if (type.toLowerCase().includes('residential') || type.includes('Single')) return 'bg-blue-100 text-blue-800';
    if (type.toLowerCase().includes('commercial')) return 'bg-green-100 text-green-800';
    if (type.toLowerCase().includes('agricultural') || type.includes('Ag')) return 'bg-yellow-100 text-yellow-800';
    if (type.toLowerCase().includes('government')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
<>
            <Search className="w-5 h-5 text-blue-600" />
            Comprehensive Property Search
          </CardTitle>
          <p
</> className="text-sm text-gray-600">
            Search and access any property from the complete Benton County dataset (91,808 properties)
          </p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by address, parcel ID, owner name, or city..."
              className="pl-10"
            />
          </div>

          {/* Search Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-40">
<>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent
</>>
<>
                  <SelectItem value="all">All Properties</SelectItem>
                  <SelectItem
</> value="residential">Residential</SelectItem>
<>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem
</> value="agricultural">Agricultural</SelectItem>
<>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem
</> value="high-value">$1M+ Properties</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
<>
              <span className="text-sm text-gray-500">Results:</span>
              <Select
</> value={resultLimit.toString()} onValueChange={(value) => setResultLimit(parseInt(value))}>
                <SelectTrigger className="w-20">
<>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
</>>
<>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem
</> value="50">50</SelectItem>
<>
                  <SelectItem value="100">100</SelectItem>
                  <SelectItem
</> value="250">250</SelectItem>
                  <SelectItem value="500">500</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {searchResults.length > 0 && (
              <Button variant="outline" size="sm" className="ml-auto">
                <Download className="w-4 h-4 mr-2" />
                Export Results
              </Button>
            )}
          </div>

          {/* Search Results Summary */}
          {hasSearched && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Searching through 91,808 properties...
                    </span>
                  ) : (
                    <span>
                      Found <strong>{totalResults.toLocaleString()}</strong> properties matching "{searchQuery}"
                      {selectedFilter !== 'all' && ` (${selectedFilter} filter applied)`}
                      <br />
                      Showing <strong>{showingResults.toLocaleString()}</strong> results
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {searchResults.map((property) => (
                <div
                  key={property.id}
                  onClick={() => handlePropertyClick(property)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getPropertyTypeIcon(property.propertyType)}
<>
                        <span className="font-medium text-gray-900">{property.address}</span>
                        <Badge
</> variant="secondary" className={getPropertyTypeColor(property.propertyType)}>
                          {property.propertyType}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        <div>Parcel ID: {property.parcelId}</div>
                        {property.ownerName && <div>Owner: {property.ownerName}</div>}
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="flex items-center gap-1 font-medium text-green-600">
                          <DollarSign className="w-3 h-3" />
                          {formatCurrency(property.assessedValue)}
                        </span>
                        {property.squareFootage && (
                          <span>{property.squareFootage.toLocaleString()} sq ft</span>
                        )}
                        {property.yearBuilt && (
                          <span>Built {property.yearBuilt}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(property.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {hasSearched && !isLoading && searchResults.length === 0 && searchQuery.length >= 2 && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
<>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Properties Found</h3>
            <p
</> className="text-gray-600">
              No properties found matching "{searchQuery}" in the Benton County database.
              <br />
              Try different search terms or adjust your filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {!hasSearched && (
        <Card>
          <CardContent className="text-center py-8">
            <Search className="w-12 h-12 text-blue-300 mx-auto mb-4" />
<>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search Benton County Properties</h3>
            <p
</> className="text-gray-600 mb-4">
              Enter any address, parcel ID, owner name, or city to search through all 91,808 properties
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
<>
              <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery('Richland')}>
                Try "Richland"
              </Badge>
              <Badge
</> variant="outline" className="cursor-pointer" onClick={() => setSearchQuery('Prosser')}>
                Try "Prosser"
              </Badge>
<>
              <Badge variant="outline" className="cursor-pointer" onClick={() => setSearchQuery('Kennewick')}>
                Try "Kennewick"
              </Badge>
              <Badge
</> variant="outline" className="cursor-pointer" onClick={() => setSearchQuery('BC000001')}>
                Try "BC000001"
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}