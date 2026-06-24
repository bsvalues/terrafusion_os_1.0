# Agent Drift Report (Lane 9)

*Deliverable #9.* Status: **complete**. Confidence: **high** (medium on date anomalies).
Method: Explore agent — agent-directory inventory + completion-claim scan vs code reality.

## Agent directory inventory

| Dir | Purpose | Status |
|---|---|---|
| `.claude/` | Claude Code workspace + memory + skills (`settings.local.json` 34K) | **active** (session state, stale snapshot) |
| `.governance/` (~2M) | truth-gates, runbooks, wave ledgers 0–5, signoff | **load-bearing** |
| `.terrafusion/` | command registry, control-center state, release-freeze cards | **active** |
| `.ai/`, `.claudecode/`, `.codex/`, `.superpowers/` | agent-framework docs/config | reference |
| `.ralph/` | agent rules (`AGENT_RULES.yml`, `WHY_AGENTS_IGNORE_RULES.md`) | reference (not enforced this session) |
| `ops/agents/` | execution contract + 6 dated session logs | historical/audit |
| `brain/packs/` | AI context packs | reference |
| `backend/.../Consciousness`, `backend/ai-swarm/agents/` | swarm services/agents | **vapor / island** |

## False-finish register (claim vs reality)

| Claim | Location | Reality | Verdict |
|---|---|---|---|
| "1,008 AI agents ready" | `DevOpsController.cs:84` + 4 more files | hardcoded constant; no agents boot; consciousness = "lane unavailable" | **FALSE** (honesty debt) |
| "AI Swarm 157 + 898 agents" | `AI_ESTATE_INVENTORY.md:32-42` | in-memory objects, not agents; tests `expect(true).toBe(true)` | **FALSE / vapor** |
| "Consciousness/quantum operational" | `TerraFusion.Consciousness/Services/*` | explicit "lane unavailable" stubs | **vapor** (honestly labeled in code) |
| "Phase 3/4 complete" | `tools/tdc/PHASE_3_COMPLETE.md`, `PHASE_4_COMPLETE.md` | real files + passing tests, but **scoped to TDC tool**, not OS-integrated | **OK if boundary stated** |
| "Sealed / production-ready" | `SEALED.md` (seal date 2025-12-13) | controls exist; seal predates much later work → aspirational | **questionable** |
| "PR #995 green on CI" | `.claude/memory/project_current_state.md` | internally consistent but **stale** (dated 2026-06-14) | likely-OK, stale |

## Anomalies worth a date check
- `ops/agents/sessions/` logs dated **2025-12** while repo head is 2026-06 — verify these
  are not data-entry errors or evidence of clock skew during agent runs.
- `SEALED.md` "sealed 2025-12-13" vs ongoing 2026 work — the seal is not a true freeze.

## Misplaced work
Generally **low** — the recurring pattern is *stub/vapor code in the correct directory*,
not code in the wrong domain. Main exception: **dual `/explain`** (real `PilotController`
vs canned `GPTController`) needs consolidation.

## Drift conclusion
Agent drift here is **not chaotic file misplacement** — it is **narrative drift**:
completion docs and status endpoints assert capabilities the code doesn't have. The repo's
own honest docs (`AI_ESTATE_INVENTORY.md`, `security/baseline.md`) already catalog most of
it; the fix is to make the loud surfaces (CLAUDE.md claims, status endpoints, SEALED.md)
agree with those honest docs.
