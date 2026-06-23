# UI UX Pro Max — Skill Adoption (TerraFusion)

**Status:** adopted as a repo-local, **advisory** design-review skill.
**Location:** `.terrafusion/skills/ui-ux-pro-max/`
**Source:** public `nextlevelbuilder/ui-ux-pro-max-skill` @ `b7e3af8` (MIT) — see the skill's `VENDOR.md`.
**Date:** 2026-06-08

## Why
TerraFusion already has narrow UI guards (design-token-police, ui-honesty-pass).
UI UX Pro Max adds breadth: design-system generation, style/palette/typography
recommendations, accessibility guidance, and stack-specific UI advice for the
os-shell frontend and Canon IDE surfaces. It complements — does not replace —
the existing guards.

## What it is
A Python-backed search + design-system generator (no network, no execution of
project code) over static CSV datasets: 67 styles, 161 palettes, 57 font
pairings, 161 product-type reasoning rules, 99 UX guidelines, 25 chart types,
and per-stack guidance.

## When to use
- UI / visual review and critique
- Accessibility passes
- Design-system recommendations (style, palette, typography, effects)
- Layout / spacing / interaction-state polish
- os-canon and Canon IDE panel polish

## When NOT to use
- Governance or Canon runtime logic
- Backend, API, or database behavior
- Routing / boot-load bugs (e.g., Property Workbench route failures)
- Moving a surface between OS / suite / workbench / marketplace layers
- Justifying product-architecture changes
- Adding fake placeholders / metrics / geometry / demo-only UI without a visible
  honesty label

## Authority
**Advisory only.** TerraFusion Canon, the Launch/Surface Contract, design-token
rules, and the honesty rules remain authoritative. If a recommendation conflicts
with Canon, Canon wins.

## How it was installed
Vendored (files only) via `git clone` + copy into `.terrafusion/skills/`. No
global installer, no `npm`, no assistant-specific folders. No runtime,
workflow, or `package.json` changes. See `.terrafusion/skills/ui-ux-pro-max/VENDOR.md`.

## Usage
```bash
python3 .terrafusion/skills/ui-ux-pro-max/scripts/search.py "saas dashboard" --design-system -p "MyApp"
python3 .terrafusion/skills/ui-ux-pro-max/scripts/search.py "glassmorphism" --domain style
```
(Requires Python 3.)
