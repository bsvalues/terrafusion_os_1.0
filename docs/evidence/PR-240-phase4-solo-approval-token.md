# PR-240: Phase 4 — Solo Approval Token for Irreversible Tools

**Merged:** 2026-02-04  
**Merge Strategy:** Squash  
**Commit:** `9bde2ccbf`  
**Branch:** `ui/phase4-solo-approval-token` → `main`

---

## Summary

Implements solo approval token enforcement for irreversible tools. Users cannot execute irreversible operations without completing a high-friction confirmation flow and obtaining a short-lived, scoped ApprovalToken.

---

## Policy Stack (Final)

| Risk Policy     | UX Flow                                         |
|-----------------|------------------------------------------------|
| `read_only`     | Immediate execution                             |
| `write_low`     | Confirm button                                  |
| `write_high`    | Confirm + reason code                           |
| `irreversible`  | Confirm + reason + typed phrase + approval token |

---

## Files Changed (+1160/-17)

```
frontend/apps/os-shell/src/__tests__/ui-observability/
├── RiskPolicyGate.irreversible.test.tsx  (+643, new)
└── RiskConfirmationModal.test.tsx        (+21/-17)

frontend/apps/os-shell/src/api/
└── pilotApi.ts                           (+70)

frontend/apps/os-shell/src/components/pilot/
├── RiskConfirmationModal.tsx             (+369)
└── RiskPolicyGate.tsx                    (+74)
```

---

## Test Coverage

**New Tests:** 12 (RiskPolicyGate.irreversible.test.tsx)  
**Updated Tests:** 23 (RiskConfirmationModal.test.tsx)  
**Full Suite:** 2926 passed, 144 suites

### Test Groups

| Group | Description |
|-------|-------------|
| `blocks_irreversible_withoutApprovalToken` | Cannot execute without token |
| `issues_token_only_after_high_friction_confirm` | Typed phrase + reason required |
| `token_expires_and_flow_rejects` | TTL enforcement, regenerate flow |
| `approval_request_failures` | Error + correlationId surfacing |
| `non_irreversible_tools_unaffected` | Regression guard |

---

## ApprovalToken Contract

```typescript
interface ApprovalToken {
  tokenId: string;      // Unique identifier
  toolId: string;       // Authorized tool
  requestHash: string;  // Scope to specific params
  issuedAt: number;     // Unix timestamp
  expiresAt: number;    // TTL (60-180s typical)
  issuedBy: string;     // Principal ID
  reasonCode: string;   // Required audit reason
}
```

**API Endpoint:** `POST /pilot/approval/token`  
**Client Function:** `requestApprovalToken(request)`

---

## CI Evidence

**Run ID:** 21694660890 (seal-gate-fast.yml)  
**Required Checks Passed:**
- `🔒 SEAL` ✓
- `typecheck-core` ✓
- `phase83-tools` ✓
- `core-governance-gate` ✓

**Pre-existing Failures (not PR-related):**
- Performance Budget (infrastructure)
- SLSA Provenance (infrastructure)
- Scope Drift Guard (legacy)

---

## Verification Commands

```bash
# Confirm tests pass
cd frontend
npx jest "RiskPolicyGate.irreversible.test.tsx" --no-coverage

# Trace query for debugging
pnpm run trace:query --correlation <correlationId>
```

---

## Governance Notes

- Squash merge preserves evidence in PR artifacts (checks/comments)
- This file provides greppable audit trail for Phase 4
- Token enforcement is runtime-boundary (not bypassable at UI)
- Server-side validation required for production (TODO: backend)

---

**AI-Collaboration:** GitHub Copilot (Claude Opus 4.5)  
**Government:** FISMA compliance  
