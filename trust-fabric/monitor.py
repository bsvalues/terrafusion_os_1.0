#!/usr/bin/env python3
"""
Trust Fabric Monitor & Service Discovery
Provides real-time monitoring of the Trust Fabric mesh
"""

import asyncio
import json
import time
from pathlib import Path
from typing import Dict, List, Any
import websockets
from datetime import datetime

class TrustFabricMonitor:
    """Monitor Trust Fabric operations and provide service discovery"""
    
    def __init__(self, port: int = 8080):
        self.port = port
        self.fabric = None
        self.connected_clients: set = set()
        self.service_registry: Dict[str, Dict] = {}
        self.fabric_metrics = {
            "services_birthed": 0,
            "proofs_generated": 0,
            "discoveries_served": 0,
            "uptime_start": time.time()
        }
        
        print(f"🔍 Trust Fabric Monitor initializing on port {port}")

    async def start_monitor(self):
        """Start the Trust Fabric monitor"""
        print(f"🚀 Starting Trust Fabric Monitor")
        print(f"   WebSocket server: ws://localhost:{self.port}")
        print(f"   HTTP API: http://localhost:{self.port}")
        
        # Start WebSocket server for real-time updates
        start_server = websockets.serve(
            self.handle_websocket_connection,
            "localhost",
            self.port
        )
        
        await start_server
        print(f"✅ Trust Fabric Monitor active")
        
        # Start periodic tasks
        await asyncio.gather(
            self.periodic_fabric_sync(),
            self.periodic_metrics_update(),
            self.serve_http_api()
        )

    async def handle_websocket_connection(self, websocket, path):
        """Handle WebSocket connections from clients"""
        client_id = f"client_{len(self.connected_clients)}"
        self.connected_clients.add(websocket)
        
        print(f"📡 Client connected: {client_id}")
        
        try:
            # Send initial fabric status
            status = await self.get_fabric_status()
            await websocket.send(json.dumps({
                "type": "fabric_status",
                "data": status,
                "timestamp": time.time()
            }))
            
            async for message in websocket:
                await self.handle_client_message(websocket, message)
                
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            self.connected_clients.discard(websocket)
            print(f"📡 Client disconnected: {client_id}")

    async def handle_client_message(self, websocket, message):
        """Handle messages from connected clients"""
        try:
            data = json.loads(message)
            msg_type = data.get("type")
            
            if msg_type == "resolve_service":
                # Service discovery request
                did = data.get("did")
                resolution = await self.resolve_service(did)
                
                await websocket.send(json.dumps({
                    "type": "service_resolution",
                    "did": did,
                    "resolution": resolution,
                    "timestamp": time.time()
                }))
                
                self.fabric_metrics["discoveries_served"] += 1
                
            elif msg_type == "register_service":
                # Service registration
                service_info = data.get("service_info")
                await self.register_service(service_info)
                
                await websocket.send(json.dumps({
                    "type": "registration_ack",
                    "success": True,
                    "timestamp": time.time()
                }))
                
            elif msg_type == "get_all_services":
                # List all services
                services = await self.get_all_services()
                
                await websocket.send(json.dumps({
                    "type": "services_list",
                    "services": services,
                    "timestamp": time.time()
                }))
                
        except Exception as e:
            print(f"❌ Error handling client message: {e}")
            
            await websocket.send(json.dumps({
                "type": "error",
                "message": str(e),
                "timestamp": time.time()
            }))

    async def resolve_service(self, did: str) -> Dict[str, Any]:
        """Resolve service DID to current location"""
        if did in self.service_registry:
            service = self.service_registry[did]
            
            # Verify service is still active
            if await self.verify_service_health(service):
                return {
                    "success": True,
                    "host": service.get("host", "localhost"),
                    "port": service.get("port"),
                    "proof": service.get("current_proof"),
                    "networkId": service.get("network_id"),
                    "lastVerified": service.get("last_verified", time.time())
                }
        
        return {
            "success": False,
            "error": f"Service {did} not found or inactive"
        }

    async def verify_service_health(self, service: Dict) -> bool:
        """Verify that a service is still healthy"""
        try:
            # In production, would ping the service endpoint
            # For now, check if it was recently active
            last_heartbeat = service.get("last_heartbeat", 0)
            return (time.time() - last_heartbeat) < 60  # 1 minute tolerance
            
        except Exception:
            return False

    async def register_service(self, service_info: Dict):
        """Register a service in the discovery registry"""
        did = service_info.get("did")
        if not did:
            raise ValueError("Service DID required for registration")
        
        self.service_registry[did] = {
            **service_info,
            "registered_at": time.time(),
            "last_heartbeat": time.time(),
            "current_proof": f"proof_{did}_{time.time()}"
        }
        
        print(f"📋 Registered service: {did}")
        
        # Broadcast to all clients
        await self.broadcast_to_clients({
            "type": "service_registered",
            "did": did,
            "service_info": service_info,
            "timestamp": time.time()
        })

    async def get_all_services(self) -> List[str]:
        """Get list of all registered service DIDs"""
        return list(self.service_registry.keys())

    async def get_fabric_status(self) -> Dict[str, Any]:
        """Get comprehensive Fabric status"""
        uptime = time.time() - self.fabric_metrics["uptime_start"]
        
        return {
            "fabric_id": "did:tf:fabric:monitor",
            "active_services": len(self.service_registry),
            "connected_clients": len(self.connected_clients),
            "uptime_seconds": uptime,
            "metrics": self.fabric_metrics,
            "services": {
                did: {
                    "port": info.get("port"),
                    "status": "active" if await self.verify_service_health(info) else "inactive",
                    "registered_at": info.get("registered_at"),
                    "last_heartbeat": info.get("last_heartbeat")
                }
                for did, info in self.service_registry.items()
            }
        }

    async def broadcast_to_clients(self, message: Dict):
        """Broadcast message to all connected clients"""
        if not self.connected_clients:
            return
        
        message_json = json.dumps(message)
        
        # Send to all connected clients
        disconnected = set()
        for client in self.connected_clients:
            try:
                await client.send(message_json)
            except Exception:
                disconnected.add(client)
        
        # Remove disconnected clients
        self.connected_clients -= disconnected

    async def periodic_fabric_sync(self):
        """Periodically sync with main Fabric state"""
        while True:
            try:
                # Read Fabric status file if it exists
                status_file = Path("trust-fabric-status.json")
                if status_file.exists():
                    with open(status_file, 'r') as f:
                        fabric_status = json.load(f)
                    
                    # Update our metrics
                    self.fabric_metrics["services_birthed"] = fabric_status.get("active_services", 0)
                    
                    # Broadcast status update
                    await self.broadcast_to_clients({
                        "type": "fabric_sync",
                        "fabric_status": fabric_status,
                        "timestamp": time.time()
                    })
                
            except Exception as e:
                print(f"⚠️ Fabric sync error: {e}")
            
            await asyncio.sleep(5)  # Sync every 5 seconds

    async def periodic_metrics_update(self):
        """Update metrics periodically"""
        while True:
            try:
                # Update service health
                for did, service in self.service_registry.items():
                    is_healthy = await self.verify_service_health(service)
                    service["is_healthy"] = is_healthy
                
                # Broadcast metrics update
                await self.broadcast_to_clients({
                    "type": "metrics_update",
                    "metrics": self.fabric_metrics,
                    "service_count": len(self.service_registry),
                    "timestamp": time.time()
                })
                
            except Exception as e:
                print(f"⚠️ Metrics update error: {e}")
            
            await asyncio.sleep(10)  # Update every 10 seconds

    async def serve_http_api(self):
        """Serve HTTP API for service discovery"""
        from aiohttp import web, web_runner
        
        async def resolve_handler(request):
            """Handle service resolution requests"""
            data = await request.json()
            did = data.get("did")
            
            resolution = await self.resolve_service(did)
            self.fabric_metrics["discoveries_served"] += 1
            
            return web.json_response(resolution)
        
        async def discover_handler(request):
            """Handle service discovery requests"""
            services = await self.get_all_services()
            
            return web.json_response({
                "success": True,
                "data": {
                    "services": services
                }
            })
        
        async def register_handler(request):
            """Handle service registration requests"""
            service_info = await request.json()
            
            await self.register_service(service_info)
            
            return web.json_response({
                "success": True,
                "message": "Service registered successfully"
            })
        
        async def status_handler(request):
            """Handle status requests"""
            status = await self.get_fabric_status()
            return web.json_response(status)
        
        # Create HTTP app
        app = web.Application()
        app.router.add_post('/resolve', resolve_handler)
        app.router.add_post('/discover', discover_handler)
        app.router.add_post('/register', register_handler)
        app.router.add_get('/status', status_handler)
        
        # Start HTTP server
        runner = web_runner.AppRunner(app)
        await runner.setup()
        
        site = web_runner.TCPSite(runner, 'localhost', self.port + 1)  # HTTP on port+1
        await site.start()
        
        print(f"🌐 HTTP API server started on http://localhost:{self.port + 1}")

async def main():
    """Main monitor function"""
    print("🔍 TRUST FABRIC MONITOR")
    print("=" * 30)
    print("🚀 Real-time Fabric monitoring")
    print("📡 Service discovery server")
    print("⚡ WebSocket + HTTP API")
    print()
    
    monitor = TrustFabricMonitor(port=\${{TF_ADMIN_PORT:-8080}})
    
    try:
        await monitor.start_monitor()
    except KeyboardInterrupt:
        print(f"\n🛑 Monitor shutdown")
    except Exception as e:
        print(f"❌ Monitor error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
