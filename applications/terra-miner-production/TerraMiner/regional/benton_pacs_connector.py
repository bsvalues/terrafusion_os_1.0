"""
Benton County PACS Database Connector

This module provides functionality to connect to the Benton County PACS (Property Assessment and Collection System)
database to retrieve authentic property assessment data following IAAO and USPAP standards.
"""

import os
import logging
import pyodbc
from datetime import datetime
from typing import Dict, Any, List, Optional

# Configure logging
logger = logging.getLogger(__name__)

# PACS Database connection parameters
PACS_SERVER = os.environ.get('PACS_SERVER', 'jcharrispacs')
PACS_DATABASE = os.environ.get('PACS_DATABASE', 'pacs_training')
PACS_USE_INTEGRATED_SECURITY = True

def get_pacs_connection():
    """
    Establish a connection to the Benton County PACS database using integrated Windows authentication.
    
    Returns:
        Connection object to the PACS database or None if connection fails
    """
    try:
        conn_str = (
            'DRIVER={ODBC Driver 17 for SQL Server};'
            f'SERVER={PACS_SERVER};'
            f'DATABASE={PACS_DATABASE};'
            'Trusted_Connection=yes;'
        )
        
        logger.info(f"Connecting to PACS database {PACS_SERVER}/{PACS_DATABASE}")
        connection = pyodbc.connect(conn_str)
        return connection
    except Exception as e:
        logger.error(f"Failed to connect to PACS database: {str(e)}")
        return None

def get_property_assessment_data(property_id: str) -> Dict[str, Any]:
    """
    Retrieve property assessment data from the Benton County PACS database.
    
    This function follows IAAO and USPAP standards for property assessment data.
    
    Args:
        property_id: The parcel ID of the property to retrieve data for
        
    Returns:
        Property assessment data in the standard TerraMiner format
    """
    logger.info(f"Retrieving Benton County property assessment data for parcel {property_id}")
    
    conn = get_pacs_connection()
    if not conn:
        logger.error("Cannot retrieve property data - PACS database connection failed")
        return {
            "error": "DATABASE_CONNECTION_FAILED",
            "property_id": property_id,
            "county": "benton",
            "message": "Could not connect to the Benton County PACS database"
        }
    
    try:
        # Create a cursor from the connection
        cursor = conn.cursor()
        
        # Get property record data
        property_record = get_property_record(cursor, property_id)
        if not property_record:
            conn.close()
            return {
                "error": "PROPERTY_NOT_FOUND",
                "property_id": property_id,
                "county": "benton",
                "message": f"Property with ID {property_id} not found in Benton County PACS database"
            }
        
        # Get building data
        building_data = get_building_data(cursor, property_id)
        
        # Get land data
        land_data = get_land_data(cursor, property_id)
        
        # Get assessment history
        assessment_history = get_assessment_history(cursor, property_id)
        
        # Close the connection
        conn.close()
        
        # Return the assessment data in the standard format
        return {
            "using_real_data": True,
            "data_source": "Benton County PACS Database",
            "PropertyRecord": property_record,
            "BuildingData": building_data,
            "LandData": land_data,
            "AssessmentHistory": assessment_history
        }
        
    except Exception as e:
        logger.error(f"Error retrieving property data from PACS: {str(e)}")
        if conn:
            conn.close()
        
        return {
            "error": "DATA_RETRIEVAL_ERROR",
            "property_id": property_id,
            "county": "benton",
            "message": f"Error retrieving property data: {str(e)}"
        }

def get_property_record(cursor, property_id: str) -> Dict[str, Any]:
    """
    Retrieve property record information from PACS database.
    
    Args:
        cursor: Database cursor
        property_id: Parcel ID to retrieve
        
    Returns:
        Property record data or None if not found
    """
    try:
        # SQL query for property record
        # Adjust the table and column names based on the actual PACS database schema
        cursor.execute("""
            SELECT 
                ParcelId, 
                ParcelNumber, 
                SitusAddress, 
                OwnerName, 
                LegalDescription, 
                PropertyClass, 
                TaxArea, 
                LandValue, 
                ImprovementValue, 
                MarketValue, 
                AssessedValue, 
                ExemptionValue, 
                LevyCode, 
                TaxStatus, 
                Acres, 
                LastSaleDate, 
                LastSalePrice, 
                AssessmentYear, 
                TaxYear
            FROM Property 
            WHERE ParcelId = ?
        """, property_id)
        
        row = cursor.fetchone()
        if not row:
            return None
        
        # Map database values to property record dictionary
        # Adjust column indices based on the actual query results
        current_year = datetime.now().year
        return {
            "ParcelID": row[0] or property_id,
            "ParcelNumber": row[1] or property_id,
            "SitusAddress": row[2] or "",
            "OwnerName": row[3] or "Current Owner",
            "LegalDescription": row[4] or "",
            "PropertyClass": row[5] or "Residential",
            "TaxArea": row[6] or "",
            "LandValue": row[7] or 0,
            "ImprovementValue": row[8] or 0,
            "MarketValue": row[9] or 0,
            "AssessedValue": row[10] or 0,
            "ExemptionValue": row[11] or 0,
            "LevyCode": row[12] or "",
            "TaxStatus": row[13] or "Taxable",
            "Acres": row[14] or 0,
            "LastSaleDate": row[15] or "",
            "LastSalePrice": row[16] or 0,
            "AssessmentYear": row[17] or current_year,
            "TaxYear": row[18] or current_year
        }
    except Exception as e:
        logger.error(f"Error in get_property_record: {str(e)}")
        return {}

def get_building_data(cursor, property_id: str) -> Dict[str, Any]:
    """
    Retrieve building information from PACS database.
    
    Args:
        cursor: Database cursor
        property_id: Parcel ID to retrieve
        
    Returns:
        Building data
    """
    try:
        # SQL query for building information
        # Adjust the table and column names based on the actual PACS database schema
        cursor.execute("""
            SELECT 
                YearBuilt, 
                EffectiveYear,
                SquareFeet, 
                Quality, 
                Condition, 
                Bedrooms, 
                Bathrooms, 
                Foundation, 
                ExteriorWalls, 
                RoofType, 
                HeatingCooling, 
                Fireplaces, 
                BasementSF, 
                GarageType, 
                GarageSF, 
                Stories
            FROM Building 
            WHERE ParcelId = ?
        """, property_id)
        
        row = cursor.fetchone()
        if not row:
            # Return empty building data if not found
            return {
                "YearBuilt": 0,
                "EffectiveYear": 0,
                "SquareFeet": 0,
                "Quality": "",
                "Condition": "",
                "Bedrooms": 0,
                "Bathrooms": 0,
                "Foundation": "",
                "ExteriorWalls": "",
                "RoofType": "",
                "HeatingCooling": "",
                "Fireplaces": 0,
                "BasementSF": 0,
                "GarageType": "",
                "GarageSF": 0,
                "Stories": 0
            }
        
        # Map database values to building data dictionary
        # Adjust column indices based on the actual query results
        return {
            "YearBuilt": row[0] or 0,
            "EffectiveYear": row[1] or 0,
            "SquareFeet": row[2] or 0,
            "Quality": row[3] or "",
            "Condition": row[4] or "",
            "Bedrooms": row[5] or 0,
            "Bathrooms": row[6] or 0,
            "Foundation": row[7] or "",
            "ExteriorWalls": row[8] or "",
            "RoofType": row[9] or "",
            "HeatingCooling": row[10] or "",
            "Fireplaces": row[11] or 0,
            "BasementSF": row[12] or 0,
            "GarageType": row[13] or "",
            "GarageSF": row[14] or 0,
            "Stories": row[15] or 0
        }
    except Exception as e:
        logger.error(f"Error in get_building_data: {str(e)}")
        return {}

def get_land_data(cursor, property_id: str) -> Dict[str, Any]:
    """
    Retrieve land information from PACS database.
    
    Args:
        cursor: Database cursor
        property_id: Parcel ID to retrieve
        
    Returns:
        Land data
    """
    try:
        # SQL query for land information
        # Adjust the table and column names based on the actual PACS database schema
        cursor.execute("""
            SELECT 
                LandType, 
                Topography, 
                Utilities, 
                ViewQuality
            FROM Land 
            WHERE ParcelId = ?
        """, property_id)
        
        row = cursor.fetchone()
        if not row:
            # Return empty land data if not found
            return {
                "LandType": "",
                "Topography": "",
                "Utilities": "",
                "ViewQuality": ""
            }
        
        # Map database values to land data dictionary
        # Adjust column indices based on the actual query results
        return {
            "LandType": row[0] or "",
            "Topography": row[1] or "",
            "Utilities": row[2] or "",
            "ViewQuality": row[3] or ""
        }
    except Exception as e:
        logger.error(f"Error in get_land_data: {str(e)}")
        return {}

def get_assessment_history(cursor, property_id: str) -> List[Dict[str, Any]]:
    """
    Retrieve assessment history from PACS database.
    
    Args:
        cursor: Database cursor
        property_id: Parcel ID to retrieve
        
    Returns:
        Assessment history as a list of yearly assessments
    """
    try:
        # SQL query for assessment history
        # Adjust the table and column names based on the actual PACS database schema
        cursor.execute("""
            SELECT 
                Year, 
                LandValue, 
                ImprovementValue, 
                TotalValue, 
                Change
            FROM AssessmentHistory 
            WHERE ParcelId = ?
            ORDER BY Year DESC
        """, property_id)
        
        rows = cursor.fetchall()
        if not rows:
            # Return empty assessment history if not found
            return []
        
        # Map database values to assessment history list
        history = []
        for row in rows:
            history.append({
                "Year": row[0] or 0,
                "LandValue": row[1] or 0,
                "ImprovementValue": row[2] or 0,
                "TotalValue": row[3] or 0,
                "Change": row[4] or 0
            })
        
        return history
    except Exception as e:
        logger.error(f"Error in get_assessment_history: {str(e)}")
        return []