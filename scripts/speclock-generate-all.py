#!/usr/bin/env python3
"""
SpecLock Generator Runner (Machine Mode)

Reads:
  - docs/spec-lock/INDEX.json
  - docs/spec-lock/GENERATORS.json

For each lock with generated_artifacts:
  - Select generator by lock.surface
  - Run generator once per generated_artifact
  - Fail closed on any error

Usage:
  python scripts/speclock-generate-all.py [--dry-run] [--lock LOCK_ID]
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

INDEX = Path("docs/spec-lock/INDEX.json")
GENS = Path("docs/spec-lock/GENERATORS.json")


def _load(p: Path) -> Dict[str, Any]:
    return json.loads(p.read_text(encoding="utf-8"))


def _run(cmd: List[str], dry_run: bool = False) -> bool:
    """Run command, return True on success."""
    cmd_str = " ".join(cmd)
    if dry_run:
        print(f"  [DRY-RUN] {cmd_str}")
        return True

    print(f"  Running: {cmd_str}")
    result = subprocess.run(cmd, text=True)
    return result.returncode == 0


def generate_for_lock(
    lock: Dict[str, Any],
    generators: Dict[str, Any],
    dry_run: bool = False
) -> int:
    """Generate all artifacts for a single lock. Returns count of generated artifacts."""
    lock_id = lock.get("id", "")
    surface = lock.get("surface", "")
    outs = lock.get("generated_artifacts", [])

    if not outs:
        return 0

    gen = generators.get(surface)
    if not gen:
        print(f"❌ No generator registered for surface: {surface} (lock: {lock_id})")
        raise SystemExit(1)

    script = gen["script"]
    args_tmpl = gen["args"]

    generated = 0
    for out in outs:
        if not isinstance(out, str) or not out.strip():
            continue

        # Derive name from output path (last segment, no extension)
        name = Path(out).stem

        # Format args with placeholders
        args = []
        for a in args_tmpl:
            args.append(
                a.replace("{id}", lock_id)
                 .replace("{out}", out)
                 .replace("{name}", name)
            )

        # Determine python command
        python_cmd = "python3" if sys.platform != "win32" else "python"
        cmd = [python_cmd, script] + args

        print(f"▶ Generating: {out}")
        print(f"  Lock: {lock_id} | Surface: {surface}")

        if not _run(cmd, dry_run):
            print(f"❌ Generator failed for: {out}")
            raise SystemExit(1)

        if not dry_run:
            out_path = Path(out)
            if not out_path.exists():
                print(f"❌ Expected output missing after generation: {out}")
                raise SystemExit(1)
            print(f"  ✅ Output verified: {out}")

        generated += 1
        print("")

    return generated


def main() -> int:
    print("")
    print("═══════════════════════════════════════════════════════════════")
    print("  TerraFusion SpecLock Generator Runner")
    print("═══════════════════════════════════════════════════════════════")
    print("")

    parser = argparse.ArgumentParser(description="Run SpecLock generators for all locks with generated_artifacts")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be generated without running")
    parser.add_argument("--lock", type=str, help="Only generate for a specific lock ID")
    parser.add_argument("--index", type=str, default=str(INDEX), help="Path to INDEX.json")
    parser.add_argument("--generators", type=str, default=str(GENS), help="Path to GENERATORS.json")
    args = parser.parse_args()

    index_path = Path(args.index)
    gens_path = Path(args.generators)

    if not index_path.exists():
        print(f"❌ Missing: {index_path}")
        return 1

    if not gens_path.exists():
        print(f"❌ Missing: {gens_path}")
        return 1

    print(f"ℹ️  Index: {index_path}")
    print(f"ℹ️  Generators: {gens_path}")
    if args.dry_run:
        print("ℹ️  Mode: DRY-RUN (no actual generation)")
    if args.lock:
        print(f"ℹ️  Filter: {args.lock}")
    print("")

    idx = _load(index_path)
    gens_doc = _load(gens_path)
    generators = gens_doc.get("generators", {})

    locks = idx.get("locks", [])
    if not isinstance(locks, list):
        print("❌ INDEX.json invalid: locks must be an array")
        return 1

    # Filter locks with generated_artifacts
    generatable = [
        l for l in locks
        if isinstance(l, dict) and l.get("generated_artifacts")
    ]

    # Optional: filter to specific lock
    if args.lock:
        generatable = [l for l in generatable if l.get("id") == args.lock]
        if not generatable:
            print(f"⚠️  No generatable lock found with ID: {args.lock}")
            return 0

    if not generatable:
        print("ℹ️  No locks with generated_artifacts found. Nothing to generate.")
        return 0

    print(f"Found {len(generatable)} lock(s) with generated_artifacts")
    print("")
    print("─────────────────────────────────────────────────────────────────")
    print("")

    total_generated = 0
    for lock in generatable:
        count = generate_for_lock(lock, generators, args.dry_run)
        total_generated += count

    print("─────────────────────────────────────────────────────────────────")
    print("")

    if args.dry_run:
        print(f"✅ DRY-RUN complete. Would generate {total_generated} artifact(s).")
    else:
        print(f"✅ Generated {total_generated} artifact(s) successfully.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
