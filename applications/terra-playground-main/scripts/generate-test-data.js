/**
 * Generate Test Data Script
 *
 * This script creates sample property data to demonstrate the Property Story Generator.
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import * as schema from '../shared/schema.ts';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function generateTestData() {
  try {
    console.log('Generating sample property data...');

    // Create residential property
    await db
      .insert(schema.properties)
      .values({
        propertyId: 'BC101',
        status: 'active',
        address: '420 Orchard Lane, Kennewick, WA 99336',
        parcelNumber: '1-2345-678-9012',
        propertyType: 'residential',
        acres: '0.25',
        value: '450000',
      })
      .onConflictDoNothing()
      .execute();

    console.log(`Created residential property: BC101`);

    // Create residential improvements
    await db
      .insert(schema.improvements)
      .values({
        propertyId: 'BC101',
        improvementType: 'single_family_home',
        yearBuilt: 1998,
        squareFeet: '2450',
        bedrooms: 4,
        bathrooms: '2.5',
        quality: 'above_average',
        condition: 'good',
      })
      .onConflictDoNothing()
      .execute();

    // Create residential land record
    await db
      .insert(schema.landRecords)
      .values({
        propertyId: 'BC101',
        zoning: 'R1',
        landUseCode: 'single_family',
        topography: 'level',
        frontage: 75,
        depth: 150,
        shape: 'rectangular',
        utilities: 'all_public',
        floodZone: 'none',
      })
      .onConflictDoNothing()
      .execute();

    // Create agricultural property
    await db
      .insert(schema.properties)
      .values({
        propertyId: 'BC102',
        status: 'active',
        address: '5200 Vineyard Road, Benton City, WA 99320',
        parcelNumber: '2-3456-789-0123',
        propertyType: 'agricultural',
        acres: '45.8',
        value: '1250000',
      })
      .onConflictDoNothing()
      .execute();

    console.log(`Created agricultural property: BC102`);

    // Create agricultural improvements
    await db
      .insert(schema.improvements)
      .values({
        propertyId: 'BC102',
        improvementType: 'farm_building',
        yearBuilt: 1985,
        squareFeet: '4800',
        bedrooms: null,
        bathrooms: '1',
        quality: 'average',
        condition: 'fair',
      })
      .onConflictDoNothing()
      .execute();

    await db
      .insert(schema.improvements)
      .values({
        propertyId: 'BC102',
        improvementType: 'residence',
        yearBuilt: 1992,
        squareFeet: '1850',
        bedrooms: 3,
        bathrooms: '2',
        quality: 'average',
        condition: 'good',
      })
      .onConflictDoNothing()
      .execute();

    // Create agricultural land record
    await db
      .insert(schema.landRecords)
      .values({
        propertyId: 'BC102',
        zoning: 'Agricultural',
        landUseCode: 'vineyards',
        topography: 'sloping',
        frontage: 600,
        depth: 3300,
        shape: 'irregular',
        utilities: 'well_septic',
        floodZone: 'partial',
      })
      .onConflictDoNothing()
      .execute();

    // Create agricultural fields
    await db
      .insert(schema.fields)
      .values({
        propertyId: 'BC102',
        fieldType: 'vineyard',
        fieldValue: 'Cabernet Sauvignon, 18 acres',
      })
      .onConflictDoNothing()
      .execute();

    await db
      .insert(schema.fields)
      .values({
        propertyId: 'BC102',
        fieldType: 'vineyard',
        fieldValue: 'Merlot, 12 acres',
      })
      .onConflictDoNothing()
      .execute();

    await db
      .insert(schema.fields)
      .values({
        propertyId: 'BC102',
        fieldType: 'orchard',
        fieldValue: 'Apple, 8 acres',
      })
      .onConflictDoNothing()
      .execute();

    // Create commercial property
    await db
      .insert(schema.properties)
      .values({
        propertyId: 'BC103',
        status: 'active',
        address: '1400 Columbia Center Blvd, Kennewick, WA 99336',
        parcelNumber: '3-4567-890-1234',
        propertyType: 'commercial',
        acres: '1.5',
        value: '2750000',
      })
      .onConflictDoNothing()
      .execute();

    console.log(`Created commercial property: BC103`);

    // Create commercial improvements
    await db
      .insert(schema.improvements)
      .values({
        propertyId: 'BC103',
        improvementType: 'retail_building',
        yearBuilt: 2005,
        squareFeet: '14500',
        bedrooms: null,
        bathrooms: '4',
        quality: 'high',
        condition: 'excellent',
      })
      .onConflictDoNothing()
      .execute();

    // Create commercial land record
    await db
      .insert(schema.landRecords)
      .values({
        propertyId: 'BC103',
        zoning: 'C-3',
        landUseCode: 'retail',
        topography: 'level',
        frontage: 250,
        depth: 260,
        shape: 'rectangular',
        utilities: 'all_public',
        floodZone: 'none',
      })
      .onConflictDoNothing()
      .execute();

    // Create audit logs for all properties
    await db
      .insert(schema.auditLogs)
      .values({
        userId: 1,
        action: 'CREATE',
        entityType: 'property',
        entityId: 'BC101',
        details: { source: 'sample_data_generation' },
        ipAddress: '127.0.0.1',
      })
      .onConflictDoNothing()
      .execute();

    await db
      .insert(schema.auditLogs)
      .values({
        userId: 1,
        action: 'CREATE',
        entityType: 'property',
        entityId: 'BC102',
        details: { source: 'sample_data_generation' },
        ipAddress: '127.0.0.1',
      })
      .onConflictDoNothing()
      .execute();

    await db
      .insert(schema.auditLogs)
      .values({
        userId: 1,
        action: 'CREATE',
        entityType: 'property',
        entityId: 'BC103',
        details: { source: 'sample_data_generation' },
        ipAddress: '127.0.0.1',
      })
      .onConflictDoNothing()
      .execute();

    // Create system activity for data generation
    await db
      .insert(schema.systemActivities)
      .values({
        activity: 'Generated sample property data for demonstration',
        agentId: 1, // Data Management Agent
        entityType: 'property',
        entityId: null,
      })
      .onConflictDoNothing()
      .execute();

    console.log('Sample data generation complete!');
    console.log('You can now test the Property Story Generator with the following property IDs:');
    console.log('- BC101 (Residential)');
    console.log('- BC102 (Agricultural)');
    console.log('- BC103 (Commercial)');

    // Close the connection
    await pool.end();
  } catch (error) {
    console.error('Error generating sample data:', error);
    // Close the connection even if there's an error
    await pool.end();
  }
}

// Execute the function
generateTestData();
