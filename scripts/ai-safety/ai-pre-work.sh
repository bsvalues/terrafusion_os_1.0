#!/bin/bash

# TerraFusion OS AI Agent Pre-Work Safety Protocol
# MUST be run before any AI agent operations

echo "🛡️ PREPARING ENVIRONMENT FOR AI AGENT WORK"
echo "=========================================="

# 1. Create timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "💾 Creating AI safety backup..."
tar -czf "backup/before-ai-changes/ai-backup-${TIMESTAMP}.tar.gz" \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='backup' \
    . 2>/dev/null

# 2. Enforce current structure
echo "🏗️ Enforcing structure before AI work..."
bash scripts/organization/enforce-structure.sh

# 3. Clear AI workspace
echo "🧹 Clearing AI workspace..."
rm -rf workspace/ai-temp/*
mkdir -p workspace/ai-temp/{input,output,scratch,artifacts}

# 4. Create session marker
echo "Session started: $(date)" > workspace/ai-temp/SESSION_ACTIVE
echo "Backup created: ai-backup-${TIMESTAMP}.tar.gz" >> workspace/ai-temp/SESSION_ACTIVE

# 5. Set permissions (AI agents can only write to ai-temp)
chmod 755 workspace/ai-temp
chmod 755 workspace/ai-quarantine

echo "✅ Environment ready. AI agents may now work in workspace/ai-temp/"
echo "🚨 WARNING: AI agents must ONLY modify files in workspace/ai-temp/"