# TerraFusion OS – Copilot Working Rules
# ========================================
# CRITICAL: This is the compact entrypoint. Read .github/AGENT_ENTRYPOINT.md for full rules.
# Full documentation: .github/copilot-instructions-full.md

## 🚨 PRIME DIRECTIVE
Do not destabilize the Core Governance Surface.

## ✅ ALLOWED SCOPE (CAN MODIFY)
- os-platform/core/pilot/**
- os-platform/core/types/**
- tools/registry/**
- tsconfig.core.json, package.json
- .github/workflows/** (gate wiring only)

## ❌ FORBIDDEN SCOPE (NEVER MODIFY)
- **/ARCHIVE/**
- specialized/**
- applications/**
- os-platform/ai-systems/ai-systems/ai-swarm/**

## 🔒 PORT RULES (ZERO TOLERANCE)
NEVER hardcode ports. ALWAYS use environment variables:
```
❌ localhost:3000  →  ✅ localhost:${TF_FRONTEND_PORT:-3102}
❌ localhost:5000  →  ✅ localhost:${TF_API_PORT:-5046}
❌ port=3000       →  ✅ process.env.TF_FRONTEND_PORT || 3102
```

## 🖥️ FRONTEND PATHS
- ✅ frontend/apps/os-shell/** (authorized - Desktop Shell Zone B)
- ✅ frontend-v2/** (authorized)
- ✅ experience-suite/temp-extract/experience-suite-v5/** (authorized)
- ❌ frontend/** (forbidden - legacy, 97+ errors, except os-shell)

## ✓ REQUIRED GATES (MUST PASS)
```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

## 🔒 CI ENFORCEMENT
All governance rules are enforced by SEAL (the only required check).
Violations will block merge: forbidden paths, legacy frontend, hardcoded ports.

## 📝 COMMIT FORMAT
```
type(scope): subject

Evidence:
- Tests: [results]
- Gates: [passed/failed]

Government: FISMA compliance
AI-Collaboration: [agent_name]
```

## 📚 DOCUMENTATION CHAIN
1. **Quick Start**: This file (compact rules)
2. **Agent Entrypoint**: .github/AGENT_ENTRYPOINT.md
3. **Full Rules**: .ralph/AGENT_RULES.yml
4. **Governance**: AGENTS.md
5. **Full Context**: .github/copilot-instructions-full.md

## 🏛️ THE TERRAFUSION WAY
Government. Transcended.


