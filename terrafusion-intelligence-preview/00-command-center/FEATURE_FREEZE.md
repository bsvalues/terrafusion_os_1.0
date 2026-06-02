# FEATURE FREEZE — Declared 2026-06-02

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
