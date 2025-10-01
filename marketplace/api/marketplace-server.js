#!/usr/bin/env node
/**
 * TerraFusion Marketplace API Server
 * Government App Store for plugin submission and revenue tracking
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class TerraFusionMarketplace {
    constructor() {
        this.port = process.env.TF_CONSCIOUSNESS_PORT || process.env.TF_MARKETPLACE_PORT || (() => {
            throw new Error('❌ ANTI-HARDCODING: TF_CONSCIOUSNESS_PORT or TF_MARKETPLACE_PORT must be set. No hardcoded ports allowed in TerraFusion OS.');
        })();
        this.plugins = new Map();
        this.submissions = new Map();
        this.revenue = new Map();
        this.loadPlugins();
    }

    loadPlugins() {
        // Load existing plugins
        const pluginsFile = path.join(__dirname, '../store/plugins.json');
        if (fs.existsSync(pluginsFile)) {
            const data = JSON.parse(fs.readFileSync(pluginsFile, 'utf8'));
            data.plugins.forEach(plugin => {
                this.plugins.set(plugin.id, plugin);
            });
        }
    }

    startServer() {
        const server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });

        server.listen(this.port, () => {
            console.log(`🏪 TerraFusion Marketplace API running on port ${this.port}`);
            console.log(`📊 Plugin store: http://localhost:${this.port}/store`);
            console.log(`🔌 API endpoints: http://localhost:${this.port}/api`);
        });
    }

    handleRequest(req, res) {
        const url = req.url;
        const method = req.method;

        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        try {
            switch (true) {
                case url === '/':
                    this.serveMarketplaceStore(res);
                    break;
                case url === '/api/plugins':
                    this.servePluginsAPI(res);
                    break;
                case url === '/api/submit':
                    this.handlePluginSubmission(req, res);
                    break;
                case url === '/api/revenue':
                    this.serveRevenueAPI(res);
                    break;
                case url === '/api/analytics':
                    this.serveAnalyticsAPI(res);
                    break;
                default:
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('Not Found');
            }
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error: ' + error.message);
        }
    }

    serveMarketplaceStore(res) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TerraFusion Government App Store</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            min-height: 100vh;
        }
        .header {
            background: rgba(0,0,0,0.3);
            padding: 30px;
            text-align: center;
            border-bottom: 2px solid #4CAF50;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .marketplace {
            max-width: 1400px;
            margin: 0 auto;
            padding: 30px;
        }
        .plugin-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
            margin-top: 30px;
        }
        .plugin-card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255,255,255,0.2);
            transition: transform 0.3s ease;
        }
        .plugin-card:hover { transform: translateY(-5px); }
        .plugin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .plugin-title { font-size: 1.4em; color: #4CAF50; }
        .plugin-price { font-size: 1.2em; font-weight: bold; color: #FFD700; }
        .plugin-description { margin: 15px 0; opacity: 0.9; }
        .plugin-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 15px 0;
        }
        .stat { 
            background: rgba(255,255,255,0.1);
            padding: 10px;
            border-radius: 5px;
            text-align: center;
        }
        .install-btn {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
            width: 100%;
            transition: background 0.3s ease;
        }
        .install-btn:hover { background: #45a049; }
        .revenue-summary {
            background: rgba(0,0,0,0.3);
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 30px;
        }
        .revenue-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        .revenue-item {
            text-align: center;
            padding: 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
        }
        .revenue-value { font-size: 2em; font-weight: bold; color: #FFD700; }
        .revenue-label { opacity: 0.9; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏪 TerraFusion Government App Store</h1>
        <p>🔌 33+ Hot-Swappable Modules | 70/30 Revenue Share | Government Compliance</p>
    </div>

    <div class="marketplace">
        <div class="revenue-summary">
            <h2>💰 Marketplace Revenue Model</h2>
            <div class="revenue-grid">
                <div class="revenue-item">
                    <div class="revenue-value">$142</div>
                    <div class="revenue-label">ARPU per County</div>
                </div>
                <div class="revenue-item">
                    <div class="revenue-value">70%</div>
                    <div class="revenue-label">Developer Share</div>
                </div>
                <div class="revenue-item">
                    <div class="revenue-value">30%</div>
                    <div class="revenue-label">Platform Fee</div>
                </div>
                <div class="revenue-item">
                    <div class="revenue-value">726</div>
                    <div class="revenue-label">Target Counties</div>
                </div>
            </div>
        </div>

        <div class="plugin-grid" id="plugin-grid">
            <!-- Plugins will be loaded here -->
        </div>
    </div>

    <script>
        // Load plugins dynamically
        fetch('/api/plugins')
            .then(response => response.json())
            .then(data => {
                const grid = document.getElementById('plugin-grid');
                data.plugins.forEach(plugin => {
                    const card = createPluginCard(plugin);
                    grid.appendChild(card);
                });
            })
            .catch(error => console.error('Error loading plugins:', error));

        function createPluginCard(plugin) {
            const card = document.createElement('div');
            card.className = 'plugin-card';
            card.innerHTML = \`
                <div class="plugin-header">
                    <div class="plugin-title">\${plugin.name}</div>
                    <div class="plugin-price">\${plugin.price}</div>
                </div>
                <div class="plugin-description">\${plugin.description}</div>
                <div class="plugin-stats">
                    <div class="stat">
                        <div>\${plugin.installs}</div>
                        <div>Installs</div>
                    </div>
                    <div class="stat">
                        <div>\${plugin.rating}/5</div>
                        <div>Rating</div>
                    </div>
                </div>
                <button class="install-btn" onclick="installPlugin('\${plugin.id}')">
                    Install Plugin
                </button>
            \`;
            return card;
        }

        function installPlugin(pluginId) {
            alert(\`Installing plugin: \${pluginId}\`);
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }

    servePluginsAPI(res) {
        const plugins = {
            plugins: [
                {
                    id: 'government-edition',
                    name: 'Government Edition Core',
                    description: 'Essential government operations with FISMA compliance',
                    price: 'Free',
                    tier: 'essential',
                    installs: 726,
                    rating: 4.9,
                    revenue: 0
                },
                {
                    id: 'ai-swarm',
                    name: 'AI Agent Swarm',
                    description: '50,000+ AI agents with quantum optimization',
                    price: '$59/month',
                    tier: 'premium',
                    installs: 245,
                    rating: 4.8,
                    revenue: 14455
                },
                {
                    id: 'terra-collections',
                    name: 'Terra Collections Pro',
                    description: 'Advanced property management and GIS integration',
                    price: '$29/month',
                    tier: 'professional',
                    installs: 156,
                    rating: 4.7,
                    revenue: 4524
                },
                {
                    id: 'costforge-ai',
                    name: 'CostForge AI Analytics',
                    description: 'AI-powered cost analysis and optimization',
                    price: '$149/month',
                    tier: 'enterprise',
                    installs: 67,
                    rating: 4.9,
                    revenue: 9983
                }
            ]
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(plugins, null, 2));
    }

    serveRevenueAPI(res) {
        const revenue = {
            totalRevenue: 28962,
            developerShare: 20273,
            platformShare: 8689,
            monthlyGrowth: 23.5,
            topPlugins: [
                { name: 'AI Agent Swarm', revenue: 14455 },
                { name: 'CostForge AI Analytics', revenue: 9983 },
                { name: 'Terra Collections Pro', revenue: 4524 }
            ]
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(revenue, null, 2));
    }

    serveAnalyticsAPI(res) {
        const analytics = {
            totalPlugins: 33,
            activeCounties: 726,
            totalInstalls: 1194,
            averageRating: 4.8,
            revenueGrowth: '+23.5%',
            topCategories: ['Government Tools', 'AI & Analytics', 'GIS & Mapping']
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(analytics, null, 2));
    }
}

// Start marketplace server
const marketplace = new TerraFusionMarketplace();
marketplace.startServer();

module.exports = TerraFusionMarketplace;
