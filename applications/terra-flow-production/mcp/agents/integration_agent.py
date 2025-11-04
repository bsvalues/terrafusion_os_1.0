"""
Integration Agent Module

This module implements a specialized agent for integrating with external systems,
synchronizing data, and managing API connections.
"""

import logging
import time
import os
import json
import requests
import tempfile
import datetime
import hashlib
from typing import Dict, List, Any, Optional, Union
import threading
import sqlite3
from urllib.parse import urlparse

from .base_agent import BaseAgent
from ..core import mcp_instance

# Import optional dependencies
try:
    import pandas as pd
    import geopandas as gpd
    from shapely import wkt
    HAS_GEO_LIBS = True
except ImportError:
    HAS_GEO_LIBS = False
    pd = None
    gpd = None

class IntegrationAgent(BaseAgent):
    """
    Agent responsible for integration with external systems and APIs
    """
    
    def __init__(self):
        """Initialize the integration agent"""
        super().__init__()
        self.capabilities = [
            "api_connection",
            "data_synchronization",
            "webhook_handling",
            "scheduled_tasks",
            "format_transformation"
        ]
        
        # Set up storage for connection configs and sync state
        self.connections = {}
        self.sync_status = {}
        
        # Create cache directory if needed
        self.cache_dir = os.path.join(tempfile.gettempdir(), "integration_cache")
        os.makedirs(self.cache_dir, exist_ok=True)
        
        # Initialize the connection database
        self.db_path = os.path.join(self.cache_dir, "connections.db")
        self._init_connection_db()
        
        # Scheduler for periodic tasks
        self.scheduled_tasks = {}
        self.scheduler_active = False
        self.scheduler_thread = None
        
        # Start the scheduler
        self.start_scheduler()
        
        self.logger.info("Integration Agent initialized")
    
    def _init_connection_db(self):
        """Initialize the SQLite database for storing connection info"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create connections table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS connections (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                config TEXT NOT NULL,
                created_at TIMESTAMP,
                last_used TIMESTAMP,
                last_status TEXT
            )
            ''')
            
            # Create sync_history table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS sync_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                connection_id TEXT,
                sync_type TEXT NOT NULL,
                started_at TIMESTAMP,
                completed_at TIMESTAMP,
                status TEXT,
                items_processed INTEGER,
                error_message TEXT,
                FOREIGN KEY (connection_id) REFERENCES connections (id)
            )
            ''')
            
            conn.commit()
            conn.close()
            
            # Load existing connections
            self._load_connections()
            
        except Exception as e:
            self.logger.error(f"Failed to initialize connection database: {str(e)}")
    
    def _load_connections(self):
        """Load connections from the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM connections")
            rows = cursor.fetchall()
            
            for row in rows:
                connection_id = row['id']
                config = json.loads(row['config'])
                self.connections[connection_id] = {
                    "id": connection_id,
                    "name": row['name'],
                    "type": row['type'],
                    "config": config,
                    "created_at": row['created_at'],
                    "last_used": row['last_used'],
                    "last_status": row['last_status']
                }
            
            conn.close()
            self.logger.info(f"Loaded {len(self.connections)} connections from database")
            
        except Exception as e:
            self.logger.error(f"Failed to load connections: {str(e)}")
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process an integration task"""
        self.last_activity = time.time()
        
        if not task_data or "task_type" not in task_data:
            return {"error": "Invalid task data, missing task_type"}
        
        task_type = task_data["task_type"]
        
        if task_type == "api_connection":
            return self.manage_api_connection(task_data)
        elif task_type == "data_synchronization":
            return self.synchronize_data(task_data)
        elif task_type == "webhook_handling":
            return self.handle_webhook(task_data)
        elif task_type == "scheduled_tasks":
            return self.manage_scheduled_tasks(task_data)
        elif task_type == "format_transformation":
            return self.transform_data_format(task_data)
        else:
            return {"error": f"Unsupported task type: {task_type}"}
    
    def start_scheduler(self) -> bool:
        """Start the task scheduler thread"""
        if self.scheduler_active:
            return False
        
        self.scheduler_active = True
        self.scheduler_thread = threading.Thread(target=self._scheduler_loop)
        self.scheduler_thread.daemon = True
        self.scheduler_thread.start()
        self.logger.info("Task scheduler started")
        return True
    
    def stop_scheduler(self) -> bool:
        """Stop the task scheduler thread"""
        if not self.scheduler_active:
            return False
        
        self.scheduler_active = False
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5.0)
        self.logger.info("Task scheduler stopped")
        return True
    
    def _scheduler_loop(self):
        """Background scheduler loop for periodic tasks"""
        while self.scheduler_active:
            try:
                current_time = time.time()
                
                # Check each scheduled task
                for task_id, task in list(self.scheduled_tasks.items()):
                    if current_time >= task["next_run"]:
                        # Task is due to run
                        self.logger.info(f"Running scheduled task: {task_id}")
                        
                        # Run the task
                        try:
                            task_thread = threading.Thread(
                                target=self._run_scheduled_task,
                                args=(task_id, task)
                            )
                            task_thread.daemon = True
                            task_thread.start()
                            
                        except Exception as task_error:
                            self.logger.error(f"Error running scheduled task {task_id}: {str(task_error)}")
                        
                        # Update next run time
                        interval = task["interval"]
                        task["next_run"] = current_time + interval
                        task["last_run"] = current_time
                
                # Sleep for a bit to avoid busy waiting
                time.sleep(1.0)
                
            except Exception as e:
                self.logger.error(f"Error in scheduler loop: {str(e)}")
                time.sleep(5.0)  # Sleep longer on error
    
    def _run_scheduled_task(self, task_id: str, task: Dict[str, Any]):
        """Run a scheduled task"""
        try:
            task_data = task["task_data"]
            task_type = task_data["task_type"]
            
            # Update status
            self.scheduled_tasks[task_id]["status"] = "running"
            
            # Process the task based on type
            if task_type == "data_synchronization":
                result = self.synchronize_data(task_data)
            elif task_type == "api_connection":
                result = self.manage_api_connection(task_data)
            else:
                result = {"error": f"Unsupported scheduled task type: {task_type}"}
            
            # Update task status with result
            self.scheduled_tasks[task_id]["last_result"] = result
            self.scheduled_tasks[task_id]["status"] = "idle"
            
            # Log result
            if "error" in result:
                self.logger.error(f"Scheduled task {task_id} failed: {result['error']}")
            else:
                self.logger.info(f"Scheduled task {task_id} completed successfully")
            
        except Exception as e:
            self.logger.error(f"Error executing scheduled task {task_id}: {str(e)}")
            self.scheduled_tasks[task_id]["status"] = "error"
            self.scheduled_tasks[task_id]["last_result"] = {"error": str(e)}
    
    def manage_api_connection(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Manage API connections to external systems"""
        self.set_status("managing_connection")
        
        # Get the operation type
        operation = task_data.get("operation", "test")
        
        if operation == "create":
            return self._create_connection(task_data)
        elif operation == "test":
            return self._test_connection(task_data)
        elif operation == "delete":
            return self._delete_connection(task_data)
        elif operation == "list":
            return self._list_connections(task_data)
        elif operation == "get":
            return self._get_connection(task_data)
        elif operation == "update":
            return self._update_connection(task_data)
        else:
            return {"error": f"Unsupported API connection operation: {operation}"}
    
    def _create_connection(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new API connection"""
        try:
            # Required parameters
            if "name" not in task_data or "type" not in task_data or "config" not in task_data:
                return {"error": "Missing required parameters: name, type, config"}
            
            name = task_data["name"]
            conn_type = task_data["type"]
            config = task_data["config"]
            
            # Generate connection ID
            timestamp = int(time.time())
            config_str = json.dumps(config, sort_keys=True)
            id_hash = hashlib.md5(f"{name}:{conn_type}:{config_str}:{timestamp}".encode()).hexdigest()[:12]
            connection_id = f"{conn_type}_{id_hash}"
            
            # Validate connection based on type
            test_result = {"status": "untested"}
            if task_data.get("test_on_create", True):
                test_task = {
                    "connection_id": connection_id,
                    "name": name,
                    "type": conn_type,
                    "config": config
                }
                test_result = self._test_connection_config(test_task)
                
                if "error" in test_result:
                    return {
                        "status": "error",
                        "message": "Connection test failed",
                        "test_result": test_result
                    }
            
            # Store connection in database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                "INSERT INTO connections (id, name, type, config, created_at, last_used, last_status) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    connection_id,
                    name,
                    conn_type,
                    json.dumps(config),
                    datetime.datetime.now().isoformat(),
                    None,
                    test_result.get("status", "untested")
                )
            )
            
            conn.commit()
            conn.close()
            
            # Add to in-memory connections
            self.connections[connection_id] = {
                "id": connection_id,
                "name": name,
                "type": conn_type,
                "config": config,
                "created_at": datetime.datetime.now().isoformat(),
                "last_used": None,
                "last_status": test_result.get("status", "untested")
            }
            
            return {
                "status": "success",
                "message": "Connection created successfully",
                "connection_id": connection_id,
                "test_result": test_result
            }
            
        except Exception as e:
            self.logger.error(f"Error creating connection: {str(e)}")
            return {"error": f"Failed to create connection: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def _test_connection(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test an API connection"""
        try:
            # Check if testing existing connection or new config
            if "connection_id" in task_data:
                connection_id = task_data["connection_id"]
                
                # Get connection from database
                if connection_id not in self.connections:
                    return {"error": f"Connection not found: {connection_id}"}
                
                connection = self.connections[connection_id]
                test_task = {
                    "connection_id": connection_id,
                    "name": connection["name"],
                    "type": connection["type"],
                    "config": connection["config"]
                }
                
                result = self._test_connection_config(test_task)
                
                # Update connection status
                self._update_connection_status(connection_id, result.get("status", "error"))
                
                return result
            else:
                # Testing a new connection config
                return self._test_connection_config(task_data)
            
        except Exception as e:
            self.logger.error(f"Error testing connection: {str(e)}")
            return {"error": f"Connection test failed: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def _test_connection_config(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test a connection configuration"""
        try:
            if "type" not in task_data or "config" not in task_data:
                return {"error": "Missing required parameters: type, config"}
            
            conn_type = task_data["type"]
            config = task_data["config"]
            
            start_time = time.time()
            
            if conn_type == "rest_api":
                # Test REST API connection
                if "base_url" not in config:
                    return {"error": "Missing base_url in REST API configuration"}
                
                base_url = config["base_url"]
                test_endpoint = config.get("test_endpoint", "")
                headers = config.get("headers", {})
                auth_type = config.get("auth_type")
                
                # Build test URL
                test_url = base_url
                if test_endpoint:
                    test_url = f"{base_url.rstrip('/')}/{test_endpoint.lstrip('/')}"
                
                # Add authentication
                if auth_type == "basic":
                    if "username" not in config or "password" not in config:
                        return {"error": "Missing username or password for basic authentication"}
                    
                    auth = (config["username"], config["password"])
                    response = requests.get(test_url, headers=headers, auth=auth, timeout=10)
                elif auth_type == "bearer":
                    if "token" not in config:
                        return {"error": "Missing token for bearer authentication"}
                    
                    if "Authorization" not in headers:
                        headers["Authorization"] = f"Bearer {config['token']}"
                    
                    response = requests.get(test_url, headers=headers, timeout=10)
                elif auth_type == "api_key":
                    if "api_key" not in config or "api_key_name" not in config:
                        return {"error": "Missing api_key or api_key_name for API key authentication"}
                    
                    api_key = config["api_key"]
                    api_key_name = config["api_key_name"]
                    api_key_location = config.get("api_key_location", "header")
                    
                    if api_key_location == "header":
                        headers[api_key_name] = api_key
                        response = requests.get(test_url, headers=headers, timeout=10)
                    elif api_key_location == "query":
                        params = {api_key_name: api_key}
                        response = requests.get(test_url, headers=headers, params=params, timeout=10)
                    else:
                        return {"error": f"Unsupported api_key_location: {api_key_location}"}
                else:
                    # No authentication
                    response = requests.get(test_url, headers=headers, timeout=10)
                
                if response.status_code < 400:
                    return {
                        "status": "success",
                        "message": f"Connection successful: HTTP {response.status_code}",
                        "response_time": time.time() - start_time,
                        "details": {
                            "status_code": response.status_code,
                            "content_type": response.headers.get("Content-Type"),
                            "content_length": len(response.content)
                        }
                    }
                else:
                    return {
                        "status": "error",
                        "message": f"Connection failed: HTTP {response.status_code}",
                        "response_time": time.time() - start_time,
                        "details": {
                            "status_code": response.status_code,
                            "content_type": response.headers.get("Content-Type"),
                            "error_message": response.text[:500]  # Truncate long errors
                        }
                    }
            
            elif conn_type == "wfs":
                # Test WFS connection (Web Feature Service)
                if "url" not in config:
                    return {"error": "Missing url in WFS configuration"}
                
                url = config["url"]
                
                # Build GetCapabilities request
                capabilities_url = f"{url}?service=WFS&version=2.0.0&request=GetCapabilities"
                
                # Make request
                response = requests.get(capabilities_url, timeout=15)
                
                if response.status_code < 400:
                    # Try to parse the XML
                    if "<wfs:WFS_Capabilities" in response.text or "<WFS_Capabilities" in response.text:
                        return {
                            "status": "success",
                            "message": "WFS connection successful",
                            "response_time": time.time() - start_time,
                            "details": {
                                "status_code": response.status_code,
                                "content_type": response.headers.get("Content-Type"),
                                "content_length": len(response.content)
                            }
                        }
                    else:
                        return {
                            "status": "error",
                            "message": "Response doesn't appear to be a valid WFS Capabilities document",
                            "response_time": time.time() - start_time,
                            "details": {
                                "status_code": response.status_code,
                                "content_type": response.headers.get("Content-Type"),
                                "content_preview": response.text[:200]
                            }
                        }
                else:
                    return {
                        "status": "error",
                        "message": f"WFS connection failed: HTTP {response.status_code}",
                        "response_time": time.time() - start_time,
                        "details": {
                            "status_code": response.status_code,
                            "error_message": response.text[:500]
                        }
                    }
            
            elif conn_type == "database":
                # Test database connection
                if "database_url" not in config:
                    return {"error": "Missing database_url in database configuration"}
                
                database_url = config["database_url"]
                
                # Parse the URL to determine the database type
                parsed_url = urlparse(database_url)
                db_type = parsed_url.scheme.split('+')[0]
                
                if db_type == "sqlite":
                    # SQLite connection
                    try:
                        conn = sqlite3.connect(parsed_url.path)
                        cursor = conn.cursor()
                        cursor.execute("SELECT sqlite_version()")
                        version = cursor.fetchone()[0]
                        conn.close()
                        
                        return {
                            "status": "success",
                            "message": f"SQLite connection successful (version {version})",
                            "response_time": time.time() - start_time,
                            "details": {
                                "version": version,
                                "database": parsed_url.path
                            }
                        }
                    except Exception as db_error:
                        return {
                            "status": "error",
                            "message": f"SQLite connection failed: {str(db_error)}",
                            "response_time": time.time() - start_time
                        }
                
                elif db_type in ("postgresql", "postgres"):
                    # PostgreSQL connection
                    try:
                        import psycopg2
                        
                        # Extract connection parameters from URL
                        db_host = parsed_url.hostname
                        db_port = parsed_url.port or 5432
                        db_name = parsed_url.path.lstrip('/')
                        db_user = parsed_url.username
                        db_password = parsed_url.password
                        
                        conn = psycopg2.connect(
                            host=db_host,
                            port=db_port,
                            dbname=db_name,
                            user=db_user,
                            password=db_password
                        )
                        
                        cursor = conn.cursor()
                        cursor.execute("SELECT version()")
                        version = cursor.fetchone()[0]
                        conn.close()
                        
                        return {
                            "status": "success",
                            "message": f"PostgreSQL connection successful",
                            "response_time": time.time() - start_time,
                            "details": {
                                "version": version,
                                "host": db_host,
                                "port": db_port,
                                "database": db_name
                            }
                        }
                    except Exception as db_error:
                        return {
                            "status": "error",
                            "message": f"PostgreSQL connection failed: {str(db_error)}",
                            "response_time": time.time() - start_time
                        }
                else:
                    return {
                        "status": "error",
                        "message": f"Unsupported database type: {db_type}",
                        "response_time": time.time() - start_time
                    }
            
            else:
                return {"error": f"Unsupported connection type: {conn_type}"}
            
        except requests.exceptions.Timeout:
            return {
                "status": "error",
                "message": "Connection timed out",
                "response_time": time.time() - start_time
            }
        except requests.exceptions.ConnectionError:
            return {
                "status": "error",
                "message": "Connection error: could not connect to server",
                "response_time": time.time() - start_time
            }
        except Exception as e:
            self.logger.error(f"Error testing connection config: {str(e)}")
            return {
                "status": "error",
                "message": f"Connection test failed: {str(e)}",
                "response_time": time.time() - start_time
            }
    
    def _update_connection_status(self, connection_id: str, status: str):
        """Update the status of a connection"""
        try:
            # Update in-memory status
            if connection_id in self.connections:
                self.connections[connection_id]["last_status"] = status
                self.connections[connection_id]["last_used"] = datetime.datetime.now().isoformat()
            
            # Update database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                "UPDATE connections SET last_status = ?, last_used = ? WHERE id = ?",
                (status, datetime.datetime.now().isoformat(), connection_id)
            )
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            self.logger.error(f"Error updating connection status: {str(e)}")
    
    def _delete_connection(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Delete an API connection"""
        try:
            if "connection_id" not in task_data:
                return {"error": "Missing required parameter: connection_id"}
            
            connection_id = task_data["connection_id"]
            
            # Check if connection exists
            if connection_id not in self.connections:
                return {"error": f"Connection not found: {connection_id}"}
            
            # Delete from database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Delete sync history first (foreign key constraint)
            cursor.execute("DELETE FROM sync_history WHERE connection_id = ?", (connection_id,))
            
            # Delete connection
            cursor.execute("DELETE FROM connections WHERE id = ?", (connection_id,))
            
            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            # Delete from in-memory cache
            if connection_id in self.connections:
                del self.connections[connection_id]
            
            return {
                "status": "success",
                "message": "Connection deleted successfully",
                "deleted_count": deleted_count
            }
            
        except Exception as e:
            self.logger.error(f"Error deleting connection: {str(e)}")
            return {"error": f"Failed to delete connection: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def _list_connections(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """List available API connections"""
        try:
            # Optional filters
            conn_type = task_data.get("type")
            
            # Get connections from memory
            connections = []
            for connection_id, connection in self.connections.items():
                if conn_type and connection["type"] != conn_type:
                    continue
                
                # Don't include the full config for security
                connection_info = {
                    "id": connection["id"],
                    "name": connection["name"],
                    "type": connection["type"],
                    "created_at": connection["created_at"],
                    "last_used": connection["last_used"],
                    "last_status": connection["last_status"]
                }
                
                connections.append(connection_info)
            
            return {
                "status": "success",
                "connections": connections,
                "count": len(connections)
            }
            
        except Exception as e:
            self.logger.error(f"Error listing connections: {str(e)}")
            return {"error": f"Failed to list connections: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def _get_connection(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get details of a specific connection"""
        try:
            if "connection_id" not in task_data:
                return {"error": "Missing required parameter: connection_id"}
            
            connection_id = task_data["connection_id"]
            
            # Check if connection exists
            if connection_id not in self.connections:
                return {"error": f"Connection not found: {connection_id}"}
            
            connection = self.connections[connection_id]
            
            # Option to include sensitive config
            include_sensitive = task_data.get("include_sensitive", False)
            
            # Create return object
            connection_info = {
                "id": connection["id"],
                "name": connection["name"],
                "type": connection["type"],
                "created_at": connection["created_at"],
                "last_used": connection["last_used"],
                "last_status": connection["last_status"]
            }
            
            if include_sensitive:
                connection_info["config"] = connection["config"]
            else:
                # Redact sensitive fields
                redacted_config = {}
                sensitive_fields = ["password", "token", "api_key", "secret", "private_key"]
                
                for key, value in connection["config"].items():
                    if any(field in key.lower() for field in sensitive_fields):
                        redacted_config[key] = "********"
                    else:
                        redacted_config[key] = value
                
                connection_info["config"] = redacted_config
            
            # Get sync history
            try:
                conn = sqlite3.connect(self.db_path)
                conn.row_factory = sqlite3.Row
                cursor = conn.cursor()
                
                cursor.execute(
                    "SELECT * FROM sync_history WHERE connection_id = ? ORDER BY started_at DESC LIMIT 5",
                    (connection_id,)
                )
                
                sync_history = []
                for row in cursor.fetchall():
                    sync_history.append({
                        "id": row["id"],
                        "sync_type": row["sync_type"],
                        "started_at": row["started_at"],
                        "completed_at": row["completed_at"],
                        "status": row["status"],
                        "items_processed": row["items_processed"],
                        "error_message": row["error_message"]
                    })
                
                connection_info["sync_history"] = sync_history
                
                conn.close()
            except Exception as history_error:
                self.logger.error(f"Error fetching sync history: {str(history_error)}")
                connection_info["sync_history"] = []
            
            return {
                "status": "success",
                "connection": connection_info
            }
            
        except Exception as e:
            self.logger.error(f"Error getting connection: {str(e)}")
            return {"error": f"Failed to get connection: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def _update_connection(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update an existing API connection"""
        try:
            if "connection_id" not in task_data:
                return {"error": "Missing required parameter: connection_id"}
            
            connection_id = task_data["connection_id"]
            
            # Check if connection exists
            if connection_id not in self.connections:
                return {"error": f"Connection not found: {connection_id}"}
            
            current_connection = self.connections[connection_id]
            
            # Update fields
            name = task_data.get("name", current_connection["name"])
            config = task_data.get("config", current_connection["config"])
            
            # Test new configuration if requested
            test_result = {"status": "untested"}
            if task_data.get("test_on_update", True):
                test_task = {
                    "connection_id": connection_id,
                    "name": name,
                    "type": current_connection["type"],
                    "config": config
                }
                test_result = self._test_connection_config(test_task)
                
                if "error" in test_result:
                    return {
                        "status": "error",
                        "message": "Connection test failed",
                        "test_result": test_result
                    }
            
            # Update database
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                "UPDATE connections SET name = ?, config = ?, last_status = ? WHERE id = ?",
                (name, json.dumps(config), test_result.get("status", "untested"), connection_id)
            )
            
            conn.commit()
            conn.close()
            
            # Update in-memory connection
            self.connections[connection_id]["name"] = name
            self.connections[connection_id]["config"] = config
            self.connections[connection_id]["last_status"] = test_result.get("status", "untested")
            
            return {
                "status": "success",
                "message": "Connection updated successfully",
                "connection_id": connection_id,
                "test_result": test_result
            }
            
        except Exception as e:
            self.logger.error(f"Error updating connection: {str(e)}")
            return {"error": f"Failed to update connection: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def synchronize_data(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Synchronize data with external systems"""
        self.set_status("synchronizing")
        
        # Get synchronization details
        if "connection_id" not in task_data:
            return {"error": "Missing required parameter: connection_id"}
        
        connection_id = task_data["connection_id"]
        sync_type = task_data.get("sync_type", "pull")  # pull or push
        
        # Get the connection
        if connection_id not in self.connections:
            return {"error": f"Connection not found: {connection_id}"}
        
        connection = self.connections[connection_id]
        connection_type = connection["type"]
        
        # Record sync start
        sync_id = self._record_sync_start(connection_id, sync_type)
        
        try:
            start_time = time.time()
            
            if connection_type == "rest_api":
                if sync_type == "pull":
                    result = self._sync_pull_rest_api(connection, task_data)
                else:  # push
                    result = self._sync_push_rest_api(connection, task_data)
            
            elif connection_type == "wfs":
                if sync_type == "pull":
                    result = self._sync_pull_wfs(connection, task_data)
                else:
                    return {"error": "Push synchronization not supported for WFS connections"}
            
            elif connection_type == "database":
                if sync_type == "pull":
                    result = self._sync_pull_database(connection, task_data)
                else:
                    result = self._sync_push_database(connection, task_data)
            
            else:
                result = {"error": f"Unsupported connection type for synchronization: {connection_type}"}
            
            # Record sync end
            if "error" in result:
                self._record_sync_end(sync_id, "error", 0, result["error"])
            else:
                items_processed = result.get("items_processed", 0)
                self._record_sync_end(sync_id, "success", items_processed)
            
            # Add timing information
            result["processing_time"] = time.time() - start_time
            
            return result
            
        except Exception as e:
            self.logger.error(f"Data synchronization error: {str(e)}")
            # Record sync failure
            self._record_sync_end(sync_id, "error", 0, str(e))
            return {"error": f"Data synchronization failed: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def _record_sync_start(self, connection_id: str, sync_type: str) -> int:
        """Record the start of a synchronization operation"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                "INSERT INTO sync_history (connection_id, sync_type, started_at, status) VALUES (?, ?, ?, ?)",
                (connection_id, sync_type, datetime.datetime.now().isoformat(), "in_progress")
            )
            
            sync_id = cursor.lastrowid
            
            conn.commit()
            conn.close()
            
            return sync_id
        except Exception as e:
            self.logger.error(f"Error recording sync start: {str(e)}")
            return -1
    
    def _record_sync_end(self, sync_id: int, status: str, items_processed: int, error_message: str = None):
        """Record the end of a synchronization operation"""
        if sync_id < 0:
            return
            
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(
                "UPDATE sync_history SET completed_at = ?, status = ?, items_processed = ?, error_message = ? WHERE id = ?",
                (datetime.datetime.now().isoformat(), status, items_processed, error_message, sync_id)
            )
            
            conn.commit()
            conn.close()
        except Exception as e:
            self.logger.error(f"Error recording sync end: {str(e)}")
    
    def _sync_pull_rest_api(self, connection: Dict[str, Any], task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Pull data from a REST API"""
        try:
            config = connection["config"]
            base_url = config["base_url"]
            
            # Get endpoint to pull from
            if "endpoint" not in task_data:
                return {"error": "Missing required parameter: endpoint"}
            
            endpoint = task_data["endpoint"]
            output_file = task_data.get("output_file")
            output_format = task_data.get("output_format", "json")
            
            # Construct the URL
            url = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"
            
            # Set up headers and auth
            headers = config.get("headers", {})
            params = task_data.get("params", {})
            auth = None
            
            auth_type = config.get("auth_type")
            if auth_type == "basic":
                auth = (config["username"], config["password"])
            elif auth_type == "bearer":
                if "Authorization" not in headers:
                    headers["Authorization"] = f"Bearer {config['token']}"
            elif auth_type == "api_key":
                api_key = config["api_key"]
                api_key_name = config["api_key_name"]
                api_key_location = config.get("api_key_location", "header")
                
                if api_key_location == "header":
                    headers[api_key_name] = api_key
                elif api_key_location == "query":
                    params[api_key_name] = api_key
            
            # Make the request
            response = requests.get(url, headers=headers, params=params, auth=auth, timeout=30)
            
            if response.status_code >= 400:
                return {
                    "error": f"API request failed: HTTP {response.status_code}",
                    "details": {
                        "status_code": response.status_code,
                        "error_message": response.text[:500]
                    }
                }
            
            # Parse the response based on content type
            content_type = response.headers.get("Content-Type", "")
            
            if "application/json" in content_type:
                data = response.json()
                
                # Save to file if requested
                if output_file:
                    if output_format == "json":
                        with open(output_file, "w") as f:
                            json.dump(data, f, indent=2)
                    elif output_format == "geojson":
                        # Convert to GeoJSON if possible
                        if isinstance(data, list) and "geometry" in data[0]:
                            # Assume it's a feature collection
                            geojson = {
                                "type": "FeatureCollection",
                                "features": data
                            }
                            with open(output_file, "w") as f:
                                json.dump(geojson, f, indent=2)
                        elif "features" in data:
                            # Already a feature collection
                            with open(output_file, "w") as f:
                                json.dump(data, f, indent=2)
                        else:
                            return {"error": "Data does not appear to be GeoJSON compatible"}
                    elif output_format == "csv":
                        # Try to convert to CSV
                        try:
                            if isinstance(data, list):
                                df = pd.DataFrame(data)
                                df.to_csv(output_file, index=False)
                            else:
                                return {"error": "JSON data is not a list of objects, cannot convert to CSV"}
                        except Exception as csv_error:
                            return {"error": f"Failed to convert to CSV: {str(csv_error)}"}
                    else:
                        return {"error": f"Unsupported output format: {output_format}"}
                
                # Count items
                if isinstance(data, list):
                    items_processed = len(data)
                elif isinstance(data, dict) and "features" in data:
                    items_processed = len(data["features"])
                else:
                    items_processed = 1
                
                return {
                    "status": "success",
                    "message": f"Successfully pulled data from {endpoint}",
                    "items_processed": items_processed,
                    "output_file": output_file
                }
            
            elif "text/xml" in content_type or "application/xml" in content_type:
                # XML data
                xml_content = response.text
                
                if output_file:
                    with open(output_file, "w") as f:
                        f.write(xml_content)
                
                # Count XML elements as a simple proxy for items
                items_processed = xml_content.count("</")
                
                return {
                    "status": "success",
                    "message": f"Successfully pulled XML data from {endpoint}",
                    "items_processed": items_processed,
                    "output_file": output_file
                }
            
            else:
                # Binary or unknown content
                if output_file:
                    with open(output_file, "wb") as f:
                        f.write(response.content)
                
                return {
                    "status": "success",
                    "message": f"Successfully pulled data from {endpoint}",
                    "items_processed": 1,
                    "content_type": content_type,
                    "content_length": len(response.content),
                    "output_file": output_file
                }
            
        except Exception as e:
            self.logger.error(f"Error pulling data from REST API: {str(e)}")
            return {"error": f"Failed to pull data from REST API: {str(e)}"}
    
    def _sync_push_rest_api(self, connection: Dict[str, Any], task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Push data to a REST API"""
        try:
            config = connection["config"]
            base_url = config["base_url"]
            
            # Get endpoint to push to
            if "endpoint" not in task_data:
                return {"error": "Missing required parameter: endpoint"}
            
            endpoint = task_data["endpoint"]
            
            # Get data to push
            if "data" not in task_data and "input_file" not in task_data:
                return {"error": "Missing required parameter: data or input_file"}
            
            # Construct the URL
            url = f"{base_url.rstrip('/')}/{endpoint.lstrip('/')}"
            
            # Set up headers, auth, and method
            headers = config.get("headers", {})
            params = task_data.get("params", {})
            method = task_data.get("method", "POST").upper()
            auth = None
            
            auth_type = config.get("auth_type")
            if auth_type == "basic":
                auth = (config["username"], config["password"])
            elif auth_type == "bearer":
                if "Authorization" not in headers:
                    headers["Authorization"] = f"Bearer {config['token']}"
            elif auth_type == "api_key":
                api_key = config["api_key"]
                api_key_name = config["api_key_name"]
                api_key_location = config.get("api_key_location", "header")
                
                if api_key_location == "header":
                    headers[api_key_name] = api_key
                elif api_key_location == "query":
                    params[api_key_name] = api_key
            
            # Prepare the data
            if "data" in task_data:
                data = task_data["data"]
            else:
                # Read from input file
                input_file = task_data["input_file"]
                input_format = task_data.get("input_format")
                
                if not input_format:
                    # Try to guess format from extension
                    if input_file.endswith(".json") or input_file.endswith(".geojson"):
                        input_format = "json"
                    elif input_file.endswith(".csv"):
                        input_format = "csv"
                    elif input_file.endswith(".xml"):
                        input_format = "xml"
                    else:
                        input_format = "binary"
                
                # Read the file
                if input_format == "json":
                    with open(input_file, "r") as f:
                        data = json.load(f)
                elif input_format == "csv":
                    df = pd.read_csv(input_file)
                    data = df.to_dict(orient="records")
                elif input_format == "xml":
                    with open(input_file, "r") as f:
                        data = f.read()  # Read as string
                else:
                    with open(input_file, "rb") as f:
                        data = f.read()  # Read as binary
            
            # Make the request
            if method == "POST":
                if isinstance(data, (dict, list)):
                    if "Content-Type" not in headers:
                        headers["Content-Type"] = "application/json"
                    response = requests.post(url, json=data, headers=headers, params=params, auth=auth, timeout=30)
                elif isinstance(data, str) and input_format == "xml":
                    if "Content-Type" not in headers:
                        headers["Content-Type"] = "application/xml"
                    response = requests.post(url, data=data, headers=headers, params=params, auth=auth, timeout=30)
                else:
                    # Binary data
                    response = requests.post(url, data=data, headers=headers, params=params, auth=auth, timeout=30)
            
            elif method == "PUT":
                if isinstance(data, (dict, list)):
                    if "Content-Type" not in headers:
                        headers["Content-Type"] = "application/json"
                    response = requests.put(url, json=data, headers=headers, params=params, auth=auth, timeout=30)
                elif isinstance(data, str) and input_format == "xml":
                    if "Content-Type" not in headers:
                        headers["Content-Type"] = "application/xml"
                    response = requests.put(url, data=data, headers=headers, params=params, auth=auth, timeout=30)
                else:
                    # Binary data
                    response = requests.put(url, data=data, headers=headers, params=params, auth=auth, timeout=30)
            
            else:
                return {"error": f"Unsupported HTTP method: {method}"}
            
            if response.status_code >= 400:
                return {
                    "error": f"API request failed: HTTP {response.status_code}",
                    "details": {
                        "status_code": response.status_code,
                        "error_message": response.text[:500]
                    }
                }
            
            # Count items
            if isinstance(data, list):
                items_processed = len(data)
            elif isinstance(data, dict) and "features" in data:
                items_processed = len(data["features"])
            else:
                items_processed = 1
            
            # Parse the response
            try:
                if "application/json" in response.headers.get("Content-Type", ""):
                    response_data = response.json()
                else:
                    response_data = response.text[:500]  # Truncate large responses
            except Exception:
                response_data = None
            
            return {
                "status": "success",
                "message": f"Successfully pushed data to {endpoint}",
                "items_processed": items_processed,
                "status_code": response.status_code,
                "response": response_data
            }
            
        except Exception as e:
            self.logger.error(f"Error pushing data to REST API: {str(e)}")
            return {"error": f"Failed to push data to REST API: {str(e)}"}
    
    def _sync_pull_wfs(self, connection: Dict[str, Any], task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Pull data from a WFS service"""
        try:
            config = connection["config"]
            url = config["url"]
            
            # Get layer to fetch
            if "layer" not in task_data:
                return {"error": "Missing required parameter: layer"}
            
            layer = task_data["layer"]
            output_file = task_data.get("output_file")
            
            # Construct WFS request
            params = {
                "service": "WFS",
                "version": "2.0.0",
                "request": "GetFeature",
                "typeName": layer,
                "outputFormat": "application/json"
            }
            
            # Add any extra parameters from task_data
            extra_params = task_data.get("params", {})
            params.update(extra_params)
            
            # Make the request
            response = requests.get(url, params=params, timeout=30)
            
            if response.status_code >= 400:
                return {
                    "error": f"WFS request failed: HTTP {response.status_code}",
                    "details": {
                        "status_code": response.status_code,
                        "error_message": response.text[:500]
                    }
                }
            
            # Try to parse as GeoJSON
            try:
                geojson = response.json()
                
                # Save to file if requested
                if output_file:
                    with open(output_file, "w") as f:
                        json.dump(geojson, f, indent=2)
                
                # Count features
                feature_count = len(geojson.get("features", []))
                
                return {
                    "status": "success",
                    "message": f"Successfully pulled layer {layer} from WFS",
                    "items_processed": feature_count,
                    "output_file": output_file,
                    "bbox": geojson.get("bbox")
                }
            except json.JSONDecodeError:
                # Not JSON, might be GML or another format
                if output_file:
                    with open(output_file, "wb") as f:
                        f.write(response.content)
                
                return {
                    "status": "success",
                    "message": f"Successfully pulled layer {layer} from WFS (non-JSON format)",
                    "items_processed": 1,
                    "output_file": output_file,
                    "content_type": response.headers.get("Content-Type")
                }
            
        except Exception as e:
            self.logger.error(f"Error pulling data from WFS: {str(e)}")
            return {"error": f"Failed to pull data from WFS: {str(e)}"}
    
    def _sync_pull_database(self, connection: Dict[str, Any], task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Pull data from a database"""
        try:
            config = connection["config"]
            database_url = config["database_url"]
            
            # Get query to execute
            if "query" not in task_data:
                return {"error": "Missing required parameter: query"}
            
            query = task_data["query"]
            output_file = task_data.get("output_file")
            
            # Parse the URL to determine the database type
            parsed_url = urlparse(database_url)
            db_type = parsed_url.scheme.split('+')[0]
            
            if db_type == "sqlite":
                # SQLite connection
                conn = sqlite3.connect(parsed_url.path)
                df = pd.read_sql_query(query, conn)
                conn.close()
                
            elif db_type in ("postgresql", "postgres"):
                # PostgreSQL connection
                import psycopg2
                from psycopg2 import sql
                
                # Extract connection parameters from URL
                db_host = parsed_url.hostname
                db_port = parsed_url.port or 5432
                db_name = parsed_url.path.lstrip('/')
                db_user = parsed_url.username
                db_password = parsed_url.password
                
                conn = psycopg2.connect(
                    host=db_host,
                    port=db_port,
                    dbname=db_name,
                    user=db_user,
                    password=db_password
                )
                
                df = pd.read_sql_query(query, conn)
                conn.close()
                
            else:
                return {"error": f"Unsupported database type: {db_type}"}
            
            # Check if any results were returned
            if df.empty:
                return {
                    "status": "success",
                    "message": "Query executed successfully, but no rows were returned",
                    "items_processed": 0
                }
            
            # Save to file if requested
            if output_file:
                output_format = task_data.get("output_format", "csv")
                
                if output_format == "csv":
                    df.to_csv(output_file, index=False)
                elif output_format == "json":
                    df.to_json(output_file, orient="records", indent=2)
                elif output_format == "geojson":
                    # Check if the DataFrame has geometry column
                    if "geometry" in df.columns or "geom" in df.columns:
                        try:
                            # Try to convert to GeoDataFrame
                            geometry_col = "geometry" if "geometry" in df.columns else "geom"
                            gdf = gpd.GeoDataFrame(df, geometry=geometry_col)
                            gdf.to_file(output_file, driver="GeoJSON")
                        except Exception as geom_error:
                            return {"error": f"Failed to convert to GeoJSON: {str(geom_error)}"}
                    else:
                        return {"error": "DataFrame has no geometry column, cannot convert to GeoJSON"}
                else:
                    return {"error": f"Unsupported output format: {output_format}"}
            
            return {
                "status": "success",
                "message": "Successfully executed database query",
                "items_processed": len(df),
                "columns": list(df.columns),
                "output_file": output_file
            }
            
        except Exception as e:
            self.logger.error(f"Error pulling data from database: {str(e)}")
            return {"error": f"Failed to pull data from database: {str(e)}"}
    
    def _sync_push_database(self, connection: Dict[str, Any], task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Push data to a database"""
        try:
            config = connection["config"]
            database_url = config["database_url"]
            
            # Get table to insert into
            if "table" not in task_data:
                return {"error": "Missing required parameter: table"}
            
            table = task_data["table"]
            
            # Get data to push
            if "data" not in task_data and "input_file" not in task_data:
                return {"error": "Missing required parameter: data or input_file"}
            
            # Parse the URL to determine the database type
            parsed_url = urlparse(database_url)
            db_type = parsed_url.scheme.split('+')[0]
            
            # Prepare the data
            if "data" in task_data:
                data = task_data["data"]
                
                # Convert to DataFrame if it's a dictionary or list
                if isinstance(data, dict):
                    df = pd.DataFrame([data])
                elif isinstance(data, list):
                    df = pd.DataFrame(data)
                else:
                    return {"error": "Data must be a dictionary or list"}
            else:
                # Read from input file
                input_file = task_data["input_file"]
                input_format = task_data.get("input_format")
                
                if not input_format:
                    # Try to guess format from extension
                    if input_file.endswith(".csv"):
                        input_format = "csv"
                    elif input_file.endswith(".json") or input_file.endswith(".geojson"):
                        input_format = "json"
                    else:
                        return {"error": "Could not determine input format, please specify"}
                
                # Read the file
                if input_format == "csv":
                    df = pd.read_csv(input_file)
                elif input_format == "json":
                    df = pd.read_json(input_file, orient="records")
                elif input_format == "geojson":
                    # Read as GeoDataFrame
                    gdf = gpd.read_file(input_file)
                    df = pd.DataFrame(gdf.drop(columns="geometry"))
                    # Convert geometry to WKT
                    df["geometry"] = gdf.geometry.apply(lambda g: g.wkt)
                else:
                    return {"error": f"Unsupported input format: {input_format}"}
            
            # Execute database operation
            if db_type == "sqlite":
                # SQLite connection
                conn = sqlite3.connect(parsed_url.path)
                
                # Insert data
                df.to_sql(table, conn, if_exists="append", index=False)
                
                conn.close()
                
            elif db_type in ("postgresql", "postgres"):
                # PostgreSQL connection
                import psycopg2
                from sqlalchemy import create_engine
                
                engine = create_engine(database_url)
                
                # Insert data
                df.to_sql(table, engine, if_exists="append", index=False)
                
                engine.dispose()
                
            else:
                return {"error": f"Unsupported database type: {db_type}"}
            
            return {
                "status": "success",
                "message": f"Successfully inserted data into table {table}",
                "items_processed": len(df),
                "columns": list(df.columns)
            }
            
        except Exception as e:
            self.logger.error(f"Error pushing data to database: {str(e)}")
            return {"error": f"Failed to push data to database: {str(e)}"}
    
    def handle_webhook(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle incoming webhook data"""
        self.set_status("handling_webhook")
        
        try:
            # Required parameters
            if "webhook_data" not in task_data:
                return {"error": "Missing required parameter: webhook_data"}
            
            webhook_data = task_data["webhook_data"]
            webhook_type = task_data.get("webhook_type", "generic")
            
            # Process webhook based on type
            if webhook_type == "github":
                return self._process_github_webhook(webhook_data)
            elif webhook_type == "geoserver":
                return self._process_geoserver_webhook(webhook_data)
            else:
                # Generic webhook processing
                return self._process_generic_webhook(webhook_data)
            
        except Exception as e:
            self.logger.error(f"Webhook handling error: {str(e)}")
            return {"error": f"Failed to handle webhook: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def _process_github_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a GitHub webhook"""
        try:
            # Extract event type from GitHub webhook
            event_type = webhook_data.get("event", "push")
            repository = webhook_data.get("repository", {}).get("full_name", "unknown")
            
            # Initialize GitHub integrator if needed
            try:
                # Import here to avoid circular imports
                from ..integrators.github_integrator import GitHubIntegrator
                github_integrator = GitHubIntegrator()
            except ImportError as e:
                self.logger.warning(f"Could not load GitHub integrator: {str(e)}")
                github_integrator = None
            
            # Handle different event types
            if event_type == "push":
                # Process push event
                commits = webhook_data.get("commits", [])
                branch = webhook_data.get("ref", "").replace("refs/heads/", "")
                
                # TODO: Use GitHub integrator for enhanced push processing
                
                return {
                    "status": "success",
                    "message": f"Processed GitHub push webhook for {repository}",
                    "details": {
                        "repository": repository,
                        "branch": branch,
                        "commit_count": len(commits)
                    }
                }
                
            elif event_type == "pull_request":
                # Process pull request event
                action = webhook_data.get("action", "")
                pr_number = webhook_data.get("number", 0)
                
                # Use GitHub integrator for advanced PR processing if available
                if github_integrator:
                    self.logger.info(f"Using GitHub integrator to process PR #{pr_number}")
                    result = github_integrator.process_pull_request(webhook_data)
                    
                    # Combine integrator result with our basic info
                    if "error" not in result:
                        result["status"] = "success"
                        result["message"] = f"Processed GitHub pull_request webhook for {repository} using integrator"
                        
                        # Ensure we have the basic info in the details
                        if "details" not in result:
                            result["details"] = {}
                        
                        result["details"].update({
                            "repository": repository,
                            "action": action,
                            "pr_number": pr_number
                        })
                    
                    return result
                else:
                    # Fallback to basic processing
                    self.logger.warning("GitHub integrator not available, using basic PR processing")
                    return {
                        "status": "success",
                        "message": f"Processed GitHub pull_request webhook for {repository}",
                        "details": {
                            "repository": repository,
                            "action": action,
                            "pr_number": pr_number
                        }
                    }
                
            else:
                return {
                    "status": "success",
                    "message": f"Processed GitHub {event_type} webhook for {repository}",
                    "details": {
                        "repository": repository,
                        "event_type": event_type
                    }
                }
                
        except Exception as e:
            self.logger.error(f"Error processing GitHub webhook: {str(e)}")
            return {"error": f"Failed to process GitHub webhook: {str(e)}"}
    
    def _process_geoserver_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a GeoServer webhook"""
        try:
            # Extract event info from GeoServer webhook
            event_type = webhook_data.get("eventType", "unknown")
            workspace = webhook_data.get("workspace", "unknown")
            layer = webhook_data.get("layer", "unknown")
            
            # Process event
            return {
                "status": "success",
                "message": f"Processed GeoServer {event_type} webhook",
                "details": {
                    "workspace": workspace,
                    "layer": layer,
                    "event_type": event_type
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error processing GeoServer webhook: {str(e)}")
            return {"error": f"Failed to process GeoServer webhook: {str(e)}"}
    
    def _process_generic_webhook(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a generic webhook"""
        try:
            # For generic webhooks, just validate and return the data
            if not webhook_data:
                return {"error": "Empty webhook data"}
            
            # Calculate some basic stats about the webhook data
            data_keys = webhook_data.keys() if isinstance(webhook_data, dict) else []
            data_type = type(webhook_data).__name__
            
            return {
                "status": "success",
                "message": "Processed generic webhook",
                "details": {
                    "data_type": data_type,
                    "keys": list(data_keys),
                    "webhook_data": webhook_data
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error processing generic webhook: {str(e)}")
            return {"error": f"Failed to process generic webhook: {str(e)}"}
    
    def manage_scheduled_tasks(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Manage scheduled periodic tasks"""
        self.set_status("managing_tasks")
        
        # Get the operation type
        operation = task_data.get("operation", "list")
        
        if operation == "create":
            return self._create_scheduled_task(task_data)
        elif operation == "list":
            return self._list_scheduled_tasks(task_data)
        elif operation == "delete":
            return self._delete_scheduled_task(task_data)
        elif operation == "get":
            return self._get_scheduled_task(task_data)
        elif operation == "update":
            return self._update_scheduled_task(task_data)
        else:
            return {"error": f"Unsupported scheduled task operation: {operation}"}
    
    def _create_scheduled_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new scheduled task"""
        try:
            # Required parameters
            if "name" not in task_data or "interval" not in task_data or "task_data" not in task_data:
                return {"error": "Missing required parameters: name, interval, task_data"}
            
            name = task_data["name"]
            interval = float(task_data["interval"])  # Interval in seconds
            task_def = task_data["task_data"]
            
            # Validate task_data
            if "task_type" not in task_def:
                return {"error": "Missing task_type in task_data"}
            
            # Generate task ID
            timestamp = int(time.time())
            task_hash = hashlib.md5(f"{name}:{timestamp}".encode()).hexdigest()[:8]
            task_id = f"task_{task_hash}"
            
            # Create the scheduled task
            scheduled_task = {
                "id": task_id,
                "name": name,
                "interval": interval,
                "task_data": task_def,
                "created_at": time.time(),
                "next_run": time.time() + interval,
                "last_run": None,
                "status": "idle",
                "last_result": None
            }
            
            # Add to scheduled tasks
            self.scheduled_tasks[task_id] = scheduled_task
            
            # Ensure scheduler is running
            if not self.scheduler_active:
                self.start_scheduler()
            
            return {
                "status": "success",
                "message": "Scheduled task created successfully",
                "task_id": task_id,
                "next_run": datetime.datetime.fromtimestamp(scheduled_task["next_run"]).isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error creating scheduled task: {str(e)}")
            return {"error": f"Failed to create scheduled task: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def _list_scheduled_tasks(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """List all scheduled tasks"""
        try:
            # Get optional filters
            task_type = task_data.get("task_type")
            
            tasks = []
            for task_id, task in self.scheduled_tasks.items():
                if task_type and task["task_data"].get("task_type") != task_type:
                    continue
                
                # Create simplified task info
                task_info = {
                    "id": task["id"],
                    "name": task["name"],
                    "interval": task["interval"],
                    "status": task["status"],
                    "created_at": task["created_at"],
                    "next_run": task["next_run"],
                    "last_run": task["last_run"],
                    "task_type": task["task_data"].get("task_type")
                }
                
                tasks.append(task_info)
            
            return {
                "status": "success",
                "tasks": tasks,
                "count": len(tasks),
                "scheduler_active": self.scheduler_active
            }
            
        except Exception as e:
            self.logger.error(f"Error listing scheduled tasks: {str(e)}")
            return {"error": f"Failed to list scheduled tasks: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def _delete_scheduled_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Delete a scheduled task"""
        try:
            # Required parameters
            if "task_id" not in task_data:
                return {"error": "Missing required parameter: task_id"}
            
            task_id = task_data["task_id"]
            
            # Check if task exists
            if task_id not in self.scheduled_tasks:
                return {"error": f"Task not found: {task_id}"}
            
            # Remove the task
            task = self.scheduled_tasks.pop(task_id)
            
            return {
                "status": "success",
                "message": f"Scheduled task '{task['name']}' deleted successfully",
                "task_id": task_id
            }
            
        except Exception as e:
            self.logger.error(f"Error deleting scheduled task: {str(e)}")
            return {"error": f"Failed to delete scheduled task: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def _get_scheduled_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get details of a specific scheduled task"""
        try:
            # Required parameters
            if "task_id" not in task_data:
                return {"error": "Missing required parameter: task_id"}
            
            task_id = task_data["task_id"]
            
            # Check if task exists
            if task_id not in self.scheduled_tasks:
                return {"error": f"Task not found: {task_id}"}
            
            task = self.scheduled_tasks[task_id]
            
            # Format timestamps
            next_run = datetime.datetime.fromtimestamp(task["next_run"]).isoformat() if task["next_run"] else None
            last_run = datetime.datetime.fromtimestamp(task["last_run"]).isoformat() if task["last_run"] else None
            created_at = datetime.datetime.fromtimestamp(task["created_at"]).isoformat() if task["created_at"] else None
            
            # Create detailed task info
            task_info = {
                "id": task["id"],
                "name": task["name"],
                "interval": task["interval"],
                "status": task["status"],
                "created_at": created_at,
                "next_run": next_run,
                "last_run": last_run,
                "task_data": task["task_data"],
                "last_result": task["last_result"]
            }
            
            return {
                "status": "success",
                "task": task_info
            }
            
        except Exception as e:
            self.logger.error(f"Error getting scheduled task: {str(e)}")
            return {"error": f"Failed to get scheduled task: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def _update_scheduled_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Update a scheduled task"""
        try:
            # Required parameters
            if "task_id" not in task_data:
                return {"error": "Missing required parameter: task_id"}
            
            task_id = task_data["task_id"]
            
            # Check if task exists
            if task_id not in self.scheduled_tasks:
                return {"error": f"Task not found: {task_id}"}
            
            task = self.scheduled_tasks[task_id]
            
            # Update fields
            if "name" in task_data:
                task["name"] = task_data["name"]
            
            if "interval" in task_data:
                task["interval"] = float(task_data["interval"])
                # Recalculate next run time
                task["next_run"] = time.time() + task["interval"]
            
            if "task_data" in task_data:
                # Validate task_data
                if "task_type" not in task_data["task_data"]:
                    return {"error": "Missing task_type in task_data"}
                task["task_data"] = task_data["task_data"]
            
            return {
                "status": "success",
                "message": f"Scheduled task '{task['name']}' updated successfully",
                "task_id": task_id,
                "next_run": datetime.datetime.fromtimestamp(task["next_run"]).isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error updating scheduled task: {str(e)}")
            return {"error": f"Failed to update scheduled task: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def transform_data_format(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Transform data between different formats"""
        self.set_status("transforming_data")
        
        try:
            # Required parameters
            if "input_file" not in task_data or "output_file" not in task_data:
                return {"error": "Missing required parameters: input_file, output_file"}
            
            input_file = task_data["input_file"]
            output_file = task_data["output_file"]
            
            # Determine input and output formats
            input_format = task_data.get("input_format")
            output_format = task_data.get("output_format")
            
            if not input_format:
                # Try to guess from extension
                if input_file.endswith(".csv"):
                    input_format = "csv"
                elif input_file.endswith(".json"):
                    input_format = "json"
                elif input_file.endswith(".geojson"):
                    input_format = "geojson"
                elif input_file.endswith(".shp"):
                    input_format = "shapefile"
                elif input_file.endswith(".gpkg"):
                    input_format = "geopackage"
                else:
                    return {"error": "Could not determine input format, please specify"}
            
            if not output_format:
                # Try to guess from extension
                if output_file.endswith(".csv"):
                    output_format = "csv"
                elif output_file.endswith(".json"):
                    output_format = "json"
                elif output_file.endswith(".geojson"):
                    output_format = "geojson"
                elif output_file.endswith(".shp"):
                    output_format = "shapefile"
                elif output_file.endswith(".gpkg"):
                    output_format = "geopackage"
                else:
                    return {"error": "Could not determine output format, please specify"}
            
            # Read the input file
            if input_format in ["geojson", "shapefile", "geopackage"]:
                # Spatial data formats
                data = gpd.read_file(input_file)
            elif input_format == "csv":
                # Check if it has geometry columns
                df = pd.read_csv(input_file)
                
                # Check for common geometry column names
                if "geometry" in df.columns or "wkt" in df.columns or "geom" in df.columns:
                    try:
                        # Try to convert to GeoDataFrame
                        if "geometry" in df.columns:
                            geometry_col = "geometry"
                        elif "wkt" in df.columns:
                            geometry_col = "wkt"
                        else:
                            geometry_col = "geom"
                        
                        from shapely import wkt
                        df[geometry_col] = df[geometry_col].apply(wkt.loads)
                        data = gpd.GeoDataFrame(df, geometry=geometry_col)
                    except Exception:
                        # Fall back to regular DataFrame
                        data = df
                else:
                    data = df
            elif input_format == "json":
                # Read JSON
                with open(input_file, "r") as f:
                    json_data = json.load(f)
                
                # Check if it's GeoJSON
                if isinstance(json_data, dict) and json_data.get("type") == "FeatureCollection":
                    data = gpd.read_file(input_file)
                else:
                    # Regular JSON to DataFrame
                    data = pd.DataFrame(json_data)
            else:
                return {"error": f"Unsupported input format: {input_format}"}
            
            # Transform to output format
            if output_format == "csv":
                # If it's a GeoDataFrame, convert geometry to WKT
                if isinstance(data, gpd.GeoDataFrame):
                    df = pd.DataFrame(data.drop(columns="geometry"))
                    df["geometry"] = data.geometry.apply(lambda g: g.wkt)
                    df.to_csv(output_file, index=False)
                else:
                    data.to_csv(output_file, index=False)
                
            elif output_format == "json":
                # Convert to JSON
                if isinstance(data, gpd.GeoDataFrame) or isinstance(data, pd.DataFrame):
                    data.to_json(output_file, orient="records", indent=2)
                else:
                    with open(output_file, "w") as f:
                        json.dump(data, f, indent=2)
                
            elif output_format == "geojson":
                # Convert to GeoJSON
                if isinstance(data, gpd.GeoDataFrame):
                    data.to_file(output_file, driver="GeoJSON")
                else:
                    return {"error": "Input data does not have geometry information, cannot convert to GeoJSON"}
                
            elif output_format == "shapefile":
                # Convert to Shapefile
                if isinstance(data, gpd.GeoDataFrame):
                    data.to_file(output_file)
                else:
                    return {"error": "Input data does not have geometry information, cannot convert to Shapefile"}
                
            elif output_format == "geopackage":
                # Convert to GeoPackage
                if isinstance(data, gpd.GeoDataFrame):
                    data.to_file(output_file, driver="GPKG")
                else:
                    return {"error": "Input data does not have geometry information, cannot convert to GeoPackage"}
                
            else:
                return {"error": f"Unsupported output format: {output_format}"}
            
            # Get row count
            if isinstance(data, (gpd.GeoDataFrame, pd.DataFrame)):
                row_count = len(data)
            elif isinstance(data, dict) and "features" in data:
                row_count = len(data["features"])
            elif isinstance(data, list):
                row_count = len(data)
            else:
                row_count = 1
            
            return {
                "status": "success",
                "message": f"Successfully transformed data from {input_format} to {output_format}",
                "items_processed": row_count,
                "input_file": input_file,
                "output_file": output_file
            }
            
        except Exception as e:
            self.logger.error(f"Data format transformation error: {str(e)}")
            return {"error": f"Failed to transform data format: {str(e)}"}
        finally:
            self.set_status("idle")

# Register this agent with the MCP
mcp_instance.register_agent("integration", IntegrationAgent())