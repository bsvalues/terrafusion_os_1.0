#!/usr/bin/env python3
"""
TerraFusion Frontend Comprehensive Audit
Tests all pages, features, AI agents, and API endpoints
"""

import requests
import json
import time
from datetime import datetime
from urllib.parse import urljoin

class FrontendAuditor:
    def __init__(self, base_url="http://localhost:5000", sync_url="http://localhost:8080"):
        self.base_url = base_url
        self.sync_url = sync_url
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "pages_tested": [],
            "api_endpoints_tested": [],
            "features_tested": [],
            "ai_agents_tested": [],
            "errors": [],
            "warnings": [],
            "summary": {}
        }
    
    def test_page(self, path, expected_title=None):
        """Test a frontend page"""
        try:
            url = urljoin(self.base_url, path)
            response = requests.get(url, timeout=10)
            
            page_result = {
                "path": path,
                "url": url,
                "status_code": response.status_code,
                "response_time_ms": response.elapsed.total_seconds() * 1000,
                "content_length": len(response.content),
                "has_title": False,
                "title": None,
                "status": "unknown"
            }
            
            if response.status_code == 200:
                content = response.text
                if "<title>" in content:
                    start = content.find("<title>") + 7
                    end = content.find("</title>", start)
                    if end > start:
                        page_result["title"] = content[start:end].strip()
                        page_result["has_title"] = True
                
                if expected_title and page_result["title"]:
                    if expected_title.lower() in page_result["title"].lower():
                        page_result["status"] = "pass"
                    else:
                        page_result["status"] = "warning"
                        self.results["warnings"].append(f"Title mismatch on {path}: expected '{expected_title}', got '{page_result['title']}'")
                else:
                    page_result["status"] = "pass"
            else:
                page_result["status"] = "fail"
                self.results["errors"].append(f"Page {path} returned {response.status_code}")
            
            self.results["pages_tested"].append(page_result)
            return page_result
            
        except Exception as e:
            error_result = {
                "path": path,
                "status": "error",
                "error": str(e)
            }
            self.results["pages_tested"].append(error_result)
            self.results["errors"].append(f"Error testing {path}: {str(e)}")
            return error_result
    
    def test_api_endpoint(self, path, method="GET", data=None, expected_keys=None):
        """Test an API endpoint"""
        try:
            url = urljoin(self.base_url, path)
            
            if method == "GET":
                response = requests.get(url, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            api_result = {
                "path": path,
                "method": method,
                "url": url,
                "status_code": response.status_code,
                "response_time_ms": response.elapsed.total_seconds() * 1000,
                "content_type": response.headers.get('content-type', ''),
                "status": "unknown",
                "response_data": None
            }
            
            if response.status_code in [200, 201]:
                try:
                    json_data = response.json()
                    api_result["response_data"] = json_data
                    api_result["status"] = "pass"
                    
                    if expected_keys:
                        missing_keys = [key for key in expected_keys if key not in json_data]
                        if missing_keys:
                            api_result["status"] = "warning"
                            self.results["warnings"].append(f"API {path} missing keys: {missing_keys}")
                
                except json.JSONDecodeError:
                    api_result["status"] = "warning"
                    self.results["warnings"].append(f"API {path} returned non-JSON response")
            else:
                api_result["status"] = "fail"
                self.results["errors"].append(f"API {path} returned {response.status_code}")
            
            self.results["api_endpoints_tested"].append(api_result)
            return api_result
            
        except Exception as e:
            error_result = {
                "path": path,
                "method": method,
                "status": "error",
                "error": str(e)
            }
            self.results["api_endpoints_tested"].append(error_result)
            self.results["errors"].append(f"Error testing API {path}: {str(e)}")
            return error_result
    
    def test_feature_functionality(self, feature_name, test_function):
        """Test a specific feature"""
        try:
            start_time = time.time()
            result = test_function()
            duration = (time.time() - start_time) * 1000
            
            feature_result = {
                "feature_name": feature_name,
                "duration_ms": duration,
                "status": result.get("status", "unknown"),
                "details": result
            }
            
            self.results["features_tested"].append(feature_result)
            return feature_result
            
        except Exception as e:
            error_result = {
                "feature_name": feature_name,
                "status": "error",
                "error": str(e)
            }
            self.results["features_tested"].append(error_result)
            self.results["errors"].append(f"Error testing feature {feature_name}: {str(e)}")
            return error_result
    
    def test_export_workflow(self):
        """Test the complete export workflow"""
        # Create export job
        create_response = self.test_api_endpoint(
            "/api/export/jobs",
            method="POST",
            data={"format": "geojson", "county_id": "benton-wa"},
            expected_keys=["job_id", "status"]
        )
        
        if create_response.get("status") != "pass":
            return {"status": "fail", "error": "Failed to create export job"}
        
        job_id = create_response["response_data"]["job_id"]
        
        # Check job status
        status_response = self.test_api_endpoint(
            f"/api/export/jobs/{job_id}",
            expected_keys=["status", "job_id"]
        )
        
        if status_response.get("status") != "pass":
            return {"status": "fail", "error": "Failed to get job status"}
        
        # List all jobs
        list_response = self.test_api_endpoint(
            "/api/export/jobs",
            expected_keys=["jobs", "total_count"]
        )
        
        return {
            "status": "pass" if list_response.get("status") == "pass" else "warning",
            "create_job": create_response,
            "check_status": status_response,
            "list_jobs": list_response
        }
    
    def test_district_lookup_workflow(self):
        """Test district lookup functionality"""
        # Test coordinate lookup
        coord_response = self.test_api_endpoint(
            "/api/district/lookup/coordinates",
            method="POST",
            data={"latitude": 46.2396, "longitude": -119.2781, "county_id": "benton-wa"},
            expected_keys=["coordinates", "districts"]
        )
        
        # Test address lookup
        addr_response = self.test_api_endpoint(
            "/api/district/lookup/address",
            method="POST",
            data={"address": "123 Main St, Richland, WA", "county_id": "benton-wa"},
            expected_keys=["address", "coordinates", "districts"]
        )
        
        # Test district listing
        list_response = self.test_api_endpoint(
            "/api/districts?county_id=benton-wa",
            expected_keys=["districts", "total_count"]
        )
        
        return {
            "status": "pass" if all(r.get("status") == "pass" for r in [coord_response, addr_response, list_response]) else "warning",
            "coordinate_lookup": coord_response,
            "address_lookup": addr_response,
            "district_list": list_response
        }
    
    def test_ai_analysis_features(self):
        """Test AI analysis capabilities"""
        # Test performance analytics API
        perf_response = self.test_api_endpoint(
            "/api/performance/analytics",
            expected_keys=["system_performance", "job_statistics"]
        )
        
        # Test enterprise monitoring
        monitor_response = self.test_api_endpoint(
            "/api/enterprise/monitoring/dashboard",
            expected_keys=["metrics", "alerts"]
        )
        
        return {
            "status": "pass" if perf_response.get("status") == "pass" else "warning",
            "performance_analytics": perf_response,
            "enterprise_monitoring": monitor_response
        }
    
    def test_sync_service(self):
        """Test sync service functionality"""
        try:
            # Test sync service health
            health_response = requests.get(f"{self.sync_url}/health", timeout=5)
            sync_result = {
                "health_check": {
                    "status_code": health_response.status_code,
                    "response_time_ms": health_response.elapsed.total_seconds() * 1000,
                    "status": "pass" if health_response.status_code == 200 else "fail"
                }
            }
            
            if health_response.status_code == 200:
                sync_result["health_data"] = health_response.json()
            
            # Test sync metrics
            try:
                metrics_response = requests.get(f"{self.sync_url}/api/metrics", timeout=5)
                sync_result["metrics_check"] = {
                    "status_code": metrics_response.status_code,
                    "status": "pass" if metrics_response.status_code == 200 else "fail"
                }
                if metrics_response.status_code == 200:
                    sync_result["metrics_data"] = metrics_response.json()
            except:
                sync_result["metrics_check"] = {"status": "error", "error": "Metrics endpoint unavailable"}
            
            return {
                "status": "pass" if sync_result["health_check"]["status"] == "pass" else "fail",
                "details": sync_result
            }
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def run_comprehensive_audit(self):
        """Run complete frontend audit"""
        print("Starting comprehensive frontend audit...")
        
        # Test main pages
        main_pages = [
            ("/", "TerraFusion"),
            ("/dashboard", "Dashboard"),
            ("/gis/dashboard", "GIS"),
            ("/district/dashboard", "District"),
            ("/ai/dashboard", "AI"),
            ("/pacs/dashboard", "PACS"),
            ("/project/dashboard", "Project"),
            ("/project/tasks", "Tasks"),
            ("/project/team", "Team"),
            ("/project/timeline", "Timeline"),
            ("/project/reports", "Reports"),
            ("/saga/dashboard", "Saga"),
            ("/settings", "Settings")
        ]
        
        print("Testing main pages...")
        for path, expected_title in main_pages:
            result = self.test_page(path, expected_title)
            print(f"  {path}: {result.get('status', 'unknown')}")
        
        # Test API endpoints
        api_endpoints = [
            ("/health", ["status", "timestamp"]),
            ("/api/district/info", ["service", "version"]),
            ("/api/districts", ["districts", "total_count"])
        ]
        
        print("Testing API endpoints...")
        for path, expected_keys in api_endpoints:
            result = self.test_api_endpoint(path, expected_keys=expected_keys)
            print(f"  {path}: {result.get('status', 'unknown')}")
        
        # Test feature workflows
        print("Testing feature workflows...")
        
        export_result = self.test_feature_functionality("Export Workflow", self.test_export_workflow)
        print(f"  Export Workflow: {export_result.get('status', 'unknown')}")
        
        district_result = self.test_feature_functionality("District Lookup", self.test_district_lookup_workflow)
        print(f"  District Lookup: {district_result.get('status', 'unknown')}")
        
        ai_result = self.test_feature_functionality("AI Analysis", self.test_ai_analysis_features)
        print(f"  AI Analysis: {ai_result.get('status', 'unknown')}")
        
        sync_result = self.test_feature_functionality("Sync Service", self.test_sync_service)
        print(f"  Sync Service: {sync_result.get('status', 'unknown')}")
        
        # Generate summary
        self.generate_summary()
        
        return self.results
    
    def generate_summary(self):
        """Generate audit summary"""
        total_pages = len(self.results["pages_tested"])
        passed_pages = len([p for p in self.results["pages_tested"] if p.get("status") == "pass"])
        
        total_apis = len(self.results["api_endpoints_tested"])
        passed_apis = len([a for a in self.results["api_endpoints_tested"] if a.get("status") == "pass"])
        
        total_features = len(self.results["features_tested"])
        passed_features = len([f for f in self.results["features_tested"] if f.get("status") == "pass"])
        
        self.results["summary"] = {
            "pages": {"total": total_pages, "passed": passed_pages, "success_rate": (passed_pages/total_pages)*100 if total_pages > 0 else 0},
            "apis": {"total": total_apis, "passed": passed_apis, "success_rate": (passed_apis/total_apis)*100 if total_apis > 0 else 0},
            "features": {"total": total_features, "passed": passed_features, "success_rate": (passed_features/total_features)*100 if total_features > 0 else 0},
            "overall_health": "healthy" if len(self.results["errors"]) == 0 else "degraded" if len(self.results["errors"]) < 3 else "critical",
            "total_errors": len(self.results["errors"]),
            "total_warnings": len(self.results["warnings"])
        }
    
    def save_report(self, filename="frontend_audit_report.json"):
        """Save audit report to file"""
        with open(filename, 'w') as f:
            json.dump(self.results, f, indent=2)
        print(f"Audit report saved to {filename}")

if __name__ == "__main__":
    auditor = FrontendAuditor()
    results = auditor.run_comprehensive_audit()
    auditor.save_report()
    
    # Print summary
    summary = results["summary"]
    print(f"\n{'='*60}")
    print("FRONTEND AUDIT SUMMARY")
    print(f"{'='*60}")
    print(f"Pages: {summary['pages']['passed']}/{summary['pages']['total']} ({summary['pages']['success_rate']:.1f}%)")
    print(f"APIs: {summary['apis']['passed']}/{summary['apis']['total']} ({summary['apis']['success_rate']:.1f}%)")
    print(f"Features: {summary['features']['passed']}/{summary['features']['total']} ({summary['features']['success_rate']:.1f}%)")
    print(f"Overall Health: {summary['overall_health'].upper()}")
    print(f"Errors: {summary['total_errors']}")
    print(f"Warnings: {summary['total_warnings']}")
    print(f"{'='*60}")