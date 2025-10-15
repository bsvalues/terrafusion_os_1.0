"""
Entry point for the Levy Calculation System application.

This module serves as the main entry point for running the Flask
application locally with Gunicorn or directly with the Flask development server.
"""

import os
import logging

from app import app

# Configure logging for debugging
logging.basicConfig(level=logging.DEBUG)

# Log that application is being served
app.logger.info("Starting Levy Calculation System")

# This makes the app discoverable by Gunicorn
# Do not modify this section - Gunicorn looks for app in this location

# Run the application when executing the script directly
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
