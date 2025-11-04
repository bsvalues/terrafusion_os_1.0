/**
 * terrafusion_mock-up Application
 * This is a placeholder service created during the Nx import process.
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ service: 'terrafusion_mock-up', status: 'healthy' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'terrafusion_mock-up' });
});

app.get('/graphql', (req, res) => {
  res.json({ 
    data: { 
      service: 'terrafusion_mock-up',
      message: 'GraphQL endpoint placeholder'
    } 
  });
});

app.listen(PORT, () => {
  console.log('terrafusion_mock-up service running on port', PORT);
});
