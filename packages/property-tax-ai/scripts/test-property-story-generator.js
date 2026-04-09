/**
 * Property Story Generator Test Script
 * 
 * This script tests the integration with OpenAI and the Property Story Generator service,
 * demonstrating how property data is transformed into narrative descriptions.
 */

import { PropertyStoryGenerator } from '../server/services/property-story-generator.js';
import { isOpenAIApiKeyValid } from '../server/services/openai-service.js';

// Mock storage for testing
const mockStorage = {
  getPropertyByPropertyId: (propertyId) => {
    const properties = {
      'BC001': {
        propertyId: 'BC001',
        address: '1320 N Louis Lane, Benton WA',
        parcelNumber: '12345-123-123',
        propertyType: 'residential',
        status: 'active',
        acres: '0.25',
        value: '375000',
        extraFields: {
          yearBuilt: 1985,
          bedrooms: 4,
          bathrooms: 2.5,
          squareFeet: 2400,
          improvementType: 'Single Family Home',
          quality: 'Good',
          condition: 'Well Maintained',
          zoning: 'R-1',
          landUseCode: 'Single Family Residential'
        }
      },
      'BC002': {
        propertyId: 'BC002',
        address: '456 Commercial Parkway, Benton WA',
        parcelNumber: '12345-456-789',
        propertyType: 'commercial',
        status: 'active',
        acres: '1.2',
        value: '820000',
        extraFields: {
          yearBuilt: 2001,
          squareFeet: 5500,
          improvementType: 'Retail Store',
          quality: 'Excellent',
          condition: 'Good',
          zoning: 'C-2',
          landUseCode: 'Commercial Retail'
        }
      }
    };
    
    return Promise.resolve(properties[propertyId] || null);
  },
  
  getImprovementsByPropertyId: (propertyId) => {
    const improvements = {
      'BC001': [
        {
          id: 1,
          propertyId: 'BC001',
          improvementType: 'Main Building',
          yearBuilt: 1985,
          description: 'Two-story home with attached garage',
          area: 2400
        },
        {
          id: 2,
          propertyId: 'BC001', 
          improvementType: 'Shed',
          yearBuilt: 1990,
          description: 'Garden storage shed',
          area: 120
        }
      ],
      'BC002': [
        {
          id: 3,
          propertyId: 'BC002',
          improvementType: 'Retail Building',
          yearBuilt: 2001,
          description: 'Single-story commercial retail space',
          area: 5500
        },
        {
          id: 4,
          propertyId: 'BC002',
          improvementType: 'Parking Lot',
          yearBuilt: 2001,
          description: 'Paved parking with 24 spaces',
          area: 8000
        }
      ]
    };
    
    return Promise.resolve(improvements[propertyId] || []);
  },
  
  getLandRecordsByPropertyId: (propertyId) => {
    const landRecords = {
      'BC001': [
        {
          id: 1,
          propertyId: 'BC001',
          zoneType: 'R-1',
          landUse: 'Single Family Residential',
          soilType: 'Loam',
          topography: 'Flat',
          floodZone: 'X'
        }
      ],
      'BC002': [
        {
          id: 2,
          propertyId: 'BC002',
          zoneType: 'C-2',
          landUse: 'Commercial Retail',
          soilType: 'Clay',
          topography: 'Slight Grade',
          floodZone: 'X'
        }
      ]
    };
    
    return Promise.resolve(landRecords[propertyId] || []);
  },
  
  getAppealsByPropertyId: (propertyId) => {
    const appeals = {
      'BC001': [],
      'BC002': [
        {
          id: 1,
          propertyId: 'BC002',
          filingDate: '2022-04-15',
          status: 'Resolved',
          reason: 'Value Disputed',
          resolution: 'Assessment adjusted down by 5%',
          appealerId: 101
        }
      ]
    };
    
    return Promise.resolve(appeals[propertyId] || []);
  }
};

async function testPropertyStoryGenerator() {
  try {
    console.log('Testing Property Story Generator...');
    
    // Check if OpenAI API key is valid
    const isApiKeyValid = isOpenAIApiKeyValid();
    console.log(`OpenAI API Key Valid: ${isApiKeyValid ? 'Yes ✓' : 'No ✗'}`);
    
    if (!isApiKeyValid) {
      console.error('OpenAI API key is missing or invalid. Story generation will use template fallback.');
    }
    
    // Initialize the generator
    const generator = new PropertyStoryGenerator(mockStorage);
    
    // Test Case 1: Generate a simple residential property story
    console.log('\nTest Case 1: Generate a simple residential property story');
    const residentialOptions = {
      format: 'simple',
      includeImprovements: true,
      includeLandRecords: true
    };
    
    try {
      const residentialStory = await generator.generatePropertyStory('BC001', residentialOptions);
      console.log('\nResidential Property Story:');
      console.log(residentialStory);
      console.log('\nSimple residential story test PASSED ✓');
    } catch (error) {
      console.error('Simple residential story test FAILED ✗:', error.message);
    }
    
    // Test Case 2: Generate a detailed commercial property story with appeals
    console.log('\nTest Case 2: Generate a detailed commercial property story with appeals');
    const commercialOptions = {
      format: 'detailed',
      includeImprovements: true,
      includeLandRecords: true,
      includeAppeals: true,
      focus: 'market'
    };
    
    try {
      const commercialStory = await generator.generatePropertyStory('BC002', commercialOptions);
      console.log('\nCommercial Property Story:');
      console.log(commercialStory);
      console.log('\nDetailed commercial story test PASSED ✓');
    } catch (error) {
      console.error('Detailed commercial story test FAILED ✗:', error.message);
    }
    
    // Test Case 3: Generate a property comparison
    console.log('\nTest Case 3: Generate a property comparison');
    const comparisonOptions = {
      format: 'detailed',
      focus: 'market'
    };
    
    try {
      const comparisonStory = await generator.generatePropertyComparison(['BC001', 'BC002'], comparisonOptions);
      console.log('\nProperty Comparison:');
      console.log(comparisonStory);
      console.log('\nProperty comparison test PASSED ✓');
    } catch (error) {
      console.error('Property comparison test FAILED ✗:', error.message);
    }
    
    console.log('\nProperty Story Generator tests completed.');
  } catch (error) {
    console.error('Test execution error:', error);
  }
}

// Run the tests
testPropertyStoryGenerator().catch(console.error);