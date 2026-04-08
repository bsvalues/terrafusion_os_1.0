/**
 * Create Test Share Script
 * 
 * This script creates a test property insight share in the database
 * for testing purposes.
 * 
 * Usage: node scripts/create-test-share.js
 */

import { storage } from '../server/storage.js';
import { randomUUID } from 'crypto';

async function createTestShare() {
  try {
    // Generate a random share ID with timestamp to make it unique
    const timestamp = Date.now();
    const shareId = `test-share-${timestamp}`;
    
    // Create a test property insight share
    const testShare = {
      shareId,
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
      createdBy: 1, // Admin user
      isPublic: true,
      // No password or allowed domains for testing
    };
    
    console.log('Creating test property insight share...');
    const share = await storage.createPropertyInsightShare(testShare);
    
    console.log('Test share created successfully:');
    console.log(JSON.stringify(share, null, 2));
    
    console.log('\nUse the following command to generate QR code and PDF data:');
    console.log(`node scripts/direct-share-endpoints.js ${shareId}`);
    
    return share;
  } catch (error) {
    console.error('Error creating test share:', error);
    throw error;
  }
}

// Run the script
createTestShare().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
});