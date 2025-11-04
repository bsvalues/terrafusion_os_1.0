"""
Sales Verification Agent for GeoAssessmentPro

This agent is responsible for sales data verification, validation, and 
processing according to Washington State Department of Revenue guidelines.
It integrates with GIS data to validate property information and ensure
sales data quality for valuation purposes.

Key responsibilities:
1. Sales data validation and verification
2. GIS data integration for spatial verification
3. Sales qualification assessment
4. Market trend analysis
5. Integration with external data sources
"""

import os
import logging
import datetime
import json
import pandas as pd
import numpy as np
import geopandas as gpd
from typing import Dict, List, Any, Optional, Tuple, Union
from sqlalchemy import text, exc, inspect
from app import db
from mcp.agents.base_agent import BaseAgent
from mcp.agent_protocol import AgentCommunicationProtocol, MessageType
from sync_service.notification_system import SyncNotificationManager
from sync_service.data_sanitization import DataSanitizer

# Configure logging
logger = logging.getLogger(__name__)

class SalesVerificationAgent(BaseAgent):
    """
    Sales Verification Agent for validating and processing sales data
    according to Washington State standards.
    
    Features:
    - Sales data validation against WA DOR standards
    - Spatial verification using GIS data
    - Sales qualification/disqualification with reason codes
    - Integration with property record system
    - Trend analysis for time-based adjustments
    """
    
    def __init__(self):
        """Initialize the Sales Verification Agent"""
        super().__init__("sales_verification")
        self.capabilities = [
            "sales_validation", 
            "spatial_verification", 
            "sales_qualification", 
            "trend_analysis",
            "data_quality_checks"
        ]
        self.notification_manager = SyncNotificationManager()
        self.data_sanitizer = DataSanitizer()
        self.validation_rules = {}
        self.disqualification_codes = {}
        self.load_configuration()
        logger.info(f"Agent {self.agent_id} initialized")
    
    def load_configuration(self):
        """Load configuration settings for sales verification checks"""
        try:
            # Default configuration - in production, this would be loaded from database
            self.validation_rules = {
                "sales": {
                    "required_fields": [
                        "sale_id", "property_id", "parcel_number", 
                        "sale_date", "sale_price"
                    ],
                    "format_rules": {
                        "sale_date": r"^\d{4}-\d{2}-\d{2}$",
                        "parcel_number": r"^\d{8}-\d{3}$"  # Benton County format
                    },
                    "value_ranges": {
                        "sale_price": {"min": 1000, "max": None}  # Minimum sale price
                    }
                }
            }
            
            # WA State disqualification codes based on DOR guidelines
            self.disqualification_codes = {
                1: "Sale between relatives or corporate affiliates",
                2: "Sale involved government agencies or public utilities",
                3: "Sale involved trades, partial interests, or estate liquidation",
                4: "Deed type not typical of market sales",
                5: "Financial details atypical of market (unusual financing)",
                6: "Physical changes to property between sale and assessment dates",
                7: "Sale price includes significant personal property",
                8: "Value influenced by zoning changes or development rights",
                9: "Sale involved liquidation, distress, auction or forced sale",
                10: "Sale price appears influenced by non-typical factors"
            }
            
            logger.info("Sales verification configuration loaded successfully")
        except Exception as e:
            logger.error(f"Error loading sales verification configuration: {str(e)}")
            # Use minimal default configuration as fallback
            self.validation_rules = {
                "sales": {
                    "required_fields": ["sale_id", "property_id", "sale_date", "sale_price"],
                    "format_rules": {},
                    "value_ranges": {}
                }
            }
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a task assigned to the Sales Verification Agent
        
        Args:
            task_data: The task data containing the operation and parameters
            
        Returns:
            A dictionary containing the task results
        """
        task_type = task_data.get("task_type", "")
        
        if task_type == "verify_sale":
            return self.verify_sale(task_data.get("sale_data", {}))
        elif task_type == "batch_verify_sales":
            return self.batch_verify_sales(task_data.get("sales_data", []))
        elif task_type == "validate_gis_data":
            return self.validate_gis_data(
                task_data.get("gis_data", {}),
                task_data.get("sale_data", {})
            )
        elif task_type == "analyze_sales_trends":
            return self.analyze_sales_trends(
                task_data.get("area_id", None),
                task_data.get("property_type", None),
                task_data.get("start_date", None),
                task_data.get("end_date", None)
            )
        elif task_type == "qualify_sale":
            return self.qualify_sale(task_data.get("sale_data", {}))
        else:
            logger.warning(f"Unknown task type: {task_type}")
            return {
                "status": "error",
                "message": f"Unknown task type: {task_type}",
                "data": None
            }
    
    def verify_sale(self, sale_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify a single sales record
        
        Args:
            sale_data: The sales data to verify
            
        Returns:
            Verification result with status and details
        """
        logger.info(f"Verifying sale: {sale_data.get('sale_id', 'unknown')}")
        
        # Initial data validation
        validation_result = self._validate_sale_data(sale_data)
        if not validation_result["valid"]:
            return {
                "status": "invalid",
                "message": "Sale data validation failed",
                "errors": validation_result["errors"],
                "sale_id": sale_data.get("sale_id")
            }
        
        # Get property data for this sale
        property_data = self._get_property_data(sale_data.get("property_id") or sale_data.get("parcel_number"))
        
        # Request GIS data validation if property data exists
        gis_validation = None
        if property_data:
            # In a real implementation, this would use the agent communication protocol
            # to request validation from the spatial analysis agent
            try:
                gis_validation = self._validate_spatial_data(sale_data, property_data)
            except Exception as e:
                logger.error(f"Error validating spatial data: {str(e)}")
                gis_validation = {"valid": False, "errors": [f"Spatial validation error: {str(e)}"]}
        
        # Qualify the sale based on Washington DOR guidelines
        qualification_result = self._qualify_sale(sale_data, property_data)
        
        # Combine all verification results
        verification_result = {
            "status": "verified" if qualification_result["qualified"] else "not_qualified",
            "message": "Sale verification completed",
            "sale_id": sale_data.get("sale_id"),
            "validation": validation_result,
            "spatial_validation": gis_validation,
            "qualification": qualification_result,
            "timestamp": datetime.datetime.now().isoformat()
        }
        
        # Record verification result (in a production system)
        self._record_verification_result(sale_data.get("sale_id"), verification_result)
        
        return verification_result
    
    def batch_verify_sales(self, sales_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Verify a batch of sales records
        
        Args:
            sales_data: List of sales data records to verify
            
        Returns:
            Batch verification results
        """
        logger.info(f"Batch verifying {len(sales_data)} sales")
        
        results = []
        for sale in sales_data:
            results.append(self.verify_sale(sale))
        
        # Summarize results
        verified_count = sum(1 for r in results if r["status"] == "verified")
        not_qualified_count = sum(1 for r in results if r["status"] == "not_qualified")
        invalid_count = sum(1 for r in results if r["status"] == "invalid")
        
        return {
            "status": "completed",
            "message": f"Batch verification completed for {len(sales_data)} sales",
            "summary": {
                "total": len(sales_data),
                "verified": verified_count,
                "not_qualified": not_qualified_count,
                "invalid": invalid_count
            },
            "results": results
        }
    
    def validate_gis_data(self, gis_data: Dict[str, Any], sale_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate GIS data associated with a sale
        
        Args:
            gis_data: The GIS data to validate
            sale_data: Associated sale data for context
            
        Returns:
            GIS data validation result
        """
        logger.info(f"Validating GIS data for sale: {sale_data.get('sale_id', 'unknown')}")
        
        validation_issues = []
        
        # Check for required GIS fields
        required_gis_fields = ["geometry", "parcel_id"]
        for field in required_gis_fields:
            if field not in gis_data:
                validation_issues.append(f"Missing required GIS field: {field}")
        
        # Check geometry validity if present
        if "geometry" in gis_data and gis_data["geometry"]:
            try:
                # This would actually use GeoPandas or similar to validate the geometry
                geometry_valid = self._check_geometry_validity(gis_data["geometry"])
                if not geometry_valid:
                    validation_issues.append("Invalid geometry")
            except Exception as e:
                validation_issues.append(f"Error validating geometry: {str(e)}")
        
        # Check parcel ID consistency with sale data
        if "parcel_id" in gis_data and "parcel_number" in sale_data:
            if gis_data["parcel_id"] != sale_data["parcel_number"]:
                validation_issues.append(
                    f"Parcel ID mismatch: GIS={gis_data['parcel_id']}, Sale={sale_data['parcel_number']}"
                )
        
        return {
            "valid": len(validation_issues) == 0,
            "errors": validation_issues,
            "sale_id": sale_data.get("sale_id")
        }
    
    def analyze_sales_trends(self, area_id: str = None, property_type: str = None,
                            start_date: str = None, end_date: str = None) -> Dict[str, Any]:
        """
        Analyze sales trends for a specific area and property type
        
        Args:
            area_id: The area ID (neighborhood, district, etc.)
            property_type: The property type to analyze
            start_date: Analysis start date (YYYY-MM-DD)
            end_date: Analysis end date (YYYY-MM-DD)
            
        Returns:
            Sales trend analysis results
        """
        logger.info(f"Analyzing sales trends for area: {area_id}, type: {property_type}")
        
        try:
            # In a real implementation, this would query the database for sales data
            # and perform statistical analysis
            
            # For demonstration, return sample analysis result
            return {
                "status": "completed",
                "message": "Sales trend analysis completed",
                "area_id": area_id,
                "property_type": property_type,
                "date_range": {
                    "start": start_date,
                    "end": end_date
                },
                "trends": {
                    "monthly_median_prices": {
                        "2023-01": 350000,
                        "2023-02": 355000,
                        "2023-03": 360000,
                        "2023-04": 365000
                    },
                    "price_per_sqft_trend": 0.02,  # 2% increase per month
                    "days_on_market_trend": -0.05,  # 5% decrease per month
                    "sales_volume_trend": 0.03,  # 3% increase per month
                },
                "confidence": 0.85  # 85% confidence in the trend analysis
            }
        except Exception as e:
            logger.error(f"Error analyzing sales trends: {str(e)}")
            return {
                "status": "error",
                "message": f"Error analyzing sales trends: {str(e)}",
                "area_id": area_id,
                "property_type": property_type
            }
    
    def qualify_sale(self, sale_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Determine if a sale qualifies for use in assessment/valuation
        
        Args:
            sale_data: The sale data to qualify
            
        Returns:
            Qualification result with status and details
        """
        logger.info(f"Qualifying sale: {sale_data.get('sale_id', 'unknown')}")
        
        # Get property data for context
        property_data = self._get_property_data(sale_data.get("property_id") or sale_data.get("parcel_number"))
        
        # Perform qualification
        qualification_result = self._qualify_sale(sale_data, property_data)
        
        return {
            "status": "completed",
            "message": "Sale qualification completed",
            "sale_id": sale_data.get("sale_id"),
            "qualified": qualification_result["qualified"],
            "disqualification_reason": qualification_result.get("disqualification_reason"),
            "disqualification_code": qualification_result.get("disqualification_code")
        }
    
    def _validate_sale_data(self, sale_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate sale data against rules
        
        Args:
            sale_data: The sale data to validate
            
        Returns:
            Validation result with errors if any
        """
        errors = []
        rules = self.validation_rules.get("sales", {})
        
        # Check required fields
        for field in rules.get("required_fields", []):
            if field not in sale_data or sale_data[field] is None or sale_data[field] == "":
                errors.append(f"Missing required field: {field}")
        
        # Check format rules
        import re
        for field, pattern in rules.get("format_rules", {}).items():
            if field in sale_data and sale_data[field]:
                if not re.match(pattern, str(sale_data[field])):
                    errors.append(f"Invalid format for {field}: {sale_data[field]}")
        
        # Check value ranges
        for field, range_rule in rules.get("value_ranges", {}).items():
            if field in sale_data and sale_data[field] is not None:
                value = sale_data[field]
                try:
                    value = float(value)
                    min_val = range_rule.get("min")
                    max_val = range_rule.get("max")
                    
                    if min_val is not None and value < min_val:
                        errors.append(f"{field} is below minimum value of {min_val}: {value}")
                    
                    if max_val is not None and value > max_val:
                        errors.append(f"{field} exceeds maximum value of {max_val}: {value}")
                except ValueError:
                    errors.append(f"Non-numeric value for {field}: {value}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }
    
    def _get_property_data(self, property_id: str) -> Optional[Dict[str, Any]]:
        """
        Get property data for a property ID or parcel number
        
        Args:
            property_id: The property ID or parcel number
            
        Returns:
            Property data if found, None otherwise
        """
        # In a real implementation, this would query the database
        # For demonstration, return sample property data
        if not property_id:
            return None
        
        try:
            # This would be a database query in production
            # For demonstration, return mock data
            return {
                "property_id": property_id,
                "parcel_number": property_id if "-" in property_id else f"{property_id}-000",
                "address": "123 Sample St, Kennewick, WA 99336",
                "property_type": "residential",
                "year_built": 1985,
                "total_area": 2100,
                "lot_size": 9500,
                "bedrooms": 3,
                "bathrooms": 2,
                "last_assessment": {
                    "date": "2023-01-01",
                    "value": 350000
                }
            }
        except Exception as e:
            logger.error(f"Error retrieving property data: {str(e)}")
            return None
    
    def _validate_spatial_data(self, sale_data: Dict[str, Any], property_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate spatial/GIS data for a sale
        
        Args:
            sale_data: The sale data
            property_data: The property data
            
        Returns:
            Spatial validation result
        """
        # In a real implementation, this would interact with GIS services
        # to validate the spatial data. For demonstration, return a simple result.
        
        # This is where integration with the GIS Services module would occur
        return {
            "valid": True,
            "errors": []
        }
    
    def _qualify_sale(self, sale_data: Dict[str, Any], property_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Determine if a sale qualifies for use in assessment
        based on Washington State Department of Revenue guidelines
        
        Args:
            sale_data: The sale data to qualify
            property_data: Property data for context
            
        Returns:
            Qualification result
        """
        # By default, assume sale is qualified
        is_qualified = True
        disqualification_reason = None
        disqualification_code = None
        
        # Check sale type (if provided)
        sale_type = sale_data.get("sale_type", "").lower()
        if sale_type in ["foreclosure", "bank", "reo", "auction", "forced"]:
            is_qualified = False
            disqualification_reason = "Non-arms-length transaction based on sale type"
            disqualification_code = 9
        
        # Check deed type (if provided)
        deed_type = sale_data.get("deed_type", "").lower()
        if deed_type in ["quit claim", "tax deed", "executor deed"]:
            is_qualified = False
            disqualification_reason = "Deed type not typical of market sales"
            disqualification_code = 4
        
        # Check sale price against assessment if we have property data
        if property_data and "last_assessment" in property_data:
            sale_price = float(sale_data.get("sale_price", 0))
            assessed_value = float(property_data["last_assessment"].get("value", 0))
            
            # If sale price is less than 50% of assessed value, likely non-market conditions
            if assessed_value > 0 and sale_price < (0.5 * assessed_value):
                is_qualified = False
                disqualification_reason = "Sale price significantly below assessed value"
                disqualification_code = 10
        
        # Check for explicit disqualification flag
        if "qualified" in sale_data and sale_data["qualified"] is False:
            is_qualified = False
            disqualification_reason = sale_data.get("disqualification_reason", "Manually disqualified")
            disqualification_code = sale_data.get("disqualification_code")
        
        return {
            "qualified": is_qualified,
            "disqualification_reason": disqualification_reason,
            "disqualification_code": disqualification_code
        }
    
    def _record_verification_result(self, sale_id: str, verification_result: Dict[str, Any]) -> bool:
        """
        Record verification result to database (placeholder)
        
        Args:
            sale_id: The sale ID
            verification_result: The verification result to record
            
        Returns:
            True if successful, False otherwise
        """
        # In a real implementation, this would save to database
        # For demonstration, just log the result
        logger.info(f"Recording verification result for sale {sale_id}: {verification_result['status']}")
        return True
    
    def _check_geometry_validity(self, geometry: Any) -> bool:
        """
        Check if a geometry is valid
        
        Args:
            geometry: The geometry to check
            
        Returns:
            True if valid, False otherwise
        """
        # In a real implementation, this would use shapely or geopandas
        # to check geometry validity
        return True
    
    def request_agent_assistance(self, target_agent: str, request_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Request assistance from another agent via the Agent Communication Protocol
        
        Args:
            target_agent: The agent to request assistance from
            request_type: The type of request
            data: The request data
            
        Returns:
            Response from the target agent
        """
        # Real implementation would use the AgentCommunicationProtocol
        # This is a placeholder for demonstration
        logger.info(f"Requesting {request_type} assistance from {target_agent}")
        
        # In production, this would send a message through the agent protocol
        try:
            protocol = AgentCommunicationProtocol()
            message = {
                "message_type": MessageType.REQUEST,
                "sender": self.agent_id,
                "recipient": target_agent,
                "subject": request_type,
                "content": data,
                "timestamp": datetime.datetime.now().isoformat()
            }
            
            response = protocol.send_message(message)
            return response.get("content", {})
        except Exception as e:
            logger.error(f"Error requesting agent assistance: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to communicate with agent {target_agent}: {str(e)}"
            }