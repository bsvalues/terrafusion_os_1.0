#!/bin/bash

# TerraFusion Public Records - Deployment Script

echo "TerraFusion Public Records - Production Deployment"
echo "=================================================="

# Build the production bundle
echo "Building production bundle..."
npm run build

if [ ! -d "dist" ]; then
    echo "Error: Build failed - dist directory not found"
    exit 1
fi

echo ""
echo "Build complete!"
echo ""
echo "Production files are in: dist/"
echo ""
echo "To deploy to your web server:"
echo "1. Copy contents of dist/ to your web server"
echo "2. Configure your server to serve index.html for all routes"
echo "3. Ensure API endpoint is configured correctly"
echo ""
echo "For local testing:"
echo "  npx serve dist -p 3500"