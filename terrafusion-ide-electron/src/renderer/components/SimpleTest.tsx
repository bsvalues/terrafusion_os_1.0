import React from 'react';

const SimpleTest: React.FC = () => {
  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #0b1020 0%, #1a1f3a 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Segoe UI, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontSize: '3rem',
        fontWeight: 'bold',
        marginBottom: '2rem'
      }}>
        🚀 TerraFusion IDE
      </div>

      <div style={{
        color: '#0099ff',
        fontSize: '1.2rem',
        marginBottom: '2rem'
      }}>
        Government. Transcended.
      </div>

      <div style={{
        background: 'rgba(0, 153, 255, 0.1)',
        border: '2px solid #0099ff',
        borderRadius: '12px',
        padding: '30px',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h2 style={{ color: '#4CAF50', marginBottom: '1rem' }}>
          ✅ React App Successfully Mounted!
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          🎯 The React application is working correctly. The webpack build process and basic server are functioning properly.
        </p>
        <div style={{
          background: '#1e1e1e',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px',
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#00ff88'
        }}>
          ✅ Webpack Build: Success<br/>
          ✅ React Mount: Success<br/>
          ✅ Basic Server: Working<br/>
          ✅ Loading Screen: Fixed<br/>
          🚀 Ready for full TerraFusion IDE
        </div>
      </div>

      <div style={{
        marginTop: '2rem',
        color: '#888',
        fontSize: '14px',
        textAlign: 'center'
      }}>
        <p>🤖 Supreme Commander Claude: Basic systems operational</p>
        <p>⚡ Next: Load full IDE with Monaco Editor</p>
      </div>
    </div>
  );
};

export default SimpleTest;