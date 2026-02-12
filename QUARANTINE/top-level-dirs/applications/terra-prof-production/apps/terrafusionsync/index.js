/**
 * TerraFusionSync Application
 * This is a placeholder service created during the Nx import process.
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ service: 'TerraFusionSync', status: 'healthy' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'terrafusionsync' });
});

app.get('/graphql', (req, res) => {
  res.json({ 
    data: { 
      service: 'TerraFusionSync',
      message: 'GraphQL endpoint placeholder'
    } 
  });
});

app.listen(PORT, () => {
  console.log('TerraFusionSync service running on port', PORT);
});
