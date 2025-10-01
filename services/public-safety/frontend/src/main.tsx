import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Performance monitoring
const startTime = performance.now();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Log load time for monitoring
window.addEventListener('load', () => {
  const loadTime = performance.now() - startTime;
  console.log(`Public Safety Services loaded in ${loadTime.toFixed(2)}ms`);
});