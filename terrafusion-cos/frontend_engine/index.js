/**
 * TerraFusion cOS - Frontend Engine Entry Point
 * Official TerraFusion branded React application for government desktop OS
 * 
 * @architecture This is the ROOT of the entire frontend engine.
 * All design tokens flow from here via ThemeProvider.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import TerraFusionCOSApp from './App.jsx';

// Import ThemeProvider for canonical design token access
import { ThemeProvider } from './src/theme/ThemeProvider.jsx';

// Import global styles (includes design-system.css)
import './src/styles/global.css';

// Initialize TerraFusion cOS Desktop Application
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <TerraFusionCOSApp />
    </ThemeProvider>
  </React.StrictMode>
);

console.log('🏛️ TerraFusion cOS Frontend Engine initialized');
console.log('🎨 Design System loaded from canonical tokens');
console.log('✨ Government. Transcended.');

