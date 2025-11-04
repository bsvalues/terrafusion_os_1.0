"""
Database API Module

This module provides a standardized interface for third-party applications
and microservices to interact with the Benton County GIS database through 
Supabase or direct database connections.
"""

import os
import logging
import json
from typing import Dict, Any, List, Optional, Union
from flask import current_app

# Configure logging
logger = logging.getLogger(__name__)

# Import database clients conditionally
try:
    from supabase_client import (
        get_data, insert_data, update_data, delete_data,
        get_supabase_client
    )
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    logger.warning("Supabase client not available, using SQLAlchemy only")

# Import SQLAlchemy models and db connection
from app import db
from models import (
    User, File, GISProject, AuditLog, 
    QueryLog, MFASetup, IndexedDocument
)

# Import config utilities
from config_loader import is_supabase_enabled, get_database_config

class DatabaseAPI:
    """API for interacting with the database through Supabase or SQLAlchemy"""
    
    def __init__(self):
        """Initialize the database API"""
        self.use_supabase = is_supabase_enabled() and HAS_SUPABASE
        self.db_config = get_database_config()
        
        if self.use_supabase:
            logger.info("DatabaseAPI initialized with Supabase")
        else:
            logger.info("DatabaseAPI initialized with SQLAlchemy")
    
    def query(self, table_name: str, filter_params: Optional[Dict[str, Any]] = None, 
             limit: Optional[int] = None, offset: Optional[int] = None,
             order_by: Optional[str] = None, order_dir: str = "asc") -> Dict[str, Any]:
        """
        Query data from the database
        
        Args:
            table_name: Name of the table or model to query
            filter_params: Optional filtering parameters
            limit: Optional result limit
            offset: Optional result offset
            order_by: Optional column to order by
            order_dir: Order direction ("asc" or "desc")
            
        Returns:
            Dict with query results or error information
        """
        if self.use_supabase:
            # Use Supabase client
            query_params = {}
            if limit is not None:
                query_params["limit"] = limit
            if offset is not None:
                query_params["offset"] = offset
            if order_by:
                query_params["column"] = order_by
                query_params["order"] = order_dir
            if filter_params:
                for key, value in filter_params.items():
                    query_params["filter"] = key
                    query_params["value"] = value
                    # Note: this only handles one filter; would need to be extended for multiple
            
            return get_data(table_name, query_params)
        else:
            # Use SQLAlchemy
            try:
                # Map table_name to SQLAlchemy model
                model = self._get_model_by_name(table_name)
                if not model:
                    return {"error": f"Unknown table or model: {table_name}"}
                
                # Build query
                query = db.session.query(model)
                
                # Apply filters
                if filter_params:
                    for key, value in filter_params.items():
                        if hasattr(model, key):
                            query = query.filter(getattr(model, key) == value)
                
                # Apply ordering
                if order_by and hasattr(model, order_by):
                    col = getattr(model, order_by)
                    if order_dir.lower() == "desc":
                        col = col.desc()
                    query = query.order_by(col)
                
                # Apply limit and offset
                if offset is not None:
                    query = query.offset(offset)
                if limit is not None:
                    query = query.limit(limit)
                
                # Execute query
                results = query.all()
                
                # Convert to dictionary
                return {
                    "data": [self._model_to_dict(item) for item in results]
                }
            except Exception as e:
                logger.error(f"Error querying data: {str(e)}")
                return {"error": str(e)}
    
    def insert(self, table_name: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Insert data into the database
        
        Args:
            table_name: Name of the table or model to insert into
            data: Data to insert
            
        Returns:
            Dict with result or error information
        """
        if self.use_supabase:
            # Use Supabase client
            return insert_data(table_name, data)
        else:
            # Use SQLAlchemy
            try:
                # Map table_name to SQLAlchemy model
                model = self._get_model_by_name(table_name)
                if not model:
                    return {"error": f"Unknown table or model: {table_name}"}
                
                # Create new record
                new_record = model(**data)
                db.session.add(new_record)
                db.session.commit()
                
                # Return the created record
                return {"data": self._model_to_dict(new_record)}
            except Exception as e:
                db.session.rollback()
                logger.error(f"Error inserting data: {str(e)}")
                return {"error": str(e)}
    
    def update(self, table_name: str, id_value: Any, data: Dict[str, Any], 
              id_column: str = "id") -> Dict[str, Any]:
        """
        Update data in the database
        
        Args:
            table_name: Name of the table or model to update
            id_value: Value of the ID column for the record to update
            data: Updated data
            id_column: Column name for the ID field (default: "id")
            
        Returns:
            Dict with result or error information
        """
        if self.use_supabase:
            # Use Supabase client
            return update_data(table_name, data, id_column, id_value)
        else:
            # Use SQLAlchemy
            try:
                # Map table_name to SQLAlchemy model
                model = self._get_model_by_name(table_name)
                if not model:
                    return {"error": f"Unknown table or model: {table_name}"}
                
                # Find record to update
                record = db.session.query(model).filter(
                    getattr(model, id_column) == id_value
                ).first()
                
                if not record:
                    return {"error": f"Record not found with {id_column}={id_value}"}
                
                # Update record attributes
                for key, value in data.items():
                    if hasattr(record, key):
                        setattr(record, key, value)
                
                db.session.commit()
                
                # Return the updated record
                return {"data": self._model_to_dict(record)}
            except Exception as e:
                db.session.rollback()
                logger.error(f"Error updating data: {str(e)}")
                return {"error": str(e)}
    
    def delete(self, table_name: str, id_value: Any, 
              id_column: str = "id") -> Dict[str, Any]:
        """
        Delete data from the database
        
        Args:
            table_name: Name of the table or model to delete from
            id_value: Value of the ID column for the record to delete
            id_column: Column name for the ID field (default: "id")
            
        Returns:
            Dict with result or error information
        """
        if self.use_supabase:
            # Use Supabase client
            return delete_data(table_name, id_column, id_value)
        else:
            # Use SQLAlchemy
            try:
                # Map table_name to SQLAlchemy model
                model = self._get_model_by_name(table_name)
                if not model:
                    return {"error": f"Unknown table or model: {table_name}"}
                
                # Find record to delete
                record = db.session.query(model).filter(
                    getattr(model, id_column) == id_value
                ).first()
                
                if not record:
                    return {"error": f"Record not found with {id_column}={id_value}"}
                
                # Delete record
                db.session.delete(record)
                db.session.commit()
                
                return {"success": True}
            except Exception as e:
                db.session.rollback()
                logger.error(f"Error deleting data: {str(e)}")
                return {"error": str(e)}
    
    def execute_raw_query(self, query: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute a raw SQL query (for advanced operations)
        
        Args:
            query: SQL query string
            params: Query parameters
            
        Returns:
            Dict with query results or error information
        """
        if self.use_supabase:
            # Get Supabase client
            client = get_supabase_client()
            if not client:
                return {"error": "Supabase client not available"}
                
            try:
                # Execute the query
                # Note: This uses the Supabase rpc function, which must be defined in Supabase
                response = client.rpc("run_query", {"query_text": query, "params": params or {}}).execute()
                return {"data": response.data}
            except Exception as e:
                logger.error(f"Error executing raw query: {str(e)}")
                return {"error": str(e)}
        else:
            # Use SQLAlchemy
            try:
                result = db.session.execute(query, params or {})
                
                if result.returns_rows:
                    # Convert result to list of dicts
                    columns = result.keys()
                    rows = [dict(zip(columns, row)) for row in result.fetchall()]
                    return {"data": rows}
                else:
                    # For operations like INSERT, UPDATE, DELETE
                    db.session.commit()
                    return {"success": True, "rowcount": result.rowcount}
            except Exception as e:
                db.session.rollback()
                logger.error(f"Error executing raw query: {str(e)}")
                return {"error": str(e)}
    
    def get_schema(self, table_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Get database schema information
        
        Args:
            table_name: Optional specific table to get schema for
            
        Returns:
            Dict with schema information
        """
        if table_name:
            # Get schema for specific table
            model = self._get_model_by_name(table_name)
            if not model:
                return {"error": f"Unknown table or model: {table_name}"}
                
            return {"schema": self._get_model_schema(model)}
        else:
            # Get schema for all tables
            schemas = {}
            for model_name, model in self._get_all_models().items():
                schemas[model_name] = self._get_model_schema(model)
                
            return {"schemas": schemas}
    
    # Helper methods
    
    def _get_model_by_name(self, table_name: str) -> Any:
        """Map table name to SQLAlchemy model"""
        models = {
            "users": User,
            "files": File,
            "gis_projects": GISProject,
            "audit_logs": AuditLog,
            "query_logs": QueryLog,
            "mfa_setup": MFASetup,
            "indexed_documents": IndexedDocument,
            # Add more models as needed
        }
        
        return models.get(table_name.lower())
    
    def _get_all_models(self) -> Dict[str, Any]:
        """Get all available models"""
        return {
            "users": User,
            "files": File,
            "gis_projects": GISProject,
            "audit_logs": AuditLog,
            "query_logs": QueryLog,
            "mfa_setup": MFASetup,
            "indexed_documents": IndexedDocument,
            # Add more models as needed
        }
    
    def _model_to_dict(self, model: Any) -> Dict[str, Any]:
        """Convert SQLAlchemy model to dictionary"""
        result = {}
        for column in model.__table__.columns:
            value = getattr(model, column.name)
            result[column.name] = value
            
        return result
    
    def _get_model_schema(self, model: Any) -> Dict[str, Any]:
        """Get schema information for SQLAlchemy model"""
        schema = {
            "table_name": model.__tablename__,
            "columns": {}
        }
        
        for column in model.__table__.columns:
            schema["columns"][column.name] = {
                "type": str(column.type),
                "nullable": column.nullable,
                "primary_key": column.primary_key,
                "default": str(column.default) if column.default else None,
            }
            
        return schema

# Create singleton instance
db_api = DatabaseAPI()