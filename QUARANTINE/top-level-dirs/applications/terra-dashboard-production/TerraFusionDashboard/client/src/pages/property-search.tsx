import { useState } from 'react';
import ComprehensivePropertySearch from '@/components/comprehensive-property-search';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Database, MapPin, TrendingUp  } from '@mui/icons-material';

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

export default function PropertySearchPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
<>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Property Search</h1>
          <p
</> className="text-gray-600">
            Search and access any property from the complete Benton County dataset
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-blue-600" />
                <div>
<>
                  <p className="text-sm text-gray-600">Total Properties</p>
                  <p
</> className="text-xl font-bold">91,808</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Search className="w-8 h-8 text-green-600" />
                <div>
<>
                  <p className="text-sm text-gray-600">Search Capability</p>
                  <p
</> className="text-xl font-bold">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <MapPin className="w-8 h-8 text-purple-600" />
                <div>
<>
                  <p className="text-sm text-gray-600">Coverage Area</p>
                  <p
</> className="text-xl font-bold">Full County</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <div>
<>
                  <p className="text-sm text-gray-600">Data Quality</p>
                  <p
</> className="text-xl font-bold">Authentic</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Interface */}
          <div className="lg:col-span-2">
            <ComprehensivePropertySearch onPropertySelect={handlePropertySelect} />
          </div>

          {/* Property Details */}
          <div className="lg:col-span-1">
            {selectedProperty ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Property Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
<>
                    <h3 className="font-semibold text-gray-900 mb-2">{selectedProperty.address}</h3>
                    <p
</> className="text-sm text-gray-600">Parcel ID: {selectedProperty.parcelId}</p>
                  </div>

                  {selectedProperty.ownerName && (
                    <div>
<>
                      <label className="text-sm font-medium text-gray-600">Owner</label>
                      <p
</> className="text-sm">{selectedProperty.ownerName}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
<>
                      <label className="text-sm font-medium text-gray-600">Assessed Value</label>
                      <p
</> className="text-lg font-semibold text-green-600">
                        {formatCurrency(selectedProperty.assessedValue)}
                      </p>
                    </div>
                    {selectedProperty.squareFootage && (
                      <div>
<>
                        <label className="text-sm font-medium text-gray-600">Square Footage</label>
                        <p
</> className="text-lg font-semibold">
                          {selectedProperty.squareFootage.toLocaleString()} sq ft
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
</> className="text-sm">{formatCurrency(selectedProperty.landValue)}</p>
                        </div>
                      )}
                      {selectedProperty.improvementValue && (
                        <div>
<>
                          <label className="text-sm font-medium text-gray-600">Improvement Value</label>
                          <p
</> className="text-sm">{formatCurrency(selectedProperty.improvementValue)}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
<>
                      <label className="text-sm font-medium text-gray-600">Property Type</label>
                      <p
</> className="text-sm">{selectedProperty.propertyType}</p>
                    </div>
                    {selectedProperty.yearBuilt && (
                      <div>
<>
                        <label className="text-sm font-medium text-gray-600">Year Built</label>
                        <p
</> className="text-sm">{selectedProperty.yearBuilt}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t">
<>
                    <label className="text-sm font-medium text-gray-600">Last Updated</label>
                    <p
</> className="text-sm">
                      {new Date(selectedProperty.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Property Details</CardTitle>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Select a property from the search results to view detailed information
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}