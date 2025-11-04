/**
 * Database Module
 *
 * Primary export point for database utilities and functions.
 */
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";
import { runStartupChecks, checkDatabaseConnection } from "./startup-check.js";
import { checkSchema } from "./schema-check.js";
import { runMigrations } from "./migrate.js";

// Configure Neon to use the WebSocket library
import { neonConfig } from "@neondatabase/serverless";
neonConfig.webSocketConstructor = ws as any; // Cast to any to avoid TypeScript issues
neonConfig.wsProxy = (url) => url; // Use direct WebSocket connection

// Database connection setup
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Re-export all database utilities
export const dbStartupChecks = runStartupChecks;
export const validateSchema = checkSchema;
export const migrateDatabase = runMigrations;

/**
 * Find a property by any identifier (parcelId, taxParcelId, or propertyIdentifier)
 *
 * @param identifier The property identifier to search for
 * @returns The property if found, undefined otherwise
 */
export async function findPropertyByAnyIdentifier(identifier: string) {
  if (!identifier) {
    return undefined;
  }

  // Use the properties table from the schema
  const { properties } = schema;

  try {
    // Search by any of the identifier fields
    const results = await db.query.properties.findMany({
      where: (properties, { or, eq }) =>
        or(
          eq(properties.parcelId, identifier),
          eq(properties.taxParcelId, identifier),
          eq(properties.propertyIdentifier, identifier)
        ),
      limit: 1,
    });

    return results.length > 0 ? results[0] : undefined;
  } catch (error) {
    console.error("Error finding property by identifier:", error);
    return undefined;
  }
}
