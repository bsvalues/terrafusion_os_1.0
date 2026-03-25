# TerraFusion OS — Module Integration Map

> **Living document.** Update this whenever a module's source location changes.
> Last updated: 2026-03-25
>
> **DO NOT lose this map.** Every session that has hunted for these apps has spent 2–4 hours
> rediscovering the same scatter pattern. This is the canonical location.

---

## Purpose

Records where each TerraFusion OS module's **full-stack application code lives**. Source-of-truth index only — not an implementation plan.

When an agent or developer needs to find a module's real application, start here.

---

## Usage Rules

- Add or update a row when a module's source is discovered or changes.
- Do **not** embed implementation phases, port assignments, or wiring instructions here.
- Do **not** use the GitHub org `bsvalverde` — the correct org is `bsvalues` (see Locked Decisions).

---

## Module Source Truth Table

| Module ID | Full-stack source (most complete) | GitHub Repo | Notes |
|-----------|-----------------------------------|-------------|-------|
| `terra-prime` | `QUARANTINE/terra-primeview-production` | — | Reference implementation for the iframe bridge pattern |
| `terra-levy` | `QUARANTINE/terra-levy` + `backend/TerraFusion.Levy` (Express server) | — | Static `TerraLevyDashboard.tsx` in shell ≠ the real Express server |
| `terra-pilt` | `QUARANTINE/top-level-dirs/SDK/modules/terra-pilt` | `github.com/bsvalues/TerraFusionPilt` (Feb 2026 — MOST COMPLETE; client/server/shared, Express + PostgreSQL + Drizzle) | Prefer GitHub version |
| `terra-miner` | `QUARANTINE/terra-miner-production` | `github.com/bsvalues/TerraMiner` (Python + Next.js + PACS + Zillow/PACMLS/ATTOM ETL + MCP) | Prefer GitHub version |
| `terra-gis` / `gis-pro` | `QUARANTINE/top-level-dirs/marketplace/government-core/gispro` (Drizzle + MCP + PostGIS) | — | Origin: Bsbcintelligentvalues; no separate GitHub repo |
| `terra-gama` | `QUARANTINE/top-level-dirs/applications/terra-gama-production` (Flask + Next.js 14 + Electron) | TerraGama/TerraFusionGama repos exist but are **empty** | Use QUARANTINE, not GitHub |
| `terra-permit` | `QUARANTINE/top-level-dirs/applications/terra-permit` | `github.com/bsvalues/TerraFUsionPermit` (**capital U** — Jun 2025; TypeScript + Drizzle + MCP server) | Prefer GitHub version |
| `terra-sync` | `QUARANTINE/terra-fusion-sync` (Python ETL + .NET + privacy tiers 17/18, Harris PACS 89,247 parcels) | — | |
| `legislative-pulse` | `QUARANTINE/terra-legislative-pulse` (Node + Drizzle + MCP, v2.1.0) | `github.com/bsvalues/legislative-pulse-beacon` = **Lovable.dev scaffold only, NO backend** | Use QUARANTINE, NOT GitHub beacon |
| `terra-dossier` | `QUARANTINE/terra-dossier` (Deno 2.x Gen2) | — | |
| `vei` | **No standalone implementation found** | — | True gap — no code exists anywhere in monorepo or GitHub |
| `pacs-bridge` | `backend/TerraFusion.Core/PACS/` (.NET only) | — | Backend only; security defect BIV-178 deferred |
| `property-tax-ai` | `QUARANTINE/bs-income-valuation-production` (Python + React) | — | Needs evaluation; may alias to `terra-gpt` |

---

## Retired / Absorbed

| Module ID | Disposition |
|-----------|-------------|
| `document-manager` | Alias — same system as `terra-dossier`. Remove stub, redirect to `terra-dossier`. |

---

## Locked Decisions

| Decision | Detail |
|----------|--------|
| GitHub org is `bsvalues` | Confirmed from fetched GitHub pages 2026-03-25. `bsvalverde` is a typo — do not use. |
| `TerraFUsionPermit` has capital U | Exact GitHub repo name — use as-is in any git commands |
| Use QUARANTINE `terra-legislative-pulse`, NOT GitHub `legislative-pulse-beacon` | GitHub version is a Lovable.dev SPA scaffold with zero backend |
| `document-manager` is absorbed by `terra-dossier` | Same system; stub should be removed |
| `vei` is a true gap | No implementation found in QUARANTINE, GitHub, or the monorepo — needs scoping before any build work |
