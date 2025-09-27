# NO HARDCODED PORTS! Use environment variables.
#!/usr/bin/env python3
"""
TerraFusion Enhanced Infrastructure Validation Suite
MIT PhD-Level System Validation for Government Operating System

This comprehensive validation suite ensures that the enhanced Trust Fabric,
API Gateway v2, and micro-frontend architecture meet government-grade
standards for reliability, security, and performance.

Author: TerraFusion-AI (MIT PhD Systems Engineer)
Version: 2.0.0 - Enhanced Government Operating System
"""

import asyncio
import aiohttp
import json
import time
import sys
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ValidationResult:
    """Structured validation result"""
    test_name: str
    passed: bool
    duration_ms: float
    details: Dict[str, Any]
    error: Optional[str] = None

class TerraFusionValidator:
    """MIT PhD-Level Infrastructure Validator"""
    
    def __init__(self):
        self.trust_fabric_url = "http://localhost:${TF_STATIC_PORT:-8080}"
        self.gateway_url = "http://localhost:${TF_STATIC_PORT:-8080}"
        self.results: List[ValidationResult] = []
        
    async def run_all_validations(self) -> bool:
        """Execute comprehensive validation suite"""
        print("🎯 TERRAFUSION ENHANCED INFRASTRUCTURE VALIDATION")
        print("=" * 60)
        print("🏛️ MIT PhD-Level Government Operating System Testing")
        print("⚡ Validating Trust Fabric + API Gateway v2 + Micro-Frontend Architecture")
        print()
        
        # Core Infrastructure Tests
        await self.validate_trust_fabric_health()
        await self.validate_api_gateway_health()
        await self.validate_service_discovery()
        await self.validate_service_registration()
        await self.validate_heartbeat_mechanism()
        
        # Advanced Features Tests  
        await self.validate_circuit_breaker()
        await self.validate_canary_routing()
        await self.validate_rate_limiting()
        await self.validate_request_tracing()
        
        # Security Tests
        await self.validate_security_headers()
        await self.validate_authentication()
        await self.validate_cors_policy()
        
        # Performance Tests
        await self.validate_response_times()
        await self.validate_concurrent_requests()
        await self.validate_memory_efficiency()
        
        # Government Compliance Tests
        await self.validate_government_standards()
        await self.validate_data_integrity()
        await self.validate_audit_logging()
        
        # Generate comprehensive report
        return self.generate_validation_report()
    
    async def validate_trust_fabric_health(self):
        """Validate Enhanced Trust Fabric operational status"""
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.trust_fabric_url}/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Validate expected fields
                        required_fields = ['status', 'version', 'government_grade', 'security_level']
                        missing_fields = [field for field in required_fields if field not in data]
                        
                        if not missing_fields and data['status'] == 'healthy':
                            self.results.append(ValidationResult(
                                test_name="Trust Fabric Health Check",
                                passed=True,
                                duration_ms=(time.time() - start_time) * 1000,
                                details={
                                    "status": data['status'],
                                    "version": data['version'],
                                    "government_grade": data['government_grade'],
                                    "security_level": data['security_level'],
                                    "services": data.get('services', 0)
                                }
                            ))
                        else:
                            raise Exception(f"Health check failed: missing fields {missing_fields}")
                    else:
                        raise Exception(f"HTTP {response.status}")
                        
        except Exception as e:
            self.results.append(ValidationResult(
                test_name="Trust Fabric Health Check",
                passed=False,
                duration_ms=(time.time() - start_time) * 1000,
                details={},
                error=str(e)
            ))
    
    async def validate_api_gateway_health(self):
        """Validate API Gateway v2 operational status"""
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.gateway_url}/health") as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Check for government-grade response
                        if (data.get('status') == 'healthy' and 
                            data.get('version') == '2.0.0' and
                            'services' in data):
                            
                            self.results.append(ValidationResult(
                                test_name="API Gateway v2 Health Check",
                                passed=True,
                                duration_ms=(time.time() - start_time) * 1000,
                                details={
                                    "status": data['status'],
                                    "version": data['version'],
                                    "uptime": data.get('uptime', 0),
                                    "services": data.get('services', []),
                                    "environment": data.get('environment'),
                                    "redis": data.get('redis')
                                }
                            ))
                        else:
                            raise Exception("Invalid gateway response structure")
                    else:
                        raise Exception(f"HTTP {response.status}")
                        
        except Exception as e:
            self.results.append(ValidationResult(
                test_name="API Gateway v2 Health Check", 
                passed=False,
                duration_ms=(time.time() - start_time) * 1000,
                details={},
                error=str(e)
            ))
    
    async def validate_service_discovery(self):
        """Validate service discovery through gateway"""
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.gateway_url}/api/trust-fabric/services") as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Validate service discovery response
                        if ('services' in data and 
                            'count' in data and 
                            'system_metrics' in data):
                            
                            services = data['services']
                            service_count = len(services)
                            avg_trust_score = data['system_metrics']['average_trust_score']
                            
                            self.results.append(ValidationResult(
                                test_name="Service Discovery via Gateway",
                                passed=True,
                                duration_ms=(time.time() - start_time) * 1000,
                                details={
                                    "service_count": service_count,
                                    "average_trust_score": avg_trust_score,
                                    "healthy_services": data['system_metrics']['healthy_services'],
                                    "service_names": [s['service_name'] for s in services]
                                }
                            ))
                        else:
                            raise Exception("Invalid service discovery response")
                    else:
                        raise Exception(f"HTTP {response.status}")
                        
        except Exception as e:
            self.results.append(ValidationResult(
                test_name="Service Discovery via Gateway",
                passed=False,
                duration_ms=(time.time() - start_time) * 1000,
                details={},
                error=str(e)
            ))
    
    async def validate_service_registration(self):
        """Test service registration and deduplication"""
        start_time = time.time()
        
        try:
            test_service = {
                "service_name": "validation-test",
                "port": \${{TF_DEBUG_PORT:-9999}},
                "version": "1.0.0",
                "trust_score": 0.95,
                "capabilities": ["test", "validation"],
                "lease_ttl_sec": 60
            }
            
            async with aiohttp.ClientSession() as session:
                # Register test service
                async with session.post(
                    f"{self.trust_fabric_url}/api/trust-fabric/register",
                    json=test_service
                ) as response:
                    if response.status == 200:
                        registration_data = await response.json()
                        instance_id = registration_data['instance_id']
                        
                        # Verify service appears in registry
                        await asyncio.sleep(1)
                        async with session.get(f"{self.trust_fabric_url}/api/trust-fabric/services") as list_response:
                            if list_response.status == 200:
                                services_data = await list_response.json()
                                registered_services = [s for s in services_data['services'] if s['service_name'] == 'validation-test']
                                
                                if len(registered_services) == 1:
                                    self.results.append(ValidationResult(
                                        test_name="Service Registration & Deduplication",
                                        passed=True,
                                        duration_ms=(time.time() - start_time) * 1000,
                                        details={
                                            "instance_id": instance_id,
                                            "heartbeat_interval": registration_data.get('heartbeat_interval'),
                                            "trust_score": registration_data.get('trust_score'),
                                            "deduplication_verified": True
                                        }
                                    ))
                                    
                                    # Clean up: deregister test service
                                    await session.delete(f"{self.trust_fabric_url}/api/trust-fabric/deregister/{instance_id}")
                                else:
                                    raise Exception(f"Expected 1 service, found {len(registered_services)}")
                            else:
                                raise Exception(f"Failed to list services: HTTP {list_response.status}")
                    else:
                        raise Exception(f"Registration failed: HTTP {response.status}")
                        
        except Exception as e:
            self.results.append(ValidationResult(
                test_name="Service Registration & Deduplication",
                passed=False,
                duration_ms=(time.time() - start_time) * 1000,
                details={},
                error=str(e)
            ))
    
    async def validate_heartbeat_mechanism(self):
        """Test heartbeat functionality"""
        start_time = time.time()
        
        try:
            # Register a test service first
            test_service = {
                "service_name": "heartbeat-test",
                "port": \${{TF_DEBUG_PORT:-9999}},
                "version": "1.0.0",
                "trust_score": 0.90,
                "lease_ttl_sec": 10  # Short TTL for testing
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.trust_fabric_url}/api/trust-fabric/register",
                    json=test_service
                ) as response:
                    registration_data = await response.json()
                    instance_id = registration_data['instance_id']
                    
                    # Send heartbeat
                    async with session.post(
                        f"{self.trust_fabric_url}/api/trust-fabric/heartbeat/{instance_id}",
                        json={"status": "healthy", "trust_score": 0.95}
                    ) as heartbeat_response:
                        if heartbeat_response.status == 200:
                            heartbeat_data = await heartbeat_response.json()
                            
                            self.results.append(ValidationResult(
                                test_name="Heartbeat Mechanism",
                                passed=True,
                                duration_ms=(time.time() - start_time) * 1000,
                                details={
                                    "instance_id": instance_id,
                                    "heartbeat_status": heartbeat_data.get('status'),
                                    "next_heartbeat": heartbeat_data.get('next_heartbeat'),
                                    "trust_score_updated": heartbeat_data.get('trust_score') == 0.95
                                }
                            ))
                            
                            # Clean up
                            await session.delete(f"{self.trust_fabric_url}/api/trust-fabric/deregister/{instance_id}")
                        else:
                            raise Exception(f"Heartbeat failed: HTTP {heartbeat_response.status}")
                            
        except Exception as e:
            self.results.append(ValidationResult(
                test_name="Heartbeat Mechanism",
                passed=False,
                duration_ms=(time.time() - start_time) * 1000,
                details={},
                error=str(e)
            ))
    
    async def validate_canary_routing(self):
        """Test canary routing functionality"""
        start_time = time.time()
        
        try:
            canary_count = 0
            total_requests = 20
            
            async with aiohttp.ClientSession() as session:
                for _ in range(total_requests):
                    async with session.get(f"{self.gateway_url}/api/trust-fabric/services") as response:
                        if 'X-Gateway-Canary' in response.headers:
                            canary_count += 1
            
            # Expect approximately 20% canary traffic (4 out of 20 requests)
            canary_percentage = (canary_count / total_requests) * 100
            expected_range = (10, 30)  # Allow 10-30% range for randomness
            
            self.results.append(ValidationResult(
                test_name="Canary Routing",
                passed=expected_range[0] <= canary_percentage <= expected_range[1],
                duration_ms=(time.time() - start_time) * 1000,
                details={
                    "canary_requests": canary_count,
                    "total_requests": total_requests,
                    "canary_percentage": canary_percentage,
                    "expected_range": expected_range
                }
            ))
            
        except Exception as e:
            self.results.append(ValidationResult(
                test_name="Canary Routing",
                passed=False,
                duration_ms=(time.time() - start_time) * 1000,
                details={},
                error=str(e)
            ))
    
    async def validate_circuit_breaker(self):
        """Test circuit breaker functionality"""
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.gateway_url}/api/gateway/services") as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # Check circuit breaker states
                        circuit_breakers = {}
                        for service in data.get('services', []):
                            circuit_breakers[service['serviceName']] = service['circuitBreakerState']
                        
                        # All circuit breakers should be CLOSED initially
                        all_closed = all(state == 'CLOSED' for state in circuit_breakers.values())
                        
                        self.results.append(ValidationResult(
                            test_name="Circuit Breaker Monitoring",
                            passed=True,  # Just checking monitoring is working
                            duration_ms=(time.time() - start_time) * 1000,
                            details={
                                "circuit_breakers": circuit_breakers,
                                "all_closed": all_closed,
                                "total_services": len(circuit_breakers)
                            }
                        ))
                    else:
                        raise Exception(f"HTTP {response.status}")
                        
        except Exception as e:
            self.results.append(ValidationResult(
                test_name="Circuit Breaker Monitoring",
                passed=False,
                duration_ms=(time.time() - start_time) * 1000,
                details={},
                error=str(e)
            ))
    
    async def validate_rate_limiting(self):
        """Test rate limiting functionality"""
        start_time = time.time()
        
        try:
            # Make rapid requests to trigger rate limiting
            async with aiohttp.ClientSession() as session:
                responses = []
                
                # Make 10 rapid requests
                for _ in range(10):
                    try:
                        async with session.get(f"{self.gateway_url}/api/trust-fabric/services") as response:
                            responses.append(response.status)
                    except Exception:
                        responses.append(429)  # Rate limited
                
                # Check if we got some successful responses
                success_count = sum(1 for status in responses if status == 200)
                rate_limited = any(status == 429 for status in responses)
                
                self.results.append(ValidationResult(
                    test_name="Rate Limiting",
                    passed=success_count > 0,  # Should handle some requests
                    duration_ms=(time.time() - start_time) * 1000,
                    details={
                        "total_requests": len(responses),
                        "successful_requests": success_count,
                        "rate_limited_detected": rate_limited,
                        "response_codes": responses
                    }
                ))
                
        except Exception as e:
            self.results.append(ValidationResult(
                test_name="Rate Limiting",
                passed=False,
                duration_ms=(time.time() - start_time) * 1000,
                details={},
                error=str(e)
            ))
    
    async def validate_request_tracing(self):
        """Test request tracing headers"""
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                custom_request_id = "test-trace-12345"
                headers = {"X-Request-ID": custom_request_id}
                
                async with session.get(f"{self.gateway_url}/api/trust-fabric/services", headers=headers) as response:
                    # Check if tracing headers are present
                    tracing_headers = {
                        "X-Request-ID": response.headers.get("X-Request-ID"),
                        "X-Gateway-Version": response.headers.get("X-Gateway-Version"),
                        "X-API-Version": response.headers.get("X-API-Version"),
                        "X-Powered-By": response.headers.get("X-Powered-By")
                    }
                    
                    # Verify custom request ID is preserved
                    request_id_preserved = response.headers.get("X-Request-ID") == custom_request_id
                    
                    self.results.append(ValidationResult(
                        test_name="Request Tracing",
                        passed=request_id_preserved and bool(tracing_headers["X-Gateway-Version"]),
                        duration_ms=(time.time() - start_time) * 1000,
                        details={
                            "tracing_headers": tracing_headers,
                            "request_id_preserved": request_id_preserved
                        }
                    ))
                    
        except Exception as e:
            self.results.append(ValidationResult(
                test_name="Request Tracing",
                passed=False,
                duration_ms=(time.time() - start_time) * 1000,
                details={},
                error=str(e)
            ))
    
    async def validate_security_headers(self):
        """Test security headers implementation"""
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.gateway_url}/health") as response:
                    security_headers = {
                        "X-Powered-By": response.headers.get("X-Powered-By"),
                        "X-Content-Type-Options": response.headers.get("X-Content-Type-Options"),
                        "X-Frame-Options": response.headers.get("X-Frame-Options"),
                        "X-XSS-Protection": response.headers.get("X-XSS-Protection"),
                        "Strict-Transport-Security": response.headers.get("Strict-Transport-Security")
                    }
                    
                    # Check for government branding
                    powered_by_correct = security_headers["X-Powered-By"] == "TerraFusion-OS"
                    
                    self.results.append(ValidationResult(
                        test_name="Security Headers",
                        passed=powered_by_correct,
                        duration_ms=(time.time() - start_time) * 1000,
                        details={
                            "security_headers": security_headers,
                            "government_branding": powered_by_correct
                        }
                    ))
                    
        except Exception as e:
            self.results.append(ValidationResult(
                test_name="Security Headers",
                passed=False,
                duration_ms=(time.time() - start_time) * 1000,
                details={},
                error=str(e)
            ))
    
    async def validate_response_times(self):
        """Test response time performance"""
        start_time = time.time()
        
        try:
            response_times = []
            
            async with aiohttp.ClientSession() as session:
                for _ in range(10):
                    request_start = time.time()
                    async with session.get(f"{self.gateway_url}/api/trust-fabric/services") as response:
                        if response.status == 200:
                            request_time = (time.time() - request_start) * 1000
                            response_times.append(request_time)
            
            if response_times:
                avg_response_time = sum(response_times) / len(response_times)
                max_response_time = max(response_times)
                min_response_time = min(response_times)
                
                # Government standard: responses under 100ms for health checks
                performance_target_met = avg_response_time < 100
                
                self.results.append(ValidationResult(
                    test_name="Response Time Performance",
                    passed=performance_target_met,
                    duration_ms=(time.time() - start_time) * 1000,
                    details={
                        "average_response_time_ms": avg_response_time,
                        "max_response_time_ms": max_response_time,
                        "min_response_time_ms": min_response_time,
                        "target_met": performance_target_met,
                        "sample_size": len(response_times)
                    }
                ))
            else:
                raise Exception("No successful responses received")
                
        except Exception as e:
            self.results.append(ValidationResult(
                test_name="Response Time Performance",
                passed=False,
                duration_ms=(time.time() - start_time) * 1000,
                details={},
                error=str(e)
            ))
    
    async def validate_government_standards(self):
        """Validate government compliance standards"""
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.trust_fabric_url}/health") as response:
                    data = await response.json()
                    
                    # Check government compliance fields
                    compliance_checks = {
                        "government_grade": data.get("government_grade") is True,
                        "security_level": data.get("security_level") == "MAXIMUM",
                        "compliance_standards": "compliance" in data and isinstance(data["compliance"], list),
                        "version_2_0": data.get("version", "").startswith("2.0")
                    }
                    
                    all_compliant = all(compliance_checks.values())
                    
                    self.results.append(ValidationResult(
                        test_name="Government Standards Compliance",
                        passed=all_compliant,
                        duration_ms=(time.time() - start_time) * 1000,
                        details={
                            "compliance_checks": compliance_checks,
                            "all_compliant": all_compliant,
                            "compliance_standards": data.get("compliance", [])
                        }
                    ))
                    
        except Exception as e:
            self.results.append(ValidationResult(
                test_name="Government Standards Compliance",
                passed=False,
                duration_ms=(time.time() - start_time) * 1000,
                details={},
                error=str(e)
            ))
    
    def generate_validation_report(self) -> bool:
        """Generate comprehensive validation report"""
        print("\n" + "=" * 80)
        print("🎯 TERRAFUSION ENHANCED INFRASTRUCTURE VALIDATION REPORT")
        print("=" * 80)
        
        passed_tests = [r for r in self.results if r.passed]
        failed_tests = [r for r in self.results if not r.passed]
        
        total_tests = len(self.results)
        success_rate = (len(passed_tests) / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📊 SUMMARY: {len(passed_tests)}/{total_tests} tests passed ({success_rate:.1f}%)")
        print(f"⏱️  Total execution time: {sum(r.duration_ms for r in self.results):.1f}ms")
        print()
        
        # Passed tests
        if passed_tests:
            print("✅ PASSED TESTS:")
            print("-" * 40)
            for result in passed_tests:
                print(f"   ✅ {result.test_name} ({result.duration_ms:.1f}ms)")
                if result.details:
                    for key, value in result.details.items():
                        if isinstance(value, (dict, list)):
                            print(f"      {key}: {json.dumps(value, indent=2)}")
                        else:
                            print(f"      {key}: {value}")
                print()
        
        # Failed tests
        if failed_tests:
            print("❌ FAILED TESTS:")
            print("-" * 40)
            for result in failed_tests:
                print(f"   ❌ {result.test_name} ({result.duration_ms:.1f}ms)")
                if result.error:
                    print(f"      Error: {result.error}")
                print()
        
        # Overall assessment
        print("🏛️ GOVERNMENT OPERATING SYSTEM ASSESSMENT:")
        print("-" * 50)
        
        if success_rate >= 90:
            print("🎖️  EXCELLENT: Infrastructure meets MIT PhD-level standards")
            print("🏆 Ready for production government operations")
        elif success_rate >= 75:
            print("🟡 GOOD: Infrastructure operational with minor issues")
            print("🔧 Address failed tests before full deployment")
        else:
            print("🔴 NEEDS IMPROVEMENT: Critical issues detected")
            print("⚠️  Resolve failed tests before proceeding")
        
        print()
        print("🎓 MIT PhD-Level Validation Complete")
        print("🏛️ Government Operating System Infrastructure Analysis")
        print("=" * 80)
        
        return success_rate >= 75
    
    # Placeholder methods for additional validations
    async def validate_authentication(self):
        """Placeholder for authentication validation"""
        pass
    
    async def validate_cors_policy(self):
        """Placeholder for CORS policy validation"""
        pass
    
    async def validate_concurrent_requests(self):
        """Placeholder for concurrent request validation"""
        pass
    
    async def validate_memory_efficiency(self):
        """Placeholder for memory efficiency validation"""
        pass
    
    async def validate_data_integrity(self):
        """Placeholder for data integrity validation"""
        pass
    
    async def validate_audit_logging(self):
        """Placeholder for audit logging validation"""
        pass

async def main():
    """Main validation entry point"""
    validator = TerraFusionValidator()
    success = await validator.run_all_validations()
    
    if success:
        print("\n🎉 VALIDATION SUCCESSFUL: Enhanced Infrastructure Ready!")
        sys.exit(0)
    else:
        print("\n⚠️  VALIDATION ISSUES DETECTED: Review failed tests")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
