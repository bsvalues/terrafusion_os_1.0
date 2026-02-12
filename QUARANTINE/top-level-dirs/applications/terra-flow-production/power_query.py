"""
Power Query Module

This module provides functionality similar to Microsoft Power Query,
allowing for data import, transformation, and querying from various sources
including SQL Server, CSV files, and other common data formats.
"""

import os
import json
import logging
import datetime
import urllib.parse
from typing import Dict, List, Any, Optional, Union, Tuple

# Database connectors
try:
    import pandas as pd
    import numpy as np
    import sqlalchemy
    from sqlalchemy import create_engine, text
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False
    
logger = logging.getLogger(__name__)

# Configuration
DEFAULT_CONNECTION_TIMEOUT = 30  # seconds
ALLOWED_DATA_SOURCES = {
    'sql_server': True,
    'postgresql': True,
    'mysql': True,
    'oracle': True,
    'csv': True,
    'excel': True,
    'json': True,
    'xml': True,
    'geojson': True,
    'shapefile': True
}

class PowerQueryDataSource:
    """Base class for all data sources in the Power Query module"""
    
    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        self.connection_string = None
        self.is_connected = False
        self.last_connect_time = None
        self.connection_params = {}
        
    def connect(self) -> bool:
        """Connect to the data source"""
        self.last_connect_time = datetime.datetime.now()
        return True
        
    def disconnect(self) -> bool:
        """Disconnect from the data source"""
        self.is_connected = False
        return True
        
    def get_metadata(self) -> Dict[str, Any]:
        """Get metadata about the data source"""
        return {
            "name": self.name,
            "description": self.description,
            "type": self.__class__.__name__,
            "is_connected": self.is_connected,
            "last_connect_time": self.last_connect_time.isoformat() if self.last_connect_time else None
        }
        
    def test_connection(self) -> Tuple[bool, str]:
        """Test the connection to the data source"""
        try:
            success = self.connect()
            if success:
                return True, "Connection successful"
            else:
                return False, "Connection failed"
        except Exception as e:
            return False, f"Connection error: {str(e)}"
        finally:
            self.disconnect()


class SQLServerDataSource(PowerQueryDataSource):
    """SQL Server data source"""
    
    def __init__(self, name: str, server: str, database: str, 
                 username: Optional[str] = None, password: Optional[str] = None, 
                 windows_auth: bool = False, port: int = 1433,
                 description: str = ""):
        super().__init__(name, description)
        self.server = server
        self.database = database
        self.username = username
        self.password = password
        self.windows_auth = windows_auth
        self.port = port
        self.engine = None
        
    def connect(self) -> bool:
        """Connect to SQL Server"""
        if not HAS_PANDAS:
            logger.error("Cannot connect to SQL Server: pandas or sqlalchemy not available")
            return False
            
        try:
            # Build connection string
            params = {}
            if self.windows_auth:
                conn_str = f"mssql+pyodbc://{self.server}:{self.port}/{self.database}?driver=ODBC+Driver+17+for+SQL+Server&trusted_connection=yes"
            else:
                # URL encode username and password
                username = urllib.parse.quote_plus(self.username) if self.username else ''
                password = urllib.parse.quote_plus(self.password) if self.password else ''
                conn_str = f"mssql+pyodbc://{username}:{password}@{self.server}:{self.port}/{self.database}?driver=ODBC+Driver+17+for+SQL+Server"
            
            self.connection_string = conn_str
            self.engine = create_engine(conn_str)
            
            # Test connection by executing simple query
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            self.is_connected = True
            self.last_connect_time = datetime.datetime.now()
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to SQL Server: {str(e)}")
            self.is_connected = False
            return False
    
    def disconnect(self) -> bool:
        """Disconnect from SQL Server"""
        if self.engine:
            self.engine.dispose()
        self.is_connected = False
        return True
    
    def execute_query(self, query: str) -> Any:
        """Execute a SQL query against SQL Server"""
        if not HAS_PANDAS:
            logger.error("Cannot execute query: pandas not available")
            return None
            
        if not self.is_connected:
            self.connect()
            
        try:
            df = pd.read_sql_query(text(query), self.engine)
            return df
        except Exception as e:
            logger.error(f"Error executing SQL query: {str(e)}")
            return None
    
    def get_tables(self) -> List[str]:
        """Get list of tables in the database"""
        if not HAS_PANDAS:
            logger.error("Cannot get tables: pandas not available")
            return []
            
        if not self.is_connected:
            self.connect()
            
        try:
            query = """
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_TYPE = 'BASE TABLE'
            ORDER BY TABLE_NAME
            """
            df = pd.read_sql_query(text(query), self.engine)
            return df['TABLE_NAME'].tolist()
        except Exception as e:
            logger.error(f"Error getting tables: {str(e)}")
            return []
    
    def get_table_schema(self, table_name: str) -> List[Dict[str, str]]:
        """Get schema for a specific table"""
        if not HAS_PANDAS:
            logger.error("Cannot get table schema: pandas not available")
            return []
            
        if not self.is_connected:
            self.connect()
            
        try:
            query = f"""
            SELECT 
                COLUMN_NAME, 
                DATA_TYPE, 
                CHARACTER_MAXIMUM_LENGTH,
                IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '{table_name}'
            ORDER BY ORDINAL_POSITION
            """
            df = pd.read_sql_query(text(query), self.engine)
            
            schema = []
            for _, row in df.iterrows():
                schema.append({
                    "name": row['COLUMN_NAME'],
                    "type": row['DATA_TYPE'],
                    "max_length": row['CHARACTER_MAXIMUM_LENGTH'],
                    "nullable": row['IS_NULLABLE'] == 'YES'
                })
            return schema
        except Exception as e:
            logger.error(f"Error getting table schema: {str(e)}")
            return []


class PostgreSQLDataSource(PowerQueryDataSource):
    """PostgreSQL data source"""
    
    def __init__(self, name: str, host: str, database: str, 
                 username: str, password: str, port: int = 5432,
                 description: str = ""):
        super().__init__(name, description)
        self.host = host
        self.database = database
        self.username = username
        self.password = password
        self.port = port
        self.engine = None
        
    def connect(self) -> bool:
        """Connect to PostgreSQL"""
        if not HAS_PANDAS:
            logger.error("Cannot connect to PostgreSQL: pandas or sqlalchemy not available")
            return False
            
        try:
            # Build connection string
            username = urllib.parse.quote_plus(self.username)
            password = urllib.parse.quote_plus(self.password)
            conn_str = f"postgresql://{username}:{password}@{self.host}:{self.port}/{self.database}"
            
            self.connection_string = conn_str
            self.engine = create_engine(conn_str)
            
            # Test connection
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            self.is_connected = True
            self.last_connect_time = datetime.datetime.now()
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to PostgreSQL: {str(e)}")
            self.is_connected = False
            return False
    
    def disconnect(self) -> bool:
        """Disconnect from PostgreSQL"""
        if self.engine:
            self.engine.dispose()
        self.is_connected = False
        return True
    
    def execute_query(self, query: str) -> Any:
        """Execute a SQL query against PostgreSQL"""
        if not HAS_PANDAS:
            logger.error("Cannot execute query: pandas not available")
            return None
            
        if not self.is_connected:
            self.connect()
            
        try:
            df = pd.read_sql_query(text(query), self.engine)
            return df
        except Exception as e:
            logger.error(f"Error executing SQL query: {str(e)}")
            return None
    
    def get_tables(self) -> List[str]:
        """Get list of tables in the database"""
        if not HAS_PANDAS:
            logger.error("Cannot get tables: pandas not available")
            return []
            
        if not self.is_connected:
            self.connect()
            
        try:
            query = """
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
            """
            df = pd.read_sql_query(text(query), self.engine)
            return df['table_name'].tolist()
        except Exception as e:
            logger.error(f"Error getting tables: {str(e)}")
            return []
            
    def get_table_schema(self, table_name: str) -> List[Dict[str, str]]:
        """Get schema for a specific table"""
        if not HAS_PANDAS:
            logger.error("Cannot get table schema: pandas not available")
            return []
            
        if not self.is_connected:
            self.connect()
            
        try:
            # Sanitize table name to prevent SQL injection
            table_name = table_name.replace("'", "''")
            
            query = f"""
            SELECT 
                column_name, 
                data_type,
                character_maximum_length,
                column_default,
                is_nullable
            FROM 
                information_schema.columns
            WHERE 
                table_schema = 'public'
                AND table_name = '{table_name}'
            ORDER BY 
                ordinal_position
            """
            
            df = pd.read_sql_query(text(query), self.engine)
            
            # Convert to list of dictionaries
            schema = []
            for _, row in df.iterrows():
                column_info = {
                    "name": row["column_name"],
                    "type": row["data_type"],
                    "length": int(row["character_maximum_length"]) if row["character_maximum_length"] and not pd.isna(row["character_maximum_length"]) else None,
                    "default": row["column_default"],
                    "nullable": row["is_nullable"] == "YES"
                }
                schema.append(column_info)
                
            return schema
        except Exception as e:
            logger.error(f"Error getting schema for table {table_name}: {str(e)}")
            return []
            
    def get_metadata(self) -> Dict[str, Any]:
        """Get metadata about the data source"""
        metadata = super().get_metadata()
        
        # Add PostgreSQL-specific information
        metadata.update({
            "connection_info": {
                "host": self.host,
                "database": self.database,
                "port": self.port
            }
        })
        
        # Try to get table count if connected
        if self.is_connected:
            try:
                tables = self.get_tables()
                metadata["table_count"] = len(tables)
            except Exception as e:
                logger.error(f"Error getting table count for metadata: {str(e)}")
                
        return metadata


class CSVDataSource(PowerQueryDataSource):
    """CSV file data source"""
    
    def __init__(self, name: str, file_path: str, description: str = ""):
        super().__init__(name, description)
        self.file_path = file_path
        self.data = None
        
    def connect(self) -> bool:
        """Load CSV file"""
        if not HAS_PANDAS:
            logger.error("Cannot load CSV: pandas not available")
            return False
            
        try:
            if not os.path.exists(self.file_path):
                logger.error(f"CSV file not found: {self.file_path}")
                return False
                
            self.data = pd.read_csv(self.file_path)
            self.is_connected = True
            self.last_connect_time = datetime.datetime.now()
            return True
            
        except Exception as e:
            logger.error(f"Error loading CSV file: {str(e)}")
            self.is_connected = False
            return False
    
    def disconnect(self) -> bool:
        """Release CSV data"""
        self.data = None
        self.is_connected = False
        return True
    
    def get_data(self) -> Any:
        """Get the CSV data as a pandas DataFrame"""
        if not self.is_connected:
            self.connect()
            
        return self.data
    
    def get_preview(self, rows: int = 5) -> Dict[str, Any]:
        """Get a preview of the CSV data"""
        if not self.is_connected:
            self.connect()
            
        if self.data is None:
            return {"error": "No data available"}
            
        try:
            preview_data = self.data.head(rows)
            return {
                "columns": list(preview_data.columns),
                "data": preview_data.to_dict(orient='records'),
                "total_rows": len(self.data)
            }
        except Exception as e:
            logger.error(f"Error getting CSV preview: {str(e)}")
            return {"error": str(e)}


class ExcelDataSource(PowerQueryDataSource):
    """Excel file data source"""
    
    def __init__(self, name: str, file_path: str, sheet_name: Optional[str] = None, 
                 description: str = ""):
        super().__init__(name, description)
        self.file_path = file_path
        self.sheet_name = sheet_name
        self.data = None
        self.sheets = []
        
    def connect(self) -> bool:
        """Load Excel file"""
        if not HAS_PANDAS:
            logger.error("Cannot load Excel: pandas not available")
            return False
            
        try:
            if not os.path.exists(self.file_path):
                logger.error(f"Excel file not found: {self.file_path}")
                return False
                
            # If no sheet specified, just load the Excel file to get sheet names
            excel_file = pd.ExcelFile(self.file_path)
            self.sheets = excel_file.sheet_names
            
            # If a specific sheet is requested, load it
            if self.sheet_name:
                self.data = pd.read_excel(self.file_path, sheet_name=self.sheet_name)
            
            self.is_connected = True
            self.last_connect_time = datetime.datetime.now()
            return True
            
        except Exception as e:
            logger.error(f"Error loading Excel file: {str(e)}")
            self.is_connected = False
            return False
    
    def disconnect(self) -> bool:
        """Release Excel data"""
        self.data = None
        self.is_connected = False
        return True
    
    def get_sheet_names(self) -> List[str]:
        """Get list of sheet names in the Excel file"""
        if not self.is_connected:
            self.connect()
            
        return self.sheets
    
    def load_sheet(self, sheet_name: str) -> bool:
        """Load a specific sheet from the Excel file"""
        if not HAS_PANDAS:
            logger.error("Cannot load Excel sheet: pandas not available")
            return False
            
        try:
            self.sheet_name = sheet_name
            self.data = pd.read_excel(self.file_path, sheet_name=sheet_name)
            return True
        except Exception as e:
            logger.error(f"Error loading Excel sheet: {str(e)}")
            return False
    
    def get_data(self) -> Any:
        """Get the Excel data as a pandas DataFrame"""
        if not self.is_connected:
            self.connect()
            
        if self.data is None and self.sheet_name:
            self.load_sheet(self.sheet_name)
            
        return self.data
    
    def get_preview(self, sheet_name: Optional[str] = None, rows: int = 5) -> Dict[str, Any]:
        """Get a preview of the Excel data"""
        if not self.is_connected:
            self.connect()
            
        if sheet_name and sheet_name != self.sheet_name:
            self.load_sheet(sheet_name)
            
        if self.data is None:
            if not self.sheet_name and len(self.sheets) > 0:
                # Load the first sheet as a default
                self.load_sheet(self.sheets[0])
            else:
                return {"error": "No data available"}
            
        try:
            preview_data = self.data.head(rows)
            return {
                "sheet_name": self.sheet_name,
                "available_sheets": self.sheets,
                "columns": list(preview_data.columns),
                "data": preview_data.to_dict(orient='records'),
                "total_rows": len(self.data)
            }
        except Exception as e:
            logger.error(f"Error getting Excel preview: {str(e)}")
            return {"error": str(e)}


class PowerQueryTransformation:
    """Base class for data transformations in Power Query"""
    
    def __init__(self, name: str, description: str = ""):
        self.name = name
        self.description = description
        
    def transform(self, data: Any) -> Any:
        """Apply transformation to data"""
        # Base transform just returns data unchanged
        return data
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get metadata about the transformation"""
        return {
            "name": self.name,
            "description": self.description,
            "type": self.__class__.__name__
        }


class FilterTransformation(PowerQueryTransformation):
    """Filter data based on a condition"""
    
    def __init__(self, column: str, operator: str, value: Any, name: str = "Filter", 
                 description: str = ""):
        super().__init__(name, description)
        self.column = column
        self.operator = operator
        self.value = value
        
    def transform(self, data: Any) -> Any:
        """Apply filter transformation to data"""
        if not HAS_PANDAS or not isinstance(data, pd.DataFrame):
            logger.error("Cannot apply filter: not a pandas DataFrame")
            return data
            
        try:
            if self.column not in data.columns:
                logger.error(f"Column '{self.column}' not found in data")
                return data
                
            if self.operator == "equals":
                result = data[data[self.column] == self.value]
            elif self.operator == "not_equals":
                result = data[data[self.column] != self.value]
            elif self.operator == "greater_than":
                result = data[data[self.column] > self.value]
            elif self.operator == "less_than":
                result = data[data[self.column] < self.value]
            elif self.operator == "greater_than_equals":
                result = data[data[self.column] >= self.value]
            elif self.operator == "less_than_equals":
                result = data[data[self.column] <= self.value]
            elif self.operator == "contains":
                result = data[data[self.column].astype(str).str.contains(str(self.value), na=False)]
            elif self.operator == "starts_with":
                result = data[data[self.column].astype(str).str.startswith(str(self.value), na=False)]
            elif self.operator == "ends_with":
                result = data[data[self.column].astype(str).str.endswith(str(self.value), na=False)]
            else:
                logger.error(f"Unknown operator: {self.operator}")
                return data
                
            return result
        except Exception as e:
            logger.error(f"Error applying filter: {str(e)}")
            return data


class SortTransformation(PowerQueryTransformation):
    """Sort data by one or more columns"""
    
    def __init__(self, columns: List[str], ascending: Union[bool, List[bool]] = True, 
                 name: str = "Sort", description: str = ""):
        super().__init__(name, description)
        self.columns = columns
        self.ascending = ascending
        
    def transform(self, data: Any) -> Any:
        """Apply sort transformation to data"""
        if not HAS_PANDAS or not isinstance(data, pd.DataFrame):
            logger.error("Cannot apply sort: not a pandas DataFrame")
            return data
            
        try:
            # Check if all columns exist
            missing_columns = [col for col in self.columns if col not in data.columns]
            if missing_columns:
                logger.error(f"Columns not found: {missing_columns}")
                return data
                
            result = data.sort_values(by=self.columns, ascending=self.ascending)
            return result
        except Exception as e:
            logger.error(f"Error applying sort: {str(e)}")
            return data


class GroupByTransformation(PowerQueryTransformation):
    """Group data by one or more columns and aggregate"""
    
    def __init__(self, group_columns: List[str], aggregations: Dict[str, str], 
                 name: str = "Group By", description: str = ""):
        super().__init__(name, description)
        self.group_columns = group_columns
        self.aggregations = aggregations
        
    def transform(self, data: Any) -> Any:
        """Apply groupby transformation to data"""
        if not HAS_PANDAS or not isinstance(data, pd.DataFrame):
            logger.error("Cannot apply groupby: not a pandas DataFrame")
            return data
            
        try:
            # Check if all columns exist
            missing_columns = [col for col in self.group_columns if col not in data.columns]
            missing_agg_columns = [col for col in self.aggregations.keys() if col not in data.columns]
            
            if missing_columns or missing_agg_columns:
                if missing_columns:
                    logger.error(f"Group columns not found: {missing_columns}")
                if missing_agg_columns:
                    logger.error(f"Aggregation columns not found: {missing_agg_columns}")
                return data
                
            # Build aggregation dictionary for pandas
            agg_dict = {}
            for col, agg_func in self.aggregations.items():
                agg_dict[col] = agg_func
                
            result = data.groupby(self.group_columns, as_index=False).agg(agg_dict)
            return result
        except Exception as e:
            logger.error(f"Error applying groupby: {str(e)}")
            return data


class PivotTransformation(PowerQueryTransformation):
    """Pivot data based on row and column values"""
    
    def __init__(self, index: Union[str, List[str]], columns: str, values: str, 
                 aggfunc: str = 'sum', name: str = "Pivot", description: str = ""):
        super().__init__(name, description)
        self.index = index
        self.columns = columns
        self.values = values
        self.aggfunc = aggfunc
        
    def transform(self, data: Any) -> Any:
        """Apply pivot transformation to data"""
        if not HAS_PANDAS or not isinstance(data, pd.DataFrame):
            logger.error("Cannot apply pivot: not a pandas DataFrame")
            return data
            
        try:
            # Get function from string
            if self.aggfunc == 'sum':
                agg_func = np.sum
            elif self.aggfunc == 'mean':
                agg_func = np.mean
            elif self.aggfunc == 'count':
                agg_func = len
            elif self.aggfunc == 'min':
                agg_func = np.min
            elif self.aggfunc == 'max':
                agg_func = np.max
            else:
                logger.error(f"Unknown aggregation function: {self.aggfunc}")
                return data
            
            result = pd.pivot_table(
                data, 
                values=self.values,
                index=self.index,
                columns=self.columns,
                aggfunc=agg_func
            )
            
            # Reset index to make it a regular DataFrame
            result = result.reset_index()
            return result
        except Exception as e:
            logger.error(f"Error applying pivot: {str(e)}")
            return data


class JoinTransformation(PowerQueryTransformation):
    """Join two datasets together"""
    
    def __init__(self, right_data: Any, left_on: Union[str, List[str]], 
                 right_on: Union[str, List[str]], join_type: str = 'inner',
                 name: str = "Join", description: str = ""):
        super().__init__(name, description)
        self.right_data = right_data
        self.left_on = left_on
        self.right_on = right_on
        self.join_type = join_type
        
    def transform(self, left_data: Any) -> Any:
        """Apply join transformation to data"""
        if not HAS_PANDAS or not isinstance(left_data, pd.DataFrame) or not isinstance(self.right_data, pd.DataFrame):
            logger.error("Cannot apply join: not pandas DataFrames")
            return left_data
            
        try:
            result = pd.merge(
                left_data, 
                self.right_data,
                left_on=self.left_on,
                right_on=self.right_on,
                how=self.join_type
            )
            return result
        except Exception as e:
            logger.error(f"Error applying join: {str(e)}")
            return left_data


class PowerQuery:
    """Main Power Query class that manages data sources and transformations"""
    
    def __init__(self):
        self.data_sources = {}
        self.queries = {}
        
    def register_data_source(self, data_source: PowerQueryDataSource) -> bool:
        """Register a data source with the Power Query engine"""
        try:
            self.data_sources[data_source.name] = data_source
            return True
        except Exception as e:
            logger.error(f"Error registering data source: {str(e)}")
            return False
    
    def get_data_source(self, name: str) -> Optional[PowerQueryDataSource]:
        """Get a data source by name"""
        return self.data_sources.get(name)
    
    def list_data_sources(self) -> List[Dict[str, Any]]:
        """List all registered data sources"""
        return [ds.get_metadata() for ds in self.data_sources.values()]
    
    def save_query(self, name: str, query_definition: Dict[str, Any], 
                   description: str = "") -> bool:
        """Save a query definition for later use"""
        try:
            self.queries[name] = {
                "name": name,
                "description": description,
                "definition": query_definition,
                "created": datetime.datetime.now().isoformat()
            }
            return True
        except Exception as e:
            logger.error(f"Error saving query: {str(e)}")
            return False
    
    def get_query(self, name: str) -> Optional[Dict[str, Any]]:
        """Get a saved query by name"""
        return self.queries.get(name)
    
    def list_queries(self) -> List[Dict[str, Any]]:
        """List all saved queries"""
        return list(self.queries.values())
    
    def execute_query(self, query_definition: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a power query based on its definition"""
        try:
            if not HAS_PANDAS:
                return {"error": "Cannot execute query: pandas not available"}
                
            # Get the data source
            data_source_name = query_definition.get("data_source")
            if not data_source_name:
                return {"error": "No data source specified in query definition"}
                
            data_source = self.get_data_source(data_source_name)
            if not data_source:
                return {"error": f"Data source not found: {data_source_name}"}
                
            # Get initial data based on source type
            data = None
            if isinstance(data_source, (SQLServerDataSource, PostgreSQLDataSource)):
                sql = query_definition.get("sql")
                if not sql:
                    return {"error": "No SQL query specified for database source"}
                data = data_source.execute_query(sql)
            elif isinstance(data_source, CSVDataSource):
                data = data_source.get_data()
            elif isinstance(data_source, ExcelDataSource):
                sheet_name = query_definition.get("sheet_name")
                if sheet_name:
                    data_source.load_sheet(sheet_name)
                data = data_source.get_data()
            
            if data is None:
                return {"error": "Failed to retrieve data from source"}
                
            # Apply transformations in sequence
            transformations = query_definition.get("transformations", [])
            for transform_def in transformations:
                transform_type = transform_def.get("type")
                
                if transform_type == "filter":
                    transformation = FilterTransformation(
                        column=transform_def.get("column"),
                        operator=transform_def.get("operator"),
                        value=transform_def.get("value")
                    )
                elif transform_type == "sort":
                    transformation = SortTransformation(
                        columns=transform_def.get("columns"),
                        ascending=transform_def.get("ascending", True)
                    )
                elif transform_type == "groupby":
                    transformation = GroupByTransformation(
                        group_columns=transform_def.get("group_columns"),
                        aggregations=transform_def.get("aggregations")
                    )
                elif transform_type == "pivot":
                    transformation = PivotTransformation(
                        index=transform_def.get("index"),
                        columns=transform_def.get("columns"),
                        values=transform_def.get("values"),
                        aggfunc=transform_def.get("aggfunc", "sum")
                    )
                elif transform_type == "join":
                    # For joins, we need to load the right data from another query
                    right_query_name = transform_def.get("right_query")
                    if not right_query_name:
                        logger.error("No right query specified for join")
                        continue
                        
                    right_query = self.get_query(right_query_name)
                    if not right_query:
                        logger.error(f"Right query not found: {right_query_name}")
                        continue
                        
                    # Execute the right query to get its data
                    right_result = self.execute_query(right_query["definition"])
                    if "error" in right_result:
                        logger.error(f"Error executing right query: {right_result['error']}")
                        continue
                        
                    transformation = JoinTransformation(
                        right_data=right_result["data"],
                        left_on=transform_def.get("left_on"),
                        right_on=transform_def.get("right_on"),
                        join_type=transform_def.get("join_type", "inner")
                    )
                else:
                    logger.error(f"Unknown transformation type: {transform_type}")
                    continue
                    
                data = transformation.transform(data)
            
            # Return the result
            return {
                "success": True,
                "rows": len(data),
                "columns": list(data.columns),
                "data": data.to_dict(orient='records') if len(data) <= 1000 else None,
                "truncated": len(data) > 1000,
                "query_definition": query_definition
            }
            
        except Exception as e:
            logger.error(f"Error executing power query: {str(e)}")
            return {"error": str(e)}
    
    def export_to_csv(self, data: Any, file_path: str) -> bool:
        """Export query results to CSV file"""
        if not HAS_PANDAS or not isinstance(data, pd.DataFrame):
            logger.error("Cannot export: not a pandas DataFrame")
            return False
            
        try:
            data.to_csv(file_path, index=False)
            return True
        except Exception as e:
            logger.error(f"Error exporting to CSV: {str(e)}")
            return False
    
    def export_to_excel(self, data: Any, file_path: str, sheet_name: str = "Data") -> bool:
        """Export query results to Excel file"""
        if not HAS_PANDAS or not isinstance(data, pd.DataFrame):
            logger.error("Cannot export: not a pandas DataFrame")
            return False
            
        try:
            data.to_excel(file_path, sheet_name=sheet_name, index=False)
            return True
        except Exception as e:
            logger.error(f"Error exporting to Excel: {str(e)}")
            return False

# Create a singleton instance
power_query = PowerQuery()

# Add SQLite Data Source class
class SQLiteDataSource(PowerQueryDataSource):
    """SQLite file data source"""
    
    def __init__(self, name: str, file_path: str, description: str = ""):
        super().__init__(name, description)
        self.file_path = file_path
        self.engine = None
        
    def connect(self) -> bool:
        """Connect to SQLite database"""
        if not HAS_PANDAS:
            logger.error("Cannot connect to SQLite: pandas or sqlalchemy not available")
            return False
            
        try:
            if not os.path.exists(self.file_path):
                logger.error(f"SQLite database file not found: {self.file_path}")
                return False
                
            conn_str = f"sqlite:///{self.file_path}"
            self.connection_string = conn_str
            self.engine = create_engine(conn_str)
            
            # Test connection
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            self.is_connected = True
            self.last_connect_time = datetime.datetime.now()
            return True
            
        except Exception as e:
            logger.error(f"Error connecting to SQLite: {str(e)}")
            self.is_connected = False
            return False
    
    def disconnect(self) -> bool:
        """Disconnect from SQLite"""
        if self.engine:
            self.engine.dispose()
        self.is_connected = False
        return True
    
    def execute_query(self, query: str) -> Any:
        """Execute a SQL query against SQLite"""
        if not HAS_PANDAS:
            logger.error("Cannot execute query: pandas not available")
            return None
            
        if not self.is_connected:
            self.connect()
            
        try:
            df = pd.read_sql_query(text(query), self.engine)
            return df
        except Exception as e:
            logger.error(f"Error executing SQL query: {str(e)}")
            return None
    
    def get_tables(self) -> List[str]:
        """Get list of tables in the database"""
        if not HAS_PANDAS:
            logger.error("Cannot get tables: pandas not available")
            return []
            
        if not self.is_connected:
            self.connect()
            
        try:
            query = """
            SELECT name FROM sqlite_master
            WHERE type='table'
            ORDER BY name
            """
            df = pd.read_sql_query(text(query), self.engine)
            return df['name'].tolist()
        except Exception as e:
            logger.error(f"Error getting tables: {str(e)}")
            return []
    
    def get_table_schema(self, table_name: str) -> List[Dict[str, str]]:
        """Get schema for a specific table"""
        if not HAS_PANDAS:
            logger.error("Cannot get table schema: pandas not available")
            return []
            
        if not self.is_connected:
            self.connect()
            
        try:
            query = f"PRAGMA table_info({table_name})"
            df = pd.read_sql_query(text(query), self.engine)
            
            schema = []
            for _, row in df.iterrows():
                schema.append({
                    "name": row['name'],
                    "type": row['type'],
                    "nullable": row['notnull'] == 0,
                    "primary_key": row['pk'] == 1
                })
            return schema
        except Exception as e:
            logger.error(f"Error getting table schema: {str(e)}")
            return []

# Initialize default PostgreSQL connection if environment variables are available
def initialize_default_postgres():
    """Initialize default PostgreSQL connection using environment variables"""
    try:
        import os
        pg_host = os.environ.get('PGHOST')
        pg_port = os.environ.get('PGPORT')
        pg_database = os.environ.get('PGDATABASE')
        pg_user = os.environ.get('PGUSER')
        pg_password = os.environ.get('PGPASSWORD')
        
        if all([pg_host, pg_port, pg_database, pg_user, pg_password]):
            logger.info("Initializing default PostgreSQL connection")
            pg_source = PostgreSQLDataSource(
                name="Default PostgreSQL",
                host=pg_host,
                port=int(pg_port),
                database=pg_database,
                username=pg_user,
                password=pg_password,
                description="System PostgreSQL database"
            )
            power_query.register_data_source(pg_source)
            logger.info("Default PostgreSQL connection registered")
            return True
        else:
            logger.warning("Not all PostgreSQL environment variables are available")
            return False
    except Exception as e:
        logger.error(f"Error initializing default PostgreSQL connection: {str(e)}")
        return False
        
# Add sample data sources for demo purposes
def initialize_sample_data_sources():
    """Initialize sample data sources for demo purposes"""
    try:
        import os
        
        # Sample SQLite database
        sqlite_path = os.path.join("uploads", "power_query", "sample_gis_data.db")
        if os.path.exists(sqlite_path):
            logger.info("Initializing sample SQLite data source")
            sqlite_source = SQLiteDataSource(
                name="Sample GIS Data",
                file_path=sqlite_path,
                description="Sample SQLite database with GIS data"
            )
            power_query.register_data_source(sqlite_source)
            logger.info("Sample SQLite data source registered")
        
        # Sample CSV file
        csv_path = os.path.join("uploads", "power_query", "sample_addresses.csv")
        if os.path.exists(csv_path):
            logger.info("Initializing sample CSV data source")
            csv_source = CSVDataSource(
                name="Sample Addresses",
                file_path=csv_path,
                description="Sample CSV file with address data"
            )
            power_query.register_data_source(csv_source)
            logger.info("Sample CSV data source registered")
        
        # Sample Excel file
        excel_path = os.path.join("uploads", "power_query", "property_records.xlsx")
        if os.path.exists(excel_path):
            logger.info("Initializing sample Excel data source")
            excel_source = ExcelDataSource(
                name="Property Records",
                file_path=excel_path,
                description="Sample Excel file with property records"
            )
            power_query.register_data_source(excel_source)
            logger.info("Sample Excel data source registered")
            
        return True
    except Exception as e:
        logger.error(f"Error initializing sample data sources: {str(e)}")
        return False

# Try to initialize the default PostgreSQL connection
initialize_default_postgres()

# Also initialize sample data sources
initialize_sample_data_sources()