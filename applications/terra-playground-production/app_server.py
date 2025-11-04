#!/usr/bin/env python3
"""
TerraFusion Playground Backend Server
Enterprise-grade launcher backend for the complete TerraFusion ecosystem
"""

import os
import sys
import subprocess
import json
import time
import threading
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Application configurations - EXPANDED ECOSYSTEM
TERRAFUSION_APPS = {
    'TerraAgent': {
        'port': 5003,
        'script': 'app.py',
        'directory': '../TerraAgent_PRODUCTION',
        'name': 'TerraAgent AI Assistant'
    },
    'TerraFlow': {
        'port': 5001,
        'script': 'app.py',
        'directory': '../TerraFlow_PRODUCTION',
        'name': 'TerraFlow Workflow Engine'
    },
    'TerraSync': {
        'port': 5002,
        'script': 'app.py',
        'directory': '../TerraFusionSync_PRODUCTION',
        'name': 'TerraSync Data Hub'
    },
    'TerraFusion': {
        'port': 5000,
        'script': 'terrafusion_build_ENTERPRISE_COMPLETE.py',
        'directory': '../',
        'name': 'TerraFusion Build Platform'
    },
    'TerraMiner': {
        'port': 5006,
        'script': 'app.py',
        'directory': '../TerraMiner_PRODUCTION',
        'name': 'TerraMiner Analytics'
    },
    'TerraLevy': {
        'port': 5007,
        'script': 'app.py',
        'directory': '../TerraFusionLevy_PRODUCTION',
        'name': 'TerraLevy Tax Management'
    },
    # NEW ENTERPRISE APPLICATIONS
    'BCBSWebhub': {
        'port': 5008,
        'script': 'npm run dev',
        'directory': '../BCBSWebhub_PRODUCTION',
        'name': 'BCBS Web Hub Platform'
    },
    'TerraFusionPrimeView': {
        'port': 5009,
        'script': 'npm run dev',
        'directory': '../TerraFusionPrimeView_PRODUCTION',
        'name': 'TerraFusion Prime View'
    },
    'TerraFusionV0Demo': {
        'port': 5010,
        'script': 'npm run dev',
        'directory': '../TerraFusionV0Demo_PRODUCTION',
        'name': 'TerraFusion Quantum Demo'
    },
    'TerraFusionProf': {
        'port': 5011,
        'script': 'npm run dev',
        'directory': '../TerraFusionProf_PRODUCTION',
        'name': 'TerraFusion Professional'
    },
    'MCPServers': {
        'port': 5012,
        'script': 'python src/servers.py',
        'directory': '../MCP_Servers_PRODUCTION',
        'name': 'MCP Protocol Servers'
    },
    'SystemPromptsAI': {
        'port': 5013,
        'script': 'python main.py',
        'directory': '../SystemPrompts_AI_Tools_PRODUCTION',
        'name': 'AI System Prompts & Models'
    }
}

# Track running processes
running_processes = {}

def is_port_in_use(port):
    """Check if a port is currently in use"""
    import socket
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            return False
        except OSError:
            return True

def launch_application(app_name, app_config):
    """Launch a TerraFusion application"""
    try:
        script_path = os.path.join(app_config['directory'], app_config['script'])
        
        # Check if script exists
        if not os.path.exists(script_path):
            return {
                'success': False,
                'message': f"Script not found: {script_path}",
                'port': app_config['port']
            }
        
        # Check if port is already in use
        if is_port_in_use(app_config['port']):
            return {
                'success': True,
                'message': f"{app_name} already running",
                'port': app_config['port']
            }
        
        # Launch the application
        cmd = [sys.executable, app_config['script']]
        cwd = app_config['directory']
        
        process = subprocess.Popen(
            cmd,
            cwd=cwd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Store the process
        running_processes[app_name] = {
            'process': process,
            'port': app_config['port'],
            'started_at': time.time()
        }
        
        return {
            'success': True,
            'message': f"{app_name} starting",
            'port': app_config['port'],
            'pid': process.pid
        }
        
    except Exception as e:
        return {
            'success': False,
            'message': f"Failed to launch {app_name}: {str(e)}",
            'port': app_config.get('port', 0)
        }

@app.route('/')
def home():
    """Serve the enhanced playground interface with Monaco editor"""
    try:
        # Try to serve the enhanced version first
        if os.path.exists('index_enhanced.html'):
            return send_from_directory('.', 'index_enhanced.html')
        else:
            # Fallback to original
            return send_from_directory('.', 'index.html')
    except Exception as e:
        logger.error(f"Error serving homepage: {e}")
        return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files"""
    return send_from_directory('.', filename)

@app.route('/api/launch', methods=['POST'])
def api_launch():
    """Launch a TerraFusion application"""
    try:
        data = request.get_json()
        app_name = data.get('app')
        
        if app_name not in TERRAFUSION_APPS:
            return jsonify({
                'success': False,
                'message': f"Unknown application: {app_name}"
            }), 400
        
        result = launch_application(app_name, TERRAFUSION_APPS[app_name])
        
        if result['success']:
            return jsonify(result)
        else:
            return jsonify(result), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"Launch error: {str(e)}"
        }), 500

@app.route('/api/status/<app_name>')
def api_status(app_name):
    """Get the status of a specific application"""
    try:
        if app_name not in TERRAFUSION_APPS:
            return jsonify({
                'success': False,
                'message': f"Unknown application: {app_name}"
            }), 400
        
        app_config = TERRAFUSION_APPS[app_name]
        port = app_config['port']
        
        # Check if port is in use
        if is_port_in_use(port):
            status = 'running'
        else:
            status = 'not_running'
        
        # Check process status if we have it
        process_info = running_processes.get(app_name)
        if process_info:
            process = process_info['process']
            if process.poll() is None:
                status = 'running'
            else:
                status = 'exited'
                exit_code = process.returncode
        
        return jsonify({
            'success': True,
            'app': app_name,
            'status': status,
            'port': port,
            'process_info': {
                'running': app_name in running_processes,
                'pid': process_info.get('process').pid if process_info else None
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f"Status check error: {str(e)}"
        }), 500

@app.route('/api/health')
def api_health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'TerraFusion Playground',
        'version': '1.0.0',
        'apps_configured': len(TERRAFUSION_APPS),
        'apps_running': len([app for app in TERRAFUSION_APPS.keys() 
                           if is_port_in_use(TERRAFUSION_APPS[app]['port'])])
    })

@app.route('/api/apps')
def api_apps():
    """List all configured applications"""
    return jsonify({
        'success': True,
        'apps': TERRAFUSION_APPS
    })

@app.route('/api/launch-all', methods=['POST'])
def api_launch_all():
    """Launch all TerraFusion applications"""
    results = {}
    
    for app_name, app_config in TERRAFUSION_APPS.items():
        # Add a small delay between launches
        time.sleep(1)
        results[app_name] = launch_application(app_name, app_config)
    
    return jsonify({
        'success': True,
        'message': 'Launch all initiated',
        'results': results
    })

if __name__ == '__main__':
    print("🚀 TerraFusion Playground Backend Server")
    print("=" * 50)
    print(f"Configured Applications: {len(TERRAFUSION_APPS)}")
    for app_name, config in TERRAFUSION_APPS.items():
        print(f"  • {app_name}: Port {config['port']}")
    print("=" * 50)
    
    # Start the Flask server
    app.run(
        host='localhost',
        port=3000,
        debug=True,
        use_reloader=False  # Avoid issues with subprocess management
    ) 