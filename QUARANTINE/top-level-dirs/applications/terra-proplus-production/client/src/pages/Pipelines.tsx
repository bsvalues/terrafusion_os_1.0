import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getPipelineStatus, triggerPipeline } from '../api';
import { queryClient } from '../lib/queryClient';
import { formatDistance } from 'date-fns';

// Status pill component for pipeline statuses
const StatusPill = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusStyle()}`}>
      {status}
    </span>
  );
};

const Pipelines = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPipelineData, setNewPipelineData] = useState({
    name: '',
    repository: '',
    branch: 'main',
    type: 'build',
  });

  // Fetch pipeline data
  const { data: pipelines, isLoading } = useQuery({
    queryKey: ['/api/pipelines/status'],
    queryFn: () => getPipelineStatus(),
    staleTime: 30000
  });

  // Mutation for triggering a pipeline
  const triggerPipelineMutation = useMutation({
    mutationFn: triggerPipeline,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/pipelines/status'] });
      setShowCreateModal(false);
      setNewPipelineData({
        name: '',
        repository: '',
        branch: 'main',
        type: 'build',
      });
    }
  });

  // Sample pipeline data for when the API is not yet implemented
  const samplePipelines = [
    {
      id: 'pipe-1',
      name: 'Production Deploy',
      status: 'success',
      type: 'deploy',
      repository: 'terrafusion/main',
      commit: '67a8e2d',
      branch: 'main',
      triggered_by: 'John Smith',
      triggered_at: new Date(Date.now() - 1800000), // 30 minutes ago
      duration: '5m 23s',
      stages: [
        { name: 'Build', status: 'success', duration: '2m 12s' },
        { name: 'Test', status: 'success', duration: '1m 45s' },
        { name: 'Deploy', status: 'success', duration: '1m 26s' },
      ]
    },
    {
      id: 'pipe-2',
      name: 'Feature Branch Test',
      status: 'running',
      type: 'test',
      repository: 'terrafusion/main',
      commit: '3fe791b',
      branch: 'feature/new-dashboard',
      triggered_by: 'Jane Doe',
      triggered_at: new Date(Date.now() - 600000), // 10 minutes ago
      duration: 'Running',
      stages: [
        { name: 'Build', status: 'success', duration: '2m 30s' },
        { name: 'Test', status: 'running', duration: 'Running' },
        { name: 'Deploy', status: 'pending', duration: '-' },
      ]
    },
    {
      id: 'pipe-3',
      name: 'Hotfix Deploy',
      status: 'failed',
      type: 'deploy',
      repository: 'terrafusion/main',
      commit: 'f9e4d2c',
      branch: 'hotfix/auth-issue',
      triggered_by: 'Alice Wilson',
      triggered_at: new Date(Date.now() - 7200000), // 2 hours ago
      duration: '3m 12s',
      stages: [
        { name: 'Build', status: 'success', duration: '2m 05s' },
        { name: 'Test', status: 'failed', duration: '1m 07s' },
        { name: 'Deploy', status: 'cancelled', duration: '-' },
      ]
    }
  ];

  const pipelineData = pipelines || samplePipelines;

  const handleTriggerPipeline = () => {
    triggerPipelineMutation.mutate(newPipelineData);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div><>

          <h1 className="text-2xl font-bold mb-2">CI/CD Pipelines</h1>
          <p
</> className="text-gray-600">
            Manage and monitor your continuous integration and deployment pipelines
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Trigger Pipeline
        </button>
      </div>

      {/* Pipeline Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6"><>

          <h3 className="text-sm font-medium text-gray-500 mb-3">Total Pipelines</h3>
          <div
</> className="flex justify-between items-baseline"><>

            <p className="text-3xl font-bold">{pipelineData.length}</p>
            <p
</> className="text-sm text-gray-500">Last 30 days</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6"><>

          <h3 className="text-sm font-medium text-gray-500 mb-3">Success Rate</h3>
          <div
</> className="flex justify-between items-baseline"><>

            <p className="text-3xl font-bold">
              {Math.round(
                (pipelineData.filter(p => p.status === 'success').length / pipelineData.length) * 100
              )}%
            </p>
            <p
</> className="text-sm text-green-600 flex items-center">
              <span className="mr-1">↑</span>
              5%
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm p-6"><>

          <h3 className="text-sm font-medium text-gray-500 mb-3">Average Duration</h3>
          <div
</> className="flex justify-between items-baseline"><>

            <p className="text-3xl font-bold">4m 12s</p>
            <p
</> className="text-sm text-green-600 flex items-center">
              <span className="mr-1">↓</span>
              23s
            </p>
          </div>
        </div>
      </div>

      {/* Active Pipelines */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-medium mb-4">Active Pipelines</h2>
        
        {pipelineData.filter(p => p.status === 'running').length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No pipelines currently running
          </div>
        ) : (
          <div className="space-y-4">
            {pipelineData
              .filter(p => p.status === 'running')
              .map(pipeline => (
                <div key={pipeline.id} className="border rounded-lg overflow-hidden">
                  <div className="flex justify-between items-center bg-gray-50 px-4 py-3">
                    <div className="flex items-center"><>

                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
                      <span
</> className="font-medium">{pipeline.name}</span>
                    </div><>

                    <StatusPill status={pipeline.status} />
                  </div>
                  
                  <div
</> className="px-4 py-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between text-sm mb-4">
                      <div className="mb-2 sm:mb-0"><>

                        <span className="text-gray-500 mr-2">Repository:</span>
                        <span
</>>{pipeline.repository}</span>
                      </div>
                      <div className="mb-2 sm:mb-0"><>

                        <span className="text-gray-500 mr-2">Branch:</span>
                        <span
</>>{pipeline.branch}</span>
                      </div>
                      <div><>

                        <span className="text-gray-500 mr-2">Triggered:</span>
                        <span
</>>{formatDistance(new Date(pipeline.triggered_at), new Date(), { addSuffix: true })}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {pipeline.stages.map((stage /* , index */) => (
                        <div key={index} className="flex items-center"><>

                          <div className="w-1/4 font-medium">{stage.name}</div>
                          <div
</> className="w-3/4">
                            <div className="relative">
                              <div className="h-2 bg-gray-200 rounded-full">
                                <div 
                                  className={`h-2 rounded-full ${
                                    stage.status === 'success' ? 'bg-green-500' : 
                                    stage.status === 'running' ? 'bg-blue-500 animate-pulse' : 
                                    stage.status === 'failed' ? 'bg-red-500' : 
                                    'bg-gray-400'
                                  }`}
                                  style={{ 
                                    width: stage.status === 'success' ? '100%' : 
                                          stage.status === 'running' ? '60%' : 
                                          stage.status === 'failed' ? '100%' : '0%'
                                  }}
                                ></div>
                              </div>
                              <div className="flex justify-between mt-1 text-xs text-gray-500"><>

                                <span>{stage.status}</span>
                                <span
</>>{stage.duration}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="px-4 py-2 border-t flex justify-end">
                    <button className="text-sm text-primary hover:text-primary-dark font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Pipeline History */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-4"><>

          <h2 className="text-lg font-medium">Pipeline History</h2>
          <div
</> className="flex space-x-2">
            <select className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"><>

              <option>All Pipelines</option>
              <option
</>>Build Pipelines</option><>

              <option>Deploy Pipelines</option>
              <option
</>>Test Pipelines</option>
            </select>
            <select className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary"><>

              <option>All Statuses</option>
              <option
</>>Success</option><>

              <option>Failed</option>
              <option
</>>Running</option>
              <option>Cancelled</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr><>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pipeline
                </th>
                <th
</> className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th><>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Commit
                </th>
                <th
</> className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th><>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Triggered By
                </th>
                <th
</> className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pipelineData.map((pipeline) => (
                <tr key={pipeline.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="ml-4"><>

                        <div className="text-sm font-medium text-gray-900">{pipeline.name}</div>
                        <div
</> className="text-xs text-gray-500">
                          {formatDistance(new Date(pipeline.triggered_at), new Date(), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><>

                    <StatusPill status={pipeline.status} />
                  </td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="font-mono">{pipeline.commit}</span>
                  </td><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pipeline.branch}
                  </td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pipeline.triggered_by}
                  </td><>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pipeline.duration}
                  </td>
                  <td
</> className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><>

                    <button className="text-primary hover:text-primary-dark mr-3">
                      Logs
                    </button>
                    <button
</> className="text-primary hover:text-primary-dark">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex justify-between items-center"><>

          <div className="text-sm text-gray-500">
            Showing {pipelineData.length} of {pipelineData.length} pipelines
          </div>
          <div
</> className="flex space-x-2"><>

            <button className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <button
</> className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create Pipeline Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4"><>

              <h3 className="text-lg font-medium">Trigger New Pipeline</h3>
              <button
</> 
                className="text-gray-500 hover:text-gray-700"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pipeline Name
                </label>
                <input
</>
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newPipelineData.name}
                  onChange={(e) => setNewPipelineData({...newPipelineData, name: e.target.value})}
                  placeholder="e.g. Production Deploy"
                />
              </div>
              
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository
                </label>
                <input
</>
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newPipelineData.repository}
                  onChange={(e) => setNewPipelineData({...newPipelineData, repository: e.target.value})}
                  placeholder="e.g. terrafusion/main"
                />
              </div>
              
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <input
</>
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newPipelineData.branch}
                  onChange={(e) => setNewPipelineData({...newPipelineData, branch: e.target.value})}
                  placeholder="e.g. main"
                />
              </div>
              
              <div><>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pipeline Type
                </label>
                <select
</>
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={newPipelineData.type}
                  onChange={(e) => setNewPipelineData({...newPipelineData, type: e.target.value})}
                ><>

                  <option value="build">Build</option>
                  <option
</> value="test">Test</option>
                  <option value="deploy">Deploy</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3"><>

              <button 
                className="px-4 py-2 border border-gray-300 rounded-md text-sm"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
</> 
                className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-dark"
                onClick={handleTriggerPipeline}
                disabled={!newPipelineData.name || !newPipelineData.repository}
              >
                {triggerPipelineMutation.isPending ? 'Triggering...' : 'Trigger Pipeline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pipelines;