"""
Historic Property Special Valuation Module (RCW 84.26)

This module implements the special valuation methods for historic properties
as defined by Washington State law RCW 84.26. The Special Valuation for Historic
Properties allows certain rehabilitation costs to be excluded from the property's
assessed value for up to 10 years.

References:
- RCW 84.26: Historic Property
- WAC 458-15: Historic Property
"""

import logging
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger(__name__)

class HistoricPropertyValuationService:
    """
    Service for calculating special valuations for historic properties
    under Washington's Historic Property program (RCW 84.26)
    """
    
    def __init__(self):
        """Initialize the historic property valuation service"""
        # Special valuation constants
        self.SPECIAL_VALUATION_YEARS = 10  # Number of years for special valuation
        self.MINIMUM_EXPENDITURE_PERCENT = 0.25  # Minimum expenditure as percentage of value
        
        # Historic property classifications
        self.historic_registers = [
            "national_register",
            "washington_heritage_register",
            "local_register"
        ]
        
        # Additional requirements by jurisdiction
        # In production, these would be loaded from a database
        self.jurisdiction_requirements = {
            "benton_county": {
                "public_access_required": False,
                "maintenance_agreement_required": True,
                "annual_reporting_required": True
            }
        }
        
        logger.info("Historic Property Valuation Service initialized")
    
    def calculate_special_valuation(
        self, 
        property_value: float,
        rehabilitation_costs: float,
        rehabilitation_date: datetime,
        assessment_date: Optional[datetime] = None,
        historic_register: Optional[str] = None,
        jurisdiction: str = "benton_county"
    ) -> Dict[str, Any]:
        """
        Calculate special valuation for historic property per RCW 84.26
        
        Args:
            property_value: Current assessed value before rehabilitation
            rehabilitation_costs: Eligible rehabilitation costs
            rehabilitation_date: Date rehabilitation was completed
            assessment_date: Date of assessment (defaults to current date)
            historic_register: Type of historic register (national, state, local)
            jurisdiction: Local jurisdiction for special requirements
            
        Returns:
            Valuation result with calculated value and supporting data
        """
        try:
            # Set assessment date if not provided
            if assessment_date is None:
                assessment_date = datetime.now()
            
            # Calculate years since rehabilitation
            years_since_rehab = (assessment_date - rehabilitation_date).days / 365.25
            
            # Check if still within special valuation period
            if years_since_rehab >= self.SPECIAL_VALUATION_YEARS:
                return {
                    "success": False,
                    "error": "Property has exceeded the 10-year special valuation period",
                    "value": property_value
                }
            
            # Check minimum expenditure requirement (25% of value)
            minimum_expenditure = property_value * self.MINIMUM_EXPENDITURE_PERCENT
            
            if rehabilitation_costs < minimum_expenditure:
                return {
                    "success": False,
                    "error": f"Rehabilitation costs do not meet minimum 25% requirement. Minimum: ${minimum_expenditure:,.2f}, Actual: ${rehabilitation_costs:,.2f}",
                    "value": property_value
                }
            
            # Check if register is valid (only if provided)
            if historic_register and historic_register not in self.historic_registers:
                return {
                    "success": False,
                    "error": f"Invalid historic register: {historic_register}. Must be one of: {', '.join(self.historic_registers)}",
                    "value": property_value
                }
            
            # Calculate special valuation
            # Per RCW 84.26, rehabilitation costs are subtracted from assessed value
            reduced_value = property_value - rehabilitation_costs
            
            # Ensure value does not go below a minimum (for tax purposes)
            # Generally, land value would be the minimum
            # For simplicity, using 25% of original value as a floor
            minimum_value = property_value * 0.25
            
            if reduced_value < minimum_value:
                reduced_value = minimum_value
                logger.info(f"Value adjusted to minimum floor of {minimum_value:,.2f}")
            
            # Round to nearest 100
            rounded_value = round(reduced_value / 100) * 100
            
            # Calculate years remaining in special valuation
            years_remaining = self.SPECIAL_VALUATION_YEARS - years_since_rehab
            
            # Get jurisdiction requirements
            jurisdiction_reqs = self.jurisdiction_requirements.get(
                jurisdiction, 
                {"public_access_required": False, "maintenance_agreement_required": True}
            )
            
            return {
                "success": True,
                "value": rounded_value,
                "original_value": property_value,
                "rehabilitation_costs": rehabilitation_costs,
                "excluded_value": min(rehabilitation_costs, property_value - rounded_value),
                "years_remaining": round(years_remaining, 1),
                "expiration_date": (rehabilitation_date + timedelta(days=365.25 * self.SPECIAL_VALUATION_YEARS)).strftime("%Y-%m-%d"),
                "jurisdiction_requirements": jurisdiction_reqs,
                "assessment_date": assessment_date.strftime("%Y-%m-%d"),
                "method": "historic_special_valuation"
            }
        
        except Exception as e:
            logger.error(f"Error calculating historic property valuation: {str(e)}")
            return {
                "success": False,
                "error": f"Calculation error: {str(e)}",
                "value": property_value
            }
    
    def verify_eligibility(
        self,
        property_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Verify if a property is eligible for historic special valuation
        
        Args:
            property_data: Dictionary containing property details
            
        Returns:
            Eligibility determination with requirements and missing criteria
        """
        try:
            # Required criteria from RCW 84.26
            required_criteria = [
                "historic_designation",
                "significant_rehabilitation",
                "rehabilitation_completed",
                "minimum_expenditure",
                "completed_within_24_months",
                "conformance_with_standards"
            ]
            
            # Check each criterion
            criteria_results = {}
            missing_criteria = []
            
            # Historic designation
            historic_designation = property_data.get("historic_designation")
            criteria_results["historic_designation"] = historic_designation in self.historic_registers
            if not criteria_results["historic_designation"]:
                missing_criteria.append("historic_designation")
            
            # Rehabilitation costs
            rehab_costs = property_data.get("rehabilitation_costs", 0)
            property_value = property_data.get("assessed_value", 0)
            minimum_cost = property_value * self.MINIMUM_EXPENDITURE_PERCENT
            
            criteria_results["minimum_expenditure"] = rehab_costs >= minimum_cost
            if not criteria_results["minimum_expenditure"]:
                missing_criteria.append("minimum_expenditure")
            
            # Rehabilitation timeframe
            completed_date = property_data.get("rehabilitation_completed_date")
            started_date = property_data.get("rehabilitation_started_date")
            
            if completed_date and started_date:
                # Convert string dates to datetime if necessary
                if isinstance(completed_date, str):
                    completed_date = datetime.strptime(completed_date, "%Y-%m-%d")
                if isinstance(started_date, str):
                    started_date = datetime.strptime(started_date, "%Y-%m-%d")
                
                # Check if completed within 24 months
                months_duration = (completed_date - started_date).days / 30.44  # Average days per month
                criteria_results["completed_within_24_months"] = months_duration <= 24
                
                if not criteria_results["completed_within_24_months"]:
                    missing_criteria.append("completed_within_24_months")
            else:
                criteria_results["completed_within_24_months"] = False
                missing_criteria.append("completed_within_24_months")
            
            # Standards conformance (typically would be verified by local review board)
            standards_conformance = property_data.get("standards_conformance", False)
            criteria_results["conformance_with_standards"] = standards_conformance
            if not criteria_results["conformance_with_standards"]:
                missing_criteria.append("conformance_with_standards")
            
            # Rehabilitation status
            rehab_completed = property_data.get("rehabilitation_completed", False)
            criteria_results["rehabilitation_completed"] = rehab_completed
            if not criteria_results["rehabilitation_completed"]:
                missing_criteria.append("rehabilitation_completed")
            
            # Calculate overall eligibility
            eligible = all(criteria_results.values())
            
            # Return eligibility result
            return {
                "success": True,
                "eligible": eligible,
                "criteria_results": criteria_results,
                "missing_criteria": missing_criteria,
                "required_expenditure": minimum_cost,
                "actual_expenditure": rehab_costs
            }
        
        except Exception as e:
            logger.error(f"Error verifying historic property eligibility: {str(e)}")
            return {
                "success": False,
                "error": f"Verification error: {str(e)}",
                "eligible": False
            }

# Singleton instance
historic_property_service = HistoricPropertyValuationService()