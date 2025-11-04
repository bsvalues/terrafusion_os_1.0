import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Home, Building, House, Search, Filter, MapPin  } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Property } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Icons for different property types
const getPropertyIcon = (propertyType: string) => {
  switch (propertyType.toLowerCase()) {
    case 'commercial':
      return <Building className="h-8 w-8 text-gray-400" />;
    case 'government':
      return (
        <svg
          className="h-8 w-8 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
          />
        </svg>
      );
    default:
      return <Home className="h-8 w-8 text-gray-400" />;
  }
};

// Helper to format property values
const formatPropertyValue = (property: Property) => {
  if (property.propertyType === 'Government' || property.status === 'exempt') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        Exempt
      </span>
    );
  }

  if (property.value) {
    const valueColor =
      property.propertyType === 'Commercial'
        ? 'bg-blue-100 text-blue-800'
        : 'bg-green-100 text-green-800';
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${valueColor}`}
      >
        ${property.value.toLocaleString()}
      </span>
    );
  }

  return null;
};

const PropertyList = () => {
  const [sortBy, setSortBy] = useState('lastUpdated');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  // Filter and sort properties
  useEffect(() => {
    let result = [...properties];

    // Apply type filter
    if (selectedType) {
      result = result.filter(p => p.propertyType.toLowerCase() === selectedType.toLowerCase());
    }

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        p =>
          p.address.toLowerCase().includes(search) ||
          p.propertyId.toLowerCase().includes(search) ||
          p.parcelNumber.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'propertyId':
          return a.propertyId.localeCompare(b.propertyId);
        case 'valueHighToLow':
          return (b.value || 0) - (a.value || 0);
        case 'valueLowToHigh':
          return (a.value || 0) - (b.value || 0);
        case 'lastUpdated':
        default:
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      }
    });

    setFilteredProperties(result);
  }, [properties, sortBy, searchTerm, selectedType]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedType(null);
  };

  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4"><>

          <h3 className="text-lg leading-6 font-medium text-gray-900">Properties</h3>
          <div
</> className="flex items-center space-x-2"><>

            <span className="text-sm text-gray-500">Sort by:</span>
            <select
</>
              className="mt-1 block pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            ><>

              <option value="lastUpdated">Last updated</option>
              <option
</> value="propertyId">Property ID</option><>

              <option value="valueHighToLow">Value (high to low)</option>
              <option
</> value="valueLowToHigh">Value (low to high)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
</>
              type="text"
              placeholder="Search by address, ID, or parcel number..."
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                {selectedType ? `Type: ${selectedType}` : 'Filter'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedType('Residential')}><>

                <Home className="h-4 w-4 mr-2" /> Residential
              </DropdownMenuItem>
              <DropdownMenuItem
</> onClick={() => setSelectedType('Commercial')}><>

                <Building className="h-4 w-4 mr-2" /> Commercial
              </DropdownMenuItem>
              <DropdownMenuItem
</> onClick={() => setSelectedType('Government')}>
                <svg
                  className="h-4 w-4 mr-2 text-gray-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                  />
                </svg>{' '}
                Government
              </DropdownMenuItem>
              {selectedType && (
                <DropdownMenuItem onClick={() => setSelectedType(null)}>
                  Clear filter
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {(searchTerm || selectedType) && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Clear all
            </Button>
          )}
        </div>

        {(searchTerm || selectedType) && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
            <span>Filters:</span>
            {searchTerm && (
              <Badge variant="outline" className="flex items-center gap-1">
                Search: {searchTerm}
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedType && (
              <Badge variant="outline" className="flex items-center gap-1">
                Type: {selectedType}
                <button
                  onClick={() => setSelectedType(null)}
                  className="ml-1 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}

        <div className="mt-4 flow-root">
          <div className="-my-5 divide-y divide-gray-200">
            {isLoading ? (
              <div className="py-5 space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : filteredProperties.length === 0 ? (
              <div className="py-4 text-center text-gray-500">
                {searchTerm || selectedType
                  ? 'No properties match your filters'
                  : 'No properties found'}
              </div>
            ) : (
              filteredProperties.map((property: Property) => (
                <div key={property.propertyId} className="py-4">
                  <div className="flex items-center space-x-4"><>

                    <div className="flex-shrink-0">{getPropertyIcon(property.propertyType)}</div>
                    <div
</> className="min-w-0 flex-1"><>

                      <p className="text-sm font-medium text-gray-900 truncate">
                        {property.address}
                      </p>
                      <p
</> className="text-sm text-gray-500 truncate">
                        Parcel #: {property.parcelNumber} | {property.propertyType} |{' '}
                        {property.acres} acres
                      </p>
                    </div><>

                    <div>{formatPropertyValue(property)}</div>
                    <div
</>>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><>

                            <MapPin className="h-4 w-4 mr-2" /> View on map
                          </DropdownMenuItem>
                          <DropdownMenuItem
</>>
                            <svg
                              className="h-4 w-4 mr-2 text-gray-600"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                            Property report
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <svg
                              className="h-4 w-4 mr-2 text-gray-600"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            View details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <div className="text-xs text-gray-500 text-center">
            {filteredProperties.length > 0 && (
              <>
                Showing {filteredProperties.length} of {properties.length} properties
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <svg
                className="h-4 w-4 mr-2"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export
            </Button>
            <Button className="flex-1">View all properties</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyList;
