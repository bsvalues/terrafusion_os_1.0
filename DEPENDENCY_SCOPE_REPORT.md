# TerraFusion Scope Report

SOLID_BASE: 567fbcec5
ARCH_ANCHOR: 9af5bb291

## Totals
- CORE_OS_RUNTIME: 16
- CORE_OS_TOOLING: 5
- GEN2_APPS: 6
- QUARANTINE: 140

## Top Evidence Samples
- . -> CORE_OS_TOOLING (local=4; total=6; wiring=none)
- .ai -> QUARANTINE (local=0; total=0; wiring=kernel-gateway-ref)
- .ci_artifacts_local -> QUARANTINE (local=0; total=0; wiring=none)
- BS_PACS -> QUARANTINE (local=2; total=3; wiring=none)
- CONSOLIDATED_20250915_062012 -> QUARANTINE (local=2; total=3; wiring=none)
- Dev -> CORE_OS_RUNTIME (local=8; total=16; wiring=kernel-gateway-ref,os-shell-mount-ref)
- Dev - Copy -> QUARANTINE (local=5; total=7; wiring=none)
- Dev - Copy (2) -> QUARANTINE (local=5; total=7; wiring=none)
- SDK -> CORE_OS_TOOLING (local=3; total=12; wiring=compose-ref,kernel-gateway-ref)
- TerraFusion_Command_Portal_Starter -> QUARANTINE (local=8; total=10; wiring=none)
- _CLEAN_BUILD_ZONE -> QUARANTINE (local=3; total=4; wiring=none)
- _pre_restore_safety_20260108_144218 -> QUARANTINE (local=0; total=0; wiring=none)
- agents/terrafusion-phd-systems-agent -> QUARANTINE (local=2; total=3; wiring=none)
- ai-workspace-companion -> QUARANTINE (local=2; total=3; wiring=none)
- applications/bcbs-gis-pro-production -> QUARANTINE (local=5; total=6; wiring=none)
- applications/bcbs-webhub-production -> QUARANTINE (local=3; total=4; wiring=none)
- applications/bs-income-valuation-production -> QUARANTINE (local=3; total=4; wiring=none)
- applications/costforge-ai -> QUARANTINE (local=3; total=4; wiring=none)
- applications/mcp-servers-production -> QUARANTINE (local=5; total=6; wiring=none)
- applications/terra-agent-production -> QUARANTINE (local=3; total=4; wiring=none)
