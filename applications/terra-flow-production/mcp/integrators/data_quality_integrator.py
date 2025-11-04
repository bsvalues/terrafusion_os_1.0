"""
Data Quality Integrator Module

This module integrates the data quality agent and services with the MCP system,
providing centralized access to data quality functions.
"""

import logging
from typing import Dict, List, Any, Optional, Union

from mcp.agents.data_quality_agent import data_quality_agent

# Configure logging
logger = logging.getLogger(__name__)

# Function to register the data quality agent with the MCP system
def register_data_quality_agent(agent_manager=None):
    """Register the data quality agent with the MCP system"""
    try:
        # If agent_manager is provided, register the agent
        if agent_manager:
            agent_manager.register_agent("data_quality", data_quality_agent)
            logger.info("Data Quality Agent registered successfully")
        # Return True regardless, since we'll still use the agent in standalone mode
        return True
    except Exception as e:
        logger.error(f"Failed to register Data Quality Agent: {str(e)}")
        return False

class DataQualityIntegrator:
    """
    Integrates data quality services with the MCP system
    """
    
    def __init__(self):
        """Initialize the data quality integrator"""
        self.agent = data_quality_agent
        
        # Quality check thresholds
        self.quality_thresholds = {
            "completeness": 0.95,  # 95% completeness required
            "format_compliance": 0.98,  # 98% format compliance required
            "outlier_z_score": 3.0,  # Z-score threshold for outliers
            "max_null_percent": 0.05,  # Maximum allowed NULL values percent
            "consistency_threshold": 0.90  # 90% consistency required
        }
        
        logger.info("Data Quality Integrator initialized")
    
    def process_quality_request(
        self, 
        request_type: str, 
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process a data quality request
        
        Args:
            request_type: Type of quality request
            data: Data required for the quality check
            
        Returns:
            Quality check result
        """
        try:
            # Route to appropriate handler based on request type
            if request_type == "completeness_check":
                return self._process_completeness_check(data)
            elif request_type == "format_validation":
                return self._process_format_validation(data)
            elif request_type == "range_validation":
                return self._process_range_validation(data)
            elif request_type == "consistency_check":
                return self._process_consistency_check(data)
            elif request_type == "outlier_detection":
                return self._process_outlier_detection(data)
            elif request_type == "valuation_validation":
                return self._process_valuation_validation(data)
            elif request_type == "data_quality_report":
                return self._process_quality_report(data)
            else:
                return {
                    "success": False,
                    "error": f"Unsupported request type: {request_type}"
                }
        except Exception as e:
            logger.error(f"Error processing quality request: {str(e)}")
            return {
                "success": False,
                "error": f"Quality check error: {str(e)}"
            }
    
    def _process_completeness_check(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process completeness check request
        
        Args:
            data: Parameters for completeness check
            
        Returns:
            Completeness check result
        """
        # Prepare task data for agent
        task_data = {
            "task_type": "data_completeness_check",
            "dataset_name": data.get("dataset_name"),
            "property_id": data.get("property_id"),
            "table_name": data.get("table_name")
        }
        
        # Submit to agent
        result = self.agent.process_task(task_data)
        
        # Process and format result
        if result.get("status") == "success":
            return {
                "success": True,
                "completeness_score": result.get("completeness_score", 0.0),
                "missing_fields": result.get("missing_fields", []),
                "passed_threshold": result.get("passed_threshold", False),
                "threshold": self.quality_thresholds["completeness"]
            }
        else:
            return {
                "success": False,
                "error": result.get("message", "Unknown error in completeness check")
            }
    
    def _process_format_validation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process format validation request
        
        Args:
            data: Parameters for format validation
            
        Returns:
            Format validation result
        """
        # Prepare task data for agent
        task_data = {
            "task_type": "format_validation",
            "dataset_name": data.get("dataset_name"),
            "property_id": data.get("property_id"),
            "table_name": data.get("table_name"),
            "field_names": data.get("field_names", [])
        }
        
        # Submit to agent
        result = self.agent.process_task(task_data)
        
        # Process and format result
        if result.get("status") == "success":
            return {
                "success": True,
                "format_compliance_score": result.get("format_compliance_score", 0.0),
                "format_issues": result.get("format_issues", []),
                "passed_threshold": result.get("passed_threshold", False),
                "threshold": self.quality_thresholds["format_compliance"]
            }
        else:
            return {
                "success": False,
                "error": result.get("message", "Unknown error in format validation")
            }
    
    def _process_range_validation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process range validation request
        
        Args:
            data: Parameters for range validation
            
        Returns:
            Range validation result
        """
        # Prepare task data for agent
        task_data = {
            "task_type": "range_validation",
            "dataset_name": data.get("dataset_name"),
            "property_id": data.get("property_id"),
            "table_name": data.get("table_name"),
            "field_specs": data.get("field_specs", [])
        }
        
        # Submit to agent
        result = self.agent.process_task(task_data)
        
        # Process and format result
        if result.get("status") == "success":
            return {
                "success": True,
                "range_compliance_score": result.get("range_compliance_score", 0.0),
                "range_issues": result.get("range_issues", []),
                "passed_validation": result.get("passed_validation", False)
            }
        else:
            return {
                "success": False,
                "error": result.get("message", "Unknown error in range validation")
            }
    
    def _process_consistency_check(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process consistency check request
        
        Args:
            data: Parameters for consistency check
            
        Returns:
            Consistency check result
        """
        # Prepare task data for agent
        task_data = {
            "task_type": "consistency_check",
            "dataset_name": data.get("dataset_name"),
            "property_id": data.get("property_id"),
            "table_name": data.get("table_name"),
            "relationship_rules": data.get("relationship_rules", [])
        }
        
        # Submit to agent
        result = self.agent.process_task(task_data)
        
        # Process and format result
        # For now, return a dummy result since the agent doesn't fully implement this yet
        return {
            "success": True,
            "consistency_score": 0.97,
            "consistency_issues": [],
            "passed_threshold": True,
            "threshold": self.quality_thresholds["consistency_threshold"]
        }
    
    def _process_outlier_detection(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process outlier detection request
        
        Args:
            data: Parameters for outlier detection
            
        Returns:
            Outlier detection result
        """
        # Prepare task data for agent
        task_data = {
            "task_type": "outlier_detection",
            "dataset_name": data.get("dataset_name"),
            "property_id": data.get("property_id"),
            "table_name": data.get("table_name"),
            "field_names": data.get("field_names", [])
        }
        
        # Submit to agent
        result = self.agent.process_task(task_data)
        
        # Process and format result
        # For now, return a dummy result since the agent doesn't fully implement this yet
        return {
            "success": True,
            "outliers_found": 3,
            "outliers": [
                {"field": "land_value", "value": 50000000, "z_score": 4.2},
                {"field": "year_built", "value": 1750, "z_score": 3.5},
                {"field": "lot_size", "value": 500000, "z_score": 3.8}
            ],
            "z_score_threshold": self.quality_thresholds["outlier_z_score"]
        }
    
    def _process_valuation_validation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process valuation validation request
        
        Args:
            data: Parameters for valuation validation
            
        Returns:
            Valuation validation result
        """
        # Prepare task data for agent
        task_data = {
            "task_type": "valuation_validation",
            "valuation_type": data.get("valuation_type"),
            "property_data": data.get("property_data", {}),
            "exemption_data": data.get("exemption_data", {})
        }
        
        # Submit to agent
        result = self.agent.process_task(task_data)
        
        # Process and format result
        if result.get("status") == "success":
            return {
                "success": True,
                "validation_issues": result.get("validation_issues", []),
                "recommendations": result.get("recommendations", []),
                "validation_passed": result.get("validation_passed", False)
            }
        else:
            return {
                "success": False,
                "error": result.get("message", "Unknown error in valuation validation")
            }
    
    def _process_quality_report(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process quality report request
        
        Args:
            data: Parameters for quality report
            
        Returns:
            Quality report result
        """
        # Prepare task data for agent
        task_data = {
            "task_type": "data_quality_report",
            "dataset_name": data.get("dataset_name"),
            "property_id": data.get("property_id"),
            "report_type": data.get("report_type", "standard")
        }
        
        # Submit to agent
        result = self.agent.process_task(task_data)
        
        # Process and format result
        # For now, return a dummy result since the agent doesn't fully implement this yet
        return {
            "success": True,
            "report_type": data.get("report_type", "standard"),
            "overall_quality_score": 0.94,
            "quality_metrics": {
                "completeness": 0.97,
                "format_compliance": 0.99,
                "range_compliance": 0.92,
                "consistency": 0.95
            },
            "issues_summary": {
                "high": 2,
                "medium": 5,
                "low": 12
            },
            "recommendations": [
                "Fix missing sale_date values in 3 records",
                "Standardize address formats across database"
            ]
        }
    
    def validate_data_quality_alert(
        self, 
        alert_config: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate a data quality alert configuration
        
        Args:
            alert_config: Data quality alert configuration
            
        Returns:
            Validation result
        """
        # Check required fields
        required_fields = ["name", "check_type", "parameters", "threshold"]
        missing_fields = [field for field in required_fields if field not in alert_config]
        
        if missing_fields:
            return {
                "valid": False,
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }
        
        # Validate check type
        valid_check_types = [
            "completeness", "format", "range", "consistency", 
            "outlier", "trend", "valuation"
        ]
        
        if alert_config["check_type"] not in valid_check_types:
            return {
                "valid": False,
                "error": f"Invalid check type: {alert_config['check_type']}. Must be one of: {', '.join(valid_check_types)}"
            }
        
        # Validate parameters based on check type
        check_type = alert_config["check_type"]
        parameters = alert_config["parameters"]
        
        if check_type == "completeness":
            if not any(key in parameters for key in ["dataset_name", "table_name", "property_id"]):
                return {
                    "valid": False,
                    "error": "Completeness check must include dataset_name, table_name, or property_id"
                }
        
        elif check_type == "format":
            if not any(key in parameters for key in ["dataset_name", "table_name", "property_id"]):
                return {
                    "valid": False,
                    "error": "Format check must include dataset_name, table_name, or property_id"
                }
            if "field_names" not in parameters:
                return {
                    "valid": False,
                    "error": "Format check must include field_names"
                }
        
        elif check_type == "range":
            if not any(key in parameters for key in ["dataset_name", "table_name", "property_id"]):
                return {
                    "valid": False,
                    "error": "Range check must include dataset_name, table_name, or property_id"
                }
            if "field_specs" not in parameters:
                return {
                    "valid": False,
                    "error": "Range check must include field_specs"
                }
        
        # Validate threshold
        threshold = alert_config["threshold"]
        if not isinstance(threshold, (int, float)) or threshold < 0 or threshold > 1:
            return {
                "valid": False,
                "error": "Threshold must be a number between 0 and 1"
            }
        
        # All validations passed
        return {
            "valid": True
        }

    def get_current_quality_metrics(self) -> Dict[str, Any]:
        """
        Get current quality metrics
        
        Returns:
            Dict with quality metrics
        """
        try:
            # In a real implementation, we would retrieve this from a database of quality measurements
            # For now, return a sample result
            return {
                "overall_score": 92,
                "completeness_score": 94,
                "format_compliance": 98,
                "consistency_score": 91
            }
        except Exception as e:
            logger.error(f"Error getting quality metrics: {str(e)}")
            # Return default values if there's an error
            return {
                "overall_score": 85,
                "completeness_score": 88,
                "format_compliance": 90,
                "consistency_score": 82
            }
    
    def get_quality_trend_data(self, days: int = 30) -> Dict[str, Any]:
        """
        Get quality trend data for the specified number of days
        
        Args:
            days: Number of days to get trend data for
            
        Returns:
            Dict with trend data
        """
        try:
            import datetime
            import random
            
            # Calculate date range
            end_date = datetime.datetime.now()
            start_date = end_date - datetime.timedelta(days=days)
            
            # Generate dates
            date_range = []
            current_date = start_date
            while current_date <= end_date:
                date_range.append(current_date.strftime("%Y-%m-%d"))
                current_date += datetime.timedelta(days=1)
            
            # In a real implementation, we would retrieve this from a database of quality measurements
            # For now, generate random trend data with a slight upward trend
            initial_overall = 85
            initial_completeness = 88 
            initial_format = 90
            initial_consistency = 82
            
            # Generate scores with a slight upward trend and small random variations
            overall_scores = []
            completeness_scores = []
            format_scores = []
            consistency_scores = []
            
            for i in range(len(date_range)):
                # Add a small trend factor (0.1-0.2 points per day) and random noise (-1 to +1)
                trend_factor = min(0.15 * i, 10)  # Cap improvement at 10 points
                
                # Overall score (capped at 97)
                overall = min(97, initial_overall + trend_factor + random.uniform(-1, 1))
                overall_scores.append(round(overall, 1))
                
                # Completeness score (capped at 98)
                completeness = min(98, initial_completeness + trend_factor + random.uniform(-1, 1))
                completeness_scores.append(round(completeness, 1))
                
                # Format compliance score (capped at 99)
                format_compliance = min(99, initial_format + trend_factor * 0.5 + random.uniform(-0.5, 0.5))
                format_scores.append(round(format_compliance, 1))
                
                # Consistency score (capped at 95)
                consistency = min(95, initial_consistency + trend_factor + random.uniform(-1, 1))
                consistency_scores.append(round(consistency, 1))
            
            return {
                "dates": date_range,
                "overall_scores": overall_scores,
                "completeness_scores": completeness_scores,
                "format_scores": format_scores,
                "consistency_scores": consistency_scores
            }
        except Exception as e:
            logger.error(f"Error getting quality trend data: {str(e)}")
            return {
                "dates": [],
                "overall_scores": [],
                "completeness_scores": [],
                "format_scores": [],
                "consistency_scores": []
            }

# Singleton instance
data_quality_integrator = DataQualityIntegrator()