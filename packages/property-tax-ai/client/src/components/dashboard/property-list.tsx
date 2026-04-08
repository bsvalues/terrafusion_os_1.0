import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Home, Building, House } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Property } from "@/lib/types";
import { useState } from "react";

// Icons for different property types
const getPropertyIcon = (propertyType: string) => {
  switch (propertyType.toLowerCase()) {
    case 'commercial':
      return <Building className="h-8 w-8 text-gray-400" />;
    case 'government':
      return <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>;
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
    const valueColor = property.propertyType === 'Commercial' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${valueColor}`}>
        ${property.value.toLocaleString()}
      </span>
    );
  }
  
  return null;
};

const PropertyList = () => {
  const [sortBy, setSortBy] = useState('lastUpdated');
  
  const { data: properties = [], isLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  // Sort properties based on selected sort option
  const sortedProperties = [...properties].sort((a, b) => {
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

  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg">
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Properties
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select 
              className="mt-1 block pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="lastUpdated">Last updated</option>
              <option value="propertyId">Property ID</option>
              <option value="valueHighToLow">Value (high to low)</option>
              <option value="valueLowToHigh">Value (low to high)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flow-root">
          <div className="-my-5 divide-y divide-gray-200">
            {isLoading ? (
              <div className="py-4 text-center text-gray-500">Loading properties...</div>
            ) : sortedProperties.length === 0 ? (
              <div className="py-4 text-center text-gray-500">No properties found</div>
            ) : (
              sortedProperties.map((property) => (
                <div key={property.propertyId} className="py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getPropertyIcon(property.propertyType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {property.address}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        Parcel #: {property.parcelNumber} | {property.propertyType} | {property.acres} acres
                      </p>
                    </div>
                    <div>
                      {formatPropertyValue(property)}
                    </div>
                    <div>
                      <button type="button" className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <Button variant="outline" className="w-full">
            View all properties
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyList;
