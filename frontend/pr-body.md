## Summary
Implements the Phase 9 Visual Renaissance foundation as a gated design system layer:

- materialQualityGate runtime classifier (reduced-motion + low-power fallbacks)
- LiquidPanel glass container with degradations
- TactileButton tactile physics with reduced-motion compliance
- ShellHome migrated to use materials primitives (controlled blast radius)

## Commits
- 18767e6bf - feat(ui): materials primitives (LiquidPanel, TactileButton, materialQualityGate)
- 54924040e - refactor(ui): ShellHome migration to materials

## Evidence
- type-check PASS
- phase83-tools PASS (32/32)
- unit tests PASS (3147 passing)
- materials tests PASS (33/33)
- DesktopIdleStability PASS (6/6)
- build PASS

## Merge Policy
Merge commit (preserve audit trail). Do not squash.
