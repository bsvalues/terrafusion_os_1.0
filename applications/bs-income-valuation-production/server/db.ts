import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "./db.config";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create a Drizzle instance with the pg Pool and schema
export const db = drizzle(pool, { schema });
