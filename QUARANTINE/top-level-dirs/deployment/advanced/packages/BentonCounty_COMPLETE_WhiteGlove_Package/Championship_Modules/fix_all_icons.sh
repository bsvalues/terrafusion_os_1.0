#!/bin/bash

# TerraFusion Icon Fix Script
# This script fixes all 0-byte icon issues across all 14 Tauri apps

echo "===================="
echo "TerraFusion Icon Fix"
echo "===================="

WORKSPACE_DIR="/mnt/e/TerraFusion_Tauri_Master_Workspace/apps"
ICON_SOURCE_PNG="/tmp/terrafusion_icon.png"
ICON_SOURCE_ICO="/tmp/terrafusion_icon.ico"
ICON_SOURCE_ICNS="/tmp/terrafusion_icon.icns"
ICON_SOURCE_128="/tmp/terrafusion_icon_128.png"
ICON_SOURCE_32="/tmp/terrafusion_icon_32.png"

# Array of all app directories
APPS=(
    "01-terra-agent"
    "02-terra-flow" 
    "03-web-audit-tracker"
    "04-terra-levy"
    "05-terra-miner"
    "06-terra-fusion-sync"
    "07-gispro"
    "08-costforge-ai"
    "09-property-workbench"
    "10-terra-insight"
    "11-terra-fusion-dashboard"
    "12-terra-fusion-assessor"
    "13-marketplace"
    "14-terra-collections"
)

# Check if source icons exist
if [[ ! -f "$ICON_SOURCE_PNG" ]]; then
    echo "ERROR: Source PNG icon not found at $ICON_SOURCE_PNG"
    exit 1
fi

if [[ ! -f "$ICON_SOURCE_ICO" ]]; then
    echo "ERROR: Source ICO icon not found at $ICON_SOURCE_ICO"
    exit 1
fi

if [[ ! -f "$ICON_SOURCE_ICNS" ]]; then
    echo "ERROR: Source ICNS icon not found at $ICON_SOURCE_ICNS"
    exit 1
fi

echo "Source icons validated. Starting fix process..."
echo ""

FIXED_COUNT=0
BROKEN_COUNT=0

# Process each app
for app in "${APPS[@]}"; do
    APP_DIR="$WORKSPACE_DIR/$app"
    ICONS_DIR="$APP_DIR/src-tauri/icons"
    
    if [[ ! -d "$APP_DIR" ]]; then
        echo "WARNING: App directory not found: $APP_DIR"
        continue
    fi
    
    # Create icons directory if it doesn't exist
    if [[ ! -d "$ICONS_DIR" ]]; then
        echo "Creating icons directory for $app..."
        mkdir -p "$ICONS_DIR"
    fi
    
    echo "Processing $app..."
    
    # Check existing icons and count broken ones
    BROKEN_ICONS=0
    
    if [[ -f "$ICONS_DIR/icon.png" ]]; then
        SIZE=$(stat -c%s "$ICONS_DIR/icon.png" 2>/dev/null || echo 0)
        if [[ $SIZE -le 200 ]]; then
            BROKEN_ICONS=$((BROKEN_ICONS + 1))
        fi
    else
        BROKEN_ICONS=$((BROKEN_ICONS + 1))
    fi
    
    if [[ -f "$ICONS_DIR/icon.ico" ]]; then
        SIZE=$(stat -c%s "$ICONS_DIR/icon.ico" 2>/dev/null || echo 0)
        if [[ $SIZE -eq 0 ]]; then
            BROKEN_ICONS=$((BROKEN_ICONS + 1))
        fi
    else
        BROKEN_ICONS=$((BROKEN_ICONS + 1))
    fi
    
    if [[ -f "$ICONS_DIR/icon.icns" ]]; then
        SIZE=$(stat -c%s "$ICONS_DIR/icon.icns" 2>/dev/null || echo 0)
        if [[ $SIZE -eq 0 ]]; then
            BROKEN_ICONS=$((BROKEN_ICONS + 1))
        fi
    else
        BROKEN_ICONS=$((BROKEN_ICONS + 1))
    fi
    
    if [[ $BROKEN_ICONS -gt 0 ]]; then
        BROKEN_COUNT=$((BROKEN_COUNT + 1))
        echo "  - Found $BROKEN_ICONS broken/missing icons"
        
        # Copy the working icons
        echo "  - Copying icon.png..."
        cp "$ICON_SOURCE_PNG" "$ICONS_DIR/icon.png"
        
        echo "  - Copying icon.ico..."
        cp "$ICON_SOURCE_ICO" "$ICONS_DIR/icon.ico"
        
        echo "  - Copying icon.icns..."
        cp "$ICON_SOURCE_ICNS" "$ICONS_DIR/icon.icns"
        
        # Copy additional sizes if they don't exist or are broken
        if [[ ! -f "$ICONS_DIR/32x32.png" ]] || [[ $(stat -c%s "$ICONS_DIR/32x32.png" 2>/dev/null || echo 0) -le 200 ]]; then
            if [[ -f "$ICON_SOURCE_32" ]]; then
                echo "  - Copying 32x32.png..."
                cp "$ICON_SOURCE_32" "$ICONS_DIR/32x32.png"
            fi
        fi
        
        if [[ ! -f "$ICONS_DIR/128x128.png" ]] || [[ $(stat -c%s "$ICONS_DIR/128x128.png" 2>/dev/null || echo 0) -le 200 ]]; then
            if [[ -f "$ICON_SOURCE_128" ]]; then
                echo "  - Copying 128x128.png..."
                cp "$ICON_SOURCE_128" "$ICONS_DIR/128x128.png"
            fi
        fi
        
        if [[ ! -f "$ICONS_DIR/128x128@2x.png" ]] || [[ $(stat -c%s "$ICONS_DIR/128x128@2x.png" 2>/dev/null || echo 0) -le 200 ]]; then
            if [[ -f "$ICON_SOURCE_128" ]]; then
                echo "  - Copying 128x128@2x.png..."
                cp "$ICON_SOURCE_128" "$ICONS_DIR/128x128@2x.png"
            fi
        fi
        
        FIXED_COUNT=$((FIXED_COUNT + 1))
        echo "  - ✅ Fixed icons for $app"
    else
        echo "  - ✅ Icons already valid for $app"
    fi
    
    echo ""
done

echo "===================="
echo "ICON FIX SUMMARY"
echo "===================="
echo "Total apps processed: ${#APPS[@]}"
echo "Apps with broken icons: $BROKEN_COUNT"
echo "Apps fixed: $FIXED_COUNT"
echo ""

# Verify the fixes
echo "Verifying fixes..."
for app in "${APPS[@]}"; do
    ICONS_DIR="$WORKSPACE_DIR/$app/src-tauri/icons"
    
    if [[ -d "$ICONS_DIR" ]]; then
        PNG_SIZE=$(stat -c%s "$ICONS_DIR/icon.png" 2>/dev/null || echo 0)
        ICO_SIZE=$(stat -c%s "$ICONS_DIR/icon.ico" 2>/dev/null || echo 0)
        ICNS_SIZE=$(stat -c%s "$ICONS_DIR/icon.icns" 2>/dev/null || echo 0)
        
        if [[ $PNG_SIZE -gt 1000 && $ICO_SIZE -gt 0 && $ICNS_SIZE -gt 1000 ]]; then
            echo "✅ $app: PNG=${PNG_SIZE}b, ICO=${ICO_SIZE}b, ICNS=${ICNS_SIZE}b"
        else
            echo "❌ $app: PNG=${PNG_SIZE}b, ICO=${ICO_SIZE}b, ICNS=${ICNS_SIZE}b (STILL BROKEN)"
        fi
    fi
done

echo ""
echo "Icon fix process completed!"
echo "You can now test building the apps with: cd app-directory/src-tauri && cargo build"