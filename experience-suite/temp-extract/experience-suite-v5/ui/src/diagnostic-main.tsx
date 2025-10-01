import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

// Import components one by one to test
// import './components/GovernmentComponents.css';
// import './components/ValidationStyles.css';

// Simple main app with basic loading
function App() {
  const [loadingState, setLoadingState] = React.useState('Starting...');
  
  React.useEffect(() => {
    const loadSequence = async () => {
      try {
        setLoadingState('Loading CSS...');
        // Basic CSS is already loaded via index.css
        
        setLoadingState('Testing component imports...');
        // Test basic component import
        const { PropertyAssessmentDashboard } = await import('./components/GovernmentComponents');
        
        setLoadingState('Components loaded successfully!');
        console.log('✅ PropertyAssessmentDashboard loaded:', PropertyAssessmentDashboard);
        
        setLoadingState('Ready!');
      } catch (error) {
        console.error('❌ Loading error:', error);
        setLoadingState(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    
    loadSequence();
  }, []);

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
        <div className="tf-loading-section">
          <h2>🚀 System Loading Status</h2>
          <p><strong>Status:</strong> {loadingState}</p>
          <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
          
          {loadingState === 'Ready!' && (
            <div className="tf-success-message">
              <h3>✅ System Ready!</h3>
              <p>All components loaded successfully. Switching to full interface...</p>
            </div>
          )}
        </div>
      </main>
      
      <footer className="tf-footer">
        <p>TerraFusion OS v1.0 | Experience Suite v5 | Benton County Government</p>
      </footer>
    </div>
  );
}

console.log('🏛️ TerraFusion OS Experience Suite v5 - Loading diagnostic version...');

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

export default App;