import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 8000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist/public')));

// Comprehensive Terrafusion Enterprise Service
class TerraFusionEnterprise {
  constructor() {
    this.properties = [];
    this.syncJobs = [];
    this.aiQueries = [];
    this.workflows = [];
    this.systemStatus = {
      database: true,
      arcgis: true,
      ai_engine: true,
      sync_service: true,
      workflow_engine: true
    };
    
    this.initialize();
  }

  initialize() {
    console.log('🚀 Initializing Terrafusion Enterprise...');
    this.generateBentonCountyData();
    this.initializeSyncJobs();
    this.initializeWorkflows();
    console.log('✅ Terrafusion Enterprise ready!');
  }

  generateBentonCountyData() {
    const cities = {
      'Kennewick': { base_value: 380000, zip_start: 99336, count_ratio: 0.35 },
      'Pasco': { base_value: 320000, zip_start: 99301, count_ratio: 0.25 },
      'Richland': { base_value: await DynamicPropertyService.GetPropertyCountAsync(countyCode)0, zip_start: 99352, count_ratio: 0.20 },
      'West Richland': { base_value: 400000, zip_start: 99353, count_ratio: 0.08 },
      'Prosser': { base_value: 280000, zip_start: 99350, count_ratio: 0.07 },
      'Benton City': { base_value: 250000, zip_start: 99320, count_ratio: 0.05 }
    };

    const neighborhoods = [
      'Highlands', 'Canyon Lakes', 'Southridge', 'Columbia Park', 'Vista',
      'Downtown Core', 'Industrial District', 'Agricultural Zone', 'Riverside',
      'Historic District', 'New Development', 'Commercial Hub'
    ];

    const propertyTypes = ['Residential', 'Commercial', 'Industrial', 'Agricultural', 'Mixed Use', 'Vacant'];
    const count = 5000;

    for (let i = 0; i < count; i++) {
      const cityKeys = Object.keys(cities);
      let selectedCity = 'Kennewick';
      let cumulative = 0;
      const randomVal = (i * 7 + 13) % 100 / 100;

      for (const [city, data] of Object.entries(cities)) {
        cumulative += data.count_ratio;
        if (randomVal <= cumulative) {
          selectedCity = city;
          break;
        }
      }

      const cityData = cities[selectedCity];
      const baseValue = cityData.base_value;
      const variation = (i % 200 - 100) * 1000;
      const assessedValue = baseValue + variation;

      this.properties.push({
        id: i + 1,
        parcel_id: `BC-${53000000 + i}`,
        address: `${1000 + i * 10} ${['Main', 'Oak', 'Pine', 'Elm', 'Maple', 'Cedar'][i % 6]} ${['St', 'Ave', 'Rd', 'Blvd', 'Way', 'Ln'][i % 6]}`,
        city: selectedCity,
        state: 'WA',
        zip_code: `${cityData.zip_start + (i % 10)}`,
        neighborhood: neighborhoods[i % neighborhoods.length],
        property_type: propertyTypes[i % propertyTypes.length],
        year_built: 1960 + (i % 65),
        bedrooms: 2 + (i % 5),
        bathrooms: 1.0 + (i % 4) * 0.5,
        square_feet: 1200 + (i % 2500),
        lot_size: 0.15 + (i % 50) * 0.02,
        assessed_value: assessedValue,
        market_value: assessedValue * 1.12,
        land_value: assessedValue * 0.28,
        improvement_value: assessedValue * 0.72,
        tax_amount: assessedValue * 0.012,
        owner: `Property Owner ${i + 1}`,
        zoning: ['R-1', 'R-2', 'C-1', 'C-2', 'I-1', 'AG', 'MU'][i % 7],
        sale_date: new Date(2020 + (i % 5), (i % 12), 1 + (i % 28)).toISOString().split('T')[0],
        assessment_date: '2024-01-01',
        source: 'TerraFusion_Enhanced_Sample'
      });
    }

    console.log(`📊 Generated ${this.properties.length} Benton County properties`);
    const cityList = [...new Set(this.properties.map(p => p.city))];
    console.log(`🏘️ Cities: ${cityList.join(', ')}`);
  }

  initializeSyncJobs() {
    this.syncJobs = [
      {
        id: 1,
        name: 'PACS to Terrafusion',
        source_system: 'PACS',
        target_system: 'Terrafusion',
        status: 'completed',
        records_processed: 5000,
        last_run: new Date().toISOString(),
        next_run: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        name: 'ArcGIS Data Sync',
        source_system: 'ArcGIS',
        target_system: 'Terrafusion',
        status: 'running',
        records_processed: 3200,
        last_run: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        next_run: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        name: 'Assessment Updates',
        source_system: 'CIAPS',
        target_system: 'Terrafusion',
        status: 'pending',
        records_processed: 0,
        last_run: null,
        next_run: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  initializeWorkflows() {
    this.workflows = [
      {
        id: 1,
        name: 'Property Assessment Workflow',
        steps: ['Data Validation', 'AI Analysis', 'Report Generation', 'Quality Check'],
        status: 'active',
        last_executed: new Date().toISOString()
      },
      {
        id: 2,
        name: 'Market Analysis Workflow',
        steps: ['Data Collection', 'Trend Analysis', 'Comparison Study', 'Forecast Generation'],
        status: 'active',
        last_executed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  processAIQuery(query, queryType = 'general') {
    const timestamp = new Date().toISOString();
    let response = '';

    switch (queryType) {
      case 'property_search':
        response = this.handlePropertySearch(query);
        break;
      case 'assessment':
        response = `🏠 Assessment Analysis for: ${query}\n\nBased on Benton County data:\n• Market trends: Stable growth\n• Comparable properties available\n• Assessment follows WA state guidelines\n• Recent sales data indicates fair market value`;
        break;
      case 'levy':
        response = `💰 Levy Calculation for ${query}\n\nBenton County Tax Analysis:\n• Base tax rate: 1.2%\n• Special assessments may apply\n• Senior/veteran exemptions available\n• Payment plans offered`;
        break;
      case 'trends':
        response = `📈 Market Trends Analysis\n\nBenton County Overview:\n• Property values: +3.2% YoY\n• Inventory: Moderate levels\n• Average days on market: 24\n• Price per sq ft: $180-250`;
        break;
      case 'sync':
        response = `🔄 Sync Status\n\nSystem Integration:\n✅ PACS: Connected\n✅ ArcGIS: Active\n✅ Assessment DB: Synced\n🔄 Next sync: Tonight 10 PM`;
        break;
      case 'debate':
        response = `⚖️ Dual Perspective Analysis\n\n[ Samson ] - Positive View:\nThis approach offers excellent efficiency and accuracy benefits for property assessment. Integration provides comprehensive data access.\n\n[ Michael ] - Alternative View:\nWhile beneficial, consider data accuracy verification challenges, system dependencies, and staff training requirements.`;
        break;
      default:
        response = `🤖 Terrafusion Enterprise AI\n\nQuery: ${query}\n\nAs your comprehensive property assessment AI, I can help with:\n• Property searches and valuations\n• Assessment calculations\n• Market trend analysis\n• Data synchronization\n• Workflow automation`;
    }

    this.aiQueries.push({
      id: this.aiQueries.length + 1,
      query: query,
      type: queryType,
      response: response,
      timestamp: timestamp
    });

    return { query, response, type: queryType, timestamp };
  }

  handlePropertySearch(query) {
    const searchTerm = query.toLowerCase();
    const matches = this.properties.filter(p => 
      p.address.toLowerCase().includes(searchTerm) ||
      p.city.toLowerCase().includes(searchTerm) ||
      p.parcel_id.toLowerCase().includes(searchTerm)
    ).slice(0, 10);

    if (matches.length > 0) {
      let result = `Found ${matches.length} properties matching '${query}':\n\n`;
      matches.forEach(prop => {
        result += `📍 ${prop.address}, ${prop.city}\n`;
        result += `   💰 Assessed Value: $${prop.assessed_value.toLocaleString()}\n`;
        result += `   🏠 ${prop.property_type} | Built: ${prop.year_built}\n\n`;
      });
      return result;
    } else {
      return `No properties found matching '${query}'. Try searching by address, city, or parcel ID.`;
    }
  }

  getStatistics() {
    const totalValue = this.properties.reduce((sum, p) => sum + p.assessed_value, 0);
    const avgValue = totalValue / this.properties.length;

    const cities = this.properties.reduce((acc, p) => {
      acc[p.city] = (acc[p.city] || 0) + 1;
      return acc;
    }, {});

    const propertyTypes = this.properties.reduce((acc, p) => {
      acc[p.property_type] = (acc[p.property_type] || 0) + 1;
      return acc;
    }, {});

    const valueRanges = {
      under_300k: this.properties.filter(p => p.assessed_value < 300000).length,
      '300k_500k': this.properties.filter(p => p.assessed_value >= 300000 && p.assessed_value < 500000).length,
      '500k_750k': this.properties.filter(p => p.assessed_value >= 500000 && p.assessed_value < 750000).length,
      over_750k: this.properties.filter(p => p.assessed_value >= 750000).length
    };

    return {
      total_properties: this.properties.length,
      total_assessed_value: totalValue,
      average_value: avgValue,
      cities: cities,
      property_types: propertyTypes,
      value_ranges: valueRanges,
      data_source: 'TerraFusion_Enterprise'
    };
  }
}

// Initialize the enterprise service
const TerraFusion = new TerraFusionEnterprise();

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    service: 'Terrafusion Enterprise',
    timestamp: new Date().toISOString(),
    version: '2.0',
    components: {
      property_data: true,
      ai_engine: true,
      sync_management: true,
      workflow_engine: true,
      arcgis_integration: true
    },
    properties_loaded: TerraFusion.properties.length
  });
});

app.get('/api/properties', (req, res) => {
  const { city, property_type, min_value, max_value, limit = 100 } = req.query;
  let properties = TerraFusion.properties;

  if (city) {
    properties = properties.filter(p => p.city.toLowerCase().includes(city.toLowerCase()));
  }
  if (property_type) {
    properties = properties.filter(p => p.property_type.toLowerCase().includes(property_type.toLowerCase()));
  }
  if (min_value) {
    properties = properties.filter(p => p.assessed_value >= parseInt(min_value));
  }
  if (max_value) {
    properties = properties.filter(p => p.assessed_value <= parseInt(max_value));
  }

  properties = properties.slice(0, parseInt(limit));

  res.json({
    total: properties.length,
    properties: properties,
    source: 'TerraFusion_Enterprise'
  });
});

app.get('/api/statistics', (req, res) => {
  res.json(TerraFusion.getStatistics());
});

app.get('/api/sync_jobs', (req, res) => {
  res.json({
    sync_jobs: TerraFusion.syncJobs
  });
});

app.get('/api/workflows', (req, res) => {
  res.json({
    workflows: TerraFusion.workflows
  });
});

app.post('/api/query', (req, res) => {
  const { query, type = 'general' } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const result = TerraFusion.processAIQuery(query, type);
  res.json(result);
});

app.get('/api/ai_queries', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const recentQueries = TerraFusion.aiQueries.slice(-limit).reverse();
  res.json({
    queries: recentQueries,
    total: TerraFusion.aiQueries.length
  });
});

app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json([]);
  }

  const searchTerm = q.toLowerCase();
  const results = TerraFusion.properties.filter(p => 
    p.address.toLowerCase().includes(searchTerm) ||
    p.city.toLowerCase().includes(searchTerm) ||
    p.parcel_id.toLowerCase().includes(searchTerm) ||
    p.owner.toLowerCase().includes(searchTerm)
  ).slice(0, 20);

  res.json(results);
});

app.get('/api/cities', (req, res) => {
  const cities = [...new Set(TerraFusion.properties.map(p => p.city))];
  res.json(cities.sort());
});

app.get('/api/property_types', (req, res) => {
  const types = [...new Set(TerraFusion.properties.map(p => p.property_type))];
  res.json(types.sort());
});

// Dashboard endpoints for different components
app.get('/api/dashboard/overview', (req, res) => {
  const stats = TerraFusion.getStatistics();
  res.json({
    overview: {
      total_properties: stats.total_properties,
      total_value: stats.total_assessed_value,
      average_value: stats.average_value,
      active_sync_jobs: TerraFusion.syncJobs.filter(j => j.status === 'running').length,
      recent_queries: TerraFusion.aiQueries.length,
      system_health: 'excellent'
    },
    timestamp: new Date().toISOString()
  });
});

// Enterprise dashboard route
app.get('/dashboard', (req, res) => {
  const dashboardHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terrafusion Enterprise Dashboard</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --tf-cosmic-blue: #0891b2;
            --tf-quantum-teal: #00d2ff;
            --tf-stellar-white: #ffffff;
            --tf-deep-space: #0a0f1c;
            --tf-nebula-purple: #8b5cf6;
        }
        
        body {
            background: linear-gradient(135deg, var(--tf-deep-space) 0%, #1e1b4b 25%, var(--tf-cosmic-blue) 50%, #312e81 75%, var(--tf-nebula-purple) 100%);
            color: var(--tf-stellar-white);
            min-height: 100vh;
        }
        
        .tf-navbar {
            background: linear-gradient(135deg, var(--tf-cosmic-blue), var(--tf-quantum-teal)) !important;
            box-shadow: 0 8px 32px rgba(0, 210, 255, 0.3);
        }
        
        .card {
            background: linear-gradient(135deg, rgba(8, 145, 178, 0.2), rgba(139, 92, 246, 0.1));
            border: 2px solid rgba(0, 210, 255, 0.3);
            backdrop-filter: blur(15px);
        }
        
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 40px rgba(0, 210, 255, 0.3);
            border-color: var(--tf-quantum-teal);
        }
        
        .btn-primary {
            background: linear-gradient(135deg, var(--tf-cosmic-blue), var(--tf-quantum-teal));
            border: none;
            box-shadow: 0 8px 25px rgba(8, 145, 178, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(8, 145, 178, 0.5);
        }
    </style>
</head>
<body>
    <div class="container-fluid">
        <nav class="tf-navbar navbar navbar-expand-lg">
            <div class="container">
                <a class="navbar-brand" href="/" style="color: white; font-weight: 800; font-size: 2rem;">
                    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, white, var(--tf-quantum-teal)); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: 900; color: var(--tf-cosmic-blue);">TF</div>
                    Terrafusion Enterprise
                </a>
                <span class="navbar-text" style="color: rgba(255,255,255,0.9);">Comprehensive Property Assessment & AI Management Platform</span>
            </div>
        </nav>
        
        <div class="row mt-4">
            <div class="col-md-3">
                <div class="card bg-secondary">
                    <div class="card-body text-center">
                        <i class="fas fa-home text-info fs-1"></i>
                        <h3 class="mt-2" id="totalProperties">5,000</h3>
                        <p>Total Properties</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-secondary">
                    <div class="card-body text-center">
                        <i class="fas fa-dollar-sign text-success fs-1"></i>
                        <h3 class="mt-2" id="totalValue">$1.8B</h3>
                        <p>Total Value</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-secondary">
                    <div class="card-body text-center">
                        <i class="fas fa-sync text-primary fs-1"></i>
                        <h3 class="mt-2" id="syncJobs">3</h3>
                        <p>Sync Jobs</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-secondary">
                    <div class="card-body text-center">
                        <i class="fas fa-robot text-warning fs-1"></i>
                        <h3 class="mt-2" id="aiQueries">0</h3>
                        <p>AI Queries</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-md-6">
                <div class="card bg-secondary">
                    <div class="card-header">
                        <h5><i class="fas fa-brain"></i> AI Query Testing</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <select class="form-select" id="queryType">
                                <option value="general">General</option>
                                <option value="property_search">Property Search</option>
                                <option value="assessment">Assessment</option>
                                <option value="levy">Levy Calculation</option>
                                <option value="trends">Market Trends</option>
                                <option value="sync">Sync Management</option>
                                <option value="debate">Debate Format</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <input type="text" class="form-control" id="queryInput" placeholder="Enter your query...">
                        </div>
                        <button class="btn btn-primary" onclick="sendQuery()">
                            <i class="fas fa-paper-plane"></i> Send Query
                        </button>
                        <div class="mt-3">
                            <strong>Response:</strong>
                            <div id="aiResponse" class="bg-dark p-3 rounded mt-2" style="min-height: 100px; white-space: pre-wrap;"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card bg-secondary">
                    <div class="card-header">
                        <h5><i class="fas fa-chart-bar"></i> System Status</h5>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-6 mb-3">
                                <i class="fas fa-database text-success fs-3"></i>
                                <p class="mb-0">Database</p>
                                <small class="text-success">Connected</small>
                            </div>
                            <div class="col-6 mb-3">
                                <i class="fas fa-map text-success fs-3"></i>
                                <p class="mb-0">ArcGIS</p>
                                <small class="text-success">Active</small>
                            </div>
                            <div class="col-6 mb-3">
                                <i class="fas fa-cogs text-success fs-3"></i>
                                <p class="mb-0">Workflows</p>
                                <small class="text-success">Running</small>
                            </div>
                            <div class="col-6 mb-3">
                                <i class="fas fa-sync-alt text-success fs-3"></i>
                                <p class="mb-0">Sync Engine</p>
                                <small class="text-success">Active</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-12">
                <div class="card bg-secondary">
                    <div class="card-header">
                        <h5><i class="fas fa-link"></i> API Endpoints</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-4">
                                <strong>Core APIs:</strong>
                                <ul class="list-unstyled mt-2">
                                    <li><a href="/api/status" class="text-info">/api/status</a></li>
                                    <li><a href="/api/properties" class="text-info">/api/properties</a></li>
                                    <li><a href="/api/statistics" class="text-info">/api/statistics</a></li>
                                    <li><a href="/api/cities" class="text-info">/api/cities</a></li>
                                </ul>
                            </div>
                            <div class="col-md-4">
                                <strong>Management APIs:</strong>
                                <ul class="list-unstyled mt-2">
                                    <li><a href="/api/sync_jobs" class="text-info">/api/sync_jobs</a></li>
                                    <li><a href="/api/workflows" class="text-info">/api/workflows</a></li>
                                    <li><a href="/api/ai_queries" class="text-info">/api/ai_queries</a></li>
                                </ul>
                            </div>
                            <div class="col-md-4">
                                <strong>Search APIs:</strong>
                                <ul class="list-unstyled mt-2">
                                    <li><code>GET /api/search?q=query</code></li>
                                    <li><code>POST /api/query</code></li>
                                    <li><a href="/api/dashboard/overview" class="text-info">/api/dashboard/overview</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        async function sendQuery() {
            const queryType = document.getElementById('queryType').value;
            const query = document.getElementById('queryInput').value;
            const responseDiv = document.getElementById('aiResponse');

            if (!query.trim()) {
                responseDiv.textContent = 'Please enter a query.';
                return;
            }

            responseDiv.textContent = 'Processing...';

            try {
                const response = await fetch('/api/query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query: query, type: queryType })
                });

                const data = await response.json();
                responseDiv.textContent = data.response || 'No response received';
                
                // Update AI queries counter
                const currentCount = parseInt(document.getElementById('aiQueries').textContent);
                document.getElementById('aiQueries').textContent = currentCount + 1;

            } catch (error) {
                responseDiv.textContent = 'Error: ' + error.message;
            }
        }

        // Allow Enter key to send query
        document.getElementById('queryInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendQuery();
            }
        });

        // Load initial statistics
        async function loadStats() {
            try {
                const response = await fetch('/api/statistics');
                const data = await response.json();
                
                document.getElementById('totalProperties').textContent = data.total_properties.toLocaleString();
                document.getElementById('totalValue').textContent = '$' + (data.total_assessed_value / 1000000).toFixed(1) + 'M';
            } catch (error) {
                console.error('Error loading statistics:', error);
            }
        }

        loadStats();
    </script>
</body>
</html>`;
  
  res.send(dashboardHtml);
});

// Serve the React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist/public/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.redirect('/dashboard');
  }
});

app.listen(8000, '0.0.0.0', () => {
  console.log('🚀 Terrafusion Enterprise Platform');
  console.log('📊 Comprehensive Property Assessment & AI Management');
  console.log('🏛️ Benton County Integration');
  console.log('🤖 Enhanced AI Capabilities');
  console.log('🔄 Sync Management');
  console.log('⚡ Workflow Engine');
  console.log(`✅ Running at http://localhost:8000`);
  console.log(`📋 Dashboard: http://localhost:8000/dashboard`);
  console.log(`🔗 API Status: http://localhost:8000/api/status`);
}); 