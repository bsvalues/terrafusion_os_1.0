import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, Play, AlertCircle, CheckCircle, Clock, Filter } from 'lucide-react';
import PipelineCard from './PipelineCard';
import PipelineMetrics from './PipelineMetrics';
import NewPipelineModal from './NewPipelineModal';

const PipelineDashboard = () => {
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  // Construct query string for filters
  const filterParams = new URLSearchParams();
  if (filterStatus) filterParams.append('status', filterStatus);
  if (filterType) filterParams.append('type', filterType);
  const queryString = filterParams.toString();
  
  // Fetch pipelines data
  const { 
    data: pipelines, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/pipelines', queryString],
    queryFn: async () => {
      const url = queryString ? `/api/pipelines?${queryString}` : '/api/pipelines';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch pipelines');
      }
      return response.json();
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Fetch metrics data
  const { data: metrics } = useQuery({
    queryKey: ['/api/pipelines/metrics/summary'],
    queryFn: async () => {
      const response = await fetch('/api/pipelines/metrics/summary');
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline metrics');
      }
      return response.json();
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Setup pipeline trigger mutation
  const triggerPipeline = useMutation({
    mutationFn: async (pipelineId) => {
      const response = await fetch(`/api/pipelines/${pipelineId}/trigger`, {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to trigger pipeline');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
    },
  });

  // Setup WebSocket for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Handle different pipeline events
      if (['PIPELINE_TRIGGERED', 'PIPELINE_STAGE_CHANGED', 'PIPELINE_CREATED'].includes(data.type)) {
        queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
        queryClient.invalidateQueries({ queryKey: ['/api/pipelines/metrics/summary'] });
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return () => {
      ws.close();
    };
  }, [queryClient]);

  // Handle pipeline action (trigger)
  const handleTriggerPipeline = (pipelineId) => {
    triggerPipeline.mutate(pipelineId);
  };

  // Reset filters
  const resetFilters = () => {
    setFilterStatus('');
    setFilterType('');
  };

  // Get status counts for filter badges
  const getStatusCounts = () => {
    if (!pipelines) return { completed: 0, inProgress: 0, failed: 0 };
    
    return pipelines.reduce((counts, pipeline) => {
      if (pipeline.status === 'completed') counts.completed++;
      else if (pipeline.status === 'in_progress') counts.inProgress++;
      else if (pipeline.status === 'failed') counts.failed++;
      return counts;
    }, { completed: 0, inProgress: 0, failed: 0 });
  };
  
  const statusCounts = getStatusCounts();

  if (isError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 mb-4">
        <h3 className="font-semibold flex items-center">
          <AlertCircle className="mr-2" size={18} />
          Error Loading Pipelines
        </h3>
        <p className="mt-1">{error.message}</p>
        <button 
          onClick={() => refetch()} 
          className="mt-2 px-3 py-1 bg-white border border-red-300 rounded-md text-sm hover:bg-red-50"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Deployment Pipelines</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => refetch()}
            className="p-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            New Pipeline
          </button>
        </div>
      </div>

      {/* Metrics Summary */}
      {metrics && <PipelineMetrics metrics={metrics} />}

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <Filter size={18} className="text-gray-400 mr-2" />
            <span className="font-medium">Filters:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('completed')}
              className={`flex items-center px-3 py-1 rounded-full text-sm ${
                filterStatus === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <CheckCircle size={14} className="mr-1" />
              Completed ({statusCounts.completed})
            </button>
            
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`flex items-center px-3 py-1 rounded-full text-sm ${
                filterStatus === 'in_progress' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Clock size={14} className="mr-1" />
              In Progress ({statusCounts.inProgress})
            </button>
            
            <button
              onClick={() => setFilterStatus('failed')}
              className={`flex items-center px-3 py-1 rounded-full text-sm ${
                filterStatus === 'failed' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <AlertCircle size={14} className="mr-1" />
              Failed ({statusCounts.failed})
            </button>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white"
            >
              <option value="">All Types</option>
              <option value="deployment">Deployment</option>
              <option value="build">Build</option>
              <option value="test">Test</option>
            </select>

            {(filterStatus || filterType) && (
              <button
                onClick={resetFilters}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pipelines Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded mt-4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pipelines?.length === 0 ? (
            <div className="col-span-full text-center py-10 bg-white rounded-lg shadow">
              <div className="text-gray-500">
                {filterStatus || filterType ? (
                  <p>No pipelines match the current filters.</p>
                ) : (
                  <p>No pipelines found. Create a new pipeline to get started.</p>
                )}
              </div>
            </div>
          ) : (
            pipelines?.map((pipeline) => (
              <PipelineCard
                key={pipeline.id}
                pipeline={pipeline}
                onTrigger={() => handleTriggerPipeline(pipeline.id)}
              />
            ))
          )}
        </div>
      )}

      {/* New Pipeline Modal */}
      {showModal && (
        <NewPipelineModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ['/api/pipelines'] });
          }}
        />
      )}
    </div>
  );
};

export default PipelineDashboard;