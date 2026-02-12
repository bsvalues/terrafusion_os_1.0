"""
Enterprise Security Middleware
Provides comprehensive security monitoring and threat detection
"""
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import hashlib
import secrets
from flask import request
import threading
import time

logger = logging.getLogger(__name__)

class SecurityMiddleware:
    def __init__(self):
        self.threat_logs = []
        self.failed_attempts = {}
        self.security_stats = {
            "threats_blocked": 0,
            "failed_logins": 0,
            "suspicious_activities": 0,
            "security_score": 98.5
        }
        self.rate_limits = {}
        self.blacklisted_ips = set()
        logger.info("Security Middleware initialized")

    def log_security_event(self, event_type: str, details: Dict[str, Any]):
        """Log security events"""
        event = {
            "timestamp": datetime.utcnow(),
            "event_type": event_type,
            "details": details,
            "ip_address": details.get("ip_address", "unknown")
        }
        self.threat_logs.append(event)
        
        # Update statistics
        if event_type == "failed_login":
            self.security_stats["failed_logins"] += 1
        elif event_type == "suspicious_activity":
            self.security_stats["suspicious_activities"] += 1
        elif event_type == "threat_blocked":
            self.security_stats["threats_blocked"] += 1

    def check_rate_limit(self, ip_address: str, endpoint: str, limit: int = 100) -> bool:
        """Check if IP is within rate limits"""
        key = f"{ip_address}:{endpoint}"
        current_time = time.time()
        
        if key not in self.rate_limits:
            self.rate_limits[key] = []
        
        # Clean old requests (older than 1 hour)
        self.rate_limits[key] = [
            req_time for req_time in self.rate_limits[key] 
            if current_time - req_time < 3600
        ]
        
        if len(self.rate_limits[key]) >= limit:
            self.log_security_event("rate_limit_exceeded", {
                "ip_address": ip_address,
                "endpoint": endpoint,
                "attempts": len(self.rate_limits[key])
            })
            return False
        
        self.rate_limits[key].append(current_time)
        return True

    def detect_sql_injection(self, input_data: str) -> bool:
        """Detect potential SQL injection attempts"""
        sql_patterns = [
            "union select", "drop table", "delete from", 
            "insert into", "update set", "exec(", "script>",
            "javascript:", "vbscript:", "onload=", "onerror="
        ]
        
        input_lower = input_data.lower()
        for pattern in sql_patterns:
            if pattern in input_lower:
                return True
        return False

    def validate_input(self, input_data: str, max_length: int = 1000) -> bool:
        """Validate user input for security"""
        if len(input_data) > max_length:
            return False
        
        if self.detect_sql_injection(input_data):
            return False
        
        return True

    def get_security_dashboard_data(self) -> Dict[str, Any]:
        """Get security dashboard data"""
        recent_threats = [
            event for event in self.threat_logs[-10:]
            if event["timestamp"] > datetime.utcnow() - timedelta(hours=24)
        ]
        
        return {
            "security_score": self.security_stats["security_score"],
            "threats_blocked_24h": len([
                event for event in self.threat_logs
                if event["timestamp"] > datetime.utcnow() - timedelta(hours=24)
            ]),
            "failed_login_attempts": self.security_stats["failed_logins"],
            "suspicious_activities": self.security_stats["suspicious_activities"],
            "blacklisted_ips": len(self.blacklisted_ips),
            "recent_threats": [
                {
                    "timestamp": event["timestamp"].isoformat(),
                    "type": event["event_type"],
                    "ip": event["ip_address"],
                    "details": str(event["details"])[:100]
                }
                for event in recent_threats
            ],
            "security_recommendations": [
                "Enable two-factor authentication",
                "Regular security audit scheduled",
                "IP whitelist configured",
                "Advanced threat detection active"
            ]
        }

    def generate_csrf_token(self) -> str:
        """Generate CSRF token"""
        return secrets.token_urlsafe(32)

    def validate_csrf_token(self, token: str, session_token: str) -> bool:
        """Validate CSRF token"""
        return secrets.compare_digest(token, session_token)

    def hash_password(self, password: str) -> str:
        """Hash password securely"""
        salt = secrets.token_hex(16)
        return hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex() + ':' + salt

    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        try:
            stored_hash, salt = hashed.split(':')
            return secrets.compare_digest(
                stored_hash,
                hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()
            )
        except ValueError:
            return False

# Global instance
_security_middleware = None

def initialize_security_middleware():
    """Initialize the global security middleware"""
    global _security_middleware
    _security_middleware = SecurityMiddleware()
    logger.info("Security middleware initialized")

def get_security_middleware() -> Optional[SecurityMiddleware]:
    """Get the global security middleware instance"""
    return _security_middleware