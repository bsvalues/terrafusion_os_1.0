# CP-17 Risk Register

Date: 2026-03-19
Phase: CP-17
Gate: G8 (SRE/Restore/DR)
Status: COMPLETE

## Risk Table

| # | Risk | Severity | Owner | Resolution Path | Status |
|---|---|---|---|---|---|
| R1 | Live restore rehearsal not executed (Docker unavailable in dev/CI) | MEDIUM | SRE | Execute `pg_dump`/`pg_restore` cycle against staging DB in scheduled SRE window before go-live | DEFERRED |
| R2 | Live DR failover rehearsal (backend/redis container stop-start) not executed | MEDIUM | SRE | Run container-stop scenarios against staging — verify RTO < 5 min target | DEFERRED |
| R3 | Break-glass GitHub Actions drill not triggered in live environment | MEDIUM | SRE + DevOps | Trigger `autonomy-break-glass-guard.yml` on staging branch; verify incident published | DEFERRED |
| R4 | On-call rotation (PagerDuty/Opsgenie) not populated | LOW | Platform Lead | Populate on-call schedule at go-live; page-test before production traffic | DEFERRED |
| R5 | Cowlitz compose file contains hardcoded DB credentials | HIGH | Security | Remediate in CP-18 G9 security sweep; move to `${TF_COWLITZ_DB_PASSWORD}` env var | DEFERRED → CP-18 |
| R6 | Release/Founder authority sign-off placeholder not signed | LOW | Founder | Formal sign-off at go-live gate (CP-19) | DEFERRED → CP-19 |

## Risk Acceptance Policy

Per TerraFusion sovereign.yaml Law 6 (zero tolerance for unlogged risk): all deferred risks are logged and owned. Deferred does NOT mean dismissed. Each row must be resolved or formally accepted before go-live gate (CP-19).

- R1–R4: Accepted for CP-17 seal. SRE execution required before CP-19.
- R5: Escalated to CP-18 security sweep (G9). MUST resolve before CP-19.
- R6: Go-live gate artifact. Resolved at CP-19.

## Carry-Forward From CP-16

| Carry-Forward | Source | Status |
|---|---|---|
| Cowlitz hardcoded credentials | CP-16 `cowlitz-proof.md` | ESCALATED to CP-18 security sweep |
| Live Docker compose activation | CP-16 `startup-wiring-evidence.md` | Partially resolved (static OK); live activation owned by SRE in CP-17 window |
