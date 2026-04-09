import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, MapPin, ArrowRight } from 'lucide-react';
import { LandRecord, Property } from '@/lib/types';

const LandRecords = () => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  
  // Fetch properties
  const { data: properties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  // Fetch land records for selected property
  const { data: landRecords = [], isLoading: landRecordsLoading } = useQuery<LandRecord[]>({
    queryKey: ['/api/properties', selectedPropertyId, 'land-records'],
    enabled: !!selectedPropertyId,
  });
  
  // Get selected property details
  const selectedProperty = selectedPropertyId 
    ? properties.find(p => p.propertyId === selectedPropertyId) 
    : null;
  
  // Header actions
  const headerActions = (
    <Button className="inline-flex items-center">
      <PlusCircle className="h-5 w-5 mr-2" />
      New Land Record
    </Button>
  );

  return (
    <>
      <PageHeader 
        title="Land Records" 
        subtitle="Data Management"
        actions={headerActions}
      />
      
      <div className="px-4 sm:px-6 lg:max-w-7xl lg:mx-auto lg:px-8 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Property Selection Panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl">Properties</CardTitle>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="text-center py-4">Loading properties...</div>
              ) : properties.length === 0 ? (
                <div className="text-center py-4">No properties found</div>
              ) : (
                <div className="space-y-2">
                  {properties.map(property => (
                    <div 
                      key={property.propertyId}
                      className={`p-3 rounded-md cursor-pointer flex items-center ${
                        selectedPropertyId === property.propertyId 
                          ? 'bg-primary-50 border border-primary-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPropertyId(property.propertyId)}
                    >
                      <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{property.address}</p>
                        <p className="text-sm text-gray-500">
                          {property.propertyType} | {property.acres} acres
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Land Records Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">
                {selectedProperty 
                  ? `Land Records for ${selectedProperty.address}` 
                  : 'Select a property to view land records'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedPropertyId ? (
                <div className="text-center py-10 text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p>Please select a property from the list to view its land records</p>
                </div>
              ) : landRecordsLoading ? (
                <div className="text-center py-4">Loading land records...</div>
              ) : landRecords.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p className="mb-4">No land records found for this property</p>
                  <Button>
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Add Land Record
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Land Use Code</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Zoning</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Topography</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Frontage</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Depth</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {landRecords.map(record => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                            {record.landUseCode}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{record.zoning}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{record.topography || '-'}</td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {record.frontage ? `${record.frontage} ft` : '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {record.depth ? `${record.depth} ft` : '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(record.lastUpdated).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default LandRecords;
