import { db } from "../server/db";
import { realEstateTerms } from "../shared/schema";
import { sql } from "drizzle-orm";

async function createRealEstateTermsTable() {
  try {
    // Check if the table exists
    const result = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'real_estate_terms'
      );
    `);

    const tableExists = result.rows[0].exists;

    if (tableExists) {
      console.log("Table real_estate_terms already exists.");
      return;
    }

    // Create the real_estate_terms table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS real_estate_terms (
        id SERIAL PRIMARY KEY,
        term TEXT NOT NULL UNIQUE,
        definition TEXT NOT NULL,
        category TEXT NOT NULL,
        contextual_explanation TEXT,
        examples JSONB DEFAULT '[]',
        related_terms JSONB DEFAULT '[]',
        is_common BOOLEAN DEFAULT FALSE NOT NULL,
        source TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    console.log("Successfully created real_estate_terms table.");
  } catch (error) {
    console.error("Error creating real_estate_terms table:", error);
  } finally {
    process.exit(0);
  }
}

createRealEstateTermsTable();
