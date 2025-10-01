// TerraFusion OS - Development Entry Point with MSW
// Government. Transcended.

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeCountyTheme } from './brand/countyTheme';

async function enableMSW() {
  if (import.meta.env.DEV) {
    console.log('🏛️  TerraFusion OS - Initializing Development Environment');
    console.log('Government. Transcended.');
    
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({ 
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js'
        }
      });
      
      console.log('✅ MSW enabled for government data simulation');
      console.log('📡 Mock endpoints active:');
      console.log('   • /api/health - System health');
      console.log('   • /api/parcels - Government property data');
      console.log('   • /api/agents/status - AI agent monitoring');
      console.log('   • /api/county/*/theme - County theming');
      console.log('   • /api/realtime/updates - Live updates');
      
    } catch (error) {
      console.error('❌ MSW initialization failed:', error);
    }
  }
}

async function initializeApp() {
  try {
    // Initialize MSW for development
    await enableMSW();
    
    // Initialize county theming system
    await initializeCountyTheme();
    
    console.log('🚀 TerraFusion OS initialized successfully');
    console.log('Infrastructure Intelligence, Infinite Scale');
    
    // Render React application
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    
  } catch (error) {
    console.error('💥 TerraFusion OS initialization failed:', error);
    
    // Fallback render without MSW
    const root = ReactDOM.createRoot(document.getElementById('root')!);
    root.render(
      <React.StrictMode>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #0a0f1c, #1a2332)',
          color: '#e6f1ff',
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          textAlign: 'center'
        }}>
          <div>
            <h1>🏛️ TerraFusion OS</h1>
            <p>Government. Transcended.</p>
            <p style={{ color: '#ff3333' }}>
              Development environment initialization failed.
            </p>
            <p style={{ fontSize: '0.9em', opacity: 0.7 }}>
              Check console for details.
            </p>
          </div>
        </div>
      </React.StrictMode>
    );
  }
}

// Initialize TerraFusion OS
initializeApp();