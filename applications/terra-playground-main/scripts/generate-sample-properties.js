/**
 * Generate Sample Properties Script
 *
 * This script creates sample property data directly using the storage interface,
 * bypassing the API endpoints and authentication middleware.
 */

import { storage } from '../server/storage.ts';

async function generateSampleProperties() {
  try {
    console.log('Generating sample property data...');

    // Check if properties already exist
    const existingProperties = await storage.getAllProperties();

    if (existingProperties.length > 0) {
      console.log(`Sample properties already exist (${existingProperties.length} records found)`);
      return;
    }

    // Sample property data
    const sampleProperties = [
      {
        propertyId: 'R123456',
        address: '123 Main St, Corvallis, OR 97330',
        parcelNumber: '11223344',
        propertyType: 'Residential',
        acres: '0.25',
        value: '450000',
        status: 'active',
        extraFields: {
          yearBuilt: 1998,
          bedrooms: 4,
          bathrooms: 2.5,
          squareFeet: 2400,
          zoning: 'R-1',
          garageType: 'Attached',
          foundation: 'Concrete',
          roofType: 'Composition Shingle',
        },
      },
      {
        propertyId: 'R987654',
        address: '456 Oak Ave, Corvallis, OR 97330',
        parcelNumber: '22334455',
        propertyType: 'Residential',
        acres: '0.15',
        value: '375000',
        status: 'active',
        extraFields: {
          yearBuilt: 1975,
          bedrooms: 3,
          bathrooms: 2,
          squareFeet: 1850,
          zoning: 'R-1',
          garageType: 'Detached',
          foundation: 'Concrete',
          roofType: 'Metal',
        },
      },
      {
        propertyId: 'C654321',
        address: '789 Business Loop, Corvallis, OR 97330',
        parcelNumber: '33445566',
        propertyType: 'Commercial',
        acres: '0.5',
        value: '850000',
        status: 'active',
        extraFields: {
          yearBuilt: 2005,
          squareFeet: 5200,
          zoning: 'C-1',
          occupancyType: 'Retail',
          parkingSpaces: 22,
          loadingDocks: 1,
          constructionType: 'Steel Frame',
        },
      },
      {
        propertyId: 'A112233',
        address: '1000 Farm Road, Philomath, OR 97370',
        parcelNumber: '44556677',
        propertyType: 'Agricultural',
        acres: '42.7',
        value: '1200000',
        status: 'active',
        extraFields: {
          soilType: 'Clay Loam',
          waterRights: true,
          irrigationSystem: 'Sprinkler',
          cropType: 'Mixed Use',
          improvements: 'Barn, Equipment Shed, Well',
        },
      },
    ];

    // Create each property
    for (const propertyData of sampleProperties) {
      await storage.createProperty(propertyData);
      console.log(`Created property: ${propertyData.propertyId}`);
    }

    console.log(`Successfully created ${sampleProperties.length} sample properties.`);
  } catch (error) {
    console.error('Error generating property data:', error);
  }
}

// Run the function
generateSampleProperties();
