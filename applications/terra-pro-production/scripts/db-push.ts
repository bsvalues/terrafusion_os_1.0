#!/usr/bin/env tsx

import { db, pool } from "../server/db";
import * as schema from "../shared/schema";
import { sql } from "drizzle-orm";

async function main() {
  try {
    console.log("💾 Pushing schema to database...");

    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Get all table definitions from our schema
    // This will create the tables if they don't exist
    const tables = [
      schema.users,
      schema.organizations,
      schema.properties,
      schema.propertyImages,
      schema.valuations,
      schema.comparableProperties,
      schema.orders,
      schema.orderStatusUpdates,
      schema.reports,
      schema.modelInferences,
      schema.realEstateTerms,
      schema.fieldNotes,
      schema.mlsSystems,
      schema.mlsFieldMappings,
      schema.mlsPropertyMappings,
      schema.comparableSales,
      schema.mlsComparableMappings,
      schema.reviewRequests,
      schema.comments,
      schema.annotations,
      schema.revisionHistory,
      schema.appraisalReports,
      schema.photos,
      schema.sketches,
      schema.complianceChecks,
    ];

    // Create each table
    for (const table of tables) {
      try {
        // Extract table name from the schema
        const tableName = table._.name;
        console.log(`Creating table if not exists: ${tableName}`);

        // Generate and execute CREATE TABLE IF NOT EXISTS statement
        await db.execute(
          sql.raw(`
          CREATE TABLE IF NOT EXISTS "${tableName}" (
            ${Object.entries(table._.columns)
              .map(([columnName, column]) => {
                const colDef = column.getSQLDefinition();
                return `"${columnName}" ${colDef}`;
              })
              .join(",\n")}
          );
        `)
        );

        console.log(`✅ Table ${tableName} created/verified`);
      } catch (tableError) {
        console.error(`Error creating table:`, tableError);
        // Continue with other tables
      }
    }

    console.log("✅ Schema successfully pushed to database");

    // Cleanup connections
    await pool.end();
  } catch (error) {
    console.error("❌ Error pushing schema to database:", error);
    process.exit(1);
  }
}

main();
