"""
Supabase Connection Pool

This module provides a connection pool for Supabase clients,
to avoid creating new connections for each request.
"""

import os
import logging
import threading
import time
from typing import Dict, Any, Optional, Tuple, Union, List
from datetime import datetime, timedelta

try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Thread-local storage for client connections
local = threading.local()

# Connection pool
_connection_pool = {}
_pool_lock = threading.RLock()

# Connection pool configuration
MAX_POOL_SIZE = 10
IDLE_TIMEOUT_SECONDS = 300  # 5 minutes

class PooledConnection:
    """
    A connection in the connection pool.
    """
    
    def __init__(self, client: Any, url: str, key: str):
        """
        Initialize a new pooled connection.
        
        Args:
            client: Supabase client
            url: Supabase URL
            key: Supabase API key or service key
        """
        self.client = client
        self.url = url
        self.key = key
        self.last_used = time.time()
        self.in_use = False
    
    def acquire(self) -> Any:
        """
        Acquire the connection.
        
        Returns:
            Supabase client
        """
        self.in_use = True
        self.last_used = time.time()
        return self.client
    
    def release(self) -> None:
        """Release the connection back to the pool."""
        self.in_use = False
        self.last_used = time.time()
    
    def is_expired(self) -> bool:
        """
        Check if the connection has expired.
        
        Returns:
            True if the connection has expired, False otherwise
        """
        return (time.time() - self.last_used) > IDLE_TIMEOUT_SECONDS and not self.in_use

def get_connection(url: str, key: str) -> Any:
    """
    Get a connection from the pool, or create a new one if none is available.
    
    Args:
        url: Supabase URL
        key: Supabase API key or service key
        
    Returns:
        Supabase client
    """
    if not SUPABASE_AVAILABLE:
        raise ImportError("Supabase package not installed")
    
    # Check if thread already has a connection
    thread_id = threading.get_ident()
    if hasattr(local, 'client'):
        if local.url == url and local.key == key:
            return local.client
    
    # Create the connection key
    conn_key = f"{url}:{key}"
    
    # Acquire the pool lock
    with _pool_lock:
        # Clean up expired connections in the pool
        for pool_key in list(_connection_pool.keys()):
            pool = _connection_pool[pool_key]
            for conn_id in list(pool.keys()):
                conn = pool[conn_id]
                if conn.is_expired():
                    logger.debug(f"Removing expired connection {conn_id} from pool {pool_key}")
                    del pool[conn_id]
        
        # Create pool for this connection if it doesn't exist
        if conn_key not in _connection_pool:
            _connection_pool[conn_key] = {}
        
        # Get available connection from pool
        pool = _connection_pool[conn_key]
        for conn_id, conn in pool.items():
            if not conn.in_use:
                client = conn.acquire()
                local.client = client
                local.url = url
                local.key = key
                local.conn_id = conn_id
                local.conn_key = conn_key
                logger.debug(f"Acquired connection {conn_id} from pool {conn_key}")
                return client
        
        # Create new connection if pool isn't full
        if len(pool) < MAX_POOL_SIZE:
            client = create_client(url, key)
            conn_id = str(time.time())
            conn = PooledConnection(client, url, key)
            client = conn.acquire()
            pool[conn_id] = conn
            local.client = client
            local.url = url
            local.key = key
            local.conn_id = conn_id
            local.conn_key = conn_key
            logger.debug(f"Created new connection {conn_id} in pool {conn_key}")
            return client
        
        # If pool is full, wait for a connection to become available
        # (This should rarely happen, as we limit concurrent requests)
        logger.warning(f"Connection pool {conn_key} is full, waiting for a connection")
        max_wait = 5.0  # 5 seconds
        start_time = time.time()
        while time.time() - start_time < max_wait:
            # Sleep briefly
            time.sleep(0.1)
            
            # Check for available connections
            for conn_id, conn in pool.items():
                if not conn.in_use:
                    client = conn.acquire()
                    local.client = client
                    local.url = url
                    local.key = key
                    local.conn_id = conn_id
                    local.conn_key = conn_key
                    logger.debug(f"Acquired connection {conn_id} from pool {conn_key} after waiting")
                    return client
        
        # If still no connection available, create a new one (exceeding pool size temporarily)
        logger.warning(f"Connection pool {conn_key} is still full after waiting, creating new connection anyway")
        client = create_client(url, key)
        conn_id = str(time.time())
        conn = PooledConnection(client, url, key)
        client = conn.acquire()
        pool[conn_id] = conn
        local.client = client
        local.url = url
        local.key = key
        local.conn_id = conn_id
        local.conn_key = conn_key
        return client

def release_connection(client: Any) -> None:
    """
    Release a connection back to the pool.
    
    Args:
        client: Supabase client to release
    """
    if not hasattr(local, 'client') or local.client != client:
        # This client wasn't acquired by this thread
        return
    
    # Release the connection in the pool
    with _pool_lock:
        if hasattr(local, 'conn_key') and hasattr(local, 'conn_id'):
            conn_key = local.conn_key
            conn_id = local.conn_id
            
            if conn_key in _connection_pool and conn_id in _connection_pool[conn_key]:
                conn = _connection_pool[conn_key][conn_id]
                conn.release()
                logger.debug(f"Released connection {conn_id} to pool {conn_key}")
    
    # Clear thread-local storage
    del local.client
    del local.url
    del local.key
    del local.conn_id
    del local.conn_key

def get_pool_status() -> Dict[str, Any]:
    """
    Get the status of the connection pool.
    
    Returns:
        Dictionary with pool status information
    """
    with _pool_lock:
        status = {
            'total_pools': len(_connection_pool),
            'total_connections': sum(len(pool) for pool in _connection_pool.values()),
            'active_connections': sum(sum(1 for conn in pool.values() if conn.in_use) for pool in _connection_pool.values()),
            'idle_connections': sum(sum(1 for conn in pool.values() if not conn.in_use) for pool in _connection_pool.values()),
            'pools': {}
        }
        
        for conn_key, pool in _connection_pool.items():
            status['pools'][conn_key] = {
                'total': len(pool),
                'active': sum(1 for conn in pool.values() if conn.in_use),
                'idle': sum(1 for conn in pool.values() if not conn.in_use),
                'connections': []
            }
            
            for conn_id, conn in pool.items():
                status['pools'][conn_key]['connections'].append({
                    'id': conn_id,
                    'in_use': conn.in_use,
                    'last_used': conn.last_used,
                    'last_used_hr': datetime.fromtimestamp(conn.last_used).strftime('%Y-%m-%d %H:%M:%S'),
                    'idle_time': time.time() - conn.last_used
                })
        
        return status

def clean_pool() -> int:
    """
    Clean the connection pool, removing expired connections.
    
    Returns:
        Number of connections removed
    """
    count = 0
    with _pool_lock:
        for pool_key in list(_connection_pool.keys()):
            pool = _connection_pool[pool_key]
            for conn_id in list(pool.keys()):
                conn = pool[conn_id]
                if conn.is_expired():
                    del pool[conn_id]
                    count += 1
    
    return count

# Function aliases for compatibility with supabase_client.py
def get_client(url: str, key: str) -> Any:
    """
    Alias for get_connection for compatibility.
    
    Args:
        url: Supabase URL
        key: Supabase API key or service key
        
    Returns:
        Supabase client
    """
    return get_connection(url, key)

def release_client(client: Any) -> None:
    """
    Alias for release_connection for compatibility.
    
    Args:
        client: Supabase client to release
    """
    release_connection(client)