/**
 * TerraFusion cOS - Frontend Engine Entry Point
 * Official TerraFusion branded React application for government desktop OS
 * 
 * @architecture This is the ROOT of the entire frontend engine.
 * All design tokens flow from here via ThemeProvider.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import RouterApp from './RouterApp.jsx';

// Import ThemeProvider for canonical design token access
import { ThemeProvider } from './src/theme/ThemeProvider.jsx';

// Import global styles (includes design-system.css)
import './src/styles/global.css';

// Initialize TerraFusion cOS Desktop Application with Router
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterApp />
    </ThemeProvider>
  </React.StrictMode>
);

console.log('🏛️ TerraFusion cOS Frontend Engine initialized with React Router');
console.log('🎨 Design System loaded from canonical tokens');
console.log('✨ Government. Transcended.');

