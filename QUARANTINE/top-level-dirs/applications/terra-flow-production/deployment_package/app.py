import os
import sys
import time
import logging
import shutil
from flask import Flask, render_template, redirect, url_for, flash, request, session, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.ext.declarative import declarative_base
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.utils import secure_filename
from functools import wraps
import datetime

# Conditionally import ldap
try:
    import ldap
    HAS_LDAP = True
except ImportError:
    HAS_LDAP = False
    logger = logging.getLogger(__name__)
    logger.warning("LDAP module not available, falling back to development mode")

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

Base = declarative_base()
    pass

db = SQLAlchemy(model_class=Base)

# Create the Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Load configuration from environment and config files
from config_loader import load_config, get_database_config, is_supabase_enabled

# Initialize configuration
config = load_config()
db_config = get_database_config()

# Configure database
# Get environment mode
env_mode = config.get("env_mode", "development")
logger.info(f"Environment mode: {env_mode}")

# Import visualizations
try:
    from visualizations.anomaly_map import anomaly_map_bp
except ImportError as e:
    logger.warning(f"Anomaly map visualization not available: {str(e)}")
    anomaly_map_bp = None

# Always use the provided DATABASE_URL from environment variables
database_url = os.environ.get("DATABASE_URL")
if database_url:
    logger.info(f"Using environment DATABASE_URL")
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
else:
    # Fallback to other database URLs if DATABASE_URL isn't set
    if is_supabase_enabled():
        logger.info(f"Using Supabase PostgreSQL database for {env_mode} environment")
        app.config["SQLALCHEMY_DATABASE_URI"] = db_config.get("connection_string")
    else:
        # Handle environment-specific database URLs
        if env_mode == "training":
            training_db_url = os.environ.get("DATABASE_URL_TRAINING")
            if training_db_url:
                logger.info("Using training database URL")
                app.config["SQLALCHEMY_DATABASE_URI"] = training_db_url
            else:
                # Try with suffix
                training_db_suffix = os.environ.get(f"DATABASE_URL_{env_mode.upper()}")
                if training_db_suffix:
                    logger.info(f"Using {env_mode} database URL with suffix")
                    app.config["SQLALCHEMY_DATABASE_URI"] = training_db_suffix
                else:
                    logger.warning("No training database URL found, falling back to default")
                    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///benton_gis.db"
        elif env_mode == "production":
            production_db_url = os.environ.get("DATABASE_URL_PRODUCTION")
            if production_db_url:
                logger.info("Using production database URL")
                app.config["SQLALCHEMY_DATABASE_URI"] = production_db_url
            else:
                # Try with suffix
                production_db_suffix = os.environ.get(f"DATABASE_URL_{env_mode.upper()}")
                if production_db_suffix:
                    logger.info(f"Using {env_mode} database URL with suffix")
                    app.config["SQLALCHEMY_DATABASE_URI"] = production_db_suffix
                else:
                    logger.warning("No production database URL found, falling back to default")
                    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///benton_gis.db"
        else:
            # Default development environment
            logger.info("Using standard database connection for development (SQLite)")
            app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///benton_gis.db"

app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
    "connect_args": {
        "sslmode": "require",
        "application_name": "BCBSGeoAssessmentPro",
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5
    }
}

# Configure file uploads
app.config["UPLOAD_FOLDER"] = os.environ.get("UPLOAD_FOLDER", "uploads")

# Create a temp directory for file uploads
temp_upload_dir = os.path.join(app.config["UPLOAD_FOLDER"], 'temp')
app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024 * 1024  # 1GB max upload size
app.config["ALLOWED_EXTENSIONS"] = {
    'zip', 'shp', 'shx', 'dbf', 'prj', 'xml', 'json', 'geojson', 
    'gpkg', 'kml', 'kmz', 'csv', 'xls', 'xlsx', 'pdf', 'txt',
    'gdb', 'mdb', 'sdf', 'sqlite', 'db', 'geopackage'
}

# Make sure upload directory exists
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
# Make sure temp upload directory exists
os.makedirs(temp_upload_dir, exist_ok=True)

# Initialize the database
db.init_app(app)

# Configure Flask-Migrate
from flask_migrate import Migrate
migrate = Migrate(app, db)

# Initialize Flask-Login
from flask_login import LoginManager, current_user
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'  # Update to use blueprint route
login_manager.login_message_category = 'warning'

@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

# Add template context processors
@app.context_processor
def inject_now():
    return {
        'now': datetime.datetime.now(),
        'datetime': datetime
    }

# Import views and models after app is created to avoid circular imports
with app.app_context():
    from models import User, File, GISProject, QueryLog
    from auth import login_required, is_authenticated, authenticate_user, logout_user
    from file_handlers import allowed_file, process_file_upload, get_user_files, delete_file
    from rag import process_query, index_document
    from gis_utils import validate_geojson, get_shapefile_info, extract_gis_metadata
    from mcp_api import mcp_api
    
    # Import API blueprints
    try:
        from api.gateway import api_gateway
        from api.auth import auth_api
        from api.spatial import spatial_bp as spatial_api
        from api.data_query import data_bp as data_query_api
        
        # Register API blueprints
        app.register_blueprint(api_gateway, url_prefix='/api')
        app.register_blueprint(auth_api, url_prefix='/api/auth')
        app.register_blueprint(spatial_api, url_prefix='/api/spatial')
        app.register_blueprint(data_query_api, url_prefix='/api/data')
        
        logger.info("API Gateway registered successfully")
    except ImportError as e:
        logger.warning(f"Could not load API Gateway modules: {e}")
    
    # Register MCP API blueprint
    app.register_blueprint(mcp_api, url_prefix='/mcp')
    
    # Register Sync Service blueprint
    try:
        # Import the register_blueprints function from sync_service
        from sync_service import register_blueprints
        
        # Let the sync_service handle all its blueprint registrations
        # This avoids conflicts when registering the same blueprint multiple times
        if register_blueprints(app):
            logger.info("Sync Service and Verification blueprints registered successfully")
    except ImportError as e:
        logger.warning(f"Could not load Sync Service module: {e}")
    
    # Create database tables
    db.create_all()
    
    # Create a development user if it doesn't exist
    try:
        dev_user = User.query.filter_by(username='dev_user').first()
        if not dev_user and os.environ.get('BYPASS_LDAP', 'True').lower() == 'true':
            dev_user = User(id=1, username='dev_user', email='dev_user@example.com', full_name='Development User', department='IT')
            db.session.add(dev_user)
            db.session.commit()
            logger.info("Created development user for testing")
    except Exception as e:
        logger.warning(f"Could not create development user: {str(e)}")
    
    # Initialize MCP system
    from mcp.core import mcp_instance
    
    # Only initialize the core monitoring agent for now
    # The specialized agents with complex dependencies will be loaded on demand
    try:
        from mcp.agents.monitoring_agent import MonitoringAgent
        logger.info("Successfully loaded Monitoring Agent")
    except ImportError as e:
        logger.warning(f"Could not load Monitoring Agent: {e}")
    
    # Try to load the Power Query agent
    try:
        from mcp.agents.power_query_agent import PowerQueryAgent
        mcp_instance.register_agent("power_query", PowerQueryAgent())
        logger.info("Successfully loaded Power Query Agent")
    except ImportError as e:
        logger.warning(f"Could not load Power Query Agent: {e}")
    
    # Try to load the Spatial Analysis agent
    try:
        from mcp.agents.spatial_analysis_agent import SpatialAnalysisAgent
        mcp_instance.register_agent("spatial_analysis", SpatialAnalysisAgent())
        logger.info("Successfully loaded Spatial Analysis Agent")
    except ImportError as e:
        logger.warning(f"Could not load Spatial Analysis Agent: {e}")
        
    # Try to load the Sales Verification agent
    try:
        from mcp.agents.sales_verification_agent import SalesVerificationAgent
        mcp_instance.register_agent("sales_verification", SalesVerificationAgent())
        logger.info("Successfully loaded Sales Verification Agent")
    except ImportError as e:
        logger.warning(f"Could not load Sales Verification Agent: {e}")
        
    # Register a basic dummy agent to ensure the MCP dashboard works
    from mcp.agents.base_agent import BaseAgent
        
    class SystemAgent(BaseAgent):
        """Basic system agent for MCP functionality"""
        def __init__(self):
            super().__init__()
            self.capabilities = ["system_info", "dashboard_support"]
            
        def process_task(self, task_data):
            """Process a system task"""
            self.last_activity = time.time()
            
            if not task_data or "task_type" not in task_data:
                return {"error": "Invalid task data, missing task_type"}
                
            task_type = task_data["task_type"]
            
            if task_type == "system_info":
                return {
                    "status": "success",
                    "system_info": {
                        "hostname": os.uname().nodename,
                        "platform": os.uname().sysname,
                        "python_version": sys.version,
                        "flask_version": "unknown",
                        "uptime": time.time()
                    }
                }
            else:
                return {"error": f"Unsupported task type: {task_type}"}
            
    # Register the API Gateway
    try:
        from api.gateway import register_api_endpoint_modules
        if register_api_endpoint_modules(app):
            logger.info("API Gateway registered successfully")
        else:
            logger.warning("API Gateway registration failed")
    except Exception as e:
        logger.warning(f"Could not load API Gateway modules: {str(e)}")
        
    # Initialize agent integrators
    try:
        from mcp.integrators import initialize_integrators
        integrators_count = initialize_integrators()
        if integrators_count > 0:
            logger.info(f"Successfully initialized {integrators_count} agent integrators")
        else:
            logger.warning("No agent integrators were initialized")
    except ImportError as e:
        logger.warning(f"Could not load agent integrators module: {e}")
    except Exception as e:
        logger.error(f"Error initializing agent integrators: {str(e)}")
    
    # Register the system agent
    mcp_instance.register_agent("system", SystemAgent())
    
    # Initialize health check system
    try:
        from health_checker import register_blueprint as register_health_checks
        health_manager = register_health_checks(app)
        logger.info("Health check system initialized successfully")
    except ImportError as e:
        logger.warning(f"Health check system not available: {str(e)}")
    
    # Initialize logging configuration
    try:
        from logging_config import register_logging_with_app
        register_logging_with_app(app)
        logger.info("Enhanced logging configuration initialized")
    except ImportError as e:
        logger.warning(f"Enhanced logging configuration not available: {str(e)}")
    
    # Initialize feature flag system
    try:
        from feature_manager import register_blueprint as register_feature_flags
        feature_manager = register_feature_flags(app)
        logger.info("Feature flag system initialized successfully")
    except ImportError as e:
        logger.warning(f"Feature flag system not available: {str(e)}")
    
    # Register visualization blueprints
    if anomaly_map_bp:
        app.register_blueprint(anomaly_map_bp)
        logger.info("Anomaly Map visualization registered successfully")
    
    # Initialize secrets manager
    try:
        from secrets_manager import initialize_secrets
        secrets = initialize_secrets()
        logger.info("Secrets manager initialized successfully")
    except ImportError as e:
        logger.warning(f"Secrets manager not available: {str(e)}")

# Define route handlers
@app.route('/')
def index():
    if is_authenticated():
        return render_template('index.html', user=session.get('user'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        auth_result = authenticate_user(username, password)
        
        if auth_result:
            # Unpack user info if returned from LDAP
            if isinstance(auth_result, tuple):
                success, user_info = auth_result
                if not success:
                    flash('Authentication failed. Please check your credentials.', 'danger')
                    return render_template('login.html')
            else:
                # For bypass mode or other authentication methods
                user_info = {}
            
            # After successful authentication
            from models import User, Role
            from auth import map_ad_groups_to_roles
            user = User.query.filter_by(username=username).first()
            
            if not user:
                try:
                    # Create user if not exists
                    user = User(
                        username=username, 
                        email=user_info.get('email', f"{username}@co.benton.wa.us"),
                        full_name=user_info.get('full_name', ''),
                        department=user_info.get('department', ''),
                        ad_object_id=user_info.get('ad_object_id', None),
                        last_login=datetime.datetime.utcnow(),
                        active=True
                    )
                    db.session.add(user)
                    db.session.commit()
                    
                    # Map AD groups to roles if we have group membership info
                    if user_info and 'groups' in user_info:
                        map_ad_groups_to_roles(user, user_info['groups'])
                    else:
                        # For new users, add them to the 'readonly' role by default if no AD groups mapped
                        readonly_role = Role.query.filter_by(name='readonly').first()
                        if readonly_role:
                            user.roles.append(readonly_role)
                            db.session.commit()
                        
                    logger.info(f"Created new user: {username}")
                except Exception as e:
                    # Handle any errors during user creation
                    logger.error(f"Error creating user: {str(e)}")
                    db.session.rollback()
                    
                    # Try to find the user again (maybe it was created in another process)
                    user = User.query.filter_by(username=username).first()
                    if not user:
                        flash('Error creating user account. Please contact an administrator.', 'danger')
                        return render_template('login.html')
            else:
                try:
                    # Update user information from LDAP if available
                    if user_info:
                        if 'full_name' in user_info and user_info['full_name']:
                            user.full_name = user_info['full_name']
                        if 'email' in user_info and user_info['email']:
                            user.email = user_info['email']
                        if 'department' in user_info and user_info['department']:
                            user.department = user_info['department']
                        if 'ad_object_id' in user_info and user_info['ad_object_id']:
                            user.ad_object_id = user_info['ad_object_id']
                        
                        # Update role mapping on each login
                        if 'groups' in user_info:
                            map_ad_groups_to_roles(user, user_info['groups'])
                    
                    # Update last login time
                    user.last_login = datetime.datetime.utcnow()
                    db.session.commit()
                except Exception as e:
                    logger.error(f"Error updating user: {str(e)}")
                    db.session.rollback()
            
            # Get user roles and permissions for the session
            user_roles = [role.name for role in user.roles]
            user_permissions = user.get_permissions()
            
            # Store user in session
            session['user'] = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name,
                'department': user.department,
                'roles': user_roles,
                'permissions': user_permissions
            }
            
            # Log successful login
            logger.info(f"User {username} logged in successfully")
            next_page = request.args.get('next', url_for('index'))
            return redirect(next_page)
        else:
            flash('Invalid credentials. Please try again.', 'danger')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login'))

@app.route('/file-manager')
@login_required
def file_manager():
    files = get_user_files(session['user']['id'])
    return render_template('file_manager.html', files=files)

@app.route('/upload', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        flash('No file part', 'danger')
        return redirect(url_for('file_manager'))
    
    file = request.files['file']
    if file.filename == '':
        flash('No selected file', 'danger')
        return redirect(url_for('file_manager'))
    
    if file and allowed_file(file.filename):
        try:
            filename = secure_filename(file.filename)
            project_name = request.form.get('project_name', 'Default Project')
            description = request.form.get('description', '')
            
            file_record = process_file_upload(file, filename, session['user']['id'], project_name, description)
            
            # Index the file for RAG if it's a text file, PDF, XML or metadata
            if filename.endswith(('.txt', '.pdf', '.xml', '.dbf', '.shp')):
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], str(file_record.id), filename)
                try:
                    index_document(file_path, file_record.id, description)
                    logger.info(f"Indexed file {filename} for RAG search")
                except Exception as e:
                    logger.error(f"Error indexing file {filename} for RAG search: {str(e)}")
                
            flash('File uploaded successfully', 'success')
        except Exception as e:
            logger.error(f"File upload error: {str(e)}")
            flash(f'Error uploading file: {str(e)}', 'danger')
    else:
        flash(f'File type not allowed. Allowed types: {", ".join(app.config["ALLOWED_EXTENSIONS"])}', 'danger')
    
    return redirect(url_for('file_manager'))

@app.route('/download/<int:file_id>')
@login_required
def download_file(file_id):
    file_record = File.query.get_or_404(file_id)
    
    # Check if user has access to this file
    if file_record.user_id != session['user']['id']:
        flash('You do not have permission to access this file', 'danger')
        return redirect(url_for('file_manager'))
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], str(file_id))
    return send_from_directory(file_path, file_record.filename, as_attachment=True)

@app.route('/delete/<int:file_id>', methods=['POST'])
@login_required
def delete_file_route(file_id):
    try:
        delete_file(file_id, session['user']['id'])
        flash('File deleted successfully', 'success')
    except Exception as e:
        flash(f'Error deleting file: {str(e)}', 'danger')
    
    return redirect(url_for('file_manager'))

@app.route('/map-viewer')
@login_required
def map_viewer():
    # Get GIS files (GeoJSON and Shapefile) for the user
    gis_files = File.query.filter(
        File.user_id == session['user']['id'],
        db.or_(
            File.filename.like('%.geojson'),
            File.filename.like('%.shp')
        )
    ).all()
    
    # Get projects to organize files
    projects = GISProject.query.filter_by(user_id=session['user']['id']).all()
    
    return render_template('map_view_redesign.html', gis_files=gis_files, projects=projects)

@app.route('/assessment-map')
@login_required
def assessment_map():
    """
    Property Assessment Map view with enhanced functionality
    """
    # Get GIS files (GeoJSON and Shapefile) for the user
    gis_files = File.query.filter(
        File.user_id == session['user']['id'],
        db.or_(
            File.filename.like('%.geojson'),
            File.filename.like('%.shp')
        )
    ).all()
    
    # Get projects to organize files
    projects = GISProject.query.filter_by(user_id=session['user']['id']).all()
    
    # Get property count if Properties table exists
    try:
        from models import Property
        property_count = db.session.query(Property).count()
    except Exception:
        property_count = 0
    
    # Create sample demo data for display (this will be served by the API)
    sample_data = {
        'demo_mode': True if property_count == 0 else False,
        'sample_properties': [
            {
                'id': '1',
                'parcel_id': 'R123456789',
                'address': '123 Main St, Kennewick',
                'property_type': 'residential',
                'assessed_value': 350000,
                'lat': 46.226, 'lng': -119.210
            },
            {
                'id': '2',
                'parcel_id': 'R987654321',
                'address': '456 Oak Ave, Richland',
                'property_type': 'residential',
                'assessed_value': 425000,
                'lat': 46.275, 'lng': -119.280
            },
            {
                'id': '3',
                'parcel_id': 'C12345678',
                'address': '789 Commerce Blvd, Kennewick',
                'property_type': 'commercial',
                'assessed_value': 1250000,
                'lat': 46.215, 'lng': -119.235
            },
            {
                'id': '4',
                'parcel_id': 'A987654321',
                'address': '100 Farm Rd, Prosser',
                'property_type': 'agricultural',
                'assessed_value': 780000,
                'lat': 46.180, 'lng': -119.310
            }
        ]
    }
    
    return render_template('assessment_map.html', 
                           gis_files=gis_files, 
                           projects=projects,
                           property_count=property_count,
                           sample_data=sample_data)

@app.route('/api/assessment/properties')
@login_required
def api_assessment_properties():
    """
    API endpoint for property assessment data
    Returns property data for the assessment map
    """
    try:
        # Import the Property model
        from models import Property
        
        # Get properties from database
        properties_query = db.session.query(Property).all()
        
        # Format properties for map display
        properties = []
        for prop in properties_query:
            # Get coordinates from location if it exists, otherwise use zeros
            if prop.location and 'coordinates' in prop.location:
                lng, lat = prop.location['coordinates']
            else:
                lat, lng = 0, 0
                
            # Get assessment value
            assessed_value = 0
            if hasattr(prop, 'purchase_price') and prop.purchase_price:
                assessed_value = prop.purchase_price
                
            # Create property dict
            property_data = {
                'id': prop.id,
                'parcel_id': prop.parcel_id,
                'address': f"{prop.address}, {prop.city}, {prop.state}",
                'property_type': prop.property_type,
                'year_built': prop.year_built,
                'lot_size': prop.lot_size,
                'bedrooms': prop.bedrooms,
                'bathrooms': prop.bathrooms,
                'owner_name': prop.owner_name,
                'assessed_value': assessed_value,
                'purchase_date': prop.purchase_date.strftime('%Y-%m-%d') if prop.purchase_date else None,
                'lat': lat,
                'lng': lng,
                'zoning': prop.property_metadata.get('zoning', 'Unknown') if prop.property_metadata else 'Unknown'
            }
            properties.append(property_data)
            
        return jsonify({
            'success': True,
            'properties': properties
        })
    except Exception as e:
        app.logger.error(f"Error fetching properties: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Error fetching properties',
            'properties': []
        })

@app.route('/map-data/<int:file_id>')
@login_required
def map_data(file_id):
    file_record = File.query.get_or_404(file_id)
    
    # Check if user has access to this file
    if file_record.user_id != session['user']['id']:
        return jsonify({'error': 'Access denied'}), 403
    
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], str(file_id), file_record.filename)
    
    # Handle different file types
    if file_record.filename.endswith('.geojson'):
        # Directly serve GeoJSON files
        try:
            with open(file_path, 'r') as f:
                geojson_data = f.read()
            return geojson_data, 200, {'Content-Type': 'application/json'}
        except Exception as e:
            logger.error(f"Error reading GeoJSON file: {str(e)}")
            return jsonify({'error': f'Error reading file: {str(e)}'}), 500
            
    elif file_record.filename.endswith('.shp'):
        # Convert Shapefile to GeoJSON
        try:
            # Import required libraries
            import geopandas as gpd
            from shapely.geometry import mapping
            import json
            
            # Read the shapefile
            gdf = gpd.read_file(file_path)
            
            # Convert to GeoJSON
            geojson_data = {
                "type": "FeatureCollection",
                "features": []
            }
            
            for _, row in gdf.iterrows():
                feature = {
                    "type": "Feature",
                    "properties": {},
                    "geometry": mapping(row.geometry)
                }
                
                # Add all non-geometry columns as properties
                for col in gdf.columns:
                    if col != 'geometry':
                        # Convert any non-serializable objects to strings
                        try:
                            value = row[col]
                            if isinstance(value, (int, float, str, bool)) or value is None:
                                feature["properties"][col] = value
                            else:
                                feature["properties"][col] = str(value)
                        except:
                            feature["properties"][col] = str(row[col])
                
                geojson_data["features"].append(feature)
            
            return jsonify(geojson_data)
            
        except Exception as e:
            logger.error(f"Error converting Shapefile to GeoJSON: {str(e)}")
            return jsonify({'error': f'Error converting Shapefile: {str(e)}'}), 500
    else:
        return jsonify({'error': 'Unsupported file type. Only GeoJSON and Shapefile formats are supported.'}), 400

@app.route('/search')
@login_required
def search_page():
    return render_template('search.html')

@app.route('/profile')
@login_required
def user_profile():
    """User profile page showing roles and permissions"""
    from models import User, Role, Permission, AuditLog, ApiToken
    import datetime
    
    user = User.query.get(session['user']['id'])
    if not user:
        flash('User not found', 'danger')
        return redirect(url_for('index'))
    
    # Get all available roles and permissions for display
    all_roles = Role.query.all()
    all_permissions = Permission.query.all()
    
    # Get audit logs for the user (limit to the most recent 20)
    audit_logs = AuditLog.query.filter_by(user_id=user.id).order_by(AuditLog.timestamp.desc()).limit(20).all()
    
    # Get API tokens for the user
    api_tokens = ApiToken.query.filter_by(user_id=user.id, revoked=False).all()
    
    # Current time for token status calculation
    now = datetime.datetime.utcnow()
    
    return render_template(
        'profile.html', 
        user=user, 
        all_roles=all_roles,
        all_permissions=all_permissions,
        audit_logs=audit_logs,
        api_tokens=api_tokens,
        now=now
    )

@app.route('/mcp-dashboard')
@login_required
def mcp_dashboard():
    """MCP system dashboard page"""
    return render_template('mcp_dashboard.html')

@app.route('/power-query')
@login_required
def power_query():
    """Power Query page for data integration and transformation"""
    return render_template('power_query.html')

@app.route('/api-tester')
@login_required
def api_tester():
    """API testing interface"""
    return render_template('api_tester.html')

@app.route('/api-test-setup')
@login_required
def api_test_setup():
    """Set up test data for API testing"""
    # Get test files already imported
    test_files = File.query.filter(
        File.user_id == session['user']['id'],
        File.description.like('%API testing%')
    ).all()
    
    return render_template('api_test_setup.html', test_files=test_files)

@app.route('/import-test-data', methods=['POST'])
@login_required
def import_test_data():
    """Import test GeoJSON data for API testing"""
    try:
        project_name = request.form.get('project_name', 'Test Project')
        description = request.form.get('description', 'Sample GeoJSON test data for API testing.')
        
        # Get the test GeoJSON file
        test_file_path = os.path.join(app.root_path, 'static', 'data', 'test_geo.geojson')
        
        if not os.path.exists(test_file_path):
            flash('Test data file not found', 'danger')
            return redirect(url_for('api_test_setup'))
        
        # Create the project
        project = GISProject.query.filter_by(name=project_name, user_id=session['user']['id']).first()
        if not project:
            project = GISProject(name=project_name, description=f"Project for {project_name}", user_id=session['user']['id'])
            db.session.add(project)
            db.session.commit()
            
        # Create uploads directory if it doesn't exist
        if 'UPLOAD_FOLDER' not in app.config:
            app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'uploads')
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # Create directory for the file
        uploads_dir = os.path.join(app.root_path, 'uploads')
        os.makedirs(uploads_dir, exist_ok=True)
        
        test_dir = os.path.join(uploads_dir, 'test_data')
        os.makedirs(test_dir, exist_ok=True)
        
        # Copy the file to the uploads directory
        filename = 'test_geo.geojson'
        destination_path = os.path.join(test_dir, filename)
        shutil.copy2(test_file_path, destination_path)
        
        # Create file record with the paths already set
        file_record = File(
            filename=filename,
            original_filename=filename,
            file_path=destination_path,
            file_size=os.path.getsize(destination_path),
            file_type='geojson',
            upload_date=datetime.datetime.now(),
            user_id=session['user']['id'],
            project_id=project.id,
            description=description
        )
        
        # Save the file record
        db.session.add(file_record)
        db.session.commit()
        
        # Extract and save metadata if it's a GIS file
        try:
            metadata = extract_gis_metadata(destination_path, file_record.file_type)
            if metadata:
                file_record.file_metadata = metadata
        except Exception as e:
            app.logger.error(f"Error extracting metadata: {str(e)}")
        
        db.session.commit()
        flash('Test data imported successfully', 'success')
        
    except Exception as e:
        logger.error(f"Error importing test data: {str(e)}")
        flash(f'Error importing test data: {str(e)}', 'danger')
    
    return redirect(url_for('api_test_setup'))

@app.route('/upload-power-query-file', methods=['POST'])
@login_required
def upload_power_query_file():
    """Handle file uploads for Power Query data sources"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    source_name = request.form.get('source_name', '')
    description = request.form.get('description', '')
    
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    try:
        # Create directory for Power Query files if it doesn't exist
        power_query_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'power_query')
        os.makedirs(power_query_dir, exist_ok=True)
        
        # Secure the filename
        filename = secure_filename(file.filename)
        
        # Save the file
        file_path = os.path.join(power_query_dir, filename)
        file.save(file_path)
        
        return jsonify({
            'success': True,
            'file_path': file_path,
            'filename': filename
        })
    except Exception as e:
        logger.error(f"Error uploading Power Query file: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/download-power-query-file')
@login_required
def download_power_query_file():
    """Download a Power Query export file"""
    filename = request.args.get('file')
    
    if not filename:
        flash('No file specified', 'danger')
        return redirect(url_for('power_query'))
    
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'power_query')
        return send_from_directory(file_path, filename, as_attachment=True)
    except Exception as e:
        logger.error(f"Error downloading Power Query file: {str(e)}")
        flash(f'Error downloading file: {str(e)}', 'danger')
        return redirect(url_for('power_query'))

@app.route('/api-direct')
def api_direct():
    """Direct API access (for testing)"""
    return jsonify({
        'name': 'Benton County Data Hub API',
        'version': '1.0.0',
        'status': 'active',
        'auth_required': True,
        'endpoints': {
            'docs': '/api/docs',
            'spatial': '/api/spatial/layers',
            'data': '/api/data/sources'
        }
    })

@app.route('/system/initialize-roles')
@login_required
def initialize_roles():
    """Initialize roles and permissions in the database"""
    try:
        from initialize_roles import main as init_roles
        init_roles()
        flash('Roles and permissions have been initialized successfully', 'success')
        return redirect(url_for('index'))
    except Exception as e:
        logger.error(f"Error initializing roles: {str(e)}")
        flash(f'Error initializing roles: {str(e)}', 'danger')
        return redirect(url_for('index'))

@app.route('/api/search', methods=['POST'])
@login_required
def search_api():
    query = request.json.get('query', '')
    if not query:
        return jsonify({'error': 'No query provided'}), 400
    
    try:
        # Log the query
        query_log = QueryLog(
            user_id=session['user']['id'],
            query=query,
            timestamp=datetime.datetime.now()
        )
        db.session.add(query_log)
        db.session.commit()
        
        # Process the query using RAG
        results = process_query(query, user_id=session['user']['id'])
        return jsonify(results)
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        return jsonify({'error': f'Search error: {str(e)}'}), 500
        
@app.route('/mcp/task', methods=['POST'])
@login_required
def mcp_task():
    """Handle MCP agent tasks"""
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'Invalid request data'}), 400
            
        agent_id = data.get('agent_id')
        task_data = data.get('task_data', {})
        
        if not agent_id:
            return jsonify({'error': 'Missing agent_id parameter'}), 400
            
        # Get the agent
        from mcp.core import mcp_instance
        agent = mcp_instance.get_agent(agent_id)
        
        if not agent:
            return jsonify({'error': f'Agent not found: {agent_id}'}), 404
            
        # Submit the task
        result = agent.process_task(task_data)
        
        return jsonify({'result': result})
    except Exception as e:
        logger.error(f"MCP task error: {str(e)}")
        return jsonify({'error': f'MCP task error: {str(e)}'}), 500

# Register knowledge base blueprint
try:
    from knowledge_routes import knowledge_bp
    app.register_blueprint(knowledge_bp)
    app.logger.info("Knowledge base routes registered")
except Exception as e:
    app.logger.error(f"Error registering knowledge base routes: {str(e)}")

# Register valuation blueprint
try:
    from valuation_routes import valuation_bp
    app.register_blueprint(valuation_bp)
    app.logger.info("Valuation routes registered successfully")
except Exception as e:
    app.logger.error(f"Error registering valuation routes: {str(e)}")

# Register data quality blueprint
try:
    from data_quality_routes import data_quality_bp
    app.register_blueprint(data_quality_bp)
    app.logger.info("Data Quality routes registered successfully")
except Exception as e:
    app.logger.error(f"Error registering data quality routes: {str(e)}")

# Register assessment API blueprint
try:
    from api.assessment import assessment_bp
    app.register_blueprint(assessment_bp)
    app.logger.info("Assessment API routes registered successfully")
except Exception as e:
    app.logger.error(f"Error registering assessment API routes: {str(e)}")

# Register authentication routes
try:
    from auth_routes import auth_bp
    app.register_blueprint(auth_bp)
    app.logger.info("Authentication routes registered successfully")
except Exception as e:
    app.logger.error(f"Error registering authentication routes: {str(e)}")

# User Feedback Routes
@app.route('/submit_feedback', methods=['POST'])
@login_required
def submit_feedback():
    """Submit user feedback during testing"""
    try:
        feedback_type = request.form.get('feedback_type', '')
        current_page = request.form.get('current_page', '')
        description = request.form.get('description', '')
        impact_level = request.form.get('impact_level', 3)
        screenshot = request.form.get('screenshot', None)
        
        # Create a new feedback entry in the database
        feedback = {
            'user_id': current_user.id,
            'feedback_type': feedback_type,
            'current_page': current_page,
            'description': description,
            'impact_level': impact_level,
            'created_at': datetime.datetime.now(),
            'status': 'new'
        }
        
        # In a real implementation, we would save to Supabase or database
        # For testing purposes, just log the feedback
        app.logger.info(f"User Feedback: {feedback}")
        
        # If we have Supabase enabled, save to the feedback table
        if is_supabase_enabled():
            from supabase_client import get_supabase_client
            supabase = get_supabase_client()
            if supabase:
                result = supabase.table('user_feedback').insert(feedback).execute()
                app.logger.info(f"Feedback saved to Supabase: {result}")
        
        return jsonify({'success': True, 'message': 'Feedback submitted successfully'})
    except Exception as e:
        app.logger.error(f"Error saving feedback: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/testing')
@login_required
def testing_dashboard():
    """Show the main testing dashboard"""
    return render_template('testing/dashboard.html')

@app.route('/testing/scenario/<scenario_type>')
@login_required
def test_scenario(scenario_type):
    """Show a specific test scenario guide"""
    scenarios = {
        'assessor': {
            'title': 'County Assessor Test Scenario',
            'persona': 'assessor',
            'persona_name': 'County Assessor',
            'description': 'Test administrative functions and system oversight capabilities.',
            'steps': [
                'Login and navigate to the Admin section',
                'Review user management interface and try adding a test user',
                'Check system control dashboard and review agent status',
                'Navigate to data quality dashboard and review alerts',
                'Test role-based access by switching to different user views'
            ]
        },
        'appraiser': {
            'title': 'Field Appraiser Test Scenario',
            'persona': 'appraiser',
            'persona_name': 'Field Appraiser',
            'description': 'Test property assessment workflow and data collection.',
            'steps': [
                'Navigate to the property management section',
                'Create a new property record with address and parcel details',
                'Upload test photos or documents to the property record',
                'Complete a property assessment form with valuation details',
                'Verify the property shows up correctly in the map viewer'
            ]
        },
        'analyst': {
            'title': 'Data Analyst Test Scenario',
            'persona': 'analyst', 
            'persona_name': 'Data Analyst',
            'description': 'Test reporting and analytics capabilities.',
            'steps': [
                'Navigate to the Power Query interface',
                'Create a new data transformation query',
                'Export results in different formats (CSV, Excel, etc.)',
                'Use filters and sorting options in the property list view',
                'Test search functionality with different parameters'
            ]
        },
        'gis': {
            'title': 'GIS Specialist Test Scenario',
            'persona': 'gis',
            'persona_name': 'GIS Specialist',  
            'description': 'Test spatial data management and map visualization.',
            'steps': [
                'Open the map viewer and test navigation controls',
                'Import a test GeoJSON or Shapefile',
                'Create and manage multiple map layers',
                'Test property search by location or coordinates',
                'Verify spatial queries work correctly'
            ]
        }
    }
    
    if scenario_type not in scenarios:
        flash('Invalid test scenario type', 'error')
        return redirect(url_for('index'))
    
    scenario = scenarios[scenario_type]
    return render_template('testing/scenario.html', scenario=scenario)

# Register template filters
try:
    from template_filters import register_template_filters
    register_template_filters(app)
    app.logger.info("Template filters registered successfully")
except Exception as e:
    app.logger.error(f"Error registering template filters: {str(e)}")

# Register Supabase configuration blueprint
try:
    from api.supabase_config import supabase_config_bp
    app.register_blueprint(supabase_config_bp)
    app.logger.info("Supabase config routes registered successfully")
except Exception as e:
    app.logger.error(f"Error registering Supabase config routes: {str(e)}")

# Register legacy data conversion routes
try:
    from legacy_converter import register_blueprint as register_legacy_conversion
    legacy_converter = register_legacy_conversion(app)
    app.logger.info("Legacy data conversion system registered successfully")
except ImportError as e:
    app.logger.warning(f"Legacy data conversion system not available: {str(e)}")
except Exception as e:
    app.logger.error(f"Error registering legacy data conversion system: {str(e)}")

# Register Property Management routes
try:
    from property_routes import register_property_routes
    register_property_routes(app)
    app.logger.info("Property management routes registered successfully")
except Exception as e:
    app.logger.error(f"Error registering property routes: {str(e)}")

# We already registered the assessment API routes above
# So this section is redundant and can be removed



# Initialize API for third-party and microservice integration
try:
    # Add test API key for development
    app.config['API_KEYS'] = ['test_api_key_123', os.environ.get('API_KEY', '')]
    
    from api import init_api
    init_api(app)
    app.logger.info("API initialized successfully")
except Exception as e:
    app.logger.error(f"Error initializing API: {str(e)}")

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
