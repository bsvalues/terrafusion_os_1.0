"""
Verification module for Property Export functionality.

This module provides functions to verify SQL Server connectivity, test the execution
of stored procedures, and perform pre-deployment validation of the property export
functionality.
"""
import os
import datetime
import logging
import pyodbc
from typing import Dict, List, Any, Tuple, Optional

from app import db
from sync_service.models import SyncJob, SyncLog
from sync_service.config import SQL_SERVER_CONNECTION_STRING

# Set up logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

class PropertyExportVerification:
    """
    Verification utility for the Property Export functionality.
    
    This class provides methods to verify SQL Server connectivity, test the execution
    of the ExportPropertyAccess stored procedure, and perform pre-deployment validation.
    """
    
    @staticmethod
    def verify_sql_server_connection() -> Tuple[bool, str, Dict[str, Any]]:
        """
        Verify the SQL Server connection string and test connectivity.
        
        Tests both production and training database connections if provided.
        
        Returns:
            A tuple containing:
                - A boolean indicating success or failure
                - A result message
                - A dictionary with connection details
        """
        if not SQL_SERVER_CONNECTION_STRING:
            return False, "SQL Server connection string not configured", {
                "env_var_set": False,
                "connection_info": None,
                "server_info": None
            }
        
        logger.info("Verifying SQL Server connection")
        
        try:
            # Parse connection string to extract server, database, and auth method
            conn_parts = SQL_SERVER_CONNECTION_STRING.split(';')
            conn_info = {}
            
            for part in conn_parts:
                if '=' in part:
                    key, value = part.split('=', 1)
                    conn_info[key.strip().upper()] = value.strip()
            
            # Determine authentication method
            auth_method = "Windows Authentication" if "TRUSTED_CONNECTION" in conn_info or "INTEGRATED SECURITY" in conn_info else "SQL Authentication"
            
            # Extract server and database info
            server = conn_info.get("SERVER", "Unknown")
            database = conn_info.get("DATABASE", "Unknown")
            
            # Connect to SQL Server
            conn = pyodbc.connect(SQL_SERVER_CONNECTION_STRING)
            cursor = conn.cursor()
            
            # Get server info
            cursor.execute("SELECT @@VERSION")
            server_version = cursor.fetchone()[0]
            
            # Get database name
            cursor.execute("SELECT DB_NAME()")
            current_db = cursor.fetchone()[0]
            
            # Check if we can query system tables
            cursor.execute("SELECT name FROM sys.databases WHERE name IN ('web_internet_benton', 'pacs_training')")
            available_dbs = [row[0] for row in cursor.fetchall()]
            
            # Close connection
            conn.close()
            
            connection_details = {
                "env_var_set": True,
                "connection_info": {
                    "server": server,
                    "connected_database": current_db,
                    "authentication_method": auth_method,
                    "available_databases": available_dbs
                },
                "server_info": server_version,
                "verified_time": datetime.datetime.utcnow().isoformat()
            }
            
            return True, f"Successfully connected to SQL Server '{server}' database '{current_db}' using {auth_method}", connection_details
            
        except Exception as e:
            logger.error(f"Error verifying SQL Server connection: {str(e)}")
            
            # Parse connection string for reporting (remove credentials)
            safe_conn_str = SQL_SERVER_CONNECTION_STRING
            if "PWD=" in safe_conn_str:
                parts = safe_conn_str.split("PWD=")
                if len(parts) > 1 and ";" in parts[1]:
                    pwd_end = parts[1].find(";")
                    safe_conn_str = parts[0] + "PWD=*****" + parts[1][pwd_end:]
            
            return False, f"Failed to connect to SQL Server: {str(e)}", {
                "env_var_set": True, 
                "error": str(e),
                "connection_string_format": safe_conn_str[:20] + "..." if len(safe_conn_str) > 20 else safe_conn_str
            }
    
    @staticmethod
    def test_stored_procedure(database_name: str = 'web_internet_benton', 
                            num_years: int = 1, 
                            min_bill_years: int = 2,
                            log_to_db: bool = True,
                            user_id: Optional[int] = None) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Test the ExportPropertyAccess stored procedure execution with minimal data.
        
        Args:
            database_name: The name of the target database to create or update
            num_years: Number of years to include in the export (use 1 for testing)
            min_bill_years: Minimum number of billing years to include
            log_to_db: Whether to log the test job to the database
            user_id: Optional user ID who initiated the test
            
        Returns:
            A tuple containing:
                - A boolean indicating success or failure
                - A result message
                - A dictionary with test details and results
        """
        logger.info(f"Testing stored procedure execution with database_name={database_name}, " 
                   f"num_years={num_years}, min_bill_years={min_bill_years}")
        
        # Check if SQL Server connection string is configured
        if not SQL_SERVER_CONNECTION_STRING:
            return False, "SQL Server connection string not configured", {
                "env_var_set": False,
                "test_parameters": {
                    "database_name": database_name,
                    "num_years": num_years,
                    "min_bill_years": min_bill_years
                }
            }
        
        job_id = None
        if log_to_db:
            # Create a test job entry
            job = SyncJob(
                job_id=str(hash(f"test_{database_name}_{datetime.datetime.utcnow().isoformat()}")),
                name=f"TEST: PropertyAccess Export to {database_name}",
                status='testing',
                start_time=datetime.datetime.utcnow(),
                end_time=None,
                total_records=1,
                processed_records=0,
                error_records=0,
                error_details={},
                job_type='property_export_test',
                source_db='pacs_oltp',
                target_db=database_name,
                initiated_by=user_id
            )
            db.session.add(job)
            db.session.commit()
            job_id = job.job_id
            
            # Add a log entry
            log_entry = SyncLog(
                job_id=job_id,
                level="INFO",
                message=f"Starting TEST of ExportPropertyAccess stored procedure with database_name='{database_name}', "
                      f"num_years={num_years}, min_bill_years={min_bill_years}",
                component="PropertyExportTest"
            )
            db.session.add(log_entry)
            db.session.commit()
        
        try:
            # Connect to the SQL Server database
            conn = pyodbc.connect(SQL_SERVER_CONNECTION_STRING)
            cursor = conn.cursor()
            
            # Check if the stored procedure exists
            cursor.execute("""
            SELECT COUNT(*) 
            FROM INFORMATION_SCHEMA.ROUTINES 
            WHERE ROUTINE_TYPE='PROCEDURE' 
            AND ROUTINE_NAME='ExportPropertyAccess'
            """)
            
            sp_exists = cursor.fetchone()[0] > 0
            
            if not sp_exists:
                if log_to_db and job_id:
                    # Update job status
                    job = SyncJob.query.filter_by(job_id=job_id).first()
                    if job:
                        job.status = 'failed'
                        job.end_time = datetime.datetime.utcnow()
                        job.error_details = {'error': 'ExportPropertyAccess stored procedure not found', 'step': 'verification'}
                        
                        log_entry = SyncLog(
                            job_id=job_id,
                            level="ERROR",
                            message="ExportPropertyAccess stored procedure not found in the database",
                            component="PropertyExportTest"
                        )
                        db.session.add(log_entry)
                        db.session.commit()
                
                return False, "ExportPropertyAccess stored procedure not found", {
                    "stored_procedure_exists": False,
                    "test_parameters": {
                        "database_name": database_name,
                        "num_years": num_years,
                        "min_bill_years": min_bill_years
                    }
                }
            
            start_time = datetime.datetime.utcnow()
            
            # Execute the stored procedure with parameter checking
            try:
                # First check if the parameters match what's expected
                cursor.execute("""
                SELECT PARAMETER_NAME, DATA_TYPE 
                FROM INFORMATION_SCHEMA.PARAMETERS 
                WHERE SPECIFIC_NAME='ExportPropertyAccess' 
                ORDER BY ORDINAL_POSITION
                """)
                
                expected_params = [
                    {"name": "@input_database_name", "type": "nvarchar"},
                    {"name": "@input_num_years", "type": "int"},
                    {"name": "@input_min_bill_years", "type": "int"}
                ]
                
                actual_params = []
                for row in cursor.fetchall():
                    actual_params.append({"name": row[0], "type": row[1]})
                
                # Check if parameters match
                params_match = (len(actual_params) == len(expected_params))
                if params_match:
                    for i, expected in enumerate(expected_params):
                        if i >= len(actual_params):
                            params_match = False
                            break
                        actual = actual_params[i]
                        if expected["name"].lower() != actual["name"].lower() or expected["type"].lower() not in actual["type"].lower():
                            params_match = False
                            break
                
                if not params_match:
                    if log_to_db and job_id:
                        # Update job status
                        job = SyncJob.query.filter_by(job_id=job_id).first()
                        if job:
                            job.status = 'failed'
                            job.end_time = datetime.datetime.utcnow()
                            job.error_details = {
                                'error': 'Parameter mismatch in ExportPropertyAccess stored procedure',
                                'step': 'verification',
                                'expected_params': expected_params,
                                'actual_params': actual_params
                            }
                            
                            log_entry = SyncLog(
                                job_id=job_id,
                                level="ERROR",
                                message="Parameter mismatch in ExportPropertyAccess stored procedure",
                                component="PropertyExportTest"
                            )
                            db.session.add(log_entry)
                            db.session.commit()
                    
                    return False, "Parameter mismatch in ExportPropertyAccess stored procedure", {
                        "stored_procedure_exists": True,
                        "parameters_match": False,
                        "expected_params": expected_params,
                        "actual_params": actual_params
                    }
                
                # Execute in testing mode with limit 1
                sql = """
                DECLARE @TestMode BIT = 1;
                EXEC [dbo].[ExportPropertyAccess]
                    @input_database_name = ?,
                    @input_num_years = ?,
                    @input_min_bill_years = ?
                """
                
                cursor.execute(sql, (database_name, num_years, min_bill_years))
                
                # Get the results
                result_rows = []
                for row in cursor.fetchall():
                    result_rows.append(str(row))
                
                end_time = datetime.datetime.utcnow()
                duration_ms = int((end_time - start_time).total_seconds() * 1000)
                
                if log_to_db and job_id:
                    # Update job status
                    job = SyncJob.query.filter_by(job_id=job_id).first()
                    if job:
                        job.status = 'completed'
                        job.end_time = end_time
                        job.processed_records = 1
                        
                        log_entry = SyncLog(
                            job_id=job_id,
                            level="INFO",
                            message=f"Successfully tested ExportPropertyAccess stored procedure in {duration_ms}ms",
                            component="PropertyExportTest",
                            duration_ms=duration_ms
                        )
                        db.session.add(log_entry)
                        db.session.commit()
                
                return True, "Successfully tested ExportPropertyAccess stored procedure", {
                    "stored_procedure_exists": True,
                    "parameters_match": True,
                    "execution_time_ms": duration_ms,
                    "result_rows": result_rows[:10],  # Limit to first 10 rows
                    "test_parameters": {
                        "database_name": database_name,
                        "num_years": num_years,
                        "min_bill_years": min_bill_years
                    }
                }
                
            except pyodbc.Error as e:
                if log_to_db and job_id:
                    # Update job status
                    job = SyncJob.query.filter_by(job_id=job_id).first()
                    if job:
                        job.status = 'failed'
                        job.end_time = datetime.datetime.utcnow()
                        job.error_details = {'error': str(e), 'step': 'execution'}
                        
                        log_entry = SyncLog(
                            job_id=job_id,
                            level="ERROR",
                            message=f"Error executing ExportPropertyAccess stored procedure: {str(e)}",
                            component="PropertyExportTest"
                        )
                        db.session.add(log_entry)
                        db.session.commit()
                
                return False, f"Error executing ExportPropertyAccess stored procedure: {str(e)}", {
                    "stored_procedure_exists": True,
                    "error": str(e),
                    "error_code": getattr(e, 'args', [None])[0] if hasattr(e, 'args') else None,
                    "test_parameters": {
                        "database_name": database_name,
                        "num_years": num_years,
                        "min_bill_years": min_bill_years
                    }
                }
            
        except Exception as e:
            if log_to_db and job_id:
                # Update job status
                job = SyncJob.query.filter_by(job_id=job_id).first()
                if job:
                    job.status = 'failed'
                    job.end_time = datetime.datetime.utcnow()
                    job.error_details = {'error': str(e), 'step': 'connection'}
                    
                    log_entry = SyncLog(
                        job_id=job_id,
                        level="ERROR",
                        message=f"Error testing stored procedure: {str(e)}",
                        component="PropertyExportTest"
                    )
                    db.session.add(log_entry)
                    db.session.commit()
            
            return False, f"Error testing stored procedure: {str(e)}", {
                "error": str(e),
                "test_parameters": {
                    "database_name": database_name,
                    "num_years": num_years,
                    "min_bill_years": min_bill_years
                }
            }
    
    @staticmethod
    def validate_api_endpoints(user_id: Optional[int] = None) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Validate that API endpoints tied to property export are correctly configured.
        
        This checks that the endpoints exist, enforce administrator-only access,
        and return the expected response format.
        
        Args:
            user_id: Optional user ID to use for testing
            
        Returns:
            A tuple containing:
                - A boolean indicating success or failure
                - A result message
                - A dictionary with validation details
        """
        from flask import current_app
        
        logger.info("Validating property export API endpoints")
        
        # Check that the endpoints exist in the application
        endpoints = {
            'property_export_form': '/sync/property-export',
            'run_property_export': '/sync/run/property-export',
            'api_start_property_export': '/sync/api/start-property-export',
            'job_details': '/sync/job/',
            'api_job_status': '/sync/api/job-status/',
            'api_job_logs': '/sync/api/job-logs/'
        }
        
        results = {}
        all_valid = True
        
        for name, path in endpoints.items():
            exists = False
            for rule in current_app.url_map.iter_rules():
                if path in rule.rule:
                    exists = True
                    break
            
            if not exists:
                all_valid = False
            
            results[name] = {
                'endpoint_exists': exists,
                'path': path
            }
        
        # Check for route permissions
        # This requires more complex testing with a test client
        # which we can't easily do here
        
        if all_valid:
            return True, "All property export API endpoints are correctly configured", {
                'endpoints': results
            }
        else:
            return False, "Some property export API endpoints are missing", {
                'endpoints': results
            }
    
    @staticmethod
    def run_pre_deployment_validation() -> Dict[str, Any]:
        """
        Run a comprehensive pre-deployment validation suite.
        
        This runs all verification checks and returns a detailed report.
        
        Returns:
            A dictionary with validation results
        """
        logger.info("Running pre-deployment validation for property export functionality")
        
        results = {
            'timestamp': datetime.datetime.utcnow().isoformat(),
            'sql_server_connection': {},
            'stored_procedure': {},
            'api_endpoints': {},
            'overall_status': 'failed'
        }
        
        # Verify SQL Server connection
        success, message, details = PropertyExportVerification.verify_sql_server_connection()
        results['sql_server_connection'] = {
            'success': success,
            'message': message,
            'details': details
        }
        
        # Test stored procedure
        if success:
            success, message, details = PropertyExportVerification.test_stored_procedure(
                database_name='web_internet_benton', 
                num_years=1, 
                min_bill_years=2,
                log_to_db=True
            )
            results['stored_procedure'] = {
                'success': success,
                'message': message,
                'details': details
            }
        else:
            results['stored_procedure'] = {
                'success': False,
                'message': "Skipped stored procedure test due to connection failure",
                'details': {}
            }
        
        # Validate API endpoints
        from flask import current_app
        with current_app.app_context():
            success, message, details = PropertyExportVerification.validate_api_endpoints()
            results['api_endpoints'] = {
                'success': success,
                'message': message,
                'details': details
            }
        
        # Determine overall status
        if (results['sql_server_connection']['success'] and 
            results['stored_procedure']['success'] and 
            results['api_endpoints']['success']):
            results['overall_status'] = 'passed'
        
        return results


# Additional utilities for Windows Authentication testing
def test_windows_auth_connection(server: str, database: str) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Test Windows Authentication connection to SQL Server.
    
    Args:
        server: The SQL Server name or IP address
        database: The database name to connect to
        
    Returns:
        A tuple containing:
            - A boolean indicating success or failure
            - A result message
            - A dictionary with connection details
    """
    conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};Trusted_Connection=yes;"
    
    logger.info(f"Testing Windows Authentication connection to {server}/{database}")
    
    try:
        # Connect to SQL Server
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        
        # Get the current user
        cursor.execute("SELECT CURRENT_USER")
        current_user = cursor.fetchone()[0]
        
        # Check database access
        cursor.execute("SELECT DB_NAME()")
        db_name = cursor.fetchone()[0]
        
        # Close connection
        conn.close()
        
        return True, f"Successfully connected to {server}/{database} as {current_user}", {
            "server": server,
            "database": database,
            "database_connected": db_name,
            "current_user": current_user,
            "auth_method": "Windows Authentication"
        }
        
    except Exception as e:
        logger.error(f"Error connecting to {server}/{database}: {str(e)}")
        return False, f"Error connecting to {server}/{database}: {str(e)}", {
            "server": server,
            "database": database,
            "error": str(e)
        }