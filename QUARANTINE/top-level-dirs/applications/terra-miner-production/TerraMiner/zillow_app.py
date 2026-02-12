"""
A simpler Flask application to test the Zillow components.
"""
import os
import logging
from flask import Flask, render_template, redirect, url_for, jsonify, request

# Configure logger
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create a Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Configure database
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///zillow.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize database
from app import db
db.init_app(app)

# Register Zillow API blueprint
try:
    from api.zillow_routes import zillow_api
    app.register_blueprint(zillow_api)
    logger.info("Registered Zillow API blueprint")
except ImportError as e:
    logger.warning(f"Could not import Zillow API blueprint: {e}")

# Routes for Zillow
@app.route('/')
def index():
    """Redirect to the Zillow market data visualization page."""
    return redirect(url_for('zillow_market_data'))

@app.route('/zillow/market-data')
def zillow_market_data():
    """Zillow market data visualization page."""
    try:
        return render_template('zillow_market_data.html')
    except Exception as e:
        logger.exception(f"Error in zillow_market_data route: {str(e)}")
        return f"Error loading market data page: {str(e)}"

@app.route('/zillow/properties')
def zillow_properties():
    """Zillow property search and display page."""
    location = request.args.get('location', '')
    
    try:
        return render_template('zillow_properties.html', location=location)
    except Exception as e:
        logger.exception(f"Error in zillow_properties route: {str(e)}")
        return f"Error loading properties page: {str(e)}"

# Create database tables
with app.app_context():
    # Import models
    import models.zillow_data
    
    # Create tables
    db.create_all()

# Main entry point
if __name__ == "__main__":
    # Production-safe configuration - debug only enabled via environment variable
    debug_mode = os.environ.get("FLASK_DEBUG", "False").lower() == "true"
    app.run(host='0.0.0.0', port=5000, debug=debug_mode)