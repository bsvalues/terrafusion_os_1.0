import ReactDOM from 'react-dom/client';
import './index.css';

// Simple Test App to verify loading
function TestApp() {
  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      background: 'linear-gradient(135deg, #0A1E2E 0%, #1a2332 100%)',
      color: '#00B3A4',
      minHeight: '100vh'
    }}>
      <h1>🏛️ TerraFusion OS Experience Suite v5 - Loading Test</h1>
      <p>✅ React is working!</p>
      <p>✅ TypeScript is working!</p>
      <p>✅ Vite development server is active!</p>
      
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(0, 179, 164, 0.1)',
        border: '1px solid rgba(0, 179, 164, 0.3)',
        borderRadius: '8px'
      }}>
        <h2>🚀 System Status</h2>
        <p><strong>Date:</strong> {new Date().toLocaleString()}</p>
        <p><strong>Status:</strong> OPERATIONAL</p>
        <p><strong>Location:</strong> http://localhost:3104</p>
      </div>
      
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: 'rgba(76, 175, 80, 0.1)',
        border: '1px solid #4CAF50',
        borderRadius: '8px'
      }}>
        <h3>✅ Basic Loading Test PASSED</h3>
        <p>If you can see this, React and Vite are working correctly!</p>
        <p>Now proceeding to load full government components...</p>
      </div>
    </div>
  );
}

console.log('🏛️ TerraFusion OS Experience Suite v5 - Starting application...');

ReactDOM.createRoot(document.getElementById('root')!).render(<TestApp />);

export default TestApp;