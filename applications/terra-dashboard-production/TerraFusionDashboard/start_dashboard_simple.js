#!/usr/bin/env node

// Simple Terrafusion Executive Command Center Dashboard Launcher
// Bypasses WebSocket configuration issues on Windows

const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// Basic API endpoints for dashboard functionality
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalProperties: 25847,
    activeAgents: 8,
    completedJobs: 1247,
    systemStatus: 'operational',
    lastUpdated: new Date().toISOString()
  });
});

app.get('/api/agents', (req, res) => {
  res.json([
    { id: 'narrator-ai', name: 'NarratorAI', version: '2.1.0', status: 'active', type: 'explanation-generation' },
    { id: 'exemption-seer', name: 'ExemptionSeer', version: '1.8.2', status: 'active', type: 'exemption-analysis' },
    { id: 'sales-validator', name: 'SalesValidator', version: '3.0.1', status: 'active', type: 'sales-validation' },
    { id: 'cost-analyzer', name: 'CostAnalyzer', version: '2.3.0', status: 'active', type: 'cost-analysis' }
  ]);
});

app.get('/api/properties', (req, res) => {
  res.json({
    count: 25847,
    recentlyUpdated: 42,
    needsReview: 8,
    lastSync: new Date().toISOString()
  });
});

// Serve the main app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'public', 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
  console.log('');
  console.log('🌟 Terrafusion Executive Command Center Dashboard');
  console.log('═══════════════════════════════════════════════');
  console.log(`📊 Dashboard: http://127.0.0.1:${port}`);
  console.log('🎮 Interactive Command Hub Active');
  console.log('📱 Application Cards & Launch Controls Ready');
  console.log('✅ Your Ported Terminal Dashboard is Live!');
  console.log('');
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Terrafusion Executive Command Center Dashboard...');
  process.exit(0);
}); 