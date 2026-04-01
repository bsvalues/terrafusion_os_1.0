import { Router } from 'express';
import { z } from 'zod';
import { piltService } from '../services/piltService';
import { logger } from '../utils/logger';

const router = Router();

const CreatePiltReceiptSchema = z.object({
    year: z.number().min(2000).max(2030),
    county: z.string().min(1),
    state: z.string().min(1),
    totalAmount: z.number().positive(),
    federalFiscalYear: z.number().min(2000).max(2030),
    receivedDate: z.string().transform(str => new Date(str)),
    federalProperties: z.array(z.object({
        id: z.string(),
        name: z.string(),
        acres: z.number().positive(),
        agency: z.string(),
        landType: z.enum(['National Forest', 'BLM', 'Military', 'Other Federal']),
        assessedValue: z.number().nonnegative(),
        currentUseValue: z.number().nonnegative().optional(),
        year: z.number().min(2000).max(2030),
        coordinates: z.object({
            latitude: z.number(),
            longitude: z.number()
        }).optional()
    }))
});

router.get('/receipts', async (req, res) => {
    try {
        const { year } = req.query;

        if (!year) {
            return res.status(400).json({
                error: 'Year parameter is required',
                example: '/api/pilt/receipts?year=2024'
            });
        }

        const receipts = await piltService.getPiltReceiptsByYear(Number(year));

        res.json({
            success: true,
            data: receipts,
            count: receipts.length,
            year: Number(year)
        });
    } catch (error) {
        logger.error('Error fetching PILT receipts:', error);
        res.status(500).json({
            error: 'Failed to fetch PILT receipts',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/receipts', async (req, res) => {
    try {
        const validatedData = CreatePiltReceiptSchema.parse(req.body);

        const receiptData = {
            ...validatedData,
            status: 'received' as const,
            federalProperties: validatedData.federalProperties.map(prop => ({
                ...prop,
                county: 'Benton County',
                state: 'Washington'
            }))
        };

        const receipt = await piltService.createPiltReceipt(receiptData);

        logger.info(`PILT receipt created: ${receipt.id} for ${receipt.year}`);

        res.status(201).json({
            success: true,
            data: receipt,
            message: `PILT receipt created for ${receipt.year}`
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                error: 'Validation failed',
                details: error.errors
            });
        }

        logger.error('Error creating PILT receipt:', error);
        res.status(500).json({
            error: 'Failed to create PILT receipt',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/receipts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const receipt = await piltService.getPiltReceipt(id);

        if (!receipt) {
            return res.status(404).json({
                error: 'PILT receipt not found',
                id
            });
        }

        res.json({
            success: true,
            data: receipt
        });
    } catch (error) {
        logger.error('Error fetching PILT receipt:', error);
        res.status(500).json({
            error: 'Failed to fetch PILT receipt',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/districts', async (req, res) => {
    try {
        const { year } = req.query;

        if (!year) {
            return res.status(400).json({
                error: 'Year parameter is required',
                example: '/api/pilt/districts?year=2024'
            });
        }

        const districts = await piltService.getSchoolDistricts(Number(year));

        res.json({
            success: true,
            data: districts,
            count: districts.length,
            year: Number(year)
        });
    } catch (error) {
        logger.error('Error fetching school districts:', error);
        res.status(500).json({
            error: 'Failed to fetch school districts',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/calculate/:receiptId', async (req, res) => {
    try {
        const { receiptId } = req.params;

        const calculation = await piltService.calculatePiltDistribution(receiptId);

        logger.info(`PILT calculation completed for receipt: ${receiptId}`);

        res.json({
            success: true,
            data: calculation,
            message: 'PILT distribution calculated successfully'
        });
    } catch (error) {
        logger.error('Error calculating PILT distribution:', error);
        res.status(500).json({
            error: 'Failed to calculate PILT distribution',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.post('/approve/:calculationId', async (req, res) => {
    try {
        const { calculationId } = req.params;
        const { approvedBy } = req.body;

        if (!approvedBy) {
            return res.status(400).json({
                error: 'approvedBy field is required'
            });
        }

        await piltService.approveDistribution(calculationId, approvedBy);

        logger.info(`PILT distribution approved: ${calculationId} by ${approvedBy}`);

        res.json({
            success: true,
            message: `Distribution approved by ${approvedBy}`,
            calculationId,
            approvedBy,
            approvedDate: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Error approving PILT distribution:', error);
        res.status(500).json({
            error: 'Failed to approve PILT distribution',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/reports/:year', async (req, res) => {
    try {
        const { year } = req.params;
        const { format = 'html' } = req.query;

        const { reportData, htmlContent } = await piltService.generateFederalReport(Number(year));

        if (format === 'json') {
            res.json({
                success: true,
                data: reportData
            });
        } else {
            res.setHeader('Content-Type', 'text/html');
            res.send(htmlContent);
        }

        logger.info(`Federal report generated for year ${year}`);
    } catch (error) {
        logger.error('Error generating federal report:', error);
        res.status(500).json({
            error: 'Failed to generate federal report',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/benton-county/config', (req, res) => {
    res.json({
        success: true,
        data: {
            countyName: 'Benton County',
            state: 'Washington',
            assessorOffice: {
                name: 'Benton County Assessor\'s Office',
                address: '7122 W. Okanogan Place, Building A, Kennewick, WA 99336',
                phone: '(509) 736-3085',
                contact: 'Benton County Assessor'
            },
            federalProperties: {
                hanfordSite: {
                    acres: 586000,
                    primaryAgency: 'Department of Energy',
                    assessmentMethod: 'current_use'
                }
            },
            schoolDistricts: [
                'Richland School District',
                'Kennewick School District',
                'Pasco School District',
                'Finley School District',
                'Kiona-Benton City School District'
            ],
            reportingRequirements: {
                dueDate: 'March 31',
                recipientOffice: 'Washington State Department of Education',
                requiredForms: ['PILT Distribution Report', 'Assessor Certification Letter']
            }
        }
    });
});

router.get('/benton-county/sample-data', async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        const sampleReceipt = {
            year: currentYear,
            county: 'Benton County',
            state: 'Washington',
            totalAmount: 2847392.50,
            federalFiscalYear: currentYear,
            receivedDate: new Date(`${currentYear}-01-15`),
            federalProperties: [{
                id: 'hanford_site_001',
                name: 'Hanford Nuclear Reservation',
                acres: 586000,
                county: 'Benton County',
                state: 'Washington',
                agency: 'Department of Energy',
                landType: 'Other Federal' as const,
                assessedValue: 7376820,
                currentUseValue: 7376820,
                year: currentYear,
                coordinates: {
                    latitude: 46.6437,
                    longitude: -119.6047
                }
            }]
        };

        const sampleDistricts = [
            {
                id: 'richland_sd',
                name: 'Richland School District',
                code: '400',
                county: 'Benton County',
                totalAssessedValue: 3200000000,
                levyRate: 0.0025000,
                year: currentYear
            },
            {
                id: 'kennewick_sd',
                name: 'Kennewick School District',
                code: '017',
                county: 'Benton County',
                totalAssessedValue: 2800000000,
                levyRate: 0.0023500,
                year: currentYear
            },
            {
                id: 'pasco_sd',
                name: 'Pasco School District',
                code: '001',
                county: 'Benton County',
                totalAssessedValue: 1200000000,
                levyRate: 0.0027000,
                year: currentYear
            },
            {
                id: 'finley_sd',
                name: 'Finley School District',
                code: '053',
                county: 'Benton County',
                totalAssessedValue: 180000000,
                levyRate: 0.0032000,
                year: currentYear
            },
            {
                id: 'kiona_benton_sd',
                name: 'Kiona-Benton City School District',
                code: '052',
                county: 'Benton County',
                totalAssessedValue: 120000000,
                levyRate: 0.0035000,
                year: currentYear
            }
        ];

        res.json({
            success: true,
            data: {
                sampleReceipt,
                sampleDistricts,
                instructions: {
                    createReceipt: 'POST /api/pilt/receipts with sampleReceipt data',
                    calculateDistribution: 'POST /api/pilt/calculate/{receiptId} after creating receipt',
                    generateReport: 'GET /api/pilt/reports/{year} for federal compliance report'
                }
            },
            message: 'Sample data for Benton County PILT MVP testing'
        });
    } catch (error) {
        logger.error('Error generating sample data:', error);
        res.status(500).json({
            error: 'Failed to generate sample data',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

router.get('/status', (req, res) => {
    res.json({
        success: true,
        system: 'TerraFusionPilt V2.0.0',
        county: 'Benton County',
        state: 'Washington',
        status: 'MVP Ready',
        capabilities: [
            'PILT Receipt Management',
            'Automated Distribution Calculations',
            'Federal Compliance Reporting',
            'School District Integration',
            'Hanford Site Assessment',
            'Multi-Year Historical Data',
            'Audit Trail & Approval Workflows'
        ],
        endpoints: {
            receipts: 'GET/POST /api/pilt/receipts',
            districts: 'GET /api/pilt/districts',
            calculate: 'POST /api/pilt/calculate/{receiptId}',
            approve: 'POST /api/pilt/approve/{calculationId}',
            reports: 'GET /api/pilt/reports/{year}',
            config: 'GET /api/pilt/benton-county/config',
            sampleData: 'GET /api/pilt/benton-county/sample-data'
        },
        timestamp: new Date().toISOString()
    });
});

export default router; 