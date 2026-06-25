#!/usr/bin/env bash
# Receiving-vessel validator (docs/governance-only, dependency-light).
# Run from the TerraFusionOS repo root. Exits non-zero on any failure.
set -u
fail=0
must_exist() { [ -e "$1" ] && echo "OK   present: $1" || { echo "FAIL missing: $1"; fail=1; }; }
must_absent() { [ ! -e "$1" ] && echo "OK   absent:  $1" || { echo "FAIL present: $1"; fail=1; }; }

must_exist README.md
must_exist AGENTS.md
must_exist canon/INTAKE_RULES.md
must_exist operations/evidence/MIGRATION_PROVENANCE_LEDGER.md
must_exist docs/forensics/FULL-AGENT-HANDOFF.md
must_exist operations/work-orders/WO-CORE-1-PLACEHOLDER.md
must_exist operations/work-orders/WO-LOOP-45-READINESS-GATE.md

must_absent backend
must_absent frontend
must_absent os-platform
must_absent package.json
must_absent pnpm-workspace.yaml

for f in *.sln; do [ -e "$f" ] && { echo "FAIL present: $f"; fail=1; }; done

[ "$fail" -eq 0 ] && echo "RECEIVING-VESSEL VALIDATION: PASS" || echo "RECEIVING-VESSEL VALIDATION: FAIL"
exit "$fail"
