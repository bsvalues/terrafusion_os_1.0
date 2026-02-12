#!/usr/bin/env python
"""
Legacy Data Conversion System for GeoAssessmentPro

This module provides an AI-powered legacy data conversion system that can:
1. Automatically detect and parse various legacy formats
2. Use AI for schema mapping and inference
3. Apply data validation and cleaning specific to property assessment data
4. Provide detailed conversion reporting and error handling
5. Support incremental and resumable conversions
"""

import os
import sys
import json
import time
import uuid
import logging
import datetime
import tempfile
import traceback
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional, Union, Callable, TextIO
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from sqlalchemy import create_engine, MetaData, Table, inspect, text
from flask import Blueprint, jsonify, request, current_app, g, session, render_template

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Blueprint for legacy conversion routes
legacy_bp = Blueprint("legacy_conversion", __name__, url_prefix="/legacy")

# Define conversion status constants
STATUS_PENDING = "pending"
STATUS_IN_PROGRESS = "in_progress"
STATUS_COMPLETED = "completed"
STATUS_FAILED = "failed"
STATUS_PARTIAL = "partial"

# Define global format registry
format_registry = {}

@dataclass
class ColumnMapping:
    """Mapping for a single column from source to target"""
    source_column: str
    target_column: str
    transformation: Optional[Callable] = None
    required: bool = False
    data_type: str = "string"
    validation_rules: List[Dict[str, Any]] = field(default_factory=list)
    description: str = ""
    confidence: float = 1.0
    ai_suggested: bool = False


@dataclass
class ConversionConfig:
    """Configuration for a legacy data conversion"""
    source_format: str
    target_schema: str
    column_mappings: List[ColumnMapping] = field(default_factory=list)
    batch_size: int = 5000
    validate_only: bool = False
    create_missing_columns: bool = False
    id_column: Optional[str] = None
    date_format: str = "%Y-%m-%d"
    encoding: str = "utf-8"
    error_threshold: float = 0.1
    ai_assistance_level: int = 2  # 0=none, 1=suggestions, 2=auto-mapping, 3=full
    transaction_mode: str = "batch"  # batch, row, or single
    custom_settings: Dict[str, Any] = field(default_factory=dict)
    conversion_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime.datetime = field(default_factory=datetime.datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert config to dictionary"""
        result = {
            "source_format": self.source_format,
            "target_schema": self.target_schema,
            "column_mappings": [],
            "batch_size": self.batch_size,
            "validate_only": self.validate_only,
            "create_missing_columns": self.create_missing_columns,
            "id_column": self.id_column,
            "date_format": self.date_format,
            "encoding": self.encoding,
            "error_threshold": self.error_threshold,
            "ai_assistance_level": self.ai_assistance_level,
            "transaction_mode": self.transaction_mode,
            "custom_settings": self.custom_settings,
            "conversion_id": self.conversion_id,
            "created_at": self.created_at.isoformat()
        }
        
        # Convert column mappings to dict
        for mapping in self.column_mappings:
            mapping_dict = {
                "source_column": mapping.source_column,
                "target_column": mapping.target_column,
                "required": mapping.required,
                "data_type": mapping.data_type,
                "validation_rules": mapping.validation_rules,
                "description": mapping.description,
                "confidence": mapping.confidence,
                "ai_suggested": mapping.ai_suggested
            }
            result["column_mappings"].append(mapping_dict)
        
        return result
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConversionConfig':
        """Create config from dictionary"""
        column_mappings = []
        for mapping_data in data.get("column_mappings", []):
            mapping = ColumnMapping(
                source_column=mapping_data["source_column"],
                target_column=mapping_data["target_column"],
                required=mapping_data.get("required", False),
                data_type=mapping_data.get("data_type", "string"),
                validation_rules=mapping_data.get("validation_rules", []),
                description=mapping_data.get("description", ""),
                confidence=mapping_data.get("confidence", 1.0),
                ai_suggested=mapping_data.get("ai_suggested", False)
            )
            column_mappings.append(mapping)
        
        # Convert string datetime back to datetime object
        created_at = data.get("created_at")
        if created_at and isinstance(created_at, str):
            created_at = datetime.datetime.fromisoformat(created_at)
        else:
            created_at = datetime.datetime.utcnow()
        
        return cls(
            source_format=data["source_format"],
            target_schema=data["target_schema"],
            column_mappings=column_mappings,
            batch_size=data.get("batch_size", 5000),
            validate_only=data.get("validate_only", False),
            create_missing_columns=data.get("create_missing_columns", False),
            id_column=data.get("id_column"),
            date_format=data.get("date_format", "%Y-%m-%d"),
            encoding=data.get("encoding", "utf-8"),
            error_threshold=data.get("error_threshold", 0.1),
            ai_assistance_level=data.get("ai_assistance_level", 2),
            transaction_mode=data.get("transaction_mode", "batch"),
            custom_settings=data.get("custom_settings", {}),
            conversion_id=data.get("conversion_id", str(uuid.uuid4())),
            created_at=created_at
        )


@dataclass
class ConversionResult:
    """Result of a legacy data conversion"""
    conversion_id: str
    status: str = STATUS_PENDING
    total_rows: int = 0
    processed_rows: int = 0
    success_rows: int = 0
    error_rows: int = 0
    warning_rows: int = 0
    start_time: Optional[datetime.datetime] = None
    end_time: Optional[datetime.datetime] = None
    error_details: List[Dict[str, Any]] = field(default_factory=list)
    warning_details: List[Dict[str, Any]] = field(default_factory=list)
    log_file: Optional[str] = None
    report_file: Optional[str] = None
    
    @property
    def success_rate(self) -> float:
        """Calculate success rate"""
        if self.total_rows == 0:
            return 0.0
        return self.success_rows / self.total_rows
    
    @property
    def error_rate(self) -> float:
        """Calculate error rate"""
        if self.total_rows == 0:
            return 0.0
        return self.error_rows / self.total_rows
    
    @property
    def duration_seconds(self) -> Optional[float]:
        """Calculate duration in seconds"""
        if not self.start_time or not self.end_time:
            return None
        return (self.end_time - self.start_time).total_seconds()

    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary"""
        return {
            "conversion_id": self.conversion_id,
            "status": self.status,
            "total_rows": self.total_rows,
            "processed_rows": self.processed_rows,
            "success_rows": self.success_rows,
            "error_rows": self.error_rows,
            "warning_rows": self.warning_rows,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "success_rate": self.success_rate,
            "error_rate": self.error_rate,
            "duration_seconds": self.duration_seconds,
            "error_details": self.error_details[:100],  # Limit to first 100 errors
            "warning_details": self.warning_details[:100],  # Limit to first 100 warnings
            "log_file": self.log_file,
            "report_file": self.report_file
        }


class FormatDetector:
    """AI-powered format detector for legacy files"""
    
    def __init__(self):
        """Initialize format detector"""
        # Load AI models if available
        try:
            from langchain_community.vectorstores import FAISS
            from langchain.embeddings import OpenAIEmbeddings
            self.ai_available = True
            logger.info("AI format detection initialized successfully")
        except ImportError:
            self.ai_available = False
            logger.warning("AI format detection not available, using basic detection only")
    
    def detect_format(self, file_path: str) -> Dict[str, float]:
        """
        Detect the format of a legacy file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dict with format names and confidence scores
        """
        # Get file extension
        _, ext = os.path.splitext(file_path.lower())
        ext = ext.lstrip(".")
        
        # Try basic format detection first
        format_scores = self._basic_format_detection(file_path, ext)
        
        # Try AI-powered detection if basic detection is uncertain
        if self.ai_available and max(format_scores.values(), default=0) < 0.8:
            ai_scores = self._ai_format_detection(file_path, ext)
            
            # Merge scores, giving more weight to AI detection
            for format_name, score in ai_scores.items():
                if format_name in format_scores:
                    format_scores[format_name] = (format_scores[format_name] + score * 2) / 3
                else:
                    format_scores[format_name] = score
        
        return format_scores
    
    def _basic_format_detection(self, file_path: str, ext: str) -> Dict[str, float]:
        """
        Perform basic format detection based on file extension and content
        
        Args:
            file_path: Path to the file
            ext: File extension
            
        Returns:
            Dict with format names and confidence scores
        """
        format_scores = {}
        
        # Check extension first
        if ext in ["dbf"]:
            format_scores["dbf"] = 0.9
        elif ext in ["csv"]:
            format_scores["csv"] = 0.9
        elif ext in ["xls", "xlsx"]:
            format_scores["excel"] = 0.9
        elif ext in ["txt"]:
            # Need to examine content for fixed-width or delimited
            with open(file_path, "r", errors="ignore") as f:
                sample = f.read(10000)
            
            # Check for common delimiters
            if "|" in sample:
                format_scores["pipe_delimited"] = 0.8
            elif "\t" in sample:
                format_scores["tab_delimited"] = 0.8
            elif sample.count(",") > 5:
                format_scores["csv"] = 0.7
            else:
                # Likely fixed-width
                format_scores["fixed_width"] = 0.6
        elif ext in ["xml"]:
            format_scores["xml"] = 0.9
        elif ext in ["json"]:
            format_scores["json"] = 0.9
        else:
            # Unknown extension, try to analyze content
            try:
                with open(file_path, "rb") as f:
                    header = f.read(1024)
                
                # Check if it's a binary file
                if b"\0" in header:
                    format_scores["binary"] = 0.7
                else:
                    # Try to read as text
                    with open(file_path, "r", errors="ignore") as f:
                        sample = f.read(10000)
                    
                    # Check for common patterns
                    if sample.startswith("{") and "}" in sample:
                        format_scores["json"] = 0.7
                    elif sample.startswith("<") and ">" in sample:
                        format_scores["xml"] = 0.7
                    elif "," in sample:
                        format_scores["csv"] = 0.5
                    else:
                        format_scores["fixed_width"] = 0.4
            except Exception as e:
                logger.warning(f"Error analyzing file: {str(e)}")
                format_scores["unknown"] = 0.5
        
        return format_scores
    
    def _ai_format_detection(self, file_path: str, ext: str) -> Dict[str, float]:
        """
        Perform AI-powered format detection
        
        Args:
            file_path: Path to the file
            ext: File extension
            
        Returns:
            Dict with format names and confidence scores
        """
        # This is a placeholder for AI-powered detection
        # In a real implementation, we would use machine learning
        # or LLMs to analyze the file content and structure
        
        try:
            if not hasattr(self, "_openai_client"):
                from openai import OpenAI
                self._openai_client = OpenAI()
            
            # Read a sample of the file
            with open(file_path, "r", errors="ignore") as f:
                sample = f.read(5000)
            
            # Ask LLM for format detection
            response = self._openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a file format detection expert, specializing in data files. Analyze the provided sample and identify the likely file format and structure."},
                    {"role": "user", "content": f"Identify the format of this data file sample. File extension: {ext}\n\nSample content:\n{sample}\n\nRespond with a JSON object containing format name and confidence score."}
                ],
                response_format={"type": "json_object"}
            )
            
            # Parse response
            result = json.loads(response.choices[0].message.content)
            return {result["format"]: result["confidence"]}
        except Exception as e:
            logger.warning(f"Error in AI format detection: {str(e)}")
            return {}


class FormatHandler(ABC):
    """Base class for legacy format handlers"""
    
    @abstractmethod
    def can_handle(self, file_path: str) -> bool:
        """
        Check if this handler can process the given file
        
        Args:
            file_path: Path to the file
            
        Returns:
            True if this handler can process the file, False otherwise
        """
        pass
    
    @abstractmethod
    def read_schema(self, file_path: str) -> Dict[str, Any]:
        """
        Read the schema of the legacy file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dict with schema information
        """
        pass
    
    @abstractmethod
    def read_data(self, file_path: str, batch_size: int = 1000) -> pd.DataFrame:
        """
        Read data from the legacy file as a generator
        
        Args:
            file_path: Path to the file
            batch_size: Number of rows to read at a time
            
        Returns:
            Generator yielding DataFrames
        """
        pass
    
    @abstractmethod
    def validate_mapping(self, file_path: str, mapping: List[ColumnMapping]) -> List[Dict[str, Any]]:
        """
        Validate a column mapping against the file
        
        Args:
            file_path: Path to the file
            mapping: List of column mappings
            
        Returns:
            List of validation issues
        """
        pass


class AISchemaMapper:
    """AI-powered schema mapping helper for property assessment data"""
    
    def __init__(self):
        """Initialize schema mapper with domain knowledge for property assessment"""
        self.ai_available = False
        self.domain_knowledge = self._load_domain_knowledge()
        
        try:
            from openai import OpenAI
            self.ai_available = True
            self.client = OpenAI()
            logger.info("AI schema mapping initialized successfully")
        except ImportError:
            logger.warning("OpenAI not available, AI schema mapping disabled")
    
    def _load_domain_knowledge(self) -> Dict[str, Any]:
        """
        Load domain knowledge for property assessment data
        
        Returns:
            Dictionary containing domain knowledge
        """
        # Standard property assessment field categories and common synonyms
        return {
            "field_categories": {
                "parcel_identifier": [
                    "parcel_id", "pin", "property_id", "apn", "id", "identifier", 
                    "parcel_number", "tax_id", "parcel_key", "assessment_id"
                ],
                "owner_information": [
                    "owner_name", "owner", "taxpayer", "owner_address", "taxpayer_name",
                    "first_name", "last_name", "company_name", "primary_owner", "ownership_type"
                ],
                "property_location": [
                    "address", "street", "city", "state", "zip", "zipcode", "county",
                    "street_number", "street_name", "unit", "location", "geo_location"
                ],
                "property_characteristics": [
                    "land_area", "building_area", "acreage", "square_feet", "sqft",
                    "year_built", "bedrooms", "bathrooms", "stories", "construction_type",
                    "property_class", "property_type", "zoning", "use_code", "condition"
                ],
                "valuation": [
                    "assessed_value", "market_value", "land_value", "improvement_value",
                    "total_value", "appraised_value", "tax_value", "exemption_value",
                    "assessment_year", "valuation_date", "previous_value"
                ],
                "taxation": [
                    "tax_rate", "tax_amount", "tax_status", "tax_year", "exemptions",
                    "special_assessment", "tax_district", "millage_rate", "tax_code"
                ],
                "geographic": [
                    "latitude", "longitude", "gis_id", "shapefile_id", "gis_link",
                    "coordinates", "geo_id", "shape", "boundary", "map_id", "tax_map"
                ],
                "legal": [
                    "legal_description", "subdivision", "lot", "block", "section",
                    "township", "range", "plat", "deed_reference", "recording_date"
                ],
                "dates": [
                    "sale_date", "recording_date", "assessment_date", "effective_date",
                    "inspection_date", "creation_date", "update_date", "verification_date"
                ]
            },
            "data_types": {
                "parcel_identifier": "string",
                "owner_information": "string",
                "property_location": "string",
                "property_characteristics": "mixed",
                "valuation": "float",
                "taxation": "float",
                "geographic": "mixed",
                "legal": "string",
                "dates": "date"
            },
            "field_validations": {
                "parcel_identifier": [
                    {"type": "required", "message": "Parcel ID is required"},
                    {"type": "unique", "message": "Parcel ID must be unique"}
                ],
                "valuation": [
                    {"type": "min", "value": 0, "message": "Value cannot be negative"}
                ],
                "dates": [
                    {"type": "date_format", "format": "%Y-%m-%d", "message": "Invalid date format"}
                ],
                "geographic": [
                    {"type": "lat_range", "min": -90, "max": 90, "message": "Latitude must be between -90 and 90"},
                    {"type": "lon_range", "min": -180, "max": 180, "message": "Longitude must be between -180 and 180"}
                ]
            }
        }
    
    def suggest_mappings(self, source_schema: Dict[str, Any], 
                         target_schema: Dict[str, Any]) -> List[ColumnMapping]:
        """
        Suggest column mappings using AI and domain knowledge
        
        Args:
            source_schema: Source schema information
            target_schema: Target schema information
            
        Returns:
            List of suggested column mappings
        """
        # First try semantic matching using domain knowledge
        knowledge_mappings = self._knowledge_based_mapping(source_schema, target_schema)
        
        # If AI is available, enhance with AI suggestions
        if self.ai_available:
            try:
                # Extract column information
                source_columns = source_schema.get("columns", {})
                target_columns = target_schema.get("columns", {})
                
                # Prepare the prompt with domain knowledge and existing mappings
                prompt = self._build_mapping_prompt(source_columns, target_columns, knowledge_mappings)
                
                # Get suggestions from AI
                response = self.client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": "You are an expert in property assessment data, specializing in schema mapping for real estate valuation and tax assessment databases."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"}
                )
                
                # Parse response
                result = json.loads(response.choices[0].message.content)
                ai_mappings = []
                
                for mapping_data in result.get("mappings", []):
                    mapping = ColumnMapping(
                        source_column=mapping_data["source_column"],
                        target_column=mapping_data["target_column"],
                        required=mapping_data.get("required", False),
                        data_type=mapping_data.get("data_type", "string"),
                        validation_rules=mapping_data.get("validation_rules", []),
                        description=mapping_data.get("description", ""),
                        confidence=mapping_data.get("confidence", 0.8),
                        ai_suggested=True
                    )
                    ai_mappings.append(mapping)
                
                # Merge knowledge-based and AI mappings, prioritizing higher confidence
                return self._merge_mappings(knowledge_mappings, ai_mappings)
            except Exception as e:
                logger.error(f"Error in AI schema mapping: {str(e)}")
                return knowledge_mappings
        else:
            logger.warning("AI not available for schema mapping, using domain knowledge only")
            return knowledge_mappings
    
    def _merge_mappings(self, primary_mappings: List[ColumnMapping], 
                       secondary_mappings: List[ColumnMapping]) -> List[ColumnMapping]:
        """
        Merge two sets of mappings, prioritizing by confidence
        
        Args:
            primary_mappings: Primary mapping list
            secondary_mappings: Secondary mapping list
            
        Returns:
            Merged list of mappings
        """
        result = primary_mappings.copy()
        primary_sources = {m.source_column for m in primary_mappings}
        
        # Add any mappings from secondary that don't overlap with primary
        for mapping in secondary_mappings:
            if mapping.source_column not in primary_sources:
                result.append(mapping)
                primary_sources.add(mapping.source_column)
                continue
            
            # For overlapping mappings, keep the one with higher confidence
            for i, existing in enumerate(result):
                if existing.source_column == mapping.source_column:
                    if mapping.confidence > existing.confidence:
                        result[i] = mapping
                    break
        
        return sorted(result, key=lambda m: (m.source_column, -m.confidence))
    
    def _knowledge_based_mapping(self, source_schema: Dict[str, Any], 
                               target_schema: Dict[str, Any]) -> List[ColumnMapping]:
        """
        Perform schema mapping based on property assessment domain knowledge
        
        Args:
            source_schema: Source schema information
            target_schema: Target schema information
            
        Returns:
            List of suggested column mappings
        """
        source_columns = source_schema.get("columns", {})
        target_columns = target_schema.get("columns", {})
        mappings = []
        
        # Categorize all source and target fields based on domain knowledge
        source_categories = self._categorize_fields(source_columns)
        target_categories = self._categorize_fields(target_columns)
        
        # Map fields across categories
        for category, source_fields in source_categories.items():
            target_fields = target_categories.get(category, [])
            if not target_fields:
                continue
                
            # Match fields within categories based on similarity
            for source_field in source_fields:
                best_match = None
                best_score = 0.0
                
                for target_field in target_fields:
                    score = self._calculate_field_similarity(
                        source_field, 
                        target_field,
                        source_columns.get(source_field, {}),
                        target_columns.get(target_field, {})
                    )
                    if score > best_score and score > 0.6:  # Threshold for matching
                        best_score = score
                        best_match = target_field
                
                if best_match:
                    # Create mapping with appropriate data type and validation rules
                    data_type = self.domain_knowledge["data_types"].get(category, "string")
                    validation_rules = self.domain_knowledge["field_validations"].get(category, [])
                    
                    # Add the mapping
                    mapping = ColumnMapping(
                        source_column=source_field,
                        target_column=best_match,
                        required=category == "parcel_identifier",  # Parcel IDs are typically required
                        data_type=data_type,
                        validation_rules=validation_rules,
                        description=f"Mapped based on {category} category",
                        confidence=best_score,
                        ai_suggested=False
                    )
                    mappings.append(mapping)
        
        # Add basic string matching for any remaining fields
        basic_mappings = self._basic_mapping(source_schema, target_schema)
        result = []
        
        # Add basic mappings that don't overlap with knowledge mappings
        mapped_sources = {m.source_column for m in mappings}
        for mapping in basic_mappings:
            if mapping.source_column not in mapped_sources:
                result.append(mapping)
        
        return mappings + result
    
    def _categorize_fields(self, columns: Dict[str, Any]) -> Dict[str, List[str]]:
        """
        Categorize fields based on domain knowledge
        
        Args:
            columns: Column information
            
        Returns:
            Dictionary mapping categories to column names
        """
        categories = {}
        
        for field_name in columns.keys():
            field_lower = field_name.lower().replace('_', '')
            
            for category, patterns in self.domain_knowledge["field_categories"].items():
                matched = False
                for pattern in patterns:
                    if pattern.lower().replace('_', '') in field_lower:
                        if category not in categories:
                            categories[category] = []
                        categories[category].append(field_name)
                        matched = True
                        break
                if matched:
                    break
        
        return categories
    
    def _calculate_field_similarity(self, source_field: str, target_field: str,
                                  source_info: Dict[str, Any], 
                                  target_info: Dict[str, Any]) -> float:
        """
        Calculate similarity between two fields based on name and metadata
        
        Args:
            source_field: Source field name
            target_field: Target field name
            source_info: Source field metadata
            target_info: Target field metadata
            
        Returns:
            Similarity score between 0 and 1
        """
        # Calculate string similarity
        name_similarity = self._string_similarity(source_field, target_field)
        
        # Calculate type similarity
        type_similarity = 0.0
        if "type" in source_info and "type" in target_info:
            if source_info["type"] == target_info["type"]:
                type_similarity = 1.0
            elif (source_info["type"] in ["integer", "float", "decimal", "number"] and 
                  target_info["type"] in ["integer", "float", "decimal", "number"]):
                type_similarity = 0.8
            elif (source_info["type"] in ["string", "text", "varchar"] and 
                  target_info["type"] in ["string", "text", "varchar"]):
                type_similarity = 0.9
            elif (source_info["type"] in ["date", "datetime", "timestamp"] and 
                  target_info["type"] in ["date", "datetime", "timestamp"]):
                type_similarity = 0.9
        else:
            type_similarity = 0.5  # Default if type information is not available
        
        # Calculate description similarity if available
        desc_similarity = 0.0
        if "description" in source_info and "description" in target_info:
            desc_similarity = self._string_similarity(
                source_info["description"], target_info["description"]
            )
        
        # Weighted combination of similarity measures
        if "description" in source_info and "description" in target_info:
            return 0.6 * name_similarity + 0.2 * type_similarity + 0.2 * desc_similarity
        else:
            return 0.7 * name_similarity + 0.3 * type_similarity
    
    def _string_similarity(self, str1: str, str2: str) -> float:
        """
        Calculate string similarity score
        
        Args:
            str1: First string
            str2: Second string
            
        Returns:
            Similarity score between 0 and 1
        """
        # Simple Jaccard similarity implementation
        s1 = set(str1.lower().replace('_', ' ').split())
        s2 = set(str2.lower().replace('_', ' ').split())
        
        if not s1 and not s2:
            return 1.0
        if not s1 or not s2:
            return 0.0
            
        intersection = len(s1.intersection(s2))
        union = len(s1.union(s2))
        
        return intersection / union
    
    def _build_mapping_prompt(self, source_columns: Dict[str, Any], 
                            target_columns: Dict[str, Any],
                            existing_mappings: List[ColumnMapping] = None) -> str:
        """
        Build a prompt for AI schema mapping
        
        Args:
            source_columns: Source column information
            target_columns: Target column information
            existing_mappings: Existing mappings to consider
            
        Returns:
            Prompt for AI
        """
        source_desc = json.dumps(source_columns, indent=2)
        target_desc = json.dumps(target_columns, indent=2)
        
        # Include existing mappings if available
        existing_mappings_json = "[]"
        if existing_mappings:
            mapping_list = []
            for mapping in existing_mappings:
                mapping_dict = {
                    "source_column": mapping.source_column,
                    "target_column": mapping.target_column,
                    "confidence": mapping.confidence
                }
                mapping_list.append(mapping_dict)
            existing_mappings_json = json.dumps(mapping_list, indent=2)
        
        return f"""
        I need to map columns from a source schema to a target schema for a property assessment data conversion.
        
        SOURCE SCHEMA:
        {source_desc}
        
        TARGET SCHEMA:
        {target_desc}
        
        EXISTING MAPPINGS (PROPOSED):
        {existing_mappings_json}
        
        You're an expert in property assessment data. Please analyze and suggest complete mappings between source and target columns.
        For each mapping, provide:
        1. source_column: The column name from the source schema
        2. target_column: The column name from the target schema
        3. required: Boolean indicating if this mapping is required (true/false)
        4. data_type: Expected data type (string, integer, float, date, boolean)
        5. validation_rules: Array of validation rules applicable
        6. description: A brief description of what this mapping represents
        7. confidence: Confidence score between 0 and 1
        
        Consider:
        - Property assessment domain terms (parcel IDs, tax info, property characteristics)
        - Field name similarities and semantics
        - Required fields for property assessment systems (parcel identifiers, property address)
        - Field meanings rather than just exact name matches
        - Appropriate data types for property assessment data
        - Validation rules needed for property data integrity
        
        Respond with a JSON object containing an array of mappings with the fields listed above.
        Make sure to provide the most complete and accurate mapping possible for property assessment data.
        """
    
    def _basic_mapping(self, source_schema: Dict[str, Any], 
                      target_schema: Dict[str, Any]) -> List[ColumnMapping]:
        """
        Perform basic column mapping based on name similarity
        
        Args:
            source_schema: Source schema information
            target_schema: Target schema information
            
        Returns:
            List of suggested column mappings
        """
        source_columns = source_schema.get("columns", {})
        target_columns = target_schema.get("columns", {})
        
        mappings = []
        
        # Find exact name matches
        for source_col, source_info in source_columns.items():
            source_lower = source_col.lower()
            
            # Try exact match
            if source_col in target_columns:
                mappings.append(ColumnMapping(
                    source_column=source_col,
                    target_column=source_col,
                    data_type=source_info.get("type", "string"),
                    confidence=1.0
                ))
                continue
            
            # Try case-insensitive match
            for target_col in target_columns:
                if source_lower == target_col.lower():
                    mappings.append(ColumnMapping(
                        source_column=source_col,
                        target_column=target_col,
                        data_type=source_info.get("type", "string"),
                        confidence=0.9
                    ))
                    break
        
        # Look for similar names
        for source_col, source_info in source_columns.items():
            # Skip already mapped columns
            if any(m.source_column == source_col for m in mappings):
                continue
            
            source_lower = source_col.lower().replace("_", "").replace(" ", "")
            best_match = None
            best_score = 0.6  # Minimum similarity threshold
            
            for target_col in target_columns:
                # Skip already mapped columns
                if any(m.target_column == target_col for m in mappings):
                    continue
                
                target_lower = target_col.lower().replace("_", "").replace(" ", "")
                
                # Calculate similarity
                similarity = self._name_similarity(source_lower, target_lower)
                
                if similarity > best_score:
                    best_score = similarity
                    best_match = target_col
            
            if best_match:
                mappings.append(ColumnMapping(
                    source_column=source_col,
                    target_column=best_match,
                    data_type=source_info.get("type", "string"),
                    confidence=best_score
                ))
        
        return mappings
    
    def _name_similarity(self, name1: str, name2: str) -> float:
        """
        Calculate similarity between column names
        
        Args:
            name1: First column name
            name2: Second column name
            
        Returns:
            Similarity score between 0 and 1
        """
        # Simple Jaccard similarity for now
        set1 = set(name1)
        set2 = set(name2)
        
        if not set1 or not set2:
            return 0.0
        
        intersection = len(set1.intersection(set2))
        union = len(set1.union(set2))
        
        return intersection / union


class LegacyConverter:
    """Main legacy data conversion engine"""
    
    def __init__(self):
        """Initialize legacy converter"""
        self.format_detector = FormatDetector()
        self.schema_mapper = AISchemaMapper()
        self.running_conversions = {}
        self.conversion_results = {}
        
        # Create directory for conversion results
        self.conversions_dir = os.path.join("uploads", "conversions")
        os.makedirs(self.conversions_dir, exist_ok=True)
    
    def detect_format(self, file_path: str) -> Dict[str, float]:
        """
        Detect the format of a legacy file
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dict with format names and confidence scores
        """
        return self.format_detector.detect_format(file_path)
    
    def analyze_file(self, file_path: str) -> Dict[str, Any]:
        """
        Analyze a legacy file and provide information about it
        
        Args:
            file_path: Path to the file
            
        Returns:
            Dict with file analysis information
        """
        # Detect format
        format_scores = self.detect_format(file_path)
        detected_format = max(format_scores.items(), key=lambda x: x[1])[0]
        
        # Get format handler
        handler = self._get_format_handler(detected_format)
        
        if not handler:
            return {
                "error": f"No handler available for format: {detected_format}",
                "detected_format": detected_format,
                "format_scores": format_scores
            }
        
        try:
            # Read schema
            schema = handler.read_schema(file_path)
            
            # Read sample data
            sample_data = next(handler.read_data(file_path, batch_size=10))
            
            # Convert sample data to serializable format
            sample_records = []
            for _, row in sample_data.iterrows():
                record = {}
                for col in row.index:
                    value = row[col]
                    if pd.isna(value):
                        record[col] = None
                    elif isinstance(value, (np.integer, int)):
                        record[col] = int(value)
                    elif isinstance(value, (np.floating, float)):
                        record[col] = float(value)
                    elif isinstance(value, (datetime.date, datetime.datetime)):
                        record[col] = value.isoformat()
                    else:
                        record[col] = str(value)
                sample_records.append(record)
            
            return {
                "detected_format": detected_format,
                "format_scores": format_scores,
                "schema": schema,
                "sample_data": sample_records[:10],
                "file_size": os.path.getsize(file_path),
                "file_name": os.path.basename(file_path)
            }
        except Exception as e:
            logger.error(f"Error analyzing file: {str(e)}")
            traceback.print_exc()
            return {
                "error": f"Error analyzing file: {str(e)}",
                "detected_format": detected_format,
                "format_scores": format_scores
            }
    
    def suggest_mappings(self, file_path: str, target_schema: str) -> List[ColumnMapping]:
        """
        Suggest column mappings for a legacy file
        
        Args:
            file_path: Path to the file
            target_schema: Name of the target schema
            
        Returns:
            List of suggested column mappings
        """
        # Analyze file to get its schema
        analysis = self.analyze_file(file_path)
        
        if "error" in analysis:
            logger.error(f"Error analyzing file for mapping: {analysis['error']}")
            return []
        
        # Get target schema information
        target_schema_info = self._get_target_schema_info(target_schema)
        
        if not target_schema_info:
            logger.error(f"Target schema not found: {target_schema}")
            return []
        
        # Use AI to suggest mappings
        return self.schema_mapper.suggest_mappings(analysis["schema"], target_schema_info)
    
    def start_conversion(self, file_path: str, config: ConversionConfig) -> str:
        """
        Start a legacy data conversion
        
        Args:
            file_path: Path to the file
            config: Conversion configuration
            
        Returns:
            Conversion ID
        """
        conversion_id = config.conversion_id
        
        # Create result object
        result = ConversionResult(conversion_id=conversion_id)
        self.conversion_results[conversion_id] = result
        
        # Create log file
        log_dir = os.path.join(self.conversions_dir, conversion_id)
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "conversion.log")
        result.log_file = log_file
        
        # Create file handler for logging
        file_handler = logging.FileHandler(log_file, mode="w")
        file_handler.setFormatter(logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s'))
        logger.addHandler(file_handler)
        
        # Store configuration
        config_file = os.path.join(log_dir, "config.json")
        with open(config_file, "w") as f:
            json.dump(config.to_dict(), f, indent=2)
        
        # Start conversion in a separate thread
        import threading
        thread = threading.Thread(
            target=self._run_conversion,
            args=(file_path, config, result, file_handler)
        )
        thread.daemon = True
        thread.start()
        
        self.running_conversions[conversion_id] = thread
        
        return conversion_id
    
    def get_conversion_status(self, conversion_id: str) -> Dict[str, Any]:
        """
        Get the status of a conversion
        
        Args:
            conversion_id: Conversion ID
            
        Returns:
            Dict with conversion status
        """
        if conversion_id not in self.conversion_results:
            return {"error": f"Conversion not found: {conversion_id}"}
        
        result = self.conversion_results[conversion_id]
        return result.to_dict()
    
    def cancel_conversion(self, conversion_id: str) -> bool:
        """
        Cancel a running conversion
        
        Args:
            conversion_id: Conversion ID
            
        Returns:
            True if cancelled, False otherwise
        """
        if conversion_id not in self.running_conversions:
            return False
        
        # There's no direct way to cancel a thread in Python
        # We can only flag it for cancellation
        if conversion_id in self.conversion_results:
            result = self.conversion_results[conversion_id]
            result.status = STATUS_FAILED
            result.end_time = datetime.datetime.utcnow()
        
        return True
    
    def _run_conversion(self, file_path: str, config: ConversionConfig, 
                      result: ConversionResult, file_handler: logging.Handler):
        """
        Run the conversion process
        
        Args:
            file_path: Path to the file
            config: Conversion configuration
            result: Conversion result object
            file_handler: Logging file handler
        """
        try:
            # Update status
            result.status = STATUS_IN_PROGRESS
            result.start_time = datetime.datetime.utcnow()
            
            logger.info(f"Starting conversion {config.conversion_id}")
            logger.info(f"Source: {file_path}")
            logger.info(f"Target: {config.target_schema}")
            
            # Get format handler
            handler = self._get_format_handler(config.source_format)
            
            if not handler:
                raise ValueError(f"No handler available for format: {config.source_format}")
            
            # Validate mapping
            validation_issues = handler.validate_mapping(file_path, config.column_mappings)
            
            if validation_issues:
                logger.warning("Mapping validation issues:")
                for issue in validation_issues:
                    logger.warning(f"  {issue['message']}")
                    result.warning_details.append(issue)
                    result.warning_rows += 1
            
            # If validate only, stop here
            if config.validate_only:
                logger.info("Validation only, stopping conversion")
                result.status = STATUS_COMPLETED
                result.end_time = datetime.datetime.utcnow()
                return
            
            # Get database connection
            from app import db
            engine = db.engine
            
            # Get target table information
            inspector = inspect(engine)
            if config.target_schema not in inspector.get_table_names():
                if config.create_missing_columns:
                    logger.info(f"Creating target table: {config.target_schema}")
                    # TODO: Implement table creation
                else:
                    raise ValueError(f"Target table does not exist: {config.target_schema}")
            
            # Read data in batches
            batch_count = 0
            for batch in handler.read_data(file_path, config.batch_size):
                batch_count += 1
                logger.info(f"Processing batch {batch_count}, {len(batch)} rows")
                
                # Apply column mappings
                transformed_data = self._transform_batch(batch, config.column_mappings)
                
                # Update counts
                result.total_rows += len(batch)
                
                # Validate data
                batch_result = self._validate_batch(transformed_data, config)
                
                # Update counts from validation
                result.processed_rows += batch_result["processed"]
                result.success_rows += batch_result["success"]
                result.error_rows += batch_result["errors"]
                result.warning_rows += batch_result["warnings"]
                
                # Add error details
                for error in batch_result["error_details"]:
                    if len(result.error_details) < 1000:  # Limit stored errors
                        result.error_details.append(error)
                
                # Add warning details
                for warning in batch_result["warning_details"]:
                    if len(result.warning_details) < 1000:  # Limit stored warnings
                        result.warning_details.append(warning)
                
                # If error threshold is exceeded, stop conversion
                if result.error_rate > config.error_threshold:
                    logger.error(f"Error threshold exceeded: {result.error_rate:.2%}")
                    result.status = STATUS_FAILED
                    break
                
                # Insert valid data
                if not batch_result["valid_data"].empty:
                    self._insert_batch(batch_result["valid_data"], config.target_schema, engine, config)
            
            # Update final status
            if result.status != STATUS_FAILED:
                if result.error_rows > 0:
                    result.status = STATUS_PARTIAL
                else:
                    result.status = STATUS_COMPLETED
            
            # Generate report
            report_file = os.path.join(
                self.conversions_dir, 
                config.conversion_id, 
                "report.html"
            )
            self._generate_report(result, config, report_file)
            result.report_file = report_file
        except Exception as e:
            logger.error(f"Error in conversion: {str(e)}")
            traceback.print_exc()
            result.status = STATUS_FAILED
            result.error_details.append({
                "type": "conversion_error",
                "message": str(e),
                "traceback": traceback.format_exc()
            })
        finally:
            # Ensure end time is set
            if not result.end_time:
                result.end_time = datetime.datetime.utcnow()
            
            # Remove file handler
            logger.removeHandler(file_handler)
            file_handler.close()
            
            # Remove from running conversions
            if config.conversion_id in self.running_conversions:
                del self.running_conversions[config.conversion_id]
            
            logger.info(f"Conversion finished: {config.conversion_id}")
            logger.info(f"Status: {result.status}")
            logger.info(f"Rows: {result.processed_rows} processed, {result.success_rows} success, {result.error_rows} errors, {result.warning_rows} warnings")
    
    def _transform_batch(self, batch: pd.DataFrame, 
                       mappings: List[ColumnMapping]) -> pd.DataFrame:
        """
        Transform a batch of data using column mappings
        
        Args:
            batch: DataFrame with batch data
            mappings: List of column mappings
            
        Returns:
            Transformed DataFrame
        """
        # Create a new DataFrame for transformed data
        transformed = pd.DataFrame()
        
        # Apply mappings
        for mapping in mappings:
            if mapping.source_column in batch.columns:
                # Start with the source data
                source_data = batch[mapping.source_column]
                
                # Apply transformation if provided
                if mapping.transformation:
                    try:
                        transformed[mapping.target_column] = source_data.apply(mapping.transformation)
                    except Exception as e:
                        logger.error(f"Error applying transformation for {mapping.source_column}: {str(e)}")
                        transformed[mapping.target_column] = source_data
                else:
                    transformed[mapping.target_column] = source_data
                
                # Convert data type if needed
                try:
                    if mapping.data_type == "integer":
                        transformed[mapping.target_column] = pd.to_numeric(transformed[mapping.target_column], errors="coerce").astype("Int64")
                    elif mapping.data_type == "float":
                        transformed[mapping.target_column] = pd.to_numeric(transformed[mapping.target_column], errors="coerce")
                    elif mapping.data_type == "date":
                        transformed[mapping.target_column] = pd.to_datetime(transformed[mapping.target_column], errors="coerce")
                    elif mapping.data_type == "boolean":
                        transformed[mapping.target_column] = transformed[mapping.target_column].astype(bool)
                except Exception as e:
                    logger.error(f"Error converting data type for {mapping.source_column}: {str(e)}")
        
        return transformed
    
    def _validate_batch(self, batch: pd.DataFrame, config: ConversionConfig) -> Dict[str, Any]:
        """
        Validate a batch of transformed data
        
        Args:
            batch: DataFrame with transformed data
            config: Conversion configuration
            
        Returns:
            Dict with validation results
        """
        result = {
            "processed": len(batch),
            "success": 0,
            "errors": 0,
            "warnings": 0,
            "error_details": [],
            "warning_details": [],
            "valid_data": pd.DataFrame()
        }
        
        # Copy batch for validation
        validated = batch.copy()
        valid_mask = pd.Series(True, index=batch.index)
        
        # Check required fields
        for mapping in config.column_mappings:
            if mapping.required and mapping.target_column in batch.columns:
                missing_mask = batch[mapping.target_column].isna()
                if missing_mask.any():
                    # Get rows with missing values
                    missing_rows = batch.index[missing_mask].tolist()
                    
                    # Add error details
                    for row in missing_rows:
                        if len(result["error_details"]) < 1000:  # Limit stored errors
                            result["error_details"].append({
                                "row": int(row),
                                "column": mapping.target_column,
                                "type": "missing_required",
                                "message": f"Missing required value in column {mapping.target_column}"
                            })
                    
                    # Update counts
                    result["errors"] += missing_mask.sum()
                    
                    # Mark rows as invalid
                    valid_mask = valid_mask & ~missing_mask
        
        # Apply validation rules
        for mapping in config.column_mappings:
            if mapping.target_column in batch.columns and mapping.validation_rules:
                # Get column data
                column_data = batch[mapping.target_column]
                
                for rule in mapping.validation_rules:
                    rule_type = rule.get("type")
                    
                    if rule_type == "range":
                        # Validate numeric range
                        min_val = rule.get("min")
                        max_val = rule.get("max")
                        
                        if pd.api.types.is_numeric_dtype(column_data):
                            # For min value
                            if min_val is not None:
                                below_min = (column_data < min_val) & column_data.notna()
                                if below_min.any():
                                    # Add error details
                                    for row in batch.index[below_min].tolist():
                                        if len(result["error_details"]) < 1000:
                                            result["error_details"].append({
                                                "row": int(row),
                                                "column": mapping.target_column,
                                                "type": "range_min",
                                                "message": f"Value below minimum in column {mapping.target_column}",
                                                "value": batch.loc[row, mapping.target_column],
                                                "min": min_val
                                            })
                                    
                                    # Update counts
                                    result["errors"] += below_min.sum()
                                    
                                    # Mark rows as invalid
                                    valid_mask = valid_mask & ~below_min
                            
                            # For max value
                            if max_val is not None:
                                above_max = (column_data > max_val) & column_data.notna()
                                if above_max.any():
                                    # Add error details
                                    for row in batch.index[above_max].tolist():
                                        if len(result["error_details"]) < 1000:
                                            result["error_details"].append({
                                                "row": int(row),
                                                "column": mapping.target_column,
                                                "type": "range_max",
                                                "message": f"Value above maximum in column {mapping.target_column}",
                                                "value": batch.loc[row, mapping.target_column],
                                                "max": max_val
                                            })
                                    
                                    # Update counts
                                    result["errors"] += above_max.sum()
                                    
                                    # Mark rows as invalid
                                    valid_mask = valid_mask & ~above_max
                    
                    elif rule_type == "pattern":
                        # Validate string pattern
                        pattern = rule.get("pattern")
                        
                        if pattern and pd.api.types.is_string_dtype(column_data):
                            import re
                            regex = re.compile(pattern)
                            
                            # Apply regex validation
                            def check_pattern(val):
                                if pd.isna(val):
                                    return True  # Skip NA values
                                return bool(regex.match(str(val)))
                            
                            valid_pattern = column_data.apply(check_pattern)
                            invalid_pattern = ~valid_pattern & column_data.notna()
                            
                            if invalid_pattern.any():
                                # Add error details
                                for row in batch.index[invalid_pattern].tolist():
                                    if len(result["error_details"]) < 1000:
                                        result["error_details"].append({
                                            "row": int(row),
                                            "column": mapping.target_column,
                                            "type": "pattern",
                                            "message": f"Invalid pattern in column {mapping.target_column}",
                                            "value": batch.loc[row, mapping.target_column],
                                            "pattern": pattern
                                        })
                                
                                # Update counts
                                result["errors"] += invalid_pattern.sum()
                                
                                # Mark rows as invalid
                                valid_mask = valid_mask & ~invalid_pattern
                    
                    elif rule_type == "values":
                        # Validate against a list of allowed values
                        allowed = rule.get("values", [])
                        
                        if allowed:
                            allowed_set = set(allowed)
                            
                            # Check if values are in the allowed set
                            def check_allowed(val):
                                if pd.isna(val):
                                    return True  # Skip NA values
                                return val in allowed_set
                            
                            valid_values = column_data.apply(check_allowed)
                            invalid_values = ~valid_values & column_data.notna()
                            
                            if invalid_values.any():
                                # Add error details
                                for row in batch.index[invalid_values].tolist():
                                    if len(result["error_details"]) < 1000:
                                        result["error_details"].append({
                                            "row": int(row),
                                            "column": mapping.target_column,
                                            "type": "values",
                                            "message": f"Invalid value in column {mapping.target_column}",
                                            "value": batch.loc[row, mapping.target_column],
                                            "allowed": allowed
                                        })
                                
                                # Update counts
                                result["errors"] += invalid_values.sum()
                                
                                # Mark rows as invalid
                                valid_mask = valid_mask & ~invalid_values
        
        # Keep only valid rows
        result["valid_data"] = validated[valid_mask]
        result["success"] = valid_mask.sum()
        
        return result
    
    def _insert_batch(self, batch: pd.DataFrame, table_name: str, 
                    engine, config: ConversionConfig):
        """
        Insert a batch of data into the target table
        
        Args:
            batch: DataFrame with valid data
            table_name: Target table name
            engine: SQLAlchemy engine
            config: Conversion configuration
        """
        if batch.empty:
            return
        
        # Determine transaction mode
        if config.transaction_mode == "single":
            # Single transaction for the entire batch
            with engine.begin() as conn:
                batch.to_sql(
                    table_name,
                    conn,
                    if_exists="append",
                    index=False,
                    method="multi"
                )
        elif config.transaction_mode == "row":
            # Separate transaction for each row
            for _, row in batch.iterrows():
                with engine.begin() as conn:
                    pd.DataFrame([row]).to_sql(
                        table_name,
                        conn,
                        if_exists="append",
                        index=False
                    )
        else:
            # Default: batch transaction
            batch.to_sql(
                table_name,
                engine,
                if_exists="append",
                index=False,
                method="multi"
            )
    
    def _generate_report(self, result: ConversionResult, config: ConversionConfig, 
                       report_file: str):
        """
        Generate a conversion report
        
        Args:
            result: Conversion result
            config: Conversion configuration
            report_file: Path to report file
        """
        # Generate HTML report
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Conversion Report: {config.conversion_id}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                h1, h2, h3 {{ color: #333; }}
                .summary {{ background-color: #f5f5f5; padding: 15px; border-radius: 5px; }}
                .success {{ color: green; }}
                .warning {{ color: orange; }}
                .error {{ color: red; }}
                table {{ border-collapse: collapse; width: 100%; margin: 15px 0; }}
                th, td {{ text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f2f2f2; }}
                tr:hover {{ background-color: #f5f5f5; }}
                .progress-bar {{ background-color: #eee; height: 20px; border-radius: 10px; overflow: hidden; }}
                .progress-fill {{ height: 100%; background-color: #4CAF50; }}
                .error-fill {{ background-color: #f44336; }}
                .warning-fill {{ background-color: #ff9800; }}
            </style>
        </head>
        <body>
            <h1>Data Conversion Report</h1>
            <div class="summary">
                <p><strong>Conversion ID:</strong> {config.conversion_id}</p>
                <p><strong>Source Format:</strong> {config.source_format}</p>
                <p><strong>Target Schema:</strong> {config.target_schema}</p>
                <p><strong>Start Time:</strong> {result.start_time.strftime('%Y-%m-%d %H:%M:%S') if result.start_time else 'N/A'}</p>
                <p><strong>End Time:</strong> {result.end_time.strftime('%Y-%m-%d %H:%M:%S') if result.end_time else 'N/A'}</p>
                <p><strong>Duration:</strong> {result.duration_seconds:.2f} seconds if result.duration_seconds else 'N/A'</p>
                <p><strong>Status:</strong> <span class="{result.status}">{result.status.upper()}</span></p>
            </div>
            
            <h2>Row Statistics</h2>
            <p><strong>Total Rows:</strong> {result.total_rows}</p>
            <p><strong>Processed Rows:</strong> {result.processed_rows}</p>
            <p><strong>Success Rows:</strong> {result.success_rows}</p>
            <p><strong>Error Rows:</strong> {result.error_rows}</p>
            <p><strong>Warning Rows:</strong> {result.warning_rows}</p>
            
            <div class="progress-bar">
                <div class="progress-fill" style="width: {result.success_rate * 100:.1f}%;"></div>
            </div>
            <p><strong>Success Rate:</strong> {result.success_rate * 100:.2f}%</p>
            
            <h2>Column Mappings</h2>
            <table>
                <tr>
                    <th>Source Column</th>
                    <th>Target Column</th>
                    <th>Data Type</th>
                    <th>Required</th>
                    <th>Confidence</th>
                    <th>AI Suggested</th>
                </tr>
        """
        
        # Add mapping rows
        for mapping in config.column_mappings:
            html += f"""
                <tr>
                    <td>{mapping.source_column}</td>
                    <td>{mapping.target_column}</td>
                    <td>{mapping.data_type}</td>
                    <td>{"Yes" if mapping.required else "No"}</td>
                    <td>{mapping.confidence * 100:.1f}%</td>
                    <td>{"Yes" if mapping.ai_suggested else "No"}</td>
                </tr>
            """
        
        html += """
            </table>
            
            <h2>Error Details</h2>
        """
        
        # Add error details
        if result.error_details:
            html += """
            <table>
                <tr>
                    <th>Row</th>
                    <th>Column</th>
                    <th>Type</th>
                    <th>Message</th>
                    <th>Value</th>
                </tr>
            """
            
            for error in result.error_details[:100]:  # Limit to first 100 errors
                row = error.get("row", "N/A")
                column = error.get("column", "N/A")
                error_type = error.get("type", "N/A")
                message = error.get("message", "N/A")
                value = error.get("value", "N/A")
                
                html += f"""
                <tr>
                    <td>{row}</td>
                    <td>{column}</td>
                    <td>{error_type}</td>
                    <td>{message}</td>
                    <td>{value}</td>
                </tr>
                """
            
            html += """
            </table>
            """
            
            if len(result.error_details) > 100:
                html += f"<p>Showing 100 of {len(result.error_details)} errors.</p>"
        else:
            html += "<p>No errors found.</p>"
        
        html += """
            <h2>Warning Details</h2>
        """
        
        # Add warning details
        if result.warning_details:
            html += """
            <table>
                <tr>
                    <th>Row</th>
                    <th>Column</th>
                    <th>Type</th>
                    <th>Message</th>
                    <th>Value</th>
                </tr>
            """
            
            for warning in result.warning_details[:100]:  # Limit to first 100 warnings
                row = warning.get("row", "N/A")
                column = warning.get("column", "N/A")
                warning_type = warning.get("type", "N/A")
                message = warning.get("message", "N/A")
                value = warning.get("value", "N/A")
                
                html += f"""
                <tr>
                    <td>{row}</td>
                    <td>{column}</td>
                    <td>{warning_type}</td>
                    <td>{message}</td>
                    <td>{value}</td>
                </tr>
                """
            
            html += """
            </table>
            """
            
            if len(result.warning_details) > 100:
                html += f"<p>Showing 100 of {len(result.warning_details)} warnings.</p>"
        else:
            html += "<p>No warnings found.</p>"
        
        html += """
        </body>
        </html>
        """
        
        # Write HTML to file
        with open(report_file, "w") as f:
            f.write(html)
    
    def _get_format_handler(self, format_name: str) -> Optional[FormatHandler]:
        """
        Get a format handler for a specific format
        
        Args:
            format_name: Format name
            
        Returns:
            Format handler instance or None if not found
        """
        if format_name in format_registry:
            return format_registry[format_name]()
        return None
    
    def _get_target_schema_info(self, schema_name: str) -> Dict[str, Any]:
        """
        Get information about a target schema
        
        Args:
            schema_name: Name of the schema
            
        Returns:
            Dict with schema information
        """
        try:
            from app import db
            engine = db.engine
            
            # Get table information
            inspector = inspect(engine)
            
            if schema_name not in inspector.get_table_names():
                return {}
            
            # Get column information
            columns = {}
            for column in inspector.get_columns(schema_name):
                columns[column["name"]] = {
                    "type": str(column["type"]),
                    "nullable": column["nullable"],
                    "default": str(column.get("default", "")),
                    "primary_key": column.get("primary_key", False)
                }
            
            # Get primary key information
            pk_constraint = inspector.get_pk_constraint(schema_name)
            primary_keys = pk_constraint.get("constrained_columns", [])
            
            # Get foreign key information
            foreign_keys = {}
            for fk in inspector.get_foreign_keys(schema_name):
                foreign_keys[fk["constrained_columns"][0]] = {
                    "referred_table": fk["referred_table"],
                    "referred_columns": fk["referred_columns"]
                }
            
            return {
                "name": schema_name,
                "columns": columns,
                "primary_keys": primary_keys,
                "foreign_keys": foreign_keys
            }
        except Exception as e:
            logger.error(f"Error getting target schema info: {str(e)}")
            return {}


# Create global legacy converter
legacy_converter = LegacyConverter()

@legacy_bp.route("/", methods=["GET"])
def legacy_home():
    """Legacy conversion home page"""
    return render_template("legacy_conversion.html")

@legacy_bp.route("/detect", methods=["POST"])
def detect_format():
    """Detect the format of a legacy file"""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    # Save the file to a temporary location
    temp_dir = tempfile.mkdtemp()
    file_path = os.path.join(temp_dir, file.filename)
    file.save(file_path)
    
    try:
        # Detect format
        format_scores = legacy_converter.detect_format(file_path)
        
        return jsonify({
            "formats": format_scores,
            "detected_format": max(format_scores.items(), key=lambda x: x[1])[0]
        })
    except Exception as e:
        logger.error(f"Error detecting format: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up temporary file
        try:
            os.remove(file_path)
            os.rmdir(temp_dir)
        except:
            pass

@legacy_bp.route("/analyze", methods=["POST"])
def analyze_file():
    """Analyze a legacy file"""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    # Save the file to a temporary location
    temp_dir = tempfile.mkdtemp()
    file_path = os.path.join(temp_dir, file.filename)
    file.save(file_path)
    
    try:
        # Analyze file
        analysis = legacy_converter.analyze_file(file_path)
        
        return jsonify(analysis)
    except Exception as e:
        logger.error(f"Error analyzing file: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up temporary file
        try:
            os.remove(file_path)
            os.rmdir(temp_dir)
        except:
            pass

@legacy_bp.route("/suggest-mappings", methods=["POST"])
def suggest_mappings():
    """Suggest column mappings for a legacy file"""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    target_schema = request.form.get("target_schema")
    ai_assistance_level = request.form.get("ai_assistance_level", "2")  # Default to auto-mapping
    
    try:
        ai_assistance_level = int(ai_assistance_level)
    except ValueError:
        ai_assistance_level = 2  # Default to auto-mapping if invalid
        
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    if not target_schema:
        return jsonify({"error": "Target schema not provided"}), 400
    
    # Save the file to a temporary location
    temp_dir = tempfile.mkdtemp()
    file_path = os.path.join(temp_dir, file.filename)
    file.save(file_path)
    
    try:
        # Suggest mappings using the AI assistance level
        config = ConversionConfig(
            source_format="auto",
            target_schema=target_schema,
            ai_assistance_level=ai_assistance_level
        )
        
        # Pass the config to ensure proper AI level is used
        mappings = legacy_converter.suggest_mappings(file_path, target_schema, config)
        
        # Determine which mappings should be automatically applied based on AI level
        for mapping in mappings:
            if ai_assistance_level == 0:  # None
                mapping.ai_suggested = False  # Don't mark as AI suggested at all
            elif ai_assistance_level == 1:  # Suggestions only
                # Mark as suggested but don't auto-apply
                mapping.auto_apply = False
            elif ai_assistance_level == 2:  # Auto-mapping
                # Auto-apply only high confidence mappings
                mapping.auto_apply = mapping.confidence > 0.75
            elif ai_assistance_level == 3:  # Full
                # Auto-apply all AI suggestions
                mapping.auto_apply = True
        
        # Convert to serializable format
        mapping_dicts = []
        for mapping in mappings:
            mapping_dict = {
                "source_column": mapping.source_column,
                "target_column": mapping.target_column,
                "required": mapping.required,
                "data_type": mapping.data_type,
                "validation_rules": mapping.validation_rules,
                "description": mapping.description,
                "confidence": mapping.confidence,
                "ai_suggested": mapping.ai_suggested,
                "auto_apply": getattr(mapping, 'auto_apply', False)
            }
            mapping_dicts.append(mapping_dict)
        
        # Include metadata about the AI process
        metadata = {
            "ai_assistance_level": ai_assistance_level,
            "assistance_description": [
                "Manual mapping only",
                "AI suggests mappings",
                "AI auto-maps high confidence fields",
                "AI fully manages mapping"
            ][ai_assistance_level],
            "domain_knowledge_applied": True,
            "property_assessment_optimized": True
        }
        
        return jsonify({
            "mappings": mapping_dicts,
            "metadata": metadata
        })
    except Exception as e:
        logger.error(f"Error suggesting mappings: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up temporary file
        try:
            os.remove(file_path)
            os.rmdir(temp_dir)
        except:
            pass

@legacy_bp.route("/convert", methods=["POST"])
def start_conversion():
    """Start a legacy data conversion"""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    
    if file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    
    # Get configuration from request
    config_data = json.loads(request.form.get("config", "{}"))
    
    try:
        # Create configuration object
        config = ConversionConfig.from_dict(config_data)
        
        # Save the file to a persistent location
        upload_dir = os.path.join("uploads", "legacy", config.conversion_id)
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        file.save(file_path)
        
        # Start conversion
        conversion_id = legacy_converter.start_conversion(file_path, config)
        
        return jsonify({
            "conversion_id": conversion_id,
            "status": "started",
            "message": "Conversion started successfully"
        })
    except Exception as e:
        logger.error(f"Error starting conversion: {str(e)}")
        return jsonify({"error": str(e)}), 500

@legacy_bp.route("/status/<conversion_id>", methods=["GET"])
def get_conversion_status(conversion_id):
    """Get the status of a conversion"""
    try:
        status = legacy_converter.get_conversion_status(conversion_id)
        return jsonify(status)
    except Exception as e:
        logger.error(f"Error getting conversion status: {str(e)}")
        return jsonify({"error": str(e)}), 500

@legacy_bp.route("/cancel/<conversion_id>", methods=["POST"])
def cancel_conversion(conversion_id):
    """Cancel a running conversion"""
    try:
        cancelled = legacy_converter.cancel_conversion(conversion_id)
        
        if cancelled:
            return jsonify({
                "conversion_id": conversion_id,
                "status": "cancelled",
                "message": "Conversion cancelled successfully"
            })
        else:
            return jsonify({
                "conversion_id": conversion_id,
                "status": "not_found",
                "message": "Conversion not found or already completed"
            }), 404
    except Exception as e:
        logger.error(f"Error cancelling conversion: {str(e)}")
        return jsonify({"error": str(e)}), 500

@legacy_bp.route("/report/<conversion_id>", methods=["GET"])
def get_conversion_report(conversion_id):
    """Get the report for a conversion"""
    try:
        status = legacy_converter.get_conversion_status(conversion_id)
        
        if "error" in status:
            return jsonify({"error": status["error"]}), 404
        
        if not status.get("report_file"):
            return jsonify({"error": "Report not available yet"}), 404
        
        # Serve the report file
        from flask import send_file
        return send_file(status["report_file"])
    except Exception as e:
        logger.error(f"Error getting conversion report: {str(e)}")
        return jsonify({"error": str(e)}), 500

def register_blueprint(app):
    """
    Register legacy conversion blueprint with the application
    
    Args:
        app: Flask application
    """
    app.register_blueprint(legacy_bp)
    logger.info("Legacy conversion system registered")
    
    # Import format handlers
    try:
        from legacy_formats import register_formats
        register_formats(format_registry)
        logger.info(f"Registered {len(format_registry)} legacy format handlers")
    except ImportError:
        logger.warning("Legacy format handlers not available")
    
    return legacy_converter


if __name__ == "__main__":
    # This is mainly for testing
    pass