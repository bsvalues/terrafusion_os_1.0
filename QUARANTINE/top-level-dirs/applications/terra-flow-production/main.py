import os
import logging
import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    logger.info("Initializing Supabase environment")
    from set_supabase_env import ensure_supabase_env
    
    # Set up Supabase environment variables
    ensure_supabase_env()
    
    # Get the current environment
    from supabase_env_manager import get_current_environment, is_configured
    
    env = get_current_environment() or "development"
    configured = is_configured()
    
    logger.info(f"Supabase environment: {env}")
    logger.info(f"Supabase configured: {configured}")
except Exception as e:
    logger.warning(f"Failed to initialize Supabase environment: {str(e)}")
    logger.warning("Continuing without Supabase configuration")

# Set BYPASS_LDAP environment variable to true for development
os.environ['BYPASS_LDAP'] = 'true'

# Initialize the Multi-Agent Coordination Platform (MCP) Core
try:
    logger.info("Initializing Multi-Agent Coordination Platform")
    from ai_agents.mcp_core import get_mcp
    
    # Get the MCP singleton instance
    mcp = get_mcp()
    logger.info("MCP Core initialized successfully")
    
    # Register the GeospatialAnalysisAgent
    try:
        from ai_agents.geospatial_analysis_agent import GeospatialAnalysisAgent
        mcp.register_agent_type("GeospatialAnalysisAgent", GeospatialAnalysisAgent)
        logger.info("Registered GeospatialAnalysisAgent with MCP")
    except ImportError as e:
        logger.warning(f"Could not load GeospatialAnalysisAgent: {str(e)}")
except Exception as e:
    logger.warning(f"Failed to initialize MCP: {str(e)}")
    logger.warning("Continuing without MCP")

# Import and initialize the Flask app
from app import app  # noqa: F401

# Import health checker
import health_checker  # noqa: F401

# Import and register routes
from mobile_routes import register_mobile_routes

# Register UI components routes
try:
    logger.info("Registering UI components routes")
    from ui_components_routes import register_ui_components_routes
    register_ui_components_routes(app)
    logger.info("UI components routes registered successfully")
except ImportError as e:
    logger.warning(f"Could not register UI components routes: {str(e)}")

# Register mobile routes
register_mobile_routes(app)

# Register API endpoints
try:
    logger.info("Registering API endpoints")
    from api import init_api
    init_api(app)
    logger.info("API endpoints registered successfully")
except ImportError as e:
    logger.warning(f"Could not register API endpoints: {str(e)}")

# Initialize monitoring
try:
    logger.info("Initializing monitoring")
    from monitoring import init_monitoring
    init_monitoring(app)
    logger.info("Monitoring initialized successfully")
except ImportError as e:
    logger.warning(f"Could not initialize monitoring: {str(e)}")

# Import map routes
try:
    logger.info("Registering map routes")
    import map_routes  # noqa: F401
    logger.info("Map routes registered successfully")
except ImportError as e:
    logger.warning(f"Could not register map routes: {str(e)}")

# Initialize Performance Optimization
try:
    logger.info("Initializing Performance Optimization")
    from performance.setup import setup_performance_optimization
    setup_performance_optimization(app)
    logger.info("Performance Optimization initialized successfully")
except ImportError as e:
    logger.warning(f"Could not initialize Performance Optimization: {str(e)}")

# Setup data stability framework
try:
    logger.info("Initializing Data Stability Framework")
    from data_stability_framework import DataStabilityFramework
    
    # Create framework instance and make it available through the app
    dsf = DataStabilityFramework()
    app.dsf = dsf
    logger.info("Data Stability Framework initialized successfully")
except ImportError as e:
    logger.warning(f"Could not initialize Data Stability Framework: {str(e)}")

# Initialize Agent Recovery System
try:
    logger.info("Initializing Agent Recovery System")
    from ai_agents.agent_recovery import initialize_recovery_system
    
    # Initialize the recovery system with the Flask app context
    recovery_system = initialize_recovery_system(app.app_context)
    
    # Make recovery system available through the app
    app.recovery_system = recovery_system
    logger.info("Agent Recovery System initialized successfully")
except ImportError as e:
    logger.warning(f"Could not initialize Agent Recovery System: {str(e)}")

# Initialize Sync Services (both legacy and TerraFusion)
try:
    logger.info("Initializing Sync Services")
    from sync_service.integration import initialize_sync_services
    
    # Initialize and register all sync services
    sync_results = initialize_sync_services(app)
    
    # Log initialization results
    for service_name, result in sync_results.items():
        if result['status'] == 'success':
            logger.info(f"{service_name} sync service: {result['message']}")
        else:
            logger.warning(f"{service_name} sync service: {result['message']}")
            
    # Make sync results available through the app
    app.sync_services = sync_results
    logger.info("Sync Services initialized successfully")
except ImportError as e:
    logger.warning(f"Could not initialize Sync Services: {str(e)}")

# Register Report Routes
try:
    logger.info("Registering Report Routes")
    from reports.report_routes import reports_bp
    app.register_blueprint(reports_bp)
    logger.info("Report Routes registered successfully")
except ImportError as e:
    logger.warning(f"Could not register Report Routes: {str(e)}")

# Add a test endpoint to check API functionality
@app.route('/api/v1/status', methods=['GET'])
def api_status():
    """API status check endpoint"""
    # Get MCP status
    mcp = None
    try:
        from ai_agents.mcp_core import get_mcp
        mcp = get_mcp()
    except ImportError:
        pass
    
    # Check for agent types
    agent_types = []
    agent_count = 0
    if mcp:
        agent_types = list(mcp.agent_types.keys())
        agent_count = len(mcp.active_agents)
    
    # Get environment info
    env_mode = os.environ.get("ENV_MODE", "development")
    
    # Check database connection
    db_status = "unknown"
    try:
        import psycopg2
        conn = psycopg2.connect(
            dbname=os.environ.get("PGDATABASE"),
            user=os.environ.get("PGUSER"),
            password=os.environ.get("PGPASSWORD"),
            host=os.environ.get("PGHOST"),
            port=os.environ.get("PGPORT")
        )
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()[0]
        cursor.close()
        conn.close()
        db_status = "connected"
    except Exception as e:
        db_version = str(e)
        db_status = "error"
    
    # Get sync services status
    sync_services_status = {}
    try:
        if hasattr(app, 'sync_services'):
            sync_services_status = {
                service_name: {
                    "status": result['status'],
                    "message": result['message']
                }
                for service_name, result in app.sync_services.items()
            }
    except Exception as e:
        sync_services_status = {"error": str(e)}
    
    # Return status information
    from flask import jsonify
    return jsonify({
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "environment": env_mode,
        "mcp": {
            "initialized": mcp is not None,
            "agent_types": agent_types,
            "active_agents": agent_count
        },
        "database": {
            "status": db_status,
            "version": db_version
        },
        "sync_services": sync_services_status
    })

# Direct health dashboard route
@app.route('/health/dashboard', methods=['GET'])
def health_dashboard():
    """Health monitoring dashboard"""
    from flask import render_template
    import psutil
    import platform
    import time
    from datetime import datetime
    import sqlalchemy as sa
    from sqlalchemy import text
    
    # Start timing the response
    start_time = time.time()
    
    # Check system health
    cpu_percent = psutil.cpu_percent(interval=0.1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # Get process info
    process = psutil.Process(os.getpid())
    process_info = {
        'pid': process.pid,
        'memory_percent': process.memory_percent(),
        'cpu_percent': process.cpu_percent(interval=0.1),
        'threads': len(process.threads()),
        'uptime': time.time() - process.create_time()
    }
    
    system_status = {
        'status': 'healthy' if cpu_percent < 80 and memory.percent < 80 and disk.percent < 80 else 'unhealthy',
        'cpu_percent': cpu_percent,
        'memory_percent': memory.percent,
        'memory_available_mb': memory.available / (1024 * 1024),
        'disk_percent': disk.percent,
        'disk_free_gb': disk.free / (1024 * 1024 * 1024),
        'process': process_info
    }
    
    # Check database connection
    try:
        # Get database URL
        database_url = app.config.get('SQLALCHEMY_DATABASE_URI')
        if not database_url:
            db_status = {
                'status': 'error',
                'message': 'Database URL not configured',
                'connected': False
            }
        else:
            # Create engine and check connection
            engine = sa.create_engine(database_url)
            db_start_time = time.time()
            
            with engine.connect() as conn:
                # Execute a simple query
                result = conn.execute(text('SELECT 1'))
                assert result.scalar() == 1
                
                # Check PostgreSQL version
                version = conn.execute(text('SHOW server_version')).scalar()
                
                # Check if PostGIS is installed
                postgis_enabled = False
                try:
                    postgis_version = conn.execute(text('SELECT PostGIS_Version()')).scalar()
                    postgis_enabled = True
                except:
                    postgis_version = None
            
            query_time = time.time() - db_start_time
            
            db_status = {
                'status': 'healthy',
                'connected': True,
                'version': version,
                'postgis_enabled': postgis_enabled,
                'postgis_version': postgis_version,
                'query_time_ms': query_time * 1000
            }
    except Exception as e:
        db_status = {
            'status': 'error',
            'message': str(e),
            'connected': False
        }
    
    # Check AI agents
    try:
        # Get MCP status
        agent_count = 0
        try:
            from ai_agents.mcp_core import get_mcp
            mcp = get_mcp()
            if mcp:
                agent_count = len(mcp.active_agents)
        except ImportError:
            pass
        
        # Get agent info from processes
        agent_processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            if proc.info['cmdline'] and any('agent.py' in arg for arg in proc.info['cmdline']):
                agent_processes.append({
                    'pid': proc.info['pid'],
                    'cmdline': ' '.join(proc.info['cmdline']),
                    'cpu_percent': proc.cpu_percent(interval=0.1),
                    'memory_percent': proc.memory_percent()
                })
        
        # Get agent recovery metrics if available
        recovery_metrics = {}
        try:
            if hasattr(app, 'recovery_system'):
                recovery_metrics = app.recovery_system.get_metrics()
        except Exception as recovery_error:
            logger.warning(f"Could not get agent recovery metrics: {str(recovery_error)}")
                
        ai_agents_status = {
            'status': 'healthy' if agent_count > 0 else 'unknown',
            'agent_count': agent_count,
            'agent_processes': agent_processes,
            'recovery_system': {
                'active': hasattr(app, 'recovery_system'),
                'metrics': recovery_metrics
            }
        }
    except Exception as e:
        ai_agents_status = {
            'status': 'error',
            'message': str(e)
        }
    
    # Check environment
    env_mode = os.environ.get('ENV_MODE', 'development')
    env_status = {
        'python_version': platform.python_version(),
        'platform': platform.platform(),
        'env_mode': env_mode,
        'environment_variables': {
            'ENV_MODE': env_mode,
            'FLASK_ENV': os.environ.get('FLASK_ENV', 'development'),
            'FLASK_DEBUG': os.environ.get('FLASK_DEBUG', '0')
        }
    }
    
    # Calculate response time
    response_time = (time.time() - start_time) * 1000  # in milliseconds
    
    # Compile result
    health_data = {
        'status': 'healthy' if system_status.get('status') == 'healthy' and db_status.get('status') == 'healthy' else 'unhealthy',
        'timestamp': datetime.now().isoformat(),
        'response_time_ms': response_time,
        'system': system_status,
        'database': db_status,
        'ai_agents': ai_agents_status,
        'environment': env_status
    }
    
    try:
        return render_template('monitoring/dashboard.html', health_data=health_data)
    except Exception as e:
        return render_template('monitoring/error.html', error_message=str(e))

if __name__ == "__main__":
    # Run the Flask app
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
