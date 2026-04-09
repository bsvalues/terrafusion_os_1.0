#!/usr/bin/env bash
# assert-no-raw-css-colors.sh
#
# Fail if any *component* CSS file contains a raw hsl()/hsla() literal
# with numeric channels instead of var(--tf-*) token references.
#
# Scope: pages/, components/, modules/, shell/ — feature CSS only.
# Foundational files (globals.css, App.css, token files) are excluded.
#
# To allow a justified exception on a single line:
#   append /* tf-allow-raw-color */ on that line.

set -euo pipefail

ROOT="${1:-frontend/apps/os-shell/src}"

COMPONENT_DIRS=(
  "$ROOT/pages"
  "$ROOT/components"
  "$ROOT/modules"
  "$ROOT/shell"
)

VIOLATIONS=""

for DIR in "${COMPONENT_DIRS[@]}"; do
  [[ -d "$DIR" ]] || continue
  FOUND=$(
    grep -rn "hsl(" "$DIR" \
      --include="*.css" \
    | grep -vE "terrafusion-tokens\.css|workbench-tokens\.css|focus\.css" \
    | grep -v "tf-allow-raw-color" \
    | grep -v "var(--" \
    | grep -E "hsl\([0-9]" \
    || true
  )
  if [[ -n "$FOUND" ]]; then
    VIOLATIONS+="$FOUND"$'\n'
  fi
done

if [[ -n "$VIOLATIONS" ]]; then
  echo ""
  echo "❌ Raw CSS color literals in component files (use var(--tf-*) tokens):"
  echo ""
  echo "$VIOLATIONS" | head -30
  echo ""
  echo "  Fix: replace hsl(...) with var(--tf-*) aliases."
  echo "  Exception: append '/* tf-allow-raw-color */' for justified cases."
  echo ""
  exit 1
fi

echo "✅ No raw CSS color literals in component files — token contract clean."
