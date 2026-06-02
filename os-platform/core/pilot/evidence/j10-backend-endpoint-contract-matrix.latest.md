# Backend Endpoint Contract Matrix

- Generated: 2026-06-02T02:00:58.526Z
- Verdict: CLASSIFICATION_ONLY_NOT_PRODUCTION_READY
- Controller root: C:\Users\bsval\terrafusion_os_1.0\backend\src\TerraFusion.API\Controllers
- Production binding touched: false
- DB mutation touched: false
- Packet hash: f5f84fa891afe6fc4b5fdfdbdd7d2f27b9fbf9e890bdc89ae63d10331ce9e202

## Summary

| Metric | Count |
| --- | ---: |
| Total endpoints | 1281 |
| Safe dev39 GET candidates | 446 |
| Static-only endpoints | 807 |
| Live dev39 probed endpoints | 474 |

## Classification Counts

| Classification | Count |
| --- | ---: |
| live | 276 |
| protected | 744 |
| broken | 98 |
| mock | 0 |
| dead | 95 |
| not_applicable | 49 |
| unknown | 19 |

## Method Counts

- GET: 782
- POST: 428
- PATCH: 21
- DELETE: 22
- PUT: 28

## Live Dev39 Broken/Dead Sample

- GET /api/aimodels/status: dead (404)
- GET /api/aimodels/sentiment-trends: dead (404)
- GET /api/aiorchestration/health: broken (500)
- GET /api/aiorchestration/performance-analytics: broken (500)
- GET /api/aisuperiority/swarm/status: broken (500)
- GET /api/aisuperiority/performance/comparison: broken (500)
- GET /api/aisuperiority/scenarios: broken (500)
- GET /api/aisuperiority/battalions: broken (500)
- GET /api/aiswarm/status: dead (501)
- GET /api/aiswarm/performance: dead (501)
- GET /api/aiswarm/workflows: dead (501)
- GET /api/atlas/spatial: broken (503)
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
- GET /api/codex/collaboration/health: broken (500)
- GET /api/collaboration/users: broken (500)
- GET /api/collaboration/teams: broken (500)
- GET /api/collaboration/projects: broken (500)
- GET /api/collaboration/metrics/teams: broken (500)
- GET /api/collaboration/metrics/tasks: broken (500)
- GET /api/ai/consciousness: dead (501)
- GET /api/ai/consciousness/enhanced: dead (501)
- GET /api/ai/consciousness/system-status: dead (501)
- GET /api/ai/consciousness/status: dead (501)
- GET /api/costforge/matrix: broken (400)
- GET /api/costforge/neighborhoods: broken (503)
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
- GET /api/sync/doctrine/policy/sales-qualification: broken (500)
- GET /api/sync/doctrine/policy/sales-qualification/audit: broken (500)

## Hard Stop

This matrix is classification only. Do not fix endpoints, bind production, or mutate data from this lane.
