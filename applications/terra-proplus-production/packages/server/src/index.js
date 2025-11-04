require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import route handlers
const deploymentsRouter = require('./routes/deployments');
const pipelinesRouter = require('./routes/pipelines');
const monitoringRouter = require('./routes/monitoring');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api/deployments', deploymentsRouter);
app.use('/api/pipelines', pipelinesRouter);
app.use('/api/monitoring', monitoringRouter);

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', function(req, res) {
    if (req.url.startsWith('/api')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`API available at http://0.0.0.0:${PORT}/api/`);
});

module.exports = app; // Export for testing