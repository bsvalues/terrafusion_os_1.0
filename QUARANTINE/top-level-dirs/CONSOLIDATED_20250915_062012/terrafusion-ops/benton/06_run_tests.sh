#!/usr/bin/env bash
set -Eeuo pipefail

bash scripts/run_quality_gates.sh || { echo "Quality gates failed"; exit 1; }

echo "Quality gates passed."
