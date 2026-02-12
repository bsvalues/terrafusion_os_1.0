import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Layers, 
  BarChart3, 
  Timer
} from 'lucide-react';

const PipelineMetrics = ({ metrics }) => {
  if (!metrics) return null;

  const {
    totalPipelines,
    activePipelines,
    successfulPipelines,
    failedPipelines,
    avgSuccessRate,
    avgDuration,
    recentRuns
  } = metrics;

  const cards = [
    {
      title: 'Total Pipelines',
      value: totalPipelines,
      icon: <Layers size={20} className="text-indigo-500" />,
      color: 'bg-indigo-50'
    },
    {
      title: 'Active',
      value: activePipelines,
      icon: <Clock size={20} className="text-blue-500" />,
      color: 'bg-blue-50'
    },
    {
      title: 'Successful',
      value: successfulPipelines,
      icon: <CheckCircle size={20} className="text-green-500" />,
      color: 'bg-green-50'
    },
    {
      title: 'Failed',
      value: failedPipelines,
      icon: <AlertCircle size={20} className="text-red-500" />,
      color: 'bg-red-50'
    },
    {
      title: 'Success Rate',
      value: `${avgSuccessRate || 0}%`,
      icon: <BarChart3 size={20} className="text-purple-500" />,
      color: 'bg-purple-50'
    },
    {
      title: 'Avg Duration',
      value: avgDuration || 'N/A',
      icon: <Timer size={20} className="text-amber-500" />,
      color: 'bg-amber-50'
    }
  ];

  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mb-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Pipeline Metrics</h2>
        </div>
        
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 p-4">
          {cards.map((card /* , index */) => (
            <div key={index} className={`${card.color} p-4 rounded-lg shadow-sm`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm text-gray-600">{card.title}</h3>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className="p-2 rounded-full bg-white">{card.icon}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Recent Runs Table */}
        {recentRuns && recentRuns.length > 0 && (
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Pipeline Runs</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pipeline
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Run
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentRuns.map((run) => (
                    <tr key={run.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {run.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(run.status)}`}>
                          {run.status.charAt(0).toUpperCase() + run.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(run.lastRun)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PipelineMetrics;