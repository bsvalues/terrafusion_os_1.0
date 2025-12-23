#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# BREAKER: Marketplace Execution Containment Attack Suite
# ═══════════════════════════════════════════════════════════════════════════
# 
# This test suite attempts to BREAK the marketplace execution subsystem.
# Every test should FAIL if the implementation is secure.
# 
# Attack Vectors:
#   1. Path traversal in entrypoint
#   2. Capability injection via manifest
#   3. Log poisoning / ANSI injection
#   4. Timeout bypass (fork/background)
#   5. Registry corruption via crash
#
# Usage: ./test_marketplace_breaker.sh
# ═══════════════════════════════════════════════════════════════════════════

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TF="$ROOT/ops/dev/tf.sh"

# Test isolation
export MARKETPLACE_DIR="/tmp/tf-breaker-marketplace-$$"
export MARKETPLACE_REGISTRY="$MARKETPLACE_DIR/registry.json"
AUDIT_DIR="$MARKETPLACE_DIR/audit"

mkdir -p "$MARKETPLACE_DIR/audit"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

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
    rm -rf /tmp/tf-breaker-* 2>/dev/null || true
}

init_registry() {
    mkdir -p "$MARKETPLACE_DIR"
    echo '{"version":"1.0.0","plugins":[]}' > "$MARKETPLACE_REGISTRY"
}

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  BREAKER: Marketplace Execution Containment Attack Suite${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""

cleanup
init_registry

# ─────────────────────────────────────────────────────────────────────────────
# ATTACK 1: Path Traversal in Entrypoint
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}ATTACK 1: Path Traversal in Entrypoint${NC}"

# 1.1: Direct path traversal (../../etc/passwd)
echo -n "  [1.1] Direct path traversal (../../../etc/passwd)... "
((ATTACKS_RUN++))
bundle="/tmp/tf-breaker-traversal-1-$$"
mkdir -p "$bundle/proofs"
cat > "$bundle/plugin.manifest.json" << 'EOF'
{
  "id": "traversal-plugin",
  "name": "Traversal Test",
  "version": "1.0.0",
  "entrypoints": {"main": "../../../etc/passwd"},
  "capabilities": ["ui.panel"],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle/sbom.json"
bash "$TF" marketplace install --bundle "$bundle" >/dev/null 2>&1 || true
bash "$TF" marketplace enable --plugin traversal-plugin >/dev/null 2>&1 || true
output=$(bash "$TF" marketplace run --plugin traversal-plugin --entry main 2>&1) && rc=0 || rc=$?
if [[ $rc -ne 0 ]]; then
    attack_blocked "Path traversal rejected (exit $rc)"
else
    attack_succeeded "Path traversal executed!"
fi

# 1.2: Encoded path traversal (%2e%2e%2f)
echo -n "  [1.2] URL-encoded path traversal... "
((ATTACKS_RUN++))
init_registry
bundle="/tmp/tf-breaker-traversal-2-$$"
mkdir -p "$bundle/proofs"
cat > "$bundle/plugin.manifest.json" << 'EOF'
{
  "id": "encoded-traversal",
  "name": "Encoded Traversal",
  "version": "1.0.0",
  "entrypoints": {"main": "./..%2f..%2f..%2fetc%2fpasswd"},
  "capabilities": ["ui.panel"],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle/sbom.json"
bash "$TF" marketplace install --bundle "$bundle" >/dev/null 2>&1 || true
bash "$TF" marketplace enable --plugin encoded-traversal >/dev/null 2>&1 || true
output=$(bash "$TF" marketplace run --plugin encoded-traversal --entry main 2>&1) && rc=0 || rc=$?
if [[ $rc -ne 0 ]]; then
    attack_blocked "URL-encoded traversal rejected (exit $rc)"
else
    attack_succeeded "URL-encoded traversal executed!"
fi

# 1.3: Symlink traversal
echo -n "  [1.3] Symlink traversal... "
((ATTACKS_RUN++))
init_registry
bundle="/tmp/tf-breaker-symlink-$$"
mkdir -p "$bundle/proofs"
cat > "$bundle/plugin.manifest.json" << 'EOF'
{
  "id": "symlink-plugin",
  "name": "Symlink Test",
  "version": "1.0.0",
  "entrypoints": {"main": "./main.sh"},
  "capabilities": ["ui.panel"],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle/sbom.json"
# Create symlink to /etc/passwd
ln -sf /etc/passwd "$bundle/main.sh" 2>/dev/null || echo "#!/bin/echo symlink-failed" > "$bundle/main.sh"
chmod +x "$bundle/main.sh"
bash "$TF" marketplace install --bundle "$bundle" >/dev/null 2>&1 || true
bash "$TF" marketplace enable --plugin symlink-plugin >/dev/null 2>&1 || true
output=$(bash "$TF" marketplace run --plugin symlink-plugin --entry main 2>&1) && rc=0 || rc=$?
# Check if output contains /etc/passwd content
if echo "$output" | grep -q "root:"; then
    attack_succeeded "Symlink traversal leaked /etc/passwd!"
else
    attack_blocked "Symlink traversal blocked (exit $rc)"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# ATTACK 2: Capability Injection
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}ATTACK 2: Capability Injection via Manifest${NC}"

# 2.1: Declare net.* capability
echo -n "  [2.1] Declare forbidden net.http capability... "
((ATTACKS_RUN++))
init_registry
bundle="/tmp/tf-breaker-cap-net-$$"
mkdir -p "$bundle/proofs"
cat > "$bundle/plugin.manifest.json" << 'EOF'
{
  "id": "net-cap-plugin",
  "name": "Network Capability",
  "version": "1.0.0",
  "entrypoints": {"main": "./main.sh"},
  "capabilities": ["ui.panel", "net.http"],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle/sbom.json"
echo '#!/bin/bash' > "$bundle/main.sh"
echo 'echo "executed"' >> "$bundle/main.sh"
chmod +x "$bundle/main.sh"
output=$(bash "$TF" marketplace install --bundle "$bundle" 2>&1) && rc=0 || rc=$?
if [[ $rc -ne 0 ]]; then
    attack_blocked "net.http capability rejected at install (exit $rc)"
else
    attack_succeeded "net.http capability allowed at install!"
fi

# 2.2: Declare fs.write capability
echo -n "  [2.2] Declare forbidden fs.write capability... "
((ATTACKS_RUN++))
init_registry
bundle="/tmp/tf-breaker-cap-fs-$$"
mkdir -p "$bundle/proofs"
cat > "$bundle/plugin.manifest.json" << 'EOF'
{
  "id": "fs-cap-plugin",
  "name": "FS Capability",
  "version": "1.0.0",
  "entrypoints": {"main": "./main.sh"},
  "capabilities": ["ui.panel", "fs.write"],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle/sbom.json"
echo '#!/bin/bash' > "$bundle/main.sh"
echo 'echo "executed"' >> "$bundle/main.sh"
chmod +x "$bundle/main.sh"
output=$(bash "$TF" marketplace install --bundle "$bundle" 2>&1) && rc=0 || rc=$?
if [[ $rc -ne 0 ]]; then
    attack_blocked "fs.write capability rejected at install (exit $rc)"
else
    attack_succeeded "fs.write capability allowed at install!"
fi

# 2.3: Shell command injection in capability name
echo -n "  [2.3] Shell injection in capability name... "
((ATTACKS_RUN++))
init_registry
bundle="/tmp/tf-breaker-cap-inject-$$"
mkdir -p "$bundle/proofs"
cat > "$bundle/plugin.manifest.json" << 'EOF'
{
  "id": "cap-inject-plugin",
  "name": "Capability Injection",
  "version": "1.0.0",
  "entrypoints": {"main": "./main.sh"},
  "capabilities": ["ui.panel", "$(whoami)", "; whoami"],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle/sbom.json"
echo '#!/bin/bash' > "$bundle/main.sh"
echo 'echo "executed"' >> "$bundle/main.sh"
chmod +x "$bundle/main.sh"
output=$(bash "$TF" marketplace install --bundle "$bundle" 2>&1) && rc=0 || rc=$?
if echo "$output" | grep -qE "^(root|$(whoami))$"; then
    attack_succeeded "Command injection executed!"
else
    attack_blocked "Shell injection in capability rejected (exit $rc)"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# ATTACK 3: Log Poisoning / ANSI Injection
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}ATTACK 3: Log Poisoning / ANSI Injection${NC}"

# 3.1: ANSI escape codes in plugin output
echo -n "  [3.1] ANSI escape codes in plugin output... "
((ATTACKS_RUN++))
init_registry
bundle="/tmp/tf-breaker-ansi-$$"
mkdir -p "$bundle/proofs"
cat > "$bundle/plugin.manifest.json" << 'EOF'
{
  "id": "ansi-plugin",
  "name": "ANSI Injection",
  "version": "1.0.0",
  "entrypoints": {"main": "./main.sh"},
  "capabilities": ["ui.panel"],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle/sbom.json"
cat > "$bundle/main.sh" << 'EOF'
#!/bin/bash
echo -e "\033[31mFAKE ERROR\033[0m"
echo -e "\x1b[32mFAKE SUCCESS\x1b[0m"
exit 0
EOF
chmod +x "$bundle/main.sh"
bash "$TF" marketplace install --bundle "$bundle" >/dev/null 2>&1 || true
bash "$TF" marketplace enable --plugin ansi-plugin >/dev/null 2>&1 || true
output=$(bash "$TF" marketplace run --plugin ansi-plugin --entry main --ci 2>&1) || true
if echo "$output" | grep -q $'\x1b'; then
    attack_succeeded "ANSI codes leaked to CI output!"
else
    attack_blocked "ANSI codes stripped from CI output"
fi

# 3.2: JSON injection in audit log
echo -n "  [3.2] JSON injection in plugin output... "
((ATTACKS_RUN++))
init_registry
bundle="/tmp/tf-breaker-json-inject-$$"
mkdir -p "$bundle/proofs"
cat > "$bundle/plugin.manifest.json" << 'EOF'
{
  "id": "json-inject-plugin",
  "name": "JSON Injection",
  "version": "1.0.0",
  "entrypoints": {"main": "./main.sh"},
  "capabilities": ["ui.panel"],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle/sbom.json"
cat > "$bundle/main.sh" << 'EOF'
#!/bin/bash
echo '","hacked":true,"outcome":"success'
exit 0
EOF
chmod +x "$bundle/main.sh"
bash "$TF" marketplace install --bundle "$bundle" >/dev/null 2>&1 || true
bash "$TF" marketplace enable --plugin json-inject-plugin >/dev/null 2>&1 || true
bash "$TF" marketplace run --plugin json-inject-plugin --entry main >/dev/null 2>&1 || true
# Check audit log for injection
audit_file=$(ls -t "$AUDIT_DIR/json-inject-plugin/"*.json 2>/dev/null | head -1)
if [[ -f "$audit_file" ]] && grep -q '"hacked":true' "$audit_file" 2>/dev/null; then
    attack_succeeded "JSON injection in audit log!"
else
    attack_blocked "JSON injection escaped in audit log"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# ATTACK 4: Timeout Bypass
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}ATTACK 4: Timeout Bypass${NC}"

# 4.1: Fork background process
echo -n "  [4.1] Fork background process (nohup)... "
((ATTACKS_RUN++))
init_registry
bundle="/tmp/tf-breaker-fork-$$"
mkdir -p "$bundle/proofs"
cat > "$bundle/plugin.manifest.json" << 'EOF'
{
  "id": "fork-plugin",
  "name": "Fork Test",
  "version": "1.0.0",
  "entrypoints": {"main": "./main.sh"},
  "capabilities": ["ui.panel"],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle/sbom.json"
marker="/tmp/tf-breaker-fork-marker-$$"
cat > "$bundle/main.sh" << EOF
#!/bin/bash
# Try to fork a background process
nohup bash -c "sleep 5 && touch $marker" &
exit 0
EOF
chmod +x "$bundle/main.sh"
bash "$TF" marketplace install --bundle "$bundle" >/dev/null 2>&1 || true
bash "$TF" marketplace enable --plugin fork-plugin >/dev/null 2>&1 || true
rm -f "$marker"
timeout 3 bash "$TF" marketplace run --plugin fork-plugin --entry main --timeout 1 >/dev/null 2>&1 || true
# Wait and check if marker was created (background process survived)
sleep 6
if [[ -f "$marker" ]]; then
    attack_succeeded "Background process survived timeout!"
    rm -f "$marker"
else
    attack_blocked "Background process killed with parent"
fi

# 4.2: Signal trap to ignore SIGTERM
echo -n "  [4.2] Trap SIGTERM to ignore kill... "
((ATTACKS_RUN++))
init_registry
bundle="/tmp/tf-breaker-trap-$$"
mkdir -p "$bundle/proofs"
cat > "$bundle/plugin.manifest.json" << 'EOF'
{
  "id": "trap-plugin",
  "name": "Trap Test",
  "version": "1.0.0",
  "entrypoints": {"main": "./main.sh"},
  "capabilities": ["ui.panel"],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle/sbom.json"
cat > "$bundle/main.sh" << 'EOF'
#!/bin/bash
trap '' SIGTERM SIGINT
while true; do sleep 1; done
EOF
chmod +x "$bundle/main.sh"
bash "$TF" marketplace install --bundle "$bundle" >/dev/null 2>&1 || true
bash "$TF" marketplace enable --plugin trap-plugin >/dev/null 2>&1 || true
start=$(date +%s)
timeout 10 bash "$TF" marketplace run --plugin trap-plugin --entry main --timeout 2 >/dev/null 2>&1 || true
end=$(date +%s)
elapsed=$((end - start))
if [[ $elapsed -lt 5 ]]; then
    attack_blocked "SIGTERM trap bypassed, plugin killed (${elapsed}s)"
else
    attack_succeeded "SIGTERM trap prevented kill!"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# ATTACK 5: Registry Corruption
# ─────────────────────────────────────────────────────────────────────────────
echo -e "${YELLOW}ATTACK 5: Registry Corruption${NC}"

# 5.1: Crash during execution should not corrupt registry
echo -n "  [5.1] Crash during execution leaves registry intact... "
((ATTACKS_RUN++))
init_registry
bundle="/tmp/tf-breaker-crash-$$"
mkdir -p "$bundle/proofs"
cat > "$bundle/plugin.manifest.json" << 'EOF'
{
  "id": "crash-test-plugin",
  "name": "Crash Test",
  "version": "1.0.0",
  "entrypoints": {"main": "./main.sh"},
  "capabilities": ["ui.panel"],
  "integrity": {"sha256": "abc123"}
}
EOF
echo '{}' > "$bundle/sbom.json"
cat > "$bundle/main.sh" << 'EOF'
#!/bin/bash
# Simulate crash
kill -9 $$
EOF
chmod +x "$bundle/main.sh"
bash "$TF" marketplace install --bundle "$bundle" >/dev/null 2>&1 || true
bash "$TF" marketplace enable --plugin crash-test-plugin >/dev/null 2>&1 || true
# Store registry state before crash
registry_before=$(cat "$MARKETPLACE_REGISTRY")
bash "$TF" marketplace run --plugin crash-test-plugin --entry main >/dev/null 2>&1 || true
# Check registry is still valid JSON
if python3 -m json.tool "$MARKETPLACE_REGISTRY" >/dev/null 2>&1; then
    attack_blocked "Registry still valid after crash"
else
    attack_succeeded "Registry corrupted by crash!"
fi

# 5.2: Race condition on registry write
echo -n "  [5.2] Race condition on concurrent writes... "
((ATTACKS_RUN++))
init_registry
# Start multiple plugins simultaneously
for i in {1..5}; do
    bundle="/tmp/tf-breaker-race-$i-$$"
    mkdir -p "$bundle/proofs"
    cat > "$bundle/plugin.manifest.json" << EOF
{
  "id": "race-plugin-$i",
  "name": "Race Test $i",
  "version": "1.0.0",
  "entrypoints": {"main": "./main.sh"},
  "capabilities": ["ui.panel"],
  "integrity": {"sha256": "race$i"}
}
EOF
    echo '{}' > "$bundle/sbom.json"
    echo '#!/bin/bash' > "$bundle/main.sh"
    echo 'sleep 0.1' >> "$bundle/main.sh"
    chmod +x "$bundle/main.sh"
    bash "$TF" marketplace install --bundle "$bundle" >/dev/null 2>&1 &
done
wait
# Check registry is still valid
if python3 -m json.tool "$MARKETPLACE_REGISTRY" >/dev/null 2>&1; then
    attack_blocked "Registry valid after concurrent writes"
else
    attack_succeeded "Registry corrupted by race condition!"
fi

echo ""

# ═══════════════════════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════════════════════
cleanup

echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  BREAKER SUMMARY"
echo "  ───────────────────────────────────────────────────────────────────────"
echo "  Attacks Run:     $ATTACKS_RUN"
echo -e "  Attacks Blocked: ${GREEN}$ATTACKS_BLOCKED${NC}"
echo -e "  Vulnerabilities: ${RED}$ATTACKS_SUCCEEDED${NC}"
echo ""

if [[ $ATTACKS_SUCCEEDED -gt 0 ]]; then
    echo -e "  ${RED}✗ VULNERABILITIES FOUND!${NC}"
    echo "    Regression tests required for each vulnerability."
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    exit 1
else
    echo -e "  ${GREEN}✓ ALL ATTACKS BLOCKED${NC}"
    echo "    Execution containment is secure."
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════════${NC}"
    exit 0
fi
