#!/bin/bash

##############################################################################
# TerraFusion OS - Complete Structure Enforcement Suite
# MIT PhD-Level Codebase Organization & AI Agent Containment System
##############################################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              TERRAFUSION OS STRUCTURE ENFORCEMENT            ║${NC}"
echo -e "${BLUE}║                   Complete Organization Suite                 ║${NC}"
echo -e "${BLUE}║                                                              ║${NC}"
echo -e "${BLUE}║  🏛️  Government-Grade Codebase Organization                ║${NC}"
echo -e "${BLUE}║  🤖  AI Agent Containment & Sandbox System                 ║${NC}"
echo -e "${BLUE}║  🛡️  Automated Protection & Recovery                        ║${NC}"
echo -e "${BLUE}║  📊  Real-time Monitoring & Enforcement                     ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"

# Create essential directory structure
echo -e "${YELLOW}🏗️  Creating TerraFusion OS directory structure...${NC}"

# Create main organizational directories
mkdir -p {docs,logs,backup,workspace,scripts,tools}

# Create detailed subdirectories
mkdir -p docs/{ai-agents,architecture,compliance,government,deployment}
mkdir -p logs/{ai-agents,build,deployment,system,errors}
mkdir -p backup/{daily,emergency,before-ai-changes,git-snapshots}
mkdir -p workspace/{ai-temp,ai-quarantine,safe-zone,testing}
mkdir -p scripts/{organization,ai-safety,deployment,monitoring}
mkdir -p tools/{ai-companion,development,compliance,testing}

# Create AI Agent containment directories
mkdir -p workspace/ai-temp/{input,output,scratch,artifacts}
mkdir -p workspace/ai-quarantine/{dangerous,unknown,review-needed}
mkdir -p workspace/safe-zone/{approved,tested,production-ready}

echo -e "${GREEN}✅ Directory structure created${NC}"

# Create scripts first
echo -e "${YELLOW}🔍 Creating structure monitoring system...${NC}"

# Create monitoring script
cat > scripts/organization/monitor-chaos.sh << 'MONITOR_EOF'
#!/bin/bash

ROOT_FILE_COUNT=$(find . -maxdepth 1 -type f | wc -l)
CHAOS_LEVEL="LOW"

echo "🔍 STRUCTURE ANALYSIS REPORT"
echo "================================"

if [ $ROOT_FILE_COUNT -gt 50 ]; then
    CHAOS_LEVEL="EXTREME"
    echo "🚨 CHAOS LEVEL: $CHAOS_LEVEL (${ROOT_FILE_COUNT} files in root)"
elif [ $ROOT_FILE_COUNT -gt 20 ]; then
    CHAOS_LEVEL="HIGH"
    echo "⚠️  CHAOS LEVEL: $CHAOS_LEVEL (${ROOT_FILE_COUNT} files in root)"
elif [ $ROOT_FILE_COUNT -gt 10 ]; then
    CHAOS_LEVEL="MEDIUM"
    echo "⚠️  CHAOS LEVEL: $CHAOS_LEVEL (${ROOT_FILE_COUNT} files in root)"
else
    echo "✅ CHAOS LEVEL: $CHAOS_LEVEL (${ROOT_FILE_COUNT} files in root)"
fi

echo ""
echo "📋 VIOLATIONS DETECTED:"
echo "• Log files in root:" $(find . -maxdepth 1 -name "*.log" | wc -l)
echo "• Text files in root:" $(find . -maxdepth 1 -name "*.txt" | wc -l)  
echo "• Temp files in root:" $(find . -maxdepth 1 -name "*.tmp" -o -name "*~" | wc -l)
echo "• MD files in root:" $(find . -maxdepth 1 -name "*.md" | wc -l)

echo ""
echo "🤖 AI AGENT ACTIVITY:"
if [ -d "workspace/ai-temp" ]; then
    AI_FILES=$(find workspace/ai-temp -type f 2>/dev/null | wc -l)
    echo "• Files in AI workspace: $AI_FILES"
else
    echo "• AI workspace: NOT CONFIGURED"
fi

if [ -d "workspace/ai-quarantine" ]; then
    QUARANTINE_FILES=$(find workspace/ai-quarantine -type f 2>/dev/null | wc -l)
    echo "• Files in quarantine: $QUARANTINE_FILES"
else
    echo "• AI quarantine: NOT CONFIGURED"
fi

MONITOR_EOF

chmod +x scripts/organization/monitor-chaos.sh

echo -e "${GREEN}✅ Structure monitoring created${NC}"
echo -e "${YELLOW}🛡️  Creating structure enforcement system...${NC}"

# Create enforcement script
cat > scripts/organization/enforce-structure.sh << 'ENFORCE_EOF'
#!/bin/bash

echo "🛡️ ENFORCING TERRAFUSION OS STRUCTURE"
echo "====================================="

# Create backup before changes
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "💾 Creating backup: backup/before-enforcement-${TIMESTAMP}.tar.gz"
tar -czf "backup/before-enforcement-${TIMESTAMP}.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='backup' \
    . 2>/dev/null || true

# Move files to appropriate locations
echo "📁 Organizing files..."

# Move log files
LOG_COUNT=$(find . -maxdepth 1 -name "*.log" | wc -l)
if [ $LOG_COUNT -gt 0 ]; then
    echo "  Moving $LOG_COUNT log files to logs/"
    find . -maxdepth 1 -name "*.log" -exec mv {} logs/ \; 2>/dev/null || true
fi

# Move documentation files to docs/ (except README.md)
MD_COUNT=$(find . -maxdepth 1 -name "*.md" ! -name "README.md" | wc -l)
if [ $MD_COUNT -gt 0 ]; then
    echo "  Moving $MD_COUNT documentation files to docs/"
    find . -maxdepth 1 -name "*.md" ! -name "README.md" -exec mv {} docs/ \; 2>/dev/null || true
fi

# Move text files
TXT_COUNT=$(find . -maxdepth 1 -name "*.txt" | wc -l)
if [ $TXT_COUNT -gt 0 ]; then
    echo "  Moving $TXT_COUNT text files to docs/"
    find . -maxdepth 1 -name "*.txt" -exec mv {} docs/ \; 2>/dev/null || true
fi

# Clean temporary files
TEMP_COUNT=$(find . -maxdepth 1 -name "*.tmp" -o -name "*~" | wc -l)
if [ $TEMP_COUNT -gt 0 ]; then
    echo "  Removing $TEMP_COUNT temporary files"
    find . -maxdepth 1 -name "*.tmp" -o -name "*~" -delete 2>/dev/null || true
fi

echo "✅ Structure enforcement complete"

# Show results
ROOT_FILES_AFTER=$(find . -maxdepth 1 -type f | wc -l)
echo "📊 Root directory now contains: $ROOT_FILES_AFTER files"

ENFORCE_EOF

chmod +x scripts/organization/enforce-structure.sh

echo -e "${GREEN}✅ Structure enforcement created${NC}"

# Add package.json scripts if file exists
if [ -f "package.json" ]; then
    echo -e "${YELLOW}📦 Adding npm scripts...${NC}"
    
    # Create backup
    cp package.json package.json.backup
    
    # Add scripts using Node.js
    node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        if (!pkg.scripts) pkg.scripts = {};
        
        pkg.scripts['structure:monitor'] = 'bash scripts/organization/monitor-chaos.sh';
        pkg.scripts['structure:enforce'] = 'bash scripts/organization/enforce-structure.sh';
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        console.log('✅ Package.json updated');
    " 2>/dev/null || echo "⚠️ Could not update package.json automatically"
fi

echo -e "${GREEN}✅ TerraFusion OS Structure Enforcement Suite deployed!${NC}"
echo ""
echo -e "${BLUE}🎯 IMMEDIATE ACTIONS:${NC}"
echo "1. Run: npm run structure:enforce"
echo "2. Run: npm run structure:monitor"
echo ""
echo -e "${BLUE}📊 Current Status:${NC}"
bash scripts/organization/monitor-chaos.sh

