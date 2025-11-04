#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
cd "$ROOT_DIR"

log() { printf "[%s] %s\n" "$(date -u +%FT%TZ)" "$*"; }
pass_gate() { log "GATE PASS: $1"; }
fail_gate() { log "GATE FAIL: $1"; exit 1; }

log "⛰  Starting TerraFusion One‑Click Run"

make preflight   && pass_gate A || fail_gate A
make security    && pass_gate B || fail_gate B
make core        && pass_gate C || fail_gate C
make swarm       && pass_gate D || fail_gate D
make api         && pass_gate E || fail_gate E
make validate    && pass_gate F || fail_gate F
make package

log "🎉 All gates passed. Artifacts packaged in ./artifacts"
