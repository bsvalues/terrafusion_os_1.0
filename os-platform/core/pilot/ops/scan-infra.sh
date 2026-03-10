#!/usr/bin/env bash
set -euo pipefail

if command -v rg >/dev/null 2>&1; then
  RG="rg"
elif command -v rg.exe >/dev/null 2>&1; then
  RG="rg.exe"
else
  echo "ripgrep (rg) is required for scan-infra.sh" >&2
  exit 1
fi

ROOT="${1:-.}"
DIR_SCAN_PATHS=()
RG_SCAN_PATHS=()

for candidate in \
  "$ROOT/.github/workflows" \
  "$ROOT/ops/prod" \
  "$ROOT/ops/proxy" \
  "$ROOT/ops/scripts" \
  "$ROOT/backend" \
  "$ROOT/frontend" \
  "$ROOT/deployment" \
  "$ROOT/infrastructure" \
  "$ROOT/os-platform/core/pilot"; do
  if [ -d "$candidate" ]; then
    DIR_SCAN_PATHS+=("$candidate")
    RG_SCAN_PATHS+=("$candidate")
  fi
done

if [ -f "$ROOT/package.json" ]; then
  RG_SCAN_PATHS+=("$ROOT/package.json")
fi

if [ "${#DIR_SCAN_PATHS[@]}" -eq 0 ]; then
  DIR_SCAN_PATHS=("$ROOT")
fi

if [ "${#RG_SCAN_PATHS[@]}" -eq 0 ]; then
  RG_SCAN_PATHS=("$ROOT")
fi

FIND_EXCLUDES=(
  -not -path "*/.git/*"
  -not -path "*/node_modules/*"
  -not -path "*/ARCHIVE/*"
  -not -path "*/dist/*"
  -not -path "*/.next/*"
)
RG_ARGS=(
  -n
  --hidden
  --no-ignore-vcs
  -g "*.yml"
  -g "*.yaml"
  -g "*.sh"
  -g "*.ps1"
  -g "*.json"
  -g "*.env*"
  -g "Dockerfile*"
  -g "package.json"
  -g "Caddyfile"
  -g "!**/.git/**"
  -g "!**/node_modules/**"
  -g "!**/ARCHIVE/**"
  -g "!**/dist/**"
  -g "!**/.next/**"
)

echo "=== TerraFusion Infra/Workflow Reality Scan ==="
echo "Root: $ROOT"
echo

echo "== GitHub Workflows =="
find "$ROOT/.github/workflows" -maxdepth 1 -type f \( -name "*.yml" -o -name "*.yaml" \) 2>/dev/null || true
echo

echo "== Docker Compose files =="
find "${DIR_SCAN_PATHS[@]}" -maxdepth 4 "${FIND_EXCLUDES[@]}" -type f \( -name "docker-compose*.yml" -o -name "compose*.yml" \) 2>/dev/null || true
echo

echo "== Dockerfiles =="
find "${DIR_SCAN_PATHS[@]}" -maxdepth 6 "${FIND_EXCLUDES[@]}" -type f -iname "Dockerfile*" 2>/dev/null || true
echo

echo "== Likely deploy targets referenced (heroku/render/fly/k8s/ssh/docker/grafana) =="
"$RG" "${RG_ARGS[@]}" "(heroku|HEROKU_|fly\\.io|flyctl|render\\.com|railway|kubernetes|kubectl|helm|docker compose|docker-compose|ssh|rsync|nginx|caddy|traefik|grafana|prometheus|loki|sentry|ghcr\\.io)" "${RG_SCAN_PATHS[@]}" || true
echo

echo "== Secrets referenced in workflows =="
if [ -d "$ROOT/.github/workflows" ]; then
  "$RG" -n "secrets\\.[A-Z0-9_]+" "$ROOT/.github/workflows" || true
  "$RG" -n "vars\\.[A-Z0-9_]+" "$ROOT/.github/workflows" || true
fi
echo

echo "== Domain references (staging / prod / health endpoints) =="
"$RG" "${RG_ARGS[@]}" "(terrafusionmarket|staging\\.|prod\\.|grafana\\.|prometheus\\.|loki\\.|/healthz?|/version)" "${RG_SCAN_PATHS[@]}" || true
echo

echo "=== Scan complete ==="
