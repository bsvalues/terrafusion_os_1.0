#!/usr/bin/env python3
"""
TerraFusion OS - Phase C.2 TerraAgent AI Coordination System Validation
Championship Excellence Standards with Foundation Score Measurement
"""

import os
import sys
import json
import subprocess
import requests
from datetime import datetime
from pathlib import Path

def validate_terra_agent_phase():
    """Phase C.2 TerraAgent AI Coordination System Validation"""

    print('🎯 PHASE C.2 TERRAAGENT VALIDATION - Championship Excellence Standards')
    print('=' * 80)

    # Foundation score tracking
    current_foundation_score = 12.368  # Phase C.1 completion
    target_foundation_score = 12.488   # Phase C.2 target (+0.12)

    validation_results = {
        'phase': 'C.2',
        'module': 'TerraAgent',
        'target_enhancement': 0.12,
        'validation_timestamp': datetime.now().isoformat(),
        'scores': {},
        'validations': {}
    }

    terra_agent_path = Path('c:/Users/bsval/terrafusion_os_1.0/SDK/modules/terra-agent')

    # Validation 1: Development Server Operational (25%)
    try:
        response = requests.get('http://localhost:5014', timeout=5)
        if response.status_code == 200:
            validation_results['validations']['dev_server'] = 'PASS'
            validation_results['scores']['dev_server'] = 0.03  # 25% of 0.12
            print('✅ Development Server: OPERATIONAL on port 5014')
        else:
            validation_results['validations']['dev_server'] = 'FAIL'
            validation_results['scores']['dev_server'] = 0.0
            print('❌ Development Server: FAILED - Non-200 response')
    except Exception as e:
        validation_results['validations']['dev_server'] = 'FAIL'
        validation_results['scores']['dev_server'] = 0.0
        print(f'❌ Development Server: FAILED - {str(e)}')

    # Validation 2: TypeScript Zero Errors (30%)
    try:
        result = subprocess.run(['npm', 'run', 'type-check'],
                              cwd=str(terra_agent_path),
                              capture_output=True, text=True, timeout=30)
        if result.returncode == 0:
            validation_results['validations']['typescript'] = 'PASS'
            validation_results['scores']['typescript'] = 0.036  # 30% of 0.12
            print('✅ TypeScript Compilation: ZERO ERRORS - Championship Standard')
        else:
            validation_results['validations']['typescript'] = 'FAIL'
            validation_results['scores']['typescript'] = 0.0
            print('❌ TypeScript Compilation: ERRORS DETECTED')
            print(result.stderr[:200] if result.stderr else 'Unknown error')
    except Exception as e:
        validation_results['validations']['typescript'] = 'FAIL'
        validation_results['scores']['typescript'] = 0.0
        print(f'❌ TypeScript Compilation: FAILED - {str(e)}')

    # Validation 3: Build Success (20%)
    build_success = False
    try:
        result = subprocess.run(['npm', 'run', 'build'],
                              cwd=str(terra_agent_path),
                              capture_output=True, text=True, timeout=60)
        if result.returncode == 0 and 'built in' in result.stdout:
            validation_results['validations']['build'] = 'PASS'
            validation_results['scores']['build'] = 0.024  # 20% of 0.12
            print('✅ Production Build: SUCCESS - Optimized bundles created')
            build_success = True
        else:
            validation_results['validations']['build'] = 'FAIL'
            validation_results['scores']['build'] = 0.0
            print('❌ Production Build: FAILED')
    except Exception as e:
        validation_results['validations']['build'] = 'FAIL'
        validation_results['scores']['build'] = 0.0
        print(f'❌ Production Build: FAILED - {str(e)}')

    # Validation 4: AI Agent Component Architecture (25%)
    essential_files = [
        'src/components/TerraAgentDashboard.tsx',
        'src/hooks/useAgentData.ts',
        'src/types/index.ts',
        'src/data/mockData.ts',
        'src/App.tsx',
        'src/main.tsx',
        'src/index.css',
        'package.json'
    ]

    architecture_score = 0
    files_found = 0

    for file in essential_files:
        file_path = terra_agent_path / file
        try:
            if file_path.exists():
                content = file_path.read_text(encoding='utf-8')
                if len(content) > 100:  # Ensure substantial content
                    architecture_score += 0.00375  # 3.125% each for 8 files = 25% of 0.12
                    files_found += 1
        except Exception as e:
            print(f'❌ Error reading {file}: {str(e)}')

    if files_found >= 7:  # 87.5%+ of files present
        validation_results['validations']['architecture'] = 'PASS'
        validation_results['scores']['architecture'] = 0.03
        print(f'✅ AI Agent Architecture: COMPLETE - {files_found}/{len(essential_files)} files present')
    elif files_found >= 5:  # 62.5%+ of files present
        validation_results['validations']['architecture'] = 'PARTIAL'
        validation_results['scores']['architecture'] = 0.02
        print(f'⚠️ AI Agent Architecture: PARTIAL - {files_found}/{len(essential_files)} files present')
    else:
        validation_results['validations']['architecture'] = 'FAIL'
        validation_results['scores']['architecture'] = 0.0
        print(f'❌ AI Agent Architecture: INCOMPLETE - {files_found}/{len(essential_files)} files present')

    # Calculate total achievement
    total_score = sum(validation_results['scores'].values())
    achieved_foundation_score = current_foundation_score + total_score

    validation_results['current_foundation_score'] = current_foundation_score
    validation_results['target_foundation_score'] = target_foundation_score
    validation_results['total_enhancement'] = total_score
    validation_results['achieved_foundation_score'] = achieved_foundation_score
    validation_results['success_percentage'] = (total_score / 0.12) * 100

    print('\n' + '=' * 80)
    print('🏆 PHASE C.2 TERRAAGENT COMPLETION SUMMARY')
    print('=' * 80)
    print(f'Foundation Score Enhancement: +{total_score:.3f} (Target: +0.120)')
    print(f'Achievement Percentage: {validation_results["success_percentage"]:.1f}%')
    print(f'Current Foundation Score: {achieved_foundation_score:.3f}')
    print(f'Target Foundation Score: {target_foundation_score:.3f}')

    # Component-specific validation details
    print('\n📊 VALIDATION BREAKDOWN:')
    print(f'  🖥️  Development Server:     {validation_results["validations"]["dev_server"]:>8} (+{validation_results["scores"]["dev_server"]:.3f})')
    print(f'  📝 TypeScript Compilation: {validation_results["validations"]["typescript"]:>8} (+{validation_results["scores"]["typescript"]:.3f})')
    print(f'  📦 Production Build:       {validation_results["validations"]["build"]:>8} (+{validation_results["scores"]["build"]:.3f})')
    print(f'  🏗️  Architecture:           {validation_results["validations"]["architecture"]:>8} (+{validation_results["scores"]["architecture"]:.3f})')

    if achieved_foundation_score >= target_foundation_score:
        print('\n🎉 PHASE C.2 TERRAAGENT: CHAMPIONSHIP EXCELLENCE ACHIEVED!')
        print('✨ Government. Transcended. - AI Agent Coordination System Complete')
        print('🚀 Ready for Phase C.3 TerraFusionPermit (+0.11 enhancement target)')
        return True
    else:
        gap = target_foundation_score - achieved_foundation_score
        print(f'\n⚠️ Phase C.2 TerraAgent: {gap:.3f} points remaining for completion')
        if validation_results['success_percentage'] >= 90:
            print('🔥 Near completion! Minor refinements needed for championship excellence.')
        return False

if __name__ == '__main__':
    try:
        validate_terra_agent_phase()
    except Exception as e:
        print(f'❌ Validation failed: {str(e)}')
        sys.exit(1)
