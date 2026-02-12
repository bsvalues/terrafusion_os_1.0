from flask import Flask, send_from_directory, jsonify, request
import os
import sys
import threading
import webbrowser
import time
from launcher import launch_app, get_app_status, stop_app

app = Flask(__name__)

# Serve static files (HTML, CSS, JS)
@app.route('/')
def index():
    return send_from_directory(os.getcwd(), 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(os.getcwd(), filename)

# API to launch an application
@app.route('/api/launch/<app_name>')
def api_launch(app_name):
    result = launch_app(app_name)
    return jsonify(result)

# API to get application status
@app.route('/api/status/<app_name>')
def api_status(app_name):
    status = get_app_status(app_name)
    return jsonify(status)

# API to stop an application (optional, for future UI feature)
@app.route('/api/stop/<app_name>')
def api_stop(app_name):
    result = stop_app(app_name)
    return jsonify(result)

def open_browser():
    # Give the server a moment to start up
    time.sleep(1)
    webbrowser.open_new("http://127.0.0.1:5000/") # Flask default port

if __name__ == '__main__':
    # Determine if running as a PyInstaller bundle
    if getattr(sys, '_MEIPASS', False):
        # Running as a bundled executable, change working directory to temp dir where files are extracted
        os.chdir(sys._MEIPASS)

    # Open browser in a separate thread to not block Flask server
    threading.Thread(target=open_browser).start()
    
    # Run the Flask app
    app.run(host='127.0.0.1', port=5000) 