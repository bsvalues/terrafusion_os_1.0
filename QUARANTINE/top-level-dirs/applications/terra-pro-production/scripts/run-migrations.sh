#!/bin/bash

# Run TerraFusion database migrations
# This script safely executes database migrations using Drizzle

echo "🚀 Starting TerraFusion database migrations..."

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if PostgreSQL DB is available
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Run migration
echo "📊 Running migrations..."
npx tsx server/db/robust-migrate.ts $@

# Check exit status
if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migration failed"
  exit 1
fi

# Update schema with Drizzle
echo "🔄 Updating Drizzle schema..."
npx drizzle-kit push

# Final check
if [ $? -eq 0 ]; then
  echo "✅ Schema updated successfully"
  echo "🎉 Database migration complete"
else
  echo "❌ Schema update failed"
  exit 1
fi