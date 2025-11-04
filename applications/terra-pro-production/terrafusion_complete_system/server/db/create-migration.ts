/**
 * Migration File Generator
 *
 * This script creates a new migration file with the provided description.
 * Usage: npx tsx server/db/create-migration.ts "Description of migration"
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get directory name for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to migrations directory
const MIGRATIONS_DIR = path.join(__dirname, "migrations");

/**
 * Creates a new migration file
 */
function createMigration(description: string): void {
  // Make sure migrations directory exists
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
    console.log(`Created migrations directory at ${MIGRATIONS_DIR}`);
  }

  // Generate timestamp for migration file (YYYYMMDDHHMMSS format)
  const now = new Date();
  const timestamp =
    now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, "0") +
    now.getDate().toString().padStart(2, "0") +
    now.getHours().toString().padStart(2, "0") +
    now.getMinutes().toString().padStart(2, "0") +
    now.getSeconds().toString().padStart(2, "0");

  // Sanitize description for filename (replace spaces with underscores, remove special chars)
  const sanitizedDesc = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "_");

  // Create filename with timestamp and description
  const filename = `${timestamp}_${sanitizedDesc}.sql`;
  const filePath = path.join(MIGRATIONS_DIR, filename);

  // Create migration file content
  const templateContent = `-- Migration: ${description}
-- Date: ${now.toISOString().split("T")[0]}
-- Description: This migration [description of what this migration does]

-- Write your migration SQL here
-- Example:
-- ALTER TABLE table_name ADD COLUMN new_column_name column_type;

-- Record this migration
INSERT INTO schema_version (version, description, applied_by)
VALUES ('${timestamp}', '${description}', CURRENT_USER);
`;

  // Write migration file
  fs.writeFileSync(filePath, templateContent);
  console.log(`✅ Created migration file: ${filePath}`);
}

// Get description from command line arguments
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("❌ Error: Please provide a description for the migration");
  console.error('Usage: npx tsx server/db/create-migration.ts "Description of migration"');
  process.exit(1);
}

// Create migration with provided description
createMigration(args[0]);
