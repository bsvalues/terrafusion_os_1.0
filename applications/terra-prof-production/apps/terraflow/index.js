/**
 * TerraFlow Application
 * This is a placeholder service created during the Nx import process.
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ service: 'TerraFlow', status: 'healthy' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'terraflow' });
});

app.get('/graphql', (req, res) => {
  res.json({ 
    data: { 
      service: 'TerraFlow',
      message: 'GraphQL endpoint placeholder'
    } 
  });
});

app.listen(PORT, () => {
  console.log('TerraFlow service running on port', PORT);
});
