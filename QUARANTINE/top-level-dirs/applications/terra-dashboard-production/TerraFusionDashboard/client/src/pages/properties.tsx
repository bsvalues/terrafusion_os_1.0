import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, MapPin, DollarSign, Calendar, Building, Filter, Download, Eye, BarChart3, FileText, Settings, Zap, Map, Layers, Home  } from '@mui/icons-material';
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

export default function PropertiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: properties, isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties?limit=5000'],
    refetchInterval: 30000,
  });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getPropertyTypeColor = (type: string) => {
    if (type.toLowerCase().includes('residential') || type.includes('Single Unit')) return 'bg-blue-100 text-blue-800';
    if (type.toLowerCase().includes('commercial')) return 'bg-green-100 text-green-800';
    if (type.toLowerCase().includes('agricultural') || type.includes('Ag')) return 'bg-yellow-100 text-yellow-800';
    if (type.toLowerCase().includes('vacant')) return 'bg-gray-100 text-gray-800';
    return 'bg-purple-100 text-purple-800';
  };

  // Filter properties based on search and type
  const filteredProperties = properties?.filter(property => {
    const matchesSearch = !searchQuery || 
      property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.parcelId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.ownerName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || 
      property.propertyType?.toLowerCase().includes(selectedType.toLowerCase());
    
    return matchesSearch && matchesType;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProperties = filteredProperties.slice(startIndex, startIndex + itemsPerPage);

  // Get unique property types for filter
  const propertyTypesSet = new Set(properties?.map(p => p.propertyType) || []);
  const propertyTypes = Array.from(propertyTypesSet).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
<>
          <h1 className="text-3xl font-bold text-gray-900">Property Database</h1>
          <p
</> className="text-gray-600 mt-2">
            {filteredProperties.length.toLocaleString()} properties in Benton County, Washington
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by address, parcel ID, or owner name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-48">
                    <Filter className="w-4 h-4 mr-2" />
<>
                    <SelectValue placeholder="Property Type" />
                  </SelectTrigger>
                  <SelectContent
</>>
<>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem
</> value="residential">Residential</SelectItem>
<>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem
</> value="agricultural">Agricultural</SelectItem>
                    <SelectItem value="vacant">Vacant Land</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" className="whitespace-nowrap">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
<>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div
</> className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
<>
                    <div className="h-3 bg-gray-200 rounded"></div>
                    <div
</> className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedProperties.map((property) => (
                <Card key={property.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedProperty(property)}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
<>
                        <CardTitle className="text-lg font-semibold text-gray-900 truncate">
                          {property.address || 'Address Not Available'}
                        </CardTitle>
                        <p
</> className="text-sm text-gray-500 mt-1">
                          Parcel: {property.parcelId}
                        </p>
                      </div>
                      <Badge className={getPropertyTypeColor(property.propertyType)}>
                        {property.propertyType}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
<>
                      <span className="text-sm text-gray-600">Assessed Value</span>
                      <span
</> className="font-semibold text-lg text-green-600">
                        {formatCurrency(property.assessedValue)}
                      </span>
                    </div>
                    
                    {property.ownerName && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 truncate">
                          {property.ownerName}
                        </span>
                      </div>
                    )}
                    
                    {property.squareFootage && (
                      <div className="flex items-center justify-between">
<>
                        <span className="text-sm text-gray-600">Square Footage</span>
                        <span
</> className="text-sm font-medium">
                          {property.squareFootage.toLocaleString()} sq ft
                        </span>
                      </div>
                    )}
                    
                    {property.yearBuilt && (
                      <div className="flex items-center justify-between">
<>
                        <span className="text-sm text-gray-600">Year Built</span>
                        <span
</> className="text-sm font-medium">{property.yearBuilt}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t">
<>
                      <span className="text-xs text-gray-500">
                        Updated: {formatDate(property.updatedAt)}
                      </span>
                      <Button
</> size="sm" variant="outline">
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
<>
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                
                <div
</> className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}

        {/* Property Detail Modal */}
        {selectedProperty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
<>
                    <CardTitle className="text-xl">
                      {selectedProperty.address || 'Property Details'}
                    </CardTitle>
                    <p
</> className="text-gray-600 mt-1">
                      Parcel ID: {selectedProperty.parcelId}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedProperty(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
<>
                    <label className="text-sm font-medium text-gray-600">Property Type</label>
                    <p
</> className="text-lg">{selectedProperty.propertyType}</p>
                  </div>
                  <div>
<>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p
</> className="text-lg">
                      <Badge className={selectedProperty.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {selectedProperty.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
<>
                    <label className="text-sm font-medium text-gray-600">Assessed Value</label>
                    <p
</> className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedProperty.assessedValue)}
                    </p>
                  </div>
                  {selectedProperty.marketValue && (
                    <div>
<>
                      <label className="text-sm font-medium text-gray-600">Market Value</label>
                      <p
</> className="text-2xl font-bold text-blue-600">
                        {formatCurrency(selectedProperty.marketValue)}
                      </p>
                    </div>
                  )}
                </div>
                
                {(selectedProperty.landValue || selectedProperty.improvementValue) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProperty.landValue && (
                      <div>
<>
                        <label className="text-sm font-medium text-gray-600">Land Value</label>
                        <p
</> className="text-lg">{formatCurrency(selectedProperty.landValue)}</p>
                      </div>
                    )}
                    {selectedProperty.improvementValue && (
                      <div>
<>
                        <label className="text-sm font-medium text-gray-600">Improvement Value</label>
                        <p
</> className="text-lg">{formatCurrency(selectedProperty.improvementValue)}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedProperty.ownerName && (
                  <div>
<>
                    <label className="text-sm font-medium text-gray-600">Owner</label>
                    <p
</> className="text-lg">{selectedProperty.ownerName}</p>
                  </div>
                )}
                
                {(selectedProperty.squareFootage || selectedProperty.yearBuilt) && (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedProperty.squareFootage && (
                      <div>
<>
                        <label className="text-sm font-medium text-gray-600">Square Footage</label>
                        <p
</> className="text-lg">{selectedProperty.squareFootage.toLocaleString()} sq ft</p>
                      </div>
                    )}
                    {selectedProperty.yearBuilt && (
                      <div>
<>
                        <label className="text-sm font-medium text-gray-600">Year Built</label>
                        <p
</> className="text-lg">{selectedProperty.yearBuilt}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
<>
                      <label className="font-medium">Created</label>
                      <p
</>>{formatDate(selectedProperty.createdAt)}</p>
                    </div>
                    <div>
<>
                      <label className="font-medium">Last Updated</label>
                      <p
</>>{formatDate(selectedProperty.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}