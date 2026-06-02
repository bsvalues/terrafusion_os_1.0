# HUMAN VALIDATION SPRINT

**Declared**: 2026-06-02
**Replaces**: Conference Hardening Sprint (complete)
**Status**: ACTIVE

---

## Mission

Stop building. Start watching.

The swarm built the first believable version of the product.
Now humans tell us what it actually is.

---

## The Three Questions

After someone uses the demo, ask:

1. **"What is Atlas?"**
2. **"What is Academy?"**
3. **"What is TerraFusion?"**

If their answers match these themes, the product is communicating:

- Atlas: *Helps me understand a property.*
- Academy: *Helps me understand how professionals think.*
- TerraFusion: *Helps an office know what to do next.*

---

## Test Protocol

### Subjects (run individually, never in groups)
- [ ] Danny
- [ ] Jacob
- [ ] Chris
- [ ] Gabe
- [ ] One remote admin
- [ ] One non-assessor

### Rules
- Do not explain the product before they use it
- Do not guide their clicks
- Do not answer questions during the test (note them instead)
- Do not ask "Do you like it?" or "Would you use it?"

### Agent 28 — Memory Auditor
After they finish, ask: **"What do you remember?"**

Not "what did you like?" — what do you *remember*?

Record their exact words. The phrases they use become your marketing.
The things they forget become your backlog.

### Agent 29 — Behavior Auditor
Watch silently. Record:
- First click
- Second click
- Time spent per section
- Where they paused
- Where they scrolled past
- Questions they asked aloud

### Agent 30 — Objection Collector
Capture every instance of:
- **Confusing** — they squinted, re-read, or asked "what does this mean?"
- **Unnecessary** — they scrolled past without reading
- **Distracting** — they clicked something expecting a different result
- **Missing** — they looked for something that wasn't there

Collect objections only. Not solutions. Solutions come later.

---

## The Confidence Question

Ask every subject:

> "Do you feel more confident about property assessment after using this?"

- If yes: what specifically made you more confident?
- If no: where did you get lost?

---

## What Is NOT Allowed

- No new features
- No new routes
- No new components
- No architectural changes
- No "while we're at it" improvements

The only permitted code changes are fixes for problems observed during human testing.

---

## Risk Assessment (Board-Level)

| Risk Category | Level | Notes |
|--------------|-------|-------|
| Technical | LOW | Zero backend dependencies, type-safe, fallback plan exists |
| Product | MEDIUM | Don't yet know what people love, ignore, or remember |
| Conference | LOW-MEDIUM | Working demo + story + fallback + polish |
| Market | HIGH | Haven't tested resonance — and that's okay, that's what the conference is for |

---

## Success Criteria

The validation sprint succeeds if we learn:

1. Which part of the demo people remember after 24 hours
2. Whether their description of Atlas/Academy/OS matches our intended story
3. What a non-expert understands vs. what they skip
4. What the first question is after the demo ends

Those answers are worth more than another thousand lines of code.

---

## Design Principle (from today)

**Progressive Depth**: Keep the technical depth for experts. Make the meaning accessible for everyone. The test is not "Can they understand COD statistics?" — the test is "Can they understand the decisions?"

They won't understand every detail paragraph — but they'll understand the decisions.

That's success.
