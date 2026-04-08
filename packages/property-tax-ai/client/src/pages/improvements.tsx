import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PlusCircle, Home, ArrowRight } from 'lucide-react';
import { Improvement, Property } from '@/lib/types';

const Improvements = () => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  
  // Fetch properties
  const { data: properties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  // Fetch improvements for selected property
  const { data: improvements = [], isLoading: improvementsLoading } = useQuery<Improvement[]>({
    queryKey: ['/api/properties', selectedPropertyId, 'improvements'],
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
      New Improvement
    </Button>
  );

  return (
    <>
      <PageHeader 
        title="Improvements" 
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
                      <Home className="h-5 w-5 text-gray-400 mr-3" />
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

          {/* Improvements Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl">
                {selectedProperty 
                  ? `Improvements for ${selectedProperty.address}` 
                  : 'Select a property to view improvements'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedPropertyId ? (
                <div className="text-center py-10 text-gray-500">
                  <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p>Please select a property from the list to view its improvements</p>
                </div>
              ) : improvementsLoading ? (
                <div className="text-center py-4">Loading improvements...</div>
              ) : improvements.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p className="mb-4">No improvements found for this property</p>
                  <Button>
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Add Improvement
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Type</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Year Built</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Square Feet</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Bed/Bath</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Quality</th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {improvements.map(improvement => (
                        <tr key={improvement.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                            {improvement.improvementType}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {improvement.yearBuilt || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {improvement.squareFeet ? `${improvement.squareFeet} sq ft` : '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {improvement.bedrooms || '-'}/{improvement.bathrooms || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {improvement.quality || '-'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {improvement.condition || '-'}
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

export default Improvements;
