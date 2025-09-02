import React from 'react';

const TestApp: React.FC = () => {
  return (
    <div style={{ 
      padding: '40px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '20px',
        textAlign: 'center'
      }}><>

        <h1>✅ React App is Working!</h1>
        <p
</>
</>>Terrafusion Public Records - Test Mode</p>
      </div>

      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}><>

        <h2>System Status</h2>
        <ul
</>
</>><>

          <li>✅ React: Working</li>
                            <li
</>
</>>✅ TypeScript: Compiled</li><>

          <li>✅ Vite: Running on port 3500</li>
                            <li
</>
</>>✅ Dev Server: Active</li>
        </ul><>

        <h3>Quick Links:</h3>
        <div
</>
style={{ display: 'flex', gap: '10px', marginTop: '20px' }}><>

          <button 
            onClick={() => window.location.href = '/'} 
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Try Main App
          </button>
          <button
</>

            onClick={() => localStorage.clear()} 
            style={{
              padding: '10px 20px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Clear Cache
          </button>
        </div><>

        <h3>Local Storage Status:</h3>
        <pre
</>
style={{
          background: '#f3f4f6',
          padding: '10px',
          borderRadius: '6px',
          marginTop: '10px',
          fontSize: '12px'
        }}>
          {JSON.stringify({
            user: localStorage.getItem('tfpr_user') ? 'Found' : 'Not found',
            session: localStorage.getItem('tfpr_session') ? 'Active' : 'None',
            devDisabled: localStorage.getItem('tfpr_dev_disabled') || 'false'
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TestApp;