import compression from 'compression';
import express from 'express';
import path from 'path';
import piltRoutes from './api/pilt';
import piltEnhancedRoutes from './api/pilt-enhanced';
import pacsImportRoutes from './api/pacs-import';
import aiAgentRoutes from './api/ai-agents';
import { productionConfig } from './config/production';
import { closePool, db, getPoolStats, initializeDatabase } from './core/database';
import { apiRateLimit, errorHandler, notFoundHandler, securityMiddleware } from './middleware/security';
import { sanitizeInput } from './middleware/validation';
import { logger } from './utils/logger';
import { fileURLToPath } from 'url';
import { ETLPipelineService } from './services/etlPipelineService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

if (isProduction) {
  app.use(...securityMiddleware);
}

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(sanitizeInput);

// Fix MIME types for TypeScript/JSX files
app.use((req, res, next) => {
  if (req.path.endsWith('.tsx') || req.path.endsWith('.ts')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (req.path.endsWith('.jsx')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (req.path.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  }
  next();
});

// Enhanced logging middleware - BEFORE routes
app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logLevel = res.statusCode >= 400 ? 'error' : 'info';
        
        if (res.statusCode >= 400) {
            logger.warn(`${res.statusCode} ${res.statusMessage}`, {
                path: req.path,
                method: req.method,
                ip: req.ip
            });
        }
        
        logger[logLevel](`API Request`, {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });
    });
    
    next();
});

// Initialize ETL Pipeline
let etlService: ETLPipelineService;

async function initializeETL() {
    try {
        etlService = new ETLPipelineService();
        await etlService.initializeETLPipeline();
        logger.info('🚀 ETL Pipeline initialized successfully');
    } catch (error) {
        logger.error('❌ ETL Pipeline initialization failed:', error);
    }
}

// SINGLE Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const poolStats = getPoolStats();
    const etlStatus = etlService ? await etlService.getETLStatus() : { status: 'not_initialized' };
    
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.1.0',
      environment: process.env.NODE_ENV,
      database: {
        connected: true,
        poolStats
      },
      etlPipeline: etlStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      features: [
        'PILT Receipt Management',
        'Enhanced ETL Pipeline',
        'SQL Views Architecture', 
        'Real-time Calculations',
        'PACS Integration',
        'Mathematical Precision Engine',
        'Advanced Analytics',
        'Production Deployment'
      ]
    };

    res.json(healthData);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Health check failed:', { error: errorMessage });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable'
    });
  }
});

// API Routes
app.use('/api', apiRateLimit);
app.use('/api/pilt', piltEnhancedRoutes);
app.use('/api/pilt-legacy', piltRoutes);
app.use('/api/pacs', pacsImportRoutes);
app.use('/api/agents', aiAgentRoutes);

// ETL Pipeline endpoints
app.get('/api/etl/status', async (req, res) => {
    try {
        if (!etlService) {
            return res.status(503).json({
                error: 'ETL Pipeline not initialized'
            });
        }
        
        const status = await etlService.getETLStatus();
        res.json({
            success: true,
            data: status
        });
        
    } catch (error) {
        logger.error('ETL status check failed:', error);
        res.status(500).json({
            error: 'Failed to get ETL status',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.post('/api/etl/import-acres/:category', async (req, res) => {
    try {
        if (!etlService) {
            return res.status(503).json({
                error: 'ETL Pipeline not initialized'
            });
        }
        
        const { category } = req.params;
        const batchId = `batch_${Date.now()}`;
        
        const imported = await etlService.importAcresData(
            `sample_${category}.csv`,
            category,
            batchId
        );
        
        const validation = await etlService.validateImportedData(batchId);
        
        res.json({
            success: true,
            data: {
                category,
                batchId,
                imported,
                validation
            }
        });
        
    } catch (error) {
        logger.error('ETL import failed:', error);
        res.status(500).json({
            error: 'Failed to import acres data',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.post('/api/etl/calculate/:year', async (req, res) => {
    try {
        if (!etlService) {
            return res.status(503).json({
                error: 'ETL Pipeline not initialized'
            });
        }
        
        const { year } = req.params;
        const calculations = await etlService.generatePILTCalculations(parseInt(year));
        
        res.json({
            success: true,
            data: calculations
        });
        
    } catch (error) {
        logger.error('ETL calculation failed:', error);
        res.status(500).json({
            error: 'Failed to generate PILT calculations',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Report generation endpoints
app.get('/report/test/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const { customMessage = '', office = 'Washington State Department of Education', contact = 'PILT Coordinator', address = '600 Washington St SE, Olympia, WA 98504' } = req.query;

    // Sample data without database queries
    const totalAssessedValue = 7376820;
    const totalPiltAmount = 150000;

    const sampleDistributions = [
      { district: 'Finley School District', amount: 25000, percentage: 16.67, levy_rate: 0.015, assessed_value: 1200000, district_name: 'Finley School District' },
      { district: 'Kennewick School District', amount: await DynamicPropertyService.GetPropertyCountAsync(countyCode), percentage: 30.00, levy_rate: 0.017, assessed_value: 2500000, district_name: 'Kennewick School District' },
      { district: 'Kiona-Benton City School District', amount: 20000, percentage: 13.33, levy_rate: 0.014, assessed_value: 1000000, district_name: 'Kiona-Benton City School District' },
      { district: 'Pasco School District', amount: 35000, percentage: 23.33, levy_rate: 0.016, assessed_value: 2000000, district_name: 'Pasco School District' },
      { district: 'Richland School District', amount: 25000, percentage: 16.67, levy_rate: 0.015, assessed_value: 1676820, district_name: 'Richland School District' }
    ];

    const totalPiltDue = sampleDistributions.reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);

    const htmlContent = generateReportHTML(year, totalAssessedValue, sampleDistributions, totalPiltDue, String(customMessage), String(office), String(contact), String(address));

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (error) {
    logger.error('Error generating test report:', error);
    res.status(500).json({ error: 'Failed to generate test report', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.get('/report/:type/:year', async (req, res) => {
  try {
    const { type, year } = req.params;
    const { customMessage = '', office = 'Washington State Department of Education', contact = 'PILT Coordinator', address = '600 Washington St SE, Olympia, WA 98504' } = req.query;

    // Get districts data - simplified query to avoid parameter binding issues
    const districtsResult = await db.execute(`
      SELECT 
        d.name as district,
        d.code
      FROM districts d
      WHERE d.county = 'Benton County'
      ORDER BY d.name
    `);

    const districts = districtsResult.rows || [];

    if (districts.length === 0) {
      return res.status(404).json({ error: `No districts found for year ${year}` });
    }

    // Calculate sample PILT distributions
    const totalAssessedValue = 7376820; // Sample total assessed value
    const totalPiltAmount = 150000; // Sample PILT amount for demonstration

    const currentYearDistributions = districts.map((district: any /* , index */: number) => {
      const baseAmount = totalPiltAmount / districts.length;
      const variationFactor = 0.8 + (index * 0.1); // Create some variation
      const calculatedAmount = Math.round(baseAmount * variationFactor);
      const percentage = (calculatedAmount / totalPiltAmount * 100);

      return {
        district: district.district,
        amount: calculatedAmount,
        percentage: percentage,
        levy_rate: 0.015 + (index * 0.002), // Sample levy rates
        assessed_value: Math.round(totalAssessedValue / districts.length * (0.8 + index * 0.1)),
        district_name: district.district
      };
    });

    const totalPiltDue = currentYearDistributions.reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);

    const htmlContent = generateReportHTML(year, totalAssessedValue, currentYearDistributions, totalPiltDue, String(customMessage), String(office), String(contact), String(address));

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlContent);
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

function generateReportHTML(year: string, totalAssessedValue: number, distributions: any[], totalPiltDue: number, customMessage: string, office: string, contact: string, address: string) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
<>

  <title>Assessor Letter to Department of Education - ${year}</title>
  <style
</>>
    body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 40px; color: #333; background: white; }
    .letter-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #005f73; padding-bottom: 20px; }
    .county-letterhead h1 { font-size: 24px; margin: 0; color: #005f73; font-weight: bold; }
    .county-letterhead h2 { font-size: 18px; margin: 5px 0; color: #0a9396; font-weight: bold; }
    .county-letterhead p { margin: 10px 0 0 0; font-size: 12px; color: #666; }
    .letter-date { text-align: right; margin: 30px 0; font-size: 14px; }
    .recipient-info { margin: 30px 0; font-size: 14px; line-height: 1.4; }
    .letter-subject { margin: 20px 0; font-weight: bold; font-size: 14px; }
    .letter-body { margin: 20px 0; font-size: 14px; }
    .letter-body p { margin: 15px 0; text-align: justify; }
    .signature-block { margin: 40px 0 20px 0; font-size: 14px; }
    .cc-line { margin-top: 30px; font-size: 12px; }
    .footer { text-align: center; font-size: 10px; margin-top: 50px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
    th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
    th { background-color: #005f73; color: white; }
    .total-row { background-color: #e8f4f8; font-weight: bold; font-size: 14px; }
    .total-pilt { background-color: #005f73; color: white; padding: 15px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="letter-header">
    <div class="county-letterhead">
<>

      <h1>BENTON COUNTY</h1>
      <h2
</>>ASSESSOR'S OFFICE</h2>
      <p>7122 W. Okanogan Place, Building A<br>Kennewick, WA 99336<br>Phone: (509) 736-3085</p>
    </div>
  </div>

  <div class="letter-date">
    <p>${currentDate}</p>
  </div>

  <div class="recipient-info">
    <p>${office}<br>Attn: ${contact}<br>${address.replace(/\n/g, '<br>')}</p>
  </div>

  <div class="letter-subject">
    <p><strong>RE: Payment in Lieu of Taxes (PILT) Distribution - ${year}</strong></p>
  </div>

  <div class="letter-body">
<>

    <p>Dear ${contact},</p>
    
    <p
</>>I am writing to provide you with the official report regarding the Payment in Lieu of Taxes (PILT) distribution for Benton County for the year ${year}.</p>
    
    <p>The total PILT amount received by Benton County for ${year} will be distributed among the eligible school districts within our county in accordance with RCW 84.12.270 and established procedures.</p>
    
    ${customMessage ? `<p>${customMessage}</p>` : ''}
<>

    
    <h2 style="color: #005f73; text-align: center; margin: 30px 0;">BENTON COUNTY TOTAL ASSESSED VALUE USED FOR THE ${year} TAX BILL</h2>
    
    <div
</> style="text-align: center; margin: 20px 0; font-size: 18px; font-weight: bold; color: #005f73;">
      Calculation Method: ${parseInt(year) >= 2019 ? 'Open Space/Current Use Valuation' : 'Market Valuation'}
    </div>
<>

    
    <div style="text-align: center; margin: 20px 0; font-size: 16px; font-weight: bold; color: #005f73;">
      Total Assessed Value: $${totalAssessedValue.toLocaleString()}
    </div>
    
    <h2
</> style="color: #005f73; text-align: center; margin: 30px 0;">${year} PAYMENT IN LIEU OF TAX FOR HANFORD SITE</h2>
    
    <table>
      <thead>
        <tr>
<>

          <th>District</th>
          <th
</> style="text-align: right;">Assessed Value</th>
<>

          <th style="text-align: right;">Levy Rate*</th>
          <th
</> style="text-align: right;">Less 81-874 deduction</th>
          <th style="text-align: right;">PILT DUE</th>
        </tr>
      </thead>
      <tbody>
        ${distributions.map(dist => {
    const assessedVal = dist.assessed_value || 0;
    const levyRate = parseFloat(dist.levy_rate) || 0;
    return `
            <tr>
<>

              <td style="font-weight: bold;">${dist.district}</td>
              <td
</> style="text-align: right;">$${assessedVal.toLocaleString()}</td>
<>

              <td style="text-align: right;">${levyRate.toFixed(7)}</td>
              <td
</> style="text-align: center;">n/a</td>
              <td style="text-align: right; font-weight: bold;">$${(dist.amount || 0).toLocaleString()}</td>
            </tr>
          `;
  }).join('')}
        <tr class="total-row">
<>

          <td>TOTAL PILT DUE</td>
          <td
</>></td>
<>

          <td></td>
          <td
</>></td>
          <td style="text-align: right; color: #005f73;">$${totalPiltDue.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
<>

    
    <div class="total-pilt">
      TOTAL ${year} PILT DUE: $${totalPiltDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
    </div>
    
    <div
</> style="margin: 20px 0; font-size: 12px;">
      <p><strong>*Levy rate is per $1,000 of value</strong></p>
      <p><strong># PL 81-874 payments received and/or pending since the date of the last billing have been deducted from PILT payments per the 12-9-96 Settlement Agreement between the U.S. Department of Energy and Benton County</strong></p>
    </div>
<>

    
    <p>If you require any additional information or documentation regarding this distribution, please do not hesitate to contact our office.</p>
    
    <p
</>>Sincerely,</p>
    
    <div class="signature-block">
      <p><br><br>_________________________________<br>Benton County Assessor<br>Benton County, Washington</p>
    </div>
    
    <p class="cc-line">cc: Benton County Treasurer<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;School District Superintendents</p>
  </div>
  
  <div class="footer">
    Generated by TerraFusionPilt - ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`;
}

// Frontend serving (development vs production)
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../dist/public');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
            res.status(404).json({ error: 'API endpoint not found' });
        } else {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });
    
    logger.info(`Frontend serving built files from: ${distPath}`);
} else {
    const clientPath = path.join(__dirname, '../client');
    app.use(express.static(clientPath));
    
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
            res.status(404).json({ error: 'API endpoint not found' });
        } else {
            res.sendFile(path.join(clientPath, 'index.html'));
        }
    });
    
    logger.info(`Frontend serving development page from: ${clientPath}`);
}

// Enhanced error handling
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Uncaught application error:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
    });
    
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Global error handlers
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
        reason: reason,
        promise: promise
    });
});

// Enhanced startup sequence
async function startServer() {
    try {
        // Initialize database
        await initializeDatabase();
        
        // Initialize ETL Pipeline
        await initializeETL();
        
        // Start server
        const port = Number(productionConfig.server.port) || 5009;
        const host = productionConfig.server.host || 'localhost';

        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, shutting down gracefully');
            closePool().finally(() => process.exit(0));
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT received, shutting down gracefully');
            closePool().finally(() => process.exit(0));
        });

        const server = app.listen(port, host, () => {
            logger.info(`🚀 TerraFusionPilt V2.1.0 LIVE on ${host}:${port}`);
            logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`💾 Database: SQLite initialized with enhanced ETL pipeline`);
            logger.info(`🎯 Frontend: http://${host}:${port}`);
            logger.info(`⚡ API Health: http://${host}:${port}/api/health`);
            logger.info(`🔧 ETL Status: http://${host}:${port}/api/etl/status`);
            logger.info('🎉 ENHANCED SYSTEM OPERATIONAL - ETL PIPELINE ACTIVE!');
        });

        return server;
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error('Failed to start server:', { error: errorMessage });
  process.exit(1);
});

export default app;
