#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════
TERRAFUSION OS - WORKSPACE SIZE MONITORING SCRIPT
Monitors workspace health and performance metrics
Championship-level workspace management and optimization
THE TERRAFUSION WAY - GOVERNMENT. TRANSCENDED.
═══════════════════════════════════════════════════════════════
"""

import os
import json
import argparse
import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import subprocess


class WorkspaceMonitor:
    """Championship-level workspace monitoring and optimization"""

    def __init__(self, workspace_root: str):
        self.workspace_root = Path(workspace_root)
        self.workspace_dir = self.workspace_root / "workspaces"
        self.thresholds = {
            'workspace_file_size_kb': 50,      # Max workspace file size
            'total_folders': 20,                # Max folders per workspace
            'duplicate_paths': 5,               # Max duplicate path references
            'total_workspaces': 150,            # Max total workspace files
            'empty_workspaces': 10,             # Max empty/minimal workspaces
        }

    def scan_workspaces(self) -> Dict:
        """Scan all workspace files and gather metrics"""
        print("🔍 Scanning TerraFusion workspace ecosystem...")

        results = {
            'scan_time': datetime.datetime.now().isoformat(),
            'total_workspaces': 0,
            'oversized_workspaces': [],
            'empty_workspaces': [],
            'duplicate_paths': {},
            'folder_distribution': {},
            'size_analysis': {},
            'recommendations': []
        }

        workspace_files = list(self.workspace_dir.rglob("*.code-workspace"))
        results['total_workspaces'] = len(workspace_files)

        print(f"📊 Found {len(workspace_files)} workspace files")

        all_paths = []

        for workspace_file in workspace_files:
            try:
                # Analyze file size
                file_size_kb = workspace_file.stat().st_size / 1024

                # Parse workspace JSON
                with open(workspace_file, 'r', encoding='utf-8') as f:
                    workspace_data = json.loads(f.read())

                folders = workspace_data.get('folders', [])
                folder_count = len(folders)

                # Collect folder paths for duplicate analysis
                for folder in folders:
                    path = folder.get('path', '')
                    if path:
                        all_paths.append(path)

                # Check for oversized workspace files
                if file_size_kb > self.thresholds['workspace_file_size_kb']:
                    results['oversized_workspaces'].append({
                        'file': str(workspace_file.relative_to(self.workspace_root)),
                        'size_kb': round(file_size_kb, 2),
                        'folder_count': folder_count
                    })

                # Check for empty/minimal workspaces
                if folder_count == 0 or file_size_kb < 0.5:
                    results['empty_workspaces'].append({
                        'file': str(workspace_file.relative_to(self.workspace_root)),
                        'folder_count': folder_count,
                        'size_kb': round(file_size_kb, 2)
                    })

                # Track folder distribution
                if folder_count in results['folder_distribution']:
                    results['folder_distribution'][folder_count] += 1
                else:
                    results['folder_distribution'][folder_count] = 1

            except Exception as e:
                print(f"⚠️  Error processing {workspace_file}: {e}")

        # Analyze duplicate paths
        path_counts = {}
        for path in all_paths:
            if path in path_counts:
                path_counts[path] += 1
            else:
                path_counts[path] = 1

        for path, count in path_counts.items():
            if count > self.thresholds['duplicate_paths']:
                results['duplicate_paths'][path] = count

        # Size analysis
        total_size_kb = sum(f.stat().st_size / 1024 for f in workspace_files)
        avg_size_kb = total_size_kb / len(workspace_files) if workspace_files else 0

        results['size_analysis'] = {
            'total_size_kb': round(total_size_kb, 2),
            'average_size_kb': round(avg_size_kb, 2),
            'largest_workspaces': sorted(results['oversized_workspaces'],
                                       key=lambda x: x['size_kb'], reverse=True)[:5]
        }

        # Generate recommendations
        results['recommendations'] = self._generate_recommendations(results)

        return results

    def _generate_recommendations(self, results: Dict) -> List[str]:
        """Generate actionable recommendations for workspace optimization"""
        recommendations = []

        # Total workspace count check
        if results['total_workspaces'] > self.thresholds['total_workspaces']:
            recommendations.append(
                f"🚨 CRITICAL: {results['total_workspaces']} workspace files exceed "
                f"recommended limit of {self.thresholds['total_workspaces']}. "
                "Consider consolidating similar workspaces."
            )

        # Oversized workspaces
        if results['oversized_workspaces']:
            recommendations.append(
                f"📏 {len(results['oversized_workspaces'])} workspace files are oversized. "
                f"Consider splitting large workspaces or optimizing configuration."
            )

        # Empty workspaces
        if len(results['empty_workspaces']) > self.thresholds['empty_workspaces']:
            recommendations.append(
                f"🗑️  {len(results['empty_workspaces'])} empty/minimal workspace files found. "
                "Consider removing incomplete workspace configurations."
            )

        # Duplicate paths
        if results['duplicate_paths']:
            top_duplicate = max(results['duplicate_paths'].items(), key=lambda x: x[1])
            recommendations.append(
                f"🔄 Found duplicate path references. '{top_duplicate[0]}' is referenced "
                f"{top_duplicate[1]} times across workspaces. Consider consolidation."
            )

        # Performance recommendations
        if results['size_analysis']['average_size_kb'] > 25:
            recommendations.append(
                f"⚡ Average workspace size ({results['size_analysis']['average_size_kb']:.1f}KB) "
                "is high. Optimize configurations for better VS Code performance."
            )

        # Success message
        if not recommendations:
            recommendations.append("✅ Workspace ecosystem is optimally configured! Government. Transcended.")

        return recommendations

    def cleanup_suggestions(self) -> List[str]:
        """Generate specific cleanup suggestions"""
        suggestions = []

        # Find potential duplicates by name similarity
        workspace_files = list(self.workspace_dir.rglob("*.code-workspace"))
        names = [f.stem for f in workspace_files]

        # Look for similar names that might be duplicates
        similar_groups = {}
        for name in names:
            base_name = name.replace('-elite', '').replace('-enhanced', '').replace('-core', '')
            if base_name in similar_groups:
                similar_groups[base_name].append(name)
            else:
                similar_groups[base_name] = [name]

        for base_name, variants in similar_groups.items():
            if len(variants) > 1:
                suggestions.append(f"🔍 Similar workspaces found: {', '.join(variants)} - Consider consolidating")

        # Check for nested duplicates
        root_workspaces = [f.stem for f in workspace_files if '/' not in str(f.relative_to(self.workspace_dir))]
        nested_workspaces = [f.stem for f in workspace_files if '/' in str(f.relative_to(self.workspace_dir))]

        duplicates = set(root_workspaces) & set(nested_workspaces)
        if duplicates:
            suggestions.append(f"🔄 Workspaces exist at both root and nested levels: {', '.join(duplicates)}")

        return suggestions

    def generate_report(self) -> str:
        """Generate comprehensive workspace health report"""
        results = self.scan_workspaces()
        cleanup_suggestions = self.cleanup_suggestions()

        report = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                    TERRAFUSION OS WORKSPACE HEALTH REPORT                    ║
║                         Championship-Level Analysis                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 WORKSPACE METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗃️  Total Workspaces: {results['total_workspaces']}
📏 Average Size: {results['size_analysis']['average_size_kb']:.1f} KB
📦 Total Size: {results['size_analysis']['total_size_kb']:.1f} KB
⚠️  Oversized Files: {len(results['oversized_workspaces'])}
🗑️  Empty/Minimal: {len(results['empty_workspaces'])}
🔄 Duplicate Paths: {len(results['duplicate_paths'])}

📈 FOLDER DISTRIBUTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

        # Add folder distribution
        for folder_count, workspace_count in sorted(results['folder_distribution'].items()):
            report += f"   {folder_count:2d} folders: {workspace_count:3d} workspaces\n"

        # Add recommendations
        report += f"""
🚀 RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
        for rec in results['recommendations']:
            report += f"   {rec}\n"

        # Add cleanup suggestions
        if cleanup_suggestions:
            report += f"""
🧹 CLEANUP SUGGESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
            for suggestion in cleanup_suggestions:
                report += f"   {suggestion}\n"

        # Add oversized workspace details
        if results['oversized_workspaces']:
            report += f"""
📏 OVERSIZED WORKSPACES ({len(results['oversized_workspaces'])} files)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
            for ws in results['oversized_workspaces'][:10]:  # Top 10
                report += f"   📁 {ws['file']} ({ws['size_kb']} KB, {ws['folder_count']} folders)\n"

        report += f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Report generated: {results['scan_time']}
TerraFusion OS - Government. Transcended.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

        return report

    def export_json(self, output_file: str) -> None:
        """Export detailed results to JSON"""
        results = self.scan_workspaces()
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        print(f"📄 Detailed results exported to {output_file}")


def main():
    """Main entry point for workspace monitoring script"""
    parser = argparse.ArgumentParser(
        description="TerraFusion OS Workspace Size Monitoring - Championship Performance Analysis"
    )
    parser.add_argument(
        "--workspace-root",
        default="/workspaces/terrafusion_os_1.0",
        help="Root directory of TerraFusion workspace (default: /workspaces/terrafusion_os_1.0)"
    )
    parser.add_argument(
        "--export-json",
        help="Export detailed results to JSON file"
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="Suppress progress messages"
    )

    args = parser.parse_args()

    try:
        monitor = WorkspaceMonitor(args.workspace_root)

        # Generate and display report
        report = monitor.generate_report()
        print(report)

        # Export JSON if requested
        if args.export_json:
            monitor.export_json(args.export_json)

    except Exception as e:
        print(f"❌ Error during workspace monitoring: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
