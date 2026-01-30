#!/usr/bin/env python3
"""
SpecLock Diff Detector

Goal: auto-detect which spec-locks are touched by a PR/commit range.

Rules:
  - A lock is "touched" if a changed file matches any of:
      * spec_path
      * generated_artifacts
      * artifact_paths (prefix match)
  - Deterministic output: sorted by lock id.

Usage:
  python scripts/speclock-diff.py --base origin/main --head HEAD
  python scripts/speclock-diff.py --base HEAD~1 --head HEAD --json
"""

from __future__ import annotations

import argparse
import json
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Set, Tuple


INDEX_JSON = Path("docs/spec-lock/INDEX.json")


@dataclass(frozen=True)
class Match:
    lock_id: str
    file: str
    reason: str


def _run(cmd: List[str]) -> str:
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{p.stderr.strip()}")
    return p.stdout


def _git_changed_files(base: str, head: str) -> List[str]:
    out = _run(["git", "diff", "--name-only", f"{base}..{head}"])
    files = [ln.strip() for ln in out.splitlines() if ln.strip()]
    # Normalize slashes for cross-platform determinism
    return [f.replace("\\", "/") for f in files]


def _load_index() -> Dict[str, Any]:
    if not INDEX_JSON.exists():
        raise RuntimeError(f"Missing {INDEX_JSON}. Run /tf-speclock first.")
    return json.loads(INDEX_JSON.read_text(encoding="utf-8"))


def _prefix_match(changed: str, prefix: str) -> bool:
    # Normalize to forward slashes and ensure directory-prefix semantics.
    c = changed.rstrip("/")
    p = prefix.replace("\\", "/").rstrip("/")
    if not p:
        return False
    if c == p:
        return True
    # If prefix is a directory, ensure path starts with prefix + "/"
    return c.startswith(p + "/")


def _glob_match(changed: str, pattern: str) -> bool:
    """Simple glob matching for ** and * patterns."""
    import fnmatch
    # Normalize pattern
    p = pattern.replace("\\", "/")
    c = changed.replace("\\", "/")
    # Handle ** as recursive match
    if "**" in p:
        # Convert ** to match any path segment
        p = p.replace("**", "*")
        # For simplicity, check if the pattern prefix matches
        parts = p.split("*")
        if parts[0] and not c.startswith(parts[0]):
            return False
        return fnmatch.fnmatch(c, p.replace("*", "*"))
    return fnmatch.fnmatch(c, p)


def detect(base: str, head: str) -> Tuple[List[str], List[Match]]:
    changed = _git_changed_files(base, head)
    idx = _load_index()
    locks = idx.get("locks", [])
    if not isinstance(locks, list):
        locks = []

    matches: List[Match] = []
    touched_ids: Set[str] = set()

    for lock in locks:
        if not isinstance(lock, dict):
            continue
        lid = str(lock.get("id", "")).strip()
        if not lid:
            continue

        spec_path = str(lock.get("spec_path", "")).replace("\\", "/").strip()
        gen = lock.get("generated_artifacts", []) or []
        arts = lock.get("artifact_paths", []) or []

        # Normalize lists
        gen_list = [str(x).replace("\\", "/") for x in gen if isinstance(x, str)]
        art_list = [str(x).replace("\\", "/") for x in arts if isinstance(x, str)]

        for f in changed:
            if spec_path and f == spec_path:
                matches.append(Match(lid, f, "spec_path"))
                touched_ids.add(lid)
                continue
            if f in gen_list:
                matches.append(Match(lid, f, "generated_artifacts"))
                touched_ids.add(lid)
                continue
            for ap in art_list:
                # Support glob patterns in artifact_paths
                if "**" in ap or "*" in ap:
                    if _glob_match(f, ap):
                        matches.append(Match(lid, f, f"artifact_paths:{ap}"))
                        touched_ids.add(lid)
                        break
                elif _prefix_match(f, ap):
                    matches.append(Match(lid, f, f"artifact_paths:{ap}"))
                    touched_ids.add(lid)
                    break

    touched = sorted(touched_ids)
    # Deterministic match ordering
    matches.sort(key=lambda m: (m.lock_id, m.file, m.reason))
    return changed, matches


def main() -> int:
    print("")
    print("═══════════════════════════════════════════════════════════════")
    print("  TerraFusion SpecLock Diff Detector")
    print("═══════════════════════════════════════════════════════════════")
    print("")

    p = argparse.ArgumentParser(description="Detect SpecLocks touched by a git diff range")
    p.add_argument("--base", required=True, help="Git base ref (e.g., origin/main)")
    p.add_argument("--head", required=True, help="Git head ref (e.g., HEAD)")
    p.add_argument("--json", action="store_true", help="Emit JSON output")
    args = p.parse_args()

    try:
        changed, matches = detect(args.base, args.head)
    except RuntimeError as e:
        print(f"❌ ERROR: {e}")
        return 1

    touched_ids = sorted({m.lock_id for m in matches})

    if args.json:
        doc = {
            "base": args.base,
            "head": args.head,
            "changed_files": changed,
            "touched_spec_locks": touched_ids,
            "matches": [{"lock_id": m.lock_id, "file": m.file, "reason": m.reason} for m in matches],
        }
        print(json.dumps(doc, indent=2))
        return 0

    print(f"Range: {args.base}..{args.head}")
    print(f"Changed files: {len(changed)}")
    print(f"Touched locks: {len(touched_ids)}")
    print("")

    if touched_ids:
        print("Touched SpecLocks:")
        for lid in touched_ids:
            print(f"  📋 {lid}")
        print("")

    if matches:
        print("Match Details:")
        for m in matches:
            print(f"  {m.lock_id}  ←  {m.file}")
            print(f"      reason: {m.reason}")
        print("")

    if not touched_ids:
        print("✅ No SpecLocks touched by this change.")
    else:
        print(f"ℹ️  {len(touched_ids)} SpecLock(s) touched. Ensure spec + tests are updated if contracts changed.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
