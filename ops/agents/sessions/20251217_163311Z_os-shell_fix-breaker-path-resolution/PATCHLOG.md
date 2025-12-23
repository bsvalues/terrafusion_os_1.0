# Patch Log: Fix breaker PATH resolution

> Session: `20251217_163311Z_os-shell_fix-breaker-path-resolution`
> All agent outputs go here as diffs.

---

## Format

Each entry:

```
## YYYY-MM-DD HH:MM:SS UTC

**Intent**: What this diff accomplishes

**Files**: path/to/file.ext

```diff
--- a/path/to/file.ext
+++ b/path/to/file.ext
@@ -10,6 +10,8 @@ context
 existing line
+new line
 existing line
```

**Committed**: <commit hash> or "pending"
```

---

## Patches

<!-- Append diffs below this line -->

## 2025-12-17 16:33:00 UTC

**Intent**: Add TF_CLI constant for deterministic path resolution in generate-contract.py

**Files**: ops/agents/generate-contract.py

```diff
--- a/ops/agents/generate-contract.py
+++ b/ops/agents/generate-contract.py
@@ -27,6 +27,9 @@ SESSIONS_DIR = ROOT / "ops" / "agents" / "sessions"
 ACTIVE_SESSION_FILE = ROOT / "ops" / "agents" / "ACTIVE_SESSION"
 SCOPE_ROOTS = ["ops/dev/", "ops/ai/", "backend/", "frontend/", "SDK/", "config/tenant."]

+# Deterministic path to tf CLI (don't rely on shell PATH)
+TF_CLI = "./ops/dev/tf.sh"
+
 PROJECTS = {
-    "os-shell": {"name": "TerraFusion Dev CLI", "gate": "tf gate", ...},
+    "os-shell": {"name": "TerraFusion Dev CLI", "gate": f"{TF_CLI} gate", ...},
     ...
 }
```

**Committed**: 073344b42

---

## 2025-12-17 16:44:00 UTC

**Intent**: Fix set -e exit during agent session check in tf.sh

**Files**: ops/dev/tf.sh

```diff
--- a/ops/dev/tf.sh
+++ b/ops/dev/tf.sh
@@ -796,9 +796,8 @@ else:
     # ─────────────────────────────────────────────────────────────────────────
     human_echo -n "  [10/$total_checks] Agent Sessions: "
     if [[ -f "$ROOT/ops/agents/generate-contract.py" ]]; then
-        local session_errors
-        session_errors=$(python3 "$ROOT/ops/agents/generate-contract.py" check 2>&1)
-        local session_exit=$?
+        local session_errors session_exit
+        session_errors=$(python3 "$ROOT/ops/agents/generate-contract.py" check 2>&1) && session_exit=0 || session_exit=$?
         
         if [[ $session_exit -eq 0 ]]; then
```

**Committed**: c87c2b707