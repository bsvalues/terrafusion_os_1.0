"""
TerraFusion cOS Vendor Registration Service
Platform services for vendor onboarding and authentication
"""

import asyncio
import json
import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
import uuid

class VendorTier(Enum):
    """Vendor partnership tiers"""
    CERTIFIED = "certified"
    STRATEGIC = "strategic"
    ENTERPRISE = "enterprise"
    PREMIER = "premier"

class VendorStatus(Enum):
    """Vendor registration status"""
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    REVOKED = "revoked"

@dataclass
class VendorProfile:
    """Vendor company profile"""
    vendor_id: str
    company_name: str
    contact_email: str
    primary_contact: str
    business_type: str
    registration_date: datetime
    tier: VendorTier
    status: VendorStatus
    annual_revenue: Optional[float] = None
    employee_count: Optional[int] = None
    security_clearance: Optional[str] = None
    certifications: List[str] = None
    specializations: List[str] = None
    
    def __post_init__(self):
        if self.certifications is None:
            self.certifications = []
        if self.specializations is None:
            self.specializations = []

@dataclass
class APICredentials:
    """API access credentials for vendors"""
    vendor_id: str
    api_key: str
    secret_key: str
    created_at: datetime
    expires_at: datetime
    permissions: List[str]
    rate_limit: int = 1000  # requests per hour
    is_active: bool = True

class VendorDatabase:
    """SQLite database for vendor management"""
    
    def __init__(self, db_path: str = "vendor_registry.db"):
        self.db_path = db_path
        self._init_database()
        
    def _init_database(self):
        """Initialize vendor database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Vendors table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS vendors (
                vendor_id TEXT PRIMARY KEY,
                company_name TEXT NOT NULL,
                contact_email TEXT NOT NULL,
                primary_contact TEXT NOT NULL,
                business_type TEXT NOT NULL,
                registration_date TEXT NOT NULL,
                tier TEXT NOT NULL,
                status TEXT NOT NULL,
                annual_revenue REAL,
                employee_count INTEGER,
                security_clearance TEXT,
                certifications TEXT,
                specializations TEXT
            )
        """)
        
        # API Credentials table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_credentials (
                vendor_id TEXT PRIMARY KEY,
                api_key TEXT NOT NULL,
                secret_key TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                permissions TEXT NOT NULL,
                rate_limit INTEGER DEFAULT 1000,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (vendor_id) REFERENCES vendors (vendor_id)
            )
        """)
        
        conn.commit()
        conn.close()
        
    def save_vendor(self, vendor: VendorProfile) -> bool:
        """Save vendor profile to database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT OR REPLACE INTO vendors 
                (vendor_id, company_name, contact_email, primary_contact, business_type,
                 registration_date, tier, status, annual_revenue, employee_count,
                 security_clearance, certifications, specializations)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                vendor.vendor_id, vendor.company_name, vendor.contact_email,
                vendor.primary_contact, vendor.business_type,
                vendor.registration_date.isoformat(), vendor.tier.value, vendor.status.value,
                vendor.annual_revenue, vendor.employee_count, vendor.security_clearance,
                json.dumps(vendor.certifications), json.dumps(vendor.specializations)
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            logging.error(f"Failed to save vendor {vendor.vendor_id}: {str(e)}")
            return False
            
    def get_vendor(self, vendor_id: str) -> Optional[VendorProfile]:
        """Retrieve vendor profile from database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT * FROM vendors WHERE vendor_id = ?", (vendor_id,))
            row = cursor.fetchone()
            
            if row:
                vendor = VendorProfile(
                    vendor_id=row[0],
                    company_name=row[1],
                    contact_email=row[2],
                    primary_contact=row[3],
                    business_type=row[4],
                    registration_date=datetime.fromisoformat(row[5]),
                    tier=VendorTier(row[6]),
                    status=VendorStatus(row[7]),
                    annual_revenue=row[8],
                    employee_count=row[9],
                    security_clearance=row[10],
                    certifications=json.loads(row[11]) if row[11] else [],
                    specializations=json.loads(row[12]) if row[12] else []
                )
                
                conn.close()
                return vendor
                
            conn.close()
            return None
            
        except Exception as e:
            logging.error(f"Failed to retrieve vendor {vendor_id}: {str(e)}")
            return None

class VendorRegistrationService:
    """Main vendor registration and management service"""
    
    def __init__(self):
        self.database = VendorDatabase()
        self.registered_vendors: Dict[str, VendorProfile] = {}
        self.api_credentials: Dict[str, APICredentials] = {}
        self._load_existing_vendors()
        
    def _load_existing_vendors(self):
        """Load existing vendors from database"""
        # This would typically load from database
        # For now, we'll pre-populate with example vendors
        self._register_example_vendors()
        
    def _register_example_vendors(self):
        """Register example government technology vendors"""
        
        # Woolpert - Strategic Partner
        woolpert = VendorProfile(
            vendor_id="woolpert_inc",
            company_name="Woolpert, Inc.",
            contact_email="partnerships@woolpert.com",
            primary_contact="Sarah Johnson",
            business_type="Geospatial Technology Services",
            registration_date=datetime.now() - timedelta(days=30),
            tier=VendorTier.STRATEGIC,
            status=VendorStatus.ACTIVE,
            annual_revenue=500000000.0,  # $500M
            employee_count=2500,
            security_clearance="Secret",
            certifications=["ISO 9001", "CMMI Level 3", "FedRAMP"],
            specializations=["GIS", "Remote Sensing", "Asset Management", "Emergency Management"]
        )
        
        # AECOM - Premier Partner
        aecom = VendorProfile(
            vendor_id="aecom_corp",
            company_name="AECOM",
            contact_email="government@aecom.com", 
            primary_contact="Michael Chen",
            business_type="Infrastructure Consulting",
            registration_date=datetime.now() - timedelta(days=45),
            tier=VendorTier.PREMIER,
            status=VendorStatus.ACTIVE,
            annual_revenue=13200000000.0,  # $13.2B
            employee_count=50000,
            security_clearance="Top Secret",
            certifications=["ISO 14001", "OHSAS 18001", "FedRAMP High"],
            specializations=["Infrastructure", "Environmental", "Transportation", "Water Management"]
        )
        
        # Esri - Enterprise Partner
        esri = VendorProfile(
            vendor_id="esri_inc",
            company_name="Esri",
            contact_email="government@esri.com",
            primary_contact="Jennifer Rodriguez",
            business_type="Geographic Information Systems",
            registration_date=datetime.now() - timedelta(days=60),
            tier=VendorTier.ENTERPRISE,
            status=VendorStatus.ACTIVE,
            annual_revenue=1500000000.0,  # $1.5B
            employee_count=5000,
            security_clearance="Secret",
            certifications=["ISO 27001", "SOC 2", "FedRAMP Moderate"],
            specializations=["ArcGIS", "Spatial Analytics", "Mapping", "Location Intelligence"]
        )
        
        # Register vendors
        for vendor in [woolpert, aecom, esri]:
            self.registered_vendors[vendor.vendor_id] = vendor
            self.database.save_vendor(vendor)
            self._generate_api_credentials(vendor)
            
        logging.info(f"Registered {len(self.registered_vendors)} example vendors")
        
    def register_vendor(self, vendor_data: Dict[str, Any]) -> Optional[str]:
        """Register new vendor with TerraFusion cOS platform"""
        try:
            vendor_id = f"{vendor_data['company_name'].lower().replace(' ', '_').replace(',', '').replace('.', '')}"
            
            vendor = VendorProfile(
                vendor_id=vendor_id,
                company_name=vendor_data["company_name"],
                contact_email=vendor_data["contact_email"],
                primary_contact=vendor_data["primary_contact"],
                business_type=vendor_data["business_type"],
                registration_date=datetime.now(),
                tier=VendorTier.CERTIFIED,  # Default tier
                status=VendorStatus.PENDING,  # Pending approval
                annual_revenue=vendor_data.get("annual_revenue"),
                employee_count=vendor_data.get("employee_count"),
                security_clearance=vendor_data.get("security_clearance"),
                certifications=vendor_data.get("certifications", []),
                specializations=vendor_data.get("specializations", [])
            )
            
            # Save to database
            if self.database.save_vendor(vendor):
                self.registered_vendors[vendor_id] = vendor
                
                # Generate API credentials
                self._generate_api_credentials(vendor)
                
                logging.info(f"Vendor registered: {vendor.company_name} ({vendor_id})")
                return vendor_id
            else:
                return None
                
        except Exception as e:
            logging.error(f"Vendor registration failed: {str(e)}")
            return None
            
    def _generate_api_credentials(self, vendor: VendorProfile):
        """Generate API credentials for vendor"""
        api_key = f"tf_api_{vendor.vendor_id}_{uuid.uuid4().hex[:8]}"
        secret_key = hashlib.sha256(f"{vendor.vendor_id}{datetime.now().isoformat()}".encode()).hexdigest()
        
        credentials = APICredentials(
            vendor_id=vendor.vendor_id,
            api_key=api_key,
            secret_key=secret_key,
            created_at=datetime.now(),
            expires_at=datetime.now() + timedelta(days=365),  # 1 year expiry
            permissions=self._get_default_permissions(vendor.tier),
            rate_limit=self._get_rate_limit(vendor.tier)
        )
        
        self.api_credentials[vendor.vendor_id] = credentials
        
    def _get_default_permissions(self, tier: VendorTier) -> List[str]:
        """Get default API permissions based on vendor tier"""
        base_permissions = ["substrate:read", "modules:deploy"]
        
        if tier == VendorTier.STRATEGIC:
            return base_permissions + ["substrate:write", "analytics:read", "priority_support"]
        elif tier == VendorTier.PREMIER:
            return base_permissions + ["substrate:write", "analytics:read", "beta_features"]
        elif tier == VendorTier.ENTERPRISE:
            return base_permissions + ["analytics:read"]
        else:  # CERTIFIED
            return base_permissions
            
    def _get_rate_limit(self, tier: VendorTier) -> int:
        """Get API rate limit based on vendor tier"""
        limits = {
            VendorTier.PREMIER: 10000,
            VendorTier.STRATEGIC: 5000,
            VendorTier.ENTERPRISE: 2500,
            VendorTier.CERTIFIED: 1000
        }
        return limits.get(tier, 1000)
        
    def authenticate_vendor(self, api_key: str, secret_key: str) -> Optional[VendorProfile]:
        """Authenticate vendor using API credentials"""
        for credentials in self.api_credentials.values():
            if credentials.api_key == api_key and credentials.secret_key == secret_key:
                if credentials.is_active and credentials.expires_at > datetime.now():
                    return self.registered_vendors.get(credentials.vendor_id)
        return None
        
    def get_vendor_status(self, vendor_id: str) -> Optional[Dict[str, Any]]:
        """Get comprehensive vendor status"""
        vendor = self.registered_vendors.get(vendor_id)
        if not vendor:
            return None
            
        credentials = self.api_credentials.get(vendor_id)
        
        return {
            "vendor_profile": asdict(vendor),
            "api_status": {
                "has_credentials": credentials is not None,
                "credentials_active": credentials.is_active if credentials else False,
                "expires_at": credentials.expires_at.isoformat() if credentials else None,
                "rate_limit": credentials.rate_limit if credentials else 0,
                "permissions": credentials.permissions if credentials else []
            },
            "platform_access": {
                "substrate_apis": vendor.status == VendorStatus.ACTIVE,
                "module_deployment": vendor.status == VendorStatus.ACTIVE,
                "analytics_access": vendor.tier in [VendorTier.STRATEGIC, VendorTier.PREMIER, VendorTier.ENTERPRISE],
                "priority_support": vendor.tier == VendorTier.STRATEGIC
            }
        }
        
    def list_registered_vendors(self) -> List[Dict[str, Any]]:
        """List all registered vendors with summary information"""
        vendors = []
        
        for vendor in self.registered_vendors.values():
            vendors.append({
                "vendor_id": vendor.vendor_id,
                "company_name": vendor.company_name,
                "tier": vendor.tier.value,
                "status": vendor.status.value,
                "registration_date": vendor.registration_date.isoformat(),
                "specializations": vendor.specializations,
                "employee_count": vendor.employee_count
            })
            
        return sorted(vendors, key=lambda x: x["registration_date"], reverse=True)
        
    def get_registration_stats(self) -> Dict[str, Any]:
        """Get vendor registration statistics"""
        total_vendors = len(self.registered_vendors)
        
        status_counts = {}
        for status in VendorStatus:
            status_counts[status.value] = len([v for v in self.registered_vendors.values() if v.status == status])
            
        tier_counts = {}
        for tier in VendorTier:
            tier_counts[tier.value] = len([v for v in self.registered_vendors.values() if v.tier == tier])
            
        return {
            "total_vendors": total_vendors,
            "status_breakdown": status_counts,
            "tier_breakdown": tier_counts,
            "active_api_credentials": len([c for c in self.api_credentials.values() if c.is_active]),
            "recent_registrations": len([v for v in self.registered_vendors.values() 
                                       if v.registration_date > datetime.now() - timedelta(days=30)])
        }