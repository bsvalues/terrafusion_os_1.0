import { pool, db } from "../db";
import fs from "fs";
import path from "path";
import { eq, sql } from "drizzle-orm";

/**
 * Robust Migration System for Terrafusion Platform
 *
 * This migration system:
 * 1. Detects and runs pending migrations
 * 2. Handles exceptions gracefully
 * 3. Ensures atomicity within each migration
 * 4. Provides comprehensive logging
 * 5. Safely handles Replit environment issues
 */

// Directory where migration files are stored
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

// Interface for migration information
interface Migration {
  version: string;
  path: string;
  filename: string;
  description: string;
}

/**
 * Ensure schema_version table exists
 */
async function ensureSchemaVersionTable() {
  try {
    // Check if schema_version table exists
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_version'
      )
    `);

    const tableExists = result.rows[0].exists;

    if (!tableExists) {
      console.log("Creating schema_version table...");

      // Create schema_version table
      await pool.query(`
        CREATE TABLE schema_version (
          version TEXT PRIMARY KEY,
          applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          description TEXT,
          success BOOLEAN NOT NULL DEFAULT TRUE,
          error_message TEXT
        )
      `);

      console.log("Created schema_version table");
    }
  } catch (error) {
    console.error("Error ensuring schema_version table:", error);
    throw error;
  }
}

/**
 * Get all available migrations from the migrations directory
 */
function getAvailableMigrations(): Migration[] {
  // Get all SQL files in the migrations directory
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  // Parse migrations
  return files.map((file) => {
    // Parse version from filename (expected format: YYYYMMDDHHMMSS_name.sql)
    const version = file.split("_")[0];

    // Read file content to extract description
    const content = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    const descriptionMatch = content.match(/-- Description: (.*)/);
    const description = descriptionMatch ? descriptionMatch[1].trim() : "No description";

    return {
      version,
      path: path.join(MIGRATIONS_DIR, file),
      filename: file,
      description,
    };
  });
}

/**
 * Get all applied migrations from the database
 */
async function getAppliedMigrations(): Promise<string[]> {
  try {
    // Get all applied migrations using raw query since we don't have schema_version in our schema
    const result = await pool.query(`
      SELECT version
      FROM schema_version
      WHERE success = true
      ORDER BY version
    `);

    // Return array of version strings
    return result.rows.map((row) => row.version);
  } catch (error) {
    // If the table doesn't exist yet, return empty array
    console.error("Error getting applied migrations:", error);
    return [];
  }
}

/**
 * Apply a migration
 */
async function applyMigration(migration: Migration): Promise<boolean> {
  // Start a transaction for atomicity
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    console.log(`Applying migration ${migration.version}: ${migration.description}`);

    // Read migration file
    const sql = fs.readFileSync(migration.path, "utf8");

    // Execute migration
    await client.query(sql);

    // Record migration in schema_version table
    await client.query(`INSERT INTO schema_version (version, description) VALUES ($1, $2)`, [
      migration.version,
      migration.description,
    ]);

    // Commit transaction
    await client.query("COMMIT");

    console.log(`Successfully applied migration ${migration.version}`);
    return true;
  } catch (error) {
    // Rollback transaction on error
    await client.query("ROLLBACK");

    console.error(`Error applying migration ${migration.version}:`, error);

    // Record failed migration
    try {
      // Cast error to type with message property
      const errorMessage = error instanceof Error ? error.message : String(error);

      await client.query(
        `INSERT INTO schema_version (version, description, success, error_message) 
         VALUES ($1, $2, $3, $4)`,
        [migration.version, migration.description, false, errorMessage]
      );
    } catch (recordError) {
      console.error("Error recording failed migration:", recordError);
    }

    return false;
  } finally {
    // Release client back to pool
    client.release();
  }
}

/**
 * Run pending migrations
 */
export async function runPendingMigrations(force: boolean = false): Promise<boolean> {
  try {
    console.log("Checking for pending migrations...");

    // Ensure schema_version table exists
    await ensureSchemaVersionTable();

    // Get available migrations
    const availableMigrations = getAvailableMigrations();
    console.log(`Found ${availableMigrations.length} migration files`);

    // Get applied migrations
    const appliedVersions = await getAppliedMigrations();
    console.log(`${appliedVersions.length} migrations already applied`);

    // Filter for pending migrations
    const pendingMigrations = availableMigrations.filter(
      (migration) => !appliedVersions.includes(migration.version)
    );

    if (pendingMigrations.length === 0) {
      console.log("✅ No pending migrations to apply");
      return true;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations to apply`);

    // Apply each pending migration
    let allSuccessful = true;
    for (const migration of pendingMigrations) {
      const success = await applyMigration(migration);
      if (!success && !force) {
        allSuccessful = false;
        break;
      }
    }

    if (allSuccessful) {
      console.log("✅ All migrations applied successfully");
    } else {
      console.error("❌ Some migrations failed to apply");
    }

    return allSuccessful;
  } catch (error) {
    console.error("Error running migrations:", error);
    return false;
  }
}

/**
 * Get current schema version
 */
export async function getCurrentSchemaVersion(): Promise<string | null> {
  try {
    // Ensure schema_version table exists
    await ensureSchemaVersionTable();

    // Get most recent successful migration using raw query
    const result = await pool.query(`
      SELECT version, applied_at
      FROM schema_version
      WHERE success = true
      ORDER BY version DESC
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      const { version, applied_at } = result.rows[0];
      console.log(`📋 Current schema version: ${version} (applied at ${applied_at})`);
      return version;
    }

    return null;
  } catch (error) {
    console.error("Error getting current schema version:", error);
    return null;
  }
}

/**
 * Run this function from the command line to apply pending migrations
 */
if (require.main === module) {
  (async () => {
    try {
      // Check for --force flag
      const force = process.argv.includes("--force");

      await runPendingMigrations(force);

      // Get current schema version
      const currentVersion = await getCurrentSchemaVersion();
      console.log(`Current schema version: ${currentVersion || "None"}`);

      process.exit(0);
    } catch (error) {
      console.error("Migration failed:", error);
      process.exit(1);
    }
  })();
}
