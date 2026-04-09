import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';

interface PreviewPanelProps {
  projectId: string;
  status: 'STOPPED' | 'RUNNING' | 'ERROR';
  onTogglePreview: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ 
  projectId, 
  status, 
  onTogglePreview 
}) => {
  // In a real implementation, we would fetch the preview URL from the server
  const previewUrl = `/api/development/projects/${projectId}/preview`;
  
  const handleOpenInNewTab = () => {
    window.open(previewUrl, '_blank');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b bg-gray-50 p-2 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm font-medium">Preview</span>
          {status === 'RUNNING' && (
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
              Running
            </span>
          )}
          {status === 'ERROR' && (
            <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Error
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8" 
            onClick={onTogglePreview}
          >
            {status === 'RUNNING' ? (
              <>
                <Square className="h-4 w-4 mr-1" />
                Stop
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Start
              </>
            )}
          </Button>
          
          {status === 'RUNNING' && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8" 
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8" 
                onClick={handleOpenInNewTab}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Open in New Tab
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1">
        {status === 'RUNNING' ? (
          <iframe 
            src={previewUrl} 
            className="w-full h-full border-0" 
            title="Project Preview"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
          />
        ) : status === 'ERROR' ? (
          <div className="flex flex-col items-center justify-center h-full bg-red-50 p-6">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-red-800 mb-2">Preview Error</h3>
            <p className="text-red-600 text-center mb-4">
              There was an error starting the preview. Please check your code for errors.
            </p>
            <Button onClick={onTogglePreview}>
              Try Again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-6">
            <Play className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Preview Not Running</h3>
            <p className="text-gray-500 text-center mb-4">
              Start the preview to see your application in action.
            </p>
            <Button onClick={onTogglePreview}>
              Start Preview
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewPanel;