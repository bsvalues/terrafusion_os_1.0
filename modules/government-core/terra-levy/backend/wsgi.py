"""
WSGI module for the Levy Calculation Application.

This module is used by the WSGI server (e.g., Gunicorn) to run the application.
"""
from app2 import app

# Configure all route modules
from routes2 import home_bp
from routes_data_management import data_management_bp
from routes_historical_analysis import historical_analysis_bp
from routes_forecasting import forecasting_bp
from routes_glossary import glossary_bp
from routes_public import public_bp
from routes_reports import reports_bp

# Register all blueprints
app.register_blueprint(home_bp)
app.register_blueprint(data_management_bp)
app.register_blueprint(historical_analysis_bp)
app.register_blueprint(forecasting_bp)
app.register_blueprint(glossary_bp)
app.register_blueprint(public_bp)
app.register_blueprint(reports_bp)

# WSGI app
application = app

# For local testing
if __name__ == "__main__":
    application.run(host="0.0.0.0", port=5000, debug=True)