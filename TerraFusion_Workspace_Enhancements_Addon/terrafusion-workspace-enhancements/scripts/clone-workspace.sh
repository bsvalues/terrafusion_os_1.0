#!/usr/bin/env bash
set -euo pipefail
SRC="${1:-}"; DST="${2:-}"
if [[ -z "$SRC" || -z "$DST" ]]; then echo "Usage: $0 <src-app> <dst-app>"; exit 1; fi
cp -R "marketplace/${SRC}" "marketplace/${DST}"
find "marketplace/${DST}" -type f -print0 | xargs -0 sed -i "s/${SRC}/${DST}/g"
echo "Cloned workspace marketplace/${SRC} -> marketplace/${DST}"
