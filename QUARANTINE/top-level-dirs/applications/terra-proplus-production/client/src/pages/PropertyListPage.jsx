import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building, Plus, Search, Loader2 } from 'lucide-react';

const PropertyListPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch properties from API
  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    }
  });

  // Filter properties based on search term
  const filteredProperties = searchTerm.trim() === ''
    ? properties
    : properties?.filter(property => 
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.zipCode.includes(searchTerm)
      );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Property Listings</h1>
        <Link 
          to="/properties/new" 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          <Plus size={16} />
          <span>Add Property</span>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="text-gray-400" size={20} />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search properties by address, city, state, or zip code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Properties Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="ml-2 text-gray-600">Loading properties...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-2">Error loading properties</p>
          <p className="text-gray-600">{error.message}</p>
        </div>
      ) : filteredProperties?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Building className="mx-auto text-gray-400" size={48} />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No properties found</h3>
          <p className="mt-1 text-gray-500">
            {searchTerm ? 'Try adjusting your search' : 'Add your first property to get started'}
          </p>
          {!searchTerm && (
            <div className="mt-6">
              <Link
                to="/properties/new"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="mr-2 -ml-1" size={16} />
                Add Property
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties?.map((property) => (
            <Link key={property.id} to={`/properties/${property.id}`}>
              <div className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-blue-600 h-3"></div>
                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{property.address}</h3>
                  <p className="text-gray-600 mb-3">{property.city}, {property.state} {property.zipCode}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Property Type</p>
                      <p className="font-medium">{property.propertyType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Year Built</p>
                      <p className="font-medium">{property.yearBuilt}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Bedrooms / Baths</p>
                      <p className="font-medium">{property.bedrooms} / {property.bathrooms}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Square Feet</p>
                      <p className="font-medium">{property.squareFeet}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PropertyListPage;