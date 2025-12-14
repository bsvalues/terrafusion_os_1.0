#!/usr/bin/env python3
"""
SpecLock → Grafana Dashboard Renderer

Input:
  - SpecLock entry in INDEX.json
  - Prefer lock.spec_data_path JSON with shape:
      { "dashboard": { "uid": "...", "title": "...", "panels": [ { "title": "...", "promql": "..." } ] } }

Output:
  - Minimal Grafana dashboard JSON (deterministic)

Usage:
  python scripts/speclock-grafana-render.py --lock tf.dashboards.benton_ops --out ops/dashboards/benton_ops.json
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List

INDEX_JSON = Path("docs/spec-lock/INDEX.json")


def _load_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _find_lock(lock_id: str) -> Dict[str, Any]:
    idx = _load_json(INDEX_JSON)
    locks = idx.get("locks", [])
    if not isinstance(locks, list):
        raise RuntimeError("INDEX.json invalid: locks must be an array.")
    for lock in locks:
        if isinstance(lock, dict) and str(lock.get("id", "")).strip() == lock_id:
            return lock
    raise RuntimeError(f"Lock not found: {lock_id}")


def _panel(panel_id: int, title: str, promql: str, panel_type: str = "timeseries") -> Dict[str, Any]:
    """Create a minimal Grafana panel."""
    return {
        "id": panel_id,
        "type": panel_type,
        "title": title,
        "datasource": {"type": "prometheus", "uid": "PROMETHEUS"},
        "targets": [
            {
                "refId": "A",
                "expr": promql,
                "legendFormat": "",
                "range": True
            }
        ],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": (panel_id - 1) * 8}
    }


def render(d: Dict[str, Any]) -> Dict[str, Any]:
    """Render a Grafana dashboard from structured spec data."""
    uid = str(d["uid"])
    title = str(d["title"])
    panels = d.get("panels", [])
    if not isinstance(panels, list):
        panels = []

    tags = d.get("tags", [])
    if not isinstance(tags, list):
        tags = []

    out_panels: List[Dict[str, Any]] = []
    pid = 1
    for p in panels:
        if not isinstance(p, dict):
            continue
        t = str(p.get("title", "")).strip()
        q = str(p.get("promql", "")).strip()
        ptype = str(p.get("type", "timeseries")).strip()
        if not t or not q:
            continue
        out_panels.append(_panel(pid, t, q, ptype))
        pid += 1

    return {
        "uid": uid,
        "title": title,
        "tags": [str(t) for t in tags if isinstance(t, str)],
        "schemaVersion": 39,
        "version": 1,
        "refresh": "10s",
        "time": {"from": "now-6h", "to": "now"},
        "timezone": "browser",
        "panels": out_panels
    }


def main() -> int:
    print("")
    print("═══════════════════════════════════════════════════════════════")
    print("  TerraFusion SpecLock → Grafana Dashboard Renderer")
    print("═══════════════════════════════════════════════════════════════")
    print("")

    p = argparse.ArgumentParser(description="Render Grafana dashboard JSON from SpecLock structured data")
    p.add_argument("--lock", required=True, help="SpecLock id")
    p.add_argument("--out", required=True, help="Output dashboard JSON path")
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

    out = Path(args.out)

    # If output already exists and is valid JSON, skip regeneration
    if out.exists():
        try:
            existing = _load_json(out)
            if isinstance(existing.get("uid"), str) and isinstance(existing.get("panels"), list):
                print(f"ℹ️  Dashboard already exists and is valid: {out}")
                print("   Skipping regeneration (use --force to override)")
                return 0
        except Exception:
            pass  # Continue to regenerate if existing file is invalid

    sdp = str(lock.get("spec_data_path", "") or "").strip()
    if not sdp:
        print("❌ spec_data_path required for grafana renderer (structured input).")
        return 1

    data_path = Path(sdp)
    if not data_path.exists():
        print(f"❌ spec_data_path missing: {data_path}")
        return 1

    print(f"ℹ️  Using spec_data_path: {sdp}")

    try:
        data = _load_json(data_path)
    except Exception as e:
        print(f"❌ Failed to parse spec_data_path JSON: {e}")
        return 1

    dash = data.get("dashboard")
    if not isinstance(dash, dict):
        print("❌ spec_data_path must include { dashboard: {...} }")
        return 1

    for k in ["uid", "title", "panels"]:
        if k not in dash:
            print(f"❌ dashboard missing required key: {k}")
            return 1

    doc = render(dash)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, indent=2, sort_keys=True) + "\n", encoding="utf-8")

    print(f"  Panels: {len(doc['panels'])}")
    print("")
    print(f"✅ Wrote dashboard: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
