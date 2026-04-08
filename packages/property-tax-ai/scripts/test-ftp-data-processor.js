/**
 * FTP Data Processor Test Script
 * 
 * This script tests the functionality of the FTP data processor,
 * verifying that it can correctly parse fixed-width files from
 * the Benton County property assessment system.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { logger } from '../server/utils/logger.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Base URL for API endpoints
const API_BASE_URL = 'http://localhost:3000/api';

// Test data directory
const TEST_DATA_DIR = path.join(rootDir, 'downloads', 'test-data');

// Test file paths
const testFiles = {
  property: path.join(TEST_DATA_DIR, 'property_sample.txt'),
  valuation: path.join(TEST_DATA_DIR, 'valuation_sample.txt'),
  tax: path.join(TEST_DATA_DIR, 'tax_sample.txt')
};

// Create test data directory if it doesn't exist
if (!fs.existsSync(TEST_DATA_DIR)) {
  fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
}

// Create sample test files if they don't exist
function createSampleFiles() {
  // Sample property record
  const propertySample = 
    "BC001     1320 N Louise St         Benton     Residential   2.5     Active     250000\n" +
    "BC002     405 W Kennewick Ave      Benton     Commercial    1.2     Active     750000\n" +
    "BC003     8350 W Grandridge Blvd   Benton     Commercial    3.8     Active     1250000\n" +
    "BC004     2701 S Quillan St        Benton     Residential   0.22    Active     375000\n" +
    "BC005     1001 Wright Ave          Benton     Industrial    5.6     Active     2100000\n";
  
  // Sample valuation record
  const valuationSample = 
    "BC001     20230101    Land         75000      Improvements  175000    Total      250000\n" +
    "BC002     20230101    Land         250000     Improvements  500000    Total      750000\n" +
    "BC003     20230101    Land         400000     Improvements  850000    Total      1250000\n" +
    "BC004     20230101    Land         100000     Improvements  275000    Total      375000\n" +
    "BC005     20230101    Land         800000     Improvements  1300000   Total      2100000\n";
  
  // Sample tax record
  const taxSample = 
    "BC001     20230101    0.01125      2812.50    0.00          0.00      2812.50    Paid\n" +
    "BC002     20230101    0.01125      8437.50    0.00          0.00      8437.50    Paid\n" +
    "BC003     20230101    0.01125      14062.50   0.00          0.00      14062.50   Paid\n" +
    "BC004     20230101    0.01125      4218.75    0.00          0.00      4218.75    Paid\n" +
    "BC005     20230101    0.01125      23625.00   0.00          0.00      23625.00   Paid\n";
  
  // Write sample files
  if (!fs.existsSync(testFiles.property)) {
    fs.writeFileSync(testFiles.property, propertySample);
    logger.info(`Created sample property file: ${testFiles.property}`);
  }
  
  if (!fs.existsSync(testFiles.valuation)) {
    fs.writeFileSync(testFiles.valuation, valuationSample);
    logger.info(`Created sample valuation file: ${testFiles.valuation}`);
  }
  
  if (!fs.existsSync(testFiles.tax)) {
    fs.writeFileSync(testFiles.tax, taxSample);
    logger.info(`Created sample tax file: ${testFiles.tax}`);
  }
}

/**
 * Make an API request
 * 
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {object} body - Request body
 * @returns {Promise<object>} - Response data
 */
async function makeRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}/${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    logger.error(`API request error: ${error.message}`);
    throw error;
  }
}

/**
 * Test the fixed-width configuration endpoints
 */
async function testFixedWidthConfigurations() {
  logger.info('Testing fixed-width configurations...');
  
  try {
    // Get all configurations
    const configs = await makeRequest('ftp-data-processor/configs');
    logger.info(`Retrieved ${configs.length} fixed-width configurations`);
    
    // Verify that the required configurations exist
    const requiredConfigs = ['property', 'valuation', 'tax'];
    const missingConfigs = requiredConfigs.filter(
      type => !configs.some(config => config.entityType === type)
    );
    
    if (missingConfigs.length > 0) {
      throw new Error(`Missing required configurations: ${missingConfigs.join(', ')}`);
    }
    
    logger.info('✓ All required fixed-width configurations exist');
    return true;
  } catch (error) {
    logger.error(`Failed to test fixed-width configurations: ${error.message}`);
    return false;
  }
}

/**
 * Test the field mappings endpoints
 */
async function testFieldMappings() {
  logger.info('Testing field mappings...');
  
  try {
    // Get all field mappings
    const mappings = await makeRequest('ftp-data-processor/field-mappings');
    logger.info(`Retrieved ${mappings.length} field mappings`);
    
    // Verify that mappings exist for required entity types
    const requiredEntityTypes = ['property', 'valuation', 'tax'];
    const missingMappings = requiredEntityTypes.filter(
      type => !mappings.some(mapping => mapping.entityType === type)
    );
    
    if (missingMappings.length > 0) {
      throw new Error(`Missing field mappings for entity types: ${missingMappings.join(', ')}`);
    }
    
    logger.info('✓ Field mappings exist for all required entity types');
    return true;
  } catch (error) {
    logger.error(`Failed to test field mappings: ${error.message}`);
    return false;
  }
}

/**
 * Test parsing a file using the data processor
 */
async function testFileParsing(filePath, entityType) {
  logger.info(`Testing file parsing for ${entityType} file: ${filePath}`);
  
  try {
    // Read the file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse the file
    const parseResult = await makeRequest('ftp-data-processor/parse', 'POST', {
      entityType,
      fileContent
    });
    
    // Verify the parsing result
    if (!parseResult || !parseResult.records || parseResult.records.length === 0) {
      throw new Error(`No records parsed from ${entityType} file`);
    }
    
    logger.info(`✓ Successfully parsed ${parseResult.records.length} records from ${entityType} file`);
    return true;
  } catch (error) {
    logger.error(`Failed to test file parsing for ${entityType}: ${error.message}`);
    return false;
  }
}

/**
 * Test processor status endpoint
 */
async function testProcessorStatus() {
  logger.info('Testing processor status endpoint...');
  
  try {
    const status = await makeRequest('ftp-data-processor/status');
    
    if (!status || !status.status) {
      throw new Error('Invalid status response received');
    }
    
    logger.info(`✓ FTP data processor status: ${status.status}`);
    return true;
  } catch (error) {
    logger.error(`Failed to test processor status: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests or specific tests based on command line arguments
 */
async function runAllTests() {
  logger.info('Starting FTP data processor tests...');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const runConfigs = args.includes('--test-configs') || args.length === 0;
  const runMappings = args.includes('--test-mappings') || args.length === 0;
  const runParsing = args.includes('--test-parsing') || args.length === 0;
  const runStatus = args.includes('--test-status') || args.length === 0;
  
  // Create sample test files
  createSampleFiles();
  
  // Run only the specified tests
  const results = {};
  
  if (runConfigs) {
    results.fixedWidthConfigs = await testFixedWidthConfigurations();
  }
  
  if (runMappings) {
    results.fieldMappings = await testFieldMappings();
  }
  
  if (runStatus) {
    results.processorStatus = await testProcessorStatus();
  }
  
  if (runParsing) {
    results.propertyFileParsing = await testFileParsing(testFiles.property, 'property');
    results.valuationFileParsing = await testFileParsing(testFiles.valuation, 'valuation');
    results.taxFileParsing = await testFileParsing(testFiles.tax, 'tax');
  }
  
  // Summarize results
  const testsPassed = Object.values(results).filter(Boolean).length;
  const totalTests = Object.values(results).length;
  
  logger.info('=== FTP Data Processor Test Results ===');
  logger.info(`Tests passed: ${testsPassed}/${totalTests}`);
  
  for (const [test, passed] of Object.entries(results)) {
    logger.info(`${passed ? '✓' : '✗'} ${test}`);
  }
  
  if (testsPassed === totalTests) {
    logger.info('All selected FTP data processor tests passed!');
    return true;
  } else {
    logger.error(`Some FTP data processor tests failed (${totalTests - testsPassed}/${totalTests} failed)`);
    return false;
  }
}

// Run the tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logger.error(`Unhandled error in FTP data processor tests: ${error.message}`);
      process.exit(1);
    });
}

export { runAllTests, testFixedWidthConfigurations, testFieldMappings, testFileParsing, testProcessorStatus };