/**
 * TerraMiner Application
 * This is a placeholder service created during the Nx import process.
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ service: 'TerraMiner', status: 'healthy' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'terraminer' });
});

app.get('/graphql', (req, res) => {
  res.json({ 
    data: { 
      service: 'TerraMiner',
      message: 'GraphQL endpoint placeholder'
    } 
  });
});

app.listen(PORT, () => {
  console.log('TerraMiner service running on port', PORT);
});
