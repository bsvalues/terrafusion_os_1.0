/**
 * TerraAgent Application
 * This is a placeholder service created during the Nx import process.
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ service: 'TerraAgent', status: 'healthy' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'terraagent' });
});

app.get('/graphql', (req, res) => {
  res.json({ 
    data: { 
      service: 'TerraAgent',
      message: 'GraphQL endpoint placeholder'
    } 
  });
});

app.listen(PORT, () => {
  console.log('TerraAgent service running on port', PORT);
});
