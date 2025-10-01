"""
TerraFusion cOS API Gateway
Request routing and API management for vendor substrate
"""

from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
import time
import json

# Import substrate services
from .vendor_registration import VendorRegistrationService
from .module_wrapper import ModuleWrapperService
from .compliance_auditor import ComplianceAuditor
from .performance_monitor import PerformanceMonitor
from .resource_allocator import ResourceAllocator

class TerraFusionAPIGateway:
    """Main API Gateway for TerraFusion cOS vendor substrate"""
    
    def __init__(self):
        self.app = FastAPI(
            title="TerraFusion cOS Vendor Substrate API",
            description="Government-grade vendor platform APIs",
            version="1.0.0",
            docs_url="/api/docs",
            redoc_url="/api/redoc"
        )
        
        # Initialize services
        self.vendor_service = VendorRegistrationService()
        self.module_service = ModuleWrapperService()
        self.compliance_service = ComplianceAuditor()
        self.performance_service = PerformanceMonitor()
        self.resource_service = ResourceAllocator()
        
        # Security
        self.security = HTTPBearer()
        
        # Rate limiting
        self.rate_limits: Dict[str, List[float]] = {}
        
        self._setup_middleware()
        self._setup_routes()
        
    def _setup_middleware(self):
        """Setup API middleware"""
        # CORS middleware
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Configure appropriately for production
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
        
        # Custom middleware for logging and monitoring
        @self.app.middleware("http")
        async def log_requests(request: Request, call_next):
            start_time = time.time()
            
            response = await call_next(request)
            
            process_time = time.time() - start_time
            
            # Log API call
            logging.info(f"API Call: {request.method} {request.url.path} - "
                        f"Status: {response.status_code} - "
                        f"Time: {process_time:.3f}s")
            
            # Record performance metrics
            await self.performance_service.record_api_call(
                endpoint=request.url.path,
                method=request.method,
                status_code=response.status_code,
                response_time=process_time
            )
            
            return response
            
    def _setup_routes(self):
        """Setup API routes"""
        
        # Health check
        @self.app.get("/api/health")
        async def health_check():
            return {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "version": "1.0.0",
                "services": {
                    "vendor_registration": "active",
                    "module_wrapper": "active", 
                    "compliance_auditor": "active",
                    "performance_monitor": "active",
                    "resource_allocator": "active"
                }
            }
            
        # Vendor Registration Endpoints
        @self.app.post("/api/vendors/register")
        async def register_vendor(vendor_data: dict):
            """Register new vendor with platform"""
            try:
                vendor_id = self.vendor_service.register_vendor(vendor_data)
                if vendor_id:
                    return {
                        "success": True,
                        "vendor_id": vendor_id,
                        "message": "Vendor registered successfully",
                        "status": "pending_approval"
                    }
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Vendor registration failed"
                    )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Registration error: {str(e)}"
                )
                
        @self.app.get("/api/vendors/{vendor_id}")
        async def get_vendor_status(
            vendor_id: str,
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Get vendor status and platform access information"""
            # Authenticate request
            vendor = await self._authenticate_vendor(credentials)
            if not vendor or vendor.vendor_id != vendor_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
                
            status_info = self.vendor_service.get_vendor_status(vendor_id)
            if status_info:
                return status_info
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Vendor not found"
                )
                
        @self.app.get("/api/vendors")
        async def list_vendors(
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """List registered vendors (admin access required)"""
            # This would typically require admin authentication
            return {
                "vendors": self.vendor_service.list_registered_vendors(),
                "statistics": self.vendor_service.get_registration_stats()
            }
            
        # Module Deployment Endpoints
        @self.app.post("/api/modules/deploy")
        async def deploy_module(
            module_data: dict,
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Deploy vendor module to platform"""
            vendor = await self._authenticate_vendor(credentials)
            if not vendor:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
                
            # Check rate limits
            if not await self._check_rate_limit(vendor.vendor_id):
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded"
                )
                
            try:
                result = await self.module_service.wrap_and_deploy_module(
                    module_path=module_data.get("module_path"),
                    manifest_data=module_data.get("manifest"),
                    vendor_id=vendor.vendor_id
                )
                
                if result["success"]:
                    return result
                else:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=result
                    )
                    
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Deployment error: {str(e)}"
                )
                
        @self.app.get("/api/modules")
        async def list_modules(
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """List deployed modules for vendor"""
            vendor = await self._authenticate_vendor(credentials)
            if not vendor:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
                
            modules = self.module_service.get_deployed_modules(vendor.vendor_id)
            return {
                "modules": modules,
                "total_count": len(modules)
            }
            
        @self.app.get("/api/modules/{deployment_id}/health")
        async def check_module_health(
            deployment_id: str,
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Check health of deployed module"""
            vendor = await self._authenticate_vendor(credentials)
            if not vendor:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
                
            health_result = await self.module_service.health_check_module(deployment_id)
            
            if health_result.get("status") == "not_found":
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Module deployment not found"
                )
                
            return health_result
            
        # Compliance Endpoints
        @self.app.get("/api/compliance/audit/{vendor_id}")
        async def get_compliance_audit(
            vendor_id: str,
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Get compliance audit results for vendor"""
            vendor = await self._authenticate_vendor(credentials)
            if not vendor or vendor.vendor_id != vendor_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied"
                )
                
            audit_result = await self.compliance_service.audit_vendor_compliance(vendor_id)
            return audit_result
            
        # Performance Analytics Endpoints
        @self.app.get("/api/analytics/performance")
        async def get_performance_analytics(
            credentials: HTTPAuthorizationCredentials = Depends(self.security),
            days: int = 7
        ):
            """Get performance analytics for vendor"""
            vendor = await self._authenticate_vendor(credentials)
            if not vendor:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
                
            analytics = await self.performance_service.get_vendor_analytics(
                vendor.vendor_id, days
            )
            return analytics
            
        # Resource Management Endpoints
        @self.app.get("/api/resources/allocation")
        async def get_resource_allocation(
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Get current resource allocation for vendor"""
            vendor = await self._authenticate_vendor(credentials)
            if not vendor:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
                
            allocation = await self.resource_service.get_vendor_allocation(vendor.vendor_id)
            return allocation
            
        @self.app.post("/api/resources/request")
        async def request_resources(
            resource_request: dict,
            credentials: HTTPAuthorizationCredentials = Depends(self.security)
        ):
            """Request additional resources"""
            vendor = await self._authenticate_vendor(credentials)
            if not vendor:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
                
            request_result = await self.resource_service.process_resource_request(
                vendor.vendor_id, resource_request
            )
            return request_result
            
    async def _authenticate_vendor(self, credentials: HTTPAuthorizationCredentials):
        """Authenticate vendor using API credentials"""
        try:
            token = credentials.credentials
            
            # Parse API key and secret from token (simplified)
            # In production, this would be properly encoded JWT or similar
            if ":" in token:
                api_key, secret_key = token.split(":", 1)
                vendor = self.vendor_service.authenticate_vendor(api_key, secret_key)
                return vendor
            
            return None
            
        except Exception as e:
            logging.error(f"Authentication error: {str(e)}")
            return None
            
    async def _check_rate_limit(self, vendor_id: str) -> bool:
        """Check if vendor has exceeded rate limits"""
        current_time = time.time()
        
        if vendor_id not in self.rate_limits:
            self.rate_limits[vendor_id] = []
            
        # Clean old entries (older than 1 hour)
        self.rate_limits[vendor_id] = [
            t for t in self.rate_limits[vendor_id] 
            if current_time - t < 3600
        ]
        
        # Get vendor rate limit
        vendor = self.vendor_service.registered_vendors.get(vendor_id)
        if not vendor:
            return False
            
        credentials = self.vendor_service.api_credentials.get(vendor_id)
        rate_limit = credentials.rate_limit if credentials else 100
        
        # Check if under limit
        if len(self.rate_limits[vendor_id]) < rate_limit:
            self.rate_limits[vendor_id].append(current_time)
            return True
            
        return False
        
    def get_api_stats(self) -> Dict[str, Any]:
        """Get API gateway statistics"""
        return {
            "total_vendors": len(self.vendor_service.registered_vendors),
            "active_modules": len(self.module_service.deployed_modules),
            "api_calls_today": self.performance_service.get_daily_api_calls(),
            "rate_limit_violations": len([v for limits in self.rate_limits.values() for v in limits]),
            "uptime": "99.9%",  # Would be calculated from actual uptime
            "last_updated": datetime.now().isoformat()
        }

# Global API Gateway instance
api_gateway = TerraFusionAPIGateway()
app = api_gateway.app