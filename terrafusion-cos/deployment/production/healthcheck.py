#!/bin/bash
# TerraFusion cOS Production Health Check
# Validates system health for container orchestration

import sys
import requests
import json
from datetime import datetime

def health_check():
    """Comprehensive health check for TerraFusion cOS"""
    try:
        # Check main API health
        response = requests.get('http://localhost:8090/health', timeout=5)
        if response.status_code != 200:
            print(f"Health check failed: HTTP {response.status_code}")
            sys.exit(1)
            
        health_data = response.json()
        
        # Check critical services
        required_services = [
            'security_mesh',
            'terrafusion_sync', 
            'terra_flow',
            'ai_swarm'
        ]
        
        for service in required_services:
            if service not in health_data.get('services', {}):
                print(f"Missing critical service: {service}")
                sys.exit(1)
                
            service_status = health_data['services'][service].get('status')
            if service_status not in ['active', 'secured']:
                print(f"Service {service} unhealthy: {service_status}")
                sys.exit(1)
        
        # Check database connectivity
        if health_data.get('database_status') != 'connected':
            print("Database connectivity check failed")
            sys.exit(1)
            
        # Check memory usage
        memory_usage = health_data.get('memory_usage_percent', 0)
        if memory_usage > 90:
            print(f"High memory usage: {memory_usage}%")
            sys.exit(1)
            
        print(f"Health check passed at {datetime.now().isoformat()}")
        sys.exit(0)
        
    except requests.exceptions.RequestException as e:
        print(f"Health check request failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Health check error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    health_check()