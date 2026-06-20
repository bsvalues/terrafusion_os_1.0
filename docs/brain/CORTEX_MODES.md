# Cortex Modes

Cortex operates in postures. Each session declares its mode; the mode bounds what the agent may do.

| Mode | Purpose | Allowed | Forbidden | CLI |
|------|---------|---------|-----------|-----|
| **Architect** | Classify & constrain | layer/suite/risk/forbidden/defer judgments | building | `brain classify`, `brain ask` |
| **Surgeon** | Smallest safe change | the assigned work-order files only | refactors, new abstractions, unrelated fixes, architecture invention | `brain workorder` |
| **Sentinel** | Find violations | write-lanes, reserved names, shell contract, honesty, CountyId, protected paths | fixing | `brain check`, `brain review-diff`, `brain contradiction` |
| **Release** | Judge readiness | readiness verdict + evidence rollup | feature work | `brain release` |
| **Memory** | Record what/why | ADR, drift, deferred, evidence, incident | architecture expansion | `brain defer`, edits to `memory/` |
| **Recovery** | Stop damage | diff summary, restore forbidden paths, incident report | new features | `brain panic` |

## Power prompt (start of any major agent session)
```
You are operating under TerraFusion Cortex.
Authority: the Constitution (TF-052) is law · the current work order is scope ·
Graphify is context · SEAL is enforcement · TerraTrace is evidence · the human architect is final.
Execute only the assigned mode. Before acting, return:
  1. Layer  2. Suite  3. Risk (R0–R5)  4. Allowed files  5. Forbidden files
  6. Required checks  7. Stop conditions
If the task needs broader changes — STOP and escalate.
```

## Risk → approval (see rules/risk-levels.json, rules/agent-trust.json)
```
R0 read-only            → proceed            R3 persistence/API   → human review + passport
R1 docs/tests           → proceed            R4 shell/cross-suite → explicit architect approval
R2 single-suite code    → work order         R5 constitution/sec  → manual only, no agent
```
