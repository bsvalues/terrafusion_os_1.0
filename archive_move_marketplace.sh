#!/usr/bin/env bash
set -euo pipefail

ARCHIVE_DIR="/workspaces/terrafusion_os_1.0/archive/marketplace_20250926"
mkdir -p "$ARCHIVE_DIR"

# Curated list of marketplace-related paths to archive (relative to repo root)
paths=(
  "/workspaces/terrafusion_os_1.0/marketplace"
  "/workspaces/terrafusion_os_1.0/data/marketplace"
  "/workspaces/terrafusion_os_1.0/data/marketplace-plugins"
  "/workspaces/terrafusion_os_1.0/data/marketplace-revenue"
  "/workspaces/terrafusion_os_1.0/deployment/production/modules/13-marketplace"
  "/workspaces/terrafusion_os_1.0/configs/docker-compose.marketplace.yml"
  "/workspaces/terrafusion_os_1.0/backend/TerraFusion.Marketplace"
  "/workspaces/terrafusion_os_1.0/frontend/public/modules/marketplace"
  "/workspaces/terrafusion_os_1.0/frontend/src/components/marketplace"
  "/workspaces/terrafusion_os_1.0/infrastructure/marketplace-enhanced"
  "/workspaces/terrafusion_os_1.0/infrastructure/marketplace-unified"
  "/workspaces/terrafusion_os_1.0/TERRAFUSION_ULTIMATE_STANDALONE_PACKAGE/PluginMarketplaceLauncher"
  "/workspaces/terrafusion_os_1.0/configs/docker-compose.marketplace.yml.backup"
)

cd /workspaces/terrafusion_os_1.0
moved=0
for p in "${paths[@]}"; do
  if [ -e "$p" ]; then
    # Compute destination preserving relative path under archive
    rel="${p#/workspaces/terrafusion_os_1.0/}"
    dest="$ARCHIVE_DIR/$rel"
    mkdir -p "$(dirname "$dest")"
    echo "Archiving: $p -> $dest"
    # Try git mv first (works for tracked files)
    if git ls-files --error-unmatch "$p" >/dev/null 2>&1; then
      git mv "$p" "$dest"
    else
      mv "$p" "$dest"
      # if moved untracked, add to git so it's visible in archive
      git add "$dest" || true
    fi
    moved=$((moved+1))
  else
    echo "Not found, skipping: $p"
  fi
done

if [ $moved -gt 0 ]; then
  git add "$ARCHIVE_DIR" || true
  git commit -m "archive(marketplace): move curated marketplace artifacts to archive/marketplace_20250926 [feature/disable-marketplace-default]" || echo "No changes to commit or commit failed"
  echo "Archived $moved items and committed changes."
else
  echo "No marketplace items found to archive."
fi

exit 0
