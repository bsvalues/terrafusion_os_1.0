# Current Use Install Order

## Recommended Order

1. `terra-current-use-phase1.zip`
2. `terra-current-use-backend-phase1.zip`
3. `terra-current-use-hardening-pack.zip`
4. `terra-current-use-persistence-pack.zip`
5. `terra-current-use-notice-pack.zip`
6. `terra-current-use-terratrace-audit-pack.zip`
7. `terra-current-use-policy-governance-pack.zip`

Stop here for first internal alpha.

Only after that:

8. `terra-current-use-dossier-evidence-pack.zip`
9. `terra-current-use-dais-workflow-pack.zip`
10. `terra-current-use-atlas-pack.zip`
11. `terra-current-use-treasurer-handoff-pack.zip`
12. `terra-current-use-appeals-reclassification-pack.zip`
13. `terra-current-use-inspection-compliance-pack.zip`
14. `terra-current-use-ai-assist-pack.zip`
15. `terra-current-use-analytics-pack.zip`

## First Production-Safe Alpha

Enable only:

```txt
coreWorkbench = true
rollbackCalculator = true
notices = true
terraTraceAudit = true
policyGovernance = true
```

Everything else stays behind feature flags.
