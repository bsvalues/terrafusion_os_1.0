# June 10 Rust Runtime Usage

Generated: 2026-05-19T21:15:51.237Z

Passed: false

## Summary

- Rust crates: 101
- Launch-relevant Rust crates: 2
- Quarantined/archived Rust crates: 78
- Runtime integrations: 3
- Live-proven runtime integrations: 0
- Expected binaries: 2
- Missing binaries: 2
- Normal workflow stubs: 0
- Unused Rust services: 1
- Blockers: 0
- Warnings: 3

## Launch-Relevant Crates

| Crate | Path |
|---|---|
| terraforge-kernel-cost | `packages/terrabuild/kernels/terraforge.kernel.cost/Cargo.toml` |
| terraforge-kernel-valuation | `packages/terrabuild/kernels/terraforge.kernel.valuation/Cargo.toml` |

## Runtime Integrations

| Endpoint | File | Live Proven | Evidence |
|---|---|---:|---|
| POST /api/costforge/batch-calculate | `backend/src/TerraFusion.API/Controllers/CostForgeController.cs` | false | batch-calculate<br>IKernelValuationService<br>terraforge-rust-kernel |
| POST /api/valuation/kernel-cost-approach | `backend/src/TerraFusion.API/Controllers/ValuationController.cs` | false | kernel-cost-approach<br>ComputeCostWithKernelAsync |
| backend service registration | `backend/src/TerraFusion.API/Program.cs` | false | IRustKernelProcessHost<br>RustKernelProcessHost<br>IKernelValuationService |

## Expected Binaries

| Binary | Found | Expected Paths |
|---|---|---|
| terraforge-kernel-cost | missing | `packages/terrabuild/kernels/target/release/terraforge-kernel-cost.exe`<br>`packages/terrabuild/kernels/target/release/terraforge-kernel-cost`<br>`packages/terrabuild/kernels/target/debug/terraforge-kernel-cost.exe`<br>`packages/terrabuild/kernels/target/debug/terraforge-kernel-cost` |
| terraforge-kernel-valuation | missing | `packages/terrabuild/kernels/target/release/terraforge-kernel-valuation.exe`<br>`packages/terrabuild/kernels/target/release/terraforge-kernel-valuation`<br>`packages/terrabuild/kernels/target/debug/terraforge-kernel-valuation.exe`<br>`packages/terrabuild/kernels/target/debug/terraforge-kernel-valuation` |

## Normal Workflow Stubs

- None

## Unused Rust Services

- **RustFFIService** not_registered: RustFFIService exists but Program.cs keeps its registration commented out. (`backend/src/TerraFusion.API/Services/RustFFIService.cs`)

## Blockers

- None

## Warnings

- **kernel_binary**: Launch-relevant Rust kernel source exists, but expected kernel binaries were not found. (terraforge-kernel-cost, terraforge-kernel-valuation)
- **live_runtime**: Rust runtime integrations exist in code, but live production runtime execution is not proven. (0/3 integration(s) live-proven)
- **unused_service**: Rust-adjacent service code exists but is not registered in the runtime container. (1 unused service(s))

## Interpretation

Rust exists and backend integration evidence exists, but live runtime execution is not proven.
