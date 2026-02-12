"""
Report Templates Module

This module provides functionality for managing report templates, including
creating, updating, and retrieving templates from storage.
"""

import os
import json
import uuid
import logging
import datetime
from typing import Dict, Any, List, Optional

# Set up logging
logger = logging.getLogger(__name__)

# Define template types
TEMPLATE_TYPES = [
    "property_assessment",
    "geospatial_analysis",
    "anomaly_report",
    "custom"
]

# Template storage directory
TEMPLATE_DIR = os.path.join(os.path.dirname(__file__), "templates")

# Ensure template directory exists
os.makedirs(TEMPLATE_DIR, exist_ok=True)

# Load templates
def load_templates() -> Dict[str, Dict[str, Any]]:
    """
    Load all templates from storage.
    
    Returns:
        Dict mapping template IDs to template data
    """
    templates = {}
    
    # Get all template files
    for filename in os.listdir(TEMPLATE_DIR):
        if filename.endswith(".json"):
            template_id = filename.replace(".json", "")
            template_path = os.path.join(TEMPLATE_DIR, filename)
            
            try:
                with open(template_path, 'r') as f:
                    template_data = json.load(f)
                    templates[template_id] = template_data
            except Exception as e:
                logger.error(f"Failed to load template {template_id}: {str(e)}")
    
    logger.info(f"Loaded {len(templates)} templates")
    return templates

# Dictionary to store templates (template_id -> template data)
_templates = load_templates()

# Template validation
def validate_template(template: Dict[str, Any]) -> bool:
    """
    Validate a template.
    
    Args:
        template: Template data
        
    Returns:
        True if valid, False otherwise
    """
    # Check required fields
    if not template.get("name"):
        return False
    
    if template.get("template_type") not in TEMPLATE_TYPES:
        return False
    
    # Validate sections if present
    sections = template.get("sections", [])
    if not isinstance(sections, list):
        return False
    
    return True

# Create a template
def create_template(
    name: str,
    description: str = "",
    template_type: str = "custom",
    sections: List[Dict[str, Any]] = None,
    metadata: Dict[str, Any] = None
) -> str:
    """
    Create a new template.
    
    Args:
        name: Template name
        description: Template description
        template_type: Template type
        sections: List of template sections
        metadata: Template metadata
        
    Returns:
        Template ID
    """
    # Generate a unique ID
    template_id = str(uuid.uuid4())
    
    # Create template data
    template = {
        "template_id": template_id,
        "name": name,
        "description": description,
        "template_type": template_type,
        "sections": sections or [],
        "metadata": metadata or {},
    }
    
    # Validate template
    if not validate_template(template):
        raise ValueError("Invalid template data")
    
    # Save template
    _save_template(template_id, template)
    
    # Add to in-memory store
    _templates[template_id] = template
    
    return template_id

# Update a template
def update_template(
    template_id: str,
    name: str = None,
    description: str = None,
    template_type: str = None,
    sections: List[Dict[str, Any]] = None,
    metadata: Dict[str, Any] = None
) -> bool:
    """
    Update an existing template.
    
    Args:
        template_id: Template ID
        name: New template name
        description: New template description
        template_type: New template type
        sections: New template sections
        metadata: New template metadata
        
    Returns:
        True if successful, False otherwise
    """
    # Get existing template
    template = get_template(template_id)
    if not template:
        return False
    
    # Update fields
    if name is not None:
        template["name"] = name
    
    if description is not None:
        template["description"] = description
    
    if template_type is not None:
        template["template_type"] = template_type
    
    if sections is not None:
        template["sections"] = sections
    
    if metadata is not None:
        template["metadata"] = metadata
    
    # Validate template
    if not validate_template(template):
        return False
    
    # Save template
    _save_template(template_id, template)
    
    # Update in-memory store
    _templates[template_id] = template
    
    return True

# Delete a template
def delete_template(template_id: str) -> bool:
    """
    Delete a template.
    
    Args:
        template_id: Template ID
        
    Returns:
        True if successful, False otherwise
    """
    # Check if template exists
    if template_id not in _templates:
        return False
    
    # Delete template file
    template_path = os.path.join(TEMPLATE_DIR, f"{template_id}.json")
    if os.path.exists(template_path):
        try:
            os.remove(template_path)
        except Exception as e:
            logger.error(f"Failed to delete template file {template_id}: {str(e)}")
            return False
    
    # Remove from in-memory store
    del _templates[template_id]
    
    return True

# Clone a template
def clone_template(template_id: str, new_name: str) -> Optional[str]:
    """
    Clone a template.
    
    Args:
        template_id: Template ID to clone
        new_name: Name for the new template
        
    Returns:
        New template ID if successful, None otherwise
    """
    # Get existing template
    template = get_template(template_id)
    if not template:
        return None
    
    # Create a new template based on the existing one
    new_template = template.copy()
    new_template["name"] = new_name
    
    # Update metadata
    metadata = new_template.get("metadata", {}).copy()
    metadata["created_at"] = datetime.datetime.utcnow().isoformat()
    metadata["modified_at"] = datetime.datetime.utcnow().isoformat()
    metadata["cloned_from"] = template_id
    
    new_template["metadata"] = metadata
    
    # Create the new template
    return create_template(
        name=new_name,
        description=new_template.get("description", ""),
        template_type=new_template.get("template_type", "custom"),
        sections=new_template.get("sections", []),
        metadata=metadata
    )

# Get a template
def get_template(template_id: str) -> Optional[Dict[str, Any]]:
    """
    Get a template by ID.
    
    Args:
        template_id: Template ID
        
    Returns:
        Template data if found, None otherwise
    """
    return _templates.get(template_id)

# Get all templates
def get_templates(template_type: str = None, limit: int = None) -> List[Dict[str, Any]]:
    """
    Get all templates, optionally filtered by type.
    
    Args:
        template_type: Filter by template type
        limit: Maximum number of templates to return
        
    Returns:
        List of templates
    """
    templates = list(_templates.values())
    
    # Filter by type if specified
    if template_type:
        templates = [t for t in templates if t.get("template_type") == template_type]
    
    # Sort by creation date (newest first)
    templates.sort(key=lambda t: t.get("metadata", {}).get("created_at", ""), reverse=True)
    
    # Apply limit if specified
    if limit is not None:
        templates = templates[:limit]
    
    return templates

# Get templates by name
def search_templates(query: str) -> List[Dict[str, Any]]:
    """
    Search templates by name or description.
    
    Args:
        query: Search query
        
    Returns:
        List of matching templates
    """
    if not query:
        return []
    
    query = query.lower()
    results = []
    
    for template in _templates.values():
        name = template.get("name", "").lower()
        description = template.get("description", "").lower()
        
        if query in name or query in description:
            results.append(template)
    
    return results

# Helper function to save a template to disk
def _save_template(template_id: str, template: Dict[str, Any]) -> bool:
    """
    Save a template to disk.
    
    Args:
        template_id: Template ID
        template: Template data
        
    Returns:
        True if successful, False otherwise
    """
    try:
        template_path = os.path.join(TEMPLATE_DIR, f"{template_id}.json")
        with open(template_path, 'w') as f:
            json.dump(template, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Failed to save template {template_id}: {str(e)}")
        return False

# Create default templates if none exist
def create_default_templates() -> None:
    """
    Create default templates if none exist.
    """
    if not _templates:
        logger.info("Creating default templates")
        
        # Property Assessment Template
        create_template(
            name="Standard Property Assessment",
            description="A comprehensive property assessment report template",
            template_type="property_assessment",
            sections=[
                {
                    "section_type": "header",
                    "title": "Property Assessment Report",
                    "content": {
                        "subtitle": "Comprehensive Property Valuation"
                    }
                },
                {
                    "section_type": "property_info",
                    "title": "Property Information",
                    "content": {
                        "fields": [
                            "property_id", "address", "parcel_number", "legal_description",
                            "property_type", "zoning", "year_built", "lot_size", "building_size"
                        ]
                    }
                },
                {
                    "section_type": "valuation",
                    "title": "Valuation Summary",
                    "content": {
                        "fields": [
                            "assessed_value", "market_value", "land_value", "improvement_value",
                            "previous_assessed_value", "value_change_percent"
                        ]
                    }
                },
                {
                    "section_type": "map",
                    "title": "Property Location",
                    "content": {
                        "map_type": "property_location",
                        "zoom_level": 15
                    }
                },
                {
                    "section_type": "comparable_properties",
                    "title": "Comparable Properties",
                    "content": {
                        "fields": [
                            "property_id", "address", "property_type", "year_built",
                            "lot_size", "building_size", "assessed_value", "sale_date", "sale_price"
                        ],
                        "max_properties": 5
                    }
                },
                {
                    "section_type": "footer",
                    "title": "Footer",
                    "content": {
                        "text": "Assessment data provided by Benton County Assessor's Office"
                    }
                }
            ],
            metadata={
                "created_at": datetime.datetime.utcnow().isoformat(),
                "modified_at": datetime.datetime.utcnow().isoformat(),
                "created_by": "system",
                "version": "1.0",
                "tags": ["property", "assessment", "standard"]
            }
        )
        
        # Geospatial Analysis Template
        create_template(
            name="Geospatial Value Analysis",
            description="A geospatial analysis of property values in an area",
            template_type="geospatial_analysis",
            sections=[
                {
                    "section_type": "header",
                    "title": "Geospatial Value Analysis",
                    "content": {
                        "subtitle": "Property Value Distribution by Location"
                    }
                },
                {
                    "section_type": "text",
                    "title": "Analysis Overview",
                    "content": {
                        "text": "This report provides a geospatial analysis of property values in the selected area. It examines the distribution of assessed values, market values, and value trends based on location and property characteristics."
                    }
                },
                {
                    "section_type": "map",
                    "title": "Value Distribution Map",
                    "content": {
                        "map_type": "choropleth",
                        "value_field": "assessed_value",
                        "color_scheme": "blues"
                    }
                },
                {
                    "section_type": "chart",
                    "title": "Value Distribution by Zone",
                    "content": {
                        "chart_type": "bar",
                        "data_key": "zone_values",
                        "x_field": "zone",
                        "y_field": "average_value"
                    }
                },
                {
                    "section_type": "table",
                    "title": "Area Value Summary",
                    "content": {
                        "data_key": "area_summary",
                        "columns": [
                            "area_name", "property_count", "min_value", "max_value", 
                            "average_value", "median_value", "total_value"
                        ]
                    }
                },
                {
                    "section_type": "footer",
                    "title": "Footer",
                    "content": {
                        "text": "Analysis based on Benton County Assessor's Office data"
                    }
                }
            ],
            metadata={
                "created_at": datetime.datetime.utcnow().isoformat(),
                "modified_at": datetime.datetime.utcnow().isoformat(),
                "created_by": "system",
                "version": "1.0",
                "tags": ["geospatial", "analysis", "property values"]
            }
        )
        
        # Anomaly Detection Template
        create_template(
            name="Property Value Anomaly Report",
            description="Analysis of detected property value anomalies",
            template_type="anomaly_report",
            sections=[
                {
                    "section_type": "header",
                    "title": "Property Value Anomaly Report",
                    "content": {
                        "subtitle": "Detected Valuation Inconsistencies"
                    }
                },
                {
                    "section_type": "text",
                    "title": "Analysis Summary",
                    "content": {
                        "text": "This report summarizes detected anomalies in property valuations. These properties have assessed or market values that differ significantly from expected values based on property characteristics and comparable properties in the area."
                    }
                },
                {
                    "section_type": "chart",
                    "title": "Anomaly Severity Distribution",
                    "content": {
                        "chart_type": "pie",
                        "data_key": "severity_distribution"
                    }
                },
                {
                    "section_type": "map",
                    "title": "Anomaly Location Map",
                    "content": {
                        "map_type": "point",
                        "color_field": "severity",
                        "size_field": "confidence",
                        "color_scheme": "reds"
                    }
                },
                {
                    "section_type": "table",
                    "title": "Detected Anomalies",
                    "content": {
                        "data_key": "anomalies",
                        "columns": [
                            "property_id", "address", "property_type", "assessed_value",
                            "expected_value", "percent_difference", "severity", "confidence"
                        ]
                    }
                },
                {
                    "section_type": "footer",
                    "title": "Footer",
                    "content": {
                        "text": "Anomalies detected using Data Stability Framework anomaly detection algorithms"
                    }
                }
            ],
            metadata={
                "created_at": datetime.datetime.utcnow().isoformat(),
                "modified_at": datetime.datetime.utcnow().isoformat(),
                "created_by": "system",
                "version": "1.0",
                "tags": ["anomaly", "detection", "data quality"]
            }
        )

# Create default templates
create_default_templates()