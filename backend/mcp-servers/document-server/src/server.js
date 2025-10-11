const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const axios = require('axios');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware - THE TERRAFUSION WAY: Comprehensive protection
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for UI
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    features: {
      geolocation: ["'self'"],
      camera: ["'none'"],
      microphone: ["'none'"],
      payment: ["'none'"]
    }
  }
}));
app.use(cors());
app.use(express.json());

// Environment variables
const DOCUMENT_PROCESSOR_URL = process.env.DOCUMENT_PROCESSOR_URL || 'http://localhost:8000';
const MCP_SERVER_NAME = process.env.MCP_SERVER_NAME || 'document-processor';

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: MCP_SERVER_NAME,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// MCP Server Info
app.get('/mcp/info', (req, res) => {
  res.json({
    name: MCP_SERVER_NAME,
    version: '1.0.0',
    description: 'MCP Server for Document Processing',
    capabilities: [
      'document-upload',
      'text-extraction',
      'ocr-processing',
      'metadata-extraction',
      'format-conversion'
    ],
    endpoints: {
      process: '/mcp/tools/process-document',
      status: '/mcp/tools/document-status',
      extract: '/mcp/tools/extract-text'
    }
  });
});

// MCP Tool: Process Document
app.post('/mcp/tools/process-document', async (req, res) => {
  try {
    const { document, options = {} } = req.body;
    
    if (!document) {
      return res.status(400).json({
        error: 'Document data required',
        code: 'MISSING_DOCUMENT'
      });
    }

    logger.info('Processing document via MCP tool');

    // Forward to document processor
    const response = await axios.post(`${DOCUMENT_PROCESSOR_URL}/process`, {
      document,
      ...options
    }, {
      timeout: 30000
    });

    res.json({
      success: true,
      jobId: response.data.jobId,
      status: response.data.status,
      estimatedCompletion: response.data.estimatedCompletion,
      mcp_metadata: {
        server: MCP_SERVER_NAME,
        tool: 'process-document',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Document processing failed:', error);
    res.status(500).json({
      error: 'Document processing failed',
      code: 'PROCESSING_ERROR',
      details: error.message
    });
  }
});

// MCP Tool: Get Document Status
app.get('/mcp/tools/document-status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    
    logger.info(`Checking document status for job ${jobId}`);

    const response = await axios.get(`${DOCUMENT_PROCESSOR_URL}/status/${jobId}`);

    res.json({
      success: true,
      jobId,
      status: response.data.status,
      progress: response.data.progress,
      result: response.data.result,
      mcp_metadata: {
        server: MCP_SERVER_NAME,
        tool: 'document-status',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Status check failed:', error);
    res.status(500).json({
      error: 'Status check failed',
      code: 'STATUS_ERROR',
      details: error.message
    });
  }
});

// MCP Tool: Extract Text
app.post('/mcp/tools/extract-text', async (req, res) => {
  try {
    const { image, language = 'eng', config = '--psm 6' } = req.body;
    
    if (!image) {
      return res.status(400).json({
        error: 'Image data required',
        code: 'MISSING_IMAGE'
      });
    }

    logger.info('Extracting text via OCR MCP tool');

    // Forward to OCR service
    const response = await axios.post(`${DOCUMENT_PROCESSOR_URL.replace(':8000', ':8081')}/extract`, {
      image,
      language,
      config
    }, {
      timeout: 30000
    });

    res.json({
      success: true,
      text: response.data.text,
      confidence: response.data.confidence,
      metadata: response.data.metadata,
      mcp_metadata: {
        server: MCP_SERVER_NAME,
        tool: 'extract-text',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Text extraction failed:', error);
    res.status(500).json({
      error: 'Text extraction failed',
      code: 'EXTRACTION_ERROR',
      details: error.message
    });
  }
});

// MCP Tools List
app.get('/mcp/tools', (req, res) => {
  res.json({
    tools: [
      {
        name: 'process-document',
        description: 'Process and analyze documents',
        inputSchema: {
          type: 'object',
          properties: {
            document: { type: 'string', description: 'Base64 encoded document' },
            options: { type: 'object', description: 'Processing options' }
          },
          required: ['document']
        }
      },
      {
        name: 'document-status',
        description: 'Check document processing status',
        inputSchema: {
          type: 'object',
          properties: {
            jobId: { type: 'string', description: 'Job ID to check' }
          },
          required: ['jobId']
        }
      },
      {
        name: 'extract-text',
        description: 'Extract text from images using OCR',
        inputSchema: {
          type: 'object',
          properties: {
            image: { type: 'string', description: 'Base64 encoded image' },
            language: { type: 'string', description: 'OCR language code' },
            config: { type: 'string', description: 'Tesseract configuration' }
          },
          required: ['image']
        }
      }
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`MCP Document Server listening on port ${PORT}`);
  logger.info(`Document Processor URL: ${DOCUMENT_PROCESSOR_URL}`);
});

module.exports = app;