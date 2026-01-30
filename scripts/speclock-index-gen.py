#!/usr/bin/env python3
"""
SpecLock Index Markdown Generator

Generates a human-readable markdown index from docs/spec-lock/INDEX.json.
Includes:
  - Lock summary table with Generated Artifacts column
  - Per-lock detail sections
  - Test coverage summary
  - Generator registry

Output: docs/spec-lock/INDEX.md

Usage:
  python speclock-index-gen.py
  python speclock-index-gen.py --check  # Verify index is up-to-date
"""
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import List

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

INDEX_JSON = "docs/spec-lock/INDEX.json"
GENERATORS_JSON = "docs/spec-lock/GENERATORS.json"
OUTPUT_MD = "docs/spec-lock/INDEX.md"

# ═══════════════════════════════════════════════════════════════════════════════
# HELPERS
# ═══════════════════════════════════════════════════════════════════════════════

def find_repo_root() -> Path:
    """Find repository root."""
    d = Path(__file__).resolve().parent
    while d != d.parent:
        if (d / "docs" / "spec-lock").is_dir():
            return d
        d = d.parent
    return Path.cwd()


def load_json(path: Path) -> dict:
    """Load JSON file."""
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def file_exists(repo_root: Path, path: str) -> bool:
    """Check if file exists relative to repo root."""
    return (repo_root / path).exists()


def count_tests(repo_root: Path, test_paths: List[str]) -> int:
    """Count test methods in test files (rough estimate)."""
    count = 0
    for tp in test_paths:
        full_path = repo_root / tp
        if full_path.exists():
            content = full_path.read_text(encoding='utf-8', errors='replace')
            # Count [Fact] and [Theory] attributes (xUnit)
            count += content.count('[Fact]')
            count += content.count('[Theory]')
    return count


# ═══════════════════════════════════════════════════════════════════════════════
# MARKDOWN GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

def generate_header(index: dict, repo_root: Path) -> str:
    """Generate markdown header."""
    import subprocess
    from datetime import timezone

    # Use git commit time for determinism (avoids regeneration drift)
    try:
        result = subprocess.run(
            ["git", "log", "-1", "--format=%ci", "docs/spec-lock/INDEX.json"],
            capture_output=True, text=True, cwd=repo_root
        )
        if result.returncode == 0 and result.stdout.strip():
            # Parse git date and reformat
            git_date = result.stdout.strip().split()[0]  # Just the date part
            updated = git_date
        else:
            updated = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    except Exception:
        updated = datetime.now(timezone.utc).strftime('%Y-%m-%d')

    return f"""# TerraFusion SpecLock Index

> Auto-generated from `INDEX.json` — do not edit directly.
> Regenerate with: `python scripts/speclock-index-gen.py`

**Version**: {index.get('version', '1.0.0')}
**Updated**: {updated}

---

## Overview

TerraFusion uses **SpecLock** to freeze and enforce API, schema, and governance contracts.
Each lock is immutable once published — changes require a new version via Amendment workflow.

"""


def generate_summary_table(locks: List[dict], repo_root: Path) -> str:
    """Generate summary table with Generated Artifacts column."""
    lines = [
        "## Lock Summary",
        "",
        "| ID | Surface | Status | Spec | Artifacts | Tests |",
        "|:---|:--------|:-------|:-----|:----------|:------|",
    ]

    for lock in locks:
        lock_id = lock.get('id', 'unknown')
        surface = lock.get('surface', '-')
        status = lock.get('status', 'unknown')
        spec_version = lock.get('spec_version', 'v1.0.0')

        # Count generated artifacts (with existence check)
        artifacts = lock.get('generated_artifacts', [])
        existing = sum(1 for a in artifacts if file_exists(repo_root, a))
        artifact_str = f"{existing}/{len(artifacts)}" if artifacts else "0"

        # Count tests
        test_paths = lock.get('test_paths', [])
        test_count = count_tests(repo_root, test_paths)

        # Status emoji
        status_emoji = "✅" if status == "active" else "⏸️" if status == "deprecated" else "❓"

        lines.append(f"| `{lock_id}` | {surface} | {status_emoji} {status} | {spec_version} | {artifact_str} | {test_count} |")

    lines.append("")
    return "\n".join(lines)


def generate_lock_details(locks: List[dict], repo_root: Path) -> str:
    """Generate detailed section for each lock."""
    sections = ["## Lock Details", ""]

    for lock in locks:
        lock_id = lock.get('id', 'unknown')
        name = lock.get('name', lock_id)
        surface = lock.get('surface', '-')
        status = lock.get('status', 'unknown')
        notes = lock.get('notes', '')
        related = lock.get('related', [])

        spec_path = lock.get('spec_path', '')
        spec_data_path = lock.get('spec_data_path', '')
        generated = lock.get('generated_artifacts', [])
        test_paths = lock.get('test_paths', [])
        ci_tags = lock.get('ci_tags', [])

        sections.append(f"### {name}")
        sections.append("")
        sections.append(f"**ID**: `{lock_id}`  ")
        sections.append(f"**Surface**: `{surface}`  ")
        sections.append(f"**Status**: {status}  ")
        if notes:
            sections.append(f"**Purpose**: {notes}")
        sections.append("")

        # Spec files
        sections.append("**Specification**:")
        if spec_path:
            exists = "✅" if file_exists(repo_root, spec_path) else "❌"
            sections.append(f"- {exists} [{spec_path}]({spec_path})")
        if spec_data_path:
            exists = "✅" if file_exists(repo_root, spec_data_path) else "❌"
            sections.append(f"- {exists} [{spec_data_path}]({spec_data_path})")
        sections.append("")

        # Generated artifacts
        if generated:
            sections.append("**Generated Artifacts**:")
            for artifact in generated:
                exists = "✅" if file_exists(repo_root, artifact) else "❌"
                sections.append(f"- {exists} [{artifact}]({artifact})")
            sections.append("")

        # Tests
        if test_paths:
            test_count = count_tests(repo_root, test_paths)
            sections.append(f"**Tests** ({test_count} assertions):")
            for tp in test_paths:
                exists = "✅" if file_exists(repo_root, tp) else "❌"
                sections.append(f"- {exists} [{tp}]({tp})")
            sections.append("")

        # CI tags
        if ci_tags:
            sections.append(f"**CI Tags**: {', '.join(f'`{t}`' for t in ci_tags)}")
            sections.append("")

        # Related locks
        if related:
            sections.append(f"**Related**: {', '.join(f'`{r}`' for r in related)}")
            sections.append("")

        sections.append("---")
        sections.append("")

    return "\n".join(sections)


def generate_generators_section(repo_root: Path) -> str:
    """Generate section for generator registry."""
    gen_path = repo_root / GENERATORS_JSON
    if not gen_path.exists():
        return ""

    generators = load_json(gen_path)
    gens = generators.get('generators', {})

    if not gens:
        return ""

    lines = [
        "## Generator Registry",
        "",
        "Scripts that generate artifacts from spec data:",
        "",
        "| Surface | Script | Description |",
        "|:--------|:-------|:------------|",
    ]

    for surface, info in gens.items():
        script = info.get('script', '-')
        desc = info.get('description', '-')
        exists = "✅" if file_exists(repo_root, script) else "❌"
        lines.append(f"| `{surface}` | {exists} `{script}` | {desc} |")

    lines.extend(["", "---", ""])
    return "\n".join(lines)


def generate_footer() -> str:
    """Generate markdown footer."""
    return """
## Maintenance

### Adding a New Lock

1. Create spec directory: `docs/spec-lock/locks/{surface}/{surface}.v1/`
2. Write `SPEC_LOCK_v1.0.0.md` (human-readable spec)
3. Write `speclock.spec.json` (machine-readable)
4. Create generator script in `scripts/speclock-{surface}-gen.py`
5. Add entry to `INDEX.json`
6. Add entry to `GENERATORS.json`
7. Write tests in `backend/tests/TerraFusion.Unit.SmokeTests/`
8. Run: `python scripts/speclock-index-gen.py`

### Updating a Lock

Locks are immutable. To update:

1. Create Amendment proposal (see `amendment.v1`)
2. Get county quorum approval
3. Create new version: `{surface}.v2/`
4. Deprecate old version in `INDEX.json`

### CI Integration

All SpecLocks are validated in CI via:
- `scripts/ci-seal-gate.sh` (Gate 1)
- `scripts/ci-seal-gate.ps1` (Windows)

---

*Generated by speclock-index-gen.py*
"""


def generate_index_markdown(repo_root: Path) -> str:
    """Generate full INDEX.md content."""
    index = load_json(repo_root / INDEX_JSON)
    locks = index.get('locks', [])

    parts = [
        generate_header(index, repo_root),
        generate_summary_table(locks, repo_root),
        generate_lock_details(locks, repo_root),
        generate_generators_section(repo_root),
        generate_footer(),
    ]

    return "".join(parts)


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Generate SpecLock INDEX.md")
    parser.add_argument("--check", action="store_true",
                        help="Check if INDEX.md is up-to-date (for CI)")
    args = parser.parse_args()

    repo_root = find_repo_root()
    print(f"[speclock-index-gen] repo_root={repo_root}")

    # Check INDEX.json exists
    index_path = repo_root / INDEX_JSON
    if not index_path.exists():
        print(f"[ERROR] {INDEX_JSON} not found")
        return 1

    # Generate markdown
    markdown = generate_index_markdown(repo_root)

    output_path = repo_root / OUTPUT_MD

    if args.check:
        # Compare with existing
        if output_path.exists():
            existing = output_path.read_text(encoding='utf-8')
            # Ignore timestamp differences
            existing_stripped = '\n'.join(
                l for l in existing.split('\n')
                if not l.startswith('**Updated**:')
            )
            new_stripped = '\n'.join(
                l for l in markdown.split('\n')
                if not l.startswith('**Updated**:')
            )
            if existing_stripped != new_stripped:
                print("[ERROR] INDEX.md is out of date. Run: python scripts/speclock-index-gen.py")
                return 1
            print("[OK] INDEX.md is up-to-date")
            return 0
        else:
            print(f"[ERROR] {OUTPUT_MD} does not exist")
            return 1

    # Write output
    output_path.write_text(markdown, encoding='utf-8')
    print(f"[speclock-index-gen] ✅ Generated {OUTPUT_MD}")

    # Summary
    index = load_json(index_path)
    locks = index.get('locks', [])
    active = sum(1 for l in locks if l.get('status') == 'active')
    print(f"[speclock-index-gen] {len(locks)} locks ({active} active)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
