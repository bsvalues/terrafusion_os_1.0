# Current Use Canonical Data Model Guide

## Purpose

Consolidate all generated slices into a stable production data model.

## Required Principles

1. Every record is county-scoped.
2. Every parcel record has `ParcelId`.
3. Calculations preserve input and output snapshots.
4. Notices preserve approval and issuance state.
5. Trace events are append-only.
6. External systems are referenced, not embedded.
7. Historical records are never silently mutated.

## First Production Tables

For first alpha persistence, create only:

- CurrentUseClassifications
- CurrentUseRollbackCalculations
- CurrentUseEvidenceItems
- CurrentUseTraceEvents
- CurrentUsePolicyPacks

Add other tables after operational proof.
