import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building, Plus, Search, Filter, ArrowUpDown  } from '@mui/icons-material';

interface Property {
  id: number;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  property_type: string;
  bedrooms: number;
  bathrooms: string;
  square_feet: string;
  year_built: number;
  description: string;
}

export default function Properties() {
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('');
  const [sortField, setSortField] = useState<keyof Property>('address');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await fetch('/api/properties');
      if (!response.ok) {
        throw new Error('Failed to fetch properties');
      }
      return response.json() as Promise<Property[]>;
    }
  });

  const handleSort = (field: keyof Property) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort properties
  const filteredProperties = properties
    ? properties.filter(property => {
        const matchesSearch = 
          searchTerm === '' || 
          property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.zip_code.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesType = 
          propertyTypeFilter === '' || 
          property.property_type === propertyTypeFilter;
        
        return matchesSearch && matchesType;
      })
    : [];

  // Sort the filtered properties
  const sortedProperties = [...filteredProperties].sort((a, b) => {
    const valueA = a[sortField];
    const valueB = b[sortField];
    
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Get unique property types for filter dropdown
  const propertyTypes = properties 
    ? [...new Set(properties.map(p => p.property_type))]
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert"><>

        <strong className="font-bold">Error!</strong>
        <span
</> className="block sm:inline"> Failed to load properties. Please try again later.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><>

          <h1 className="text-2xl font-bold text-gray-800">Properties</h1>
          <p
</> className="text-gray-600">Manage your real estate properties</p>
        </div>
        <Link to="/properties/new" className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>Add Property</span>
        </Link>
      </div>

      <div className="card p-5">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><>

              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
</>
              type="text"
              className="form-input pl-10"
              placeholder="Search by address, city, or zip code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex-shrink-0 w-full md:w-48">
            <select
              className="form-input"
              value={propertyTypeFilter}
              onChange={(e) => setPropertyTypeFilter(e.target.value)}
            >
              <option value="">All Property Types</option>
              {propertyTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('address')}
                >
                  <div className="flex items-center gap-2">
                    Address
                    {sortField === 'address' && (
                      <ArrowUpDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('property_type')}
                >
                  <div className="flex items-center gap-2">
                    Type
                    {sortField === 'property_type' && (
                      <ArrowUpDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('city')}
                >
                  <div className="flex items-center gap-2">
                    Location
                    {sortField === 'city' && (
                      <ArrowUpDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('square_feet')}
                >
                  <div className="flex items-center gap-2">
                    Details
                    {sortField === 'square_feet' && (
                      <ArrowUpDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('year_built')}
                >
                  <div className="flex items-center gap-2">
                    Year
                    {sortField === 'year_built' && (
                      <ArrowUpDown className="w-4 h-4" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedProperties.length > 0 ? (
                sortedProperties.map((property) => (
                  <tr key={property.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <Link to={`/properties/${property.id}`} className="hover:text-primary">
                        {property.address}
                      </Link>
                    </td><>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.property_type}</td>
                    <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.city}, {property.state} {property.zip_code}
                    </td><>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {property.square_feet} sq ft • {property.bedrooms} bd • {property.bathrooms} ba
                    </td>
                    <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{property.year_built}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-3"><>

                      <Link to={`/properties/${property.id}`} className="text-primary hover:underline">View</Link>
                      <Link
</> to={`/properties/edit/${property.id}`} className="text-secondary hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No properties found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}