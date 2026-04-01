/**
 * Direct Property Insight Sharing Test Script
 * 
 * This script tests the property insight sharing functionality directly
 * without requiring a full property story generator or complex imports.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import QRCode from 'qrcode';

// Set up paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Mock property insights for sharing
const mockInsights = {
  'test-share-001': {
    id: 'test-share-001',
    propertyId: 'BC001',
    propertyName: '1320 N Louis Lane',
    propertyAddress: '1320 N Louis Lane, Benton WA',
    title: 'Property Assessment Report',
    description: 'Detailed assessment report for residential property',
    content: {
      story: `This residential property located at 1320 N Louis Lane in Benton, WA is a well-maintained single family home built in 1985. The property sits on a 0.25 acre lot and features 4 bedrooms and 2.5 bathrooms across 2,400 square feet of living space. It has a current assessed value of $375,000, which is consistent with similar properties in the neighborhood. The R-1 zoning allows for single family residential use only. The property has no recorded assessment appeals.`,
      data: {
        propertyType: 'residential',
        yearBuilt: 1985,
        bedrooms: 4,
        bathrooms: 2.5,
        squareFeet: 2400,
        assessedValue: 375000,
        acres: 0.25
      },
      highlights: [
        'Well-maintained single family home',
        'No recorded assessment appeals',
        'Consistent valuation with neighborhood trends',
        'Standard R-1 zoning without restrictions'
      ]
    },
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    accessCount: 0,
    lastAccessedAt: null,
    shareableUrl: 'https://example.com/insights/test-share-001',
    accessKey: 'abc123'
  },
  'test-share-002': {
    id: 'test-share-002',
    propertyId: 'BC002',
    propertyName: 'Commercial Plaza',
    propertyAddress: '456 Commercial Parkway, Benton WA',
    title: 'Commercial Property Valuation',
    description: 'Market analysis and valuation for commercial retail property',
    content: {
      story: `This commercial retail property at 456 Commercial Parkway in Benton, WA represents a solid investment in a growing commercial district. Built in 2001, the property includes a 5,500 square foot retail building on a 1.2 acre lot with ample parking. The current assessed value is $820,000, which reflects recent commercial growth in the area. The C-2 zoning allows for a variety of retail and service uses. The property has one resolved assessment appeal from 2022 which resulted in a 5% valuation adjustment.`,
      data: {
        propertyType: 'commercial',
        yearBuilt: 2001,
        squareFeet: 5500,
        assessedValue: 820000,
        acres: 1.2,
        zoning: 'C-2',
        appealHistory: '1 resolved appeal (2022)'
      },
      highlights: [
        'Prime commercial location',
        'Flexible C-2 zoning',
        'Recent valuation adjustment after appeal',
        'Good condition retail building with parking'
      ]
    },
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    accessCount: 0,
    lastAccessedAt: null,
    shareableUrl: 'https://example.com/insights/test-share-002',
    accessKey: 'def456'
  }
};

// Test utilities
class PropertySharingService {
  constructor(baseUrl = 'https://example.com') {
    this.baseUrl = baseUrl;
    this.uploadsDir = path.join(rootDir, 'uploads');
    this.tempDir = path.join(this.uploadsDir, 'temp');
    
    // Ensure directories exist
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }
  
  // Generate a new share ID
  generateShareId() {
    return `test-share-${Date.now()}`;
  }
  
  // Generate a new share with test data
  createShare(propertyId, options = {}) {
    const shareId = this.generateShareId();
    const accessKey = crypto.randomBytes(4).toString('hex');
    
    const share = {
      id: shareId,
      propertyId,
      propertyName: options.propertyName || `Property ${propertyId}`,
      propertyAddress: options.propertyAddress || 'Test Address',
      title: options.title || 'Property Insight',
      description: options.description || 'Property assessment information',
      content: options.content || {
        story: `This is a test property insight for property ${propertyId}.`,
        data: { testField: 'test value' },
        highlights: ['Test highlight 1', 'Test highlight 2']
      },
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      accessCount: 0,
      lastAccessedAt: null,
      shareableUrl: `${this.baseUrl}/insights/${shareId}`,
      accessKey
    };
    
    // Store the share (in memory only for testing)
    mockInsights[shareId] = share;
    
    return share;
  }
  
  // Get a share by ID
  getShareById(shareId) {
    return mockInsights[shareId];
  }
  
  // Generate QR code for a share
  async generateQRCode(shareId, options = {}) {
    const share = this.getShareById(shareId);
    
    if (!share) {
      throw new Error(`Share not found: ${shareId}`);
    }
    
    const shareUrl = share.shareableUrl;
    const outputPath = options.outputPath || path.join(this.tempDir, `${shareId}-qrcode.png`);
    
    // Generate QR code
    try {
      await QRCode.toFile(outputPath, shareUrl, {
        errorCorrectionLevel: 'H',
        type: 'png',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: options.width || 300
      });
      
      console.log(`QR code generated at: ${outputPath}`);
      return outputPath;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }
  
  // Prepare PDF export data
  preparePDFExportData(shareId, options = {}) {
    const share = this.getShareById(shareId);
    
    if (!share) {
      throw new Error(`Share not found: ${shareId}`);
    }
    
    // Get base64 QR code if available
    let qrCodeBase64 = '';
    const qrCodePath = path.join(this.tempDir, `${shareId}-qrcode.png`);
    
    if (fs.existsSync(qrCodePath)) {
      qrCodeBase64 = fs.readFileSync(qrCodePath).toString('base64');
    }
    
    // Prepare export data for PDF generation
    const exportData = {
      title: share.title,
      propertyName: share.propertyName,
      propertyAddress: share.propertyAddress,
      description: share.description,
      content: share.content,
      createdAt: new Date(share.createdAt).toLocaleDateString(),
      expiresAt: new Date(share.expiresAt).toLocaleDateString(),
      shareableUrl: share.shareableUrl,
      qrCodeBase64
    };
    
    // Save export data to file for inspection
    const exportPath = path.join(this.tempDir, `${shareId}-pdf-data.json`);
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`PDF export data saved to: ${exportPath}`);
    return exportData;
  }
  
  // Track access to a share
  trackShareAccess(shareId, accessInfo = {}) {
    const share = this.getShareById(shareId);
    
    if (!share) {
      throw new Error(`Share not found: ${shareId}`);
    }
    
    // Update access stats
    share.accessCount += 1;
    share.lastAccessedAt = new Date().toISOString();
    
    console.log(`Access tracked for share ${shareId}. Total accesses: ${share.accessCount}`);
    return share;
  }
}

/**
 * Run property insight sharing tests
 */
async function testPropertyInsightSharing() {
  try {
    console.log('Testing Property Insight Sharing...');
    
    // Initialize service
    const sharingService = new PropertySharingService();
    
    // Test 1: Create a new property insight share
    console.log('\nTest 1: Create a new property insight share');
    const newShare = sharingService.createShare('BC003', {
      propertyName: 'Test Property',
      propertyAddress: '789 Test Ave, Benton WA',
      title: 'Property Assessment Summary',
      description: 'Summary of recent property assessment',
      content: {
        story: 'This is a test property story for demonstration purposes.',
        data: {
          propertyType: 'residential',
          yearBuilt: 1995,
          assessedValue: 425000
        },
        highlights: [
          'Recent assessment completed',
          'Property in good condition',
          'No pending appeals'
        ]
      }
    });
    
    console.log('Created new share:');
    console.log(`- Share ID: ${newShare.id}`);
    console.log(`- Property: ${newShare.propertyName} (${newShare.propertyId})`);
    console.log(`- Shareable URL: ${newShare.shareableUrl}`);
    console.log(`- Access Key: ${newShare.accessKey}`);
    
    // Test 2: Generate QR code for a share
    console.log('\nTest 2: Generate QR code for a share');
    const qrCodePath = await sharingService.generateQRCode(newShare.id);
    console.log(`QR code generated at: ${qrCodePath}`);
    
    // Test 3: Prepare PDF export data
    console.log('\nTest 3: Prepare PDF export data');
    const pdfData = sharingService.preparePDFExportData(newShare.id);
    console.log('PDF export data prepared with fields:');
    console.log(Object.keys(pdfData).join(', '));
    
    // Test 4: Track share access
    console.log('\nTest 4: Track share access');
    const accessedShare = sharingService.trackShareAccess(newShare.id, {
      ipAddress: '192.168.1.1',
      userAgent: 'Test/1.0',
      referrer: 'direct'
    });
    
    console.log(`Share access tracked: Count=${accessedShare.accessCount}, Last=${accessedShare.lastAccessedAt}`);
    
    // Test 5: Use an existing mock share
    console.log('\nTest 5: Use an existing mock share');
    const existingShare = sharingService.getShareById('test-share-001');
    console.log(`Retrieved existing share: ${existingShare.propertyName} (${existingShare.propertyId})`);
    
    // Generate QR code for existing share
    const existingQrCodePath = await sharingService.generateQRCode('test-share-001');
    console.log(`QR code generated for existing share at: ${existingQrCodePath}`);
    
    // Prepare PDF export data for existing share
    sharingService.preparePDFExportData('test-share-001');
    
    console.log('\nProperty Insight Sharing tests completed successfully!');
    
    return {
      newShareId: newShare.id,
      existingShareId: 'test-share-001'
    };
  } catch (error) {
    console.error('Error running property insight sharing tests:', error);
    throw error;
  }
}

// Run the tests
testPropertyInsightSharing().catch(console.error);