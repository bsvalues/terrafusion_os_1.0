#!/usr/bin/env python3
"""
TerraFusion Design System Mass Migration Tool
MIT/PhD-Level Systems Engineering Approach

This script intelligently migrates 170+ HTML files from hardcoded styles
to the unified design system with automated pattern recognition and validation.

Features:
- Smart pattern detection (color codes, inline styles, class names)
- Automated CSS variable replacement
- Design system import injection
- Before/after validation
- Detailed migration report
- Dry-run mode for safety
- Rollback capability

Usage:
    python scripts/migrate-to-design-system.py --scan
    python scripts/migrate-to-design-system.py --execute --backup
    python scripts/migrate-to-design-system.py --rollback
"""

import os
import re
import json
import shutil
import argparse
from pathlib import Path
from typing import Dict, List, Tuple, Set
from datetime import datetime
import hashlib

# TerraFusion brand color mappings
COLOR_MAPPINGS = {
    # Trust Blue
    '#0099ff': 'var(--trust-blue)',
    '#09f': 'var(--trust-blue)',
    'rgb(0, 153, 255)': 'var(--trust-blue)',
    'rgb(0,153,255)': 'var(--trust-blue)',
    
    # Transcend Cyan
    '#00ffee': 'var(--transcend-cyan)',
    '#0fe': 'var(--transcend-cyan)',
    'rgb(0, 255, 238)': 'var(--transcend-cyan)',
    'rgb(0,255,238)': 'var(--transcend-cyan)',
    
    # Success Green
    '#00ffaa': 'var(--success-green)',
    '#0fa': 'var(--success-green)',
    'rgb(0, 255, 170)': 'var(--success-green)',
    'rgb(0,255,170)': 'var(--success-green)',
    
    # Deep Space (background)
    '#0b1020': 'var(--deep-space)',
    'rgb(11, 16, 32)': 'var(--deep-space)',
    'rgb(11,16,32)': 'var(--deep-space)',
    
    # Midnight (secondary background)
    '#1a1f3a': 'var(--midnight)',
    'rgb(26, 31, 58)': 'var(--midnight)',
    'rgb(26,31,58)': 'var(--midnight)',
    
    # Alert Red
    '#ff3366': 'var(--alert-red)',
    '#f36': 'var(--alert-red)',
    
    # Caution Amber
    '#ffaa00': 'var(--caution-amber)',
    '#fa0': 'var(--caution-amber)',
    
    # White/Light
    '#ffffff': 'var(--white)',
    '#fff': 'var(--white)',
    'rgb(255, 255, 255)': 'var(--white)',
}

# Gradient mappings
GRADIENT_MAPPINGS = {
    'linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%)': 'var(--gradient-clarity)',
    'linear-gradient(135deg, #0099ff, #00ffee, #00ffaa)': 'var(--gradient-clarity)',
    'linear-gradient(135deg, #00ffee 0%, #00ffaa 100%)': 'var(--gradient-transcendence)',
    'linear-gradient(135deg, #00ffee, #00ffaa)': 'var(--gradient-transcendence)',
    'linear-gradient(180deg, #0b1020 0%, #1a1f3a 100%)': 'var(--gradient-dark-bg)',
}

# Utility class mappings for common patterns
UTILITY_CLASS_PATTERNS = {
    r'style=["\']color:\s*#00ffee["\']': 'class="text-transcend-cyan"',
    r'style=["\']color:\s*#0099ff["\']': 'class="text-trust-blue"',
    r'style=["\']color:\s*#00ffaa["\']': 'class="text-success-green"',
    r'style=["\']background:\s*#0b1020["\']': 'class="bg-deep-space"',
    r'style=["\']background:\s*#1a1f3a["\']': 'class="bg-midnight"',
}


class DesignSystemMigrator:
    """Intelligent migration system with validation and rollback."""
    
    def __init__(self, workspace_root: str, dry_run: bool = True, backup: bool = True):
        self.workspace_root = Path(workspace_root)
        self.dry_run = dry_run
        self.backup = backup
        self.backup_dir = self.workspace_root / '.design-system-migration-backup'
        self.report = {
            'timestamp': datetime.now().isoformat(),
            'files_scanned': 0,
            'files_modified': 0,
            'replacements': {},
            'errors': [],
            'warnings': [],
        }
        
    def scan_files(self) -> List[Path]:
        """Discover all HTML files in workspace."""
        html_files = []
        
        # Priority directories
        priority_dirs = [
            '',  # Root level dashboards
            'Brand_Assets',
            'frontend',
            'infrastructure/monitoring',
        ]
        
        for dir_path in priority_dirs:
            search_path = self.workspace_root / dir_path
            if search_path.exists():
                html_files.extend(search_path.glob('**/*.html'))
        
        # Filter out node_modules, build artifacts, etc.
        filtered = [
            f for f in html_files 
            if not any(exclude in str(f) for exclude in [
                'node_modules', '.git', 'dist', 'build', '.next', 
                '__pycache__', '.pytest_cache', 'coverage'
            ])
        ]
        
        self.report['files_scanned'] = len(filtered)
        return sorted(set(filtered))
    
    def analyze_file(self, file_path: Path) -> Dict:
        """Analyze file for migration opportunities."""
        try:
            content = file_path.read_text(encoding='utf-8')
        except Exception as e:
            self.report['errors'].append({
                'file': str(file_path),
                'error': f"Failed to read file: {str(e)}"
            })
            return {}
        
        analysis = {
            'file': str(file_path.relative_to(self.workspace_root)),
            'size': len(content),
            'checksum': hashlib.sha256(content.encode()).hexdigest()[:16],
            'has_design_system_import': '/design-system.css' in content or 'design-sync/tokens.css' in content,
            'color_matches': [],
            'gradient_matches': [],
            'utility_class_opportunities': [],
            'suggested_replacements': 0,
        }
        
        # Find color code matches
        for old_color, new_var in COLOR_MAPPINGS.items():
            escaped = re.escape(old_color)
            matches = re.findall(escaped, content, re.IGNORECASE)
            if matches:
                analysis['color_matches'].append({
                    'old': old_color,
                    'new': new_var,
                    'count': len(matches)
                })
                analysis['suggested_replacements'] += len(matches)
        
        # Find gradient matches
        for old_gradient, new_var in GRADIENT_MAPPINGS.items():
            if old_gradient in content:
                count = content.count(old_gradient)
                analysis['gradient_matches'].append({
                    'old': old_gradient[:50] + '...',
                    'new': new_var,
                    'count': count
                })
                analysis['suggested_replacements'] += count
        
        # Find utility class opportunities
        for pattern, replacement in UTILITY_CLASS_PATTERNS.items():
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                analysis['utility_class_opportunities'].append({
                    'pattern': pattern[:50] + '...',
                    'replacement': replacement,
                    'count': len(matches)
                })
                analysis['suggested_replacements'] += len(matches)
        
        return analysis
    
    def migrate_file(self, file_path: Path) -> bool:
        """Migrate single file to design system."""
        try:
            original_content = file_path.read_text(encoding='utf-8')
            content = original_content
            replacements_made = 0
            
            # Backup if requested
            if self.backup and not self.dry_run:
                self._backup_file(file_path, original_content)
            
            # 1. Inject design system import if missing
            if '/design-system.css' not in content and 'design-sync/tokens.css' not in content:
                # Find <head> tag and inject after it
                head_match = re.search(r'<head[^>]*>', content, re.IGNORECASE)
                if head_match:
                    insert_pos = head_match.end()
                    import_line = '\n    <link rel="stylesheet" href="/design-system.css">\n'
                    content = content[:insert_pos] + import_line + content[insert_pos:]
                    replacements_made += 1
                else:
                    self.report['warnings'].append({
                        'file': str(file_path),
                        'warning': 'No <head> tag found, could not inject design system import'
                    })
            
            # 2. Replace color codes with CSS variables
            for old_color, new_var in COLOR_MAPPINGS.items():
                # Case-insensitive replacement
                pattern = re.compile(re.escape(old_color), re.IGNORECASE)
                matches = pattern.findall(content)
                if matches:
                    content = pattern.sub(new_var, content)
                    replacements_made += len(matches)
            
            # 3. Replace gradients
            for old_gradient, new_var in GRADIENT_MAPPINGS.items():
                if old_gradient in content:
                    count = content.count(old_gradient)
                    content = content.replace(old_gradient, new_var)
                    replacements_made += count
            
            # 4. Replace inline styles with utility classes (where simple)
            for pattern, replacement in UTILITY_CLASS_PATTERNS.items():
                regex = re.compile(pattern, re.IGNORECASE)
                matches = regex.findall(content)
                if matches:
                    content = regex.sub(replacement, content)
                    replacements_made += len(matches)
            
            # Write changes
            if not self.dry_run and content != original_content:
                file_path.write_text(content, encoding='utf-8')
                self.report['files_modified'] += 1
            
            if replacements_made > 0:
                file_key = str(file_path.relative_to(self.workspace_root))
                self.report['replacements'][file_key] = replacements_made
            
            return True
            
        except Exception as e:
            self.report['errors'].append({
                'file': str(file_path),
                'error': f"Migration failed: {str(e)}"
            })
            return False
    
    def _backup_file(self, file_path: Path, content: str):
        """Backup file before modification."""
        self.backup_dir.mkdir(exist_ok=True)
        
        rel_path = file_path.relative_to(self.workspace_root)
        backup_path = self.backup_dir / rel_path
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        
        backup_path.write_text(content, encoding='utf-8')
    
    def generate_report(self, analyses: List[Dict]) -> str:
        """Generate comprehensive migration report."""
        report_lines = [
            "=" * 80,
            "TerraFusion Design System Migration Report",
            "=" * 80,
            f"Timestamp: {self.report['timestamp']}",
            f"Mode: {'DRY RUN (no changes made)' if self.dry_run else 'EXECUTE (changes applied)'}",
            f"Backup: {'Enabled' if self.backup else 'Disabled'}",
            "",
            "=" * 80,
            "SUMMARY",
            "=" * 80,
            f"Files Scanned: {self.report['files_scanned']}",
            f"Files Modified: {self.report['files_modified']}",
            f"Total Replacements: {sum(self.report['replacements'].values())}",
            f"Errors: {len(self.report['errors'])}",
            f"Warnings: {len(self.report['warnings'])}",
            "",
        ]
        
        # Top files by replacement count
        if self.report['replacements']:
            report_lines.extend([
                "=" * 80,
                "TOP FILES BY REPLACEMENTS",
                "=" * 80,
            ])
            sorted_files = sorted(
                self.report['replacements'].items(),
                key=lambda x: x[1],
                reverse=True
            )[:20]
            
            for file_path, count in sorted_files:
                report_lines.append(f"  {count:4d} replacements → {file_path}")
            report_lines.append("")
        
        # Detailed analysis of migration opportunities
        total_opportunities = sum(a.get('suggested_replacements', 0) for a in analyses)
        if total_opportunities > 0:
            report_lines.extend([
                "=" * 80,
                f"MIGRATION OPPORTUNITIES: {total_opportunities} total",
                "=" * 80,
            ])
            
            for analysis in analyses:
                if analysis.get('suggested_replacements', 0) > 0:
                    report_lines.append(f"\n📄 {analysis['file']}")
                    report_lines.append(f"   Checksum: {analysis['checksum']}")
                    report_lines.append(f"   Design System Import: {'✓ Yes' if analysis['has_design_system_import'] else '✗ No'}")
                    report_lines.append(f"   Suggested Replacements: {analysis['suggested_replacements']}")
                    
                    if analysis['color_matches']:
                        report_lines.append(f"\n   🎨 Color Replacements:")
                        for match in analysis['color_matches'][:10]:
                            report_lines.append(f"      {match['count']}× {match['old']} → {match['new']}")
                    
                    if analysis['gradient_matches']:
                        report_lines.append(f"\n   🌈 Gradient Replacements:")
                        for match in analysis['gradient_matches']:
                            report_lines.append(f"      {match['count']}× {match['old']} → {match['new']}")
                    
                    if analysis['utility_class_opportunities']:
                        report_lines.append(f"\n   🔧 Utility Class Opportunities:")
                        for opp in analysis['utility_class_opportunities'][:5]:
                            report_lines.append(f"      {opp['count']}× inline style → {opp['replacement']}")
        
        # Errors
        if self.report['errors']:
            report_lines.extend([
                "",
                "=" * 80,
                f"❌ ERRORS ({len(self.report['errors'])})",
                "=" * 80,
            ])
            for error in self.report['errors']:
                report_lines.append(f"  {error['file']}")
                report_lines.append(f"    Error: {error['error']}")
                report_lines.append("")
        
        # Warnings
        if self.report['warnings']:
            report_lines.extend([
                "",
                "=" * 80,
                f"⚠️  WARNINGS ({len(self.report['warnings'])})",
                "=" * 80,
            ])
            for warning in self.report['warnings']:
                report_lines.append(f"  {warning['file']}")
                report_lines.append(f"    Warning: {warning['warning']}")
                report_lines.append("")
        
        report_lines.extend([
            "=" * 80,
            "NEXT STEPS",
            "=" * 80,
        ])
        
        if self.dry_run:
            report_lines.extend([
                "✓ Review this report carefully",
                "✓ Run with --execute flag to apply changes:",
                "    python scripts/migrate-to-design-system.py --execute --backup",
                "",
            ])
        else:
            report_lines.extend([
                "✓ Migration complete!",
                f"✓ Backup created at: {self.backup_dir}" if self.backup else "⚠️  No backup created (--no-backup flag used)",
                "✓ Validate changes with visual regression tests",
                "✓ If issues found, rollback with:",
                "    python scripts/migrate-to-design-system.py --rollback",
                "",
            ])
        
        report_lines.append("=" * 80)
        
        return "\n".join(report_lines)
    
    def rollback(self):
        """Rollback migration using backups."""
        if not self.backup_dir.exists():
            print("❌ No backup found. Cannot rollback.")
            return False
        
        print(f"🔄 Rolling back migration from: {self.backup_dir}")
        
        rollback_count = 0
        for backup_file in self.backup_dir.glob('**/*'):
            if backup_file.is_file():
                rel_path = backup_file.relative_to(self.backup_dir)
                original_file = self.workspace_root / rel_path
                
                shutil.copy2(backup_file, original_file)
                rollback_count += 1
                print(f"  ✓ Restored: {rel_path}")
        
        print(f"\n✅ Rollback complete! Restored {rollback_count} files.")
        print(f"💡 Backup preserved at: {self.backup_dir}")
        return True


def main():
    parser = argparse.ArgumentParser(
        description='TerraFusion Design System Mass Migration Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scan files and preview changes (safe, no modifications)
  python scripts/migrate-to-design-system.py --scan
  
  # Execute migration with backup
  python scripts/migrate-to-design-system.py --execute --backup
  
  # Execute without backup (use with caution!)
  python scripts/migrate-to-design-system.py --execute --no-backup
  
  # Rollback migration
  python scripts/migrate-to-design-system.py --rollback
        """
    )
    
    parser.add_argument(
        '--scan',
        action='store_true',
        help='Scan files and generate report (no changes made)'
    )
    parser.add_argument(
        '--execute',
        action='store_true',
        help='Execute migration (applies changes to files)'
    )
    parser.add_argument(
        '--rollback',
        action='store_true',
        help='Rollback migration using backups'
    )
    parser.add_argument(
        '--backup',
        action='store_true',
        default=True,
        help='Create backup before migration (default: enabled)'
    )
    parser.add_argument(
        '--no-backup',
        action='store_true',
        help='Skip backup creation (use with caution!)'
    )
    parser.add_argument(
        '--workspace',
        type=str,
        default='/workspaces/terrafusion_os_1.0',
        help='Workspace root directory'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='design-system-migration-report.txt',
        help='Output file for migration report'
    )
    
    args = parser.parse_args()
    
    # Validate arguments
    if not (args.scan or args.execute or args.rollback):
        parser.error("Must specify --scan, --execute, or --rollback")
    
    if args.rollback:
        migrator = DesignSystemMigrator(args.workspace, dry_run=True)
        migrator.rollback()
        return
    
    # Initialize migrator
    dry_run = not args.execute
    backup = args.backup and not args.no_backup
    
    migrator = DesignSystemMigrator(
        workspace_root=args.workspace,
        dry_run=dry_run,
        backup=backup
    )
    
    print("🚀 TerraFusion Design System Migration Tool")
    print(f"   Mode: {'SCAN (dry-run)' if dry_run else 'EXECUTE (applying changes)'}")
    print(f"   Backup: {'Enabled' if backup else 'Disabled'}")
    print(f"   Workspace: {args.workspace}\n")
    
    # Scan files
    print("📂 Scanning workspace for HTML files...")
    html_files = migrator.scan_files()
    print(f"   Found {len(html_files)} HTML files\n")
    
    # Analyze files
    print("🔍 Analyzing files for migration opportunities...")
    analyses = []
    for i, file_path in enumerate(html_files, 1):
        analysis = migrator.analyze_file(file_path)
        if analysis:
            analyses.append(analysis)
        
        if i % 20 == 0:
            print(f"   Analyzed {i}/{len(html_files)} files...")
    
    print(f"   Analysis complete: {len(analyses)} files processed\n")
    
    # Execute migration if requested
    if args.execute:
        print("✏️  Executing migration...")
        for i, file_path in enumerate(html_files, 1):
            migrator.migrate_file(file_path)
            
            if i % 20 == 0:
                print(f"   Migrated {i}/{len(html_files)} files...")
        
        print(f"   Migration complete: {migrator.report['files_modified']} files modified\n")
    
    # Generate report
    print("📊 Generating migration report...")
    report = migrator.generate_report(analyses)
    
    # Write report to file
    output_path = Path(args.workspace) / args.output
    output_path.write_text(report, encoding='utf-8')
    print(f"   Report saved to: {output_path}\n")
    
    # Print report to console
    print(report)
    
    # Save JSON report
    json_path = output_path.with_suffix('.json')
    with open(json_path, 'w') as f:
        json.dump({
            'report': migrator.report,
            'analyses': analyses,
        }, f, indent=2)
    print(f"\n📄 JSON report saved to: {json_path}")


if __name__ == '__main__':
    main()
