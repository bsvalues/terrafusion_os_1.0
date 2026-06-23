# Vendor provenance — ui-ux-pro-max

- **Source:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (public)
- **Commit vendored:** `b7e3af80f6e331f6fb456667b82b12cade7c9d35`
- **Vendored on:** 2026-06-08
- **License:** MIT (see `LICENSE` in this directory)

## What was vendored
- `scripts/` — `search.py`, `core.py`, `design_system.py` (Python 3 search + design-system generator), copied from upstream `src/ui-ux-pro-max/scripts/`.
- `data/` — static CSV datasets (styles, colors, typography, products, ux-guidelines, charts, landing, icons, react-performance, app-interface, design, + `data/stacks/`), copied from upstream `src/ui-ux-pro-max/data/`.
- `UPSTREAM_SKILL.md` — the upstream `SKILL.md` (full reference), kept verbatim.
- `SKILL.md` — **TerraFusion wrapper** (advisory scoping; Canon authoritative).

## What was NOT vendored (intentionally)
- The `uipro-cli` installer and `npm` packages — no global install was run.
- Assistant-specific folders (`.cursor/`, `.windsurf/`, `.kiro/`, `.factory/`, etc.).
- Upstream `templates/`, build/sync helpers (`data/_sync_all.py`), and `draft.csv`.
- The upstream symlinks (`.claude/skills/.../{scripts,data}` → `src/...`) were
  dereferenced; real files are committed here.

## Notes
- The repo-root `.gitignore` excludes every `data/` directory. A scoped
  `.gitignore` in this folder re-includes this skill's `data/`, and the files
  were force-added, because the CSV datasets are required by `search.py` at
  runtime.
- This is **advisory** tooling. It does not change TerraFusion runtime,
  governance, Canon rules, or the Launch/Surface Contract.
- The only modification to upstream files: trailing whitespace was stripped
  from the three `.py` scripts for repo hygiene (behavior-preserving). CSV data
  is verbatim.
