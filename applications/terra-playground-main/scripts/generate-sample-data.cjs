/**
 * Generate Sample Data Script
 * 
 * This script creates sample property data to demonstrate the Property Story Generator.
 * It creates a variety of property types with different characteristics to showcase
 * the AI's ability to generate diverse property narratives.
 * 
 * Usage: node scripts/generate-sample-data.cjs
 */

// Use CommonJS require due to module issues
const { storage } = require('../server/storage');

async function generateSampleData() {
  try {
    console.log('Generating sample property data...');
    
    // Create residential property
    const residentialProperty = await storage.createProperty({
      propertyId: "BC101",
      status: "active",
      address: "420 Orchard Lane, Kennewick, WA 99336",
      parcelNumber: "1-2345-678-9012",
      propertyType: "residential",
      acres: "0.25",
      value: "450000"
    });
    console.log(`Created residential property: ${residentialProperty.propertyId}`);
    
    // Create residential improvements
    await storage.createImprovement({
      propertyId: "BC101",
      improvementType: "single_family_home",
      yearBuilt: 1998,
      squareFeet: "2450",
      bedrooms: 4,
      bathrooms: "2.5",
      quality: "above_average",
      condition: "good"
    });
    
    // Create residential land record
    await storage.createLandRecord({
      propertyId: "BC101",
      zoning: "R1",
      landUseCode: "single_family",
      topography: "level",
      frontage: "75ft",
      depth: "150ft",
      shape: "rectangular",
      utilities: "all_public",
      floodZone: "none"
    });
    
    // Create agricultural property
    const agriculturalProperty = await storage.createProperty({
      propertyId: "BC102",
      status: "active",
      address: "5200 Vineyard Road, Benton City, WA 99320",
      parcelNumber: "2-3456-789-0123",
      propertyType: "agricultural",
      acres: "45.8",
      value: "1250000"
    });
    console.log(`Created agricultural property: ${agriculturalProperty.propertyId}`);
    
    // Create agricultural improvements
    await storage.createImprovement({
      propertyId: "BC102",
      improvementType: "farm_building",
      yearBuilt: 1985,
      squareFeet: "4800",
      bedrooms: null,
      bathrooms: "1",
      quality: "average",
      condition: "fair"
    });
    
    await storage.createImprovement({
      propertyId: "BC102",
      improvementType: "residence",
      yearBuilt: 1992,
      squareFeet: "1850",
      bedrooms: 3,
      bathrooms: "2",
      quality: "average",
      condition: "good"
    });
    
    // Create agricultural land record
    await storage.createLandRecord({
      propertyId: "BC102",
      zoning: "Agricultural",
      landUseCode: "vineyards",
      topography: "sloping",
      frontage: "600ft",
      depth: "3300ft",
      shape: "irregular",
      utilities: "well_septic",
      floodZone: "partial"
    });
    
    // Create agricultural fields
    await storage.createField({
      propertyId: "BC102",
      fieldType: "vineyard",
      fieldValue: "Cabernet Sauvignon, 18 acres"
    });
    
    await storage.createField({
      propertyId: "BC102",
      fieldType: "vineyard",
      fieldValue: "Merlot, 12 acres"
    });
    
    await storage.createField({
      propertyId: "BC102",
      fieldType: "orchard",
      fieldValue: "Apple, 8 acres"
    });
    
    // Create commercial property
    const commercialProperty = await storage.createProperty({
      propertyId: "BC103",
      status: "active",
      address: "1400 Columbia Center Blvd, Kennewick, WA 99336",
      parcelNumber: "3-4567-890-1234",
      propertyType: "commercial",
      acres: "1.5",
      value: "2750000"
    });
    console.log(`Created commercial property: ${commercialProperty.propertyId}`);
    
    // Create commercial improvements
    await storage.createImprovement({
      propertyId: "BC103",
      improvementType: "retail_building",
      yearBuilt: 2005,
      squareFeet: "14500",
      bedrooms: null,
      bathrooms: "4",
      quality: "high",
      condition: "excellent"
    });
    
    // Create commercial land record
    await storage.createLandRecord({
      propertyId: "BC103",
      zoning: "C-3",
      landUseCode: "retail",
      topography: "level",
      frontage: "250ft",
      depth: "260ft",
      shape: "rectangular",
      utilities: "all_public",
      floodZone: "none"
    });
    
    // Create audit logs for all properties
    await storage.createAuditLog({
      userId: 1,
      action: "CREATE",
      entityType: "property",
      entityId: "BC101",
      details: { source: "sample_data_generation" },
      ipAddress: "127.0.0.1"
    });
    
    await storage.createAuditLog({
      userId: 1,
      action: "CREATE",
      entityType: "property",
      entityId: "BC102",
      details: { source: "sample_data_generation" },
      ipAddress: "127.0.0.1"
    });
    
    await storage.createAuditLog({
      userId: 1,
      action: "CREATE",
      entityType: "property",
      entityId: "BC103",
      details: { source: "sample_data_generation" },
      ipAddress: "127.0.0.1"
    });
    
    // Create system activity for data generation
    await storage.createSystemActivity({
      activity: "Generated sample property data for demonstration",
      agentId: 1, // Data Management Agent
      entityType: "property",
      entityId: null
    });
    
    console.log('Sample data generation complete!');
    console.log('You can now test the Property Story Generator with the following property IDs:');
    console.log('- BC101 (Residential)');
    console.log('- BC102 (Agricultural)');
    console.log('- BC103 (Commercial)');
    console.log('\nTry the following API endpoints:');
    console.log('1. GET /api/property-stories/BC101 - Get a story for the residential property');
    console.log('2. POST /api/property-stories/multiple - Get stories for multiple properties at once');
    console.log('   Request body: { "propertyIds": ["BC101", "BC102", "BC103"] }');
    console.log('3. POST /api/property-stories/compare - Compare properties');
    console.log('   Request body: { "propertyIds": ["BC101", "BC102", "BC103"] }');
    
  } catch (error) {
    console.error('Error generating sample data:', error);
  }
}

// Execute the function
generateSampleData();