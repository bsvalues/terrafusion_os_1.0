// Import the storage API
import { storage } from '../server/storage.js';

// Function to seed the database with sample properties
async function seedProperties() {
  try {
    console.log('Seeding database with sample properties...');

    // Create residential property
    const residentialProperty = await storage.createProperty({
      propertyId: 'BC101',
      status: 'active',
      address: '420 Orchard Lane, Kennewick, WA 99336',
      parcelNumber: '1-2345-678-9012',
      propertyType: 'residential',
      acres: '0.25',
      value: '450000',
    });
    console.log(`Created residential property: ${residentialProperty.propertyId}`);

    // Create residential improvements
    await storage.createImprovement({
      propertyId: 'BC101',
      improvementType: 'single_family_home',
      yearBuilt: 1998,
      squareFeet: '2450',
      bedrooms: 4,
      bathrooms: '2.5',
      quality: 'above_average',
      condition: 'good',
    });

    // Create residential land record
    await storage.createLandRecord({
      propertyId: 'BC101',
      zoning: 'R1',
      landUseCode: 'single_family',
      topography: 'level',
      frontage: '75ft',
      depth: '150ft',
      shape: 'rectangular',
      utilities: 'all_public',
      floodZone: 'none',
    });

    // Create agricultural property
    const agriculturalProperty = await storage.createProperty({
      propertyId: 'BC102',
      status: 'active',
      address: '5200 Vineyard Road, Benton City, WA 99320',
      parcelNumber: '2-3456-789-0123',
      propertyType: 'agricultural',
      acres: '45.8',
      value: '1250000',
    });
    console.log(`Created agricultural property: ${agriculturalProperty.propertyId}`);

    // Create agricultural improvements
    await storage.createImprovement({
      propertyId: 'BC102',
      improvementType: 'farm_building',
      yearBuilt: 1985,
      squareFeet: '4800',
      bedrooms: null,
      bathrooms: '1',
      quality: 'average',
      condition: 'fair',
    });

    await storage.createImprovement({
      propertyId: 'BC102',
      improvementType: 'residence',
      yearBuilt: 1992,
      squareFeet: '1850',
      bedrooms: 3,
      bathrooms: '2',
      quality: 'average',
      condition: 'good',
    });

    // Create agricultural land record
    await storage.createLandRecord({
      propertyId: 'BC102',
      zoning: 'Agricultural',
      landUseCode: 'vineyards',
      topography: 'sloping',
      frontage: '600ft',
      depth: '3300ft',
      shape: 'irregular',
      utilities: 'well_septic',
      floodZone: 'partial',
    });

    // Create agricultural fields
    await storage.createField({
      propertyId: 'BC102',
      fieldType: 'vineyard',
      fieldValue: 'Cabernet Sauvignon, 18 acres',
    });

    await storage.createField({
      propertyId: 'BC102',
      fieldType: 'vineyard',
      fieldValue: 'Merlot, 12 acres',
    });

    await storage.createField({
      propertyId: 'BC102',
      fieldType: 'orchard',
      fieldValue: 'Apple, 8 acres',
    });

    // Create commercial property
    const commercialProperty = await storage.createProperty({
      propertyId: 'BC103',
      status: 'active',
      address: '1400 Columbia Center Blvd, Kennewick, WA 99336',
      parcelNumber: '3-4567-890-1234',
      propertyType: 'commercial',
      acres: '1.5',
      value: '2750000',
    });
    console.log(`Created commercial property: ${commercialProperty.propertyId}`);

    // Create commercial improvements
    await storage.createImprovement({
      propertyId: 'BC103',
      improvementType: 'retail_building',
      yearBuilt: 2005,
      squareFeet: '14500',
      bedrooms: null,
      bathrooms: '4',
      quality: 'high',
      condition: 'excellent',
    });

    // Create commercial land record
    await storage.createLandRecord({
      propertyId: 'BC103',
      zoning: 'C-3',
      landUseCode: 'retail',
      topography: 'level',
      frontage: '250ft',
      depth: '260ft',
      shape: 'rectangular',
      utilities: 'all_public',
      floodZone: 'none',
    });

    console.log('Sample property seeding complete!');
    console.log('You can now test the Property Story Generator with the following property IDs:');
    console.log('- BC101 (Residential)');
    console.log('- BC102 (Agricultural)');
    console.log('- BC103 (Commercial)');
  } catch (error) {
    console.error('Error seeding properties:', error);
  }
}

// Execute the function
seedProperties();
