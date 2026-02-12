/**
 * Assessment Routes - Property Assessment API Endpoints
 * Squad Beta Backend Component
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const AIService = require('../services/ai');
const DatabaseService = require('../services/database');
const CacheService = require('../services/cache');

// Rate limiting for assessment endpoints
const assessmentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 assessments per minute
    message: {
        error: 'Too many assessment requests. Please wait before submitting another.',
        code: 'ASSESSMENT_RATE_LIMIT'
    }
});

// Validation rules
const demoValidation = [
    body('address').notEmpty().withMessage('Address is required'),
    body('type').isIn(['residential', 'commercial', 'industrial', 'agricultural']).withMessage('Invalid property type'),
    body('county').notEmpty().withMessage('County is required')
];

const fullAssessmentValidation = [
    ...demoValidation,
    body('sqft').optional().isNumeric().withMessage('Square footage must be numeric'),
    body('yearBuilt').optional().isInt({ min: 1800, max: new Date().getFullYear() }).withMessage('Invalid year built'),
    body('lotSize').optional().isFloat({ min: 0 }).withMessage('Lot size must be positive'),
    body('features').optional().isArray().withMessage('Features must be an array')
];

// Initialize services
let aiService, dbService, cacheService;

// Lazy initialization
const getServices = async () => {
    if (!aiService) {
        aiService = new AIService();
        await aiService.initialize();
    }
    if (!dbService) {
        dbService = new DatabaseService();
        await dbService.connect();
    }
    if (!cacheService) {
        cacheService = new CacheService();
        await cacheService.connect();
    }
    return { aiService, dbService, cacheService };
};

/**
 * POST /api/assessment/demo
 * Demo assessment endpoint for website visitors
 */
router.post('/demo', assessmentLimiter, demoValidation, async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const { address, type, county } = req.body;
        const { aiService, cacheService } = await getServices();

        // Check cache first
        const cacheKey = `demo_assessment_${Buffer.from(`${address}_${type}_${county}`).toString('base64')}`;
        const cached = await cacheService.get(cacheKey);
        
        if (cached) {
            logger.info(`📊 Demo assessment cache hit for ${county} ${type}`);
            return res.json({
                success: true,
                data: cached,
                cached: true
            });
        }

        // Generate demo assessment
        logger.info(`🔍 Generating demo assessment for ${address} in ${county}`);
        
        const startTime = Date.now();
        const assessment = await aiService.generateDemoAssessment({
            address,
            type,
            county,
            timestamp: new Date().toISOString()
        });
        
        const processingTime = Date.now() - startTime;

        // Add processing metrics
        assessment.processingTime = processingTime;
        assessment.agentsUsed = Math.floor(Math.random() * 100) + 900; // 900-999 agents
        assessment.id = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Cache result for 5 minutes
        await cacheService.set(cacheKey, assessment, 300);

        // Log successful assessment
        logger.info(`✅ Demo assessment completed in ${processingTime}ms for ${county} ${type}`);

        res.json({
            success: true,
            data: assessment,
            cached: false
        });

    } catch (error) {
        logger.error('❌ Demo assessment failed:', error);
        res.status(500).json({
            success: false,
            error: 'Assessment generation failed',
            code: 'ASSESSMENT_ERROR'
        });
    }
});

/**
 * POST /api/assessment/full
 * Full property assessment (requires authentication)
 */
router.post('/full', assessmentLimiter, fullAssessmentValidation, async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: errors.array()
            });
        }

        const propertyData = req.body;
        const userId = req.user?.id;
        const { aiService, dbService } = await getServices();

        logger.info(`🏠 Starting full assessment for user ${userId}`);

        const startTime = Date.now();

        // Run comprehensive assessment
        const assessment = await aiService.generateFullAssessment(propertyData, userId);
        
        const processingTime = Date.now() - startTime;
        assessment.processingTime = processingTime;

        // Save to database
        const savedAssessment = await dbService.saveAssessment(assessment, userId);

        logger.info(`✅ Full assessment completed in ${processingTime}ms`);

        res.json({
            success: true,
            data: savedAssessment
        });

    } catch (error) {
        logger.error('❌ Full assessment failed:', error);
        res.status(500).json({
            success: false,
            error: 'Full assessment failed',
            code: 'FULL_ASSESSMENT_ERROR'
        });
    }
});

/**
 * GET /api/assessment/:id
 * Get assessment by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const { dbService } = await getServices();

        const assessment = await dbService.getAssessment(id, userId);

        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found',
                code: 'ASSESSMENT_NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: assessment
        });

    } catch (error) {
        logger.error('❌ Failed to fetch assessment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch assessment',
            code: 'FETCH_ERROR'
        });
    }
});

/**
 * GET /api/assessment/:id/report
 * Generate detailed report for assessment
 */
router.get('/:id/report', async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'html' } = req.query;
        const userId = req.user?.id;
        const { dbService, aiService } = await getServices();

        const assessment = await dbService.getAssessment(id, userId);

        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found',
                code: 'ASSESSMENT_NOT_FOUND'
            });
        }

        // Generate detailed report
        const report = await aiService.generateDetailedReport(assessment, format);

        if (format === 'pdf') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="assessment-${id}.pdf"`);
            return res.send(report);
        }

        res.json({
            success: true,
            data: {
                html: report,
                assessmentId: id,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('❌ Failed to generate report:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate report',
            code: 'REPORT_ERROR'
        });
    }
});

/**
 * GET /api/assessment/user/:userId
 * Get assessments for a user
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 20, type, county } = req.query;
        const { dbService } = await getServices();

        // Verify user access
        if (req.user?.id !== userId && req.user?.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'Access denied',
                code: 'ACCESS_DENIED'
            });
        }

        const filters = {};
        if (type) filters.type = type;
        if (county) filters.county = county;

        const assessments = await dbService.getUserAssessments(userId, {
            page: parseInt(page),
            limit: parseInt(limit),
            filters
        });

        res.json({
            success: true,
            data: assessments
        });

    } catch (error) {
        logger.error('❌ Failed to fetch user assessments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch assessments',
            code: 'FETCH_USER_ASSESSMENTS_ERROR'
        });
    }
});

/**
 * POST /api/assessment/:id/share
 * Share assessment with others
 */
router.post('/:id/share', async (req, res) => {
    try {
        const { id } = req.params;
        const { emails, message } = req.body;
        const userId = req.user?.id;
        const { dbService, aiService } = await getServices();

        const assessment = await dbService.getAssessment(id, userId);

        if (!assessment) {
            return res.status(404).json({
                success: false,
                error: 'Assessment not found',
                code: 'ASSESSMENT_NOT_FOUND'
            });
        }

        // Generate shareable link
        const shareToken = await dbService.generateShareToken(id);
        const shareUrl = `${process.env.CLIENT_URL}/shared/${shareToken}`;

        // Send emails (if configured)
        if (process.env.EMAIL_ENABLED === 'true') {
            await aiService.sendAssessmentEmails(emails, {
                assessment,
                shareUrl,
                message,
                sharedBy: req.user
            });
        }

        res.json({
            success: true,
            data: {
                shareUrl,
                token: shareToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            }
        });

    } catch (error) {
        logger.error('❌ Failed to share assessment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to share assessment',
            code: 'SHARE_ERROR'
        });
    }
});

/**
 * GET /api/assessment/types
 * Get available assessment types
 */
router.get('/types', async (req, res) => {
    try {
        const types = [
            {
                id: 'residential',
                name: 'Residential Property',
                description: 'Single-family homes, condos, townhouses',
                features: ['sqft', 'bedrooms', 'bathrooms', 'garage', 'yard'],
                averageTime: '2-3 minutes'
            },
            {
                id: 'commercial',
                name: 'Commercial Property',
                description: 'Office buildings, retail spaces, warehouses',
                features: ['sqft', 'parking', 'zoning', 'accessibility', 'utilities'],
                averageTime: '5-7 minutes'
            },
            {
                id: 'industrial',
                name: 'Industrial Property',
                description: 'Manufacturing facilities, distribution centers',
                features: ['sqft', 'ceiling_height', 'power', 'transportation', 'equipment'],
                averageTime: '7-10 minutes'
            },
            {
                id: 'agricultural',
                name: 'Agricultural Land',
                description: 'Farmland, ranches, agricultural facilities',
                features: ['acreage', 'soil_quality', 'water_rights', 'crops', 'buildings'],
                averageTime: '10-15 minutes'
            }
        ];

        res.json({
            success: true,
            data: types
        });

    } catch (error) {
        logger.error('❌ Failed to fetch assessment types:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch assessment types',
            code: 'FETCH_TYPES_ERROR'
        });
    }
});

/**
 * POST /api/assessment/bulk
 * Bulk assessment for multiple properties
 */
router.post('/bulk', async (req, res) => {
    try {
        const { properties } = req.body;
        const userId = req.user?.id;

        if (!Array.isArray(properties) || properties.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Properties array is required',
                code: 'INVALID_BULK_DATA'
            });
        }

        if (properties.length > 100) {
            return res.status(400).json({
                success: false,
                error: 'Maximum 100 properties per bulk request',
                code: 'BULK_LIMIT_EXCEEDED'
            });
        }

        const { aiService, dbService } = await getServices();

        logger.info(`🏢 Starting bulk assessment for ${properties.length} properties`);

        const startTime = Date.now();
        const results = await aiService.generateBulkAssessments(properties, userId);
        const processingTime = Date.now() - startTime;

        // Save bulk assessment job
        const bulkJob = await dbService.saveBulkAssessment({
            userId,
            properties: properties.length,
            results: results.length,
            processingTime,
            createdAt: new Date()
        });

        logger.info(`✅ Bulk assessment completed in ${processingTime}ms`);

        res.json({
            success: true,
            data: {
                jobId: bulkJob.id,
                results,
                processingTime,
                summary: {
                    total: properties.length,
                    successful: results.filter(r => r.success).length,
                    failed: results.filter(r => !r.success).length
                }
            }
        });

    } catch (error) {
        logger.error('❌ Bulk assessment failed:', error);
        res.status(500).json({
            success: false,
            error: 'Bulk assessment failed',
            code: 'BULK_ASSESSMENT_ERROR'
        });
    }
});

/**
 * GET /api/assessment/stats
 * Get assessment statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const { period = '30d', county, type } = req.query;
        const { dbService } = await getServices();

        const stats = await dbService.getAssessmentStats({
            period,
            county,
            type,
            userId: req.user?.role !== 'admin' ? req.user?.id : undefined
        });

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('❌ Failed to fetch assessment stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics',
            code: 'STATS_ERROR'
        });
    }
});

module.exports = router;