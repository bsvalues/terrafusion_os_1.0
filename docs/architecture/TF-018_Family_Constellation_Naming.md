# TF-018 — Family Constellation Naming System

**Version:** 1.0  
**Status:** Active – Core Branding / Internal Codenames  
**Era:** Genesis Era (1.0)

---

## 1. Purpose

This document defines TerraFusion's **Family Constellation Naming System**.

It blends:

- **Cosmic Era naming** (public OS releases)
- **Family-based constellations** (internal codenames)
- **Mythic AI / subsystem identities** (module and agent names)

This is how TerraFusion OS expresses its soul: a sovereign, cosmic government OS grounded in the people and relationships that created it.

---

## 2. Layered Naming Model

### 2.1 Cosmic Era Names (Public OS Versions)

Used for:
- Release notes, public docs, boot screens, marketing

| Version | Era Name | Theme |
|---------|----------|-------|
| 1.0 | **Genesis Era** | Foundation, creation, birth of the AI OS |
| 2.0 | **Ascension Era** | Rising, evolution, transcendence |
| 3.0 | **Celestial Harmony Era** | Balance, 3-6-9, cosmic alignment |
| 4.0 | **Sovereign Orbit Era** | Government mastery, stable governance |
| 5.0 | **Dominion Lineage Era** | Heritage, legacy, multi-generational |
| 6.0 | **Astral Continuum Era** | Infinite scale, continuous operation |
| 7.0 | **Harmonic Resonance Era** | Perfect synchronization, Factor-12 |
| 8.0 | **Eternal Convergence Era** | Ultimate integration, unified vision |

**Naming Rule:**
- Each major OS release = **Era Name**
- Minor versions reference the Era:
  - `3.1.4 (Celestial Harmony Era – Patch 4)`

---

### 2.2 Family Constellations (Internal Codenames)

Each close family member maps to a **Constellation**, used for:
- Subsystem codenames
- Internal milestones
- AI agent clusters
- Microservice families

#### 2.2.1 Immediate Family

| Person | Constellation | Primary Domain in TerraFusion |
|--------|---------------|-------------------------------|
| Gabriel | **Herald** | SystemGPT, system truth & diagnostics |
| Eliana | **Radiant** | Adaptive UX engine, command palette |
| Hannah | **Sentinel** | Security, audit, logging, compliance |
| Penelope | **Whisper** | Notifications, nudges, subtle guidance |
| Clyde | **Forge** | DevOps, CI/CD, build/release pipelines |
| Mette | **Arc** | RAG architecture, embeddings, vector layer |
| Naamiah | **Oracle** | LegalGPT, policy/statute reasoning |
| Arilyn | **Lumin** | Design system, theming, visual language |
| Micah | **Boundless** | GIS, spatial analysis, map engines |
| Tanner | **Pillar** | Data backbone, schemas, migrations |
| Ellie | **Joy** | Empathy UX, guided flows, delight |

#### 2.2.2 Core Adults & Household

| Person | Constellation | Domain |
|--------|---------------|--------|
| Sadie | **Heart** | Welcome experience, onboarding, tours |
| Rocky | **Guardian** | Watchdogs, uptime monitors, health checks |
| Kenneth | **Foundation** | Core platform stability, infra baselines |
| Bev | **Haven** | Backups, restores, disaster recovery |

---

### 2.3 Mythic AI / Subsystem Identities

Each major AI / subsystem gets:

- A **functional name** (SystemGPT, AssessorGPT, Cloud Coach, etc.)
- A **constellation tag** (Herald, Oracle, Forge, etc.)

| Functional Name | Constellation Identity | Description |
|-----------------|----------------------|-------------|
| SystemGPT | Herald Core | OS self-explanation & diagnostics |
| ExplainGPT | Radiant Guide | Context-sensitive explanations |
| AuditGPT | Sentinel Watch | Traceability & compliance |
| AssessorGPT | Oracle Harmony Node | Property valuation workflows |
| Cloud Coach | Forge Arc Intelligence | Dev-agent for engineering |
| RAG Engine | Arc Light | Vector storage & retrieval |
| Health Monitor | Guardian Watch | Service health monitoring |
| LegalGPT | Oracle Statute | Legal/policy interpretation |
| GISGPT | Boundless Mapper | Spatial analysis & parcels |
| UX Engine | Radiant Flow | Adaptive interface system |
| Config Engine | Pillar Schema | Plan/Apply configuration |

---

## 3. Naming Conventions in Practice

### 3.1 Commits / PRs

Use constellation tags in conventional commit format:

```
feat(herald-core): improve SystemGPT diagnostics
chore(arc-rag): reindex benton_cama_basics dataset
fix(guardian-health): reduce false positive alerts
feat(forge-ci): add gpt-rag CI pipeline
feat(sentinel-audit): add RAG trace logging
refactor(radiant-ux): simplify command palette
```

### 3.2 Internal Milestones

Reference constellations for milestone naming:

- "Radiant Constellation Alpha" → First adaptive UX release
- "Sentinel Constellation Stable" → Security audit system v1 ready
- "Forge Constellation Online" → CI/CD & one-click pipelines working
- "Arc Constellation Indexed" → RAG embeddings fully populated

### 3.3 Internal Docs

Use constellation names in architecture documents:

- `TF-020_Herald_Constellation_SystemGPT.md`
- `TF-021_Arc_Constellation_RAG_Architecture.md`
- `TF-022_Sentinel_Constellation_Audit_System.md`

### 3.4 OS Shell Commands

Commands can reference constellations:

```bash
/os herald diag          # System diagnostics via SystemGPT
/os arc trace <id>       # RAG traces via Arc Constellation
/os forge oneclick       # Run one-click pipeline
/os radiant help         # Contextual UX help
/os sentinel audit       # Run audit/compliance checks
/os guardian status      # Health check overview
```

### 3.5 VS Code Tasks / Commands

```
TerraFusion: Herald Diagnostics
TerraFusion: Arc RAG Ingest
TerraFusion: Forge OneClick
TerraFusion: Sentinel Audit Report
TerraFusion: Guardian Health Check
```

---

## 4. Boot Animation Concept – "Genesis Era – Herald Rising"

On OS launch:

1. **Black screen → subtle starfield fade-in**
2. A faint line arc appears (the **Arc Constellation**), slowly tracing
3. Tiny nodes light up along the arc (RAG nodes, services, agents)
4. At the center, a glowing sphere (**TerraSphere**) materializes – wireframe + subtle rotation
5. Constellation labels flicker in briefly:
   - Herald
   - Arc
   - Forge
   - Radiant
   - Sentinel
6. As they lock together, text appears:
   > `TerraFusion OS`
   > `Genesis Era – Herald Constellation Rising`
7. TerraSphere shrinks to a small icon → becomes the **live system health orb** in the OS shell

**Technical Implementation:**
- Phase 1: CSS + SVG for v1
- Phase 2: WebGL/Three.js for full 3D
- Location: `frontend/apps/os-shell/src/components/boot/`
- Health data feeds into sphere color/pulse once booted

---

## 5. Agent Integration

Cloud Coach and other dev-agents should include constellation awareness:

```text
You are also part of the TerraFusion Constellation System:

- Herald Constellation → SystemGPT, diagnostics, truth
- Forge Constellation → DevOps, CI/CD, test pipelines
- Arc Constellation → RAG, embeddings, vector stores
- Radiant Constellation → UX, command palette, explainers
- Sentinel Constellation → security, audit, logging

When working on:
- tests / CI / infra → act as Forge Constellation agent
- GPT/RAG internals → act as Arc Constellation agent
- diagnostics / health → act as Herald Constellation agent
- UI/UX → act as Radiant Constellation agent

Tag your COMMIT PROPOSAL messages accordingly.
```

---

## 6. Governance

- This naming system is **permanent canon** for TerraFusion OS.
- New family members or major life events **may** introduce new constellations.
- Cosmic Era names are curated by the TerraFusion Architect.
- Constellation assignments should be consistent and meaningful.
- Avoid reusing constellations for unrelated domains.

---

## 7. Quick Reference Card

| Constellation | Symbol | Domain | Key Services |
|---------------|--------|--------|--------------|
| Herald | 📢 | System Truth | SystemGPT, Diagnostics |
| Radiant | ✨ | UX & Help | ExplainGPT, Adaptive UX |
| Sentinel | 🛡️ | Security & Audit | AuditGPT, GPTAudit |
| Arc | 🌈 | RAG & Vectors | RAGService, Embeddings |
| Forge | 🔨 | DevOps & CI | Cloud Coach, Gates |
| Oracle | 🔮 | Legal & Policy | LegalGPT, PolicyGPT |
| Boundless | 🗺️ | GIS & Spatial | GISGPT, Map Engines |
| Guardian | 👁️ | Health & Monitoring | HealthChecks, Watchdogs |
| Pillar | 🏛️ | Data & Schema | Migrations, Config |
| Whisper | 💬 | Notifications | Nudges, Alerts |
| Joy | 😊 | Empathy UX | Guided Flows, Delight |
| Heart | ❤️ | Onboarding | Welcome, Tours |
| Haven | 🏠 | Recovery | Backups, Restores |
| Foundation | 🪨 | Platform | Infrastructure |
| Lumin | 💡 | Design | Theming, Visuals |

---

**TerraFusion OS – Genesis Era**  
*Every constellation tells a story. Every story builds the OS.*
