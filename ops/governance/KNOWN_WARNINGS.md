# TerraFusion OS — Known Warnings

> **Status**: Active  
> **Last Updated**: 2025-12-29

---

## Purpose

This document records **accepted non-blocking warnings** that may appear during gate checks. Each warning has:

- Root cause explanation
- Why it's non-blocking
- How to clear it
- Evidence of resolution

---

## WARN-001: RAG Index Stale

### Trigger

```
[6/11] RAG Index: ⚠ WARN (Nd stale)
   TIP: Run 'tf ai ingest' to refresh
```

### Root Cause

The AI Lab RAG (Retrieval-Augmented Generation) index has not been refreshed in N days. The index is used for semantic code search and AI-assisted queries.

### Why Non-Blocking

- RAG index is **development tooling**, not production runtime
- Stale index affects AI search quality, not system correctness
- No county data or governance systems depend on RAG freshness
- Gate passes with WARN status (exit code 0)

### Impact

| Area | Impact |
|------|--------|
| Production | None |
| CI/CD | None |
| County Data | None |
| AI Search | Degraded (stale results) |
| Governance | None |

### How to Clear

```bash
# Refresh the RAG index
./ops/dev/tf.sh ai ingest
```

### Expected Output (Success)

```
[6/11] RAG Index: ✓ PASS (fresh)
```

### Expected Output (After Refresh)

```
AI Lab: Ingesting workspace...
  Processing: ops/
  Processing: backend/
  Processing: frontend/
  ...
  Indexed: N files, M chunks
  Duration: Xs
✓ RAG index refreshed
```

### Acceptance Criteria

This warning is **accepted** when:

1. AI Lab is not deployed (development-only environments)
2. RAG refresh is scheduled but not yet run
3. Index age < 30 days (informational only)

This warning is **NOT accepted** when:

1. AI Lab is deployed and in use
2. Index age > 30 days in active development
3. Semantic search is required for operations

---

## WARN-002: Hub Tasks Drift (Resolved)

### Trigger

```
[9/11] Hub Tasks Sync: ⚠ WARN (drift - run 'tf hub sync')
```

### Root Cause

The `.vscode/tasks.json` file has diverged from the canonical registry.

### How to Clear

```bash
./ops/dev/tf.sh hub sync
```

### Status

✅ **Resolved** — As of `cbfc37a6a`, hub tasks are in sync.

---

## Warning Acceptance Policy

### Accepted Warnings

| Code | Description | Max Duration |
|------|-------------|--------------|
| WARN-001 | RAG Index Stale | 30 days |

### Escalation

Warnings become **blocking** if:

- Duration exceeds maximum
- Multiple warnings accumulate (>2)
- Warning affects production systems

### Review Cadence

- Weekly: Check warning count
- Monthly: Review warning acceptance
- Quarterly: Audit warning policy

---

## Audit Trail

| Date | Warning | Action | Outcome |
|------|---------|--------|---------|
| 2025-12-29 | WARN-001 | Documented | Accepted |
| 2025-12-29 | WARN-002 | Resolved | Cleared |

---

**Government. Transcended.** 🏛️
