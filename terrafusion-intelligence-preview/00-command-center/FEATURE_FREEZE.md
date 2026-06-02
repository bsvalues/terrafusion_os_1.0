# FEATURE FREEZE — Declared 2026-06-02

## Design Principle: Progressive Depth

Every surface in the demo follows this layering:

1. **What is it?** — Anyone understands (Intelligence Summary, section titles)
2. **Why does it matter?** — Non-experts stop here and succeed (Decision callouts, "Why should I care?")
3. **What should I do?** — Now What sections, action items
4. **Show me the evidence.** — Comparable sales, ratio analysis, levy breakdowns
5. **Show me the technical details.** — QG-04, COD statistics, IAAO standards

Experts drill to Layer 5. Non-experts stop at Layer 2 or 3. Both succeed.

**Do not simplify by removing depth. Make the meaning accessible at every layer.**

The test: "They won't understand every detail paragraph — but they'll understand the decisions."

**Status**: ACTIVE
**Effective**: Now
**Lift date**: Post-conference or explicit override

## Rule

Every proposed change must answer:

> Does this materially improve the conference experience?

If no → POST_CONFERENCE.md

## What Is Frozen

- No new routes
- No new components
- No new data structures
- No new pages
- No new agent architectures
- No Academy entries beyond the current 10
- No Ask Academy topics beyond the current 20
- No Atlas features beyond Dossier + County Pulse
- No OS features

## What Is Allowed

- Bug fixes that break the demo
- Visual fixes discovered during human testing
- Content clarifications discovered during human testing
- Typo fixes
- Accessibility fixes (contrast, font size, screen reader)
- Demo script refinement based on practice runs

## The Test

Before touching code, ask:

1. Did a real human get confused by this?
2. Does fixing it change their experience in under 5 seconds?
3. Can I explain the fix in one sentence?

If all three: yes, fix it.
If any one: no, POST_CONFERENCE.md.
