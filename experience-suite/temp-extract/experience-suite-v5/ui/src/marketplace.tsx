import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './components/GovernmentComponents.css';
import './components/ValidationStyles.css';

// Import marketplace components
import { ModuleMarketplace } from './components/GovernmentComponents';
import { RevenueDashboard } from './components/RevenueDashboard';

// Direct marketplace app for debugging
function MarketplaceApp() {
  return (
    <div className="tf-app tf-marketplace-app">
      <header className="tf-header">
        <div className="tf-logo-section">
          <h1>🏪 TerraFusion OS Government Marketplace</h1>
          <p>World's First Government Module Marketplace - Hot-Swappable Government Apps</p>
        </div>
        <div className="tf-header-stats">
          <span>37+ Modules Available</span>
          <span>$619/County ARPU</span>
          <span>70/30 Revenue Split</span>
        </div>
      </header>

      <main className="tf-main tf-marketplace-main">
        {/* Module Marketplace - Primary Focus */}
        <ModuleMarketplace />
        
        {/* Revenue Dashboard */}
        <RevenueDashboard />
      </main>

      <footer className="tf-footer">
        <p>TerraFusion OS Government Marketplace | Hot-Swappable Module System</p>
        <p>Government-Grade Security | Revenue Management | County Operations</p>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<MarketplaceApp />);

export default MarketplaceApp;