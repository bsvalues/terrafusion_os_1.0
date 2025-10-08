#!/usr/bin/env python3
"""
JWKS Mock Server for Local Testing
===================================
Purpose: Serve JWKS endpoint locally for RS256 migration testing
Usage: python3 jwks-mock-server.py [--port 8080] [--jwks-file auth/jwks/jwks.json]
Endpoint: http://localhost:8080/.well-known/jwks.json
"""

import http.server
import socketserver
import json
import argparse
import os
from datetime import datetime

class JWKSHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler for JWKS endpoint"""
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/.well-known/jwks.json':
            self.serve_jwks()
        elif self.path == '/health':
            self.serve_health()
        else:
            self.send_error(404, "Not Found")
    
    def serve_jwks(self):
        """Serve JWKS file with caching headers"""
        try:
            with open(self.server.jwks_file, 'r') as f:
                jwks_data = json.load(f)
            
            # Remove _metadata from public response (internal use only)
            if '_metadata' in jwks_data:
                del jwks_data['_metadata']
            
            # Send response with caching headers
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Cache-Control', 'public, max-age=3600')  # 1 hour cache
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            # Write JSON response
            self.wfile.write(json.dumps(jwks_data, indent=2).encode('utf-8'))
            
            # Log request
            print(f"[{datetime.utcnow().isoformat()}] JWKS served: {len(jwks_data.get('keys', []))} keys")
            
        except FileNotFoundError:
            self.send_error(500, f"JWKS file not found: {self.server.jwks_file}")
        except json.JSONDecodeError:
            self.send_error(500, "Invalid JWKS file format")
        except Exception as e:
            self.send_error(500, f"Internal server error: {str(e)}")
    
    def serve_health(self):
        """Health check endpoint"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        health_data = {
            'status': 'healthy',
            'service': 'jwks-mock-server',
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'jwks_file': self.server.jwks_file,
            'jwks_exists': os.path.exists(self.server.jwks_file)
        }
        
        self.wfile.write(json.dumps(health_data, indent=2).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Custom log format"""
        print(f"[{datetime.utcnow().isoformat()}] {format % args}")

def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='JWKS Mock Server for Local Testing')
    parser.add_argument('--port', type=int, default=8080, help='Port to listen on (default: 8080)')
    parser.add_argument('--jwks-file', default='auth/jwks/jwks.json', help='Path to JWKS file')
    args = parser.parse_args()
    
    # Verify JWKS file exists
    if not os.path.exists(args.jwks_file):
        print(f"ERROR: JWKS file not found: {args.jwks_file}")
        print(f"Current directory: {os.getcwd()}")
        print("Expected file structure:")
        print("  auth/")
        print("    jwks/")
        print("      jwks.json")
        return 1
    
    # Create server
    with socketserver.TCPServer(("", args.port), JWKSHandler) as httpd:
        httpd.jwks_file = args.jwks_file
        
        print("=" * 60)
        print("JWKS Mock Server")
        print("=" * 60)
        print(f"Port:          {args.port}")
        print(f"JWKS File:     {args.jwks_file}")
        print(f"JWKS Endpoint: http://localhost:{args.port}/.well-known/jwks.json")
        print(f"Health Check:  http://localhost:{args.port}/health")
        print("=" * 60)
        print(f"Started at {datetime.utcnow().isoformat()}Z")
        print("Press Ctrl+C to stop")
        print()
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()
            print("Server stopped.")
            return 0

if __name__ == '__main__':
    exit(main())
