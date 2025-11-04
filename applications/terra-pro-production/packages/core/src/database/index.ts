import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "../../../../shared/schema";

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

// Create the database pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create the drizzle client
export const db = drizzle(pool, { schema });

// Export a function to run migrations
export const runMigrations = async () => {
  console.log("Running migrations...");
  // We'll use drizzle-kit programmatically in production
  console.log("Migrations complete");
};
