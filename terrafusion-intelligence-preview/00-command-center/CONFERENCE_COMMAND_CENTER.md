# Conference Command Center — TerraFusion Intelligence Preview

**Status:** Day 1 — foundation laid (real repo, isolated worktree)
**Branch:** `feat/intelligence-preview` (off `origin/main`)
**Worktree:** `~/.config/superpowers/worktrees/terrafusion_os_1.0/intelligence-preview`

> Prior "progress" reported in a sandbox session did NOT persist — nothing was committed to a real
> remote. This is the first time the preview is being built on disk for real. Treat every asset claim
> as unverified until a scout confirms it in THIS repo with a file path.

---

## Mission

Build a conference-ready preview that proves:

> **TerraFusion helps people understand what matters, why it matters, and what to do next.**

Three demo experiences, one sentence each:

| Experience | Answers |
|---|---|
| **Atlas** | What should I know about this property? |
| **Academy** | How would an experienced professional approach this problem? |
| **TerraFusion OS** | What should my office do next? |

**Demo Story Lock** — this story is fixed. It does not change during the sprint.

---

## Absolute Scope Lock

### Build (the only 5 things)
1. Atlas Property Dossier
2. Atlas County Pulse
3. Academy Codex (10 entries)
4. Ask Academy
5. Demo navigation + fallback PDFs

### Do NOT build
Billing · Subscriptions · Marketplace · SDK · Certification system · Full LMS ·
Social network · National rollout · Plugin architecture · Deep agent architecture

Anything outside the 5 build items → `11-post-conference/POST_CONFERENCE.md`.

---

## Readiness Scale (Levels 0–5)

| Level | Meaning |
|---|---|
| 0 | Idea only |
| 1 | Route exists |
| 2 | Content exists |
| 3 | Works end-to-end |
| 4 | Conference ready |
| 5 | People ask for access |

Goal by conference day: every demo route at **Level 4**.

---

## Feature Scoring (1–5 each, 25 max)

Demo clarity · User value · Conference impact · Truthfulness/evidence · Build effort

- **< 15/25** → post-conference
- **> 20/25** → priority

---

## Human Tests (must pass ≥ 3 before merge)

- **Gabe Test** — Would a newer professional use this?
- **Danny Test** — Does this increase capability, not dependency?
- **Jacob Test** — Would this help in a real CAMA/data conversion?
- **Chief Deputy Test** — Does this save time?
- **Assessor Test** — Could I use this next Monday?

---

## The "Holy Crap" Audit (every screen)

- **Atlas** — Can someone learn something unexpected in 30 seconds?
- **Academy** — Can someone solve a real problem in 5 minutes?
- **OS** — Can someone save time tomorrow?

If not → keep refining.

---

## Final Build Standard

If a feature does not help someone say one of:
- "I understand this property better."
- "I understand this problem better."
- "I know what to do next."

…cut it.

---

## The Finish Line (conference day)

- [ ] 1 polished Atlas dossier
- [ ] 1 polished County Pulse
- [ ] 10 polished Academy codex entries
- [ ] 1 Ask Academy demo
- [ ] 1 operational TerraFusion OS handoff
- [ ] 1 static fallback package
- [ ] 1 clean 3-minute script
- [ ] 1 clean 10-minute script

Not the universe. The proof.

---

## Pods & Lanes (reference)

- **Pod 1 — Discovery:** active codebase, quarantine, GitHub, external drives, NotebookLM, ChatGPT exports
- **Pod 2 — Classification:** asset registry, rankers, risk review, top-10 selector
- **Pod 3 — Build:** Atlas shell/dossier/pulse, Academy shell/codex/ask
- **Pod 4 — Hardening:** tests, typecheck/build, demo script, fallback PDFs, UX polish, reality tester

### Phone-session reachable now
staging structure · command-center files · active-codebase scout · GitHub scout · asset registry start · route scaffolding

### Blocked until desktop (no external-drive access from phone)
external-drive scout · NotebookLM scout · quarantine/old-workspace scout · ChatGPT conversation exports
