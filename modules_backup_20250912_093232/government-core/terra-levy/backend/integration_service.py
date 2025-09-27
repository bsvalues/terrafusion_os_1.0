"""
Integration service for connecting Flask backend with Tauri frontend.

This module provides a bridge between the BCBSLevyMaster Flask application
and the TerraLevy Tauri frontend, ensuring seamless communication and
data exchange while preserving TerraFusion OS module compatibility.
"""

import os
import logging
import subprocess
import threading
import time
import requests
from typing import Dict, Any, Optional
from flask import Flask, jsonify, request
from flask_cors import CORS

logger = logging.getLogger(__name__)

class TerraLevyIntegrationService:
    """Service to manage Flask backend and Tauri frontend integration."""
    
    def __init__(self, backend_port: int = 5001):
        self.backend_port = backend_port
        self.backend_process = None
        self.backend_url = f"http://localhost:{backend_port}"
        self.is_running = False
        
    def start_flask_backend(self) -> bool:
        """Start the Flask backend service."""
        try:
            # Check if backend is already running
            if self.is_backend_healthy():
                logger.info("Flask backend is already running")
                return True
                
            logger.info("Starting Flask backend service...")
            
            # Start Flask app in subprocess
            env = os.environ.copy()
            env['PORT'] = str(self.backend_port)
            
            self.backend_process = subprocess.Popen(
                ['python', 'main.py'],
                cwd=os.path.dirname(__file__),
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            # Wait for backend to start
            for i in range(30):  # Wait up to 30 seconds
                if self.is_backend_healthy():
                    self.is_running = True
                    logger.info(f"Flask backend started successfully on port {self.backend_port}")
                    return True
                time.sleep(1)
            
            logger.error("Failed to start Flask backend within timeout")
            return False
            
        except Exception as e:
            logger.error(f"Error starting Flask backend: {str(e)}")
            return False
    
    def stop_flask_backend(self) -> bool:
        """Stop the Flask backend service."""
        try:
            if self.backend_process:
                self.backend_process.terminate()
                self.backend_process.wait(timeout=10)
                self.backend_process = None
                self.is_running = False
                logger.info("Flask backend stopped successfully")
                return True
        except Exception as e:
            logger.error(f"Error stopping Flask backend: {str(e)}")
        return False
    
    def is_backend_healthy(self) -> bool:
        """Check if the Flask backend is healthy."""
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def proxy_request(self, endpoint: str, method: str = 'GET', **kwargs) -> Dict[str, Any]:
        """Proxy requests to the Flask backend."""
        try:
            url = f"{self.backend_url}{endpoint}"
            
            if method.upper() == 'GET':
                response = requests.get(url, **kwargs)
            elif method.upper() == 'POST':
                response = requests.post(url, **kwargs)
            elif method.upper() == 'PUT':
                response = requests.put(url, **kwargs)
            elif method.upper() == 'DELETE':
                response = requests.delete(url, **kwargs)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return {
                'status_code': response.status_code,
                'data': response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text,
                'headers': dict(response.headers)
            }
            
        except Exception as e:
            logger.error(f"Error proxying request to {endpoint}: {str(e)}")
            return {
                'status_code': 500,
                'data': {'error': str(e)},
                'headers': {}
            }

# Global integration service instance
integration_service = TerraLevyIntegrationService()

def create_integration_app() -> Flask:
    """Create Flask app for Tauri integration."""
    app = Flask(__name__)
    CORS(app)  # Enable CORS for Tauri frontend
    
    @app.route('/start-backend', methods=['POST'])
    def start_backend():
        """Start the Flask backend service."""
        success = integration_service.start_flask_backend()
        return jsonify({
            'success': success,
            'message': 'Backend started successfully' if success else 'Failed to start backend'
        })
    
    @app.route('/stop-backend', methods=['POST'])
    def stop_backend():
        """Stop the Flask backend service."""
        success = integration_service.stop_flask_backend()
        return jsonify({
            'success': success,
            'message': 'Backend stopped successfully' if success else 'Failed to stop backend'
        })
    
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check for integration service."""
        backend_healthy = integration_service.is_backend_healthy()
        return jsonify({
            'integration_service': 'healthy',
            'backend_service': 'healthy' if backend_healthy else 'unhealthy',
            'backend_url': integration_service.backend_url
        })
    
    @app.route('/api/<path:endpoint>', methods=['GET', 'POST', 'PUT', 'DELETE'])
    def proxy_api(endpoint):
        """Proxy API requests to Flask backend."""
        result = integration_service.proxy_request(
            f"/api/{endpoint}",
            method=request.method,
            params=request.args.to_dict(),
            json=request.get_json() if request.is_json else None,
            headers=dict(request.headers)
        )
        
        return jsonify(result['data']), result['status_code']
    
    return app

def init_integration_service():
    """Initialize the integration service."""
    logger.info("Initializing TerraLevy Integration Service")
    
    # Start Flask backend automatically
    success = integration_service.start_flask_backend()
    if success:
        logger.info("Integration service initialized successfully")
    else:
        logger.warning("Integration service started but backend failed to initialize")

if __name__ == '__main__':
    # Run integration service standalone for testing
    init_integration_service()
    app = create_integration_app()
    app.run(host='0.0.0.0', port=\${{TF_API_5002_PORT:-5002}}, debug=True)