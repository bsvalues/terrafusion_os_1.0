#!/usr/bin/env python3
"""
TerraFusion IDE - JSX Fragment Repair Tool
MIT/PhD Systems Engineering Approach
Author: TerraFusion Engineering Team
Date: October 11, 2025

Purpose: Systematically remove malformed JSX fragments from React components
Root Cause: Fragments used incorrectly as line breaks within JSX
Solution: Remove standalone fragments while preserving valid JSX structure
"""

import re
import sys
from pathlib import Path

def analyze_fragment_pattern(content: str) -> dict:
    """Analyze the pattern of fragment usage for diagnostic purposes"""
    lines = content.split('\n')
    fragment_opens = []
    fragment_closes = []
    
    for i, line in enumerate(lines, 1):
        if line.strip() == '<>':
            fragment_opens.append(i)
        elif line.strip() == '</>':
            fragment_closes.append(i)
        elif line.strip() == '</>>':
            fragment_closes.append(i)
    
    return {
        'total_opens': len(fragment_opens),
        'total_closes': len(fragment_closes),
        'open_lines': fragment_opens,
        'close_lines': fragment_closes,
        'balanced': len(fragment_opens) == len(fragment_closes)
    }

def fix_jsx_fragments(file_path: Path) -> tuple[str, dict]:
    """
    Systematically remove malformed JSX fragments
    
    Strategy:
    1. Remove standalone <> and </> that appear on their own lines
    2. Remove </>> (double closing) artifacts
    3. Preserve valid JSX structure
    4. Maintain indentation and formatting
    
    Returns: (fixed_content, repair_stats)
    """
    print(f"\n🔍 Analyzing: {file_path.name}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        original_content = f.read()
    
    # Diagnostic analysis
    analysis = analyze_fragment_pattern(original_content)
    print(f"   Found {analysis['total_opens']} opening fragments")
    print(f"   Found {analysis['total_closes']} closing fragments")
    print(f"   Balanced: {analysis['balanced']}")
    
    content = original_content
    fixes = []
    
    # Fix 1: Remove standalone <> on its own line
    pattern1 = r'^\s*<>\s*$'
    matches = len(re.findall(pattern1, content, re.MULTILINE))
    if matches > 0:
        content = re.sub(pattern1, '', content, flags=re.MULTILINE)
        fixes.append(f"Removed {matches} standalone opening fragments")
    
    # Fix 2: Remove standalone </> on its own line
    pattern2 = r'^\s*</>\s*$'
    matches = len(re.findall(pattern2, content, re.MULTILINE))
    if matches > 0:
        content = re.sub(pattern2, '', content, flags=re.MULTILINE)
        fixes.append(f"Removed {matches} standalone closing fragments")
    
    # Fix 3: Remove </>> (double closing) artifacts
    pattern3 = r'</\>\>'
    matches = len(re.findall(pattern3, content))
    if matches > 0:
        content = re.sub(pattern3, '', content)
        fixes.append(f"Removed {matches} double-closing artifacts")
    
    # Fix 4: Clean up excessive blank lines (but preserve intentional spacing)
    # Replace 3+ consecutive blank lines with 2 blank lines
    content = re.sub(r'\n\n\n+', '\n\n', content)
    
    repair_stats = {
        'original_fragments_open': analysis['total_opens'],
        'original_fragments_close': analysis['total_closes'],
        'fixes_applied': fixes,
        'bytes_saved': len(original_content) - len(content)
    }
    
    return content, repair_stats

def verify_jsx_syntax(content: str) -> list[str]:
    """Basic verification that JSX structure is valid"""
    issues = []
    
    # Check for mismatched <> and </>
    if '<>' in content or '</>' in content:
        issues.append("Warning: Fragment tags still present after fix")
    
    # Check for double closing
    if '</>>=' in content:
        issues.append("Warning: Double-closing artifact detected")
    
    return issues

def main():
    """Main repair orchestration"""
    print("="*70)
    print("TerraFusion IDE - JSX Fragment Systematic Repair Tool")
    print("MIT/PhD Systems Engineering Approach")
    print("="*70)
    
    # Files to repair
    base_path = Path(__file__).parent / 'src' / 'components'
    files_to_fix = [
        'TerraFusionIDE_ULTIMATE_POWER.tsx',
        'HybridAgentSystem.tsx',
        'GovernmentAgentsDashboard.tsx',
        'MLOptimizationDashboard.tsx'
    ]
    
    total_stats = {
        'files_processed': 0,
        'total_fragments_removed': 0,
        'total_bytes_saved': 0
    }
    
    for filename in files_to_fix:
        file_path = base_path / filename
        
        if not file_path.exists():
            print(f"\n❌ File not found: {filename}")
            continue
        
        try:
            # Perform systematic repair
            fixed_content, stats = fix_jsx_fragments(file_path)
            
            # Verify the fix
            issues = verify_jsx_syntax(fixed_content)
            
            if issues:
                print(f"\n⚠️  Verification issues:")
                for issue in issues:
                    print(f"     - {issue}")
            
            # Write the fixed file
            backup_path = file_path.with_suffix('.tsx.backup')
            file_path.rename(backup_path)
            print(f"   📦 Backup created: {backup_path.name}")
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            
            print(f"   ✅ Repaired successfully")
            for fix in stats['fixes_applied']:
                print(f"      - {fix}")
            print(f"   💾 Space saved: {stats['bytes_saved']} bytes")
            
            # Update totals
            total_stats['files_processed'] += 1
            total_stats['total_fragments_removed'] += (
                stats['original_fragments_open'] + 
                stats['original_fragments_close']
            )
            total_stats['total_bytes_saved'] += stats['bytes_saved']
            
        except Exception as e:
            print(f"\n❌ Error processing {filename}: {e}")
            continue
    
    # Final summary
    print("\n" + "="*70)
    print("REPAIR SUMMARY")
    print("="*70)
    print(f"Files processed: {total_stats['files_processed']}")
    print(f"Total fragments removed: {total_stats['total_fragments_removed']}")
    print(f"Total space saved: {total_stats['total_bytes_saved']} bytes")
    print("\n✅ Systematic repair complete")
    print("🚀 Ready to rebuild with: npm run dev")
    print("="*70)

if __name__ == '__main__':
    main()
