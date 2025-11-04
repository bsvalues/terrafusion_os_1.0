import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";
import { config } from 'dotenv';

// Load environment variables
config();

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/terrafusionpro';

console.log('🔍 Checking database configuration...');
console.log(`📍 DATABASE_URL: ${DATABASE_URL ? 'Configured' : 'Missing'}`);

// DATABASE_URL should always be available now with default fallback

// Use PG Client with enhanced connection handling
const client = new Client({ 
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Enhanced connection with error handling
let isConnected = false;

async function connectWithRetry() {
  try {
    await client.connect();
    isConnected = true;
    console.log('✅ Database connected successfully');
  } catch (error) {
    isConnected = false;
    console.error('❌ Database connection failed:', error instanceof Error ? error.message : 'Unknown error');
    console.log('⚠️  Continuing without database - some features may be limited');
  }
}

// Attempt to connect
connectWithRetry();

// Export the drizzle instance
export const db = drizzle(client, { schema });

export async function initDatabase(): Promise<boolean> {
  if (!isConnected) {
    await connectWithRetry();
  }
  
  if (!isConnected) {
    console.log('📋 Database unavailable - running in development mode with limited functionality');
    return false;
  }
  
  try {
    // Test database connection with a simple query
    await client.query('SELECT 1');
    console.log('✅ Database connection verified successfully');
    console.log('🕐 Connected at:', new Date().toISOString());
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    isConnected = false;
    return false;
  }
}