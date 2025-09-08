#!/usr/bin/env python3
"""
Dashboard configuration settings
"""

import os
from datetime import timedelta

class Config:
    """Dashboard configuration"""
    
    # Flask settings
    SECRET_KEY = os.environ.get('DASHBOARD_SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.environ.get('DASHBOARD_DEBUG', 'False').lower() == 'true'
    
    # API settings
    API_HOST = '0.0.0.0'
    API_PORT = 9999
    API_PREFIX = '/api'
    
    # Database connection
    DATABASE_URL = os.environ.get(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/terrafusion_prod'
    )
    
    # Redis connection
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    
    # Service endpoints
    SERVICES = {
        'terrafusion-sync': {
            'name': 'TerraFusion Sync',
            'port': 5002,
            'health_endpoint': '/health',
            'metrics_endpoint': '/metrics'
        },
        'propertyworkbench': {
            'name': 'PropertyWorkbench',
            'port': 5003,
            'health_endpoint': '/api/health',
            'metrics_endpoint': '/api/metrics'
        },
        'costforgeai': {
            'name': 'CostForgeAI',
            'port': 8000,
            'health_endpoint': '/health',
            'metrics_endpoint': '/metrics'
        },
        'terralevy': {
            'name': 'TerraLevy',
            'port': 5006,
            'health_endpoint': '/health',
            'metrics_endpoint': '/metrics'
        },
        'terraagent': {
            'name': 'TerraAgent',
            'port': 5009,
            'health_endpoint': '/health',
            'metrics_endpoint': '/metrics'
        },
        'terraflow': {
            'name': 'TerraFlow',
            'port': 8001,
            'health_endpoint': '/health',
            'metrics_endpoint': '/metrics'
        },
        'terraminer': {
            'name': 'TerraMiner',
            'port': 8002,
            'health_endpoint': '/health',
            'metrics_endpoint': '/metrics'
        },
        'webaudittracker': {
            'name': 'WebAuditTracker',
            'port': 8003,
            'health_endpoint': '/health',
            'metrics_endpoint': '/metrics'
        }
    }
    
    # Monitoring settings
    METRICS_COLLECTION_INTERVAL = 30  # seconds
    METRICS_RETENTION_HOURS = 24
    MAX_METRICS_POINTS = 1000
    
    # Alert thresholds
    ALERT_THRESHOLDS = {
        'cpu_percent': 80,
        'memory_percent': 85,
        'disk_percent': 90,
        'response_time_ms': 1000,
        'error_rate_percent': 5
    }
    
    # Security settings
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=12)
    
    # CORS settings
    CORS_ORIGINS = os.environ.get(
        'CORS_ORIGINS',
        'http://localhost:3000,http://localhost:5173'
    ).split(',')
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = '/var/log/terrafusion/dashboard.log'
    
    # Cache settings
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = REDIS_URL
    CACHE_DEFAULT_TIMEOUT = 300
    
    @classmethod
    def init_app(cls, app):
        """Initialize application with config"""
        # Set all config values
        for key in dir(cls):
            if key.isupper():
                app.config[key] = getattr(cls, key)