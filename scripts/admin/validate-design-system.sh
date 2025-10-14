#!/bin/bash
# TerraFusion Design System - Full Validation Test
# Runs all validation checks to ensure system integrity

set -e  # Exit on error

echo "🎨 TerraFusion Design System - Full Validation"
echo "=============================================="
echo ""

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# === 1. Token Validation ===
echo -e "${BLUE}[1/6]${NC} Validating design tokens..."
cd /workspaces/terrafusion_os_1.0/tools/tf-designctl-node
node bin/tf-designctl.js validate -t ../../design/tokens.json
echo ""

# === 2. Node CLI Sync ===
echo -e "${BLUE}[2/6]${NC} Generating design-sync outputs (Node CLI)..."
node bin/tf-designctl.js sync ../../design-sync -t ../../design/tokens.json
echo ""

# === 3. Verify Generated Files ===
echo -e "${BLUE}[3/6]${NC} Verifying generated artifacts..."
if [ -f "../../design-sync/tokens.css" ]; then
    echo -e "${GREEN}✓${NC} tokens.css generated"
else
    echo "❌ tokens.css missing"
    exit 1
fi

if [ -f "../../design-sync/tailwind.config.js" ]; then
    echo -e "${GREEN}✓${NC} tailwind.config.js generated"
else
    echo "❌ tailwind.config.js missing"
    exit 1
fi

if [ -f "../../design-sync/theme.tsx" ]; then
    echo -e "${GREEN}✓${NC} theme.tsx generated"
else
    echo "❌ theme.tsx missing"
    exit 1
fi

if [ -f "../../design-sync/figma-tokens.json" ]; then
    echo -e "${GREEN}✓${NC} figma-tokens.json generated"
else
    echo "❌ figma-tokens.json missing"
    exit 1
fi
echo ""

# === 4. Rust CLI Build ===
echo -e "${BLUE}[4/6]${NC} Checking Rust CLI binary..."
cd /workspaces/terrafusion_os_1.0/tools/tf-designctl-rust
if [ -f "target/release/tf-designctl" ]; then
    echo -e "${GREEN}✓${NC} Rust CLI binary exists"
else
    echo "Building Rust CLI..."
    cargo build --release
fi
echo ""

# === 5. Rust CLI Validation ===
echo -e "${BLUE}[5/6]${NC} Validating with Rust CLI..."
./target/release/tf-designctl validate -t ../../design/tokens.json
echo ""

# === 6. Verify Supporting Files ===
echo -e "${BLUE}[6/6]${NC} Checking supporting files..."
cd /workspaces/terrafusion_os_1.0

if [ -f "shaders/tokens.wgsl" ]; then
    echo -e "${GREEN}✓${NC} WGSL shader constants"
else
    echo "❌ shaders/tokens.wgsl missing"
    exit 1
fi

if [ -f "docs/architecture_codex.svg" ]; then
    echo -e "${GREEN}✓${NC} Architecture codex SVG"
else
    echo "❌ architecture_codex.svg missing"
    exit 1
fi

if [ -f "marketplace/templates/overlay_frame.svg" ]; then
    echo -e "${GREEN}✓${NC} Marketplace overlay frame"
else
    echo "❌ overlay_frame.svg missing"
    exit 1
fi

if [ -f "marketplace/templates/tile_template.svg" ]; then
    echo -e "${GREEN}✓${NC} Marketplace tile template"
else
    echo "❌ tile_template.svg missing"
    exit 1
fi

if [ -f "trust-fabric/design-ledger.md" ]; then
    echo -e "${GREEN}✓${NC} Trust Fabric specification"
else
    echo "❌ design-ledger.md missing"
    exit 1
fi

if [ -f ".github/workflows/designctl.yml" ]; then
    echo -e "${GREEN}✓${NC} CI/CD workflow"
else
    echo "❌ designctl.yml missing"
    exit 1
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✅ VALIDATION COMPLETE${NC}"
echo ""
echo "📦 Design System Status:"
echo "   • Canonical tokens: ✓ Valid"
echo "   • Node CLI: ✓ Functional"
echo "   • Rust CLI: ✓ Built & validated"
echo "   • Generated outputs: ✓ 4/4 artifacts"
echo "   • Shader constants: ✓ WGSL ready"
echo "   • Marketplace templates: ✓ 2/2 SVGs"
echo "   • Trust Fabric: ✓ Spec documented"
echo "   • CI/CD: ✓ Workflow configured"
echo ""
echo "🚀 Next Steps:"
echo "   1. Review generated outputs in design-sync/"
echo "   2. Integrate tokens into frontend (CSS/Tailwind/React)"
echo "   3. Import WGSL constants into sovereign shell shaders"
echo "   4. Push to trigger CI validation workflow"
echo "   5. Implement ledger signing script (trust-fabric)"
echo ""
echo "📖 Full documentation: DESIGN_SYSTEM_README.md"
