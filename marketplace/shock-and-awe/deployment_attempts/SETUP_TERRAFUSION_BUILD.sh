#!/bin/bash

echo "========================================="
echo "SETTING UP TERRAFUSION BUILD"
echo "========================================="

# Navigate to TerraFusionBuild directory
cd "TerraFusionBuild (1)/TerraFusionBuild"

echo "Installing dependencies..."
npm install

echo ""
echo "Building the project..."
npm run build

echo ""
echo "========================================="
echo "Setup complete!"
echo "========================================="
echo ""
echo "To run TerraFusionBuild:"
echo "1. cd 'TerraFusionBuild (1)/TerraFusionBuild'"
echo "2. npm run dev"
echo ""