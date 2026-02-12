"""
Property Model Module

This module provides object models and database operations for property management.
It interfaces with Supabase for storage and retrieval of property data.
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any, Union

from supabase_client import get_supabase_client, release_supabase_client
from auth import is_authenticated, has_permission
from flask import session
from flask_login import current_user

def get_user_id():
    """Get the current user ID from session or Flask-Login"""
    # First try Flask-Login
    if hasattr(current_user, 'is_authenticated') and current_user.is_authenticated:
        return current_user.id
    
    # Fall back to session-based authentication
    if not is_authenticated():
        return None
    
    # Check if user info is in session
    if 'user' in session and 'id' in session['user']:
        return session['user']['id']
    
    # For development mode, return a default user ID
    return 1  # Development user ID

logger = logging.getLogger(__name__)

class Property:
    """Property model representing a real estate property"""
    
    def __init__(self, data: Dict[str, Any] = None):
        """
        Initialize a property object
        
        Args:
            data: Dictionary of property data, optional
        """
        self.id = None
        self.parcel_id = None
        self.account_number = None
        self.address = None
        self.city = None
        self.state = None
        self.zip_code = None
        self.property_class = None
        self.zoning = None
        self.legal_description = None
        self.land_area = None
        self.lot_size = None
        self.status = "active"
        self.owner_name = None
        self.owner_address = None
        self.owner_city = None
        self.owner_state = None
        self.owner_zip = None
        self.year_built = None
        self.living_area = None
        self.bedrooms = None
        self.bathrooms = None
        self.latitude = None
        self.longitude = None
        self.land_value = None
        self.improvement_value = None
        self.total_value = None
        self.last_sale_date = None
        self.last_sale_price = None
        self.last_sale_document = None
        self.created_by = None
        self.created_at = None
        self.updated_at = None
        
        if data:
            self.from_dict(data)
    
    def from_dict(self, data: Dict[str, Any]) -> 'Property':
        """
        Populate property attributes from a dictionary
        
        Args:
            data: Dictionary with property data
            
        Returns:
            Self for method chaining
        """
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        
        return self
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert property object to dictionary
        
        Returns:
            Dictionary representation of the property
        """
        return {
            "id": self.id,
            "parcel_id": self.parcel_id,
            "account_number": self.account_number,
            "address": self.address,
            "city": self.city,
            "state": self.state,
            "zip_code": self.zip_code,
            "property_class": self.property_class,
            "zoning": self.zoning,
            "legal_description": self.legal_description,
            "land_area": self.land_area,
            "lot_size": self.lot_size,
            "status": self.status,
            "owner_name": self.owner_name,
            "owner_address": self.owner_address,
            "owner_city": self.owner_city,
            "owner_state": self.owner_state,
            "owner_zip": self.owner_zip,
            "year_built": self.year_built,
            "living_area": self.living_area,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "land_value": self.land_value,
            "improvement_value": self.improvement_value,
            "total_value": self.total_value,
            "last_sale_date": self.last_sale_date,
            "last_sale_price": self.last_sale_price,
            "last_sale_document": self.last_sale_document,
            "created_by": self.created_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    def validate(self) -> List[str]:
        """
        Validate property data
        
        Returns:
            List of validation error messages, empty if valid
        """
        errors = []
        
        if not self.parcel_id:
            errors.append("Parcel ID is required")
        
        return errors


class PropertyAssessment:
    """Assessment model for property valuations"""
    
    def __init__(self, data: Dict[str, Any] = None):
        """
        Initialize a property assessment object
        
        Args:
            data: Dictionary of assessment data, optional
        """
        self.id = None
        self.property_id = None
        self.tax_year = None
        self.assessment_date = None
        self.land_value = None
        self.improvement_value = None
        self.total_value = None
        self.exemption_value = 0
        self.taxable_value = None
        self.assessment_type = "standard"
        self.assessment_status = "pending"
        self.notes = None
        self.created_by = None
        self.created_at = None
        self.updated_at = None
        
        if data:
            self.from_dict(data)
    
    def from_dict(self, data: Dict[str, Any]) -> 'PropertyAssessment':
        """
        Populate assessment attributes from a dictionary
        
        Args:
            data: Dictionary with assessment data
            
        Returns:
            Self for method chaining
        """
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        
        return self
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert assessment object to dictionary
        
        Returns:
            Dictionary representation of the assessment
        """
        return {
            "id": self.id,
            "property_id": self.property_id,
            "tax_year": self.tax_year,
            "assessment_date": self.assessment_date,
            "land_value": self.land_value,
            "improvement_value": self.improvement_value,
            "total_value": self.total_value,
            "exemption_value": self.exemption_value,
            "taxable_value": self.taxable_value,
            "assessment_type": self.assessment_type,
            "assessment_status": self.assessment_status,
            "notes": self.notes,
            "created_by": self.created_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        }
    
    def validate(self) -> List[str]:
        """
        Validate assessment data
        
        Returns:
            List of validation error messages, empty if valid
        """
        errors = []
        
        if not self.property_id:
            errors.append("Property ID is required")
        
        if not self.tax_year:
            errors.append("Tax year is required")
        
        if not self.assessment_date:
            errors.append("Assessment date is required")
        
        return errors


class PropertyFile:
    """File model for property documents and images"""
    
    def __init__(self, data: Dict[str, Any] = None):
        """
        Initialize a property file object
        
        Args:
            data: Dictionary of file data, optional
        """
        self.id = None
        self.property_id = None
        self.file_name = None
        self.file_size = None
        self.file_type = None
        self.file_category = "other"
        self.description = None
        self.public_url = None
        self.created_by = None
        self.created_at = None
        
        if data:
            self.from_dict(data)
    
    def from_dict(self, data: Dict[str, Any]) -> 'PropertyFile':
        """
        Populate file attributes from a dictionary
        
        Args:
            data: Dictionary with file data
            
        Returns:
            Self for method chaining
        """
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        
        return self
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert file object to dictionary
        
        Returns:
            Dictionary representation of the file
        """
        return {
            "id": self.id,
            "property_id": self.property_id,
            "file_name": self.file_name,
            "file_size": self.file_size,
            "file_type": self.file_type,
            "file_category": self.file_category,
            "description": self.description,
            "public_url": self.public_url,
            "created_by": self.created_by,
            "created_at": self.created_at
        }
    
    def validate(self) -> List[str]:
        """
        Validate file data
        
        Returns:
            List of validation error messages, empty if valid
        """
        errors = []
        
        if not self.property_id:
            errors.append("Property ID is required")
        
        if not self.file_name:
            errors.append("File name is required")
        
        return errors


# Database Operations for Properties

def get_property(property_id: str) -> Optional[Property]:
    """
    Get a property by ID
    
    Args:
        property_id: UUID of property to retrieve
        
    Returns:
        Property object or None if not found
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to get property")
            return None
        
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return None
        
        # Try to find in property schema first (newer system)
        response = supabase.table("property.properties").select("*").eq("id", property_id).execute()
        
        if response.data and len(response.data) > 0:
            return Property(response.data[0])
        
        # Fallback to public schema (legacy system)
        response = supabase.table("properties").select("*").eq("id", property_id).execute()
        
        if response.data and len(response.data) > 0:
            return Property(response.data[0])
        
        logger.warning(f"Property not found with ID: {property_id}")
        return None
    
    except Exception as e:
        logger.error(f"Error retrieving property: {str(e)}")
        return None
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)


def get_properties(filters: Dict[str, Any] = None, page: int = 1, per_page: int = 20) -> Dict[str, Any]:
    """
    Get properties with optional filtering and pagination
    
    Args:
        filters: Dictionary of filter parameters
        page: Page number for pagination
        per_page: Number of items per page
        
    Returns:
        Dictionary with properties list, pagination info, and success status
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to list properties")
            return {"success": False, "error": "Not authenticated", "data": [], "total": 0, "page": page, "per_page": per_page}
        
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return {"success": False, "error": "Database connection error", "data": [], "total": 0, "page": page, "per_page": per_page}
            
        query = supabase.table("property.properties").select("*", count="exact")
        
        # Apply filters if provided
        if filters:
            for key, value in filters.items():
                if key.endswith("_like") and value:
                    field = key.replace("_like", "")
                    query = query.ilike(field, f"%{value}%")
                elif key.endswith("_gte") and value:
                    field = key.replace("_gte", "")
                    query = query.gte(field, value)
                elif key.endswith("_lte") and value:
                    field = key.replace("_lte", "")
                    query = query.lte(field, value)
                elif value:
                    query = query.eq(key, value)
        
        # Calculate pagination
        start = (page - 1) * per_page
        end = start + per_page - 1
        
        response = query.order("created_at", desc=True).range(start, end).execute()
        
        properties = [Property(p) for p in response.data]
        total_count = response.count if response.count is not None else len(properties)
        
        return {
            "success": True,
            "data": properties,
            "total": total_count,
            "page": page,
            "per_page": per_page
        }
    
    except Exception as e:
        logger.error(f"Error listing properties: {str(e)}")
        return {"success": False, "error": str(e), "data": [], "total": 0, "page": page, "per_page": per_page}
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)


def create_property(property_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new property
    
    Args:
        property_data: Dictionary of property data
        
    Returns:
        Dictionary with created property and success status
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to create property")
            return {"success": False, "error": "Not authenticated"}
        
        if not has_permission("property.create"):
            logger.warning("User lacks permission to create property")
            return {"success": False, "error": "Permission denied"}
        
        user_id = get_user_id()
        
        property_obj = Property(property_data)
        property_obj.created_by = user_id
        
        # Validate property data
        errors = property_obj.validate()
        if errors:
            return {"success": False, "error": ", ".join(errors)}
        
        # Convert to dictionary for insert
        data = property_obj.to_dict()
        
        # Remove None values and id (will be generated)
        data = {k: v for k, v in data.items() if v is not None and k != "id"}
        
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return {"success": False, "error": "Database connection error"}
            
        response = supabase.table("property.properties").insert(data).execute()
        
        if response.data and len(response.data) > 0:
            return {"success": True, "data": Property(response.data[0])}
        else:
            return {"success": False, "error": "Failed to create property"}
    
    except Exception as e:
        logger.error(f"Error creating property: {str(e)}")
        return {"success": False, "error": str(e)}
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)


def update_property(property_id: str, property_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an existing property
    
    Args:
        property_id: UUID of property to update
        property_data: Dictionary of property data
        
    Returns:
        Dictionary with updated property and success status
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to update property")
            return {"success": False, "error": "Not authenticated"}
        
        if not has_permission("property.edit"):
            logger.warning("User lacks permission to edit property")
            return {"success": False, "error": "Permission denied"}
        
        # Get existing property
        existing = get_property(property_id)
        if not existing:
            return {"success": False, "error": "Property not found"}
        
        # Update property with new data
        property_obj = Property(existing.to_dict())
        property_obj.from_dict(property_data)
        
        # Validate property data
        errors = property_obj.validate()
        if errors:
            return {"success": False, "error": ", ".join(errors)}
        
        # Convert to dictionary for update
        data = property_obj.to_dict()
        
        # Remove None values, id, created_by, and created_at
        data = {k: v for k, v in data.items() if v is not None and k not in ["id", "created_by", "created_at"]}
        
        # Set updated_at timestamp
        data["updated_at"] = datetime.now().isoformat()
        
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return {"success": False, "error": "Database connection error"}
            
        response = supabase.table("property.properties").update(data).eq("id", property_id).execute()
        
        if response.data and len(response.data) > 0:
            return {"success": True, "data": Property(response.data[0])}
        else:
            return {"success": False, "error": "Failed to update property"}
    
    except Exception as e:
        logger.error(f"Error updating property: {str(e)}")
        return {"success": False, "error": str(e)}
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)


def delete_property(property_id: str) -> Dict[str, bool]:
    """
    Delete a property
    
    Args:
        property_id: UUID of property to delete
        
    Returns:
        Dictionary with success status
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to delete property")
            return {"success": False, "error": "Not authenticated"}
        
        if not has_permission("property.delete"):
            logger.warning("User lacks permission to delete property")
            return {"success": False, "error": "Permission denied"}
        
        # Get existing property
        existing = get_property(property_id)
        if not existing:
            return {"success": False, "error": "Property not found"}
        
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return {"success": False, "error": "Database connection error"}
        
        # Delete property
        response = supabase.table("property.properties").delete().eq("id", property_id).execute()
        
        if response.data is not None:
            return {"success": True}
        else:
            return {"success": False, "error": "Failed to delete property"}
    
    except Exception as e:
        logger.error(f"Error deleting property: {str(e)}")
        return {"success": False, "error": str(e)}
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)


# Database Operations for Assessments

def get_property_assessments(property_id: str) -> List[PropertyAssessment]:
    """
    Get all assessments for a property
    
    Args:
        property_id: UUID of property
        
    Returns:
        List of PropertyAssessment objects
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to get assessments")
            return []
        
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return []
            
        response = supabase.table("property.property_assessments") \
            .select("*") \
            .eq("property_id", property_id) \
            .order("tax_year", desc=True) \
            .execute()
        
        if response.data:
            return [PropertyAssessment(a) for a in response.data]
        
        return []
    
    except Exception as e:
        logger.error(f"Error retrieving property assessments: {str(e)}")
        return []
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)


def get_assessment(assessment_id: str) -> Optional[PropertyAssessment]:
    """
    Get an assessment by ID
    
    Args:
        assessment_id: UUID of assessment to retrieve
        
    Returns:
        PropertyAssessment object or None if not found
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to get assessment")
            return None
        
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return None
            
        response = supabase.table("property.property_assessments") \
            .select("*") \
            .eq("id", assessment_id) \
            .execute()
        
        if response.data and len(response.data) > 0:
            return PropertyAssessment(response.data[0])
        
        logger.warning(f"Assessment not found with ID: {assessment_id}")
        return None
    
    except Exception as e:
        logger.error(f"Error retrieving assessment: {str(e)}")
        return None
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)


def create_assessment(assessment_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new property assessment
    
    Args:
        assessment_data: Dictionary of assessment data
        
    Returns:
        Dictionary with created assessment and success status
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to create assessment")
            return {"success": False, "error": "Not authenticated"}
        
        if not has_permission("property.assessment.create"):
            logger.warning("User lacks permission to create assessment")
            return {"success": False, "error": "Permission denied"}
        
        user_id = get_user_id()
        
        assessment_obj = PropertyAssessment(assessment_data)
        assessment_obj.created_by = user_id
        
        # Set calculated fields
        if assessment_obj.land_value is not None and assessment_obj.improvement_value is not None:
            assessment_obj.total_value = float(assessment_obj.land_value) + float(assessment_obj.improvement_value)
        
        if assessment_obj.total_value is not None and assessment_obj.exemption_value is not None:
            assessment_obj.taxable_value = max(0, float(assessment_obj.total_value) - float(assessment_obj.exemption_value))
        
        # Validate assessment data
        errors = assessment_obj.validate()
        if errors:
            return {"success": False, "error": ", ".join(errors)}
        
        # Convert to dictionary for insert
        data = assessment_obj.to_dict()
        
        # Remove None values and id (will be generated)
        data = {k: v for k, v in data.items() if v is not None and k != "id"}
        
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return {"success": False, "error": "Database connection error"}
            
        response = supabase.table("property.property_assessments").insert(data).execute()
        
        if response.data and len(response.data) > 0:
            return {"success": True, "data": PropertyAssessment(response.data[0])}
        else:
            return {"success": False, "error": "Failed to create assessment"}
    
    except Exception as e:
        logger.error(f"Error creating assessment: {str(e)}")
        return {"success": False, "error": str(e)}
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)


def update_assessment(assessment_id: str, assessment_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update an existing property assessment
    
    Args:
        assessment_id: UUID of assessment to update
        assessment_data: Dictionary of assessment data
        
    Returns:
        Dictionary with updated assessment and success status
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to update assessment")
            return {"success": False, "error": "Not authenticated"}
        
        if not has_permission("property.assessment.edit"):
            logger.warning("User lacks permission to edit assessment")
            return {"success": False, "error": "Permission denied"}
        
        # Get existing assessment
        existing = get_assessment(assessment_id)
        if not existing:
            return {"success": False, "error": "Assessment not found"}
        
        # Update assessment with new data
        assessment_obj = PropertyAssessment(existing.to_dict())
        assessment_obj.from_dict(assessment_data)
        
        # Set calculated fields
        if assessment_obj.land_value is not None and assessment_obj.improvement_value is not None:
            assessment_obj.total_value = float(assessment_obj.land_value) + float(assessment_obj.improvement_value)
        
        if assessment_obj.total_value is not None and assessment_obj.exemption_value is not None:
            assessment_obj.taxable_value = max(0, float(assessment_obj.total_value) - float(assessment_obj.exemption_value))
        
        # Validate assessment data
        errors = assessment_obj.validate()
        if errors:
            return {"success": False, "error": ", ".join(errors)}
        
        # Convert to dictionary for update
        data = assessment_obj.to_dict()
        
        # Remove None values, id, created_by, and created_at
        data = {k: v for k, v in data.items() if v is not None and k not in ["id", "created_by", "created_at"]}
        
        # Set updated_at timestamp
        data["updated_at"] = datetime.now().isoformat()
        
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return {"success": False, "error": "Database connection error"}
            
        response = supabase.table("property.property_assessments").update(data).eq("id", assessment_id).execute()
        
        if response.data and len(response.data) > 0:
            return {"success": True, "data": PropertyAssessment(response.data[0])}
        else:
            return {"success": False, "error": "Failed to update assessment"}
    
    except Exception as e:
        logger.error(f"Error updating assessment: {str(e)}")
        return {"success": False, "error": str(e)}
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)


def delete_assessment(assessment_id: str) -> Dict[str, bool]:
    """
    Delete a property assessment
    
    Args:
        assessment_id: UUID of assessment to delete
        
    Returns:
        Dictionary with success status
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to delete assessment")
            return {"success": False, "error": "Not authenticated"}
        
        if not has_permission("property.assessment.delete"):
            logger.warning("User lacks permission to delete assessment")
            return {"success": False, "error": "Permission denied"}
        
        # Get existing assessment
        existing = get_assessment(assessment_id)
        if not existing:
            return {"success": False, "error": "Assessment not found"}
        
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return {"success": False, "error": "Database connection error"}
            
        # Delete assessment
        response = supabase.table("property.property_assessments").delete().eq("id", assessment_id).execute()
        
        if response.data is not None:
            return {"success": True}
        else:
            return {"success": False, "error": "Failed to delete assessment"}
    
    except Exception as e:
        logger.error(f"Error deleting assessment: {str(e)}")
        return {"success": False, "error": str(e)}
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)


# Database Operations for Property Files

def get_property_files(property_id: str) -> List[PropertyFile]:
    """
    Get all files for a property
    
    Args:
        property_id: UUID of property
        
    Returns:
        List of PropertyFile objects
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to get files")
            return []
        
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return []
            
        response = supabase.table("property.property_files") \
            .select("*") \
            .eq("property_id", property_id) \
            .order("created_at", desc=True) \
            .execute()
        
        if response.data:
            return [PropertyFile(f) for f in response.data]
        
        return []
    
    except Exception as e:
        logger.error(f"Error retrieving property files: {str(e)}")
        return []
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)


def get_file(file_id: str) -> Optional[PropertyFile]:
    """
    Get a file by ID
    
    Args:
        file_id: UUID of file to retrieve
        
    Returns:
        PropertyFile object or None if not found
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to get file")
            return None
        
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return None
            
        response = supabase.table("property.property_files") \
            .select("*") \
            .eq("id", file_id) \
            .execute()
        
        if response.data and len(response.data) > 0:
            return PropertyFile(response.data[0])
        
        logger.warning(f"File not found with ID: {file_id}")
        return None
    
    except Exception as e:
        logger.error(f"Error retrieving file: {str(e)}")
        return None
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)


def create_property_file(file_data: Dict[str, Any], file_content: Any) -> Dict[str, Any]:
    """
    Create a new property file and upload content
    
    Args:
        file_data: Dictionary of file metadata
        file_content: Actual file content
        
    Returns:
        Dictionary with created file and success status
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to create file")
            return {"success": False, "error": "Not authenticated"}
        
        if not has_permission("property.file.upload"):
            logger.warning("User lacks permission to upload file")
            return {"success": False, "error": "Permission denied"}
        
        user_id = get_user_id()
        
        # Initialize file object
        file_obj = PropertyFile(file_data)
        file_obj.created_by = user_id
        
        # Validate file data
        errors = file_obj.validate()
        if errors:
            return {"success": False, "error": ", ".join(errors)}
        
        # Generate a unique filename
        original_name = file_data.get("file_name", "file")
        file_extension = original_name.split(".")[-1] if "." in original_name else ""
        storage_path = f"property_files/{file_obj.property_id}/{str(uuid.uuid4())}"
        
        if file_extension:
            storage_path += f".{file_extension}"
        
        # Upload file to storage
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return {"success": False, "error": "Database connection error"}
            
        storage_response = supabase.storage.from_("property-files").upload(
            storage_path, 
            file_content,
            file_options={
                "content-type": file_data.get("file_type", "application/octet-stream")
            }
        )
        
        if not storage_response:
            return {"success": False, "error": "Failed to upload file to storage"}
        
        # Get public URL
        public_url = supabase.storage.from_("property-files").get_public_url(storage_path)
        
        # Save file metadata to database
        file_obj.public_url = public_url
        
        # Convert to dictionary for insert
        data = file_obj.to_dict()
        
        # Remove None values and id (will be generated)
        data = {k: v for k, v in data.items() if v is not None and k != "id"}
        
        db_response = supabase.table("property.property_files").insert(data).execute()
        
        if db_response.data and len(db_response.data) > 0:
            return {"success": True, "data": PropertyFile(db_response.data[0])}
        else:
            return {"success": False, "error": "Failed to save file metadata"}
    
    except Exception as e:
        logger.error(f"Error creating property file: {str(e)}")
        return {"success": False, "error": str(e)}
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)


def delete_property_file(file_id: str) -> Dict[str, bool]:
    """
    Delete a property file
    
    Args:
        file_id: UUID of file to delete
        
    Returns:
        Dictionary with success status
    """
    supabase = None
    try:
        if not is_authenticated():
            logger.warning("User not authenticated to delete file")
            return {"success": False, "error": "Not authenticated"}
        
        if not has_permission("property.file.delete"):
            logger.warning("User lacks permission to delete file")
            return {"success": False, "error": "Permission denied"}
        
        # Get existing file
        existing = get_file(file_id)
        if not existing:
            return {"success": False, "error": "File not found"}
        
        supabase = get_supabase_client()
        if not supabase:
            logger.error("Could not get Supabase client")
            return {"success": False, "error": "Database connection error"}
            
        # Extract storage path from URL
        if existing.public_url:
            storage_path = existing.public_url.split("/")[-1]
            
            # Delete from storage
            try:
                supabase.storage.from_("property-files").remove([storage_path])
            except Exception as storage_error:
                logger.warning(f"Error deleting file from storage: {str(storage_error)}")
        
        # Delete from database
        response = supabase.table("property.property_files").delete().eq("id", file_id).execute()
        
        if response.data is not None:
            return {"success": True}
        else:
            return {"success": False, "error": "Failed to delete file"}
    
    except Exception as e:
        logger.error(f"Error deleting property file: {str(e)}")
        return {"success": False, "error": str(e)}
    finally:
        # Release the client
        if supabase:
            # Using our centralized release function
            release_supabase_client(supabase)