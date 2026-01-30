#!/usr/bin/env python3
"""
SpecLock → Alert Rule Compiler (PrometheusRule)

Input:
  - lock.spec_data_path JSON containing:
      { "alerts": { "group": "tf_core", "rules": [ ... ] } }

Output:
  - PrometheusRule YAML (no external deps)

Usage:
  python scripts/speclock-alert-compile.py --lock tf.alerts.core_slo --out ops/alerts/tf-core.rules.yaml --name tf-core
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


def _yaml_escape(s: str) -> str:
    """Conservative YAML escaping: quote strings with special chars."""
    if any(c in s for c in [":", "{", "}", "[", "]", "#", "\n", "\"", "'", "|", ">", "&", "*", "!", "%", "@", "`"]):
        # Use JSON encoding for safe escaping
        return json.dumps(s)
    # Also quote if starts with special chars
    if s and s[0] in ["-", "?", ":", ",", "[", "]", "{", "}", "#", "&", "*", "!", "|", ">", "'", "\"", "%", "@", "`"]:
        return json.dumps(s)
    return s


def _emit_map(d: Dict[str, Any], indent: int) -> List[str]:
    """Emit a YAML map with sorted keys."""
    lines: List[str] = []
    pad = " " * indent
    for k in sorted(d.keys()):
        v = d[k]
        if isinstance(v, dict):
            lines.append(f"{pad}{k}:")
            lines.extend(_emit_map(v, indent + 2))
        elif isinstance(v, list):
            lines.append(f"{pad}{k}:")
            for item in v:
                if isinstance(item, dict):
                    lines.append(f"{pad}  -")
                    for sk in sorted(item.keys()):
                        sv = item[sk]
                        lines.append(f"{pad}    {sk}: {_yaml_escape(str(sv))}")
                else:
                    lines.append(f"{pad}  - {_yaml_escape(str(item))}")
        else:
            lines.append(f"{pad}{k}: {_yaml_escape(str(v))}")
    return lines


def compile_prometheus_rule(name: str, namespace: str, group: str, rules: List[Dict[str, Any]]) -> str:
    """Compile a PrometheusRule YAML from structured data."""
    lines: List[str] = []
    lines.append("apiVersion: monitoring.coreos.com/v1")
    lines.append("kind: PrometheusRule")
    lines.append("metadata:")
    lines.append(f"  name: {name}")
    if namespace:
        lines.append(f"  namespace: {namespace}")
    lines.append("  labels:")
    lines.append("    app: terrafusion")
    lines.append("    prometheus: tf-prometheus")
    lines.append("    role: alert-rules")
    lines.append("spec:")
    lines.append("  groups:")
    lines.append(f"    - name: {group}")
    lines.append("      rules:")

    for r in rules:
        alert = str(r.get("alert", "")).strip()
        expr = str(r.get("expr", "")).strip()
        dur = str(r.get("for", "")).strip()
        labels = r.get("labels", {}) if isinstance(r.get("labels"), dict) else {}
        ann = r.get("annotations", {}) if isinstance(r.get("annotations"), dict) else {}

        if not alert or not expr:
            continue

        lines.append(f"        - alert: {alert}")
        lines.append(f"          expr: {_yaml_escape(expr)}")
        if dur:
            lines.append(f"          for: {dur}")
        if labels:
            lines.append("          labels:")
            lines.extend(_emit_map(labels, 12))
        if ann:
            lines.append("          annotations:")
            lines.extend(_emit_map(ann, 12))

    return "\n".join(lines) + "\n"


def main() -> int:
    print("")
    print("═══════════════════════════════════════════════════════════════")
    print("  TerraFusion SpecLock → Alert Rule Compiler")
    print("═══════════════════════════════════════════════════════════════")
    print("")

    p = argparse.ArgumentParser(description="Compile PrometheusRule YAML from SpecLock structured alert data")
    p.add_argument("--lock", required=True, help="SpecLock id")
    p.add_argument("--out", required=True, help="Output YAML path")
    p.add_argument("--name", required=True, help="metadata.name for PrometheusRule")
    p.add_argument("--namespace", default="", help="metadata.namespace (optional)")
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
    print(f"Name: {args.name}")
    if args.namespace:
        print(f"Namespace: {args.namespace}")
    print("")

    sdp = str(lock.get("spec_data_path", "") or "").strip()
    if not sdp:
        print("❌ spec_data_path required for alert compiler (structured input).")
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

    alerts = data.get("alerts")
    if not isinstance(alerts, dict):
        print("❌ spec_data_path must include { alerts: {...} }")
        return 1

    group = str(alerts.get("group", "")).strip()
    rules = alerts.get("rules", [])
    if not group or not isinstance(rules, list):
        print("❌ alerts must include group (string) and rules (array)")
        return 1

    valid_rules = [r for r in rules if isinstance(r, dict)]
    out_text = compile_prometheus_rule(args.name, args.namespace, group, valid_rules)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(out_text, encoding="utf-8")

    print(f"  Rules: {len(valid_rules)}")
    print("")
    print(f"✅ Wrote PrometheusRule: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
