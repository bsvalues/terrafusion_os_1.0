/**
 * Test script that directly accesses the sharing-utils.ts functions
 * for testing QR code generation and PDF export data preparation.
 *
 * This is a workaround for dealing with express and Vite middleware conflicts.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// Function to run TSX script for TypeScript execution
async function runTsxScript() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, 'run-sharing-tests.ts');

    // Create the TypeScript test script
    const tsxContent = `
import { SharingUtilsService } from '../server/services/sharing-utils';
import fs from 'fs';
import path from 'path';

// Initialize the sharing utils service
const sharingUtils = new SharingUtilsService('http://localhost:5000');

// Test property insight share object
const testShare = {
  id: 1,
  shareId: 'test-share-123',
  propertyId: 'BC001',
  title: 'Test Property Insight',
  insightType: 'story',
  insightData: { 
    text: 'This is a test property insight for BC001.',
    sections: [
      { title: 'Overview', content: 'This property is located in Benton County.' },
      { title: 'Valuation', content: 'The assessed value is $250,000.' }
    ]
  },
  format: 'detailed',
  createdBy: 1,
  accessCount: 5,
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  isPublic: true,
  password: null,
  allowedDomains: null
};

async function run() {
  try {
    // Test QR code generation
    console.log('Generating QR code...');
    const qrOptions = {
      width: 300,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    const qrCodeDataUrl = await sharingUtils.generateQRCode(testShare.shareId, qrOptions);
    console.log('QR code data URL received, length:', qrCodeDataUrl.length);
    
    // Save QR code to file
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    const filePath = path.join(__dirname, '..', 'test-qrcode.png');
    fs.writeFileSync(filePath, base64Data, 'base64');
    console.log(\`QR code saved to \${filePath}\`);
    
    // Test PDF export data
    console.log('Preparing PDF export data...');
    const pdfOptions = {
      title: 'Test Property Insight Report',
      author: 'Benton County Assessor\\'s Office',
      includeImages: true,
      includeMetadata: true
    };
    
    const pdfData = sharingUtils.preparePDFExportData(testShare, pdfOptions);
    console.log('PDF export data:', JSON.stringify(pdfData, null, 2));
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

run();
`;

    fs.writeFileSync(scriptPath, tsxContent);
    console.log(`Created TypeScript test script at ${scriptPath}`);

    // Run the script using tsx
    const tsx = spawn('npx', ['tsx', scriptPath]);

    tsx.stdout.on('data', data => {
      console.log(data.toString());
    });

    tsx.stderr.on('data', data => {
      console.error(data.toString());
    });

    tsx.on('close', code => {
      if (code === 0) {
        console.log('TSX script executed successfully');
        resolve();
      } else {
        console.error(`TSX script failed with code ${code}`);
        reject(new Error(`Script execution failed with code ${code}`));
      }
    });
  });
}

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test property insight share object
const testShare = {
  id: 1,
  shareId: 'test-share-123',
  propertyId: 'BC001',
  title: 'Test Property Insight',
  insightType: 'story',
  insightData: {
    text: 'This is a test property insight for BC001.',
    sections: [
      { title: 'Overview', content: 'This property is located in Benton County.' },
      { title: 'Valuation', content: 'The assessed value is $250,000.' },
    ],
  },
  format: 'detailed',
  createdBy: 1,
  accessCount: 5,
  expiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  isPublic: true,
  password: null,
  allowedDomains: null,
};

// Test QR code generation
async function testQRCode() {
  try {
    console.log('Generating QR code...');

    // Generate QR code
    const qrOptions = {
      width: 300,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    };

    const qrCodeDataUrl = await sharingUtils.generateQRCode(testShare.shareId, qrOptions);
    console.log('QR code data URL received, length:', qrCodeDataUrl.length);

    // Save QR code to file
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    const filePath = path.join(__dirname, '..', 'test-qrcode.png');
    fs.writeFileSync(filePath, base64Data, 'base64');
    console.log(`QR code saved to ${filePath}`);

    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw error;
  }
}

// Test PDF export data preparation
function testPDFData() {
  try {
    console.log('Preparing PDF export data...');

    // Generate PDF export data
    const pdfOptions = {
      title: 'Test Property Insight Report',
      author: "Benton County Assessor's Office",
      includeImages: true,
      includeMetadata: true,
    };

    const pdfData = sharingUtils.preparePDFExportData(testShare, pdfOptions);
    console.log('PDF export data:', JSON.stringify(pdfData, null, 2));

    return pdfData;
  } catch (error) {
    console.error('Error preparing PDF data:', error);
    throw error;
  }
}

// Run all tests with TSX script
async function runTests() {
  try {
    await runTsxScript();
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

// Run tests
runTests();
