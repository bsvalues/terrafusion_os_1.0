# TerraFusion Intelligence Preview — Conference Command Center

> **Users remembered the decisions. They forgot the delivery mechanism.**
>
> *People did not remember the software. They remembered the decisions.*

**Status**: ACTIVE
**Created**: 2026-06-02
**Target**: Conference Demo Day
**Branch**: `claude/review-progress-ledger-a8iw5`

---

## Mission

Prove TerraFusion transfers capability through three conference-ready experiences:

| Experience | Question It Answers |
|---|---|
| **Atlas** | What should I know about this property? |
| **Academy** | How would an experienced professional approach this? |
| **TerraFusion OS** | What should my office do next? |

---

## Deliverables Checklist

### Atlas
- [ ] Property Dossier (1 polished demo)
- [ ] County Pulse (1 polished demo)
- [ ] `/atlas` shell route
- [ ] `/atlas/search` route
- [ ] `/atlas/dossier/demo` route
- [ ] `/atlas/county-pulse/demo` route

### Academy
- [ ] Codex entries (10 polished)
- [ ] Ask Academy demo
- [ ] `/academy` shell route
- [ ] `/academy/search` route
- [ ] `/academy/codex/senior-exemption-audit` route
- [ ] `/academy/ask` route

### Hardening
- [ ] Static fallback PDF package
- [ ] 3-minute demo script
- [ ] 10-minute demo script
- [ ] Screenshots
- [ ] Verification report

---

## Scope Lock

### Build (YES)
1. Atlas Property Dossier
2. Atlas County Pulse
3. Academy Codex
4. Ask Academy
5. Demo navigation + fallback PDFs

### Do Not Build
- Billing / Subscriptions
- Marketplace / SDK
- Certification system / Full LMS
- Social network / National rollout
- Plugin architecture / Deep agent architecture

Any idea outside scope goes to `POST_CONFERENCE.md`.

---

## Pod Structure

| Pod | Purpose | Agents |
|---|---|---|
| Pod 1 — Discovery | Find the buried gold | Codebase, Quarantine, GitHub, Drives, NotebookLM, ChatGPT scouts |
| Pod 2 — Classification | Decide what matters | Registry, Rankers, Risk, Selector |
| Pod 3 — Build | Build the visible demo | Atlas Shell, Dossier, Pulse, Academy Shell, Codex, Ask |
| Pod 4 — Hardening | Make sure it doesn't embarrass you | Test, Build, Script, PDF, UX, Reality |

---

## Human Tests (Every Feature Must Pass 3+)

| Test | Question |
|---|---|
| **Gabe** | Would a newer professional use this? |
| **Danny** | Does this increase capability, not dependency? |
| **Jacob** | Would this help in a real CAMA/data conversion? |
| **Chief Deputy** | Does this save time? |
| **Assessor** | Could I use this next Monday? |

---

## Cut Rules

Cut anything that:
- Cannot demo in 60 seconds
- Requires architecture explanation
- Has no evidence source
- Does not answer "Now What?"
- Needs more than 2 days to stabilize
- Creates legal/privacy risk

---

## Final Week Rule (Founder Lock)

No new ideas enter the sprint. Only polish, remove, rehearse, stabilize.
New ideas go to `POST_CONFERENCE.md`.
