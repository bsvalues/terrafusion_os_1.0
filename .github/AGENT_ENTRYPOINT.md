# TERRAFUSION AGENT ENTRYPOINT
# ================================
# READ THIS FIRST - MANDATORY FOR ALL AI AGENTS
# This is the compact, machine-readable version of governance rules.
# Full documentation: .ralph/AGENT_RULES.yml

## PRIME DIRECTIVE
Do not destabilize the Core Governance Surface.

## ALLOWED SCOPE (CAN MODIFY)

### Lane A: Core Governance
- os-platform/core/pilot/**
- os-platform/core/types/**
- tools/registry/**
- tsconfig.core.json
- package.json
- .github/workflows/** (gate wiring only)

### Lane B: OS Shell UI (Desktop Shell Zone B)
- frontend/apps/os-shell/** ← ACTIVE UI SURFACE
- frontend/packages/** (shared UI libs)
- .governance/workflow/** (workflow docs)
- .governance/mesh/** (mesh coordination)

## FORBIDDEN SCOPE (NEVER MODIFY)
- **/ARCHIVE/**
- specialized/**
- applications/**
- os-platform/ai-systems/ai-systems/ai-swarm/**
- frontend/src/** ← LEGACY ROOT (97+ errors, do not touch)

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

## FRONTEND PATHS (CLARIFIED)

**ALLOWED (active UI surfaces):**
- ✅ `frontend/apps/os-shell/**` ← OS Shell (Desktop, Workbench, MWUX)
- ✅ `frontend/packages/**` ← Shared UI primitives
- ✅ `frontend-v2/**` ← Future migration target
- ✅ `experience-suite/temp-extract/experience-suite-v5/**`

**FORBIDDEN (legacy dead code):**
- ❌ `frontend/src/**` ← Legacy root with 97+ errors
- ❌ `frontend/components/**` ← Old component tree (if exists)

**The Rule:** `frontend/apps/os-shell/**` is NOT legacy. It IS the active UI.

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
- **Workflow Governance: .governance/workflow/README.md**
- **Mesh Governance: .governance/mesh/MESH_GOVERNANCE.md**

## WORKFLOW GOVERNANCE (MANDATORY)

### Non-Trivial Change Triggers (Deterministic)

Workflow docs required when PR touches:
- `frontend/apps/os-shell/src/**` (OS Shell UI)
- `os-platform/core/pilot/**` (Core governance)
- `tools/registry/**` (Tool infrastructure)
- Any new "initiative" (design language, auth, new module)

**NOT required for:**
- Pure doc updates (README, comments)
- Dependency bumps (automated)
- CI/CD config tweaks
- Typo fixes

### Workflow Phases

1. **Discovery Phase** - Ask 30+ questions, document intent
2. **Research Phase** - Parallel sub-agent research
3. **Plan Phase** - Define phases, tasks, acceptance criteria
4. **Execute Phase** - TDD, update progress with commits

### Required Artifacts
```
.governance/workflow/discovery.md  - Intent + constraints + Q/A
.governance/workflow/research.md   - Domain research + prior art
.governance/workflow/plan.md       - Phases + tasks + DoD
.governance/workflow/progress.md   - Status + commits + next steps
```

### Solo-Dev Mode (`TF_SOLO_DEV=1`)

When enabled, workflow is optimized for single developer:

- **Skip repeated discovery:** If `discovery.md` already has a section for this feature/phase, reuse it
- **30+ questions:** Only required for NEW initiatives, not incremental work on existing plan
- **Update minimum:** Must update `plan.md` + `progress.md` for any triggering change
- **Create all 4 docs:** Only when starting a completely new initiative

**Workflow Sequence:**
```
Discovery → Research → Plan → Execute → Progress Updates
         ↑                              │
         └── (solo-dev: reuse) ─────────┘
```

**NEVER skip directly to implementation. SEAL will block non-compliant PRs.**

See: `.governance/workflow/README.md` for full requirements.

## AGENT MESH (OPTIONAL - MULTI-AGENT SESSIONS)

Enable lateral agent communication for parallel work:

```bash
TF_AGENT_MESH=1  # Enable mesh
```

**When mesh is enabled:**

1. **Structured messages only** - Use defined types: REQUEST, PROPOSAL, DECISION, CONFLICT, BLOCKER, FYI, SYNC
2. **Single merge authority** - Only Integrator can issue DECISION
3. **Doc-first law** - DECISION must land in canonical docs
4. **Rate-limited routing** - Route to channels/roles, not broadcast
5. **Security by default** - No PII, no credentials, redaction enabled

**Message Channels:**
- `#discovery` - Intent clarification
- `#research` - Domain findings
- `#architecture` - Design decisions
- `#build` - Implementation coordination
- `#qa` - Testing, compliance
- `#decisions` - Final decisions (Integrator only)

**Roles:**
- **Integrator** - Merge authority, owns plan.md + progress.md
- **Researcher** - Domain research, evidence gathering
- **Builder** - Implementation, tests
- **Reviewer** - Quality gates, compliance

**Conflict Resolution:**
1. Raise `CONFLICT` with evidence from both sides
2. Integrator applies rubric: Correctness > Security > Plan Alignment > Simplicity > Performance > Velocity
3. Integrator issues `DECISION` with rationale
4. Losing party acknowledges

See: `.governance/mesh/MESH_GOVERNANCE.md` for full specification.