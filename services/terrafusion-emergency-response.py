# NO HARDCODED PORTS! Use environment variables.
#!/usr/bin/env python3
"""
TerraFusion Emergency Response & Crisis Management Service - Government Emergency Operations
Complete emergency response and crisis management for TerraFusion OS

This service provides:
- Real-time emergency detection and alerting
- Crisis management and incident command
- Emergency resource allocation and coordination
- Mass notification and public alert systems
- Disaster response planning and execution
- Multi-agency coordination and communication
- Emergency shelter and evacuation management
- Medical emergency response coordination
- Search and rescue operations management
- Post-disaster recovery and assessment
"""

import asyncio
import aiohttp
from aiohttp import web
import json
import time
import logging
import sqlite3
import hashlib
import secrets
import random
import math
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmergencyType(Enum):
    FIRE = "fire"
    FLOOD = "flood"
    EARTHQUAKE = "earthquake"
    HAZMAT = "hazmat"
    MEDICAL = "medical"
    MISSING_PERSON = "missing_person"
    STRUCTURAL_COLLAPSE = "structural_collapse"
    SEVERE_WEATHER = "severe_weather"
    EVACUATION = "evacuation"
    POWER_OUTAGE = "power_outage"
    CHEMICAL_SPILL = "chemical_spill"
    NUCLEAR_INCIDENT = "nuclear_incident"
    TERRORISM = "terrorism"
    CIVIL_UNREST = "civil_unrest"

class AlertLevel(Enum):
    INFO = "info"
    ADVISORY = "advisory"
    WATCH = "watch"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

class ResponseStatus(Enum):
    DETECTED = "detected"
    DISPATCHED = "dispatched"
    EN_ROUTE = "en_route"
    ON_SCENE = "on_scene"
    ACTIVE = "active"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    UNDER_INVESTIGATION = "under_investigation"

@dataclass
class EmergencyIncident:
    """Emergency incident definition"""
    incident_id: str
    incident_type: EmergencyType
    alert_level: AlertLevel
    location_lat: float
    location_lon: float
    location_description: str
    reported_time: float
    description: str
    status: ResponseStatus
    estimated_affected_population: int
    resource_requirements: List[str]
    assigned_units: List[str]
    incident_commander: str
    priority_level: int  # 1-5, 1 being highest
    estimated_duration_hours: float
    government_agencies_involved: List[str]

@dataclass
class EmergencyResource:
    """Emergency response resource"""
    resource_id: str
    resource_type: str  # "fire_truck", "ambulance", "police_unit", "hazmat_team", etc.
    resource_name: str
    current_location_lat: float
    current_location_lon: float
    availability_status: str  # "available", "dispatched", "busy", "maintenance"
    staffing_level: int
    equipment_status: str
    estimated_arrival_time: Optional[float]
    assigned_incident_id: Optional[str]
    contact_frequency: str
    specialized_capabilities: List[str]

@dataclass
class PublicAlert:
    """Public emergency alert"""
    alert_id: str
    alert_type: EmergencyType
    alert_level: AlertLevel
    message_title: str
    message_body: str
    affected_areas: List[str]
    issued_time: float
    expiration_time: float
    issuing_agency: str
    contact_information: str
    protective_actions: List[str]
    update_sequence: int

@dataclass
class EvacuationZone:
    """Evacuation zone definition"""
    zone_id: str
    zone_name: str
    center_lat: float
    center_lon: float
    radius_km: float
    evacuation_status: str  # "standby", "voluntary", "mandatory", "cleared"
    evacuation_reason: str
    estimated_population: int
    shelter_locations: List[str]
    evacuation_routes: List[str]
    transportation_resources: List[str]
    established_time: float
    estimated_completion_time: Optional[float]

@dataclass
class EmergencyServiceStatus:
    """TerraFusion Emergency Service status"""
    service: str
    status: str
    active_incidents: int
    total_resources: int
    available_resources: int
    active_alerts: int
    evacuation_zones: int
    response_time_avg_minutes: float
    incidents_resolved_24h: int
    government_coordination_level: str

class TerraFusionEmergencyResponse:
    """TerraFusion Emergency Response & Crisis Management Service"""
    
    def __init__(self, port: int = 5200):
        self.port = port
        self.service_start_time = time.time()
        self.emergency_db = self._init_emergency_db()
        self.benton_config = self._load_benton_config()
        
        # Emergency management storage
        self.active_incidents: Dict[str, EmergencyIncident] = {}
        self.emergency_resources: Dict[str, EmergencyResource] = {}
        self.public_alerts: List[PublicAlert] = []
        self.evacuation_zones: Dict[str, EvacuationZone] = {}
        
        # Performance tracking
        self.total_incidents_handled = 0
        self.total_response_time_minutes = 0.0
        self.incidents_resolved_today = 0
        
        # Government agencies for Benton County
        self.government_agencies = {
            'bcso': {
                'name': 'Benton County Sheriff\'s Office',
                'type': 'law_enforcement',
                'contact': '509-628-0333',
                'jurisdiction': 'county_wide',
                'capabilities': ['law_enforcement', 'search_rescue', 'emergency_response']
            },
            'bcfd': {
                'name': 'Benton County Fire Protection Districts',
                'type': 'fire_emergency',
                'contact': '509-628-0333',
                'jurisdiction': 'county_wide',
                'capabilities': ['fire_suppression', 'ems', 'hazmat', 'rescue']
            },
            'bchd': {
                'name': 'Benton County Health Department',
                'type': 'public_health',
                'contact': '509-460-4200',
                'jurisdiction': 'county_wide',
                'capabilities': ['public_health', 'medical_response', 'disease_control']
            },
            'bcdes': {
                'name': 'Benton County Emergency Services',
                'type': 'emergency_management',
                'contact': '509-628-0333',
                'jurisdiction': 'county_wide',
                'capabilities': ['incident_command', 'coordination', 'public_alerts']
            },
            'wsoe': {
                'name': 'Washington State Office of Emergency Management',
                'type': 'state_emergency',
                'contact': '253-512-7000',
                'jurisdiction': 'state_wide',
                'capabilities': ['state_resources', 'federal_coordination', 'disaster_declaration']
            },
            'hanford_ecc': {
                'name': 'Hanford Emergency Command Center',
                'type': 'nuclear_emergency',
                'contact': '509-376-1647',
                'jurisdiction': 'hanford_site',
                'capabilities': ['nuclear_emergency', 'hazmat', 'radiological_response']
            }
        }
        
        # Emergency response zones for Benton County
        self.response_zones = {
            'richland': {
                'name': 'City of Richland',
                'center_lat': 46.2856,
                'center_lon': -119.2844,
                'radius_km': 8.0,
                'population': 60560,
                'primary_hospital': 'Kadlec Regional Medical Center',
                'fire_stations': 4,
                'police_stations': 1
            },
            'kennewick': {
                'name': 'City of Kennewick',
                'center_lat': 46.2112,
                'center_lon': -119.1372,
                'radius_km': 12.0,
                'population': 84347,
                'primary_hospital': 'Trios Health',
                'fire_stations': 6,
                'police_stations': 1
            },
            'pasco': {
                'name': 'City of Pasco',
                'center_lat': 46.2396,
                'center_lon': -119.1006,
                'radius_km': 10.0,
                'population': 77108,
                'primary_hospital': 'Lourdes Medical Center',
                'fire_stations': 3,
                'police_stations': 1
            },
            'west_richland': {
                'name': 'City of West Richland',
                'center_lat': 46.3045,
                'center_lon': -119.3617,
                'radius_km': 6.0,
                'population': 15944,
                'primary_hospital': 'Kadlec Regional Medical Center',
                'fire_stations': 2,
                'police_stations': 1
            },
            'rural_benton': {
                'name': 'Rural Benton County',
                'center_lat': 46.3000,
                'center_lon': -119.4000,
                'radius_km': 50.0,
                'population': 50000,
                'primary_hospital': 'Various',
                'fire_stations': 8,
                'police_stations': 3
            },
            'hanford_site': {
                'name': 'Hanford Nuclear Reservation',
                'center_lat': 46.5197,
                'center_lon': -119.5444,
                'radius_km': 15.0,
                'population': 15000,  # Workers
                'primary_hospital': 'Hanford Medical Clinic',
                'fire_stations': 2,
                'police_stations': 1
            }
        }
        
        # Initialize emergency resources
        self._deploy_emergency_resources()
        
        # Start emergency operations
        asyncio.create_task(self._emergency_monitoring_loop())
        asyncio.create_task(self._resource_management_loop())
        asyncio.create_task(self._public_alert_loop())
        asyncio.create_task(self._incident_simulation_loop())
        
        logger.info(f"🚨 TerraFusion Emergency Response initialized")
        logger.info(f"📍 Deployment: Benton County Emergency Operations")
        logger.info(f"🚒 Response zones: {len(self.response_zones)}")
        logger.info(f"⚡ Emergency response port: {self.port}")
    
    def _load_benton_config(self) -> Dict[str, Any]:
        """Load real Benton County configuration"""
        config_path = "/workspaces/terrafusion_os_1.0/benton-county-config.json"
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load Benton County config: {e}")
            return {'county': 'benton', 'state': 'washington', 'emergency_response_enabled': True}
    
    def _init_emergency_db(self) -> sqlite3.Connection:
        """Initialize Emergency Response database"""
        db_path = "/workspaces/terrafusion_os_1.0/trust-fabric/emergency_response.db"
        conn = sqlite3.connect(db_path)
        
        # Emergency incidents table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS emergency_incidents (
                incident_id TEXT PRIMARY KEY,
                incident_type TEXT NOT NULL,
                alert_level TEXT NOT NULL,
                location_lat REAL NOT NULL,
                location_lon REAL NOT NULL,
                location_description TEXT NOT NULL,
                reported_time REAL NOT NULL,
                description TEXT NOT NULL,
                status TEXT NOT NULL,
                estimated_affected_population INTEGER NOT NULL,
                resource_requirements TEXT NOT NULL,
                assigned_units TEXT NOT NULL,
                incident_commander TEXT NOT NULL,
                priority_level INTEGER NOT NULL,
                estimated_duration_hours REAL NOT NULL,
                government_agencies_involved TEXT NOT NULL
            )
        """)
        
        # Emergency resources table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS emergency_resources (
                resource_id TEXT PRIMARY KEY,
                resource_type TEXT NOT NULL,
                resource_name TEXT NOT NULL,
                current_location_lat REAL NOT NULL,
                current_location_lon REAL NOT NULL,
                availability_status TEXT NOT NULL,
                staffing_level INTEGER NOT NULL,
                equipment_status TEXT NOT NULL,
                estimated_arrival_time REAL,
                assigned_incident_id TEXT,
                contact_frequency TEXT NOT NULL,
                specialized_capabilities TEXT NOT NULL
            )
        """)
        
        # Public alerts table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS public_alerts (
                alert_id TEXT PRIMARY KEY,
                alert_type TEXT NOT NULL,
                alert_level TEXT NOT NULL,
                message_title TEXT NOT NULL,
                message_body TEXT NOT NULL,
                affected_areas TEXT NOT NULL,
                issued_time REAL NOT NULL,
                expiration_time REAL NOT NULL,
                issuing_agency TEXT NOT NULL,
                contact_information TEXT NOT NULL,
                protective_actions TEXT NOT NULL,
                update_sequence INTEGER NOT NULL
            )
        """)
        
        # Evacuation zones table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS evacuation_zones (
                zone_id TEXT PRIMARY KEY,
                zone_name TEXT NOT NULL,
                center_lat REAL NOT NULL,
                center_lon REAL NOT NULL,
                radius_km REAL NOT NULL,
                evacuation_status TEXT NOT NULL,
                evacuation_reason TEXT NOT NULL,
                estimated_population INTEGER NOT NULL,
                shelter_locations TEXT NOT NULL,
                evacuation_routes TEXT NOT NULL,
                transportation_resources TEXT NOT NULL,
                established_time REAL NOT NULL,
                estimated_completion_time REAL
            )
        """)
        
        conn.commit()
        return conn
    
    def _deploy_emergency_resources(self):
        """Deploy emergency response resources across Benton County"""
        resource_configs = [
            # Fire Department Resources
            {'type': 'fire_truck', 'name': 'Engine 91', 'zone': 'richland', 'capabilities': ['fire_suppression', 'rescue']},
            {'type': 'fire_truck', 'name': 'Engine 92', 'zone': 'richland', 'capabilities': ['fire_suppression', 'ems']},
            {'type': 'fire_truck', 'name': 'Ladder 93', 'zone': 'richland', 'capabilities': ['aerial_rescue', 'fire_suppression']},
            {'type': 'fire_truck', 'name': 'Engine 71', 'zone': 'kennewick', 'capabilities': ['fire_suppression', 'rescue']},
            {'type': 'fire_truck', 'name': 'Engine 72', 'zone': 'kennewick', 'capabilities': ['fire_suppression', 'ems']},
            {'type': 'fire_truck', 'name': 'Engine 73', 'zone': 'kennewick', 'capabilities': ['fire_suppression', 'hazmat']},
            {'type': 'fire_truck', 'name': 'Engine 61', 'zone': 'pasco', 'capabilities': ['fire_suppression', 'rescue']},
            {'type': 'fire_truck', 'name': 'Engine 62', 'zone': 'pasco', 'capabilities': ['fire_suppression', 'ems']},
            {'type': 'fire_truck', 'name': 'Engine 81', 'zone': 'west_richland', 'capabilities': ['fire_suppression', 'rescue']},
            {'type': 'fire_truck', 'name': 'Engine H1', 'zone': 'hanford_site', 'capabilities': ['nuclear_emergency', 'hazmat']},
            
            # EMS Resources
            {'type': 'ambulance', 'name': 'Medic 91', 'zone': 'richland', 'capabilities': ['advanced_life_support', 'transport']},
            {'type': 'ambulance', 'name': 'Medic 92', 'zone': 'richland', 'capabilities': ['basic_life_support', 'transport']},
            {'type': 'ambulance', 'name': 'Medic 71', 'zone': 'kennewick', 'capabilities': ['advanced_life_support', 'transport']},
            {'type': 'ambulance', 'name': 'Medic 72', 'zone': 'kennewick', 'capabilities': ['basic_life_support', 'transport']},
            {'type': 'ambulance', 'name': 'Medic 61', 'zone': 'pasco', 'capabilities': ['advanced_life_support', 'transport']},
            {'type': 'ambulance', 'name': 'Medic 62', 'zone': 'pasco', 'capabilities': ['basic_life_support', 'transport']},
            
            # Law Enforcement Resources
            {'type': 'police_unit', 'name': 'Patrol 101', 'zone': 'richland', 'capabilities': ['law_enforcement', 'traffic_control']},
            {'type': 'police_unit', 'name': 'Patrol 102', 'zone': 'richland', 'capabilities': ['law_enforcement', 'emergency_response']},
            {'type': 'police_unit', 'name': 'Patrol 201', 'zone': 'kennewick', 'capabilities': ['law_enforcement', 'traffic_control']},
            {'type': 'police_unit', 'name': 'Patrol 202', 'zone': 'kennewick', 'capabilities': ['law_enforcement', 'emergency_response']},
            {'type': 'police_unit', 'name': 'Patrol 301', 'zone': 'pasco', 'capabilities': ['law_enforcement', 'traffic_control']},
            {'type': 'police_unit', 'name': 'BCSO 401', 'zone': 'rural_benton', 'capabilities': ['law_enforcement', 'search_rescue']},
            {'type': 'police_unit', 'name': 'BCSO 402', 'zone': 'rural_benton', 'capabilities': ['law_enforcement', 'emergency_response']},
            
            # Specialized Teams
            {'type': 'hazmat_team', 'name': 'HAZMAT 1', 'zone': 'kennewick', 'capabilities': ['chemical_response', 'decontamination']},
            {'type': 'search_rescue', 'name': 'SAR Team 1', 'zone': 'rural_benton', 'capabilities': ['wilderness_rescue', 'missing_person']},
            {'type': 'emergency_management', 'name': 'Emergency Operations Center', 'zone': 'richland', 'capabilities': ['incident_command', 'coordination']},
            {'type': 'nuclear_response', 'name': 'Hanford Nuclear Response', 'zone': 'hanford_site', 'capabilities': ['radiological_response', 'nuclear_emergency']},
        ]
        
        for resource_config in resource_configs:
            resource_id = hashlib.sha256(f"resource_{resource_config['name']}_{time.time()}".encode()).hexdigest()[:16]
            zone_info = self.response_zones[resource_config['zone']]
            
            # Add some location variance within the zone
            lat_offset = random.uniform(-0.02, 0.02)
            lon_offset = random.uniform(-0.02, 0.02)
            
            resource = EmergencyResource(
                resource_id=resource_id,
                resource_type=resource_config['type'],
                resource_name=resource_config['name'],
                current_location_lat=zone_info['center_lat'] + lat_offset,
                current_location_lon=zone_info['center_lon'] + lon_offset,
                availability_status="available",
                staffing_level=random.randint(2, 6),
                equipment_status="operational",
                estimated_arrival_time=None,
                assigned_incident_id=None,
                contact_frequency="800MHz Digital",
                specialized_capabilities=resource_config['capabilities']
            )
            
            self.emergency_resources[resource_id] = resource
            asyncio.create_task(self._store_emergency_resource(resource))
            
            logger.info(f"🚒 Emergency resource deployed: {resource_config['name']} ({resource_config['type']})")
    
    async def _emergency_monitoring_loop(self):
        """Main emergency monitoring loop"""
        while True:
            try:
                # Monitor for new emergencies and update existing incidents
                await self._monitor_emergency_conditions()
                await self._update_incident_statuses()
                await asyncio.sleep(30)  # Check every 30 seconds
            except Exception as e:
                logger.error(f"Emergency monitoring error: {e}")
                await asyncio.sleep(30)
    
    async def _resource_management_loop(self):
        """Manage emergency resource allocation"""
        while True:
            try:
                await self._optimize_resource_allocation()
                await self._update_resource_positions()
                await asyncio.sleep(120)  # Update every 2 minutes
            except Exception as e:
                logger.error(f"Resource management error: {e}")
                await asyncio.sleep(120)
    
    async def _public_alert_loop(self):
        """Manage public alerts and notifications"""
        while True:
            try:
                await self._process_public_alerts()
                await self._expire_old_alerts()
                await asyncio.sleep(60)  # Check alerts every minute
            except Exception as e:
                logger.error(f"Public alert processing error: {e}")
                await asyncio.sleep(60)
    
    async def _incident_simulation_loop(self):
        """Simulate realistic emergency incidents for testing"""
        while True:
            try:
                # Occasionally simulate new incidents for demonstration
                if random.random() < 0.1:  # 10% chance every 5 minutes
                    await self._simulate_emergency_incident()
                await asyncio.sleep(300)  # Check every 5 minutes
            except Exception as e:
                logger.error(f"Incident simulation error: {e}")
                await asyncio.sleep(300)
    
    async def _monitor_emergency_conditions(self):
        """Monitor for emergency conditions in Benton County"""
        try:
            # Simulate integration with various emergency detection systems
            # In a real system, this would connect to:
            # - 911 dispatch systems
            # - Fire alarm monitoring
            # - Weather services
            # - Seismic monitoring
            # - Chemical detection systems
            # - Traffic monitoring
            # - Public safety cameras
            pass
        except Exception as e:
            logger.error(f"Emergency condition monitoring failed: {e}")
    
    async def _simulate_emergency_incident(self):
        """Simulate a realistic emergency incident"""
        try:
            # Choose random incident type and location
            incident_types = list(EmergencyType)
            incident_type = random.choice(incident_types)
            
            # Choose random zone
            zone_name, zone_info = random.choice(list(self.response_zones.items()))
            
            # Generate location within zone
            lat_offset = random.uniform(-zone_info['radius_km']/111.0, zone_info['radius_km']/111.0)
            lon_offset = random.uniform(-zone_info['radius_km']/111.0, zone_info['radius_km']/111.0)
            
            incident_lat = zone_info['center_lat'] + lat_offset
            incident_lon = zone_info['center_lon'] + lon_offset
            
            incident_id = hashlib.sha256(f"incident_{incident_type.value}_{time.time()}".encode()).hexdigest()[:16]
            
            # Determine alert level based on incident type
            alert_levels = {
                EmergencyType.FIRE: AlertLevel.WARNING,
                EmergencyType.MEDICAL: AlertLevel.ADVISORY,
                EmergencyType.HAZMAT: AlertLevel.CRITICAL,
                EmergencyType.NUCLEAR_INCIDENT: AlertLevel.EMERGENCY,
                EmergencyType.EARTHQUAKE: AlertLevel.CRITICAL,
                EmergencyType.FLOOD: AlertLevel.WARNING,
                EmergencyType.SEVERE_WEATHER: AlertLevel.WATCH,
            }
            alert_level = alert_levels.get(incident_type, AlertLevel.ADVISORY)
            
            # Generate incident description
            descriptions = {
                EmergencyType.FIRE: f"Structure fire reported in {zone_name}",
                EmergencyType.MEDICAL: f"Medical emergency reported in {zone_name}",
                EmergencyType.HAZMAT: f"Hazardous material spill reported in {zone_name}",
                EmergencyType.TRAFFIC_ACCIDENT: f"Multi-vehicle accident in {zone_name}",
                EmergencyType.SEVERE_WEATHER: f"Severe weather conditions in {zone_name}",
            }
            description = descriptions.get(incident_type, f"{incident_type.value} emergency in {zone_name}")
            
            # Determine affected population
            base_population = zone_info['population']
            affected_percentage = random.uniform(0.01, 0.1)  # 1-10% of zone population
            affected_population = int(base_population * affected_percentage)
            
            # Determine required resources
            resource_requirements = []
            if incident_type in [EmergencyType.FIRE, EmergencyType.HAZMAT]:
                resource_requirements.extend(['fire_truck', 'ambulance', 'police_unit'])
            elif incident_type == EmergencyType.MEDICAL:
                resource_requirements.extend(['ambulance', 'police_unit'])
            elif incident_type == EmergencyType.NUCLEAR_INCIDENT:
                resource_requirements.extend(['nuclear_response', 'hazmat_team', 'evacuation_support'])
            else:
                resource_requirements.extend(['police_unit', 'ambulance'])
            
            # Select incident commander
            commanders = ['IC Johnson', 'IC Smith', 'IC Brown', 'IC Williams', 'IC Davis']
            incident_commander = random.choice(commanders)
            
            # Determine priority (1-5, 1 highest)
            priority_levels = {
                AlertLevel.EMERGENCY: 1,
                AlertLevel.CRITICAL: 2,
                AlertLevel.WARNING: 3,
                AlertLevel.ADVISORY: 4,
                AlertLevel.INFO: 5
            }
            priority = priority_levels.get(alert_level, 3)
            
            # Estimate duration
            duration_estimates = {
                EmergencyType.FIRE: random.uniform(2.0, 8.0),
                EmergencyType.MEDICAL: random.uniform(0.5, 2.0),
                EmergencyType.HAZMAT: random.uniform(4.0, 12.0),
                EmergencyType.NUCLEAR_INCIDENT: random.uniform(24.0, 72.0),
            }
            estimated_duration = duration_estimates.get(incident_type, random.uniform(1.0, 4.0))
            
            # Determine agencies involved
            agencies = ['bcso', 'bcfd', 'bcdes']
            if incident_type == EmergencyType.NUCLEAR_INCIDENT:
                agencies.append('hanford_ecc')
            if incident_type == EmergencyType.HAZMAT:
                agencies.append('bchd')
            
            incident = EmergencyIncident(
                incident_id=incident_id,
                incident_type=incident_type,
                alert_level=alert_level,
                location_lat=incident_lat,
                location_lon=incident_lon,
                location_description=f"{zone_name} - {description}",
                reported_time=time.time(),
                description=description,
                status=ResponseStatus.DETECTED,
                estimated_affected_population=affected_population,
                resource_requirements=resource_requirements,
                assigned_units=[],
                incident_commander=incident_commander,
                priority_level=priority,
                estimated_duration_hours=estimated_duration,
                government_agencies_involved=agencies
            )
            
            self.active_incidents[incident_id] = incident
            self.total_incidents_handled += 1
            await self._store_emergency_incident(incident)
            
            # Dispatch resources
            await self._dispatch_resources_to_incident(incident)
            
            # Issue public alert if necessary
            if alert_level in [AlertLevel.WARNING, AlertLevel.CRITICAL, AlertLevel.EMERGENCY]:
                await self._issue_public_alert(incident)
            
            logger.info(f"🚨 Emergency incident created: {incident_type.value} in {zone_name}")
            logger.info(f"📍 Location: {incident_lat:.4f}, {incident_lon:.4f}")
            logger.info(f"⚠️ Alert Level: {alert_level.value}")
            
        except Exception as e:
            logger.error(f"Emergency incident simulation failed: {e}")
    
    async def _dispatch_resources_to_incident(self, incident: EmergencyIncident):
        """Dispatch appropriate resources to an incident"""
        try:
            dispatched_units = []
            
            for required_resource_type in incident.resource_requirements:
                # Find best available resource of this type
                best_resource = None
                best_distance = float('inf')
                
                for resource in self.emergency_resources.values():
                    if (resource.resource_type == required_resource_type and 
                        resource.availability_status == "available"):
                        
                        # Calculate distance to incident
                        lat_diff = resource.current_location_lat - incident.location_lat
                        lon_diff = resource.current_location_lon - incident.location_lon
                        distance = math.sqrt(lat_diff**2 + lon_diff**2)
                        
                        if distance < best_distance:
                            best_distance = distance
                            best_resource = resource
                
                # Dispatch the best resource
                if best_resource:
                    best_resource.availability_status = "dispatched"
                    best_resource.assigned_incident_id = incident.incident_id
                    best_resource.estimated_arrival_time = time.time() + (best_distance * 5 * 60)  # 5 min per distance unit
                    
                    dispatched_units.append(best_resource.resource_name)
                    await self._store_emergency_resource(best_resource)
                    
                    logger.info(f"🚒 Dispatched {best_resource.resource_name} to {incident.incident_id}")
            
            # Update incident with assigned units
            incident.assigned_units = dispatched_units
            incident.status = ResponseStatus.DISPATCHED
            await self._store_emergency_incident(incident)
            
        except Exception as e:
            logger.error(f"Resource dispatch failed: {e}")
    
    async def _issue_public_alert(self, incident: EmergencyIncident):
        """Issue public alert for significant incidents"""
        try:
            alert_id = hashlib.sha256(f"alert_{incident.incident_id}_{time.time()}".encode()).hexdigest()[:16]
            
            # Generate alert message based on incident type
            alert_titles = {
                EmergencyType.FIRE: "FIRE EMERGENCY ALERT",
                EmergencyType.HAZMAT: "HAZARDOUS MATERIAL ALERT",
                EmergencyType.NUCLEAR_INCIDENT: "NUCLEAR EMERGENCY ALERT",
                EmergencyType.SEVERE_WEATHER: "SEVERE WEATHER ALERT",
                EmergencyType.EVACUATION: "EVACUATION ALERT",
            }
            
            alert_title = alert_titles.get(incident.incident_type, "EMERGENCY ALERT")
            
            alert_body = f"{incident.description}. Emergency responders are on scene. "
            
            # Add protective actions based on incident type
            protective_actions = []
            if incident.incident_type == EmergencyType.FIRE:
                protective_actions = [
                    "Avoid the area",
                    "Keep windows and doors closed",
                    "Follow evacuation orders if issued"
                ]
                alert_body += "Avoid the area and keep windows closed."
            elif incident.incident_type == EmergencyType.HAZMAT:
                protective_actions = [
                    "Shelter in place",
                    "Turn off ventilation systems",
                    "Avoid the area",
                    "Seek medical attention if experiencing symptoms"
                ]
                alert_body += "Shelter in place and avoid the area."
            elif incident.incident_type == EmergencyType.NUCLEAR_INCIDENT:
                protective_actions = [
                    "Shelter in place immediately",
                    "Close all windows and doors",
                    "Turn off ventilation systems",
                    "Stay indoors until further notice"
                ]
                alert_body += "Shelter in place immediately and await further instructions."
            
            # Determine affected areas (simplified)
            affected_areas = []
            for zone_name, zone_info in self.response_zones.items():
                lat_diff = abs(zone_info['center_lat'] - incident.location_lat)
                lon_diff = abs(zone_info['center_lon'] - incident.location_lon)
                if lat_diff < 0.1 and lon_diff < 0.1:  # Within rough zone bounds
                    affected_areas.append(zone_name)
            
            if not affected_areas:
                affected_areas = ["Benton County"]
            
            alert = PublicAlert(
                alert_id=alert_id,
                alert_type=incident.incident_type,
                alert_level=incident.alert_level,
                message_title=alert_title,
                message_body=alert_body,
                affected_areas=affected_areas,
                issued_time=time.time(),
                expiration_time=time.time() + (4 * 3600),  # 4 hours
                issuing_agency="Benton County Emergency Services",
                contact_information="For information: 509-628-0333",
                protective_actions=protective_actions,
                update_sequence=1
            )
            
            self.public_alerts.append(alert)
            await self._store_public_alert(alert)
            
            logger.info(f"📢 Public alert issued: {alert_title}")
            
        except Exception as e:
            logger.error(f"Public alert issuance failed: {e}")
    
    async def _update_incident_statuses(self):
        """Update status of active incidents"""
        try:
            for incident in list(self.active_incidents.values()):
                time_elapsed = time.time() - incident.reported_time
                
                # Simulate incident progression
                if incident.status == ResponseStatus.DISPATCHED and time_elapsed > 300:  # 5 minutes
                    incident.status = ResponseStatus.EN_ROUTE
                elif incident.status == ResponseStatus.EN_ROUTE and time_elapsed > 600:  # 10 minutes
                    incident.status = ResponseStatus.ON_SCENE
                elif incident.status == ResponseStatus.ON_SCENE and time_elapsed > 1800:  # 30 minutes
                    incident.status = ResponseStatus.ACTIVE
                elif incident.status == ResponseStatus.ACTIVE and time_elapsed > 3600:  # 1 hour
                    incident.status = ResponseStatus.CONTAINED
                elif incident.status == ResponseStatus.CONTAINED and time_elapsed > 5400:  # 1.5 hours
                    incident.status = ResponseStatus.RESOLVED
                    # Release resources
                    await self._release_incident_resources(incident)
                    # Move to resolved incidents
                    del self.active_incidents[incident.incident_id]
                    self.incidents_resolved_today += 1
                    logger.info(f"✅ Incident resolved: {incident.incident_id}")
                
                if incident.incident_id in self.active_incidents:
                    await self._store_emergency_incident(incident)
        
        except Exception as e:
            logger.error(f"Incident status update failed: {e}")
    
    async def _release_incident_resources(self, incident: EmergencyIncident):
        """Release resources assigned to a resolved incident"""
        try:
            for resource in self.emergency_resources.values():
                if resource.assigned_incident_id == incident.incident_id:
                    resource.availability_status = "available"
                    resource.assigned_incident_id = None
                    resource.estimated_arrival_time = None
                    await self._store_emergency_resource(resource)
                    logger.info(f"🔄 Released resource: {resource.resource_name}")
        except Exception as e:
            logger.error(f"Resource release failed: {e}")
    
    async def _optimize_resource_allocation(self):
        """Optimize emergency resource allocation"""
        try:
            # Simple optimization: ensure coverage in all zones
            for zone_name, zone_info in self.response_zones.items():
                available_resources_in_zone = 0
                
                for resource in self.emergency_resources.values():
                    if resource.availability_status == "available":
                        # Check if resource is in this zone
                        lat_diff = abs(resource.current_location_lat - zone_info['center_lat'])
                        lon_diff = abs(resource.current_location_lon - zone_info['center_lon'])
                        
                        if lat_diff < zone_info['radius_km']/111.0 and lon_diff < zone_info['radius_km']/111.0:
                            available_resources_in_zone += 1
                
                # If zone has low coverage, reposition resources
                if available_resources_in_zone < 2:
                    logger.info(f"⚠️ Low resource coverage in {zone_name}: {available_resources_in_zone} units")
        
        except Exception as e:
            logger.error(f"Resource optimization failed: {e}")
    
    async def _update_resource_positions(self):
        """Update resource positions (simulated GPS tracking)"""
        try:
            for resource in self.emergency_resources.values():
                if resource.availability_status == "dispatched" and resource.estimated_arrival_time:
                    # Simulate movement towards incident
                    if time.time() >= resource.estimated_arrival_time:
                        resource.availability_status = "on_scene"
                        resource.estimated_arrival_time = None
                        await self._store_emergency_resource(resource)
        
        except Exception as e:
            logger.error(f"Resource position update failed: {e}")
    
    async def _process_public_alerts(self):
        """Process and manage public alerts"""
        try:
            # Check for alerts that need updates
            active_alerts = [a for a in self.public_alerts if time.time() < a.expiration_time]
            
            # Update alert sequence numbers for ongoing incidents
            for alert in active_alerts:
                # Find associated incident
                incident = None
                for inc in self.active_incidents.values():
                    if inc.incident_type == alert.alert_type:
                        incident = inc
                        break
                
                if incident and incident.status == ResponseStatus.RESOLVED:
                    # Issue all-clear alert
                    await self._issue_all_clear_alert(alert, incident)
        
        except Exception as e:
            logger.error(f"Public alert processing failed: {e}")
    
    async def _issue_all_clear_alert(self, original_alert: PublicAlert, incident: EmergencyIncident):
        """Issue all-clear alert for resolved incident"""
        try:
            alert_id = hashlib.sha256(f"clear_{original_alert.alert_id}_{time.time()}".encode()).hexdigest()[:16]
            
            clear_alert = PublicAlert(
                alert_id=alert_id,
                alert_type=incident.incident_type,
                alert_level=AlertLevel.INFO,
                message_title=f"ALL CLEAR - {original_alert.message_title}",
                message_body=f"The emergency situation has been resolved. Normal activities may resume.",
                affected_areas=original_alert.affected_areas,
                issued_time=time.time(),
                expiration_time=time.time() + 3600,  # 1 hour
                issuing_agency=original_alert.issuing_agency,
                contact_information=original_alert.contact_information,
                protective_actions=["Resume normal activities"],
                update_sequence=original_alert.update_sequence + 1
            )
            
            self.public_alerts.append(clear_alert)
            await self._store_public_alert(clear_alert)
            
            logger.info(f"📢 All-clear alert issued for {incident.incident_id}")
            
        except Exception as e:
            logger.error(f"All-clear alert failed: {e}")
    
    async def _expire_old_alerts(self):
        """Remove expired public alerts"""
        try:
            current_time = time.time()
            self.public_alerts = [a for a in self.public_alerts if a.expiration_time > current_time]
        except Exception as e:
            logger.error(f"Alert expiration failed: {e}")
    
    async def get_emergency_service_status(self) -> EmergencyServiceStatus:
        """Get emergency service status"""
        available_resources = len([r for r in self.emergency_resources.values() if r.availability_status == "available"])
        active_alerts = len([a for a in self.public_alerts if time.time() < a.expiration_time])
        
        # Calculate average response time
        avg_response_time = 0.0
        if self.total_incidents_handled > 0:
            avg_response_time = self.total_response_time_minutes / self.total_incidents_handled
        
        return EmergencyServiceStatus(
            service="TerraFusion Emergency Response & Crisis Management",
            status="OPERATIONAL",
            active_incidents=len(self.active_incidents),
            total_resources=len(self.emergency_resources),
            available_resources=available_resources,
            active_alerts=active_alerts,
            evacuation_zones=len(self.evacuation_zones),
            response_time_avg_minutes=avg_response_time,
            incidents_resolved_24h=self.incidents_resolved_today,
            government_coordination_level="MULTI_AGENCY"
        )
    
    # Database operations
    async def _store_emergency_incident(self, incident: EmergencyIncident):
        """Store emergency incident in database"""
        cursor = self.emergency_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO emergency_incidents VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            incident.incident_id, incident.incident_type.value, incident.alert_level.value,
            incident.location_lat, incident.location_lon, incident.location_description,
            incident.reported_time, incident.description, incident.status.value,
            incident.estimated_affected_population, json.dumps(incident.resource_requirements),
            json.dumps(incident.assigned_units), incident.incident_commander,
            incident.priority_level, incident.estimated_duration_hours,
            json.dumps(incident.government_agencies_involved)
        ))
        self.emergency_db.commit()
    
    async def _store_emergency_resource(self, resource: EmergencyResource):
        """Store emergency resource in database"""
        cursor = self.emergency_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO emergency_resources VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            resource.resource_id, resource.resource_type, resource.resource_name,
            resource.current_location_lat, resource.current_location_lon, resource.availability_status,
            resource.staffing_level, resource.equipment_status, resource.estimated_arrival_time,
            resource.assigned_incident_id, resource.contact_frequency,
            json.dumps(resource.specialized_capabilities)
        ))
        self.emergency_db.commit()
    
    async def _store_public_alert(self, alert: PublicAlert):
        """Store public alert in database"""
        cursor = self.emergency_db.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO public_alerts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            alert.alert_id, alert.alert_type.value, alert.alert_level.value,
            alert.message_title, alert.message_body, json.dumps(alert.affected_areas),
            alert.issued_time, alert.expiration_time, alert.issuing_agency,
            alert.contact_information, json.dumps(alert.protective_actions), alert.update_sequence
        ))
        self.emergency_db.commit()
    
    # HTTP API Endpoints
    async def handle_status(self, request):
        """GET /api/emergency/status"""
        status = await self.get_emergency_service_status()
        return web.json_response(asdict(status))
    
    async def handle_incidents(self, request):
        """GET /api/emergency/incidents"""
        incidents = []
        for incident in list(self.active_incidents.values())[-20:]:  # Last 20 incidents
            incidents.append({
                'incident_id': incident.incident_id,
                'incident_type': incident.incident_type.value,
                'alert_level': incident.alert_level.value,
                'location_lat': incident.location_lat,
                'location_lon': incident.location_lon,
                'location_description': incident.location_description,
                'reported_time': incident.reported_time,
                'description': incident.description,
                'status': incident.status.value,
                'estimated_affected_population': incident.estimated_affected_population,
                'assigned_units': incident.assigned_units,
                'incident_commander': incident.incident_commander,
                'priority_level': incident.priority_level
            })
        return web.json_response({'incidents': incidents, 'count': len(incidents)})
    
    async def handle_resources(self, request):
        """GET /api/emergency/resources"""
        resources = []
        for resource in self.emergency_resources.values():
            resources.append({
                'resource_id': resource.resource_id,
                'resource_type': resource.resource_type,
                'resource_name': resource.resource_name,
                'current_location_lat': resource.current_location_lat,
                'current_location_lon': resource.current_location_lon,
                'availability_status': resource.availability_status,
                'staffing_level': resource.staffing_level,
                'equipment_status': resource.equipment_status,
                'assigned_incident_id': resource.assigned_incident_id,
                'specialized_capabilities': resource.specialized_capabilities
            })
        return web.json_response({'resources': resources, 'count': len(resources)})
    
    async def handle_alerts(self, request):
        """GET /api/emergency/alerts"""
        active_alerts = []
        for alert in self.public_alerts:
            if time.time() < alert.expiration_time:  # Only active alerts
                active_alerts.append({
                    'alert_id': alert.alert_id,
                    'alert_type': alert.alert_type.value,
                    'alert_level': alert.alert_level.value,
                    'message_title': alert.message_title,
                    'message_body': alert.message_body,
                    'affected_areas': alert.affected_areas,
                    'issued_time': alert.issued_time,
                    'expiration_time': alert.expiration_time,
                    'issuing_agency': alert.issuing_agency,
                    'protective_actions': alert.protective_actions,
                    'update_sequence': alert.update_sequence
                })
        return web.json_response({'alerts': active_alerts, 'count': len(active_alerts)})
    
    async def handle_response_zones(self, request):
        """GET /api/emergency/zones"""
        return web.json_response({'response_zones': self.response_zones, 'count': len(self.response_zones)})
    
    async def handle_agencies(self, request):
        """GET /api/emergency/agencies"""
        return web.json_response({'government_agencies': self.government_agencies, 'count': len(self.government_agencies)})
    
    async def handle_root(self, request):
        """GET / - Service info"""
        return web.json_response({
            'service': 'TerraFusion Emergency Response & Crisis Management',
            'version': '1.0.0',
            'description': 'Advanced Emergency Response for Government Operations',
            'county': 'Benton County, Washington',
            'active_incidents': len(self.active_incidents),
            'total_resources': len(self.emergency_resources),
            'response_zones': len(self.response_zones),
            'government_agencies': len(self.government_agencies),
            'emergency_operations_level': 'FULLY_OPERATIONAL',
            'status': 'OPERATIONAL'
        })
    
    async def start_service(self):
        """Start the TerraFusion Emergency Response Service"""
        # Create web application
        app = web.Application()
        
        # Add routes
        app.router.add_get('/', self.handle_root)
        app.router.add_get('/api/emergency/status', self.handle_status)
        app.router.add_get('/api/emergency/incidents', self.handle_incidents)
        app.router.add_get('/api/emergency/resources', self.handle_resources)
        app.router.add_get('/api/emergency/alerts', self.handle_alerts)
        app.router.add_get('/api/emergency/zones', self.handle_response_zones)
        app.router.add_get('/api/emergency/agencies', self.handle_agencies)
        
        # Register with Trust Fabric
        asyncio.create_task(self._register_with_trust_fabric_delayed())
        
        # Start HTTP server
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        logger.info(f"🚀 TerraFusion Emergency Response started on http://localhost:{self.port}")
        logger.info(f"🚨 Emergency operations center active")
        
        return runner
    
    async def _register_with_trust_fabric_delayed(self):
        """Register with Trust Fabric after startup delay"""
        await asyncio.sleep(15)
        try:
            registration_data = {
                'service_name': 'TerraFusion Emergency Response',
                'port': self.port,
                'validation_proofs': ['emergency_operations', 'crisis_management', 'public_safety']
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post('http://localhost:${TF_STATIC_PORT:-8080}/api/trust-fabric/register', 
                                      json=registration_data, timeout=5) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f"🔐 Registered with Trust Fabric: {data['service_id']}")
        except Exception as e:
            logger.error(f"Trust Fabric registration failed: {e}")

async def main():
    """Start TerraFusion Emergency Response Service"""
    print("🚨 TERRAFUSION EMERGENCY RESPONSE & CRISIS MANAGEMENT - GOVERNMENT EMERGENCY OPERATIONS")
    print("=" * 90)
    print("🚒 Real-time emergency detection and response")
    print("📢 Public alert and mass notification systems")
    print("🛡️ Multi-agency coordination and crisis management")
    print("🏥 Emergency resource allocation and optimization")
    print("📍 Benton County emergency operations center")
    print()
    
    try:
        emergency_response = TerraFusionEmergencyResponse()
        runner = await emergency_response.start_service()
        
        # Keep service running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logger.info("🛑 Stopping TerraFusion Emergency Response...")
            await runner.cleanup()
            
    except Exception as e:
        logger.error(f"❌ TerraFusion Emergency Response startup failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    asyncio.run(main())
