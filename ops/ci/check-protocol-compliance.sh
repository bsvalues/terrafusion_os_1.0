#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# TerraFusion CI Protocol Compliance Check
# Hard-fails if protected scope changes exist without session artifacts
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "╔══════════════════════════════════════════════════════════════════════╗"
echo "║  CI Protocol Compliance Check                                         ║"
echo "║  Engineering Execution Protocol v1.0.0                                ║"
echo "╚══════════════════════════════════════════════════════════════════════╝"
echo ""

# Protected scopes that REQUIRE agent sessions
PROTECTED_SCOPES=(
    "ops/ai/"
    "ops/dev/"
    "backend/"
    "frontend/"
    "SDK/"
    "config/tenant."
)

SESSIONS_DIR="$ROOT/ops/agents/sessions"

# Get changed files (works in PR context or local)
if [[ -n "${GITHUB_BASE_REF:-}" ]]; then
    # GitHub Actions PR context
    CHANGED_FILES=$(git diff --name-only "origin/$GITHUB_BASE_REF"...HEAD 2>/dev/null || echo "")
elif [[ -n "${CI_MERGE_REQUEST_TARGET_BRANCH_NAME:-}" ]]; then
    # GitLab MR context
    CHANGED_FILES=$(git diff --name-only "origin/$CI_MERGE_REQUEST_TARGET_BRANCH_NAME"...HEAD 2>/dev/null || echo "")
else
    # Local / fallback: compare to main
    CHANGED_FILES=$(git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1 2>/dev/null || echo "")
fi

if [[ -z "$CHANGED_FILES" ]]; then
    echo "✓ No file changes detected"
    exit 0
fi

# Check which protected scopes were touched
TOUCHED_SCOPES=""
has_protected=false

for file in $CHANGED_FILES; do
    for scope in "${PROTECTED_SCOPES[@]}"; do
        if [[ "$file" == $scope* ]]; then
            has_protected=true
            if ! echo "$TOUCHED_SCOPES" | grep -q "$scope"; then
                TOUCHED_SCOPES="$TOUCHED_SCOPES $scope"
            fi
        fi
    done
done

if [[ "$has_protected" != "true" ]]; then
    echo "✓ No protected scope changes detected"
    exit 0
fi

echo "📁 Protected scopes changed:$TOUCHED_SCOPES"
echo ""

# Look for session artifacts in the commit range
SESSION_ARTIFACTS_FOUND=false
ARTIFACT_DIRS=""

for session_dir in "$SESSIONS_DIR"/*/; do
    if [[ ! -d "$session_dir" ]]; then
        continue
    fi
    
    session_id=$(basename "$session_dir")
    
    # Check if session.json exists and is complete or active
    if [[ -f "$session_dir/SESSION.json" ]]; then
        status=$(python3 -c "import json; print(json.load(open('$session_dir/SESSION.json')).get('status', ''))" 2>/dev/null || echo "")
        
        # Check if any session artifact was modified in this commit range
        for artifact in "SPECLOCK.md" "TESTPLAN.md" "PATCHLOG.md" "ATTACK_REPORT.md" "PR_REVIEW.md"; do
            artifact_path="ops/agents/sessions/$session_id/$artifact"
            if echo "$CHANGED_FILES" | grep -q "$artifact_path"; then
                SESSION_ARTIFACTS_FOUND=true
                ARTIFACT_DIRS="$ARTIFACT_DIRS $session_id"
                break
            fi
        done
    fi
done

if [[ "$SESSION_ARTIFACTS_FOUND" == "true" ]]; then
    echo "✓ Session artifacts found:$ARTIFACT_DIRS"
    echo ""
    
    # Validate the sessions have required artifacts
    for session_id in $ARTIFACT_DIRS; do
        session_dir="$SESSIONS_DIR/$session_id"
        
        echo "  Checking session: $session_id"
        
        # Check SpecLock is frozen
        if [[ -f "$session_dir/SPECLOCK.md" ]]; then
            if grep -q "Status: \*\*FROZEN\*\*" "$session_dir/SPECLOCK.md" 2>/dev/null; then
                echo "    ✓ SpecLock: FROZEN"
            else
                echo "    ⚠ SpecLock: NOT FROZEN (warning)"
            fi
        else
            echo "    ❌ SpecLock: MISSING"
        fi
        
        # Check Attack Report exists
        if [[ -f "$session_dir/ATTACK_REPORT.md" ]]; then
            if grep -qE "(APPROVE|✅ PASSED)" "$session_dir/ATTACK_REPORT.md" 2>/dev/null; then
                echo "    ✓ Attack Report: APPROVED"
            else
                echo "    ⚠ Attack Report: NOT APPROVED (warning)"
            fi
        else
            echo "    ⚠ Attack Report: MISSING (warning)"
        fi
        
        # Check PR Review
        if [[ -f "$session_dir/PR_REVIEW.md" ]]; then
            echo "    ✓ PR Review: EXISTS"
        else
            echo "    ⚠ PR Review: MISSING (warning)"
        fi
        
        echo ""
    done
    
    echo "══════════════════════════════════════════════════════════════════════"
    echo "✓ CI Protocol Check: PASSED"
    echo "  Protected scope changes have associated session artifacts."
    echo ""
    exit 0
else
    echo "══════════════════════════════════════════════════════════════════════"
    echo "❌ CI Protocol Check: FAILED"
    echo ""
    echo "  Protected scope changes detected WITHOUT session artifacts."
    echo ""
    echo "  Changed scopes:$TOUCHED_SCOPES"
    echo ""
    echo "  TerraFusion requires all feature work to run through the"
    echo "  Engineering Execution Protocol for auditable quality."
    echo ""
    echo "  RESOLUTION:"
    echo "    1. Start a session: tf agent run --project=<p> --feature=\"<f>\""
    echo "    2. Complete the 7-phase protocol"
    echo "    3. Include session artifacts in your commit"
    echo ""
    echo "  Or if this is an emergency hotfix:"
    echo "    Add [HOTFIX] to commit message and get explicit approval"
    echo ""
    
    # Check for [HOTFIX] bypass
    LATEST_COMMIT_MSG=$(git log -1 --pretty=%B 2>/dev/null || echo "")
    if echo "$LATEST_COMMIT_MSG" | grep -qi "\[HOTFIX\]"; then
        echo "  ⚠️  [HOTFIX] bypass detected - allowing with warning"
        echo ""
        exit 0
    fi
    
    exit 1
fi
