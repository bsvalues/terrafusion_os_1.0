import React, { useState, useEffect } from 'react';
import { getViteEnv } from '@/shared/viteEnv';

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
          maximize: () => {
            setIsMaximized(!isMaximized);
          },
          close: () => {
            if (confirm('Close Terrafusion OS?')) window.close();
          },
          openExternal: (url: string) => {
            window.open(url, '_blank');
          },
        },
        api: {
          port: parseInt(getViteEnv().TF_API_PORT || '5000', 10),
          baseUrl: getViteEnv().VITE_API_URL || '/api',
          getPort: async () => parseInt(getViteEnv().TF_API_PORT || '5000', 10),
          getBaseUrl: async () => getViteEnv().VITE_API_URL || '/api',
        },
        isDesktop: false,
      };
    }
  }, [isMaximized]);

  return (
    <div
      className='tf-government-interface tf-ultimate-component tf-perf-adaptive'
      data-performance='excellent'
      data-ai-agent-count='1008'
    >
      <div className='tf-window-controls'>
        <button
          onClick={() => window.terrafusion?.shell.minimize()}
          className='tf-window-control tf-window-minimize tf-ultimate-focusable'
          title='Minimize Terrafusion OS'
        />
        <button
          onClick={() => window.terrafusion?.shell.maximize()}
          className='tf-window-control tf-window-maximize tf-ultimate-focusable'
          title='Maximize Terrafusion OS'
        />
        <button
          onClick={() => window.terrafusion?.shell.close()}
          className='tf-window-control tf-window-close tf-ultimate-focusable'
          title='Close Terrafusion OS'
        />
      </div>

      <div className='tf-layout-main tf-container'>{children}</div>
    </div>
  );
};

export default OSShellWindow;
