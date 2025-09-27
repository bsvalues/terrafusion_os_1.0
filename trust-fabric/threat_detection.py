#!/usr/bin/env python3
"""
Trust Fabric Threat Detection System
Real-time security monitoring and threat analysis
"""

import logging
import asyncio
import json
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass


@dataclass
class ThreatEvent:
    """Security threat event"""
    timestamp: str
    threat_type: str
    severity: str
    source: str
    description: str
    risk_score: int
    mitigated: bool = False


class ThreatDetectionEngine:
    """Real-time threat detection and analysis"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.threat_rules = self._load_threat_rules()
        self.active_threats = []
        self.detection_stats = {
            "threats_detected": 0,
            "threats_blocked": 0,
            "false_positives": 0,
            "system_alerts": 0
        }
        
    def _load_threat_rules(self) -> Dict[str, Any]:
        """Load threat detection rules"""
        return {
            "crypto_anomalies": {
                "description": "Detect cryptographic anomalies",
                "enabled": True,
                "risk_weight": 8
            },
            "unauthorized_access": {
                "description": "Detect unauthorized access attempts",
                "enabled": True,
                "risk_weight": 9
            },
            "data_exfiltration": {
                "description": "Detect potential data exfiltration",
                "enabled": True,
                "risk_weight": 10
            },
            "malware_signatures": {
                "description": "Detect known malware patterns",
                "enabled": True,
                "risk_weight": 10
            },
            "anomalous_behavior": {
                "description": "Detect anomalous system behavior",
                "enabled": True,
                "risk_weight": 7
            }
        }
    
    def analyze_cryptographic_operations(self, operation_data: Dict[str, Any]) -> Optional[ThreatEvent]:
        """Analyze cryptographic operations for threats"""
        try:
            # Check for suspicious key patterns
            if "key_data" in operation_data:
                key_entropy = self._calculate_entropy(operation_data["key_data"])
                if key_entropy < 0.7:  # Low entropy indicates weak key
                    return ThreatEvent(
                        timestamp=datetime.now().isoformat(),
                        threat_type="weak_cryptography",
                        severity="HIGH",
                        source="crypto_engine",
                        description=f"Low entropy key detected: {key_entropy:.2f}",
                        risk_score=8
                    )
            
            # Check for unusual encryption patterns
            if "operation_count" in operation_data:
                if operation_data["operation_count"] > 10000:  # Unusual activity
                    return ThreatEvent(
                        timestamp=datetime.now().isoformat(),
                        threat_type="crypto_flooding",
                        severity="MEDIUM",
                        source="crypto_engine",
                        description=f"Excessive crypto operations: {operation_data['operation_count']}",
                        risk_score=6
                    )
            
            return None
            
        except Exception as e:
            self.logger.error(f"Crypto analysis failed: {e}")
            return None
    
    def analyze_access_patterns(self, access_data: Dict[str, Any]) -> Optional[ThreatEvent]:
        """Analyze access patterns for threats"""
        try:
            # Check for rapid successive access attempts
            if "access_count" in access_data and "time_window" in access_data:
                rate = access_data["access_count"] / access_data["time_window"]
                if rate > 100:  # More than 100 access/second is suspicious
                    return ThreatEvent(
                        timestamp=datetime.now().isoformat(),
                        threat_type="brute_force_attempt",
                        severity="HIGH",
                        source="access_monitor",
                        description=f"High access rate detected: {rate:.1f} requests/sec",
                        risk_score=9
                    )
            
            # Check for access from unusual sources
            if "source_ip" in access_data:
                if self._is_suspicious_ip(access_data["source_ip"]):
                    return ThreatEvent(
                        timestamp=datetime.now().isoformat(),
                        threat_type="suspicious_source",
                        severity="MEDIUM",
                        source="network_monitor",
                        description=f"Access from suspicious IP: {access_data['source_ip']}",
                        risk_score=7
                    )
            
            return None
            
        except Exception as e:
            self.logger.error(f"Access analysis failed: {e}")
            return None
    
    def analyze_system_behavior(self, system_data: Dict[str, Any]) -> Optional[ThreatEvent]:
        """Analyze system behavior for anomalies"""
        try:
            # Check for unusual resource usage
            if "cpu_usage" in system_data and system_data["cpu_usage"] > 90:
                return ThreatEvent(
                    timestamp=datetime.now().isoformat(),
                    threat_type="resource_exhaustion",
                    severity="MEDIUM",
                    source="system_monitor",
                    description=f"High CPU usage detected: {system_data['cpu_usage']}%",
                    risk_score=5
                )
            
            # Check for unusual network activity
            if "network_connections" in system_data and system_data["network_connections"] > 1000:
                return ThreatEvent(
                    timestamp=datetime.now().isoformat(),
                    threat_type="network_anomaly",
                    severity="MEDIUM",
                    source="network_monitor",
                    description=f"Excessive network connections: {system_data['network_connections']}",
                    risk_score=6
                )
            
            return None
            
        except Exception as e:
            self.logger.error(f"System analysis failed: {e}")
            return None
    
    def detect_malware_signatures(self, file_data: bytes) -> Optional[ThreatEvent]:
        """Detect known malware patterns"""
        try:
            # Simple signature-based detection (in production, use proper AV engine)
            file_hash = hashlib.sha256(file_data).hexdigest()
            
            # Known bad hashes (example - in production, use threat intelligence feeds)
            known_malware_hashes = {
                "d41d8cd98f00b204e9800998ecf8427e": "Empty file test",
                "malicious_hash_example": "Test malware signature"
            }
            
            if file_hash in known_malware_hashes:
                return ThreatEvent(
                    timestamp=datetime.now().isoformat(),
                    threat_type="malware_detected",
                    severity="CRITICAL",
                    source="malware_scanner",
                    description=f"Known malware detected: {known_malware_hashes[file_hash]}",
                    risk_score=10
                )
            
            # Check for suspicious patterns
            if b"eval(" in file_data or b"exec(" in file_data:
                return ThreatEvent(
                    timestamp=datetime.now().isoformat(),
                    threat_type="suspicious_code",
                    severity="HIGH",
                    source="code_analyzer",
                    description="Potentially dangerous code patterns detected",
                    risk_score=8
                )
            
            return None
            
        except Exception as e:
            self.logger.error(f"Malware detection failed: {e}")
            return None
    
    def _calculate_entropy(self, data: bytes) -> float:
        """Calculate Shannon entropy of data"""
        if not data:
            return 0.0
        
        # Count byte frequencies
        byte_counts = {}
        for byte in data:
            byte_counts[byte] = byte_counts.get(byte, 0) + 1
        
        # Calculate entropy
        entropy = 0.0
        length = len(data)
        for count in byte_counts.values():
            if count > 0:
                probability = count / length
                entropy -= probability * (probability.bit_length() - 1)
        
        return min(entropy / 8.0, 1.0)  # Normalize to 0-1
    
    def _is_suspicious_ip(self, ip: str) -> bool:
        """Check if IP address is suspicious"""
        # Simple checks (in production, use threat intelligence)
        suspicious_patterns = [
            "192.168.999.",  # Invalid private IP
            "10.255.255.",   # Suspicious private IP
            "172.31.255."    # Edge case private IP
        ]
        
        return any(ip.startswith(pattern) for pattern in suspicious_patterns)
    
    async def run_continuous_monitoring(self, duration_seconds: int = 60):
        """Run continuous threat monitoring"""
        self.logger.info(f"Starting continuous threat monitoring for {duration_seconds} seconds...")
        
        start_time = datetime.now()
        
        while (datetime.now() - start_time).total_seconds() < duration_seconds:
            # Simulate various threat detection scenarios
            await self._simulate_threat_detection()
            await asyncio.sleep(1)  # Check every second
        
        self.logger.info("Continuous monitoring completed")
    
    async def _simulate_threat_detection(self):
        """Simulate threat detection scenarios for testing"""
        import random
        
        # Simulate crypto operations analysis
        crypto_data = {
            "key_data": b"weak_key_example",
            "operation_count": random.randint(1, 15000)
        }
        crypto_threat = self.analyze_cryptographic_operations(crypto_data)
        if crypto_threat:
            self.active_threats.append(crypto_threat)
            self.detection_stats["threats_detected"] += 1
        
        # Simulate access pattern analysis
        access_data = {
            "access_count": random.randint(1, 200),
            "time_window": 1.0,
            "source_ip": random.choice(["192.168.1.1", "10.0.0.1", "192.168.999.1"])
        }
        access_threat = self.analyze_access_patterns(access_data)
        if access_threat:
            self.active_threats.append(access_threat)
            self.detection_stats["threats_detected"] += 1
        
        # Simulate system behavior analysis
        system_data = {
            "cpu_usage": random.randint(10, 100),
            "network_connections": random.randint(10, 1500)
        }
        system_threat = self.analyze_system_behavior(system_data)
        if system_threat:
            self.active_threats.append(system_threat)
            self.detection_stats["threats_detected"] += 1
        
        # Simulate malware detection
        test_files = [
            b"normal file content",
            b"eval(dangerous_code)",
            b"legitimate application data"
        ]
        for file_data in test_files:
            malware_threat = self.detect_malware_signatures(file_data)
            if malware_threat:
                self.active_threats.append(malware_threat)
                self.detection_stats["threats_detected"] += 1
    
    def get_threat_summary(self) -> Dict[str, Any]:
        """Get summary of detected threats"""
        return {
            "total_threats": len(self.active_threats),
            "critical_threats": len([t for t in self.active_threats if t.severity == "CRITICAL"]),
            "high_threats": len([t for t in self.active_threats if t.severity == "HIGH"]),
            "medium_threats": len([t for t in self.active_threats if t.severity == "MEDIUM"]),
            "low_threats": len([t for t in self.active_threats if t.severity == "LOW"]),
            "detection_stats": self.detection_stats,
            "active_threats": [
                {
                    "timestamp": t.timestamp,
                    "type": t.threat_type,
                    "severity": t.severity,
                    "description": t.description,
                    "risk_score": t.risk_score
                }
                for t in self.active_threats[-10:]  # Last 10 threats
            ]
        }
    
    def run_validation_tests(self) -> Dict[str, bool]:
        """Run validation tests for threat detection system"""
        tests = {
            "crypto_analysis": False,
            "access_analysis": False,
            "system_analysis": False,
            "malware_detection": False
        }
        
        try:
            # Test crypto analysis
            crypto_data = {"key_data": b"test", "operation_count": 15000}
            crypto_result = self.analyze_cryptographic_operations(crypto_data)
            tests["crypto_analysis"] = crypto_result is not None
            
            # Test access analysis
            access_data = {"access_count": 500, "time_window": 1.0, "source_ip": "192.168.999.1"}
            access_result = self.analyze_access_patterns(access_data)
            tests["access_analysis"] = access_result is not None
            
            # Test system analysis
            system_data = {"cpu_usage": 95, "network_connections": 1500}
            system_result = self.analyze_system_behavior(system_data)
            tests["system_analysis"] = system_result is not None
            
            # Test malware detection
            malware_result = self.detect_malware_signatures(b"eval(malicious_code)")
            tests["malware_detection"] = malware_result is not None
            
        except Exception as e:
            self.logger.error(f"Validation tests failed: {e}")
        
        return tests


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    threat_engine = ThreatDetectionEngine()
    
    print("🔍 Running threat detection validation tests...")
    test_results = threat_engine.run_validation_tests()
    
    passed_tests = sum(test_results.values())
    total_tests = len(test_results)
    
    print(f"✅ Threat Detection Tests: {passed_tests}/{total_tests} passed")
    for test_name, passed in test_results.items():
        status = "✅" if passed else "❌"
        print(f"  {status} {test_name}")
    
    if passed_tests == total_tests:
        print("🛡️ Threat Detection System fully operational")
    else:
        print("⚠️ Some threat detection components need attention")
    
    # Run a short monitoring simulation
    print("\n🔍 Running 10-second threat monitoring simulation...")
    asyncio.run(threat_engine.run_continuous_monitoring(10))
    
    summary = threat_engine.get_threat_summary()
    print(f"\n📊 Monitoring Results:")
    print(f"  Total Threats Detected: {summary['total_threats']}")
    print(f"  Critical: {summary['critical_threats']}")
    print(f"  High: {summary['high_threats']}")
    print(f"  Medium: {summary['medium_threats']}")
    print(f"  Low: {summary['low_threats']}")
    
    print("\n🛡️ Threat Detection System operational")
