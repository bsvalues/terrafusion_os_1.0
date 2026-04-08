/**
 * Update Property Insight Shares Schema
 * 
 * This script adds propertyName and propertyAddress columns to the property_insight_shares table
 * to provide better context when sharing property insights.
 */

import pg from 'pg';
const { Pool } = pg;

// Create a PostgreSQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function updatePropertyInsightSharesSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Starting property_insight_shares schema update...');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if columns already exist to avoid errors
    const propertyNameExists = await checkColumnExists(client, 'property_insight_shares', 'property_name');
    const propertyAddressExists = await checkColumnExists(client, 'property_insight_shares', 'property_address');
    
    // Add propertyName column if it doesn't exist
    if (!propertyNameExists) {
      console.log('Adding property_name column...');
      await client.query(`
        ALTER TABLE property_insight_shares 
        ADD COLUMN property_name TEXT
      `);
    } else {
      console.log('property_name column already exists');
    }
    
    // Add propertyAddress column if it doesn't exist
    if (!propertyAddressExists) {
      console.log('Adding property_address column...');
      await client.query(`
        ALTER TABLE property_insight_shares 
        ADD COLUMN property_address TEXT
      `);
    } else {
      console.log('property_address column already exists');
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('Schema update completed successfully.');
  } catch (error) {
    // Roll back the transaction if there's an error
    await client.query('ROLLBACK');
    console.error('Error updating schema:', error);
    throw error;
  } finally {
    // Release the client back to the pool
    client.release();
    await pool.end();
  }
}

async function checkColumnExists(client, tableName, columnName) {
  const result = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = $1
    AND column_name = $2
  `, [tableName, columnName]);
  
  return result.rows.length > 0;
}

// Execute the function
updatePropertyInsightSharesSchema()
  .then(() => {
    console.log('Schema update script completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Schema update script failed:', error);
    process.exit(1);
  });