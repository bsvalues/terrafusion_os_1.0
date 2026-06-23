---
name: ui-ux-pro-max
description: >-
  Advisory UI/UX design intelligence for TerraFusion surfaces (OS Shell,
  os-canon, suite workspaces, Property Workbench, utilities). Vendored from the
  public ui-ux-pro-max skill: 67 UI styles, 161 color palettes, 57 font
  pairings, 161 product-type reasoning rules, 99 UX guidelines, 25 chart types,
  stack-specific guidance (React, Next.js, Vue, Svelte, Tailwind, shadcn/ui,
  React Native, Flutter, SwiftUI). Use for visual design, layout critique,
  accessibility passes, design-system recommendations, and component polish.
  ADVISORY ONLY — TerraFusion Canon and the Launch/Surface Contract remain
  authoritative. Do NOT use for governance/runtime logic, backend, routing,
  data/API behavior, or to move surfaces between OS/suite/workbench/marketplace
  layers.
---

# UI UX Pro Max — TerraFusion Usage

Advisory design intelligence for TerraFusion UI/UX work. **TerraFusion Canon
remains authoritative.** This skill recommends; it never overrides Canon, the
Launch/Surface Contract, design-token rules, or the honesty rules.

## Use this skill for
- UI/visual review and critique
- Accessibility passes (contrast, focus, keyboard nav, reduced-motion)
- Design-system recommendations (style, palette, typography, effects)
- Layout / spacing / interaction-state polish
- os-canon and Canon IDE panel visual polish
- Stack-specific UI guidance for the os-shell frontend

## Do NOT use this skill for
- Governance or Canon runtime logic
- Backend fixes, API or database behavior
- Routing / boot-load bugs (e.g., Property Workbench route failures)
- Moving a surface between OS / suite / workbench / marketplace layers
- Adding fake placeholders, fake metrics, fake geometry, or demo-only UI
  without a visible honesty label

## Before using it (TerraFusion preflight)
1. Identify the surface: OS Shell · os-canon · suite workspace · workbench · utility.
2. Confirm the Launch / Surface Contract for that surface.
3. Confirm no runtime/governance behavior is being changed.
4. Confirm TerraFusion design tokens (tf-text-*, terra-*) and accessibility requirements.

Do not use this skill to justify product-architecture changes.

## Running the generator
The queries below are **read-only** — they read the bundled CSV datasets and
print to stdout. The upstream CLI also exposes a `--persist` flag that *writes* a
`design-system/**` folder (to `--output-dir`, default: current directory). Omit
`--persist` for advisory use; if you do persist, target a scratch directory —
never write into a TerraFusion source surface.
```bash
# full design system (ASCII)
python3 .terrafusion/skills/ui-ux-pro-max/scripts/search.py "saas dashboard" --design-system -p "MyApp"
# domain queries
python3 .terrafusion/skills/ui-ux-pro-max/scripts/search.py "glassmorphism" --domain style
python3 .terrafusion/skills/ui-ux-pro-max/scripts/search.py "elegant serif" --domain typography
python3 .terrafusion/skills/ui-ux-pro-max/scripts/search.py "form validation" --stack react
```
Requires Python 3. The full upstream reference is in `UPSTREAM_SKILL.md`;
provenance and license in `VENDOR.md` / `LICENSE`.
