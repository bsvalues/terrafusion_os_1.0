#!/usr/bin/env python3
"""
TerraFusion SpecLock Index Markdown Generator

Reads:  docs/spec-lock/INDEX.json
Writes: docs/spec-lock/INDEX.md

Deterministic output:
  - groups by status: active, draft, deprecated
  - sorts by id
"""

from __future__ import annotations

import argparse
import json
from datetime import date
from pathlib import Path
from typing import Any, Dict, List


INDEX_JSON_DEFAULT = Path("docs/spec-lock/INDEX.json")
INDEX_MD_DEFAULT = Path("docs/spec-lock/INDEX.md")


def _load_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _md_table(rows: List[List[str]], headers: List[str]) -> str:
    if not rows:
        out = ["| " + " | ".join(headers) + " |"]
        out.append("|" + "|".join(["---"] * len(headers)) + "|")
        out.append("| *None* |" + " |" * (len(headers) - 1))
        return "\n".join(out) + "\n"

    out = []
    out.append("| " + " | ".join(headers) + " |")
    out.append("|" + "|".join(["---"] * len(headers)) + "|")
    for r in rows:
        out.append("| " + " | ".join(r) + " |")
    return "\n".join(out) + "\n"


def _link(path: str, label: str = "📄") -> str:
    # Make path relative to docs/spec-lock/ for links in INDEX.md
    if path.startswith("docs/spec-lock/"):
        rel_path = path[len("docs/spec-lock/"):]
    elif path.startswith("docs/"):
        rel_path = "../" + path[len("docs/"):]
    else:
        rel_path = "../../" + path
    return f"[{label}]({rel_path})"


def _status_emoji(status: str) -> str:
    return {
        "active": "✅",
        "draft": "⚠️",
        "deprecated": "🚫"
    }.get(status, "❓")


def _surface_emoji(surface: str) -> str:
    return {
        "api": "🔌",
        "ui": "🖥️",
        "events": "📡",
        "metrics": "📈",
        "alerts": "🚨",
        "dashboards": "📊",
        "mixed": "🔀"
    }.get(surface, "📦")


def _render_generated(gen: Any) -> str:
    """
    Deterministic rendering:
      - list of paths sorted lexicographically
      - joined with <br> so the table stays readable
    """
    if not isinstance(gen, list) or len(gen) == 0:
        return ""
    paths = [str(x) for x in gen if isinstance(x, str) and str(x).strip()]
    if not paths:
        return ""
    paths.sort()
    return "<br>".join(paths)


def generate(index_json: Path, index_md: Path) -> None:
    doc = _load_json(index_json)
    locks = doc.get("locks", [])
    if not isinstance(locks, list):
        locks = []

    grouped: Dict[str, List[Dict[str, Any]]] = {"active": [], "draft": [], "deprecated": []}
    for lock in locks:
        if not isinstance(lock, dict):
            continue
        status = str(lock.get("status", "draft"))
        if status not in grouped:
            status = "draft"
        grouped[status].append(lock)

    for k in grouped:
        grouped[k].sort(key=lambda x: str(x.get("id", "")))

    def rows_for(status: str) -> List[List[str]]:
        rows: List[List[str]] = []
        for lock in grouped[status]:
            surface = str(lock.get("surface", ""))
            gen_col = _render_generated(lock.get("generated_artifacts", []))
            rows.append([
                f"`{lock.get('id', '')}`",
                f"{_surface_emoji(surface)} {surface}",
                str(lock.get("project", "")),
                str(lock.get("spec_version", "")),
                str(lock.get("owner", "")),
                f"{_status_emoji(status)} {status}",
                _link(str(lock.get("spec_path", ""))),
                gen_col
            ])
        return rows

    updated = doc.get("updated") or date.today().isoformat()
    version = doc.get("version", "1.0")
    total_locks = len(locks)
    active_count = len(grouped["active"])
    draft_count = len(grouped["draft"])
    deprecated_count = len(grouped["deprecated"])

    headers = ["ID", "Surface", "Project", "Version", "Owner", "Status", "Spec", "Generated"]

    md = []
    md.append(f"# TerraFusion SpecLock Index (v{version})")
    md.append("")
    md.append("> **GENERATED FILE** — do not hand-edit.")
    md.append("> ")
    md.append("> Regenerate: `python scripts/generate-speclock-index-md.py`")
    md.append("")
    md.append(f"**Updated**: {updated}")
    md.append(f"**Total Locks**: {total_locks}")
    md.append("")
    md.append("---")
    md.append("")

    # Quick stats
    md.append("## Summary")
    md.append("")
    md.append("| Status | Count |")
    md.append("|--------|-------|")
    md.append(f"| ✅ Active | {active_count} |")
    md.append(f"| ⚠️ Draft | {draft_count} |")
    md.append(f"| 🚫 Deprecated | {deprecated_count} |")
    md.append("")
    md.append("---")
    md.append("")

    # Active Locks
    md.append("## ✅ Active Locks")
    md.append("")
    md.append(_md_table(rows_for("active"), headers).rstrip())
    md.append("")

    # Draft Locks
    md.append("## ⚠️ Draft Locks")
    md.append("")
    md.append(_md_table(rows_for("draft"), headers).rstrip())
    md.append("")

    # Deprecated Locks
    md.append("## 🚫 Deprecated Locks")
    md.append("")
    md.append(_md_table(rows_for("deprecated"), headers).rstrip())
    md.append("")

    md.append("---")
    md.append("")

    # By Surface breakdown
    md.append("## By Surface")
    md.append("")
    surfaces_used = set(str(lock.get("surface", "")) for lock in locks)
    for surface in sorted(surfaces_used):
        emoji = _surface_emoji(surface)
        surface_locks = [lock for lock in locks if lock.get("surface") == surface]
        md.append(f"### {emoji} {surface.title()} ({len(surface_locks)})")
        md.append("")
        surface_rows = []
        for lock in sorted(surface_locks, key=lambda x: str(x.get("id", ""))):
            status = str(lock.get("status", ""))
            surface_rows.append([
                f"`{lock.get('id', '')}`",
                str(lock.get("project", "")),
                str(lock.get("spec_version", "")),
                f"{_status_emoji(status)} {status}"
            ])
        md.append(_md_table(surface_rows, ["ID", "Project", "Version", "Status"]).rstrip())
        md.append("")

    md.append("---")
    md.append("")

    # CI Integration
    md.append("## CI Integration")
    md.append("")
    md.append("### Validate Index")
    md.append("")
    md.append("```bash")
    md.append("# Python (cross-platform)")
    md.append("python scripts/validate-speclock-index.py")
    md.append("")
    md.append("# PowerShell (Windows)")
    md.append("./scripts/validate-speclock-index.ps1")
    md.append("")
    md.append("# Strict mode (treat warnings as errors)")
    md.append("python scripts/validate-speclock-index.py --strict")
    md.append("```")
    md.append("")
    md.append("### Regenerate This File")
    md.append("")
    md.append("```bash")
    md.append("python scripts/generate-speclock-index-md.py")
    md.append("```")
    md.append("")
    md.append("### Run All SpecLock Tests")
    md.append("")
    md.append("```bash")
    md.append("dotnet test --filter \"Category=SpecLock\"")
    md.append("```")
    md.append("")

    md.append("---")
    md.append("")
    md.append("*Generated by `generate-speclock-index-md.py` — Do not edit manually*")

    index_md.write_text("\n".join(md).rstrip() + "\n", encoding="utf-8")


def main() -> int:
    print("")
    print("═══════════════════════════════════════════════════════════════")
    print("  TerraFusion SpecLock Index MD Generator")
    print("═══════════════════════════════════════════════════════════════")
    print("")

    parser = argparse.ArgumentParser(description="Generate docs/spec-lock/INDEX.md from INDEX.json")
    parser.add_argument("--index", default=str(INDEX_JSON_DEFAULT), help="Path to INDEX.json")
    parser.add_argument("--out", default=str(INDEX_MD_DEFAULT), help="Path to output INDEX.md")
    args = parser.parse_args()

    index_json = Path(args.index)
    index_md = Path(args.out)

    print(f"ℹ️  Source: {index_json}")
    print(f"ℹ️  Output: {index_md}")
    print("")

    if not index_json.exists():
        print(f"❌ ERROR: missing {index_json}")
        return 2

    generate(index_json, index_md)

    # Count locks for summary
    doc = _load_json(index_json)
    locks = doc.get("locks", [])
    active = len([l for l in locks if l.get("status") == "active"])
    draft = len([l for l in locks if l.get("status") == "draft"])
    deprecated = len([l for l in locks if l.get("status") == "deprecated"])

    print(f"✅ INDEX.md generated successfully")
    print(f"   Total locks: {len(locks)}")
    print(f"   Active: {active}")
    print(f"   Draft: {draft}")
    print(f"   Deprecated: {deprecated}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
