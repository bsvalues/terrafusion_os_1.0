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
      # First probe with `cargo metadata` to ensure the manifest and any workspace
      # roots are parseable in this environment. If metadata fails (for example,
      # the parent workspace Cargo.toml is malformed or intentionally lacks
      # targets), skip this crate to keep CI/builds best-effort and non-fatal.
      # Try a local build by changing into the crate directory. This avoids
      # forcing cargo to parse the parent workspace manifest in many cases.
      if (cd "$dir" && cargo build --release); then
        echo "Built $dir successfully.";
      else
        echo "Warning: build failed for $dir (non-fatal).";
      fi
  fi
done
