import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon to use the WebSocket constructor from the ws package
neonConfig.webSocketConstructor = ws;

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create a connection pool
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Initialize drizzle with our schema
export const db = drizzle({ client: pool, schema });

// Utility functions for common database operations

/**
 * Executes a health check against the database
 * @returns True if the database is healthy, false otherwise
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT 1");
    return result.rowCount === 1;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

/**
 * Cleans up database connections when shutting down
 */
export async function cleanupDatabaseConnections(): Promise<void> {
  try {
    await pool.end();
    console.log("Database connections closed");
  } catch (error) {
    console.error("Error closing database connections:", error);
  }
}

// Register cleanup handlers
process.on("SIGINT", async () => {
  console.log("Shutting down database connections...");
  await cleanupDatabaseConnections();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("Shutting down database connections...");
  await cleanupDatabaseConnections();
  process.exit(0);
});

/**
 * Performs startup checks to ensure the database is properly configured and accessible
 * This is called when the server starts
 */
export async function runStartupChecks(): Promise<void> {
  try {
    console.log("Running database startup checks...");

    // Check if the database is accessible
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      console.error("Database health check failed during startup!");
      throw new Error("Database health check failed");
    }

    console.log("Database startup checks completed successfully");

    // Optional: query for some basic stats to confirm schema is working
    const userCount = await db.select({ count: schema.users.id }).from(schema.users);
    console.log(`Current users in database: ${userCount[0]?.count || 0}`);

    const propertyCount = await db.select({ count: schema.properties.id }).from(schema.properties);
    console.log(`Current properties in database: ${propertyCount[0]?.count || 0}`);
  } catch (error) {
    console.error("Error during database startup checks:", error);
    // We don't throw here - we want the server to attempt to start even if DB checks fail
    // This is to enable the application to run in environments where the DB might not be
    // immediately available but could become available later.
    console.warn(
      "Application starting despite database issues - some features may not work correctly"
    );
  }
}
