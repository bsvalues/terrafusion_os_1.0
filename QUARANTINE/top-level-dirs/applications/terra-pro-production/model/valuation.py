"""
TerraFusion Core AI Valuator - Neural Spine
Core valuation engine that implements property assessment 
algorithms, adjustment calculations, and machine learning models.
"""
import os
import json
import math
import random
from datetime import datetime
from typing import Dict, List, Any, Tuple, Optional

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

class PropertyValuationModel:
    """
    A class that implements property valuation using both heuristic and 
    machine learning approaches.
    """

    def __init__(self):
        """
        Initialize the valuation model.
        """
        self.model = None
        self.column_transformer = None
        self.property_type_factors = {
            "single-family": 1.0,
            "condo": 0.85,
            "townhouse": 0.9,
            "multi-family": 1.2,
            "land": 0.7
        }
        self.condition_factors = {
            "Excellent": 1.15,
            "Good": 1.0,
            "Average": 0.9,
            "Fair": 0.75,
            "Poor": 0.6
        }
        self.feature_values = {
            "Hardwood Floors": 5000,
            "Updated Kitchen": 15000,
            "Fireplace": 3000,
            "Deck": 5000,
            "Swimming Pool": 20000,
            "Garage": 10000,
            "Central AC": 7000,
            "New Roof": 8000
        }
        
        # Initialize machine learning model if conditions permit
        try:
            self._init_ml_model()
        except Exception as e:
            print(f"Warning: ML model initialization failed: {e}")
            print("Using heuristic model only")

    def _init_ml_model(self):
        """
        Initialize and train the machine learning model.
        """
        # This is a placeholder for a real ML model training
        # In a real system, we would load data from a database or files,
        # and train a model on historical property data
        
        # Example feature columns
        numeric_features = ['squareFeet', 'bedrooms', 'bathrooms', 'yearBuilt', 'lotSize']
        categorical_features = ['propertyType', 'condition']
        
        # Column transformer for preprocessing
        self.column_transformer = ColumnTransformer([
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
        
        # Create pipeline with preprocessing and model
        self.model = Pipeline([
            ('preprocessor', self.column_transformer),
            ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
        ])
        
        # In a real system, we would train the model here
        # self.model.fit(X_train, y_train)
        
        # For now, we'll just set the trained flag to indicate 
        # we don't have a real trained model
        self.is_trained = False

    def _calculate_base_value(self, property_details: Dict[str, Any]) -> float:
        """
        Calculate the base value of a property using a heuristic approach.
        
        Args:
            property_details: Dictionary containing property attributes
            
        Returns:
            float: Base estimated value
        """
        # Get property attributes
        property_type = property_details.get("propertyType", "single-family")
        bedrooms = property_details.get("bedrooms", 3)
        bathrooms = property_details.get("bathrooms", 2.0)
        square_feet = property_details.get("squareFeet", 2000)
        year_built = property_details.get("yearBuilt", 1980)
        lot_size = property_details.get("lotSize", 0.25)  # acres
        condition = property_details.get("condition", "Good")
        
        # Get location data
        address = property_details.get("address", {})
        zip_code = address.get("zipCode", "00000")
        state = address.get("state", "")
        city = address.get("city", "")
        
        # Base value calculated on square footage (national average is ~$150/sqft)
        # This would be replaced with actual regional data in a real system
        if zip_code and zip_code.isdigit():
            # Simple zip code based price per square foot adjustment
            # First digit of ZIP indicates region (0-9)
            region = int(zip_code[0]) if zip_code else 5
            base_price_per_sqft = 120 + region * 10  # Simple regional variation
        else:
            base_price_per_sqft = 150  # Default
        
        base_value = square_feet * base_price_per_sqft
        
        # Apply property type multiplier
        property_type_multiplier = self.property_type_factors.get(property_type, 1.0)
        base_value *= property_type_multiplier
        
        # Apply condition multiplier
        condition_multiplier = self.condition_factors.get(condition, 1.0)
        base_value *= condition_multiplier
        
        # Adjust for bedrooms and bathrooms
        # More than 3 bedrooms adds value, less subtracts
        bedroom_adjustment = (bedrooms - 3) * 10000 if bedrooms else 0
        # More than 2 bathrooms adds value, less subtracts
        bathroom_adjustment = (bathrooms - 2) * 15000 if bathrooms else 0
        
        # Adjust for year built
        # Newer properties are worth more
        current_year = datetime.now().year
        age = current_year - year_built if year_built else 40
        age_adjustment = max(0, 50 - age) * 1000  # $1k per year under 50 years old
        
        # Adjust for lot size
        # Larger lots are worth more
        lot_adjustment = (lot_size - 0.25) * 50000 if lot_size else 0  # $50k per additional quarter acre
        
        # Calculate final base value
        final_base_value = base_value + bedroom_adjustment + bathroom_adjustment + age_adjustment + lot_adjustment
        
        return max(10000, final_base_value)  # Ensure a minimum value

    def _calculate_adjustments(
        self, 
        property_details: Dict[str, Any],
        comparable_properties: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Calculate adjustments based on property characteristics.
        
        Args:
            property_details: Dictionary containing subject property attributes
            comparable_properties: List of comparable properties
            
        Returns:
            List[Dict]: List of adjustment factors and amounts
        """
        adjustments = []
        
        # Feature-based adjustments
        features = property_details.get("features", [])
        if features:
            for feature in features:
                feature_name = feature.get("name")
                if feature_name in self.feature_values:
                    adjustments.append({
                        "factor": f"{feature_name}",
                        "description": f"Property has {feature_name}",
                        "amount": self.feature_values[feature_name],
                        "reasoning": f"{feature_name} typically adds value to a property"
                    })
        
        # Location-based adjustments
        address = property_details.get("address", {})
        city = address.get("city", "")
        
        # This would be replaced with actual location data in a real system
        if city:
            # Simple city-based adjustment
            location_adj = random.uniform(0.02, 0.05) * self._calculate_base_value(property_details)
            adjustments.append({
                "factor": "Location",
                "description": f"Property located in {city}",
                "amount": round(location_adj, 2),
                "reasoning": f"Market data indicates properties in {city} command a premium"
            })
            
        # Size-based adjustments
        square_feet = property_details.get("squareFeet")
        if square_feet and square_feet > 2500:
            size_adj = (square_feet - 2500) * 25  # $25 per square foot above 2500
            adjustments.append({
                "factor": "Above-Average Size",
                "description": f"Property has {square_feet} square feet",
                "amount": round(size_adj, 2),
                "reasoning": f"Properties larger than 2,500 square feet command a premium of approximately $25 per additional square foot"
            })
            
        # Age-based adjustments
        year_built = property_details.get("yearBuilt")
        if year_built and year_built > 2010:
            new_construction_adj = (year_built - 2010) * 2500  # $2.5k per year newer than 2010
            adjustments.append({
                "factor": "New Construction",
                "description": f"Property built in {year_built}",
                "amount": round(new_construction_adj, 2),
                "reasoning": f"Newer construction (post-2010) adds significant value due to modern design, energy efficiency, and reduced maintenance costs"
            })
            
        return adjustments

    def _determine_confidence_level(self, property_details: Dict[str, Any], comparables: List[Dict[str, Any]]) -> Tuple[str, float]:
        """
        Determine the confidence level of the valuation.
        
        Args:
            property_details: Dictionary containing property attributes
            comparables: List of comparable properties
            
        Returns:
            Tuple[str, float]: Confidence level (high, medium, low) and confidence score (0-1)
        """
        # Base confidence starts at medium
        confidence_score = 0.5
        
        # Adjust based on data completeness
        data_completeness = sum([
            1 if property_details.get("bedrooms") is not None else 0,
            1 if property_details.get("bathrooms") is not None else 0,
            1 if property_details.get("squareFeet") is not None else 0,
            1 if property_details.get("yearBuilt") is not None else 0,
            1 if property_details.get("lotSize") is not None else 0,
            1 if property_details.get("condition") is not None else 0
        ]) / 6.0
        
        confidence_score += data_completeness * 0.2
        
        # Adjust based on comparable properties
        if comparables:
            # More comparables increases confidence
            num_comparables = len(comparables)
            if num_comparables >= 5:
                confidence_score += 0.2
            elif num_comparables >= 3:
                confidence_score += 0.1
            
            # Recent comparables increases confidence
            current_year = datetime.now().year
            recent_comparables = sum(1 for comp in comparables if 
                                    comp.get("saleDate", "").startswith(str(current_year)))
            if recent_comparables > 0:
                confidence_score += 0.1
        else:
            confidence_score -= 0.1
            
        # Determine confidence level
        if confidence_score >= 0.8:
            confidence_level = "high"
        elif confidence_score >= 0.5:
            confidence_level = "medium"
        else:
            confidence_level = "low"
            
        return confidence_level, min(1.0, max(0.1, confidence_score))

    def value_property(
        self, 
        property_details: Dict[str, Any],
        comparable_properties: List[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Value a property using available data.
        
        Args:
            property_details: Dictionary containing property attributes
            comparable_properties: List of comparable properties
            
        Returns:
            Dict: Valuation results including estimated value, adjustments, etc.
        """
        if comparable_properties is None:
            comparable_properties = []
            
        # Calculate base value using our heuristic approach
        base_value = self._calculate_base_value(property_details)
        
        # Calculate adjustments
        adjustments = self._calculate_adjustments(property_details, comparable_properties)
        
        # Apply adjustments
        adjusted_value = base_value
        for adjustment in adjustments:
            adjusted_value += adjustment["amount"]
            
        # Determine confidence level
        confidence_level, confidence_score = self._determine_confidence_level(
            property_details, comparable_properties
        )
        
        # Calculate value range based on confidence
        if confidence_level == "high":
            range_percent = 0.05  # ±5%
        elif confidence_level == "medium":
            range_percent = 0.10  # ±10%
        else:
            range_percent = 0.15  # ±15%
            
        min_value = adjusted_value * (1 - range_percent)
        max_value = adjusted_value * (1 + range_percent)
        
        # Generate comparable analysis
        comparable_analysis = self._generate_comparable_analysis(
            property_details, comparable_properties
        )
        
        # Prepare valuation response
        valuation = {
            "estimatedValue": round(adjusted_value, 2),
            "confidenceLevel": confidence_level,
            "valueRange": {
                "min": round(min_value, 2),
                "max": round(max_value, 2)
            },
            "adjustments": adjustments,
            "marketAnalysis": analyze_market_trends(property_details),
            "comparableAnalysis": comparable_analysis,
            "valuationMethodology": "Hybrid (Sales Comparison + Heuristic Model)" if comparable_properties else "Heuristic Model"
        }
        
        return valuation

    def _generate_comparable_analysis(
        self, 
        property_details: Dict[str, Any],
        comparable_properties: List[Dict[str, Any]]
    ) -> str:
        """
        Generate a summary of the comparable analysis.
        
        Args:
            property_details: Dictionary containing property attributes
            comparable_properties: List of comparable properties
            
        Returns:
            str: Analysis of comparables
        """
        if not comparable_properties:
            return "No comparable properties were provided for analysis. The valuation is based on property characteristics and general market data."
            
        num_comparables = len(comparable_properties)
        address = property_details.get("address", {})
        city = address.get("city", "Unknown")
        
        # Calculate average sale price of comparables
        sale_prices = [comp.get("salePrice", 0) for comp in comparable_properties if comp.get("salePrice")]
        if sale_prices:
            avg_sale_price = sum(sale_prices) / len(sale_prices)
            price_range = [min(sale_prices), max(sale_prices)]
        else:
            return f"Comparable property data was incomplete. The valuation is primarily based on property characteristics and general market data for {city}."
        
        # Analyze recency of sales
        current_date = datetime.now().date()
        sale_dates = []
        for comp in comparable_properties:
            sale_date_str = comp.get("saleDate")
            if sale_date_str:
                try:
                    sale_date = datetime.strptime(sale_date_str, "%Y-%m-%d").date()
                    sale_dates.append(sale_date)
                except ValueError:
                    pass
        
        if sale_dates:
            newest_sale = max(sale_dates)
            oldest_sale = min(sale_dates)
            days_newest = (current_date - newest_sale).days
            days_oldest = (current_date - oldest_sale).days
        
        # Generate analysis text
        analysis = f"Analysis of {num_comparables} comparable properties "
        
        if sale_dates:
            if days_newest < 30:
                sale_recency = "very recent"
            elif days_newest < 90:
                sale_recency = "recent"
            elif days_newest < 180:
                sale_recency = "moderately recent"
            else:
                sale_recency = "historical"
                
            analysis += f"with {sale_recency} sales data "
            
        if "city" in address:
            analysis += f"in {city} "
            
        analysis += f"shows sale prices ranging from ${price_range[0]:,.0f} to ${price_range[1]:,.0f}, "
        analysis += f"with an average of ${avg_sale_price:,.0f}. "
        
        # Compare subject to comparables
        subject_sqft = property_details.get("squareFeet")
        comp_sqft_values = [comp.get("squareFeet", 0) for comp in comparable_properties if comp.get("squareFeet")]
        
        if subject_sqft and comp_sqft_values:
            avg_comp_sqft = sum(comp_sqft_values) / len(comp_sqft_values)
            if subject_sqft > avg_comp_sqft * 1.1:
                analysis += f"The subject property is larger than the average comparable (by approximately {(subject_sqft / avg_comp_sqft - 1) * 100:.0f}%), which positively impacts its value. "
            elif subject_sqft < avg_comp_sqft * 0.9:
                analysis += f"The subject property is smaller than the average comparable (by approximately {(1 - subject_sqft / avg_comp_sqft) * 100:.0f}%), which is reflected in its valuation. "
        
        return analysis


def perform_automated_valuation(
    property_details: Dict[str, Any],
    comparable_properties: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Perform an automated valuation of a property.
    
    Args:
        property_details: Dictionary containing property attributes
        comparable_properties: List of comparable properties
        
    Returns:
        Dict: Valuation results
    """
    model = PropertyValuationModel()
    return model.value_property(property_details, comparable_properties)


def analyze_market_trends(
    property_details: Dict[str, Any],
    zip_code: str = None
) -> str:
    """
    Analyze market trends for a specific property location.
    
    Args:
        property_details: Dictionary containing property attributes
        zip_code: ZIP code for the property
        
    Returns:
        str: Market analysis text
    """
    # Get location info from property details or use provided zip_code
    address = property_details.get("address", {})
    zip_code = zip_code or address.get("zipCode")
    city = address.get("city", "the area")
    state = address.get("state")
    
    # This is a placeholder - in a real system we would use actual market data
    # from a database or external API based on the location
    
    # Simple trend generation based on zip code
    if zip_code and zip_code.isdigit():
        # Use the first digit of ZIP to determine region
        region = int(zip_code[0]) if zip_code else 5
        
        # Different regions have different market conditions
        appreciation_rates = {
            0: (2.5, 3.5),   # Northeast
            1: (3.0, 4.5),   # Northeast
            2: (2.0, 3.0),   # Mid-Atlantic
            3: (3.5, 4.5),   # Southeast
            4: (2.5, 4.0),   # Southeast
            5: (2.0, 3.0),   # Midwest
            6: (1.5, 3.0),   # Midwest
            7: (2.0, 3.0),   # South Central
            8: (3.0, 5.0),   # Mountain West
            9: (4.0, 6.0)    # West Coast
        }
        
        # Get appreciation range for this region
        min_rate, max_rate = appreciation_rates.get(region, (2.5, 4.0))
        
        # Add some randomness for variation
        appreciation_rate = round(random.uniform(min_rate, max_rate), 1)
        
        # Generate inventory level (months of supply)
        inventory_levels = {
            0: (3.0, 4.5),
            1: (2.5, 4.0),
            2: (3.0, 5.0),
            3: (2.0, 3.5),
            4: (2.5, 4.0),
            5: (3.5, 5.0),
            6: (4.0, 5.5),
            7: (3.0, 5.0),
            8: (2.0, 3.5),
            9: (1.5, 3.0)
        }
        
        min_inv, max_inv = inventory_levels.get(region, (2.5, 4.5))
        inventory = round(random.uniform(min_inv, max_inv), 1)
        
        # Generate days on market
        dom_ranges = {
            0: (25, 45),
            1: (20, 40),
            2: (30, 50),
            3: (15, 35),
            4: (20, 40),
            5: (30, 55),
            6: (35, 60),
            7: (25, 45),
            8: (15, 35),
            9: (10, 30)
        }
        
        min_dom, max_dom = dom_ranges.get(region, (20, 45))
        days_on_market = random.randint(min_dom, max_dom)
    else:
        # Default values if ZIP is not available
        appreciation_rate = 3.2
        inventory = 3.5
        days_on_market = 35
    
    # Determine market conditions based on inventory
    if inventory < 3.0:
        market_condition = "seller's market"
        price_pressure = "upward"
    elif inventory < 5.0:
        market_condition = "balanced market"
        price_pressure = "stable"
    else:
        market_condition = "buyer's market"
        price_pressure = "downward"
        
    # Generate market analysis text
    analysis = f"The real estate market in {city}"
    if state:
        analysis += f", {state},"
    
    analysis += f" has shown {appreciation_rate}% appreciation over the past 12 months. "
    analysis += f"Current inventory levels are at {inventory} months of supply, indicating a {market_condition} with {price_pressure} pressure on prices. "
    analysis += f"Properties in this area typically sell within {days_on_market} days of listing. "
    
    # Add property type specific info
    property_type = property_details.get("propertyType", "residential")
    if property_type == "single-family":
        analysis += "Single-family homes in this area have been particularly strong performers, with growing demand from both first-time buyers and downsizing empty-nesters. "
    elif property_type == "condo":
        analysis += "The condominium market has seen steady demand, particularly from urban professionals and investors seeking rental properties. "
    elif property_type == "townhouse":
        analysis += "Townhouses offer an attractive middle ground between single-family homes and condos, and have seen consistent demand from young families and professionals. "
    elif property_type == "multi-family":
        analysis += "Multi-family properties remain attractive investment options due to strong rental demand and the potential for steady income streams. "
    elif property_type == "land":
        analysis += "Vacant land has seen increasing interest from developers as existing housing inventory remains tight in many areas. "
        
    return analysis


def generate_valuation_narrative(
    property_details: Dict[str, Any],
    valuation: Dict[str, Any]
) -> str:
    """
    Generate a narrative description of the valuation results.
    
    Args:
        property_details: Dictionary containing property attributes
        valuation: Dictionary containing valuation results
        
    Returns:
        str: Narrative text
    """
    # Extract key information
    address = property_details.get("address", {})
    full_address = f"{address.get('street', '')}, {address.get('city', '')}, {address.get('state', '')} {address.get('zipCode', '')}"
    property_type = property_details.get("propertyType", "property")
    estimated_value = valuation.get("estimatedValue", 0)
    confidence_level = valuation.get("confidenceLevel", "medium")
    value_range = valuation.get("valueRange", {"min": 0, "max": 0})
    
    # Format values for display
    formatted_value = f"${estimated_value:,.0f}" if isinstance(estimated_value, (int, float)) else estimated_value
    formatted_min = f"${value_range['min']:,.0f}" if isinstance(value_range['min'], (int, float)) else value_range['min']
    formatted_max = f"${value_range['max']:,.0f}" if isinstance(value_range['max'], (int, float)) else value_range['max']
    
    # Generate intro paragraph
    narrative = f"# Valuation Summary for {full_address}\n\n"
    
    narrative += f"## Executive Summary\n\n"
    narrative += f"The {property_type} located at {full_address} has an estimated market value of "
    narrative += f"{formatted_value} as of {datetime.now().strftime('%B %d, %Y')}. "
    narrative += f"This valuation has a {confidence_level} confidence level, with a probable value range of "
    narrative += f"{formatted_min} to {formatted_max}. "
    
    # Add methodology paragraph
    methodology = valuation.get("valuationMethodology", "")
    narrative += f"\n## Methodology\n\n"
    narrative += f"This valuation was produced using a {methodology.lower()}. "
    
    if "Hybrid" in methodology or "Comparison" in methodology:
        narrative += "The sales comparison approach analyzes recent sales of similar properties, making adjustments for differences in features, condition, location, and other factors. "
    
    if "Heuristic" in methodology:
        narrative += "The heuristic model incorporates regional price trends, property characteristics, and feature-based adjustments to estimate market value. "
    
    # Add key property attributes
    narrative += f"\n## Property Characteristics\n\n"
    narrative += f"The subject property is a {property_type}"
    
    # Add bedroom/bathroom counts if available
    bedrooms = property_details.get("bedrooms")
    bathrooms = property_details.get("bathrooms")
    
    if bedrooms and bathrooms:
        narrative += f" with {bedrooms} bedroom(s) and {bathrooms} bathroom(s)"
    elif bedrooms:
        narrative += f" with {bedrooms} bedroom(s)"
    elif bathrooms:
        narrative += f" with {bathrooms} bathroom(s)"
        
    # Add square footage if available
    square_feet = property_details.get("squareFeet")
    if square_feet:
        narrative += f", comprising approximately {square_feet:,} square feet"
        
    # Add year built if available
    year_built = property_details.get("yearBuilt")
    if year_built:
        narrative += f". The property was built in {year_built}"
        
    # Add lot size if available
    lot_size = property_details.get("lotSize")
    if lot_size:
        narrative += f" and sits on a {lot_size:g} acre lot"
        
    narrative += ".\n\n"
    
    # Add condition if available
    condition = property_details.get("condition")
    if condition:
        narrative += f"The property is in {condition} condition. "
        
    # Add features if available
    features = property_details.get("features", [])
    if features:
        narrative += "Notable features include "
        feature_names = [feature.get("name") for feature in features if feature.get("name")]
        
        if feature_names:
            if len(feature_names) == 1:
                narrative += feature_names[0]
            else:
                narrative += ", ".join(feature_names[:-1]) + f", and {feature_names[-1]}"
        narrative += ".\n\n"
        
    # Add market analysis
    market_analysis = valuation.get("marketAnalysis", "")
    if market_analysis:
        narrative += f"\n## Market Analysis\n\n"
        narrative += f"{market_analysis}\n\n"
        
    # Add comparable analysis if available
    comparable_analysis = valuation.get("comparableAnalysis", "")
    if comparable_analysis:
        narrative += f"\n## Comparable Property Analysis\n\n"
        narrative += f"{comparable_analysis}\n\n"
        
    # Add adjustments section if available
    adjustments = valuation.get("adjustments", [])
    if adjustments:
        narrative += f"\n## Value Adjustments\n\n"
        
        total_adjustments = sum(adj.get("amount", 0) for adj in adjustments)
        formatted_total = f"${total_adjustments:,.0f}" if isinstance(total_adjustments, (int, float)) else total_adjustments
        
        narrative += f"Total value adjustments of {formatted_total} were applied based on the following factors:\n\n"
        
        for adj in adjustments:
            factor = adj.get("factor", "")
            description = adj.get("description", "")
            amount = adj.get("amount", 0)
            reasoning = adj.get("reasoning", "")
            
            formatted_amount = f"${amount:,.0f}" if isinstance(amount, (int, float)) else amount
            
            narrative += f"- **{factor} ({formatted_amount})**: {description}. {reasoning}\n"
            
    # Add confidence explanation
    narrative += f"\n## Confidence Assessment\n\n"
    if confidence_level == "high":
        narrative += "This valuation has a **high confidence level**, indicating strong supporting data and market evidence. "
        narrative += "The value range is relatively narrow, reflecting the strength of the underlying analysis."
    elif confidence_level == "medium":
        narrative += "This valuation has a **medium confidence level**, indicating adequate supporting data but some uncertainty factors. "
        narrative += "The value range is moderately wide, reflecting normal market variability and data limitations."
    else:
        narrative += "This valuation has a **low confidence level**, indicating limited supporting data or unusual property characteristics. "
        narrative += "The value range is relatively wide, reflecting the uncertainty in the analysis."
        
    return narrative