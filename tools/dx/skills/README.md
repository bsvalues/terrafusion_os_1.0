# TerraFusion Skills Registry

Skills are governed capability modules for the DX Spine. Each skill follows the SKILL.md convention with YAML frontmatter for progressive disclosure.

## Structure

Each skill lives in its own directory under `tools/dx/skills/`:

```
tools/dx/skills/
├── registry.json              # Central skill registry
├── README.md                  # This file
├── tf-pr-evidence-pack/       # PR Evidence Pack Builder (KEYSTONE)
├── tf-ui-foundation/          # Government UI Foundation
├── tf-a11y-508-audit/         # Section 508 Accessibility Audit
└── tf-data-dense-layouts/     # Data-Dense Government Layouts
```

## Conventions

- **SKILL.md**: YAML frontmatter (<1024 chars) + markdown body
- **contract.json**: JSON Schema contract for inputs/outputs
- **Progressive Disclosure**: Frontmatter is the "card", body loads on demand
- **Lane Ownership**: Each skill declares its `ownerLane`
- **Risk Level**: Skills declare risk level for governance gating

## Skill Lifecycle

1. Skill defined in `SKILL.md` with frontmatter
2. Registered in `registry.json`
3. Contract validated by drift detector
4. Activated via TDC: `tdc skill:activate <name>`
5. Evidence emitted to Context Pack
