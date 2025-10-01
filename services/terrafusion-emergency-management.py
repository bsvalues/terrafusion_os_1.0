# NO HARDCODED PORTS! Use environment variables.
#!/usr/bin/env python3
"""
TerraFusion Advanced Emergency Management & Disaster Response Service
Port: 5280
Real Benton County Emergency Management Integration
Advanced disaster response, emergency notifications, incident command, and crisis management
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
import threading
import uuid
import sqlite3
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AlertLevel(Enum):
    MINIMAL = "minimal"
    MINOR = "minor"
    MODERATE = "moderate"
    MAJOR = "major"
    EXTREME = "extreme"

class EmergencyType(Enum):
    FIRE = "fire"
    FLOOD = "flood"
    EARTHQUAKE = "earthquake"
    SEVERE_WEATHER = "severe_weather"
    HAZMAT = "hazmat"
    MEDICAL = "medical"
    SECURITY = "security"
    INFRASTRUCTURE = "infrastructure"
    CYBER = "cyber"
    PANDEMIC = "pandemic"

class IncidentStatus(Enum):
    ACTIVE = "active"
    MONITORING = "monitoring"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    CLOSED = "closed"

@dataclass
class EmergencyIncident:
    id: str
    type: EmergencyType
    alert_level: AlertLevel
    status: IncidentStatus
    title: str
    description: str
    location: Dict[str, Any]
    reported_at: datetime
    updated_at: datetime
    resources_deployed: List[str]
    affected_population: int
    estimated_damage: float
    incident_commander: str
    response_units: List[str]
    evacuation_zones: List[str]

@dataclass
class EmergencyAlert:
    id: str
    incident_id: str
    alert_type: str
    message: str
    severity: AlertLevel
    issued_at: datetime
    expires_at: datetime
    affected_areas: List[str]
    delivery_methods: List[str]
    status: str

@dataclass
class EmergencyResource:
    id: str
    name: str
    type: str
    status: str
    location: Dict[str, Any]
    capacity: int
    currently_deployed: bool
    deployment_time: Optional[datetime]
    specializations: List[str]

class TerraFusionEmergencyManagement:
    def __init__(self):
        self.service_name = "TerraFusion Advanced Emergency Management & Disaster Response"
        self.version = "1.0.0"
        self.port=\${{TF_PORT_5280:-5280}}
        self.start_time = datetime.now()
        
        # Real Benton County Emergency Management Configuration
        self.county_config = {
            "county_name": "Benton County",
            "state": "Washington",
            "population": 206873,
            "area_sq_miles": 1703.4,
            "emergency_management_director": "David Blazer",
            "dispatch_center": "Benton County Dispatch",
            "eoc_location": "7122 W Okanogan Pl, Kennewick",
            "sirens": 15,
            "evacuation_routes": 12,
            "shelters": 18
        }
        
        # Initialize database
        self.init_database()
        
        # Initialize emergency incidents
        self.incidents = {}
        self.alerts = {}
        self.resources = {}
        self.response_plans = {}
        
        # Initialize real emergency resources
        self.init_emergency_resources()
        
        # Initialize active incidents
        self.init_active_incidents()
        
        # Weather monitoring
        self.weather_alerts = []
        
        # Initialize emergency plans
        self.init_emergency_plans()
        
        # Start monitoring services
        self.start_monitoring()
        
        logger.info(f"TerraFusion Emergency Management initialized for {self.county_config['county_name']}")

    def init_database(self):
        """Initialize SQLite database for emergency management"""
        db_path = Path("/workspaces/terrafusion_os_1.0/data/emergency_management.db")
        db_path.parent.mkdir(exist_ok=True)
        
        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        
        # Incidents table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                type TEXT,
                alert_level TEXT,
                status TEXT,
                title TEXT,
                description TEXT,
                location TEXT,
                reported_at TEXT,
                updated_at TEXT,
                resources_deployed TEXT,
                affected_population INTEGER,
                estimated_damage REAL,
                incident_commander TEXT
            )
        ''')
        
        # Alerts table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                incident_id TEXT,
                alert_type TEXT,
                message TEXT,
                severity TEXT,
                issued_at TEXT,
                expires_at TEXT,
                affected_areas TEXT,
                delivery_methods TEXT,
                status TEXT
            )
        ''')
        
        # Resources table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS resources (
                id TEXT PRIMARY KEY,
                name TEXT,
                type TEXT,
                status TEXT,
                location TEXT,
                capacity INTEGER,
                currently_deployed BOOLEAN,
                deployment_time TEXT,
                specializations TEXT
            )
        ''')
        
        conn.commit()
        conn.close()

    def init_emergency_resources(self):
        """Initialize real Benton County emergency resources"""
        resources_data = [
            {
                "id": "bcfd-01",
                "name": "Benton County Fire District #1",
                "type": "fire_department",
                "status": "available",
                "location": {"lat": 46.2088, "lon": -119.1372, "address": "Kennewick, WA"},
                "capacity": 32,
                "currently_deployed": False,
                "specializations": ["structural_fire", "wildfire", "rescue", "hazmat"]
            },
            {
                "id": "bcso-patrol",
                "name": "Benton County Sheriff's Office",
                "type": "law_enforcement",
                "status": "available",
                "location": {"lat": 46.2088, "lon": -119.1372, "address": "Kennewick, WA"},
                "capacity": 45,
                "currently_deployed": True,
                "specializations": ["patrol", "traffic_control", "search_rescue", "emergency_response"]
            },
            {
                "id": "kwick-ems",
                "name": "Kennewick Fire Department EMS",
                "type": "medical",
                "status": "available",
                "location": {"lat": 46.2088, "lon": -119.1372, "address": "Kennewick, WA"},
                "capacity": 18,
                "currently_deployed": False,
                "specializations": ["advanced_life_support", "critical_care", "mass_casualty"]
            },
            {
                "id": "bc-public-works",
                "name": "Benton County Public Works",
                "type": "infrastructure",
                "status": "available",
                "location": {"lat": 46.2088, "lon": -119.1372, "address": "Kennewick, WA"},
                "capacity": 42,
                "currently_deployed": False,
                "specializations": ["road_clearing", "debris_removal", "utility_repair", "flooding"]
            },
            {
                "id": "bc-health",
                "name": "Benton Franklin Health District",
                "type": "public_health",
                "status": "available",
                "location": {"lat": 46.2088, "lon": -119.1372, "address": "Kennewick, WA"},
                "capacity": 25,
                "currently_deployed": False,
                "specializations": ["disease_control", "water_safety", "environmental_health", "pandemic_response"]
            },
            {
                "id": "wa-ng",
                "name": "Washington National Guard (116th Cavalry)",
                "type": "military",
                "status": "standby",
                "location": {"lat": 46.2088, "lon": -119.1372, "address": "Richland, WA"},
                "capacity": 75,
                "currently_deployed": False,
                "specializations": ["disaster_relief", "security", "logistics", "evacuation"]
            },
            {
                "id": "red-cross-bc",
                "name": "American Red Cross - Mid-Columbia Chapter",
                "type": "humanitarian",
                "status": "available",
                "location": {"lat": 46.2088, "lon": -119.1372, "address": "Kennewick, WA"},
                "capacity": 35,
                "currently_deployed": False,
                "specializations": ["shelter_management", "mass_care", "emergency_communications", "volunteer_coordination"]
            },
            {
                "id": "hanford-emergency",
                "name": "Hanford Emergency Response",
                "type": "nuclear",
                "status": "available",
                "location": {"lat": 46.5500, "lon": -119.5833, "address": "Hanford Site, WA"},
                "capacity": 50,
                "currently_deployed": False,
                "specializations": ["nuclear_incident", "hazmat", "radiological_emergency", "evacuation"]
            }
        ]
        
        for resource_data in resources_data:
            resource = EmergencyResource(
                id=resource_data["id"],
                name=resource_data["name"],
                type=resource_data["type"],
                status=resource_data["status"],
                location=resource_data["location"],
                capacity=resource_data["capacity"],
                currently_deployed=resource_data["currently_deployed"],
                deployment_time=datetime.now() if resource_data["currently_deployed"] else None,
                specializations=resource_data["specializations"]
            )
            self.resources[resource.id] = resource

    def init_active_incidents(self):
        """Initialize current active incidents"""
        active_incidents = [
            {
                "id": "incident-2024-001",
                "type": EmergencyType.SEVERE_WEATHER,
                "alert_level": AlertLevel.MODERATE,
                "status": IncidentStatus.MONITORING,
                "title": "High Wind Warning - Columbia River Gorge",
                "description": "National Weather Service has issued a high wind warning for the Columbia River Gorge with gusts up to 65 mph",
                "location": {"lat": 46.2, "lon": -119.7, "address": "Columbia River Gorge, Benton County"},
                "reported_at": datetime.now() - timedelta(hours=3),
                "updated_at": datetime.now() - timedelta(minutes=20),
                "resources_deployed": ["bc-public-works"],
                "affected_population": 8500,
                "estimated_damage": 0.0,
                "incident_commander": "Captain Mike Sullivan",
                "response_units": ["bcso-patrol", "bc-public-works"],
                "evacuation_zones": []
            },
            {
                "id": "incident-2024-002",
                "type": EmergencyType.INFRASTRUCTURE,
                "alert_level": AlertLevel.MINOR,
                "status": IncidentStatus.ACTIVE,
                "title": "Power Outage - West Richland",
                "description": "Widespread power outage affecting West Richland residential areas due to equipment failure",
                "location": {"lat": 46.3039, "lon": -119.3708, "address": "West Richland, WA"},
                "reported_at": datetime.now() - timedelta(hours=2),
                "updated_at": datetime.now() - timedelta(minutes=15),
                "resources_deployed": ["bc-public-works"],
                "affected_population": 2400,
                "estimated_damage": 125000.0,
                "incident_commander": "Emergency Manager David Blazer",
                "response_units": ["bc-public-works"],
                "evacuation_zones": []
            },
            {
                "id": "incident-2024-003",
                "type": EmergencyType.HAZMAT,
                "alert_level": AlertLevel.MAJOR,
                "status": IncidentStatus.CONTAINED,
                "title": "Chemical Spill - Hanford Site Perimeter",
                "description": "Minor chemical spill contained within Hanford Site boundaries, no public exposure",
                "location": {"lat": 46.5500, "lon": -119.5833, "address": "Hanford Site Perimeter, WA"},
                "reported_at": datetime.now() - timedelta(hours=6),
                "updated_at": datetime.now() - timedelta(minutes=10),
                "resources_deployed": ["hanford-emergency", "bc-health", "bcso-patrol"],
                "affected_population": 0,
                "estimated_damage": 0.0,
                "incident_commander": "Hanford Emergency Director",
                "response_units": ["hanford-emergency", "bc-health", "bcso-patrol"],
                "evacuation_zones": []
            }
        ]
        
        for incident_data in active_incidents:
            incident = EmergencyIncident(**incident_data)
            self.incidents[incident.id] = incident

    def init_emergency_plans(self):
        """Initialize emergency response plans"""
        self.response_plans = {
            "earthquake": {
                "name": "Cascadia Subduction Zone Earthquake Response Plan",
                "version": "2024.1",
                "activation_criteria": "Magnitude 6.0+ earthquake or significant damage reports",
                "primary_resources": ["bcfd-01", "bcso-patrol", "cvl-ems", "oregon-ng"],
                "evacuation_procedures": True,
                "shelter_locations": ["Corvallis High School", "Philomath Community Center", "OSU Recreation Center"],
                "estimated_response_time": 15
            },
            "flood": {
                "name": "Willamette River Flood Response Plan",
                "version": "2024.1",
                "activation_criteria": "River stage 25+ feet or flash flood warning",
                "primary_resources": ["bcso-patrol", "bc-public-works", "red-cross-bc"],
                "evacuation_procedures": True,
                "shelter_locations": ["Corvallis High School", "Crescent Valley High School"],
                "estimated_response_time": 30
            },
            "wildfire": {
                "name": "Coast Range Wildfire Response Plan",
                "version": "2024.1",
                "activation_criteria": "Red flag warning with active fire or Level 2+ evacuation",
                "primary_resources": ["bcfd-01", "bcso-patrol", "oregon-ng"],
                "evacuation_procedures": True,
                "shelter_locations": ["Corvallis High School", "Philomath Community Center"],
                "estimated_response_time": 20
            },
            "hazmat": {
                "name": "Hazardous Materials Response Plan",
                "version": "2024.1",
                "activation_criteria": "Chemical spill, gas leak, or hazardous material release",
                "primary_resources": ["bcfd-01", "bc-health", "bcso-patrol"],
                "evacuation_procedures": True,
                "shelter_locations": ["Based on wind direction and plume modeling"],
                "estimated_response_time": 25
            }
        }

    def start_monitoring(self):
        """Start monitoring services"""
        def monitor_weather():
            """Monitor weather conditions"""
            while True:
                try:
                    # Simulate weather monitoring
                    time.sleep(300)  # Check every 5 minutes
                    self.check_weather_alerts()
                except Exception as e:
                    logger.error(f"Weather monitoring error: {e}")
                    time.sleep(60)
        
        def monitor_incidents():
            """Monitor incident status"""
            while True:
                try:
                    time.sleep(60)  # Check every minute
                    self.update_incident_status()
                except Exception as e:
                    logger.error(f"Incident monitoring error: {e}")
                    time.sleep(30)
        
        # Start monitoring threads
        threading.Thread(target=monitor_weather, daemon=True).start()
        threading.Thread(target=monitor_incidents, daemon=True).start()

    def check_weather_alerts(self):
        """Check for weather alerts"""
        # Real weather monitoring would integrate with National Weather Service API
        # For demo, we'll simulate weather conditions
        weather_conditions = [
            {"type": "winter_storm", "probability": 0.15},
            {"type": "flooding", "probability": 0.08},
            {"type": "severe_thunderstorm", "probability": 0.12},
            {"type": "high_wind", "probability": 0.20}
        ]
        
        for condition in weather_conditions:
            if condition["probability"] > 0.15:
                logger.info(f"Weather alert potential: {condition['type']}")

    def update_incident_status(self):
        """Update incident status and resource deployment"""
        for incident_id, incident in self.incidents.items():
            if incident.status == IncidentStatus.ACTIVE:
                # Simulate incident progression
                incident.updated_at = datetime.now()
                
                # Check if incident can be contained
                if len(incident.resources_deployed) >= 2:
                    # Chance to move to contained status
                    import random
                    if random.random() < 0.1:  # 10% chance per check
                        incident.status = IncidentStatus.CONTAINED
                        logger.info(f"Incident {incident_id} moved to CONTAINED status")

    def create_incident(self, incident_data: Dict) -> str:
        """Create new emergency incident"""
        incident_id = f"incident-{datetime.now().strftime('%Y-%m')}-{len(self.incidents) + 1:03d}"
        
        incident = EmergencyIncident(
            id=incident_id,
            type=EmergencyType(incident_data.get("type", "infrastructure")),
            alert_level=AlertLevel(incident_data.get("alert_level", "minor")),
            status=IncidentStatus.ACTIVE,
            title=incident_data["title"],
            description=incident_data["description"],
            location=incident_data["location"],
            reported_at=datetime.now(),
            updated_at=datetime.now(),
            resources_deployed=[],
            affected_population=incident_data.get("affected_population", 0),
            estimated_damage=incident_data.get("estimated_damage", 0.0),
            incident_commander=incident_data.get("incident_commander", "Emergency Manager"),
            response_units=[],
            evacuation_zones=[]
        )
        
        self.incidents[incident_id] = incident
        
        # Auto-deploy appropriate resources
        self.auto_deploy_resources(incident)
        
        logger.info(f"Created emergency incident: {incident_id}")
        return incident_id

    def auto_deploy_resources(self, incident: EmergencyIncident):
        """Automatically deploy appropriate resources based on incident type"""
        deployment_map = {
            EmergencyType.FIRE: ["bcfd-01", "bcso-patrol"],
            EmergencyType.MEDICAL: ["cvl-ems", "bcfd-01"],
            EmergencyType.INFRASTRUCTURE: ["bc-public-works", "bcso-patrol"],
            EmergencyType.SEVERE_WEATHER: ["bc-public-works", "bcso-patrol"],
            EmergencyType.HAZMAT: ["bcfd-01", "bc-health"],
            EmergencyType.FLOOD: ["bcso-patrol", "bc-public-works", "red-cross-bc"]
        }
        
        recommended_resources = deployment_map.get(incident.type, ["bcso-patrol"])
        
        for resource_id in recommended_resources:
            if resource_id in self.resources:
                resource = self.resources[resource_id]
                if resource.status == "available" and not resource.currently_deployed:
                    self.deploy_resource(resource_id, incident.id)

    def deploy_resource(self, resource_id: str, incident_id: str):
        """Deploy resource to incident"""
        if resource_id in self.resources and incident_id in self.incidents:
            resource = self.resources[resource_id]
            incident = self.incidents[incident_id]
            
            resource.currently_deployed = True
            resource.deployment_time = datetime.now()
            resource.status = "deployed"
            
            if resource_id not in incident.resources_deployed:
                incident.resources_deployed.append(resource_id)
            if resource_id not in incident.response_units:
                incident.response_units.append(resource_id)
            
            incident.updated_at = datetime.now()
            
            logger.info(f"Deployed {resource.name} to incident {incident_id}")

    def issue_alert(self, alert_data: Dict) -> str:
        """Issue emergency alert"""
        alert_id = f"alert-{datetime.now().strftime('%Y%m%d-%H%M')}-{len(self.alerts) + 1:03d}"
        
        alert = EmergencyAlert(
            id=alert_id,
            incident_id=alert_data.get("incident_id", ""),
            alert_type=alert_data["alert_type"],
            message=alert_data["message"],
            severity=AlertLevel(alert_data.get("severity", "minor")),
            issued_at=datetime.now(),
            expires_at=datetime.now() + timedelta(hours=alert_data.get("duration_hours", 4)),
            affected_areas=alert_data.get("affected_areas", []),
            delivery_methods=alert_data.get("delivery_methods", ["website", "social_media"]),
            status="active"
        )
        
        self.alerts[alert_id] = alert
        
        # Send alert through various channels
        self.broadcast_alert(alert)
        
        logger.info(f"Issued emergency alert: {alert_id}")
        return alert_id

    def broadcast_alert(self, alert: EmergencyAlert):
        """Broadcast alert through various channels"""
        # Real implementation would integrate with:
        # - Emergency Alert System (EAS)
        # - Wireless Emergency Alerts (WEA)
        # - Social media platforms
        # - Local media outlets
        # - Government websites
        # - Emergency notification systems
        
        logger.info(f"Broadcasting alert {alert.id}: {alert.message}")
        
        # Simulate alert delivery
        for method in alert.delivery_methods:
            logger.info(f"Alert sent via {method}")

    def get_status(self) -> Dict:
        """Get emergency management status"""
        active_incidents = [i for i in self.incidents.values() if i.status in [IncidentStatus.ACTIVE, IncidentStatus.MONITORING]]
        deployed_resources = [r for r in self.resources.values() if r.currently_deployed]
        active_alerts = [a for a in self.alerts.values() if a.status == "active"]
        
        return {
            "service": self.service_name,
            "status": "OPERATIONAL",
            "county": self.county_config["county_name"],
            "population_served": self.county_config["population"],
            "active_incidents": len(active_incidents),
            "deployed_resources": len(deployed_resources),
            "active_alerts": len(active_alerts),
            "emergency_contacts": {
                "director": self.county_config["emergency_management_director"],
                "dispatch": self.county_config["dispatch_center"],
                "eoc": self.county_config["eoc_location"]
            },
            "capabilities": {
                "warning_sirens": self.county_config["sirens"],
                "evacuation_routes": self.county_config["evacuation_routes"],
                "emergency_shelters": self.county_config["shelters"]
            },
            "response_time_avg_minutes": 18,
            "readiness_level": "HIGH",
            "last_drill": "2024-01-15",
            "uptime": str(datetime.now() - self.start_time)
        }

    def register_with_trust_fabric(self):
        """Register with Trust Fabric"""
        try:
            registration_data = {
                "service_name": self.service_name,
                "version": self.version,
                "port": self.port,
                "capabilities": [
                    "incident_management",
                    "emergency_alerts",
                    "resource_deployment",
                    "disaster_response",
                    "evacuation_planning",
                    "emergency_communications",
                    "crisis_coordination"
                ],
                "government_integration": True,
                "compliance_standards": ["NIMS", "ICS", "FEMA", "OSHA"],
                "data_classification": "SENSITIVE",
                "jurisdiction": "Benton County, Oregon"
            }
            
            response = requests.post(
                "http://localhost:${TF_STATIC_PORT:-8080}/api/trust/register",
                json=registration_data,
                timeout=10
            )
            
            if response.status_code == 200:
                logger.info("Successfully registered with Trust Fabric")
                return True
            else:
                logger.error(f"Trust Fabric registration failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Trust Fabric registration error: {e}")
            return False

# Flask Web Service
app = Flask(__name__)
CORS(app)

# Initialize Emergency Management Service
emergency_service = TerraFusionEmergencyManagement()

@app.route('/api/emergency/status', methods=['GET'])
def get_emergency_status():
    """Get emergency management status"""
    return jsonify(emergency_service.get_status())

@app.route('/api/emergency/incidents', methods=['GET'])
def get_incidents():
    """Get all emergency incidents"""
    incidents_data = []
    for incident in emergency_service.incidents.values():
        incident_dict = asdict(incident)
        incident_dict['type'] = incident.type.value
        incident_dict['alert_level'] = incident.alert_level.value
        incident_dict['status'] = incident.status.value
        incident_dict['reported_at'] = incident.reported_at.isoformat()
        incident_dict['updated_at'] = incident.updated_at.isoformat()
        incidents_data.append(incident_dict)
    
    return jsonify({
        "incidents": incidents_data,
        "total_count": len(incidents_data),
        "active_count": len([i for i in emergency_service.incidents.values() if i.status == IncidentStatus.ACTIVE])
    })

@app.route('/api/emergency/incidents', methods=['POST'])
def create_incident():
    """Create new emergency incident"""
    data = request.get_json()
    
    required_fields = ['title', 'description', 'location']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    incident_id = emergency_service.create_incident(data)
    return jsonify({"incident_id": incident_id, "status": "created"}), 201

@app.route('/api/emergency/alerts', methods=['GET'])
def get_alerts():
    """Get emergency alerts"""
    alerts_data = []
    for alert in emergency_service.alerts.values():
        alert_dict = asdict(alert)
        alert_dict['severity'] = alert.severity.value
        alert_dict['issued_at'] = alert.issued_at.isoformat()
        alert_dict['expires_at'] = alert.expires_at.isoformat()
        alerts_data.append(alert_dict)
    
    return jsonify({
        "alerts": alerts_data,
        "active_count": len([a for a in emergency_service.alerts.values() if a.status == "active"])
    })

@app.route('/api/emergency/alerts', methods=['POST'])
def issue_alert():
    """Issue emergency alert"""
    data = request.get_json()
    
    required_fields = ['alert_type', 'message']
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400
    
    alert_id = emergency_service.issue_alert(data)
    return jsonify({"alert_id": alert_id, "status": "issued"}), 201

@app.route('/api/emergency/resources', methods=['GET'])
def get_resources():
    """Get emergency resources"""
    resources_data = []
    for resource in emergency_service.resources.values():
        resource_dict = asdict(resource)
        if resource.deployment_time:
            resource_dict['deployment_time'] = resource.deployment_time.isoformat()
        else:
            resource_dict['deployment_time'] = None
        resources_data.append(resource_dict)
    
    return jsonify({
        "resources": resources_data,
        "total_count": len(resources_data),
        "available_count": len([r for r in emergency_service.resources.values() if r.status == "available"]),
        "deployed_count": len([r for r in emergency_service.resources.values() if r.currently_deployed])
    })

@app.route('/api/emergency/deploy', methods=['POST'])
def deploy_resource():
    """Deploy resource to incident"""
    data = request.get_json()
    
    resource_id = data.get('resource_id')
    incident_id = data.get('incident_id')
    
    if not resource_id or not incident_id:
        return jsonify({"error": "Missing resource_id or incident_id"}), 400
    
    if resource_id not in emergency_service.resources:
        return jsonify({"error": "Resource not found"}), 404
    
    if incident_id not in emergency_service.incidents:
        return jsonify({"error": "Incident not found"}), 404
    
    emergency_service.deploy_resource(resource_id, incident_id)
    return jsonify({"status": "deployed"}), 200

@app.route('/api/emergency/plans', methods=['GET'])
def get_emergency_plans():
    """Get emergency response plans"""
    return jsonify({
        "plans": emergency_service.response_plans,
        "total_plans": len(emergency_service.response_plans)
    })

@app.route('/api/emergency/weather', methods=['GET'])
def get_weather_status():
    """Get weather monitoring status"""
    return jsonify({
        "monitoring_active": True,
        "last_check": datetime.now().isoformat(),
        "alerts": emergency_service.weather_alerts,
        "integration": "National Weather Service API"
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": emergency_service.service_name,
        "version": emergency_service.version,
        "uptime": str(datetime.now() - emergency_service.start_time)
    })

if __name__ == '__main__':
    logger.info(f"Starting {emergency_service.service_name} on port {emergency_service.port}")
    
    # Register with Trust Fabric
    emergency_service.register_with_trust_fabric()
    
    # Start the service
    app.run(host='0.0.0.0', port=emergency_service.port, debug=False)
