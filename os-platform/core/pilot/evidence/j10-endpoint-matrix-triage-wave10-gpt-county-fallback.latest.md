# Endpoint Matrix Triage Wave 1

- Generated: 2026-05-31T19:52:49.462Z
- Verdict: TRIAGE_ONLY_NO_FIXES
- Reprobe enabled: false
- Production binding touched: false
- DB mutation touched: false
- Feature fixes touched: false
- Packet hash: 18afaf1232d40a35e554a9ee0a9a812e271164ed59da773263d606c208c52b1e

## Summary

| Metric | Count |
| --- | ---: |
| Broken GET endpoints triaged | 29 |

## Likely Cause Counts

- unknown: 29

## Priority Counts

- module blocker: 26
- production blocker: 3

## Status Code Counts

- 400: 7
- 500: 21
- 503: 1

## Broken Endpoint Triage

- GET /api/levy/v1/banked-capacity -> 400; cause=unknown; priority=module blocker; controller=BankedCapacityController; correlation=none
- GET /api/levy/budget/visualization -> 500; cause=unknown; priority=module blocker; controller=BudgetImpactController; correlation=none
- GET /api/levy/budget/scenarios -> 500; cause=unknown; priority=module blocker; controller=BudgetImpactController; correlation=none
- GET /api/costforge/traces -> 400; cause=unknown; priority=production blocker; controller=CostForgeController; correlation=none
- GET /api/sync/doctrine/policy/ratio -> 500; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/ratio/evaluate -> 400; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/universe -> 500; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/universe/classify -> 400; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/universe/attribute-dictionary -> 500; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/sales-qualification -> 500; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/policy/sales-qualification/audit -> 500; cause=unknown; priority=module blocker; controller=DoctrinePolicyController; correlation=none
- GET /api/sync/doctrine/state -> 500; cause=unknown; priority=module blocker; controller=DoctrineStatusController; correlation=none
- GET /api/sync/doctrine/lanes -> 500; cause=unknown; priority=module blocker; controller=DoctrineStatusController; correlation=none
- GET /api/compliance/certification -> 503; cause=unknown; priority=module blocker; controller=GovernmentComplianceController; correlation=none
- GET /api/levy/audit/dashboard -> 500; cause=unknown; priority=module blocker; controller=LevyAuditController; correlation=none
- GET /api/levy/dashboard/summary -> 500; cause=unknown; priority=module blocker; controller=LevyDashboardController; correlation=none
- GET /api/levy/dashboard/metrics -> 500; cause=unknown; priority=module blocker; controller=LevyDashboardController; correlation=none
- GET /api/levy/dashboard/districts-overview -> 500; cause=unknown; priority=module blocker; controller=LevyDashboardController; correlation=none
- GET /api/levy/v1/data-quality/district-risk-summary -> 500; cause=unknown; priority=module blocker; controller=LevyDataQualityController; correlation=none
- GET /api/levy/forecast/dashboard -> 500; cause=unknown; priority=module blocker; controller=LevyForecastController; correlation=none
- GET /api/levy/forecast/compare -> 400; cause=unknown; priority=module blocker; controller=LevyForecastController; correlation=none
- GET /api/levy/search/search -> 400; cause=unknown; priority=module blocker; controller=LevySearchController; correlation=none
- GET /api/levy/search/autocomplete -> 500; cause=unknown; priority=module blocker; controller=LevySearchController; correlation=none
- GET /api/playground/scenarios -> 500; cause=unknown; priority=module blocker; controller=PlaygroundController; correlation=none
- GET /api/levy/public/tax-estimate -> 400; cause=unknown; priority=module blocker; controller=PublicLevyPortalController; correlation=none
- GET /api/swarmintelligence/status -> 500; cause=unknown; priority=production blocker; controller=SwarmIntelligenceController; correlation=none
- GET /api/what-if-scenarios -> 500; cause=unknown; priority=production blocker; controller=WhatIfScenariosController; correlation=none
- GET /api/sync/workbench/f/quarantine/imprv-attr -> 500; cause=unknown; priority=module blocker; controller=WorkbenchFController; correlation=none
- GET /api/sync/workbench/g/commits -> 500; cause=unknown; priority=module blocker; controller=WorkbenchGController; correlation=none

## Hard Stop

Classification only. No endpoint fixes, no production binding, no DB mutation.
