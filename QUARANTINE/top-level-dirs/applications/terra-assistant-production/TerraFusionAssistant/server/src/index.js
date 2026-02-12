/**
 * Main Express server entry point
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs').promises;
const path = require('path');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Apply middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Import routes
const apiRoutes = require('./routes/api');
const levyRoutes = require('./routes/levy');
const securityScanRoutes = require('./routes/securityScan');

// Ensure data directories exist
async function ensureDataDirectories() {
  try {
    const dataDir = path.join(__dirname, '..', 'data');
    const scansDir = path.join(dataDir, 'scans');
    
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(scansDir, { recursive: true });
    
    console.log('Data directories created');
  } catch (error) {
    console.error('Error creating data directories:', error);
  }
}

// Mount API routes
app.use('/api', apiRoutes);
app.use('/api/v1', levyRoutes);
app.use('/api/security', securityScanRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Terrafusion API',
    version: '0.2.0',
    endpoints: [
      '/api/status',
      '/api/v1/levy',
      '/api/security/scan',
      '/api/security/scans',
      '/api/security/dependencies/check',
      '/api/security/secrets/detect'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    timestamp: new Date()
  });
});

// Create data directories and start server
ensureDataDirectories().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize server:', err);
});

module.exports = app;