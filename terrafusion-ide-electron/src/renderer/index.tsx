import React from 'react';
import { createRoot } from 'react-dom/client';
import SimpleTest from './components/SimpleTest';
// import TerraFusionIDE from './components/TerraFusionIDE';
// import './styles/globals.css';

// TypeScript declaration for TerraFusion IDE interface
declare global {
  interface Window {
    TerraFusionIDE?: {
      notifyReactReady?: () => void;
      hideLoadingScreen?: () => void;
      updateStatus?: (message: string) => void;
    };
  }
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container not found');
}

const root = createRoot(container);

// Use simple test component first to verify React is working
root.render(
  <React.StrictMode>
    <SimpleTest />
  </React.StrictMode>
);

// Signal to loading screen that React is ready
setTimeout(() => {
  if (window.TerraFusionIDE && window.TerraFusionIDE.notifyReactReady) {
    window.TerraFusionIDE.notifyReactReady();
  }
}, 100); // Small delay to ensure render is complete