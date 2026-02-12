#!/usr/bin/env bash
set -euo pipefail
ID="${1:-$(date +%Y%m%d)}"
TITLE="${2:-new-decision}"
DIR="docs/architecture/decisions"
mkdir -p "$DIR"
FILE="$DIR/${ID}-${TITLE}.md"
cp "$DIR/template.md" "$FILE"
echo "Created $FILE"
