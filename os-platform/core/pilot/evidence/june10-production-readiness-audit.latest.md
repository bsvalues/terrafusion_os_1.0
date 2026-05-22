# June 10 Production Readiness Audit

Generated: 2026-05-22T15:33:22.478Z

Verdict: not_ready

## Summary

- Ship blockers: 3
- Warnings: 2
- Readiness status: FAIL
- Red-team verdict: RED
- Product-load ledger passed: true
- Lineage-proven tables: 7
- Runtime DB identity passed: true
- Runtime DB identity source: endpoint_contract
- Runtime API base URL: http://terrafusionmarket.com
- Runtime database: terrafusion.db
- Public site: https://terrafusionmarket.com
- Failed runtime probes: 0
- Contract mismatches: 0
- Rust crates: 101
- Rust runtime integrations: 3
- Full production data ready: false
- Full-data-ready counties: 0
- Not-full-data-ready counties: 39

## Ship Blockers

- **CRITICAL readiness**: June 10 readiness packet is not passing. (status=FAIL; shipBlockers=412; warnings=43)
- **CRITICAL red_team**: June 10 red-team verdict is RED. (criticalAttacks=3; shipBlockers=23)
- **CRITICAL full_production_data**: Full production data is not proven for all 39 Washington counties. (fullDataReadyCounties=0; notFullDataReadyCounties=39)

## Warnings

- **public_site**: terrafusionmarket.com public-site smoke has warnings. (1 warning(s))
- **rust_runtime**: Rust engines exist, but live production runtime use is not proven. (crates=101; integrations=3)

## Required Fix Order

1. Make readiness:june10 and truth:june10-readiness-packet pass with zero ship blockers.
2. Load and prove full TerraFusion DB runtime data for all 39 Washington counties.
3. Resolve June 10 red-team critical attacks until the verdict is no longer RED.
4. Prove Rust engine deployment in the live runtime path or remove Rust from launch claims.
5. Re-run this production readiness audit and keep the verdict below full readiness until all blockers clear.

## Banned Production Claims While Blocked

- fully production ready
- all endpoints are live
- all data flows end to end
- terrafusionmarket.com is publicly usable
- 39 counties are runtime-ready
- full production data is ready
- Rust engines are in production use
- TerraFusion DB rows are lineage-proven
