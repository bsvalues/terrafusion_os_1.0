const express = require('express');
const path = require('path');

const app = express();
const port = 3200;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle all routes by serving index.html for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 TerraFusion IDE (Webpack version) running at:`);
  console.log(`📱 Local:    http://localhost:${port}`);
  console.log(`🌐 Network:  http://0.0.0.0:${port}`);
  console.log(`\n✨ Features:`);
  console.log(`🤖 Supreme Commander Claude with 50,000+ AI Agents`);
  console.log(`💻 Monaco Editor with AI Copilot (Tab to accept)`);
  console.log(`🛡️ Government Security Dashboard`);
  console.log(`🔧 DevOps Orchestration`);
  console.log(`🗺️ LeafScope GIS`);
  console.log(`\n🎯 No more Vite problems! Webpack + Monaco = Professional IDE`);
});