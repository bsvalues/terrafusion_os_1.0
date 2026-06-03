# Risk Register — Intelligence Preview

Severity: 🔴 high · 🟠 medium · 🟢 low. Updated as the sprint runs.

| # | Risk | Sev | Status | Mitigation |
|---|---|---|---|---|
| R1 | **Content quality** — a mediocre Codex entry kills credibility (Atlas/Academy are trust products) | 🔴 | open | Pod 5 content pass; Human Tests + "Holy Crap" audit before any entry ships |
| R2 | **Atlas dossier renders empty** without a backend — it's the centerpiece and is binary (shows a property or doesn't) | 🔴 | open | Build a standalone demo dossier with hardcoded Benton parcel data; zero backend dependency |
| R3 | **Conference depends on internet / DB / live AI** | 🔴 | open | Static fallback package: PDFs + screenshots + scripts (see FALLBACK_PLAN.md) |
| R4 | **Scope creep** — new ideas mid-sprint | 🟠 | open | Founder Lock; POST_CONFERENCE.md ledger |
| R5 | **Source work stranded** — prior build lived in a throwaway sandbox, never persisted | 🟠 | mitigated | Now building in a real, committed worktree off main |
| R6 | **Dirty/co-mingled repo** — 60+ worktrees, multiple agents in the sync lane | 🟠 | mitigated | Isolated `feat/intelligence-preview` worktree; sync swamp untouched |
| R7 | ~~External-drive / NotebookLM assets unreachable from phone~~ — **VOID: this was never a phone session; drives D:/E: are mounted** | 🟢 | closed | No deferral needed; run all scouts now |
| R8 | **Ask Academy answers feel like AI fluff / only match a few topics** | 🟠 | open | Curated, evidence-backed responses; expand topic matchers; honest "I don't have that yet" defaults |
