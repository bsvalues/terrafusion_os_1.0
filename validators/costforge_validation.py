"""
CostForge AI Module Validation - 11-Layer AI Property Valuation Validation
MIT PhD-Level AI Module Component Validation
"""

import asyncio
import requests
import json
import numpy as np
from pathlib import Path
from typing import Tuple, Dict, Any
import subprocess


class CostForgeValidation:
    """
    11-Layer validation specifically for CostForge AI Property Valuation Module
    """
    
    def __init__(self):
        self.component_path = Path("modules/costforge-ai")
        self.layer_descriptions = {
            1: "AI Model Loading & Validation",
            2: "Data Pipeline Integrity",
            3: "Property Valuation Engine",
            4: "API Endpoint Functionality", 
            5: "Database Connection Testing",
            6: "Security Token Validation",
            7: "Compliance Rule Engine",
            8: "Performance Metrics Validation",
            9: "Error Handling & Recovery",
            10: "Logging System Validation",
            11: "OS Integration Testing"
        }
    
    async def validate_layer_1(self) -> Tuple[bool, str]:
        """Layer 1: AI Model Loading & Validation"""
        try:
            # Check for AI model files
            model_path = self.component_path / "models"
            required_models = [
                "property_valuation_model.pkl",
                "market_analysis_model.h5", 
                "comparable_sales_model.bin",
                "feature_scaler.pkl"
            ]
            
            missing_models = []
            for model_file in required_models:
                if not (model_path / model_file).exists():
                    missing_models.append(model_file)
            
            if missing_models:
                return False, f"Missing AI models: {', '.join(missing_models)}"
            
            # Test model loading functionality
            try:
                test_script = f"""
import sys
sys.path.append('{self.component_path}')
import pickle
import numpy as np
from pathlib import Path

# Test property valuation model
try:
    with open('{model_path / 'property_valuation_model.pkl'}', 'rb') as f:
        model = pickle.load(f)
    
    # Test with dummy property data
    test_data = np.array([[2000, 3, 2, 1990, 0.5, 85000, 7.5, 45.2]])  # sqft, beds, baths, year, lot_acres, neighborhood_median, school_rating, crime_index
    prediction = model.predict(test_data)
    
    if len(prediction) > 0 and prediction[0] > 0:
        print(f"Model test successful: predicted value ${prediction[0]:,.2f}")
    else:
        print("Model prediction invalid")
        exit(1)
        
except Exception as e:
    print(f"Model loading failed: {{e}}")
    exit(1)
"""
                
                result = subprocess.run(['python3', '-c', test_script], 
                                      capture_output=True, text=True, timeout=30)
                
                if result.returncode == 0:
                    return True, f"AI models operational: {result.stdout.strip()}"
                else:
                    return False, f"Model loading test failed: {result.stderr}"
                    
            except subprocess.TimeoutExpired:
                return False, "Model loading test timeout"
                
        except Exception as e:
            return False, f"Layer 1 validation exception: {str(e)}"
    
    async def validate_layer_2(self) -> Tuple[bool, str]:
        """Layer 2: Data Pipeline Integrity"""
        try:
            # Check data pipeline components
            data_pipeline_files = [
                "data/property_data_schema.json",
                "data/market_data_schema.json",
                "pipeline/data_processor.py",
                "pipeline/feature_engineer.py"
            ]
            
            missing_pipeline_files = []
            for file in data_pipeline_files:
                if not (self.component_path / file).exists():
                    missing_pipeline_files.append(file)
            
            if missing_pipeline_files:
                return False, f"Missing data pipeline files: {', '.join(missing_pipeline_files)}"
            
            # Test data processing pipeline
            try:
                test_data_processing = f"""
import sys
sys.path.append('{self.component_path}')
from pipeline.data_processor import PropertyDataProcessor
import pandas as pd

processor = PropertyDataProcessor()

# Test with sample property data
sample_data = {{
    'property_id': 'TEST001',
    'address': '123 Test Street',
    'square_feet': 2000,
    'bedrooms': 3,
    'bathrooms': 2,
    'year_built': 1990,
    'lot_size': 0.5,
    'neighborhood': 'Test Neighborhood'
}}

processed_data = processor.process_property(sample_data)

if 'features' in processed_data and len(processed_data['features']) > 0:
    print(f"Data pipeline operational: processed {{len(processed_data['features'])}} features")
else:
    print("Data processing failed")
    exit(1)
"""
                
                result = subprocess.run(['python3', '-c', test_data_processing], 
                                      capture_output=True, text=True, timeout=20)
                
                if result.returncode == 0:
                    return True, f"Data pipeline operational: {result.stdout.strip()}"
                else:
                    return False, f"Data pipeline test failed: {result.stderr}"
                    
            except subprocess.TimeoutExpired:
                return False, "Data pipeline test timeout"
                
        except Exception as e:
            return False, f"Layer 2 validation exception: {str(e)}"
    
    async def validate_layer_3(self) -> Tuple[bool, str]:
        """Layer 3: Property Valuation Engine"""
        try:
            # Test the valuation engine API if running
            try:
                valuation_endpoint = "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/costforge/valuation"
                
                test_property = {
                    "address": "123 Test Property Lane",
                    "square_feet": 2500,
                    "bedrooms": 4,
                    "bathrooms": 3,
                    "year_built": 2000,
                    "lot_size": 0.75,
                    "neighborhood": "Professional District",
                    "property_type": "single_family"
                }
                
                response = requests.post(valuation_endpoint, 
                                       json=test_property, 
                                       timeout=15)
                
                if response.status_code == 200:
                    valuation_data = response.json()
                    
                    required_fields = ['estimated_value', 'confidence_score', 'valuation_date']
                    missing_fields = [field for field in required_fields if field not in valuation_data]
                    
                    if missing_fields:
                        return False, f"Valuation response missing fields: {', '.join(missing_fields)}"
                    
                    estimated_value = valuation_data['estimated_value']
                    confidence_score = valuation_data['confidence_score']
                    
                    if estimated_value > 0 and 0 <= confidence_score <= 1:
                        return True, f"Valuation engine operational: ${estimated_value:,.2f} (confidence: {confidence_score:.2f})"
                    else:
                        return False, f"Invalid valuation results: value=${estimated_value}, confidence={confidence_score}"
                        
                elif response.status_code == 404:
                    return False, "Valuation API endpoint not found - service may not be running"
                else:
                    return False, f"Valuation API error: {response.status_code}"
                    
            except requests.exceptions.RequestException as e:
                return False, f"Cannot connect to valuation API: {str(e)}"
                
        except Exception as e:
            return False, f"Layer 3 validation exception: {str(e)}"
    
    async def validate_layer_4(self) -> Tuple[bool, str]:
        """Layer 4: API Endpoint Functionality"""
        try:
            # Test CostForge API endpoints
            api_endpoints = [
                "/api/costforge/health",
                "/api/costforge/models/status",
                "/api/costforge/property/search",
                "/api/costforge/market/analysis"
            ]
            
            base_url = "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}"
            working_endpoints = []
            failed_endpoints = []
            
            for endpoint in api_endpoints:
                try:
                    response = requests.get(f"{base_url}{endpoint}", timeout=5)
                    if response.status_code in [200, 201, 202]:
                        working_endpoints.append(endpoint)
                    else:
                        failed_endpoints.append(f"{endpoint} ({response.status_code})")
                except requests.exceptions.RequestException:
                    failed_endpoints.append(f"{endpoint} (no response)")
            
            if len(working_endpoints) >= 2:  # At least 2 endpoints working
                return True, f"API endpoints operational: {len(working_endpoints)}/{len(api_endpoints)} responding"
            else:
                return False, f"API endpoint failures: {', '.join(failed_endpoints)}"
                
        except Exception as e:
            return False, f"Layer 4 validation exception: {str(e)}"
    
    async def validate_layer_5(self) -> Tuple[bool, str]:
        """Layer 5: Database Connection Testing"""
        try:
            # Test database connectivity for CostForge
            try:
                db_test_endpoint = "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/costforge/database/test"
                
                response = requests.get(db_test_endpoint, timeout=10)
                
                if response.status_code == 200:
                    db_data = response.json()
                    
                    if 'database_status' in db_data:
                        db_status = db_data['database_status']
                        
                        if db_status.lower() in ['connected', 'healthy', 'operational']:
                            # Test basic database operations
                            test_query_response = requests.post(
                                f"{db_test_endpoint}/query",
                                json={"query": "SELECT COUNT(*) FROM properties LIMIT 1"},
                                timeout=10
                            )
                            
                            if test_query_response.status_code == 200:
                                return True, f"Database connection operational: {db_status}"
                            else:
                                return False, f"Database query test failed: {test_query_response.status_code}"
                        else:
                            return False, f"Database unhealthy: {db_status}"
                    else:
                        return False, "Database test API returned invalid format"
                        
                elif response.status_code == 404:
                    return False, "Database test endpoint not found - service may not be running"
                else:
                    return False, f"Database test API error: {response.status_code}"
                    
            except requests.exceptions.RequestException as e:
                return False, f"Cannot connect to database test API: {str(e)}"
                
        except Exception as e:
            return False, f"Layer 5 validation exception: {str(e)}"
    
    async def validate_layer_6(self) -> Tuple[bool, str]:
        """Layer 6: Security Token Validation"""
        try:
            # Test security token mechanisms
            security_endpoints = [
                "/api/costforge/auth/validate-token",
                "/api/costforge/security/permissions",
                "/api/costforge/encryption/test"
            ]
            
            security_results = []
            
            for endpoint in security_endpoints:
                try:
                    response = requests.get(f"http://localhost:\${{TF_API_HTTPS_PORT:-5001}}{endpoint}", timeout=5)
                    if response.status_code in [200, 401]:  # 401 is expected for auth endpoints without tokens
                        security_results.append(f"{endpoint} ✓")
                    else:
                        security_results.append(f"{endpoint} ✗ ({response.status_code})")
                except requests.exceptions.RequestException:
                    security_results.append(f"{endpoint} ✗ (no response)")
            
            passed_tests = len([r for r in security_results if '✓' in r])
            
            if passed_tests >= 2:  # At least 2 security endpoints responding appropriately
                return True, f"Security tokens operational: {passed_tests}/3 endpoints responding"
            else:
                return False, f"Security validation failures: {'; '.join(security_results)}"
                
        except Exception as e:
            return False, f"Layer 6 validation exception: {str(e)}"
    
    async def validate_layer_7(self) -> Tuple[bool, str]:
        """Layer 7: Compliance Rule Engine"""
        try:
            # Test compliance rule validation
            compliance_tests = [
                {"rule": "property_disclosure_requirements", "expected": True},
                {"rule": "fair_housing_compliance", "expected": True},
                {"rule": "assessment_methodology_standards", "expected": True}
            ]
            
            compliance_results = []
            
            for test in compliance_tests:
                try:
                    response = requests.post(
                        "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/costforge/compliance/validate",
                        json={"rule": test['rule'], "property_id": "TEST001"},
                        timeout=10
                    )
                    
                    if response.status_code == 200:
                        compliance_data = response.json()
                        if compliance_data.get('compliant') == test['expected']:
                            compliance_results.append(f"{test['rule']} ✓")
                        else:
                            compliance_results.append(f"{test['rule']} ✗ (non-compliant)")
                    else:
                        compliance_results.append(f"{test['rule']} ✗ ({response.status_code})")
                        
                except requests.exceptions.RequestException:
                    compliance_results.append(f"{test['rule']} ✗ (no response)")
            
            passed_compliance = len([r for r in compliance_results if '✓' in r])
            
            if passed_compliance >= 2:  # At least 2 compliance rules working
                return True, f"Compliance engine operational: {passed_compliance}/3 rules validated"
            else:
                return False, f"Compliance failures: {'; '.join(compliance_results)}"
                
        except Exception as e:
            return False, f"Layer 7 validation exception: {str(e)}"
    
    async def validate_layer_8(self) -> Tuple[bool, str]:
        """Layer 8: Performance Metrics Validation"""
        try:
            # Test performance monitoring
            try:
                response = requests.get("http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/costforge/metrics", timeout=10)
                
                if response.status_code == 200:
                    metrics_data = response.json()
                    
                    required_metrics = ['valuation_response_time', 'model_accuracy', 'throughput']
                    missing_metrics = [metric for metric in required_metrics if metric not in metrics_data]
                    
                    if missing_metrics:
                        return False, f"Missing performance metrics: {', '.join(missing_metrics)}"
                    
                    # Validate metric values
                    response_time = metrics_data['valuation_response_time']
                    accuracy = metrics_data['model_accuracy']
                    throughput = metrics_data['throughput']
                    
                    if response_time > 5000:  # > 5 seconds is too slow
                        return False, f"Performance issue: response time {response_time}ms too high"
                    
                    if accuracy < 0.8:  # < 80% accuracy is too low
                        return False, f"Performance issue: model accuracy {accuracy:.2f} too low"
                    
                    return True, f"Performance metrics validated: {response_time}ms response, {accuracy:.2f} accuracy"
                    
                elif response.status_code == 404:
                    return False, "Performance metrics endpoint not found"
                else:
                    return False, f"Performance metrics API error: {response.status_code}"
                    
            except requests.exceptions.RequestException as e:
                return False, f"Cannot connect to performance metrics API: {str(e)}"
                
        except Exception as e:
            return False, f"Layer 8 validation exception: {str(e)}"
    
    async def validate_layer_9(self) -> Tuple[bool, str]:
        """Layer 9: Error Handling & Recovery"""
        try:
            # Test error handling mechanisms
            error_test_cases = [
                {"endpoint": "/api/costforge/valuation", "data": {"invalid": "data"}, "expected_status": 400},
                {"endpoint": "/api/costforge/property/nonexistent", "data": None, "expected_status": 404},
                {"endpoint": "/api/costforge/timeout-test", "data": None, "expected_status": 408}
            ]
            
            error_handling_results = []
            
            for test_case in error_test_cases:
                try:
                    if test_case['data']:
                        response = requests.post(
                            f"http://localhost:\${{TF_API_HTTPS_PORT:-5001}}{test_case['endpoint']}", 
                            json=test_case['data'], 
                            timeout=5
                        )
                    else:
                        response = requests.get(
                            f"http://localhost:\${{TF_API_HTTPS_PORT:-5001}}{test_case['endpoint']}", 
                            timeout=5
                        )
                    
                    if response.status_code == test_case['expected_status']:
                        error_handling_results.append(f"{test_case['endpoint']} ✓")
                    else:
                        error_handling_results.append(f"{test_case['endpoint']} ✗ (got {response.status_code}, expected {test_case['expected_status']})")
                        
                except requests.exceptions.RequestException:
                    # Timeout or connection errors might be expected for some tests
                    if test_case['expected_status'] == 408:
                        error_handling_results.append(f"{test_case['endpoint']} ✓")
                    else:
                        error_handling_results.append(f"{test_case['endpoint']} ✗ (connection error)")
            
            passed_error_tests = len([r for r in error_handling_results if '✓' in r])
            
            if passed_error_tests >= 2:  # At least 2 error handling tests passing
                return True, f"Error handling operational: {passed_error_tests}/3 scenarios handled correctly"
            else:
                return False, f"Error handling failures: {'; '.join(error_handling_results)}"
                
        except Exception as e:
            return False, f"Layer 9 validation exception: {str(e)}"
    
    async def validate_layer_10(self) -> Tuple[bool, str]:
        """Layer 10: Logging System Validation"""
        try:
            # Check for log files and logging functionality
            log_path = self.component_path / "logs"
            
            expected_log_files = [
                "costforge.log",
                "valuation.log",
                "api.log",
                "errors.log"
            ]
            
            existing_log_files = []
            for log_file in expected_log_files:
                if (log_path / log_file).exists():
                    existing_log_files.append(log_file)
            
            if len(existing_log_files) == 0:
                return False, "No log files found"
            
            # Test logging functionality
            try:
                response = requests.post(
                    "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/costforge/logging/test",
                    json={"level": "info", "message": "CostForge validation test"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    return True, f"Logging system operational: {len(existing_log_files)}/{len(expected_log_files)} log files active"
                else:
                    return False, f"Logging test failed: {response.status_code}"
                    
            except requests.exceptions.RequestException as e:
                # If logging API not available, check if at least log files exist
                if len(existing_log_files) >= 2:
                    return True, f"Logging system partially operational: {len(existing_log_files)} log files found"
                else:
                    return False, f"Logging system not accessible and insufficient log files: {existing_log_files}"
                
        except Exception as e:
            return False, f"Layer 10 validation exception: {str(e)}"
    
    async def validate_layer_11(self) -> Tuple[bool, str]:
        """Layer 11: OS Integration Testing"""
        try:
            # Test integration with TerraFusion OS
            integration_tests = [
                {"service": "OS_Core", "endpoint": "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/modules/costforge/status"},
                {"service": "Desktop_Shell", "endpoint": "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/modules/costforge"},
                {"service": "Marketplace", "endpoint": "http://localhost:\${{TF_API_HTTPS_PORT:-5001}}/api/plugins/costforge"}
            ]
            
            integration_results = {}
            
            for test in integration_tests:
                try:
                    response = requests.get(test['endpoint'], timeout=5)
                    integration_results[test['service']] = response.status_code == 200
                except requests.exceptions.RequestException:
                    integration_results[test['service']] = False
            
            successful_integrations = [k for k, v in integration_results.items() if v]
            
            if len(successful_integrations) >= 1:  # At least one OS integration working
                return True, f"OS integration operational: {', '.join(successful_integrations)} responding"
            else:
                return False, "No OS integrations responding - module may not be properly registered"
                
        except Exception as e:
            return False, f"Layer 11 validation exception: {str(e)}"
