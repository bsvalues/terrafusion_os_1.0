import { apiRequest, apiJsonRequest } from '@/lib/queryClient';

export interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  isActive: boolean;
  commands?: {
    id: string;
    title: string;
    hidden?: boolean;
  }[];
  settings?: {
    id: string;
    label: string;
    type: string;
    default: any;
    value?: any;
  }[];
}

export interface WebviewInfo {
  id: string;
  title: string;
  extensionId: string;
}

export class ExtensionService {
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();

  /**
   * Get all registered extensions
   */
  async getExtensions(): Promise<Extension[]> {
    try {
      console.log('Fetching extensions from API...');
      const response = await apiRequest('/api/extensions');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get extensions: ${response.statusText}`, errorText);
        throw new Error(`Failed to get extensions: ${response.statusText} - ${errorText}`);
      }
      
      const extensions = await response.json();
      console.log(`Successfully loaded ${extensions.length} extensions`);
      return extensions;
    } catch (error) {
      console.error('Error getting extensions:', error);
      
      // Return empty array instead of throwing to prevent UI from breaking
      return [];
    }
  }

  /**
   * Get details for a specific extension
   */
  async getExtension(extensionId: string): Promise<Extension | null> {
    try {
      console.log(`Fetching extension details for ${extensionId}`);
      const response = await apiRequest(`/api/extensions/${extensionId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get extension ${extensionId}: ${response.statusText}`, errorText);
        throw new Error(`Failed to get extension ${extensionId}: ${response.statusText} - ${errorText}`);
      }
      
      const extension = await response.json();
      console.log(`Successfully loaded extension ${extensionId}`, extension);
      return extension;
    } catch (error) {
      console.error(`Error getting extension ${extensionId}:`, error);
      return null;
    }
  }

  /**
   * Get all available webviews
   */
  async getWebviews(): Promise<WebviewInfo[]> {
    try {
      console.log('Fetching webviews from API...');
      const response = await apiRequest('/api/extensions/webviews');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get webviews: ${response.statusText}`, errorText);
        throw new Error(`Failed to get webviews: ${response.statusText} - ${errorText}`);
      }
      
      const webviews = await response.json();
      console.log(`Successfully loaded ${webviews.length} webviews`);
      return webviews;
    } catch (error) {
      console.error('Error getting webviews:', error);
      
      // Return empty array instead of throwing to prevent UI from breaking
      return [];
    }
  }

  /**
   * Get webview content for a specific extension's webview
   */
  async getWebviewContent(extensionId: string, webviewId: string): Promise<string> {
    try {
      console.log(`Fetching webview content for ${extensionId}/${webviewId}...`);
      
      // First, ensure the extension is active
      const extensionResponse = await apiRequest(`/api/extensions/${extensionId}`);
      if (!extensionResponse.ok) {
        const errorText = await extensionResponse.text();
        console.error(`Failed to fetch extension ${extensionId}:`, errorText);
        throw new Error(`Extension not available. Details: ${errorText}`);
      }
      
      const extensionData = await extensionResponse.json();
      if (!extensionData.active) {
        console.log(`Extension ${extensionId} is not active. Activating...`);
        
        // Attempt to activate the extension
        const activateResponse = await apiRequest(`/api/extensions/${extensionId}/activate`, {
          method: 'POST'
        });
        
        if (!activateResponse.ok) {
          const errorText = await activateResponse.text();
          console.error(`Failed to activate extension ${extensionId}:`, errorText);
          throw new Error(`Failed to activate extension ${extensionId}. Details: ${errorText}`);
        }
        
        console.log(`Extension ${extensionId} activated successfully`);
      }
      
      // Now fetch the webview content
      const response = await apiRequest(`/api/extensions/${extensionId}/webviews/${webviewId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to get webview content: ${response.statusText}`, errorText);
        throw new Error(`Failed to get webview content: ${response.statusText}. Details: ${errorText}`);
      }
      
      const contentText = await response.text();
      console.log(`Successfully loaded webview content for ${extensionId}/${webviewId} (${contentText.length} bytes)`);
      return contentText;
    } catch (error) {
      console.error('Error getting webview content:', error);
      
      // Return basic error HTML instead of throwing
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Webview Error</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; text-align: center; }
            .error { color: #e53e3e; margin: 20px 0; }
            .actions { margin-top: 20px; }
            button { 
              padding: 8px 16px; 
              background: #3182ce; 
              color: white; 
              border: none; 
              border-radius: 4px; 
              cursor: pointer; 
              margin: 0 5px;
            }
            button.secondary { background: #cbd5e0; color: #1a202c; }
          </style>
        </head>
        <body>
          <h2>Failed to load webview content</h2>
          <p class="error">${error instanceof Error ? error.message : 'Unknown error'}</p>
          <div class="actions">
            <button onclick="window.parent.postMessage({ type: 'webview.action', action: 'retry' }, '*')">Retry</button>
            <button class="secondary" onclick="window.parent.postMessage({ type: 'webview.action', action: 'close' }, '*')">Close</button>
          </div>
          <script>
            // Notify the parent that the webview is ready
            window.parent.postMessage({ type: 'webview.ready', status: 'error' }, '*');
          </script>
        </body>
        </html>
      `;
    }
  }

  /**
   * Activate an extension
   */
  async activateExtension(extensionId: string): Promise<void> {
    try {
      const response = await apiRequest(`/api/extensions/${extensionId}/activate`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to activate extension ${extensionId}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error activating extension ${extensionId}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate an extension
   */
  async deactivateExtension(extensionId: string): Promise<void> {
    try {
      const response = await apiRequest(`/api/extensions/${extensionId}/deactivate`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to deactivate extension ${extensionId}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error deactivating extension ${extensionId}:`, error);
      throw error;
    }
  }

  /**
   * Execute a command
   */
  async executeCommand(commandId: string, args?: any[]): Promise<any> {
    try {
      const response = await apiRequest('/api/extensions/commands/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          commandId,
          args: args || []
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to execute command ${commandId}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error executing command ${commandId}:`, error);
      throw error;
    }
  }

  /**
   * Update extension settings
   */
  async updateExtensionSettings(extensionId: string, settings: Record<string, any>): Promise<void> {
    try {
      const response = await apiRequest(`/api/extensions/${extensionId}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update extension settings: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating extension settings:', error);
      throw error;
    }
  }

  /**
   * Subscribe to extension events
   */
  addEventListener(event: string, callback: (data: any) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)?.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit an extension event
   * @private - This is for internal use only
   */
  private emit(event: string, data: any): void {
    const callbacks = this.eventListeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}