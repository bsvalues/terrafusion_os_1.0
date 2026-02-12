"""
Valuation Service Integrator

This module integrates the valuation services with the MCP system,
providing access to specialized valuation methods for Washington State
property tax assessment.
"""

import logging
from typing import Dict, Any, Optional

from mcp.valuation import (
    current_use_service,
    historic_property_service,
    senior_exemption_service
)

# Configure logging
logger = logging.getLogger(__name__)

class ValuationIntegrator:
    """
    Integrates valuation services with the MCP system
    """
    
    def __init__(self):
        """Initialize the valuation integrator"""
        self.services = {
            "current_use": current_use_service,
            "historic_property": historic_property_service,
            "senior_exemption": senior_exemption_service
        }
        
        logger.info("Valuation Integrator initialized with %d services", len(self.services))
    
    def get_valuation_service(self, service_name: str):
        """
        Get a valuation service by name
        
        Args:
            service_name: Name of the valuation service
            
        Returns:
            Valuation service instance or None if not found
        """
        return self.services.get(service_name)
    
    def process_valuation_request(
        self, 
        valuation_type: str, 
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process a valuation request
        
        Args:
            valuation_type: Type of valuation to perform
            data: Data required for the valuation
            
        Returns:
            Valuation result
        """
        try:
            if valuation_type == "current_use":
                return self._process_current_use_valuation(data)
            elif valuation_type == "historic_property":
                return self._process_historic_property_valuation(data)
            elif valuation_type == "senior_exemption":
                return self._process_senior_exemption_valuation(data)
            else:
                return {
                    "success": False,
                    "error": f"Unsupported valuation type: {valuation_type}"
                }
        except Exception as e:
            logger.error("Error processing valuation request: %s", str(e))
            return {
                "success": False,
                "error": f"Valuation error: {str(e)}"
            }
    
    def _process_current_use_valuation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process current use valuation request
        
        Args:
            data: Valuation data including soil_type, acres, etc.
            
        Returns:
            Valuation result
        """
        # Extract parameters
        soil_type = data.get("soil_type")
        acres = data.get("acres")
        irrigated = data.get("irrigated", False)
        income_data = data.get("income_data")
        cap_rate = data.get("cap_rate")
        assessment_year = data.get("assessment_year")
        
        # Check required parameters
        if soil_type is None:
            return {"success": False, "error": "soil_type is required"}
        if acres is None:
            return {"success": False, "error": "acres is required"}
        
        # Perform valuation
        return current_use_service.calculate_farm_land_value(
            soil_type=soil_type,
            acres=acres,
            irrigated=irrigated,
            income_data=income_data,
            cap_rate=cap_rate,
            assessment_year=assessment_year
        )
    
    def _process_historic_property_valuation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process historic property valuation request
        
        Args:
            data: Valuation data including property_value, rehabilitation_costs, etc.
            
        Returns:
            Valuation result
        """
        # Extract parameters
        property_value = data.get("property_value")
        rehabilitation_costs = data.get("rehabilitation_costs")
        rehabilitation_date = data.get("rehabilitation_date")
        assessment_date = data.get("assessment_date")
        historic_register = data.get("historic_register")
        jurisdiction = data.get("jurisdiction", "benton_county")
        
        # Check required parameters
        if property_value is None:
            return {"success": False, "error": "property_value is required"}
        if rehabilitation_costs is None:
            return {"success": False, "error": "rehabilitation_costs is required"}
        if rehabilitation_date is None:
            return {"success": False, "error": "rehabilitation_date is required"}
        
        # Perform valuation
        return historic_property_service.calculate_special_valuation(
            property_value=property_value,
            rehabilitation_costs=rehabilitation_costs,
            rehabilitation_date=rehabilitation_date,
            assessment_date=assessment_date,
            historic_register=historic_register,
            jurisdiction=jurisdiction
        )
    
    def _process_senior_exemption_valuation(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process senior exemption valuation request
        
        Args:
            data: Valuation data including property_value, income, etc.
            
        Returns:
            Valuation result
        """
        # Extract parameters
        property_value = data.get("property_value")
        income = data.get("income")
        age = data.get("age")
        birth_date = data.get("birth_date")
        is_disabled = data.get("is_disabled", False)
        is_veteran = data.get("is_veteran", False)
        is_widow_widower = data.get("is_widow_widower", False)
        assessment_year = data.get("assessment_year")
        
        # Check required parameters
        if property_value is None:
            return {"success": False, "error": "property_value is required"}
        if income is None:
            return {"success": False, "error": "income is required"}
        if age is None and birth_date is None and not is_disabled and not is_veteran and not is_widow_widower:
            return {"success": False, "error": "at least one of age, birth_date, is_disabled, is_veteran, or is_widow_widower is required"}
        
        # Perform valuation
        return senior_exemption_service.calculate_exemption(
            property_value=property_value,
            income=income,
            age=age,
            birth_date=birth_date,
            is_disabled=is_disabled,
            is_veteran=is_veteran,
            is_widow_widower=is_widow_widower,
            assessment_year=assessment_year
        )

# Singleton instance
valuation_integrator = ValuationIntegrator()