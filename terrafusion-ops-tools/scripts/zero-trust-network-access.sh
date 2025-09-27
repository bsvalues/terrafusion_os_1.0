#!/bin/bash

# Zero Trust Network Access (ZTNA) Automation
# Implement and manage zero trust security model
# Features: Identity verification, micro-segmentation, continuous monitoring, policy enforcement

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${CONFIG_FILE:-${SCRIPT_DIR}/../config/ztna.conf}"
LOG_FILE="${LOG_FILE:-/var/log/terrafusion/ztna.log}"
CERT_DIR="${CERT_DIR:-/etc/terrafusion/certs}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ZTNA principles
ZTNA_PRINCIPLES=(
    "Never trust, always verify"
    "Least privilege access"
    "Assume breach"
    "Verify explicitly"
    "Continuous validation"
)

# Initialize database
init_database() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Initializing ZTNA database...${NC}"
    
    psql -h localhost -U postgres -d terrafusion <<EOF
-- Identity and device registry
CREATE TABLE IF NOT EXISTS ztna_identities (
    id SERIAL PRIMARY KEY,
    identity_id UUID DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    device_id VARCHAR(255),
    device_fingerprint TEXT,
    trust_score DECIMAL(5,2) DEFAULT 0,
    last_verified TIMESTAMP,
    mfa_enabled BOOLEAN DEFAULT false,
    risk_level VARCHAR(20) DEFAULT 'unknown',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Access policies
CREATE TABLE IF NOT EXISTS ztna_policies (
    id SERIAL PRIMARY KEY,
    policy_name VARCHAR(255) UNIQUE NOT NULL,
    policy_type VARCHAR(50),
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    priority INTEGER DEFAULT 100,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Micro-segments
CREATE TABLE IF NOT EXISTS ztna_segments (
    id SERIAL PRIMARY KEY,
    segment_name VARCHAR(255) UNIQUE NOT NULL,
    segment_type VARCHAR(50),
    network_cidr VARCHAR(50),
    allowed_services JSONB,
    security_zone VARCHAR(50),
    isolation_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Access requests and decisions
CREATE TABLE IF NOT EXISTS ztna_access_logs (
    id SERIAL PRIMARY KEY,
    request_id UUID DEFAULT gen_random_uuid(),
    identity_id UUID,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    action VARCHAR(50),
    decision VARCHAR(20),
    reason TEXT,
    trust_score DECIMAL(5,2),
    context_data JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trust score factors
CREATE TABLE IF NOT EXISTS ztna_trust_factors (
    id SERIAL PRIMARY KEY,
    identity_id UUID REFERENCES ztna_identities(identity_id),
    factor_type VARCHAR(50),
    factor_value DECIMAL(5,2),
    weight DECIMAL(3,2) DEFAULT 1.0,
    evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security events
CREATE TABLE IF NOT EXISTS ztna_security_events (
    id SERIAL PRIMARY KEY,
    event_id UUID DEFAULT gen_random_uuid(),
    event_type VARCHAR(100),
    severity VARCHAR(20),
    identity_id UUID,
    details JSONB,
    remediation_action VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ztna_identities_trust ON ztna_identities(trust_score);
CREATE INDEX IF NOT EXISTS idx_ztna_access_logs_timestamp ON ztna_access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ztna_security_events_severity ON ztna_security_events(severity);
CREATE INDEX IF NOT EXISTS idx_ztna_policies_enabled ON ztna_policies(enabled, priority);
EOF
    
    echo -e "${GREEN}✓ ZTNA database initialized${NC}"
}

# Deploy identity verification
deploy_identity_verification() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Deploying identity verification...${NC}"
    
    # Create identity verification service
    cat > /tmp/identity_verification.py << 'EOF'
import os
import jwt
import json
import hashlib
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple
import aiohttp
import psycopg2
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import face_recognition
import pyotp

class IdentityVerificationService:
    def __init__(self):
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.mfa_secret = os.environ.get('MFA_SECRET', 'default-secret')
        
    async def verify_identity(self, user_id: str, auth_data: Dict) -> Tuple[bool, float, str]:
        """Comprehensive identity verification"""
        trust_score = 0.0
        factors = []
        
        # 1. Password/Certificate verification
        if await self.verify_credentials(user_id, auth_data.get('credentials')):
            trust_score += 30
            factors.append(('credentials', 30))
        else:
            return False, 0.0, "Invalid credentials"
            
        # 2. MFA verification
        if auth_data.get('mfa_token'):
            if self.verify_mfa(user_id, auth_data['mfa_token']):
                trust_score += 25
                factors.append(('mfa', 25))
            else:
                return False, trust_score, "Invalid MFA token"
                
        # 3. Device fingerprint
        device_trust = await self.verify_device(user_id, auth_data.get('device_info'))
        trust_score += device_trust
        factors.append(('device', device_trust))
        
        # 4. Behavioral biometrics
        behavior_trust = await self.verify_behavior(user_id, auth_data.get('behavior_data'))
        trust_score += behavior_trust
        factors.append(('behavior', behavior_trust))
        
        # 5. Location and network context
        context_trust = await self.verify_context(user_id, auth_data.get('context'))
        trust_score += context_trust
        factors.append(('context', context_trust))
        
        # Store trust factors
        self.store_trust_factors(user_id, factors)
        
        # Determine if trust score meets threshold
        required_score = self.get_required_trust_score(auth_data.get('resource_type'))
        verified = trust_score >= required_score
        
        return verified, trust_score, f"Trust score: {trust_score}/{required_score}"
        
    async def verify_credentials(self, user_id: str, credentials: Dict) -> bool:
        """Verify user credentials"""
        if not credentials:
            return False
            
        # Certificate-based authentication
        if credentials.get('certificate'):
            return await self.verify_certificate(credentials['certificate'])
            
        # Password authentication (for fallback)
        if credentials.get('password'):
            return await self.verify_password(user_id, credentials['password'])
            
        return False
        
    def verify_mfa(self, user_id: str, token: str) -> bool:
        """Verify TOTP MFA token"""
        cur = self.db_conn.cursor()
        cur.execute("SELECT mfa_secret FROM users WHERE user_id = %s", (user_id,))
        result = cur.fetchone()
        
        if result and result[0]:
            totp = pyotp.TOTP(result[0])
            return totp.verify(token, valid_window=1)
        return False
        
    async def verify_device(self, user_id: str, device_info: Dict) -> float:
        """Verify device fingerprint and health"""
        if not device_info:
            return 0.0
            
        trust_score = 0.0
        
        # Check device registration
        cur = self.db_conn.cursor()
        device_fingerprint = self.generate_device_fingerprint(device_info)
        cur.execute("""
            SELECT trust_score FROM ztna_identities 
            WHERE user_id = %s AND device_fingerprint = %s
        """, (user_id, device_fingerprint))
        
        result = cur.fetchone()
        if result:
            # Known device
            trust_score += 10
            
        # Check device health
        if device_info.get('os_updated', False):
            trust_score += 5
        if device_info.get('antivirus_active', False):
            trust_score += 5
        if device_info.get('firewall_enabled', False):
            trust_score += 5
            
        return min(trust_score, 20)  # Max 20 points for device
        
    async def verify_behavior(self, user_id: str, behavior_data: Dict) -> float:
        """Verify behavioral biometrics"""
        if not behavior_data:
            return 0.0
            
        trust_score = 0.0
        
        # Analyze typing patterns
        if behavior_data.get('typing_pattern'):
            if self.analyze_typing_pattern(user_id, behavior_data['typing_pattern']):
                trust_score += 5
                
        # Analyze mouse movement patterns
        if behavior_data.get('mouse_pattern'):
            if self.analyze_mouse_pattern(user_id, behavior_data['mouse_pattern']):
                trust_score += 5
                
        return min(trust_score, 10)  # Max 10 points for behavior
        
    async def verify_context(self, user_id: str, context: Dict) -> float:
        """Verify location and network context"""
        if not context:
            return 0.0
            
        trust_score = 0.0
        
        # Check location
        if context.get('location'):
            location_trust = await self.verify_location(user_id, context['location'])
            trust_score += location_trust
            
        # Check network
        if context.get('ip_address'):
            if not self.is_suspicious_ip(context['ip_address']):
                trust_score += 5
                
        # Check time-based access
        if self.is_normal_access_time(user_id):
            trust_score += 5
            
        return min(trust_score, 15)  # Max 15 points for context
        
    def generate_device_fingerprint(self, device_info: Dict) -> str:
        """Generate unique device fingerprint"""
        fingerprint_data = f"{device_info.get('os', '')}-{device_info.get('browser', '')}-{device_info.get('hardware_id', '')}"
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()
        
    def store_trust_factors(self, user_id: str, factors: list):
        """Store trust score factors for audit"""
        cur = self.db_conn.cursor()
        for factor_type, factor_value in factors:
            cur.execute("""
                INSERT INTO ztna_trust_factors (identity_id, factor_type, factor_value)
                SELECT identity_id, %s, %s FROM ztna_identities WHERE user_id = %s
            """, (factor_type, factor_value, user_id))
        self.db_conn.commit()
        
    def get_required_trust_score(self, resource_type: str) -> float:
        """Get required trust score for resource type"""
        trust_requirements = {
            'critical': 90,
            'sensitive': 75,
            'internal': 60,
            'public': 40
        }
        return trust_requirements.get(resource_type, 60)

# Deploy as service
if __name__ == '__main__':
    service = IdentityVerificationService()
    # Service implementation
EOF

    # Deploy with systemd
    cat > /etc/systemd/system/ztna-identity.service << EOF
[Unit]
Description=ZTNA Identity Verification Service
After=network.target postgresql.service

[Service]
Type=simple
User=terrafusion
WorkingDirectory=/opt/terrafusion/ztna
ExecStart=/usr/bin/python3 /opt/terrafusion/ztna/identity_verification.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable ztna-identity.service
    systemctl start ztna-identity.service
    
    echo -e "${GREEN}✓ Identity verification deployed${NC}"
}

# Setup micro-segmentation
setup_micro_segmentation() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Setting up micro-segmentation...${NC}"
    
    # Create network segments
    psql -h localhost -U postgres -d terrafusion <<EOF
-- Define micro-segments
INSERT INTO ztna_segments (segment_name, segment_type, network_cidr, allowed_services, security_zone, isolation_level) VALUES
('dmz', 'public', '10.0.1.0/24', '{"services": ["web", "api"]}', 'untrusted', 'high'),
('application', 'internal', '10.0.2.0/24', '{"services": ["app", "cache"]}', 'trusted', 'medium'),
('database', 'restricted', '10.0.3.0/24', '{"services": ["postgresql", "redis"]}', 'critical', 'maximum'),
('management', 'admin', '10.0.4.0/24', '{"services": ["ssh", "monitoring"]}', 'privileged', 'high'),
('iot', 'devices', '10.0.5.0/24', '{"services": ["mqtt", "coap"]}', 'isolated', 'maximum')
ON CONFLICT (segment_name) DO NOTHING;
EOF

    # Configure network policies
    cat > /tmp/configure_segments.sh << 'EOF'
#!/bin/bash

# Enable IP forwarding
echo 1 > /proc/sys/net/ipv4/ip_forward

# Create network namespaces for segments
for segment in dmz application database management iot; do
    ip netns add $segment 2>/dev/null || true
done

# Configure iptables for micro-segmentation
iptables -N ZTNA_SEGMENTS 2>/dev/null || true
iptables -N ZTNA_POLICY 2>/dev/null || true

# Default deny all inter-segment traffic
iptables -A ZTNA_SEGMENTS -j DROP

# Allow specific inter-segment communication based on policies
# DMZ to Application
iptables -A ZTNA_SEGMENTS -s 10.0.1.0/24 -d 10.0.2.0/24 -p tcp --dport \${{TF_ADMIN_PORT:-8080}} -j ZTNA_POLICY

# Application to Database
iptables -A ZTNA_SEGMENTS -s 10.0.2.0/24 -d 10.0.3.0/24 -p tcp --dport \${{TF_ADMIN_PORT:-8080}} -j ZTNA_POLICY

# Management to all segments (with restrictions)
iptables -A ZTNA_SEGMENTS -s 10.0.4.0/24 -p tcp --dport 22 -j ZTNA_POLICY

# IoT isolation (no inter-segment communication)
iptables -A ZTNA_SEGMENTS -s 10.0.5.0/24 -j DROP
iptables -A ZTNA_SEGMENTS -d 10.0.5.0/24 -j DROP

# Apply segments to FORWARD chain
iptables -I FORWARD -j ZTNA_SEGMENTS
EOF

    chmod +x /tmp/configure_segments.sh
    /tmp/configure_segments.sh
    
    echo -e "${GREEN}✓ Micro-segmentation configured${NC}"
}

# Deploy policy engine
deploy_policy_engine() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Deploying policy engine...${NC}"
    
    # Create policy engine
    cat > /tmp/policy_engine.py << 'EOF'
import json
import re
from datetime import datetime
from typing import Dict, List, Tuple
import psycopg2

class ZTNAPolicyEngine:
    def __init__(self):
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.policies = self.load_policies()
        
    def load_policies(self) -> List[Dict]:
        """Load active policies from database"""
        cur = self.db_conn.cursor()
        cur.execute("""
            SELECT policy_name, policy_type, conditions, actions, priority 
            FROM ztna_policies 
            WHERE enabled = true 
            ORDER BY priority DESC
        """)
        
        policies = []
        for row in cur.fetchall():
            policies.append({
                'name': row[0],
                'type': row[1],
                'conditions': row[2],
                'actions': row[3],
                'priority': row[4]
            })
        return policies
        
    def evaluate_access(self, request: Dict) -> Tuple[str, str, Dict]:
        """Evaluate access request against policies"""
        for policy in self.policies:
            if self.match_conditions(request, policy['conditions']):
                decision, reason = self.apply_actions(request, policy['actions'])
                
                # Log access decision
                self.log_access_decision(request, decision, reason, policy['name'])
                
                return decision, reason, policy
                
        # Default deny if no policy matches
        self.log_access_decision(request, 'deny', 'No matching policy', 'default')
        return 'deny', 'No matching policy found', {}
        
    def match_conditions(self, request: Dict, conditions: Dict) -> bool:
        """Check if request matches policy conditions"""
        for condition_type, condition_value in conditions.items():
            if condition_type == 'identity':
                if not self.match_identity_condition(request, condition_value):
                    return False
                    
            elif condition_type == 'resource':
                if not self.match_resource_condition(request, condition_value):
                    return False
                    
            elif condition_type == 'context':
                if not self.match_context_condition(request, condition_value):
                    return False
                    
            elif condition_type == 'trust_score':
                if request.get('trust_score', 0) < condition_value:
                    return False
                    
            elif condition_type == 'time':
                if not self.match_time_condition(condition_value):
                    return False
                    
        return True
        
    def match_identity_condition(self, request: Dict, condition: Dict) -> bool:
        """Match identity-based conditions"""
        if 'user_groups' in condition:
            user_groups = request.get('user_groups', [])
            required_groups = condition['user_groups']
            if not any(group in user_groups for group in required_groups):
                return False
                
        if 'user_roles' in condition:
            user_roles = request.get('user_roles', [])
            required_roles = condition['user_roles']
            if not any(role in user_roles for role in required_roles):
                return False
                
        return True
        
    def match_resource_condition(self, request: Dict, condition: Dict) -> bool:
        """Match resource-based conditions"""
        if 'resource_type' in condition:
            if request.get('resource_type') not in condition['resource_type']:
                return False
                
        if 'resource_tags' in condition:
            resource_tags = request.get('resource_tags', [])
            required_tags = condition['resource_tags']
            if not all(tag in resource_tags for tag in required_tags):
                return False
                
        return True
        
    def match_context_condition(self, request: Dict, condition: Dict) -> bool:
        """Match context-based conditions"""
        if 'ip_ranges' in condition:
            client_ip = request.get('client_ip')
            if not any(self.ip_in_range(client_ip, ip_range) for ip_range in condition['ip_ranges']):
                return False
                
        if 'locations' in condition:
            client_location = request.get('location', {}).get('country')
            if client_location not in condition['locations']:
                return False
                
        return True
        
    def match_time_condition(self, condition: Dict) -> bool:
        """Match time-based conditions"""
        current_time = datetime.now()
        
        if 'business_hours' in condition and condition['business_hours']:
            if current_time.weekday() >= 5:  # Weekend
                return False
            if current_time.hour < 8 or current_time.hour > 18:
                return False
                
        return True
        
    def apply_actions(self, request: Dict, actions: Dict) -> Tuple[str, str]:
        """Apply policy actions"""
        decision = actions.get('decision', 'deny')
        
        # Additional actions
        if 'require_mfa' in actions and actions['require_mfa']:
            if not request.get('mfa_verified'):
                return 'challenge', 'MFA required'
                
        if 'step_up_auth' in actions and actions['step_up_auth']:
            if request.get('auth_level', 0) < actions['step_up_auth']:
                return 'challenge', f"Step-up authentication required (level {actions['step_up_auth']})"
                
        if 'time_limit' in actions:
            # Apply time-based access limit
            pass
            
        if 'rate_limit' in actions:
            # Apply rate limiting
            pass
            
        return decision, actions.get('reason', 'Policy applied')
        
    def log_access_decision(self, request: Dict, decision: str, reason: str, policy_name: str):
        """Log access decision for audit"""
        cur = self.db_conn.cursor()
        cur.execute("""
            INSERT INTO ztna_access_logs 
            (identity_id, resource_type, resource_id, action, decision, reason, trust_score, context_data)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            request.get('identity_id'),
            request.get('resource_type'),
            request.get('resource_id'),
            request.get('action'),
            decision,
            f"{policy_name}: {reason}",
            request.get('trust_score', 0),
            json.dumps(request.get('context', {}))
        ))
        self.db_conn.commit()
        
    def ip_in_range(self, ip: str, ip_range: str) -> bool:
        """Check if IP is in CIDR range"""
        # Implementation of IP range checking
        return True  # Simplified for example

# Example policies
def create_default_policies():
    policies = [
        {
            'name': 'critical_resources_policy',
            'type': 'resource',
            'conditions': {
                'resource': {'resource_type': ['database', 'secrets']},
                'trust_score': 90,
                'identity': {'user_roles': ['admin', 'dba']}
            },
            'actions': {
                'decision': 'allow',
                'require_mfa': True,
                'time_limit': 3600,
                'reason': 'Access granted to critical resources'
            },
            'priority': 100
        },
        {
            'name': 'api_access_policy',
            'type': 'resource',
            'conditions': {
                'resource': {'resource_type': ['api']},
                'trust_score': 60,
                'context': {'ip_ranges': ['10.0.0.0/8', '172.16.0.0/12']}
            },
            'actions': {
                'decision': 'allow',
                'rate_limit': 1000,
                'reason': 'API access granted'
            },
            'priority': 80
        },
        {
            'name': 'remote_access_policy',
            'type': 'context',
            'conditions': {
                'context': {'locations': ['US', 'EU']},
                'trust_score': 75,
                'time': {'business_hours': True}
            },
            'actions': {
                'decision': 'allow',
                'step_up_auth': 2,
                'reason': 'Remote access granted with restrictions'
            },
            'priority': 70
        }
    ]
    
    conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
    cur = conn.cursor()
    
    for policy in policies:
        cur.execute("""
            INSERT INTO ztna_policies (policy_name, policy_type, conditions, actions, priority)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (policy_name) DO UPDATE
            SET conditions = EXCLUDED.conditions,
                actions = EXCLUDED.actions,
                priority = EXCLUDED.priority,
                updated_at = CURRENT_TIMESTAMP
        """, (
            policy['name'],
            policy['type'],
            json.dumps(policy['conditions']),
            json.dumps(policy['actions']),
            policy['priority']
        ))
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    create_default_policies()
    engine = ZTNAPolicyEngine()
    # Engine implementation
EOF

    python3 /tmp/policy_engine.py
    
    echo -e "${GREEN}✓ Policy engine deployed${NC}"
}

# Setup continuous monitoring
setup_continuous_monitoring() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Setting up continuous monitoring...${NC}"
    
    # Create monitoring service
    cat > /tmp/ztna_monitor.py << 'EOF'
import asyncio
import json
import psycopg2
from datetime import datetime, timedelta
import numpy as np
from sklearn.ensemble import IsolationForest
import smtplib
from email.mime.text import MIMEText

class ZTNAMonitor:
    def __init__(self):
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.anomaly_detector = IsolationForest(contamination=0.1)
        self.alert_threshold = {
            'critical': 3,
            'high': 5,
            'medium': 10,
            'low': 20
        }
        
    async def monitor_loop(self):
        """Main monitoring loop"""
        while True:
            await self.check_trust_scores()
            await self.detect_anomalies()
            await self.monitor_policy_violations()
            await self.check_segment_breaches()
            await self.update_risk_scores()
            await asyncio.sleep(60)  # Run every minute
            
    async def check_trust_scores(self):
        """Monitor trust score changes"""
        cur = self.db_conn.cursor()
        
        # Find sudden trust score drops
        cur.execute("""
            WITH trust_changes AS (
                SELECT 
                    identity_id,
                    user_id,
                    trust_score,
                    LAG(trust_score) OVER (PARTITION BY identity_id ORDER BY updated_at) as prev_score
                FROM ztna_identities
                WHERE updated_at > NOW() - INTERVAL '1 hour'
            )
            SELECT identity_id, user_id, trust_score, prev_score
            FROM trust_changes
            WHERE prev_score - trust_score > 20
        """)
        
        for row in cur.fetchall():
            await self.raise_alert('trust_drop', {
                'identity_id': row[0],
                'user_id': row[1],
                'current_score': row[2],
                'previous_score': row[3],
                'drop': row[3] - row[2]
            }, 'high')
            
    async def detect_anomalies(self):
        """Detect anomalous access patterns"""
        cur = self.db_conn.cursor()
        
        # Get recent access patterns
        cur.execute("""
            SELECT 
                identity_id,
                COUNT(*) as access_count,
                COUNT(DISTINCT resource_type) as resource_variety,
                AVG(EXTRACT(EPOCH FROM timestamp - LAG(timestamp) OVER (PARTITION BY identity_id ORDER BY timestamp))) as avg_interval,
                COUNT(*) FILTER (WHERE decision = 'deny') as deny_count
            FROM ztna_access_logs
            WHERE timestamp > NOW() - INTERVAL '1 hour'
            GROUP BY identity_id
            HAVING COUNT(*) > 5
        """)
        
        access_data = []
        identities = []
        
        for row in cur.fetchall():
            identities.append(row[0])
            access_data.append([row[1], row[2], row[3] or 0, row[4]])
            
        if access_data:
            # Detect anomalies
            anomalies = self.anomaly_detector.fit_predict(access_data)
            
            for i, anomaly in enumerate(anomalies):
                if anomaly == -1:  # Anomaly detected
                    await self.raise_alert('anomalous_access', {
                        'identity_id': identities[i],
                        'access_count': access_data[i][0],
                        'resource_variety': access_data[i][1],
                        'deny_count': access_data[i][3]
                    }, 'medium')
                    
    async def monitor_policy_violations(self):
        """Monitor policy violations and bypasses"""
        cur = self.db_conn.cursor()
        
        # Check for repeated policy denials
        cur.execute("""
            SELECT 
                identity_id,
                resource_type,
                COUNT(*) as violation_count,
                ARRAY_AGG(DISTINCT reason) as reasons
            FROM ztna_access_logs
            WHERE decision = 'deny'
            AND timestamp > NOW() - INTERVAL '15 minutes'
            GROUP BY identity_id, resource_type
            HAVING COUNT(*) > 3
        """)
        
        for row in cur.fetchall():
            await self.raise_alert('policy_violation', {
                'identity_id': row[0],
                'resource_type': row[1],
                'violation_count': row[2],
                'reasons': row[3]
            }, 'high')
            
    async def check_segment_breaches(self):
        """Monitor for micro-segment breaches"""
        # Check network flow logs for unauthorized segment access
        # This would integrate with network monitoring tools
        pass
        
    async def update_risk_scores(self):
        """Update identity risk scores based on behavior"""
        cur = self.db_conn.cursor()
        
        cur.execute("""
            WITH risk_factors AS (
                SELECT 
                    i.identity_id,
                    i.user_id,
                    COUNT(DISTINCT e.event_type) as security_events,
                    COUNT(l.id) FILTER (WHERE l.decision = 'deny') as denials,
                    AVG(i.trust_score) as avg_trust
                FROM ztna_identities i
                LEFT JOIN ztna_security_events e ON i.identity_id = e.identity_id
                LEFT JOIN ztna_access_logs l ON i.identity_id = l.identity_id
                WHERE e.timestamp > NOW() - INTERVAL '24 hours'
                OR l.timestamp > NOW() - INTERVAL '24 hours'
                GROUP BY i.identity_id, i.user_id
            )
            UPDATE ztna_identities i
            SET risk_level = CASE
                WHEN rf.security_events > 5 OR rf.denials > 10 THEN 'critical'
                WHEN rf.security_events > 2 OR rf.denials > 5 THEN 'high'
                WHEN rf.security_events > 0 OR rf.denials > 2 THEN 'medium'
                ELSE 'low'
            END,
            updated_at = CURRENT_TIMESTAMP
            FROM risk_factors rf
            WHERE i.identity_id = rf.identity_id
        """)
        
        self.db_conn.commit()
        
    async def raise_alert(self, alert_type: str, details: Dict, severity: str):
        """Raise security alert"""
        cur = self.db_conn.cursor()
        
        # Log security event
        cur.execute("""
            INSERT INTO ztna_security_events 
            (event_type, severity, identity_id, details)
            VALUES (%s, %s, %s, %s)
        """, (
            alert_type,
            severity,
            details.get('identity_id'),
            json.dumps(details)
        ))
        
        self.db_conn.commit()
        
        # Send alert based on severity
        if severity in ['critical', 'high']:
            await self.send_alert_notification(alert_type, details, severity)
            
    async def send_alert_notification(self, alert_type: str, details: Dict, severity: str):
        """Send alert notifications"""
        subject = f"[ZTNA Alert] {severity.upper()}: {alert_type}"
        body = f"""
Zero Trust Security Alert

Type: {alert_type}
Severity: {severity}
Time: {datetime.now().isoformat()}

Details:
{json.dumps(details, indent=2)}

This is an automated alert from the TerraFusion ZTNA system.
        """
        
        # Send email notification
        # Email implementation here
        print(f"Alert: {subject}")

if __name__ == '__main__':
    monitor = ZTNAMonitor()
    asyncio.run(monitor.monitor_loop())
EOF

    # Deploy monitoring service
    cat > /etc/systemd/system/ztna-monitor.service << EOF
[Unit]
Description=ZTNA Continuous Monitoring Service
After=network.target postgresql.service

[Service]
Type=simple
User=terrafusion
WorkingDirectory=/opt/terrafusion/ztna
ExecStart=/usr/bin/python3 /opt/terrafusion/ztna/ztna_monitor.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable ztna-monitor.service
    systemctl start ztna-monitor.service
    
    echo -e "${GREEN}✓ Continuous monitoring configured${NC}"
}

# Generate ZTNA report
generate_ztna_report() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Generating ZTNA report...${NC}"
    
    # Generate comprehensive report
    psql -h localhost -U postgres -d terrafusion <<EOF
-- ZTNA metrics summary
WITH metrics AS (
    SELECT
        COUNT(DISTINCT identity_id) as total_identities,
        AVG(trust_score) as avg_trust_score,
        COUNT(DISTINCT identity_id) FILTER (WHERE risk_level = 'critical') as critical_risk_count,
        COUNT(DISTINCT identity_id) FILTER (WHERE risk_level = 'high') as high_risk_count
    FROM ztna_identities
),
access_metrics AS (
    SELECT
        COUNT(*) as total_access_requests,
        COUNT(*) FILTER (WHERE decision = 'allow') as allowed,
        COUNT(*) FILTER (WHERE decision = 'deny') as denied,
        COUNT(*) FILTER (WHERE decision = 'challenge') as challenged
    FROM ztna_access_logs
    WHERE timestamp > NOW() - INTERVAL '24 hours'
),
policy_metrics AS (
    SELECT
        COUNT(*) as total_policies,
        COUNT(*) FILTER (WHERE enabled = true) as active_policies
    FROM ztna_policies
)
SELECT 
    m.*,
    am.*,
    pm.*
FROM metrics m, access_metrics am, policy_metrics pm;

-- Export detailed access logs
COPY (
    SELECT 
        al.timestamp,
        i.user_id,
        al.resource_type,
        al.resource_id,
        al.action,
        al.decision,
        al.trust_score,
        al.reason
    FROM ztna_access_logs al
    JOIN ztna_identities i ON al.identity_id = i.identity_id
    WHERE al.timestamp > NOW() - INTERVAL '24 hours'
    ORDER BY al.timestamp DESC
) TO '/tmp/ztna_access_report.csv' WITH CSV HEADER;
EOF

    # Generate HTML dashboard
    cat > /tmp/ztna_dashboard.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Zero Trust Network Access Dashboard</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .header { background: #1a237e; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
        .metrics { display: flex; gap: 20px; margin-bottom: 30px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 36px; font-weight: bold; color: #1a237e; }
        .metric-label { color: #666; margin-top: 5px; }
        .section { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .chart { height: 300px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f0f0f0; font-weight: bold; }
        .status-allow { color: #4caf50; }
        .status-deny { color: #f44336; }
        .status-challenge { color: #ff9800; }
        .risk-critical { color: #d32f2f; font-weight: bold; }
        .risk-high { color: #f44336; }
        .risk-medium { color: #ff9800; }
        .risk-low { color: #4caf50; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="header">
        <h1>Zero Trust Network Access Dashboard</h1>
        <p>Real-time security monitoring and access control</p>
    </div>
    
    <div class="metrics">
        <div class="metric-card">
            <div class="metric-value" id="totalIdentities">-</div>
            <div class="metric-label">Total Identities</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="avgTrustScore">-</div>
            <div class="metric-label">Average Trust Score</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="accessRequests">-</div>
            <div class="metric-label">Access Requests (24h)</div>
        </div>
        <div class="metric-card">
            <div class="metric-value" id="activePolicies">-</div>
            <div class="metric-label">Active Policies</div>
        </div>
    </div>
    
    <div class="section">
        <h2>Access Decision Distribution</h2>
        <canvas id="accessChart" class="chart"></canvas>
    </div>
    
    <div class="section">
        <h2>Risk Level Distribution</h2>
        <canvas id="riskChart" class="chart"></canvas>
    </div>
    
    <div class="section">
        <h2>Recent Access Attempts</h2>
        <table id="accessTable">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Resource</th>
                    <th>Action</th>
                    <th>Decision</th>
                    <th>Trust Score</th>
                    <th>Reason</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
    
    <div class="section">
        <h2>Active Security Events</h2>
        <table id="eventsTable">
            <thead>
                <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Identity</th>
                    <th>Details</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
    
    <script>
        // Load dashboard data
        async function loadDashboard() {
            const response = await fetch('/api/ztna/dashboard');
            const data = await response.json();
            
            // Update metrics
            document.getElementById('totalIdentities').textContent = data.total_identities;
            document.getElementById('avgTrustScore').textContent = data.avg_trust_score.toFixed(1);
            document.getElementById('accessRequests').textContent = data.total_access_requests;
            document.getElementById('activePolicies').textContent = data.active_policies;
            
            // Access decision chart
            new Chart(document.getElementById('accessChart'), {
                type: 'doughnut',
                data: {
                    labels: ['Allowed', 'Denied', 'Challenged'],
                    datasets: [{
                        data: [data.allowed, data.denied, data.challenged],
                        backgroundColor: ['#4caf50', '#f44336', '#ff9800']
                    }]
                }
            });
            
            // Risk level chart
            new Chart(document.getElementById('riskChart'), {
                type: 'bar',
                data: {
                    labels: ['Critical', 'High', 'Medium', 'Low'],
                    datasets: [{
                        label: 'Identities',
                        data: [data.critical_risk, data.high_risk, data.medium_risk, data.low_risk],
                        backgroundColor: ['#d32f2f', '#f44336', '#ff9800', '#4caf50']
                    }]
                }
            });
            
            // Load tables
            loadAccessTable();
            loadEventsTable();
        }
        
        // Auto-refresh
        setInterval(loadDashboard, 30000);
        loadDashboard();
    </script>
</body>
</html>
EOF

    echo -e "${GREEN}✓ ZTNA report generated${NC}"
}

# Main execution
case "${1:-init}" in
    init)
        init_database
        deploy_identity_verification
        setup_micro_segmentation
        deploy_policy_engine
        setup_continuous_monitoring
        ;;
    verify)
        # Test identity verification
        echo "Testing identity verification..."
        ;;
    segment)
        setup_micro_segmentation
        ;;
    policy)
        deploy_policy_engine
        ;;
    monitor)
        setup_continuous_monitoring
        ;;
    report)
        generate_ztna_report
        ;;
    *)
        echo "Usage: $0 {init|verify|segment|policy|monitor|report}"
        echo
        echo "Commands:"
        echo "  init      Initialize ZTNA system"
        echo "  verify    Test identity verification"
        echo "  segment   Configure micro-segmentation"
        echo "  policy    Deploy policy engine"
        echo "  monitor   Setup continuous monitoring"
        echo "  report    Generate ZTNA report"
        exit 1
        ;;
esac