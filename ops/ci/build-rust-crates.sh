#!/usr/bin/env bash
set -euo pipefail
BASE=terrafusion-cos/rust-performance-engine/crates
if [ ! -d "$BASE" ]; then
  echo "No terrafusion rust crates found at $BASE; skipping"
  exit 0
fi
for dir in "$BASE"/*; do
  if [ -d "$dir" ] && [ -f "$dir/Cargo.toml" ]; then
    echo "---- building $dir ----"
    (cd "$dir" && cargo build --release) || true
  fi
done
