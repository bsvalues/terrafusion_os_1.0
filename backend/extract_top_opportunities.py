#!/usr/bin/env python3
"""
Extract Top Integration Opportunities for Phase C.1
"""

import sys
import os
sys.path.append('c:/Users/bsval/terrafusion_os_1.0')

# Import and run discovery
exec(open('../discover-all-locations-comprehensive.py').read())

# Get the top opportunities
discovery = TerraFusionComprehensiveDiscovery()
report = discovery.discover_all_locations()

print('\n🏆 TOP 10 INTEGRATION OPPORTUNITIES FOR PHASE C.1:')
print('=' * 70)

for i, opp in enumerate(report['top_integration_opportunities'][:10]):
    print(f'{i+1}. {opp["name"]}')
    print(f'   Foundation Value: +{opp["foundation_value"]}')
    print(f'   Priority: {opp["priority"]}')
    print(f'   Quantum Readiness: {opp["quantum_readiness"]}%')
    print(f'   Integration Potential: {opp["integration_potential"]}%')
    print(f'   System Type: {opp["system_type"]}')
    print(f'   Technologies: {", ".join(opp["technologies"])}')
    print(f'   Capabilities: {", ".join(opp["capabilities"][:5])}{"..." if len(opp["capabilities"]) > 5 else ""}')
    print('')

print(f'\n📊 SUMMARY:')
print(f'Total Unintegrated: {report["executive_summary"]["unintegrated_opportunities"]}')
print(f'Current Foundation: {report["executive_summary"]["current_foundation_score"]}')
print(f'Ultimate Foundation: {report["executive_summary"]["ultimate_foundation_score"]}')
print(f'Enhancement Potential: +{report["executive_summary"]["total_enhancement_potential"]}')