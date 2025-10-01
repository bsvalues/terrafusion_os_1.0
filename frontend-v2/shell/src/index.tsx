import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { store } from './store/store';
import { App } from './App';
import './index.css';
import './tf-brand.css'; // TerraFusion Brand Assets - Government. Transcended.

// Initialize TerraFusion Brand System
function initializeTerraFusionBranding() {
  // Load TerraFusion brand configuration
  fetch('/tf-brand-config.json')
    .then(response => response.json())
    .then(brandConfig => {
      // Apply brand colors as CSS variables
      const root = document.documentElement;
      const colors = brandConfig.brand.colors;
      
      root.style.setProperty('--tf-primary', colors.primary);
      root.style.setProperty('--tf-primaryDark', colors.primaryDark);
      root.style.setProperty('--tf-accent', colors.accent);
      root.style.setProperty('--tf-transcend', colors.transcend);
      root.style.setProperty('--tf-dark', colors.dark);
      root.style.setProperty('--tf-light', colors.light);
      
      // Set brand attributes
      document.body.setAttribute('data-brand', 'terrafusion');
      document.body.setAttribute('data-essence', 'government-transcended');
      document.body.className += ' tf-government-app';
      document.title = brandConfig.brand.name + ' - ' + brandConfig.brand.tagline;
      
      console.log('✨ TerraFusion Brand System Loaded: ' + brandConfig.brand.essence);
    })
    .catch(console.warn);
}

console.log('🎯 TerraFusion OS Frontend Shell v2.0.0');
console.log('🏛️ Government. Transcended.');
console.log('⚡ MIT PhD-Level Architecture Loading...');
console.log('🎨 Initializing TerraFusion Brand Assets...');

// Initialize brand system before render
initializeTerraFusionBranding();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
