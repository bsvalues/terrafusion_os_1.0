/**
 * FTP Connection Test Script
 *
 * This script tests the connection to the SpatialEst FTP server
 * and performs basic operations like listing files, uploading,
 * and downloading.
 */

import { FtpService } from '../server/services/ftp-service.js';
import fs from 'fs';
import path from 'path';

// Create a sample CSV file for testing
function createSampleCSV() {
  const tempDir = './uploads/temp';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const samplePath = path.join(tempDir, 'sample-properties.csv');
  const csvContent = `propertyId,address,parcelNumber,propertyType,status,acres,value
BC001,123 Test St,12345-123-123,residential,active,0.25,150000
BC002,456 Sample Ave,12345-123-124,commercial,active,1.5,750000
BC003,789 Demo Blvd,12345-123-125,residential,pending,0.33,225000`;

  fs.writeFileSync(samplePath, csvContent);
  return samplePath;
}

// Mock storage for testing
const mockStorage = {
  getProperty: () =>
    Promise.resolve({
      propertyId: 'BC001',
      address: '123 Test St',
      parcelNumber: '12345-123-123',
      propertyType: 'residential',
      status: 'active',
      acres: '0.25',
      value: '150000',
    }),
  getAllProperties: () =>
    Promise.resolve([
      {
        propertyId: 'BC001',
        address: '123 Test St',
        parcelNumber: '12345-123-123',
        propertyType: 'residential',
        status: 'active',
        acres: '0.25',
        value: '150000',
      },
      {
        propertyId: 'BC002',
        address: '456 Sample Ave',
        parcelNumber: '12345-123-124',
        propertyType: 'commercial',
        status: 'active',
        acres: '1.5',
        value: '750000',
      },
    ]),
};

async function runFtpTests() {
  try {
    console.log('Starting FTP connection tests...');
    const ftpService = new FtpService(mockStorage);

    // Test 1: Test connection
    console.log('\nTest 1: Testing FTP connection...');
    const connected = await ftpService.testConnection();
    console.log(`Connection test ${connected ? 'PASSED ✓' : 'FAILED ✗'}`);

    if (!connected) {
      console.error('FTP connection failed. Please check credentials and try again.');
      return;
    }

    // Test 2: List files in root directory
    console.log('\nTest 2: Listing files in root directory...');
    try {
      const files = await ftpService.listFiles('/');
      console.log(`Found ${files.length} files/directories:`);
      files.forEach(file => {
        console.log(
          `- ${file.name} (${file.type === 1 ? 'File' : 'Directory'}, Size: ${file.size} bytes)`
        );
      });
      console.log('List files test PASSED ✓');
    } catch (error) {
      console.error('List files test FAILED ✗:', error.message);
    }

    // Test 3: Upload a sample file
    console.log('\nTest 3: Uploading a sample file...');
    const sampleFilePath = createSampleCSV();
    const remoteFilePath = '/test-upload.csv';

    try {
      const uploadResult = await ftpService.uploadFile(sampleFilePath, remoteFilePath);
      console.log(`Upload test ${uploadResult ? 'PASSED ✓' : 'FAILED ✗'}`);
    } catch (error) {
      console.error('Upload test FAILED ✗:', error.message);
    }

    // Test 4: Download the uploaded file
    console.log('\nTest 4: Downloading the uploaded file...');
    const downloadPath = './uploads/temp/downloaded-test.csv';
    try {
      const downloadResult = await ftpService.downloadFile(remoteFilePath, downloadPath);
      console.log(`Download test ${downloadResult ? 'PASSED ✓' : 'FAILED ✗'}`);

      if (downloadResult) {
        const fileContent = fs.readFileSync(downloadPath, 'utf8');
        console.log('Downloaded file content:');
        console.log(
          fileContent.split('\n').slice(0, 4).join('\n') +
            (fileContent.split('\n').length > 4 ? '\n...' : '')
        );
      }
    } catch (error) {
      console.error('Download test FAILED ✗:', error.message);
    }

    // Test 5: Export properties
    console.log('\nTest 5: Testing property export...');
    const exportPath = '/test-export.csv';
    try {
      const exportResult = await ftpService.exportPropertiesToFtp(exportPath);
      console.log(`Export test ${exportResult.success ? 'PASSED ✓' : 'FAILED ✗'}`);
      if (exportResult.success) {
        console.log(`Exported ${exportResult.recordCount} records to ${exportResult.filename}`);
      } else {
        console.error('Export error:', exportResult.errorMessage);
      }
    } catch (error) {
      console.error('Export test FAILED ✗:', error.message);
    }

    // Clean up test files
    console.log('\nCleaning up test files...');
    try {
      if (fs.existsSync(sampleFilePath)) {
        fs.unlinkSync(sampleFilePath);
      }
      if (fs.existsSync(downloadPath)) {
        fs.unlinkSync(downloadPath);
      }
      console.log('Cleanup completed.');
    } catch (error) {
      console.error('Cleanup error:', error.message);
    }

    console.log('\nFTP tests completed.');
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

// Run the tests
runFtpTests().catch(console.error);
