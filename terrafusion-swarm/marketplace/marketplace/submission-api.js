
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port=${{TF_CONSCIOUSNESS_PORT:-3002}};

// Configure multer for file uploads
const upload = multer({ 
    dest: './marketplace/submissions/',
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

app.use(express.json());
app.use(express.static('marketplace'));

// Plugin submission endpoint
app.post('/api/plugins/submit', upload.single('plugin'), async (req, res) => {
    try {
        const submissionId = uuidv4();
        const { developer, email, category, pricing } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ error: 'Plugin file is required' });
        }
        
        const submission = {
            id: submissionId,
            developer,
            email,
            category,
            pricing: JSON.parse(pricing),
            status: 'pending_review',
            submittedAt: new Date().toISOString(),
            filePath: req.file.path,
            reviewSteps: [
                { step: 'automated_scan', status: 'pending' },
                { step: 'compliance_check', status: 'pending' },
                { step: 'manual_review', status: 'pending' },
                { step: 'government_testing', status: 'pending' }
            ]
        };
        
        // Save submission metadata
        fs.writeFileSync(
            path.join('./marketplace/submissions', `${submissionId}.json`),
            JSON.stringify(submission, null, 2)
        );
        
        console.log(`📦 New plugin submission: ${submissionId}`);
        
        res.json({
            success: true,
            submissionId,
            message: 'Plugin submitted successfully',
            estimatedReviewTime: '7-14 days'
        });
        
    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ error: 'Submission failed' });
    }
});

// Get submission status
app.get('/api/plugins/submission/:id', (req, res) => {
    try {
        const submissionFile = path.join('./marketplace/submissions', `${req.params.id}.json`);
        
        if (!fs.existsSync(submissionFile)) {
            return res.status(404).json({ error: 'Submission not found' });
        }
        
        const submission = JSON.parse(fs.readFileSync(submissionFile, 'utf8'));
        res.json(submission);
        
    } catch (error) {
        res.status(500).json({ error: 'Failed to get submission status' });
    }
});

// List all plugins in marketplace
app.get('/api/plugins', (req, res) => {
    const plugins = [
        {
            id: 'costforge-ai-pro',
            name: 'CostForge AI Pro',
            category: 'ai-enhancement',
            price: 89.99,
            monthlyRevenue: 89400,
            counties: 15,
            rating: 4.9,
            compliance: ['FISMA', 'NIST-800-53']
        },
        {
            id: 'gis-pro-enterprise',
            name: 'GIS Pro Enterprise',
            category: 'property-assessment',
            price: 67.20,
            monthlyRevenue: 67200,
            counties: 12,
            rating: 4.8,
            compliance: ['FISMA', 'SECTION-508']
        }
    ];
    
    res.json(plugins);
});

// Revenue analytics endpoint
app.get('/api/revenue/analytics', (req, res) => {
    const analytics = {
        monthlyRevenue: 847000,
        platformShare: 254100,
        developerShare: 592900,
        totalPlugins: 47,
        activePlugins: 43,
        pendingReview: 4,
        countiesActive: 23,
        avgPluginsPerCounty: 8.2,
        monthlyARPU: 142,
        growthRate: 0.34
    };
    
    res.json(analytics);
});

app.listen(port, () => {
    console.log(`🏪 TerraFusion Marketplace API running on port ${port}`);
    console.log(`📊 Revenue Dashboard: http://localhost:${port}/revenue-dashboard.html`);
    console.log(`🚀 Plugin Submission: POST http://localhost:${port}/api/plugins/submit`);
});
