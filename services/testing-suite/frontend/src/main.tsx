import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// TerraFusion Testing Suite - Main Entry Point
// Port \${{TF_PORT_4000:-4000}} - Automated Testing Dashboard for Quality Assurance

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);