"""
AI insights module for Southeastern Washington properties.

This module provides AI-powered insights specific to properties
in Southeastern Washington counties.
"""

import logging
import os
from typing import Dict, List, Any, Optional

from regional.southeastern_wa import (
    get_county_info, 
    get_regional_insights,
    format_for_assessment_report
)

logger = logging.getLogger(__name__)

def generate_se_wa_property_insights(property_data: Dict[str, Any], county: str = "Benton") -> List[Dict[str, str]]:
    """
    Generate Southeastern Washington specific insights for a property.
    
    Args:
        property_data: Data about the property
        county: The county where the property is located (defaults to Benton)
        
    Returns:
        List of insights with title and description
    """
    try:
        # Get region-specific insights
        insights = get_regional_insights(property_data, county)
        
        # Add assessment-focused insights
        assessment_data = format_for_assessment_report(property_data)
        
        # Add valuation insight
        if assessment_data.get("last_sale_price") and assessment_data.get("total_value"):
            sale_price = assessment_data["last_sale_price"]
            assessed_value = assessment_data["total_value"]
            ratio = (assessed_value / sale_price) if sale_price > 0 else 1.0
            
            ratio_description = ""
            if ratio < 0.9:
                ratio_description = (
                    f"The assessed value is significantly lower than the last sale price "
                    f"(ratio: {ratio:.2f}). This property may be under-assessed."
                )
            elif ratio > 1.1:
                ratio_description = (
                    f"The assessed value is significantly higher than the last sale price "
                    f"(ratio: {ratio:.2f}). The owner may have grounds for appeal."
                )
            else:
                ratio_description = (
                    f"The assessment ratio is {ratio:.2f}, which is within normal range "
                    f"for Southeastern Washington counties (0.9-1.1)."
                )
            
            insights.append({
                "title": "Assessment Ratio Analysis",
                "description": ratio_description
            })
        
        # Add levy code insight if available
        if assessment_data.get("levy_code"):
            insights.append({
                "title": "Levy Code Information",
                "description": f"This property is in levy code {assessment_data['levy_code']}. Review the associated tax rates and special assessments that apply to this area."
            })
        
        # Add year built insight
        if assessment_data.get("year_built"):
            year_built = assessment_data["year_built"]
            current_year = 2025  # Update as needed
            age = current_year - int(year_built)
            
            if age > 50:
                insights.append({
                    "title": "Historic Property Potential",
                    "description": f"This property is {age} years old, which may qualify it for historic property consideration in some Southeastern Washington jurisdictions."
                })
            
            # Add depreciation insight for assessors
            insights.append({
                "title": "Depreciation Analysis",
                "description": f"Built in {year_built}, this property has depreciated approximately {min(age * 1.5, 70):.1f}% from cost new, based on Southeastern Washington assessment tables."
            })
        
        # Add Benton County specific insights
        if county.lower() == "benton":
            insights.append({
                "title": "Benton County Assessment Cycle",
                "description": "Benton County is currently in year 2 of the 3-year physical inspection cycle for this area. Next physical inspection is scheduled for 2026."
            })
        
        return insights
    except Exception as e:
        logger.error(f"Error generating Southeastern Washington insights: {str(e)}")
        # Return a minimal set of generic insights if an error occurs
        return [
            {
                "title": "Southeastern Washington Property",
                "description": "This property is located in the Southeastern Washington region. Consider local market factors when reviewing the assessment."
            }
        ]

def get_county_from_property(property_data: Dict[str, Any]) -> str:
    """
    Determine the county for a property based on available data.
    
    Args:
        property_data: Data about the property
        
    Returns:
        County name (defaults to "Benton" if county can't be determined)
    """
    # Try to determine county from city
    city = property_data.get("city", "").lower()
    
    if city in ["kennewick", "richland", "west richland", "prosser", "benton city"]:
        return "Benton"
    elif city in ["pasco", "connell", "mesa", "basin city"]:
        return "Franklin"
    elif city in ["walla walla", "college place", "waitsburg", "prescott", "burbank"]:
        return "Walla Walla"
    elif city in ["dayton", "starbuck"]:
        return "Columbia"
    elif city == "pomeroy":
        return "Garfield"
    elif city in ["clarkston", "asotin"]:
        return "Asotin"
    
    # Try to determine from zip code
    zip_code = property_data.get("zip_code", "")
    if zip_code.startswith("993"):  # Tri-Cities area
        if zip_code in ["99320", "99336", "99337", "99338", "99352", "99353", "99354"]:
            return "Benton"
        elif zip_code in ["99301", "99302"]:
            return "Franklin"
    
    # Default to Benton County if we can't determine
    return "Benton"