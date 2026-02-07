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
- Governance: AGENTS.md- **Workflow Governance: .governance/workflow/README.md**

## WORKFLOW GOVERNANCE (MANDATORY)

**For any non-trivial change (feature/refactor/UX), you MUST:**

1. **Discovery Phase** - Ask 30+ questions, document intent
2. **Research Phase** - Parallel sub-agent research
3. **Plan Phase** - Define phases, tasks, acceptance criteria
4. **Execute Phase** - TDD, update progress with commits

**Required Artifacts:**
```
.governance/workflow/discovery.md  - Intent + constraints + Q/A
.governance/workflow/research.md   - Domain research + prior art
.governance/workflow/plan.md       - Phases + tasks + DoD
.governance/workflow/progress.md   - Status + commits + next steps
```

**Workflow Sequence:**
```
Discovery → Research → Plan → Execute → Progress Updates
```

**NEVER skip directly to implementation. SEAL will block non-compliant PRs.**

See: `.governance/workflow/README.md` for full requirements.