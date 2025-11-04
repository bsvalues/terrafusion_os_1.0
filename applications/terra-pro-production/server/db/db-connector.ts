import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@shared/schema";

/**
 * Resilient Database Connector for Terrafusion Platform
 *
 * This module:
 * 1. Handles database connection retries with exponential backoff
 * 2. Properly configures Neon for Replit environment
 * 3. Provides clean teardown to prevent connection leaks
 * 4. Includes heartbeat to keep connections alive
 */

// Configure Neon for WebSocket connections in Replit environment
neonConfig.webSocketConstructor = ws;
neonConfig.wsProxy = (url) => url; // No proxy needed in Replit

// Initial retry delay in milliseconds
const INITIAL_RETRY_DELAY_MS = 1000;
// Maximum retry delay in milliseconds
const MAX_RETRY_DELAY_MS = 30000;
// Maximum number of retries
const MAX_RETRIES = 10;

// Pool singleton
let globalPool: Pool | null = null;
// Drizzle instance singleton
let globalDb: ReturnType<typeof drizzle> | null = null;

// Heartbeat interval reference
let heartbeatInterval: NodeJS.Timeout | null = null;

/**
 * Get database connection string from environment variables
 */
function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set. Check your environment variables.");
  }

  return databaseUrl;
}

/**
 * Create a database pool with connection retries
 */
export async function createPool(retries = 0): Promise<Pool> {
  // If we already have a pool, return it
  if (globalPool) {
    return globalPool;
  }

  try {
    console.log("🔌 Connecting to database...");

    // Create pool
    const pool = new Pool({
      connectionString: getDatabaseUrl(),
      // Replit environment can have unstable connections, so set a reasonable timeout
      connect_timeout: 10,
      // Keep idle connections alive
      idleTimeoutMillis: 120000, // 2 minutes
      // Limit pool size to avoid overwhelming the connection limit
      max: 5,
    });

    // Test connection
    await pool.query("SELECT NOW()");

    console.log("✅ Database connection established");

    // Store pool as singleton
    globalPool = pool;

    // Set up heartbeat
    setupHeartbeat(pool);

    return pool;
  } catch (error) {
    console.error(
      `❌ Database connection failed (attempt ${retries + 1}/${MAX_RETRIES}):`,
      error.message
    );

    // If we've reached the maximum number of retries, throw the error
    if (retries >= MAX_RETRIES) {
      throw new Error(
        `Failed to connect to database after ${MAX_RETRIES} attempts: ${error.message}`
      );
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(INITIAL_RETRY_DELAY_MS * Math.pow(2, retries), MAX_RETRY_DELAY_MS);

    console.log(`🔄 Retrying in ${delay}ms...`);

    // Wait for delay
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry
    return createPool(retries + 1);
  }
}

/**
 * Create a Drizzle instance with connection retries
 */
export async function createDb(): Promise<ReturnType<typeof drizzle>> {
  // If we already have a db instance, return it
  if (globalDb) {
    return globalDb;
  }

  try {
    // Get or create pool
    const pool = await createPool();

    // Create Drizzle instance
    const db = drizzle(pool, { schema });

    // Store db as singleton
    globalDb = db;

    return db;
  } catch (error) {
    console.error("❌ Failed to create Drizzle instance:", error);
    throw error;
  }
}

/**
 * Setup heartbeat to keep connection alive
 */
function setupHeartbeat(pool: Pool) {
  // Clear any existing heartbeat
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  // Set up new heartbeat to ping database every minute
  heartbeatInterval = setInterval(async () => {
    try {
      await pool.query("SELECT 1");
    } catch (error) {
      console.error("❌ Heartbeat query failed:", error.message);
    }
  }, 60000);

  // Ensure heartbeat doesn't keep process alive
  heartbeatInterval.unref();
}

/**
 * Clean up database connections
 */
export async function cleanup(): Promise<void> {
  console.log("🧹 Cleaning up database connections...");

  // Clear heartbeat
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  // Close pool
  if (globalPool) {
    try {
      await globalPool.end();
      console.log("✅ Database pool closed");
    } catch (error) {
      console.error("❌ Error closing database pool:", error);
    } finally {
      globalPool = null;
      globalDb = null;
    }
  }
}

// Handle process termination
process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);

// Expose singleton instances
export const getPool = async () => globalPool || (await createPool());
export const getDb = async () => globalDb || (await createDb());
