#!/usr/bin/env bash
# Slice REPO-MAP-1 — TerraFusion findability finder (bash variant).
#
# Cross-cuts the repo for known TerraFusion surface families so a developer
# or agent can answer "where is X?" in one command instead of greping the
# whole tree from scratch every time.
#
# Topics:
#   sync       — TerraFusion Sync surfaces (the bridge from Harris PACS to
#                TerraFusion DB)
#   workbook   — Mapping Workbook services / data model
#   comps      — Comp eligibility / canonical sale qualification / stale
#                diagnostics
#   schema     — PACS schema catalog (C48 family)
#   terraflow  — TerraFlow workflow engine references (mostly conceptual
#                today; engine code not yet built)
#   atlas      — Sync Atlas profiling + TerraAtlas GIS references
#   forge      — Forge / CostForge valuation + comp consumer surfaces
#   boundary   — All binding boundary docs (SCOPE-1/2/3 + C48-FIX2 anchors)
#
# Usage:
#   scripts/dev/find-terrafusion-surface.sh <topic>
#
# Boundary cross-references:
#   docs/REPO_MAP.md
#   docs/sync/README.md
#   docs/architecture/BOUNDARY_INDEX.md
#
# Author safety: this script is read-only. It does not modify any file.

set -euo pipefail

query="${1:-}"

if [[ -z "$query" ]]; then
  cat >&2 <<'EOF'
Usage: find-terrafusion-surface.sh <topic>

Topics:
  sync       TerraFusion Sync surfaces (the bridge)
  workbook   Mapping Workbook services / data model
  comps      Comp eligibility / canonical sale qualification / stale
  schema     PACS schema catalog (C48 family)
  terraflow  TerraFlow workflow references
  atlas      Sync Atlas + TerraAtlas GIS references
  forge      Forge / CostForge valuation + comp consumer surfaces
  boundary   Binding boundary docs

Examples:
  scripts/dev/find-terrafusion-surface.sh sync
  scripts/dev/find-terrafusion-surface.sh workbook
  scripts/dev/find-terrafusion-surface.sh schema
EOF
  exit 1
fi

# Prefer ripgrep when available (much faster + smarter ignore handling);
# fall back to grep -rn so the script works on a vanilla shell. In both
# cases skip build outputs (bin/obj/.build-verify) and binary blobs (.dll,
# .exe, .pdb) so the signal-to-noise ratio stays high.
if command -v rg >/dev/null 2>&1; then
  search() {
    rg -n "$1" \
      --glob '!**/bin/**' \
      --glob '!**/obj/**' \
      --glob '!**/.build-verify/**' \
      --glob '!**/build/**' \
      --glob '!**/node_modules/**' \
      --glob '!**/*.dll' \
      --glob '!**/*.exe' \
      --glob '!**/*.pdb' \
      "${@:2}"
  }
else
  search() {
    grep -rn -E "$1" \
      --exclude-dir=bin \
      --exclude-dir=obj \
      --exclude-dir=.build-verify \
      --exclude-dir=build \
      --exclude-dir=node_modules \
      --binary-files=without-match \
      "${@:2}"
  }
fi

case "$query" in
  sync)
    search 'SyncAtlas|SyncMapping|CanonicalSaleQualification|SalesCompProof|SyncController|TerraFusion\.Sync\.Workbench' backend docs
    ;;
  workbook)
    search 'SyncMappingWorkbook|Mapping Workbook|SyncMappingColumn|SyncMappingCodeValue|SyncCountyActiveWorkbook' backend docs
    ;;
  comps)
    search 'CompEligible|SalesComp|CanonicalSaleQualification|comps/eligible|comps/stale|sales-comp' backend docs
    ;;
  schema)
    search 'PacsSchema|IPacsSchemaCatalog|IPacsSchemaSource|IPacsSchemaIntrospector|LivePacsSchemaSource|SqlInformationSchemaIntrospector|Harris PACS|INFORMATION_SCHEMA' backend docs
    ;;
  terraflow)
    search 'TerraFlow|terraflow' backend frontend docs
    ;;
  atlas)
    search 'SyncAtlas|TerraAtlas|Atlas profile|atlas-profile|ArcGIS' backend docs
    ;;
  forge)
    search 'TerraFusion\.CostForge|CostForge|ForgeController|forge-comp|StatisticsStudio|county-studio' backend frontend docs
    ;;
  boundary)
    search 'SCOPE-1|SCOPE-2|SCOPE-3|sync-boundary-policy|terrafusion-domain-boundaries|sync-surface-inventory|BOUNDARY_INDEX|pacs-schema-catalog-as-code-policy' docs
    ;;
  *)
    echo "Unknown topic: $query" >&2
    echo "Run 'find-terrafusion-surface.sh' with no args to see the topic list." >&2
    exit 1
    ;;
esac
