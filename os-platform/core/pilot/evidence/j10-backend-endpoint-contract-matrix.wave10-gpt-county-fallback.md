# Backend Endpoint Contract Matrix

- Generated: 2026-05-31T19:51:59.443Z
- Verdict: CLASSIFICATION_ONLY_NOT_PRODUCTION_READY
- Controller root: C:\Users\bsval\terrafusion_os_1.0\backend\src\TerraFusion.API\Controllers
- Production binding touched: false
- DB mutation touched: false
- Packet hash: 8c29951ab9b0b4e3e3b88d787d9cb86abc90a03872195282652a39c178aaa076

## Summary

| Metric | Count |
| --- | ---: |
| Total endpoints | 1281 |
| Safe dev39 GET candidates | 544 |
| Static-only endpoints | 737 |
| Live dev39 probed endpoints | 544 |

## Classification Counts

| Classification | Count |
| --- | ---: |
| live | 113 |
| protected | 853 |
| broken | 29 |
| mock | 16 |
| dead | 13 |
| not_applicable | 0 |
| unknown | 257 |

## Method Counts

- GET: 782
- POST: 428
- PATCH: 21
- DELETE: 22
- PUT: 28

## Live Dev39 Broken/Dead Sample

- GET /api/levy/v1/banked-capacity: broken (400)
- GET /api/levy/budget/visualization: broken (500)
- GET /api/levy/budget/scenarios: broken (500)
- GET /api/calibrationmemo: dead (404)
- GET /api/costforge/traces: broken (400)
- GET /api/sync/doctrine/policy/ratio: broken (500)
- GET /api/sync/doctrine/policy/ratio/evaluate: broken (400)
- GET /api/sync/doctrine/policy/universe: broken (500)
- GET /api/sync/doctrine/policy/universe/classify: broken (400)
- GET /api/sync/doctrine/policy/universe/attribute-dictionary: broken (500)
- GET /api/sync/doctrine/policy/sales-qualification: broken (500)
- GET /api/sync/doctrine/policy/sales-qualification/audit: broken (500)
- GET /api/sync/doctrine/state: broken (500)
- GET /api/sync/doctrine/lanes: broken (500)
- GET /api/compliance/certification: broken (503)
- GET /api/levy/audit/dashboard: broken (500)
- GET /api/levy/dashboard/summary: broken (500)
- GET /api/levy/dashboard/metrics: broken (500)
- GET /api/levy/dashboard/districts-overview: broken (500)
- GET /api/levy/v1/data-quality/district-risk-summary: broken (500)
- GET /api/levy/forecast/dashboard: broken (500)
- GET /api/levy/forecast/compare: broken (400)
- GET /api/levy/search/search: broken (400)
- GET /api/levy/search/autocomplete: broken (500)
- GET /api/playground/scenarios: broken (500)
- GET /api/levy/public/tax-estimate: broken (400)
- GET /api/swarmintelligence/status: broken (500)
- GET /api/what-if-scenarios: broken (500)
- GET /api/sync/workbench/f/quarantine/imprv-attr: broken (500)
- GET /api/sync/workbench/g/commits: broken (500)

## Hard Stop

This matrix is classification only. Do not fix endpoints, bind production, or mutate data from this lane.
