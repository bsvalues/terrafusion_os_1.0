#!/usr/bin/env python3
"""
TerraFusion Core Trust Fabric v1.0.0
Simple, working service registry for frontend refactoring
"""

import asyncio
import json
import logging
import signal
import time
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from aiohttp import web, ClientSession
import aioredis

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('TerraFusion-TrustFabric-Core')

@dataclass
class ServiceInfo:
    name: str
    host: str
    port: int
    status: str = "healthy"
    last_check: float = 0
    metadata: Dict = None
    
    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}
        self.last_check = time.time()

class TrustFabricCore:
    def __init__(self):
        self.services: Dict[str, ServiceInfo] = {}
        self.redis_client = None
        self.app = web.Application()
        self.setup_routes()
        
    def setup_routes(self):
        """Setup API routes"""
        self.app.router.add_get('/', self.health_check)
        self.app.router.add_get('/api/trust-fabric/services', self.list_services)
        self.app.router.add_post('/api/trust-fabric/register', self.register_service)
        self.app.router.add_delete('/api/trust-fabric/services/{service_name}', self.unregister_service)
        self.app.router.add_get('/api/trust-fabric/services/{service_name}', self.get_service)
        self.app.router.add_get('/api/trust-fabric/health', self.health_check)
        
    async def health_check(self, request):
        """Health check endpoint"""
        return web.json_response({
            'status': 'healthy',
            'service': 'TerraFusion Trust Fabric Core',
            'version': '1.0.0',
            'timestamp': datetime.now().isoformat(),
            'services_count': len(self.services)
        })
        
    async def list_services(self, request):
        """List all registered services"""
        services_data = {}
        for name, service in self.services.items():
            services_data[name] = asdict(service)
            
        return web.json_response({
            'status': 'success',
            'services': services_data,
            'count': len(self.services)
        })
        
    async def register_service(self, request):
        """Register a new service"""
        try:
            data = await request.json()
            name = data.get('name')
            host = data.get('host', 'localhost')
            port = data.get('port')
            metadata = data.get('metadata', {})
            
            if not name or not port:
                return web.json_response({
                    'status': 'error',
                    'message': 'Name and port are required'
                }, status=400)
                
            service = ServiceInfo(
                name=name,
                host=host,
                port=port,
                metadata=metadata
            )
            
            self.services[name] = service
            
            # Store in Redis if available
            if self.redis_client:
                try:
                    await self.redis_client.setex(
                        f"service:{name}",
                        3600,  # 1 hour TTL
                        json.dumps(asdict(service))
                    )
                except Exception as e:
                    logger.warning(f"Failed to store in Redis: {e}")
            
            logger.info(f"🔄 Service registered: {name} at {host}:{port}")
            
            return web.json_response({
                'status': 'success',
                'message': f'Service {name} registered successfully',
                'service': asdict(service)
            })
            
        except Exception as e:
            logger.error(f"Error registering service: {e}")
            return web.json_response({
                'status': 'error',
                'message': str(e)
            }, status=500)
            
    async def unregister_service(self, request):
        """Unregister a service"""
        service_name = request.match_info['service_name']
        
        if service_name in self.services:
            del self.services[service_name]
            
            # Remove from Redis if available
            if self.redis_client:
                try:
                    await self.redis_client.delete(f"service:{service_name}")
                except Exception as e:
                    logger.warning(f"Failed to remove from Redis: {e}")
            
            logger.info(f"🗑️ Service unregistered: {service_name}")
            
            return web.json_response({
                'status': 'success',
                'message': f'Service {service_name} unregistered'
            })
        else:
            return web.json_response({
                'status': 'error',
                'message': f'Service {service_name} not found'
            }, status=404)
            
    async def get_service(self, request):
        """Get specific service information"""
        service_name = request.match_info['service_name']
        
        if service_name in self.services:
            return web.json_response({
                'status': 'success',
                'service': asdict(self.services[service_name])
            })
        else:
            return web.json_response({
                'status': 'error',
                'message': f'Service {service_name} not found'
            }, status=404)
            
    async def init_redis(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = await aioredis.from_url(
                "redis://localhost:\${{TF_REDIS_PORT:-6379}}",
                decode_responses=True
            )
            logger.info("📡 Connected to Redis")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Running without persistence.")
            self.redis_client = None
            
    async def health_monitor(self):
        """Background health monitoring"""
        while True:
            try:
                # Simple health check - in production this would ping services
                unhealthy_services = []
                current_time = time.time()
                
                for name, service in self.services.items():
                    # Mark as unhealthy if no check in 5 minutes
                    if current_time - service.last_check > 300:
                        service.status = "unhealthy"
                        unhealthy_services.append(name)
                        
                if unhealthy_services:
                    logger.warning(f"⚠️ Unhealthy services: {unhealthy_services}")
                    
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Health monitor error: {e}")
                await asyncio.sleep(60)
                
    async def cleanup(self):
        """Cleanup resources"""
        logger.info("🧹 Cleaning up Trust Fabric Core...")
        if self.redis_client:
            await self.redis_client.close()
            
    def handle_signal(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"📻 Received signal {signum}")
        raise KeyboardInterrupt()

async def create_app():
    """Create and initialize the application"""
    trust_fabric = TrustFabricCore()
    
    # Initialize Redis
    await trust_fabric.init_redis()
    
    # Start background tasks
    asyncio.create_task(trust_fabric.health_monitor())
    
    # Register cleanup
    async def cleanup_handler(app):
        await trust_fabric.cleanup()
    
    trust_fabric.app.on_cleanup.append(cleanup_handler)
    
    # Register some default services for frontend
    default_services = [
        {'name': 'terrafusion-frontend', 'host': 'localhost', "port": \${{TF_FRONTEND_PORT:-3000}}, 'metadata': {'type': 'frontend'}},
        {'name': 'api-gateway', 'host': 'localhost', "port": \${{TF_FRONTEND_PORT:-3000}}, 'metadata': {'type': 'gateway'}},
        {'name': 'property-service', 'host': 'localhost', "port": \${{TF_FRONTEND_PORT:-3000}}, 'metadata': {'type': 'microservice'}},
        {'name': 'payment-service', 'host': 'localhost', "port": \${{TF_FRONTEND_PORT:-3000}}, 'metadata': {'type': 'microservice'}},
    ]
    
    for service_data in default_services:
        service = ServiceInfo(**service_data)
        trust_fabric.services[service.name] = service
        logger.info(f"🔧 Pre-registered service: {service.name}")
    
    return trust_fabric.app

async def main():
    """Main entry point"""
    # Setup signal handlers
    signal.signal(signal.SIGINT, lambda s, f: None)
    signal.signal(signal.SIGTERM, lambda s, f: None)
    
    try:
        logger.info("🚀 Starting TerraFusion Core Trust Fabric...")
        
        app = await create_app()
        
        # Start the web server
        runner = web.AppRunner(app)
        await runner.setup()
        
        site = web.TCPSite(runner, 'localhost', 5000)
        await site.start()
        
        logger.info("🔐 TerraFusion Core Trust Fabric OPERATIONAL on http://localhost:\${{TF_REDIS_PORT:-6379}}")
        logger.info("🏛️ Government-Grade Service Registry Ready")
        logger.info("📊 API Endpoints:")
        logger.info("   GET  /api/trust-fabric/services - List all services")
        logger.info("   POST /api/trust-fabric/register - Register service")
        logger.info("   GET  /api/trust-fabric/health - Health check")
        
        # Keep running
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logger.info("🛑 Shutdown requested")
        finally:
            await runner.cleanup()
            
    except Exception as e:
        logger.error(f"💥 Failed to start Trust Fabric: {e}")
        raise

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("👋 Trust Fabric Core shutdown complete")
    except Exception as e:
        logger.error(f"💥 Fatal error: {e}")
