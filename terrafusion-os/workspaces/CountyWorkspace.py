"""
TerraFusion Government OS - County Workspace System
Each county gets their own workspace within the OS
"""

import json
import sqlite3
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class CountyStats:
    parcels: int
    population: int
    modules_purchased: int = 0
    modules_developed: int = 0
    monthly_revenue: float = 0.0
    ai_agents_assigned: int = 0

class CountyWorkspace:
    """
    Individual county workspace within TerraFusion OS
    Each county operates their own instance with their data and modules
    """
    
    def __init__(self, county_id: str, name: str, stats: dict, kernel):
        self.county_id = county_id
        self.name = name
        self.stats = CountyStats(**stats)
        self.kernel = kernel
        
        # County-specific resources
        self.modules: Dict[str, Any] = {}
        self.database: Optional[sqlite3.Connection] = None
        self.ai_agents: List[Any] = []
        self.revenue_tracker = RevenueTracker(county_id)
        self.custom_modules: List[str] = []
        self.purchased_modules: List[str] = []
        
        # Workspace state
        self.status = "INITIALIZING"
        self.last_activity = datetime.now()
        self.active_operations: List[str] = []
    
    async def initialize(self):
        """Initialize county workspace"""
        print(f"   🏛️ Initializing {self.name} workspace...")
        
        # Create county-specific database
        await self._initialize_county_database()
        
        # Load county's purchased modules from marketplace
        await self._load_purchased_modules()
        
        # Load county's custom-developed modules
        await self._load_custom_modules()
        
        # Assign AI agents from the swarm
        await self._assign_ai_agents()
        
        # Initialize revenue tracking
        await self._initialize_revenue_tracking()
        
        # Load county-specific configuration
        await self._load_county_config()
        
        self.status = "OPERATIONAL"
        print(f"      ✓ Database: {self.database is not None}")
        print(f"      ✓ Modules: {len(self.modules)} available")
        print(f"      ✓ AI Agents: {len(self.ai_agents)} assigned")
        print(f"      ✓ Revenue: ${self.stats.monthly_revenue:,.0f}/month")
    
    async def _initialize_county_database(self):
        """Create county-specific database"""
        db_path = Path(f"county-data/{self.county_id}/county.db")
        db_path.parent.mkdir(parents=True, exist_ok=True)
        
        self.database = sqlite3.connect(str(db_path))
        
        # Create county-specific tables
        cursor = self.database.cursor()
        
        # Properties table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS properties (
                parcel_id TEXT PRIMARY KEY,
                owner_name TEXT,
                address TEXT,
                assessed_value DECIMAL(12,2),
                tax_due DECIMAL(10,2),
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Permits table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS permits (
                permit_id TEXT PRIMARY KEY,
                applicant TEXT,
                permit_type TEXT,
                status TEXT,
                applied_date TIMESTAMP,
                approved_date TIMESTAMP
            )
        ''')
        
        # Citizens table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS citizens (
                citizen_id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT,
                phone TEXT,
                address TEXT,
                registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Module usage tracking
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS module_usage (
                usage_id TEXT PRIMARY KEY,
                module_name TEXT,
                operation TEXT,
                user_id TEXT,
                duration_ms INTEGER,
                success BOOLEAN,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        self.database.commit()
        
        # Seed with sample data for demo
        if self.county_id == "wa-benton":
            await self._seed_benton_county_data()
    
    async def _seed_benton_county_data(self):
        """Seed Benton County with realistic demo data"""
        cursor = self.database.cursor()
        
        # Sample properties
        sample_properties = [
            ("123-456-001", "John Smith", "123 Main St, Kennewick, WA", 450000.00, 5400.00),
            ("123-456-002", "Sarah Johnson", "456 Oak Ave, Richland, WA", 380000.00, 4560.00),
            ("123-456-003", "Mike Wilson", "789 Pine St, Pasco, WA", 290000.00, 3480.00),
            ("123-456-004", "Lisa Brown", "321 Elm Dr, West Richland, WA", 520000.00, 6240.00),
            ("123-456-005", "County of Benton", "620 Market St, Prosser, WA", 0.00, 0.00)
        ]
        
        cursor.executemany('''
            INSERT OR REPLACE INTO properties 
            (parcel_id, owner_name, address, assessed_value, tax_due)
            VALUES (?, ?, ?, ?, ?)
        ''', sample_properties)
        
        # Sample permits
        sample_permits = [
            ("PERM-2025-001", "John Smith", "Building Permit", "APPROVED", "2025-01-15", "2025-02-01"),
            ("PERM-2025-002", "Sarah Johnson", "Fence Permit", "PENDING", "2025-02-10", None),
            ("PERM-2025-003", "Mike Wilson", "Deck Addition", "UNDER_REVIEW", "2025-03-01", None)
        ]
        
        cursor.executemany('''
            INSERT OR REPLACE INTO permits 
            (permit_id, applicant, permit_type, status, applied_date, approved_date)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', sample_permits)
        
        self.database.commit()
    
    async def _load_purchased_modules(self):
        """Load modules this county has purchased from marketplace"""
        
        # Benton County has purchased these modules
        if self.county_id == "wa-benton":
            purchased = [
                "government-edition",
                "costforge-ai-champion", 
                "terra-collections",
                "terra-levy",
                "gispro",
                "property-workbench",
                "Terrafusion-PublicRecords",
                "terra-insight",
                "unified-system"
            ]
        else:
            # Other counties have different purchase history
            purchased = [
                "government-edition",
                "terra-collections", 
                "terra-levy"
            ]
        
        self.purchased_modules = purchased
        
        # Make purchased modules available in workspace
        for module_name in purchased:
            if module_name in self.kernel.modules:
                self.modules[module_name] = self.kernel.modules[module_name]
    
    async def _load_custom_modules(self):
        """Load modules this county has developed for marketplace"""
        
        # Benton County has developed these custom modules
        if self.county_id == "wa-benton":
            custom = [
                "agricultural-permits",  # Custom module for farm permits
                "wine-industry-tracking",  # For local wine industry
                "irrigation-management"  # Water rights management
            ]
            
            for module_name in custom:
                # Create placeholder for custom module
                self.custom_modules.append(module_name)
                # These would be available for sale to other counties
    
    async def _assign_ai_agents(self):
        """Assign AI agents from the swarm to this county"""
        if self.kernel.ai_swarm:
            # Assign agents based on county size and needs
            agent_count = min(50, max(10, self.stats.parcels // 2000))
            
            self.ai_agents = await self.kernel.ai_swarm.assign_agents(
                self.county_id, 
                agent_count,
                specializations=[
                    "property_assessment",
                    "tax_calculation", 
                    "permit_processing",
                    "citizen_services",
                    "document_analysis"
                ]
            )
            
            self.stats.ai_agents_assigned = len(self.ai_agents)
    
    async def _initialize_revenue_tracking(self):
        """Initialize revenue tracking for this county"""
        self.revenue_tracker.initialize({
            "module_sales": 0.0,  # Revenue from selling custom modules
            "platform_costs": -500.0,  # Monthly platform fee
            "usage_fees": -200.0,  # Per-module usage fees
            "net_monthly": self.stats.monthly_revenue
        })
    
    async def _load_county_config(self):
        """Load county-specific configuration"""
        config_path = Path(f"county-data/{self.county_id}/config.json")
        
        if not config_path.exists():
            # Create default config
            default_config = {
                "county_name": self.name,
                "timezone": "America/Los_Angeles",
                "tax_rate": 0.012,  # 1.2% property tax rate
                "permit_fees": {
                    "building": 150.00,
                    "fence": 25.00,
                    "deck": 75.00
                },
                "ai_assistance_level": "standard",
                "marketplace_participation": True,
                "custom_branding": {
                    "primary_color": "#1e40af",
                    "logo_url": f"/assets/logos/{self.county_id}.png"
                }
            }
            
            config_path.parent.mkdir(parents=True, exist_ok=True)
            with open(config_path, 'w') as f:
                json.dump(default_config, f, indent=2)
        
        with open(config_path) as f:
            self.config = json.load(f)
    
    async def execute_operation(self, operation: str, params: dict) -> dict:
        """Execute a government operation in this county workspace"""
        
        print(f"🏛️ {self.name}: Executing {operation}")
        
        # Track operation start
        start_time = datetime.now()
        self.active_operations.append(operation)
        
        try:
            # Route operation to appropriate module
            result = await self._route_operation(operation, params)
            
            # Track successful operation
            await self._track_usage(operation, start_time, True)
            
            return result
            
        except Exception as e:
            # Track failed operation
            await self._track_usage(operation, start_time, False)
            raise
        
        finally:
            # Clean up
            if operation in self.active_operations:
                self.active_operations.remove(operation)
            self.last_activity = datetime.now()
    
    async def _route_operation(self, operation: str, params: dict) -> dict:
        """Route operation to the appropriate module"""
        
        # Property assessment operations
        if operation.startswith("property_"):
            if "costforge-ai-champion" in self.modules:
                return await self._execute_property_operation(operation, params)
        
        # Tax operations
        elif operation.startswith("tax_"):
            if "terra-levy" in self.modules:
                return await self._execute_tax_operation(operation, params)
        
        # Permit operations
        elif operation.startswith("permit_"):
            if "government-edition" in self.modules:
                return await self._execute_permit_operation(operation, params)
        
        # Records operations
        elif operation.startswith("records_"):
            if "Terrafusion-PublicRecords" in self.modules:
                return await self._execute_records_operation(operation, params)
        
        else:
            raise ValueError(f"Unknown operation: {operation}")
    
    async def _execute_property_operation(self, operation: str, params: dict) -> dict:
        """Execute property-related operations"""
        
        if operation == "property_assess":
            parcel_id = params['parcel_id']
            
            # Get property data from county database
            cursor = self.database.cursor()
            cursor.execute("SELECT * FROM properties WHERE parcel_id = ?", (parcel_id,))
            property_data = cursor.fetchone()
            
            if not property_data:
                raise ValueError(f"Property {parcel_id} not found")
            
            # Use AI to assist with assessment
            ai_analysis = await self._get_ai_analysis(parcel_id, property_data)
            
            # Return assessment result
            return {
                "parcel_id": parcel_id,
                "owner": property_data[1],
                "address": property_data[2],
                "assessed_value": property_data[3],
                "ai_confidence": ai_analysis.get("confidence", 0.85),
                "recommendation": ai_analysis.get("recommendation", "Assessment confirmed"),
                "timestamp": datetime.now().isoformat()
            }
    
    async def _get_ai_analysis(self, parcel_id: str, property_data: tuple) -> dict:
        """Get AI assistance for operations"""
        if self.ai_agents:
            # Simulate AI analysis
            return {
                "confidence": 0.92,
                "recommendation": "Assessment appears accurate based on market analysis",
                "factors_considered": [
                    "Comparable sales",
                    "Property condition",
                    "Market trends",
                    "Location factors"
                ]
            }
        return {"confidence": 0.5, "recommendation": "No AI analysis available"}
    
    async def _track_usage(self, operation: str, start_time: datetime, success: bool):
        """Track module usage for billing and analytics"""
        duration = (datetime.now() - start_time).total_seconds() * 1000
        
        cursor = self.database.cursor()
        cursor.execute('''
            INSERT INTO module_usage 
            (usage_id, module_name, operation, duration_ms, success)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            f"{self.county_id}-{int(start_time.timestamp())}",
            "system",
            operation,
            int(duration),
            success
        ))
        self.database.commit()

class RevenueTracker:
    """Track county revenue from marketplace participation"""
    
    def __init__(self, county_id: str):
        self.county_id = county_id
        self.revenue_data = {}
    
    def initialize(self, initial_data: dict):
        self.revenue_data = initial_data
    
    async def record_sale(self, module_name: str, amount: float, buyer_county: str):
        """Record a module sale to another county"""
        self.revenue_data["module_sales"] += amount * 0.70  # County keeps 70%
        
        # Record transaction
        print(f"💰 {self.county_id}: Sold {module_name} to {buyer_county} for ${amount}")
    
    async def record_purchase(self, module_name: str, amount: float, seller_county: str):
        """Record a module purchase from another county"""
        self.revenue_data["platform_costs"] -= amount
        
        print(f"🛒 {self.county_id}: Purchased {module_name} from {seller_county} for ${amount}")
    
    def get_monthly_summary(self) -> dict:
        """Get monthly revenue summary"""
        return {
            "county_id": self.county_id,
            "module_sales": self.revenue_data.get("module_sales", 0),
            "platform_costs": self.revenue_data.get("platform_costs", 0),
            "usage_fees": self.revenue_data.get("usage_fees", 0),
            "net_monthly": sum(self.revenue_data.values())
        }
