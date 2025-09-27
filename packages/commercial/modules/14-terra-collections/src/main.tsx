import React from 'react';
import ReactDOM from 'react-dom/client';
import BrandedApp from './BrandedApp';
import '../../../src/terrafusion-unified.css';

// Initialize Collections with Terrafusion Branding
console.log('🏆 Collections - Terrafusion Championship Edition');
console.log('⚡ Government. Transcended.');

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode><BrandedApp /></React.StrictMode>
);
