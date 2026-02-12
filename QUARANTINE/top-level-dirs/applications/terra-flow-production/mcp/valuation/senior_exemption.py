"""
Senior and Disabled Persons Exemption Module (RCW 84.36.381)

This module implements the property tax exemption methods for senior citizens
and disabled persons as defined by Washington State law RCW 84.36.381. The
exemption provides tax relief for qualifying homeowners based on income thresholds.

References:
- RCW 84.36.381-389: Residences – Property tax exemptions
- WAC 458-16A: Property Tax – Exemptions – Homes for the Aging, Senior Citizens, and Disabled Persons
"""

import logging
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime, date

# Configure logging
logger = logging.getLogger(__name__)

class SeniorExemptionService:
    """
    Service for calculating property tax exemptions for senior citizens and
    disabled persons under Washington's exemption program (RCW 84.36.381)
    """
    
    def __init__(self):
        """Initialize the senior/disabled exemption service"""
        # Current income thresholds
        # These are updated annually by county assessors based on median income
        # For Benton County example values
        self.income_thresholds = {
            2025: {
                "tier1": 50000,   # Full exemption for tax value
                "tier2": 40000,   # Partial exemption
                "tier3": 35000    # Minimum qualifying threshold
            },
            2024: {
                "tier1": 48000,
                "tier2": 38000,
                "tier3": 33000
            },
            2023: {
                "tier1": 45000,
                "tier2": 35000,
                "tier3": 30000
            }
        }
        
        # Age threshold for senior citizens
        self.SENIOR_AGE_THRESHOLD = 61
        
        # Maximum value exempted for each tier
        # This is the maximum value of residence that can be exempted
        self.exemption_caps = {
            2025: {
                "tier1": 100000,  # For lowest income level
                "tier2": 75000,   # For middle income level
                "tier3": 60000    # For highest qualifying income level
            },
            2024: {
                "tier1": 95000,
                "tier2": 70000, 
                "tier3": 55000
            },
            2023: {
                "tier1": 90000,
                "tier2": 65000,
                "tier3": 50000
            }
        }
        
        # Exemption percentages by tier
        self.exemption_percentages = {
            "tier1": 1.0,    # 100% of tax value up to cap
            "tier2": 0.65,   # 65% of tax value up to cap
            "tier3": 0.35    # 35% of tax value up to cap
        }
        
        logger.info("Senior/Disabled Exemption Service initialized")
    
    def calculate_exemption(
        self, 
        property_value: float,
        income: float,
        age: Optional[int] = None,
        birth_date: Optional[date] = None,
        is_disabled: bool = False,
        is_veteran: bool = False,
        is_widow_widower: bool = False,
        assessment_year: int = datetime.now().year
    ) -> Dict[str, Any]:
        """
        Calculate property tax exemption for seniors and disabled persons
        
        Args:
            property_value: Assessed value of the property
            income: Annual household disposable income
            age: Age of the applicant (if not provided, birth_date must be)
            birth_date: Birth date of the applicant (if age not provided)
            is_disabled: Whether the applicant is disabled
            is_veteran: Whether the applicant is a disabled veteran
            is_widow_widower: Whether the applicant is a widow/widower of veteran
            assessment_year: Year of assessment
            
        Returns:
            Exemption result with calculated exemption amount and tax impact
        """
        try:
            # Calculate age if birth_date provided
            if age is None and birth_date:
                today = datetime.now().date()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            
            # Check if qualifying by age
            qualifies_by_age = False
            if age:
                qualifies_by_age = age >= self.SENIOR_AGE_THRESHOLD
            
            # Determine overall qualification
            qualifies = qualifies_by_age or is_disabled or is_veteran or is_widow_widower
            
            if not qualifies:
                return {
                    "success": False,
                    "error": "Applicant does not qualify for exemption. Must be 61+ years old, disabled, a disabled veteran, or widow/widower of veteran.",
                    "exemption_amount": 0,
                    "property_value": property_value
                }
            
            # Get income thresholds for assessment year
            # Fall back to most recent year if not found
            year_thresholds = self.income_thresholds.get(assessment_year)
            if not year_thresholds:
                most_recent_year = max(self.income_thresholds.keys())
                year_thresholds = self.income_thresholds[most_recent_year]
                logger.warning(f"Income thresholds for {assessment_year} not found, using {most_recent_year} thresholds")
            
            # Get exemption caps for assessment year
            year_caps = self.exemption_caps.get(assessment_year)
            if not year_caps:
                most_recent_year = max(self.exemption_caps.keys())
                year_caps = self.exemption_caps[most_recent_year]
                logger.warning(f"Exemption caps for {assessment_year} not found, using {most_recent_year} caps")
            
            # Determine income tier
            tier = None
            if income <= year_thresholds["tier1"]:
                tier = "tier1"
            elif income <= year_thresholds["tier2"]:
                tier = "tier2"
            elif income <= year_thresholds["tier3"]:
                tier = "tier3"
            
            # If income exceeds all thresholds, no exemption
            if not tier:
                return {
                    "success": False,
                    "error": f"Income exceeds maximum threshold of ${year_thresholds['tier3']:,}",
                    "exemption_amount": 0,
                    "property_value": property_value
                }
            
            # Calculate exemption amount
            exemption_cap = year_caps[tier]
            exemption_percentage = self.exemption_percentages[tier]
            
            # The exemption is the lesser of:
            # 1. The exemption cap for the tier
            # 2. The percentage of the property value for the tier
            exemption_amount = min(exemption_cap, property_value * exemption_percentage)
            
            # Calculate taxable value (property value minus exemption)
            taxable_value = property_value - exemption_amount
            
            # Ensure taxable value is not negative
            if taxable_value < 0:
                taxable_value = 0
            
            # Round to nearest 100
            exemption_amount = round(exemption_amount / 100) * 100
            taxable_value = round(taxable_value / 100) * 100
            
            return {
                "success": True,
                "property_value": property_value,
                "exemption_amount": exemption_amount,
                "taxable_value": taxable_value,
                "income_tier": tier,
                "income_threshold": year_thresholds[tier],
                "exemption_percentage": exemption_percentage * 100,  # Convert to percentage
                "exemption_cap": exemption_cap,
                "assessment_year": assessment_year,
                "qualification_type": self._determine_qualification_type(qualifies_by_age, is_disabled, is_veteran, is_widow_widower),
                "method": "senior_exemption"
            }
        
        except Exception as e:
            logger.error(f"Error calculating senior/disabled exemption: {str(e)}")
            return {
                "success": False,
                "error": f"Calculation error: {str(e)}",
                "exemption_amount": 0,
                "property_value": property_value
            }
    
    def verify_eligibility(
        self,
        property_data: Dict[str, Any],
        applicant_data: Dict[str, Any],
        assessment_year: int = datetime.now().year
    ) -> Dict[str, Any]:
        """
        Verify if an applicant is eligible for the senior/disabled exemption
        
        Args:
            property_data: Dictionary containing property details
            applicant_data: Dictionary containing applicant details
            assessment_year: Year of assessment
            
        Returns:
            Eligibility determination with requirements and missing criteria
        """
        try:
            # Required criteria for exemption
            required_criteria = [
                "age_or_disability",
                "income_qualification",
                "ownership_and_residency",
                "primary_residence"
            ]
            
            # Check each criterion
            criteria_results = {}
            missing_criteria = []
            
            # Age or disability
            age = applicant_data.get("age")
            birth_date = applicant_data.get("birth_date")
            is_disabled = applicant_data.get("is_disabled", False)
            is_veteran = applicant_data.get("is_disabled_veteran", False)
            is_widow_widower = applicant_data.get("is_widow_widower", False)
            
            # Calculate age if birth_date provided
            if age is None and birth_date:
                if isinstance(birth_date, str):
                    birth_date = datetime.strptime(birth_date, "%Y-%m-%d").date()
                
                today = datetime.now().date()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            
            # Check age qualification
            qualifies_by_age = age is not None and age >= self.SENIOR_AGE_THRESHOLD
            
            # Determine overall qualification for age/disability criterion
            criteria_results["age_or_disability"] = qualifies_by_age or is_disabled or is_veteran or is_widow_widower
            if not criteria_results["age_or_disability"]:
                missing_criteria.append("age_or_disability")
            
            # Income qualification
            income = applicant_data.get("income", 0)
            
            # Get income thresholds for assessment year
            year_thresholds = self.income_thresholds.get(assessment_year)
            if not year_thresholds:
                most_recent_year = max(self.income_thresholds.keys())
                year_thresholds = self.income_thresholds[most_recent_year]
            
            # Check if income is below maximum threshold
            criteria_results["income_qualification"] = income <= year_thresholds["tier3"]
            if not criteria_results["income_qualification"]:
                missing_criteria.append("income_qualification")
            
            # Ownership and residency
            is_owner = property_data.get("is_owner", False)
            residency_years = property_data.get("residency_years", 0)
            
            # RCW 84.36.381 requires ownership and occupancy for at least 9 months of the year
            criteria_results["ownership_and_residency"] = is_owner and residency_years >= 1
            if not criteria_results["ownership_and_residency"]:
                missing_criteria.append("ownership_and_residency")
            
            # Primary residence
            is_primary_residence = property_data.get("is_primary_residence", False)
            criteria_results["primary_residence"] = is_primary_residence
            if not criteria_results["primary_residence"]:
                missing_criteria.append("primary_residence")
            
            # Calculate overall eligibility
            eligible = all(criteria_results.values())
            
            # Determine income tier if eligible
            income_tier = None
            if eligible:
                if income <= year_thresholds["tier1"]:
                    income_tier = "tier1"
                elif income <= year_thresholds["tier2"]:
                    income_tier = "tier2"
                elif income <= year_thresholds["tier3"]:
                    income_tier = "tier3"
            
            # Return eligibility result
            return {
                "success": True,
                "eligible": eligible,
                "criteria_results": criteria_results,
                "missing_criteria": missing_criteria,
                "income_tier": income_tier,
                "income_thresholds": year_thresholds,
                "qualification_type": self._determine_qualification_type(qualifies_by_age, is_disabled, is_veteran, is_widow_widower)
            }
        
        except Exception as e:
            logger.error(f"Error verifying senior/disabled exemption eligibility: {str(e)}")
            return {
                "success": False,
                "error": f"Verification error: {str(e)}",
                "eligible": False
            }
    
    def _determine_qualification_type(
        self,
        qualifies_by_age: bool,
        is_disabled: bool,
        is_veteran: bool,
        is_widow_widower: bool
    ) -> str:
        """
        Determine the qualification type for the exemption
        
        Args:
            qualifies_by_age: Whether applicant qualifies by age
            is_disabled: Whether applicant is disabled
            is_veteran: Whether applicant is a disabled veteran
            is_widow_widower: Whether applicant is a widow/widower of veteran
            
        Returns:
            Qualification type string
        """
        if qualifies_by_age:
            return "senior_citizen"
        elif is_veteran:
            return "disabled_veteran"
        elif is_widow_widower:
            return "widow_widower"
        elif is_disabled:
            return "disabled_person"
        else:
            return "unknown"

# Singleton instance
senior_exemption_service = SeniorExemptionService()