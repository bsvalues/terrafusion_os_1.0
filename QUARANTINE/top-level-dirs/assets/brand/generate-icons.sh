#!/bin/bash
# TerraFusion Icon Generation Pipeline
# Generates ICO/PNG set from SVG source

set -e

echo "🎨 TerraFusion Icon Generation Pipeline"
echo "========================================"

# Check for ImageMagick or similar
if ! command -v convert &> /dev/null; then
    echo "⚠️  ImageMagick not found. Install with:"
    echo "   Windows: choco install imagemagick"
    echo "   macOS: brew install imagemagick"
    echo "   Linux: sudo apt-get install imagemagick"
    exit 1
fi

# Create output directory
mkdir -p generated-icons

# Source SVG
SOURCE_SVG="terrafusion-logo.svg"

if [ ! -f "$SOURCE_SVG" ]; then
    echo "❌ Source SVG not found: $SOURCE_SVG"
    exit 1
fi

echo ""
echo "📐 Generating icon sizes..."

# Generate PNG sizes for PWA
SIZES=(16 32 48 64 96 128 192 256 512)

for SIZE in "${SIZES[@]}"; do
    echo "   ├─ ${SIZE}x${SIZE}.png"
    convert -background none -resize "${SIZE}x${SIZE}" \
        "$SOURCE_SVG" "generated-icons/icon-${SIZE}.png"
done

echo ""
echo "🖼️  Generating Windows ICO..."

# Create multi-resolution ICO file
convert -background none \
    "$SOURCE_SVG" -resize 16x16 \
    "$SOURCE_SVG" -resize 32x32 \
    "$SOURCE_SVG" -resize 48x48 \
    "$SOURCE_SVG" -resize 64x64 \
    "$SOURCE_SVG" -resize 128x128 \
    "$SOURCE_SVG" -resize 256x256 \
    "generated-icons/terrafusion.ico"

echo ""
echo "📱 Generating Apple Touch Icons..."

# iOS/macOS icons
convert -background none -resize 180x180 \
    "$SOURCE_SVG" "generated-icons/apple-touch-icon.png"

convert -background none -resize 167x167 \
    "$SOURCE_SVG" "generated-icons/apple-touch-icon-ipad.png"

echo ""
echo "✅ Icon generation complete!"
echo ""
echo "Generated files in: generated-icons/"
ls -lh generated-icons/
echo ""
echo "🎯 Next steps:"
echo "   1. Copy icons to frontend/public/"
echo "   2. Copy ICO to native-shell/assets/"
echo "   3. Update PWA manifest with icon paths"
echo ""

