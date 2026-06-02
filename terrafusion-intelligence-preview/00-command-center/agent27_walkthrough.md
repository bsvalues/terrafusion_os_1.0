# Agent 27 Walkthrough — Findings

**Date**: 2026-06-02
**Persona**: "Dumb Smart Person" — intelligent, no assessment background
**Method**: Cold read of every demo route, noting every point of confusion

---

## The Pattern

One problem dominates everything else: **unexplained acronyms and domain jargon**.

The content is written by someone who has been swimming in assessment terminology for 12 hours. It reads beautifully to a senior assessor. It hits walls for everyone else.

---

## Critical Findings (confuses non-experts immediately)

### F1: "BOE" never spelled out
- **Where**: Demo Landing card description, Academy Home entry title, multiple Codex entries, Ask Academy responses
- **Impact**: A remote admin sees "BOE Preparation" and has no idea what BOE stands for
- **Fix**: Spell out "Board of Equalization (BOE)" on first use in Demo Landing and Academy Home

### F2: "Ratio: 1.00" badge in Atlas Intelligence Summary — zero context
- **Where**: Atlas Dossier hero section, pill badge
- **Impact**: The badge says "Ratio: 1.00" — ratio of what? Why is 1.00 good? A non-expert has no frame of reference
- **Fix**: Change to "Assessment Ratio: 1.00 (on target)" — tells you what it is and that it's good

### F3: "agentic workflows" in Demo Landing
- **Where**: TerraFusion OS card description
- **Impact**: Pure insider jargon. Even most tech people would pause.
- **Fix**: Replace with plain language: "integrated tools and workflows"

---

## Important Findings (reduces understanding for non-experts)

### F4: "COD" used without definition
- **Where**: Atlas Dossier signals ("COD target: <15"), County Pulse Risk Watch ("COD of 18.2"), Academy entries, Ask responses
- **Impact**: Appears 10+ times across the demo. Never defined once.
- **Fix**: On first use in Atlas signal: "COD (uniformity score, target: below 15)"

### F5: "IAAO standards" referenced without explanation
- **Where**: Atlas Dossier signal, multiple Academy entries and Ask responses
- **Impact**: IAAO means nothing to anyone outside assessment
- **Fix**: First use: "IAAO (assessment industry) standards"

### F6: "CAGR" in Now What investor column
- **Where**: Atlas Dossier, Now What section, Investor column
- **Impact**: Finance jargon that's unnecessary here
- **Fix**: Replace "3.7% CAGR" with "3.7% annual growth"

### F7: "Class 4" quality class with no scale
- **Where**: Atlas Dossier, Property Snapshot
- **Impact**: "Good (Class 4)" — is 4 out of 5? Out of 10? Is 1 best or worst?
- **Fix**: Change to "Good (Class 4 of 6)"

### F8: "DOR" in County Pulse
- **Where**: Risk Watch section
- **Impact**: Department of Revenue — not obvious
- **Fix**: Spell out "Dept. of Revenue (DOR)"

---

## Minor Findings (noticeable but not blocking)

### F9: "QG-04" neighborhood code
- **Where**: Atlas Dossier, Snapshot
- **Impact**: Noise for non-experts, useful for experts
- **Fix**: Keep — experts need it, non-experts skip it

### F10: HTML entity "&lt;" in signal description
- **Where**: Atlas Dossier, third signal card
- **Impact**: May render as literal "&lt;" instead of "<"
- **Fix**: Verify rendering; replace if needed

### F11: "appreciating corridor" in Intelligence Summary
- **Where**: Hero text
- **Impact**: "corridor" is assessment jargon for a geographic area
- **Fix**: Leave — context makes it understandable, and it's punchy

---

## What Works Well (non-expert perspective)

1. **Intelligence Summary** — one sentence, immediately understandable even without domain knowledge
2. **Decision callouts** — even if I don't understand the signal, "Decision: no adjustment needed" tells me the conclusion
3. **Section structure** — Snapshot → Context → Activity → Signals → Insight → Now What is intuitive
4. **"Why should I care?" framing** — every section has enough context to understand relevance
5. **Demo Landing** — three cards, three questions, zero explanation needed
6. **Academy structure** — Problem → Why It Matters is the right teaching sequence
7. **Suggested questions in Ask Academy** — natural language, not jargon

## The Fix

15 surgical text changes across 4 files. No structural changes. Every fix is a first-use definition or a jargon replacement. Takes 10 minutes and adds maybe 50 characters total.
