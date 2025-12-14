#!/usr/bin/env python3
"""
TerraFusion Runtime Orchestrator (tf-runtime)

Internal tooling for TerraFusion runtime lifecycle:
  - apply: Deploy configuration/artifacts with constitutional validation
  - verify: Check current runtime against runtimecontract.v1
  - rollback: Revert to previous known-good state
  - status: Show current runtime state

Usage:
  tf-runtime.py apply --env dev --county benton
  tf-runtime.py verify --target http://localhost:5000
  tf-runtime.py rollback --env dev --to-version v1.2.3
  tf-runtime.py status --env dev

This is the internal orchestration layer - NOT for end-user deployment.
Use CI pipelines for production deployments.
"""
import argparse
import json
import os
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

# ═══════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════════════════════════════════════

ENVS = {
    "dev": {
        "target": "http://localhost:5000",
        "namespace": "terrafusion-dev",
        "helm_values": "iac/helm/terrafusion/values.yaml",
    },
    "staging": {
        "target": "https://staging.terrafusion.internal",
        "namespace": "terrafusion-staging",
        "helm_values": "iac/helm/terrafusion/values-staging.yaml",
    },
    "prod": {
        "target": "https://terrafusion.benton.gov",
        "namespace": "terrafusion-prod",
        "helm_values": "iac/helm/terrafusion/values-prod.yaml",
    },
}

STATE_FILE = ".tf-runtime-state.json"

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


def load_state(repo_root: Path) -> Dict[str, Any]:
    """Load orchestrator state."""
    state_path = repo_root / STATE_FILE
    if state_path.exists():
        with open(state_path, 'r') as f:
            return json.load(f)
    return {"deployments": {}, "rollback_history": []}


def save_state(repo_root: Path, state: Dict[str, Any]):
    """Save orchestrator state."""
    state_path = repo_root / STATE_FILE
    with open(state_path, 'w') as f:
        json.dump(state, f, indent=2)


def run_cmd(cmd: List[str], cwd: Optional[Path] = None) -> subprocess.CompletedProcess:
    """Run shell command."""
    print(f"[tf-runtime] $ {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"[tf-runtime] STDERR: {result.stderr}")
    return result


def get_current_version(repo_root: Path) -> str:
    """Get current git version."""
    result = run_cmd(["git", "describe", "--tags", "--always"], cwd=repo_root)
    return result.stdout.strip() if result.returncode == 0 else "unknown"


def get_manifest_sha256(repo_root: Path) -> str:
    """Compute SHA-256 of current manifest state."""
    import hashlib
    h = hashlib.sha256()

    # Hash key configuration files
    files_to_hash = [
        "iac/helm/terrafusion/Chart.yaml",
        "iac/helm/terrafusion/values.yaml",
        "kubernetes/production/deployments.yml",
    ]

    for f in files_to_hash:
        path = repo_root / f
        if path.exists():
            h.update(path.read_bytes())

    return h.hexdigest()


# ═══════════════════════════════════════════════════════════════════════════════
# COMMANDS
# ═══════════════════════════════════════════════════════════════════════════════

def cmd_apply(args):
    """Apply configuration to environment."""
    repo_root = find_repo_root()
    env_config = ENVS.get(args.env)

    if not env_config:
        print(f"[tf-runtime] ERROR: Unknown environment '{args.env}'")
        return 1

    print(f"\n{'═' * 60}")
    print(f" TerraFusion Runtime Apply: {args.env}")
    print(f"{'═' * 60}\n")

    # Pre-flight: run certification against current state (if reachable)
    if not args.skip_verify:
        print("[tf-runtime] Pre-apply verification...")
        cert_result = run_certification(env_config["target"])
        if not cert_result and not args.force:
            print("[tf-runtime] WARNING: Target not reachable for pre-verification")

    # Capture current state for rollback
    state = load_state(repo_root)
    version = get_current_version(repo_root)
    manifest_sha = get_manifest_sha256(repo_root)

    prev_deployment = state["deployments"].get(args.env)
    if prev_deployment:
        state["rollback_history"].append({
            "env": args.env,
            "version": prev_deployment.get("version"),
            "manifest_sha256": prev_deployment.get("manifest_sha256"),
            "timestamp": prev_deployment.get("timestamp"),
            "rolled_back_at": datetime.utcnow().isoformat() + "Z"
        })

    # Apply based on environment
    if args.dry_run:
        print("[tf-runtime] DRY RUN - would apply:")
        print(f"  Environment: {args.env}")
        print(f"  Version: {version}")
        print(f"  Manifest SHA: {manifest_sha[:16]}...")
        print(f"  County: {args.county or 'all'}")
    else:
        # For dev, use dotnet run
        if args.env == "dev":
            print("[tf-runtime] Applying to dev (local)...")
            # Just validate configuration
            values_path = repo_root / env_config["helm_values"]
            if not values_path.exists():
                print(f"[tf-runtime] ERROR: Values file not found: {values_path}")
                return 1
            print(f"[tf-runtime] Values file validated: {values_path}")
        else:
            # For staging/prod, use helm upgrade
            print(f"[tf-runtime] Applying to {args.env} via Helm...")
            helm_cmd = [
                "helm", "upgrade", "--install", "terrafusion",
                str(repo_root / "iac/helm/terrafusion"),
                "-n", env_config["namespace"],
                "-f", str(repo_root / env_config["helm_values"]),
            ]
            if args.county:
                helm_cmd.extend(["--set", f"county={args.county}"])

            result = run_cmd(helm_cmd, cwd=repo_root)
            if result.returncode != 0:
                print("[tf-runtime] ERROR: Helm apply failed")
                return 1

    # Update state
    state["deployments"][args.env] = {
        "version": version,
        "manifest_sha256": manifest_sha,
        "county": args.county,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "applied_by": os.environ.get("USER", "unknown"),
    }
    save_state(repo_root, state)

    # Post-apply verification
    if not args.skip_verify and not args.dry_run:
        print("\n[tf-runtime] Post-apply verification...")
        import time
        time.sleep(5)  # Wait for deployment to stabilize
        if not run_certification(env_config["target"]):
            print("[tf-runtime] WARNING: Post-apply verification failed")
            if not args.force:
                print("[tf-runtime] Consider rollback: tf-runtime.py rollback --env", args.env)
                return 1

    print(f"\n[tf-runtime] ✅ Apply complete: {args.env} @ {version}")
    return 0


def cmd_verify(args):
    """Verify runtime against runtimecontract.v1."""
    repo_root = find_repo_root()

    target = args.target
    if not target:
        env_config = ENVS.get(args.env, {})
        target = env_config.get("target", "http://localhost:5000")

    print(f"\n{'═' * 60}")
    print(" TerraFusion Runtime Verification")
    print(f"{'═' * 60}")
    print(f" Target: {target}\n")

    # Use runtime-cert harness
    cert_script = repo_root / "tools" / "runtime-cert" / "runtime-cert.py"
    if cert_script.exists():
        cmd = [sys.executable, str(cert_script), "--target", target]
        if args.verbose:
            cmd.append("--verbose")
        if args.output:
            cmd.extend(["--output", args.output])

        result = run_cmd(cmd, cwd=repo_root)
        return result.returncode
    else:
        print("[tf-runtime] ERROR: runtime-cert harness not found")
        return 1


def cmd_rollback(args):
    """Rollback to previous version."""
    repo_root = find_repo_root()
    state = load_state(repo_root)

    print(f"\n{'═' * 60}")
    print(f" TerraFusion Runtime Rollback: {args.env}")
    print(f"{'═' * 60}\n")

    # Find rollback target
    history = state.get("rollback_history", [])
    env_history = [h for h in history if h.get("env") == args.env]

    if args.to_version:
        # Rollback to specific version
        target = next((h for h in env_history if h.get("version") == args.to_version), None)
        if not target:
            print(f"[tf-runtime] ERROR: Version {args.to_version} not in rollback history")
            return 1
    elif env_history:
        # Rollback to most recent previous version
        target = env_history[-1]
    else:
        print(f"[tf-runtime] ERROR: No rollback history for {args.env}")
        return 1

    print("[tf-runtime] Rolling back to:")
    print(f"  Version: {target.get('version')}")
    print(f"  Manifest SHA: {target.get('manifest_sha256', 'unknown')[:16]}...")
    print(f"  Originally deployed: {target.get('timestamp')}")

    if args.dry_run:
        print("\n[tf-runtime] DRY RUN - no changes made")
        return 0

    # For actual rollback, use helm rollback
    env_config = ENVS.get(args.env, {})
    if args.env != "dev":
        helm_cmd = ["helm", "rollback", "terrafusion", "-n", env_config.get("namespace", "default")]
        result = run_cmd(helm_cmd, cwd=repo_root)
        if result.returncode != 0:
            print("[tf-runtime] ERROR: Helm rollback failed")
            return 1

    # Update state
    state["deployments"][args.env] = {
        "version": target.get("version"),
        "manifest_sha256": target.get("manifest_sha256"),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "rolled_back_from": state["deployments"].get(args.env, {}).get("version"),
    }
    save_state(repo_root, state)

    print(f"\n[tf-runtime] ✅ Rollback complete: {args.env} → {target.get('version')}")
    return 0


def cmd_status(args):
    """Show current runtime status."""
    repo_root = find_repo_root()
    state = load_state(repo_root)

    print(f"\n{'═' * 60}")
    print(" TerraFusion Runtime Status")
    print(f"{'═' * 60}\n")

    deployments = state.get("deployments", {})

    if not deployments:
        print("  No deployments recorded.")
    else:
        for env, info in deployments.items():
            marker = "→" if env == args.env else " "
            print(f" {marker} {env}:")
            print(f"     Version: {info.get('version', 'unknown')}")
            print(f"     SHA: {info.get('manifest_sha256', 'unknown')[:16]}...")
            print(f"     Deployed: {info.get('timestamp', 'unknown')}")
            print(f"     County: {info.get('county', 'all')}")
            print()

    # Show rollback history
    history = state.get("rollback_history", [])
    if history and args.verbose:
        print(f"{'─' * 60}")
        print(" Rollback History (last 5):")
        for h in history[-5:]:
            print(f"   {h.get('env')}: {h.get('version')} @ {h.get('rolled_back_at')}")

    return 0


def run_certification(target: str) -> bool:
    """Run certification (helper)."""
    repo_root = find_repo_root()
    cert_script = repo_root / "tools" / "runtime-cert" / "runtime-cert.py"
    if cert_script.exists():
        result = run_cmd([sys.executable, str(cert_script), "--target", target, "--quiet"], cwd=repo_root)
        return result.returncode == 0
    return False


# ═══════════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="TerraFusion Runtime Orchestrator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", help="Commands")

    # apply
    apply_parser = subparsers.add_parser("apply", help="Apply configuration to environment")
    apply_parser.add_argument("--env", "-e", default="dev", choices=ENVS.keys(),
                              help="Target environment")
    apply_parser.add_argument("--county", "-c", default=None,
                              help="County filter (e.g., benton)")
    apply_parser.add_argument("--skip-verify", action="store_true",
                              help="Skip pre/post verification")
    apply_parser.add_argument("--force", "-f", action="store_true",
                              help="Apply even if verification fails")
    apply_parser.add_argument("--dry-run", action="store_true",
                              help="Show what would be applied")

    # verify
    verify_parser = subparsers.add_parser("verify", help="Verify runtime against spec")
    verify_parser.add_argument("--target", "-t", default=None,
                               help="Target URL (overrides env default)")
    verify_parser.add_argument("--env", "-e", default="dev", choices=ENVS.keys(),
                               help="Environment to verify")
    verify_parser.add_argument("--output", "-o", default=None,
                               help="Export JSON report")
    verify_parser.add_argument("--verbose", "-v", action="store_true")

    # rollback
    rollback_parser = subparsers.add_parser("rollback", help="Rollback to previous version")
    rollback_parser.add_argument("--env", "-e", default="dev", choices=ENVS.keys(),
                                 help="Target environment")
    rollback_parser.add_argument("--to-version", default=None,
                                 help="Specific version to rollback to")
    rollback_parser.add_argument("--dry-run", action="store_true",
                                 help="Show what would be rolled back")

    # status
    status_parser = subparsers.add_parser("status", help="Show runtime status")
    status_parser.add_argument("--env", "-e", default="dev", choices=ENVS.keys())
    status_parser.add_argument("--verbose", "-v", action="store_true")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return 1

    commands = {
        "apply": cmd_apply,
        "verify": cmd_verify,
        "rollback": cmd_rollback,
        "status": cmd_status,
    }

    return commands[args.command](args)


if __name__ == "__main__":
    sys.exit(main())
