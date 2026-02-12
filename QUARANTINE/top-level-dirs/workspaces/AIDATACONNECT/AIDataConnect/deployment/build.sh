#!/bin/bash

# RAG Drive FTP Hub Build Script
# This script builds the application for production deployment

# Exit on error
set -e

# Print commands for debugging
set -x

# Environment
NODE_ENV=${NODE_ENV:-production}
echo "Building for environment: $NODE_ENV"

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf dist

# Install dependencies
echo "Installing dependencies..."
npm ci --only=production

# Build frontend
echo "Building frontend..."
npm run build:client

# Build server
echo "Building server..."
npm run build:server

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p dist/uploads
mkdir -p dist/logs

# Copy configuration files
echo "Copying configuration files..."
cp package.json dist/
cp package-lock.json dist/

echo "Build completed successfully!"