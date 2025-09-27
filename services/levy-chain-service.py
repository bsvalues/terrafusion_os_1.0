#!/usr/bin/env python3
"""
TerraFusion Levy Chain Service
Property tax levy calculation microservice for TerraFusion OS

Part of the TerraFusion government operating system ecosystem.
Handles property tax assessments, levy calculations, and tax roll generation.
"""

import asyncio
import json
import os
import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from aiohttp import web, ClientSession

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('TerraFusion.LevyChain')

@dataclass
class Property:
    """Property record for tax assessment"""
    parcel_id: str
    address: str
    assessed_value: float
    owner_name: str
    property_type: str
    acreage: float
    tax_district: str
    exemptions: List[str]
    last_assessment_date: str

@dataclass
class LevyCalculation:
    """Levy calculation result"""
    parcel_id: str
    assessed_value: float
    total_levy_rate: float
    total_tax_due: float
    breakdown: Dict[str, float]
    due_date: str
    calculation_date: str

@dataclass
class LevyChainStatus:
    """Levy Chain service status"""
    status: str
    properties_loaded: int
    calculations_today: int
    last_calculation: Optional[str]
    uptime_seconds: int
    version: str

class TerraFusionLevyChain:
    """TerraFusion Levy Chain Service - Property Tax Assessment & Levy Calculations"""
    
    def __init__(self):
        self.start_time = datetime.utcnow()
        self.properties: Dict[str, Property] = {}
        self.calculations: List[LevyCalculation] = {}
        self.levy_rates = {
            "county_general": 0.008450,
            "county_road": 0.002100,
            "fire_district": 0.001250,
            "library_district": 0.000750,
            "school_district": 0.012500,
            "port_district": 0.000650,
            "hospital_district": 0.000980
        }
        
        # Anti-hardcoding enforcement - use environment variables
        self.port = int(os.getenv('TF_LEVY_PORT') or self._fail_no_port())
        logger.info(f"🏦 TerraFusion Levy Chain starting on port {self.port}")
        
        # Initialize database
        self.init_database()
        self.load_sample_properties()
    
    def _fail_no_port(self):
        """Anti-hardcoding enforcement: Fail if no port specified"""
        raise ValueError("❌ ANTI-HARDCODING: TF_LEVY_PORT environment variable must be set. No hardcoded ports allowed in TerraFusion OS.")
    
    def init_database(self):
        """Initialize SQLite database for levy calculations"""
        self.db_path = "levy_chain.db"
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS properties (
                    parcel_id TEXT PRIMARY KEY,
                    address TEXT,
                    assessed_value REAL,
                    owner_name TEXT,
                    property_type TEXT,
                    acreage REAL,
                    tax_district TEXT,
                    exemptions TEXT,
                    last_assessment_date TEXT
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS levy_calculations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    parcel_id TEXT,
                    assessed_value REAL,
                    total_levy_rate REAL,
                    total_tax_due REAL,
                    breakdown TEXT,
                    due_date TEXT,
                    calculation_date TEXT,
                    FOREIGN KEY (parcel_id) REFERENCES properties (parcel_id)
                )
            """)
            
            conn.commit()
        
        logger.info("💾 Levy Chain database initialized")
    
    def load_sample_properties(self):
        """Load sample Benton County properties for demonstration"""
        sample_properties = [
            Property(
                parcel_id="BC-12345-001",
                address="123 Main St, Richland, WA 99354",
                assessed_value=450000.0,
                owner_name="John & Jane Smith",
                property_type="Residential",
                acreage=0.25,
                tax_district="Richland",
                exemptions=["homestead"],
                last_assessment_date="2025-01-01"
            ),
            Property(
                parcel_id="BC-12346-002",
                address="456 Oak Ave, Kennewick, WA 99336",
                assessed_value=320000.0,
                owner_name="Robert Johnson",
                property_type="Residential",
                acreage=0.18,
                tax_district="Kennewick",
                exemptions=[],
                last_assessment_date="2025-01-01"
            ),
            Property(
                parcel_id="BC-12347-003",
                address="789 Industrial Blvd, Pasco, WA 99301",
                assessed_value=1250000.0,
                owner_name="ABC Manufacturing LLC",
                property_type="Commercial",
                acreage=2.5,
                tax_district="Pasco",
                exemptions=[],
                last_assessment_date="2025-01-01"
            )
        ]
        
        for property_record in sample_properties:
            self.properties[property_record.parcel_id] = property_record
        
        logger.info(f"🏘️  Loaded {len(sample_properties)} sample properties for Benton County")
    
    def calculate_levy(self, parcel_id: str) -> Optional[LevyCalculation]:
        """Calculate property tax levy for a specific parcel"""
        if parcel_id not in self.properties:
            return None
        
        property_record = self.properties[parcel_id]
        assessed_value = property_record.assessed_value
        
        # Apply exemptions
        if "homestead" in property_record.exemptions:
            assessed_value *= 0.95  # 5% homestead exemption
        
        # Calculate levy breakdown
        breakdown = {}
        total_rate = 0.0
        
        for levy_type, rate in self.levy_rates.items():
            breakdown[levy_type] = assessed_value * rate
            total_rate += rate
        
        total_tax_due = assessed_value * total_rate
        due_date = (datetime.utcnow() + timedelta(days=180)).strftime("%Y-%m-%d")
        
        calculation = LevyCalculation(
            parcel_id=parcel_id,
            assessed_value=assessed_value,
            total_levy_rate=total_rate,
            total_tax_due=total_tax_due,
            breakdown=breakdown,
            due_date=due_date,
            calculation_date=datetime.utcnow().isoformat()
        )
        
        self.calculations[parcel_id] = calculation
        logger.info(f"💰 Calculated levy for {parcel_id}: ${total_tax_due:.2f}")
        
        return calculation
    
    def get_status(self) -> LevyChainStatus:
        """Get service status"""
        uptime = (datetime.utcnow() - self.start_time).total_seconds()
        last_calc = None
        if self.calculations:
            last_calc = max(calc.calculation_date for calc in self.calculations.values())
        
        return LevyChainStatus(
            status="operational",
            properties_loaded=len(self.properties),
            calculations_today=len(self.calculations),
            last_calculation=last_calc,
            uptime_seconds=int(uptime),
            version="1.0.0"
        )
    
    # HTTP API Endpoints
    async def handle_status(self, request):
        """GET /api/levy/status"""
        status = self.get_status()
        return web.json_response(asdict(status))
    
    async def handle_health(self, request):
        """GET /health"""
        return web.json_response({
            "service": "levy_chain",
            "status": "available",
            "timestamp": datetime.utcnow().isoformat()
        })
    
    async def handle_properties(self, request):
        """GET /api/levy/properties"""
        properties = [asdict(prop) for prop in self.properties.values()]
        return web.json_response({
            "properties": properties,
            "count": len(properties)
        })
    
    async def handle_calculate_levy(self, request):
        """POST /api/levy/calculate"""
        try:
            data = await request.json()
            parcel_id = data.get('parcel_id')
            
            if not parcel_id:
                return web.json_response(
                    {"error": "parcel_id required"}, 
                    status=400
                )
            
            calculation = self.calculate_levy(parcel_id)
            
            if not calculation:
                return web.json_response(
                    {"error": f"Property {parcel_id} not found"}, 
                    status=404
                )
            
            return web.json_response(asdict(calculation))
            
        except Exception as e:
            logger.error(f"Error calculating levy: {e}")
            return web.json_response(
                {"error": str(e)}, 
                status=500
            )
    
    async def handle_get_calculation(self, request):
        """GET /api/levy/calculations/{parcel_id}"""
        parcel_id = request.match_info['parcel_id']
        
        if parcel_id not in self.calculations:
            return web.json_response(
                {"error": f"No calculation found for {parcel_id}"}, 
                status=404
            )
        
        calculation = self.calculations[parcel_id]
        return web.json_response(asdict(calculation))
    
    async def handle_levy_rates(self, request):
        """GET /api/levy/rates"""
        return web.json_response({
            "levy_rates": self.levy_rates,
            "total_rate": sum(self.levy_rates.values()),
            "last_updated": "2025-01-01"
        })
    
    async def setup_routes(self, app):
        """Setup HTTP routes"""
        app.router.add_get("/health", self.handle_health)
        app.router.add_get("/api/levy/status", self.handle_status)
        app.router.add_get("/api/levy/properties", self.handle_properties)
        app.router.add_post("/api/levy/calculate", self.handle_calculate_levy)
        app.router.add_get("/api/levy/calculations/{parcel_id}", self.handle_get_calculation)
        app.router.add_get("/api/levy/rates", self.handle_levy_rates)

async def main():
    """Start TerraFusion Levy Chain Service"""
    levy_service = TerraFusionLevyChain()
    
    # Create aiohttp application
    app = web.Application()
    
    # Setup routes without CORS for now
    await levy_service.setup_routes(app)
    
    # Start server
    logger.info(f"🚀 TerraFusion Levy Chain Service starting on port {levy_service.port}")
    logger.info("🏦 Property tax assessment and levy calculation service operational")
    logger.info("💰 Government-grade tax calculation engine ready")
    
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', levy_service.port)
    await site.start()
    
    print(f"✅ TerraFusion Levy Chain Service running on http://localhost:{levy_service.port}")
    print("📊 Endpoints:")
    print(f"   • GET  /health                           - Service health check")
    print(f"   • GET  /api/levy/status                  - Service status and metrics")
    print(f"   • GET  /api/levy/properties              - List all properties")
    print(f"   • POST /api/levy/calculate               - Calculate levy for property")
    print(f"   • GET  /api/levy/calculations/{{id}}       - Get calculation by parcel ID")
    print(f"   • GET  /api/levy/rates                   - Current levy rates")
    
    # Keep the service running
    try:
        await asyncio.Future()  # Run forever
    except KeyboardInterrupt:
        logger.info("🛑 TerraFusion Levy Chain Service stopping...")
        await runner.cleanup()

if __name__ == "__main__":
    asyncio.run(main())