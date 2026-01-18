# TerraFusion Scope Report

SOLID_BASE: 567fbcec5
ARCH_ANCHOR: 9af5bb291

## Totals
- CORE_OS_RUNTIME: 2
- CORE_OS_TOOLING: 1
- QUARANTINE: 4

## Top Evidence Samples
- . -> CORE_OS_TOOLING (local=4; total=6; wiring=none)
- .ai -> QUARANTINE (local=0; total=0; wiring=kernel-gateway-ref)
- Dev -> CORE_OS_RUNTIME (local=8; total=16; wiring=kernel-gateway-ref,os-shell-mount-ref)
- Dev - Copy -> QUARANTINE (local=5; total=7; wiring=none)
- TestPkg -> QUARANTINE (local=1; total=1; wiring=none)
- BadPkg -> QUARANTINE (local=2; total=2; wiring=none)
