#!/bin/bash
echo "Starting Zillow web application..."
gunicorn --bind 0.0.0.0:5001 --reuse-port --reload zillow_app:app