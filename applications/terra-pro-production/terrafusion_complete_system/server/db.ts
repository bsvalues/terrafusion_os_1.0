/**
 * Database Module
 *
 * Primary export point for database utilities and functions.
 */
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../shared/schema";
import ws from "ws";
import { runStartupChecks as dbStartupChecks } from "./db/startup-check";

// Configure neonConfig to use WebSocket
neonConfig.webSocketConstructor = ws;

// Environment validation
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Did you forget to provision a database?");
}

// Create the pool instance
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Create the drizzle instance
export const db = drizzle(pool, { schema });

// Re-export functions from database modules
export const runStartupChecks = dbStartupChecks;
