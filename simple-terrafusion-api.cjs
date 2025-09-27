const http = require('http');
const url = require('url');

// TerraFusion OS API Mock for Visual Testing - No dependencies required
const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  let responseData = {};

  switch (path) {
    case '/':
      responseData = {
        name: 'TerraFusion OS 1.0 - Government AI Operating System',
        version: '1.0.0',
        status: 'operational',
        description: 'Government AI Operating System for Visual Testing',
        modules: 15,
        agents: 1008,
        endpoints: ['/health', '/api/modules', '/api/swarm/status', '/api/database/status']
      };
      break;

    case '/health':
      responseData = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        system: 'TerraFusion OS 1.0',
        modules: {
          loaded: 12,
          active: 12,
          errors: 1
        },
        ai_swarm: {
          agents: 1008,
          status: 'operational',
          mcp_tools: 87
        },
        database: {
          status: 'sqlite_fallback',
          message: 'PostgreSQL connection failed, using SQLite'
        },
        legacy_integration: {
          adapters: 6,
          status: 'initialized'
        }
      };
      break;

    case '/api/modules':
      responseData = {
        total: 12,
        active: 12,
        modules: [
          { name: 'government-edition', status: 'active', components: 4236 },
          { name: 'ai-swarm', status: 'active', agents: 1008 },
          { name: 'ai-command-brain', status: 'active', components: 10218 },
          { name: 'marketplace-champion', status: 'active', components: 255 },
          { name: 'costforge-ai-champion', status: 'active', components: 3875 },
          { name: 'terra-collections', status: 'active', components: 225 },
          { name: 'terra-levy', status: 'active', components: 32 },
          { name: 'terra-insight', status: 'active', components: 275 },
          { name: 'unified-system', status: 'active', components: 12 },
          { name: 'web-audit-tracker', status: 'active', components: 28 },
          { name: 'terra-miner', status: 'active', components: 2489 },
          { name: 'gispro', status: 'active', components: 28 }
        ]
      };
      break;

    case '/api/swarm/status':
      responseData = {
        total_agents: 1008,
        active_agents: 1008,
        status: 'operational',
        distribution: {
          supreme_commander: 1,
          field_generals: 7,
          squad_leaders: 168,
          field_agents: 832
        },
        mcp_tools: 87,
        quantum_coherence: 0.94,
        processing_mode: 'production'
      };
      break;

    case '/api/database/status':
      responseData = {
        primary: {
          type: 'PostgreSQL',
          status: 'connection_failed',
          error: 'password authentication failed for user "terrafusion"'
        },
        fallback: {
          type: 'SQLite',
          status: 'operational',
          message: 'Using SQLite fallback database'
        },
        modules_seeded: false,
        parcels: 0,
        legacy_adapters: 6
      };
      break;

    case '/api/dashboard/overview':
      responseData = {
        system: {
          name: 'TerraFusion OS 1.0',
          status: 'operational',
          uptime: '2h 15m',
          performance: 'excellent'
        },
        modules: {
          total: 32,
          active: 15,
          production: 15,
          development: 17
        },
        ai_agents: {
          total: 1008,
          active: 1008,
          command_brain: 1,
          swarm_agents: 1007
        },
        government_features: {
          property_assessment: 'operational',
          tax_collection: 'operational', 
          public_records: 'operational',
          compliance: 'fisma_ready'
        }
      };
      break;

    default:
      responseData = {
        error: 'Endpoint not found',
        path: path,
        available_endpoints: ['/', '/health', '/api/modules', '/api/swarm/status', '/api/database/status', '/api/dashboard/overview']
      };
      res.writeHead(404);
      break;
  }

  if (res.statusCode !== 404) {
    res.writeHead(200);
  }
  
  res.end(JSON.stringify(responseData, null, 2));
});

const PORT = process.env.TF_API_PORT || 5100;
const moduleCount = Math.max(15, process.env.TF_MODULE_COUNT || 39); // Dynamic module count

server.listen(PORT, () => {
  console.log(`🚀 TerraFusion OS API Server running on http://localhost:${PORT}`);
  console.log(`📊 Serving TerraFusion data for visual testing`);
  console.log(`🧩 ${moduleCount} Production Modules | 1,008 AI Agents`);
  console.log(`🏛️  Government AI Operating System Ready`);
});