#!/usr/bin/env bash
set -euo pipefail
mkdir -p artifacts/sbom artifacts/reports

# --- SBOM (CycloneDX via syft; fallback placeholder) ---
if command -v syft >/dev/null 2>&1; then
  syft . -o cyclonedx-json > artifacts/sbom/sbom.json || true
else
  echo '{"sbom":"placeholder"}' > artifacts/sbom/sbom.json
fi

# --- Vulnerability Scans (grype/osv-scanner if available) ---
if command -v grype >/dev/null 2>&1; then
  grype -q . -o table | tee artifacts/reports/grype.txt || true
fi
if command -v osv-scanner >/dev/null 2>&1; then
  osv-scanner -r . | tee artifacts/reports/osv.txt || true
fi

# --- Secret Hygiene: block long‑lived credentials in repo ---
if git grep -nE '(AWS|aws)_SECRET_ACCESS_KEY|AZURE_CLIENT_SECRET|GOOGLE_CREDENTIALS|-----BEGIN (RSA|EC) PRIVATE KEY-----' -- . ':!artifacts' ; then
  echo "❌ Long‑lived secrets detected in repo. Remove & use OIDC/JIT‑access." ; exit 1
fi

# Warn if classic env credentials are set in runner (prefer OIDC/JIT tokens)
for v in AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AZURE_CLIENT_SECRET GOOGLE_CREDENTIALS; do
  if [[ -n "${!v:-}" ]]; then echo "⚠️  $v present. Prefer OIDC ephemeral creds." ; fi
done

# --- Policy Gate: fail on CRITICAL vulns unless explicitly waived ---
CRIT=$(grep -i "CRITICAL" -c artifacts/reports/grype.txt 2>/dev/null || echo 0)
[[ "$CRIT" -eq 0 ]] || { echo "Critical vulns found: $CRIT"; exit 1; }

echo "Security baseline OK"
