# CP-19 Risk Register

Date: 2026-03-19
Phase: CP-19
Gate: G10
Status: COMPLETE

## Risk Table

| Risk ID | Description | Severity | Owner | Mitigation | Status |
|---|---|---|---|---|---|
| SEC-001 | Cowlitz hardcoded DB credential (carry-forward CP-17 R5) | HIGH | Security | **CLOSED** — remediated in CP-18 sweep | ✅ CLOSED |
| SWARM-8A | Swarm load test (1,008 agents) not executed in live staging | MEDIUM | SRE / AI Swarm Lane | Execute before opening production traffic; AI Swarm lane owns | ⏸ DEFERRED (pre-launch) |
| SWARM-8B | Queue depth guard proof not executed in live staging | MEDIUM | SRE / AI Swarm Lane | Execute Phase 8-B in staging before production traffic | ⏸ DEFERRED (pre-launch) |
| SWARM-8C | Break-glass drill with swarm active not executed | MEDIUM | SRE / AI Swarm Lane | Execute Phase 8-C in staging before production traffic | ⏸ DEFERRED (pre-launch) |
| SRE-RESTORE | Live pg_dump/restore rehearsal not completed | MEDIUM | SRE | Execute in SRE window before production traffic; runbook complete in `restore-proof.md` | ⏸ DEFERRED (pre-launch) |
| SRE-DR | Live DR failover rehearsal not completed | MEDIUM | SRE | Execute in SRE window; runbook complete in `dr-proof.md` | ⏸ DEFERRED (pre-launch) |
| PACS-LIVE | PACS integration not live | LOW | Platform Team | Not a launch blocker for pilot counties (Yakima/Cowlitz); deferred post-launch | ⏸ DEFERRED (post-launch) |
| CODEX-PHASE9 | TerraCanon Codex integration not built | LOW | TerraCanon Team | Reserved post-2026-03-25 per roadmap | ⏸ RESERVED |
| SIGN-OFF | Formal signatures not collected | LOW | Founder | Collected at go-live event gate | ⏸ DEFERRED → go-live event |

## Risk Acceptance Policy

Per `sovereign.yaml` Law 6 (zero tolerance for unlogged risk):
- No implicit carry-forward. Every deferred item has an owner and resolution path.
- SWARM-8A/B/C, SRE-RESTORE, SRE-DR: must complete BEFORE production traffic begins.
- PACS-LIVE, CODEX-PHASE9: post-launch accepted risks (not blockers).
