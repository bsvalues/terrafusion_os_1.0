import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Performance monitoring
const startTime = performance.now();

// Initialize the Geospatial Intelligence application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Mark initialization complete
if (window.performance && window.performance.mark) {
  window.performance.mark('geospatial-intelligence-mount');
}

// Register service worker for offline capabilities
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Error boundary for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
    <App />
  </React.StrictMode>,
);

// Log load time for monitoring
window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime;
  console.log(`Geospatial Intelligence Services loaded in ${loadTime.toFixed(2)}ms`);
});