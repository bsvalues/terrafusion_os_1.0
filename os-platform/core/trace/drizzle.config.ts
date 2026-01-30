/**
 * TerraFusion OS - Trace Schema Drizzle Configuration
 *
 * Used by drizzle-kit to push schema changes to PostgreSQL.
 *
 * Usage:
 *   cd os-platform/core/trace
 *   npx drizzle-kit push
 *
 * Environment:
 *   DATABASE_URL - PostgreSQL connection string
 */

import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must be set for drizzle-kit.\n' +
      'Example: postgresql://user:pass@localhost:5432/terrafusion'
  );
}

export default defineConfig({
  schema: './schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // Use terra_trace schema namespace
  schemaFilter: ['terra_trace'],
  verbose: true,
  strict: true,
});
