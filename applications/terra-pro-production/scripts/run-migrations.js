#!/usr/bin/env node

/**
 * Database Migration Runner
 *
 * This script compiles and runs the TypeScript migration runner.
 * It handles errors gracefully and provides clear feedback.
 */

const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

console.log("🔄 Starting database migration process...");

// Check if the TypeScript migration file exists
const migrationFile = path.join(__dirname, "../server/db/run-safe-migrations.ts");
if (!fs.existsSync(migrationFile)) {
  console.error("❌ Migration runner file not found at:", migrationFile);
  process.exit(1);
}

// Compile and run the migration script
try {
  console.log("🔧 Compiling TypeScript migration runner...");

  // Use tsx to run the TypeScript file directly
  execSync(`npx tsx ${migrationFile}`, {
    stdio: "inherit",
    env: {
      ...process.env,
      MIGRATION_TIMESTAMP: new Date().toISOString(),
    },
  });

  console.log("✅ Database migrations completed successfully!");
} catch (error) {
  console.error("❌ Error running migrations:", error.message);
  process.exit(1);
}
