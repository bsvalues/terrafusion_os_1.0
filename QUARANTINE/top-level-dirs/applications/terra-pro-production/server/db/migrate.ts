/**
 * Database Migration Runner
 *
 * This script runs all pending SQL migrations from the migrations directory.
 * Migrations are run in order based on their timestamp prefixes.
 *
 * Usage: npx tsx server/db/migrate.ts
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Configure Neon for WebSocket connectivity
neonConfig.webSocketConstructor = ws as any;
neonConfig.wsProxy = (url) => url;

// Get directory name for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to migrations directory
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

/**
 * Runs all pending migrations
 */
async function runMigrations(): Promise<void> {
  console.log("🔄 Checking for migrations to run...");

  // Make sure migrations directory exists
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    console.log(`Created migrations directory at ${MIGRATIONS_DIR}`);
  }

  // Connect to database
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL must be set");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Check if schema_version table exists
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'schema_version'
      )
    `);

    // If the table doesn't exist, create it with our structure
    if (!tableExists.rows[0].exists) {
      console.log("Creating schema_version table");
      await pool.query(`
        CREATE TABLE schema_version (
          id SERIAL PRIMARY KEY,
          version VARCHAR(255) NOT NULL,
          description TEXT,
          applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);
    }

    // Get list of already applied migrations
    const appliedResult = await pool.query(`
      SELECT version FROM schema_version ORDER BY version
    `);
    const appliedVersions = appliedResult.rows.map((row) => row.version);

    // Get list of migration files
    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith(".sql"))
      .sort(); // Sort by filename (which starts with timestamp)

    console.log(`Found ${migrationFiles.length} migration files`);
    console.log(`${appliedVersions.length} migrations already applied`);

    // Determine which migrations need to be applied
    const pendingMigrations = migrationFiles.filter((filename) => {
      // Extract version from filename
      const version = filename.split("_")[0];
      return !appliedVersions.includes(version);
    });

    if (pendingMigrations.length === 0) {
      console.log("✅ No pending migrations to apply");
      return;
    }

    console.log(`🔄 Applying ${pendingMigrations.length} pending migrations...`);

    // Start a transaction for all migrations
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Apply each pending migration
      for (const filename of pendingMigrations) {
        const migrationPath = path.join(MIGRATIONS_DIR, filename);
        const sql = fs.readFileSync(migrationPath, "utf8");

        console.log(`Applying migration: ${filename}`);

        // Execute the migration SQL
        await client.query(sql);
      }

      // Commit the transaction
      await client.query("COMMIT");
      console.log("✅ Successfully applied all migrations");
    } catch (error) {
      // Rollback in case of error
      await client.query("ROLLBACK");
      console.error("❌ Error applying migrations:", error);
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ Migration error:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this script is executed directly
if (import.meta.url.endsWith("migrate.ts") || import.meta.url.endsWith("migrate.js")) {
  runMigrations()
    .then(() => {
      console.log("✅ Migration complete");
    })
    .catch((err) => {
      console.error("❌ Unhandled error in migration:", err);
      process.exit(1);
    });
}

export { runMigrations };
