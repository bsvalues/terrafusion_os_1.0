"""
Security Scanner

This module provides security scanning capabilities for the GeoAssessmentPro platform,
including vulnerability scanning, configuration auditing, and security policy enforcement.
"""

import os
import sys
import logging
import json
import datetime
import hashlib
import re
from typing import Dict, List, Any, Optional, Tuple, Set

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SecurityScanner:
    """
    Security scanner for the GeoAssessmentPro platform.
    Performs various security checks and audits to identify vulnerabilities and misconfigurations.
    """
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize the security scanner.
        
        Args:
            config_path: Path to the configuration file
        """
        # Load configuration
        self.config = self._load_config(config_path)
        
        # Initialize scan results
        self.results = {
            "last_scan_time": None,
            "vulnerability_count": 0,
            "findings": [],
            "overall_status": "unknown"
        }
        
        # Define vulnerability patterns
        self.vulnerability_patterns = {
            "sql_injection": [
                r"[\"']?\s*OR\s*[\"']?\s*[\"']?\s*=\s*[\"']",
                r";\s*DROP\s+TABLE",
                r"UNION\s+SELECT"
            ],
            "xss": [
                r"<script>",
                r"javascript:",
                r"onerror=",
                r"onload="
            ],
            "command_injection": [
                r";\s*rm\s+",
                r";\s*chmod\s+",
                r";\s*wget\s+"
            ],
            "path_traversal": [
                r"\.\.\/",
                r"%2e%2e%2f",
                r"\.\.\\",
            ],
            "insecure_storage": [
                r"password\s*=\s*[\"']",
                r"api[_-]?key\s*=\s*[\"']",
                r"secret\s*=\s*[\"']"
            ]
        }
        
        logger.info("Security scanner initialized")
    
    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """
        Load scanner configuration.
        
        Args:
            config_path: Path to the configuration file
            
        Returns:
            Configuration dictionary
        """
        default_config = {
            "scan_frequency_hours": 24,
            "scan_paths": ["."],
            "exclude_paths": ["node_modules", "venv", ".git", "__pycache__", "migrations"],
            "file_extensions": [".py", ".js", ".ts", ".html", ".sql", ".json", ".yml", ".yaml"],
            "max_file_size_mb": 10,
            "severity_thresholds": {
                "critical": 80,
                "high": 60,
                "medium": 40,
                "low": 20
            },
            "checks_enabled": {
                "vulnerability_scan": True,
                "configuration_audit": True,
                "dependency_check": True,
                "secret_detection": True,
                "permission_audit": True
            }
        }
        
        # Load configuration file if provided
        config = default_config
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, "r") as f:
                    file_config = json.load(f)
                
                # Merge configs
                for key, value in file_config.items():
                    if isinstance(value, dict) and key in config and isinstance(config[key], dict):
                        config[key].update(value)
                    else:
                        config[key] = value
                
                logger.info(f"Loaded configuration from {config_path}")
            except Exception as e:
                logger.error(f"Error loading configuration: {str(e)}")
        
        return config
    
    def run_security_scan(self) -> Dict[str, Any]:
        """
        Run a comprehensive security scan.
        
        Returns:
            Scan results
        """
        logger.info("Starting security scan")
        start_time = datetime.datetime.utcnow()
        
        # Reset results
        self.results = {
            "scan_start_time": start_time.isoformat(),
            "scan_end_time": None,
            "vulnerability_count": 0,
            "findings": [],
            "overall_status": "unknown"
        }
        
        try:
            # Run individual checks based on configuration
            checks = self.config.get("checks_enabled", {})
            
            if checks.get("vulnerability_scan", True):
                self._perform_vulnerability_scan()
            
            if checks.get("configuration_audit", True):
                self._perform_configuration_audit()
            
            if checks.get("dependency_check", True):
                self._perform_dependency_check()
            
            if checks.get("secret_detection", True):
                self._perform_secret_detection()
            
            if checks.get("permission_audit", True):
                self._perform_permission_audit()
            
            # Calculate overall status
            self._calculate_overall_status()
            
            # Update end time
            end_time = datetime.datetime.utcnow()
            self.results["scan_end_time"] = end_time.isoformat()
            self.results["scan_duration_seconds"] = (end_time - start_time).total_seconds()
            
            logger.info(f"Security scan completed with {self.results['vulnerability_count']} findings")
            return self.results
            
        except Exception as e:
            logger.error(f"Error during security scan: {str(e)}")
            self.results["error"] = str(e)
            self.results["overall_status"] = "error"
            return self.results
    
    def _perform_vulnerability_scan(self):
        """
        Perform code vulnerability scanning.
        """
        logger.info("Performing vulnerability scan")
        
        scan_paths = self.config.get("scan_paths", ["."])
        exclude_paths = self.config.get("exclude_paths", [])
        file_extensions = self.config.get("file_extensions", [".py", ".js"])
        max_file_size = self.config.get("max_file_size_mb", 10) * 1024 * 1024  # Convert to bytes
        
        # Collect files to scan
        files_to_scan = []
        for scan_path in scan_paths:
            for root, dirs, files in os.walk(scan_path):
                # Skip excluded directories
                dirs[:] = [d for d in dirs if d not in exclude_paths]
                
                for file in files:
                    # Check file extension
                    if not any(file.endswith(ext) for ext in file_extensions):
                        continue
                    
                    file_path = os.path.join(root, file)
                    
                    # Check file size
                    try:
                        if os.path.getsize(file_path) > max_file_size:
                            logger.info(f"Skipping large file: {file_path}")
                            continue
                    except Exception:
                        continue
                    
                    files_to_scan.append(file_path)
        
        logger.info(f"Found {len(files_to_scan)} files to scan")
        
        # Scan each file for vulnerabilities
        for file_path in files_to_scan:
            try:
                self._scan_file_for_vulnerabilities(file_path)
            except Exception as e:
                logger.error(f"Error scanning {file_path}: {str(e)}")
    
    def _scan_file_for_vulnerabilities(self, file_path: str):
        """
        Scan a single file for vulnerabilities.
        
        Args:
            file_path: Path to the file to scan
        """
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            # Check for each vulnerability pattern
            for vuln_type, patterns in self.vulnerability_patterns.items():
                for pattern in patterns:
                    line_number = 1
                    for line in content.split("\n"):
                        if re.search(pattern, line):
                            # Add finding
                            self.results["findings"].append({
                                "type": "vulnerability",
                                "subtype": vuln_type,
                                "severity": self._calculate_severity(vuln_type),
                                "file": file_path,
                                "line": line_number,
                                "description": f"Potential {vuln_type} vulnerability found",
                                "evidence": line.strip(),
                                "remediation": self._get_remediation_advice(vuln_type)
                            })
                            self.results["vulnerability_count"] += 1
                        line_number += 1
                
        except Exception as e:
            logger.error(f"Error scanning file {file_path}: {str(e)}")
    
    def _perform_configuration_audit(self):
        """
        Audit configuration files for security issues.
        """
        logger.info("Performing configuration audit")
        
        # Check for common configuration files
        config_files = [
            ".env",
            "config.json",
            "config.js",
            "config.py",
            "settings.py",
            "app.config.js",
            ".flaskenv",
            "docker-compose.yml",
            "Dockerfile",
            "nginx.conf"
        ]
        
        for config_file in config_files:
            if os.path.exists(config_file):
                self._audit_config_file(config_file)
        
        # Check Flask security settings
        if os.path.exists("app.py"):
            self._check_flask_security_settings("app.py")
    
    def _audit_config_file(self, file_path: str):
        """
        Audit a specific configuration file.
        
        Args:
            file_path: Path to the configuration file
        """
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            # Check for insecure settings
            if file_path.endswith(".env") or file_path == ".env":
                self._check_env_file(file_path, content)
            elif file_path.endswith(".json"):
                self._check_json_config(file_path, content)
            elif file_path.endswith(".py"):
                self._check_python_config(file_path, content)
            elif file_path.endswith(".yml") or file_path.endswith(".yaml"):
                self._check_yaml_config(file_path, content)
            
        except Exception as e:
            logger.error(f"Error auditing config file {file_path}: {str(e)}")
    
    def _check_env_file(self, file_path: str, content: str):
        """
        Check .env file for security issues.
        
        Args:
            file_path: Path to the .env file
            content: File content
        """
        # Check for hardcoded secrets
        lines = content.split("\n")
        for i, line in enumerate(lines):
            if "=" in line and not line.strip().startswith("#"):
                key, value = line.split("=", 1)
                key = key.strip()
                value = value.strip()
                
                if any(secret_key in key.lower() for secret_key in ["secret", "password", "token", "key"]):
                    if value and not value.startswith("${") and not value.startswith("$"):
                        self.results["findings"].append({
                            "type": "configuration",
                            "subtype": "hardcoded_secret",
                            "severity": "high",
                            "file": file_path,
                            "line": i + 1,
                            "description": f"Hardcoded sensitive value found for {key}",
                            "evidence": f"{key}=***",
                            "remediation": "Use environment variables or a secure vault solution instead of hardcoding secrets."
                        })
                        self.results["vulnerability_count"] += 1
    
    def _check_json_config(self, file_path: str, content: str):
        """
        Check JSON configuration for security issues.
        
        Args:
            file_path: Path to the config file
            content: File content
        """
        try:
            config = json.loads(content)
            self._check_dict_for_secrets(config, file_path)
        except json.JSONDecodeError:
            self.results["findings"].append({
                "type": "configuration",
                "subtype": "invalid_json",
                "severity": "medium",
                "file": file_path,
                "line": 1,
                "description": "Invalid JSON configuration",
                "evidence": "JSON parsing error",
                "remediation": "Fix the JSON syntax in the configuration file."
            })
            self.results["vulnerability_count"] += 1
    
    def _check_dict_for_secrets(self, config_dict: Dict, file_path: str, path: str = ""):
        """
        Recursively check a dictionary for hardcoded secrets.
        
        Args:
            config_dict: Dictionary to check
            file_path: Source file path
            path: Current path in the dictionary
        """
        for key, value in config_dict.items():
            current_path = f"{path}.{key}" if path else key
            
            if isinstance(value, dict):
                self._check_dict_for_secrets(value, file_path, current_path)
            elif isinstance(value, str):
                if any(secret_key in key.lower() for secret_key in ["secret", "password", "token", "key"]):
                    self.results["findings"].append({
                        "type": "configuration",
                        "subtype": "hardcoded_secret",
                        "severity": "high",
                        "file": file_path,
                        "line": 0,  # JSON doesn't preserve line numbers
                        "description": f"Hardcoded sensitive value found for {current_path}",
                        "evidence": f"{current_path}: ***",
                        "remediation": "Use environment variables or a secure vault solution instead of hardcoding secrets in JSON."
                    })
                    self.results["vulnerability_count"] += 1
    
    def _check_python_config(self, file_path: str, content: str):
        """
        Check Python configuration for security issues.
        
        Args:
            file_path: Path to the config file
            content: File content
        """
        lines = content.split("\n")
        for i, line in enumerate(lines):
            # Check for hardcoded secrets
            if "=" in line and not line.strip().startswith("#"):
                parts = line.split("=", 1)
                if len(parts) == 2:
                    key = parts[0].strip()
                    value = parts[1].strip()
                    
                    if any(secret_key in key.lower() for secret_key in ["secret", "password", "token", "key"]):
                        if (value.startswith("'") or value.startswith('"')) and len(value) > 2:
                            self.results["findings"].append({
                                "type": "configuration",
                                "subtype": "hardcoded_secret",
                                "severity": "high",
                                "file": file_path,
                                "line": i + 1,
                                "description": f"Hardcoded sensitive value found for {key}",
                                "evidence": f"{key} = ***",
                                "remediation": "Use environment variables (os.environ.get) instead of hardcoding secrets."
                            })
                            self.results["vulnerability_count"] += 1
            
            # Check for debug settings
            if "DEBUG = True" in line or "DEBUG=True" in line:
                self.results["findings"].append({
                    "type": "configuration",
                    "subtype": "debug_enabled",
                    "severity": "medium",
                    "file": file_path,
                    "line": i + 1,
                    "description": "Debug mode enabled in configuration",
                    "evidence": line.strip(),
                    "remediation": "Disable debug mode in production environments."
                })
                self.results["vulnerability_count"] += 1
            
            # Check for insecure CORS settings
            if "CORS_ALLOW_ALL_ORIGINS = True" in line or "CORS_ORIGIN_ALLOW_ALL = True" in line:
                self.results["findings"].append({
                    "type": "configuration",
                    "subtype": "insecure_cors",
                    "severity": "medium",
                    "file": file_path,
                    "line": i + 1,
                    "description": "CORS configured to allow all origins",
                    "evidence": line.strip(),
                    "remediation": "Restrict CORS to specific trusted origins."
                })
                self.results["vulnerability_count"] += 1
    
    def _check_yaml_config(self, file_path: str, content: str):
        """
        Check YAML configuration for security issues.
        
        Args:
            file_path: Path to the config file
            content: File content
        """
        try:
            import yaml
            config = yaml.safe_load(content)
            if isinstance(config, dict):
                self._check_dict_for_secrets(config, file_path)
        except Exception:
            self.results["findings"].append({
                "type": "configuration",
                "subtype": "invalid_yaml",
                "severity": "medium",
                "file": file_path,
                "line": 1,
                "description": "Invalid YAML configuration",
                "evidence": "YAML parsing error",
                "remediation": "Fix the YAML syntax in the configuration file."
            })
            self.results["vulnerability_count"] += 1
    
    def _check_flask_security_settings(self, file_path: str):
        """
        Check Flask security settings.
        
        Args:
            file_path: Path to the Flask app file
        """
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            lines = content.split("\n")
            for i, line in enumerate(lines):
                # Check for hardcoded secret key
                if "secret_key" in line.lower() or "app.secret_key" in line.lower():
                    if "os.environ.get" not in line and "getenv" not in line:
                        self.results["findings"].append({
                            "type": "configuration",
                            "subtype": "hardcoded_secret_key",
                            "severity": "high",
                            "file": file_path,
                            "line": i + 1,
                            "description": "Hardcoded Flask secret key",
                            "evidence": line.strip(),
                            "remediation": "Use environment variables for the Flask secret key."
                        })
                        self.results["vulnerability_count"] += 1
                
                # Check for missing CSRF protection
                if "csrf = CSRFProtect()" in line or "csrf = CSRFProtect(app)" in line:
                    csrf_found = True
                
                # Check for debug mode
                if "app.debug = True" in line:
                    self.results["findings"].append({
                        "type": "configuration",
                        "subtype": "debug_enabled",
                        "severity": "medium",
                        "file": file_path,
                        "line": i + 1,
                        "description": "Debug mode enabled in Flask application",
                        "evidence": line.strip(),
                        "remediation": "Disable debug mode in production environments."
                    })
                    self.results["vulnerability_count"] += 1
            
        except Exception as e:
            logger.error(f"Error checking Flask security settings in {file_path}: {str(e)}")
    
    def _perform_dependency_check(self):
        """
        Check dependencies for known vulnerabilities.
        """
        logger.info("Performing dependency check")
        
        # Check Python dependencies
        if os.path.exists("requirements.txt"):
            self._check_python_dependencies("requirements.txt")
        
        # Check JavaScript dependencies
        if os.path.exists("package.json"):
            self._check_js_dependencies("package.json")
    
    def _check_python_dependencies(self, file_path: str):
        """
        Check Python dependencies for known vulnerabilities.
        
        Args:
            file_path: Path to requirements.txt
        """
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                requirements = f.readlines()
            
            # Known vulnerable package versions (simplified example)
            known_vulnerabilities = {
                "django": [
                    {"version": "<1.11.29", "severity": "high", "description": "Security issues in older Django versions", "cve": "Multiple CVEs"},
                    {"version": "<2.2.24", "severity": "medium", "description": "Security issues in Django 2.x", "cve": "Multiple CVEs"}
                ],
                "flask": [
                    {"version": "<1.0", "severity": "medium", "description": "Older Flask versions have security issues", "cve": "Multiple CVEs"}
                ],
                "jinja2": [
                    {"version": "<2.11.3", "severity": "high", "description": "Sandbox escape vulnerability", "cve": "CVE-2020-28493"}
                ],
                "werkzeug": [
                    {"version": "<0.15.6", "severity": "high", "description": "Path traversal vulnerability", "cve": "CVE-2019-14322"}
                ],
                "urllib3": [
                    {"version": "<1.26.5", "severity": "high", "description": "CRLF injection vulnerability", "cve": "CVE-2021-33503"}
                ]
            }
            
            # Check each requirement
            for req in requirements:
                req = req.strip()
                if not req or req.startswith("#"):
                    continue
                
                # Parse package name and version
                parts = req.split("==")
                if len(parts) == 2:
                    package_name = parts[0].lower()
                    version = parts[1]
                    
                    # Check against known vulnerabilities
                    if package_name in known_vulnerabilities:
                        for vuln in known_vulnerabilities[package_name]:
                            if self._is_version_vulnerable(version, vuln["version"]):
                                self.results["findings"].append({
                                    "type": "dependency",
                                    "subtype": "vulnerable_package",
                                    "severity": vuln["severity"],
                                    "file": file_path,
                                    "package": package_name,
                                    "version": version,
                                    "description": vuln["description"],
                                    "evidence": f"{package_name}=={version}",
                                    "cve": vuln.get("cve"),
                                    "remediation": "Update to a non-vulnerable version of the package."
                                })
                                self.results["vulnerability_count"] += 1
            
        except Exception as e:
            logger.error(f"Error checking Python dependencies: {str(e)}")
    
    def _check_js_dependencies(self, file_path: str):
        """
        Check JavaScript dependencies for known vulnerabilities.
        
        Args:
            file_path: Path to package.json
        """
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                package_data = json.load(f)
            
            # Known vulnerable package versions (simplified example)
            known_vulnerabilities = {
                "lodash": [
                    {"version": "<4.17.21", "severity": "high", "description": "Prototype pollution vulnerability", "cve": "CVE-2021-23337"}
                ],
                "axios": [
                    {"version": "<0.21.1", "severity": "high", "description": "Server-side request forgery", "cve": "CVE-2020-28168"}
                ],
                "minimist": [
                    {"version": "<1.2.6", "severity": "medium", "description": "Prototype pollution vulnerability", "cve": "CVE-2021-44906"}
                ],
                "express": [
                    {"version": "<4.16.0", "severity": "high", "description": "ReDos vulnerability", "cve": "CVE-2017-14849"}
                ]
            }
            
            # Check dependencies
            dependencies = {}
            dependencies.update(package_data.get("dependencies", {}))
            dependencies.update(package_data.get("devDependencies", {}))
            
            for package_name, version in dependencies.items():
                package_name = package_name.lower()
                
                # Remove version prefix characters
                if version.startswith("^") or version.startswith("~"):
                    version = version[1:]
                
                # Check against known vulnerabilities
                if package_name in known_vulnerabilities:
                    for vuln in known_vulnerabilities[package_name]:
                        if self._is_version_vulnerable(version, vuln["version"]):
                            self.results["findings"].append({
                                "type": "dependency",
                                "subtype": "vulnerable_package",
                                "severity": vuln["severity"],
                                "file": file_path,
                                "package": package_name,
                                "version": version,
                                "description": vuln["description"],
                                "evidence": f"{package_name}@{version}",
                                "cve": vuln.get("cve"),
                                "remediation": "Update to a non-vulnerable version of the package."
                            })
                            self.results["vulnerability_count"] += 1
            
        except Exception as e:
            logger.error(f"Error checking JavaScript dependencies: {str(e)}")
    
    def _is_version_vulnerable(self, current_version: str, condition: str) -> bool:
        """
        Check if a version is vulnerable based on a condition.
        
        Args:
            current_version: Current version to check
            condition: Version condition (e.g., <1.2.3)
            
        Returns:
            True if vulnerable, False otherwise
        """
        # Simple version comparison (not a full semver implementation)
        try:
            if condition.startswith("<"):
                # Less than condition
                compare_version = condition[1:]
                return self._compare_versions(current_version, compare_version) < 0
            elif condition.startswith("<="):
                # Less than or equal condition
                compare_version = condition[2:]
                return self._compare_versions(current_version, compare_version) <= 0
            elif condition.startswith(">"):
                # Greater than condition
                compare_version = condition[1:]
                return self._compare_versions(current_version, compare_version) > 0
            elif condition.startswith(">="):
                # Greater than or equal condition
                compare_version = condition[2:]
                return self._compare_versions(current_version, compare_version) >= 0
            elif condition.startswith("="):
                # Equal condition
                compare_version = condition[1:]
                return self._compare_versions(current_version, compare_version) == 0
            else:
                # Assume exact version match
                return current_version == condition
        except Exception:
            # If version comparison fails, assume not vulnerable
            return False
    
    def _compare_versions(self, version1: str, version2: str) -> int:
        """
        Compare two version strings.
        
        Args:
            version1: First version
            version2: Second version
            
        Returns:
            -1 if version1 < version2, 0 if equal, 1 if version1 > version2
        """
        # Split versions into components
        v1_parts = [int(p) for p in version1.split(".")]
        v2_parts = [int(p) for p in version2.split(".")]
        
        # Pad with zeros to make same length
        while len(v1_parts) < len(v2_parts):
            v1_parts.append(0)
        while len(v2_parts) < len(v1_parts):
            v2_parts.append(0)
        
        # Compare each component
        for i in range(len(v1_parts)):
            if v1_parts[i] < v2_parts[i]:
                return -1
            elif v1_parts[i] > v2_parts[i]:
                return 1
        
        # Versions are equal
        return 0
    
    def _perform_secret_detection(self):
        """
        Detect hardcoded secrets in the codebase.
        """
        logger.info("Performing secret detection")
        
        scan_paths = self.config.get("scan_paths", ["."])
        exclude_paths = self.config.get("exclude_paths", [])
        file_extensions = self.config.get("file_extensions", [".py", ".js"])
        max_file_size = self.config.get("max_file_size_mb", 10) * 1024 * 1024  # Convert to bytes
        
        # Patterns for detecting secrets
        secret_patterns = {
            "aws_access_key": r"AKIA[0-9A-Z]{16}",
            "aws_secret_key": r"[0-9a-zA-Z/+]{40}",
            "gcp_api_key": r"AIza[0-9A-Za-z\\-_]{35}",
            "gcp_oauth_id": r"[0-9]+-[0-9a-z]+\\.apps\\.googleusercontent\\.com",
            "azure_storage_key": r"[A-Za-z0-9+/=]{88}",
            "private_key": r"-----BEGIN PRIVATE KEY-----",
            "ssh_key": r"-----BEGIN (RSA|DSA|EC|OPENSSH) PRIVATE KEY-----",
            "password_variable": r"(?i)password\s*=\s*['\"]([^'\"]+)['\"]",
            "secret_variable": r"(?i)secret\s*=\s*['\"]([^'\"]+)['\"]",
            "api_key_variable": r"(?i)api[_-]?key\s*=\s*['\"]([^'\"]+)['\"]",
            "token_variable": r"(?i)token\s*=\s*['\"]([^'\"]+)['\"]"
        }
        
        # Collect files to scan
        files_to_scan = []
        for scan_path in scan_paths:
            for root, dirs, files in os.walk(scan_path):
                # Skip excluded directories
                dirs[:] = [d for d in dirs if d not in exclude_paths]
                
                for file in files:
                    # Check file extension
                    if not any(file.endswith(ext) for ext in file_extensions):
                        continue
                    
                    file_path = os.path.join(root, file)
                    
                    # Check file size
                    try:
                        if os.path.getsize(file_path) > max_file_size:
                            logger.info(f"Skipping large file: {file_path}")
                            continue
                    except Exception:
                        continue
                    
                    files_to_scan.append(file_path)
        
        logger.info(f"Found {len(files_to_scan)} files to scan for secrets")
        
        # Scan each file for secrets
        for file_path in files_to_scan:
            try:
                self._scan_file_for_secrets(file_path, secret_patterns)
            except Exception as e:
                logger.error(f"Error scanning {file_path} for secrets: {str(e)}")
    
    def _scan_file_for_secrets(self, file_path: str, secret_patterns: Dict[str, str]):
        """
        Scan a single file for hardcoded secrets.
        
        Args:
            file_path: Path to the file to scan
            secret_patterns: Dictionary of secret patterns to check
        """
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            
            # Check for each secret pattern
            for secret_type, pattern in secret_patterns.items():
                line_number = 1
                for line in content.split("\n"):
                    match = re.search(pattern, line)
                    if match:
                        # Determine if this is likely a real secret or a false positive
                        if self._validate_secret_finding(secret_type, match.group(0), line):
                            # Add finding
                            self.results["findings"].append({
                                "type": "secret",
                                "subtype": secret_type,
                                "severity": "critical",
                                "file": file_path,
                                "line": line_number,
                                "description": f"Potential hardcoded {secret_type} found",
                                "evidence": self._redact_secret(line.strip(), match.group(0)),
                                "remediation": "Remove hardcoded secrets and use environment variables or a secure vault solution."
                            })
                            self.results["vulnerability_count"] += 1
                    line_number += 1
                
        except Exception as e:
            logger.error(f"Error scanning file {file_path} for secrets: {str(e)}")
    
    def _validate_secret_finding(self, secret_type: str, found_text: str, context: str) -> bool:
        """
        Validate a secret finding to reduce false positives.
        
        Args:
            secret_type: Type of secret
            found_text: The matched text
            context: The line containing the match
            
        Returns:
            True if likely a real secret, False if likely a false positive
        """
        # Skip if in a comment
        if context.strip().startswith("#") or context.strip().startswith("//"):
            return False
        
        # Skip if it's clearly a placeholder
        placeholders = ["your_", "placeholder", "example", "xxx", "change_me", "INSERT", "PLACEHOLDER"]
        if any(p.lower() in found_text.lower() for p in placeholders):
            return False
        
        # For variable assignments, check if it's referencing an environment variable
        if "os.environ" in context or "process.env" in context or "${" in context:
            return False
        
        # For AWS keys, validate format
        if secret_type == "aws_access_key" and not found_text.startswith("AKIA"):
            return False
        
        return True
    
    def _redact_secret(self, text: str, secret: str) -> str:
        """
        Redact a secret from text for safe display.
        
        Args:
            text: Original text
            secret: Secret to redact
            
        Returns:
            Redacted text
        """
        # Keep first and last character, replace middle with asterisks
        if len(secret) > 2:
            prefix = secret[0]
            suffix = secret[-1]
            middle = "*" * (len(secret) - 2)
            redacted = prefix + middle + suffix
            return text.replace(secret, redacted)
        else:
            return text.replace(secret, "****")
    
    def _perform_permission_audit(self):
        """
        Audit file permissions.
        """
        # Skip permission audit on Windows
        if os.name == "nt":
            logger.info("Skipping permission audit on Windows")
            return
        
        logger.info("Performing permission audit")
        
        scan_paths = self.config.get("scan_paths", ["."])
        exclude_paths = self.config.get("exclude_paths", [])
        
        # Important file types to check
        sensitive_extensions = [
            ".key", ".pem", ".p12", ".pfx", ".keystore", ".jks",
            ".crt", ".cer", ".der", ".ca-bundle", ".p7b"
        ]
        
        for scan_path in scan_paths:
            for root, dirs, files in os.walk(scan_path):
                # Skip excluded directories
                dirs[:] = [d for d in dirs if d not in exclude_paths]
                
                for file in files:
                    file_path = os.path.join(root, file)
                    
                    try:
                        # Check file permissions
                        file_stat = os.stat(file_path)
                        file_mode = file_stat.st_mode
                        
                        # Check if file is world-readable
                        if file_mode & 0o004:
                            # Check if this is a sensitive file
                            is_sensitive = any(file.endswith(ext) for ext in sensitive_extensions)
                            
                            if is_sensitive:
                                self.results["findings"].append({
                                    "type": "permission",
                                    "subtype": "world_readable",
                                    "severity": "high",
                                    "file": file_path,
                                    "description": "Sensitive file is world-readable",
                                    "evidence": f"Mode: {file_mode & 0o777:o}",
                                    "remediation": "Change file permissions to restrict access (e.g., chmod 600)."
                                })
                                self.results["vulnerability_count"] += 1
                        
                        # Check if file is world-writable
                        if file_mode & 0o002:
                            self.results["findings"].append({
                                "type": "permission",
                                "subtype": "world_writable",
                                "severity": "critical",
                                "file": file_path,
                                "description": "File is world-writable",
                                "evidence": f"Mode: {file_mode & 0o777:o}",
                                "remediation": "Change file permissions to restrict write access (e.g., chmod 644)."
                            })
                            self.results["vulnerability_count"] += 1
                        
                        # Check if script is executable but not owned by current user
                        if (file_mode & 0o100) and file_stat.st_uid != os.getuid():
                            self.results["findings"].append({
                                "type": "permission",
                                "subtype": "executable_not_owned",
                                "severity": "medium",
                                "file": file_path,
                                "description": "Executable file not owned by current user",
                                "evidence": f"Mode: {file_mode & 0o777:o}, Owner: {file_stat.st_uid}",
                                "remediation": "Review file ownership and permissions."
                            })
                            self.results["vulnerability_count"] += 1
                    
                    except Exception as e:
                        logger.error(f"Error checking permissions for {file_path}: {str(e)}")
    
    def _calculate_severity(self, vulnerability_type: str) -> str:
        """
        Calculate severity level for a vulnerability type.
        
        Args:
            vulnerability_type: Type of vulnerability
            
        Returns:
            Severity level (critical, high, medium, low)
        """
        # Severity mapping
        severity_map = {
            "sql_injection": "critical",
            "command_injection": "critical",
            "xss": "high",
            "path_traversal": "high",
            "insecure_storage": "medium"
        }
        
        return severity_map.get(vulnerability_type, "medium")
    
    def _get_remediation_advice(self, vulnerability_type: str) -> str:
        """
        Get remediation advice for a vulnerability type.
        
        Args:
            vulnerability_type: Type of vulnerability
            
        Returns:
            Remediation advice
        """
        # Remediation advice mapping
        advice_map = {
            "sql_injection": "Use parameterized queries or an ORM to prevent SQL injection.",
            "command_injection": "Validate and sanitize user input before using it in system commands.",
            "xss": "Encode user input before rendering in HTML and use a Content Security Policy.",
            "path_traversal": "Validate and sanitize file paths to prevent directory traversal.",
            "insecure_storage": "Use environment variables or a secure vault solution for sensitive data."
        }
        
        return advice_map.get(vulnerability_type, "Review and fix the identified security issue.")
    
    def _calculate_overall_status(self):
        """
        Calculate the overall security status based on findings.
        """
        if not self.results["findings"]:
            self.results["overall_status"] = "pass"
            return
        
        # Count findings by severity
        severity_counts = {
            "critical": 0,
            "high": 0,
            "medium": 0,
            "low": 0
        }
        
        for finding in self.results["findings"]:
            severity = finding.get("severity", "medium")
            if severity in severity_counts:
                severity_counts[severity] += 1
        
        # Add counts to results
        self.results["severity_counts"] = severity_counts
        
        # Determine overall status
        if severity_counts["critical"] > 0:
            self.results["overall_status"] = "fail"
        elif severity_counts["high"] > 3:
            self.results["overall_status"] = "fail"
        elif severity_counts["high"] > 0 or severity_counts["medium"] > 5:
            self.results["overall_status"] = "warn"
        else:
            self.results["overall_status"] = "pass"
    
    def get_last_scan_results(self) -> Dict[str, Any]:
        """
        Get results from the last security scan.
        
        Returns:
            Scan results dictionary
        """
        return self.results
    
    def export_results_to_json(self, file_path: str) -> bool:
        """
        Export scan results to a JSON file.
        
        Args:
            file_path: Path to save the JSON file
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(self.results, f, indent=2)
            logger.info(f"Exported scan results to {file_path}")
            return True
        except Exception as e:
            logger.error(f"Error exporting scan results: {str(e)}")
            return False


def main():
    """Main function"""
    scanner = SecurityScanner()
    results = scanner.run_security_scan()
    
    # Print summary
    print("\nSecurity Scan Results:")
    print(f"Overall Status: {results['overall_status'].upper()}")
    print(f"Total Findings: {results['vulnerability_count']}")
    
    if "severity_counts" in results:
        print("\nFindings by Severity:")
        for severity, count in results["severity_counts"].items():
            print(f"  {severity.capitalize()}: {count}")
    
    # Export results
    scanner.export_results_to_json("security_scan_results.json")
    print("\nDetailed results exported to security_scan_results.json")


if __name__ == "__main__":
    main()