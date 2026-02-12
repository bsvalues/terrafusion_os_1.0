/**
 * Property Insight Shares Table Creation
 *
 * This script creates the property_insight_shares table for storing
 * shareable property insights.
 */

const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

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
      console.log('property_insight_shares table already exists, skipping creation');
      return;
    }

    // Create the property_insight_shares table
    const createTableQuery = `
      CREATE TABLE property_insight_shares (
        id SERIAL PRIMARY KEY,
        share_id TEXT NOT NULL UNIQUE,
        property_id TEXT NOT NULL,
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
    await client.query(
      `CREATE INDEX idx_property_insight_shares_property_id ON property_insight_shares(property_id);`
    );
    await client.query(
      `CREATE INDEX idx_property_insight_shares_share_id ON property_insight_shares(share_id);`
    );
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
