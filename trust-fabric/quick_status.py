#!/usr/bin/env python3
"""
Quick Trust Fabric Status Check
"""

import os
from pathlib import Path

def check_trust_fabric_status():
    base_path = Path("/workspaces/terrafusion_os_1.0/trust-fabric")
    
    components = {
        "HSM Interface": base_path / "hsm_interface.py",
        "TMP Bridge": base_path / "tmp_bridge.py", 
        "TPM Bridge": base_path / "tmp_bridge.py",
        "Crypto Engine": base_path / "crypto_engine" / "__init__.py",
        "Master Keys Dir": base_path / "keys" / "master_keys",
        "Session Keys Dir": base_path / "keys" / "session_keys", 
        "Certificate Store": base_path / "keys" / "certificate_store",
        "Root CA": base_path / "keys" / "certificate_store" / "root_ca.crt",
        "Intermediate CA": base_path / "keys" / "certificate_store" / "intermediate_ca.crt",
        "CA Private Key": base_path / "keys" / "certificate_store" / "ca_private.key",
        "CRL": base_path / "keys" / "certificate_store" / "crl.pem",
        "Performance Test": base_path / "performance_test.py",
        "Compliance Checker": base_path / "compliance_checker.py",
        "Threat Detection": base_path / "threat_detection.py",
        "Audit Log": base_path / "audit.log",
        "Backup Directory": base_path / "backup",
        "Backup System": base_path / "backup" / "backup_system.py"
    }
    
    print("🔍 Trust Fabric Component Status Check")
    print("=" * 50)
    
    total = len(components)
    found = 0
    
    for name, path in components.items():
        exists = path.exists()
        status = "✅" if exists else "❌"
        print(f"{status} {name}")
        if exists:
            found += 1
    
    print("=" * 50)
    success_rate = (found / total) * 100
    print(f"📊 Components Found: {found}/{total} ({success_rate:.1f}%)")
    
    if success_rate >= 90:
        print("🎉 Trust Fabric components are mostly ready!")
    elif success_rate >= 70:
        print("⚡ Trust Fabric is making good progress!")
    else:
        print("🚧 Trust Fabric needs more components.")
    
    return success_rate

if __name__ == "__main__":
    check_trust_fabric_status()
