/**
 * Simple Test Server for Statistical Analysis Endpoints
 * Debugging CostForge AI Server Connection Issues
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    message: 'Test server running successfully',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Simple spatial autocorrelation test endpoint
app.post('/api/analytics/spatialAutocorrelation', (req, res) => {
  console.log('Received spatial autocorrelation request:', req.body);
  
  res.json({
    success: true,
    data: {
      moransI: 0.523,
      gearyC: 0.445,
      interpretation: 'Clustered',
      message: 'Spatial autocorrelation endpoint working!'
    },
    terrafusion: {
      agent_id: 'SPATIAL_TEST_ENGINE',
      confidence: 'Championship level'
    }
  });
});

// Other statistical endpoints (simplified)
const endpoints = ['bayesian', 'monteCarlo', 'regression'];
endpoints.forEach(endpoint => {
  app.post(`/api/analytics/${endpoint}`, (req, res) => {
    res.json({
      success: true,
      data: { message: `${endpoint} endpoint operational` },
      terrafusion: {
        agent_id: `${endpoint.toUpperCase()}_ENGINE`,
        confidence: 'Championship level'
      }
    });
  });
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ success: false, error: error.message });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🎯 SIMPLE TEST SERVER - OPERATIONAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Server: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/api/health
🧪 Ready for endpoint testing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}).on('error', (err) => {
  console.error('Server startup error:', err);
});