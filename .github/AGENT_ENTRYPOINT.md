# TERRAFUSION AGENT ENTRYPOINT
# ================================
# READ THIS FIRST - MANDATORY FOR ALL AI AGENTS
# This is the compact, machine-readable version of governance rules.
# Full documentation: .ralph/AGENT_RULES.yml

## PRIME DIRECTIVE
Do not destabilize the Core Governance Surface.

## ALLOWED SCOPE (CAN MODIFY)
- os-platform/core/pilot/**
- os-platform/core/types/**
- tools/registry/**
- tsconfig.core.json
- package.json
- .github/workflows/** (gate wiring only)

## FORBIDDEN SCOPE (NEVER MODIFY)
- **/ARCHIVE/**
- specialized/**
- applications/**
- os-platform/ai-systems/ai-systems/ai-swarm/**

## REQUIRED GATES (MUST PASS)
```bash
pnpm run type-check
node --test os-platform/core/tests/phase83-tools.test.mjs
```

## PORT RULES (ZERO TOLERANCE)
NEVER hardcode ports. ALWAYS use environment variables:
- ❌ localhost:3000 → ✅ localhost:${TF_FRONTEND_PORT:-3102}
- ❌ localhost:5000 → ✅ localhost:${TF_API_PORT:-5046}
- ❌ port=3000     → ✅ process.env.TF_FRONTEND_PORT || 3102

## FRONTEND PATHS
- ✅ ALLOWED: frontend-v2/**, experience-suite/temp-extract/experience-suite-v5/**
- ❌ FORBIDDEN: frontend/** (legacy, 97+ errors)

## COMMIT FORMAT
```
type(scope): subject

Evidence:
- Tests: [results]
- Gates: [status]
- Codex: [score]/12

Government: FISMA compliance status
AI-Collaboration: [agent_name]
```

## FULL DOCUMENTATION
- Core Rules: .ralph/AGENT_RULES.yml
- Port Rules: AI_AGENT_PORT_RULES_STRICT.md
- Frontend: AI_AGENT_FRONTEND_PROTECTION.md
- Governance: AGENTS.md
