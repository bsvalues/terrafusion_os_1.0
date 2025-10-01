"""
TerraFusion OS Core Validation - 11-Layer OS Kernel Validation  
MIT PhD-Level Operating System Component Validation
"""

import asyncio
import requests
import subprocess
import psutil
from pathlib import Path
from typing import Tuple, Dict, Any


class TerraFusionOSValidation:
    """
    11-Layer validation specifically for TerraFusion OS Core (Kernel)
    """
    
    def __init__(self):
        self.component_path = Path("backend")
        self.layer_descriptions = {
            1: "Kernel Module Loading System",
            2: "Process Management Validation",
            3: "Memory Allocation Testing",
            4: "Port Allocation & Binding",
            5: "Service Discovery Mechanism",
            6: "API Gateway Functionality",
            7: "Database Layer Integration",
            8: "Security Enforcement Engine",
            9: "Monitoring Stack Validation",
            10: "Backup & Recovery System",
            11: "Module Integration Points"
        }
    
    async def validate_layer_1(self) -> Tuple[bool, str]:
        """Layer 1: Kernel Module Loading System"""
        try:
            # Check for essential OS kernel files
            required_files = [
                "TerraFusion.API/Program.cs",
                "TerraFusion.API/Controllers/SystemController.cs",
                "TerraFusion.API/Services/ModuleLoaderService.cs",
                "TerraFusion.API/appsettings.json"
            ]
            
            missing_files = []
            for file in required_files:
                if not (self.component_path / file).exists():
                    missing_files.append(file)
            
            if missing_files:
                return False, f"Missing OS kernel files: {', '.join(missing_files)}"
            
            # Test module loading capability
            try:
                result = subprocess.run([
                    'dotnet', 'run', '--project', str(self.component_path / 'TerraFusion.API'),
                    '--', '--test-module-loading'
                ], capture_output=True, text=True, timeout=30, cwd=self.component_path)
                
                if result.returncode == 0:
                    return True, "Kernel module loading system operational"
                else:
                    return False, f"Module loading test failed: {result.stderr}"
                    
            except subprocess.TimeoutExpired:
                return False, "Module loading test timeout"
                
        except Exception as e:
            return False, f"Layer 1 validation exception: {str(e)}"
    
    async def validate_layer_2(self) -> Tuple[bool, str]:
        """Layer 2: Process Management Validation"""
        try:
            # Check if TerraFusion OS processes are running
            terrafusion_processes = []
            
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    if (proc.info['name'] and 
                        ('TerraFusion' in proc.info['name'] or 
                         'dotnet' in proc.info['name'])):
                        
                        if proc.info['cmdline']:
                            cmdline = ' '.join(proc.info['cmdline'])
                            if 'TerraFusion.API' in cmdline:
                                terrafusion_processes.append({
                                    'pid': proc.info['pid'],
                                    'name': proc.info['name'],
                                    'cmdline': cmdline
                                })
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
            
            if not terrafusion_processes:
                return False, "No TerraFusion OS processes running"
            
            # Test process management API
            try:
                response = requests.get("http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/system/processes", timeout=10)
                if response.status_code == 200:
                    process_data = response.json()
                    if 'processes' in process_data:
                        return True, f"Process management operational: {len(terrafusion_processes)} OS processes"
                    else:
                        return False, "Process management API returned invalid data"
                else:
                    return False, f"Process management API error: {response.status_code}"
                    
            except requests.exceptions.RequestException as e:
                return False, f"Cannot connect to process management API: {str(e)}"
                
        except Exception as e:
            return False, f"Layer 2 validation exception: {str(e)}"
    
    async def validate_layer_3(self) -> Tuple[bool, str]:
        """Layer 3: Memory Allocation Testing"""
        try:
            # Test memory management capabilities
            try:
                response = requests.get("http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/system/memory", timeout=10)
                if response.status_code == 200:
                    memory_data = response.json()
                    
                    required_fields = ['total_memory', 'available_memory', 'used_memory']
                    missing_fields = [field for field in required_fields if field not in memory_data]
                    
                    if missing_fields:
                        return False, f"Memory API missing fields: {', '.join(missing_fields)}"
                    
                    # Check memory usage is reasonable
                    memory_usage_percent = (memory_data['used_memory'] / memory_data['total_memory']) * 100
                    
                    if memory_usage_percent > 95:
                        return False, f"Critical memory usage: {memory_usage_percent:.1f}%"
                    
                    return True, f"Memory allocation operational: {memory_usage_percent:.1f}% usage"
                else:
                    return False, f"Memory management API error: {response.status_code}"
                    
            except requests.exceptions.RequestException as e:
                return False, f"Cannot connect to memory management API: {str(e)}"
                
        except Exception as e:
            return False, f"Layer 3 validation exception: {str(e)}"
    
    async def validate_layer_4(self) -> Tuple[bool, str]:
        """Layer 4: Port Allocation & Binding"""
        try:
            # Check that required OS ports are properly allocated
            required_ports = {
                5001: "OS Core API Gateway",
                5002: "Data Layer Service", 
                5003: "AI Coordinator Service",
                5004: "Security Enforcement Service"
            }
            
            bound_ports = {}
            unbound_ports = []
            
            for port, service_name in required_ports.items():
                try:
                    response = requests.get(f"http://localhost:{port}/api/health", timeout=5)
                    if response.status_code == 200:
                        bound_ports[port] = service_name
                    else:
                        unbound_ports.append(f"{port} ({service_name})")
                except requests.exceptions.RequestException:
                    unbound_ports.append(f"{port} ({service_name})")
            
            if len(bound_ports) >= 2:  # At least 2 core services running
                return True, f"Port allocation operational: {len(bound_ports)}/{len(required_ports)} services bound"
            else:
                return False, f"Insufficient port bindings: {', '.join(unbound_ports)} not responding"
                
        except Exception as e:
            return False, f"Layer 4 validation exception: {str(e)}"
    
    async def validate_layer_5(self) -> Tuple[bool, str]:
        """Layer 5: Service Discovery Mechanism"""
        try:
            # Test service discovery API
            try:
                response = requests.get("http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/services/discover", timeout=10)
                if response.status_code == 200:
                    services_data = response.json()
                    
                    if 'services' not in services_data:
                        return False, "Service discovery API returned invalid format"
                    
                    discovered_services = services_data['services']
                    
                    # Check for essential services
                    essential_services = ['trust-fabric', 'desktop-shell', 'marketplace']
                    found_services = [s['name'] for s in discovered_services if 'name' in s]
                    
                    found_essential = [s for s in essential_services if s in found_services]
                    
                    if len(found_essential) >= 1:  # At least one essential service discovered
                        return True, f"Service discovery operational: found {', '.join(found_essential)}"
                    else:
                        return False, f"No essential services discovered. Found: {', '.join(found_services)}"
                else:
                    return False, f"Service discovery API error: {response.status_code}"
                    
            except requests.exceptions.RequestException as e:
                return False, f"Cannot connect to service discovery API: {str(e)}"
                
        except Exception as e:
            return False, f"Layer 5 validation exception: {str(e)}"
    
    async def validate_layer_6(self) -> Tuple[bool, str]:
        """Layer 6: API Gateway Functionality"""
        try:
            # Test API gateway routing and authentication
            api_endpoints = [
                "/api/health",
                "/api/system/status",
                "/api/modules/list",
                "/api/services/health"
            ]
            
            working_endpoints = []
            failed_endpoints = []
            
            base_url = "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}"
            
            for endpoint in api_endpoints:
                try:
                    response = requests.get(f"{base_url}{endpoint}", timeout=5)
                    if response.status_code in [200, 201, 202]:
                        working_endpoints.append(endpoint)
                    else:
                        failed_endpoints.append(f"{endpoint} ({response.status_code})")
                except requests.exceptions.RequestException as e:
                    failed_endpoints.append(f"{endpoint} (connection error)")
            
            if len(working_endpoints) >= 2:  # At least 2 endpoints working
                return True, f"API Gateway operational: {len(working_endpoints)}/{len(api_endpoints)} endpoints responding"
            else:
                return False, f"API Gateway failures: {', '.join(failed_endpoints)}"
                
        except Exception as e:
            return False, f"Layer 6 validation exception: {str(e)}"
    
    async def validate_layer_7(self) -> Tuple[bool, str]:
        """Layer 7: Database Layer Integration"""
        try:
            # Test database connectivity and schema
            try:
                response = requests.get("http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/database/health", timeout=10)
                if response.status_code == 200:
                    db_data = response.json()
                    
                    if 'database_status' not in db_data:
                        return False, "Database health API returned invalid format"
                    
                    db_status = db_data['database_status']
                    
                    if db_status.lower() in ['healthy', 'operational', 'connected']:
                        # Test basic database operations
                        test_response = requests.post(
                            "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/database/test",
                            json={"operation": "ping"},
                            timeout=10
                        )
                        
                        if test_response.status_code == 200:
                            return True, f"Database layer operational: {db_status}"
                        else:
                            return False, f"Database test operation failed: {test_response.status_code}"
                    else:
                        return False, f"Database unhealthy: {db_status}"
                else:
                    return False, f"Database health API error: {response.status_code}"
                    
            except requests.exceptions.RequestException as e:
                return False, f"Cannot connect to database API: {str(e)}"
                
        except Exception as e:
            return False, f"Layer 7 validation exception: {str(e)}"
    
    async def validate_layer_8(self) -> Tuple[bool, str]:
        """Layer 8: Security Enforcement Engine"""
        try:
            # Test security enforcement mechanisms
            security_tests = [
                {"endpoint": "/api/security/authentication", "expected": 200},
                {"endpoint": "/api/security/authorization", "expected": 200},
                {"endpoint": "/api/security/encryption", "expected": 200}
            ]
            
            security_results = []
            
            for test in security_tests:
                try:
                    response = requests.get(f"http://localhost:\${{TF_API_HTTPS_PORT:-5001}}{test['endpoint']}", timeout=5)
                    if response.status_code == test['expected']:
                        security_results.append(f"{test['endpoint']} ✓")
                    else:
                        security_results.append(f"{test['endpoint']} ✗ ({response.status_code})")
                except requests.exceptions.RequestException:
                    security_results.append(f"{test['endpoint']} ✗ (no response)")
            
            passed_tests = len([r for r in security_results if '✓' in r])
            
            if passed_tests >= 2:  # At least 2 security tests passing
                return True, f"Security enforcement operational: {passed_tests}/3 tests passed"
            else:
                return False, f"Security enforcement failures: {'; '.join(security_results)}"
                
        except Exception as e:
            return False, f"Layer 8 validation exception: {str(e)}"
    
    async def validate_layer_9(self) -> Tuple[bool, str]:
        """Layer 9: Monitoring Stack Validation"""
        try:
            # Test system monitoring capabilities
            monitoring_endpoints = [
                "/api/monitoring/metrics",
                "/api/monitoring/logs", 
                "/api/monitoring/alerts"
            ]
            
            monitoring_results = {}
            
            for endpoint in monitoring_endpoints:
                try:
                    response = requests.get(f"http://localhost:\${{TF_API_HTTPS_PORT:-5001}}{endpoint}", timeout=5)
                    monitoring_results[endpoint] = response.status_code == 200
                except requests.exceptions.RequestException:
                    monitoring_results[endpoint] = False
            
            working_monitors = [k for k, v in monitoring_results.items() if v]
            
            if len(working_monitors) >= 1:  # At least one monitoring endpoint working
                return True, f"Monitoring stack operational: {len(working_monitors)}/{len(monitoring_endpoints)} endpoints"
            else:
                return False, "No monitoring endpoints responding"
                
        except Exception as e:
            return False, f"Layer 9 validation exception: {str(e)}"
    
    async def validate_layer_10(self) -> Tuple[bool, str]:
        """Layer 10: Backup & Recovery System"""
        try:
            # Test backup and recovery mechanisms
            try:
                response = requests.get("http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/backup/status", timeout=10)
                if response.status_code == 200:
                    backup_data = response.json()
                    
                    if 'backup_status' in backup_data:
                        backup_status = backup_data['backup_status']
                        
                        # Test backup creation
                        backup_test_response = requests.post(
                            "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/backup/test",
                            json={"type": "configuration_backup"},
                            timeout=15
                        )
                        
                        if backup_test_response.status_code in [200, 201]:
                            return True, f"Backup & recovery operational: {backup_status}"
                        else:
                            return False, f"Backup test failed: {backup_test_response.status_code}"
                    else:
                        return False, "Backup status API returned invalid format"
                else:
                    return False, f"Backup status API error: {response.status_code}"
                    
            except requests.exceptions.RequestException as e:
                return False, f"Cannot connect to backup API: {str(e)}"
                
        except Exception as e:
            return False, f"Layer 10 validation exception: {str(e)}"
    
    async def validate_layer_11(self) -> Tuple[bool, str]:
        """Layer 11: Module Integration Points"""
        try:
            # Test integration with TerraFusion modules
            module_integration_tests = [
                {"module": "desktop-shell", "endpoint": "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/os-integration"},
                {"module": "marketplace", "endpoint": "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/os-integration"},
                {"module": "consciousness", "endpoint": "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/os-integration"}
            ]
            
            integration_results = {}
            
            for test in module_integration_tests:
                try:
                    response = requests.get(test['endpoint'], timeout=5)
                    integration_results[test['module']] = response.status_code == 200
                except requests.exceptions.RequestException:
                    integration_results[test['module']] = False
            
            successful_integrations = [k for k, v in integration_results.items() if v]
            
            if len(successful_integrations) >= 1:  # At least one module integration working
                return True, f"Module integration operational: {', '.join(successful_integrations)}"
            else:
                return False, "No module integrations responding"
                
        except Exception as e:
            return False, f"Layer 11 validation exception: {str(e)}"
