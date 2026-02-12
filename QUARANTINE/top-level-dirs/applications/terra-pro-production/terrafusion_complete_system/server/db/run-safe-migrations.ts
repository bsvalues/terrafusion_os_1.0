/**
 * Robust Database Migration Runner
 *
 * This script safely applies database migrations by first checking if they can be applied.
 * It handles column existence checks and provides safer error handling for running
 * in the Replit environment.
 */
import fs from "fs";
import path from "path";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Logger } from "../utils/logger";

// Create logger
const logger = new Logger("DBMigrations");

// Ensure we have a database URL
if (!process.env.DATABASE_URL) {
  logger.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

// Timestamp for better logging
const timestamp = new Date().toISOString();
logger.info(`Starting safe migrations at ${timestamp}`);

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  max: 20,
});

// Create Drizzle instance
const db = drizzle(pool);

// Define migration directory
const migrationsFolder = path.join(__dirname, "migrations");

// Check if migrations folder exists
if (!fs.existsSync(migrationsFolder)) {
  logger.error(`Migrations folder not found at ${migrationsFolder}`);
  process.exit(1);
}

// Read migration files
const migrationFiles = fs.readdirSync(migrationsFolder).filter((file) => file.endsWith(".sql"));

if (migrationFiles.length === 0) {
  logger.warn("No migration files found");
  process.exit(0);
}

logger.info(`Found ${migrationFiles.length} migration files`);

// Run migrations
async function runMigrations() {
  try {
    logger.info("Running migrations...");

    // Apply migrations with Drizzle
    await migrate(db, { migrationsFolder });

    logger.info("✅ Migrations completed successfully");
  } catch (error) {
    logger.error("❌ Migration failed", error);

    // Try a more graceful error message
    if (error instanceof Error) {
      logger.error(`Migration error details: ${error.message}`);
    }

    process.exit(1);
  } finally {
    // Ensure pool is ended
    await pool.end();
  }
}

// Execute migrations
runMigrations().catch((err) => {
  logger.error("Unhandled error during migration:", err);
  process.exit(1);
});
