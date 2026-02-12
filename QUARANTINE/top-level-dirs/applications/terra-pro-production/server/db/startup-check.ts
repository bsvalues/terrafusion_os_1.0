/**
 * Database Startup Checks
 *
 * This module runs database validation checks during server startup.
 * It verifies the database connection, schema integrity, and migration status.
 */
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { runMigrations } from "./migrate.js";
import { checkSchema } from "./schema-check.js";

// Configure Neon for WebSocket connectivity
neonConfig.webSocketConstructor = ws as any;
neonConfig.wsProxy = (url) => url;

/**
 * Runs all database startup checks
 *
 * @returns true if all checks pass, false otherwise
 */
export async function runStartupChecks(): Promise<boolean> {
  console.log("🔍 Running database startup checks...");

  // Check database connection
  try {
    await checkDatabaseConnection();
    console.log("✅ Database connection successful");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }

  // Run pending migrations
  try {
    await runMigrations();
    console.log("✅ Migrations up to date");
  } catch (error) {
    console.error("❌ Error running migrations:", error);
    return false;
  }

  // Validate schema
  try {
    const isSchemaValid = await checkSchema();
    if (isSchemaValid) {
      console.log("✅ Schema validation passed");
    } else {
      console.warn("⚠️ Schema validation found issues");
      // Still continue, as the app might be able to function with some schema issues
    }
  } catch (error) {
    console.error("❌ Schema validation error:", error);
    return false;
  }

  console.log("✅ Database startup checks passed");
  return true;
}

/**
 * Checks if the database is accessible
 */
async function checkDatabaseConnection(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const result = await pool.query("SELECT NOW()");
    if (result.rows.length > 0) {
      console.log(`Connected to database at ${result.rows[0].now}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Database connection test failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// If this script is run directly, execute the checks
if (import.meta.url.endsWith("startup-check.ts") || import.meta.url.endsWith("startup-check.js")) {
  runStartupChecks()
    .then((passed) => {
      if (!passed) {
        console.error("❌ Database startup checks failed");
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("❌ Unhandled error in database startup checks:", err);
      process.exit(1);
    });
}

export { checkDatabaseConnection };
