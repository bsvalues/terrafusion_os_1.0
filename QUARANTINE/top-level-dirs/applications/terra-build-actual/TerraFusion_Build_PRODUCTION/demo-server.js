// Terrafusion Build - Quick Demo Server
// This provides a live preview while we fix the TypeScript imports

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('client/dist'));

// Mock data for demo
const mockProperties = [
  {
    id: 1,
    parcelId: 'BEN-001-001-001',
    address: '123 Main St, Richland, WA',
    assessedValue: 425000,
    squareFeet: 2100,
    yearBuilt: 2015,
    propertyType: 'Single Family Residence',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 2,
    parcelId: 'BEN-001-001-002',
    address: '456 Oak Ave, Kennewick, WA',
    assessedValue: 380000,
    squareFeet: 1850,
    yearBuilt: 2012,
    propertyType: 'Single Family Residence',
    lastUpdated: new Date().toISOString()
  },
  {
    id: 3,
    parcelId: 'BEN-001-001-003',
    address: '789 Pine St, Prosser, WA',
    assessedValue: 295000,
    squareFeet: 1650,
    yearBuilt: 2008,
    propertyType: 'Single Family Residence',
    lastUpdated: new Date().toISOString()
  }
];

const mockAgents = {
  narrator_ai: { status: 'healthy', accuracy: '97.8%', tasks: 150 },
  exemption_seer: { status: 'healthy', accuracy: '95.2%', tasks: 89 },
  sales_validator: { status: 'healthy', accuracy: '98.1%', tasks: 234 },
  cost_analyzer: { status: 'healthy', accuracy: '96.5%', tasks: 167 },
  statistical_agent: { status: 'healthy', accuracy: '99.2%', tasks: 312 },
  neighborhood_agent: { status: 'healthy', accuracy: '94.8%', tasks: 76 }
};

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0-demo',
    database: { connected: true },
    services: {
      api: 'operational',
      ai_agents: 'operational',
      frontend: 'operational'
    }
  });
});

app.get('/api/properties', (req, res) => {
  res.json(mockProperties);
});

app.get('/api/properties/:id', (req, res) => {
  const property = mockProperties.find(p => p.id === parseInt(req.params.id));
  if (!property) {
    return res.status(404).json({ message: 'Property not found' });
  }
  res.json(property);
});

app.get('/api/agents', (req, res) => {
  res.json(mockAgents);
});

app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalProperties: 28020,
    activeAgents: 6,
    assessmentAccuracy: '97.8%',
    avgProcessingTime: '1.2s',
    dailyTransactions: 1247,
    systemUptime: '99.97%'
  });
});

app.post('/api/properties/ai-valuation', (req, res) => {
  const { propertyData } = req.body;
  
  // Mock AI valuation response
  setTimeout(() => {
    res.json({
      success: true,
      valuation: {
        estimatedValue: Math.floor(Math.random() * 200000) + 300000,
        confidence: '94.2%',
        methodology: 'AI-Enhanced RCN',
        factors: {
          marketConditions: 'Favorable',
          location: 'Above Average',
          condition: 'Good',
          comparables: '12 found'
        },
        generatedBy: 'Terrafusion AI Valuation Engine',
        timestamp: new Date().toISOString()
      }
    });
  }, 1500); // Simulate AI processing time
});

// Serve the React app for any non-API routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client/dist/index.html');
  
  // If the built client doesn't exist, serve a simple demo page
  if (!fs.existsSync(indexPath)) {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Terrafusion Build - Live Demo</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .logo {
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .tagline {
            font-size: 1.2em;
            opacity: 0.9;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
          }
          .card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          .card h3 {
            margin-top: 0;
            color: #fff;
          }
          .status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
          }
          .status.healthy {
            background: #10b981;
            color: white;
          }
          .feature-list {
            list-style: none;
            padding: 0;
          }
          .feature-list li {
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          }
          .feature-list li:before {
            content: "✓ ";
            color: #10b981;
            font-weight: bold;
          }
          .api-demo {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 8px;
            padding: 15px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
          }
          button {
            background: #10b981;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1em;
            margin: 5px;
          }
          button:hover {
            background: #059669;
          }
          .demo-response {
            margin-top: 15px;
            padding: 10px;
            background: rgba(0, 0, 0, 0.4);
            border-radius: 6px;
            border-left: 3px solid #10b981;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏛️ Terrafusion Build</div>
            <div class="tagline">AI-Powered Property Assessment Platform</div>
            <div style="margin-top: 10px;">
              <span class="status healthy">LIVE DEMO</span>
            </div>
          </div>
          
          <div class="grid">
            <div class="card">
              <h3>🎯 System Status</h3>
              <div id="systemStatus">
                <p><strong>Status:</strong> <span class="status healthy">Operational</span></p>
                <p><strong>Properties:</strong> 28,020 loaded</p>
                <p><strong>AI Agents:</strong> 6 active</p>
                <p><strong>Accuracy:</strong> 97.8%</p>
                <p><strong>Uptime:</strong> 99.97%</p>
              </div>
            </div>
            
            <div class="card">
              <h3>🤖 AI Agents</h3>
              <ul class="feature-list">
                <li>NarratorAI - Property narratives</li>
                <li>ExemptionSeer - Tax exemption analysis</li>
                <li>SalesValidator - Market validation</li>
                <li>CostAnalyzer - Replacement cost analysis</li>
                <li>StatisticalAgent - IAAO compliance</li>
                <li>NeighborhoodAgent - Spatial analysis</li>
              </ul>
            </div>
            
            <div class="card">
              <h3>🚀 Key Features</h3>
              <ul class="feature-list">
                <li>Real-time property valuation</li>
                <li>AI-enhanced assessment workflows</li>
                <li>GIS integration & mapping</li>
                <li>Legacy system synchronization</li>
                <li>Automated compliance checking</li>
                <li>Enterprise security framework</li>
              </ul>
            </div>
            
            <div class="card">
              <h3>🔧 API Demo</h3>
              <div class="api-demo">
                <button onclick="testAPI('/api/health')">Health Check</button>
                <button onclick="testAPI('/api/properties')">Get Properties</button>
                <button onclick="testAPI('/api/agents')">AI Agents</button>
                <button onclick="testAIValuation()">AI Valuation</button>
                <div id="apiResponse"></div>
              </div>
            </div>
          </div>
          
          <div class="card">
            <h3>📊 Live Data Preview</h3>
            <div id="dataPreview">
              <p>Click the API buttons above to see live data responses from the Terrafusion Build platform.</p>
            </div>
          </div>
        </div>
        
        <script>
          async function testAPI(endpoint) {
            const responseDiv = document.getElementById('apiResponse');
            responseDiv.innerHTML = '<div class="demo-response">Loading...</div>';
            
            try {
              const response = await fetch(endpoint);
              const data = await response.json();
              responseDiv.innerHTML = \`<div class="demo-response"><strong>\${endpoint}:</strong><br><pre>\${JSON.stringify(data, null, 2)}</pre></div>\`;
              
              // Update data preview
              const dataPreview = document.getElementById('dataPreview');
              dataPreview.innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
            } catch (error) {
              responseDiv.innerHTML = \`<div class="demo-response" style="border-left-color: #ef4444;"><strong>Error:</strong> \${error.message}</div>\`;
            }
          }
          
          async function testAIValuation() {
            const responseDiv = document.getElementById('apiResponse');
            responseDiv.innerHTML = '<div class="demo-response">🤖 AI Processing... (simulating 1.5s)</div>';
            
            try {
              const response = await fetch('/api/properties/ai-valuation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  propertyData: {
                    address: '123 Demo St',
                    squareFeet: 2000,
                    yearBuilt: 2015
                  }
                })
              });
              const data = await response.json();
              responseDiv.innerHTML = \`<div class="demo-response"><strong>AI Valuation Result:</strong><br><pre>\${JSON.stringify(data, null, 2)}</pre></div>\`;
              
              // Update data preview
              const dataPreview = document.getElementById('dataPreview');
              dataPreview.innerHTML = \`<pre>\${JSON.stringify(data, null, 2)}</pre>\`;
            } catch (error) {
              responseDiv.innerHTML = \`<div class="demo-response" style="border-left-color: #ef4444;"><strong>Error:</strong> \${error.message}</div>\`;
            }
          }
          
          // Auto-load system status
          testAPI('/api/health');
        </script>
      </body>
      </html>
    `);
  } else {
    res.sendFile(indexPath);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Terrafusion Build Demo Server running at http://localhost:${PORT}`);
  console.log(`📊 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🏠 Properties API: http://localhost:${PORT}/api/properties`);
  console.log(`🤖 AI Agents API: http://localhost:${PORT}/api/agents`);
  console.log('');
  console.log('⚡ Features Available:');
  console.log('  - Live property data preview');
  console.log('  - AI agent status monitoring');
  console.log('  - Mock property valuation API');
  console.log('  - Interactive demo interface');
  console.log('');
  console.log('🔧 While this demo runs, we can continue fixing the TypeScript application in the background');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Terrafusion Build demo server...');
  process.exit(0);
}); 