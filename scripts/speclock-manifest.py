#!/usr/bin/env python3
"""
SpecLock Manifest Builder (GOD-TIER)

Builds an immutable manifest of:
  - INDEX.json hash
  - each lock spec_path hash
  - each generated artifact hash
  - each spec_data_path hash (if present)
  - Time-locked validity window (nbf/exp)

Output:
  artifacts/speclock/manifest.json

Deterministic:
  - sorted keys, stable ordering, sha256 of file bytes

Usage:
  python scripts/speclock-manifest.py [--out PATH] [--nbf ISO] [--exp ISO]

Environment:
  TF_SPECLOCK_NBF - Not-before timestamp (ISO 8601)
  TF_SPECLOCK_EXP - Expiration timestamp (ISO 8601)
  TF_SPECLOCK_EXP_DAYS - Days until expiration (default: 30)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List

INDEX = Path("docs/spec-lock/INDEX.json")
OUT_DEFAULT = Path("artifacts/speclock/manifest.json")


def _sha256_file(path: Path) -> str:
    """Compute SHA256 hash of file contents."""
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _load_json(p: Path) -> Dict[str, Any]:
    return json.loads(p.read_text(encoding="utf-8"))


def main() -> int:
    print("")
    print("═══════════════════════════════════════════════════════════════")
    print("  TerraFusion SpecLock Manifest Builder")
    print("═══════════════════════════════════════════════════════════════")
    print("")

    ap = argparse.ArgumentParser(description="Build SpecLock manifest (sha256 hashes)")
    ap.add_argument("--out", default=str(OUT_DEFAULT), help="Output manifest path")
    ap.add_argument("--nbf", default=None, help="Not-before timestamp (ISO 8601)")
    ap.add_argument("--exp", default=None, help="Expiration timestamp (ISO 8601)")
    args = ap.parse_args()

    if not INDEX.exists():
        print(f"❌ Missing {INDEX}")
        return 1

    idx = _load_json(INDEX)
    locks = idx.get("locks", [])
    if not isinstance(locks, list):
        print("❌ INDEX.json invalid: locks must be array")
        return 1

    root = Path(".").resolve()

    print(f"ℹ️  Index: {INDEX}")
    print(f"ℹ️  Output: {args.out}")
    print("")

    entries: List[Dict[str, Any]] = []
    for lock in locks:
        if not isinstance(lock, dict):
            continue
        lid = str(lock.get("id", "")).strip()
        if not lid:
            continue

        spec_path = Path(str(lock.get("spec_path", "")))
        spec_data_path = str(lock.get("spec_data_path", "") or "").strip()
        gen = lock.get("generated_artifacts", []) or []
        if not isinstance(gen, list):
            gen = []

        e: Dict[str, Any] = {
            "id": lid,
            "surface": str(lock.get("surface", "")),
            "project": str(lock.get("project", "")),
            "spec_version": str(lock.get("spec_version", "")),
            "spec_path": str(spec_path),
            "spec_sha256": None,
            "spec_data_path": spec_data_path if spec_data_path else "",
            "spec_data_sha256": None,
            "generated_artifacts": []
        }

        sp = root / spec_path
        if sp.exists() and sp.is_file():
            e["spec_sha256"] = _sha256_file(sp)

        if spec_data_path:
            dp = root / Path(spec_data_path)
            if dp.exists() and dp.is_file():
                e["spec_data_sha256"] = _sha256_file(dp)

        for outp in sorted([str(x) for x in gen if isinstance(x, str) and str(x).strip()]):
            fp = root / Path(outp)
            e["generated_artifacts"].append({
                "path": outp,
                "sha256": _sha256_file(fp) if fp.exists() and fp.is_file() else None
            })

        entries.append(e)

    entries.sort(key=lambda x: x["id"])

    # GOD-TIER: Time-locked validity window
    now = datetime.now(timezone.utc)
    exp_days = int(os.getenv("TF_SPECLOCK_EXP_DAYS", "30"))

    nbf = os.getenv("TF_SPECLOCK_NBF") or args.nbf or now.isoformat().replace("+00:00", "Z")
    exp = os.getenv("TF_SPECLOCK_EXP") or args.exp or (now + timedelta(days=exp_days)).isoformat().replace("+00:00", "Z")

    manifest: Dict[str, Any] = {
        "version": "2.0",
        "generated_at": now.isoformat().replace("+00:00", "Z"),
        "nbf": nbf,
        "exp": exp,
        "index_path": str(INDEX),
        "index_sha256": _sha256_file(INDEX),
        "lock_count": len(entries),
        "locks": entries
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print(f"✅ Wrote manifest: {out}")
    print(f"   Locks: {len(entries)}")
    print(f"   NBF:   {nbf}")
    print(f"   EXP:   {exp}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
