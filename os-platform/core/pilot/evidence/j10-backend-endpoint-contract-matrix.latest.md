# Backend Endpoint Contract Matrix

- Generated: 2026-06-02T01:50:22.512Z
- Verdict: CLASSIFICATION_ONLY_NOT_PRODUCTION_READY
- Controller root: C:\Users\bsval\terrafusion_os_1.0\backend\src\TerraFusion.API\Controllers
- Production binding touched: false
- DB mutation touched: false
- Packet hash: 581804d874b249584b06e5668fe4dacbd74b17f3d116f5add654d825af2295b0

## Summary

| Metric | Count |
| --- | ---: |
| Total endpoints | 1281 |
| Safe dev39 GET candidates | 457 |
| Static-only endpoints | 796 |
| Live dev39 probed endpoints | 485 |

## Classification Counts

| Classification | Count |
| --- | ---: |
| live | 276 |
| protected | 749 |
| broken | 109 |
| mock | 0 |
| dead | 87 |
| not_applicable | 41 |
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
- GET /api/codex/reports/daily: broken (500)
- GET /api/codex/reports/weekly: broken (500)
- GET /api/codex/reports/monthly: broken (500)
- GET /api/codex/reports/quarterly: broken (500)
- GET /api/codex/reports/annual: broken (500)
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

## Hard Stop

This matrix is classification only. Do not fix endpoints, bind production, or mutate data from this lane.
