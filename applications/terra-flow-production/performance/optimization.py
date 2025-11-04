"""
Performance Optimization Module

This module provides tools for optimizing application performance,
including database query optimization, caching strategies, and resource management.
"""

import os
import logging
import time
import functools
import inspect
import re
import hashlib
from typing import Dict, List, Any, Optional, Callable, Tuple, Set, Union

# Import Flask-related modules if available
try:
    from flask import request, current_app
    from flask.ctx import has_request_context
    FLASK_AVAILABLE = True
except ImportError:
    FLASK_AVAILABLE = False

# Import SQLAlchemy-related modules if available
try:
    from sqlalchemy import text
    from sqlalchemy.orm import Session
    from sqlalchemy.engine import Engine
    from sqlalchemy import event
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Simple in-memory cache
_memory_cache = {}
_cache_stats = {"hits": 0, "misses": 0, "size": 0}

class PerformanceOptimizer:
    """
    Performance optimization tools for the application.
    Provides caching, query optimization, and performance monitoring capabilities.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the performance optimizer.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        
        # Configure caching
        self.cache_enabled = self.config.get("cache_enabled", True)
        self.cache_default_ttl = self.config.get("cache_default_ttl", 300)  # 5 minutes
        self.max_cache_size = self.config.get("max_cache_size", 1000)
        
        # Configure query optimization
        self.query_optimization_enabled = self.config.get("query_optimization_enabled", True)
        self.slow_query_threshold = self.config.get("slow_query_threshold", 1.0)  # 1 second
        
        # Configure monitoring
        self.monitoring_enabled = self.config.get("monitoring_enabled", True)
        self.monitoring_interval = self.config.get("monitoring_interval", 60)  # 1 minute
        
        # Performance metrics
        self.metrics = {
            "request_times": [],
            "slow_queries": [],
            "cache_hits": 0,
            "cache_misses": 0,
            "total_queries": 0,
            "slow_query_count": 0,
            "average_request_time": 0,
            "peak_memory_usage": 0
        }
        
        # Initialize SQLAlchemy query timing if available
        if SQLALCHEMY_AVAILABLE and self.monitoring_enabled:
            self._setup_sqlalchemy_query_timing()
        
        logger.info("Performance optimizer initialized")
    
    def cache(self, ttl: Optional[int] = None) -> Callable:
        """
        Decorator for caching function results.
        
        Args:
            ttl: Time-to-live in seconds (None for default)
            
        Returns:
            Decorated function
        """
        ttl = ttl if ttl is not None else self.cache_default_ttl
        
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                if not self.cache_enabled:
                    return func(*args, **kwargs)
                
                # Create cache key
                key = self._create_cache_key(func, args, kwargs)
                
                # Check cache
                cached_item = _memory_cache.get(key)
                if cached_item:
                    if time.time() < cached_item["expires"]:
                        # Cache hit
                        self.metrics["cache_hits"] += 1
                        _cache_stats["hits"] += 1
                        return cached_item["value"]
                    else:
                        # Expired
                        del _memory_cache[key]
                
                # Cache miss
                self.metrics["cache_misses"] += 1
                _cache_stats["misses"] += 1
                
                # Execute function
                result = func(*args, **kwargs)
                
                # Store in cache
                _memory_cache[key] = {
                    "value": result,
                    "expires": time.time() + ttl
                }
                _cache_stats["size"] = len(_memory_cache)
                
                # Check cache size and evict if necessary
                if len(_memory_cache) > self.max_cache_size:
                    self._evict_cache_items()
                
                return result
            
            return wrapper
        
        return decorator
    
    def _create_cache_key(self, func: Callable, args: Tuple, kwargs: Dict) -> str:
        """
        Create a cache key for a function call.
        
        Args:
            func: Function object
            args: Function arguments
            kwargs: Function keyword arguments
            
        Returns:
            Cache key string
        """
        # Get function module and name
        module = func.__module__
        name = func.__name__
        
        # Convert args and kwargs to string
        args_str = ','.join([self._convert_arg_to_str(arg) for arg in args])
        kwargs_str = ','.join([f"{k}={self._convert_arg_to_str(v)}" for k, v in sorted(kwargs.items())])
        
        # Include request path and query string if in Flask request context
        request_suffix = ""
        if FLASK_AVAILABLE and has_request_context():
            path = request.path
            query = request.query_string.decode('utf-8')
            request_suffix = f"|{path}?{query}" if query else f"|{path}"
        
        # Create the key
        key = f"{module}.{name}({args_str},{kwargs_str}){request_suffix}"
        
        # Use hash for long keys
        if len(key) > 250:
            key = f"{module}.{name}|{hashlib.md5(key.encode('utf-8')).hexdigest()}"
        
        return key
    
    def _convert_arg_to_str(self, arg: Any) -> str:
        """
        Convert an argument to a string representation for cache key creation.
        
        Args:
            arg: Argument to convert
            
        Returns:
            String representation
        """
        if arg is None:
            return "None"
        elif isinstance(arg, (int, float, bool, str)):
            return str(arg)
        elif isinstance(arg, (list, tuple)):
            return f"[{','.join([self._convert_arg_to_str(a) for a in arg])}]"
        elif isinstance(arg, dict):
            return f"{{{','.join([f'{k}:{self._convert_arg_to_str(v)}' for k, v in sorted(arg.items())])}}}"
        else:
            # For complex objects, use their id
            return f"{arg.__class__.__name__}:{id(arg)}"
    
    def _evict_cache_items(self):
        """Evict items from cache when it grows too large"""
        # Strategy: Remove expired items first, then oldest items
        now = time.time()
        
        # Remove expired items
        expired_keys = [k for k, v in _memory_cache.items() if v["expires"] < now]
        for key in expired_keys:
            del _memory_cache[key]
        
        # If cache is still too large, remove oldest items
        if len(_memory_cache) > self.max_cache_size:
            # Sort by expiration time (oldest first)
            sorted_cache = sorted(_memory_cache.items(), key=lambda x: x[1]["expires"])
            
            # Remove oldest items until we're under the limit
            items_to_remove = len(_memory_cache) - self.max_cache_size
            for i in range(items_to_remove):
                del _memory_cache[sorted_cache[i][0]]
        
        _cache_stats["size"] = len(_memory_cache)
    
    def clear_cache(self, pattern: Optional[str] = None):
        """
        Clear the cache.
        
        Args:
            pattern: Optional regex pattern to match cache keys
        """
        global _memory_cache
        if pattern:
            # Clear cache entries matching pattern
            match_pattern = re.compile(pattern)
            matching_keys = [k for k in _memory_cache.keys() if match_pattern.search(k)]
            for key in matching_keys:
                del _memory_cache[key]
        else:
            # Clear entire cache
            _memory_cache = {}
        
        _cache_stats["size"] = len(_memory_cache)
        logger.info(f"Cache cleared{' (pattern: ' + pattern + ')' if pattern else ''}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache statistics
        """
        stats = _cache_stats.copy()
        hit_rate = stats["hits"] / (stats["hits"] + stats["misses"]) if (stats["hits"] + stats["misses"]) > 0 else 0
        stats["hit_rate"] = hit_rate
        return stats
    
    def _setup_sqlalchemy_query_timing(self):
        """Set up SQLAlchemy query timing events"""
        if not SQLALCHEMY_AVAILABLE:
            return
        
        @event.listens_for(Engine, "before_cursor_execute")
        def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            if not hasattr(conn, "query_start_time"):
                conn.query_start_time = {}
            conn.query_start_time[id(cursor)] = time.time()
        
        @event.listens_for(Engine, "after_cursor_execute")
        def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            self.metrics["total_queries"] += 1
            
            if hasattr(conn, "query_start_time") and id(cursor) in conn.query_start_time:
                elapsed = time.time() - conn.query_start_time[id(cursor)]
                
                # Log slow queries
                if elapsed >= self.slow_query_threshold:
                    self.metrics["slow_query_count"] += 1
                    self.metrics["slow_queries"].append({
                        "query": statement,
                        "parameters": parameters,
                        "duration": elapsed,
                        "timestamp": time.time()
                    })
                    
                    logger.warning(f"Slow query ({elapsed:.2f}s): {statement}")
                
                # Remove timing data
                del conn.query_start_time[id(cursor)]
    
    def optimize_query(self, session: Any, query_str: str, params: Optional[Dict[str, Any]] = None) -> str:
        """
        Optimize an SQL query.
        
        Args:
            session: SQLAlchemy session
            query_str: Original query string
            params: Query parameters
            
        Returns:
            Optimized query string
        """
        if not self.query_optimization_enabled or not SQLALCHEMY_AVAILABLE:
            return query_str
        
        try:
            # Basic optimizations
            optimized_query = query_str
            
            # Add query hints for PostgreSQL
            if "SELECT" in optimized_query.upper() and "FROM" in optimized_query.upper():
                if "ORDER BY" in optimized_query.upper() and "LIMIT" in optimized_query.upper():
                    # Add index hint for ORDER BY + LIMIT queries
                    optimized_query = re.sub(
                        r"SELECT\s+",
                        "SELECT /*+ INDEX_ORDER */ ",
                        optimized_query,
                        flags=re.IGNORECASE
                    )
            
            # Explain query to check for inefficiencies
            explain_query = f"EXPLAIN {optimized_query}"
            result = session.execute(text(explain_query), params or {}).fetchall()
            plan = "\n".join([str(row[0]) for row in result])
            
            # Check for sequential scans on large tables
            if "Seq Scan" in plan and "cost=" in plan:
                # Extract cost
                cost_match = re.search(r"cost=([0-9.]+)\.\.([0-9.]+)", plan)
                if cost_match and float(cost_match.group(2)) > 1000:
                    logger.warning(f"High-cost sequential scan detected in query: {optimized_query}")
                    # We could add index recommendations here
            
            return optimized_query
            
        except Exception as e:
            logger.error(f"Error optimizing query: {str(e)}")
            return query_str
    
    def measure_time(self, func_or_name: Union[Callable, str] = None) -> Union[Callable, float]:
        """
        Decorator for measuring function execution time.
        Can also be used as a context manager.
        
        Args:
            func_or_name: Function to decorate or name for context manager
            
        Returns:
            Decorated function or elapsed time
        """
        # Use as decorator
        if callable(func_or_name):
            func = func_or_name
            
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                start_time = time.time()
                result = func(*args, **kwargs)
                elapsed = time.time() - start_time
                
                # Log if slow
                if elapsed >= self.slow_query_threshold:
                    logger.info(f"Slow function {func.__name__}: {elapsed:.4f}s")
                
                return result
            
            return wrapper
        
        # Use as context manager
        else:
            class TimerContext:
                def __init__(self, name, optimizer):
                    self.name = name or "unnamed_timer"
                    self.optimizer = optimizer
                    self.start_time = None
                    self.elapsed = 0
                
                def __enter__(self):
                    self.start_time = time.time()
                    return self
                
                def __exit__(self, exc_type, exc_val, exc_tb):
                    self.elapsed = time.time() - self.start_time
                    
                    # Log if slow
                    if self.elapsed >= self.optimizer.slow_query_threshold:
                        logger.info(f"Slow operation {self.name}: {self.elapsed:.4f}s")
                    
                    return False
            
            return TimerContext(func_or_name, self)
    
    def analyze_database_performance(self, session: Any) -> Dict[str, Any]:
        """
        Analyze database performance metrics.
        
        Args:
            session: SQLAlchemy session
            
        Returns:
            Database performance metrics
        """
        if not SQLALCHEMY_AVAILABLE:
            return {"error": "SQLAlchemy not available"}
        
        try:
            metrics = {}
            
            # Check for missing indexes on foreign keys
            metrics["missing_fk_indexes"] = self._check_missing_fk_indexes(session)
            
            # Get table sizes
            metrics["table_sizes"] = self._get_table_sizes(session)
            
            # Get index usage statistics
            metrics["index_usage"] = self._get_index_usage_stats(session)
            
            # Get lock statistics
            metrics["lock_stats"] = self._get_lock_stats(session)
            
            # Get cache hit ratios
            metrics["cache_hit_ratios"] = self._get_cache_hit_ratios(session)
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error analyzing database performance: {str(e)}")
            return {"error": str(e)}
    
    def _check_missing_fk_indexes(self, session: Any) -> List[Dict[str, Any]]:
        """
        Check for missing indexes on foreign keys.
        
        Args:
            session: SQLAlchemy session
            
        Returns:
            List of missing indexes
        """
        try:
            # Query to find foreign keys without indexes
            query = """
            SELECT
                c.conrelid::regclass AS table_name,
                a.attname AS column_name,
                c.confrelid::regclass AS referenced_table
            FROM
                pg_constraint c
                JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
            WHERE
                c.contype = 'f'
                AND NOT EXISTS (
                    SELECT 1
                    FROM pg_index i
                    WHERE i.indrelid = c.conrelid
                    AND a.attnum = ANY(i.indkey)
                )
            ORDER BY
                table_name, column_name;
            """
            
            result = session.execute(text(query)).fetchall()
            missing_indexes = []
            
            for row in result:
                missing_indexes.append({
                    "table": str(row[0]),
                    "column": str(row[1]),
                    "referenced_table": str(row[2]),
                    "suggested_index": f"CREATE INDEX idx_{row[0]}_{row[1]} ON {row[0]} ({row[1]});"
                })
            
            return missing_indexes
            
        except Exception as e:
            logger.error(f"Error checking missing FK indexes: {str(e)}")
            return []
    
    def _get_table_sizes(self, session: Any) -> List[Dict[str, Any]]:
        """
        Get table sizes.
        
        Args:
            session: SQLAlchemy session
            
        Returns:
            List of table sizes
        """
        try:
            query = """
            SELECT
                t.tablename AS table_name,
                pg_size_pretty(pg_total_relation_size('"' || t.tablename || '"')) AS total_size,
                pg_size_pretty(pg_relation_size('"' || t.tablename || '"')) AS table_size,
                pg_size_pretty(pg_total_relation_size('"' || t.tablename || '"') - pg_relation_size('"' || t.tablename || '"')) AS index_size,
                pg_total_relation_size('"' || t.tablename || '"') AS raw_total_size
            FROM
                pg_tables t
            WHERE
                t.schemaname = 'public'
            ORDER BY
                pg_total_relation_size('"' || t.tablename || '"') DESC;
            """
            
            result = session.execute(text(query)).fetchall()
            table_sizes = []
            
            for row in result:
                table_sizes.append({
                    "table_name": row[0],
                    "total_size": row[1],
                    "table_size": row[2],
                    "index_size": row[3],
                    "raw_total_size": row[4]
                })
            
            return table_sizes
            
        except Exception as e:
            logger.error(f"Error getting table sizes: {str(e)}")
            return []
    
    def _get_index_usage_stats(self, session: Any) -> List[Dict[str, Any]]:
        """
        Get index usage statistics.
        
        Args:
            session: SQLAlchemy session
            
        Returns:
            List of index usage statistics
        """
        try:
            query = """
            SELECT
                s.schemaname AS schema,
                s.relname AS table,
                s.indexrelname AS index,
                pg_size_pretty(pg_relation_size(s.indexrelid::regclass)) AS index_size,
                s.idx_scan AS index_scans,
                s.idx_tup_read AS tuples_read,
                s.idx_tup_fetch AS tuples_fetched
            FROM
                pg_stat_user_indexes s
                JOIN pg_index i ON s.indexrelid = i.indexrelid
            WHERE
                s.schemaname = 'public'
            ORDER BY
                s.idx_scan DESC;
            """
            
            result = session.execute(text(query)).fetchall()
            index_stats = []
            
            for row in result:
                index_stats.append({
                    "schema": row[0],
                    "table": row[1],
                    "index": row[2],
                    "index_size": row[3],
                    "index_scans": row[4],
                    "tuples_read": row[5],
                    "tuples_fetched": row[6]
                })
            
            return index_stats
            
        except Exception as e:
            logger.error(f"Error getting index usage stats: {str(e)}")
            return []
    
    def _get_lock_stats(self, session: Any) -> List[Dict[str, Any]]:
        """
        Get lock statistics.
        
        Args:
            session: SQLAlchemy session
            
        Returns:
            List of lock statistics
        """
        try:
            query = """
            SELECT
                l.relation::regclass AS table_name,
                l.mode,
                l.granted,
                a.query,
                a.state,
                age(now(), a.query_start) AS query_duration
            FROM
                pg_locks l
                JOIN pg_stat_activity a ON l.pid = a.pid
            WHERE
                l.relation IS NOT NULL
                AND a.query != '<IDLE>'
                AND a.pid != pg_backend_pid()
            ORDER BY
                query_duration DESC;
            """
            
            result = session.execute(text(query)).fetchall()
            lock_stats = []
            
            for row in result:
                lock_stats.append({
                    "table_name": str(row[0]),
                    "mode": row[1],
                    "granted": row[2],
                    "query": row[3],
                    "state": row[4],
                    "query_duration": str(row[5])
                })
            
            return lock_stats
            
        except Exception as e:
            logger.error(f"Error getting lock stats: {str(e)}")
            return []
    
    def _get_cache_hit_ratios(self, session: Any) -> Dict[str, Any]:
        """
        Get database cache hit ratios.
        
        Args:
            session: SQLAlchemy session
            
        Returns:
            Database cache hit ratios
        """
        try:
            # Check index cache hit ratio
            idx_hit_query = """
            SELECT
                'index hit rate' AS name,
                (sum(idx_blks_hit)) / nullif(sum(idx_blks_hit + idx_blks_read), 0) AS ratio
            FROM
                pg_statio_user_indexes;
            """
            
            # Check table cache hit ratio
            table_hit_query = """
            SELECT
                'table hit rate' AS name,
                sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0) AS ratio
            FROM
                pg_statio_user_tables;
            """
            
            idx_result = session.execute(text(idx_hit_query)).fetchone()
            table_result = session.execute(text(table_hit_query)).fetchone()
            
            cache_ratios = {
                "index_cache_hit_ratio": float(idx_result[1]) if idx_result[1] is not None else None,
                "table_cache_hit_ratio": float(table_result[1]) if table_result[1] is not None else None
            }
            
            return cache_ratios
            
        except Exception as e:
            logger.error(f"Error getting cache hit ratios: {str(e)}")
            return {
                "index_cache_hit_ratio": None,
                "table_cache_hit_ratio": None
            }
    
    def optimize_database(self, session: Any) -> Dict[str, Any]:
        """
        Perform database optimizations.
        
        Args:
            session: SQLAlchemy session
            
        Returns:
            Optimization results
        """
        if not SQLALCHEMY_AVAILABLE:
            return {"error": "SQLAlchemy not available"}
        
        results = {
            "vacuum": [],
            "analyze": [],
            "reindex": [],
            "created_indexes": []
        }
        
        try:
            # Find tables that need VACUUM
            vacuum_query = """
            SELECT
                relname AS table_name,
                n_dead_tup AS dead_tuples,
                n_live_tup AS live_tuples,
                n_dead_tup::float / nullif(n_live_tup, 0) AS dead_ratio
            FROM
                pg_stat_user_tables
            WHERE
                n_dead_tup > 1000
                AND (n_dead_tup::float / nullif(n_live_tup, 0)) > 0.1
            ORDER BY
                dead_ratio DESC;
            """
            
            vacuum_candidates = session.execute(text(vacuum_query)).fetchall()
            
            # Perform VACUUM on candidate tables
            for row in vacuum_candidates:
                table_name = row[0]
                try:
                    session.execute(text(f"VACUUM {table_name}"))
                    results["vacuum"].append({
                        "table": table_name,
                        "dead_tuples": row[1],
                        "live_tuples": row[2],
                        "dead_ratio": row[3],
                        "success": True
                    })
                except Exception as e:
                    results["vacuum"].append({
                        "table": table_name,
                        "dead_tuples": row[1],
                        "live_tuples": row[2],
                        "dead_ratio": row[3],
                        "success": False,
                        "error": str(e)
                    })
            
            # Find tables that need ANALYZE
            analyze_query = """
            SELECT
                relname AS table_name,
                n_mod_since_analyze AS modifications
            FROM
                pg_stat_user_tables
            WHERE
                n_mod_since_analyze > 1000
            ORDER BY
                n_mod_since_analyze DESC;
            """
            
            analyze_candidates = session.execute(text(analyze_query)).fetchall()
            
            # Perform ANALYZE on candidate tables
            for row in analyze_candidates:
                table_name = row[0]
                try:
                    session.execute(text(f"ANALYZE {table_name}"))
                    results["analyze"].append({
                        "table": table_name,
                        "modifications": row[1],
                        "success": True
                    })
                except Exception as e:
                    results["analyze"].append({
                        "table": table_name,
                        "modifications": row[1],
                        "success": False,
                        "error": str(e)
                    })
            
            # Create missing foreign key indexes
            missing_indexes = self._check_missing_fk_indexes(session)
            for idx in missing_indexes:
                try:
                    session.execute(text(idx["suggested_index"]))
                    results["created_indexes"].append({
                        "table": idx["table"],
                        "column": idx["column"],
                        "index": idx["suggested_index"],
                        "success": True
                    })
                except Exception as e:
                    results["created_indexes"].append({
                        "table": idx["table"],
                        "column": idx["column"],
                        "index": idx["suggested_index"],
                        "success": False,
                        "error": str(e)
                    })
            
            session.commit()
            return results
            
        except Exception as e:
            session.rollback()
            logger.error(f"Error optimizing database: {str(e)}")
            return {"error": str(e)}
    
    def analyze_application_performance(self) -> Dict[str, Any]:
        """
        Analyze application performance metrics.
        
        Returns:
            Application performance metrics
        """
        metrics = {
            "cache": self.get_cache_stats(),
            "queries": {
                "total": self.metrics["total_queries"],
                "slow_count": self.metrics["slow_query_count"],
                "slow_queries": self.metrics["slow_queries"][-10:] if self.metrics["slow_queries"] else []
            }
        }
        
        # Add Flask metrics if available
        if FLASK_AVAILABLE and has_request_context() and current_app:
            metrics["flask"] = {
                "endpoint_performance": self._get_endpoint_performance()
            }
        
        return metrics
    
    def _get_endpoint_performance(self) -> Dict[str, Any]:
        """
        Get performance metrics for Flask endpoints.
        
        Returns:
            Endpoint performance metrics
        """
        if not hasattr(current_app, '_performance_metrics'):
            return {}
        
        metrics = current_app._performance_metrics
        
        # Calculate averages
        result = {}
        for endpoint, times in metrics.items():
            if times:
                avg_time = sum(times) / len(times)
                max_time = max(times)
                min_time = min(times)
                count = len(times)
                
                result[endpoint] = {
                    "avg_time": avg_time,
                    "max_time": max_time,
                    "min_time": min_time,
                    "count": count
                }
        
        return result
    
    def setup_flask_monitoring(self, app: Any):
        """
        Set up Flask monitoring.
        
        Args:
            app: Flask application
        """
        if not FLASK_AVAILABLE:
            logger.warning("Flask not available, skipping Flask monitoring setup")
            return
        
        app._performance_metrics = {}
        
        @app.before_request
        def before_request():
            request._start_time = time.time()
        
        @app.after_request
        def after_request(response):
            if hasattr(request, '_start_time'):
                elapsed = time.time() - request._start_time
                
                # Record request time
                endpoint = request.endpoint or 'unknown'
                if endpoint not in app._performance_metrics:
                    app._performance_metrics[endpoint] = []
                
                app._performance_metrics[endpoint].append(elapsed)
                
                # Keep only the last 100 requests per endpoint
                if len(app._performance_metrics[endpoint]) > 100:
                    app._performance_metrics[endpoint] = app._performance_metrics[endpoint][-100:]
                
                # Add X-Response-Time header
                response.headers['X-Response-Time'] = f"{elapsed:.4f}s"
                
                # Log slow requests
                if elapsed >= self.slow_query_threshold:
                    logger.warning(f"Slow request: {request.method} {request.path} ({elapsed:.4f}s)")
            
            return response
        
        logger.info("Flask monitoring set up")


# Create a singleton instance
optimizer = PerformanceOptimizer()

# Convenience decorators
def cached(ttl: Optional[int] = None) -> Callable:
    """
    Convenience decorator for caching function results.
    
    Args:
        ttl: Time-to-live in seconds (None for default)
        
    Returns:
        Decorated function
    """
    return optimizer.cache(ttl)

def timed(func: Optional[Callable] = None) -> Union[Callable, Any]:
    """
    Convenience decorator for timing function execution.
    
    Args:
        func: Function to decorate
        
    Returns:
        Decorated function or context manager
    """
    return optimizer.measure_time(func)


def main():
    """Main function"""
    # Create performance optimizer
    config = {
        "cache_enabled": True,
        "query_optimization_enabled": True,
        "monitoring_enabled": True,
        "slow_query_threshold": 0.5
    }
    optimizer = PerformanceOptimizer(config)
    
    print("Performance optimizer initialized")
    
    # Example cache usage
    @optimizer.cache(ttl=60)
    def expensive_function(x):
        print("Executing expensive function...")
        time.sleep(1)  # Simulate expensive operation
        return x * 2
    
    # Call function multiple times
    print(expensive_function(10))
    print(expensive_function(10))  # Should be cached
    print(expensive_function(20))  # Different argument, not cached
    
    # Show cache stats
    print("Cache stats:", optimizer.get_cache_stats())


if __name__ == "__main__":
    main()