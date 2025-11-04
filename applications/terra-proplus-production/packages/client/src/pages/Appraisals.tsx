import React, { useState } from 'react';
import { PlusCircle, Search, Filter, ChevronDown, FileText, Clock, CheckCircle2, AlertCircle  } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Appraisal } from '../types';

const Appraisals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedSortBy, setSelectedSortBy] = useState('newest');

  // Fetch appraisals from API
  const { data: appraisals, isLoading, isError } = useQuery({
    queryKey: ['/api/appraisals'],
    retry: 1,
  });

  // Filter appraisals based on search term and filters
  const filteredAppraisals = appraisals?.filter((appraisal: Appraisal) => {
    const matchesSearch = 
      !searchTerm || 
      (appraisal.clientName && appraisal.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (appraisal.address && appraisal.address.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = 
      selectedStatuses.length === 0 || 
      selectedStatuses.includes(appraisal.status);
      
    return matchesSearch && matchesStatus;
  });

  // Sort appraisals based on selected sort option
  const sortedAppraisals = filteredAppraisals?.sort((a: Appraisal, b: Appraisal) => {
    switch (selectedSortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'name':
        return a.address.localeCompare(b.address);
      case 'value':
        const valueA = a.marketValue || 0;
        const valueB = b.marketValue || 0;
        return valueB - valueA;
      default:
        return 0;
    }
  });

  // Toggle status selection
  const toggleStatus = (status: string) => {
    if (selectedStatuses.includes(status)) {
      setSelectedStatuses(selectedStatuses.filter(s => s !== status));
    } else {
      setSelectedStatuses([...selectedStatuses, status]);
    }
  };

  // Status options
  const statuses = ['Draft', 'In Progress', 'Completed', 'Reviewed', 'Cancelled'];

  // Sort options
  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'name', label: 'Property Name (A-Z)' },
    { value: 'value', label: 'Market Value (High to Low)' }
  ];

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Clock size={14} className="mr-1" /> };
      case 'In Progress':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: <Clock size={14} className="mr-1" /> };
      case 'Completed':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle2 size={14} className="mr-1" /> };
      case 'Reviewed':
        return { bg: 'bg-purple-100', text: 'text-purple-800', icon: <CheckCircle2 size={14} className="mr-1" /> };
      case 'Cancelled':
        return { bg: 'bg-red-100', text: 'text-red-800', icon: <AlertCircle size={14} className="mr-1" /> };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', icon: null };
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div><>

          <h1 className="text-3xl font-bold gradient-heading">Appraisals</h1>
          <p
</> className="text-gray-600 mt-1">Manage your appraisal workflows</p>
        </div>
        <button className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center">
          <PlusCircle size={18} className="mr-2" />
          Create New Appraisal
        </button>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

              <Search size={18} className="text-gray-400" />
            </div>
            <input
</>
              type="text"
              placeholder="Search appraisals by property address or client..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none"
            >
              <Filter size={18} className="mr-2 text-gray-500" />
              Filters
              <ChevronDown size={18} className="ml-2 text-gray-500" />
            </button>
            
            {filterOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10 p-4">
                <div className="mb-4"><>

                  <h3 className="font-semibold mb-2">Status</h3>
                  <div
</> className="space-y-2">
                    {statuses.map(status => (
                      <div key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`status-${status}`}
                          checked={selectedStatuses.includes(status)}
                          onChange={() => toggleStatus(status)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor={`status-${status}`} className="ml-2 text-sm text-gray-700">
                          {status}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div><>

                  <h3 className="font-semibold mb-2">Sort By</h3>
                  <div
</> className="space-y-2">
                    {sortOptions.map(option => (
                      <div key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          id={`sort-${option.value}`}
                          checked={selectedSortBy === option.value}
                          onChange={() => setSelectedSortBy(option.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor={`sort-${option.value}`} className="ml-2 text-sm text-gray-700">
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appraisals list */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          Error loading appraisals. Please try again later.
        </div>
      ) : sortedAppraisals?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FileText size={48} className="mx-auto text-gray-400 mb-4" /><>

          <h3 className="text-lg font-semibold text-gray-700 mb-2">No appraisals found</h3>
          <p
</> className="text-gray-600 mb-4">
            {searchTerm || selectedStatuses.length > 0
              ? "No appraisals match your search criteria. Try adjusting your filters."
              : "There are no appraisals in the database yet. Create your first appraisal to get started."}
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center">
            <PlusCircle size={18} className="mr-2" />
            Create New Appraisal
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr><>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th><>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Appraiser
                  </th>
                  <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th><>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Market Value
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAppraisals?.map((appraisal: Appraisal) => {
                  const statusBadge = getStatusBadge(appraisal.status);
                  return (
                    <tr key={appraisal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{appraisal.address}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appraisal.clientName || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appraisal.appraiserName || 'Not assigned'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusBadge.bg} ${statusBadge.text}`}>
                          {statusBadge.icon}
                          {appraisal.status}
                        </span>
                      </td><>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(appraisal.createdAt)}
                      </td>
                      <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {appraisal.marketValue ? `$${appraisal.marketValue.toLocaleString()}` : 'Pending'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><>

                        <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                        <button
</> className="text-blue-600 hover:text-blue-900">Edit</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appraisals;