/**
 * TerraLegislativePulsePub Application
 * This is a placeholder service created during the Nx import process.
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ service: 'TerraLegislativePulsePub', status: 'healthy' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'terralegislativepulsepub' });
});

app.get('/graphql', (req, res) => {
  res.json({ 
    data: { 
      service: 'TerraLegislativePulsePub',
      message: 'GraphQL endpoint placeholder'
    } 
  });
});

app.listen(PORT, () => {
  console.log('TerraLegislativePulsePub service running on port', PORT);
});
