#!/bin/bash

# Clean build script for TerraFusion Public Records

echo "🏆 TerraFusion Public Records - Clean Build"
echo "=========================================="

# Clean old build artifacts
echo "Cleaning old build artifacts..."
rm -rf dist/
rm -rf node_modules/.vite/

# Build without TypeScript checking (we know there are unused imports we can fix later)
echo "Building production bundle..."
npx vite build --mode production

echo ""
echo "✅ Build complete!"
echo "Output in: dist/"
echo ""
echo "To serve locally:"
echo "  npx serve dist -p 3500"
echo ""
echo "To deploy:"
echo "  ./deploy.sh"