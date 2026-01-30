# ADR-0003 — TerraTrace is Unified Append‑Only Audit Spine

Date: 2026-01-28
Status: Accepted

## Decision
All notable actions emit TerraTrace events. TerraTrace is append-only and county-scoped.

## Rationale
Government-grade auditability and one unified activity feed.

## Consequences
Suites do not maintain independent parcel timelines; tool execution emits invoke + result events.
