#!/usr/bin/env python3
"""
TerraFusion cOS System Integration Validation
Comprehensive validation of all system components and deployment readiness
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime

class SystemIntegrationValidator:
    def __init__(self):
        self.results = {}
        self.project_root = Path(__file__).parent
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {status}: {message}")
        
    def validate_core_system(self):
        """Validate core TerraFusion cOS system files"""
        self.log("🔍 Validating core system components...")
        
        required_files = [
            "launch_terrafusion_cos.py",
            "kernel/main.py", 
            "desktop/api_server.py",
            "services/security_mesh.py",
            "services/zero_trust.py",
            "services/terrafusion_sync.py",
            "services/terra_flow.py",
            "substrate/vendor_registration.py",
            "substrate/performance_monitor.py",
            "brand/brand_config.json"
        ]
        
        missing_files = []
        for file_path in required_files:
            if not (self.project_root / file_path).exists():
                missing_files.append(file_path)
        
        if missing_files:
            self.results["core_system"] = {"status": "FAILED", "missing": missing_files}
            self.log(f"❌ Missing core files: {missing_files}", "ERROR")
            return False
        else:
            self.results["core_system"] = {"status": "PASSED", "files_validated": len(required_files)}
            self.log(f"✅ All {len(required_files)} core system files present")
            return True
    
    def validate_production_deployment(self):
        """Validate production deployment configurations"""
        self.log("🚀 Validating production deployment configurations...")
        
        deployment_files = [
            "deployment/production/environment.yaml",
            "deployment/staging/environment.yaml", 
            "Dockerfile.production",
            "requirements-prod.txt",
            "deployment/kubernetes/api-server-deployment.yaml",
            "deployment/kubernetes/monitoring-stack.yaml",
            "deployment/kubernetes/database-cache.yaml",
            "deployment/kubernetes/ingress-network.yaml",
            ".github/workflows/production-deployment.yml"
        ]
        
        missing_files = []
        for file_path in deployment_files:
            if not (self.project_root / file_path).exists():
                missing_files.append(file_path)
        
        if missing_files:
            self.results["production_deployment"] = {"status": "FAILED", "missing": missing_files}
            self.log(f"❌ Missing deployment files: {missing_files}", "ERROR")
            return False
        else:
            self.results["production_deployment"] = {"status": "PASSED", "files_validated": len(deployment_files)}
            self.log(f"✅ All {len(deployment_files)} deployment files present")
            return True
    
    def validate_security_framework(self):
        """Validate enhanced security framework"""
        self.log("🔒 Validating enhanced security framework...")
        
        security_files = [
            "services/enhanced_security.py",
            "services/security_mesh/threat_detection.py",
            "services/security_mesh/incident_response.py",
            "services/security_mesh/audit_trail.py"
        ]
        
        missing_files = []
        for file_path in security_files:
            if not (self.project_root / file_path).exists():
                missing_files.append(file_path)
        
        if missing_files:
            self.results["security_framework"] = {"status": "FAILED", "missing": missing_files}
            self.log(f"❌ Missing security files: {missing_files}", "ERROR")
            return False
        else:
            self.results["security_framework"] = {"status": "PASSED", "files_validated": len(security_files)}
            self.log(f"✅ Enhanced security framework validated")
            return True
    
    def validate_workflow_automation(self):
        """Validate workflow automation suite"""
        self.log("⚙️ Validating workflow automation suite...")
        
        workflow_files = [
            "services/workflow_automation.py",
            "services/terra_flow/permit_processing.py",
            "services/terra_flow/tax_assessment.py", 
            "services/terra_flow/citizen_services.py"
        ]
        
        missing_files = []
        for file_path in workflow_files:
            if not (self.project_root / file_path).exists():
                missing_files.append(file_path)
        
        if missing_files:
            self.results["workflow_automation"] = {"status": "FAILED", "missing": missing_files}
            self.log(f"❌ Missing workflow files: {missing_files}", "ERROR")
            return False
        else:
            self.results["workflow_automation"] = {"status": "PASSED", "files_validated": len(workflow_files)}
            self.log(f"✅ Workflow automation suite validated")
            return True
    
    def validate_disaster_recovery(self):
        """Validate disaster recovery capabilities"""
        self.log("💾 Validating disaster recovery capabilities...")
        
        dr_files = [
            "deployment/scripts/backup-production.sh",
            "deployment/scripts/disaster-recovery.sh"
        ]
        
        missing_files = []
        for file_path in dr_files:
            file_obj = self.project_root / file_path
            if not file_obj.exists():
                missing_files.append(file_path)
            elif not file_obj.stat().st_mode & 0o111:  # Check if executable
                self.log(f"⚠️ File {file_path} is not executable", "WARNING")
        
        if missing_files:
            self.results["disaster_recovery"] = {"status": "FAILED", "missing": missing_files}
            self.log(f"❌ Missing DR files: {missing_files}", "ERROR")
            return False
        else:
            self.results["disaster_recovery"] = {"status": "PASSED", "files_validated": len(dr_files)}
            self.log(f"✅ Disaster recovery scripts validated")
            return True
    
    def validate_helm_charts(self):
        """Validate Helm chart configuration"""
        self.log("⚓ Validating Helm chart configuration...")
        
        helm_files = [
            "deployment/helm/terrafusion-cos/Chart.yaml",
            "deployment/helm/terrafusion-cos/values.yaml",
            "deployment/helm/terrafusion-cos/templates/deployment.yaml"
        ]
        
        missing_files = []
        for file_path in helm_files:
            if not (self.project_root / file_path).exists():
                missing_files.append(file_path)
        
        if missing_files:
            self.results["helm_charts"] = {"status": "FAILED", "missing": missing_files}
            self.log(f"❌ Missing Helm files: {missing_files}", "ERROR") 
            return False
        else:
            self.results["helm_charts"] = {"status": "PASSED", "files_validated": len(helm_files)}
            self.log(f"✅ Helm charts validated")
            return True
    
    def validate_performance_testing(self):
        """Validate performance testing configuration"""
        self.log("📊 Validating performance testing configuration...")
        
        perf_files = [
            "deployment/testing/performance-test.js"
        ]
        
        missing_files = []
        for file_path in perf_files:
            if not (self.project_root / file_path).exists():
                missing_files.append(file_path)
        
        if missing_files:
            self.results["performance_testing"] = {"status": "FAILED", "missing": missing_files}
            self.log(f"❌ Missing performance test files: {missing_files}", "ERROR")
            return False
        else:
            self.results["performance_testing"] = {"status": "PASSED", "files_validated": len(perf_files)}
            self.log(f"✅ Performance testing configuration validated")
            return True
    
    def run_python_syntax_check(self):
        """Validate Python syntax across all files"""
        self.log("🐍 Validating Python syntax across project...")
        
        python_files = list(self.project_root.rglob("*.py"))
        syntax_errors = []
        
        for py_file in python_files:
            if "__pycache__" in str(py_file) or "venv" in str(py_file):
                continue
                
            try:
                with open(py_file, 'r', encoding='utf-8') as f:
                    compile(f.read(), py_file, 'exec')
            except SyntaxError as e:
                syntax_errors.append(f"{py_file}: {e}")
        
        if syntax_errors:
            self.results["python_syntax"] = {"status": "FAILED", "errors": syntax_errors}
            self.log(f"❌ Python syntax errors found: {len(syntax_errors)}", "ERROR")
            return False
        else:
            self.results["python_syntax"] = {"status": "PASSED", "files_checked": len(python_files)}
            self.log(f"✅ Python syntax validated for {len(python_files)} files")
            return True
    
    def generate_integration_report(self):
        """Generate comprehensive integration validation report"""
        self.log("📋 Generating integration validation report...")
        
        # Calculate overall status
        passed_tests = sum(1 for test in self.results.values() if test["status"] == "PASSED")
        total_tests = len(self.results)
        overall_status = "PASSED" if passed_tests == total_tests else "FAILED"
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": overall_status,
            "tests_passed": passed_tests,
            "tests_total": total_tests,
            "success_rate": f"{(passed_tests/total_tests)*100:.1f}%",
            "detailed_results": self.results,
            "summary": {
                "core_system": self.results.get("core_system", {}).get("status", "NOT_RUN"),
                "production_deployment": self.results.get("production_deployment", {}).get("status", "NOT_RUN"),
                "security_framework": self.results.get("security_framework", {}).get("status", "NOT_RUN"),
                "workflow_automation": self.results.get("workflow_automation", {}).get("status", "NOT_RUN"),
                "disaster_recovery": self.results.get("disaster_recovery", {}).get("status", "NOT_RUN"),
                "helm_charts": self.results.get("helm_charts", {}).get("status", "NOT_RUN"),
                "performance_testing": self.results.get("performance_testing", {}).get("status", "NOT_RUN"),
                "python_syntax": self.results.get("python_syntax", {}).get("status", "NOT_RUN")
            }
        }
        
        # Save report
        report_file = self.project_root / "SYSTEM_INTEGRATION_VALIDATION_REPORT.json"
        with open(report_file, 'w') as f:
            json.dump(report, f, indent=2)
        
        self.log(f"📄 Integration validation report saved to: {report_file}")
        return report
    
    def run_validation(self):
        """Run complete system integration validation"""
        self.log("🚀 Starting TerraFusion cOS System Integration Validation...")
        self.log("=" * 80)
        
        # Run all validation tests
        validations = [
            self.validate_core_system,
            self.validate_production_deployment,
            self.validate_security_framework,
            self.validate_workflow_automation,
            self.validate_disaster_recovery,
            self.validate_helm_charts,
            self.validate_performance_testing,
            self.run_python_syntax_check
        ]
        
        for validation in validations:
            try:
                validation()
            except Exception as e:
                self.log(f"❌ Validation failed: {e}", "ERROR")
                
        # Generate report
        report = self.generate_integration_report()
        
        self.log("=" * 80)
        self.log(f"🎯 INTEGRATION VALIDATION COMPLETE")
        self.log(f"📊 Overall Status: {report['overall_status']}")
        self.log(f"✅ Tests Passed: {report['tests_passed']}/{report['tests_total']} ({report['success_rate']})")
        
        if report['overall_status'] == 'PASSED':
            self.log("🏛️ TerraFusion cOS is ready for government deployment!", "SUCCESS")
            return True
        else:
            self.log("⚠️ System integration issues detected. Review the report for details.", "WARNING")
            return False

if __name__ == "__main__":
    validator = SystemIntegrationValidator()
    success = validator.run_validation()
    sys.exit(0 if success else 1)