# =============================================================================
# SpecLock Runtime Policy (OPA - MYTHIC TIER)
# =============================================================================
# Policy symmetry: OPA consumes the same truth signal as runtime.
# Traffic allowed ONLY if SpecLock invariant holds.
#
# Input contract:
#   {
#     "speclock": {
#       "ok": true,
#       "signature_verified": true
#     }
#   }
#
# Use cases:
# - API Gateway authorization
# - SSE stream gating
# - Background job admission
# - Admin tooling access
# =============================================================================

package terrafusion.speclock

import future.keywords.if
import future.keywords.in

# Default deny - fail-closed
default allow := false
default reason := "speclock_unknown"

# ═══════════════════════════════════════════════════════════════
# Core Rule: Allow if SpecLock invariant satisfied
# ═══════════════════════════════════════════════════════════════
allow if {
    input.speclock.ok == true
}

reason := "speclock_ok" if {
    input.speclock.ok == true
}

reason := "speclock_violated" if {
    input.speclock.ok == false
}

# ═══════════════════════════════════════════════════════════════
# Mythic Rule: Require signature verification in production
# ═══════════════════════════════════════════════════════════════
allow_mythic if {
    input.speclock.ok == true
    input.speclock.signature_verified == true
}

reason_mythic := "speclock_mythic_ok" if {
    allow_mythic
}

reason_mythic := "signature_not_verified" if {
    input.speclock.ok == true
    input.speclock.signature_verified == false
}

reason_mythic := "speclock_violated" if {
    input.speclock.ok == false
}

# ═══════════════════════════════════════════════════════════════
# Helper: Check if any lock is violated
# ═══════════════════════════════════════════════════════════════
violated_locks[lock_id] if {
    some lock in input.speclock.locks
    some artifact in lock.generated_artifacts
    artifact.actual_sha256 != artifact.expected_sha256
    lock_id := lock.id
}

# ═══════════════════════════════════════════════════════════════
# Audit: Return violation details for logging
# ═══════════════════════════════════════════════════════════════
violations := {
    "count": count(violated_locks),
    "lock_ids": violated_locks,
    "timestamp": time.now_ns(),
}
