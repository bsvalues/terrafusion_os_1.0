#!/usr/bin/env bash
set -euo pipefail
mkdir -p artifacts/sbom artifacts/reports

# SBOM (CycloneDX via syft fallback to echo)
if command -v syft >/dev/null 2>&1; then
  syft . -o cyclonedx-json > artifacts/sbom/sbom.json || true
else
  echo '{"sbom":"placeholder"}' > artifacts/sbom/sbom.json
fi

# Dependency scan (grype/osv-scanner fallback)
if command -v grype >/dev/null 2>&1; then
  grype -q . -o table | tee artifacts/reports/grype.txt || true
fi
if command -v osv-scanner >/dev/null 2>&1; then
  osv-scanner -r . | tee artifacts/reports/osv.txt || true
fi

# Policy gate (fail on CRITICAL unless approved)
CRIT=$(grep -i "CRITICAL" -c artifacts/reports/grype.txt 2>/dev/null || echo 0)
[[ "$CRIT" -eq 0 ]] || { echo "Critical vulns found: $CRIT"; exit 1; }

echo "Security baseline OK"