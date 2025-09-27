#!/usr/bin/env python3
"""
TerraFusion OS Harris PACS Mock Server
Government-grade simulation of Harris PACS system for Benton County testing

Simulates Harris PACS modules:
- CAMA (Computer Assisted Mass Appraisal)
- Real Estate Management
- Assessment Processing
- Collections Management
- Permits and Licensing

Benton County specific data structures and workflows
"""

import asyncio
import json
import logging
import os
import random
import time
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp
from aiohttp import web
import aiosqlite
from faker import Faker

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'DEBUG')),
    format='%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s] %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
HARRIS_PACS_MOCK_MODE = os.getenv('HARRIS_PACS_MOCK_MODE', 'comprehensive')
BENTON_COUNTY_SIMULATION = os.getenv('BENTON_COUNTY_SIMULATION', 'true').lower() == 'true'
GOVERNMENT_COMPLIANCE_MODE = os.getenv('GOVERNMENT_COMPLIANCE_MODE', 'true').lower() == 'true'
API_RESPONSE_DELAY_MS = int(os.getenv('API_RESPONSE_DELAY_MS', 100))
FAILURE_INJECTION_RATE = float(os.getenv('FAILURE_INJECTION_RATE', 0.02))  # 2% failure rate

# Initialize Faker for realistic test data
fake = Faker('en_US')

class HarrisPACSModule(Enum):
    CAMA = "CAMA"
    REAL_ESTATE = "RealEstate" 
    ASSESSMENT = "Assessment"
    COLLECTIONS = "Collections"
    PERMITS = "Permits"

class PropertyType(Enum):
    RESIDENTIAL = "Residential"
    COMMERCIAL = "Commercial"
    INDUSTRIAL = "Industrial"
    AGRICULTURAL = "Agricultural"
    EXEMPT = "Exempt"

@dataclass
class BentonCountyProperty:
    """Benton County property record structure"""
    parcel_number: str
    property_type: PropertyType
    owner_name: str
    situs_address: str
    legal_description: str
    assessed_value: float
    market_value: float
    tax_year: int
    levy_code: str
    exemptions: List[str]
    last_sale_date: Optional[str]
    last_sale_price: Optional[float]
    square_footage: Optional[int]
    year_built: Optional[int]
    zoning: str
    school_district: str
    fire_district: str
    created_date: str
    modified_date: str
    compliance_flags: List[str]

@dataclass
class AssessmentRecord:
    """Property assessment record"""
    assessment_id: str
    parcel_number: str
    tax_year: int
    land_value: float
    improvement_value: float
    total_assessed_value: float
    assessment_date: str
    assessor_name: str
    appeal_status: str
    compliance_verified: bool

@dataclass
class TaxCalculation:
    """Tax calculation record"""
    calculation_id: str
    parcel_number: str
    tax_year: int
    assessed_value: float
    levy_rate: float
    tax_amount: float
    exemption_amount: float
    net_tax_amount: float
    due_date: str
    payment_status: str

class HarrisPACSMockDatabase:
    """In-memory database simulation for Harris PACS"""
    
    def __init__(self):
        self.properties: Dict[str, BentonCountyProperty] = {}
        self.assessments: Dict[str, AssessmentRecord] = {}
        self.tax_calculations: Dict[str, TaxCalculation] = {}
        self.api_call_count = 0
        self.failure_count = 0
        
    async def initialize(self):
        """Initialize with Benton County test data"""
        logger.info("Initializing Harris PACS mock database with Benton County data...")
        
        # Generate realistic Benton County properties
        benton_cities = ["Richland", "Kennewick", "Pasco", "West Richland", "Benton City", "Prosser"]
        school_districts = ["Richland SD", "Kennewick SD", "Pasco SD", "Finley SD", "Kiona-Benton SD"]
        
        for i in range(10000):  # 10,000 test properties
            parcel_number = f"BC{i+1:06d}"
            
            property_type = random.choice(list(PropertyType))
            city = random.choice(benton_cities)
            
            # Generate realistic assessed values based on Benton County market
            if property_type == PropertyType.RESIDENTIAL:
                assessed_value = random.uniform(180000, 650000)
                market_value = assessed_value * random.uniform(1.0, 1.2)
            elif property_type == PropertyType.COMMERCIAL:
                assessed_value = random.uniform(400000, 2500000)
                market_value = assessed_value * random.uniform(1.0, 1.15)
            elif property_type == PropertyType.AGRICULTURAL:
                assessed_value = random.uniform(50000, 300000)
                market_value = assessed_value * random.uniform(1.0, 1.3)
            else:
                assessed_value = random.uniform(100000, 800000)
                market_value = assessed_value * random.uniform(1.0, 1.25)
            
            property_record = BentonCountyProperty(
                parcel_number=parcel_number,
                property_type=property_type,
                owner_name=f"{fake.first_name()} {fake.last_name()}",
                situs_address=f"{fake.street_address()}, {city}, WA {fake.zipcode_in_state('WA')}",
                legal_description=f"LOT {random.randint(1,50)} BLK {random.randint(1,20)} {fake.company().upper()} ADDITION",
                assessed_value=round(assessed_value, 2),
                market_value=round(market_value, 2),
                tax_year=2024,
                levy_code=f"L{random.randint(100, 999)}",
                exemptions=self._generate_exemptions(property_type),
                last_sale_date=fake.date_between(start_date='-5y', end_date='today').isoformat() if random.random() > 0.3 else None,
                last_sale_price=round(market_value * random.uniform(0.8, 1.2), 2) if random.random() > 0.3 else None,
                square_footage=random.randint(800, 4500) if property_type == PropertyType.RESIDENTIAL else None,
                year_built=random.randint(1950, 2023) if property_type in [PropertyType.RESIDENTIAL, PropertyType.COMMERCIAL] else None,
                zoning=self._get_zoning_code(property_type),
                school_district=random.choice(school_districts),
                fire_district=f"Benton County Fire District #{random.randint(1, 8)}",
                created_date=fake.date_between(start_date='-10y', end_date='-1y').isoformat(),
                modified_date=fake.date_between(start_date='-1y', end_date='today').isoformat(),
                compliance_flags=self._generate_compliance_flags()
            )
            
            self.properties[parcel_number] = property_record
            
            # Generate corresponding assessment record
            assessment_record = AssessmentRecord(
                assessment_id=f"ASS{i+1:06d}",
                parcel_number=parcel_number,
                tax_year=2024,
                land_value=round(assessed_value * 0.3, 2),
                improvement_value=round(assessed_value * 0.7, 2),
                total_assessed_value=assessed_value,
                assessment_date=fake.date_between(start_date='-1y', end_date='today').isoformat(),
                assessor_name="Benton County Assessor",
                appeal_status=random.choice(["None", "Pending", "Resolved", "Denied"]),
                compliance_verified=random.random() > 0.05  # 95% compliance rate
            )
            
            self.assessments[f"ASS{i+1:06d}"] = assessment_record
            
            # Generate tax calculation
            levy_rate = random.uniform(0.008, 0.015)  # Typical Benton County levy rates
            exemption_amount = sum([random.uniform(5000, 25000) for _ in property_record.exemptions])
            tax_amount = (assessed_value - exemption_amount) * levy_rate
            
            tax_record = TaxCalculation(
                calculation_id=f"TAX{i+1:06d}",
                parcel_number=parcel_number,
                tax_year=2024,
                assessed_value=assessed_value,
                levy_rate=levy_rate,
                tax_amount=round(tax_amount, 2),
                exemption_amount=round(exemption_amount, 2),
                net_tax_amount=round(max(0, tax_amount), 2),
                due_date=(datetime.now() + timedelta(days=random.randint(30, 365))).date().isoformat(),
                payment_status=random.choice(["Paid", "Partial", "Unpaid", "Delinquent"])
            )
            
            self.tax_calculations[f"TAX{i+1:06d}"] = tax_record
        
        logger.info(f"Generated {len(self.properties)} Benton County test properties")
    
    def _generate_exemptions(self, property_type: PropertyType) -> List[str]:
        """Generate realistic property exemptions"""
        exemptions = []
        
        if random.random() < 0.15:  # 15% get homestead exemption
            exemptions.append("Homestead")
        
        if property_type == PropertyType.AGRICULTURAL and random.random() < 0.8:
            exemptions.append("Agricultural")
        
        if property_type == PropertyType.EXEMPT:
            exemptions.extend(["Government", "Non-Profit"])
        
        if random.random() < 0.05:  # 5% get senior citizen exemption
            exemptions.append("Senior Citizen")
        
        if random.random() < 0.03:  # 3% get disabled veteran exemption
            exemptions.append("Disabled Veteran")
        
        return exemptions
    
    def _get_zoning_code(self, property_type: PropertyType) -> str:
        """Get appropriate zoning code for property type"""
        zoning_codes = {
            PropertyType.RESIDENTIAL: ["R-1", "R-2", "R-3", "R-MH"],
            PropertyType.COMMERCIAL: ["C-1", "C-2", "C-3", "CBD"],
            PropertyType.INDUSTRIAL: ["I-1", "I-2", "I-H"],
            PropertyType.AGRICULTURAL: ["A-1", "A-2", "RR"],
            PropertyType.EXEMPT: ["P", "OS", "I"]
        }
        return random.choice(zoning_codes.get(property_type, ["UNK"]))
    
    def _generate_compliance_flags(self) -> List[str]:
        """Generate compliance flags for government auditing"""
        flags = []
        
        if random.random() < 0.02:  # 2% data quality issues
            flags.append("DATA_QUALITY_REVIEW")
        
        if random.random() < 0.01:  # 1% compliance review needed
            flags.append("COMPLIANCE_REVIEW")
        
        if random.random() < 0.005:  # 0.5% audit flag
            flags.append("AUDIT_REQUIRED")
        
        return flags

class HarrisPACSMockServer:
    """Mock Harris PACS server for testing"""
    
    def __init__(self):
        self.database = HarrisPACSMockDatabase()
        self.server_start_time = datetime.now(timezone.utc)
        
    async def initialize(self):
        """Initialize the mock server"""
        await self.database.initialize()
        logger.info("Harris PACS Mock Server initialized")
    
    def _inject_failure(self) -> bool:
        """Randomly inject failures for testing resilience"""
        return random.random() < FAILURE_INJECTION_RATE
    
    def _simulate_processing_delay(self):
        """Simulate realistic API response delays"""
        delay_ms = API_RESPONSE_DELAY_MS + random.randint(-20, 50)
        time.sleep(max(0, delay_ms) / 1000.0)
    
    async def health_check(self, request):
        """Health check endpoint"""
        uptime_seconds = (datetime.now(timezone.utc) - self.server_start_time).total_seconds()
        
        health_data = {
            "status": "healthy",
            "uptime_seconds": uptime_seconds,
            "total_properties": len(self.database.properties),
            "api_calls": self.database.api_call_count,
            "failure_rate": self.database.failure_count / max(1, self.database.api_call_count),
            "harris_pacs_modules": [module.value for module in HarrisPACSModule],
            "benton_county_simulation": BENTON_COUNTY_SIMULATION,
            "government_compliance": GOVERNMENT_COMPLIANCE_MODE,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return web.json_response(health_data)
    
    async def get_property_by_parcel(self, request):
        """Get property by parcel number"""
        self.database.api_call_count += 1
        
        if self._inject_failure():
            self.database.failure_count += 1
            return web.json_response(
                {"error": "Harris PACS temporary service unavailable"},
                status=503
            )
        
        self._simulate_processing_delay()
        
        parcel_number = request.match_info['parcel_number']
        
        if parcel_number not in self.database.properties:
            return web.json_response(
                {"error": f"Property not found for parcel {parcel_number}"},
                status=404
            )
        
        property_record = self.database.properties[parcel_number]
        
        response_data = {
            "harris_pacs_module": "CAMA",
            "county": "Benton",
            "state": "Washington",
            "property": asdict(property_record),
            "government_compliance": {
                "fisma_validated": True,
                "audit_trail_id": f"AT{int(time.time())}{random.randint(100,999)}",
                "data_classification": "CUI",  # Controlled Unclassified Information
                "access_logged": True
            },
            "response_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return web.json_response(response_data)
    
    async def search_properties(self, request):
        """Search properties with various criteria"""
        self.database.api_call_count += 1
        
        if self._inject_failure():
            self.database.failure_count += 1
            return web.json_response(
                {"error": "Harris PACS search service temporarily unavailable"},
                status=503
            )
        
        self._simulate_processing_delay()
        
        query_params = dict(request.query)
        
        # Parse search criteria
        owner_name = query_params.get('owner_name', '').upper()
        property_type = query_params.get('property_type', '')
        address = query_params.get('address', '').upper()
        min_value = float(query_params.get('min_assessed_value', 0))
        max_value = float(query_params.get('max_assessed_value', float('inf')))
        limit = min(int(query_params.get('limit', 100)), 1000)  # Max 1000 results
        
        # Filter properties
        matching_properties = []
        
        for parcel, prop in self.database.properties.items():
            matches = True
            
            if owner_name and owner_name not in prop.owner_name.upper():
                matches = False
            
            if property_type and prop.property_type.value != property_type:
                matches = False
            
            if address and address not in prop.situs_address.upper():
                matches = False
            
            if not (min_value <= prop.assessed_value <= max_value):
                matches = False
            
            if matches:
                matching_properties.append(asdict(prop))
                
                if len(matching_properties) >= limit:
                    break
        
        response_data = {
            "harris_pacs_module": "CAMA",
            "search_criteria": query_params,
            "total_matches": len(matching_properties),
            "properties": matching_properties,
            "government_compliance": {
                "search_logged": True,
                "audit_trail_id": f"ST{int(time.time())}{random.randint(100,999)}",
                "user_authorized": True
            },
            "response_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return web.json_response(response_data)
    
    async def get_assessment_record(self, request):
        """Get assessment record for a property"""
        self.database.api_call_count += 1
        
        if self._inject_failure():
            self.database.failure_count += 1
            return web.json_response(
                {"error": "Assessment service temporarily unavailable"},
                status=503
            )
        
        self._simulate_processing_delay()
        
        parcel_number = request.match_info['parcel_number']
        
        # Find assessment record
        assessment_record = None
        for assessment_id, assessment in self.database.assessments.items():
            if assessment.parcel_number == parcel_number:
                assessment_record = assessment
                break
        
        if not assessment_record:
            return web.json_response(
                {"error": f"Assessment not found for parcel {parcel_number}"},
                status=404
            )
        
        response_data = {
            "harris_pacs_module": "Assessment",
            "county": "Benton",
            "assessment": asdict(assessment_record),
            "government_compliance": {
                "valuation_certified": True,
                "assessor_licensed": True,
                "audit_trail_id": f"AS{int(time.time())}{random.randint(100,999)}"
            },
            "response_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return web.json_response(response_data)
    
    async def calculate_taxes(self, request):
        """Calculate taxes for a property"""
        self.database.api_call_count += 1
        
        if self._inject_failure():
            self.database.failure_count += 1
            return web.json_response(
                {"error": "Tax calculation service temporarily unavailable"},
                status=503
            )
        
        self._simulate_processing_delay()
        
        parcel_number = request.match_info['parcel_number']
        
        # Find tax calculation record
        tax_record = None
        for calc_id, calculation in self.database.tax_calculations.items():
            if calculation.parcel_number == parcel_number:
                tax_record = calculation
                break
        
        if not tax_record:
            return web.json_response(
                {"error": f"Tax calculation not found for parcel {parcel_number}"},
                status=404
            )
        
        response_data = {
            "harris_pacs_module": "Collections",
            "county": "Benton",
            "tax_calculation": asdict(tax_record),
            "levy_details": {
                "county_levy": round(tax_record.tax_amount * 0.4, 2),
                "school_levy": round(tax_record.tax_amount * 0.35, 2),
                "city_levy": round(tax_record.tax_amount * 0.15, 2),
                "fire_levy": round(tax_record.tax_amount * 0.05, 2),
                "other_levies": round(tax_record.tax_amount * 0.05, 2)
            },
            "government_compliance": {
                "levy_certified": True,
                "calculation_audited": True,
                "appeal_period": "30_days",
                "audit_trail_id": f"TX{int(time.time())}{random.randint(100,999)}"
            },
            "response_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return web.json_response(response_data)
    
    async def update_property(self, request):
        """Update property information"""
        self.database.api_call_count += 1
        
        if self._inject_failure():
            self.database.failure_count += 1
            return web.json_response(
                {"error": "Property update service temporarily unavailable"},
                status=503
            )
        
        self._simulate_processing_delay()
        
        parcel_number = request.match_info['parcel_number']
        
        if parcel_number not in self.database.properties:
            return web.json_response(
                {"error": f"Property not found for parcel {parcel_number}"},
                status=404
            )
        
        try:
            update_data = await request.json()
        except json.JSONDecodeError:
            return web.json_response(
                {"error": "Invalid JSON in request body"},
                status=400
            )
        
        # Update property record
        property_record = self.database.properties[parcel_number]
        
        # Update allowed fields
        updatable_fields = ['owner_name', 'situs_address', 'assessed_value', 'market_value', 'exemptions']
        
        for field in updatable_fields:
            if field in update_data:
                setattr(property_record, field, update_data[field])
        
        property_record.modified_date = datetime.now(timezone.utc).date().isoformat()
        
        response_data = {
            "harris_pacs_module": "CAMA",
            "operation": "update_property",
            "parcel_number": parcel_number,
            "updated_property": asdict(property_record),
            "government_compliance": {
                "update_authorized": True,
                "change_logged": True,
                "audit_trail_id": f"UP{int(time.time())}{random.randint(100,999)}",
                "data_integrity_verified": True
            },
            "response_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return web.json_response(response_data)
    
    async def get_compliance_report(self, request):
        """Generate government compliance report"""
        self.database.api_call_count += 1
        
        if not GOVERNMENT_COMPLIANCE_MODE:
            return web.json_response(
                {"error": "Compliance reporting not enabled"},
                status=501
            )
        
        self._simulate_processing_delay()
        
        # Calculate compliance metrics
        total_properties = len(self.database.properties)
        compliant_properties = sum(1 for p in self.database.properties.values() if not p.compliance_flags)
        compliance_rate = compliant_properties / total_properties if total_properties > 0 else 0
        
        # FISMA control compliance
        fisma_controls = {
            "AC-1": {"status": "Implemented", "score": 95.5},  # Access Control Policy
            "AU-1": {"status": "Implemented", "score": 98.2},  # Audit and Accountability Policy
            "IA-1": {"status": "Implemented", "score": 97.1},  # Identification and Authentication Policy
            "SC-1": {"status": "Implemented", "score": 96.8},  # System and Communications Protection
            "SI-1": {"status": "Implemented", "score": 94.7}   # System and Information Integrity
        }
        
        response_data = {
            "harris_pacs_module": "Compliance",
            "county": "Benton",
            "compliance_frameworks": ["FISMA", "NIST", "FIPS-140-2"],
            "assessment_date": datetime.now(timezone.utc).date().isoformat(),
            "metrics": {
                "total_properties": total_properties,
                "compliant_properties": compliant_properties,
                "compliance_rate": round(compliance_rate * 100, 2),
                "data_quality_score": 97.8,
                "security_posture_score": 96.4,
                "audit_readiness_score": 98.1
            },
            "fisma_controls": fisma_controls,
            "government_standards": {
                "nist_framework_aligned": True,
                "fips_140_2_compliant": True,
                "section_508_accessible": True,
                "government_data_standards": True
            },
            "audit_trail": {
                "report_id": f"CR{int(time.time())}{random.randint(1000,9999)}",
                "generated_by": "Harris PACS Compliance System",
                "digital_signature": f"SHA256:{fake.sha256()[:16]}...",
                "tamper_evident": True
            },
            "response_timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return web.json_response(response_data)
    
    async def system_status(self, request):
        """Get detailed system status"""
        self.database.api_call_count += 1
        
        uptime_seconds = (datetime.now(timezone.utc) - self.server_start_time).total_seconds()
        
        status_data = {
            "harris_pacs_system": "Mock Simulation",
            "version": "1.0.0-mock",
            "county": "Benton",
            "state": "Washington",
            "modules": {
                module.value: {
                    "status": "operational",
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                    "performance_score": round(random.uniform(95, 99), 1)
                }
                for module in HarrisPACSModule
            },
            "database": {
                "total_properties": len(self.database.properties),
                "total_assessments": len(self.database.assessments),
                "total_tax_calculations": len(self.database.tax_calculations),
                "data_integrity_score": 99.7
            },
            "api_metrics": {
                "total_requests": self.database.api_call_count,
                "failure_count": self.database.failure_count,
                "success_rate": round((1 - (self.database.failure_count / max(1, self.database.api_call_count))) * 100, 2),
                "average_response_time_ms": API_RESPONSE_DELAY_MS
            },
            "government_compliance": {
                "fisma_compliant": GOVERNMENT_COMPLIANCE_MODE,
                "audit_logging_enabled": True,
                "data_encryption": "AES-256",
                "access_control": "RBAC"
            },
            "uptime_seconds": uptime_seconds,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        return web.json_response(status_data)

async def create_app():
    """Create and configure the web application"""
    app = web.Application()
    
    # Initialize the mock server
    mock_server = HarrisPACSMockServer()
    await mock_server.initialize()
    
    # Store server instance in app for access in handlers
    app['mock_server'] = mock_server
    
    # Health and status endpoints
    app.router.add_get('/health', mock_server.health_check)
    app.router.add_get('/status', mock_server.system_status)
    
    # Property endpoints
    app.router.add_get('/api/properties/{parcel_number}', mock_server.get_property_by_parcel)
    app.router.add_get('/api/properties', mock_server.search_properties)
    app.router.add_put('/api/properties/{parcel_number}', mock_server.update_property)
    
    # Assessment endpoints
    app.router.add_get('/api/assessments/{parcel_number}', mock_server.get_assessment_record)
    
    # Tax calculation endpoints
    app.router.add_get('/api/taxes/{parcel_number}', mock_server.calculate_taxes)
    
    # Compliance and reporting endpoints
    app.router.add_get('/api/compliance/report', mock_server.get_compliance_report)
    
    # Add CORS headers for testing
    async def add_cors_headers(request, response):
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    app.middlewares.append(add_cors_headers)
    
    return app

async def main():
    """Main function to start the Harris PACS mock server"""
    logger.info("Starting Harris PACS Mock Server for Benton County...")
    
    app = await create_app()
    
    # Start the web server
    runner = web.AppRunner(app)
    await runner.setup()
    
    site = web.TCPSite(runner, '0.0.0.0', 8080)
    await site.start()
    
    logger.info("Harris PACS Mock Server started on http://0.0.0.0:\${{TF_ADMIN_PORT:-8080}}")
    logger.info(f"Benton County simulation: {BENTON_COUNTY_SIMULATION}")
    logger.info(f"Government compliance mode: {GOVERNMENT_COMPLIANCE_MODE}")
    logger.info(f"API response delay: {API_RESPONSE_DELAY_MS}ms")
    logger.info(f"Failure injection rate: {FAILURE_INJECTION_RATE:.1%}")
    
    # Keep the server running
    try:
        while True:
            await asyncio.sleep(3600)  # Sleep for 1 hour
    except KeyboardInterrupt:
        logger.info("Shutting down Harris PACS Mock Server...")
    finally:
        await runner.cleanup()

if __name__ == "__main__":
    asyncio.run(main())