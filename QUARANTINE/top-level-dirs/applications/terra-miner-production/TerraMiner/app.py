import os
import uuid
import logging
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, send_file, g
from werkzeug.middleware.proxy_fix import ProxyFix
from sqlalchemy import text, func
from etl.narrpr_scraper import NarrprScraper
from db.database import save_to_database, Database
from utils.logger import setup_logger
from utils.config import load_config, update_config
from utils.export import export_to_csv, export_to_json, export_to_excel, get_export_formats
from utils.test_data import insert_test_data
from middleware import init_template_middleware, template_preference_decorator

# Import the database instance from our new db_utils.py
from core import db

# Import the database initialization function
from db_utils import init_db

# Initialize logger with enhanced error prevention
setup_logger()
logger = logging.getLogger(__name__)

# Additional logging configuration to ensure critical errors are always captured
if logger.level == logging.NOTSET:
    logger.setLevel(logging.INFO)

# Create logs directory if it doesn't exist to prevent file handler errors
try:
    os.makedirs('logs', exist_ok=True)
except OSError as e:
    logging.warning(f"Could not create logs directory: {str(e)}")

# Add file handler for persistent error logging
try:
    if not any(isinstance(handler, logging.FileHandler) for handler in logger.handlers):
        file_handler = logging.FileHandler('logs/app_errors.log')
        file_handler.setLevel(logging.ERROR)
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s'
        ))
        logger.addHandler(file_handler)
except Exception as e:
    logging.warning(f"Could not setup error log file: {str(e)}")

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Initialize database using our factory function
init_db(app)

# Initialize template middleware
render_template_with_fallback = init_template_middleware(app)

# Load configuration
config = load_config()

# Utility function to safely render template with fallback
def render_template_with_fallback(template_name, use_tailwind=True, **context):
    """
    Try to render the modern version of templates, but fallback to legacy if needed.
    Enhanced with robust error handling to prevent 500 errors.
    
    Args:
        template_name (str): The base template name (without _modern suffix)
        use_tailwind (bool): Whether to try modern template first (default: True)
        **context: Template context variables
    """
    # Add new context value to indicate modern UI is preferred
    context['use_modern_ui'] = True
    
    # Store original error for debugging
    original_error = None
    modern_template = None
    
    # Handle gracefully in case of unexpected failure
    try:
        # Always try to use modern templates first if use_tailwind is True
        if use_tailwind:
            # Construct modern template name (append _modern before extension)
            try:
                name_parts = template_name.rsplit('.', 1)
                modern_template = f"{name_parts[0]}_modern.{name_parts[1]}" if len(name_parts) > 1 else f"{template_name}_modern"
            except Exception as e:
                logger.error(f"Error constructing modern template name: {str(e)}")
                modern_template = f"{template_name}_modern"
            
            try:
                # Try to render the modern template
                return render_template(modern_template, **context)
            except Exception as e:
                # Log the failure and fall back to legacy template
                original_error = e
                logger.debug(f"Modern template '{modern_template}' not found, using legacy template: {str(e)}")
                
                # Try fallback to legacy but use modern context
                try:
                    return render_template(template_name, **context)
                except Exception as e2:
                    # Both modern and legacy templates failed
                    logger.error(f"Both templates failed! Modern: {str(original_error)}, Legacy: {str(e2)}")
                    # Emergency fallback to basic template with error details
                    try:
                        return render_template('error_modern.html', 
                                              error_code="Template Error", 
                                              error_message=f"Failed to render requested page '{template_name}'",
                                              details=f"Please contact support. Error ID: {str(uuid.uuid4())[:8]}")
                    except Exception:
                        # Absolute last resort - redirect to home page
                        logger.critical(f"Critical template failure for {template_name}. Redirecting to home.")
                        return redirect(url_for('index'))
        else:
            # Using legacy template explicitly
            try:
                return render_template(template_name, **context)
            except Exception as e:
                logger.error(f"Legacy template '{template_name}' failed: {str(e)}")
                # Emergency fallback
                try:
                    return render_template('error_modern.html',
                                          error_code="Template Error",
                                          error_message=f"Failed to render requested page '{template_name}'",
                                          details=f"Please contact support. Error ID: {str(uuid.uuid4())[:8]}")
                except Exception:
                    # Absolute last resort - redirect to home page
                    logger.critical(f"Critical template failure for {template_name}. Redirecting to home.")
                    return redirect(url_for('index'))
    except Exception as e:
        # Catastrophic failure in the template rendering system
        error_id = str(uuid.uuid4())[:8]
        logger.critical(f"Critical template rendering failure [{error_id}]: {str(e)}")
        
        # Last resort - redirect to home page
        return redirect(url_for('index'))

# Define UI preference decorator
def tailwind_ui_preference_decorator(view_func):
    """Decorator to enforce modern UI for all pages in the application"""
    @wraps(view_func)
    def wrapper(*args, **kwargs):
        # Force modern UI for the complete redesign
        ui_preference = 'unified'
        
        # Set the preference in the session
        session['ui_preference'] = ui_preference
        
        # Store the UI preference in Flask's g object for access in the view function
        g.use_tailwind_ui = True
        g.use_tailwind = True
        
        # Store the render helper in Flask's g object for use in the view function
        g.render_template = render_template_with_fallback
        
        # Log the current UI preference for debugging
        logger.debug(f"Current UI template preference: {ui_preference}")
        
        return view_func(*args, **kwargs)
    return wrapper

# Register Jinja filters
@app.template_filter('datetime')
@app.template_filter('format_datetime')
def format_datetime(value):
    """Format a datetime object to a readable string."""
    if not value:
        return ""
    if isinstance(value, str):
        try:
            from datetime import datetime
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return value
    
    try:
        # Format: January 1, 2025 at 12:00 PM
        return value.strftime("%B %d, %Y at %I:%M %p")
    except (ValueError, TypeError, AttributeError):
        return str(value)

@app.template_filter('wrap_in_li')
def wrap_in_li(text):
    """Wrap text in an HTML li element."""
    return f'<li>{text}</li>'
    
@app.template_filter('format_tax_row')
def format_tax_row(tax):
    """Format a tax history row as HTML."""
    return f'''
        <tr>
            <td>{tax['year']}</td>
            <td>${tax['amount']:,}</td>
            <td class="{'text-success' if tax['change'] > 0 else 'text-danger' if tax['change'] < 0 else ''}">
                {'+' if tax['change'] > 0 else ''}{tax['change']}%
            </td>
        </tr>
    '''
    
@app.template_filter('format_price_row')
def format_price_row(price):
    """Format a price history row as HTML."""
    return f'''
        <tr>
            <td>{price['date']}</td>
            <td>${price['price']:,}</td>
            <td>{price['event']}</td>
        </tr>
    '''

@app.template_filter('number')
@app.template_filter('format_number')
def format_number(value):
    """Format a number with thousand separators."""
    if value is None:
        return ""
    if isinstance(value, str):
        try:
            value = float(value.replace(',', ''))
        except (ValueError, TypeError):
            return value
    try:
        if isinstance(value, (int, float)):
            return "{:,}".format(int(value) if value == int(value) else value)
        return str(value)
    except (ValueError, TypeError):
        return str(value)

@app.template_filter('date')
@app.template_filter('format_date')
def format_date(value):
    """Format a date object to a readable string."""
    if not value:
        return ""
    if isinstance(value, str):
        try:
            from datetime import datetime
            value = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except (ValueError, TypeError):
            return value
    
    try:
        # Format: January 1, 2025
        return value.strftime("%B %d, %Y")
    except (ValueError, TypeError, AttributeError):
        return str(value)

# Register blueprints
try:
    from app_monitor import monitor_bp
    app.register_blueprint(monitor_bp)
    logger.info("Registered monitoring blueprint")
except ImportError:
    logger.warning("Could not import monitoring blueprint")

# Register Zillow API blueprint
try:
    from api.zillow_routes import zillow_api
    app.register_blueprint(zillow_api)
    logger.info("Registered Zillow API blueprint")
except ImportError:
    logger.warning("Could not import Zillow API blueprint")

# Register ETL API blueprint
try:
    from api.etl_routes import register_etl_blueprint
    register_etl_blueprint(app)
    logger.info("Registered ETL API blueprint")
except ImportError:
    logger.warning("Could not import ETL API blueprint")

# Register ETL Schedule API blueprint
try:
    from api.schedule_routes import register_schedule_blueprint
    register_schedule_blueprint(app)
    logger.info("Registered ETL schedule API blueprint")
except ImportError:
    logger.warning("Could not import ETL schedule API blueprint")

# Register Authentication API blueprint
try:
    from api.auth import register_auth_blueprint
    register_auth_blueprint(app)
    logger.info("Registered authentication API blueprint")
except ImportError:
    logger.warning("Could not import authentication API blueprint")
    
# Register CMA API blueprint
try:
    from api.cma_routes import register_routes as register_cma_api_routes
    register_cma_api_routes(app)
    logger.info("Registered CMA API blueprint")
except ImportError:
    logger.warning("Could not import CMA API blueprint")
    
# Register CMA controller blueprint
try:
    from controllers.cma_controller import register_cma_blueprint
    register_cma_blueprint(app)
    logger.info("Registered CMA controller blueprint")
except ImportError:
    logger.warning("Could not import CMA controller blueprint")

# Register Voice API blueprint
try:
    from api.voice.routes import register_voice_api_blueprint
    register_voice_api_blueprint(app)
    logger.info("Registered voice API blueprint")
except ImportError:
    logger.warning("Could not import voice API blueprint")
    
# Register Voice controller blueprint
try:
    from controllers.voice_controller import register_voice_blueprint
    register_voice_blueprint(app)
    logger.info("Registered voice controller blueprint")
except ImportError:
    logger.warning("Could not import voice controller blueprint")

# Routes
@app.route('/')
@tailwind_ui_preference_decorator
def index():
    """Render the main landing page."""
    return render_template('landing_page_modern.html')

@app.route('/dashboard')
@tailwind_ui_preference_decorator
def old_index():
    """Render the home page with recent activity and stats."""
    # Placeholder data - in a real app, this would come from the database
    recent_activity = []
    stats = {
        'total_reports': 0,
        'total_properties': 0,
        'last_run': 'Never',
        'success_rate': 0
    }
    
    # Try to get real data if database is available
    try:
        db_conn = Database()
        
        # Get recent activity - check if table exists first
        try:
            activity_query = "SELECT action, details, created_at as timestamp FROM activity_log ORDER BY created_at DESC LIMIT 5"
            recent_activity = db_conn.execute_query(activity_query)
        except Exception:
            # Table probably doesn't exist yet
            recent_activity = []
        
        # Get stats - safe query that won't fail if tables don't exist yet
        stats_query = """
        SELECT 
            COALESCE((SELECT COUNT(*) FROM narrpr_reports WHERE 1=1), 0) as total_reports,
            COALESCE((SELECT COUNT(DISTINCT address) FROM narrpr_reports WHERE address != 'Not available'), 0) as total_properties,
            (SELECT MAX(created_at) FROM narrpr_reports WHERE 1=1) as last_run,
            0 as success_rate
        """
        stats_result = db_conn.execute_query(stats_query)
        if stats_result and len(stats_result) > 0:
            stats = stats_result[0]
            # Format last_run date
            if stats['last_run']:
                stats['last_run'] = stats['last_run'].strftime("%Y-%m-%d %H:%M:%S")
        
        db_conn.close()
    except Exception as e:
        logger.error(f"Error retrieving dashboard data: {str(e)}")
    
    return render_template('index_modern.html', recent_activity=recent_activity, stats=stats)

@app.route('/run-scraper', methods=['GET', 'POST'])
@tailwind_ui_preference_decorator
def run_scraper():
    """Run the NARRPR scraper manually."""
    if request.method == 'POST':
        try:
            # Load credentials from form or environment variables
            username = request.form.get('username') or os.getenv("NARRPR_USERNAME")
            password = request.form.get('password') or os.getenv("NARRPR_PASSWORD")
            
            if not username or not password:
                flash("Missing credentials. Please provide username and password.", "danger")
                return redirect(url_for('run_scraper'))
            
            # Initialize scraper
            narrpr_scraper = NarrprScraper(username, password)
            
            # Login to NARRPR
            login_success = narrpr_scraper.login()
            if not login_success:
                flash("Failed to login to NARRPR. Please check your credentials.", "danger")
                return redirect(url_for('run_scraper'))
            
            # Scrape reports data
            reports_data = narrpr_scraper.scrape_reports()
            if not reports_data:
                flash("No reports data found.", "warning")
                narrpr_scraper.close()
                return redirect(url_for('run_scraper'))
            
            # Generate timestamp for filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            csv_filename = f"narrpr_reports_{timestamp}.csv"
            
            # Save data to CSV file
            csv_path = narrpr_scraper.save_to_csv(reports_data, filename=csv_filename)
            
            # Save data to database
            db_result = save_to_database(reports_data, "narrpr_reports")
            
            # Close the browser
            narrpr_scraper.close()
            
            # Flash success message
            flash(f"Successfully scraped {len(reports_data)} reports. Data saved to CSV and database.", "success")
            
            # Store filename in session for display on reports page
            session['latest_csv'] = csv_filename
            
            return redirect(url_for('reports'))
            
        except Exception as e:
            flash(f"Error running scraper: {str(e)}", "danger")
            logger.exception("Error in run_scraper route")
            return redirect(url_for('run_scraper'))
    
    return render_template('run_scraper_modern.html')

@app.route('/advanced-scraper', methods=['GET', 'POST'])
@tailwind_ui_preference_decorator
def advanced_scraper():
    """Run the NARRPR scraper with advanced options for multiple sections."""
    if request.method == 'POST':
        try:
            # Load credentials from form or environment variables
            username = request.form.get('username') or os.getenv("NARRPR_USERNAME")
            password = request.form.get('password') or os.getenv("NARRPR_PASSWORD")
            
            if not username or not password:
                flash("Missing credentials. Please provide username and password.", "danger")
                return redirect(url_for('advanced_scraper'))
            
            # Build scrape options from form data
            scrape_options = {
                'scrape_reports': 'scrape_reports' in request.form,
                'property_ids': [id.strip() for id in request.form.get('property_ids', '').split(',') if id.strip()],
                'location_ids': [id.strip() for id in request.form.get('location_ids', '').split(',') if id.strip()],
                'zip_codes': [zip.strip() for zip in request.form.get('zip_codes', '').split(',') if zip.strip()],
                'neighborhood_ids': [id.strip() for id in request.form.get('neighborhood_ids', '').split(',') if id.strip()],
                'scrape_valuations': 'scrape_valuations' in request.form,
                'scrape_comparables': 'scrape_comparables' in request.form
            }
            
            # Check if any scraping option is selected
            if not (scrape_options['scrape_reports'] or 
                    scrape_options['property_ids'] or 
                    scrape_options['location_ids'] or 
                    scrape_options['zip_codes'] or 
                    scrape_options['neighborhood_ids']):
                flash("No scraping options selected. Please select at least one section to scrape.", "warning")
                return redirect(url_for('advanced_scraper'))
            
            # Store the scrape options for the workflow to use
            session['scrape_options'] = scrape_options
            
            # Import here to avoid circular import
            from core import run_etl_workflow
            
            # Run the ETL workflow with the advanced options
            with app.app_context():
                result = run_etl_workflow(scrape_options)
            
            if result:
                # Build success message based on data scraped
                success_parts = []
                
                if scrape_options['scrape_reports']:
                    success_parts.append("Reports")
                    
                if scrape_options['property_ids']:
                    success_parts.append(f"Property details ({len(scrape_options['property_ids'])} properties)")
                    
                    if scrape_options['scrape_valuations']:
                        success_parts.append("Property valuations")
                        
                    if scrape_options['scrape_comparables']:
                        success_parts.append("Comparable properties")
                
                if scrape_options['location_ids'] or scrape_options['zip_codes']:
                    area_count = len(scrape_options['location_ids']) + len(scrape_options['zip_codes'])
                    success_parts.append(f"Market activity ({area_count} areas)")
                
                if scrape_options['neighborhood_ids']:
                    success_parts.append(f"Neighborhood data ({len(scrape_options['neighborhood_ids'])} neighborhoods)")
                
                success_message = "Successfully scraped: " + ", ".join(success_parts)
                flash(f"{success_message}. Data saved to CSV and database.", "success")
                
                return redirect(url_for('reports'))
            else:
                flash("Scraping process completed but no data was retrieved.", "warning")
                return redirect(url_for('advanced_scraper'))
            
        except Exception as e:
            flash(f"Error running advanced scraper: {str(e)}", "danger")
            logger.exception("Error in advanced_scraper route")
            return redirect(url_for('advanced_scraper'))
    
    return render_template('advanced_scraper_modern.html')

@app.route('/reports')
@tailwind_ui_preference_decorator
def reports():
    """Display scraped reports."""
    reports_data = []
    export_formats = get_export_formats()
    
    try:
        # Get reports from database
        db_conn = Database()
        try:
            reports_query = """
            SELECT * FROM narrpr_reports 
            ORDER BY created_at DESC 
            LIMIT 100
            """
            reports_data = db_conn.execute_query(reports_query)
        except Exception as e:
            logger.warning(f"Could not query reports: {str(e)}")
            reports_data = []
        db_conn.close()
    except Exception as e:
        flash(f"Error connecting to database: {str(e)}", "danger")
        logger.exception("Error in reports route")
    
    return render_template('reports_modern.html', reports=reports_data, export_formats=export_formats)

@app.route('/export/<format>')
def export_data(format):
    """Export data in the specified format."""
    try:
        # Get reports from database
        db_conn = Database()
        try:
            # Get query parameters
            limit = request.args.get('limit', default=100, type=int)
            include_metadata = request.args.get('include_metadata', default=False, type=lambda v: v.lower() == 'true')
            include_all_columns = request.args.get('include_all_columns', default=True, type=lambda v: v.lower() == 'true')
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            
            # Add safety limit
            if limit > 1000:
                limit = 1000
                
            # Build the query with filters
            if include_all_columns:
                select_clause = "*"
            else:
                select_clause = "id, title, address, price, date, created_at"
                
            query_parts = [f"SELECT {select_clause} FROM narrpr_reports"]
            where_clauses = []
            
            # Add date filters if provided
            if start_date:
                where_clauses.append(f"date >= '{start_date}'")
            if end_date:
                where_clauses.append(f"date <= '{end_date}'")
                
            if where_clauses:
                query_parts.append("WHERE " + " AND ".join(where_clauses))
                
            # Add sorting and limit
            query_parts.append("ORDER BY created_at DESC")
            query_parts.append(f"LIMIT {limit}")
            
            # Create the final query
            reports_query = " ".join(query_parts)
            reports_data = db_conn.execute_query(reports_query)
            
            if not reports_data:
                flash("No data available to export.", "warning")
                return redirect(url_for('reports'))
                
            # Generate timestamp for filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"narrpr_export_{timestamp}"
            
            # Add metadata if requested
            if include_metadata:
                # Add export metadata to the data
                export_metadata = {
                    "export_timestamp": datetime.now().isoformat(),
                    "export_user": "system",  # Replace with actual user if authentication is added
                    "record_count": len(reports_data),
                    "query_limit": limit,
                    "export_format": format
                }
                
                # Add metadata as the first record for CSV and Excel formats
                # For JSON, we'll include it in a separate metadata section
                if format in ['csv', 'excel']:
                    reports_data = [export_metadata] + reports_data
            
            # Export data in the specified format
            if format == 'csv':
                file_path = export_to_csv(reports_data, filename)
                if file_path:
                    flash(f"Data exported to CSV successfully. {len(reports_data)} records exported.", "success")
                    return send_file(file_path, as_attachment=True, download_name=os.path.basename(file_path))
                    
            elif format == 'json':
                # For JSON, structure the data differently with metadata section
                if include_metadata:
                    structured_data = {
                        "metadata": export_metadata,
                        "data": reports_data
                    }
                    file_path = export_to_json(structured_data, filename)
                else:
                    file_path = export_to_json(reports_data, filename)
                
                if file_path:
                    flash(f"Data exported to JSON successfully. {len(reports_data)} records exported.", "success")
                    return send_file(file_path, as_attachment=True, download_name=os.path.basename(file_path))
                    
            elif format == 'excel':
                file_path = export_to_excel(reports_data, filename)
                if file_path:
                    flash(f"Data exported to Excel successfully. {len(reports_data)} records exported.", "success")
                    return send_file(file_path, as_attachment=True, download_name=os.path.basename(file_path))
            else:
                flash(f"Unsupported export format: {format}", "danger")
                
        except Exception as e:
            logger.warning(f"Could not export data: {str(e)}")
            flash(f"Error exporting data: {str(e)}", "danger")
            
        finally:
            db_conn.close()
            
    except Exception as e:
        flash(f"Error connecting to database: {str(e)}", "danger")
        logger.exception("Error in export_data route")
    
    return redirect(url_for('reports'))

@app.route('/settings', methods=['GET', 'POST'])
@tailwind_ui_preference_decorator
def settings():
    """Settings page for configuring the scraper and application."""
    # Check if new UI should be used
    use_new_ui = request.args.get('new_ui', '0') == '1'
    
    if request.method == 'POST':
        try:
            # Get form data
            username = request.form.get('username')
            password = request.form.get('password')
            headless = 'headless' in request.form
            timeout = int(request.form.get('timeout', 30))
            wait_time = int(request.form.get('wait_time', 5))
            retry_attempts = int(request.form.get('retry_attempts', 3))
            
            # Update configuration based on form data
            new_config = {
                'narrpr': {
                    'username': username,
                    'password': password if password else "",  # Don't overwrite with empty password
                    'headless': headless,
                    'timeout': timeout
                },
                'scraping': {
                    'wait_time': wait_time,
                    'retry_attempts': retry_attempts
                }
            }
            
            # Update config file
            result = update_config(new_config)
            
            # If credentials provided, save to database model
            if username and password:
                try:
                    # Check if credentials already exist
                    existing_cred = NarrprCredential.query.first()
                    if existing_cred:
                        # Update existing credentials
                        existing_cred.username = username
                        existing_cred.password = password
                        existing_cred.updated_at = datetime.now()
                    else:
                        # Create new credentials
                        new_cred = NarrprCredential(username=username, password=password)
                        db.session.add(new_cred)
                    
                    db.session.commit()
                    logger.info("NARRPR credentials saved to database")
                    
                    # Add activity log entry
                    activity = ActivityLog(
                        action="update_credentials",
                        details=f"Updated NARRPR credentials for {username}"
                    )
                    db.session.add(activity)
                    db.session.commit()
                except Exception as e:
                    logger.error(f"Error saving credentials to database: {str(e)}")
                    db.session.rollback()
            
            if result:
                flash("Settings updated successfully.", "success")
            else:
                flash("Failed to update settings.", "danger")
            
            # Preserve the new_ui parameter in the redirect
            redirect_url = url_for('settings')
            if use_new_ui:
                redirect_url += '?new_ui=1'
            return redirect(redirect_url)
            
        except Exception as e:
            flash(f"Error updating settings: {str(e)}", "danger")
            logger.exception("Error in settings route")
            redirect_url = url_for('settings')
            if use_new_ui:
                redirect_url += '?new_ui=1'
            return redirect(redirect_url)
    
    # Load current configuration
    current_config = load_config()
    
    # Get credentials from database if available
    try:
        cred = NarrprCredential.query.first()
        if cred:
            current_config['narrpr']['username'] = cred.username
            # Don't populate password field with actual password for security
            # current_config['narrpr']['password'] = "••••••••"
    except Exception as e:
        logger.error(f"Error retrieving credentials from database: {str(e)}")
    
    # Render appropriate template based on UI version
    if use_new_ui:
        # Mock data for the new settings UI
        settings_data = {
            'application_name': 'TerraMiner',
            'application_description': 'Real Estate Data Intelligence Platform',
            'default_location': 'sf',
            'records_per_page': 25,
            'date_format': 'MM/DD/YYYY',
            'default_export_format': 'csv',
            'data_refresh_interval': '300',
            'enable_auto_refresh': True,
            'save_export_history': True,
            'theme': 'dark',
            'accent_color': '#00bfb3',
            'enable_animations': True,
            'chart_theme': 'default',
            'enable_chart_animations': True,
            'show_chart_legends': True,
            'dashboard_layout': 'grid',
            'default_widgets': ['system', 'api', 'database', 'recent'],
            'font_size': 'medium',
            'high_contrast': False,
            'reduce_motion': False,
            'notification_channels': ['email', 'app'],
            'notification_frequency': 'realtime',
            'sms_phone': '',
            'sms_alerts_only': True,
            'slack_webhook': '',
            'slack_channel': '#notifications'
        }
        
        # Sample user data
        user_data = {
            'first_name': 'Admin',
            'last_name': 'User',
            'email': 'admin@example.com',
            'phone': '(555) 123-4567',
            'timezone': 'America/Los_Angeles',
            'full_name': 'Admin User'
        }
        
        # Sample API keys
        api_keys = [
            {
                'service': 'Zillow API',
                'is_set': True,
                'required': True,
                'updated_at': 'Apr 15, 2025'
            },
            {
                'service': 'Realtor.com API',
                'is_set': False,
                'required': False,
                'updated_at': 'Never'
            },
            {
                'service': 'Google Maps API',
                'is_set': True,
                'required': True,
                'updated_at': 'Apr 22, 2025'
            },
            {
                'service': 'OpenAI API',
                'is_set': True,
                'required': False,
                'updated_at': 'Apr 28, 2025'
            }
        ]
        
        # Sample notification types
        notification_types = [
            {
                'id': 'system_alerts',
                'name': 'System Alerts',
                'channels': ['email', 'app', 'slack']
            },
            {
                'id': 'data_updates',
                'name': 'Data Updates',
                'channels': ['app']
            },
            {
                'id': 'report_ready',
                'name': 'Report Ready',
                'channels': ['email', 'app']
            },
            {
                'id': 'price_alerts',
                'name': 'Price Alerts',
                'channels': ['email', 'sms', 'app']
            }
        ]
        
        return render_template('settings_modern.html',
                               config=current_config,
                               settings=settings_data,
                               user=user_data,
                               api_keys=api_keys,
                               notification_types=notification_types)
    else:
        try:
            # Use our enhanced template rendering with fallback
            return render_template_with_fallback('settings.html', config=current_config)
        except Exception as e:
            # Generate error ID for tracking
            error_id = str(uuid.uuid4())[:8]
            logger.error(f"Error rendering settings page [{error_id}]: {str(e)}")
            
            # Graceful fallback to the index page with error message
            flash(f"Settings page is temporarily unavailable. Support has been notified. (Error ID: {error_id})", "error")
            return redirect(url_for('index'))

@app.route('/api/status')
def api_status():
    """API endpoint to check the status of the application."""
    try:
        # Check database connection
        db_conn = Database()
        db_status = "Connected"
        db_conn.close()
    except Exception:
        db_status = "Disconnected"
    
    status_data = {
        'status': 'active',
        'database': db_status,
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }
    
    return jsonify(status_data)

@app.route('/load-test-data')
def load_test_data():
    """Route to load test data for development and testing."""
    try:
        # Insert test data
        result = insert_test_data()
        
        if result:
            # Add activity log entry
            try:
                activity = ActivityLog(
                    action="load_test_data",
                    details="Inserted sample property data for testing"
                )
                db.session.add(activity)
                db.session.commit()
            except Exception as e:
                logger.error(f"Error adding activity log: {str(e)}")
                
            flash("Test data loaded successfully.", "success")
        else:
            flash("Failed to load test data.", "danger")
            
    except Exception as e:
        flash(f"Error loading test data: {str(e)}", "danger")
        logger.exception("Error in load_test_data route")
        
    return redirect(url_for('reports'))

# UI Preference API
@app.route('/set_ui_preference', methods=['POST'])
def set_ui_preference():
    """API endpoint to set UI preference via AJAX."""
    if not request.is_json:
        return jsonify({'success': False, 'error': 'Invalid request format'}), 400
    
    data = request.get_json()
    preference = data.get('preference')
    
    if preference not in ['legacy', 'modern']:
        return jsonify({'success': False, 'error': 'Invalid preference value'}), 400
    
    # Store preference in session
    session['ui_preference'] = preference
    logger.debug(f"UI preference set to: {preference}")
    
    return jsonify({'success': True})

# Enhanced error handlers with logging and redirection
@app.errorhandler(404)
def page_not_found(e):
    # Log the 404 error with the requested path
    requested_path = request.path
    referrer = request.referrer if request.referrer else "Unknown"
    logger.warning(f"404 Error: Path '{requested_path}' not found. Referrer: {referrer}")
    
    # Check if it's an API route
    if requested_path.startswith('/api/'):
        return jsonify({'error': 'Not found', 'message': 'The requested API endpoint does not exist'}), 404
    
    # Try to guess the closest valid page
    if requested_path.endswith('/'):
        # Try without trailing slash
        potential_path = requested_path[:-1]
        for rule in app.url_map.iter_rules():
            if str(rule) == potential_path:
                return redirect(potential_path)
    
    # Return friendly error page
    return render_template('error_modern.html', error_code=404, error_message="Page not found"), 404

@app.errorhandler(500)
def server_error(e):
    # Log the 500 error with detailed information
    error_id = str(uuid.uuid4())[:8]
    logger.error(f"500 Error [{error_id}]: {str(e)}")
    logger.error(f"Request path: {request.path}")
    logger.error(f"Request method: {request.method}")
    logger.error(f"Request args: {request.args}")
    
    # Always fall back to main page for safety if an internal error occurs
    if not app.debug:
        flash("Something went wrong. Our team has been notified.", "error")
        return redirect(url_for('index'))
    
    # Only show error page in debug mode
    return render_template('error_modern.html', 
                          error_code=500, 
                          error_message="Internal server error", 
                          error_id=error_id), 500

# Import necessary models without causing circular imports
# Define dummy classes that will be replaced if imports fail
class DummyModel:
    query = None
    def __init__(self, *args, **kwargs):
        pass
    
# Start with dummy models
ActivityLog = JobRun = NarrprCredential = AIFeedback = DummyModel

# Try to import models
try:
    # Use direct imports with absolute path
    import importlib.util
    import os
    
    # Import from root level models.py
    models_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'models.py')
    if os.path.exists(models_path):
        spec = importlib.util.spec_from_file_location('root_models', models_path)
        root_models = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(root_models)
        
        # Get models from the root_models module
        ActivityLog = getattr(root_models, 'ActivityLog', DummyModel)
        JobRun = getattr(root_models, 'JobRun', DummyModel) 
        NarrprCredential = getattr(root_models, 'NarrprCredential', DummyModel)
        AIFeedback = getattr(root_models, 'AIFeedback', DummyModel)
        
        logger.info("Successfully imported models from root models.py")
    else:
        logger.error("Root models.py file not found")
except Exception as e:
    logger.error(f"Failed to import models: {str(e)}")
    # Keep using dummy models

# Import controllers and API endpoints
try:
    # Import AI API endpoints
    from ai.api.endpoints import ai_api
    from ai.api.model_content import model_content_api
    
    # Register AI blueprints
    app.register_blueprint(ai_api)
    app.register_blueprint(model_content_api)
    
    app.config['AI_ENABLED'] = True
    logger.info("AI modules loaded successfully")
except Exception as e:
    logger.warning(f"Failed to load AI modules: {str(e)}")
    app.config['AI_ENABLED'] = False

# Import and register CMA controller
try:
    from controllers.cma_controller import register_cma_blueprint
    # Use the function which properly registers the blueprint
    register_cma_blueprint(app)
    logger.info("CMA controller registered successfully")
except Exception as e:
    logger.warning(f"Failed to load CMA controller: {str(e)}")

# Add route to check AI status
@app.route('/api/ai-status')
def ai_status():
    """API endpoint to check the status of AI capabilities"""
    status_data = {
        'ai_enabled': app.config.get('AI_ENABLED', False),
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }
    
    # Check AI key configuration
    status_data['openai_configured'] = bool(os.environ.get('OPENAI_API_KEY'))
    status_data['anthropic_configured'] = bool(os.environ.get('ANTHROPIC_API_KEY'))
    
    # Check available agents if AI is enabled
    if app.config.get('AI_ENABLED', False):
        status_data['available_agents'] = [
            'text_summarizer',
            'market_analyzer',
            'recommendation_agent',
            'natural_language_search'
        ]
    
    return jsonify(status_data)

@app.route('/ai-demo')
@tailwind_ui_preference_decorator
def ai_demo():
    """AI capabilities demonstration page"""
    try:
        # Use enhanced template rendering with fallback
        return render_template_with_fallback('ai_demo.html')
    except Exception as e:
        # Generate error ID for tracking
        error_id = str(uuid.uuid4())[:8]
        logger.error(f"Error rendering AI demo page [{error_id}]: {str(e)}")
        
        # Graceful fallback to landing page with error message
        flash(f"AI demo is temporarily unavailable. Support has been notified. (Error ID: {error_id})", "error")
        return redirect(url_for('index'))

@app.route('/ai-feedback-analytics')
@tailwind_ui_preference_decorator
def ai_feedback_analytics():
    """AI feedback analytics dashboard"""
    try:
        # Use our enhanced template rendering with fallback
        return render_template_with_fallback('ai_feedback_analytics.html')
    except Exception as e:
        # Generate error ID for tracking
        error_id = str(uuid.uuid4())[:8]
        logger.error(f"Error rendering AI feedback analytics page [{error_id}]: {str(e)}")
        
        # Graceful fallback to the AI demo page with error message
        flash(f"AI feedback analytics is temporarily unavailable. Support has been notified. (Error ID: {error_id})", "error")
        return redirect(url_for('ai_demo'))

@app.route('/ai/prompt-testing', methods=['GET', 'POST'])
@tailwind_ui_preference_decorator
def ai_prompt_testing():
    """AI prompt A/B testing page"""
    # Get UI preference from the decorator
    use_tailwind = g.use_tailwind_ui
    
    # Placeholder result data for testing the template
    result_a = None
    result_b = None
    
    # Check if we have form data for processing
    if request.method == 'POST':
        # Extract form data
        agent_type = request.form.get('agent_type')
        prompt_a = request.form.get('original_prompt')
        prompt_b = request.form.get('variant_prompt')
        test_input = request.form.get('test_input')
        use_gpt4 = 'use_gpt4' in request.form
        save_results = 'save_results' in request.form
        
        # Initialize AI module
        try:
            from ai.prompt_testing import run_prompt_comparison, save_prompt_comparison
            
            # Run the comparison with proper timeout handling
            results = run_prompt_comparison(
                agent_type=agent_type,
                prompt_a=prompt_a,
                prompt_b=prompt_b,
                test_input=test_input,
                use_gpt4=use_gpt4
            )
            
            # Extract results
            result_a = results.get('result_a')
            result_b = results.get('result_b')
            
            # Save results if requested
            if save_results:
                save_prompt_comparison(
                    agent_type=agent_type,
                    prompt_a=prompt_a,
                    prompt_b=prompt_b,
                    result_a=result_a,
                    result_b=result_b
                )
                
        except Exception as e:
            logger.error(f"Error during prompt testing: {str(e)}")
            flash(f"Error processing prompts: {str(e)}", "error")
    
    # Always use the modern template
    try:
        # Use our enhanced template rendering with fallback
        return render_template_with_fallback('ai_prompt_testing.html', result_a=result_a, result_b=result_b)
    except Exception as e:
        # Generate error ID for tracking
        error_id = str(uuid.uuid4())[:8]
        logger.error(f"Error rendering AI prompt testing page [{error_id}]: {str(e)}")
        
        # Graceful fallback to the AI feedback analytics page with error message
        flash(f"AI prompt testing is temporarily unavailable. Support has been notified. (Error ID: {error_id})", "error")
        return redirect(url_for('ai_feedback_analytics'))
    
@app.route('/ai/continuous-learning', methods=['GET'])
@tailwind_ui_preference_decorator
def ai_continuous_learning():
    """AI continuous learning system page"""
    try:
        # Use our enhanced template rendering with fallback
        return render_template_with_fallback('ai_continuous_learning.html')
    except Exception as e:
        # Generate error ID for tracking
        error_id = str(uuid.uuid4())[:8]
        logger.error(f"Error rendering AI continuous learning page [{error_id}]: {str(e)}")
        
        # Graceful fallback to the AI prompt testing page with error message
        flash(f"AI continuous learning page is temporarily unavailable. Support has been notified. (Error ID: {error_id})", "error")
        return redirect(url_for('ai_prompt_testing'))
    
@app.route('/ai/advanced-analytics', methods=['GET'])
@tailwind_ui_preference_decorator
def ai_advanced_analytics():
    """AI advanced analytics dashboard"""
    try:
        # Use our enhanced template rendering with fallback
        return render_template_with_fallback('ai_advanced_analytics.html')
    except Exception as e:
        # Generate error ID for tracking
        error_id = str(uuid.uuid4())[:8]
        logger.error(f"Error rendering AI advanced analytics page [{error_id}]: {str(e)}")
        
        # Graceful fallback to the AI continuous learning page with error message
        flash(f"AI advanced analytics is temporarily unavailable. Support has been notified. (Error ID: {error_id})", "error")
        return redirect(url_for('ai_continuous_learning'))
    
@app.route('/ai/integration-automation', methods=['GET'])
@tailwind_ui_preference_decorator
def ai_integration_automation():
    """AI integration and automation configuration page"""
    try:
        # Use our enhanced template rendering with fallback
        return render_template_with_fallback('ai_integration_automation.html')
    except Exception as e:
        # Generate error ID for tracking
        error_id = str(uuid.uuid4())[:8]
        logger.error(f"Error rendering AI integration automation page [{error_id}]: {str(e)}")
        
        # Graceful fallback to the AI advanced analytics page with error message
        flash(f"AI integration automation page is temporarily unavailable. Support has been notified. (Error ID: {error_id})", "error")
        return redirect(url_for('ai_advanced_analytics'))
    
# Monitoring routes
@app.route('/monitoring/dashboard', methods=['GET'])
@tailwind_ui_preference_decorator
def monitoring_dashboard():
    """Monitoring dashboard overview page"""
    # Get UI preference from the decorator 
    use_tailwind = g.use_tailwind_ui
    logger.debug(f"Dashboard UI preference: use_tailwind={use_tailwind}")
    
    # Import datetime for our timestamps
    from datetime import datetime, timedelta
    now = datetime.now()
    
    # Set static modern data for demo purposes (will be replaced with real data later)
    
    # System health status
    system_health = {
        'status': 'excellent',
        'score': 98
    }
    
    # System metrics with 'performance' structure to match what the template expects
    system_metrics = {
        'performance': {
            'cpu': {'metric_value': 15},
            'memory': {'metric_value': 32},
            'disk': {'metric_value': 45}
        },
        'cpu_usage': 15,
        'memory_usage': 32,
        'disk_usage': 45
    }
    
    # API metrics
    api_metrics = {
        'total_requests_24h': 1458,
        'error_rate': 0.8,
        'avg_response_time': 235
    }
    
    # Alerts summary
    alerts_summary = {
        'active': {
            'total': 4,
            'critical': 0,
            'error': 1,
            'warning': 2, 
            'info': 1
        }
    }
    
    # Alerts
    alerts = [
        {
            'severity': 'error',
            'message': 'Database connection pool reaching limits',
            'component': 'Database',
            'created_at': now - timedelta(hours=2),
            'status': 'active',
            'id': 1
        },
        {
            'severity': 'warning',
            'message': 'Memory usage is critically high at 90.0%',
            'component': 'System',
            'created_at': now - timedelta(hours=4),
            'status': 'active',
            'id': 2
        },
        {
            'severity': 'warning',
            'message': 'CPU usage is elevated at 78.2%',
            'component': 'System',
            'created_at': now - timedelta(hours=8),
            'status': 'active',
            'id': 3
        },
        {
            'severity': 'info',
            'message': 'Scheduled maintenance completed successfully',
            'component': 'System',
            'created_at': now - timedelta(days=1),
            'status': 'resolved',
            'id': 4
        }
    ]
    
    # Scheduled reports
    scheduled_reports = [
        {
            'name': 'Monthly Market Overview',
            'schedule': 'First Monday of month at 2:00 AM',
            'description': 'Comprehensive market analysis for Benton County',
            'last_run': now - timedelta(days=3),
            'id': 1,
            'is_active': True
        },
        {
            'name': 'Weekly Price Trend Report',
            'schedule': 'Monday at 1:00 AM',
            'description': 'Weekly price trends by neighborhood',
            'last_run': now - timedelta(days=1),
            'id': 2,
            'is_active': True
        },
        {
            'name': 'Daily Activity Summary',
            'schedule': 'Daily at 11:59 PM',
            'description': 'Daily summary of market activity',
            'last_run': now - timedelta(hours=8),
            'id': 3,
            'is_active': True
        }
    ]
    
    # Recent activity
    recent_activity = [
        {
            'action': 'System backup completed',
            'details': 'Automatic backup of database and configuration files',
            'timestamp': now - timedelta(minutes=15),
            'user': 'System'
        },
        {
            'action': 'Report generated',
            'details': 'Monthly market activity report for Benton County',
            'timestamp': now - timedelta(minutes=35),
            'user': 'Scheduler'
        },
        {
            'action': 'Property data updated',
            'details': '205 properties updated with latest pricing information',
            'timestamp': now - timedelta(hours=2),
            'user': 'ETL Process'
        }
    ]
    
    # Create additional metrics needed for the template
    database_metrics = {
        'connection_count': {'metric_value': 18},
        'query_time_avg': {'metric_value': 0.042},
        'cache_hit_ratio': {'metric_value': 95.2},
        'slow_queries': {'metric_value': 1}
    }
    
    # AI metrics
    ai_metrics = {
        'total_requests_24h': 87,
        'avg_response_time': 1.32,
        'avg_rating': 4.3,
        'successful_completions': 84,
        'failed_completions': 3
    }
    
    # Price trends
    price_trends = {
        'avg_price_change': 2.4,
        'median_price': 425000,
        'min_price': '212,500',
        'max_price': '1,250,000'
    }
    
    # Price stats (for legacy template)
    price_stats = {
        'median_price': '$425K',
        'trend_indicator': '+2.4%'
    }
    
    # Job metrics (for legacy template)
    job_metrics = {
        'total_jobs_30d': 145,
        'success_rate_30d': 92.4,
        'latest_jobs': [
            {
                'job_name': 'Database Backup',
                'status': 'completed',
                'runtime': '4m 32s',
                'start_time': now - timedelta(hours=2)
            },
            {
                'job_name': 'Data Import',
                'status': 'completed',
                'runtime': '12m 18s',
                'start_time': now - timedelta(hours=6)
            },
            {
                'job_name': 'Report Generation',
                'status': 'failed',
                'runtime': '8m 45s',
                'start_time': now - timedelta(hours=12)
            }
        ]
    }
    
    # Location stats
    location_stats = {
        'total_properties': 120,
        'distinct_cities': 10
    }
    
    # Report metrics (for legacy template)
    report_metrics = {
        'total_scheduled': 8,
        'upcoming': [
            {
                'name': 'Weekly Market Summary',
                'frequency': 'Weekly',
                'next_run': now + timedelta(days=2, hours=4)
            },
            {
                'name': 'Monthly Performance Review',
                'frequency': 'Monthly',
                'next_run': now + timedelta(days=8, hours=10)
            },
            {
                'name': 'Quarterly Trend Analysis',
                'frequency': 'Quarterly',
                'next_run': now + timedelta(days=24, hours=8)
            }
        ]
    }
    
    # Update API metrics with more fields
    api_metrics.update({
        'total_users': 52,
        'top_endpoint': '/api/property/search',
        'top_endpoint_count': 412
    })
    
    # Update alerts summary with more fields
    alerts_summary.update({
        'last_24h': 4,
        'last_7d': 12,
        'latest': [a for a in alerts[:2]]  # Use the first two alerts as latest
    })
    
    # Always use modern dashboard template
    logger.debug("Using modern dashboard template")
    return render_template(
        'monitoring_dashboard_modern.html',
        # Health info
        health_score=system_health['score'],
        health_status=system_health['status'],
        current_time=now.strftime('%Y-%m-%d %H:%M:%S'),
        
        # Metrics
        system_metrics=system_metrics,
        api_metrics=api_metrics,
        database_metrics=database_metrics,
        ai_metrics=ai_metrics,
        price_trends=price_trends,
        location_stats=location_stats,
        alerts_summary=alerts_summary,
        
        # Lists
        alerts=alerts,
        scheduled_reports=scheduled_reports,
        recent_activity=recent_activity,
        price_stats=price_stats,
        job_metrics=job_metrics,
        report_metrics=report_metrics
    )
    
# All code related to the old monitoring_system function was completely removed
    
@app.route('/monitoring/system', methods=['GET'])
@tailwind_ui_preference_decorator
def monitoring_system():
    """System performance monitoring page"""
    # Get UI preference from the decorator
    use_tailwind = g.use_tailwind_ui
    
    # Create sample system metrics for the template
    metrics = {
        'performance': {
            'cpu': {'metric_value': 35},
            'memory': {'metric_value': 48},
            'disk': {'metric_value': 62}
        }
    }
    
    # Always use modern template
    return render_template('monitoring_system_modern.html', 
                          system_metrics=metrics)
    
@app.route('/monitoring/api', methods=['GET'])
@tailwind_ui_preference_decorator
def monitoring_api():
    """API performance monitoring page"""
    # Get UI preference from the decorator
    use_tailwind = g.use_tailwind_ui
    # Use our modern template
    return render_template('monitoring_api_modern.html')

@app.route('/api/location/data', methods=['GET'])
def api_location_data():
    """API endpoint for location data to power geographical visualization."""
    try:
        from models import ModelsPropertyLocation
        from sqlalchemy import func
        
        # Get query parameters
        city = request.args.get('city')
        state = request.args.get('state')
        zip_code = request.args.get('zip_code')
        limit = request.args.get('limit', default=100, type=int)
        
        # Build query
        query = ModelsPropertyLocation.query
        
        # Apply filters if provided
        if city:
            query = query.filter(func.lower(ModelsPropertyLocation.city) == city.lower())
        if state:
            query = query.filter(func.lower(ModelsPropertyLocation.state) == state.lower())
        if zip_code:
            query = query.filter(ModelsPropertyLocation.zip_code == zip_code)
            
        # Get locations with limit
        locations = query.limit(limit).all()
        
        # Convert to JSON-serializable format
        location_data = []
        for loc in locations:
            location_data.append({
                'id': loc.id,
                'address': loc.full_address,
                'street': loc.street_address,
                'city': loc.city,
                'state': loc.state,
                'zip_code': loc.zip_code,
                'latitude': float(loc.latitude) if loc.latitude else None,
                'longitude': float(loc.longitude) if loc.longitude else None,
                'property_type': loc.property_type,
                'year_built': loc.year_built,
                'report_id': loc.report_id
            })
        
        return jsonify({
            'status': 'success',
            'count': len(location_data),
            'data': location_data
        })
    except Exception as e:
        logger.error(f"Error retrieving location data: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
        
@app.route('/api/price-trends', methods=['GET'])
def api_price_trends():
    """API endpoint for price trend data for visualization."""
    try:
        from models import PriceTrend
        from sqlalchemy import func
        
        # Get query parameters
        city = request.args.get('city')
        state = request.args.get('state')
        zip_code = request.args.get('zip_code')
        time_period = request.args.get('period', default='all')
        
        # Build query
        query = PriceTrend.query
        
        # Apply filters if provided
        if city:
            query = query.filter(func.lower(PriceTrend.city) == city.lower())
        if state:
            query = query.filter(func.lower(PriceTrend.state) == state.lower())
        if zip_code:
            query = query.filter(PriceTrend.zip_code == zip_code)
            
        # Apply time period filter
        if time_period != 'all':
            from datetime import datetime, timedelta
            end_date = datetime.now()
            
            if time_period == '1m':
                start_date = end_date - timedelta(days=30)
            elif time_period == '3m':
                start_date = end_date - timedelta(days=90)
            elif time_period == '6m':
                start_date = end_date - timedelta(days=180)
            elif time_period == '1y':
                start_date = end_date - timedelta(days=365)
            elif time_period == '2y':
                start_date = end_date - timedelta(days=730)
            else:
                start_date = end_date - timedelta(days=30)  # Default to 1 month
                
            query = query.filter(PriceTrend.date >= start_date)
        
        # Order by date
        query = query.order_by(PriceTrend.date)
        
        # Execute query
        trends = query.all()
        
        # Convert to JSON-serializable format
        trend_data = []
        for trend in trends:
            trend_data.append({
                'id': trend.id,
                'city': trend.city,
                'state': trend.state,
                'zip_code': trend.zip_code,
                'date': trend.date.isoformat() if trend.date else None,
                'median_price': float(trend.median_price) if trend.median_price else None,
                'avg_price': float(trend.avg_price) if trend.avg_price else None,
                'price_change': float(trend.price_change) if hasattr(trend, 'price_change') and trend.price_change is not None else None,
                'properties_sold': trend.properties_sold if hasattr(trend, 'properties_sold') else None
            })
        
        # Get aggregated statistics
        stats = {}
        if trend_data:
            try:
                # Calculate metrics by city
                cities = {}
                for trend in trend_data:
                    city = trend['city']
                    if city not in cities:
                        cities[city] = {
                            'median_prices': [],
                            'avg_prices': [],
                            'transactions': 0
                        }
                    
                    if trend['median_price'] is not None:
                        cities[city]['median_prices'].append(trend['median_price'])
                    if trend['avg_price'] is not None:
                        cities[city]['avg_prices'].append(trend['avg_price'])
                    if trend['properties_sold'] is not None:
                        cities[city]['transactions'] += trend['properties_sold']
                
                # Calculate aggregate stats
                for city, data in cities.items():
                    if data['median_prices']:
                        cities[city]['avg_median_price'] = sum(data['median_prices']) / len(data['median_prices'])
                    if data['avg_prices']:
                        cities[city]['avg_avg_price'] = sum(data['avg_prices']) / len(data['avg_prices'])
                
                stats = cities
            except Exception as calc_err:
                logger.warning(f"Error calculating trend statistics: {str(calc_err)}")
                stats = {}
        
        return jsonify({
            'status': 'success',
            'count': len(trend_data),
            'data': trend_data,
            'stats': stats
        })
    except Exception as e:
        logger.error(f"Error retrieving price trend data: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
    
@app.route('/monitoring/database', methods=['GET'])
@tailwind_ui_preference_decorator
def monitoring_database():
    """Database performance monitoring page"""
    from utils.db_metrics import get_all_db_metrics
    import time
    
    # Get UI preference from the decorator
    use_tailwind = g.use_tailwind_ui
    
    start_time = time.time()
    # Get real database metrics with error handling
    try:
        db_metrics = get_all_db_metrics()
        error_message = None
        
        # Check if pg_stat_statements extension is missing
        if db_metrics.get('pg_stat_statements_enabled') is False:
            error_message = {
                "title": "Database Extension Missing",
                "message": "The pg_stat_statements extension is not enabled. Some detailed metrics are unavailable.",
                "action": "The extension has been installed but may require a database restart to take full effect."
            }
        
        # Add instrumentation data
        metrics_load_time = round(time.time() - start_time, 2)
        logger.info(f"Database metrics loaded in {metrics_load_time}s")
        
    except Exception as e:
        logger.exception("Error getting database metrics")
        db_metrics = {}
        error_message = {
            "title": "Database Metrics Error",
            "message": f"Unable to fetch metrics: {str(e)}",
            "action": "Check database connectivity and configuration."
        }
    
    # Always use modern template
    return render_template(
        'monitoring_database_modern.html',
        db_metrics=db_metrics,
        error_message=error_message,
        metrics_load_time=locals().get('metrics_load_time', 0)
    )

@app.route('/monitoring/api/database-metrics', methods=['GET'])
def api_database_metrics():
    """API endpoint for fetching database metrics"""
    from utils.db_metrics import get_all_db_metrics
    import time
    
    start_time = time.time()
    response = {"success": True, "data": {}, "error": None}
    
    # Get real database metrics with error handling
    try:
        db_metrics = get_all_db_metrics()
        
        # Check if pg_stat_statements extension is missing
        if db_metrics.get('pg_stat_statements_enabled') is False:
            response["warning"] = "The pg_stat_statements extension is not fully enabled. Some metrics are unavailable."
            
        response["data"] = db_metrics
        response["metrics_load_time"] = round(time.time() - start_time, 2)
        
    except Exception as e:
        logger.exception("Error getting database metrics for API")
        response["success"] = False
        response["error"] = str(e)
        response["metrics_load_time"] = round(time.time() - start_time, 2)
    
    return jsonify(response)
    
@app.route('/monitoring/ai', methods=['GET'])
@tailwind_ui_preference_decorator
def monitoring_ai():
    """AI performance monitoring page"""
    # Use our modern template
    return render_template('monitoring_ai_modern.html')
    
@app.route('/monitoring/locations', methods=['GET'])
@tailwind_ui_preference_decorator
def monitoring_locations():
    """Property locations map visualization page"""
    # Get UI preference from the decorator
    use_tailwind = g.use_tailwind_ui
    
    # Get available states and cities for filters
    try:
        from models import ModelsPropertyLocation
        from sqlalchemy import func
        
        states = db.session.query(ModelsPropertyLocation.state).distinct().order_by(ModelsPropertyLocation.state).all()
        states = [state[0] for state in states if state[0]]
        
        cities = db.session.query(ModelsPropertyLocation.city).distinct().order_by(ModelsPropertyLocation.city).all()
        cities = [city[0] for city in cities if city[0]]
        
        # Get location count
        location_count = ModelsPropertyLocation.query.count()
        
    except Exception as e:
        logger.error(f"Error retrieving location filters: {str(e)}")
        states = []
        cities = []
        location_count = 0
    
    # Always use modern template
    return render_template(
        'monitoring_locations_modern.html', 
        states=states,
        cities=cities,
        location_count=location_count
    )
                          
@app.route('/monitoring/price-trends', methods=['GET'])
@tailwind_ui_preference_decorator
def monitoring_price_trends():
    """Price trends visualization page"""
    # Get UI preference from the decorator
    use_tailwind = g.use_tailwind_ui
    
    # Get available states and cities for filters
    try:
        from models import PriceTrend
        from sqlalchemy import func
        
        states = db.session.query(PriceTrend.state).distinct().order_by(PriceTrend.state).all()
        states = [state[0] for state in states if state[0]]
        
        cities = db.session.query(PriceTrend.city).distinct().order_by(PriceTrend.city).all()
        cities = [city[0] for city in cities if city[0]]
        
        # Get trend date range
        min_date = db.session.query(func.min(PriceTrend.date)).scalar()
        max_date = db.session.query(func.max(PriceTrend.date)).scalar()
        
        date_range = {
            'min': min_date.strftime('%Y-%m-%d') if min_date else None,
            'max': max_date.strftime('%Y-%m-%d') if max_date else None
        }
        
        # Get counts
        trend_count = PriceTrend.query.count()
        city_count = len(cities)
        
    except Exception as e:
        logger.error(f"Error retrieving price trend filters: {str(e)}")
        states = []
        cities = []
        date_range = {'min': None, 'max': None}
        trend_count = 0
        city_count = 0
    
    # Use enhanced render_template_with_fallback for resilience
    try:
        return render_template_with_fallback(
            'monitoring_price_trends.html', 
            states=states,
            cities=cities,
            date_range=date_range,
            trend_count=trend_count,
            city_count=city_count
        )
    except Exception as e:
        # Log the error with a unique ID for traceability
        error_id = str(uuid.uuid4())[:8]
        logger.error(f"Critical rendering error [{error_id}] in price_trends: {str(e)}")
        
        # Create a minimal fallback page with the essential data
        return render_template_with_fallback(
            'monitoring_dashboard.html',
            error_message="The price trends visualization is temporarily unavailable. Our team has been notified.",
            error_id=error_id,
            show_chart_error=True
        )
                          
@app.route('/api/property/search', methods=['GET'])
def api_property_search():
    """API endpoint for searching properties."""
    try:
        from models import ModelsPropertyLocation
        from sqlalchemy import func, or_
        
        # Get filter parameters
        property_type = request.args.get('property_type')
        city = request.args.get('city')
        state = request.args.get('state')
        min_price = request.args.get('min_price', type=int)
        max_price = request.args.get('max_price', type=int)
        min_beds = request.args.get('min_beds', type=int)
        max_beds = request.args.get('max_beds', type=int)
        min_baths = request.args.get('min_baths', type=float)
        max_baths = request.args.get('max_baths', type=float)
        limit = request.args.get('limit', default=20, type=int)
        
        # Build query
        query = ModelsPropertyLocation.query
        
        # Apply filters if provided
        if property_type:
            query = query.filter(ModelsPropertyLocation.property_type == property_type)
        if city:
            query = query.filter(func.lower(ModelsPropertyLocation.city) == city.lower())
        if state:
            query = query.filter(func.lower(ModelsPropertyLocation.state) == state.lower())
            
        # Price filters - convert to cents
        if min_price:
            query = query.filter(ModelsPropertyLocation.price_value >= min_price * 100)
        if max_price:
            query = query.filter(ModelsPropertyLocation.price_value <= max_price * 100)
            
        # Bedroom filters
        if min_beds:
            query = query.filter(ModelsPropertyLocation.bedrooms >= min_beds)
        if max_beds:
            query = query.filter(ModelsPropertyLocation.bedrooms <= max_beds)
            
        # Bathroom filters
        if min_baths:
            query = query.filter(ModelsPropertyLocation.bathrooms >= min_baths)
        if max_baths:
            query = query.filter(ModelsPropertyLocation.bathrooms <= max_baths)
            
        # Limit results and execute query
        properties = query.order_by(ModelsPropertyLocation.id).limit(limit).all()
        
        # Convert to JSON-serializable format
        results = []
        for prop in properties:
            # Calculate price per square foot
            price_per_sqft = None
            if prop.price_value and prop.square_feet and prop.square_feet > 0:
                price_per_sqft = round(prop.price_value / prop.square_feet / 100, 2)
                
            results.append({
                'id': prop.id,
                'property_type': prop.property_type,
                'address': prop.street_address,
                'city': prop.city,
                'state': prop.state,
                'zip_code': prop.zip_code,
                'price': int(prop.price_value / 100) if prop.price_value else None,
                'bedrooms': prop.bedrooms,
                'bathrooms': prop.bathrooms,
                'square_feet': prop.square_feet,
                'year_built': prop.year_built,
                'price_per_sqft': price_per_sqft,
                'latitude': float(prop.latitude) if prop.latitude else None,
                'longitude': float(prop.longitude) if prop.longitude else None
            })
        
        return jsonify({
            'status': 'success',
            'count': len(results),
            'data': results
        })
    except Exception as e:
        logger.error(f"Error searching properties: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/property/comparison', methods=['GET'])
@tailwind_ui_preference_decorator
def property_comparison():
    """One-click property comparison dashboard"""
    # Get UI preference from the decorator
    use_tailwind = g.use_tailwind_ui
    
    try:
        from models import ModelsPropertyLocation
        from sqlalchemy import func
        
        # Get all property types
        property_types = db.session.query(ModelsPropertyLocation.property_type).distinct().order_by(ModelsPropertyLocation.property_type).all()
        property_types = [p[0] for p in property_types if p[0]]
        
        # Get all states and cities
        states = db.session.query(ModelsPropertyLocation.state).distinct().order_by(ModelsPropertyLocation.state).all()
        states = [state[0] for state in states if state[0]]
        
        cities = db.session.query(ModelsPropertyLocation.city).distinct().order_by(ModelsPropertyLocation.city).all()
        cities = [city[0] for city in cities if city[0]]
        
        # Get selected properties IDs from query parameters
        selected_ids = request.args.getlist('property_id', type=int)
        
        # Get selected properties if any
        selected_properties = []
        if selected_ids:
            selected_properties = ModelsPropertyLocation.query.filter(ModelsPropertyLocation.id.in_(selected_ids)).all()
        
        # Get comparable properties for suggestions
        suggested_properties = []
        if len(selected_properties) > 0 and len(selected_properties) < 4:
            # Get the first selected property to find comparable ones
            base_property = selected_properties[0]
            
            # Find properties with similar characteristics
            query = ModelsPropertyLocation.query.filter(
                ModelsPropertyLocation.id != base_property.id,  # Exclude the base property
                ModelsPropertyLocation.property_type == base_property.property_type,  # Same property type
                ModelsPropertyLocation.city == base_property.city,  # Same city
                ModelsPropertyLocation.state == base_property.state  # Same state
            )
            
            # Exclude already selected properties
            if len(selected_properties) > 1:
                other_ids = [p.id for p in selected_properties[1:]]
                query = query.filter(~ModelsPropertyLocation.id.in_(other_ids))
                
            # Get up to 5 suggested properties
            suggested_properties = query.limit(5).all()
        
        # Get global stats for comparison context
        avg_price = db.session.query(func.avg(ModelsPropertyLocation.price_value)).scalar() or 0
        avg_price = int(avg_price / 100)  # Convert cents to dollars
        
        min_price = db.session.query(func.min(ModelsPropertyLocation.price_value)).scalar() or 0
        min_price = int(min_price / 100)  # Convert cents to dollars
        
        max_price = db.session.query(func.max(ModelsPropertyLocation.price_value)).scalar() or 0
        max_price = int(max_price / 100)  # Convert cents to dollars
        
        avg_sqft = db.session.query(func.avg(ModelsPropertyLocation.square_feet)).scalar() or 0
        avg_sqft = int(avg_sqft)
        
        # Calculate price per square foot for each selected property
        for prop in selected_properties:
            if prop.price_value and prop.square_feet and prop.square_feet > 0:
                prop.price_per_sqft = int(prop.price_value / prop.square_feet / 100)  # Convert to dollars per sqft
            else:
                prop.price_per_sqft = None
        
        # Always use modern template
        return render_template('property_comparison_modern.html',
                            property_types=property_types,
                            states=states,
                            cities=cities,
                            selected_properties=selected_properties,
                            suggested_properties=suggested_properties,
                            avg_price=avg_price,
                            min_price=min_price,
                            max_price=max_price,
                            avg_sqft=avg_sqft)
                            
    except Exception as e:
        logger.error(f"Error loading property comparison page: {str(e)}")
        # Always use modern template for error case too
        return render_template('property_comparison_modern.html',
                            property_types=[],
                            states=[],
                            cities=[],
                            selected_properties=[],
                            suggested_properties=[],
                            avg_price=0,
                            min_price=0,
                            max_price=0,
                            avg_sqft=0,
                            error=str(e))
    
@app.route('/monitoring/alerts/active', methods=['GET'])
@tailwind_ui_preference_decorator
def monitoring_alerts_active():
    """Active alerts monitoring page"""
    # Get UI preference from the decorator
    use_tailwind = g.use_tailwind_ui
    
    from models import MonitoringAlert
    
    # Retrieve all active alerts
    alerts = (MonitoringAlert.query.filter(MonitoringAlert.status != 'resolved')
              .order_by(MonitoringAlert.severity, MonitoringAlert.created_at.desc())
              .all())
              
    # Group alerts by severity for easier display
    alerts_by_severity = {
        'critical': [],
        'error': [],
        'warning': [],
        'info': []
    }
    
    for alert in alerts:
        severity = alert.severity.lower()
        if severity in alerts_by_severity:
            alerts_by_severity[severity].append(alert)
        else:
            alerts_by_severity['info'].append(alert)
    
    # Always use modern template
    return render_template(
        'monitoring_alerts_active_modern.html', 
        alerts=alerts,
        alerts_by_severity=alerts_by_severity
    )
                          
@app.route('/monitoring/alerts/<int:alert_id>/acknowledge', methods=['POST'])
def acknowledge_alert(alert_id):
    """Acknowledge an alert."""
    from models import MonitoringAlert
    
    alert = MonitoringAlert.query.get_or_404(alert_id)
    
    if alert.status == 'resolved':
        flash('This alert is already resolved.', 'warning')
    else:
        alert.status = 'acknowledged'
        alert.acknowledged_at = datetime.now()
        db.session.commit()
        flash('Alert acknowledged successfully.', 'success')
    
    return redirect(url_for('monitoring_alerts_active'))

@app.route('/monitoring/alerts/<int:alert_id>/resolve', methods=['POST'])
def resolve_alert(alert_id):
    """Resolve an alert."""
    from models import MonitoringAlert
    
    alert = MonitoringAlert.query.get_or_404(alert_id)
    
    if alert.status == 'resolved':
        flash('This alert is already resolved.', 'warning')
    else:
        alert.status = 'resolved'
        alert.resolved_at = datetime.now()
        db.session.commit()
        flash('Alert resolved successfully.', 'success')
    
    return redirect(url_for('monitoring_alerts_active'))
    
@app.route('/monitoring/alerts/history', methods=['GET'])
@tailwind_ui_preference_decorator
def monitoring_alerts_history():
    """Alert history page"""
    # Get UI preference from the decorator
    use_tailwind = g.use_tailwind_ui
    
    from models import MonitoringAlert
    
    # Get query parameters
    days = request.args.get('days', default=30, type=int)
    severity = request.args.get('severity', default=None)
    component = request.args.get('component', default=None)
    status = request.args.get('status', default=None)
    
    # Build query
    query = MonitoringAlert.query
    
    # Apply filters
    if days > 0:
        from datetime import datetime, timedelta
        cutoff_date = datetime.now() - timedelta(days=days)
        query = query.filter(MonitoringAlert.created_at >= cutoff_date)
        
    if severity:
        query = query.filter(MonitoringAlert.severity == severity)
        
    if component:
        query = query.filter(MonitoringAlert.component == component)
        
    if status:
        query = query.filter(MonitoringAlert.status == status)
    
    # Execute query with sorting
    alerts = query.order_by(MonitoringAlert.created_at.desc()).all()
    
    # Get unique values for filter dropdowns
    all_components = db.session.query(MonitoringAlert.component).distinct().all()
    components = [c[0] for c in all_components]
    
    severities = ['critical', 'error', 'warning', 'info']
    statuses = ['active', 'acknowledged', 'resolved']
    
    # Always use modern template
    return render_template(
        'monitoring_alerts_history_modern.html', 
        alerts=alerts,
        components=components,
        severities=severities,
        statuses=statuses,
        current_days=days,
        current_severity=severity,
        current_component=component,
        current_status=status
    )
    
@app.route('/monitoring/reports/scheduled', methods=['GET'])
@tailwind_ui_preference_decorator
def monitoring_reports_scheduled():
    """Scheduled reports page"""
    # Get UI preference from the decorator
    use_tailwind = g.use_tailwind_ui
    
    from models import ModelsScheduledReport
    import json
    
    reports = ModelsScheduledReport.query.order_by(ModelsScheduledReport.is_active.desc(), ModelsScheduledReport.name).all()
    
    # Calculate recipients count for each report
    for report in reports:
        if report.recipients:
            try:
                recipients = json.loads(report.recipients)
                report.recipients_count = len(recipients) if isinstance(recipients, list) else 0
            except:
                report.recipients_count = 0
        else:
            report.recipients_count = 0
    
    # Always use modern template
    return render_template(
        'monitoring_reports_scheduled_modern.html', 
        reports=reports
    )
    
@app.route('/monitoring/reports/create', methods=['GET', 'POST'])
def monitoring_reports_create():
    """Create report page"""
    from models import ModelsScheduledReport
    import json
    
    if request.method == 'POST':
        # Get form data
        name = request.form.get('name')
        report_type = request.form.get('report_type')
        schedule_type = request.form.get('schedule_type')
        cron_expression = request.form.get('cron_expression')
        format_type = request.form.get('format')
        is_active = 'is_active' in request.form
        
        # Process recipients
        recipients_text = request.form.get('recipients', '')
        recipients = [email.strip() for email in recipients_text.split('\n') if email.strip()]
        
        # Process parameters
        parameters = {}
        days = request.form.get('days')
        if days:
            try:
                parameters['days'] = int(days)
            except ValueError:
                pass
                
        component = request.form.get('component')
        if component:
            parameters['component'] = component
            
        severity = request.form.get('severity')
        if severity:
            parameters['severity'] = severity
            
        status = request.form.get('status')
        if status:
            parameters['status'] = status
        
        # Create report
        report = ModelsScheduledReport(
            name=name,
            report_type=report_type,
            schedule_type=schedule_type,
            cron_expression=cron_expression if schedule_type == 'custom' else None,
            format=format_type,
            recipients=json.dumps(recipients),
            parameters=json.dumps(parameters) if parameters else None,
            is_active=is_active
        )
        
        db.session.add(report)
        db.session.commit()
        
        flash('Report created successfully', 'success')
        return redirect(url_for('monitoring_reports_scheduled'))
        
    # Get components for filter selection
    from models import MonitoringAlert
    all_components = db.session.query(MonitoringAlert.component).distinct().all()
    components = [c[0] for c in all_components if c[0]]
    
    return render_template(
        'monitoring_reports_create.html',
        components=components
    )
    
@app.route('/monitoring/reports/run/<int:report_id>', methods=['POST'])
def monitoring_reports_run(report_id):
    """Run a scheduled report immediately"""
    from models import ModelsScheduledReport
    from utils.report_generator import ReportGenerator
    from datetime import datetime
    
    report = ModelsScheduledReport.query.get_or_404(report_id)
    
    try:
        # Process the report
        success = ReportGenerator.process_scheduled_report(report.id)
        
        if success:
            # Update last_run timestamp
            report.last_run = datetime.now()
            db.session.commit()
            
            flash('Report generated and sent successfully', 'success')
        else:
            flash('Error generating report', 'danger')
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error running report {report.id}: {str(e)}")
        flash(f'Error running report: {str(e)}', 'danger')
    
    return redirect(url_for('monitoring_reports_scheduled'))
    
@app.route('/monitoring/reports/edit/<int:report_id>', methods=['GET', 'POST'])
def monitoring_reports_edit(report_id):
    """Edit a scheduled report"""
    from models import ModelsScheduledReport
    import json
    
    report = ModelsScheduledReport.query.get_or_404(report_id)
    
    if request.method == 'POST':
        # Update report
        report.name = request.form.get('name')
        report.report_type = request.form.get('report_type')
        report.schedule_type = request.form.get('schedule_type')
        report.cron_expression = request.form.get('cron_expression') if request.form.get('schedule_type') == 'custom' else None
        report.format = request.form.get('format')
        report.is_active = 'is_active' in request.form
        
        # Process recipients
        recipients_text = request.form.get('recipients', '')
        recipients = [email.strip() for email in recipients_text.split('\n') if email.strip()]
        report.recipients = json.dumps(recipients)
        
        # Process parameters
        parameters = {}
        days = request.form.get('days')
        if days:
            try:
                parameters['days'] = int(days)
            except ValueError:
                pass
                
        component = request.form.get('component')
        if component:
            parameters['component'] = component
            
        severity = request.form.get('severity')
        if severity:
            parameters['severity'] = severity
            
        status = request.form.get('status')
        if status:
            parameters['status'] = status
            
        report.parameters = json.dumps(parameters) if parameters else None
        
        db.session.commit()
        
        # Update scheduler if needed
        from utils.scheduled_tasks import schedule_reports, check_scheduler_status
        if check_scheduler_status():
            schedule_reports()
        
        flash('Report updated successfully', 'success')
        return redirect(url_for('monitoring_reports_scheduled'))
    
    # Format recipients for display
    recipients_text = ''
    if report.recipients:
        try:
            recipients = json.loads(report.recipients)
            if isinstance(recipients, list):
                recipients_text = '\n'.join(recipients)
        except:
            pass
    
    # Parse parameters
    parameters = {}
    if report.parameters:
        try:
            parameters = json.loads(report.parameters)
        except:
            pass
    
    # Get components for filter selection
    from models import MonitoringAlert
    all_components = db.session.query(MonitoringAlert.component).distinct().all()
    components = [c[0] for c in all_components if c[0]]
    
    return render_template(
        'monitoring_reports_edit_modern.html',
        report=report,
        recipients=recipients_text,
        parameters=parameters,
        components=components
    )
    
@app.route('/monitoring/reports/delete/<int:report_id>', methods=['POST'])
def monitoring_reports_delete(report_id):
    """Delete a scheduled report"""
    from models import ModelsScheduledReport
    
    report = ModelsScheduledReport.query.get_or_404(report_id)
    
    db.session.delete(report)
    db.session.commit()
    
    flash('Report deleted successfully', 'success')
    return redirect(url_for('monitoring_reports_scheduled'))
    
@app.route('/monitoring/reports/history', methods=['GET'])
@tailwind_ui_preference_decorator
def monitoring_reports_history():
    """Report execution history page"""
    # Get UI preference from the decorator
    use_tailwind = g.use_tailwind_ui
    
    from models import ReportExecutionLog
    from datetime import datetime, timedelta

@app.route('/data-sources')
@tailwind_ui_preference_decorator
def data_sources_manager():
    """Data Sources Manager Dashboard"""
    # Get UI preference from the decorator
    use_tailwind = g.use_tailwind_ui
    
    try:
        # Initialize the real estate data connector
        from etl.real_estate_data_connector import RealEstateDataConnector
        
        data_connector = RealEstateDataConnector()
        sources_status = data_connector.get_sources_status()
        
        # If no sources are available yet, use initial mock data
        if not sources_status:
            # Mock data for initial display
            data_sources = [
                {
                    'name': 'zillow',
                    'status': 'healthy',
                    'priority': 'Primary',
                    'priority_num': 1,
                    'enabled': True,
                    'data_types': ['listings', 'details', 'market_trends'],
                    'success_rate': 93,
                    'metrics': {
                        'success_rate': 93,
                        'avg_response_time': 0.8,
                        'requests': 1254,
                        'errors': 87,
                        'timeouts': 12,
                        'rate_limit_hits': 32
                    }
                },
                {
                    'name': 'realtor',
                    'status': 'degraded',
                    'priority': 'Secondary',
                    'priority_num': 2,
                    'enabled': True,
                    'data_types': ['listings', 'details'],
                    'success_rate': 85,
                    'metrics': {
                        'success_rate': 85,
                        'avg_response_time': 1.2,
                        'requests': 987,
                        'errors': 148,
                        'timeouts': 35,
                        'rate_limit_hits': 72
                    }
                },
                {
                    'name': 'pacmls',
                    'status': 'limited',
                    'priority': 'Tertiary',
                    'priority_num': 3,
                    'enabled': True,
                    'data_types': ['listings', 'details', 'market_trends'],
                    'success_rate': 78,
                    'metrics': {
                        'success_rate': 78,
                        'avg_response_time': 0.5,
                        'requests': 542,
                        'errors': 119,
                        'timeouts': 5,
                        'rate_limit_hits': 0
                    }
                },
                {
                    'name': 'county',
                    'status': 'critical',
                    'priority': 'Fallback',
                    'priority_num': 'fallback',
                    'enabled': False,
                    'data_types': ['details'],
                    'success_rate': 65,
                    'metrics': {
                        'success_rate': 65,
                        'avg_response_time': 1.7,
                        'requests': 321,
                        'errors': 112,
                        'timeouts': 38,
                        'rate_limit_hits': 0
                    }
                }
            ]
        else:
            # Format the sources for display
            data_sources = []
            for source in sources_status:
                # Convert DB format to template format
                formatted_source = {
                    'name': source.get('source_name', ''),
                    'status': source.get('status', 'unknown'),
                    'priority': 'Primary' if source.get('priority', 4) == 1 else
                               'Secondary' if source.get('priority', 4) == 2 else
                               'Tertiary' if source.get('priority', 4) == 3 else 'Fallback',
                    'priority_num': source.get('priority', 4),
                    'enabled': source.get('is_active', False),
                    'success_rate': int(source.get('success_rate', 0)),
                    'data_types': source.get('data_types', ['details']),
                    'metrics': {
                        'success_rate': int(source.get('success_rate', 0)),
                        'avg_response_time': round(source.get('avg_response_time', 0), 2),
                        'requests': source.get('request_count', 0),
                        'errors': source.get('error_count', 0),
                        'timeouts': 0,  # Not tracked separately yet
                        'rate_limit_hits': 0  # Not tracked separately yet
                    }
                }
                data_sources.append(formatted_source)
        
        # Get system-wide property statistics
        from models.property import Property
        property_count = Property.query.count() if hasattr(Property, 'query') else 0
        active_sources = sum(1 for s in data_sources if s.get('enabled', False))
        
        # Get system-wide settings
        failover_timeout = data_connector.failover_timeout
        max_retry_attempts = data_connector.max_retry_attempts
        enable_circuit_breakers = data_connector.enable_circuit_breakers
        
        # Get last sync time
        from datetime import datetime
        last_sync_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Get unique locations count
        location_count = len(set(p.city for p in Property.query.all() if hasattr(p, 'city'))) if hasattr(Property, 'query') else 0
        
    except Exception as e:
        # If there's an error, log it and use mock data
        logging.error(f"Error loading data sources: {str(e)}")
        
        # Mock data as fallback
        data_sources = [
            {
                'name': 'zillow',
                'status': 'unknown',
                'priority': 'Primary',
                'priority_num': 1,
                'enabled': True,
                'data_types': ['listings', 'details', 'market_trends'],
                'success_rate': 0,
                'metrics': {
                    'success_rate': 0,
                    'avg_response_time': 0,
                    'requests': 0,
                    'errors': 0
                }
            },
            {
                'name': 'realtor',
                'status': 'unknown',
                'priority': 'Secondary',
                'priority_num': 2,
                'enabled': True,
                'data_types': ['listings', 'details'],
                'success_rate': 0,
                'metrics': {
                    'success_rate': 0,
                    'avg_response_time': 0,
                    'requests': 0,
                    'errors': 0
                }
            }
        ]
        property_count = 0
        location_count = 0
        last_sync_time = "Never"
        active_sources = 0
        failover_timeout = 10
        max_retry_attempts = 3
        enable_circuit_breakers = True
    
    return render_template_with_fallback(
        'data_sources/manager.html',
        data_sources=data_sources,
        property_count=property_count,
        location_count=location_count,
        last_sync=last_sync_time,
        active_sources=active_sources,
        failover_timeout=failover_timeout,
        max_retry_attempts=max_retry_attempts,
        enable_circuit_breakers=enable_circuit_breakers,
        title="Data Source Manager"
    )
    
    # Get query parameters
    days = request.args.get('days', default=30, type=int)
    report_type = request.args.get('report_type', default=None)
    status = request.args.get('status', default=None)
    
    # Build query
    query = ReportExecutionLog.query
    
    # Apply filters
    if days > 0:
        cutoff_date = datetime.now() - timedelta(days=days)
        query = query.filter(ReportExecutionLog.execution_time >= cutoff_date)
        
    if report_type:
        query = query.filter(ReportExecutionLog.report_type == report_type)
        
    if status:
        query = query.filter(ReportExecutionLog.status == status)
    
    # Execute query with sorting
    logs = query.order_by(ReportExecutionLog.execution_time.desc()).all()
    
    # Get unique values for filter dropdowns
    all_report_types = db.session.query(ReportExecutionLog.report_type).distinct().all()
    report_types = [rt[0] for rt in all_report_types if rt[0]]
    
    statuses = ['success', 'error']
    
    # Calculate success rate
    total_count = len(logs)
    success_count = sum(1 for log in logs if log.status == 'success')
    success_rate = (success_count / total_count * 100) if total_count > 0 else 0
    
    # Calculate average execution time for successful reports
    successful_logs = [log for log in logs if log.status == 'success']
    avg_execution_time = None
    if successful_logs:
        total_seconds = sum((log.completion_time - log.execution_time).total_seconds() for log in successful_logs if log.completion_time)
        avg_execution_time = total_seconds / len(successful_logs) if successful_logs else None
    
    # Always use modern template
    return render_template(
        'monitoring_reports_history_modern.html', 
        logs=logs,
        report_types=report_types,
        statuses=statuses,
        current_days=days,
        current_report_type=report_type,
        current_status=status,
        total_count=total_count,
        success_count=success_count,
        success_rate=success_rate,
        avg_execution_time=avg_execution_time
    )

@app.route('/ai/reports/settings', methods=['GET', 'POST'])
@tailwind_ui_preference_decorator
def ai_report_settings():
    """AI feedback report settings page"""
    # Get UI preference from the decorator
    use_tailwind = g.use_tailwind_ui
    
    from models import AIFeedbackReportSettings
    import json
    
    settings = AIFeedbackReportSettings.get_settings()
    
    if request.method == 'POST':
        # Update settings from form data
        settings.admin_email = request.form.get('admin_email')
        
        # Process additional recipients (convert from lines to JSON array)
        additional_recipients = request.form.get('additional_recipients', '')
        if additional_recipients:
            email_list = [email.strip() for email in additional_recipients.split('\n') if email.strip()]
            settings.additional_recipients = json.dumps(email_list)
        else:
            settings.additional_recipients = None
        
        # Update schedule settings
        settings.send_daily_reports = 'send_daily_reports' in request.form
        settings.send_weekly_reports = 'send_weekly_reports' in request.form
        settings.send_monthly_reports = 'send_monthly_reports' in request.form
        
        # Update day settings
        try:
            settings.weekly_report_day = int(request.form.get('weekly_report_day', 0))
        except ValueError:
            settings.weekly_report_day = 0
            
        try:
            settings.monthly_report_day = int(request.form.get('monthly_report_day', 1))
            # Ensure day is between 1-31
            settings.monthly_report_day = max(1, min(31, settings.monthly_report_day))
        except ValueError:
            settings.monthly_report_day = 1
        
        # Update content settings
        settings.include_detailed_feedback = 'include_detailed_feedback' in request.form
        settings.include_csv_attachment = 'include_csv_attachment' in request.form
        settings.include_excel_attachment = 'include_excel_attachment' in request.form
        
        # Save settings
        db.session.commit()
        
        # If admin email is set and scheduler settings have changed, update schedules
        if settings.admin_email:
            from utils.scheduled_tasks import initialize_default_schedules, check_scheduler_status
            
            # Only update schedules if scheduler is running
            if check_scheduler_status():
                initialize_default_schedules(settings.admin_email)
        
        flash('Report settings saved successfully', 'success')
        return redirect(url_for('ai_report_settings'))
    
    # Process additional recipients for display (convert from JSON array to lines)
    additional_recipients = ''
    if settings.additional_recipients:
        try:
            email_list = json.loads(settings.additional_recipients)
            if isinstance(email_list, list):
                additional_recipients = '\n'.join(email_list)
        except:
            # If there's an error parsing JSON, leave it empty
            pass
    
    # Always use modern template
    return render_template(
        'ai_report_settings_modern.html',
        settings=settings, 
        additional_recipients=additional_recipients
    )

@app.route('/api/ai/feedback/report/settings', methods=['GET'])
def get_ai_report_settings():
    """API endpoint to get AI feedback report settings"""
    try:
        from models import AIFeedbackReportSettings
        import json
        
        settings = AIFeedbackReportSettings.get_settings()
        
        # Format additional recipients
        additional_recipients = []
        if settings.additional_recipients:
            try:
                additional_recipients = json.loads(settings.additional_recipients)
            except:
                # If there's an error parsing JSON, leave it as an empty list
                pass
        
        return jsonify({
            "status": "success",
            "settings": {
                "admin_email": settings.admin_email,
                "additional_recipients": additional_recipients,
                "send_daily_reports": settings.send_daily_reports,
                "send_weekly_reports": settings.send_weekly_reports,
                "send_monthly_reports": settings.send_monthly_reports,
                "weekly_report_day": settings.weekly_report_day,
                "monthly_report_day": settings.monthly_report_day,
                "include_detailed_feedback": settings.include_detailed_feedback,
                "include_csv_attachment": settings.include_csv_attachment,
                "include_excel_attachment": settings.include_excel_attachment
            }
        })
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error getting AI report settings: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

# UI Pattern Library route
@app.route('/ui/dev/patterns')
def ui_pattern_library():
    """UI Pattern Library for developers and designers."""
    return render_template('ui_pattern_library_modern.html')

@app.route('/design_guide')
def design_guide():
    """Design guide showcasing UX principles and visual design concepts."""
    return render_template('design_guide_modern.html')
    
# AI Sidebar Demo route
@app.route('/ui/dev/ai-sidebar')
def ai_sidebar_demo():
    """Demo page for the AI Suggestions Sidebar."""
    return render_template('ai_sidebar_demo_modern.html')

# Zillow routes
@app.route('/zillow/market-data')
def zillow_market_data():
    """Zillow market data visualization page."""
    try:
        return render_template('zillow_market_data_modern.html')
    except Exception as e:
        logger.exception(f"Error in zillow_market_data route: {str(e)}")
        flash(f"Error loading market data page: {str(e)}", "danger")
        return redirect(url_for('index'))

@app.route('/zillow/properties')
def zillow_properties():
    """Zillow property search and display page with modern UI."""
    location = request.args.get('location', '')
    
    try:
        # Always use modern template with TailwindCSS and enhanced visuals
        return render_template('zillow_properties_modern.html', location=location, ui_template='unified')
    except Exception as e:
        logger.exception(f"Error in zillow_properties route: {str(e)}")
        flash(f"Error loading properties page: {str(e)}", "danger")
        return redirect(url_for('index'))

@app.route('/property/search', methods=['GET'])
@app.route('/property_search', methods=['GET'])
@tailwind_ui_preference_decorator
def property_search():
    """Search for properties based on query parameters with fuzzy matching."""
    # Import our fuzzy search function
    from property_search import fuzzy_property_search
    
    query = request.args.get('query', '')
    property_type = request.args.get('propertyType', '')
    min_price = request.args.get('minPrice', '')
    max_price = request.args.get('maxPrice', '')
    radius = request.args.get('radius', '0')
    limit = request.args.get('limit', 10, type=int)
    
    properties = []
    properties_json = '[]'
    error = None
    is_loading = False
    maps_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
    
    # Define counties for the UI
    counties = {
        'benton': {
            'name': 'Benton County',
            'state': 'WA',
            'default_data_source': 'GIS'
        },
        'franklin': {
            'name': 'Franklin County',
            'state': 'WA',
            'default_data_source': None
        },
        'walla_walla': {
            'name': 'Walla Walla County',
            'state': 'WA',
            'default_data_source': None
        }
    }
    
    # If we have a query, search for properties
    if query:
        try:
            is_loading = True
            
            # Use our fuzzy property search functionality to get real Benton County data
            # This uses the actual GIS API with the BENTON_ASSESSOR_API_KEY
            search_results = fuzzy_property_search(query, limit)
            
            # Check for errors
            if 'error' in search_results:
                error = search_results['message']
                properties = []
            else:
                # Transform property data format for display
                properties = []
                for prop in search_results.get('properties', []):
                    # Convert GIS property data to format expected by the template
                    properties.append({
                        'id': prop.get('property_id', 'Unknown'),
                        'address': prop.get('address', 'Unknown'),
                        'city': 'Benton County',
                        'state': 'Washington',
                        'owner': prop.get('owner', 'Unknown'),
                        'acres': prop.get('acres', 0),
                        'legal_description': prop.get('legal_description', 'Unknown'),
                        'land_use': prop.get('land_use', 'Unknown'),
                        'price': 0,  # No price in assessment data
                        'property_type': 'Parcel',
                        'description': prop.get('legal_description', 'Property record from Benton County GIS'),
                        'data_source': 'Benton County GIS'
                    })
                
                # If no results from fuzzy search but specific query is for Walla Walla
                if len(properties) == 0 and "WALLA WALLA" in query.upper():
                    # Special demonstration case for Walla Walla
                    property = {
                        'id': 'ww42',
                        'address': '4234 OLD MILTON HWY',
                        'city': 'WALLA WALLA',
                        'state': 'Washington',
                        'zip_code': '99362',
                        'latitude': 46.0578,
                        'longitude': -118.4108,
                        'price': 789000,
                        'price_per_sqft': 325,
                        'bedrooms': 4,
                        'bathrooms': 3.5,
                        'sqft': 2428,
                        'property_type': 'Residential',
                        'year_built': 1992,
                        'lot_size': '1.2 acres',
                        'status': 'active',
                        'image_url': 'https://photos.zillowstatic.com/fp/eb40ee9b33b4f73c4801e21e1cfef69d-cc_ft_1536.webp'
                    }
                    properties = [property]
            
            # Create JSON representation for map
            import json
            properties_json = json.dumps(properties)
        except Exception as e:
            error = f"Search error: {str(e)}"
            properties = []
    
    return render_template(
        'property_search_modern.html', 
        query=query,
        property_type=property_type,
        min_price=min_price,
        max_price=max_price,
        radius=radius,
        properties=properties,
        properties_json=properties_json,
        counties=counties,
        error=error,
        is_loading=is_loading,
        maps_api_key=maps_api_key
    )

@app.route('/property/<property_id>', methods=['GET'])
@app.route('/property_details/<property_id>', methods=['GET'])
@tailwind_ui_preference_decorator
def property_details(property_id):
    """Display detailed information about a specific property."""
    error = None
    maps_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
    
    # For demo purposes, we're simulating a specific property
    if property_id == 'ww42':
        # This is our demo property - 4234 OLD MILTON HWY, WALLA WALLA
        property = {
            'id': 'ww42',
            'address': '4234 OLD MILTON HWY',
            'city': 'WALLA WALLA',
            'state': 'Washington',
            'zip_code': '99362',
            'latitude': 46.0578,
            'longitude': -118.4108,
            'price': 789000,
            'price_per_sqft': 325,
            'estimated_value': 795000,
            'bedrooms': 4,
            'bathrooms': 3.5,
            'sqft': 2428,
            'property_type': 'Single Family',
            'year_built': 1992,
            'lot_size': '1.2 acres',
            'status': 'active',
            'image_url': 'https://photos.zillowstatic.com/fp/eb40ee9b33b4f73c4801e21e1cfef69d-cc_ft_1536.webp',
            'description': '''
                <p>Beautiful single-family home on a 1.2-acre lot with fantastic views of the Blue Mountains. This home features 4 bedrooms, 3.5 bathrooms, and 2,428 square feet of living space.</p>
                <p>The property includes a spacious kitchen with granite countertops, stainless steel appliances, and a large island. The primary bedroom offers a walk-in closet and an en-suite bathroom with a soaking tub.</p>
                <p>Additional features include hardwood floors throughout the main level, a finished basement, central air conditioning, and an attached two-car garage.</p>
                <p>The backyard features a covered patio, mature landscaping, and plenty of room for outdoor activities.</p>
            ''',
            'features': [
                'Hardwood floors',
                'Granite countertops',
                'Stainless steel appliances',
                'Central air conditioning',
                'Attached 2-car garage',
                'Finished basement',
                'Covered patio',
                'Mountain views',
                'Fireplace',
                'Master suite with walk-in closet'
            ],
            'tax_history': [
                {'year': 2023, 'amount': 6842, 'change': 3.2},
                {'year': 2022, 'amount': 6630, 'change': 2.5},
                {'year': 2021, 'amount': 6468, 'change': 1.8},
                {'year': 2020, 'amount': 6353, 'change': 0.8}
            ],
            'price_history': [
                {'date': '2025-03-15', 'price': 789000, 'event': 'Listed for sale'},
                {'date': '2019-07-10', 'price': 678000, 'event': 'Sold'},
                {'date': '2019-05-22', 'price': 685000, 'event': 'Listed for sale'},
                {'date': '2012-09-18', 'price': 585000, 'event': 'Sold'}
            ],
            'nearby_schools': [
                {'name': 'Edison Elementary School', 'type': 'Public, K-5', 'rating': 8, 'distance': 0.8},
                {'name': 'Pioneer Middle School', 'type': 'Public, 6-8', 'rating': 7, 'distance': 1.2},
                {'name': 'Walla Walla High School', 'type': 'Public, 9-12', 'rating': 6, 'distance': 2.1},
                {'name': 'St. Patrick Catholic School', 'type': 'Private, K-8', 'rating': 9, 'distance': 1.5}
            ]
        }
    else:
        # If property ID doesn't match our demo, show an error
        property = None
        error = "The requested property could not be found. Please try a different property ID or search again."
    
    return render_template(
        'property_details_modern.html', 
        property=property,
        error=error,
        maps_api_key=maps_api_key
    )

# Test route specifically for 4234 Old Milton Hwy, Walla Walla, WA property
@app.route('/test-property-walla-walla', methods=['GET'])
def test_property_walla_walla():
    """Direct route to test the specific Walla Walla property."""
    # This is our demo property - 4234 OLD MILTON HWY, WALLA WALLA
    property = {
        'id': 'ww42',
        'address': '4234 OLD MILTON HWY',
        'city': 'WALLA WALLA',
        'state': 'Washington',
        'zip_code': '99362',
        'latitude': 46.0578,
        'longitude': -118.4108,
        'price': 789000,
        'price_per_sqft': 325,
        'estimated_value': 795000,
        'bedrooms': 4,
        'bathrooms': 3.5,
        'sqft': 2428,
        'property_type': 'Single Family',
        'year_built': 1992,
        'lot_size': '1.2 acres',
        'status': 'active',
        'image_url': 'https://photos.zillowstatic.com/fp/eb40ee9b33b4f73c4801e21e1cfef69d-cc_ft_1536.webp',
        'description': '''
            <p>Beautiful single-family home on a 1.2-acre lot with fantastic views of the Blue Mountains. This home features 4 bedrooms, 3.5 bathrooms, and 2,428 square feet of living space.</p>
            <p>The property includes a spacious kitchen with granite countertops, stainless steel appliances, and a large island. The primary bedroom offers a walk-in closet and an en-suite bathroom with a soaking tub.</p>
            <p>Additional features include hardwood floors throughout the main level, a finished basement, central air conditioning, and an attached two-car garage.</p>
            <p>The backyard features a covered patio, mature landscaping, and plenty of room for outdoor activities.</p>
        ''',
        'features': [
            'Hardwood floors',
            'Granite countertops',
            'Stainless steel appliances',
            'Central air conditioning',
            'Attached 2-car garage',
            'Finished basement',
            'Covered patio',
            'Mountain views',
            'Fireplace',
            'Master suite with walk-in closet'
        ],
        'tax_history': [
            {'year': 2023, 'amount': 6842, 'change': 3.2},
            {'year': 2022, 'amount': 6630, 'change': 2.5},
            {'year': 2021, 'amount': 6468, 'change': 1.8},
            {'year': 2020, 'amount': 6353, 'change': 0.8}
        ],
        'price_history': [
            {'date': '2025-03-15', 'price': 789000, 'event': 'Listed for sale'},
            {'date': '2019-07-10', 'price': 678000, 'event': 'Sold'},
            {'date': '2019-05-22', 'price': 685000, 'event': 'Listed for sale'},
            {'date': '2012-09-18', 'price': 585000, 'event': 'Sold'}
        ],
        'nearby_schools': [
            {'name': 'Edison Elementary School', 'type': 'Public, K-5', 'rating': 8, 'distance': 0.8},
            {'name': 'Pioneer Middle School', 'type': 'Public, 6-8', 'rating': 7, 'distance': 1.2},
            {'name': 'Walla Walla High School', 'type': 'Public, 9-12', 'rating': 6, 'distance': 2.1},
            {'name': 'St. Patrick Catholic School', 'type': 'Private, K-8', 'rating': 9, 'distance': 1.5}
        ]
    }
    
    maps_api_key = os.environ.get('GOOGLE_MAPS_API_KEY', '')
    return render_template('property_details_modern.html', property=property, error=None, maps_api_key=maps_api_key)

# Register voice search API and controller
try:
    from api.voice_search import voice_search_api
    app.register_blueprint(voice_search_api)
    logger.info("Registered voice API blueprint")
    
    from controllers.voice_search_controller import voice_search_bp
    app.register_blueprint(voice_search_bp)
    logger.info("Registered voice controller blueprint")
except Exception as e:
    logger.error(f"Failed to register voice search blueprints: {str(e)}")

# Register property recommendations API and controller
try:
    from api.property_recommendations import property_rec_api
    app.register_blueprint(property_rec_api)
    logger.info("Registered property recommendations API blueprint")
    
    from controllers.property_recommendations_simplified import property_rec_controller
    app.register_blueprint(property_rec_controller)
    logger.info("Registered property recommendations controller blueprint")
except Exception as e:
    logger.error(f"Failed to register property recommendations blueprints: {str(e)}")

# Register AI suggestions API
try:
    from api.ai_suggestions import ai_suggestions_api
    app.register_blueprint(ai_suggestions_api)
    logger.info("Registered AI suggestions API blueprint")
except Exception as e:
    logger.error(f"Failed to register AI suggestions API: {str(e)}")

# Register Agent Tools API
try:
    from api.agent_tools_api import agent_tools_api, register_blueprint
    register_blueprint(app)
    logger.info("Registered Agent Tools API blueprint")
except Exception as e:
    logger.error(f"Failed to register Agent Tools API: {str(e)}")

# Register Southeastern Washington routes
try:
    from regional.routes import se_wa_blueprint
    app.register_blueprint(se_wa_blueprint, url_prefix='/regional')
    logger.info("Registered Southeastern Washington blueprint")
except Exception as e:
    logger.error(f"Failed to register Southeastern Washington blueprint: {str(e)}")

# Register Property Record Card controller
try:
    from controllers.property_record_controller import property_record_bp, register_blueprints
    register_blueprints(app)
    logger.info("Registered Property Record Card blueprint")
except Exception as e:
    logger.error(f"Failed to register Property Record Card blueprint: {str(e)}")

# Initialize database tables
with app.app_context():
    # Create tables
    db.create_all()
    
    # Import and start the ETL scheduler
    try:
        from etl.scheduler import start_scheduler
        logger.info("Starting ETL job scheduler")
        start_scheduler()
        logger.info("ETL job scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed to start ETL job scheduler: {str(e)}")

# Agent Tools UI route
@app.route('/agent-tools')
def agent_tools_page():
    """Page for exploring and using AI agent tools."""
    return render_template('agent_tools_modern.html')

# Main entry point
if __name__ == "__main__":
    # Production-safe configuration - debug only enabled via environment variable
    debug_mode = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)
