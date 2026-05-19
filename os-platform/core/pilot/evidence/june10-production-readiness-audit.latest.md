# June 10 Production Readiness Audit

Generated: 2026-05-19T22:01:47.375Z

Verdict: not_ready

## Summary

- Ship blockers: 5
- Warnings: 2
- Readiness status: FAIL
- Red-team verdict: RED
- Product-load ledger passed: false
- Lineage-proven tables: 0
- Runtime DB identity passed: false
- Runtime API base URL: http://localhost:5046
- Runtime database: terrafusion
- Public site: https://terrafusionmarket.com
- Failed runtime probes: 0
- Contract mismatches: 0
- Rust crates: 101
- Rust runtime integrations: 3

## Ship Blockers

- **CRITICAL readiness**: June 10 readiness packet is not passing. (status=FAIL; shipBlockers=12; warnings=0)
- **CRITICAL red_team**: June 10 red-team verdict is RED. (criticalAttacks=3; shipBlockers=23)
- **CRITICAL product_load_lineage**: TerraFusion DB product-load lineage is not proven. (passed=false; lineageProven=0; rowsExistLineageUnproven=6)
- **CRITICAL runtime_db_identity**: Runtime TerraFusion DB identity did not pass. (apiBaseUrl=http://localhost:5046; database=terrafusion)
- **HIGH public_site**: terrafusionmarket.com public-site smoke is not passing. (access_policy: Public signup is disabled and no access-request channel is exposed by /api/auth/access-policy.)

## Warnings

- **public_site**: terrafusionmarket.com public-site smoke has warnings. (1 warning(s))
- **rust_runtime**: Rust engines exist, but live production runtime use is not proven. (crates=101; integrations=3)

## Required Fix Order

1. Make readiness:june10 and truth:june10-readiness-packet pass with zero ship blockers.
2. Emit TerraFusion DB product-load receipts and prove lineage for runtime truth tables.
3. Restore live runtime endpoint probes for the expected API base URLs.
4. Fix terrafusionmarket.com public access posture: usable signup/access request or remove misleading signup route.
5. Resolve frontend/backend endpoint contract mismatches.
6. Prove Rust engine deployment in the live runtime path or remove Rust from launch claims.
7. Re-run this production readiness audit and keep the verdict below full readiness until all blockers clear.

## Banned Production Claims While Blocked

- fully production ready
- all endpoints are live
- all data flows end to end
- terrafusionmarket.com is publicly usable
- 39 counties are runtime-ready
- Rust engines are in production use
- TerraFusion DB rows are lineage-proven
