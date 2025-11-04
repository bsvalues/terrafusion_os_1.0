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

# Register API endpoints
try:
    logger.info("Registering API endpoints")
    from api import register_apis
    register_apis(app)
    logger.info("API endpoints registered successfully")
except ImportError as e:
    logger.warning(f"Could not register API endpoints: {str(e)}")

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
        }
    })

if __name__ == "__main__":
    # Run the Flask app
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
