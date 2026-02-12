/**
 * Direct Share Endpoints Script
 *
 * This script provides direct access to the QR code and PDF data endpoints
 * without going through the Express middleware that's being intercepted by Vite.
 *
 * Usage: node scripts/direct-share-endpoints.js <shareId>
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// We're not importing the storage from the ts file directly
// since we're mocking the database access here
// import { storage } from '../server/storage.js';
import QRCode from 'qrcode';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simplified version of SharingUtilsService
class DirectSharingUtils {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl || 'http://localhost:5000';
  }

  // Generate a shareable URL for a property insight
  generateShareableUrl(shareId) {
    return `${this.baseUrl}/property-insights/share/${shareId}`;
  }

  // Generate a QR code for a property insight share
  async generateQRCode(shareId, options = {}) {
    const shareUrl = this.generateShareableUrl(shareId);

    const qrOptions = {
      width: options.width || 300,
      margin: options.margin || 4,
      color: options.color || {
        dark: '#000000',
        light: '#FFFFFF',
      },
    };

    return await QRCode.toDataURL(shareUrl, qrOptions);
  }

  // Prepare PDF export data for the frontend
  preparePDFExportData(share, options = {}) {
    const pdfData = {
      title: options.title || 'Property Insight Report',
      author: options.author || 'Property Assessment System',
      createdAt: new Date().toISOString(),
      shareUrl: this.generateShareableUrl(share.shareId),
      property: {
        id: share.propertyId,
        title: share.title,
      },
      content: [],
    };

    // Add metadata section if requested
    if (options.includeMetadata !== false) {
      pdfData.content.push({
        type: 'metadata',
        data: {
          propertyId: share.propertyId,
          insightType: share.insightType,
          createdAt: share.createdAt,
          format: share.format,
        },
      });
    }

    // Add property insight data
    if (share.insightData) {
      // Add the main text content
      if (share.insightData.text) {
        pdfData.content.push({
          type: 'text',
          data: share.insightData.text,
        });
      }

      // Add sections if they exist
      if (share.insightData.sections && Array.isArray(share.insightData.sections)) {
        share.insightData.sections.forEach(section => {
          pdfData.content.push({
            type: 'section',
            data: {
              title: section.title,
              content: section.content,
            },
          });
        });
      }
    }

    return pdfData;
  }
}

// Initialize utility
const directSharingUtils = new DirectSharingUtils('http://localhost:5000');

// Direct QR code endpoint
async function directQRCodeEndpoint(shareId, options = {}) {
  try {
    console.log(`Generating QR code for share ID: ${shareId}`);

    // Since we're not using the actual database, create a mock share
    const share = {
      shareId,
      propertyId: 'BC001',
      title: 'Test Property Insight',
      insightType: 'story',
      format: 'detailed',
      createdAt: new Date().toISOString(),
      isPublic: true,
    };

    // No need to track access count in the mock version

    // Generate QR code
    const qrOptions = {
      width: options.width || 300,
      margin: options.margin || 4,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF',
      },
    };

    const qrCodeDataUrl = await directSharingUtils.generateQRCode(shareId, qrOptions);

    // Save QR code to file
    const outputFileName = `${shareId}-qrcode.png`;
    const outputPath = path.join(__dirname, '..', outputFileName);

    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(outputPath, base64Data, 'base64');

    console.log(`QR code saved to: ${outputPath}`);

    return {
      success: true,
      qrCode: qrCodeDataUrl,
      filePath: outputPath,
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    return { error: 'Failed to generate QR code' };
  }
}

// Direct PDF data endpoint
async function directPDFDataEndpoint(shareId, options = {}) {
  try {
    console.log(`Generating PDF data for share ID: ${shareId}`);

    // Since we're not using the actual database, create a mock share with richer content for PDF
    const share = {
      shareId,
      propertyId: 'BC001',
      title: 'Test Property Insight',
      insightType: 'story',
      insightData: {
        text: 'This is a test property insight for BC001.',
        sections: [
          { title: 'Overview', content: 'This property is located in Benton County.' },
          { title: 'Valuation', content: 'The assessed value is $250,000.' },
          {
            title: 'Features',
            content: 'The property includes 3 bedrooms, 2 bathrooms, and a 2-car garage.',
          },
        ],
      },
      format: 'detailed',
      createdAt: new Date().toISOString(),
      isPublic: true,
    };

    // Generate PDF data
    const pdfOptions = {
      title: options.title || 'Property Insight Report',
      author: options.author || "Benton County Assessor's Office",
      includeImages: options.includeImages !== 'false',
      includeMetadata: options.includeMetadata !== 'false',
    };

    const pdfData = directSharingUtils.preparePDFExportData(share, pdfOptions);

    // Save PDF data to file
    const outputFileName = `${shareId}-pdf-data.json`;
    const outputPath = path.join(__dirname, '..', outputFileName);

    fs.writeFileSync(outputPath, JSON.stringify(pdfData, null, 2));

    console.log(`PDF data saved to: ${outputPath}`);

    return {
      success: true,
      pdfData,
      filePath: outputPath,
    };
  } catch (error) {
    console.error('Error generating PDF data:', error);
    return { error: 'Failed to generate PDF data' };
  }
}

// Main function
async function main() {
  try {
    const shareId = process.argv[2];

    if (!shareId) {
      console.error('Error: Share ID is required');
      console.log('Usage: node scripts/direct-share-endpoints.js <shareId>');
      process.exit(1);
    }

    console.log(`Processing share ID: ${shareId}`);

    // Generate QR code
    const qrResult = await directQRCodeEndpoint(shareId);

    if (qrResult.error) {
      console.error('QR code generation failed:', qrResult.error);
    } else {
      console.log('QR code generation successful!');
    }

    // Generate PDF data
    const pdfResult = await directPDFDataEndpoint(shareId);

    if (pdfResult.error) {
      console.error('PDF data generation failed:', pdfResult.error);
    } else {
      console.log('PDF data generation successful!');
    }

    console.log('All tasks completed');
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
