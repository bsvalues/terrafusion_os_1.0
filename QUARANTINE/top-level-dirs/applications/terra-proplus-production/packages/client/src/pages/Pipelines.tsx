import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, 
  Filter, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  Play, 
  GitBranch, 
  Tag 
 } from '@mui/icons-material';

// Pipeline status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'created':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayStatus = (status: string) => {
    if (status === 'in_progress') return 'In Progress';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusStyles()}`}>
      {getDisplayStatus(status)}
    </span>
  );
};

// Pipeline stage progress component
const PipelineStages = ({ stages }: { stages: any[] }) => {
  return (
    <div className="flex items-center space-x-1">
      {stages.map((stage /* , index */) => {
        let bgColor;
        switch (stage.status) {
          case 'completed':
            bgColor = 'bg-green-500';
            break;
          case 'in_progress':
            bgColor = 'bg-blue-500';
            break;
          case 'failed':
            bgColor = 'bg-red-500';
            break;
          default:
            bgColor = 'bg-gray-300';
        }
        
        return (
          <div key={index} className="flex items-center">
            <div className={`w-4 h-4 rounded-full ${bgColor}`} title={stage.name}></div>
            {index < stages.length - 1 && <div className="w-4 h-0.5 bg-gray-300"></div>}
          </div>
        );
      })}
    </div>
  );
};

const Pipelines = () => {
  // State for sorting and filtering
  const [sortField, setSortField] = useState<string>('lastRun');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Fetch pipelines data
  const { data: pipelines = [], isLoading, error } = useQuery({
    queryKey: ['/api/pipelines', { status: filterStatus, type: filterType }]
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

  // Sort and filter pipelines
  const filteredPipelines = [...pipelines]
    .filter((pipeline: any) => {
      // Apply search term filter
      if (searchTerm && !pipeline.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !pipeline.repository.toLowerCase().includes(searchTerm.toLowerCase())) {
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
    if (!dateString) return '—';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  // Get current stage
  const getCurrentStage = (pipeline: any) => {
    const inProgressStage = pipeline.stages.find((s: any) => s.status === 'in_progress');
    if (inProgressStage) return inProgressStage.name;
    
    if (pipeline.status === 'completed') {
      return 'Completed';
    } else if (pipeline.status === 'failed') {
      const failedStage = pipeline.stages.find((s: any) => s.status === 'failed');
      return failedStage ? `Failed at ${failedStage.name}` : 'Failed';
    }
    
    return '—';
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

          <h1 className="text-2xl font-bold text-gray-900">Pipelines</h1>
          <p
</> className="mt-1 text-sm text-gray-500">
            Manage and monitor your CI/CD pipelines
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button className="btn btn-primary">
            <Plus size={16} className="mr-2" />
            New Pipeline
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
            placeholder="Search pipelines..."
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

            <option value="in_progress">In Progress</option>
            <option
</> value="failed">Failed</option>
            <option value="created">Created</option>
          </select>
          
          <select
            className="block w-full py-2 pl-3 pr-10 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          ><>

            <option value="">All Types</option>
            <option
</> value="deployment">Deployment</option><>

            <option value="build">Build</option>
            <option
</> value="test">Test</option>
          </select>
          
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <Filter size={16} className="mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Pipelines table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-6 text-center">Loading pipelines...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-500">
              Error loading pipelines. Please try again.
            </div>
          ) : filteredPipelines.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No pipelines found. Create your first pipeline.
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
                  </th><>

                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stages
                  </th>
                  <th
</> scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stage
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortClick('lastRun')}
                  >
                    <div className="flex items-center">
                      Last Run {renderSortIndicator('lastRun')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSortClick('successRate')}
                  >
                    <div className="flex items-center">
                      Success Rate {renderSortIndicator('successRate')}
                    </div>
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPipelines.map((pipeline: any) => (
                  <tr key={pipeline.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-900">
                        <Link to={`/pipelines/${pipeline.id}`}>
                          {pipeline.name}
                        </Link>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <GitBranch size={12} className="mr-1" />
                        {pipeline.branch}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><>

                      <StatusBadge status={pipeline.status} />
                    </td>
                    <td
</> className="px-6 py-4 whitespace-nowrap"><>

                      <PipelineStages stages={pipeline.stages} />
                    </td>
                    <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getCurrentStage(pipeline)}
                    </td><>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(pipeline.lastRun)}
                    </td>
                    <td
</> className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              (pipeline.successRate >= 90) ? 'bg-green-500' : 
                              (pipeline.successRate >= 75) ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`}
                            style={{ width: `${pipeline.successRate}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 ml-2">{pipeline.successRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button 
                          className="text-gray-400 hover:text-blue-600"
                          title="Run Pipeline"
                        ><>

                          <Play size={16} />
                        </button>
                        <div
</> className="relative group">
                          <button className="text-gray-400 hover:text-gray-500"><>

                            <MoreHorizontal size={16} />
                          </button>
                          <div
</> className="hidden group-hover:block absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10"><>

                            <Link to={`/pipelines/${pipeline.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              View Details
                            </Link>
                            <Link
</> to={`/pipelines/${pipeline.id}/edit`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              Edit Pipeline
                            </Link>
                            <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                              Clone Pipeline
                            </button>
                          </div>
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

export default Pipelines;