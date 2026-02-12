const express = require('express');
const path = require('path');

const app = express();
const port = 5001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist/public')));

// Basic API endpoints for the frontend
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/properties', (req, res) => {
  res.json([
    { id: 1, address: '123 Main St', city: 'Kennewick', total_value: 350000, property_type: 'Residential' },
    { id: 2, address: '456 Oak Ave', city: 'Richland', total_value: 425000, property_type: 'Residential' },
    { id: 3, address: '789 Pine Rd', city: 'Pasco', total_value: 290000, property_type: 'Commercial' }
  ]);
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 TerraFusion Build running at http://localhost:${port}`);
  console.log(`📊 Serving built React application`);
  console.log(`✅ API endpoints available at /api/*`);
}); 