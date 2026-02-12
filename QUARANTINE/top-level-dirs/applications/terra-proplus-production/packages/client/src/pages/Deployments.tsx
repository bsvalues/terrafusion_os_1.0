import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Filter, Search, ChevronDown, ChevronUp, MoreHorizontal  } from '@mui/icons-material';

// Deployment status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

// Environment badge component
const EnvironmentBadge = ({ environment }: { environment: string }) => {
  const getEnvironmentStyles = () => {
    switch (environment) {
      case 'production':
        return 'bg-green-100 text-green-800';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800';
      case 'development':
        return 'bg-blue-100 text-blue-800';
      case 'testing':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEnvironmentStyles()}`}>
      {environment}
    </span>
  );
};

const Deployments = () => {
  // State for sorting and filtering
  const [sortField, setSortField] = useState<string>('startTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterEnvironment, setFilterEnvironment] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Fetch deployments data
  const { data: deployments = [], isLoading, error } = useQuery({
    queryKey: ['/api/deployments', { status: filterStatus, environment: filterEnvironment }]
  });

  // Handle sort click
  const handleSortClick = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort and filter deployments
  const filteredDeployments = [...deployments]
    .filter((deployment: any) => {
      // Apply search term filter
      if (searchTerm && !deployment.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      return true;
    })
    .sort((a: any, b: any) => {
      if (a[sortField] < b[sortField]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortField] > b[sortField]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Render sort indicator
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div><>

          <h1 className="text-2xl font-bold text-gray-900">Deployments</h1>
          <p
</> className="mt-1 text-sm text-gray-500">
            Manage and track all your infrastructure deployments
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="btn btn-primary">
            <Plus size={16} className="mr-2" />
            New Deployment
          </button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><>

            <Search size={18} className="text-gray-400" />
          </div>
          <input
</>
            type="text"
            placeholder="Search deployments..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <select
            className="block w-full py-2 pl-3 pr-10 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          ><>

            <option value="">All Statuses</option>
            <option
</> value="completed">Completed</option><>

            <option value="in-progress">In Progress</option>
            <option
</> value="failed">Failed</option><>

            <option value="scheduled">Scheduled</option>
            <option
</> value="pending">Pending</option>
          </select>
          
          <select
            className="block w-full py-2 pl-3 pr-10 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={filterEnvironment}
            onChange={(e) => setFilterEnvironment(e.target.value)}
          ><>

            <option value="">All Environments</option>
            <option
</> value="production">Production</option><>

            <option value="staging">Staging</option>
            <option
</> value="development">Development</option>
            <option value="testing">Testing</option>
          </select>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Filter size={16} className="mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Deployments table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-center">Loading deployments...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              Error loading deployments. Please try again.
            </div>
          ) : filteredDeployments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No deployments found. Create your first deployment.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortClick('name')}
                  >
                    <div className="flex items-center">
                      Name {renderSortIndicator('name')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortClick('status')}
                  >
                    <div className="flex items-center">
                      Status {renderSortIndicator('status')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortClick('environment')}
                  >
                    <div className="flex items-center">
                      Environment {renderSortIndicator('environment')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortClick('initiatedBy')}
                  >
                    <div className="flex items-center">
                      Initiated By {renderSortIndicator('initiatedBy')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortClick('startTime')}
                  >
                    <div className="flex items-center">
                      Start Time {renderSortIndicator('startTime')}
                    </div>
                  </th><>

                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Duration
                  </th>
                  <th
</> scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeployments.map((deployment: any) => (
                  <tr key={deployment.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-900">
                        <Link to={`/deployments/${deployment.id}`}>
                          {deployment.name}
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500">
                        {deployment.version}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><>

                      <StatusBadge status={deployment.status} />
                    </td>
                    <td
</> className="px-6 py-4 whitespace-nowrap"><>

                      <EnvironmentBadge environment={deployment.environment} />
                    </td>
                    <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deployment.initiatedBy}
                    </td><>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deployment.startTime ? formatDate(deployment.startTime) : 
                       deployment.scheduledTime ? formatDate(deployment.scheduledTime) : '—'}
                    </td>
                    <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {deployment.duration || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="relative group">
                        <button className="text-gray-400 hover:text-gray-500 focus:outline-none"><>

                          <MoreHorizontal size={16} />
                        </button>
                        <div
</> className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                          <Link to={`/deployments/${deployment.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            View Details
                          </Link>
                          {deployment.status === 'failed' && (
                            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              Retry Deployment
                            </button>
                          )}
                          {deployment.status === 'completed' && (
                            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              Roll Back
                            </button>
                          )}
                          {deployment.status === 'scheduled' && (
                            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Deployments;