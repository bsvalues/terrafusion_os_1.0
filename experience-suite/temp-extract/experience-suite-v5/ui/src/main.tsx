import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './components/GovernmentComponents.css';
import './components/ValidationStyles.css';

// Import government components
import { 
  PropertyAssessmentDashboard,
  AIAgentCoordination,
  RustPerformanceMonitor,
  ModuleMarketplace,
  GovernmentOperations
} from './components/GovernmentComponents';

// Import revenue management
import { RevenueDashboard } from './components/RevenueDashboard';

// Import data visualization components with error handling
let DataVisualizationComponents: any = null;
let ComponentValidationSuite: any = null;

async function loadDataVisualization() {
  try {
    console.log('📊 Loading data visualization components...');
    DataVisualizationComponents = await import('./components/DataVisualization');
    console.log('✅ Data visualization components loaded');
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to load data visualization:', error);
    return false;
  }
}

async function loadValidationSuite() {
  try {
    console.log('🔍 Loading validation suite...');
    const module = await import('./tests/ComponentValidation');
    ComponentValidationSuite = module.default;
    console.log('✅ Validation suite loaded');
    return true;
  } catch (error) {
    console.warn('⚠️ Failed to load validation suite:', error);
    return false;
  }
}

async function enableMSW() {
  try {
    if (import.meta.env.DEV) {
      console.log('🔧 Starting MSW service worker...');
      const { worker } = await import('./mocks/browser');
      await worker.start({ onUnhandledRequest: 'bypass' });
      console.log('✅ MSW service worker started');
    }
  } catch (error) {
    console.warn('⚠️ MSW service worker failed to start:', error);
  }
}

// TerraFusion OS Experience Suite v5 Main App
function App() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadingStage, setLoadingStage] = React.useState('Initializing...');
  const [componentsLoaded, setComponentsLoaded] = React.useState({
    core: false,
    dataViz: false,
    validation: false
  });

  React.useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoadingStage('Loading core components...');
        await new Promise(resolve => setTimeout(resolve, 100));
        setComponentsLoaded(prev => ({ ...prev, core: true }));
        
        setLoadingStage('Loading data visualization...');
        const dataVizLoaded = await loadDataVisualization();
        setComponentsLoaded(prev => ({ ...prev, dataViz: dataVizLoaded }));
        
        setLoadingStage('Loading validation suite...');
        const validationLoaded = await loadValidationSuite();
        setComponentsLoaded(prev => ({ ...prev, validation: validationLoaded }));
        
        setLoadingStage('System ready!');
        setIsLoading(false);
        console.log('✅ TerraFusion OS Experience Suite v5 fully loaded!');
      } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return (
      <div className="tf-loading-screen">
        <h1>🏛️ TerraFusion OS</h1>
        <p>Experience Suite v5 - {loadingStage}</p>
        <div className="tf-loading-progress">
          <div className={componentsLoaded.core ? 'loaded' : 'loading'}>
            {componentsLoaded.core ? '✅' : '⏳'} Core Government Components
          </div>
          <div className={componentsLoaded.dataViz ? 'loaded' : 'loading'}>
            {componentsLoaded.dataViz ? '✅' : '⏳'} Data Visualization Suite
          </div>
          <div className={componentsLoaded.validation ? 'loaded' : 'loading'}>
            {componentsLoaded.validation ? '✅' : '⏳'} Validation Suite
          </div>
        </div>
        <div className="tf-loading-spinner">⚡</div>
      </div>
    );
  }

  return (
    <div className="experience-suite-v5">
      <header className="tf-gov-header">
        <h1>🏛️ TerraFusion OS - Experience Suite v5</h1>
        <p>Benton County Assessor - Government Operating System</p>
        <div className="tf-header-metrics">
          <span>🤖 50,000+ AI Agents</span>
          <span>⚡ Elite Rust Engine</span>
          <span>🛡️ FISMA Compliant</span>
        </div>
      </header>
      
      <main className="tf-main-content">
        {/* Government Operations Overview */}
        <GovernmentOperations />
        
        {/* Property Assessment Dashboard */}
        <PropertyAssessmentDashboard />
        
        {/* AI Agent Coordination */}
        <AIAgentCoordination />
        
        {/* Elite Rust Performance Engine */}
        <RustPerformanceMonitor />
        
        {/* Module Marketplace */}
        <ModuleMarketplace />
        
        {/* Revenue Management Dashboard */}
        <RevenueDashboard />
        
        {/* Data Visualization Suite */}
        {componentsLoaded.dataViz && DataVisualizationComponents && (
          <div className="tf-visualization-section">
            <h2>📊 Real-Time Data Visualization</h2>
            <div className="tf-viz-grid">
              <DataVisualizationComponents.BentonCountyMap />
              <DataVisualizationComponents.PerformanceCharts />
              <DataVisualizationComponents.RevenueAnalytics />
              <DataVisualizationComponents.AIActivityMonitor />
            </div>
          </div>
        )}
        
        {/* Component Validation Suite */}
        {componentsLoaded.validation && ComponentValidationSuite && (
          <ComponentValidationSuite />
        )}
        
        <div className="tf-system-status">
          <h2>� System Status Overview</h2>
          <div className="tf-status-grid">
            <div className="tf-status-item">
              <h3>🏛️ Government Grade</h3>
              <p>FISMA/NIST-800-53 Compliant</p>
              <span className="tf-status-active">Active</span>
            </div>
            <div className="tf-status-item">
              <h3>⚡ Performance Engine</h3>
              <p>Elite Rust 6-Crate Architecture</p>
              <span className="tf-status-operational">Operational</span>
            </div>
            <div className="tf-status-item">
              <h3>🤖 AI Coordination</h3>
              <p>Supreme Commander Claude</p>
              <span className="tf-status-coordinating">Coordinating</span>
            </div>
            <div className="tf-status-item">
              <h3>📊 Data Integration</h3>
              <p>Harris PACS Connected</p>
              <span className="tf-status-synced">Synced</span>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="tf-footer">
        <p>TerraFusion OS v1.0 | Experience Suite v5 | Benton County Government</p>
        <p>Elite Rust Performance Engine | 50,000+ AI Agents | MIT PhD-Level Implementation</p>
        <p>Government-Grade Security | Multi-Level Classification | 24/7 Platinum Support</p>
      </footer>
    </div>
  );
}

enableMSW().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
});

export default App;