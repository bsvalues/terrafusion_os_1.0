"""
Data Quality Agent for Benton County GeoAssessmentPro

This specialized agent focuses on ensuring data quality, integrity, and 
consistency across GIS datasets, property assessments, and tax data. 
It provides automated checks, validations, and anomaly detection.

Key capabilities:
- Data completeness and consistency validation
- Format and range verification for property data
- Spatial data quality assessment
- Temporal trend analysis
- Anomaly detection for valuation outliers
- Data cleansing recommendations
"""

import logging
import datetime
import json
import statistics
from typing import Dict, List, Any, Optional, Union, Tuple
from sqlalchemy import text

from app import db
from mcp.agents.base_agent import BaseAgent

# Configure logging
logger = logging.getLogger(__name__)

class DataQualityAgent(BaseAgent):
    """
    Agent specializing in data quality control and validation.
    
    This agent ensures that assessment and GIS data meets quality standards,
    checking for anomalies, inconsistencies, and validation issues.
    """
    
    def __init__(self):
        """Initialize the Data Quality Agent"""
        super().__init__("data_quality")
        
        # Register capabilities
        self.update_capabilities([
            "data_completeness_check",
            "format_validation",
            "range_validation",
            "consistency_check",
            "outlier_detection",
            "trend_analysis",
            "data_quality_report",
            "cleansing_recommendation",
            "valuation_validation"
        ])
        
        # Quality check thresholds and parameters
        self.quality_thresholds = {
            "completeness": 0.95,  # 95% completeness required
            "format_compliance": 0.98,  # 98% format compliance required
            "outlier_z_score": 3.0,  # Z-score threshold for outliers
            "max_null_percent": 0.05,  # Maximum allowed NULL values percent
            "consistency_threshold": 0.90  # 90% consistency required
        }
        
        # Data quality rules
        self.quality_rules = self._load_quality_rules()
        
        # Initialize quality metrics tracking
        self.quality_metrics = {
            "last_scan": None,
            "trend_data": [],
            "current_issues": []
        }
        
        logger.info(f"Data Quality Agent initialized with {len(self.capabilities)} capabilities")
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process data quality tasks
        
        Args:
            task_data: Task parameters including task_type and specific task parameters
            
        Returns:
            Task result with quality analysis
        """
        task_type = task_data.get("task_type")
        
        if not task_type:
            return {"status": "error", "message": "No task type specified"}
        
        # Task routing based on type
        if task_type == "data_completeness_check":
            return self._process_completeness_check(task_data)
        elif task_type == "format_validation":
            return self._process_format_validation(task_data)
        elif task_type == "range_validation":
            return self._process_range_validation(task_data)
        elif task_type == "consistency_check":
            return self._process_consistency_check(task_data)
        elif task_type == "outlier_detection":
            return self._process_outlier_detection(task_data)
        elif task_type == "trend_analysis":
            return self._process_trend_analysis(task_data)
        elif task_type == "data_quality_report":
            return self._process_quality_report(task_data)
        elif task_type == "cleansing_recommendation":
            return self._process_cleansing_recommendation(task_data)
        elif task_type == "valuation_validation":
            return self._process_valuation_validation(task_data)
        elif task_type == "handle_query_message":
            return self._handle_query_message(task_data)
        else:
            return {
                "status": "error", 
                "message": f"Unsupported task type: {task_type}",
                "supported_tasks": self.capabilities
            }
    
    # Core data quality services
    
    def _process_completeness_check(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check data completeness for a dataset or property
        
        Args:
            task_data: Parameters including dataset_name or property_id
            
        Returns:
            Completeness check results with metrics and issues
        """
        dataset_name = task_data.get("dataset_name")
        property_id = task_data.get("property_id")
        table_name = task_data.get("table_name")
        
        try:
            # Set up results structure
            results = {
                "status": "success",
                "dataset_name": dataset_name,
                "property_id": property_id,
                "table_name": table_name,
                "completeness_score": 0.0,
                "missing_fields": [],
                "passed_threshold": False,
                "check_date": datetime.datetime.now().isoformat()
            }
            
            # Get data to check based on input parameters
            if table_name:
                # Check completeness of a database table
                completeness_results = self._check_table_completeness(table_name)
                results.update(completeness_results)
            elif dataset_name:
                # Check completeness of a named dataset
                completeness_results = self._check_dataset_completeness(dataset_name)
                results.update(completeness_results)
            elif property_id:
                # Check completeness of a single property record
                completeness_results = self._check_property_completeness(property_id)
                results.update(completeness_results)
            else:
                return {
                    "status": "error",
                    "message": "Must provide dataset_name, table_name, or property_id"
                }
            
            # Check if completeness passes threshold
            results["passed_threshold"] = results["completeness_score"] >= self.quality_thresholds["completeness"]
            
            return results
            
        except Exception as e:
            logger.error(f"Error in completeness check: {str(e)}")
            return {
                "status": "error",
                "message": f"Completeness check failed: {str(e)}"
            }
    
    def _process_format_validation(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate data formats for a dataset or property
        
        Args:
            task_data: Parameters including dataset_name or property_id
            
        Returns:
            Format validation results with issues
        """
        dataset_name = task_data.get("dataset_name")
        property_id = task_data.get("property_id")
        table_name = task_data.get("table_name")
        field_names = task_data.get("field_names", [])
        
        try:
            # Set up results structure
            results = {
                "status": "success",
                "dataset_name": dataset_name,
                "property_id": property_id,
                "table_name": table_name,
                "format_compliance_score": 0.0,
                "format_issues": [],
                "passed_threshold": False,
                "check_date": datetime.datetime.now().isoformat()
            }
            
            # Get data to validate based on input parameters
            if table_name:
                # Validate formats in a database table
                validation_results = self._validate_table_formats(table_name, field_names)
                results.update(validation_results)
            elif dataset_name:
                # Validate formats in a named dataset
                validation_results = self._validate_dataset_formats(dataset_name, field_names)
                results.update(validation_results)
            elif property_id:
                # Validate formats for a single property record
                validation_results = self._validate_property_formats(property_id, field_names)
                results.update(validation_results)
            else:
                return {
                    "status": "error",
                    "message": "Must provide dataset_name, table_name, or property_id"
                }
            
            # Check if format compliance passes threshold
            results["passed_threshold"] = results["format_compliance_score"] >= self.quality_thresholds["format_compliance"]
            
            return results
            
        except Exception as e:
            logger.error(f"Error in format validation: {str(e)}")
            return {
                "status": "error",
                "message": f"Format validation failed: {str(e)}"
            }
    
    def _process_range_validation(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate data ranges for numeric and date fields
        
        Args:
            task_data: Parameters including dataset_name or property_id and field specs
            
        Returns:
            Range validation results with out-of-range values
        """
        dataset_name = task_data.get("dataset_name")
        property_id = task_data.get("property_id")
        table_name = task_data.get("table_name")
        field_specs = task_data.get("field_specs", [])
        
        try:
            # Set up results structure
            results = {
                "status": "success",
                "dataset_name": dataset_name,
                "property_id": property_id,
                "table_name": table_name,
                "range_compliance_score": 0.0,
                "range_issues": [],
                "passed_validation": False,
                "check_date": datetime.datetime.now().isoformat()
            }
            
            # Get data to validate based on input parameters
            if table_name:
                # Validate ranges in a database table
                validation_results = self._validate_table_ranges(table_name, field_specs)
                results.update(validation_results)
            elif dataset_name:
                # Validate ranges in a named dataset
                validation_results = self._validate_dataset_ranges(dataset_name, field_specs)
                results.update(validation_results)
            elif property_id:
                # Validate ranges for a single property record
                validation_results = self._validate_property_ranges(property_id, field_specs)
                results.update(validation_results)
            else:
                return {
                    "status": "error",
                    "message": "Must provide dataset_name, table_name, or property_id"
                }
            
            # Check if enough fields passed validation
            valid_fields = len(field_specs) - len(results["range_issues"])
            results["range_compliance_score"] = valid_fields / len(field_specs) if field_specs else 1.0
            results["passed_validation"] = len(results["range_issues"]) == 0
            
            return results
            
        except Exception as e:
            logger.error(f"Error in range validation: {str(e)}")
            return {
                "status": "error",
                "message": f"Range validation failed: {str(e)}"
            }
    
    def _process_valuation_validation(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate valuation data for consistency, completeness and compliance
        
        Args:
            task_data: Parameters including valuation_type and property data
            
        Returns:
            Valuation validation results with issues and recommendations
        """
        valuation_type = task_data.get("valuation_type")
        property_data = task_data.get("property_data", {})
        exemption_data = task_data.get("exemption_data", {})
        
        try:
            if not valuation_type:
                return {
                    "status": "error",
                    "message": "No valuation type specified"
                }
                
            # Set up results structure
            results = {
                "status": "success",
                "valuation_type": valuation_type,
                "validation_issues": [],
                "recommendations": [],
                "validation_passed": True,
                "check_date": datetime.datetime.now().isoformat()
            }
            
            # Validate based on valuation type
            if valuation_type == "current_use":
                validation_results = self._validate_current_use_valuation(property_data)
                results.update(validation_results)
            elif valuation_type == "historic_property":
                validation_results = self._validate_historic_property_valuation(property_data)
                results.update(validation_results)
            elif valuation_type == "senior_exemption":
                validation_results = self._validate_senior_exemption(property_data, exemption_data)
                results.update(validation_results)
            elif valuation_type == "standard_valuation":
                validation_results = self._validate_standard_valuation(property_data)
                results.update(validation_results)
            else:
                return {
                    "status": "error",
                    "message": f"Unsupported valuation type: {valuation_type}"
                }
            
            return results
            
        except Exception as e:
            logger.error(f"Error in valuation validation: {str(e)}")
            return {
                "status": "error",
                "message": f"Valuation validation failed: {str(e)}"
            }

    # Validation implementations
    
    def monitor_conversion(self, source_data: Any, target_schema: Dict[str, Any]) -> Dict[str, Any]:
        """Monitor data conversion process in real-time
        
        Args:
            source_data: Source data being converted
            target_schema: Target schema requirements
            
        Returns:
            Monitoring results
        """
        monitoring_results = {
            "conversion_status": "in_progress",
            "data_integrity": 100.0,
            "schema_compliance": 100.0,
            "issues": [],
            "warnings": []
        }
        
        try:
            # Validate schema compliance
            for field, requirements in target_schema.items():
                if field not in source_data:
                    monitoring_results["schema_compliance"] -= 1
                    monitoring_results["issues"].append(f"Missing required field: {field}")
                    
            # Check data integrity
            for field, value in source_data.items():
                if value is None and field in target_schema:
                    monitoring_results["data_integrity"] -= 1
                    monitoring_results["warnings"].append(f"Null value in field: {field}")
                    
            # Set final status
            if monitoring_results["issues"]:
                monitoring_results["conversion_status"] = "failed"
            elif monitoring_results["warnings"]:
                monitoring_results["conversion_status"] = "completed_with_warnings"
            else:
                monitoring_results["conversion_status"] = "completed_successfully"
                
        except Exception as e:
            monitoring_results["conversion_status"] = "error"
            monitoring_results["issues"].append(str(e))
            
        return monitoring_results
            
    def _validate_current_use_valuation(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate current use valuation data
        
        Args:
            property_data: Property data for current use valuation
            
        Returns:
            Validation results with issues and recommendations
        """
        # In a full implementation, this would check against actual requirements
        # For now, implementing a basic validation
        validation_issues = []
        recommendations = []
        
        # Check required fields
        required_fields = ["soil_type", "acres", "farm_type", "current_use_category"]
        for field in required_fields:
            if field not in property_data or property_data.get(field) is None:
                validation_issues.append({
                    "field": field,
                    "issue": "Required field missing",
                    "severity": "high"
                })
                recommendations.append({
                    "for_field": field,
                    "recommendation": f"Add required {field} data"
                })
        
        # Validate soil type
        if "soil_type" in property_data:
            soil_type = property_data.get("soil_type")
            if not isinstance(soil_type, int) or soil_type < 1 or soil_type > 8:
                validation_issues.append({
                    "field": "soil_type",
                    "issue": "Invalid soil type. Must be an integer between 1-8.",
                    "severity": "high",
                    "value": soil_type
                })
                recommendations.append({
                    "for_field": "soil_type",
                    "recommendation": "Correct soil type to a value between 1-8"
                })
        
        # Validate acres
        if "acres" in property_data:
            acres = property_data.get("acres")
            if not isinstance(acres, (int, float)) or acres <= 0:
                validation_issues.append({
                    "field": "acres",
                    "issue": "Invalid acreage. Must be a positive number.",
                    "severity": "high",
                    "value": acres
                })
                recommendations.append({
                    "for_field": "acres",
                    "recommendation": "Correct acreage to a positive number"
                })
        
        # Validate farm type
        if "farm_type" in property_data:
            farm_type = property_data.get("farm_type")
            valid_farm_types = ["irrigated", "non_irrigated"]
            if farm_type not in valid_farm_types:
                validation_issues.append({
                    "field": "farm_type",
                    "issue": f"Invalid farm type. Must be one of: {', '.join(valid_farm_types)}",
                    "severity": "medium",
                    "value": farm_type
                })
                recommendations.append({
                    "for_field": "farm_type",
                    "recommendation": f"Correct farm type to one of: {', '.join(valid_farm_types)}"
                })
        
        # Validate current use category
        if "current_use_category" in property_data:
            category = property_data.get("current_use_category")
            valid_categories = ["farm", "agricultural", "timber", "open_space"]
            if category not in valid_categories:
                validation_issues.append({
                    "field": "current_use_category",
                    "issue": f"Invalid current use category. Must be one of: {', '.join(valid_categories)}",
                    "severity": "medium",
                    "value": category
                })
                recommendations.append({
                    "for_field": "current_use_category",
                    "recommendation": f"Correct category to one of: {', '.join(valid_categories)}"
                })
        
        return {
            "validation_issues": validation_issues,
            "recommendations": recommendations,
            "validation_passed": len(validation_issues) == 0
        }
    
    def _validate_historic_property_valuation(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate historic property valuation data
        
        Args:
            property_data: Property data for historic property valuation
            
        Returns:
            Validation results with issues and recommendations
        """
        validation_issues = []
        recommendations = []
        
        # Check required fields
        required_fields = [
            "property_value", 
            "rehabilitation_costs", 
            "rehabilitation_date", 
            "historic_designation"
        ]
        
        for field in required_fields:
            if field not in property_data or property_data.get(field) is None:
                validation_issues.append({
                    "field": field,
                    "issue": "Required field missing",
                    "severity": "high"
                })
                recommendations.append({
                    "for_field": field,
                    "recommendation": f"Add required {field} data"
                })
        
        # Validate property value
        if "property_value" in property_data:
            value = property_data.get("property_value")
            if not isinstance(value, (int, float)) or value <= 0:
                validation_issues.append({
                    "field": "property_value",
                    "issue": "Invalid property value. Must be a positive number.",
                    "severity": "high",
                    "value": value
                })
                recommendations.append({
                    "for_field": "property_value",
                    "recommendation": "Correct property value to a positive number"
                })
        
        # Validate rehabilitation costs
        if "rehabilitation_costs" in property_data:
            costs = property_data.get("rehabilitation_costs")
            if not isinstance(costs, (int, float)) or costs <= 0:
                validation_issues.append({
                    "field": "rehabilitation_costs",
                    "issue": "Invalid rehabilitation costs. Must be a positive number.",
                    "severity": "high",
                    "value": costs
                })
                recommendations.append({
                    "for_field": "rehabilitation_costs",
                    "recommendation": "Correct rehabilitation costs to a positive number"
                })
        
        # Validate rehabilitation date
        if "rehabilitation_date" in property_data:
            rehab_date = property_data.get("rehabilitation_date")
            try:
                # Convert string date to datetime if necessary
                if isinstance(rehab_date, str):
                    rehab_date = datetime.datetime.strptime(rehab_date, "%Y-%m-%d")
                
                # Check if date is in the future
                if rehab_date > datetime.datetime.now():
                    validation_issues.append({
                        "field": "rehabilitation_date",
                        "issue": "Rehabilitation date cannot be in the future.",
                        "severity": "high",
                        "value": rehab_date.strftime("%Y-%m-%d") if hasattr(rehab_date, "strftime") else rehab_date
                    })
                    recommendations.append({
                        "for_field": "rehabilitation_date",
                        "recommendation": "Correct rehabilitation date to a past date"
                    })
                
                # Check if date is too old (more than 10 years ago)
                ten_years_ago = datetime.datetime.now() - datetime.timedelta(days=365*10)
                if rehab_date < ten_years_ago:
                    validation_issues.append({
                        "field": "rehabilitation_date",
                        "issue": "Rehabilitation completed more than 10 years ago, may no longer qualify for special valuation.",
                        "severity": "medium",
                        "value": rehab_date.strftime("%Y-%m-%d") if hasattr(rehab_date, "strftime") else rehab_date
                    })
                    recommendations.append({
                        "for_field": "rehabilitation_date",
                        "recommendation": "Verify if property still qualifies for special valuation"
                    })
            except Exception as e:
                validation_issues.append({
                    "field": "rehabilitation_date",
                    "issue": f"Invalid date format: {str(e)}",
                    "severity": "high",
                    "value": rehab_date
                })
                recommendations.append({
                    "for_field": "rehabilitation_date",
                    "recommendation": "Correct date format to YYYY-MM-DD"
                })
        
        # Validate historic designation
        if "historic_designation" in property_data:
            designation = property_data.get("historic_designation")
            valid_designations = ["national_register", "washington_heritage_register", "local_register"]
            if designation not in valid_designations:
                validation_issues.append({
                    "field": "historic_designation",
                    "issue": f"Invalid historic designation. Must be one of: {', '.join(valid_designations)}",
                    "severity": "high",
                    "value": designation
                })
                recommendations.append({
                    "for_field": "historic_designation",
                    "recommendation": f"Correct designation to one of: {', '.join(valid_designations)}"
                })
        
        # Check if rehabilitation costs meet minimum requirement (25% of value)
        if "property_value" in property_data and "rehabilitation_costs" in property_data:
            property_value = property_data.get("property_value")
            rehab_costs = property_data.get("rehabilitation_costs")
            
            if isinstance(property_value, (int, float)) and isinstance(rehab_costs, (int, float)):
                min_required = property_value * 0.25
                if rehab_costs < min_required:
                    validation_issues.append({
                        "field": "rehabilitation_costs",
                        "issue": f"Rehabilitation costs do not meet minimum 25% requirement. Required: {min_required}, Actual: {rehab_costs}",
                        "severity": "high"
                    })
                    recommendations.append({
                        "for_field": "rehabilitation_costs",
                        "recommendation": f"Verify rehabilitation costs, must be at least 25% of property value (${min_required:,.2f})"
                    })
        
        return {
            "validation_issues": validation_issues,
            "recommendations": recommendations,
            "validation_passed": len(validation_issues) == 0
        }
    
    def _validate_senior_exemption(
        self, 
        property_data: Dict[str, Any],
        applicant_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Validate senior/disabled exemption data
        
        Args:
            property_data: Property data for exemption
            applicant_data: Applicant data for exemption
            
        Returns:
            Validation results with issues and recommendations
        """
        validation_issues = []
        recommendations = []
        
        # Check required property fields
        property_required_fields = ["property_value", "is_primary_residence"]
        for field in property_required_fields:
            if field not in property_data or property_data.get(field) is None:
                validation_issues.append({
                    "field": field,
                    "issue": "Required property field missing",
                    "severity": "high"
                })
                recommendations.append({
                    "for_field": field,
                    "recommendation": f"Add required {field} data"
                })
        
        # Check required applicant fields
        applicant_required_fields = ["income"]
        applicant_conditional_fields = {
            "age": ["birth_date"],  # Either age or birth_date required
            "is_disabled": ["is_disabled_veteran", "is_widow_widower"]  # Any one of these can be true
        }
        
        # Check standard required fields
        for field in applicant_required_fields:
            if field not in applicant_data or applicant_data.get(field) is None:
                validation_issues.append({
                    "field": field,
                    "issue": "Required applicant field missing",
                    "severity": "high"
                })
                recommendations.append({
                    "for_field": field,
                    "recommendation": f"Add required {field} data"
                })
        
        # Check conditional required fields (must have one of a group)
        for primary_field, alternative_fields in applicant_conditional_fields.items():
            if primary_field not in applicant_data or not applicant_data.get(primary_field):
                # Check if any alternative field is present and valid
                has_alternative = False
                for alt_field in alternative_fields:
                    if alt_field in applicant_data and applicant_data.get(alt_field):
                        has_alternative = True
                        break
                
                if not has_alternative:
                    field_list = [primary_field] + alternative_fields
                    validation_issues.append({
                        "field": ", ".join(field_list),
                        "issue": f"Must provide at least one of: {', '.join(field_list)}",
                        "severity": "high"
                    })
                    recommendations.append({
                        "for_field": ", ".join(field_list),
                        "recommendation": f"Add data for at least one of these fields"
                    })
        
        # Validate property value
        if "property_value" in property_data:
            value = property_data.get("property_value")
            if not isinstance(value, (int, float)) or value <= 0:
                validation_issues.append({
                    "field": "property_value",
                    "issue": "Invalid property value. Must be a positive number.",
                    "severity": "high",
                    "value": value
                })
                recommendations.append({
                    "for_field": "property_value",
                    "recommendation": "Correct property value to a positive number"
                })
        
        # Validate applicant age
        if "age" in applicant_data:
            age = applicant_data.get("age")
            if not isinstance(age, int) or age <= 0:
                validation_issues.append({
                    "field": "age",
                    "issue": "Invalid age. Must be a positive integer.",
                    "severity": "high",
                    "value": age
                })
                recommendations.append({
                    "for_field": "age",
                    "recommendation": "Correct age to a positive integer"
                })
            elif age < 61:
                validation_issues.append({
                    "field": "age",
                    "issue": "Applicant does not meet age requirement for senior exemption (must be 61+).",
                    "severity": "medium",
                    "value": age
                })
                recommendations.append({
                    "for_field": "age",
                    "recommendation": "Verify if applicant qualifies under disability or other criteria"
                })
        
        # Validate birth date
        if "birth_date" in applicant_data:
            birth_date = applicant_data.get("birth_date")
            try:
                # Convert string date to datetime if necessary
                if isinstance(birth_date, str):
                    birth_date = datetime.datetime.strptime(birth_date, "%Y-%m-%d").date()
                
                # Calculate age
                today = datetime.date.today()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                
                # Check if meets age requirement
                if age < 61:
                    validation_issues.append({
                        "field": "birth_date",
                        "issue": f"Applicant age ({age}) does not meet requirement for senior exemption (must be 61+).",
                        "severity": "medium",
                        "value": birth_date.strftime("%Y-%m-%d") if hasattr(birth_date, "strftime") else birth_date
                    })
                    recommendations.append({
                        "for_field": "birth_date",
                        "recommendation": "Verify if applicant qualifies under disability or other criteria"
                    })
            except Exception as e:
                validation_issues.append({
                    "field": "birth_date",
                    "issue": f"Invalid date format: {str(e)}",
                    "severity": "high",
                    "value": birth_date
                })
                recommendations.append({
                    "for_field": "birth_date",
                    "recommendation": "Correct date format to YYYY-MM-DD"
                })
        
        # Validate income
        if "income" in applicant_data:
            income = applicant_data.get("income")
            if not isinstance(income, (int, float)) or income < 0:
                validation_issues.append({
                    "field": "income",
                    "issue": "Invalid income. Must be a non-negative number.",
                    "severity": "high",
                    "value": income
                })
                recommendations.append({
                    "for_field": "income",
                    "recommendation": "Correct income to a non-negative number"
                })
            elif income > 50000:
                validation_issues.append({
                    "field": "income",
                    "issue": "Income may exceed maximum threshold for full exemption.",
                    "severity": "medium",
                    "value": income
                })
                recommendations.append({
                    "for_field": "income",
                    "recommendation": "Verify income threshold for current year and determine appropriate exemption tier"
                })
        
        # Validate primary residence
        if "is_primary_residence" in property_data:
            is_primary = property_data.get("is_primary_residence")
            if not is_primary:
                validation_issues.append({
                    "field": "is_primary_residence",
                    "issue": "Property must be applicant's primary residence for exemption eligibility.",
                    "severity": "high",
                    "value": is_primary
                })
                recommendations.append({
                    "for_field": "is_primary_residence",
                    "recommendation": "Verify this is the applicant's primary residence, otherwise exemption cannot be granted"
                })
        
        return {
            "validation_issues": validation_issues,
            "recommendations": recommendations,
            "validation_passed": len(validation_issues) == 0
        }
    
    def _validate_standard_valuation(self, property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate standard property valuation data
        
        Args:
            property_data: Property data for standard valuation
            
        Returns:
            Validation results with issues and recommendations
        """
        validation_issues = []
        recommendations = []
        
        # Check required fields
        required_fields = ["land_value", "improvement_value", "property_class"]
        for field in required_fields:
            if field not in property_data or property_data.get(field) is None:
                validation_issues.append({
                    "field": field,
                    "issue": "Required field missing",
                    "severity": "high"
                })
                recommendations.append({
                    "for_field": field,
                    "recommendation": f"Add required {field} data"
                })
        
        # Validate land value
        if "land_value" in property_data:
            value = property_data.get("land_value")
            if not isinstance(value, (int, float)) or value < 0:
                validation_issues.append({
                    "field": "land_value",
                    "issue": "Invalid land value. Must be a non-negative number.",
                    "severity": "high",
                    "value": value
                })
                recommendations.append({
                    "for_field": "land_value",
                    "recommendation": "Correct land value to a non-negative number"
                })
        
        # Validate improvement value
        if "improvement_value" in property_data:
            value = property_data.get("improvement_value")
            if not isinstance(value, (int, float)) or value < 0:
                validation_issues.append({
                    "field": "improvement_value",
                    "issue": "Invalid improvement value. Must be a non-negative number.",
                    "severity": "high",
                    "value": value
                })
                recommendations.append({
                    "for_field": "improvement_value",
                    "recommendation": "Correct improvement value to a non-negative number"
                })
        
        # Validate property class
        if "property_class" in property_data:
            prop_class = property_data.get("property_class")
            valid_classes = [
                "residential", "commercial", "industrial", "agricultural", 
                "multi_family", "vacant", "exempt", "recreational"
            ]
            if prop_class not in valid_classes:
                validation_issues.append({
                    "field": "property_class",
                    "issue": f"Invalid property class. Must be one of: {', '.join(valid_classes)}",
                    "severity": "medium",
                    "value": prop_class
                })
                recommendations.append({
                    "for_field": "property_class",
                    "recommendation": f"Correct property class to one of: {', '.join(valid_classes)}"
                })
        
        # Check for land value being too low
        if "land_value" in property_data and "total_value" in property_data:
            land_value = property_data.get("land_value")
            total_value = property_data.get("total_value")
            
            if isinstance(land_value, (int, float)) and isinstance(total_value, (int, float)):
                if land_value <= 0 and total_value > 0:
                    validation_issues.append({
                        "field": "land_value",
                        "issue": "Land value is zero or negative, but total value is positive.",
                        "severity": "high"
                    })
                    recommendations.append({
                        "for_field": "land_value",
                        "recommendation": "Verify land value, all properties should have some land value"
                    })
                elif land_value / total_value < 0.05:
                    validation_issues.append({
                        "field": "land_value",
                        "issue": "Land value is less than 5% of total value, which is unusually low.",
                        "severity": "medium"
                    })
                    recommendations.append({
                        "for_field": "land_value",
                        "recommendation": "Verify land value, may be undervalued"
                    })
        
        # Check for land improvements on vacant land
        if "improvement_value" in property_data and "property_class" in property_data:
            improvement_value = property_data.get("improvement_value")
            prop_class = property_data.get("property_class")
            
            if isinstance(improvement_value, (int, float)) and prop_class == "vacant":
                if improvement_value > 0:
                    validation_issues.append({
                        "field": "improvement_value",
                        "issue": "Property class is vacant but has improvement value.",
                        "severity": "medium"
                    })
                    recommendations.append({
                        "for_field": "improvement_value",
                        "recommendation": "Verify property classification or improvement value"
                    })
        
        return {
            "validation_issues": validation_issues,
            "recommendations": recommendations,
            "validation_passed": len(validation_issues) == 0
        }
    
    # Utility methods
    
    def _check_table_completeness(self, table_name: str) -> Dict[str, Any]:
        """Check completeness of a database table"""
        # This would be implemented with actual database queries
        # For now, returning simulated results
        return {
            "completeness_score": 0.97,
            "total_rows": 1000,
            "rows_with_nulls": 30,
            "missing_fields": [
                {"field": "parcel_number", "null_count": 0, "percent_complete": 100.0},
                {"field": "owner_name", "null_count": 5, "percent_complete": 99.5},
                {"field": "land_use_code", "null_count": 12, "percent_complete": 98.8},
                {"field": "total_value", "null_count": 0, "percent_complete": 100.0},
                {"field": "sale_date", "null_count": 13, "percent_complete": 98.7}
            ]
        }
    
    def _check_dataset_completeness(self, dataset_name: str) -> Dict[str, Any]:
        """Check completeness of a named dataset"""
        # This would be implemented with actual dataset checks
        # For now, returning simulated results
        return {
            "completeness_score": 0.95,
            "total_rows": 500,
            "rows_with_nulls": 25,
            "missing_fields": [
                {"field": "property_id", "null_count": 0, "percent_complete": 100.0},
                {"field": "property_address", "null_count": 8, "percent_complete": 98.4},
                {"field": "zoning_code", "null_count": 15, "percent_complete": 97.0},
                {"field": "property_class", "null_count": 2, "percent_complete": 99.6},
                {"field": "assessment_date", "null_count": 0, "percent_complete": 100.0}
            ]
        }
    
    def _check_property_completeness(self, property_id: str) -> Dict[str, Any]:
        """Check completeness of a single property record"""
        # This would be implemented with actual property record checks
        # For now, returning simulated results
        return {
            "completeness_score": 0.92,
            "total_fields": 25,
            "fields_with_nulls": 2,
            "missing_fields": [
                {"field": "year_built", "value": None, "required": False},
                {"field": "last_inspection_date", "value": None, "required": True}
            ]
        }
    
    def _validate_table_formats(
        self, 
        table_name: str, 
        field_names: List[str]
    ) -> Dict[str, Any]:
        """Validate formats in a database table"""
        # This would be implemented with actual database checks
        # For now, returning simulated results
        return {
            "format_compliance_score": 0.99,
            "total_fields_checked": 8,
            "fields_with_issues": 1,
            "format_issues": [
                {
                    "field": "parcel_number",
                    "expected_format": "XXX-XXX-XXX",
                    "issue_count": 12,
                    "issue_percent": 1.2,
                    "example_values": ["12-345-67", "1234-56-789"]
                }
            ]
        }
    
    def _validate_dataset_formats(
        self, 
        dataset_name: str, 
        field_names: List[str]
    ) -> Dict[str, Any]:
        """Validate formats in a named dataset"""
        # This would be implemented with actual dataset checks
        # For now, returning simulated results
        return {
            "format_compliance_score": 0.96,
            "total_fields_checked": 10,
            "fields_with_issues": 2,
            "format_issues": [
                {
                    "field": "geocode",
                    "expected_format": "XX.XXX,-XXX.XXX",
                    "issue_count": 15,
                    "issue_percent": 3.0,
                    "example_values": ["46.99", "47.121 -122.55"]
                },
                {
                    "field": "sale_date",
                    "expected_format": "YYYY-MM-DD",
                    "issue_count": 5,
                    "issue_percent": 1.0,
                    "example_values": ["01/15/2023", "2023/02/28"]
                }
            ]
        }
    
    def _validate_property_formats(
        self, 
        property_id: str, 
        field_names: List[str]
    ) -> Dict[str, Any]:
        """Validate formats for a single property record"""
        # This would be implemented with actual property record checks
        # For now, returning simulated results
        return {
            "format_compliance_score": 1.0,
            "total_fields_checked": 6,
            "fields_with_issues": 0,
            "format_issues": []
        }
    
    def _validate_table_ranges(
        self, 
        table_name: str, 
        field_specs: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Validate ranges in a database table"""
        # This would be implemented with actual database checks
        # For now, returning simulated results
        return {
            "range_compliance_score": 0.95,
            "total_fields_checked": 4,
            "fields_with_issues": 1,
            "range_issues": [
                {
                    "field": "lot_size",
                    "min_value": 0,
                    "max_value": 10000,
                    "issue_count": 18,
                    "issue_percent": 1.8,
                    "example_values": [15000, 25000, 12500]
                }
            ]
        }
    
    def _validate_dataset_ranges(
        self, 
        dataset_name: str, 
        field_specs: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Validate ranges in a named dataset"""
        # This would be implemented with actual dataset checks
        # For now, returning simulated results
        return {
            "range_compliance_score": 0.98,
            "total_fields_checked": 5,
            "fields_with_issues": 1,
            "range_issues": [
                {
                    "field": "assessed_value",
                    "min_value": 10000,
                    "max_value": 10000000,
                    "issue_count": 10,
                    "issue_percent": 2.0,
                    "example_values": [5000, 8000, 9500]
                }
            ]
        }
    
    def _validate_property_ranges(
        self, 
        property_id: str, 
        field_specs: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Validate ranges for a single property record"""
        # This would be implemented with actual property record checks
        # For now, returning simulated results
        return {
            "range_compliance_score": 1.0,
            "total_fields_checked": 3,
            "fields_with_issues": 0,
            "range_issues": []
        }
    
    def _load_quality_rules(self) -> Dict[str, Any]:
        """Load data quality rules"""
        # In a real implementation, this would load from database or config
        # For now, returning a basic set of rules
        return {
            "format_rules": {
                "parcel_number": {
                    "format": r"\d{3}-\d{3}-\d{3}",
                    "description": "XXX-XXX-XXX format"
                },
                "geocode": {
                    "format": r"\d{2}\.\d{3},\-\d{3}\.\d{3}",
                    "description": "XX.XXX,-XXX.XXX format"
                },
                "phone_number": {
                    "format": r"\(\d{3}\) \d{3}-\d{4}",
                    "description": "(XXX) XXX-XXXX format"
                },
                "zip_code": {
                    "format": r"\d{5}(-\d{4})?",
                    "description": "XXXXX or XXXXX-XXXX format"
                }
            },
            "range_rules": {
                "lot_size": {
                    "min": 0,
                    "max": 10000,
                    "unit": "sq ft"
                },
                "assessed_value": {
                    "min": 10000,
                    "max": 10000000,
                    "unit": "dollars"
                },
                "year_built": {
                    "min": 1800,
                    "max": datetime.datetime.now().year,
                    "unit": "year"
                },
                "sale_price": {
                    "min": 1000,
                    "max": 100000000,
                    "unit": "dollars"
                }
            },
            "relationship_rules": {
                "improvement_value": {
                    "relation": "<=",
                    "field": "total_value",
                    "description": "Improvement value must be less than or equal to total value"
                },
                "land_value": {
                    "relation": "<=",
                    "field": "total_value",
                    "description": "Land value must be less than or equal to total value"
                },
                "sale_date": {
                    "relation": "<=",
                    "field": "current_date",
                    "description": "Sale date must not be in the future"
                }
            }
        }
    
    def _handle_query_message(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a natural language query about data quality"""
        query = task_data.get("query", "")
        
        # In a real implementation, this would use NLP to understand and answer the query
        # For now, using a simple keyword matching approach
        response = "I'm sorry, I don't understand that query about data quality."
        
        if "completeness" in query.lower():
            response = "Data completeness refers to having all required data fields populated with valid values. Our system checks for missing (NULL) values, incomplete records, and required fields."
        elif "format" in query.lower() or "valid" in query.lower():
            response = "Format validation ensures data meets expected patterns, such as parcel numbers, dates, and phone numbers having the correct format. We check against predefined regex patterns."
        elif "range" in query.lower():
            response = "Range validation verifies that numeric and date values fall within acceptable ranges. For example, property values shouldn't be negative, and dates shouldn't be in the future."
        elif "outlier" in query.lower():
            response = "Outlier detection identifies values that deviate significantly from the norm. We use statistical methods like Z-scores to identify potential data entry errors."
        elif "consistency" in query.lower():
            response = "Consistency checks ensure related data fields make logical sense together. For example, land value plus improvement value should equal total value."
        elif "report" in query.lower():
            response = "Data quality reports provide a comprehensive view of data health, including completeness, format compliance, and identified issues. Reports can be generated for specific datasets or properties."
        
        return {
            "status": "success",
            "query": query,
            "response": response,
            "timestamp": datetime.datetime.now().isoformat()
        }

# Singleton instance
data_quality_agent = DataQualityAgent()