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

### NEW Initiative Definition (Machine-Checkable)

**NEW initiative** = any of:
- Introduces a new top-level surface (new page, new module, new tool category)
- Changes authentication/authorization model
- Adds a new data write-lane (new database table, new API mutation)
- Creates a new design language or materials system
- Adds a new integration (external API, county system connection)

**NOT new initiative** (reuse existing discovery):
- Bugfix in existing surface
- Refactor without behavior change
- Test harness or coverage improvement
- Design-system primitive adoption (e.g., LiquidPanel → existing component)
- Route wiring inside existing surfaces
- Performance optimization
- Accessibility compliance fix

**Workflow Sequence:**
```
Discovery → Research → Plan → Execute → Progress Updates
         ↑                              │
         └── (solo-dev: reuse) ─────────┘
```

**NEVER skip directly to implementation. SEAL will block non-compliant PRs.**

See: `.governance/workflow/README.md` for full requirements.

## SCOPE BLOCKING PROTOCOL (Silent Punt Prevention)

If an agent is blocked by scope rules, it MUST output:

1. **Attempted path:** The exact file path it tried to touch
2. **Blocking rule:** The specific rule that blocked it (quote from entrypoint)
3. **Legal alternative:** The nearest legal alternative path or action
4. **Recommendation:** Whether to request scope expansion or change approach

**Example output format:**
```
🚫 SCOPE BLOCKED
   Attempted: frontend/src/legacy/Component.tsx
   Rule: "frontend/src/** ← LEGACY ROOT (97+ errors, do not touch)"
   Alternative: frontend/apps/os-shell/src/components/NewComponent.tsx
   Recommendation: Implement in os-shell instead of legacy root
```

This prevents agents from silently deflecting or handing off without explanation.

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

## MUSE MODE BOUNDARY

Muse Mode is **read/explain/draft only**. It exists to help users think, summarize, compare, draft, and synthesize without mutating sovereign state.

### Allowed in Muse Mode
- Explain architecture, workflows, and evidence
- Summarize records, logs, traces, and parcel context
- Draft language, recommendations, templates, and decision support
- Compare options, propose plans, and prepare human-review output

### Forbidden in Muse Mode
Muse Mode must **never** directly:
- write, update, delete, approve, submit, seal, publish, or dispatch data
- call write-capable tools
- mutate workflow state
- alter parcel records
- emit side effects into suite-owned write lanes

### Escalation Rule
Any action that would create side effects must cross one of these gates:
1. switch to a write-capable operational path in **TerraPilot**, and
2. satisfy required HITL / approval policy before execution.

If an operation requires mutation, Muse Mode must stop at a **gated handoff**. It may prepare the payload, but it may not execute the write.

---

## WRITE-LANE MATRIX

The Write-Lane Matrix governs all writes in TerraFusion OS. All writes are sovereign and lane-bound. A capability may only write inside its own lane unless a separately governed bridge is explicitly defined.

| Capability | Owns write lane for | Must not directly write to | Cross-lane rule |
|---|---|---|---|
| **TerraForge** | valuation artifacts, valuation runs, pricing outputs | TerraDais workflow state, TerraDossier evidence, TerraTrace ledger | emit governed request + TerraTrace event |
| **TerraAtlas** | geospatial layers, map derivations, spatial overlays | Forge valuation artifacts, Dais workflow state, Dossier evidence | emit governed request + TerraTrace event |
| **TerraDais** | workflow state, routing state, task progression | Forge valuation artifacts, Dossier evidence, Trace ledger contents | emit governed request + TerraTrace event |
| **TerraDossier** | evidence packs, supporting documents, review bundles | Dais workflow state, Forge valuation artifacts, Trace ledger contents | emit governed request + TerraTrace event |
| **TerraGPT** | no independent sovereign write lane across suites | all suite-owned records unless mediated by TerraPilot policy/tooling | must act through sanctioned TerraPilot tools only |
| **TerraPilot** | operational orchestration state, gated tool execution metadata | parcel/domain records outside approved tool boundaries | writes only through approved tools and policy gates |
| **TerraTrace** | append-only operational trace ledger | all mutable suite-owned business records | append-only only; never mutates domain truth |

### Write-Lane Rules
- Direct cross-lane mutation is prohibited.
- Cross-lane intent must travel through a governed operation boundary.
- Governed writes must emit TerraTrace lifecycle events.
- No feature may bypass its owning lane by "helper" writes, hidden service calls, or shell shortcuts.

---

## TERRATRACE

**TerraTrace** is the sovereign operational trace ledger for governed actions. It is append-only and tamper-evident.

### Required emission contract
Every governed write must emit:
- `action_started`
- one terminal event: `action_completed` or `action_failed`

### Integrity contract
- Each event must record the hash of the previous event as `previousHash`
- `previousHash` is calculated as `sha256(previousEvent)`
- The first event in a stream may use `null` for `previousHash`
- Redaction may remove protected payload details, but it must not break event-shell integrity or chain continuity

### Authority boundary
- TerraTrace records operational truth about execution
- TerraTrace does **not** become the source of truth for domain data owned by Forge, Atlas, Dais, or Dossier
- Trace events are evidence of action, not a replacement for suite-owned records

---

## PROPERTY WORKBENCH + OS SURFACE SOVEREIGNTY

Parcel-scoped user work must remain inside **Property Workbench**. OS capabilities remain in-shell OS surfaces.

### Routing contract
- Parcel search resolves to `property-workbench`
- Parcel actions resolve to `property-workbench`
- **TerraPilot** opens as an OS surface in-shell
- **TerraTrace** opens as an OS surface in-shell
- Dock / top bar / sovereign desktop chrome must remain preserved during these launches

This entrypoint is the canonical authority for agent behavior, mode boundaries, write-lane discipline, and trace obligations.