#!/bin/bash

# FIX ALL THE CHAMPIONSHIP REFERENCES AND MAKE IT TERRAFUSION OS
# This should have been done already!

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🔧 FIXING ALL CHAMPIONSHIP REFERENCES → TERRAFUSION OS"
echo "═══════════════════════════════════════════════════════════════"
echo ""

echo "1. Fixing main source files..."

# Fix the TerraFusionRealBrand.tsx - remove Championship Edition badge
sed -i 's/<span className="status-badge championship">Championship Edition<\/span>/<!-- OS Version 1.0 -->/' src/TerraFusionRealBrand.tsx 2>/dev/null || true

# Fix package.json name
sed -i 's/"name": "terrafusion-tauri-master-workspace"/"name": "terrafusion-os"/' package.json

# Fix all "Championship" references in source files
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" \) -not -path "./ARCHIVE/*" -not -path "./node_modules/*" -exec sed -i 's/Championship Edition/OS v1.0/g' {} \; 2>/dev/null || true
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" \) -not -path "./ARCHIVE/*" -not -path "./node_modules/*" -exec sed -i 's/Championship/TerraFusion OS/g' {} \; 2>/dev/null || true

echo "2. Fixing HTML titles in modules..."

# Fix duplicate titles
sed -i 's/<title>Terra Fusion Dashboard<\/title>/<title>TerraFusion OS - Dashboard<\/title>/g' modules/11-terra-fusion-dashboard/dist/index.html 2>/dev/null || true
sed -i 's/<title>Terra Fusion Dashboard<\/title>/<title>TerraFusion OS - Assessor<\/title>/g' modules/12-terra-fusion-assessor/dist/index.html 2>/dev/null || true
sed -i 's/<title>Terra Fusion Dashboard<\/title>/<title>TerraFusion OS - Marketplace<\/title>/g' modules/13-marketplace/dist/index.html 2>/dev/null || true

# Update all module titles to include TerraFusion OS
for module in modules/*/dist/index.html; do
    if [ -f "$module" ]; then
        # Get module name from path
        module_name=$(basename $(dirname $(dirname "$module")))
        # Update title to include OS
        sed -i "s/<title>\(.*\)<\/title>/<title>TerraFusion OS - \1<\/title>/g" "$module" 2>/dev/null || true
    fi
done

echo "3. Updating branding protocol..."

# Update the brand protocol file
cat > src/terrafusion-brand-protocol-fixed.ts << 'EOF'
/**
 * TERRAFUSION OS BRAND PROTOCOL
 * Government. Transcended.
 * 
 * Official branding for TerraFusion County Operating System
 */

export const TERRAFUSION_BRAND = {
  productName: "TerraFusion County OS",
  version: "1.0.0",
  essence: "Infrastructure Intelligence, Infinite Scale",
  tagline: "The Operating System for Modern County Government",
  secondaryTagline: "Government. Simplified.",
  vision: "Government. Transcended.",
  slogan: "Tactical Municipal Excellence",
  motto: "379,000,000× Faster Than Marshall & Swift",
  promise: "Every county, every workflow, every day: Complete government transformation.",
  
  // NO MORE CHAMPIONSHIP REFERENCES!
  edition: "Enterprise Edition",
  
  // UI Microcopy
  confirmationMessages: [
    "TerraFusion OS: Activated.",
    "County Operations: Optimized.",
    "Government: Transcended.",
    "379M× Speed: Confirmed.",
    "System: Operational."
  ],
  
  loadingMessages: [
    "Loading TerraFusion OS…",
    "Initializing County Systems…",
    "Starting Government OS…",
    "Processing at 379M× Speed…",
    "Booting Enterprise Systems…"
  ]
};
EOF

echo "4. Checking for remaining Championship references..."

echo ""
echo "Remaining 'Championship' references (should be minimal):"
grep -r "Championship" . --include="*.tsx" --include="*.ts" --include="*.js" --include="*.html" --exclude-dir=ARCHIVE --exclude-dir=node_modules 2>/dev/null | grep -v "FIX_ALL_CHAMPIONSHIP" | head -10 || echo "✓ No Championship references found!"

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "✅ FIXES APPLIED!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Changed:"
echo "  • 'Championship Edition' → 'OS v1.0'"
echo "  • Package name → 'terrafusion-os'"
echo "  • All titles → 'TerraFusion OS - [Module]'"
echo "  • Brand protocol → Official OS branding"
echo ""
echo "This is now TerraFusion County OS - NOT Championship!"
echo "═══════════════════════════════════════════════════════════════"