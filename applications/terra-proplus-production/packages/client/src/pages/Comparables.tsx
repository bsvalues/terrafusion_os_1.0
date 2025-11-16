import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart4, Plus, Search, Edit, ArrowRight, Calendar, DollarSign, Home as HomeIcon, Building2  } from '@mui/icons-material';

interface Comparable {
  id: number;
  appraisalId: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  salePrice: number;
  saleDate: string;
  squareFeet: number;
  propertyType: string;
  adjustedPrice?: number;
  daysOnMarket?: number;
}

export const Comparables = () => {
  const [comparables, setComparables] = useState<Comparable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');

  useEffect(() => {
    fetch('/api/comparables')
      .then(response => response.json())
      .then(data => {
        setComparables(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching comparables:', error);
        setLoading(false);
      });
  }, []);

  // Filter comparables based on search term and property type filter
  const filteredComparables = comparables.filter(comparable => {
    const matchesSearch = 
      comparable.address?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      comparable.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comparable.state?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comparable.propertyType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPropertyType = propertyTypeFilter === 'all' || comparable.propertyType === propertyTypeFilter;
    
    return matchesSearch && matchesPropertyType;
  });

  // Calculate price per square foot
  const calculatePricePerSqFt = (price: number, sqFt: number) => {
    if (!sqFt || sqFt === 0) return 'N/A';
    return `$${Math.round(price / sqFt)}`;
  };

  // Get property icon based on type
  const getPropertyIcon = (propertyType: string) => {
    switch(propertyType?.toLowerCase()) {
      case 'single family':
        return <HomeIcon size={16} className="text-blue-500" />;
      case 'condo':
        return <Building2 size={16} className="text-green-500" />;
      case 'multi-family':
        return <Building2 size={16} className="text-purple-500" />;
      default:
        return <Building2 size={16} className="text-gray-500" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div><>

          <h1 className="text-3xl font-bold gradient-heading">Comparable Properties</h1>
          <p
</> className="text-gray-600 mt-1">Manage your comparable properties database</p>
        </div>
        <Link 
          to="/comparables/new" 
          className="mt-4 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          Add Comparable
        </Link>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search comparables..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          /><>

          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        
        <div
</> className="w-full md:w-48">
          <select
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={propertyTypeFilter}
            onChange={(e) => setPropertyTypeFilter(e.target.value)}
          ><>

            <option value="all">All Property Types</option>
            <option
</> value="Single Family">Single Family</option><>

            <option value="Condo">Condo</option>
            <option
</> value="Multi-Family">Multi-Family</option><>

            <option value="Townhouse">Townhouse</option>
            <option
</> value="Land">Land</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {filteredComparables.length > 0 ? (
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr><>

                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th><>

                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sale Price
                      </th>
                      <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price/SqFt
                      </th><>

                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sale Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredComparables.map(comparable => (
                      <tr key={comparable.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-start">
                            {getPropertyIcon(comparable.propertyType)}
                            <div className="ml-2"><>

                              <div className="font-medium text-gray-900 truncate max-w-xs">
                                {comparable.address}
                              </div>
                              <div
</> className="text-sm text-gray-500">
                                {comparable.city}, {comparable.state}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {comparable.propertyType || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <DollarSign size={14} className="text-gray-400 mr-1" />
                            <span className="text-sm font-medium text-gray-900">
                              {comparable.salePrice ? `$${comparable.salePrice.toLocaleString()}` : 'N/A'}
                            </span>
                          </div>
                          {comparable.adjustedPrice && (
                            <div className="text-xs text-gray-500 mt-1">
                              Adjusted: ${comparable.adjustedPrice.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {calculatePricePerSqFt(comparable.salePrice, comparable.squareFeet)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {comparable.squareFeet ? `${comparable.squareFeet.toLocaleString()} sq.ft.` : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Calendar size={14} className="text-gray-400 mr-1" />
                            <span className="text-sm text-gray-900">
                              {formatDate(comparable.saleDate)}
                            </span>
                          </div>
                          {comparable.daysOnMarket && (
                            <div className="text-xs text-gray-500 mt-1">
                              {comparable.daysOnMarket} days on market
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center space-x-2">
                            <Link to={`/comparables/${comparable.id}/edit`} className="text-blue-600 hover:text-blue-900"><>

                              <Edit size={16} />
                            </Link>
                            <Link
</> to={`/comparables/${comparable.id}`} className="text-green-600 hover:text-green-900">
                              <ArrowRight size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <BarChart4 size={48} className="text-gray-400 mx-auto mb-4" /><>

              <h3 className="text-xl font-medium text-gray-800">No comparables found</h3>
              <p
</> className="text-gray-600 mt-1 mb-4">
                {searchTerm || propertyTypeFilter !== 'all' 
                  ? 'Try adjusting your search criteria or filter.'
                  : 'You have not added any comparable properties yet.'}
              </p>
              <Link 
                to="/comparables/new" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} className="mr-2" />
                Add Comparable
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
};