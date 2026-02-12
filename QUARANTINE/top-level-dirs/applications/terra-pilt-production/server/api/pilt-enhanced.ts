import express from 'express';
import { db } from '../core/database';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/pilt/districts - Get all districts with assessed values
router.get('/districts', async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;
        
        const query = `
            SELECT 
                d.id,
                d.name,
                d.code,
                d.county,
                d.state,
                av.total_value as assessed_value,
                av.year,
                lr.rate as levy_rate
            FROM districts d
            LEFT JOIN assessed_values av ON av.district_id = d.id AND av.year = ?
            LEFT JOIN levy_rates lr ON lr.district_id = d.id AND lr.year = ?
            ORDER BY d.name
        `;
        
        const result = await db.execute(query, [year, year]);
        
        res.json({
            success: true,
            data: result.rows || [],
            count: (result.rows || []).length,
            year: parseInt(year as string)
        });
        
    } catch (error) {
        logger.error('Error fetching districts:', error);
        res.status(500).json({
            error: 'Failed to fetch districts',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/pilt/history - Historical PILT data
router.get('/history', async (req, res) => {
    try {
        const { year, district } = req.query;
        
        let query = `
            SELECT 
                av.year,
                d.name as district_name,
                av.total_value as total_assessed_value,
                lr.rate as levy_rate_per_1000,
                (av.total_value * lr.rate / 1000) as gross_levy_amount,
                0 as deduction_81_874,
                (av.total_value * lr.rate / 1000) as net_pilt_due
            FROM districts d
            LEFT JOIN assessed_values av ON av.district_id = d.id
            LEFT JOIN levy_rates lr ON lr.district_id = d.id AND lr.year = av.year
            WHERE av.total_value > 0 AND lr.rate > 0
        `;
        
        const params: any[] = [];
        
        if (year) {
            query += ` AND av.year = ?`;
            params.push(year);
        }
        
        if (district) {
            query += ` AND d.name LIKE ?`;
            params.push(`%${district}%`);
        }
        
        query += ` ORDER BY av.year DESC, d.name`;
        
        const result = await db.execute(query, params);
        
        res.json({
            success: true,
            data: result.rows || [],
            count: (result.rows || []).length
        });
        
    } catch (error) {
        logger.error('Error fetching PILT history:', error);
        res.status(500).json({
            error: 'Failed to fetch PILT history',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// GET /api/pilt/distribution - PILT distribution data
router.get('/distribution', async (req, res) => {
    try {
        const { year = new Date().getFullYear() } = req.query;
        
        const query = `
            SELECT 
                d.id,
                d.name as district_name,
                d.code as district_code,
                (av.total_value * lr.rate / 1000) as calculated_amount,
                (lr.rate / (SELECT SUM(rate) FROM levy_rates WHERE year = av.year) * 100) as percentage,
                lr.rate as levy_rate,
                av.total_value as assessed_value,
                'active' as status,
                '2024-01-01' as distribution_date
            FROM districts d
            LEFT JOIN assessed_values av ON av.district_id = d.id
            LEFT JOIN levy_rates lr ON lr.district_id = d.id AND lr.year = av.year
            WHERE av.total_value > 0 AND lr.rate > 0 AND av.year = ?
            ORDER BY calculated_amount DESC
        `;
        
        const result = await db.execute(query, [year]);
        
        const distributions = result.rows || [];
        const totalAmount = distributions.reduce((sum: number, row: any) => sum + (row.calculated_amount || 0), 0);
        
        res.json({
            success: true,
            data: {
                year: parseInt(year as string),
                distributions,
                summary: {
                    total_amount: totalAmount,
                    total_districts: distributions.length,
                    calculated_date: new Date().toISOString()
                }
            }
        });
        
    } catch (error) {
        logger.error('Error fetching PILT distribution:', error);
        res.status(500).json({
            error: 'Failed to fetch PILT distribution',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// POST /api/pilt/generate-report - Generate PILT report
router.post('/generate-report', async (req, res) => {
    try {
        const { 
            year = new Date().getFullYear(), 
            format = 'json',
            options = {}
        } = req.body;
        
        // Get PILT calculation data
        const calculationQuery = `
            SELECT 
                pc.year,
                pc.total_assessed_value,
                pc.gross_levy_amount,
                pc.net_pilt_due,
                pc.calculation_date,
                pc.approved_by,
                pc.approved_date
            FROM pilt_calculations pc
            WHERE pc.year = ?
            ORDER BY pc.calculation_date DESC
            LIMIT 1
        `;
        
        const calculationResult = await db.execute(calculationQuery, [year]);
        const calculation = calculationResult.rows?.[0];
        
        if (!calculation) {
            return res.status(404).json({
                error: 'No PILT calculation found for specified year',
                year
            });
        }
        
        // Get distribution data
        const distributionQuery = `
            SELECT 
                d.name as district_name,
                d.code as district_code,
                dist.calculated_amount,
                dist.percentage,
                dist.levy_rate,
                dist.assessed_value,
                dist.status
            FROM distributions dist
            JOIN districts d ON dist.district_id = d.id
            JOIN pilt_calculations pc ON dist.pilt_calculation_id = pc.id
            WHERE pc.year = ?
            ORDER BY dist.calculated_amount DESC
        `;
        
        const distributionResult = await db.execute(distributionQuery, [year]);
        const distributions = distributionResult.rows || [];
        
        const report = {
            metadata: {
                year: parseInt(year as string),
                generated_date: new Date().toISOString(),
                generated_by: 'TerraFusionPilt System',
                format,
                options
            },
            calculation: {
                total_assessed_value: calculation.total_assessed_value,
                gross_levy_amount: calculation.gross_levy_amount,
                net_pilt_due: calculation.net_pilt_due,
                calculation_date: calculation.calculation_date,
                approved_by: calculation.approved_by,
                approved_date: calculation.approved_date
            },
            distributions,
            summary: {
                total_districts: distributions.length,
                total_amount: distributions.reduce((sum: number, d: any) => sum + (d.calculated_amount || 0), 0),
                largest_distribution: distributions[0]?.calculated_amount || 0,
                smallest_distribution: distributions[distributions.length - 1]?.calculated_amount || 0
            }
        };
        
        if (format === 'html') {
            // Generate HTML report
            const htmlContent = generateHTMLReport(report);
            res.setHeader('Content-Type', 'text/html');
            res.send(htmlContent);
        } else {
            // Return JSON report
            res.json({
                success: true,
                data: report
            });
        }
        
    } catch (error) {
        logger.error('Error generating PILT report:', error);
        res.status(500).json({
            error: 'Failed to generate PILT report',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

function generateHTMLReport(report: any): string {
    const { metadata, calculation, distributions, summary } = report;
    
    return `
    <!DOCTYPE html>
    <html>
    <head><>

        <title>PILT Report ${metadata.year}</title>
        <style
</>>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { background-color: #e8f4fd; padding: 15px; margin: 20px 0; }
            .header { text-align: center; margin-bottom: 30px; }
        </style>
    </head>
    <body>
        <div class="header"><>

            <h1>PILT Distribution Report</h1>
            <h2
</>>Year: ${metadata.year}</h2>
            <p>Generated: ${new Date(metadata.generated_date).toLocaleDateString()}</p>
        </div>
        
        <div class="summary"><>

            <h3>Summary</h3>
            <p
</>><strong>Total Amount:</strong> $${summary.total_amount.toLocaleString()}</p>
            <p><strong>Total Districts:</strong> ${summary.total_districts}</p>
            <p><strong>Largest Distribution:</strong> $${summary.largest_distribution.toLocaleString()}</p>
            <p><strong>Smallest Distribution:</strong> $${summary.smallest_distribution.toLocaleString()}</p>
        </div>
        
        <table>
            <thead>
                <tr><>

                    <th>District</th>
                    <th
</>>Amount</th><>

                    <th>Percentage</th>
                    <th
</>>Status</th>
                </tr>
            </thead>
            <tbody>
                ${distributions.map((d: any) => `
                    <tr><>

                        <td>${d.district_name}</td>
                        <td
</>>$${(d.calculated_amount || 0).toLocaleString()}</td><>

                        <td>${(d.percentage || 0).toFixed(2)}%</td>
                        <td
</>>${d.status}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </body>
    </html>`;
}

// GET /api/pilt/analytics - Advanced analytics data
router.get('/analytics', async (req, res) => {
    try {
        const { year, district_id } = req.query;
        
        // Multi-year trend analysis
        const trendQuery = `
            SELECT 
                pc.year,
                SUM(pc.net_pilt_due) as total_pilt,
                COUNT(DISTINCT pc.district_id) as district_count,
                AVG(pc.net_pilt_due) as avg_per_district
            FROM pilt_calculations pc
            WHERE pc.year >= ?
            GROUP BY pc.year
            ORDER BY pc.year
        `;
        
        const startYear = year ? parseInt(year as string) - 4 : new Date().getFullYear() - 4;
        const trendResult = await db.execute(trendQuery, [startYear]);
        
        // District performance analysis
        const districtQuery = `
            SELECT 
                d.name as district_name,
                COUNT(pc.id) as calculation_count,
                AVG(pc.net_pilt_due) as avg_pilt,
                MAX(pc.net_pilt_due) as max_pilt,
                MIN(pc.net_pilt_due) as min_pilt
            FROM districts d
            LEFT JOIN pilt_calculations pc ON pc.district_id = d.id
            WHERE pc.year >= ?
            GROUP BY d.id, d.name
            ORDER BY avg_pilt DESC
        `;
        
        const districtResult = await db.execute(districtQuery, [startYear]);
        
        res.json({
            success: true,
            data: {
                trends: trendResult.rows || [],
                district_performance: districtResult.rows || [],
                analysis_period: {
                    start_year: startYear,
                    end_year: year || new Date().getFullYear()
                }
            }
        });
        
    } catch (error) {
        logger.error('Error fetching analytics:', error);
        res.status(500).json({
            error: 'Failed to fetch analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router; 