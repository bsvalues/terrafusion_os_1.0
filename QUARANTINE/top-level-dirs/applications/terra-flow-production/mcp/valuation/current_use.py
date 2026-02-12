"""
Current Use Valuation Module for Agricultural and Open Space Land (RCW 84.34)

This module implements the current use valuation methods for agricultural land,
open space, and timber land as defined by Washington State law RCW 84.34.
The module provides specialized valuation algorithms that assess land based on
its current use rather than highest and best use.

References:
- RCW 84.34: Open Space, Agricultural, Timber Lands -- Current Use Assessment
- WAC 458-30: Open Space Taxation Act Rules
"""

import logging
import math
from typing import Dict, List, Any, Optional, Union, Tuple
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

class CurrentUseValuationService:
    """
    Service for calculating current use valuations for properties
    under Washington's Current Use program (RCW 84.34)
    """
    
    def __init__(self):
        """Initialize the current use valuation service"""
        # Load soil capability classification income data
        # In production, this would be loaded from a database
        self.soil_income_data = {
            # Irrigated agriculture
            "irrigated": {
                1: 600.00,  # Class 1 soil - highest productivity
                2: 500.00,  # Class 2 soil
                3: 400.00,  # Class 3 soil
                4: 300.00,  # Class 4 soil
                5: 250.00,  # Class 5 soil
                6: 175.00,  # Class 6 soil
                7: 125.00,  # Class 7 soil
                8: 75.00    # Class 8 soil - lowest productivity
            },
            # Non-irrigated agriculture
            "non_irrigated": {
                1: 250.00,  # Class 1 soil
                2: 200.00,  # Class 2 soil
                3: 150.00,  # Class 3 soil
                4: 100.00,  # Class 4 soil
                5: 75.00,   # Class 5 soil
                6: 50.00,   # Class 6 soil
                7: 25.00,   # Class 7 soil
                8: 10.00    # Class 8 soil
            }
        }
        
        # Current capitalization rates by year
        # Per WAC 458-30-262, updated annually by Washington DOR
        self.capitalization_rates = {
            2025: 0.0834,  # Example rate for 2025
            2024: 0.0812,  # Example rate for 2024
            2023: 0.0791   # Example rate for 2023
        }
        
        # Open space rating system point values
        # In production, these would be from county policy
        self.open_space_ratings = {
            "public_access": {
                "unlimited": 15,
                "limited": 10,
                "none": 0
            },
            "public_benefit": {
                "high": 15,
                "medium": 10,
                "low": 5
            },
            "preservation_value": {
                "critical": 20,
                "significant": 15,
                "moderate": 10,
                "minimal": 5
            },
            "proximity_to_urban_area": {
                "within_1_mile": 15,
                "within_5_miles": 10,
                "beyond_5_miles": 5
            }
        }
        
        logger.info("Current Use Valuation Service initialized")
    
    def calculate_farm_land_value(
        self, 
        soil_type: int, 
        acres: float, 
        irrigated: bool = False,
        income_data: Optional[Dict] = None,
        cap_rate: Optional[float] = None,
        assessment_year: int = datetime.now().year
    ) -> Dict[str, Any]:
        """
        Calculate farm land value using the income method as specified in RCW 84.34
        
        Args:
            soil_type: Soil capability classification (1-8)
            acres: Land area in acres
            irrigated: Whether the land is irrigated
            income_data: Optional override for income data
            cap_rate: Optional override for capitalization rate
            assessment_year: Year of assessment
            
        Returns:
            Valuation result with calculated value and supporting data
        """
        try:
            # Validate soil type
            if soil_type < 1 or soil_type > 8:
                return {
                    "success": False,
                    "error": f"Invalid soil type: {soil_type}. Must be between 1-8.",
                    "value": 0.0
                }
            
            # Get income data for soil type
            farm_type = "irrigated" if irrigated else "non_irrigated"
            income_per_acre = income_data[farm_type][soil_type] if income_data else self.soil_income_data[farm_type][soil_type]
            
            # Get capitalization rate
            # If not provided, use current year's rate or most recent
            if not cap_rate:
                if assessment_year in self.capitalization_rates:
                    cap_rate = self.capitalization_rates[assessment_year]
                else:
                    # Use most recent year if assessment year not found
                    most_recent_year = max(self.capitalization_rates.keys())
                    cap_rate = self.capitalization_rates[most_recent_year]
                    logger.warning(f"Cap rate for {assessment_year} not found, using {most_recent_year} rate: {cap_rate}")
            
            # Calculate value using income method per RCW 84.34.065
            # Value = (Net income per acre / Capitalization rate) * Acres
            value_per_acre = income_per_acre / cap_rate
            total_value = value_per_acre * acres
            
            # Round to nearest 100 per common assessment practice
            rounded_value = round(total_value / 100) * 100
            
            return {
                "success": True,
                "value": rounded_value,
                "value_per_acre": round(value_per_acre),
                "acres": acres,
                "soil_type": soil_type,
                "farm_type": farm_type,
                "income_per_acre": income_per_acre,
                "cap_rate": cap_rate,
                "assessment_year": assessment_year,
                "method": "income"
            }
        
        except Exception as e:
            logger.error(f"Error calculating farm land value: {str(e)}")
            return {
                "success": False,
                "error": f"Calculation error: {str(e)}",
                "value": 0.0
            }
    
    def calculate_open_space_value(
        self, 
        assessed_value: float,
        rating_points: Optional[int] = None,
        ratings: Optional[Dict[str, str]] = None,
        assessment_year: int = datetime.now().year
    ) -> Dict[str, Any]:
        """
        Calculate open space land value based on public benefit rating system
        
        Args:
            assessed_value: Current assessed value at highest and best use
            rating_points: Total rating points (if already calculated)
            ratings: Dictionary of ratings by category (to calculate points)
            assessment_year: Year of assessment
            
        Returns:
            Valuation result with calculated value and supporting data
        """
        try:
            # Calculate rating points if not provided
            if rating_points is None and ratings:
                rating_points = 0
                
                # Add points from each category based on ratings
                if "public_access" in ratings:
                    rating_points += self.open_space_ratings["public_access"].get(ratings["public_access"], 0)
                
                if "public_benefit" in ratings:
                    rating_points += self.open_space_ratings["public_benefit"].get(ratings["public_benefit"], 0)
                
                if "preservation_value" in ratings:
                    rating_points += self.open_space_ratings["preservation_value"].get(ratings["preservation_value"], 0)
                
                if "proximity_to_urban_area" in ratings:
                    rating_points += self.open_space_ratings["proximity_to_urban_area"].get(ratings["proximity_to_urban_area"], 0)
            
            # If still no rating points, use a default mid-range value
            if rating_points is None:
                rating_points = 30
                logger.warning(f"No rating data provided, using default rating points: {rating_points}")
            
            # Calculate reduction percentage based on points
            # This follows a typical Washington county public benefit rating system
            # The specific percentages would normally be defined by county ordinance
            if rating_points >= 60:
                reduction_percent = 0.9  # 90% reduction
            elif rating_points >= 50:
                reduction_percent = 0.8  # 80% reduction
            elif rating_points >= 40:
                reduction_percent = 0.7  # 70% reduction
            elif rating_points >= 30:
                reduction_percent = 0.6  # 60% reduction
            elif rating_points >= 20:
                reduction_percent = 0.5  # 50% reduction
            elif rating_points >= 10:
                reduction_percent = 0.4  # 40% reduction
            else:
                reduction_percent = 0.3  # 30% reduction
            
            # Calculate reduced value
            reduced_value = assessed_value * (1 - reduction_percent)
            
            # Round to nearest 100
            rounded_value = round(reduced_value / 100) * 100
            
            return {
                "success": True,
                "value": rounded_value,
                "original_value": assessed_value,
                "rating_points": rating_points,
                "reduction_percent": reduction_percent * 100,  # Convert to percentage
                "assessment_year": assessment_year,
                "method": "public_benefit_rating"
            }
        
        except Exception as e:
            logger.error(f"Error calculating open space value: {str(e)}")
            return {
                "success": False,
                "error": f"Calculation error: {str(e)}",
                "value": 0.0
            }
    
    def calculate_timber_land_value(
        self, 
        soil_productivity: int,
        acres: float,
        assessment_year: int = datetime.now().year,
        land_grade: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Calculate timber land value based on productivity and land grade
        
        Args:
            soil_productivity: Soil productivity rating (1-5)
            acres: Land area in acres
            assessment_year: Year of assessment
            land_grade: Optional Washington DNR land grade (1-8)
            
        Returns:
            Valuation result with calculated value and supporting data
        """
        try:
            # In a real implementation, this would use the Department of Revenue
            # forest land values per WAC 458-40-540
            # For this demo, using simplified values
            
            # Validate soil productivity
            if soil_productivity < 1 or soil_productivity > 5:
                return {
                    "success": False,
                    "error": f"Invalid soil productivity: {soil_productivity}. Must be between 1-5.",
                    "value": 0.0
                }
            
            # Determine land grade if not provided
            if land_grade is None:
                # Simple mapping of soil productivity to land grade
                # In reality, this is more complex and involves site index
                land_grade = soil_productivity + 1
            
            # Simplified timber land values by land grade per acre
            # These would normally come from DOR tables
            timber_land_values = {
                1: 450,  # Land grade 1 (highest productivity)
                2: 400,  # Land grade 2
                3: 350,  # Land grade 3
                4: 300,  # Land grade 4
                5: 250,  # Land grade 5
                6: 200,  # Land grade 6
                7: 150,  # Land grade 7
                8: 100   # Land grade 8 (lowest productivity)
            }
            
            # Get value per acre based on land grade
            value_per_acre = timber_land_values.get(land_grade, 200)
            
            # Calculate total value
            total_value = value_per_acre * acres
            
            # Round to nearest 100
            rounded_value = round(total_value / 100) * 100
            
            return {
                "success": True,
                "value": rounded_value,
                "value_per_acre": value_per_acre,
                "acres": acres,
                "soil_productivity": soil_productivity,
                "land_grade": land_grade,
                "assessment_year": assessment_year,
                "method": "timber_productivity"
            }
        
        except Exception as e:
            logger.error(f"Error calculating timber land value: {str(e)}")
            return {
                "success": False,
                "error": f"Calculation error: {str(e)}",
                "value": 0.0
            }

# Singleton instance
current_use_service = CurrentUseValuationService()