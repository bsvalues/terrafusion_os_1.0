"""
Trust Fabric Validation - 11-Layer Security Validation
MIT PhD-Level Post-Quantum Cryptographic Engine Validation
"""

import asyncio
import requests
import subprocess
import hashlib
import os
from pathlib import Path
from typing import Tuple, Dict, Any


class TrustFabricValidation:
    """
    11-Layer validation specifically for Trust Fabric cryptographic kernel
    """
    
    def __init__(self):
        self.trust_fabric_path = "/workspaces/terrafusion_os_1.0/trust-fabric"
        self.component_path = self.trust_fabric_path  # Add this alias
        self.hsm_interface_path = "/workspaces/terrafusion_os_1.0/trust-fabric/hsm_interface.py"
        self.crypto_engine_path = "/workspaces/terrafusion_os_1.0/trust-fabric/crypto_engine"
        self.ca_path = "/workspaces/terrafusion_os_1.0/trust-fabric/ca"
        self.keystore_path = "/workspaces/terrafusion_os_1.0/trust-fabric/keystore"
        
        # Layer descriptions for validation reporting
        self.layer_descriptions = {
            1: "Hardware Security Module Integration",
            2: "Post-Quantum Cryptographic Engine",
            3: "Key Management System",
            4: "Certificate Authority Validation",
            5: "Cryptographic Performance Testing",
            6: "Security Protocol Compliance",
            7: "API Gateway Security",
            8: "Audit Trail Integrity",
            9: "Threat Detection System",
            10: "Backup & Recovery Validation",
            11: "Integration Point Security"
        }
    
    async def validate_layer_1(self) -> Tuple[bool, str]:
        """Layer 1: Hardware Security Module Integration"""
        try:
            # Check for TPM/HSM support files
            required_files = [
                "core.py",
                "hsm_interface.py", 
                "tpm_bridge.py",
                "requirements.txt"
            ]
            
            missing_files = []
            for file in required_files:
                if not (self.component_path / file).exists():
                    missing_files.append(file)
            
            if missing_files:
                return False, f"Missing HSM files: {', '.join(missing_files)}"
            
            # Check if TPM is accessible
            try:
                result = subprocess.run(['python3', str(self.component_path / 'core.py'), '--test-hsm'], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    return True, "HSM integration operational"
                else:
                    return False, f"HSM test failed: {result.stderr}"
            except subprocess.TimeoutExpired:
                return False, "HSM test timeout"
            except Exception as e:
                return False, f"HSM integration error: {str(e)}"
                
        except Exception as e:
            return False, f"Layer 1 validation exception: {str(e)}"
    
    async def validate_layer_2(self) -> Tuple[bool, str]:
        """Layer 2: Post-Quantum Cryptographic Engine"""
        try:
            # Check for post-quantum crypto libraries
            pq_algorithms = [
                "kyber_512",
                "kyber_768", 
                "kyber_1024",
                "dilithium_2",
                "sphincs_plus"
            ]
            
            # Test cryptographic functionality
            try:
                result = subprocess.run([
                    'python3', '-c', 
                    '''
import sys; sys.path.append("trust-fabric")
from crypto_engine import PostQuantumEngine
engine = PostQuantumEngine()
test_data = b"TerraFusion OS Test Message"
encrypted = engine.encrypt(test_data)  
decrypted = engine.decrypt(encrypted)
assert test_data == decrypted
print("Post-quantum cryptography operational")
                    '''
                ], capture_output=True, text=True, timeout=15)
                
                if result.returncode == 0:
                    return True, "Post-quantum cryptographic engine operational"
                else:
                    return False, f"PQ crypto test failed: {result.stderr}"
                    
            except subprocess.TimeoutExpired:
                return False, "Post-quantum crypto test timeout"
                
        except Exception as e:
            return False, f"Layer 2 validation exception: {str(e)}"
    
    async def validate_layer_3(self) -> Tuple[bool, str]:
        """Layer 3: Key Management System"""
        try:
            # Test enhanced key management system
            key_manager_path = os.path.join(self.trust_fabric_path, 'key_manager_enhanced.py')
            if not os.path.exists(key_manager_path):
                # Fallback to basic key manager
                key_manager_path = os.path.join(self.trust_fabric_path, 'key_manager.py')
                if not os.path.exists(key_manager_path):
                    return False, "Key manager not found"
            
            # Run key management test
            result = subprocess.run([
                'python3', key_manager_path
            ], cwd=self.trust_fabric_path, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                return True, "Key management system operational"
            else:
                return False, f"Key management test failed: {result.stderr}"
                
        except subprocess.TimeoutExpired:
            return False, "Key management test timeout"
        except Exception as e:
            return False, f"Layer 3 validation exception: {str(e)}"
    
    async def _test_layer_3_key_management(self) -> bool:
        """Test key management system"""
        try:
            # Test enhanced key management system
            key_manager_path = os.path.join(self.trust_fabric_path, 'key_manager_enhanced.py')
            if not os.path.exists(key_manager_path):
                # Fallback to basic key manager
                key_manager_path = os.path.join(self.trust_fabric_path, 'key_manager.py')
                if not os.path.exists(key_manager_path):
                    self._add_failure("Key manager not found")
                    return False
            
            # Run key management test
            result = subprocess.run([
                'python3', key_manager_path
            ], cwd=self.trust_fabric_path, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                return True
            else:
                # Try to parse and understand the error
                error_msg = result.stderr.strip() if result.stderr else "Unknown error"
                if "ModuleNotFoundError" in error_msg and "cryptography" in error_msg:
                    # Install required dependency
                    install_result = subprocess.run([
                        'pip', 'install', 'cryptography'
                    ], capture_output=True, text=True, timeout=60)
                    if install_result.returncode == 0:
                        # Retry the test
                        retry_result = subprocess.run([
                            'python3', key_manager_path
                        ], cwd=self.trust_fabric_path, capture_output=True, text=True, timeout=30)
                        if retry_result.returncode == 0:
                            return True
                
                self._add_failure(f"Key management test failed: {error_msg}")
                return False
                
        except Exception as e:
            self._add_failure(f"Key management validation error: {e}")
            return False
    
    async def validate_layer_4(self) -> Tuple[bool, str]:
        """Layer 4: Certificate Authority Validation"""
        try:
            ca_path = self.component_path / "ca"
            
            # Check CA infrastructure
            required_ca_files = [
                "root_ca.crt",
                "intermediate_ca.crt", 
                "ca_private.key",
                "crl.pem"
            ]
            
            missing_ca_files = []
            for file in required_ca_files:
                if not (ca_path / file).exists():
                    missing_ca_files.append(file)
            
            if missing_ca_files:
                return False, f"Missing CA files: {', '.join(missing_ca_files)}"
            
            # Test certificate validation
            try:
                result = subprocess.run([
                    'python3', str(self.component_path / 'ca_validator.py'), '--verify-chain'
                ], capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    return True, "Certificate Authority operational"
                else:
                    return False, f"CA validation failed: {result.stderr}"
                    
            except subprocess.TimeoutExpired:
                return False, "CA validation timeout"
                
        except Exception as e:
            return False, f"Layer 4 validation exception: {str(e)}"
    
    async def validate_layer_5(self) -> Tuple[bool, str]:
        """Layer 5: Cryptographic Performance Testing"""
        try:
            # Test encryption/decryption performance
            test_data_sizes = [1024, 10240, 102400]  # 1KB, 10KB, 100KB
            
            performance_results = []
            
            for size in test_data_sizes:
                try:
                    result = subprocess.run([
                        'python3', str(self.component_path / 'performance_test.py'), 
                        '--size', str(size), '--iterations', '100'
                    ], capture_output=True, text=True, timeout=30)
                    
                    if result.returncode == 0:
                        # Parse performance results
                        output_lines = result.stdout.strip().split('\n')
                        last_line = output_lines[-1]
                        if "ops/sec" in last_line:
                            performance_results.append(last_line)
                    else:
                        return False, f"Performance test failed for {size} bytes: {result.stderr}"
                        
                except subprocess.TimeoutExpired:
                    return False, f"Performance test timeout for {size} bytes"
            
            if performance_results:
                return True, f"Crypto performance validated: {'; '.join(performance_results)}"
            else:
                return False, "No performance results obtained"
                
        except Exception as e:
            return False, f"Layer 5 validation exception: {str(e)}"
    
    async def validate_layer_6(self) -> Tuple[bool, str]:
        """Layer 6: Security Protocol Compliance"""
        try:
            # Check compliance with security standards
            compliance_checks = [
                "FIPS_140_2",
                "Common_Criteria", 
                "NIST_800_53",
                "FISMA_High"
            ]
            
            compliance_results = {}
            
            for standard in compliance_checks:
                try:
                    result = subprocess.run([
                        'python3', str(self.component_path / 'compliance_checker.py'), 
                        '--standard', standard
                    ], capture_output=True, text=True, timeout=15)
                    
                    compliance_results[standard] = result.returncode == 0
                    
                except subprocess.TimeoutExpired:
                    compliance_results[standard] = False
            
            passed_standards = [k for k, v in compliance_results.items() if v]
            failed_standards = [k for k, v in compliance_results.items() if not v]
            
            if len(passed_standards) >= 3:  # At least 3 out of 4 standards
                return True, f"Security compliance validated: {', '.join(passed_standards)}"
            else:
                return False, f"Compliance failures: {', '.join(failed_standards)}"
                
        except Exception as e:
            return False, f"Layer 6 validation exception: {str(e)}"
    
    async def validate_layer_7(self) -> Tuple[bool, str]:
        """Layer 7: API Gateway Security"""
        try:
            # Test API security headers and authentication
            api_security_path = os.path.join(self.trust_fabric_path, 'api_security.py')
            if not os.path.exists(api_security_path):
                return False, "API security module not found"
            
            result = subprocess.run([
                'python3', api_security_path
            ], cwd=self.trust_fabric_path, capture_output=True, text=True, timeout=20)
            
            if result.returncode == 0:
                return True, "API security operational"
            else:
                return False, f"API security test failed: {result.stderr}"
                
        except subprocess.TimeoutExpired:
            return False, "API security test timeout"
        except Exception as e:
            return False, f"Layer 7 validation exception: {str(e)}"
    
    async def validate_layer_8(self) -> Tuple[bool, str]:
        """Layer 8: Audit Trail Integrity"""
        try:
            audit_log_path = self.component_path / "logs" / "audit.log"
            
            if not audit_log_path.exists():
                return False, "Audit log file not found"
            
            # Check audit log format and integrity
            try:
                result = subprocess.run([
                    'python3', str(self.component_path / 'audit_validator.py'), 
                    '--verify-integrity'
                ], capture_output=True, text=True, timeout=10)
                
                if result.returncode == 0:
                    return True, "Audit trail integrity validated"
                else:
                    return False, f"Audit integrity check failed: {result.stderr}"
                    
            except subprocess.TimeoutExpired:
                return False, "Audit integrity check timeout"
                
        except Exception as e:
            return False, f"Layer 8 validation exception: {str(e)}"
    
    async def validate_layer_9(self) -> Tuple[bool, str]:
        """Layer 9: Threat Detection System"""
        try:
            # Test intrusion detection capabilities
            threat_detection_tests = [
                "sql_injection",
                "buffer_overflow",
                "timing_attack",
                "side_channel"
            ]
            
            detection_results = {}
            
            for test_type in threat_detection_tests:
                try:
                    result = subprocess.run([
                        'python3', str(self.component_path / 'threat_detector.py'), 
                        '--test', test_type
                    ], capture_output=True, text=True, timeout=10)
                    
                    detection_results[test_type] = result.returncode == 0
                    
                except subprocess.TimeoutExpired:
                    detection_results[test_type] = False
            
            detected_threats = [k for k, v in detection_results.items() if v]
            
            if len(detected_threats) >= 3:  # At least 3 out of 4 threat types
                return True, f"Threat detection operational: {', '.join(detected_threats)}"
            else:
                return False, f"Threat detection failures: {len(detected_threats)}/4 tests passed"
                
        except Exception as e:
            return False, f"Layer 9 validation exception: {str(e)}"
    
    async def validate_layer_10(self) -> Tuple[bool, str]:
        """Layer 10: Backup & Recovery Validation"""
        try:
            backup_path = self.component_path / "backups"
            
            if not backup_path.exists():
                return False, "Backup directory not found"
            
            # Test backup and recovery procedures
            try:
                result = subprocess.run([
                    'python3', str(self.component_path / 'backup_manager.py'), 
                    '--test-recovery'
                ], capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    return True, "Backup and recovery validated"
                else:
                    return False, f"Backup/recovery test failed: {result.stderr}"
                    
            except subprocess.TimeoutExpired:
                return False, "Backup/recovery test timeout"
                
        except Exception as e:
            return False, f"Layer 10 validation exception: {str(e)}"
    
    async def validate_layer_11(self) -> Tuple[bool, str]:
        """Layer 11: Integration Point Security"""
        try:
            # Test security at all component integration points
            integration_security_path = os.path.join(self.trust_fabric_path, 'integration_security.py')
            if not os.path.exists(integration_security_path):
                return False, "Integration security module not found"
                
            result = subprocess.run([
                'python3', integration_security_path
            ], cwd=self.trust_fabric_path, capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0:
                return True, "Integration point security operational"
            else:
                return False, f"Integration security test failed: {result.stderr}"
                
        except subprocess.TimeoutExpired:
            return False, "Integration security test timeout"
        except Exception as e:
            return False, f"Layer 11 validation exception: {str(e)}"
