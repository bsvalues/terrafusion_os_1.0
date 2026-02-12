"""
Data Stability Framework

A comprehensive framework for creating the most data-stable and secure system possible
for the Benton County Washington Assessor's Office, with particular focus on data conversion processes.
"""

import os
import logging
import json
import datetime
import threading
import time
from typing import Dict, List, Any, Optional

# Import core modules
from data_governance.data_classification import DataClassificationManager
from data_governance.data_sovereignty import DataSovereigntyManager
from security.encryption import EncryptionManager
from security.access_control import AccessControlManager
from security.security_monitoring import SecurityMonitoringManager
from security.audit_logging import AuditLogger
from data_conversion.conversion_manager import ConversionManager
from data_conversion.validation_agents import ValidationManager
from disaster_recovery.recovery_manager import RecoveryManager

# Import AI agents
from ai_agents.agent_manager import AIAgentManager, agent_manager
from ai_agents.anomaly_detection_agent import AnomalyDetectionAgent
from ai_agents.data_validation_agent import DataValidationAgent
from ai_agents.security_monitoring_agent import SecurityMonitoringAgent
from ai_agents.data_recovery_agent import DataRecoveryAgent
from ai_agents.predictive_analytics_agent import PredictiveAnalyticsAgent
from ai_agents.property_valuation_agent import PropertyValuationAgent

logger = logging.getLogger(__name__)

class DataStabilityFramework:
    """
    The main framework class that integrates all data stability and security components.
    Provides a unified interface for implementing data stability, security, and compliance.
    """
    
    def __init__(self, config_path: str = None):
        """
        Initialize the data stability framework.
        
        Args:
            config_path: Path to the configuration file
        """
        # Load configuration
        self.config = self._load_config(config_path)
        
        # Initialize core managers
        self.classification = DataClassificationManager(self.config.get("classification", {}))
        self.sovereignty = DataSovereigntyManager(self.config.get("sovereignty", {}))
        self.encryption = EncryptionManager(self.config.get("encryption", {}))
        self.access_control = AccessControlManager(self.config.get("access_control", {}))
        self.security_monitoring = SecurityMonitoringManager(self.config.get("security_monitoring", {}))
        self.audit = AuditLogger(self.config.get("audit_logging", {}))
        self.conversion = ConversionManager(self.config.get("conversion", {}))
        self.validation = ValidationManager(self.config.get("validation", {}))
        self.recovery = RecoveryManager(self.config.get("recovery", {}))
        
        # Initialize AI agent manager
        self.agent_manager = agent_manager
        self._initialize_ai_agents()
        
        # Framework state
        self.initialized = True
        
        # Start monitoring thread
        self.monitoring_thread = None
        self.monitoring_running = False
        self._start_monitoring()
        
        logger.info("Data Stability Framework initialized")
    
    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """
        Load framework configuration.
        
        Args:
            config_path: Path to the configuration file
            
        Returns:
            Configuration dictionary
        """
        default_config = {
            "log_level": "INFO",
            "components_enabled": {
                "classification": True,
                "sovereignty": True,
                "encryption": True,
                "access_control": True,
                "security_monitoring": True,
                "audit_logging": True,
                "conversion_controls": True,
                "disaster_recovery": True,
                "ai_agents": True
            },
            "classification": {
                "levels": [
                    {"id": 1, "name": "Public", "description": "General property information already in the public domain"},
                    {"id": 2, "name": "Internal", "description": "Administrative data requiring basic protection"},
                    {"id": 3, "name": "Confidential", "description": "Personal taxpayer information requiring enhanced security"},
                    {"id": 4, "name": "Restricted", "description": "Highly sensitive information requiring maximum protection"}
                ],
                "default_level": 2
            },
            "sovereignty": {
                "jurisdiction": "washington",
                "residency_requirements": True,
                "cross_border_transfers": False
            },
            "encryption": {
                "data_at_rest": True,
                "data_in_transit": True,
                "field_level_encryption": True,
                "key_rotation_days": 90
            },
            "access_control": {
                "rbac_enabled": True,
                "abac_enabled": True,
                "jit_access_enabled": True,
                "mfa_required": True
            },
            "security_monitoring": {
                "real_time_monitoring": True,
                "anomaly_detection": True,
                "threat_intelligence": True
            },
            "audit_logging": {
                "immutable_logs": True,
                "log_retention_days": 365,
                "log_all_access": True
            },
            "conversion": {
                "validation_level": "strict",
                "rollback_enabled": True,
                "performance_monitoring": True
            },
            "validation": {
                "validate_source": True,
                "validate_destination": True,
                "validate_transformation": True
            },
            "recovery": {
                "backup_frequency_hours": 24,
                "backup_retention_days": 30,
                "test_recovery_days": 7
            },
            "ai_agents": {
                "enabled": True,
                "agent_types": {
                    "anomaly_detection": True,
                    "data_validation": True,
                    "security_monitoring": True,
                    "data_recovery": True,
                    "predictive_analytics": True,
                    "property_valuation": True
                }
            }
        }
        
        # Load configuration file if provided
        config = default_config
        if config_path and os.path.exists(config_path):
            try:
                with open(config_path, "r") as f:
                    file_config = json.load(f)
                
                # Merge configs (shallow merge for simplicity)
                for key, value in file_config.items():
                    if isinstance(value, dict) and key in config and isinstance(config[key], dict):
                        config[key].update(value)
                    else:
                        config[key] = value
                
                logger.info(f"Loaded configuration from {config_path}")
            except Exception as e:
                logger.error(f"Error loading configuration: {str(e)}")
        
        return config
    
    def _initialize_ai_agents(self):
        """Initialize and register AI agents"""
        if not self.config.get("ai_agents", {}).get("enabled", True):
            logger.info("AI Agents disabled in configuration")
            return
        
        # Start the agent manager
        self.agent_manager.start()
        
        # Register agent types
        agent_types = self.config.get("ai_agents", {}).get("agent_types", {})
        
        # Register and create anomaly detection agent
        if agent_types.get("anomaly_detection", True):
            self.agent_manager.register_agent_type("anomaly_detection", AnomalyDetectionAgent)
            self.anomaly_agent = self.agent_manager.create_agent(
                agent_type="anomaly_detection",
                name="AnomalyDetectionAgent",
                description="Detects data anomalies in property assessment data",
                scan_interval=300  # 5 minutes
            )
        
        # Register and create data validation agent
        if agent_types.get("data_validation", True):
            self.agent_manager.register_agent_type("data_validation", DataValidationAgent)
            self.validation_agent = self.agent_manager.create_agent(
                agent_type="data_validation",
                name="DataValidationAgent",
                description="Validates property assessment data integrity",
                validation_interval=3600  # 1 hour
            )
        
        # Register and create security monitoring agent
        if agent_types.get("security_monitoring", True):
            self.agent_manager.register_agent_type("security_monitoring", SecurityMonitoringAgent)
            self.security_agent = self.agent_manager.create_agent(
                agent_type="security_monitoring",
                name="SecurityMonitoringAgent",
                description="Monitors system security and access patterns",
                monitoring_interval=600  # 10 minutes
            )
        
        # Register and create data recovery agent
        if agent_types.get("data_recovery", True):
            self.agent_manager.register_agent_type("data_recovery", DataRecoveryAgent)
            self.recovery_agent = self.agent_manager.create_agent(
                agent_type="data_recovery",
                name="DataRecoveryAgent",
                description="Provides intelligent data recovery capabilities",
                monitoring_interval=3600  # 1 hour
            )
        
        # Register and create predictive analytics agent
        if agent_types.get("predictive_analytics", True):
            self.agent_manager.register_agent_type("predictive_analytics", PredictiveAnalyticsAgent)
            self.predictive_agent = self.agent_manager.create_agent(
                agent_type="predictive_analytics",
                name="PredictiveAnalyticsAgent",
                description="Predicts future anomalies using machine learning techniques",
                prediction_interval=3600  # 1 hour
            )
        
        # Register and create property valuation agent
        if agent_types.get("property_valuation", True):
            self.agent_manager.register_agent_type("property_valuation", PropertyValuationAgent)
            self.valuation_agent = self.agent_manager.create_agent(
                agent_type="property_valuation",
                name="PropertyValuationAgent",
                description="Provides AI-powered property valuations",
                market_update_interval=86400  # 1 day
            )
        
        logger.info("AI Agents initialized")
    
    def _start_monitoring(self):
        """Start the framework monitoring thread"""
        self.monitoring_running = True
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop)
        self.monitoring_thread.daemon = True
        self.monitoring_thread.start()
        
        logger.info("Framework monitoring started")
    
    def _monitoring_loop(self):
        """Monitoring loop to check component health"""
        while self.monitoring_running:
            try:
                # Check component health
                self._check_component_health()
                
                # Sleep until next check
                time.sleep(300)  # 5 minutes
            except Exception as e:
                logger.error(f"Error in monitoring loop: {str(e)}")
                time.sleep(60)  # Sleep longer after error
    
    def _check_component_health(self):
        """Check health of all framework components"""
        component_status = {
            "classification": self._check_classification_health(),
            "sovereignty": self._check_sovereignty_health(),
            "encryption": self._check_encryption_health(),
            "access_control": self._check_access_control_health(),
            "security_monitoring": self._check_security_monitoring_health(),
            "audit": self._check_audit_health(),
            "conversion": self._check_conversion_health(),
            "validation": self._check_validation_health(),
            "recovery": self._check_recovery_health(),
            "ai_agents": self._check_ai_agents_health()
        }
        
        # Log any unhealthy components
        unhealthy = [comp for comp, status in component_status.items() if status["status"] != "healthy"]
        if unhealthy:
            logger.warning(f"Unhealthy components: {', '.join(unhealthy)}")
            for comp in unhealthy:
                logger.warning(f"{comp} status: {component_status[comp]['message']}")
    
    def _check_classification_health(self) -> Dict[str, Any]:
        """Check health of classification component"""
        try:
            # Basic check that classification levels are defined
            if not self.classification.get_classification_levels():
                return {
                    "status": "degraded",
                    "message": "No classification levels defined"
                }
            
            return {
                "status": "healthy",
                "message": "Classification component healthy"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Classification error: {str(e)}"
            }
    
    def _check_sovereignty_health(self) -> Dict[str, Any]:
        """Check health of sovereignty component"""
        try:
            # Basic check that jurisdiction is defined
            if not self.sovereignty.get_jurisdiction():
                return {
                    "status": "degraded",
                    "message": "No jurisdiction defined"
                }
            
            return {
                "status": "healthy",
                "message": "Sovereignty component healthy"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Sovereignty error: {str(e)}"
            }
    
    def _check_encryption_health(self) -> Dict[str, Any]:
        """Check health of encryption component"""
        try:
            # Basic check that encryption is initialized
            if not self.encryption.is_initialized():
                return {
                    "status": "degraded",
                    "message": "Encryption not initialized"
                }
            
            return {
                "status": "healthy",
                "message": "Encryption component healthy"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Encryption error: {str(e)}"
            }
    
    def _check_access_control_health(self) -> Dict[str, Any]:
        """Check health of access control component"""
        try:
            # Basic check that access control is initialized
            if not self.access_control.is_initialized():
                return {
                    "status": "degraded",
                    "message": "Access control not initialized"
                }
            
            return {
                "status": "healthy",
                "message": "Access control component healthy"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Access control error: {str(e)}"
            }
    
    def _check_security_monitoring_health(self) -> Dict[str, Any]:
        """Check health of security monitoring component"""
        try:
            # Basic check that security monitoring is running
            if not self.security_monitoring.is_running():
                return {
                    "status": "degraded",
                    "message": "Security monitoring not running"
                }
            
            return {
                "status": "healthy",
                "message": "Security monitoring component healthy"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Security monitoring error: {str(e)}"
            }
    
    def _check_audit_health(self) -> Dict[str, Any]:
        """Check health of audit component"""
        try:
            # Basic check that audit logging is initialized
            if not self.audit.is_initialized():
                return {
                    "status": "degraded",
                    "message": "Audit logging not initialized"
                }
            
            return {
                "status": "healthy",
                "message": "Audit component healthy"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Audit error: {str(e)}"
            }
    
    def _check_conversion_health(self) -> Dict[str, Any]:
        """Check health of conversion component"""
        try:
            # Basic check that conversion manager is initialized
            if not self.conversion.is_initialized():
                return {
                    "status": "degraded",
                    "message": "Conversion manager not initialized"
                }
            
            return {
                "status": "healthy",
                "message": "Conversion component healthy"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Conversion error: {str(e)}"
            }
    
    def _check_validation_health(self) -> Dict[str, Any]:
        """Check health of validation component"""
        try:
            # Basic check that validation manager is initialized
            if not self.validation.is_initialized():
                return {
                    "status": "degraded",
                    "message": "Validation manager not initialized"
                }
            
            return {
                "status": "healthy",
                "message": "Validation component healthy"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Validation error: {str(e)}"
            }
    
    def _check_recovery_health(self) -> Dict[str, Any]:
        """Check health of recovery component"""
        try:
            # Basic check that recovery manager is initialized
            if not self.recovery.is_initialized():
                return {
                    "status": "degraded",
                    "message": "Recovery manager not initialized"
                }
            
            return {
                "status": "healthy",
                "message": "Recovery component healthy"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"Recovery error: {str(e)}"
            }
    
    def _check_ai_agents_health(self) -> Dict[str, Any]:
        """Check health of AI agents"""
        try:
            if not self.config.get("ai_agents", {}).get("enabled", True):
                return {
                    "status": "disabled",
                    "message": "AI Agents disabled in configuration"
                }
            
            # Get status of all agents
            agent_info = self.agent_manager.get_all_agents_info()
            
            if not agent_info:
                return {
                    "status": "degraded",
                    "message": "No AI agents registered"
                }
            
            # Check for unhealthy agents
            unhealthy_agents = [
                agent["name"] for agent in agent_info
                if agent["status"] not in ["running", "paused"]
            ]
            
            if unhealthy_agents:
                return {
                    "status": "degraded",
                    "message": f"Unhealthy agents: {', '.join(unhealthy_agents)}"
                }
            
            return {
                "status": "healthy",
                "message": f"All {len(agent_info)} AI agents healthy"
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "message": f"AI agents error: {str(e)}"
            }
    
    def shutdown(self):
        """Shutdown the framework and its components"""
        logger.info("Shutting down Data Stability Framework")
        
        # Stop monitoring
        self.monitoring_running = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=2.0)
        
        # Shutdown AI agents
        if self.agent_manager:
            self.agent_manager.stop()
        
        # Shutdown components
        components = [
            self.classification,
            self.sovereignty,
            self.encryption,
            self.access_control,
            self.security_monitoring,
            self.audit,
            self.conversion,
            self.validation,
            self.recovery
        ]
        
        for component in components:
            try:
                if hasattr(component, "shutdown"):
                    component.shutdown()
            except Exception as e:
                logger.error(f"Error shutting down component: {str(e)}")
        
        logger.info("Data Stability Framework shutdown complete")
    
    #
    # Public API methods
    #
    
    def classify_data(self, table_name: str, field_name: str = None, data=None) -> int:
        """
        Classify data based on content and context.
        
        Args:
            table_name: Name of the data table
            field_name: Optional name of the field
            data: Optional data value to classify
            
        Returns:
            Classification level (1-4)
        """
        return self.classification.classify_data(table_name, field_name, data)
    
    def get_field_classification(self, table_name: str, field_name: str) -> Dict[str, Any]:
        """
        Get classification information for a field.
        
        Args:
            table_name: Name of the data table
            field_name: Name of the field
            
        Returns:
            Classification information
        """
        return self.classification.get_field_classification(table_name, field_name)
    
    def check_data_sovereignty(self, operation: str, data_type: str, location: str) -> bool:
        """
        Check if a data operation complies with sovereignty requirements.
        
        Args:
            operation: Operation type (store, process, transfer)
            data_type: Type of data
            location: Data location
            
        Returns:
            True if compliant, False otherwise
        """
        return self.sovereignty.check_compliance(operation, data_type, location)
    
    def encrypt_sensitive_data(self, data: Dict[str, Any], table_name: str) -> Dict[str, Any]:
        """
        Encrypt sensitive fields in data based on classification.
        
        Args:
            data: Data dictionary to encrypt
            table_name: Name of the data table
            
        Returns:
            Data with sensitive fields encrypted
        """
        if not data:
            return data
        
        encrypted_data = data.copy()
        
        for field_name, value in data.items():
            classification = self.classification.get_field_classification(table_name, field_name)
            level = classification.get("level", 1)
            
            # Encrypt fields with classification level 3 or higher
            if level >= 3 and value is not None:
                encrypted_data[field_name] = self.encryption.encrypt_field(value, table_name, field_name)
        
        return encrypted_data
    
    def decrypt_sensitive_data(self, data: Dict[str, Any], table_name: str) -> Dict[str, Any]:
        """
        Decrypt sensitive fields in data.
        
        Args:
            data: Data dictionary with encrypted fields
            table_name: Name of the data table
            
        Returns:
            Data with sensitive fields decrypted
        """
        if not data:
            return data
        
        decrypted_data = data.copy()
        
        for field_name, value in data.items():
            classification = self.classification.get_field_classification(table_name, field_name)
            level = classification.get("level", 1)
            
            # Decrypt fields with classification level 3 or higher
            if level >= 3 and value is not None:
                decrypted_data[field_name] = self.encryption.decrypt_field(value, table_name, field_name)
        
        return decrypted_data
    
    def check_access(self, user_id: str, operation: str, resource: str, 
                    resource_id: str = None, context: Dict[str, Any] = None) -> bool:
        """
        Check if a user has access to a resource.
        
        Args:
            user_id: ID of the user
            operation: Operation type (view, edit, delete)
            resource: Resource type
            resource_id: Optional resource ID
            context: Optional context information
            
        Returns:
            True if access is granted, False otherwise
        """
        return self.access_control.check_access(user_id, operation, resource, resource_id, context)
    
    def apply_data_masking(self, user_id: str, data: Dict[str, Any], 
                         table_name: str) -> Dict[str, Any]:
        """
        Apply data masking based on user permissions.
        
        Args:
            user_id: ID of the user
            data: Data to mask
            table_name: Name of the data table
            
        Returns:
            Data with sensitive fields masked
        """
        if not data:
            return data
        
        masked_data = data.copy()
        
        for field_name, value in data.items():
            classification = self.classification.get_field_classification(table_name, field_name)
            level = classification.get("level", 1)
            
            # Check if user has access to this field
            field_resource = f"{table_name}.{field_name}"
            has_access = self.access_control.check_access(user_id, "view", field_resource)
            
            # Mask fields that user doesn't have access to
            if not has_access and level >= 2:
                masked_data[field_name] = self._get_masked_value(value)
        
        return masked_data
    
    def _get_masked_value(self, value):
        """Get a masked version of a value"""
        if value is None:
            return None
        elif isinstance(value, str):
            if len(value) <= 4:
                return "****"
            else:
                return value[:2] + "*" * (len(value) - 4) + value[-2:]
        else:
            return "******"
    
    def log_security_event(self, event_type: str, user_id: str, details: Dict[str, Any]) -> bool:
        """
        Log a security event.
        
        Args:
            event_type: Type of security event
            user_id: ID of the user
            details: Event details
            
        Returns:
            True if successful, False otherwise
        """
        return self.audit.log_security_event(event_type, user_id, details)
    
    def start_data_conversion(self, source_type: str, target_type: str, 
                             source_data: Any, validation_level: str = "strict",
                             error_handling: str = "fail") -> str:
        """
        Start a data conversion job.
        
        Args:
            source_type: Type of source data
            target_type: Type of target data
            source_data: Source data to convert
            validation_level: Validation level (strict, normal, lenient)
            error_handling: Error handling mode (fail, continue, continue_with_reporting)
            
        Returns:
            Job ID
        """
        return self.conversion.start_conversion(
            source_type, target_type, source_data, validation_level, error_handling
        )
    
    def get_conversion_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get status of a conversion job.
        
        Args:
            job_id: ID of the conversion job
            
        Returns:
            Job status information
        """
        return self.conversion.get_job_status(job_id)
    
    def create_backup(self, backup_type: str, source: str, 
                     priority: str = "normal") -> str:
        """
        Create a data backup.
        
        Args:
            backup_type: Type of backup
            source: Source to backup
            priority: Backup priority
            
        Returns:
            Backup ID
        """
        return self.recovery.create_backup(backup_type, source, priority)
    
    def get_backup_status(self) -> Dict[str, Any]:
        """
        Get backup status information.
        
        Returns:
            Backup status
        """
        task = {"type": "get_backup_status"}
        result = self.recovery_agent.process_task(task)
        return result.get("backup_status", {})
    
    def create_recovery_plan(self, scenario: str) -> Dict[str, Any]:
        """
        Create a recovery plan for a scenario.
        
        Args:
            scenario: Recovery scenario
            
        Returns:
            Recovery plan
        """
        return self.recovery.create_recovery_plan(scenario)
    
    def detect_anomalies(self, table: str, methods: List[str] = None) -> Dict[str, Any]:
        """
        Run anomaly detection on a table.
        
        Args:
            table: Table to analyze
            methods: Detection methods to use
            
        Returns:
            Detected anomalies
        """
        task = {
            "type": "scan_for_anomalies",
            "tables": [table],
            "methods": methods or ["statistical", "rule_based"]
        }
        return self.anomaly_agent.process_task(task)
    
    def validate_data(self, table: str, scope: str = "incremental") -> Dict[str, Any]:
        """
        Validate data in a table.
        
        Args:
            table: Table to validate
            scope: Validation scope (full or incremental)
            
        Returns:
            Validation results
        """
        task = {
            "type": "validate_table",
            "table": table,
            "scope": scope
        }
        return self.validation_agent.process_task(task)
    
    def get_security_events(self, filters: Dict[str, Any] = None, 
                          limit: int = 100) -> Dict[str, Any]:
        """
        Get security events.
        
        Args:
            filters: Event filters
            limit: Maximum number of events to return
            
        Returns:
            Security events
        """
        task = {
            "type": "get_security_events",
            "filters": filters or {},
            "limit": limit
        }
        return self.security_agent.process_task(task)
    
    def run_recovery_test(self) -> Dict[str, Any]:
        """
        Run a recovery test.
        
        Returns:
            Test results
        """
        task = {"type": "run_recovery_test"}
        return self.recovery_agent.process_task(task)

# Create a singleton instance
framework = DataStabilityFramework()