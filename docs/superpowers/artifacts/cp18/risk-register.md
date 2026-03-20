# CP-18 Risk Register

Date: 2026-03-19
Phase: CP-18
Gate: G9
Status: COMPLETE

## Risk Table

| Risk ID | Description | Severity | Owner | Mitigation | Status |
|---|---|---|---|---|---|
| SEC-001 | Cowlitz hardcoded DB credential (carry-forward CP-17 R5) | HIGH | Security | **REMEDIATED** — replaced with `${TF_COWLITZ_DB_PASSWORD:?...}` env var in `compose/docker-compose.cowlitz.yml` | ✅ CLOSED |
| AI-SWARM-LOAD | Swarm load test (1,008 agents) not executed — staging required | MEDIUM | SRE / AI Swarm Lane | Execute in authorized staging window; Copilot lane not permitted to modify `specialized/` | ⏸ DEFERRED |
| AI-SWARM-QUEUE | Queue depth guard proof not executed | MEDIUM | SRE / AI Swarm Lane | Execute as part of Phase 8-B in staging | ⏸ DEFERRED |
| AI-SWARM-BG | Break-glass drill with swarm active not executed | MEDIUM | SRE / AI Swarm Lane | Execute as part of Phase 8-C in staging | ⏸ DEFERRED |
| SRE-LIVE | Live restore/DR/on-call rehearsals (CP-17 R1–R4) not completed | MEDIUM | SRE | Execute in scheduled SRE window before CP-19 | ⏸ DEFERRED |
| SIGN-OFF | Founder/Release Authority signatures not collected | LOW | Founder | Formal sign-off at CP-19 go-live gate | ⏸ DEFERRED → CP-19 |

## Risk Acceptance Policy

Per sovereign.yaml Law 6 (zero tolerance for unlogged risk):
- SEC-001: CLOSED — no residual exposure.
- AI swarm and live SRE rehearsal risks: ACCEPTED for G9 static seal. Must complete before CP-19.
- Sign-off: go-live gate artifact resolved at CP-19.
