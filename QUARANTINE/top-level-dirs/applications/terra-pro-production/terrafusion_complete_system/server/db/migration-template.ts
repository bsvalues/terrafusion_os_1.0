/**
 * Migration: [MIGRATION_NAME]
 * Date: [MIGRATION_DATE]
 * Description: [MIGRATION_DESCRIPTION]
 */
import { Pool } from "@neondatabase/serverless";

/**
 * Apply the migration
 */
export async function up(pool: Pool): Promise<void> {
  // SQL to apply the changes
  await pool.query(`
    -- Add your SQL here
    -- Example: ALTER TABLE users ADD COLUMN email TEXT;
  `);
}

/**
 * Reverse the migration
 */
export async function down(pool: Pool): Promise<void> {
  // SQL to reverse the changes
  await pool.query(`
    -- Add your rollback SQL here
    -- Example: ALTER TABLE users DROP COLUMN email;
  `);
}
