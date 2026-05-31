# Backend Endpoint Contract Matrix

- Generated: 2026-05-31T19:15:59.545Z
- Verdict: CLASSIFICATION_ONLY_NOT_PRODUCTION_READY
- Controller root: C:\Users\bsval\terrafusion_os_1.0\backend\src\TerraFusion.API\Controllers
- Production binding touched: false
- DB mutation touched: false
- Packet hash: 50d1f43f607a55926af37ce50d498167bb41425b61093382bd5dfe48c329608f

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
| live | 238 |
| protected | 563 |
| broken | 166 |
| mock | 16 |
| dead | 41 |
| not_applicable | 0 |
| unknown | 257 |

## Method Counts

- GET: 782
- POST: 428
- PATCH: 21
- DELETE: 22
- PUT: 28

## Live Dev39 Broken/Dead Sample

- GET /api/adjustment/proposals: broken (500)
- GET /api/adjustment/sets: broken (500)
- GET /api/adjustment/runs: broken (500)
- GET /api/adjustment/recommend: broken (400)
- GET /api/aimodels/status: dead (404)
- GET /api/aimodels/sentiment-trends: dead (404)
- GET /api/aiorchestration/health: broken (500)
- GET /api/aiorchestration/performance-analytics: broken (500)
- GET /api/aisuperiority/swarm/status: broken (500)
- GET /api/aisuperiority/performance/comparison: broken (500)
- GET /api/aisuperiority/scenarios: broken (500)
- GET /api/aisuperiority/battalions: broken (500)
- GET /api/atlas/gis/geocode: broken (500)
- GET /api/atlas/gis/spatial-query: broken (500)
- GET /api/levy/v1/banked-capacity: broken (400)
- GET /api/levy/budget/visualization: broken (500)
- GET /api/levy/budget/scenarios: broken (500)
- GET /api/calibrationmemo: dead (404)
- GET /api/costforge/data-quality/canonical: broken (400)
- GET /api/debug/canonical-counts: dead (404)
- GET /api/debug/sync-pop-2/pacs-table-columns: dead (404)
- GET /api/debug/pacs-counts: dead (404)
- GET /api/codex/performance/system-wide: broken (500)
- GET /api/codex/performance/foundation: broken (500)
- GET /api/codex/performance/amplification: broken (500)
- GET /api/codex/performance/ultimate-power: broken (500)
- GET /api/codex/performance/alerts: broken (500)
- GET /api/collaboration/users: broken (500)
- GET /api/collaboration/teams: broken (500)
- GET /api/collaboration/projects: broken (500)
- GET /api/collaboration/metrics/teams: broken (500)
- GET /api/collaboration/metrics/tasks: broken (500)
- GET /api/ai/consciousness: dead (501)
- GET /api/ai/consciousness/enhanced: dead (501)
- GET /api/ai/consciousness/system-status: dead (501)
- GET /api/ai/consciousness/status: dead (501)
- GET /api/costforge/traces: broken (400)
- GET /api/costforge-test/status: dead (404)
- GET /api/costforge-test/metrics: dead (404)
- GET /api/costforge-test/agents/status: dead (404)
- GET /api/county-study/studies: broken (400)
- GET /api/dataimport/api/files: dead (404)
- GET /api/dataimport/api/import-history: dead (404)
- GET /api/dataquality/report: broken (500)
- GET /api/dataquality/issues: broken (500)
- GET /api/sync/doctrine/policy/ratio: broken (500)
- GET /api/sync/doctrine/policy/ratio/evaluate: broken (400)
- GET /api/sync/doctrine/policy/universe: broken (500)
- GET /api/sync/doctrine/policy/universe/classify: broken (400)
- GET /api/sync/doctrine/policy/universe/attribute-dictionary: broken (500)

## Hard Stop

This matrix is classification only. Do not fix endpoints, bind production, or mutate data from this lane.
