import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Emergency Management System Initialization
console.log('🚨 TerraFusion Emergency Management System Initializing...');

// Performance monitoring for emergency response times
const startTime = performance.now();

// Initialize the Emergency Management application
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Mark emergency system as mounted
if (window.performance && window.performance.mark) {
  window.performance.mark('emergency-management-mount');
  const mountTime = performance.now() - startTime;
  console.log(`Emergency Management System loaded in ${mountTime.toFixed(2)}ms`);
}

// Register service worker for offline emergency capabilities
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/emergency-sw.js')
      .then((registration) => {
        console.log('Emergency Service Worker registered: ', registration);
      })
      .catch((registrationError) => {
        console.error('Emergency Service Worker registration failed: ', registrationError);
      });
  });
}

// Emergency system error handling
window.addEventListener('error', (event) => {
  console.error('Emergency System Global Error:', event.error);
  // In production, this would trigger emergency IT response
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Emergency System Unhandled Promise Rejection:', event.reason);
  // In production, this would trigger emergency IT response
});

// Emergency notification permissions
if ('Notification' in window) {
  if (Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Emergency notifications enabled');
      }
    });
  }
}

// Emergency system ready notification
console.log('🚨 TerraFusion Emergency Management System Ready');
console.log('📍 Benton County, Washington Emergency Operations');
console.log('☎️  Emergency Contact: (509) 628-2600');
console.log('🏢 EOC: 7122 W Okanogan Pl, Kennewick, WA');