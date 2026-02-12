# Comprehensive Work Inventory - TerraFusion OS 1.0

## 1. Operating System Core
- **OS Data Layer**: PostgreSQL 16 (Sovereign Database) running in WSL.
- **Identity**: Inherited from OS Shell (simulated in dev via User Context).
- **AI Swarm**: 1,008 Agents (Claude-4-Opus-Supreme + tactical clusters).

## 2. Generation 1 Applications (Legacy - Frozen)
> Status: Maintenance Mode. Do not extend.
- terra-levy (v1-v4)
- terra-permit (various versions)
- ... (32 total found in `/applications`)

## 3. Generation 2 Applications (Native - Active)
> Status: Primary Development Focus.
- **TerraDossier**: The First Native OS Application.
  - Port: 3007
  - Backend: OS Shared API + Direct DB (via OS Layer)
  - UI: TerraFusion UI Kit + BlockNote
  - AI: Deep integration with Swarm

## 4. Infrastructure Scripts
- `scripts/ignite-os-data-layer.ps1`: Provisions the Sovereign DB in WSL.
- `scripts/os_layer_setup.sh`: Bash logic for DB provisioning.
