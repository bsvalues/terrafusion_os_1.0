#!/bin/bash

# TERRAFUSION DEMO ENVIRONMENT SETUP
# demo.terrafusionmarket.io

echo "🎯 TERRAFUSION DEMO ENVIRONMENT CREATOR"
echo "========================================"
echo "Setting up demo.terrafusionmarket.io"
echo ""

# Create demo directory structure
mkdir -p demo-environment
cd demo-environment

# 1. CREATE DEMO DATA
echo "📊 Creating Demo Data..."
cat > demo-data.json << 'EOF'
{
  "demo_accounts": [
    {
      "username": "demo_admin",
      "password": "ViewOnly2024!",
      "role": "administrator",
      "county": "Demo County",
      "features": "all"
    },
    {
      "username": "demo_user",
      "password": "TryTerraFusion!",
      "role": "standard",
      "county": "Sample Township",
      "features": "basic"
    }
  ],
  "sample_data": {
    "properties": 10000,
    "tax_records": 50000,
    "workflows": 150,
    "documents": 5000,
    "gis_layers": 25,
    "ai_insights": 100
  },
  "demo_scenarios": [
    "Property Tax Assessment Workflow",
    "Building Permit Processing",
    "Code Violation Tracking",
    "Budget Analysis Dashboard",
    "Citizen Service Portal"
  ]
}
EOF

# 2. CREATE DEMO CONFIGURATION
echo "⚙️ Creating Demo Configuration..."
cat > demo-config.js << 'EOF'
// TerraFusion Demo Environment Configuration
const DEMO_CONFIG = {
  // Demo Mode Settings
  isDemoMode: true,
  demoTimeout: 3600000, // 1 hour sessions
  resetInterval: 86400000, // Daily reset
  
  // Feature Flags for Demo
  features: {
    allAppsEnabled: true,
    aiAssistant: true,
    dataExport: false, // Disabled in demo
    realTimeSync: true,
    pluginMarketplace: true,
    customization: 'limited'
  },
  
  // Sample Data Sets
  dataSets: {
    smallCounty: {
      name: "Riverside Township",
      population: 5000,
      properties: 2500,
      annualBudget: "$5M"
    },
    mediumCounty: {
      name: "Jefferson County", 
      population: 50000,
      properties: 25000,
      annualBudget: "$50M"
    },
    largeCounty: {
      name: "Metropolitan District",
      population: 500000,
      properties: 250000,
      annualBudget: "$500M"
    }
  },
  
  // Demo Limitations
  limitations: {
    maxRecords: 1000,
    maxExport: 100,
    maxUsers: 5,
    maxStorage: "100MB"
  },
  
  // Analytics Tracking
  analytics: {
    enabled: true,
    trackEvents: true,
    anonymizeData: true,
    endpoint: "https://analytics.terrafusionmarket.io"
  }
};

// Auto-start demo tours
const DEMO_TOURS = {
  welcome: {
    steps: [
      "Welcome to TerraFusion - The Complete Government Operating System",
      "Navigate through 14 integrated applications",
      "Experience AI-powered automation",
      "See real-time analytics and insights",
      "Explore the plugin marketplace"
    ]
  },
  features: {
    "TerraAgent": "AI assistant for government operations",
    "TerraFlow": "Automated workflow processing",
    "CostForgeAI": "Intelligent cost analysis",
    "GISPRO": "Advanced mapping and spatial analysis"
  }
};

export { DEMO_CONFIG, DEMO_TOURS };
EOF

# 3. CREATE DEMO LANDING PAGE
echo "🎨 Creating Demo Landing Page..."
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TerraFusion Demo - Experience the Future of Government Technology</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3a 100%);
            color: white;
            min-height: 100vh;
        }
        .header {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            text-align: center;
            border-bottom: 2px solid #00e5ff;
        }
        .logo {
            font-size: 2.5em;
            font-weight: bold;
            background: linear-gradient(45deg, #00e5ff, #00b8d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .tagline {
            color: #00e5ff;
            margin-top: 10px;
            font-size: 1.2em;
        }
        .demo-container {
            max-width: 1200px;
            margin: 50px auto;
            padding: 0 20px;
        }
        .demo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin: 40px 0;
        }
        .demo-card {
            background: rgba(0,0,0,0.4);
            border: 1px solid #00e5ff;
            border-radius: 10px;
            padding: 30px;
            transition: transform 0.3s;
        }
        .demo-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,229,255,0.3);
        }
        .demo-card h3 {
            color: #00e5ff;
            margin-bottom: 15px;
        }
        .demo-card ul {
            list-style: none;
            padding-left: 0;
        }
        .demo-card li {
            padding: 8px 0;
            border-bottom: 1px solid rgba(0,229,255,0.2);
        }
        .demo-card li:before {
            content: "✓ ";
            color: #00ff00;
            font-weight: bold;
        }
        .cta-section {
            text-align: center;
            margin: 60px 0;
        }
        .cta-button {
            display: inline-block;
            padding: 20px 40px;
            background: linear-gradient(45deg, #00e5ff, #00b8d4);
            color: #0f0f23;
            text-decoration: none;
            border-radius: 50px;
            font-size: 1.3em;
            font-weight: bold;
            transition: all 0.3s;
            margin: 10px;
        }
        .cta-button:hover {
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(0,229,255,0.6);
        }
        .demo-accounts {
            background: rgba(0,229,255,0.1);
            border: 2px solid #00e5ff;
            border-radius: 10px;
            padding: 30px;
            margin: 40px 0;
        }
        .account-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .account-card {
            background: rgba(0,0,0,0.4);
            padding: 20px;
            border-radius: 8px;
        }
        .account-card h4 {
            color: #00ff00;
            margin-bottom: 10px;
        }
        .credentials {
            font-family: monospace;
            background: rgba(0,0,0,0.3);
            padding: 10px;
            border-radius: 5px;
            margin: 5px 0;
        }
        .feature-showcase {
            margin: 60px 0;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .feature-item {
            text-align: center;
            padding: 20px;
            background: rgba(0,0,0,0.3);
            border-radius: 10px;
            border: 1px solid rgba(0,229,255,0.3);
        }
        .feature-icon {
            font-size: 3em;
            margin-bottom: 10px;
        }
        .stats {
            display: flex;
            justify-content: space-around;
            margin: 40px 0;
            flex-wrap: wrap;
        }
        .stat-item {
            text-align: center;
            padding: 20px;
        }
        .stat-number {
            font-size: 3em;
            color: #00e5ff;
            font-weight: bold;
        }
        .stat-label {
            margin-top: 10px;
            color: #ccc;
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="logo">🚀 TerraFusion Demo</div>
        <div class="tagline">Experience the Complete Government Operating System</div>
    </header>

    <div class="demo-container">
        <div class="stats">
            <div class="stat-item">
                <div class="stat-number">14</div>
                <div class="stat-label">Integrated Apps</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">60%</div>
                <div class="stat-label">Cost Reduction</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">10x</div>
                <div class="stat-label">Faster Processing</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">99.9%</div>
                <div class="stat-label">Uptime</div>
            </div>
        </div>

        <div class="demo-accounts">
            <h2>🔑 Demo Access Credentials</h2>
            <p style="margin-top: 10px; color: #ccc;">Use these accounts to explore TerraFusion:</p>
            <div class="account-grid">
                <div class="account-card">
                    <h4>Administrator Demo</h4>
                    <div class="credentials">Username: demo_admin</div>
                    <div class="credentials">Password: ViewOnly2024!</div>
                    <p style="margin-top: 10px; font-size: 0.9em; color: #00e5ff;">
                        Full access to all 14 applications
                    </p>
                </div>
                <div class="account-card">
                    <h4>Standard User Demo</h4>
                    <div class="credentials">Username: demo_user</div>
                    <div class="credentials">Password: TryTerraFusion!</div>
                    <p style="margin-top: 10px; font-size: 0.9em; color: #00e5ff;">
                        Basic features and workflows
                    </p>
                </div>
                <div class="account-card">
                    <h4>Guest Access</h4>
                    <div class="credentials">No login required</div>
                    <div class="credentials">Limited view only</div>
                    <p style="margin-top: 10px; font-size: 0.9em; color: #00e5ff;">
                        Public dashboard view
                    </p>
                </div>
            </div>
        </div>

        <div class="demo-grid">
            <div class="demo-card">
                <h3>🏛️ Small County Demo</h3>
                <p style="margin-bottom: 15px; color: #ccc;">Perfect for townships and small municipalities</p>
                <ul>
                    <li>Population: 5,000</li>
                    <li>Properties: 2,500</li>
                    <li>Annual Budget: $5M</li>
                    <li>Core Apps Package</li>
                    <li>$199/month pricing</li>
                </ul>
            </div>
            
            <div class="demo-card">
                <h3>🏢 Medium County Demo</h3>
                <p style="margin-bottom: 15px; color: #ccc;">Ideal for county governments</p>
                <ul>
                    <li>Population: 50,000</li>
                    <li>Properties: 25,000</li>
                    <li>Annual Budget: $50M</li>
                    <li>Full Suite Access</li>
                    <li>$999/month pricing</li>
                </ul>
            </div>
            
            <div class="demo-card">
                <h3>🌆 Large County Demo</h3>
                <p style="margin-bottom: 15px; color: #ccc;">Enterprise metropolitan districts</p>
                <ul>
                    <li>Population: 500,000</li>
                    <li>Properties: 250,000</li>
                    <li>Annual Budget: $500M</li>
                    <li>Enterprise Features</li>
                    <li>Custom pricing</li>
                </ul>
            </div>
        </div>

        <div class="feature-showcase">
            <h2 style="text-align: center; color: #00e5ff; margin-bottom: 10px;">
                🎯 14 Integrated Applications
            </h2>
            <p style="text-align: center; color: #ccc; margin-bottom: 30px;">
                Click any app to launch in demo mode
            </p>
            <div class="feature-grid">
                <div class="feature-item">
                    <div class="feature-icon">🤖</div>
                    <h4>TerraAgent</h4>
                    <p style="font-size: 0.9em; color: #ccc;">AI Assistant</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">⚡</div>
                    <h4>TerraFlow</h4>
                    <p style="font-size: 0.9em; color: #ccc;">Workflow Engine</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">📊</div>
                    <h4>WebAuditTracker</h4>
                    <p style="font-size: 0.9em; color: #ccc;">Compliance</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">💰</div>
                    <h4>TerraLevy</h4>
                    <p style="font-size: 0.9em; color: #ccc;">Tax Management</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">⛏️</div>
                    <h4>TerraMiner</h4>
                    <p style="font-size: 0.9em; color: #ccc;">Data Analytics</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🔄</div>
                    <h4>TerraFusionSync</h4>
                    <p style="font-size: 0.9em; color: #ccc;">Data Sync</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🗺️</div>
                    <h4>GISPRO</h4>
                    <p style="font-size: 0.9em; color: #ccc;">GIS Mapping</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🧮</div>
                    <h4>CostForgeAI</h4>
                    <p style="font-size: 0.9em; color: #ccc;">Cost Analysis</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🏠</div>
                    <h4>PropertyWorkbench</h4>
                    <p style="font-size: 0.9em; color: #ccc;">Property Mgmt</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">📈</div>
                    <h4>TerraInsight</h4>
                    <p style="font-size: 0.9em; color: #ccc;">BI Dashboard</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">📱</div>
                    <h4>Dashboard</h4>
                    <p style="font-size: 0.9em; color: #ccc;">Executive View</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🏆</div>
                    <h4>Assessor</h4>
                    <p style="font-size: 0.9em; color: #ccc;">AI Assessment</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">🛒</div>
                    <h4>Marketplace</h4>
                    <p style="font-size: 0.9em; color: #ccc;">Plugin Store</p>
                </div>
                <div class="feature-item">
                    <div class="feature-icon">💳</div>
                    <h4>Collections</h4>
                    <p style="font-size: 0.9em; color: #ccc;">Revenue Mgmt</p>
                </div>
            </div>
        </div>

        <div class="cta-section">
            <h2 style="margin-bottom: 20px; color: #00e5ff;">Ready to Transform Your Government Operations?</h2>
            <p style="margin-bottom: 30px; color: #ccc; font-size: 1.1em;">
                Join 100+ counties already using TerraFusion
            </p>
            <a href="/demo/launch" class="cta-button">🚀 Launch Full Demo</a>
            <a href="/demo/guided" class="cta-button">🎯 Start Guided Tour</a>
            <a href="/contact" class="cta-button">📞 Schedule Live Demo</a>
        </div>
    </div>

    <script>
        // Demo initialization
        console.log('TerraFusion Demo Environment Loaded');
        
        // Track demo interactions
        document.querySelectorAll('.cta-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.textContent;
                console.log('Demo action:', action);
                // Analytics tracking would go here
            });
        });
        
        // Auto-refresh demo data every hour
        setTimeout(() => {
            console.log('Demo session expired - refreshing...');
            location.reload();
        }, 3600000);
    </script>
</body>
</html>
EOF

# 4. CREATE DEMO API ENDPOINTS
echo "🔌 Creating Demo API Endpoints..."
cat > demo-api.js << 'EOF'
// TerraFusion Demo API Server
const express = require('express');
const app = express();
const PORT = 3001;

// Demo endpoints
app.get('/api/demo/status', (req, res) => {
    res.json({
        status: 'active',
        mode: 'demo',
        features: {
            apps: 14,
            users: 'unlimited',
            dataReset: 'daily',
            limitations: 'export disabled'
        }
    });
});

app.get('/api/demo/apps', (req, res) => {
    res.json({
        apps: [
            { id: 1, name: 'TerraAgent', status: 'running', demo: true },
            { id: 2, name: 'TerraFlow', status: 'running', demo: true },
            { id: 3, name: 'WebAuditTracker', status: 'running', demo: true },
            { id: 4, name: 'TerraLevy', status: 'running', demo: true },
            { id: 5, name: 'TerraMiner', status: 'running', demo: true },
            { id: 6, name: 'TerraFusionSync', status: 'running', demo: true },
            { id: 7, name: 'GISPRO', status: 'running', demo: true },
            { id: 8, name: 'CostForgeAI', status: 'running', demo: true },
            { id: 9, name: 'PropertyWorkbench', status: 'running', demo: true },
            { id: 10, name: 'TerraInsight', status: 'running', demo: true },
            { id: 11, name: 'TerraFusionDashboard', status: 'running', demo: true },
            { id: 12, name: 'TerraFusionAssessor', status: 'running', demo: true },
            { id: 13, name: 'Marketplace', status: 'running', demo: true },
            { id: 14, name: 'TerraCollections', status: 'running', demo: true }
        ]
    });
});

app.get('/api/demo/metrics', (req, res) => {
    res.json({
        performance: {
            responseTime: '45ms',
            uptime: '99.99%',
            activeUsers: Math.floor(Math.random() * 100) + 50,
            requestsPerMinute: Math.floor(Math.random() * 1000) + 500
        }
    });
});

app.listen(PORT, () => {
    console.log(`Demo API running on port ${PORT}`);
});
EOF

# 5. CREATE NGINX CONFIG FOR DEMO SUBDOMAIN
echo "🌐 Creating Demo Subdomain Configuration..."
cat > demo.nginx.conf << 'EOF'
# demo.terrafusionmarket.io configuration
server {
    listen 80;
    server_name demo.terrafusionmarket.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name demo.terrafusionmarket.io;
    
    # SSL configuration
    ssl_certificate /etc/ssl/certs/terrafusion-demo.crt;
    ssl_certificate_key /etc/ssl/private/terrafusion-demo.key;
    
    # Demo environment root
    root /var/www/terrafusion-demo;
    index index.html;
    
    # Security headers with demo-specific settings
    add_header X-Robots-Tag "noindex, nofollow" always;
    add_header X-Demo-Mode "true" always;
    
    # Demo session management
    location / {
        try_files $uri $uri/ /index.html;
        
        # Add demo watermark header
        add_header X-Demo-Environment "true" always;
    }
    
    # Demo API
    location /api/demo {
        proxy_pass http://localhost:3001;
        proxy_set_header X-Demo-Request "true";
    }
    
    # Rate limiting for demo
    limit_req_zone $binary_remote_addr zone=demo:10m rate=10r/s;
    limit_req zone=demo burst=20;
}
EOF

# 6. CREATE DEPLOYMENT SCRIPT
echo "🚀 Creating Demo Deployment Script..."
cat > deploy-demo.sh << 'EOF'
#!/bin/bash
echo "Deploying TerraFusion Demo Environment..."

# Check if running on server
if [ ! -d "/var/www" ]; then
    echo "This script should be run on the production server"
    exit 1
fi

# Create demo directory
sudo mkdir -p /var/www/terrafusion-demo

# Copy demo files
sudo cp -r * /var/www/terrafusion-demo/

# Set permissions
sudo chown -R www-data:www-data /var/www/terrafusion-demo
sudo chmod -R 755 /var/www/terrafusion-demo

# Install demo API dependencies
cd /var/www/terrafusion-demo
npm install express

# Start demo API with PM2
pm2 start demo-api.js --name terrafusion-demo-api

# Configure nginx
sudo cp demo.nginx.conf /etc/nginx/sites-available/demo.terrafusionmarket.io
sudo ln -sf /etc/nginx/sites-available/demo.terrafusionmarket.io /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Demo environment deployed at demo.terrafusionmarket.io"
EOF
chmod +x deploy-demo.sh

echo ""
echo "✅ DEMO ENVIRONMENT CREATED!"
echo "============================"
echo "Files created in: demo-environment/"
echo ""
echo "To deploy:"
echo "1. Upload demo-environment folder to server"
echo "2. Run: ./deploy-demo.sh"
echo "3. Access at: https://demo.terrafusionmarket.io"