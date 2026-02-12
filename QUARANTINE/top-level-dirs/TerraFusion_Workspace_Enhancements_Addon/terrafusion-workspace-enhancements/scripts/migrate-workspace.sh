#!/usr/bin/env bash
set -euo pipefail
WS="${1:-}"; FROM="${2:-}"; TO="${3:-}"
if [[ -z "$WS" || -z "$TO" ]]; then echo "Usage: $0 <workspace> <from-version> <to-version>"; exit 1; fi
jq --arg to "$TO" '.version=$to | .lastMigration=now|tostring' "$WS" > "$WS.tmp" && mv "$WS.tmp" "$WS"
echo "Migrated $WS to version $TO"
