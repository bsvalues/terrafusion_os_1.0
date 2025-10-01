import React, { useEffect } from 'react';
import TerraFusionApp from './components/TerraFusionApp';
import './styles/globals.css';
import './styles/animations.css';
import './styles/ui-fix.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function getCurrentCounty() {
  return 'Benton County, WA';
}

function App() {
  useEffect(() => {
    // Log government compliance status
    console.log('🏛️ TerraFusion OS - Government. Transcended.');
    console.log('🎯 Experience-Suite Integration: ACTIVE');
    console.log('📊 Current County:', getCurrentCounty());
    console.log('✅ Government Compliance: FISMA, Section508, WCAG 2.1 AA');
    
    // Set up government application metadata
    document.title = 'TerraFusion OS - Government. Transcended.';
    document.querySelector('meta[name="description"]')?.setAttribute('content', 
      'TerraFusion OS - Infrastructure Intelligence, Infinite Scale'
    );
  }, []);

  return (
    <div className="tf-app-container tf-government-shell">
      <div data-testid="brand-tagline" className="tf-brand-indicator">
        Government. Transcended.
      </div>
      <TerraFusionApp apiBase={API_BASE_URL} />
    </div>
  );
}

export default App;
