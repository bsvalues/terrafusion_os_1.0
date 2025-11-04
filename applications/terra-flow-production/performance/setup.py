"""
Performance Setup Module

This module provides functions to configure and enable performance optimizations.
"""

import logging
from typing import Any, Dict, Optional

from flask import Flask

from performance.optimization import optimizer

logger = logging.getLogger(__name__)

def setup_performance_optimization(app: Flask, config: Optional[Dict[str, Any]] = None) -> None:
    """
    Set up performance optimization for a Flask application.
    
    This configures caching, query optimization, and monitoring.
    
    Args:
        app: Flask application
        config: Performance configuration dictionary
    """
    try:
        if config:
            # Update optimizer configuration
            optimizer.config.update(config)
            
            # Reconfigure based on updated config
            optimizer.cache_enabled = optimizer.config.get("cache_enabled", True)
            optimizer.cache_default_ttl = optimizer.config.get("cache_default_ttl", 300)
            optimizer.max_cache_size = optimizer.config.get("max_cache_size", 1000)
            optimizer.query_optimization_enabled = optimizer.config.get("query_optimization_enabled", True)
            optimizer.slow_query_threshold = optimizer.config.get("slow_query_threshold", 1.0)
            optimizer.monitoring_enabled = optimizer.config.get("monitoring_enabled", True)
            optimizer.monitoring_interval = optimizer.config.get("monitoring_interval", 60)
        
        # Set up Flask monitoring
        optimizer.setup_flask_monitoring(app)
        
        # Add optimizer to app context for easy access
        app.performance_optimizer = optimizer
        
        # Add performance route for metrics
        @app.route('/admin/performance', methods=['GET'])
        def performance_metrics():
            """Performance metrics endpoint"""
            if not app.performance_optimizer.monitoring_enabled:
                return {"error": "Performance monitoring is disabled"}, 400
            
            # Get performance metrics
            metrics = app.performance_optimizer.analyze_application_performance()
            
            # Get database metrics if session is available
            try:
                from app import db
                if db and db.session:
                    metrics["database"] = app.performance_optimizer.analyze_database_performance(db.session)
            except Exception as e:
                logger.error(f"Error getting database metrics: {str(e)}")
                metrics["database_error"] = str(e)
            
            return metrics
        
        # Add cache control route
        @app.route('/admin/performance/cache/clear', methods=['POST'])
        def clear_cache():
            """Clear application cache"""
            pattern = request.json.get('pattern') if request and hasattr(request, 'json') else None
            app.performance_optimizer.clear_cache(pattern)
            return {"status": "Cache cleared", "pattern": pattern}
        
        # Add database optimization route
        @app.route('/admin/performance/database/optimize', methods=['POST'])
        def optimize_database():
            """Optimize database"""
            try:
                from app import db
                if db and db.session:
                    results = app.performance_optimizer.optimize_database(db.session)
                    return results
                else:
                    return {"error": "Database session not available"}, 400
            except Exception as e:
                logger.error(f"Error optimizing database: {str(e)}")
                return {"error": str(e)}, 500
        
        logger.info("Performance optimization set up for Flask application")
        
    except Exception as e:
        logger.error(f"Error setting up performance optimization: {str(e)}")


def setup_optimized_views(app: Flask, optimize_paths: Optional[list] = None) -> None:
    """
    Apply optimization to specific views/endpoints.
    
    Args:
        app: Flask application
        optimize_paths: List of path patterns to optimize
    """
    from flask import request, g
    import time
    from performance.optimization import cached, timed
    
    paths_to_optimize = optimize_paths or [
        '/visualizations/anomaly-map',
        '/api/anomalies',
        '/api/property',
        '/search'
    ]
    
    # Create before/after request handlers
    @app.before_request
    def before_optimized_request():
        """Store start time for performance tracking"""
        g.start_time = time.time()
    
    @app.after_request
    def after_optimized_request(response):
        """Add performance headers to response"""
        # Check if path should be optimized
        path = request.path
        should_optimize = any(path.startswith(p) for p in paths_to_optimize)
        
        if should_optimize and hasattr(g, 'start_time'):
            elapsed = time.time() - g.start_time
            response.headers['X-Response-Time'] = f"{elapsed:.4f}s"
            
            # Add caching headers for appropriate responses
            if (response.status_code == 200 and 
                    request.method == 'GET' and 
                    'text/html' not in response.content_type):
                # Cache API responses for 60 seconds by default
                if 'Cache-Control' not in response.headers:
                    response.headers['Cache-Control'] = 'public, max-age=60'
        
        return response
    
    # Apply caching to common database queries
    from functools import wraps
    
    def cache_query(f):
        """Decorator to cache database query results"""
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Skip cache for authenticated requests that might have user-specific data
            if hasattr(request, 'user') and request.user:
                return f(*args, **kwargs)
            
            # Key components
            key_parts = [request.path]
            for arg in sorted(request.args.keys()):
                key_parts.append(f"{arg}={request.args[arg]}")
            
            cache_key = "|".join(key_parts)
            
            # Check if result is already cached
            if cache_key in app.config.get('_query_cache', {}):
                cached_result, expiry = app.config['_query_cache'][cache_key]
                if time.time() < expiry:
                    return cached_result
            
            # Run the original function
            result = f(*args, **kwargs)
            
            # Store in cache with 5-minute expiry
            if not hasattr(app.config, '_query_cache'):
                app.config['_query_cache'] = {}
            
            app.config['_query_cache'][cache_key] = (result, time.time() + 300)
            
            return result
        
        return decorated_function
    
    # Make the cache_query decorator available
    app.cache_query = cache_query
    
    logger.info(f"Set up optimized views for paths: {paths_to_optimize}")


def apply_database_optimizations(db: Any) -> None:
    """
    Apply database optimizations.
    
    Args:
        db: SQLAlchemy database object
    """
    from sqlalchemy import event
    from sqlalchemy.engine import Engine
    
    # Enable connection pooling with appropriate timeouts
    if hasattr(db, 'engine') and hasattr(db.engine, 'pool'):
        db.engine.pool.timeout = 30  # 30 second timeout
        db.engine.pool.recycle = 3600  # Recycle connections after 1 hour
    
    # Add event listeners for query timing
    @event.listens_for(Engine, "before_cursor_execute")
    def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        if not hasattr(conn, 'query_start_time'):
            conn.query_start_time = {}
        conn.query_start_time[id(cursor)] = time.time()
    
    @event.listens_for(Engine, "after_cursor_execute")
    def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
        if hasattr(conn, 'query_start_time') and id(cursor) in conn.query_start_time:
            elapsed = time.time() - conn.query_start_time[id(cursor)]
            
            # Log slow queries (more than 500ms)
            if elapsed > 0.5:
                logger.warning(f"Slow query ({elapsed:.4f}s): {statement}")
            
            # Clean up timing data
            del conn.query_start_time[id(cursor)]
    
    logger.info("Applied database optimizations")


def optimize_property_queries() -> None:
    """
    Apply optimization to common property-related queries.
    This adds indexes and caching for commonly accessed property data.
    """
    from flask import current_app
    from performance.optimization import cached
    import time
    
    # Get database session
    try:
        from app import db
        
        # Create commonly needed indexes if they don't exist
        indexes = [
            "CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties (property_type);",
            "CREATE INDEX IF NOT EXISTS idx_properties_zip_code ON properties (zip_code);",
            "CREATE INDEX IF NOT EXISTS idx_properties_year_built ON properties (year_built);",
            "CREATE INDEX IF NOT EXISTS idx_assessments_assessment_date ON assessments (assessment_date);",
            "CREATE INDEX IF NOT EXISTS idx_tax_records_tax_year ON tax_records (tax_year);",
            "CREATE INDEX IF NOT EXISTS idx_data_anomaly_detected_at ON data_anomaly (detected_at);"
        ]
        
        for index_sql in indexes:
            try:
                db.session.execute(index_sql)
            except Exception as e:
                logger.warning(f"Error creating index: {str(e)}")
        
        db.session.commit()
        logger.info("Created optimization indexes for property queries")
        
    except Exception as e:
        logger.error(f"Error optimizing property queries: {str(e)}")


def main():
    """Main function for testing"""
    try:
        from flask import Flask
        app = Flask(__name__)
        
        # Set up performance optimization
        setup_performance_optimization(app, {
            "cache_enabled": True,
            "slow_query_threshold": 0.5
        })
        
        print("Performance optimization set up successfully")
        
    except ImportError:
        print("Flask not available, cannot set up performance optimization")


if __name__ == "__main__":
    main()