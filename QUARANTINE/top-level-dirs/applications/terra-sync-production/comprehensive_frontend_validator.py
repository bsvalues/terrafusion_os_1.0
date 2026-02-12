#!/usr/bin/env python3
"""
Comprehensive Frontend Validation System
Ensures all pages, features, routes, and tools are properly registered and functional
"""

import os
import re
import json
import requests
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Tuple

class FrontendValidator:
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.validation_results = {
            "timestamp": datetime.now().isoformat(),
            "route_analysis": {},
            "template_analysis": {},
            "navigation_consistency": {},
            "api_endpoint_mapping": {},
            "feature_completeness": {},
            "ui_consistency": {},
            "errors": [],
            "warnings": [],
            "recommendations": []
        }
    
    def extract_routes_from_app(self):
        """Extract all routes defined in app.py"""
        routes = {}
        try:
            with open("app.py", "r") as f:
                content = f.read()
            
            # Find all @app.route decorators
            route_pattern = r"@app\.route\(['\"]([^'\"]+)['\"](?:,\s*methods=\[([^\]]+)\])?\)\s*def\s+(\w+)"
            matches = re.findall(route_pattern, content)
            
            for route_path, methods, function_name in matches:
                methods_list = ["GET"] if not methods else [m.strip().strip("'\"") for m in methods.split(",")]
                routes[route_path] = {
                    "function": function_name,
                    "methods": methods_list,
                    "defined": True
                }
            
            return routes
        except Exception as e:
            self.validation_results["errors"].append(f"Failed to extract routes: {e}")
            return {}
    
    def scan_templates(self):
        """Scan all templates and their inheritance chain"""
        templates = {}
        templates_dir = Path("templates")
        
        if not templates_dir.exists():
            self.validation_results["errors"].append("Templates directory not found")
            return templates
        
        for template_file in templates_dir.rglob("*.html"):
            relative_path = template_file.relative_to(templates_dir)
            template_info = {
                "path": str(relative_path),
                "exists": True,
                "extends": None,
                "blocks": [],
                "variables": [],
                "includes": [],
                "size_bytes": template_file.stat().st_size
            }
            
            try:
                with open(template_file, "r") as f:
                    content = f.read()
                
                # Find extends
                extends_match = re.search(r'{%\s*extends\s+["\']([^"\']+)["\']\s*%}', content)
                if extends_match:
                    template_info["extends"] = extends_match.group(1)
                
                # Find blocks
                block_matches = re.findall(r'{%\s*block\s+(\w+)\s*%}', content)
                template_info["blocks"] = block_matches
                
                # Find variables
                var_matches = re.findall(r'{{\s*([^}]+)\s*}}', content)
                template_info["variables"] = [v.strip() for v in var_matches]
                
                # Find includes
                include_matches = re.findall(r'{%\s*include\s+["\']([^"\']+)["\']\s*%}', content)
                template_info["includes"] = include_matches
                
            except Exception as e:
                template_info["error"] = str(e)
                self.validation_results["errors"].append(f"Template {relative_path}: {e}")
            
            templates[str(relative_path)] = template_info
        
        return templates
    
    def validate_template_inheritance(self, templates):
        """Validate template inheritance chain"""
        inheritance_issues = []
        
        for template_name, template_info in templates.items():
            if template_info.get("extends"):
                parent_template = template_info["extends"]
                if parent_template not in templates:
                    inheritance_issues.append({
                        "template": template_name,
                        "issue": f"Extends missing template: {parent_template}",
                        "severity": "error"
                    })
        
        return inheritance_issues
    
    def test_route_responses(self, routes):
        """Test all routes for proper responses"""
        route_tests = {}
        
        for route_path, route_info in routes.items():
            if "GET" in route_info["methods"]:
                try:
                    # Skip dynamic routes for now
                    if "<" in route_path:
                        continue
                    
                    url = f"{self.base_url}{route_path}"
                    response = requests.get(url, timeout=10)
                    
                    route_tests[route_path] = {
                        "status_code": response.status_code,
                        "response_time_ms": response.elapsed.total_seconds() * 1000,
                        "content_type": response.headers.get("content-type", ""),
                        "content_length": len(response.content),
                        "accessible": response.status_code < 400,
                        "template_rendered": "<!DOCTYPE html>" in response.text if response.status_code == 200 else False
                    }
                    
                    # Check for template errors
                    if "UndefinedError" in response.text or "TemplateNotFound" in response.text:
                        route_tests[route_path]["template_error"] = True
                    
                except Exception as e:
                    route_tests[route_path] = {
                        "error": str(e),
                        "accessible": False
                    }
        
        return route_tests
    
    def validate_navigation_consistency(self, templates):
        """Check navigation consistency across templates"""
        nav_elements = {}
        
        for template_name, template_info in templates.items():
            if template_name in ["base.html", "base_clean.html"]:
                # Extract navigation links from base templates
                try:
                    with open(f"templates/{template_name}", "r") as f:
                        content = f.read()
                    
                    # Find navigation links
                    nav_links = re.findall(r'href=["\']([^"\']+)["\']', content)
                    nav_elements[template_name] = nav_links
                    
                except Exception as e:
                    self.validation_results["errors"].append(f"Nav analysis {template_name}: {e}")
        
        return nav_elements
    
    def analyze_api_endpoints(self, routes):
        """Analyze API endpoint structure and consistency"""
        api_routes = {k: v for k, v in routes.items() if k.startswith("/api/")}
        api_analysis = {
            "total_endpoints": len(api_routes),
            "endpoints_by_prefix": {},
            "methods_distribution": {},
            "naming_consistency": []
        }
        
        # Group by prefix
        for route in api_routes:
            prefix = "/".join(route.split("/")[:3])  # /api/category
            if prefix not in api_analysis["endpoints_by_prefix"]:
                api_analysis["endpoints_by_prefix"][prefix] = []
            api_analysis["endpoints_by_prefix"][prefix].append(route)
        
        # Method distribution
        for route_info in api_routes.values():
            for method in route_info["methods"]:
                api_analysis["methods_distribution"][method] = api_analysis["methods_distribution"].get(method, 0) + 1
        
        return api_analysis
    
    def check_feature_completeness(self, routes, templates):
        """Check if all major features are properly implemented"""
        expected_features = {
            "dashboard": {
                "routes": ["/dashboard"],
                "templates": ["dashboard.html"],
                "apis": ["/health", "/api/performance/analytics"]
            },
            "gis_export": {
                "routes": ["/gis/dashboard", "/gis-dashboard"],
                "templates": ["gis_dashboard.html"],
                "apis": ["/api/export/jobs"]
            },
            "district_lookup": {
                "routes": ["/district/dashboard", "/district-lookup-dashboard"],
                "templates": ["district_lookup_dashboard.html"],
                "apis": ["/api/district/lookup/coordinates", "/api/districts"]
            },
            "ai_analysis": {
                "routes": ["/ai/dashboard", "/ai-analysis-dashboard"],
                "templates": ["ai_analysis_dashboard.html"],
                "apis": ["/api/performance/analytics"]
            },
            "pacs_sync": {
                "routes": ["/pacs/dashboard", "/pacs-sync-dashboard"],
                "templates": ["pacs_sync_dashboard.html"],
                "apis": []
            },
            "project_management": {
                "routes": ["/project/dashboard", "/project/tasks", "/project/team", "/project/timeline", "/project/reports"],
                "templates": ["project_dashboard.html", "project_tasks.html", "project_team.html", "project_timeline.html", "project_reports.html"],
                "apis": []
            },
            "settings": {
                "routes": ["/settings"],
                "templates": ["settings.html"],
                "apis": []
            }
        }
        
        feature_status = {}
        
        for feature_name, requirements in expected_features.items():
            status = {
                "routes_found": [],
                "routes_missing": [],
                "templates_found": [],
                "templates_missing": [],
                "apis_found": [],
                "apis_missing": [],
                "completeness_score": 0
            }
            
            # Check routes
            for route in requirements["routes"]:
                if route in routes:
                    status["routes_found"].append(route)
                else:
                    status["routes_missing"].append(route)
            
            # Check templates
            for template in requirements["templates"]:
                if template in templates:
                    status["templates_found"].append(template)
                else:
                    status["templates_missing"].append(template)
            
            # Check APIs
            for api in requirements["apis"]:
                if api in routes:
                    status["apis_found"].append(api)
                else:
                    status["apis_missing"].append(api)
            
            # Calculate completeness score
            total_requirements = len(requirements["routes"]) + len(requirements["templates"]) + len(requirements["apis"])
            found_requirements = len(status["routes_found"]) + len(status["templates_found"]) + len(status["apis_found"])
            
            if total_requirements > 0:
                status["completeness_score"] = (found_requirements / total_requirements) * 100
            
            feature_status[feature_name] = status
        
        return feature_status
    
    def validate_ui_consistency(self, templates):
        """Check UI consistency across templates"""
        ui_patterns = {
            "bootstrap_usage": 0,
            "custom_css_classes": set(),
            "font_awesome_usage": 0,
            "consistent_styling": True
        }
        
        for template_name, template_info in templates.items():
            try:
                with open(f"templates/{template_name}", "r") as f:
                    content = f.read()
                
                # Check Bootstrap usage
                if "class=" in content:
                    bootstrap_classes = re.findall(r'class=["\']([^"\']*(?:btn|card|container|row|col|nav|alert)[^"\']*)["\']', content)
                    ui_patterns["bootstrap_usage"] += len(bootstrap_classes)
                
                # Check Font Awesome
                fa_icons = re.findall(r'class=["\']([^"\']*fa[s|r|l|b]?[^"\']*)["\']', content)
                ui_patterns["font_awesome_usage"] += len(fa_icons)
                
                # Extract CSS classes
                all_classes = re.findall(r'class=["\']([^"\']+)["\']', content)
                for class_list in all_classes:
                    ui_patterns["custom_css_classes"].update(class_list.split())
                
            except Exception as e:
                continue
        
        ui_patterns["custom_css_classes"] = list(ui_patterns["custom_css_classes"])
        return ui_patterns
    
    def generate_missing_routes(self, feature_status):
        """Generate missing routes for incomplete features"""
        missing_routes = []
        
        for feature_name, status in feature_status.items():
            for missing_route in status["routes_missing"]:
                template_name = missing_route.replace("/", "_").replace("-", "_").strip("_") + ".html"
                if template_name.endswith("_.html"):
                    template_name = template_name.replace("_.html", ".html")
                
                route_code = f"""
@app.route('{missing_route}')
def {missing_route.replace('/', '_').replace('-', '_').strip('_')}():
    return render_template('{template_name}',
                         current_year=datetime.now().year)
"""
                missing_routes.append({
                    "route": missing_route,
                    "feature": feature_name,
                    "code": route_code.strip(),
                    "template": template_name
                })
        
        return missing_routes
    
    def run_comprehensive_validation(self):
        """Run complete frontend validation"""
        print("Starting comprehensive frontend validation...")
        
        # Step 1: Extract routes
        print("1. Extracting routes from app.py...")
        routes = self.extract_routes_from_app()
        self.validation_results["route_analysis"]["total_routes"] = len(routes)
        self.validation_results["route_analysis"]["routes"] = routes
        
        # Step 2: Scan templates
        print("2. Scanning template files...")
        templates = self.scan_templates()
        self.validation_results["template_analysis"]["total_templates"] = len(templates)
        self.validation_results["template_analysis"]["templates"] = templates
        
        # Step 3: Validate template inheritance
        print("3. Validating template inheritance...")
        inheritance_issues = self.validate_template_inheritance(templates)
        self.validation_results["template_analysis"]["inheritance_issues"] = inheritance_issues
        
        # Step 4: Test route responses
        print("4. Testing route responses...")
        route_tests = self.test_route_responses(routes)
        self.validation_results["route_analysis"]["response_tests"] = route_tests
        
        # Step 5: Check navigation consistency
        print("5. Checking navigation consistency...")
        nav_elements = self.validate_navigation_consistency(templates)
        self.validation_results["navigation_consistency"] = nav_elements
        
        # Step 6: Analyze API endpoints
        print("6. Analyzing API endpoints...")
        api_analysis = self.analyze_api_endpoints(routes)
        self.validation_results["api_endpoint_mapping"] = api_analysis
        
        # Step 7: Check feature completeness
        print("7. Checking feature completeness...")
        feature_status = self.check_feature_completeness(routes, templates)
        self.validation_results["feature_completeness"] = feature_status
        
        # Step 8: Validate UI consistency
        print("8. Validating UI consistency...")
        ui_patterns = self.validate_ui_consistency(templates)
        self.validation_results["ui_consistency"] = ui_patterns
        
        # Step 9: Generate recommendations
        print("9. Generating recommendations...")
        missing_routes = self.generate_missing_routes(feature_status)
        self.validation_results["missing_routes"] = missing_routes
        
        # Generate summary
        self.generate_validation_summary()
        
        return self.validation_results
    
    def generate_validation_summary(self):
        """Generate comprehensive validation summary"""
        summary = {
            "overall_health": "unknown",
            "total_routes": len(self.validation_results["route_analysis"].get("routes", {})),
            "accessible_routes": 0,
            "total_templates": len(self.validation_results["template_analysis"].get("templates", {})),
            "template_errors": len(self.validation_results["template_analysis"].get("inheritance_issues", [])),
            "feature_completeness_avg": 0,
            "critical_issues": 0,
            "warnings": 0
        }
        
        # Count accessible routes
        route_tests = self.validation_results["route_analysis"].get("response_tests", {})
        summary["accessible_routes"] = sum(1 for test in route_tests.values() if test.get("accessible", False))
        
        # Calculate average feature completeness
        feature_status = self.validation_results["feature_completeness"]
        if feature_status:
            completeness_scores = [status["completeness_score"] for status in feature_status.values()]
            summary["feature_completeness_avg"] = sum(completeness_scores) / len(completeness_scores)
        
        # Count issues
        summary["critical_issues"] = len(self.validation_results["errors"])
        summary["warnings"] = len(self.validation_results["warnings"])
        
        # Determine overall health
        if summary["critical_issues"] == 0 and summary["feature_completeness_avg"] > 80:
            summary["overall_health"] = "excellent"
        elif summary["critical_issues"] < 5 and summary["feature_completeness_avg"] > 60:
            summary["overall_health"] = "good"
        elif summary["feature_completeness_avg"] > 40:
            summary["overall_health"] = "fair"
        else:
            summary["overall_health"] = "poor"
        
        self.validation_results["summary"] = summary
    
    def save_validation_report(self, filename="comprehensive_frontend_validation.json"):
        """Save validation report to file"""
        with open(filename, "w") as f:
            json.dump(self.validation_results, f, indent=2, default=str)
        print(f"Validation report saved to {filename}")

if __name__ == "__main__":
    validator = FrontendValidator()
    results = validator.run_comprehensive_validation()
    validator.save_validation_report()
    
    # Print summary
    summary = results["summary"]
    print(f"\n{'='*80}")
    print("COMPREHENSIVE FRONTEND VALIDATION SUMMARY")
    print(f"{'='*80}")
    print(f"Overall Health: {summary['overall_health'].upper()}")
    print(f"Routes: {summary['accessible_routes']}/{summary['total_routes']} accessible")
    print(f"Templates: {summary['total_templates']} total, {summary['template_errors']} inheritance issues")
    print(f"Feature Completeness: {summary['feature_completeness_avg']:.1f}%")
    print(f"Critical Issues: {summary['critical_issues']}")
    print(f"Warnings: {summary['warnings']}")
    print(f"{'='*80}")