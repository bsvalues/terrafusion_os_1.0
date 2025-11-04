"""
TerraFusion Property Valuation API Routes
Provides endpoints for property valuation services
"""
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Path, Query, Body
from pydantic import BaseModel
import json
import logging
from datetime import datetime

# Import the PropertyValuationModel
from backend.valuation_engine import PropertyValuationModel

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize the router
router = APIRouter(tags=["valuation"])

# Initialize the valuation model
valuation_model = PropertyValuationModel()

# Define data models
class PropertyAddress(BaseModel):
    street: str
    city: str
    state: str
    zipCode: str
    country: Optional[str] = "USA"

class PropertyFeature(BaseModel):
    name: str
    value: Optional[str] = None

class PropertyDetails(BaseModel):
    address: PropertyAddress
    propertyType: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    squareFeet: Optional[int] = None
    yearBuilt: Optional[int] = None
    lotSize: Optional[float] = None
    features: Optional[List[PropertyFeature]] = None
    condition: Optional[str] = None

class ValueRange(BaseModel):
    min: float
    max: float

class Adjustment(BaseModel):
    factor: str
    description: str
    amount: float
    reasoning: str

class ValuationResponse(BaseModel):
    estimatedValue: float
    confidenceLevel: str
    valueRange: ValueRange
    adjustments: List[Adjustment]
    marketAnalysis: str
    valuationMethodology: str
    modelVersion: str
    timestamp: str

# Mock database for development purposes - in production this would be a real database
# We're just using this to simulate fetching properties by ID
PROPERTY_DB = {
    1: {
        "address": {
            "street": "123 Main St",
            "city": "Anytown",
            "state": "CA",
            "zipCode": "90210"
        },
        "propertyType": "single-family",
        "bedrooms": 3,
        "bathrooms": 2.5,
        "squareFeet": 2100,
        "yearBuilt": 1985,
        "lotSize": 0.25,
        "features": [
            {"name": "Hardwood Floors"},
            {"name": "Fireplace"}
        ],
        "condition": "Good"
    },
    2: {
        "address": {
            "street": "456 Oak Ave",
            "city": "Somewhere",
            "state": "TX",
            "zipCode": "75001"
        },
        "propertyType": "townhouse",
        "bedrooms": 2,
        "bathrooms": 1.5,
        "squareFeet": 1500,
        "yearBuilt": 2005,
        "lotSize": 0.1,
        "features": [
            {"name": "Updated Kitchen"}
        ],
        "condition": "Excellent"
    }
}

@router.get("/value/{property_id}", response_model=ValuationResponse)
async def value_property(property_id: int = Path(..., description="The ID of the property to value")):
    """
    Get an AI-powered valuation for a property by its ID
    
    Args:
        property_id: The ID of the property
    
    Returns:
        ValuationResponse: Complete valuation data
    """
    logger.info(f"Received valuation request for property ID: {property_id}")
    
    # Get property details from our mock DB (in production, this would be a real database query)
    property_data = PROPERTY_DB.get(property_id)
    if not property_data:
        raise HTTPException(status_code=404, detail=f"Property with ID {property_id} not found")
    
    try:
        # Generate valuation report using our model
        valuation_report = valuation_model.generate_valuation_report(property_data)
        
        # Add timestamp
        valuation_report["timestamp"] = datetime.now().isoformat()
        
        return valuation_report
    except Exception as e:
        logger.error(f"Error generating valuation for property ID {property_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Valuation error: {str(e)}")

@router.post("/value", response_model=ValuationResponse)
async def value_property_by_details(property_details: PropertyDetails):
    """
    Get an AI-powered valuation based on provided property details
    
    Args:
        property_details: The details of the property
    
    Returns:
        ValuationResponse: Complete valuation data
    """
    logger.info(f"Received valuation request for property at {property_details.address.street}")
    
    try:
        # Convert pydantic model to dict
        property_data = property_details.dict()
        
        # Generate valuation report using our model
        valuation_report = valuation_model.generate_valuation_report(property_data)
        
        # Add timestamp
        valuation_report["timestamp"] = datetime.now().isoformat()
        
        return valuation_report
    except Exception as e:
        logger.error(f"Error generating valuation by details: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Valuation error: {str(e)}")