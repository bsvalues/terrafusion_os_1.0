import React, { useState } from 'react';
import { Play, Clock, CheckCircle, AlertCircle, GitBranch, ChevronRight, ChevronDown } from 'lucide-react';

const PipelineCard = ({ pipeline, onTrigger }) => {
  const [expanded, setExpanded] = useState(false);

  // Determine status color and icon
  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle size={14} className="mr-1" />,
          text: 'Completed'
        };
      case 'in_progress':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: <Clock size={14} className="mr-1" />,
          text: 'In Progress'
        };
      case 'failed':
        return {
          color: 'bg-red-100 text-red-800',
          icon: <AlertCircle size={14} className="mr-1" />,
          text: 'Failed'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800',
          icon: null,
          text: status.charAt(0).toUpperCase() + status.slice(1)
        };
    }
  };

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

  // Get status info for the pipeline
  const statusInfo = getStatusInfo(pipeline.status);

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-lg text-gray-800 truncate" title={pipeline.name}>
            {pipeline.name}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs flex items-center ${statusInfo.color}`}>
            {statusInfo.icon}
            {statusInfo.text}
          </span>
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2" title={pipeline.description}>
          {pipeline.description || 'No description provided'}
        </p>
        
        <div className="flex items-center text-xs text-gray-500 mb-4">
          <GitBranch size={14} className="mr-1" />
          {pipeline.repository} ({pipeline.branch})
        </div>
        
        {/* Pipeline Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">Last Run</div>
            <div className="font-medium">{formatDate(pipeline.lastRun)}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">Avg Duration</div>
            <div className="font-medium">{pipeline.averageDuration || 'N/A'}</div>
          </div>
          <div className="bg-gray-50 p-2 rounded">
            <div className="text-gray-500">Success Rate</div>
            <div className="font-medium">{pipeline.successRate ? `${pipeline.successRate}%` : 'N/A'}</div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            {expanded ? (
              <>
                <ChevronDown size={16} className="mr-1" />
                Hide Stages
              </>
            ) : (
              <>
                <ChevronRight size={16} className="mr-1" />
                View Stages
              </>
            )}
          </button>
          
          <button
            onClick={() => onTrigger(pipeline.id)}
            disabled={pipeline.status === 'in_progress'}
            className={`px-3 py-1 rounded text-sm flex items-center ${
              pipeline.status === 'in_progress'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <Play size={14} className="mr-1" />
            Run Pipeline
          </button>
        </div>
      </div>

      {/* Pipeline Stages */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Pipeline Stages</h4>
          <div className="space-y-3">
            {pipeline.stages.map((stage /* , index */) => {
              const stageStatus = getStatusInfo(stage.status);
              return (
                <div key={index} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    stageStatus.color.includes('bg-green') ? 'bg-green-500 text-white' :
                    stageStatus.color.includes('bg-blue') ? 'bg-blue-500 text-white' :
                    stageStatus.color.includes('bg-red') ? 'bg-red-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{stage.name}</span>
                      <span className={`text-xs ${stageStatus.color} px-2 py-0.5 rounded-full`}>
                        {stageStatus.text}
                      </span>
                    </div>
                    {stage.duration && (
                      <div className="text-xs text-gray-500">
                        Duration: {stage.duration}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineCard;