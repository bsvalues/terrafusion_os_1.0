#!/usr/bin/env bash
set -euo pipefail
LIST="${1:-.ci/rust-manifests.txt}"

if [ ! -f "$LIST" ]; then
  echo "No $LIST; discovering manifests under backend/..."
  find backend -type f -name Cargo.toml | sort > /tmp/rust-manifests.txt
  LIST=/tmp/rust-manifests.txt
fi

fail=0
while read -r mf; do
  [ -z "$mf" ] && continue
  if [ ! -f "$mf" ]; then
    echo "::warning::Missing manifest: $mf"
    continue
  fi
  echo "== cargo metadata :: $mf"
  if ! cargo metadata --manifest-path "$mf" --format-version 1 >/dev/null 2>&1; then
    echo "::error::metadata failed for $mf"
    fail=1
    continue
  fi
  echo "== cargo build --release :: $mf"
  if ! (cd "$(dirname "$mf")" && cargo build --release); then
    echo "::error::build failed for $mf"
    fail=1
  fi
done < "$LIST"

exit $fail
