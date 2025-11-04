// Using ESM format
import { createClient } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { properties, improvements, landRecords, fields } from '../server/db/schema.js';

// Function to seed sample property data
async function seedData() {
  // Connect to the database
  const client = createClient({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(client);

  try {
    console.log('Seeding sample property data...');

    // Create residential property
    await db
      .insert(properties)
      .values({
        propertyId: 'BC101',
        status: 'active',
        address: '420 Orchard Lane, Kennewick, WA 99336',
        parcelNumber: '1-2345-678-9012',
        propertyType: 'residential',
        acres: '0.25',
        value: '450000',
      })
      .onConflictDoUpdate({
        target: properties.propertyId,
        set: {
          status: 'active',
          address: '420 Orchard Lane, Kennewick, WA 99336',
          parcelNumber: '1-2345-678-9012',
          propertyType: 'residential',
          acres: '0.25',
          value: '450000',
        },
      });

    // Create residential improvements
    await db.insert(improvements).values({
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
    await db.insert(landRecords).values({
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

    console.log('Sample data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await client.end();
  }
}

seedData();
