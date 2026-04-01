/**
 * DynLoader API Routes
 * 
 * This file contains all routes for interacting with the DynLoader service.
 */

import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { dynLoaderService } from '../services/dynLoaderService';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Create upload directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use original filename with timestamp to prevent duplicates
    const uniquePrefix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniquePrefix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept all file types for now (can be restricted if needed)
    cb(null, true);
  }
});

// Define validation schemas
const processPermitSchema = z.object({
  permitId: z.string().optional(),
  permitType: z.string(),
  location: z.string().optional(),
  ownerInfo: z.object({
    name: z.string().optional(),
    contact: z.string().optional()
  }).optional(),
  parcelNumber: z.string().optional(),
  value: z.number().optional(),
  details: z.record(z.string(), z.any()).optional()
});

// Create router
const router = Router();

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const isHealthy = await dynLoaderService.checkHealth();
    const status = dynLoaderService.getStatus();
    
    res.json({
      success: isHealthy,
      data: status,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error checking DynLoader health:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
});

// Get current status endpoint
router.get('/status', (req, res) => {
  try {
    const status = dynLoaderService.getStatus();
    
    res.json({
      success: true,
      data: status,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error getting DynLoader status:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
});

// Process permit data endpoint
router.post('/process', async (req, res) => {
  try {
    // Validate request body
    const result = processPermitSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error.message,
        timestamp: Date.now()
      });
    }
    
    // Process permit data
    const processedData = await dynLoaderService.processPermitData(result.data);
    
    res.json({
      success: true,
      data: processedData,
      timestamp: Date.now()
    });
  } catch (error) {
    logger.error('Error processing permit data:', error);
    
    // Handle circuit breaker open state
    if (error instanceof Error && error.message.includes('Circuit breaker is open')) {
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable due to circuit breaker',
        timestamp: Date.now()
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  }
});

// Extract data from uploaded file endpoint
router.post('/extract', upload.single('permitFile'), async (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        timestamp: Date.now()
      });
    }
    
    // Extract data from the file
    const extractedData = await dynLoaderService.extractPermitData(file.path);
    
    res.json({
      success: true,
      data: extractedData,
      timestamp: Date.now(),
      fileName: file.originalname
    });
  } catch (error) {
    logger.error('Error extracting permit data from file:', error);
    
    // Handle circuit breaker open state
    if (error instanceof Error && error.message.includes('Circuit breaker is open')) {
      return res.status(503).json({
        success: false,
        error: 'Service temporarily unavailable due to circuit breaker',
        timestamp: Date.now()
      });
    }
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now()
    });
  } finally {
    // Clean up temporary file if needed
    // This can be enabled if files should be removed after processing
    /*
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) {
          logger.error('Error deleting temporary file:', err);
        }
      });
    }
    */
  }
});

export default router;