import { db } from "../../server/db";
import { sql } from "drizzle-orm";

describe('Database Schema Tests', () => {
  test('Should connect to the database', async () => {
    try {
      // A simple query to verify the connection
      const result = await db.execute(sql`SELECT 1 as test`);
      expect(result[0].test).toBe(1);
    } catch (error) {
      console.error('Database connection error:', error);
      fail('Failed to connect to the database');
    }
  });
  
  test('Should have workflow_events table', async () => {
    try {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = 'workflow_events'
        ) as "exists"
      `);
      expect(result[0].exists).toBe(true);
    } catch (error) {
      console.error('Error checking workflow_events table:', error);
      fail('Failed to check if workflow_events table exists');
    }
  });
});