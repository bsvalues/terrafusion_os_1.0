import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { useExtension } from '@/providers/extension-provider';
import { WebviewPanel } from './WebviewPanel';
import { Loader2 } from 'lucide-react';

interface WebviewInfo {
  id: string;
  title: string;
  extensionId: string;
}

interface MenuItem {
  id: string;
  label: string;
  command: string;
  webviewId?: string;
  extensionId: string;
}

interface ExtensionMenuItemsProps {
  onItemClick?: () => void;
}

export function ExtensionMenuItems({ onItemClick }: ExtensionMenuItemsProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWebview, setActiveWebview] = useState<WebviewInfo | null>(null);
  const { executeCommand } = useExtension();

  useEffect(() => {
    const fetchExtensionMenu = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // First, get all webviews
        const webviewsResponse = await apiRequest('/api/extensions/webviews');
        if (!webviewsResponse.ok) {
          throw new Error(`Failed to load webviews: ${webviewsResponse.statusText}`);
        }
        
        const webviews: WebviewInfo[] = await webviewsResponse.json();
        console.log('Fetched webviews:', webviews);
        
        // Get all extensions to generate menu items
        const extensionsResponse = await apiRequest('/api/extensions');
        if (!extensionsResponse.ok) {
          throw new Error(`Failed to load extensions: ${extensionsResponse.statusText}`);
        }
        
        const extensions = await extensionsResponse.json();
        console.log('Fetched extensions:', extensions);
        
        // Create an array of menu items
        const items: MenuItem[] = [];
        
        // Add menu items for each active extension
        for (const extension of extensions.filter(ext => ext.isActive)) {
          // Fetch extension details to get commands
          const extensionResponse = await apiRequest(`/api/extensions/${extension.id}`);
          if (!extensionResponse.ok) continue;
          
          const extensionDetails = await extensionResponse.json();
          
          // Add webview items
          const extensionWebviews = webviews.filter(w => w.extensionId === extension.id);
          for (const webview of extensionWebviews) {
            items.push({
              id: `${extension.id}-webview-${webview.id}`,
              label: webview.title,
              command: `extension.${extension.id}.openWebview.${webview.id}`,
              webviewId: webview.id,
              extensionId: extension.id
            });
          }
          
          // Add command items (if any)
          if (extensionDetails.commands) {
            extensionDetails.commands.forEach(cmd => {
              if (!cmd.hidden && !cmd.id.startsWith('extension.')) {
                items.push({
                  id: `${extension.id}-command-${cmd.id}`,
                  label: cmd.title,
                  command: cmd.id,
                  extensionId: extension.id
                });
              }
            });
          }
        }
        
        setMenuItems(items);
      } catch (err) {
        console.error('Error loading extension menu:', err);
        setError(err instanceof Error ? err.message : 'Failed to load extension menu');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchExtensionMenu();
  }, []);
  
  const handleMenuItemClick = async (item: MenuItem) => {
    if (onItemClick) {
      onItemClick();
    }
    
    try {
      if (item.webviewId) {
        // If this is a webview item, open the webview
        setActiveWebview({
          id: item.webviewId,
          title: item.label,
          extensionId: item.extensionId
        });
      } else {
        // Otherwise, execute the command
        await executeCommand(item.command);
      }
    } catch (error) {
      console.error('Error handling menu item click:', error);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="ml-2 text-sm text-gray-500">Loading extensions...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-red-500 text-sm">
        <p>Error loading extensions</p>
      </div>
    );
  }
  
  if (menuItems.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>No extension menu items available</p>
      </div>
    );
  }
  
  return (
    <>
      {menuItems.map((item) => (
        <button
          key={item.id}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
          onClick={() => handleMenuItemClick(item)}
        >
          {item.label}
        </button>
      ))}
      
      {activeWebview && (
        <WebviewPanel 
          webviewId={activeWebview.id}
          extensionId={activeWebview.extensionId}
          title={activeWebview.title}
          isOpen={!!activeWebview}
          onClose={() => setActiveWebview(null)}
        />
      )}
    </>
  );
}