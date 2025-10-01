"""
TerraFusion cOS 2.0 - Authentication Module
MIT PhD Systems Design Engineer Standards
"""

from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional
import jwt
import redis
from datetime import datetime, timedelta

from .core import get_redis_client
from .models import Vendor

# Security scheme
security = HTTPBearer()

# JWT Configuration
JWT_SECRET = "your_jwt_secret_here"  # In production, use environment variable
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

class TokenData(BaseModel):
    vendor_id: str
    vendor_name: str
    subscription_tier: str
    permissions: list

class AuthService:
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
    
    def create_access_token(self, vendor: Vendor) -> str:
        """Create JWT access token for vendor"""
        token_data = {
            "vendor_id": vendor.vendor_id,
            "vendor_name": vendor.vendor_name,
            "subscription_tier": vendor.subscription_tier,
            "permissions": self._get_vendor_permissions(vendor),
            "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
            "iat": datetime.utcnow()
        }
        
        token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # Store token in Redis for validation
        self.redis.setex(
            f"token:{token}",
            JWT_EXPIRATION_HOURS * 3600,
            vendor.vendor_id
        )
        
        return token
    
    def verify_token(self, token: str) -> TokenData:
        """Verify JWT token and return token data"""
        try:
            # Check if token exists in Redis
            vendor_id = self.redis.get(f"token:{token}")
            if not vendor_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token not found or expired"
                )
            
            # Decode JWT token
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            
            # Validate token data
            if payload.get("vendor_id") != vendor_id.decode():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token validation failed"
                )
            
            return TokenData(
                vendor_id=payload["vendor_id"],
                vendor_name=payload["vendor_name"],
                subscription_tier=payload["subscription_tier"],
                permissions=payload["permissions"]
            )
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )
        except jwt.JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
    
    def revoke_token(self, token: str) -> bool:
        """Revoke JWT token"""
        try:
            self.redis.delete(f"token:{token}")
            return True
        except Exception:
            return False
    
    def _get_vendor_permissions(self, vendor: Vendor) -> list:
        """Get vendor permissions based on subscription tier"""
        base_permissions = ["read:own_data", "write:own_data"]
        
        if vendor.subscription_tier == "basic":
            return base_permissions + ["ai_swarm:deploy:limited", "costforge:analyze:basic"]
        elif vendor.subscription_tier == "professional":
            return base_permissions + [
                "ai_swarm:deploy:standard",
                "costforge:analyze:advanced",
                "sync:configure:standard",
                "flow:create:standard"
            ]
        elif vendor.subscription_tier == "enterprise":
            return base_permissions + [
                "ai_swarm:deploy:unlimited",
                "costforge:analyze:comprehensive",
                "sync:configure:unlimited",
                "flow:create:unlimited",
                "security:compliance:full",
                "vendor:manage:all"
            ]
        else:
            return base_permissions

# Global auth service instance
auth_service = None

async def get_auth_service(redis_client: redis.Redis = Depends(get_redis_client)) -> AuthService:
    """Get authentication service instance"""
    global auth_service
    if auth_service is None:
        auth_service = AuthService(redis_client)
    return auth_service

async def get_current_vendor(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth: AuthService = Depends(get_auth_service)
) -> Vendor:
    """Get current authenticated vendor"""
    token = credentials.credentials
    token_data = auth.verify_token(token)
    
    # In production, this would query the database
    # For now, we'll create a mock vendor object
    vendor = Vendor(
        vendor_id=token_data.vendor_id,
        vendor_name=token_data.vendor_name,
        subscription_tier=token_data.subscription_tier,
        status="active"
    )
    
    return vendor

async def require_permission(permission: str):
    """Decorator to require specific permission"""
    def decorator(current_vendor: Vendor = Depends(get_current_vendor)):
        # In production, this would check against actual permissions
        # For now, we'll allow all requests
        return current_vendor
    return decorator

def check_rate_limit(vendor_id: str, endpoint: str, limit: int = 100):
    """Check if vendor has exceeded rate limit for endpoint"""
    # In production, this would check Redis for rate limits
    # For now, we'll allow all requests
    return True
