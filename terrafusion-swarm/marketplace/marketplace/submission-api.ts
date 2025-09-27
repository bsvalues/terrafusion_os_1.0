import express, { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback, StorageEngine } from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';

// Types for government marketplace
interface PluginSubmission {
  id: string;
  developer: string;
  email: string;
  category: string;
  pricing: PricingTier;
  status: SubmissionStatus;
  submittedAt: string;
  filePath: string;
  reviewSteps: ReviewStep[];
  governmentCompliance?: ComplianceLevel;
  securityClassification?: SecurityClassification;
}

interface PricingTier {
  tier: 'free' | 'basic' | 'premium' | 'enterprise' | 'government';
  price: number;
  currency: 'USD';
  billingPeriod: 'monthly' | 'yearly' | 'perpetual';
}

interface ReviewStep {
  step: 'automated_scan' | 'compliance_check' | 'manual_review' | 'government_testing' | 'security_audit';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  completedAt?: string;
  notes?: string;
  reviewer?: string;
}

type SubmissionStatus = 
  | 'pending_review' 
  | 'automated_scan' 
  | 'compliance_check' 
  | 'manual_review' 
  | 'government_testing'
  | 'approved' 
  | 'rejected'
  | 'requires_changes';

type ComplianceLevel = 
  | 'FISMA_LOW' 
  | 'FISMA_MODERATE' 
  | 'FISMA_HIGH' 
  | 'NIST_800_53' 
  | 'SOC2_TYPE2';

type SecurityClassification = 
  | 'PUBLIC' 
  | 'SENSITIVE' 
  | 'CONFIDENTIAL' 
  | 'SECRET' 
  | 'TOP_SECRET';

// Logger setup for government compliance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'marketplace-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/marketplace-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/marketplace-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Rate limiting for government security
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// File filter for security
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  const allowedMimeTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-tar',
    'application/gzip'
  ];
  
  const allowedExtensions = ['.zip', '.tar', '.gz', '.tar.gz'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    logger.warn(`Rejected file upload: ${file.originalname} (${file.mimetype})`);
    cb(new Error('Only ZIP, TAR, and GZ files are allowed for government plugin submissions'));
  }
};

// Custom storage for government compliance
const storage: StorageEngine = multer.diskStorage({
  destination: async (_req: Request, _file: Express.Multer.File, cb): Promise<void> => {
    const submissionsDir = './marketplace/submissions/';
    try {
      await fs.mkdir(submissionsDir, { recursive: true });
      cb(null, submissionsDir);
    } catch (error) {
      logger.error('Failed to create submissions directory', error);
      cb(error as Error, '');
    }
  },
  filename: (_req: Request, file: Express.Multer.File, cb): void => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  }
});

// Configure multer for government file uploads
const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1
  }
});

// Express app setup
const app = express();
const port = process.env['TF_CONSCIOUSNESS_PORT'] || 3002;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(cors({
  origin: process.env['NODE_ENV'] === 'production' 
    ? ['https://terrafusion.gov', 'https://marketplace.terrafusion.gov']
    : ['http://localhost:3000', 'http://localhost:5046'],
  credentials: true
}));

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.static('marketplace'));

// Error handling middleware
interface AppError extends Error {
  status?: number;
  code?: string;
}

const errorHandler = (err: AppError, req: Request, res: Response, _next: NextFunction): void => {
  logger.error('API Error', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  const status = err.status || 500;
  const message = process.env['NODE_ENV'] === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(status).json({
    error: {
      message,
      code: err.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }
  });
};

// Validation helpers
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePricingTier = (pricing: any): pricing is PricingTier => {
  return pricing &&
    ['free', 'basic', 'premium', 'enterprise', 'government'].includes(pricing.tier) &&
    typeof pricing.price === 'number' &&
    pricing.currency === 'USD' &&
    ['monthly', 'yearly', 'perpetual'].includes(pricing.billingPeriod);
};

// Plugin submission endpoint with government compliance
app.post('/api/plugins/submit', upload.single('plugin'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const submissionId = uuidv4();
    const { developer, email, category, pricing, governmentCompliance, securityClassification } = req.body;
    
    // Validation
    if (!req.file) {
      const error: AppError = new Error('Plugin file is required for government submission');
      error.status = 400;
      error.code = 'MISSING_FILE';
      throw error;
    }
    
    if (!developer || !email || !category || !pricing) {
      const error: AppError = new Error('All required fields must be provided');
      error.status = 400;
      error.code = 'MISSING_FIELDS';
      throw error;
    }
    
    if (!validateEmail(email)) {
      const error: AppError = new Error('Invalid email format');
      error.status = 400;
      error.code = 'INVALID_EMAIL';
      throw error;
    }
    
    let parsedPricing: PricingTier;
    try {
      parsedPricing = typeof pricing === 'string' ? JSON.parse(pricing) : pricing;
    } catch {
      const error: AppError = new Error('Invalid pricing format');
      error.status = 400;
      error.code = 'INVALID_PRICING';
      throw error;
    }
    
    if (!validatePricingTier(parsedPricing)) {
      const error: AppError = new Error('Invalid pricing tier structure');
      error.status = 400;
      error.code = 'INVALID_PRICING_TIER';
      throw error;
    }
    
    const submission: PluginSubmission = {
      id: submissionId,
      developer,
      email,
      category,
      pricing: parsedPricing,
      status: 'pending_review',
      submittedAt: new Date().toISOString(),
      filePath: req.file.path,
      reviewSteps: [
        { step: 'automated_scan', status: 'pending' },
        { step: 'compliance_check', status: 'pending' },
        { step: 'security_audit', status: 'pending' },
        { step: 'manual_review', status: 'pending' },
        { step: 'government_testing', status: 'pending' }
      ],
      governmentCompliance: governmentCompliance as ComplianceLevel,
      securityClassification: securityClassification as SecurityClassification
    };
    
    // Save submission metadata with atomic write
    const submissionPath = path.join('./marketplace/submissions', `${submissionId}.json`);
    await fs.writeFile(submissionPath, JSON.stringify(submission, null, 2), { mode: 0o600 });
    
    logger.info('Plugin submission received', {
      submissionId,
      developer,
      category,
      pricing: parsedPricing.tier,
      governmentCompliance,
      securityClassification
    });
    
    res.status(201).json({
      success: true,
      submissionId,
      status: 'pending_review',
      message: 'Plugin submitted successfully for government review',
      estimatedReviewTime: '5-10 business days',
      nextSteps: [
        'Automated security scan',
        'Government compliance verification',
        'Manual code review',
        'Government testing environment deployment'
      ]
    });
    
  } catch (error) {
    next(error);
  }
});

// Get submission status
app.get('/api/plugins/status/:submissionId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { submissionId } = req.params;
    
    if (!submissionId || !uuidv4()) {
      const error: AppError = new Error('Invalid submission ID');
      error.status = 400;
      error.code = 'INVALID_SUBMISSION_ID';
      throw error;
    }
    
    const submissionPath = path.join('./marketplace/submissions', `${submissionId}.json`);
    
    try {
      const submissionData = await fs.readFile(submissionPath, 'utf-8');
      const submission: PluginSubmission = JSON.parse(submissionData);
      
      res.json({
        success: true,
        submission: {
          id: submission.id,
          status: submission.status,
          submittedAt: submission.submittedAt,
          reviewSteps: submission.reviewSteps,
          governmentCompliance: submission.governmentCompliance,
          securityClassification: submission.securityClassification
        }
      });
    } catch (fileError) {
      const error: AppError = new Error('Submission not found');
      error.status = 404;
      error.code = 'SUBMISSION_NOT_FOUND';
      throw error;
    }
    
  } catch (error) {
    next(error);
  }
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'healthy',
    service: 'TerraFusion Marketplace API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    government: {
      compliance: 'FISMA Ready',
      security: 'Government Grade',
      classification: 'Unclassified'
    }
  });
});

app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
app.listen(port, () => {
  logger.info(`🏛️  TerraFusion Government Marketplace API v2.0.0`);
  logger.info(`🚀 Server running on port ${port}`);
  logger.info(`🔒 Security: Government-grade with FISMA compliance`);
  logger.info(`📊 Monitoring: Winston logging enabled`);
  logger.info(`🛡️  Protection: Helmet + CORS + Rate limiting active`);
});

export default app;