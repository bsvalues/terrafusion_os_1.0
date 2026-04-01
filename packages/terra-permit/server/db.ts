import * as schema from "@shared/schema";
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

// Configure connection retry
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000; // 3 seconds

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Parse the DATABASE_URL to determine if it's a Neon database
const isNeonDatabase = process.env.DATABASE_URL.includes('neon.tech');
console.log('Database Type:', isNeonDatabase ? 'Neon PostgreSQL' : 'Standard PostgreSQL');

// Use postgres.js directly which has better compatibility
// This approach avoids WebSocket connection issues with Neon in some environments
const sql = postgres(process.env.DATABASE_URL, {
  max: 10,                    // Max number of connections
  idle_timeout: 30,           // Idle connection timeout in seconds
  connect_timeout: 15,        // Connect timeout in seconds
  ssl: isNeonDatabase ? {     // SSL for Neon DB connections
    rejectUnauthorized: false
  } : false
});

console.log('Successfully initialized database connection with postgres.js');

// Create the drizzle ORM instance
const db = drizzle(sql, { schema });

// For backward compatibility with code expecting a pool object
const pool = {
  query: async (text: string, params?: any[]) => {
    try {
      // Execute the query using postgres.js
      const result = await sql.unsafe(text, params || []);
      return {
        rows: result,
        rowCount: result.length,
        command: 'SELECT', // Simplified
        oid: 0,
        fields: []
      };
    } catch (error) {
      console.error('Error executing query:', error);
      throw error;
    }
  }
};

// Setup error handling with appropriate reconnect logic
let retryCount = 0;

// Function to check database connection health
const checkDatabaseConnection = async () => {
  try {
    // Simple query to test connection
    const result = await sql`SELECT 1`;
    if (result && result.length === 1) {
      // Reset retry count on successful connection
      retryCount = 0;
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('Database connection check failed:', error.message);
    
    // Attempt to reconnect if there's an error
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Database connection check failed. Retrying (${retryCount}/${MAX_RETRIES})...`);
      
      // Wait and try again with exponential backoff
      const backoffDelay = RETRY_DELAY * Math.pow(2, retryCount - 1);
      console.log(`Waiting ${backoffDelay}ms before retrying...`);
      
      // Return false immediately but schedule a retry in the background
      setTimeout(async () => {
        try {
          const reconnectResult = await sql`SELECT 1`;
          if (reconnectResult && reconnectResult.length === 1) {
            console.log('Database reconnection successful!');
            retryCount = 0;
          }
        } catch (reconnectError) {
          console.error('Database reconnection attempt failed:', reconnectError);
        }
      }, backoffDelay);
    } else {
      console.error('Maximum database connection retries reached. Please check your database connection.');
    }
    
    return false;
  }
};

// Export objects for use in the application
export { sql, db, pool, checkDatabaseConnection };
