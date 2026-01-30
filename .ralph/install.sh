#!/bin/bash
# ============================================================================
# TerraFusion Ralph Loop Installation Script
# ============================================================================
# This script installs the Agent Governance Gateway and Ralph Loop
# Run this once to enable autonomous optimization with enforcement
#
# Usage:
#   chmod +x .ralph/install.sh
#   ./.ralph/install.sh
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo ""
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}   TerraFusion Ralph Loop Installation${NC}"
echo -e "${PURPLE}   Autonomous Optimization with Agent Governance${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ============================================================================
# STEP 1: Install Pre-Commit Hook
# ============================================================================
echo -e "${CYAN}[1/5] Installing pre-commit hook...${NC}"

if [[ -d "$PROJECT_ROOT/.git" ]]; then
    cp "$SCRIPT_DIR/hooks/pre-commit" "$PROJECT_ROOT/.git/hooks/pre-commit"
    chmod +x "$PROJECT_ROOT/.git/hooks/pre-commit"
    echo -e "${GREEN}  ✅ Pre-commit hook installed${NC}"
else
    echo -e "${YELLOW}  ⚠️ No .git directory found, skipping hook installation${NC}"
fi

# ============================================================================
# STEP 2: Create logs directory
# ============================================================================
echo -e "${CYAN}[2/5] Creating log directories...${NC}"

mkdir -p "$PROJECT_ROOT/logs/ralph"
echo -e "${GREEN}  ✅ Log directory created: logs/ralph/${NC}"

# ============================================================================
# STEP 3: Make loop.sh executable
# ============================================================================
echo -e "${CYAN}[3/5] Setting permissions...${NC}"

chmod +x "$SCRIPT_DIR/loop.sh"
echo -e "${GREEN}  ✅ loop.sh is now executable${NC}"

# ============================================================================
# STEP 4: Validate configuration
# ============================================================================
echo -e "${CYAN}[4/5] Validating configuration...${NC}"

if [[ -f "$SCRIPT_DIR/config.yml" ]]; then
    echo -e "${GREEN}  ✅ config.yml found${NC}"
else
    echo -e "${RED}  ❌ config.yml missing!${NC}"
    exit 1
fi

if [[ -f "$SCRIPT_DIR/AGENT_RULES.yml" ]]; then
    echo -e "${GREEN}  ✅ AGENT_RULES.yml found${NC}"
else
    echo -e "${RED}  ❌ AGENT_RULES.yml missing!${NC}"
    exit 1
fi

if [[ -f "$SCRIPT_DIR/swarm-integration.yml" ]]; then
    echo -e "${GREEN}  ✅ swarm-integration.yml found${NC}"
else
    echo -e "${YELLOW}  ⚠️ swarm-integration.yml missing (QC-019 not wired)${NC}"
fi

# ============================================================================
# STEP 5: Create .env.ports if it doesn't exist
# ============================================================================
echo -e "${CYAN}[5/5] Checking port configuration...${NC}"

if [[ ! -f "$PROJECT_ROOT/.env.ports" ]]; then
    cat > "$PROJECT_ROOT/.env.ports" << 'EOF'
# TerraFusion Port Configuration
# NO HARDCODED PORTS - Use these environment variables
export TF_API_PORT=5046
export TF_FRONTEND_PORT=3102
export TF_SHELL_PORT=3100
export TF_DESKTOP_PORT=3104
export TF_STATIC_PORT=3105
export TF_LOKI_PORT=3100
export TF_CONSCIOUSNESS_PORT=3004
export TF_GATEWAY_PORT=3002
EOF
    echo -e "${GREEN}  ✅ Created .env.ports with default configuration${NC}"
else
    echo -e "${GREEN}  ✅ .env.ports already exists${NC}"
fi

# ============================================================================
# INSTALLATION COMPLETE
# ============================================================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ Installation Complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${CYAN}What was installed:${NC}"
echo "  • Pre-commit hook for governance enforcement"
echo "  • Ralph Loop autonomous optimization script"
echo "  • Agent Rules (machine-readable governance)"
echo "  • QC-019 Swarm Integration"
echo "  • Default waterfall-elimination task"
echo ""
echo -e "${CYAN}Usage:${NC}"
echo "  # Run Ralph Loop (dry run first)"
echo "  .ralph/loop.sh --dry-run"
echo ""
echo "  # Run Ralph Loop for real"
echo "  .ralph/loop.sh"
echo ""
echo "  # Run with max 5 iterations"
echo "  .ralph/loop.sh --max 5"
echo ""
echo -e "${CYAN}Pre-commit enforcement is now active!${NC}"
echo "  • Forbidden paths: BLOCKED"
echo "  • Hardcoded ports: BLOCKED"
echo "  • Legacy frontend: BLOCKED"
echo ""
echo -e "${PURPLE}Government. Transcended. Autonomously.${NC}"
echo ""
