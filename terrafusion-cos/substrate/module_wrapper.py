"""
TerraFusion cOS Module Wrapper Service
Module deployment and wrapping for vendor solutions
"""

import asyncio
import json
import logging
import zipfile
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
from pathlib import Path
import importlib.util
import subprocess

class ModuleType(Enum):
    """Types of vendor modules"""
    WEB_APPLICATION = "web_application"
    DESKTOP_APPLICATION = "desktop_application"
    API_SERVICE = "api_service"
    DATA_PROCESSOR = "data_processor"
    INTEGRATION_CONNECTOR = "integration_connector"
    WORKFLOW_PLUGIN = "workflow_plugin"

class ModuleStatus(Enum):
    """Module deployment status"""
    PENDING = "pending"
    VALIDATING = "validating"
    DEPLOYING = "deploying"
    ACTIVE = "active"
    FAILED = "failed"
    SUSPENDED = "suspended"

class SecurityLevel(Enum):
    """Module security levels"""
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"

@dataclass
class ModuleManifest:
    """Module deployment manifest"""
    module_id: str
    name: str
    version: str
    description: str
    vendor_id: str
    module_type: ModuleType
    security_level: SecurityLevel
    dependencies: List[str] = field(default_factory=list)
    permissions: List[str] = field(default_factory=list)
    resource_requirements: Dict[str, Any] = field(default_factory=dict)
    endpoints: List[Dict[str, str]] = field(default_factory=list)
    configuration: Dict[str, Any] = field(default_factory=dict)
    
@dataclass
class DeployedModule:
    """Deployed module instance"""
    module_id: str
    manifest: ModuleManifest
    deployment_id: str
    status: ModuleStatus
    deployed_at: datetime
    last_health_check: Optional[datetime] = None
    health_status: str = "unknown"
    resource_usage: Dict[str, Any] = field(default_factory=dict)
    logs: List[str] = field(default_factory=list)

class ModuleValidator:
    """Validates vendor modules before deployment"""
    
    def __init__(self):
        self.validation_rules = {
            "security": self._validate_security,
            "dependencies": self._validate_dependencies,
            "permissions": self._validate_permissions,
            "code_quality": self._validate_code_quality,
            "compliance": self._validate_compliance
        }
        
    async def validate_module(self, module_path: str, manifest: ModuleManifest) -> Dict[str, Any]:
        """Comprehensive module validation"""
        validation_results = {
            "valid": True,
            "errors": [],
            "warnings": [],
            "security_score": 0,
            "compliance_status": "unknown"
        }
        
        # Run all validation checks
        for check_name, validator in self.validation_rules.items():
            try:
                result = await validator(module_path, manifest)
                if not result["passed"]:
                    validation_results["valid"] = False
                    validation_results["errors"].extend(result.get("errors", []))
                validation_results["warnings"].extend(result.get("warnings", []))
                
            except Exception as e:
                validation_results["valid"] = False
                validation_results["errors"].append(f"{check_name} validation failed: {str(e)}")
                
        return validation_results
        
    async def _validate_security(self, module_path: str, manifest: ModuleManifest) -> Dict[str, Any]:
        """Validate module security"""
        result = {"passed": True, "errors": [], "warnings": []}
        
        # Check for prohibited imports
        prohibited_imports = ["os.system", "subprocess.call", "eval", "exec"]
        
        try:
            # Scan Python files for security issues
            for py_file in Path(module_path).rglob("*.py"):
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                for prohibited in prohibited_imports:
                    if prohibited in content:
                        result["errors"].append(f"Prohibited import '{prohibited}' found in {py_file}")
                        result["passed"] = False
                        
        except Exception as e:
            result["warnings"].append(f"Security scan incomplete: {str(e)}")
            
        return result
        
    async def _validate_dependencies(self, module_path: str, manifest: ModuleManifest) -> Dict[str, Any]:
        """Validate module dependencies"""
        result = {"passed": True, "errors": [], "warnings": []}
        
        # Check if required dependencies are available
        for dep in manifest.dependencies:
            try:
                importlib.util.find_spec(dep)
            except ImportError:
                result["errors"].append(f"Required dependency '{dep}' not available")
                result["passed"] = False
                
        return result
        
    async def _validate_permissions(self, module_path: str, manifest: ModuleManifest) -> Dict[str, Any]:
        """Validate requested permissions"""
        result = {"passed": True, "errors": [], "warnings": []}
        
        allowed_permissions = [
            "filesystem:read", "filesystem:write", "network:http", "network:https",
            "database:read", "database:write", "api:terrafusion", "workflow:create"
        ]
        
        for permission in manifest.permissions:
            if permission not in allowed_permissions:
                result["errors"].append(f"Invalid permission requested: {permission}")
                result["passed"] = False
                
        return result
        
    async def _validate_code_quality(self, module_path: str, manifest: ModuleManifest) -> Dict[str, Any]:
        """Validate code quality and standards"""
        result = {"passed": True, "errors": [], "warnings": []}
        
        # Basic code quality checks
        try:
            python_files = list(Path(module_path).rglob("*.py"))
            if not python_files:
                result["warnings"].append("No Python files found for quality analysis")
                
            # Check for basic code structure
            for py_file in python_files[:5]:  # Limit to first 5 files
                with open(py_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                if len(content.strip()) == 0:
                    result["warnings"].append(f"Empty Python file: {py_file}")
                    
        except Exception as e:
            result["warnings"].append(f"Code quality check incomplete: {str(e)}")
            
        return result
        
    async def _validate_compliance(self, module_path: str, manifest: ModuleManifest) -> Dict[str, Any]:
        """Validate government compliance requirements"""
        result = {"passed": True, "errors": [], "warnings": []}
        
        # Check for compliance with government standards
        required_files = ["LICENSE", "SECURITY.md", "README.md"]
        
        for req_file in required_files:
            if not (Path(module_path) / req_file).exists():
                result["warnings"].append(f"Recommended file missing: {req_file}")
                
        return result

class ModuleDeployer:
    """Handles module deployment and lifecycle management"""
    
    def __init__(self):
        self.deployment_directory = Path("deployed_modules")
        self.deployment_directory.mkdir(exist_ok=True)
        
    async def deploy_module(self, module_path: str, manifest: ModuleManifest) -> Optional[str]:
        """Deploy validated module to cOS platform"""
        try:
            deployment_id = f"deploy_{manifest.module_id}_{int(datetime.now().timestamp())}"
            deploy_path = self.deployment_directory / deployment_id
            deploy_path.mkdir(exist_ok=True)
            
            # Extract and install module
            await self._extract_module(module_path, deploy_path)
            await self._install_dependencies(manifest, deploy_path)
            await self._configure_module(manifest, deploy_path)
            await self._start_module_services(manifest, deploy_path)
            
            logging.info(f"Module deployed successfully: {manifest.name} ({deployment_id})")
            return deployment_id
            
        except Exception as e:
            logging.error(f"Module deployment failed: {str(e)}")
            return None
            
    async def _extract_module(self, module_path: str, deploy_path: Path):
        """Extract module files to deployment directory"""
        if module_path.endswith('.zip'):
            with zipfile.ZipFile(module_path, 'r') as zip_ref:
                zip_ref.extractall(deploy_path)
        else:
            # Copy directory contents
            import shutil
            shutil.copytree(module_path, deploy_path / "module", dirs_exist_ok=True)
            
    async def _install_dependencies(self, manifest: ModuleManifest, deploy_path: Path):
        """Install module dependencies"""
        if manifest.dependencies:
            # Create virtual environment and install dependencies
            venv_path = deploy_path / "venv"
            subprocess.run(["python", "-m", "venv", str(venv_path)], check=True)
            
            pip_path = venv_path / "bin" / "pip"
            if not pip_path.exists():
                pip_path = venv_path / "Scripts" / "pip.exe"  # Windows
                
            for dep in manifest.dependencies:
                subprocess.run([str(pip_path), "install", dep], check=True)
                
    async def _configure_module(self, manifest: ModuleManifest, deploy_path: Path):
        """Configure module with environment settings"""
        config_file = deploy_path / "module_config.json"
        
        config = {
            "module_id": manifest.module_id,
            "vendor_id": manifest.vendor_id,
            "security_level": manifest.security_level.value,
            "terrafusion_endpoint": "http://localhost:8000",
            "deployment_path": str(deploy_path),
            **manifest.configuration
        }
        
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
            
    async def _start_module_services(self, manifest: ModuleManifest, deploy_path: Path):
        """Start module services based on type"""
        if manifest.module_type == ModuleType.WEB_APPLICATION:
            await self._start_web_service(manifest, deploy_path)
        elif manifest.module_type == ModuleType.API_SERVICE:
            await self._start_api_service(manifest, deploy_path)
        elif manifest.module_type == ModuleType.DATA_PROCESSOR:
            await self._start_data_processor(manifest, deploy_path)
            
    async def _start_web_service(self, manifest: ModuleManifest, deploy_path: Path):
        """Start web application service"""
        # Placeholder for web service startup
        logging.info(f"Starting web service for {manifest.name}")
        
    async def _start_api_service(self, manifest: ModuleManifest, deploy_path: Path):
        """Start API service"""
        # Placeholder for API service startup
        logging.info(f"Starting API service for {manifest.name}")
        
    async def _start_data_processor(self, manifest: ModuleManifest, deploy_path: Path):
        """Start data processing service"""
        # Placeholder for data processor startup
        logging.info(f"Starting data processor for {manifest.name}")

class ModuleWrapperService:
    """Main module wrapping and deployment service"""
    
    def __init__(self):
        self.validator = ModuleValidator()
        self.deployer = ModuleDeployer()
        self.deployed_modules: Dict[str, DeployedModule] = {}
        self.deployment_queue: List[Dict[str, Any]] = []
        
    async def wrap_and_deploy_module(self, module_path: str, manifest_data: Dict[str, Any], vendor_id: str) -> Dict[str, Any]:
        """Main entry point for module wrapping and deployment"""
        try:
            # Create module manifest
            manifest = ModuleManifest(
                module_id=manifest_data["module_id"],
                name=manifest_data["name"],
                version=manifest_data["version"],
                description=manifest_data["description"],
                vendor_id=vendor_id,
                module_type=ModuleType(manifest_data["module_type"]),
                security_level=SecurityLevel(manifest_data.get("security_level", "internal")),
                dependencies=manifest_data.get("dependencies", []),
                permissions=manifest_data.get("permissions", []),
                resource_requirements=manifest_data.get("resource_requirements", {}),
                endpoints=manifest_data.get("endpoints", []),
                configuration=manifest_data.get("configuration", {})
            )
            
            # Validate module
            validation_result = await self.validator.validate_module(module_path, manifest)
            
            if not validation_result["valid"]:
                return {
                    "success": False,
                    "stage": "validation",
                    "errors": validation_result["errors"],
                    "warnings": validation_result["warnings"]
                }
                
            # Deploy module
            deployment_id = await self.deployer.deploy_module(module_path, manifest)
            
            if deployment_id:
                # Track deployed module
                deployed_module = DeployedModule(
                    module_id=manifest.module_id,
                    manifest=manifest,
                    deployment_id=deployment_id,
                    status=ModuleStatus.ACTIVE,
                    deployed_at=datetime.now()
                )
                
                self.deployed_modules[deployment_id] = deployed_module
                
                return {
                    "success": True,
                    "deployment_id": deployment_id,
                    "module_id": manifest.module_id,
                    "status": "active",
                    "warnings": validation_result["warnings"]
                }
            else:
                return {
                    "success": False,
                    "stage": "deployment",
                    "errors": ["Deployment failed - check logs for details"]
                }
                
        except Exception as e:
            logging.error(f"Module wrapping failed: {str(e)}")
            return {
                "success": False,
                "stage": "wrapping",
                "errors": [f"Module wrapping error: {str(e)}"]
            }
            
    def get_deployed_modules(self, vendor_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get list of deployed modules, optionally filtered by vendor"""
        modules = []
        
        for deployed in self.deployed_modules.values():
            if vendor_id and deployed.manifest.vendor_id != vendor_id:
                continue
                
            modules.append({
                "deployment_id": deployed.deployment_id,
                "module_id": deployed.module_id,
                "name": deployed.manifest.name,
                "version": deployed.manifest.version,
                "vendor_id": deployed.manifest.vendor_id,
                "module_type": deployed.manifest.module_type.value,
                "status": deployed.status.value,
                "deployed_at": deployed.deployed_at.isoformat(),
                "health_status": deployed.health_status
            })
            
        return sorted(modules, key=lambda x: x["deployed_at"], reverse=True)
        
    async def health_check_module(self, deployment_id: str) -> Dict[str, Any]:
        """Perform health check on deployed module"""
        deployed = self.deployed_modules.get(deployment_id)
        if not deployed:
            return {"status": "not_found"}
            
        # Basic health check
        health_result = {
            "deployment_id": deployment_id,
            "module_id": deployed.module_id,
            "status": deployed.status.value,
            "last_check": datetime.now().isoformat(),
            "healthy": deployed.status == ModuleStatus.ACTIVE,
            "uptime_seconds": (datetime.now() - deployed.deployed_at).total_seconds()
        }
        
        deployed.last_health_check = datetime.now()
        deployed.health_status = "healthy" if health_result["healthy"] else "unhealthy"
        
        return health_result
        
    def get_deployment_stats(self) -> Dict[str, Any]:
        """Get module deployment statistics"""
        total_deployments = len(self.deployed_modules)
        
        status_counts = {}
        for status in ModuleStatus:
            status_counts[status.value] = len([m for m in self.deployed_modules.values() if m.status == status])
            
        type_counts = {}
        for module_type in ModuleType:
            type_counts[module_type.value] = len([m for m in self.deployed_modules.values() 
                                                if m.manifest.module_type == module_type])
            
        return {
            "total_deployments": total_deployments,
            "status_breakdown": status_counts,
            "type_breakdown": type_counts,
            "queue_size": len(self.deployment_queue),
            "active_modules": len([m for m in self.deployed_modules.values() if m.status == ModuleStatus.ACTIVE])
        }