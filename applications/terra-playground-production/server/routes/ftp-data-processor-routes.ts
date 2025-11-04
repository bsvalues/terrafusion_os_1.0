/**
 * FTP Data Processor Routes
 *
 * These routes provide an API for processing data files that have been
 * downloaded from the FTP server.
 */

import express from 'express';
import { FtpDataProcessor } from '../services/ftp-data-processor';
import { storage } from '../storage';
import { logger } from '../utils/logger';
import path from 'path';

const router = express.Router();
let dataProcessor: FtpDataProcessor | null = null;

// Initialize the data processor
async function getProcessor(): Promise<FtpDataProcessor> {
  if (!dataProcessor) {
    dataProcessor = new FtpDataProcessor(storage);
  }
  return dataProcessor;
}

/**
 * Get summary of downloaded files
 * GET /api/ftp/data/summary
 */
router.get('/summary', async (req, res) => {
  try {
    const processor = await getProcessor();
    const dirPath = (req.query.path as string) || '';

    const summary = await processor.getFilesSummary(dirPath);
    res.json(summary);
  } catch (error: any) {
    logger.error('Error getting file summary:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Process a specific file
 * POST /api/ftp/data/process
 *
 * Request body:
 * {
 *   filePath: "path/to/file.csv",
 *   options: {
 *     sourceFormat: "csv",
 *     targetFormat: "json",
 *     delimiter: ",",
 *     headerRow: true,
 *     mappings: {
 *       "SourceField": "TargetField"
 *     }
 *   }
 * }
 */
router.post('/process', async (req, res) => {
  try {
    const { filePath, options } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const processor = await getProcessor();
    const result = await processor.processFile(filePath, options || {});

    res.json(result);
  } catch (error: any) {
    logger.error('Error processing file:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Process all files in a directory
 * POST /api/ftp/data/process-directory
 *
 * Request body:
 * {
 *   dirPath: "path/to/directory",
 *   options: {
 *     sourceFormat: "csv",
 *     targetFormat: "json",
 *     delimiter: ",",
 *     headerRow: true
 *   }
 * }
 */
router.post('/process-directory', async (req, res) => {
  try {
    const { dirPath, options } = req.body;

    if (!dirPath) {
      return res.status(400).json({ error: 'Directory path is required' });
    }

    const processor = await getProcessor();
    const results = await processor.processDirectory(dirPath, options || {});

    res.json({
      directory: dirPath,
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.errors.length === 0).length,
        failed: results.filter(r => r.errors.length > 0).length,
        recordsProcessed: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
        errors: results.flatMap(r => r.errors),
      },
    });
  } catch (error: any) {
    logger.error('Error processing directory:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a list of fixed width format configurations
 * GET /api/ftp/data/fixed-width-configs
 */
router.get('/fixed-width-configs', async (req, res) => {
  try {
    // This would normally come from a database or config file
    // Here we're just providing a few examples
    const configs = {
      property_record: [
        { field: 'parcelId', start: 0, length: 15, type: 'string' },
        { field: 'propertyAddress', start: 15, length: 50, type: 'string' },
        { field: 'propertyCity', start: 65, length: 30, type: 'string' },
        { field: 'propertyState', start: 95, length: 2, type: 'string' },
        { field: 'propertyZip', start: 97, length: 10, type: 'string' },
        { field: 'assessedValue', start: 107, length: 12, type: 'number' },
        { field: 'landValue', start: 119, length: 12, type: 'number' },
        { field: 'improvementValue', start: 131, length: 12, type: 'number' },
        { field: 'lastSaleDate', start: 143, length: 10, type: 'date' },
        { field: 'lastSalePrice', start: 153, length: 12, type: 'number' },
      ],
      tax_record: [
        { field: 'parcelId', start: 0, length: 15, type: 'string' },
        { field: 'taxYear', start: 15, length: 4, type: 'number' },
        { field: 'taxAmount', start: 19, length: 12, type: 'number' },
        { field: 'taxStatus', start: 31, length: 10, type: 'string' },
        { field: 'dueDate', start: 41, length: 10, type: 'date' },
        { field: 'paidDate', start: 51, length: 10, type: 'date' },
        { field: 'paidAmount', start: 61, length: 12, type: 'number' },
        { field: 'remainingAmount', start: 73, length: 12, type: 'number' },
        { field: 'delinquent', start: 85, length: 1, type: 'boolean' },
      ],
      valuation_record: [
        { field: 'parcelId', start: 0, length: 15, type: 'string' },
        { field: 'valuationDate', start: 15, length: 10, type: 'date' },
        { field: 'marketValue', start: 25, length: 12, type: 'number' },
        { field: 'assessedValue', start: 37, length: 12, type: 'number' },
        { field: 'taxableValue', start: 49, length: 12, type: 'number' },
        { field: 'landValue', start: 61, length: 12, type: 'number' },
        { field: 'improvementValue', start: 73, length: 12, type: 'number' },
        { field: 'appealFiled', start: 85, length: 1, type: 'boolean' },
        { field: 'valuationMethod', start: 86, length: 20, type: 'string' },
      ],
    };

    res.json(configs);
  } catch (error: any) {
    logger.error('Error retrieving fixed width configs:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get available mappings for different data sources
 * GET /api/ftp/data/field-mappings
 */
router.get('/field-mappings', async (req, res) => {
  try {
    // This would normally come from a database or config file
    // Here we're just providing a few examples
    const mappings = {
      SpatialEst: {
        AIN: 'parcelId',
        SITUS_STREET: 'propertyAddress',
        SITUS_CITY: 'propertyCity',
        SITUS_STATE: 'propertyState',
        SITUS_ZIP: 'propertyZip',
        TOTAL_VALUE: 'assessedValue',
        LAND_VALUE: 'landValue',
        IMPROVEMENT_VALUE: 'improvementValue',
        LAST_SALE_DATE: 'lastSaleDate',
        LAST_SALE_PRICE: 'lastSalePrice',
      },
      TaxWise: {
        PARCEL_NUMBER: 'parcelId',
        TAX_YEAR: 'taxYear',
        TAX_AMOUNT: 'taxAmount',
        STATUS: 'taxStatus',
        DUE_DATE: 'dueDate',
        PAYMENT_DATE: 'paidDate',
        PAYMENT_AMOUNT: 'paidAmount',
        BALANCE: 'remainingAmount',
        IS_DELINQUENT: 'delinquent',
      },
      ValuationPro: {
        PARCEL_ID: 'parcelId',
        VALUATION_DATE: 'valuationDate',
        MARKET_VALUE: 'marketValue',
        ASSESSED_VALUE: 'assessedValue',
        TAXABLE_VALUE: 'taxableValue',
        LAND_VALUE: 'landValue',
        IMPROVEMENT_VALUE: 'improvementValue',
        APPEAL_FILED: 'appealFiled',
        VALUATION_METHOD: 'valuationMethod',
      },
    };

    res.json(mappings);
  } catch (error: any) {
    logger.error('Error retrieving field mappings:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
