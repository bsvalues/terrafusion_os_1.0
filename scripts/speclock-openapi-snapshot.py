#!/usr/bin/env python3
"""
SpecLock → OpenAPI Snapshot Generator

Writes a deterministic OpenAPI snapshot file for a given lock id.

Default input:
  artifacts/apis/openapi.json

Optional input (preferred):
  lock.spec_data_path JSON may provide:
    {
      "openapi_source": "artifacts/apis/openapi.json",
      "command": ["bash", "-lc", "curl -s http://localhost:5000/swagger/v1/swagger.json > artifacts/apis/openapi.json"]
    }

Usage:
  python scripts/speclock-openapi-snapshot.py --lock tf.api.my_api --out artifacts/apis/tf.api.my_api.openapi.snapshot.json
"""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional

INDEX_JSON = Path("docs/spec-lock/INDEX.json")
DEFAULT_OPENAPI = Path("artifacts/apis/openapi.json")


def _load_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _run(cmd: List[str]) -> None:
    print(f"  Running: {' '.join(cmd)}")
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{p.stderr.strip()}")


def _find_lock(lock_id: str) -> Dict[str, Any]:
    idx = _load_json(INDEX_JSON)
    locks = idx.get("locks", [])
    if not isinstance(locks, list):
        raise RuntimeError("INDEX.json invalid: locks must be an array.")
    for lock in locks:
        if isinstance(lock, dict) and str(lock.get("id", "")).strip() == lock_id:
            return lock
    raise RuntimeError(f"Lock not found: {lock_id}")


def main() -> int:
    print("")
    print("═══════════════════════════════════════════════════════════════")
    print("  TerraFusion SpecLock → OpenAPI Snapshot Generator")
    print("═══════════════════════════════════════════════════════════════")
    print("")

    p = argparse.ArgumentParser(description="Generate OpenAPI snapshot for a SpecLock")
    p.add_argument("--lock", required=True, help="SpecLock id (e.g., tf.api.foo)")
    p.add_argument("--out", required=True, help="Output snapshot path")
    args = p.parse_args()

    if not INDEX_JSON.exists():
        print(f"❌ Missing {INDEX_JSON}.")
        return 1

    try:
        lock = _find_lock(args.lock)
    except RuntimeError as e:
        print(f"❌ {e}")
        return 1

    print(f"Lock: {args.lock}")
    print(f"Output: {args.out}")
    print("")

    spec_data_path = str(lock.get("spec_data_path", "") or "").strip()

    openapi_source = DEFAULT_OPENAPI
    cmd: Optional[List[str]] = None

    if spec_data_path:
        sdp = Path(spec_data_path)
        if sdp.exists():
            print(f"ℹ️  Using spec_data_path: {spec_data_path}")
            data = _load_json(sdp)
            if isinstance(data.get("openapi_source"), str) and data["openapi_source"].strip():
                openapi_source = Path(data["openapi_source"])
            if isinstance(data.get("command"), list) and all(isinstance(x, str) for x in data["command"]):
                cmd = list(data["command"])
        else:
            print(f"⚠️  spec_data_path not found: {spec_data_path}")

    # If source missing, try command; else fail closed
    if not openapi_source.exists():
        if cmd is None:
            print(f"❌ OpenAPI source missing: {openapi_source}")
            print("   Provide spec_data_path with a command or generate artifacts/apis/openapi.json.")
            return 1
        try:
            _run(cmd)
        except RuntimeError as e:
            print(f"❌ {e}")
            return 1

    if not openapi_source.exists():
        print(f"❌ OpenAPI source still missing after command: {openapi_source}")
        return 1

    print(f"ℹ️  Reading OpenAPI from: {openapi_source}")

    # Parse + re-emit with sorted keys for determinism
    try:
        doc = _load_json(openapi_source)
    except Exception as e:
        print(f"❌ Failed to parse OpenAPI JSON: {e}")
        return 1

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print("")
    print(f"✅ Wrote OpenAPI snapshot: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
