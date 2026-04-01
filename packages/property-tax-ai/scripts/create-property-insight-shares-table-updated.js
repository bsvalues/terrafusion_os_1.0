/**
 * Property Insight Shares Table Creation (Updated)
 * 
 * This script creates the property_insight_shares table for storing
 * shareable property insights, including the new propertyName and propertyAddress fields.
 */

import pg from 'pg';
const { Client } = pg;

async function createPropertyInsightSharesTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to the database');

    // Check if table already exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'property_insight_shares'
      );
    `;
    
    const tableExists = await client.query(checkTableQuery);
    
    if (tableExists.rows[0].exists) {
      console.log('property_insight_shares table already exists, checking for column updates');
      
      // Check if propertyName column exists
      const checkPropertyNameQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'property_insight_shares'
          AND column_name = 'property_name'
        );
      `;
      
      const propertyNameExists = await client.query(checkPropertyNameQuery);
      
      if (!propertyNameExists.rows[0].exists) {
        console.log('Adding property_name column...');
        await client.query(`ALTER TABLE property_insight_shares ADD COLUMN property_name TEXT;`);
      } else {
        console.log('property_name column already exists');
      }
      
      // Check if propertyAddress column exists
      const checkPropertyAddressQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'property_insight_shares'
          AND column_name = 'property_address'
        );
      `;
      
      const propertyAddressExists = await client.query(checkPropertyAddressQuery);
      
      if (!propertyAddressExists.rows[0].exists) {
        console.log('Adding property_address column...');
        await client.query(`ALTER TABLE property_insight_shares ADD COLUMN property_address TEXT;`);
      } else {
        console.log('property_address column already exists');
      }
      
      return;
    }

    // Create the property_insight_shares table with new fields
    const createTableQuery = `
      CREATE TABLE property_insight_shares (
        id SERIAL PRIMARY KEY,
        share_id TEXT NOT NULL UNIQUE,
        property_id TEXT NOT NULL,
        property_name TEXT,
        property_address TEXT,
        title TEXT NOT NULL,
        insight_type TEXT NOT NULL,
        insight_data JSONB NOT NULL,
        format TEXT NOT NULL DEFAULT 'detailed',
        created_by INTEGER,
        access_count INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_public BOOLEAN NOT NULL DEFAULT TRUE,
        password TEXT,
        allowed_domains TEXT[]
      );
    `;

    await client.query(createTableQuery);
    console.log('Successfully created property_insight_shares table');

    // Create indexes for faster lookups
    await client.query(`CREATE INDEX idx_property_insight_shares_property_id ON property_insight_shares(property_id);`);
    await client.query(`CREATE INDEX idx_property_insight_shares_share_id ON property_insight_shares(share_id);`);
    console.log('Successfully created indexes for property_insight_shares table');
  } catch (error) {
    console.error('Error creating property_insight_shares table:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
  }
}

// Run the function
createPropertyInsightSharesTable()
  .then(() => {
    console.log('Property Insight Shares setup complete');
  })
  .catch(error => {
    console.error('Property Insight Shares setup failed:', error);
  });