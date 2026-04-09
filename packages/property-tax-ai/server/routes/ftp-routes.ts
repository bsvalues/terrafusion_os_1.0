/**
 * FTP Routes
 * 
 * This file contains the routes for FTP-based data import and export operations,
 * specifically for transferring data to and from the SpatialEst FTP server.
 */

import { Router } from 'express';
import { FtpService } from '../services/ftp-service';
import { storage } from '../storage';

// Create a router
const router = Router();
const ftpService = new FtpService(storage);

/**
 * Test FTP connection
 * GET /api/ftp/test-connection
 */
router.get('/test-connection', async (req, res) => {
  try {
    const connected = await ftpService.testConnection();
    res.json({ connected });
  } catch (error: any) {
    console.error('FTP connection test error:', error);
    res.status(500).json({ 
      error: 'Failed to test FTP connection',
      details: error.message
    });
  }
});

/**
 * List files in a directory on the FTP server
 * GET /api/ftp/list
 * Query parameters:
 * - dir: Directory path on FTP server (optional, defaults to root)
 */
router.get('/list', async (req, res) => {
  try {
    const dir = req.query.dir as string || '/';
    const files = await ftpService.listFiles(dir);
    res.json(files);
  } catch (error: any) {
    console.error('FTP list files error:', error);
    res.status(500).json({ 
      error: 'Failed to list files on FTP server',
      details: error.message
    });
  }
});

/**
 * Import properties from a CSV file on the FTP server
 * POST /api/ftp/import
 * Body:
 * - filePath: Path to the CSV file on the FTP server
 */
router.post('/import', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    const result = await ftpService.importPropertiesFromFtp(filePath);
    res.json(result);
  } catch (error: any) {
    console.error('FTP import error:', error);
    res.status(500).json({ 
      error: 'Failed to import properties from FTP file',
      details: error.message
    });
  }
});

/**
 * Stage properties from a CSV file on the FTP server for review
 * POST /api/ftp/stage
 * Body:
 * - filePath: Path to the CSV file on the FTP server
 */
router.post('/stage', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    const result = await ftpService.stagePropertiesFromFtp(filePath);
    res.json(result);
  } catch (error: any) {
    console.error('FTP staging error:', error);
    res.status(500).json({ 
      error: 'Failed to stage properties from FTP file',
      details: error.message
    });
  }
});

/**
 * Export properties to a CSV file and upload to the FTP server
 * POST /api/ftp/export
 * Body:
 * - filePath: Path where the file should be saved on the FTP server
 * - propertyIds: Optional array of property IDs to export (if not provided, exports all)
 */
router.post('/export', async (req, res) => {
  try {
    const { filePath, propertyIds } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }
    
    const result = await ftpService.exportPropertiesToFtp(filePath, propertyIds);
    res.json(result);
  } catch (error: any) {
    console.error('FTP export error:', error);
    res.status(500).json({ 
      error: 'Failed to export properties to FTP',
      details: error.message
    });
  }
});

export default router;