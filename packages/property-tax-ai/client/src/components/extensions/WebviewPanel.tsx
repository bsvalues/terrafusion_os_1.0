import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';

interface WebviewPanelProps {
  webviewId: string;
  extensionId: string;
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export function WebviewPanel({
  webviewId,
  extensionId,
  title,
  isOpen,
  onClose
}: WebviewPanelProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messageChannel, setMessageChannel] = useState<MessageChannel | null>(null);
  const iframeId = `webview-iframe-${webviewId}`;

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchWebviewContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`Fetching webview content for ${extensionId}/${webviewId}...`);
        
        // First check if the extension itself exists and is active
        const extensionResponse = await apiRequest(`/api/extensions/${extensionId}`);
        if (!extensionResponse.ok) {
          const errorText = await extensionResponse.text();
          console.error(`Failed to fetch extension ${extensionId}:`, errorText);
          throw new Error(`Extension not available. Details: ${errorText}`);
        }
        
        const extensionData = await extensionResponse.json();
        if (!extensionData.active) {
          console.error(`Extension ${extensionId} is not active.`);
          throw new Error(`Extension ${extensionData.name} is not active. Please activate it first.`);
        }
        
        // Now fetch the webview content
        const response = await apiRequest(`/api/extensions/${extensionId}/webviews/${webviewId}`);
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Failed to load webview content: ${response.statusText}`, errorText);
          throw new Error(`Failed to load webview content: ${response.statusText}. Details: ${errorText}`);
        }
        
        const contentText = await response.text();
        console.log(`Successfully loaded webview content for ${extensionId}/${webviewId}`);
        setContent(contentText);
      } catch (err) {
        console.error('Error loading webview content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load webview content');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWebviewContent();

    // Create a message channel for communication
    const channel = new MessageChannel();
    setMessageChannel(channel);

    // Clean up when the component unmounts
    return () => {
      if (messageChannel) {
        messageChannel.port1.close();
        messageChannel.port2.close();
      }
      setMessageChannel(null);
    };
  }, [isOpen, extensionId, webviewId]);

  // Setup communication with the iframe after it loads
  useEffect(() => {
    if (!messageChannel || !content) return;

    const iframe = document.getElementById(iframeId) as HTMLIFrameElement;
    if (!iframe || !iframe.contentWindow) return;

    // Setup listeners for messages from the iframe
    messageChannel.port1.onmessage = (event) => {
      if (event.data.type === 'webview.ready') {
        console.log('Webview is ready', event.data.status || 'success');
      } else if (event.data.type === 'webview.action') {
        // Handle actions requested by the webview
        console.log('Webview action:', event.data.action, event.data);
        
        if (event.data.action === 'close') {
          onClose();
        } else if (event.data.action === 'retry') {
          console.log('Retrying webview content load...');
          setIsLoading(true);
          setError(null);
          setContent(null);
          
          // Re-fetch the content after a short delay
          setTimeout(() => {
            const fetchWebviewContent = async () => {
              try {
                const response = await apiRequest(`/api/extensions/${extensionId}/webviews/${webviewId}`);
                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`Failed to load webview content: ${response.statusText}. Details: ${errorText}`);
                }
                const contentText = await response.text();
                setContent(contentText);
              } catch (err) {
                console.error('Error reloading webview content:', err);
                setError(err instanceof Error ? err.message : 'Failed to reload webview content');
              } finally {
                setIsLoading(false);
              }
            };
            
            fetchWebviewContent();
          }, 500);
        } else if (event.data.action === 'activate') {
          console.log(`Attempting to activate extension ${extensionId}...`);
          
          apiRequest(`/api/extensions/${extensionId}/activate`, { method: 'POST' })
            .then(response => {
              if (response.ok) {
                console.log(`Extension ${extensionId} activated successfully`);
                // Retry loading the webview
                setIsLoading(true);
                setError(null);
                setTimeout(() => window.location.reload(), 1000);
              } else {
                console.error(`Failed to activate extension ${extensionId}`, response.statusText);
              }
            })
            .catch(err => console.error(`Error activating extension ${extensionId}`, err));
        }
      }
    };

    // Wait for iframe to load, then setup communication
    const handleIframeLoad = () => {
      iframe.contentWindow?.postMessage({ 
        type: 'host.connected',
        extensionId
      }, '*', [messageChannel.port2]);
    };

    iframe.addEventListener('load', handleIframeLoad);
    return () => {
      iframe.removeEventListener('load', handleIframeLoad);
    };
  }, [messageChannel, content, extensionId, iframeId, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Extension: {extensionId}
          </DialogDescription>
        </DialogHeader>
        
        <div className="relative h-[70vh] border rounded-md bg-background">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-gray-500">Loading webview content...</span>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center p-4 max-w-lg">
                <p className="text-red-500 font-medium mb-2">Error loading webview</p>
                <p className="text-gray-600 mb-4">{error}</p>
                <div className="flex flex-col space-y-2">
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => {
                      console.log(`Attempting to activate extension ${extensionId}...`);
                      apiRequest(`/api/extensions/${extensionId}/activate`, { method: 'POST' })
                        .then(response => {
                          if (response.ok) {
                            console.log(`Extension ${extensionId} activated successfully`);
                            // Retry loading the webview
                            setIsLoading(true);
                            setError(null);
                            setTimeout(() => {
                              window.location.reload();
                            }, 1000);
                          } else {
                            console.error(`Failed to activate extension ${extensionId}`, response.statusText);
                          }
                        })
                        .catch(err => console.error(`Error activating extension ${extensionId}`, err));
                    }}
                  >
                    Activate Extension
                  </button>
                  <button 
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    onClick={() => {
                      setIsLoading(true);
                      setError(null);
                      setTimeout(() => {
                        window.location.reload();
                      }, 500);
                    }}
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <iframe 
              id={iframeId}
              srcDoc={content || ''}
              className="h-full w-full border-0"
              title={`${extensionId} - ${webviewId}`}
              sandbox="allow-scripts allow-forms"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}