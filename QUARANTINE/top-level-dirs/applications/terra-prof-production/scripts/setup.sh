#!/bin/bash
# TerraFusionPro - Development Environment Setup Script

set -e

echo "=== TerraFusionPro Development Environment Setup ==="
echo

# Check for required tools
echo "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed. Aborting." >&2; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required but not installed. Aborting." >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Docker Compose is required but not installed. Aborting." >&2; exit 1; }

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "Node.js v18+ is required. Found version: $(node -v). Aborting." >&2
  exit 1
fi

echo "All prerequisites met."
echo

# Install dependencies
echo "Installing dependencies..."
npm install

# Initialize Git hooks
echo "Setting up Git hooks..."
npx husky install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
  echo "Creating .env file from template..."
  cp .env.example .env
  echo "Please update the .env file with your configuration."
fi

# Initialize development databases
echo "Starting development databases..."
npm run docker:up

# Wait for databases to be ready
echo "Waiting for databases to be ready..."
sleep 5

# Run initial build
echo "Building packages..."
npm run build

echo
echo "=== Setup Complete ==="
echo
echo "To start the development environment, run:"
echo "  npm run dev"
echo
echo "For more information, see the documentation in the docs/ directory."
echo
