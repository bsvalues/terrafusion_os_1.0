#!/usr/bin/env python3
"""
Atlas Health Check Dashboard
Comprehensive health monitoring and recommendations
"""

import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

ATLAS_ROOT = Path(__file__).parent.parent
REGISTRIES_DIR = ATLAS_ROOT / "registries"

class AtlasHealthCheck:
    def __init__(self):
        self.issues = defaultdict(list)
        self.warnings = defaultdict(list)
        self.recommendations = []
        
    def load_registries(self):
        """Load all registry data"""
        registries = {}
        for reg_file in REGISTRIES_DIR.glob("*.json"):
            try:
                with open(reg_file) as f:
                    data = json.load(f)
                    registries[reg_file.stem] = data.get('items', [])
            except Exception as e:
                self.issues['json_errors'].append(f"{reg_file.name}: {str(e)}")
        return registries
    
    def check_ownership(self, registries):
        """Check ownership coverage"""
        total = 0
        no_owner = []
        
        for registry, items in registries.items():
            for item in items:
                total += 1
                if not item.get('owner'):
                    no_owner.append(f"{registry}/{item.get('id', 'unknown')}")
        
        coverage = ((total - len(no_owner)) / total * 100) if total > 0 else 0
        
        return {
            'total': total,
            'no_owner': no_owner,
            'coverage': coverage,
            'status': '✅' if coverage == 100 else '⚠️' if coverage >= 90 else '❌'
        }
    
    def check_tagging(self, registries):
        """Check tagging coverage"""
        total = 0
        no_tags = []
        few_tags = []
        
        for registry, items in registries.items():
            for item in items:
                total += 1
                tags = item.get('tags', [])
                
                if not tags:
                    no_tags.append(f"{registry}/{item.get('id', 'unknown')}")
                elif len(tags) < 2:
                    few_tags.append(f"{registry}/{item.get('id', 'unknown')} (has {len(tags)})")
        
        coverage = ((total - len(no_tags)) / total * 100) if total > 0 else 0
        
        return {
            'total': total,
            'no_tags': no_tags,
            'few_tags': few_tags,
            'coverage': coverage,
            'status': '✅' if coverage >= 80 else '⚠️' if coverage >= 50 else '❌'
        }
    
    def check_descriptions(self, registries):
        """Check description quality"""
        total = 0
        no_description = []
        short_description = []
        
        for registry, items in registries.items():
            for item in items:
                total += 1
                desc = item.get('description', '')
                
                if not desc:
                    no_description.append(f"{registry}/{item.get('id', 'unknown')}")
                elif len(desc) < 20:
                    short_description.append(f"{registry}/{item.get('id', 'unknown')} ({len(desc)} chars)")
        
        quality = ((total - len(no_description) - len(short_description)) / total * 100) if total > 0 else 0
        
        return {
            'total': total,
            'no_description': no_description,
            'short_description': short_description,
            'quality': quality,
            'status': '✅' if quality >= 90 else '⚠️' if quality >= 70 else '❌'
        }
    
    def check_duplicates(self, registries):
        """Check for duplicate IDs"""
        all_ids = []
        duplicates = []
        
        for registry, items in registries.items():
            for item in items:
                item_id = item.get('id')
                if item_id:
                    if item_id in all_ids:
                        duplicates.append(f"{item_id} (in {registry})")
                    all_ids.append(item_id)
        
        return {
            'total_ids': len(all_ids),
            'unique_ids': len(set(all_ids)),
            'duplicates': duplicates,
            'status': '✅' if len(duplicates) == 0 else '❌'
        }
    
    def check_paths(self, registries):
        """Check source path validity"""
        total = 0
        missing_path = []
        invalid_path = []
        
        repo_root = ATLAS_ROOT.parent
        
        for registry, items in registries.items():
            for item in items:
                total += 1
                path = item.get('source_path')
                
                if not path:
                    missing_path.append(f"{registry}/{item.get('id', 'unknown')}")
                else:
                    full_path = repo_root / path
                    if not full_path.exists():
                        invalid_path.append(f"{registry}/{item.get('id', 'unknown')} → {path}")
        
        validity = ((total - len(missing_path) - len(invalid_path)) / total * 100) if total > 0 else 0
        
        return {
            'total': total,
            'missing_path': missing_path,
            'invalid_path': invalid_path,
            'validity': validity,
            'status': '✅' if validity >= 95 else '⚠️' if validity >= 80 else '❌'
        }
    
    def check_lifecycle(self, registries):
        """Check lifecycle status distribution"""
        lifecycle_counts = defaultdict(int)
        no_lifecycle = []
        
        for registry, items in registries.items():
            for item in items:
                lifecycle = item.get('lifecycle', 'unknown')
                lifecycle_counts[lifecycle] += 1
                
                if lifecycle == 'unknown':
                    no_lifecycle.append(f"{registry}/{item.get('id', 'unknown')}")
        
        return {
            'distribution': dict(lifecycle_counts),
            'no_lifecycle': no_lifecycle,
            'needs_update': len(no_lifecycle),
            'status': '✅' if len(no_lifecycle) == 0 else '⚠️'
        }
    
    def check_dependencies(self, registries):
        """Check dependency relationships"""
        all_ids = set()
        dependencies = []
        broken_deps = []
        
        # Collect all IDs
        for registry, items in registries.items():
            for item in items:
                if item.get('id'):
                    all_ids.add(item.get('id'))
        
        # Check dependencies
        for registry, items in registries.items():
            for item in items:
                deps = item.get('depends_on', [])
                for dep in deps:
                    dependencies.append((item.get('id'), dep))
                    if dep not in all_ids:
                        broken_deps.append(f"{item.get('id')} → {dep} (missing)")
        
        return {
            'total_dependencies': len(dependencies),
            'broken_dependencies': broken_deps,
            'status': '✅' if len(broken_deps) == 0 else '⚠️'
        }
    
    def generate_recommendations(self, results):
        """Generate actionable recommendations"""
        recommendations = []
        
        # Ownership recommendations
        if results['ownership']['coverage'] < 100:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Ownership',
                'issue': f"{len(results['ownership']['no_owner'])} items without owners",
                'action': 'Assign owners to all items',
                'impact': 'Unclear responsibility, maintenance issues'
            })
        
        # Tagging recommendations
        if results['tagging']['coverage'] < 80:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Tagging',
                'issue': f"Only {results['tagging']['coverage']:.1f}% items have tags",
                'action': 'Add 2-5 descriptive tags to each item',
                'impact': 'Poor discoverability, difficult to filter/search'
            })
        
        # Description recommendations
        if results['descriptions']['quality'] < 90:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Documentation',
                'issue': f"{len(results['descriptions']['no_description'])} items lack descriptions",
                'action': 'Add clear, concise descriptions (20+ chars)',
                'impact': 'Team members unclear about component purpose'
            })
        
        # Path recommendations
        if results['paths']['validity'] < 95:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Paths',
                'issue': f"{len(results['paths']['invalid_path'])} invalid paths",
                'action': 'Update source_path to correct locations or remove stale items',
                'impact': 'Broken references, confusion about component location'
            })
        
        # Lifecycle recommendations
        if results['lifecycle']['needs_update'] > 50:
            recommendations.append({
                'priority': 'LOW',
                'category': 'Lifecycle',
                'issue': f"{results['lifecycle']['needs_update']} items with unknown lifecycle",
                'action': 'Set lifecycle to active, experimental, deprecated, or archived',
                'impact': 'Unclear component status, unnecessary maintenance'
            })
        
        # Duplicate recommendations
        if results['duplicates']['duplicates']:
            recommendations.append({
                'priority': 'CRITICAL',
                'category': 'Data Integrity',
                'issue': f"{len(results['duplicates']['duplicates'])} duplicate IDs found",
                'action': 'Rename duplicate IDs to be unique',
                'impact': 'Data corruption, broken references, system confusion'
            })
        
        return recommendations
    
    def run(self):
        """Run comprehensive health check"""
        print("🏥 TerraFusion Atlas Health Check")
        print("=" * 70)
        print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Load data
        registries = self.load_registries()
        total_items = sum(len(items) for items in registries.values())
        
        print(f"📊 Loaded {len(registries)} registries with {total_items} total items\n")
        
        # Run checks
        results = {
            'ownership': self.check_ownership(registries),
            'tagging': self.check_tagging(registries),
            'descriptions': self.check_descriptions(registries),
            'duplicates': self.check_duplicates(registries),
            'paths': self.check_paths(registries),
            'lifecycle': self.check_lifecycle(registries),
            'dependencies': self.check_dependencies(registries)
        }
        
        # Print results
        print("🔍 HEALTH CHECK RESULTS")
        print("-" * 70)
        
        # Ownership
        print(f"\n{results['ownership']['status']} OWNERSHIP")
        print(f"   Coverage: {results['ownership']['coverage']:.1f}%")
        print(f"   Items with owners: {results['ownership']['total'] - len(results['ownership']['no_owner'])}/{results['ownership']['total']}")
        if results['ownership']['no_owner']:
            print(f"   ⚠️  Missing owners: {len(results['ownership']['no_owner'])} items")
        
        # Tagging
        print(f"\n{results['tagging']['status']} TAGGING")
        print(f"   Coverage: {results['tagging']['coverage']:.1f}%")
        print(f"   Items with tags: {results['tagging']['total'] - len(results['tagging']['no_tags'])}/{results['tagging']['total']}")
        if results['tagging']['no_tags']:
            print(f"   ⚠️  No tags: {len(results['tagging']['no_tags'])} items")
        if results['tagging']['few_tags']:
            print(f"   ⚠️  Few tags (<2): {len(results['tagging']['few_tags'])} items")
        
        # Descriptions
        print(f"\n{results['descriptions']['status']} DESCRIPTIONS")
        print(f"   Quality: {results['descriptions']['quality']:.1f}%")
        if results['descriptions']['no_description']:
            print(f"   ⚠️  No description: {len(results['descriptions']['no_description'])} items")
        if results['descriptions']['short_description']:
            print(f"   ⚠️  Short description: {len(results['descriptions']['short_description'])} items")
        
        # Duplicates
        print(f"\n{results['duplicates']['status']} DUPLICATE IDs")
        print(f"   Unique IDs: {results['duplicates']['unique_ids']}/{results['duplicates']['total_ids']}")
        if results['duplicates']['duplicates']:
            print(f"   ❌ Duplicates found: {len(results['duplicates']['duplicates'])}")
            for dup in results['duplicates']['duplicates'][:5]:
                print(f"      • {dup}")
        
        # Paths
        print(f"\n{results['paths']['status']} SOURCE PATHS")
        print(f"   Validity: {results['paths']['validity']:.1f}%")
        if results['paths']['missing_path']:
            print(f"   ⚠️  Missing paths: {len(results['paths']['missing_path'])} items")
        if results['paths']['invalid_path']:
            print(f"   ⚠️  Invalid paths: {len(results['paths']['invalid_path'])} items")
        
        # Lifecycle
        print(f"\n{results['lifecycle']['status']} LIFECYCLE STATUS")
        for status, count in sorted(results['lifecycle']['distribution'].items()):
            icon = '✅' if status == 'active' else '🧪' if status == 'experimental' else '⚠️'
            print(f"   {icon} {status}: {count} items")
        
        # Dependencies
        print(f"\n{results['dependencies']['status']} DEPENDENCIES")
        print(f"   Total dependencies: {results['dependencies']['total_dependencies']}")
        if results['dependencies']['broken_dependencies']:
            print(f"   ⚠️  Broken dependencies: {len(results['dependencies']['broken_dependencies'])}")
            for dep in results['dependencies']['broken_dependencies'][:3]:
                print(f"      • {dep}")
        
        # Overall score
        print("\n" + "=" * 70)
        scores = [
            results['ownership']['coverage'],
            results['tagging']['coverage'],
            results['descriptions']['quality'],
            results['paths']['validity'],
            100 if len(results['duplicates']['duplicates']) == 0 else 0
        ]
        overall_score = sum(scores) / len(scores)
        
        if overall_score >= 90:
            grade = '🏆 EXCELLENT'
        elif overall_score >= 75:
            grade = '✅ GOOD'
        elif overall_score >= 60:
            grade = '⚠️  NEEDS IMPROVEMENT'
        else:
            grade = '❌ CRITICAL'
        
        print(f"\n📊 OVERALL HEALTH SCORE: {overall_score:.1f}% {grade}")
        
        # Recommendations
        recommendations = self.generate_recommendations(results)
        
        if recommendations:
            print("\n" + "=" * 70)
            print("💡 RECOMMENDATIONS")
            print("-" * 70)
            
            for i, rec in enumerate(recommendations, 1):
                priority_icon = '🔴' if rec['priority'] == 'CRITICAL' else '🟠' if rec['priority'] == 'HIGH' else '🟡' if rec['priority'] == 'MEDIUM' else '🟢'
                print(f"\n{i}. {priority_icon} [{rec['priority']}] {rec['category']}")
                print(f"   Issue: {rec['issue']}")
                print(f"   Action: {rec['action']}")
                print(f"   Impact: {rec['impact']}")
        
        print("\n" + "=" * 70)
        print("✅ Health check complete!")
        
        return results, recommendations

if __name__ == '__main__':
    checker = AtlasHealthCheck()
    checker.run()
