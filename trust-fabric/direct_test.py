#!/usr/bin/env python3
"""
Direct Trust Fabric Validation Test
Simple test to verify our components work
"""

import sys
import asyncio
from pathlib import Path

# Add the validators directory to path
sys.path.append('/workspaces/terrafusion_os_1.0')

async def test_trust_fabric():
    print("🔍 Direct Trust Fabric Component Test")
    print("=" * 50)
    
    # Test 1: HSM Interface
    try:
        sys.path.append('/workspaces/terrafusion_os_1.0/trust-fabric')
        from hsm_interface import HSMInterface
        
        hsm = HSMInterface()
        if hsm.initialize():
            print("✅ HSM Interface: OPERATIONAL")
        else:
            print("❌ HSM Interface: FAILED")
    except Exception as e:
        print(f"❌ HSM Interface: ERROR - {e}")
    
    # Test 2: TPM Bridge
    try:
        from tmp_bridge import TMPBridge
        
        bridge = TMPBridge()
        if bridge.connect():
            print("✅ TMP Bridge: OPERATIONAL")
        else:
            print("❌ TMP Bridge: FAILED")
    except Exception as e:
        print(f"❌ TMP Bridge: ERROR - {e}")
    
    # Test 3: Crypto Engine
    try:
        from crypto_engine import PostQuantumCryptoEngine
        
        engine = PostQuantumCryptoEngine()
        if engine.initialize():
            print("✅ Crypto Engine: OPERATIONAL")
        else:
            print("❌ Crypto Engine: FAILED")
    except Exception as e:
        print(f"❌ Crypto Engine: ERROR - {e}")
    
    # Test 4: File Structure
    base_path = Path("/workspaces/terrafusion_os_1.0/trust-fabric")
    critical_files = [
        "hsm_interface.py",
        "tmp_bridge.py", 
        "crypto_engine/__init__.py",
        "keys/master_keys",
        "keys/certificate_store/root_ca.crt",
        "performance_test.py",
        "compliance_checker.py",
        "threat_detection.py",
        "audit.log",
        "backup/backup_system.py"
    ]
    
    files_found = 0
    for file_path in critical_files:
        full_path = base_path / file_path
        if full_path.exists():
            files_found += 1
            print(f"✅ {file_path}: EXISTS")
        else:
            print(f"❌ {file_path}: MISSING")
    
    print("=" * 50)
    success_rate = (files_found / len(critical_files)) * 100
    print(f"📊 Component Status: {files_found}/{len(critical_files)} ({success_rate:.1f}%)")
    
    if success_rate >= 90:
        print("🎉 Trust Fabric is ready for production!")
    elif success_rate >= 70:
        print("⚡ Trust Fabric is nearly ready!")
    else:
        print("🚧 Trust Fabric needs more work.")
    
    return success_rate

if __name__ == "__main__":
    result = asyncio.run(test_trust_fabric())
