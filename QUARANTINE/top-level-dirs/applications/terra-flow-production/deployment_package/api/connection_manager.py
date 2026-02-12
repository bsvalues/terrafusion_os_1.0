"""
Connection Manager Module

This module provides utilities for managing database connections across
multiple microservices and third-party applications, ensuring proper
connection pooling, load balancing, and security.
"""

import os
import logging
import json
import time
import threading
from typing import Dict, Any, List, Optional, Union, Callable
from queue import Queue
import uuid

# Configure logging
logger = logging.getLogger(__name__)

# Import database utilities conditionally
try:
    from supabase_client import get_supabase_client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False
    logger.warning("Supabase client not available, using SQLAlchemy only")

# Import SQLAlchemy utilities
from app import db
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from config_loader import is_supabase_enabled, get_database_config

class ConnectionPool:
    """Connection pool for database connections"""
    
    def __init__(self, max_size=10, timeout=30):
        """
        Initialize connection pool
        
        Args:
            max_size: Maximum number of connections in the pool
            timeout: Connection timeout in seconds
        """
        self.max_size = max_size
        self.timeout = timeout
        self.connections = Queue(maxsize=max_size)
        self.size = 0
        self.lock = threading.RLock()
        
        # Connection factory functions
        self.supabase_factory = self._create_supabase_client
        self.sqlalchemy_factory = self._create_sqlalchemy_session
        
        # Use Supabase if available and enabled
        self.use_supabase = is_supabase_enabled() and HAS_SUPABASE
        self.db_config = get_database_config()
        
        logger.info(
            f"Connection pool initialized with max_size={max_size}, "
            f"timeout={timeout}, use_supabase={self.use_supabase}"
        )
    
    def get_connection(self):
        """
        Get a connection from the pool or create a new one
        
        Returns:
            Database connection object
        """
        try:
            # Try to get a connection from the pool
            connection = self.connections.get(block=False)
            logger.debug("Retrieved connection from pool")
            return connection
        except:
            # If pool is empty, create a new connection
            with self.lock:
                if self.size < self.max_size:
                    connection = self._create_connection()
                    self.size += 1
                    logger.debug(f"Created new connection, pool size={self.size}")
                    return connection
                
                # If pool is full, wait for a connection
                try:
                    connection = self.connections.get(timeout=self.timeout)
                    logger.debug("Retrieved connection from pool after waiting")
                    return connection
                except:
                    logger.error("Connection pool timeout, could not get connection")
                    raise Exception("Connection pool timeout")
    
    def release_connection(self, connection):
        """
        Release a connection back to the pool
        
        Args:
            connection: Database connection object
        """
        self.connections.put(connection)
        logger.debug("Released connection back to pool")
    
    def _create_connection(self):
        """
        Create a new database connection
        
        Returns:
            Database connection object
        """
        if self.use_supabase:
            return self.supabase_factory()
        else:
            return self.sqlalchemy_factory()
    
    def _create_supabase_client(self):
        """
        Create a new Supabase client
        
        Returns:
            Supabase client
        """
        client = get_supabase_client()
        if not client:
            logger.error("Failed to create Supabase client")
            raise Exception("Failed to create Supabase client")
        return client
    
    def _create_sqlalchemy_session(self):
        """
        Create a new SQLAlchemy session
        
        Returns:
            SQLAlchemy session
        """
        connection_string = self.db_config.get('connection_string')
        if not connection_string:
            connection_string = os.environ.get('DATABASE_URL')
            
        if not connection_string:
            logger.error("No database connection string configured")
            raise Exception("No database connection string configured")
            
        engine = create_engine(connection_string, pool_recycle=300, pool_pre_ping=True)
        session_factory = sessionmaker(bind=engine)
        session = scoped_session(session_factory)
        return session
    
    def close_all(self):
        """Close all connections in the pool"""
        with self.lock:
            while not self.connections.empty():
                connection = self.connections.get()
                self._close_connection(connection)
            self.size = 0
            logger.info("Closed all connections in pool")
    
    def _close_connection(self, connection):
        """
        Close a database connection
        
        Args:
            connection: Database connection object
        """
        try:
            if self.use_supabase:
                # No specific close method for Supabase client
                pass
            else:
                connection.remove()
        except Exception as e:
            logger.error(f"Error closing connection: {str(e)}")


class ConnectionManager:
    """
    Connection manager for microservices and third-party applications
    
    This class provides a centralized way to manage database connections
    across multiple services, ensuring proper connection pooling,
    load balancing, and security.
    """
    
    def __init__(self):
        """Initialize connection manager"""
        # Dictionary of service connections
        # {service_id: {"pool": connection_pool, "metadata": {...}}}
        self.services = {}
        
        # Connection pool for main application
        self.main_pool = ConnectionPool()
        
        # Lock for thread safety
        self.lock = threading.RLock()
        
        logger.info("Connection manager initialized")
    
    def register_service(self, service_name, service_type='microservice', 
                        max_connections=5, metadata=None):
        """
        Register a new service
        
        Args:
            service_name: Name of the service
            service_type: Type of service (microservice, third-party, etc.)
            max_connections: Maximum number of connections for the service
            metadata: Additional metadata about the service
            
        Returns:
            Service ID
        """
        with self.lock:
            # Generate a unique service ID
            service_id = str(uuid.uuid4())
            
            # Create metadata
            service_metadata = {
                'id': service_id,
                'name': service_name,
                'type': service_type,
                'registered_at': time.time(),
                'last_active': time.time(),
                'max_connections': max_connections
            }
            
            # Add custom metadata
            if metadata:
                service_metadata.update(metadata)
            
            # Create connection pool for the service
            pool = ConnectionPool(max_size=max_connections)
            
            # Add service to registry
            self.services[service_id] = {
                'pool': pool,
                'metadata': service_metadata
            }
            
            logger.info(f"Registered service: {service_name} (ID: {service_id})")
            return service_id
    
    def unregister_service(self, service_id):
        """
        Unregister a service
        
        Args:
            service_id: ID of the service to unregister
            
        Returns:
            True if successful, False otherwise
        """
        with self.lock:
            if service_id not in self.services:
                logger.warning(f"Service not found: {service_id}")
                return False
            
            # Close all connections in the pool
            self.services[service_id]['pool'].close_all()
            
            # Remove service from registry
            service_name = self.services[service_id]['metadata']['name']
            del self.services[service_id]
            
            logger.info(f"Unregistered service: {service_name} (ID: {service_id})")
            return True
    
    def get_connection(self, service_id=None):
        """
        Get a database connection
        
        Args:
            service_id: Optional ID of the service requesting the connection
            
        Returns:
            Database connection object
        """
        if service_id and service_id in self.services:
            # Get connection from service pool
            pool = self.services[service_id]['pool']
            
            # Update last active timestamp
            self.services[service_id]['metadata']['last_active'] = time.time()
            
            return pool.get_connection()
        else:
            # Get connection from main pool
            return self.main_pool.get_connection()
    
    def release_connection(self, connection, service_id=None):
        """
        Release a database connection
        
        Args:
            connection: Database connection object
            service_id: Optional ID of the service releasing the connection
        """
        if service_id and service_id in self.services:
            # Release connection to service pool
            pool = self.services[service_id]['pool']
            pool.release_connection(connection)
        else:
            # Release connection to main pool
            self.main_pool.release_connection(connection)
    
    def cleanup_inactive_services(self, inactive_threshold=3600):
        """
        Cleanup inactive services
        
        Args:
            inactive_threshold: Time in seconds after which a service is considered inactive
            
        Returns:
            Number of services cleaned up
        """
        with self.lock:
            current_time = time.time()
            inactive_services = []
            
            # Find inactive services
            for service_id, service in self.services.items():
                last_active = service['metadata']['last_active']
                if current_time - last_active > inactive_threshold:
                    inactive_services.append(service_id)
            
            # Unregister inactive services
            for service_id in inactive_services:
                self.unregister_service(service_id)
            
            logger.info(f"Cleaned up {len(inactive_services)} inactive services")
            return len(inactive_services)
    
    def get_service_info(self, service_id=None):
        """
        Get information about registered services
        
        Args:
            service_id: Optional ID of specific service to get info for
            
        Returns:
            Service information
        """
        with self.lock:
            if service_id:
                if service_id not in self.services:
                    return None
                return self.services[service_id]['metadata']
            else:
                return {sid: service['metadata'] for sid, service in self.services.items()}
    
    def execute_with_connection(self, callback, service_id=None):
        """
        Execute a callback function with a database connection
        
        Args:
            callback: Function to execute with the connection
            service_id: Optional ID of the service requesting the connection
            
        Returns:
            Result of the callback function
        """
        connection = self.get_connection(service_id)
        try:
            return callback(connection)
        finally:
            self.release_connection(connection, service_id)
    
    def close_all_connections(self):
        """Close all connections in all pools"""
        with self.lock:
            # Close connections in main pool
            self.main_pool.close_all()
            
            # Close connections in service pools
            for service_id, service in self.services.items():
                service['pool'].close_all()
            
            logger.info("Closed all connections")

# Create singleton instance
connection_manager = ConnectionManager()