import React from 'react';
import ReactDOM from 'react-dom/client';

import Router from './Router';

// TerraFusion OS Experience-Suite Integration
// Government. Transcended.

// Initialize MSW for development mode
async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const { worker } = await import('./mocks/browser');
  
  // Start the worker with government data simulation
  return worker.start({
    onUnhandledRequest: 'warn',
    serviceWorker: {
      url: '/mockServiceWorker.js'
    }
  });
}

// Initialize TerraFusion brand tokens and county theming
function initializeTerraFusionBranding() {
  // Load base TerraFusion brand tokens
  const baseTokens = document.createElement('link');
  baseTokens.id = 'tf-base';
  baseTokens.rel = 'stylesheet';
  baseTokens.href = '/src/styles/tokens-base.css';
  document.head.appendChild(baseTokens);
  
  // Set government compliance attributes
  document.documentElement.setAttribute('data-government-compliant', 'true');
  document.documentElement.setAttribute('data-terrafusion-version', '1.0.0');
  document.body.setAttribute('data-brand', 'terrafusion');
  
  // Initialize county theming system
  import('./brand/countyTheme').then(({ initializeCountyTheme }) => {
    initializeCountyTheme();
  }).catch(console.warn);
}

// Start TerraFusion OS with full experience-suite integration
enableMocking().then(() => {
  // Initialize branding system
  initializeTerraFusionBranding();
  
  // Create root and render with government compliance wrapper
  const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
  
  root.render(
    <React.StrictMode>
      <div data-testid="terrafusion-app" className="tf-government-app">
        <Router />
      </div>
    </React.StrictMode>
  );
}).catch(console.error);
