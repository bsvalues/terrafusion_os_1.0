/**
 * Data Import Routes
 * 
 * This module defines routes for importing, validating, staging, and committing property data.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { IStorage } from '../storage';
import { DataImportService } from '../services/data-import-service';
import { DataStagingService } from '../services/data-staging-service';

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (_req, file, cb) => {
    // Accept only CSV files
    if (path.extname(file.originalname).toLowerCase() !== '.csv') {
      return cb(new Error('Only CSV files are allowed'));
    }
    cb(null, true);
  }
});

export function createDataImportRoutes(storage: IStorage) {
  const router = Router();
  const importService = new DataImportService(storage);
  const stagingService = new DataStagingService(storage);
  
  /**
   * Upload and validate a CSV file
   * POST /api/data-import/upload-validate
   */
  router.post('/upload-validate', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const filePath = req.file.path;
      const result = await importService.validateCSV(filePath);
      
      res.json({
        filename: req.file.originalname,
        filePath,
        validation: result
      });
    } catch (error: unknown) {
      console.error('Error validating CSV:', error);
      res.status(500).json({ 
        message: 'Failed to validate CSV file', 
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  /**
   * Import properties directly from a CSV file
   * POST /api/data-import/import-properties
   */
  router.post('/import-properties', async (req: Request, res: Response) => {
    try {
      const { filePath } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ message: 'No file path provided' });
      }
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      const result = await importService.importPropertiesFromCSV(filePath);
      
      res.json(result);
    } catch (error: unknown) {
      console.error('Error importing properties:', error);
      res.status(500).json({
        message: 'Failed to import properties',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  /**
   * Stage properties from a CSV file
   * POST /api/data-import/stage-properties
   */
  router.post('/stage-properties', async (req: Request, res: Response) => {
    try {
      const { filePath } = req.body;
      
      if (!filePath) {
        return res.status(400).json({ message: 'No file path provided' });
      }
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      const result = await importService.stagePropertiesFromCSV(filePath);
      
      res.json(result);
    } catch (error: unknown) {
      console.error('Error staging properties:', error);
      res.status(500).json({
        message: 'Failed to stage properties',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  /**
   * Get all staged properties
   * GET /api/data-import/staged-properties
   */
  router.get('/staged-properties', async (req: Request, res: Response) => {
    try {
      const stagedProperties = await stagingService.getAllStagedProperties();
      res.json(stagedProperties);
    } catch (error: unknown) {
      console.error('Error fetching staged properties:', error);
      res.status(500).json({
        message: 'Failed to fetch staged properties',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  /**
   * Delete a staged property
   * DELETE /api/data-import/staged-properties/:stagingId
   */
  router.delete('/staged-properties/:stagingId', async (req: Request, res: Response) => {
    try {
      const { stagingId } = req.params;
      
      const success = await stagingService.deleteStagedProperty(stagingId);
      
      if (!success) {
        return res.status(404).json({ message: 'Staged property not found' });
      }
      
      res.json({ message: 'Staged property deleted successfully' });
    } catch (error: unknown) {
      console.error('Error deleting staged property:', error);
      res.status(500).json({
        message: 'Failed to delete staged property',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  /**
   * Commit staged properties
   * POST /api/data-import/commit-staged-properties
   */
  router.post('/commit-staged-properties', async (req: Request, res: Response) => {
    try {
      const { stagingIds } = req.body;
      
      if (!stagingIds || !Array.isArray(stagingIds) || stagingIds.length === 0) {
        return res.status(400).json({ message: 'No staging IDs provided' });
      }
      
      const result = await stagingService.commitStagedProperties(stagingIds);
      
      res.json(result);
    } catch (error: unknown) {
      console.error('Error committing staged properties:', error);
      res.status(500).json({
        message: 'Failed to commit staged properties',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  return router;
}