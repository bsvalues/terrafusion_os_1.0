// Health check endpoint component
import { useEffect } from 'react';

export function HealthCheck() {
  useEffect(() => {
    // Set up health check endpoint
    if (window.location.pathname === '/health') {
      const healthData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        app: 'CostForge',
        version: '1.0.0',
        port: 3001,
        uptime: process.uptime ? process.uptime() : 'N/A',
        environment: import.meta.env.MODE
      };
      
      // Return health status as JSON
      document.body.innerHTML = `<pre>${JSON.stringify(healthData, null, 2)}</pre>`;
      document.body.style.fontFamily = 'monospace';
    }
  }, []);
  
  return null;
}