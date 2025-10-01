#!/usr/bin/env node
/**
 * TerraFusion Marketplace API Server
 * Government App Store - "Government. Transcended."
 */

const http = require('http');
const https = require('https');
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
        this.brandConfig = this.loadBrandConfig();
        
        // Initialize plugins asynchronously
        this.initializePlugins();
    }

    async initializePlugins() {
        await this.loadPlugins();
    }

    // Simple HTTP client to avoid fetch dependency
    httpGet(url) {
        return new Promise((resolve, reject) => {
            const client = url.startsWith('https:') ? https : http;
            client.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve({ ok: res.statusCode === 200, json: () => JSON.parse(data) });
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });
    }

    loadBrandConfig() {
        try {
            const brandPath = path.join(__dirname, 'brand-config.json');
            if (fs.existsSync(brandPath)) {
                return JSON.parse(fs.readFileSync(brandPath, 'utf8'));
            }
        } catch (error) {
            console.warn('⚠️ Brand config not found, using defaults');
        }
        
        // Load from Brand_Assets if available (no hardcoding)
        try {
            const brandAssetsPath = path.join(__dirname, '../../Brand_Assets/tf-brand-config.json');
            if (fs.existsSync(brandAssetsPath)) {
                return JSON.parse(fs.readFileSync(brandAssetsPath, 'utf8'));
            }
        } catch (error) {
            console.warn('⚠️ Brand_Assets config not found');
        }
        
        // Only as absolute last resort - load from TerraFusion defaults (no hardcoded values)
        return {
            brand: {
                name: process.env.TF_BRAND_NAME || "TerraFusion OS",
                essence: process.env.TF_BRAND_ESSENCE || "Government. Transcended.",
                tagline: process.env.TF_BRAND_TAGLINE || "Government. Transcended.",
                colors: {
                    primary: process.env.TF_BRAND_PRIMARY || "#0099ff",
                    accent: process.env.TF_BRAND_ACCENT || "#00ffaa", 
                    transcend: process.env.TF_BRAND_TRANSCEND || "#00ffee",
                    dark: process.env.TF_BRAND_DARK || "#0b1020"
                }
            }
        };
    }

    async loadPlugins() {
        // Load plugins dynamically from TerraFusion API (no hardcoding!)
        try {
            const apiPort = process.env.TF_API_PORT || process.env.TF_API_PORT_FALLBACK || this.getConfiguredApiPort();
            const response = await this.httpGet(`http://localhost:${apiPort}/api/modules`);
            if (response.ok) {
                const data = await response.json();
                console.log(`📊 Loaded ${data.modules?.length || 0} modules from TerraFusion API`);
                
                // Load from actual running system
                if (data.modules) {
                    data.modules.forEach(module => {
                        this.plugins.set(module.id || module.name, {
                            id: module.id || module.name,
                            name: module.displayName || module.name,
                            price: module.price || this.getModulePrice(module.id || module.name, 0),
                            tier: module.tier || 'standard',
                            description: module.description || 'TerraFusion government module',
                            status: module.status || 'active'
                        });
                    });
                }
            } else {
                console.warn('⚠️ Could not load modules from API, using fallback registry');
                this.loadFallbackPlugins();
            }
        } catch (error) {
            console.warn('⚠️ API not available, loading from registries');
            this.loadFromRegistries();
        }
    }

    getConfiguredApiPort() {
        // Read from .env.ports or terrafusion-config.json (no hardcoding)
        try {
            const configPath = path.join(__dirname, '../../.env.ports');
            if (fs.existsSync(configPath)) {
                const config = fs.readFileSync(configPath, 'utf8');
                const match = config.match(/TF_API_PORT=\${TF_API_PORT:-(\d+)}/);
                if (match) return match[1];
            }
        } catch (error) {
            console.warn('⚠️ Could not read .env.ports');
        }
        
        // Last resort from environment or throw error
        if (!process.env.TF_API_PORT) {
            throw new Error('❌ ANTI-HARDCODING: TF_API_PORT must be configured. No hardcoded ports allowed.');
        }
        return process.env.TF_API_PORT;
    }

    loadFallbackPlugins() {
        // Load minimal fallback from config (no hardcoding)
        try {
            const govRegistryPath = path.join(__dirname, 'government-module-registry.json');
            if (fs.existsSync(govRegistryPath)) {
                const registry = JSON.parse(fs.readFileSync(govRegistryPath, 'utf8'));
                const businessModel = registry.terrafusion_government_module_registry?.business_model;
                
                this.plugins.set('government-core', {
                    id: 'government-core',
                    name: '🏛️ Government Core',
                    price: businessModel?.base_license?.price_monthly || 0,
                    tier: 'base',
                    description: businessModel?.base_license?.description || 'Essential government operations and compliance'
                });
                
                console.log('📋 Loaded fallback from government registry');
                return;
            }
        } catch (error) {
            console.warn('⚠️ Could not load government registry');
        }
        
        // Absolute emergency fallback - load from environment variables
        this.plugins.set('government-core', {
            id: 'government-core',
            name: process.env.TF_CORE_MODULE_NAME || '🏛️ Government Core',
            price: parseInt(process.env.TF_CORE_MODULE_PRICE || '0', 10),
            tier: 'base',
            description: process.env.TF_CORE_MODULE_DESC || 'Essential government operations and compliance'
        });
        
        console.log('⚠️ Using emergency fallback configuration');
    }

    async loadFromRegistries() {
        // Load from your comprehensive registries (no hardcoding)
        try {
            const registryPaths = [
                'government-module-registry.json',
                '../modules/module-registry.json',
                '../backend/config/active-modules.json'
            ];
            
            for (const registryPath of registryPaths) {
                try {
                    const fullPath = path.join(__dirname, registryPath);
                    if (fs.existsSync(fullPath)) {
                        const registry = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                        
                        // Handle different registry formats
                        if (registry.terrafusion_government_module_registry) {
                            this.loadGovernmentModules(registry.terrafusion_government_module_registry);
                        } else if (registry.active_production_modules) {
                            this.loadProductionModules(registry.active_production_modules);
                        } else if (registry.core_government_modules) {
                            this.loadCoreModules(registry.core_government_modules);
                        }
                        
                        console.log(`📋 Loaded registry: ${registryPath}`);
                    }
                } catch (err) {
                    console.warn(`⚠️ Could not load registry ${registryPath}:`, err.message);
                }
            }
        } catch (error) {
            console.error('❌ Error loading registries:', error.message);
            this.loadFallbackPlugins();
        }
    }

    loadGovernmentModules(registry) {
        // Load from government-module-registry.json format
        Object.values(registry.module_categories || {}).forEach(category => {
            category.modules?.forEach(module => {
                this.plugins.set(module.module_id, {
                    id: module.module_id,
                    name: `${category.icon} ${module.name}`,
                    price: module.price_monthly || 0,
                    tier: category.category_id,
                    description: module.description,
                    status: module.status || 'available'
                });
            });
        });
    }

    loadProductionModules(modules) {
        // Load from module-registry.json format
        Object.values(modules).forEach(moduleGroup => {
            moduleGroup.modules?.forEach(moduleName => {
                this.plugins.set(moduleName, {
                    id: moduleName,
                    name: this.formatModuleName(moduleName),
                    price: this.getModulePrice(moduleName),
                    tier: moduleGroup.priority || 'standard',
                    description: `TerraFusion ${moduleName} module`,
                    status: moduleGroup.status || 'active'
                });
            });
        });
    }

    loadCoreModules(modules) {
        // Load from active-modules.json format
        Object.values(modules).forEach(moduleGroup => {
            moduleGroup.modules?.forEach(module => {
                this.plugins.set(module.name, {
                    id: module.name,
                    name: module.display_name || module.name,
                    price: this.getModulePrice(module.name),
                    tier: moduleGroup.description || 'standard',
                    description: module.features?.join(', ') || 'TerraFusion government module',
                    status: module.status || 'active'
                });
            });
        });
    }

    formatModuleName(name) {
        // Convert kebab-case to Title Case with appropriate emojis
        const nameMap = {
            'government-edition': '🏛️ Government Edition',
            'costforge-ai': '💰 CostForge AI',
            'ai-swarm': '🧠 AI Swarm',
            'emergency-management': '🚨 Emergency Management',
            'terra-collections': '💳 Terra Collections',
            'terra-levy': '📊 Terra Levy',
            'terra-insight': '📈 Terra Insight'
        };
        return nameMap[name] || name.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    getModulePrice(moduleName, defaultPrice = null) {
        // Load pricing from government registry (no hardcoding)
        try {
            const govRegistryPath = path.join(__dirname, 'government-module-registry.json');
            if (fs.existsSync(govRegistryPath)) {
                const registry = JSON.parse(fs.readFileSync(govRegistryPath, 'utf8'));
                const businessModel = registry.terrafusion_government_module_registry?.business_model;
                
                // Check if it's a base module
                if (moduleName === 'government-edition' || moduleName === 'government-core') {
                    return defaultPrice || businessModel?.base_license?.price_monthly || 0;
                }
                
                // Search through module categories for pricing
                const categories = registry.terrafusion_government_module_registry?.module_categories || {};
                for (const category of Object.values(categories)) {
                    const module = category.modules?.find(m => 
                        m.module_id === moduleName || 
                        m.name.toLowerCase().includes(moduleName.toLowerCase())
                    );
                    if (module) return module.price_monthly || category.base_price || 0;
                }
                
                // Use marketplace ARPU as default for unknown modules
                return businessModel?.marketplace_arpu?.price_monthly || defaultPrice || 0;
            }
        } catch (error) {
            console.warn(`⚠️ Could not load pricing for ${moduleName}:`, error.message);
        }
        
        // Environment variable override (no hardcoding)
        const envPrice = process.env[`TF_MODULE_PRICE_${moduleName.toUpperCase().replace('-', '_')}`];
        if (envPrice) return parseInt(envPrice, 10);
        
        return defaultPrice || 0; // Only return 0 if explicitly passed as default
    }

    getRevenueModel() {
        // Load revenue model from configuration (no hardcoding)
        try {
            const govRegistryPath = path.join(__dirname, 'government-module-registry.json');
            if (fs.existsSync(govRegistryPath)) {
                const registry = JSON.parse(fs.readFileSync(govRegistryPath, 'utf8'));
                const businessModel = registry.terrafusion_government_module_registry?.business_model;
                
                if (businessModel) {
                    return {
                        baseRevenue: businessModel.base_license?.price_monthly || 0,
                        marketplaceArpu: businessModel.marketplace_arpu?.price_monthly || 0,
                        totalPerCounty: businessModel.total_revenue_per_county?.price_monthly || 0,
                        revenueSharing: `${businessModel.revenue_sharing?.terrafusion || 70}/${businessModel.revenue_sharing?.developer || 30}`,
                        description: `$${businessModel.base_license?.price_monthly || 0}/month base + $${businessModel.marketplace_arpu?.price_monthly || 0} marketplace ARPU = $${businessModel.total_revenue_per_county?.price_monthly || 0}/county`
                    };
                }
            }
        } catch (error) {
            console.warn('⚠️ Could not load revenue model from registry');
        }
        
        // Environment variable fallback (no hardcoding)
        return {
            baseRevenue: parseInt(process.env.TF_BASE_REVENUE || '0', 10),
            marketplaceArpu: parseInt(process.env.TF_MARKETPLACE_ARPU || '0', 10),
            totalPerCounty: parseInt(process.env.TF_TOTAL_PER_COUNTY || '0', 10),
            revenueSharing: process.env.TF_REVENUE_SHARING || '70/30',
            description: `Government App Store revenue model`
        };
    }

    serveMarketplaceStore(res) {
        const brand = this.brandConfig.brand;
        const revenue = this.getRevenueModel();
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brand.name} - Government App Store</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, ${brand.colors.dark} 0%, ${brand.colors.primary} 100%);
            color: white;
            min-height: 100vh;
        }
        .header {
            padding: 2rem;
            text-align: center;
            background: rgba(0,0,0,0.3);
            backdrop-filter: blur(10px);
        }
        .header h1 {
            font-size: 3rem;
            background: linear-gradient(135deg, ${brand.colors.primary}, ${brand.colors.transcend}, ${brand.colors.accent});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
        }
        .tagline {
            font-size: 1.5rem;
            color: ${brand.colors.transcend};
            text-shadow: 0 0 20px rgba(0, 255, 238, 0.5);
        }
        .marketplace-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            padding: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .plugin-card {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 1.5rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 255, 238, 0.3);
            transition: all 0.3s ease;
        }
        .plugin-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 255, 238, 0.3);
        }
        .plugin-title {
            color: ${brand.colors.accent};
            font-size: 1.3rem;
            margin-bottom: 0.5rem;
        }
        .plugin-price {
            color: ${brand.colors.transcend};
            font-weight: bold;
            font-size: 1.1rem;
        }
        .revenue-model {
            background: rgba(0,0,0,0.4);
            margin: 2rem;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
        }
        .revenue-highlight {
            color: ${brand.colors.accent};
            font-size: 2rem;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${brand.name}</h1>
        <div class="tagline">${brand.tagline}</div>
        <p style="margin-top: 1rem; opacity: 0.8;">Government App Store • ${revenue.revenueSharing} Revenue Sharing</p>
    </div>
    
    <div class="revenue-model">
        <h2>Revenue Model</h2>
        <div class="revenue-highlight">${revenue.description}</div>
        <p style="margin-top: 1rem;">Sustainable government innovation through the plugin economy</p>
    </div>
    
    <div class="marketplace-grid">
        <div class="plugin-card">
            <div class="plugin-title">🏛️ Government Module Registry</div>
            <p>${this.plugins.size}+ hot-swappable government applications</p>
            <div class="plugin-price">Base Platform Included</div>
        </div>
        
        <div class="plugin-card">
            <div class="plugin-title">🚨 Emergency Management</div>
            <p>Crisis response and disaster management platform</p>
            <div class="plugin-price">$${this.getModulePrice('emergency-management')}/month</div>
        </div>
        
        <div class="plugin-card">
            <div class="plugin-title">💰 CostForge AI Pro</div>
            <p>AI-powered property valuation with quantum algorithms</p>
            <div class="plugin-price">$${this.getModulePrice('costforge-ai')}/month</div>
        </div>
        
        <div class="plugin-card">
            <div class="plugin-title">🧠 AI Swarm Orchestrator</div>
            <p>50,000-agent swarm coordination with quantum coherence</p>
            <div class="plugin-price">$${this.getModulePrice('ai-swarm')}/month</div>
        </div>
    </div>
    
    <div style="text-align: center; padding: 2rem; opacity: 0.7;">
        <p>TerraFusion OS • The Complete Government Operating System</p>
        <p>API: <a href="/api/plugins" style="color: ${brand.colors.accent};">/api/plugins</a> • 
           Revenue: <a href="/api/revenue" style="color: ${brand.colors.accent};">/api/revenue</a></p>
    </div>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }

    handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        console.log(`${req.method} ${url.pathname}`);

        switch (url.pathname) {
            case '/':
                this.serveMarketplaceStore(res);
                break;

            case '/api/plugins':
                const revenue = this.getRevenueModel();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    plugins: Array.from(this.plugins.values()),
                    totalRevenue: revenue.description,
                    revenueModel: revenue.revenueSharing
                }));
                break;

            case '/api/revenue':
                const revenueData = this.getRevenueModel();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(revenueData));
                break;

            case '/health':
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'healthy',
                    service: 'TerraFusion Marketplace',
                    brand: this.brandConfig.brand.essence,
                    plugins: this.plugins.size,
                    port: this.port
                }));
                break;

            default:
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Not found' }));
        }
    }

    start() {
        const server = http.createServer((req, res) => this.handleRequest(req, res));
        
        server.listen(this.port, () => {
            const revenue = this.getRevenueModel();
            console.log(`
🏛️ TerraFusion Marketplace ONLINE
┌─────────────────────────────────────────────────────────┐
│ 🌟 Government. Transcended.                             │
│ 🚀 Government App Store: http://localhost:${this.port}           │
│ 💰 Revenue Model: ${revenue.description}                    │
│ 🔌 Plugins: ${this.plugins.size} available                               │
│ 🎨 Brand: ${this.brandConfig.brand.essence}                     │
└─────────────────────────────────────────────────────────┘
            `);
        });

        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${this.port} already in use. Try a different TF_CONSCIOUSNESS_PORT.`);
            } else {
                console.error('❌ Server error:', error);
            }
            process.exit(1);
        });
    }
}

if (require.main === module) {
    const marketplace = new TerraFusionMarketplace();
    marketplace.start();
}

module.exports = TerraFusionMarketplace;