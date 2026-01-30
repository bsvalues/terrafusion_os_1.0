# ADR-0004 — TerraPilot OS Feature with Pilot/Muse Modes

Date: 2026-01-28
Status: Accepted

## Decision
TerraPilot is a single OS feature with two modes: Pilot (operator) and Muse (creator). Muse is not a separate product.

## Rationale
One copilot concept prevents user confusion, shares profile/context/logging, and maps to real staff workflows (act vs draft/explain).

## Consequences
All AI/tool actions route through TerraPilot execution pipeline and emit TerraTrace. High-risk tools require confirmation + reason codes.
