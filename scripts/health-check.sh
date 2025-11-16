#!/bin/bash

# TerraFusion OS - System Health Check
# Usage: ./scripts/health-check.sh

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🩺 TerraFusion System Health Check${NC}"
echo "==================================="
echo ""

# Check if we're in TerraFusion root
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Not in TerraFusion root directory${NC}"
    echo "   Expected: package.json and backend/ directory"
    exit 1
fi

echo -e "${GREEN}✅ TerraFusion root directory confirmed${NC}"
echo "   Location: $(pwd)"

# Check Node.js and npm
echo ""
echo -e "${PURPLE}📦 Node.js Environment:${NC}"
if command -v node > /dev/null 2>&1; then
    echo -e "  ${GREEN}✅ Node.js available: $(node --version)${NC}"
    if command -v npm > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ npm available: $(npm --version)${NC}"
    else
        echo -e "  ${RED}❌ npm not available${NC}"
    fi
else
    echo -e "  ${RED}❌ Node.js not available${NC}"
fi

# Check .NET
echo ""
echo -e "${PURPLE}🏛️ Backend Environment:${NC}"
if command -v dotnet > /dev/null 2>&1; then
    echo -e "  ${GREEN}✅ .NET SDK available: $(dotnet --version)${NC}"

    if [ -f "backend/TerraFusion.sln" ]; then
        echo -e "  ${GREEN}✅ TerraFusion.sln found${NC}"
    else
        echo -e "  ${YELLOW}⚠️ TerraFusion.sln not found${NC}"
    fi
else
    echo -e "  ${RED}❌ .NET SDK not available${NC}"
fi

# Check running services
echo ""
echo -e "${CYAN}🚀 TerraFusion Services:${NC}"

# Check Consciousness Engine (port 3004)
echo -n "  🧠 Consciousness Engine (3004): "
if curl -s --max-time 3 http://localhost:3004/health >/dev/null 2>&1; then
    RESPONSE=$(curl -s --max-time 3 http://localhost:3004/health)
    echo -e "${GREEN}✅ $RESPONSE${NC}"
else
    echo -e "${RED}❌ Not responding${NC}"
fi

# Check API Gateway (port 5000)
echo -n "  🏛️ API Gateway (5000): "
if curl -s --max-time 3 http://localhost:5000/health >/dev/null 2>&1; then
    RESPONSE=$(curl -s --max-time 3 http://localhost:5000/health)
    echo -e "${GREEN}✅ $RESPONSE${NC}"
else
    echo -e "${RED}❌ Not responding${NC}"
fi

# Check Frontend Dev Server (multiple ports)
echo -n "  🎨 Frontend Dev Server: "
if curl -s --max-time 3 http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Running (port 3000)${NC}"
elif curl -s --max-time 3 http://localhost:5173 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Running (port 5173)${NC}"
else
    echo -e "${RED}❌ Not responding${NC}"
fi

# Check workspace structure
echo ""
echo -e "${PURPLE}📁 Workspace Structure:${NC}"
if [ -d "workspaces" ]; then
    workspace_count=$(find workspaces -name "*.code-workspace" 2>/dev/null | wc -l)
    echo -e "  ${GREEN}✅ Workspaces directory found ($workspace_count .code-workspace files)${NC}"

    # Check key workspaces
    for workspace in backend frontend master sdk; do
        if [ -f "workspaces/${workspace}.code-workspace" ]; then
            echo -e "    ${GREEN}✅ ${workspace}.code-workspace${NC}"
        else
            echo -e "    ${YELLOW}⚠️ ${workspace}.code-workspace missing${NC}"
        fi
    done
else
    echo -e "  ${YELLOW}⚠️ Workspaces directory not found${NC}"
fi

# Check AI documentation
echo ""
echo -e "${PURPLE}🤖 AI Documentation:${NC}"
for doc in "WORKSPACE_AI_PROFILES.md" "WORKSPACE_COMPANIONS.md" "DAILY_DEV_RUNBOOK.md"; do
    if [ -f "$doc" ]; then
        echo -e "  ${GREEN}✅ $doc found${NC}"
    else
        echo -e "  ${YELLOW}⚠️ $doc not found${NC}"
    fi
done

# Check TerraFusion Developer Console
echo ""
echo -e "${PURPLE}🕹️ TerraFusion Developer Console:${NC}"
if [ -f "tools/tf.js" ]; then
    echo -e "  ${GREEN}✅ TDC script found (tools/tf.js)${NC}"
    if [ -x "tools/tf.js" ]; then
        echo -e "  ${GREEN}✅ TDC script is executable${NC}"
    else
        echo -e "  ${YELLOW}⚠️ TDC script not executable - run 'chmod +x tools/tf.js'${NC}"
    fi
else
    echo -e "  ${RED}❌ TDC script not found${NC}"
fi

# Check git status
echo ""
echo -e "${PURPLE}📝 Git Repository:${NC}"
if [ -d ".git" ]; then
    echo -e "  ${GREEN}✅ Git repository detected${NC}"

    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        changed_count=$(git status --porcelain | wc -l)
        echo -e "  ${YELLOW}⚠️ $changed_count uncommitted files${NC}"
    else
        echo -e "  ${GREEN}✅ Working directory clean${NC}"
    fi

    # Check current branch
    current_branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    echo -e "  📍 Current branch: $current_branch"
else
    echo -e "  ${YELLOW}⚠️ Not a git repository${NC}"
fi

echo ""
echo -e "${BLUE}🏆 TerraFusion Health Check Complete${NC}"
echo ""
echo -e "${CYAN}💡 Quick Start Commands:${NC}"
echo -e "   ${GREEN}npm run tf${NC}               - Launch TerraFusion Developer Console"
echo -e "   ${GREEN}npm run dev${NC}              - Start development servers"
echo -e "   ${GREEN}code workspaces/master.code-workspace${NC} - Open master workspace"
echo ""
echo -e "${BLUE}🏛️ Government. Transcended.${NC}"
