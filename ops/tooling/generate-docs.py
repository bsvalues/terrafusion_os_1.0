#!/usr/bin/env python3
"""Generate tooling documentation from registry.yml"""

import yaml
from pathlib import Path
from datetime import datetime

SCRIPT_DIR = Path(__file__).parent
REGISTRY = SCRIPT_DIR / "registry.yml"
README = SCRIPT_DIR / "README.md"

def main():
    with open(REGISTRY) as f:
        data = yaml.safe_load(f)
    
    lines = [
        "# TerraFusion Tool Hub",
        "",
        "> Auto-generated from `registry.yml` — do not edit manually.",
        f"> Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
        "",
        "## Quick Start",
        "",
        "```bash",
        "# Interactive menu (start here)",
        "tf hub",
        "",
        "# Search tools",
        "tf hub find <term>",
        "",
        "# Run by ID",
        "tf hub run <id>",
        "",
        "# List all as JSON",
        "tf hub list",
        "```",
        "",
        "## Available Tools",
        "",
    ]
    
    total_safe = 0
    total_risk = 0
    
    for group in data.get("groups", []):
        lines.append(f"### {group.get('title', group['id'])}")
        lines.append("")
        lines.append("| ID | Command | Description | Safe | Frequency |")
        lines.append("|:---|:--------|:------------|:----:|:----------|")
        
        for item in group.get("items", []):
            safe = "✓" if item.get("safe", True) else "⚠"
            if item.get("safe", True):
                total_safe += 1
            else:
                total_risk += 1
            
            freq = item.get("frequency", "—")
            lines.append(
                f"| `{item['id']}` | `{item['title']}` | "
                f"{item.get('desc', '')} | {safe} | {freq} |"
            )
        
        lines.append("")
    
    lines.extend([
        "## Summary",
        "",
        f"- **Total tools**: {total_safe + total_risk}",
        f"- **Safe (non-destructive)**: {total_safe}",
        f"- **Risky (destructive)**: {total_risk}",
        "",
        "## Adding New Tools",
        "",
        "1. Edit `ops/tooling/registry.yml`",
        "2. Run `python ops/tooling/generate-docs.py`",
        "3. Test with `tf hub find <your-id>`",
        "",
        "## Daily Cadence",
        "",
        "### Session Start",
        "```bash",
        "tf gate           # Fast invariant check",
        "tf status         # What's running",
        "tf ai status      # AI Lab status (optional)",
        "```",
        "",
        "### Before PR",
        "```bash",
        "tf doctor         # Full health check",
        "tf ai ingest      # Update RAG if docs changed",
        "```",
        "",
        "### Weekly Maintenance",
        "```bash",
        "tf clean          # Safe cleanup",
        "tf certify        # Capture certified state",
        "```",
        "",
    ])
    
    with open(README, "w") as f:
        f.write("\n".join(lines))
    
    print(f"✓ Generated {README}")
    print(f"  {total_safe + total_risk} tools ({total_safe} safe, {total_risk} risky)")

if __name__ == "__main__":
    main()
