// Terrafusion Demo API Server
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
