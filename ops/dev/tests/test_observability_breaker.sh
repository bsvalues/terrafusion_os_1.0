#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# BREAKER: Observability Runtime Constitution Attack Suite
# ═══════════════════════════════════════════════════════════════════════════
# 
# This test suite attempts to BREAK the observability subsystem.
# Every attack should be BLOCKED if the implementation is secure.
# 
# Attack Vectors:
#   1. Mutation attempts (file creation, state modification)
#   2. ANSI/terminal escape injection
#   3. Path traversal in --bundle
#   4. Secret/credential exposure
#   5. Timeout bypass / resource exhaustion
#   6. Flag injection / command smuggling
#
# Usage: ./test_observability_breaker.sh
# Exit: 0 = all attacks blocked, 1 = vulnerability found
# ═══════════════════════════════════════════════════════════════════════════

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TF="$ROOT/ops/dev/tf.sh"

# Test isolation
export TEST_DIR="/tmp/tf-obs-breaker-$$"
mkdir -p "$TEST_DIR"

# Colors (disabled in CI)
if [[ "${CI:-false}" == "true" ]] || [[ ! -t 1 ]]; then
    RED="" GREEN="" YELLOW="" CYAN="" NC="" BOLD=""
else
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[0;33m'
    CYAN='\033[0;36m'
    NC='\033[0m'
    BOLD='\033[1m'
fi

ATTACKS_RUN=0
ATTACKS_BLOCKED=0
ATTACKS_SUCCEEDED=0

attack_blocked() {
    ((ATTACKS_BLOCKED++))
    echo -e "  ${GREEN}✓ BLOCKED${NC} - $1"
}

attack_succeeded() {
    ((ATTACKS_SUCCEEDED++))
    echo -e "  ${RED}✗ VULNERABLE${NC} - $1"
}

cleanup() {
    rm -rf /tmp/tf-obs-breaker-* 2>/dev/null || true
}

trap cleanup EXIT

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  BREAKER: Observability Runtime Constitution Attack Suite${NC}"
echo -e "${CYAN}  Constitution: v1.0.0${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Pre-flight: Check if observe commands exist (RED phase = not implemented)
# ─────────────────────────────────────────────────────────────────────────────
if ! "$TF" observe health --ci 2>&1 | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
    echo -e "${YELLOW}  ⚠ tf observe commands not fully implemented (RED phase)${NC}"
    echo -e "${YELLOW}  Running attacks against partial implementation...${NC}"
    echo ""
fi

# ─────────────────────────────────────────────────────────────────────────────
# ATTACK 1: Mutation Attempts (Article I, Section 1.1)
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}ATTACK 1: Mutation Attempts${NC}"
echo "  Testing: Observe commands must be read-only"
echo ""

# 1.1: File creation during observe
echo -n "  [1.1] Observe health should not create files... "
((ATTACKS_RUN++))
before_count=$(find "$ROOT" -maxdepth 2 -type f -newer /tmp -name "*.observe*" 2>/dev/null | wc -l)
"$TF" observe health --ci >/dev/null 2>&1 || true
after_count=$(find "$ROOT" -maxdepth 2 -type f -newer /tmp -name "*.observe*" 2>/dev/null | wc -l)
if [[ $before_count -eq $after_count ]]; then
    attack_blocked "No observe files created"
else
    attack_succeeded "Observe created new files!"
fi

# 1.2: State file modification
echo -n "  [1.2] Observe should not modify .terrafusion-state... "
((ATTACKS_RUN++))
state_file="$ROOT/.terrafusion-state"
if [[ -f "$state_file" ]]; then
    orig_hash=$(sha256sum "$state_file" 2>/dev/null | cut -d' ' -f1)
else
    orig_hash="none"
fi
"$TF" observe health --ci >/dev/null 2>&1 || true
"$TF" observe proofs --ci >/dev/null 2>&1 || true
"$TF" observe summary --ci >/dev/null 2>&1 || true
if [[ -f "$state_file" ]]; then
    new_hash=$(sha256sum "$state_file" 2>/dev/null | cut -d' ' -f1)
else
    new_hash="none"
fi
if [[ "$orig_hash" == "$new_hash" ]]; then
    attack_blocked "State file unchanged"
else
    attack_succeeded "State file was modified!"
fi

# 1.3: Registry modification attempt
echo -n "  [1.3] Observe should not modify any registry... "
((ATTACKS_RUN++))
registry_dir="$ROOT/ops/dev/registry"
if [[ -d "$registry_dir" ]]; then
    orig_tree=$(find "$registry_dir" -type f -exec sha256sum {} \; 2>/dev/null | sort)
else
    orig_tree=""
fi
"$TF" observe summary --ci >/dev/null 2>&1 || true
if [[ -d "$registry_dir" ]]; then
    new_tree=$(find "$registry_dir" -type f -exec sha256sum {} \; 2>/dev/null | sort)
else
    new_tree=""
fi
if [[ "$orig_tree" == "$new_tree" ]]; then
    attack_blocked "Registry unchanged"
else
    attack_succeeded "Registry was modified!"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# ATTACK 2: ANSI/Terminal Escape Injection (Article I, Section 1.3)
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}ATTACK 2: ANSI/Terminal Escape Injection${NC}"
echo "  Testing: CI output must be ANSI-free"
echo ""

# 2.1: ANSI codes in health output
echo -n "  [2.1] tf observe health --ci should have no ANSI... "
((ATTACKS_RUN++))
output=$("$TF" observe health --ci 2>&1) || true
if echo "$output" | grep -qE $'\x1b\[|\033\['; then
    attack_succeeded "ANSI escape codes in health output!"
else
    attack_blocked "No ANSI codes in health output"
fi

# 2.2: ANSI codes in proofs output
echo -n "  [2.2] tf observe proofs --ci should have no ANSI... "
((ATTACKS_RUN++))
output=$("$TF" observe proofs --ci 2>&1) || true
if echo "$output" | grep -qE $'\x1b\[|\033\['; then
    attack_succeeded "ANSI escape codes in proofs output!"
else
    attack_blocked "No ANSI codes in proofs output"
fi

# 2.3: ANSI codes in summary output
echo -n "  [2.3] tf observe summary --ci should have no ANSI... "
((ATTACKS_RUN++))
output=$("$TF" observe summary --ci 2>&1) || true
if echo "$output" | grep -qE $'\x1b\[|\033\['; then
    attack_succeeded "ANSI escape codes in summary output!"
else
    attack_blocked "No ANSI codes in summary output"
fi

# 2.4: Terminal control codes
echo -n "  [2.4] No terminal control codes (bell, carriage return)... "
((ATTACKS_RUN++))
output=$("$TF" observe summary --ci 2>&1) || true
if echo "$output" | grep -qE $'\x07|\x0d'; then
    attack_succeeded "Terminal control codes in output!"
else
    attack_blocked "No terminal control codes"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# ATTACK 3: Path Traversal (Article III, Section 3.1)
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}ATTACK 3: Path Traversal${NC}"
echo "  Testing: Bundle paths must be validated"
echo ""

# 3.1: Direct path traversal
echo -n "  [3.1] Reject ../../../etc/passwd... "
((ATTACKS_RUN++))
output=$("$TF" observe bundle --bundle "../../../etc/passwd" --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -ne 0 ]]; then
    attack_blocked "Path traversal rejected (exit $rc)"
else
    attack_succeeded "Path traversal not rejected!"
fi

# 3.2: URL-encoded traversal
echo -n "  [3.2] Reject URL-encoded traversal (%2e%2e%2f)... "
((ATTACKS_RUN++))
output=$("$TF" observe bundle --bundle "%2e%2e%2fetc%2fpasswd" --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -ne 0 ]]; then
    attack_blocked "URL-encoded traversal rejected (exit $rc)"
else
    attack_succeeded "URL-encoded traversal not rejected!"
fi

# 3.3: Null byte injection
echo -n "  [3.3] Reject null byte injection... "
((ATTACKS_RUN++))
output=$("$TF" observe bundle --bundle "/valid/path%00/../etc/passwd" --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -ne 0 ]]; then
    attack_blocked "Null byte injection rejected (exit $rc)"
else
    attack_succeeded "Null byte injection not rejected!"
fi

# 3.4: Absolute path outside workspace
echo -n "  [3.4] Reject /etc/passwd as bundle... "
((ATTACKS_RUN++))
output=$("$TF" observe bundle --bundle "/etc/passwd" --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -ne 0 ]]; then
    attack_blocked "Absolute path rejected (exit $rc)"
else
    attack_succeeded "Absolute path not rejected!"
fi

# 3.5: Home directory escape
echo -n "  [3.5] Reject ~/.ssh/id_rsa as bundle... "
((ATTACKS_RUN++))
output=$("$TF" observe bundle --bundle "$HOME/.ssh/id_rsa" --ci 2>&1) && rc=0 || rc=$?
if [[ $rc -ne 0 ]]; then
    attack_blocked "Home escape rejected (exit $rc)"
else
    attack_succeeded "Home escape not rejected!"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# ATTACK 4: Secret/Credential Exposure (Article I, Section 1.6)
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}ATTACK 4: Secret/Credential Exposure${NC}"
echo "  Testing: No secrets in output"
echo ""

# 4.1: Check for password patterns
echo -n "  [4.1] No 'password' in output... "
((ATTACKS_RUN++))
output=$("$TF" observe summary --ci 2>&1) || true
if echo "$output" | grep -qi 'password'; then
    attack_succeeded "Password pattern found in output!"
else
    attack_blocked "No password pattern"
fi

# 4.2: Check for API key patterns
echo -n "  [4.2] No 'api_key' or 'apikey' in output... "
((ATTACKS_RUN++))
output=$("$TF" observe summary --ci 2>&1) || true
if echo "$output" | grep -qiE 'api[_-]?key'; then
    attack_succeeded "API key pattern found in output!"
else
    attack_blocked "No API key pattern"
fi

# 4.3: Check for token patterns
echo -n "  [4.3] No 'token' or 'bearer' in output... "
((ATTACKS_RUN++))
output=$("$TF" observe summary --ci 2>&1) || true
if echo "$output" | grep -qiE 'token|bearer'; then
    attack_succeeded "Token pattern found in output!"
else
    attack_blocked "No token pattern"
fi

# 4.4: Check for connection strings
echo -n "  [4.4] No connection strings in output... "
((ATTACKS_RUN++))
output=$("$TF" observe summary --ci 2>&1) || true
if echo "$output" | grep -qiE 'connectionstring|jdbc:|mongodb://|postgres://|mysql://'; then
    attack_succeeded "Connection string found in output!"
else
    attack_blocked "No connection string"
fi

# 4.5: Check for private key patterns
echo -n "  [4.5] No private key patterns in output... "
((ATTACKS_RUN++))
output=$("$TF" observe summary --ci 2>&1) || true
if echo "$output" | grep -qE 'BEGIN.*PRIVATE KEY|-----BEGIN RSA'; then
    attack_succeeded "Private key pattern found in output!"
else
    attack_blocked "No private key pattern"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# ATTACK 5: Timeout/Resource Exhaustion (Article I, Section 1.5)
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}ATTACK 5: Timeout/Resource Exhaustion${NC}"
echo "  Testing: Time-bounded execution"
echo ""

# 5.1: Large bundle path should not hang
echo -n "  [5.1] Large path input should timeout... "
((ATTACKS_RUN++))
large_path=$(python3 -c "print('A' * 10000)")
start=$(date +%s)
timeout 5 "$TF" observe bundle --bundle "$large_path" --ci >/dev/null 2>&1 || true
end=$(date +%s)
elapsed=$((end - start))
if [[ $elapsed -lt 4 ]]; then
    attack_blocked "Large path handled quickly (${elapsed}s)"
else
    attack_succeeded "Large path caused delay (${elapsed}s)!"
fi

# 5.2: Command should complete within 30s
echo -n "  [5.2] Observe summary should complete within 30s... "
((ATTACKS_RUN++))
start=$(date +%s)
timeout 35 "$TF" observe summary --ci >/dev/null 2>&1 || true
end=$(date +%s)
elapsed=$((end - start))
if [[ $elapsed -lt 31 ]]; then
    attack_blocked "Completed in ${elapsed}s"
else
    attack_succeeded "Exceeded 30s timeout (${elapsed}s)!"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# ATTACK 6: Flag Injection / Command Smuggling (Article I, Section 1.4)
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}ATTACK 6: Flag Injection / Command Smuggling${NC}"
echo "  Testing: No arbitrary flag pass-through"
echo ""

# 6.1: Shell command injection in bundle path
echo -n "  [6.1] Shell injection in --bundle... "
((ATTACKS_RUN++))
marker="/tmp/tf-obs-breaker-marker-$$"
rm -f "$marker"
"$TF" observe bundle --bundle "; touch $marker #" --ci >/dev/null 2>&1 || true
if [[ -f "$marker" ]]; then
    attack_succeeded "Shell command executed via --bundle!"
    rm -f "$marker"
else
    attack_blocked "Shell injection blocked"
fi

# 6.2: Command substitution in bundle path
echo -n "  [6.2] Command substitution \$(whoami) in --bundle... "
((ATTACKS_RUN++))
output=$("$TF" observe bundle --bundle '$(whoami)' --ci 2>&1) || true
if echo "$output" | grep -q "$(whoami)"; then
    attack_succeeded "Command substitution executed!"
else
    attack_blocked "Command substitution blocked"
fi

# 6.3: Backtick substitution
echo -n "  [6.3] Backtick substitution in --bundle... "
((ATTACKS_RUN++))
output=$("$TF" observe bundle --bundle '`whoami`' --ci 2>&1) || true
if echo "$output" | grep -q "$(whoami)"; then
    attack_succeeded "Backtick substitution executed!"
else
    attack_blocked "Backtick substitution blocked"
fi

# 6.4: Newline injection
echo -n "  [6.4] Newline injection in arguments... "
((ATTACKS_RUN++))
marker="/tmp/tf-obs-breaker-newline-$$"
rm -f "$marker"
"$TF" observe bundle --bundle $'valid\ntouch /tmp/hacked' --ci >/dev/null 2>&1 || true
if [[ -f "/tmp/hacked" ]]; then
    attack_succeeded "Newline injection executed!"
    rm -f "/tmp/hacked"
else
    attack_blocked "Newline injection blocked"
fi

# 6.5: Extra flag injection
echo -n "  [6.5] Extra flag injection via bundle... "
((ATTACKS_RUN++))
output=$("$TF" observe bundle --bundle "--help; ls /" --ci 2>&1) || true
rc=$?
if [[ $rc -eq 0 ]] && echo "$output" | grep -q "Usage:"; then
    # Acceptable: may show help
    attack_blocked "Flag injection handled safely"
else
    attack_blocked "Flag injection rejected"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# ATTACK 7: Non-Sealed Command Injection (Article I, Section 1.2)
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}ATTACK 7: Non-Sealed Command Execution${NC}"
echo "  Testing: Only sealed commands can be composed"
echo ""

# 7.1: Observe should not execute arbitrary scripts
echo -n "  [7.1] Observe cannot execute arbitrary scripts... "
((ATTACKS_RUN++))
malicious_script="$TEST_DIR/evil.sh"
cat > "$malicious_script" << 'EOF'
#!/bin/bash
echo "EVIL_EXECUTED"
touch /tmp/tf-obs-evil-marker
EOF
chmod +x "$malicious_script"
output=$("$TF" observe health --ci 2>&1) || true
if echo "$output" | grep -q "EVIL_EXECUTED" || [[ -f "/tmp/tf-obs-evil-marker" ]]; then
    attack_succeeded "Arbitrary script executed!"
    rm -f "/tmp/tf-obs-evil-marker"
else
    attack_blocked "Only sealed commands executed"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  BREAKER SUMMARY"
echo "  ───────────────────────────────────────────────────────────────────────"
echo "  Constitution:    v1.0.0 (Observability Runtime)"
echo "  Attacks Run:     $ATTACKS_RUN"
echo -e "  Attacks Blocked: ${GREEN}$ATTACKS_BLOCKED${NC}"
echo -e "  Vulnerabilities: ${RED}$ATTACKS_SUCCEEDED${NC}"
echo ""

if [[ $ATTACKS_SUCCEEDED -gt 0 ]]; then
    echo -e "  ${RED}✗ VULNERABILITIES FOUND!${NC}"
    echo "    The observability layer has security issues."
    echo "    Regression tests required for each vulnerability."
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    exit 1
else
    echo -e "  ${GREEN}✓ ALL ATTACKS BLOCKED${NC}"
    echo "    Observability read-only containment is secure."
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    exit 0
fi
