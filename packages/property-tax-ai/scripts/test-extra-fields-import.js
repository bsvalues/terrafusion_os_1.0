/**
 * Test Extra Fields Import Script
 * 
 * This script tests importing property data with extra fields
 * to verify our enhanced data-import-service functionality.
 */

import fs from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PgStorage } from '../server/storage.js';
import { DataImportService } from '../server/services/data-import-service.js';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test data with various extra fields
const sampleData = [
  {
    propertyId: "TEST001",
    address: "123 Test Street",
    parcelNumber: "123-TEST-01",
    propertyType: "residential",
    acres: "1.5",
    value: "250000",
    status: "active",
    // Extra fields
    zoning: "R1",
    landUseCode: "101",
    topography: "Flat",
    floodZone: "X",
    yearBuilt: "1985",
    squareFeet: "2100",
    bedrooms: "3",
    bathrooms: "2",
    improvementType: "Single Family",
    quality: "Average",
    condition: "Good",
    customField1: "Custom value 1",
    customField2: "Custom value 2"
  },
  {
    propertyId: "TEST002",
    address: "456 Sample Avenue",
    parcelNumber: "456-TEST-02",
    propertyType: "commercial",
    acres: "2.3",
    value: "750000",
    status: "active",
    // Extra fields
    zoning: "C2",
    landUseCode: "201",
    topography: "Sloped",
    floodZone: "AE",
    yearBuilt: "1998",
    squareFeet: "5000",
    improvementType: "Office Building",
    quality: "Good",
    condition: "Excellent",
    tenants: "5",
    lastRenovation: "2015",
    parkingSpaces: "20"
  }
];

// Create a temporary CSV file with the sample data
function createTempCSV() {
  const tempDir = join(__dirname, '../uploads');
  
  // Ensure the uploads directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempFilePath = join(tempDir, 'test-extra-fields.csv');
  
  // Get all column headers from both objects combined
  const allKeys = new Set();
  sampleData.forEach(obj => {
    Object.keys(obj).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  
  // Create CSV content
  let csvContent = headers.join(',') + '\n';
  
  sampleData.forEach(obj => {
    const row = headers.map(header => {
      const value = obj[header] || '';
      // Quote values that contain commas
      return value.includes(',') ? `"${value}"` : value;
    });
    csvContent += row.join(',') + '\n';
  });
  
  // Write to file
  fs.writeFileSync(tempFilePath, csvContent);
  console.log(`Created test CSV file at: ${tempFilePath}`);
  
  return tempFilePath;
}

async function testImport() {
  try {
    console.log('Starting extra fields import test...');
    
    // Create the test CSV file
    const csvFilePath = createTempCSV();
    
    // Create storage and import service
    const storage = new PgStorage();
    const importService = new DataImportService(storage);
    
    // Test validation
    console.log('\nTesting CSV validation...');
    const validationResult = await importService.validateCSV(csvFilePath);
    console.log('Validation result:', validationResult);
    
    if (!validationResult.isValid) {
      console.error('CSV validation failed:', validationResult.errors);
      return;
    }
    
    // Test staging
    console.log('\nTesting property staging...');
    const stagingResult = await importService.stagePropertiesFromCSV(csvFilePath);
    console.log('Staging result:', stagingResult);
    
    if (stagingResult.failed > 0) {
      console.error('Some properties failed to stage:', stagingResult.errors);
    }
    
    // Test direct import
    console.log('\nTesting direct property import...');
    const importResult = await importService.importPropertiesFromCSV(csvFilePath);
    console.log('Import result:', importResult);
    
    if (importResult.failedImports > 0) {
      console.error('Some properties failed to import:', importResult.errors);
    }
    
    // Now check the imported properties to verify the extra fields were saved
    const properties = await storage.getAllProperties();
    console.log('\nImported properties with extra fields:');
    
    for (const property of properties) {
      if (property.propertyId.startsWith('TEST')) {
        console.log(`\nProperty ID: ${property.propertyId}`);
        console.log(`Address: ${property.address}`);
        console.log(`Extra Fields: ${JSON.stringify(property.extraFields, null, 2)}`);
      }
    }
    
    console.log('\nExtra fields import test completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testImport().catch(console.error);