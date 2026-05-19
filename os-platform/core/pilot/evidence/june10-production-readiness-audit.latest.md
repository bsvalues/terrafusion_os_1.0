# June 10 Production Readiness Audit

Generated: 2026-05-19T19:24:37.956Z

Verdict: not_ready

## Summary

- Ship blockers: 6
- Warnings: 1
- Readiness status: FAIL
- Red-team verdict: RED
- Product-load ledger passed: false
- Lineage-proven tables: 0
- Runtime DB identity passed: false
- Runtime API base URL: http://localhost:5046
- Runtime database: terrafusion
- Public site: missing
- Failed runtime probes: missing
- Contract mismatches: missing
- Rust crates: missing
- Rust runtime integrations: missing

## Ship Blockers

- **CRITICAL readiness**: June 10 readiness packet is not passing. (status=FAIL; shipBlockers=12; warnings=0)
- **CRITICAL red_team**: June 10 red-team verdict is RED. (criticalAttacks=3; shipBlockers=23)
- **CRITICAL product_load_lineage**: TerraFusion DB product-load lineage is not proven. (passed=false; lineageProven=0; rowsExistLineageUnproven=6)
- **CRITICAL runtime_db_identity**: Runtime TerraFusion DB identity did not pass. (apiBaseUrl=http://localhost:5046; database=terrafusion)
- **HIGH public_site**: terrafusionmarket.com public-site smoke evidence is missing.
- **HIGH endpoint_contract**: Endpoint contract smoke evidence is missing.

## Warnings

- **rust_runtime**: Rust runtime usage evidence is missing.

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
