"""
Power Query Agent Module

This module implements a specialized agent for data integration and
transformation using Power Query capabilities. It allows integration with
SQL Server and various data sources similar to Microsoft Power Query.
"""

import os
import json
import logging
import datetime
import time
from typing import Dict, List, Any, Optional, Union

from .base_agent import BaseAgent
from ..core import mcp_instance
from power_query import (
    power_query, PowerQueryDataSource, SQLServerDataSource, 
    PostgreSQLDataSource, CSVDataSource, ExcelDataSource
)

logger = logging.getLogger(__name__)

# Define common task types
TASK_REGISTER_DATA_SOURCE = "register_data_source"
TASK_TEST_CONNECTION = "test_connection"
TASK_EXECUTE_QUERY = "execute_query"
TASK_SAVE_QUERY = "save_query"
TASK_EXPORT_RESULTS = "export_results"
TASK_LIST_DATA_SOURCES = "list_data_sources"
TASK_LIST_QUERIES = "list_queries"
TASK_GET_DATA_SOURCE_METADATA = "get_data_source_metadata"
TASK_GET_SQL_SERVER_TABLES = "get_sql_server_tables"
TASK_GET_SQL_SERVER_TABLE_SCHEMA = "get_sql_server_table_schema"

class PowerQueryAgent(BaseAgent):
    """
    Agent responsible for data integration and transformation using Power Query
    """

    def __init__(self):
        """Initialize the power query agent"""
        super().__init__()
        self.capabilities = [
            TASK_REGISTER_DATA_SOURCE,
            TASK_TEST_CONNECTION,
            TASK_EXECUTE_QUERY,
            TASK_SAVE_QUERY,
            TASK_EXPORT_RESULTS,
            TASK_LIST_DATA_SOURCES,
            TASK_LIST_QUERIES,
            TASK_GET_DATA_SOURCE_METADATA,
            TASK_GET_SQL_SERVER_TABLES,
            TASK_GET_SQL_SERVER_TABLE_SCHEMA
        ]
        
        # Save results cache
        self.query_results = {}
        
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a power query task"""
        self.set_status("processing")
        self.last_activity = time.time()
        
        if not task_data or "task_type" not in task_data:
            self.set_status("idle")
            return {"error": "Invalid task data, missing task_type"}
            
        task_type = task_data["task_type"]
        
        try:
            if task_type == TASK_REGISTER_DATA_SOURCE:
                return self.register_data_source(task_data)
            elif task_type == TASK_TEST_CONNECTION:
                return self.test_connection(task_data)
            elif task_type == TASK_EXECUTE_QUERY:
                return self.execute_query(task_data)
            elif task_type == TASK_SAVE_QUERY:
                return self.save_query(task_data)
            elif task_type == TASK_EXPORT_RESULTS:
                return self.export_results(task_data)
            elif task_type == TASK_LIST_DATA_SOURCES:
                return self.list_data_sources(task_data)
            elif task_type == TASK_LIST_QUERIES:
                return self.list_queries(task_data)
            elif task_type == TASK_GET_DATA_SOURCE_METADATA:
                return self.get_data_source_metadata(task_data)
            elif task_type == TASK_GET_SQL_SERVER_TABLES:
                return self.get_sql_server_tables(task_data)
            elif task_type == TASK_GET_SQL_SERVER_TABLE_SCHEMA:
                return self.get_sql_server_table_schema(task_data)
            else:
                self.set_status("idle")
                return {"error": f"Unsupported task type: {task_type}"}
        except Exception as e:
            logger.error(f"Error processing task: {str(e)}")
            self.set_status("idle")
            return {"error": str(e)}
            
    def register_data_source(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Register a new data source"""
        source_type = task_data.get("source_type")
        source_name = task_data.get("source_name")
        source_description = task_data.get("description", "")
        
        if not source_type or not source_name:
            return {"error": "Missing required parameters: source_type and source_name"}
            
        try:
            data_source = None
            
            if source_type == "sql_server":
                data_source = SQLServerDataSource(
                    name=source_name,
                    server=task_data.get("server"),
                    database=task_data.get("database"),
                    username=task_data.get("username"),
                    password=task_data.get("password"),
                    windows_auth=task_data.get("windows_auth", False),
                    port=task_data.get("port", 1433),
                    description=source_description
                )
            elif source_type == "postgresql":
                data_source = PostgreSQLDataSource(
                    name=source_name,
                    host=task_data.get("host"),
                    database=task_data.get("database"),
                    username=task_data.get("username"),
                    password=task_data.get("password"),
                    port=task_data.get("port", 5432),
                    description=source_description
                )
            elif source_type == "csv":
                data_source = CSVDataSource(
                    name=source_name,
                    file_path=task_data.get("file_path"),
                    description=source_description
                )
            elif source_type == "excel":
                data_source = ExcelDataSource(
                    name=source_name,
                    file_path=task_data.get("file_path"),
                    sheet_name=task_data.get("sheet_name"),
                    description=source_description
                )
            else:
                return {"error": f"Unsupported data source type: {source_type}"}
                
            success = power_query.register_data_source(data_source)
            
            if success:
                return {
                    "success": True,
                    "message": f"Data source '{source_name}' registered successfully",
                    "data_source": data_source.get_metadata()
                }
            else:
                return {"error": "Failed to register data source"}
                
        except Exception as e:
            logger.error(f"Error registering data source: {str(e)}")
            return {"error": str(e)}
            
    def test_connection(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test connection to a data source"""
        source_name = task_data.get("source_name")
        
        if not source_name:
            return {"error": "Missing required parameter: source_name"}
            
        try:
            data_source = power_query.get_data_source(source_name)
            
            if not data_source:
                return {"error": f"Data source not found: {source_name}"}
                
            success, message = data_source.test_connection()
            
            return {
                "success": success,
                "message": message,
                "data_source": data_source.get_metadata()
            }
                
        except Exception as e:
            logger.error(f"Error testing connection: {str(e)}")
            return {"error": str(e)}
            
    def execute_query(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a power query"""
        query_definition = task_data.get("query")
        result_id = task_data.get("result_id", f"result_{int(time.time())}")
        
        if not query_definition:
            return {"error": "Missing required parameter: query"}
            
        try:
            result = power_query.execute_query(query_definition)
            
            # Cache the results if successful
            if "error" not in result:
                self.query_results[result_id] = result
                
                # Add result_id to the response
                result["result_id"] = result_id
                
            return result
                
        except Exception as e:
            logger.error(f"Error executing query: {str(e)}")
            return {"error": str(e)}
            
    def save_query(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Save a query definition for later use"""
        query_name = task_data.get("query_name")
        query_definition = task_data.get("query")
        description = task_data.get("description", "")
        
        if not query_name or not query_definition:
            return {"error": "Missing required parameters: query_name and query"}
            
        try:
            success = power_query.save_query(
                name=query_name,
                query_definition=query_definition,
                description=description
            )
            
            if success:
                return {
                    "success": True,
                    "message": f"Query '{query_name}' saved successfully"
                }
            else:
                return {"error": "Failed to save query"}
                
        except Exception as e:
            logger.error(f"Error saving query: {str(e)}")
            return {"error": str(e)}
            
    def export_results(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Export query results to file"""
        result_id = task_data.get("result_id")
        export_type = task_data.get("export_type", "csv")
        file_path = task_data.get("file_path")
        sheet_name = task_data.get("sheet_name", "Data")
        
        if not result_id or not file_path:
            return {"error": "Missing required parameters: result_id and file_path"}
            
        if result_id not in self.query_results:
            return {"error": f"No results found for ID: {result_id}"}
            
        try:
            # Get the results from cache
            result = self.query_results[result_id]
            
            # The data might be in the data field of the result
            if not hasattr(result, "to_csv") and "data" in result:
                # Convert the data back to a DataFrame
                import pandas as pd
                data = pd.DataFrame(result["data"])
            else:
                data = result
                
            # Export based on type
            if export_type == "csv":
                success = power_query.export_to_csv(data, file_path)
            elif export_type == "excel":
                success = power_query.export_to_excel(data, file_path, sheet_name)
            else:
                return {"error": f"Unsupported export type: {export_type}"}
                
            if success:
                return {
                    "success": True,
                    "message": f"Results exported to {file_path} successfully",
                    "file_path": file_path,
                    "export_type": export_type
                }
            else:
                return {"error": "Failed to export results"}
                
        except Exception as e:
            logger.error(f"Error exporting results: {str(e)}")
            return {"error": str(e)}
            
    def list_data_sources(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """List all registered data sources"""
        try:
            data_sources = power_query.list_data_sources()
            
            return {
                "success": True,
                "data_sources": data_sources,
                "count": len(data_sources)
            }
                
        except Exception as e:
            logger.error(f"Error listing data sources: {str(e)}")
            return {"error": str(e)}
            
    def list_queries(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """List all saved queries"""
        try:
            queries = power_query.list_queries()
            
            return {
                "success": True,
                "queries": queries,
                "count": len(queries)
            }
                
        except Exception as e:
            logger.error(f"Error listing queries: {str(e)}")
            return {"error": str(e)}
            
    def get_data_source_metadata(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get metadata for a specific data source"""
        source_name = task_data.get("source_name")
        
        if not source_name:
            return {"error": "Missing required parameter: source_name"}
            
        try:
            data_source = power_query.get_data_source(source_name)
            
            if not data_source:
                return {"error": f"Data source not found: {source_name}"}
                
            return {
                "success": True,
                "data_source": data_source.get_metadata()
            }
                
        except Exception as e:
            logger.error(f"Error getting data source metadata: {str(e)}")
            return {"error": str(e)}
            
    def get_sql_server_tables(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get tables from a SQL Server data source"""
        source_name = task_data.get("source_name")
        
        if not source_name:
            return {"error": "Missing required parameter: source_name"}
            
        try:
            data_source = power_query.get_data_source(source_name)
            
            if not data_source:
                return {"error": f"Data source not found: {source_name}"}
                
            if not isinstance(data_source, (SQLServerDataSource, PostgreSQLDataSource)):
                return {"error": f"Data source '{source_name}' is not a SQL database source"}
                
            # Connect if not already connected
            if not data_source.is_connected:
                data_source.connect()
                
            tables = data_source.get_tables()
            
            return {
                "success": True,
                "tables": tables,
                "count": len(tables)
            }
                
        except Exception as e:
            logger.error(f"Error getting SQL Server tables: {str(e)}")
            return {"error": str(e)}
            
    def get_sql_server_table_schema(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get schema for a specific SQL Server table"""
        source_name = task_data.get("source_name")
        table_name = task_data.get("table_name")
        
        if not source_name or not table_name:
            return {"error": "Missing required parameters: source_name and table_name"}
            
        try:
            data_source = power_query.get_data_source(source_name)
            
            if not data_source:
                return {"error": f"Data source not found: {source_name}"}
                
            if not isinstance(data_source, SQLServerDataSource):
                return {"error": f"Data source '{source_name}' is not a SQL Server source"}
                
            # Connect if not already connected
            if not data_source.is_connected:
                data_source.connect()
                
            schema = data_source.get_table_schema(table_name)
            
            return {
                "success": True,
                "table_name": table_name,
                "schema": schema,
                "column_count": len(schema)
            }
                
        except Exception as e:
            logger.error(f"Error getting SQL Server table schema: {str(e)}")
            return {"error": str(e)}