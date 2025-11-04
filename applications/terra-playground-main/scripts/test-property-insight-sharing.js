/**
 * Property Insight Sharing Test Script
 *
 * This script tests the Property Insight Sharing service, including
 * creation of shares, QR code generation, and access tracking.
 */

const {
  PropertyInsightSharingService,
  InsightType,
} = require('../server/services/property-insight-sharing-service');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Mock storage for testing
const mockStorage = {
  // Property insight shares storage
  propertyInsightShares: [],

  createPropertyInsightShare: async function (insightShare) {
    const newShare = {
      ...insightShare,
      id: this.propertyInsightShares.length + 1,
      createdAt: new Date(),
      accessCount: 0,
    };
    this.propertyInsightShares.push(newShare);
    return newShare;
  },

  getPropertyInsightShareById: async function (shareId) {
    return this.propertyInsightShares.find(share => share.shareId === shareId) || null;
  },

  updatePropertyInsightShare: async function (shareId, updates) {
    const shareIndex = this.propertyInsightShares.findIndex(share => share.shareId === shareId);
    if (shareIndex === -1) return null;

    const updatedShare = {
      ...this.propertyInsightShares[shareIndex],
      ...updates,
      updatedAt: new Date(),
    };

    this.propertyInsightShares[shareIndex] = updatedShare;
    return updatedShare;
  },

  deletePropertyInsightShare: async function (shareId) {
    const initialLength = this.propertyInsightShares.length;
    this.propertyInsightShares = this.propertyInsightShares.filter(
      share => share.shareId !== shareId
    );
    return this.propertyInsightShares.length !== initialLength;
  },

  getPropertyInsightSharesByPropertyId: async function (propertyId) {
    return this.propertyInsightShares.filter(share => share.propertyId === propertyId);
  },

  getAllPropertyInsightShares: async function () {
    return this.propertyInsightShares;
  },

  createSystemActivity: async function (activity) {
    console.log('System activity logged:', activity);
    return { id: 1, ...activity, timestamp: new Date() };
  },
};

// Helper to create QR code for testing
async function generateQRCode(url, outputPath) {
  try {
    await QRCode.toFile(outputPath, url);
    return true;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return false;
  }
}

async function testPropertyInsightSharing() {
  try {
    console.log('Testing Property Insight Sharing...');

    // Create temp directory for QR codes
    const tempDir = './uploads/temp';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Initialize the service
    const sharingService = new PropertyInsightSharingService(mockStorage);

    // Test Case 1: Create a property story share
    console.log('\nTest Case 1: Create a property story share');
    try {
      const propertyStory = `This property at 1320 N Louis Lane is a well-maintained 4-bedroom, 2.5-bathroom 
single-family home built in 1985. The property sits on a quarter-acre lot in a desirable 
residential neighborhood in Benton County. The home features 2,400 square feet of living space 
with a main two-story structure and an additional garden shed built in 1990.`;

      const shareOptions = {
        expiresInDays: 30,
        isPublic: true,
        title: 'Property Story: 1320 N Louis Lane',
      };

      const storyShare = await sharingService.createPropertyStoryShare(
        'BC001',
        propertyStory,
        'detailed',
        shareOptions,
        '1320 N Louis Lane Residence',
        '1320 N Louis Lane, Benton WA'
      );

      console.log('Created Property Story Share:');
      console.log(`- Share ID: ${storyShare.shareId}`);
      console.log(`- Title: ${storyShare.title}`);
      console.log(`- Property ID: ${storyShare.propertyId}`);
      console.log(`- Property Name: ${storyShare.propertyName}`);
      console.log(`- Property Address: ${storyShare.propertyAddress}`);
      console.log(`- Format: ${storyShare.format}`);
      console.log(`- Expires: ${storyShare.expiresAt || 'Never'}`);

      // Generate QR code for demo
      const qrOutputPath = path.join(tempDir, `test-share-${storyShare.shareId}.png`);
      const shareUrl = `https://your-app-url.com/share/${storyShare.shareId}`;
      const qrGenerated = await generateQRCode(shareUrl, qrOutputPath);

      if (qrGenerated) {
        console.log(`QR code generated at: ${qrOutputPath}`);
      }

      console.log('\nProperty story share test PASSED ✓');
    } catch (error) {
      console.error('Property story share test FAILED ✗:', error.message);
    }

    // Test Case 2: Create a property comparison share
    console.log('\nTest Case 2: Create a property comparison share');
    try {
      const comparisonContent = `Comparison of 1320 N Louis Lane (residential) and 456 Commercial Parkway (commercial):
      
The residential property at 1320 N Louis Lane is valued at $375,000 with 0.25 acres of land, while 
the commercial property at 456 Commercial Parkway is valued significantly higher at $820,000 with 1.2 acres
of land. The commercial property is newer (built in 2001 vs. 1985) and features larger square footage (5,500 sq ft 
vs. 2,400 sq ft). The commercial property has had one assessment appeal which was resolved with a 5% adjustment.`;

      const shareOptions = {
        expiresInDays: 7,
        isPublic: true,
        password: 'demo1234',
        title: 'Comparison: Residential vs. Commercial Property',
      };

      const comparisonShare = await sharingService.createPropertyComparisonShare(
        ['BC001', 'BC002'],
        comparisonContent,
        'detailed',
        shareOptions,
        ['1320 N Louis Lane Residence', '456 Commercial Parkway Retail'],
        ['1320 N Louis Lane, Benton WA', '456 Commercial Parkway, Benton WA']
      );

      console.log('Created Property Comparison Share:');
      console.log(`- Share ID: ${comparisonShare.shareId}`);
      console.log(`- Title: ${comparisonShare.title}`);
      console.log(`- Property IDs: ${comparisonShare.propertyId}`);
      console.log(`- Property Names: ${comparisonShare.propertyName}`);
      console.log(`- Property Addresses: ${comparisonShare.propertyAddress}`);
      console.log(`- Password Protected: ${comparisonShare.password ? 'Yes' : 'No'}`);
      console.log(`- Expires: ${comparisonShare.expiresAt || 'Never'}`);

      console.log('\nProperty comparison share test PASSED ✓');
    } catch (error) {
      console.error('Property comparison share test FAILED ✗:', error.message);
    }

    // Test Case 3: Track share access
    console.log('\nTest Case 3: Track share access');
    try {
      const allShares = await sharingService.getAllPropertyInsightShares();
      if (allShares.length === 0) {
        throw new Error('No shares found to test access tracking');
      }

      const shareToAccess = allShares[0];
      console.log(`Testing access tracking for share ID: ${shareToAccess.shareId}`);

      // Track first access
      const firstAccess = await sharingService.trackShareAccess(shareToAccess.shareId);
      console.log(`First access count: ${firstAccess?.accessCount}`);

      // Track second access
      const secondAccess = await sharingService.trackShareAccess(shareToAccess.shareId);
      console.log(`Second access count: ${secondAccess?.accessCount}`);

      if (secondAccess && secondAccess.accessCount === 2) {
        console.log('Access tracking test PASSED ✓');
      } else {
        console.log('Access tracking test FAILED ✗ - Count did not increment properly');
      }
    } catch (error) {
      console.error('Access tracking test FAILED ✗:', error.message);
    }

    // Test Case 4: Retrieve a share with password
    console.log('\nTest Case 4: Retrieve a share with password');
    try {
      const allShares = await sharingService.getAllPropertyInsightShares();
      const passwordProtectedShare = allShares.find(share => share.password);

      if (!passwordProtectedShare) {
        console.log('No password-protected share found to test');
      } else {
        console.log(`Testing password protection for share ID: ${passwordProtectedShare.shareId}`);

        // Try with wrong password
        try {
          await sharingService.getPropertyInsightShare(
            passwordProtectedShare.shareId,
            'wrongpassword'
          );
          console.log('Password protection test FAILED ✗ - Wrong password accepted');
        } catch (error) {
          console.log('Error with wrong password (expected):', error.message);

          // Try with correct password
          try {
            const share = await sharingService.getPropertyInsightShare(
              passwordProtectedShare.shareId,
              passwordProtectedShare.password
            );
            console.log(`Retrieved share with correct password: ${share ? 'Success' : 'Failed'}`);
            console.log('Password protection test PASSED ✓');
          } catch (error) {
            console.error('Error with correct password:', error.message);
            console.log('Password protection test FAILED ✗');
          }
        }
      }
    } catch (error) {
      console.error('Password protection test FAILED ✗:', error.message);
    }

    // Test Case 5: Delete a property insight share
    console.log('\nTest Case 5: Delete a property insight share');
    try {
      const allShares = await sharingService.getAllPropertyInsightShares();
      if (allShares.length === 0) {
        throw new Error('No shares found to test deletion');
      }

      const shareToDelete = allShares[0];
      console.log(`Deleting share with ID: ${shareToDelete.shareId}`);

      const deleteResult = await sharingService.deletePropertyInsightShare(shareToDelete.shareId);
      console.log(`Share deletion ${deleteResult ? 'PASSED ✓' : 'FAILED ✗'}`);

      // Verify deletion
      const verifyDelete = await sharingService.getPropertyInsightShare(shareToDelete.shareId);
      console.log(`Verification of deletion: ${verifyDelete === null ? 'PASSED ✓' : 'FAILED ✗'}`);
    } catch (error) {
      console.error('Share deletion test FAILED ✗:', error.message);
    }

    console.log('\nProperty Insight Sharing tests completed.');
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

// Run the tests
testPropertyInsightSharing().catch(console.error);
