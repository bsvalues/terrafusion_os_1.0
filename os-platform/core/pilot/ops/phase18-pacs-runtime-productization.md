# Phase 18 PACS-Connected Runtime Productization

## Purpose
Turn the PACS-connected Benton runtime from an implied local setup into an explicit operating role with a proofable contract.

## Current Productized Runtime
Current productized PACS-connected runtime is the canonical secured Benton workstation/runtime.

This runtime remains the source Benton sync and conversion host until a separate PACS-reachable sync host is commissioned.

## Responsibilities
### Canonical PACS-connected Benton runtime
- maintain PACS SQL connectivity
- run TerraFusionSync conversion
- prove the PACS contract boundary
- generate the canonical Benton operational snapshot

### Hostinger snapshot runtimes
- serve the promoted Benton operational snapshot
- expose the operator surface publicly
- remain excluded from live PACS-connected sync responsibilities

## Proof Requirements
Phase 18 reaches GO only when the local Benton runtime proves PACS contract truth, sync-role truth, and the canonical parcel/sales connection split.

That means all of the following must hold:
- local runtime health is truthful
- local sync status shows at least one active system and one active county
- development runtime keeps parcel truth on `pacs_oltp`
- development runtime keeps sales truth on `pacs_golive`
- PACS contract proof passes and remains read-only

## Boundary
Phase 18 does not move PACS-connected sync onto Hostinger.

It productizes the current Benton PACS-connected role exactly as it exists today, so the role stops being implicit and starts being governable.

## Next Phase Handoff
Phase 19 automates the promoted snapshot handoff from this PACS-connected runtime to the Hostinger snapshot runtimes.
