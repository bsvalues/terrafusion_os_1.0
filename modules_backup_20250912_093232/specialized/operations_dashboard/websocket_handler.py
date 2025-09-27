#!/usr/bin/env python3
"""
WebSocket handler for real-time dashboard updates
"""

import json
import asyncio
import logging
from datetime import datetime
from typing import Set, Dict
import websockets
from websockets.server import WebSocketServerProtocol

class WebSocketHandler:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self, metrics_collector):
        self.clients: Set[WebSocketServerProtocol] = set()
        self.metrics_collector = metrics_collector
        self.logger = logging.getLogger(__name__)
    
    async def register(self, websocket: WebSocketServerProtocol):
        """Register a new client"""
        self.clients.add(websocket)
        self.logger.info(f"Client connected. Total clients: {len(self.clients)}")
        
        # Send initial data
        try:
            await websocket.send(json.dumps({
                'type': 'connection',
                'data': {
                    'status': 'connected',
                    'timestamp': datetime.now().isoformat()
                }
            }))
            
            # Send current metrics
            summary = self.metrics_collector.get_metrics_summary()
            await websocket.send(json.dumps({
                'type': 'metrics_update',
                'data': summary
            }))
        except Exception as e:
            self.logger.error(f"Error sending initial data: {e}")
    
    async def unregister(self, websocket: WebSocketServerProtocol):
        """Unregister a client"""
        self.clients.remove(websocket)
        self.logger.info(f"Client disconnected. Total clients: {len(self.clients)}")
    
    async def send_to_all(self, message: Dict):
        """Send message to all connected clients"""
        if self.clients:
            message_str = json.dumps(message)
            # Create tasks for all sends
            tasks = [
                asyncio.create_task(client.send(message_str))
                for client in self.clients
            ]
            # Wait for all sends to complete
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def handle_client(self, websocket: WebSocketServerProtocol, path: str):
        """Handle a client connection"""
        await self.register(websocket)
        try:
            async for message in websocket:
                # Handle incoming messages
                try:
                    data = json.loads(message)
                    await self.handle_message(websocket, data)
                except json.JSONDecodeError:
                    await websocket.send(json.dumps({
                        'type': 'error',
                        'data': {'message': 'Invalid JSON'}
                    }))
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister(websocket)
    
    async def handle_message(self, websocket: WebSocketServerProtocol, data: Dict):
        """Handle incoming WebSocket messages"""
        msg_type = data.get('type')
        
        if msg_type == 'ping':
            await websocket.send(json.dumps({
                'type': 'pong',
                'data': {'timestamp': datetime.now().isoformat()}
            }))
        
        elif msg_type == 'get_metrics':
            metric_type = data.get('metric_type', 'all')
            
            if metric_type == 'system':
                metrics = list(self.metrics_collector.metrics_store['system'])[-100:]
            elif metric_type == 'services':
                metrics = self._get_service_metrics()
            elif metric_type == 'database':
                metrics = list(self.metrics_collector.metrics_store['database'])[-100:]
            elif metric_type == 'cache':
                metrics = list(self.metrics_collector.metrics_store['cache'])[-100:]
            else:
                metrics = self.metrics_collector.get_metrics_summary()
            
            await websocket.send(json.dumps({
                'type': 'metrics_response',
                'data': {
                    'metric_type': metric_type,
                    'metrics': metrics
                }
            }))
        
        elif msg_type == 'subscribe':
            # Client wants to subscribe to specific updates
            subscriptions = data.get('subscriptions', [])
            # Store subscriptions for this client (would need client tracking)
            await websocket.send(json.dumps({
                'type': 'subscription_confirmed',
                'data': {'subscriptions': subscriptions}
            }))
    
    def _get_service_metrics(self) -> Dict:
        """Get formatted service metrics"""
        services = {}
        
        for service_id, data in self.metrics_collector.metrics_store['services'].items():
            health_history = list(data['health_history'])[-20:]
            response_times = list(data['response_times'])[-20:]
            
            # Calculate uptime
            if health_history:
                healthy_count = sum(1 for h in health_history if h['status'] == 'healthy')
                uptime = (healthy_count / len(health_history)) * 100
            else:
                uptime = 0
            
            # Average response time
            avg_response_time = sum(response_times) / len(response_times) if response_times else 0
            
            services[service_id] = {
                'uptime_percent': uptime,
                'avg_response_time': avg_response_time,
                'error_count': data['error_count'],
                'last_check': data['last_check'],
                'health_history': health_history,
                'response_times': response_times
            }
        
        return services
    
    async def broadcast_loop(self):
        """Continuously broadcast updates to all clients"""
        self.logger.info("Starting WebSocket broadcast loop")
        
        while True:
            try:
                # Get latest metrics
                summary = self.metrics_collector.get_metrics_summary()
                
                # Send to all connected clients
                await self.send_to_all({
                    'type': 'metrics_update',
                    'data': summary
                })
                
                # Check for alerts
                if summary['alerts']['count'] > 0:
                    await self.send_to_all({
                        'type': 'alert',
                        'data': {
                            'alerts': summary['alerts']['recent']
                        }
                    })
                
                # Wait before next broadcast
                await asyncio.sleep(5)  # Broadcast every 5 seconds
                
            except Exception as e:
                self.logger.error(f"Broadcast loop error: {e}")
                await asyncio.sleep(5)
    
    async def start_server(self, host: str = 'localhost', port: int = 9998):
        """Start the WebSocket server"""
        self.logger.info(f"Starting WebSocket server on {host}:{port}")
        
        # Start broadcast loop
        broadcast_task = asyncio.create_task(self.broadcast_loop())
        
        # Start WebSocket server
        async with websockets.serve(self.handle_client, host, port):
            await asyncio.Future()  # Run forever