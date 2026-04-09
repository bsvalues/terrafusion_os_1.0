/**
 * Direct Test of Sharing Utils
 * 
 * This script directly uses the QRCode library to test QR code generation
 * and mocks the PDF export functionality to verify our sharing functionality.
 */

import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock share data
const mockShare = {
  shareId: 'test-share-' + Date.now(),
  propertyId: 'BC001',
  title: 'Test Property Insight',
  insightType: 'story',
  insightData: {
    text: 'This is a test property insight for BC001.',
    sections: [
      { title: 'Overview', content: 'This property is located in Benton County.' },
      { title: 'Valuation', content: 'The assessed value is $250,000.' },
      { title: 'Features', content: 'The property includes 3 bedrooms, 2 bathrooms, and a 2-car garage.' }
    ]
  },
  format: 'detailed',
  createdBy: 1,
  createdAt: new Date().toISOString(),
  isPublic: true,
  accessCount: 0
};

// Simplified version of SharingUtilsService
class SharingUtilsService {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || 'http://localhost:5000';
  }
  
  generateShareableUrl(shareId) {
    return `${this.baseUrl}/property-insights/share/${shareId}`;
  }
  
  async generateQRCode(shareId, options = {}) {
    const shareUrl = this.generateShareableUrl(shareId);
    
    const qrOptions = {
      width: options.width || 300,
      margin: options.margin || 4,
      color: options.color || {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    return await QRCode.toDataURL(shareUrl, qrOptions);
  }
  
  preparePDFExportData(share, options = {}) {
    const pdfData = {
      title: options.title || 'Property Insight Report',
      author: options.author || 'Property Assessment System',
      createdAt: new Date().toISOString(),
      shareUrl: this.generateShareableUrl(share.shareId),
      property: {
        id: share.propertyId,
        title: share.title
      },
      content: []
    };
    
    // Add metadata section if requested
    if (options.includeMetadata !== false) {
      pdfData.content.push({
        type: 'metadata',
        data: {
          propertyId: share.propertyId,
          insightType: share.insightType,
          createdAt: share.createdAt,
          format: share.format
        }
      });
    }
    
    // Add property insight data
    if (share.insightData) {
      // Add the main text content
      if (share.insightData.text) {
        pdfData.content.push({
          type: 'text',
          data: share.insightData.text
        });
      }
      
      // Add sections if they exist
      if (share.insightData.sections && Array.isArray(share.insightData.sections)) {
        share.insightData.sections.forEach(section => {
          pdfData.content.push({
            type: 'section',
            data: {
              title: section.title,
              content: section.content
            }
          });
        });
      }
    }
    
    return pdfData;
  }
}

// Initialize utility
const sharingUtils = new SharingUtilsService('http://localhost:5000');

// Test QR code generation
async function testQRCode() {
  try {
    console.log('Testing QR code generation...');
    
    const shareId = mockShare.shareId;
    const qrOptions = {
      width: 300,
      margin: 4,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    const qrCodeDataUrl = await sharingUtils.generateQRCode(shareId, qrOptions);
    
    // Save QR code to file
    const outputFileName = `${shareId}-qrcode.png`;
    const outputPath = path.join(__dirname, '..', outputFileName);
    
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
    
    console.log(`QR code saved to: ${outputPath}`);
    
    return {
      success: true,
      qrCode: qrCodeDataUrl,
      filePath: outputPath
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    return { error: 'Failed to generate QR code' };
  }
}

// Test PDF data preparation
function testPDFData() {
  try {
    console.log('Testing PDF data preparation...');
    
    const share = mockShare;
    const pdfOptions = {
      title: 'Property Insight Report',
      author: 'Benton County Assessor\'s Office',
      includeImages: true,
      includeMetadata: true
    };
    
    const pdfData = sharingUtils.preparePDFExportData(share, pdfOptions);
    
    // Save PDF data to file
    const outputFileName = `${share.shareId}-pdf-data.json`;
    const outputPath = path.join(__dirname, '..', outputFileName);
    
    fs.writeFileSync(outputPath, JSON.stringify(pdfData, null, 2));
    
    console.log(`PDF data saved to: ${outputPath}`);
    
    return {
      success: true,
      pdfData,
      filePath: outputPath
    };
  } catch (error) {
    console.error('Error preparing PDF data:', error);
    return { error: 'Failed to prepare PDF data' };
  }
}

// Run all tests
async function runTests() {
  try {
    console.log('Running sharing tests with mock data...');
    console.log('Mock share:', mockShare);
    
    // Test QR code generation
    const qrResult = await testQRCode();
    
    if (qrResult.error) {
      console.error('QR code generation failed:', qrResult.error);
    } else {
      console.log('QR code generation successful!');
    }
    
    // Test PDF data preparation
    const pdfResult = testPDFData();
    
    if (pdfResult.error) {
      console.error('PDF data preparation failed:', pdfResult.error);
    } else {
      console.log('PDF data preparation successful!');
    }
    
    console.log('All tests completed');
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

// Run the tests
runTests();