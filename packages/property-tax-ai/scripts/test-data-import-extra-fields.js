/**
 * Data Import with Extra Fields Test Script
 * 
 * This script tests the enhanced data import service with its ability
 * to handle additional property fields through the extraFields JSON column.
 */

const { DataImportService } = require('../server/services/data-import-service');
const fs = require('fs');
const path = require('path');

// Mock storage for testing
const mockStorage = {
  properties: [],
  
  createProperty: async function(property) {
    const newProperty = {
      ...property,
      id: this.properties.length + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.properties.push(newProperty);
    return newProperty;
  },
  
  getPropertyByPropertyId: async function(propertyId) {
    return this.properties.find(p => p.propertyId === propertyId);
  },
  
  getAllProperties: async function() {
    return this.properties;
  }
};

// Create a test CSV file with extended fields
function createTestCSV() {
  const tempDir = './uploads/temp';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const csvPath = path.join(tempDir, 'test-import-extra-fields.csv');
  
  // Create CSV with standard fields and extra fields
  const csvContent = `propertyId,address,parcelNumber,propertyType,status,acres,value,yearBuilt,bedrooms,bathrooms,squareFeet,zoning,floodZone,soilType,topography,schoolDistrict,taxRate,lastSaleDate,lastSalePrice
EXTRA001,123 Extra Fields St,12345-A1,residential,active,0.25,275000,1992,3,2,1850,R-1,X,Loam,Flat,Benton School District,1.2,2021-06-15,250000
EXTRA002,456 Extended Data Ave,12345-A2,residential,active,0.33,325000,2005,4,2.5,2200,R-1,X,Sandy Loam,Slight Grade,Benton School District,1.2,2022-03-10,315000
EXTRA003,789 Complete Record Rd,12345-A3,commercial,active,1.25,850000,2010,0,2,5500,C-1,A,Clay,Flat,Benton School District,1.5,2019-11-20,795000`;
  
  fs.writeFileSync(csvPath, csvContent);
  return csvPath;
}

async function testDataImportWithExtraFields() {
  try {
    console.log('Testing Data Import with Extra Fields...');
    
    // Create test CSV file
    const csvFilePath = createTestCSV();
    console.log(`Created test CSV file at: ${csvFilePath}`);
    
    // Initialize the import service
    const importService = new DataImportService(mockStorage);
    
    // Test Case 1: Validate the CSV file
    console.log('\nTest Case 1: Validate the CSV file');
    try {
      const validationResult = await importService.validateCSV(csvFilePath);
      
      console.log('Validation Results:');
      console.log(`- Total Records: ${validationResult.totalRecords}`);
      console.log(`- Valid Records: ${validationResult.validRecords}`);
      console.log(`- Invalid Records: ${validationResult.invalidRecords}`);
      console.log(`- CSV is Valid: ${validationResult.isValid ? 'Yes ✓' : 'No ✗'}`);
      
      if (validationResult.errors) {
        console.log('Validation Errors:');
        validationResult.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
      
      console.log(`\nValidation test ${validationResult.isValid ? 'PASSED ✓' : 'FAILED ✗'}`);
    } catch (error) {
      console.error('Validation test FAILED ✗:', error.message);
    }
    
    // Test Case 2: Import properties with extra fields
    console.log('\nTest Case 2: Import properties with extra fields');
    try {
      const importResult = await importService.importPropertiesFromCSV(csvFilePath);
      
      console.log('Import Results:');
      console.log(`- Total Records: ${importResult.total}`);
      console.log(`- Successfully Imported: ${importResult.successfulImports}`);
      console.log(`- Failed Imports: ${importResult.failedImports}`);
      
      if (importResult.errors) {
        console.log('Import Errors:');
        importResult.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
      
      const importSuccess = importResult.successfulImports > 0 && importResult.failedImports === 0;
      console.log(`\nImport test ${importSuccess ? 'PASSED ✓' : 'FAILED ✗'}`);
    } catch (error) {
      console.error('Import test FAILED ✗:', error.message);
    }
    
    // Test Case 3: Verify extra fields were stored correctly
    console.log('\nTest Case 3: Verify extra fields were stored correctly');
    try {
      const properties = await mockStorage.getAllProperties();
      
      if (properties.length === 0) {
        throw new Error('No properties were imported');
      }
      
      let extraFieldsVerified = true;
      let propertyWithAllFields = null;
      
      for (const property of properties) {
        console.log(`\nProperty: ${property.propertyId}`);
        console.log(`- Standard Fields: propertyId, address, parcelNumber, propertyType, status, acres, value`);
        
        if (!property.extraFields) {
          console.log('- No extraFields found!');
          extraFieldsVerified = false;
          continue;
        }
        
        console.log('- Extra Fields:');
        const extraFieldsList = Object.keys(property.extraFields);
        extraFieldsList.forEach(field => {
          console.log(`  * ${field}: ${property.extraFields[field]}`);
        });
        
        // Check for comprehensive extra fields set
        const expectedExtraFields = ['yearBuilt', 'bedrooms', 'bathrooms', 'squareFeet', 'zoning', 'floodZone', 'soilType', 'topography', 'schoolDistrict', 'taxRate', 'lastSaleDate', 'lastSalePrice'];
        const hasAllExpectedFields = expectedExtraFields.every(field => field in property.extraFields);
        
        if (hasAllExpectedFields) {
          propertyWithAllFields = property;
        }
      }
      
      if (propertyWithAllFields) {
        console.log('\nFound property with all expected extra fields ✓');
      } else {
        console.log('\nNo property found with all expected extra fields ✗');
        extraFieldsVerified = false;
      }
      
      console.log(`\nExtra fields verification ${extraFieldsVerified ? 'PASSED ✓' : 'FAILED ✗'}`);
    } catch (error) {
      console.error('Extra fields verification FAILED ✗:', error.message);
    }
    
    // Test Case 4: Numeric field conversion
    console.log('\nTest Case 4: Verify numeric field conversion');
    try {
      const properties = await mockStorage.getAllProperties();
      
      if (properties.length === 0) {
        throw new Error('No properties were imported');
      }
      
      let numericFieldsCorrect = true;
      
      for (const property of properties) {
        const acresIsNumeric = !isNaN(parseFloat(property.acres));
        
        if (!acresIsNumeric) {
          console.log(`Property ${property.propertyId} has non-numeric acres: ${property.acres}`);
          numericFieldsCorrect = false;
        }
        
        if (property.value && isNaN(parseFloat(property.value))) {
          console.log(`Property ${property.propertyId} has non-numeric value: ${property.value}`);
          numericFieldsCorrect = false;
        }
        
        if (property.extraFields) {
          const numericExtraFields = ['yearBuilt', 'bedrooms', 'bathrooms', 'squareFeet', 'taxRate', 'lastSalePrice'];
          
          for (const field of numericExtraFields) {
            if (field in property.extraFields && isNaN(parseFloat(property.extraFields[field]))) {
              console.log(`Property ${property.propertyId} has non-numeric ${field}: ${property.extraFields[field]}`);
              numericFieldsCorrect = false;
            }
          }
        }
      }
      
      console.log(`\nNumeric field conversion ${numericFieldsCorrect ? 'PASSED ✓' : 'FAILED ✗'}`);
    } catch (error) {
      console.error('Numeric field conversion FAILED ✗:', error.message);
    }
    
    // Clean up test file
    try {
      if (fs.existsSync(csvFilePath)) {
        fs.unlinkSync(csvFilePath);
        console.log(`\nCleaned up test file: ${csvFilePath}`);
      }
    } catch (error) {
      console.error('Error cleaning up test file:', error.message);
    }
    
    console.log('\nData Import with Extra Fields tests completed.');
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

// Run the tests
testDataImportWithExtraFields().catch(console.error);