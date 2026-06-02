# P7: Disaster Recovery Package

**Date**: 2026-06-02
**Purpose**: Conference must not depend on internet, database, APIs, or AI availability.

---

## Current Architecture: Already Conference-Safe

The demo package was built with conference safety as a foundational requirement:

| Dependency | Status | Risk |
|-----------|--------|------|
| Backend API (.NET) | NOT REQUIRED | Zero risk — all data hardcoded |
| Database (PostgreSQL) | NOT REQUIRED | Zero risk — no DB calls |
| GIS Services | NOT REQUIRED | Zero risk — no map tiles |
| Internet | NOT REQUIRED (for app) | Medium risk — need to serve locally |
| AI/LLM | NOT REQUIRED | Zero risk — Ask Academy uses keyword matching |
| SignalR | NOT REQUIRED | Zero risk — no real-time features in demo |

**The demo runs entirely from static files served by Vite dev server or any HTTP server.**

---

## Fallback Tiers

### Tier 0: Ideal (Laptop + Dev Server)
- `npm run dev` on presenter's laptop
- Navigate to `localhost:3000/demo`
- Full interactive experience
- **Preparation**: Pre-install dependencies, verify `npm run dev` works before leaving for conference

### Tier 1: Static Build (Laptop + Static Files)
- `npm run build` generates static files
- Serve with any HTTP server: `npx serve ../native-shell/ui/dist`
- Full interactive experience, no Node.js runtime needed
- **Preparation**: Run build before conference, test static serving

### Tier 2: Browser-Only (Any Computer + Browser)
- Open built `index.html` directly in browser
- Most features work (routing may need hash fallback)
- **Preparation**: Test direct-open workflow, verify all routes work

### Tier 3: PDF Fallback (No Computer Needed)
The following PDFs should be generated before the conference:

| Document | Source Route | Priority |
|----------|------------|----------|
| Atlas Property Dossier | `/atlas/dossier/demo` | P0 — MUST HAVE |
| County Pulse Dashboard | `/atlas/county-pulse/demo` | P1 — should have |
| Academy Codex (all 10) | `/academy/codex/*` | P2 — nice to have |
| Demo Landing Page | `/demo` | P3 — screenshot only |

**PDF Generation Method**:
1. Start dev server (`npm run dev`)
2. Navigate to each route
3. Print to PDF (Ctrl+P → Save as PDF)
4. Store on USB drive and in cloud backup

### Tier 4: Verbal Demo (Catastrophic Failure)
If all technology fails:

**3-Minute Demo Script (No Screen)**:
> "Let me tell you what TerraFusion does with a single property.
>
> I type in an address — 2847 Queensgate Drive in Richland. In two seconds, I get a Property Dossier. Not a data sheet. A dossier.
>
> The first thing I see is one sentence: 'A well-assessed property in an appreciating corridor. Hold position, watch the commercial development on Queensgate Blvd.'
>
> That one sentence replaces 20 minutes of pulling data from three different screens.
>
> Below that: six sections. Property facts. What surrounds it. What's being built nearby. Five signals — not alerts, signals with decisions. 'The appreciation trend is sustainable, not speculative. Decision: no adjustment needed.'
>
> Then Atlas Insight — the meaning layer. Assessment confidence: high. Appreciation trajectory: sustainable. The one variable to watch: $3M in commercial development half a mile south.
>
> And finally: 'Now What?' Three columns — what should the assessor do, what should an investor know, what should a developer consider.
>
> That's Atlas. Property intelligence that tells you what to do, not just what happened.
>
> Academy does the same thing for professional knowledge — 10 expert guides, an AI assistant for assessment questions.
>
> TerraFusion OS ties it all together."

---

## Pre-Conference Checklist

### 7 Days Before
- [ ] Run `npm run dev` — verify all 8 demo routes work
- [ ] Run `npm run build` — verify static build succeeds
- [ ] Test static serving: `npx serve ../native-shell/ui/dist`
- [ ] Generate PDF backups for Tier 3
- [ ] Copy PDFs to USB drive
- [ ] Verify presenter laptop has Node.js 18+ and npm installed

### 1 Day Before
- [ ] Run `npm run dev` on presenter laptop — full walkthrough of all routes
- [ ] Test on external display/projector (check font sizes, contrast)
- [ ] Verify USB drive with PDF backups
- [ ] Practice 3-minute and 10-minute demo paths

### Day Of
- [ ] Arrive 30 minutes early
- [ ] Start dev server and verify all routes
- [ ] Open browser to `/demo` and leave it ready
- [ ] Keep USB drive accessible
- [ ] Have phone with PDF backups as final fallback

---

## Demo Paths

### 3-Minute Demo (Lightning Talk)
1. Start at `/demo` (15 sec) — "Three questions, three experiences"
2. Click Atlas → `/atlas/dossier/demo` (2 min)
   - Show Intelligence Summary (10 sec)
   - Scroll through Signals (30 sec)
   - Show "Now What?" (20 sec)
   - Key message: "One property. Every angle. One sentence takeaway."
3. Back to `/demo`, mention Academy and OS (45 sec)
   - "Academy answers 'How would an expert approach this?'"
   - "The OS connects intelligence to action"

### 10-Minute Demo (Full Walkthrough)
1. `/demo` — Frame the three questions (1 min)
2. Atlas Dossier — full scroll through all 6 sections (3 min)
   - Intelligence Summary → Snapshot → Context → Signals → Insight → Now What
3. County Pulse — county-level intelligence (1.5 min)
   - Show Growth Signals, Risk Watch, Top 5
4. Academy Home — show the 10 codex entries (1 min)
   - Click into one entry (BOE Preparation recommended)
5. Ask Academy — type a question live (1.5 min)
   - Suggested: "How should I prepare for a BOE hearing on a commercial property?"
6. TerraFusion OS — show the home/desktop surface (1 min)
   - Show suite tiles, explain the OS concept
7. Close at `/demo` — "Three questions, one platform" (1 min)

---

## Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Laptop dies | Low | Critical | USB with PDFs + verbal script |
| Projector incompatible | Low | High | HDMI + USB-C adapters, test early |
| Dev server won't start | Low | High | Pre-built static files, `npx serve` |
| Font too small on projector | Medium | Medium | Test at venue, increase browser zoom |
| Demo route 404 | Very Low | Medium | All routes type-checked and committed |
| Someone asks about pricing | High | Low | "We're in county partnership discussions" |
| Someone asks about their county | High | Low | "We'd love to explore that — here's my card" |

---

## Conference Materials Inventory

| Item | Status | Location |
|------|--------|----------|
| Source code | COMMITTED | `claude/review-progress-ledger-a8iw5` branch |
| Dev server ready | VERIFIED | `frontend/apps/os-shell/` |
| Static build | TO DO | Run `npm run build` before conference |
| PDF backups | TO DO | Generate from dev server |
| USB drive | TO DO | Copy PDFs + static build |
| Business cards | EXTERNAL | N/A |
| Verbal demo script | DONE | This document (Tier 4 section) |
| 3-min demo path | DONE | This document |
| 10-min demo path | DONE | This document |

**Verdict: The demo architecture is inherently conference-safe. The remaining preparation is operational (generate PDFs, test on projector) not technical.**
