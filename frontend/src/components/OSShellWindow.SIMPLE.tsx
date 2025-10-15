import React, { useState, useEffect } from 'react';

interface OSShellWindowProps {
  children: React.ReactNode;
}

interface TerraFusionBridge {
  shell: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    openExternal: (_url: string) => void;
  };
  api: {
    port?: number;
    baseUrl?: string;
    getPort: () => Promise<number>;
    getBaseUrl: () => Promise<string>;
  };
  isDesktop?: boolean;
}

declare global {
  interface Window {
    terrafusion?: TerraFusionBridge;
  }
}

// THE TERRAFUSION WAY: Simple wrapper, no loading screens
// Dashboard components handle their own data fetching
const OSShellWindow: React.FC<OSShellWindowProps> = ({ children }) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Initialize bridge for native shell integration
    if (!window.terrafusion) {
      window.terrafusion = {
        shell: {
          minimize: () => {},
          maximize: () => { setIsMaximized(!isMaximized); },
          close: () => { if (confirm('Close Terrafusion OS?')) window.close(); },
          openExternal: (url: string) => { window.open(url, '_blank'); }
        },
        api: {
          port: 5000,
          baseUrl: 'http://localhost:5000',
          getPort: async () => 5000,
          getBaseUrl: async () => 'http://localhost:5000'
        },
        isDesktop: false
      };
    }
  }, [isMaximized]);

  return (
    <div className="tf-government-interface tf-ultimate-component tf-perf-adaptive" 
         data-performance="excellent"
         data-ai-agent-count="1008">
      <div className="tf-window-controls">
        <button 
          onClick={() => window.terrafusion?.shell.minimize()}
          className="tf-window-control tf-window-minimize tf-ultimate-focusable"
          title="Minimize Terrafusion OS"
        />
        <button 
          onClick={() => window.terrafusion?.shell.maximize()}
          className="tf-window-control tf-window-maximize tf-ultimate-focusable"
          title="Maximize Terrafusion OS"
        />
        <button 
          onClick={() => window.terrafusion?.shell.close()}
          className="tf-window-control tf-window-close tf-ultimate-focusable"
          title="Close Terrafusion OS"
        />
      </div>
      
      <div className="tf-layout-main tf-container">
        {children}
      </div>
    </div>
  );
};

export default OSShellWindow;
