#!/usr/bin/env python3
"""
🌐 TerraFusion Elite Multi-Location Comprehensive Discovery System
Quantum Factor: 949 | Terra-Cyan: #00FFFF | Golden Ratio: φ=1.618

Scans ALL 3 TerraFusion locations with deduplication and consolidation:
1. "from D" - OneDrive Desktop production systems
2. TerraFusionMono - Comprehensive monorepo with apps/packages
3. D: drive - Master workspace collection

Government. Transcended.
"""

import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Tuple
from collections import defaultdict

class TerraFusionComprehensiveDiscovery:
    """Elite multi-location discovery with deduplication and strategic analysis"""

    def __init__(self):
        self.quantum_factor = 949
        self.terra_cyan = "#00FFFF"
        self.golden_ratio = 1.618

        # All 3 scanning locations
        self.locations = {
            "from_d": r"c:\Users\bsval\OneDrive\Desktop\from D",
            "terrafusion_mono": r"c:\Users\bsval\OneDrive\Desktop\TerraFusionMono\TerraFusionMono",
            "d_drive": r"d:\\"
        }

        # Track all systems across all locations
        self.all_systems: Dict[str, Dict] = {}
        self.location_map: Dict[str, List[str]] = defaultdict(list)  # system_name -> [locations]

        # Already integrated systems (from Phase 1-3C)
        self.integrated_systems = {
            'TerraLevy',
            'TerraFlow_PRODUCTION',
            'TerraFusionSync_PRODUCTION',
            'TerraFusionAssessor_PRODUCTION',
            'BCBSGISPRO_PRODUCTION',
            'BSIncomeValuation_PRODUCTION'
        }

        # Technology stack markers and bonuses
        self.tech_markers = {
            'Node.js': ['package.json', 'node_modules'],
            'TypeScript': ['tsconfig.json', '*.ts', '*.tsx'],
            'Python': ['requirements.txt', 'setup.py', '*.py'],
            'Flask': ['app.py', 'server.py'],
            'React': ['package.json'],  # Check package.json content for React
            'Vite': ['vite.config.ts', 'vite.config.js'],
            'PostgreSQL': ['*.sql', 'migrations/'],
            'Drizzle': ['drizzle.config.ts'],
            'Next.js': ['next.config.js', 'next.config.ts'],
            'Tauri': ['tauri.conf.json', 'src-tauri/'],
            'Electron': ['electron.config.js', 'electron/'],
            'FastAPI': ['main.py', 'fastapi'],
            'Docker': ['Dockerfile', 'docker-compose.yml'],
            'Kubernetes': ['k8s/', 'kubernetes/']
        }

        # Capability detection patterns (name -> capabilities)
        self.capability_patterns = {
            'permit': ['Workflow Automation', 'Document Intelligence', 'AI Processing'],
            'gis': ['Mapping', 'Spatial Analysis', 'Parcel Management'],
            'assessor': ['CAMA', 'Property Valuation', 'Mass Appraisal'],
            'income': ['NOI Calculation', 'Cap Rate Analysis', 'DCF Modeling'],
            'levy': ['Tax Calculation', 'Mill Rate', 'Budget Management'],
            'webhub': ['Web Portal', 'Citizen Services', 'Data Hub'],
            'pilt': ['PILT Assessment', 'Special Districts', 'Government Property'],
            'playground': ['Dev Environment', 'Testing', 'Prototyping'],
            'dashboard': ['Analytics', 'Reporting', 'Visualization'],
            'assistant': ['AI Assistant', 'Natural Language', 'Task Automation'],
            'build': ['Build Automation', 'CI/CD', 'Deployment'],
            'sync': ['Data Synchronization', 'Integration', 'ETL'],
            'flow': ['Workflow Engine', 'State Management', 'Process Automation'],
            'pro': ['Professional Tools', 'Advanced Features'],
            'monitoring': ['System Monitoring', 'Alerting', 'Health Checks'],
            'security': ['Authentication', 'Authorization', 'Compliance'],
            'mcp': ['Model Context Protocol', 'AI Integration'],
            'agent': ['AI Agents', 'Autonomous Operations'],
            'legislative': ['Legislative Tracking', 'Policy Management'],
            'citizen': ['Citizen Portal', 'Self-Service', 'Public Access'],
            'gateway': ['API Gateway', 'Service Routing', 'Load Balancing'],
            'marketplace': ['Service Marketplace', 'Plugin Discovery'],
            'terrafield': ['Field Operations', 'Mobile', 'Offline Sync'],
            'crop': ['Agriculture', 'Crop Analysis', 'Yield Prediction']
        }

    def discover_all_locations(self) -> Dict:
        """Master discovery orchestration across all 3 locations"""
        print(f"\n🌐 === TERRAFUSION ELITE COMPREHENSIVE DISCOVERY ===")
        print(f"Quantum Factor: {self.quantum_factor} | Terra-Cyan: {self.terra_cyan}")
        print(f"Golden Ratio φ: {self.golden_ratio}")
        print(f"\n🎯 Scanning 3 Locations for Complete TerraFusion Ecosystem Discovery\n")

        # Scan each location
        print("📍 LOCATION 1: 'from D' (OneDrive Desktop Production)")
        self.scan_location("from_d", max_depth=2)

        print("\n📍 LOCATION 2: TerraFusionMono (Comprehensive Monorepo)")
        self.scan_terrafusion_mono()

        print("\n📍 LOCATION 3: D: Drive (Master Workspace Collection)")
        self.scan_d_drive()

        # Deduplicate and consolidate
        print("\n🔄 Deduplicating and Consolidating...")
        deduplicated_systems = self.deduplicate_systems()

        # Analyze consolidated results
        print("\n📊 Analyzing Consolidated Results...")
        analysis = self.analyze_consolidated_systems(deduplicated_systems)

        # Generate comprehensive report
        print("\n📝 Generating Comprehensive Multi-Location Report...")
        report = self.generate_comprehensive_report(deduplicated_systems, analysis)

        # Save reports
        self.save_reports(report, deduplicated_systems, analysis)

        return report

    def scan_location(self, location_key: str, max_depth: int = 2):
        """Scan a specific location directory"""
        location_path = self.locations[location_key]

        if not os.path.exists(location_path):
            print(f"⚠️ Location not found: {location_path}")
            return

        systems_found = 0
        for item in os.listdir(location_path):
            item_path = os.path.join(location_path, item)
            if os.path.isdir(item_path):
                if self.is_terrafusion_system(item, item_path):
                    system_data = self.analyze_system(item, item_path, location_key)
                    self.all_systems[item] = system_data
                    self.location_map[item].append(location_key)
                    systems_found += 1
                    print(f"  ✅ {item} ({system_data['type']})")

        print(f"  📊 Found {systems_found} systems in {location_key}")

    def scan_terrafusion_mono(self):
        """Specialized scan for TerraFusionMono monorepo structure"""
        location_key = "terrafusion_mono"
        base_path = self.locations[location_key]

        if not os.path.exists(base_path):
            print(f"⚠️ TerraFusionMono not found: {base_path}")
            return

        systems_found = 0

        # Scan apps/ directory
        apps_path = os.path.join(base_path, "apps")
        if os.path.exists(apps_path):
            print("  📦 Scanning apps/ directory...")
            for app in os.listdir(apps_path):
                app_path = os.path.join(apps_path, app)
                if os.path.isdir(app_path) and not app.startswith('_'):
                    normalized_name = self.normalize_system_name(app)
                    system_data = self.analyze_system(normalized_name, app_path, location_key)
                    system_data['monorepo_location'] = 'apps'

                    if normalized_name not in self.all_systems:
                        self.all_systems[normalized_name] = system_data
                    else:
                        # Merge location data
                        existing = self.all_systems[normalized_name]
                        existing['locations'] = existing.get('locations', []) + [location_key]

                    self.location_map[normalized_name].append(location_key)
                    systems_found += 1
                    print(f"    ✅ {normalized_name} (app)")

        # Scan packages/ directory
        packages_path = os.path.join(base_path, "packages")
        if os.path.exists(packages_path):
            print("  📦 Scanning packages/ directory...")
            for pkg in os.listdir(packages_path):
                pkg_path = os.path.join(packages_path, pkg)
                if os.path.isdir(pkg_path):
                    pkg_name = f"TerraFusionPackage_{pkg}"
                    system_data = self.analyze_system(pkg_name, pkg_path, location_key)
                    system_data['monorepo_location'] = 'packages'
                    system_data['is_shared_package'] = True

                    if pkg_name not in self.all_systems:
                        self.all_systems[pkg_name] = system_data

                    self.location_map[pkg_name].append(location_key)
                    systems_found += 1
                    print(f"    ✅ {pkg_name} (package)")

        # Scan root-level systems
        print("  📦 Scanning root-level systems...")
        for item in os.listdir(base_path):
            item_path = os.path.join(base_path, item)
            if os.path.isdir(item_path) and item not in ['apps', 'packages', 'pyservices', 'node_modules', '.git']:
                if self.is_terrafusion_system(item, item_path):
                    normalized_name = self.normalize_system_name(item)
                    system_data = self.analyze_system(normalized_name, item_path, location_key)
                    system_data['monorepo_location'] = 'root'

                    if normalized_name not in self.all_systems:
                        self.all_systems[normalized_name] = system_data

                    self.location_map[normalized_name].append(location_key)
                    systems_found += 1
                    print(f"    ✅ {normalized_name} (root)")

        print(f"  📊 Found {systems_found} systems/packages in TerraFusionMono")

    def scan_d_drive(self):
        """Scan D: drive master workspace collection"""
        location_key = "d_drive"
        base_path = self.locations[location_key]

        if not os.path.exists(base_path):
            print(f"⚠️ D: drive not found: {base_path}")
            return

        systems_found = 0

        # Key directories to scan on D: drive
        priority_dirs = [
            "TerraFusion_Tauri_Master_Workspace",
            "TerraFusion_Master_Workspace",
            "TerraFusion_Daily_Work",
            "TerraFusion Nexus",
            "TerraFusionDevelopment",
            "BENTON_COUNTY_AI_CHAMPIONSHIP",
            "BENTON_COUNTY_CHAMPIONSHIP_DEMO",
            "BENTON_COUNTY_CHAMPIONSHIP_PLAYBOOK",
            "benton_county_production"
        ]

        for dir_name in priority_dirs:
            dir_path = os.path.join(base_path, dir_name)
            if os.path.exists(dir_path) and os.path.isdir(dir_path):
                print(f"  📁 Scanning {dir_name}...")
                self.scan_directory_recursive(dir_path, location_key, max_depth=2, current_depth=0)
                systems_found += 1

        print(f"  📊 Scanned {systems_found} major directories on D: drive")

    def scan_directory_recursive(self, path: str, location_key: str, max_depth: int, current_depth: int):
        """Recursively scan directory for TerraFusion systems"""
        if current_depth >= max_depth:
            return

        try:
            for item in os.listdir(path):
                item_path = os.path.join(path, item)
                if os.path.isdir(item_path):
                    if self.is_terrafusion_system(item, item_path):
                        normalized_name = self.normalize_system_name(item)

                        if normalized_name not in self.all_systems:
                            system_data = self.analyze_system(normalized_name, item_path, location_key)
                            self.all_systems[normalized_name] = system_data
                            self.location_map[normalized_name].append(location_key)
                            print(f"    ✅ {normalized_name}")
                        elif location_key not in self.location_map[normalized_name]:
                            self.location_map[normalized_name].append(location_key)
                    else:
                        # Continue recursive scan
                        self.scan_directory_recursive(item_path, location_key, max_depth, current_depth + 1)
        except PermissionError:
            pass  # Skip inaccessible directories

    def normalize_system_name(self, name: str) -> str:
        """Normalize system names for deduplication"""
        # Remove common suffixes
        name = name.replace('_PRODUCTION', '').replace('_production', '')
        name = name.replace('_ARCHIVE', '').replace('_archive', '')
        name = name.replace('_OLD_BACKUP', '').replace('_old', '')

        # Standardize casing for TerraFusion products
        if name.lower().startswith('terrafusion'):
            # Keep TerraFusion prefix capitalized
            rest = name[11:]  # After "terrafusion"
            return 'TerraFusion' + rest.capitalize()
        elif name.lower().startswith('terra'):
            rest = name[5:]  # After "terra"
            return 'Terra' + rest.capitalize()
        elif name.lower().startswith('bcbs'):
            rest = name[4:]  # After "bcbs"
            return 'BCBS' + rest.upper() if len(rest) <= 6 else 'BCBS' + rest.capitalize()

        return name

    def is_terrafusion_system(self, name: str, path: str) -> bool:
        """Identify if directory is a TerraFusion system"""
        name_lower = name.lower()

        # TerraFusion naming patterns
        if any(pattern in name_lower for pattern in [
            'terrafusion', 'terra', 'bcbs', 'benton', 'levy', 'pilt',
            'pacs', 'gis', 'cama', 'assessor', 'permit', 'income'
        ]):
            # Check for system markers
            markers = ['package.json', 'requirements.txt', 'setup.py',
                      'tsconfig.json', 'app.py', 'server.py', '.replit']

            for marker in markers:
                if os.path.exists(os.path.join(path, marker)):
                    return True

        return False

    def analyze_system(self, name: str, path: str, location: str) -> Dict:
        """Comprehensive system analysis"""
        try:
            size = sum(f.stat().st_size for f in Path(path).rglob('*') if f.is_file())
            modified = max(f.stat().st_mtime for f in Path(path).rglob('*') if f.is_file())
            modified_date = datetime.fromtimestamp(modified).isoformat()
        except:
            size = 0
            modified_date = "unknown"

        system_type = self.detect_system_type(name, path)
        technologies = self.detect_technologies(path)
        capabilities = self.detect_capabilities(name)
        quantum_readiness = self.calculate_quantum_readiness(technologies)
        integration_potential = self.calculate_integration_potential(capabilities, technologies)
        foundation_value = self.calculate_foundation_value(
            system_type, capabilities, quantum_readiness, integration_potential
        )
        priority = self.determine_priority(foundation_value, integration_potential)

        return {
            'name': name,
            'location': location,
            'path': path,
            'size_bytes': size,
            'last_modified': modified_date,
            'type': system_type,
            'technologies': technologies,
            'capabilities': capabilities,
            'quantum_readiness': quantum_readiness,
            'integration_potential': integration_potential,
            'foundation_value': foundation_value,
            'priority': priority,
            'is_integrated': name in self.integrated_systems
        }

    def detect_system_type(self, name: str, path: str) -> str:
        """Detect system type"""
        name_lower = name.lower()

        if '_production' in name_lower or os.path.exists(os.path.join(path, 'PRODUCTION')):
            return "PRODUCTION"
        elif '_archive' in name_lower or 'archive' in name_lower or 'backup' in name_lower:
            return "ARCHIVE"
        elif '_dev' in name_lower or 'development' in name_lower or 'playground' in name_lower:
            return "DEVELOPMENT"
        else:
            return "ACTIVE"

    def detect_technologies(self, path: str) -> List[str]:
        """Detect technology stack"""
        techs = []

        for tech, markers in self.tech_markers.items():
            for marker in markers:
                if marker.startswith('*'):
                    # File extension check
                    ext = marker[1:]  # Remove *
                    if any(Path(path).rglob(f'*{ext}')):
                        techs.append(tech)
                        break
                else:
                    # Direct file/folder check
                    if os.path.exists(os.path.join(path, marker)):
                        techs.append(tech)
                        break

        return list(set(techs))

    def detect_capabilities(self, name: str) -> List[str]:
        """Detect system capabilities from name"""
        name_lower = name.lower()
        capabilities = []

        for pattern, caps in self.capability_patterns.items():
            if pattern in name_lower:
                capabilities.extend(caps)

        return list(set(capabilities))

    def calculate_quantum_readiness(self, technologies: List[str]) -> int:
        """Calculate quantum readiness score (0-100)"""
        base_score = 70

        # Modern stack bonuses
        if 'TypeScript' in technologies: base_score += 10
        if 'React' in technologies: base_score += 5
        if 'Vite' in technologies: base_score += 5
        if 'PostgreSQL' in technologies: base_score += 5
        if 'Docker' in technologies: base_score += 3
        if 'Kubernetes' in technologies: base_score += 2

        return min(100, base_score)

    def calculate_integration_potential(self, capabilities: List[str], technologies: List[str]) -> int:
        """Calculate integration potential score (0-100)"""
        base_score = 60

        # Capability bonuses
        base_score += len(capabilities) * 3

        # Technology compatibility bonuses
        modern_tech_count = sum(1 for t in technologies if t in [
            'TypeScript', 'React', 'Vite', 'PostgreSQL', 'FastAPI', 'Docker'
        ])
        base_score += modern_tech_count * 4

        return min(100, base_score)

    def calculate_foundation_value(self, system_type: str, capabilities: List[str],
                                   quantum_readiness: int, integration_potential: int) -> float:
        """Calculate foundation enhancement value"""
        base_value = 0.05

        # Production bonus
        if system_type == "PRODUCTION":
            base_value += 0.02

        # Capability bonus
        capability_bonus = len(capabilities) * 0.01

        # Quantum readiness multiplier
        readiness_multiplier = quantum_readiness / 100

        # Integration potential multiplier
        integration_multiplier = integration_potential / 100

        total_value = (base_value + capability_bonus) * readiness_multiplier * integration_multiplier

        return round(total_value, 3)

    def determine_priority(self, foundation_value: float, integration_potential: int) -> str:
        """Determine integration priority"""
        if foundation_value >= 0.10 and integration_potential >= 90:
            return "CRITICAL"
        elif foundation_value >= 0.08 and integration_potential >= 80:
            return "HIGH"
        elif foundation_value >= 0.05 and integration_potential >= 70:
            return "MEDIUM"
        else:
            return "LOW"

    def deduplicate_systems(self) -> Dict[str, Dict]:
        """Deduplicate systems found in multiple locations"""
        deduplicated = {}

        for system_name, system_data in self.all_systems.items():
            locations = self.location_map.get(system_name, [])

            if system_name in deduplicated:
                # Merge location data
                deduplicated[system_name]['locations'] = list(set(
                    deduplicated[system_name].get('locations', []) + locations
                ))
            else:
                system_data['locations'] = locations
                system_data['location_count'] = len(locations)
                deduplicated[system_name] = system_data

        return deduplicated

    def analyze_consolidated_systems(self, systems: Dict[str, Dict]) -> Dict:
        """Analyze consolidated system collection"""
        total_systems = len(systems)
        integrated = sum(1 for s in systems.values() if s['is_integrated'])
        unintegrated = total_systems - integrated

        # Priority breakdown
        priority_counts = defaultdict(int)
        for system in systems.values():
            if not system['is_integrated']:
                priority_counts[system['priority']] += 1

        # Calculate total foundation potential
        total_potential = sum(s['foundation_value'] for s in systems.values() if not s['is_integrated'])

        # Multi-location systems
        multi_location = sum(1 for s in systems.values() if s['location_count'] > 1)

        # Technology analysis
        all_technologies = set()
        for system in systems.values():
            all_technologies.update(system['technologies'])

        # Capability analysis
        all_capabilities = set()
        for system in systems.values():
            all_capabilities.update(system['capabilities'])

        return {
            'total_systems': total_systems,
            'integrated_systems': integrated,
            'unintegrated_systems': unintegrated,
            'priority_breakdown': dict(priority_counts),
            'total_foundation_potential': round(total_potential, 3),
            'multi_location_systems': multi_location,
            'unique_technologies': sorted(list(all_technologies)),
            'unique_capabilities': sorted(list(all_capabilities)),
            'current_foundation': 12.05,
            'ultimate_foundation': round(12.05 + total_potential, 3)
        }

    def generate_comprehensive_report(self, systems: Dict, analysis: Dict) -> Dict:
        """Generate comprehensive multi-location report"""
        # Sort systems by foundation value
        sorted_systems = sorted(
            [s for s in systems.values() if not s['is_integrated']],
            key=lambda x: x['foundation_value'],
            reverse=True
        )

        # Top 15 integration opportunities
        top_opportunities = sorted_systems[:15]

        return {
            'discovery_metadata': {
                'discovery_date': datetime.now().isoformat(),
                'quantum_factor': self.quantum_factor,
                'terra_cyan': self.terra_cyan,
                'golden_ratio': self.golden_ratio,
                'locations_scanned': list(self.locations.keys())
            },
            'executive_summary': {
                'total_systems_discovered': analysis['total_systems'],
                'already_integrated': analysis['integrated_systems'],
                'unintegrated_opportunities': analysis['unintegrated_systems'],
                'multi_location_systems': analysis['multi_location_systems'],
                'current_foundation_score': analysis['current_foundation'],
                'total_enhancement_potential': analysis['total_foundation_potential'],
                'ultimate_foundation_score': analysis['ultimate_foundation'],
                'transcendence_level': 'BEYOND TRANSCENDENCE' if analysis['ultimate_foundation'] > 13.0 else 'TRANSCENDENT'
            },
            'priority_breakdown': analysis['priority_breakdown'],
            'top_integration_opportunities': [
                {
                    'rank': idx + 1,
                    'name': s['name'],
                    'foundation_value': s['foundation_value'],
                    'priority': s['priority'],
                    'quantum_readiness': s['quantum_readiness'],
                    'integration_potential': s['integration_potential'],
                    'capabilities': s['capabilities'],
                    'technologies': s['technologies'],
                    'locations': s['locations'],
                    'system_type': s['type']
                }
                for idx, s in enumerate(top_opportunities)
            ],
            'technology_ecosystem': {
                'unique_technologies': analysis['unique_technologies'],
                'technology_count': len(analysis['unique_technologies'])
            },
            'capability_ecosystem': {
                'unique_capabilities': analysis['unique_capabilities'],
                'capability_count': len(analysis['unique_capabilities'])
            },
            'all_systems': list(systems.values())
        }

    def save_reports(self, report: Dict, systems: Dict, analysis: Dict):
        """Save comprehensive reports to files"""
        # JSON report
        json_path = "TERRAFUSION_COMPREHENSIVE_DISCOVERY_REPORT.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print(f"\n✅ Saved: {json_path}")

        # Markdown summary
        md_path = "COMPREHENSIVE_MULTI_LOCATION_DISCOVERY.md"
        self.generate_markdown_report(report, analysis, md_path)
        print(f"✅ Saved: {md_path}")

        # Display summary
        self.display_summary(report, analysis)

    def generate_markdown_report(self, report: Dict, analysis: Dict, path: str):
        """Generate comprehensive markdown report"""
        with open(path, 'w', encoding='utf-8') as f:
            f.write("# 🌐 TerraFusion Elite Comprehensive Multi-Location Discovery\n\n")
            f.write("**Government. Transcended.** - Complete Ecosystem Discovery Across All Locations\n\n")
            f.write(f"**Quantum Factor:** {self.quantum_factor} | ")
            f.write(f"**Terra-Cyan:** {self.terra_cyan} | ")
            f.write(f"**Golden Ratio φ:** {self.golden_ratio}\n\n")

            f.write("## 📊 Executive Summary\n\n")
            summary = report['executive_summary']
            f.write(f"- **Total Systems Discovered:** {summary['total_systems_discovered']}\n")
            f.write(f"- **Already Integrated:** {summary['already_integrated']}\n")
            f.write(f"- **Unintegrated Opportunities:** {summary['unintegrated_opportunities']}\n")
            f.write(f"- **Multi-Location Systems:** {summary['multi_location_systems']}\n")
            f.write(f"- **Current Foundation:** {summary['current_foundation_score']}/12 (BEYOND PERFECTION)\n")
            f.write(f"- **Total Enhancement Potential:** +{summary['total_enhancement_potential']}\n")
            f.write(f"- **Ultimate Foundation Score:** **{summary['ultimate_foundation_score']}/12** ({summary['transcendence_level']})\n\n")

            f.write("## 🎯 Priority Breakdown\n\n")
            f.write("| Priority | Count |\n")
            f.write("|----------|-------|\n")
            for priority, count in sorted(report['priority_breakdown'].items()):
                f.write(f"| {priority} | {count} |\n")
            f.write("\n")

            f.write("## 🏆 Top 15 Integration Opportunities\n\n")
            for opp in report['top_integration_opportunities']:
                f.write(f"### {opp['rank']}. {opp['name']}\n\n")
                f.write(f"**Foundation Value:** +{opp['foundation_value']} | ")
                f.write(f"**Priority:** {opp['priority']} | ")
                f.write(f"**Quantum Readiness:** {opp['quantum_readiness']}%\n\n")
                f.write(f"**Integration Potential:** {opp['integration_potential']}%\n\n")
                f.write(f"**Locations:** {', '.join(opp['locations'])}\n\n")
                f.write(f"**Type:** {opp['system_type']}\n\n")
                f.write(f"**Capabilities:**\n")
                for cap in opp['capabilities']:
                    f.write(f"- {cap}\n")
                f.write(f"\n**Technologies:**\n")
                for tech in opp['technologies']:
                    f.write(f"- {tech}\n")
                f.write("\n---\n\n")

            f.write("## 🔧 Technology Ecosystem\n\n")
            f.write(f"**{len(analysis['unique_technologies'])} Unique Technologies Detected:**\n\n")
            for tech in analysis['unique_technologies']:
                f.write(f"- {tech}\n")
            f.write("\n")

            f.write("## 🎨 Capability Ecosystem\n\n")
            f.write(f"**{len(analysis['unique_capabilities'])} Unique Capabilities Identified:**\n\n")
            for cap in analysis['unique_capabilities']:
                f.write(f"- {cap}\n")
            f.write("\n")

        print(f"✅ Generated markdown report: {path}")

    def display_summary(self, report: Dict, analysis: Dict):
        """Display beautiful terminal summary"""
        summary = report['executive_summary']

        print("\n" + "="*80)
        print("🌐 TERRAFUSION COMPREHENSIVE DISCOVERY - COMPLETE")
        print("="*80)
        print(f"\n📊 TOTAL SYSTEMS: {summary['total_systems_discovered']}")
        print(f"✅ INTEGRATED: {summary['already_integrated']}")
        print(f"🆕 UNINTEGRATED: {summary['unintegrated_opportunities']}")
        print(f"📍 MULTI-LOCATION: {summary['multi_location_systems']}")
        print(f"\n🏆 CURRENT FOUNDATION: {summary['current_foundation_score']}/12 (BEYOND PERFECTION)")
        print(f"💎 ENHANCEMENT POTENTIAL: +{summary['total_enhancement_potential']}")
        print(f"🌟 ULTIMATE FOUNDATION: {summary['ultimate_foundation_score']}/12 ({summary['transcendence_level']})")
        print(f"\n🎯 PRIORITY BREAKDOWN:")
        for priority, count in sorted(report['priority_breakdown'].items()):
            print(f"   {priority}: {count} systems")
        print(f"\n🔧 TECHNOLOGY STACK: {len(analysis['unique_technologies'])} unique technologies")
        print(f"🎨 CAPABILITY STACK: {len(analysis['unique_capabilities'])} unique capabilities")
        print("\n" + "="*80)
        print("Government. Transcended. - Complete Ecosystem Discovered.")
        print("="*80 + "\n")

if __name__ == "__main__":
    discovery = TerraFusionComprehensiveDiscovery()
    report = discovery.discover_all_locations()

    print(f"\n✨ Discovery complete! Check reports for detailed analysis.")
