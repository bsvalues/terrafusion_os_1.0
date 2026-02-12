import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('⚡ TERRALEVY IGNITION SEQUENCE START ⚡');

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  document.body.innerHTML = '<h1>CRITICAL: ROOT ELEMENT MISSING</h1>';
}
