#!/usr/bin/env python3
"""
🏆 DYNASTY MASTER ORCHESTRATOR
The Supreme Commander - Coordinates all dynasty components
"""

import asyncio
import logging
import signal
import sys
import os
from datetime import datetime
from pathlib import Path
import json
import subprocess
from typing import Dict, List, Optional, Any
import aiohttp
import psutil
import socket

# Configure championship logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(name)s | %(levelname)s | %(message)s',
    handlers=[
        logging.FileHandler('dynasty_master.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('DYNASTY_MASTER')

class DynastyComponent:
    """Base class for all dynasty components"""
    
    def __init__(self, name: str, command: List[str], health_check_url: Optional[str] = None):
        self.name = name
        self.command = command
        self.health_check_url = health_check_url
        self.process: Optional[subprocess.Popen] = None
        self.status = "stopped"
        self.start_time = None
        self.restart_count = 0
        
    async def start(self):
        """Start the component"""
        try:
            logger.info(f"🚀 Starting {self.name}...")
            self.process = subprocess.Popen(
                self.command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            self.status = "starting"
            self.start_time = datetime.now()
            
            # Wait for component to be ready
            if self.health_check_url:
                await self._wait_for_health()
            else:
                await asyncio.sleep(5)  # Default startup time
                
            self.status = "running"
            logger.info(f"✅ {self.name} is running!")
            
        except Exception as e:
            logger.error(f"❌ Failed to start {self.name}: {e}")
            self.status = "failed"
            raise
    
    async def stop(self):
        """Stop the component"""
        if self.process:
            logger.info(f"🛑 Stopping {self.name}...")
            self.process.terminate()
            try:
                self.process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.process.kill()
            self.status = "stopped"
            logger.info(f"✅ {self.name} stopped")
    
    async def restart(self):
        """Restart the component"""
        logger.info(f"🔄 Restarting {self.name}...")
        await self.stop()
        await asyncio.sleep(2)
        await self.start()
        self.restart_count += 1
    
    async def health_check(self) -> bool:
        """Check component health"""
        if not self.health_check_url:
            # Check if process is running
            return self.process and self.process.poll() is None
            
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.health_check_url, timeout=5) as response:
                    return response.status == 200
        except:
            return False
    
    async def _wait_for_health(self, timeout: int = 60):
        """Wait for component to be healthy"""
        start = datetime.now()
        while (datetime.now() - start).seconds < timeout:
            if await self.health_check():
                return
            await asyncio.sleep(1)
        raise TimeoutError(f"{self.name} failed to become healthy in {timeout}s")

class DynastyMasterOrchestrator:
    """The Master Orchestrator - Controls the entire dynasty"""
    
    def __init__(self):
        self.components: Dict[str, DynastyComponent] = {}
        self.running = False
        self.start_time = None
        self.metrics = {
            'uptime': 0,
            'total_queries': 0,
            'restarts': 0,
            'errors': 0
        }
        
        # Initialize all components
        self._initialize_components()
        
    def _initialize_components(self):
        """Initialize all dynasty components"""
        
        # 1. Ollama LLM Service
        self.components['ollama'] = DynastyComponent(
            name="Ollama LLM Service",
            command=["ollama", "serve"],
            health_check_url="http://localhost:\${{TF_ADMIN_PORT:-8080}}/api/tags"
        )
        
        # 2. Hybrid Router API
        self.components['router'] = DynastyComponent(
            name="Hybrid Router API",
            command=["python3", "hybrid_llm_router.py", "--serve"],
            health_check_url="http://localhost:\${{TF_ADMIN_PORT:-8080}}/health"
        )
        
        # 3. Autonomous Orchestrator
        self.components['autonomous'] = DynastyComponent(
            name="Autonomous Orchestrator",
            command=["python3", "autonomous_orchestrator.py"],
            health_check_url="http://localhost:\${{TF_ADMIN_PORT:-8080}}/health"
        )
        
        # 4. Training Pipeline
        self.components['training'] = DynastyComponent(
            name="Training Pipeline",
            command=["python3", "continuous_training_pipeline.py"],
            health_check_url="http://localhost:\${{TF_ADMIN_PORT:-8080}}/health"
        )
        
        # 5. Evolution Engine
        self.components['evolution'] = DynastyComponent(
            name="Evolution Engine", 
            command=["python3", "autonomous_evolution_engine.py"],
            health_check_url="http://localhost:\${{TF_ADMIN_PORT:-8080}}/health"
        )
        
        # 6. Quantum Optimizer
        self.components['quantum'] = DynastyComponent(
            name="Quantum Optimizer",
            command=["python3", "quantum_optimization_layer.py"],
            health_check_url="http://localhost:\${{TF_ADMIN_PORT:-8080}}/health"
        )
        
        # 7. Dashboard Server
        self.components['dashboard'] = DynastyComponent(
            name="Championship Dashboard",
            command=["python3", "-m", "http.server", "8090", "--directory", "."],
            health_check_url="http://localhost:\${{TF_ADMIN_PORT:-8080}}/"
        )
        
        # 8. Neural Consciousness (Optional)
        if os.getenv('ENABLE_CONSCIOUSNESS', 'false').lower() == 'true':
            self.components['consciousness'] = DynastyComponent(
                name="Neural Consciousness",
                command=["python3", "neural_consciousness_layer.py"],
                health_check_url="http://localhost:\${{TF_ADMIN_PORT:-8080}}/health"
            )
    
    async def start_dynasty(self):
        """Start the entire dynasty"""
        logger.info("🏆 STARTING THE BENTON COUNTY DYNASTY 🏆")
        logger.info("=====================================")
        
        self.running = True
        self.start_time = datetime.now()
        
        # Start components in order
        startup_order = [
            'ollama',      # LLM service first
            'router',      # Routing service
            'autonomous',  # Autonomous systems
            'training',    # Training pipeline
            'evolution',   # Evolution engine
            'quantum',     # Quantum optimizer
            'dashboard'    # UI last
        ]
        
        # Add consciousness if enabled
        if 'consciousness' in self.components:
            startup_order.append('consciousness')
        
        for component_name in startup_order:
            if component_name in self.components:
                try:
                    await self.components[component_name].start()
                    await asyncio.sleep(2)  # Stagger startups
                except Exception as e:
                    logger.error(f"Failed to start {component_name}: {e}")
                    # Continue with other components
        
        logger.info("✅ All dynasty components started!")
        logger.info(f"🌐 Dashboard: http://localhost:\${{TF_ADMIN_PORT:-8080}}/championship_ui.html")
        
        # Start monitoring
        asyncio.create_task(self._monitor_health())
        asyncio.create_task(self._collect_metrics())
        
    async def stop_dynasty(self):
        """Stop the entire dynasty gracefully"""
        logger.info("🛑 Stopping the dynasty...")
        self.running = False
        
        # Stop in reverse order
        for component in reversed(list(self.components.values())):
            await component.stop()
            
        logger.info("✅ Dynasty stopped")
        
    async def _monitor_health(self):
        """Monitor component health and auto-restart if needed"""
        while self.running:
            try:
                for name, component in self.components.items():
                    if component.status == "running":
                        healthy = await component.health_check()
                        
                        if not healthy:
                            logger.warning(f"⚠️ {name} is unhealthy!")
                            self.metrics['errors'] += 1
                            
                            # Auto-restart if under threshold
                            if component.restart_count < 3:
                                await component.restart()
                                self.metrics['restarts'] += 1
                            else:
                                logger.error(f"❌ {name} exceeded restart limit")
                                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Health monitor error: {e}")
                
    async def _collect_metrics(self):
        """Collect and log system metrics"""
        while self.running:
            try:
                # Update uptime
                if self.start_time:
                    self.metrics['uptime'] = (datetime.now() - self.start_time).seconds
                
                # System metrics
                cpu_percent = psutil.cpu_percent(interval=1)
                memory = psutil.virtual_memory()
                disk = psutil.disk_usage('/')
                
                # Component status
                running_components = sum(1 for c in self.components.values() if c.status == "running")
                total_components = len(self.components)
                
                # Log metrics
                logger.info(f"📊 DYNASTY METRICS:")
                logger.info(f"   Uptime: {self.metrics['uptime']}s")
                logger.info(f"   Components: {running_components}/{total_components}")
                logger.info(f"   CPU: {cpu_percent}%")
                logger.info(f"   Memory: {memory.percent}%")
                logger.info(f"   Disk: {disk.percent}%")
                logger.info(f"   Restarts: {self.metrics['restarts']}")
                logger.info(f"   Errors: {self.metrics['errors']}")
                
                # Save metrics for dashboard
                with open('dynasty_metrics.json', 'w') as f:
                    json.dump({
                        'timestamp': datetime.now().isoformat(),
                        'uptime': self.metrics['uptime'],
                        'components': {
                            name: {
                                'status': comp.status,
                                'restarts': comp.restart_count,
                                'uptime': (datetime.now() - comp.start_time).seconds if comp.start_time else 0
                            }
                            for name, comp in self.components.items()
                        },
                        'system': {
                            'cpu': cpu_percent,
                            'memory': memory.percent,
                            'disk': disk.percent
                        }
                    }, f, indent=2)
                
                await asyncio.sleep(60)  # Update every minute
                
            except Exception as e:
                logger.error(f"Metrics collection error: {e}")
    
    def get_status_report(self) -> Dict[str, Any]:
        """Generate comprehensive status report"""
        return {
            'dynasty_status': 'OPERATIONAL' if self.running else 'STOPPED',
            'uptime': self.metrics['uptime'],
            'components': {
                name: {
                    'status': comp.status,
                    'restarts': comp.restart_count,
                    'health': 'unknown'
                }
                for name, comp in self.components.items()
            },
            'metrics': self.metrics,
            'timestamp': datetime.now().isoformat()
        }

class DynastyAPI:
    """REST API for dynasty control"""
    
    def __init__(self, orchestrator: DynastyMasterOrchestrator):
        self.orchestrator = orchestrator
        self.app = None
        
    async def start(self, port: int = 8000):
        """Start the control API"""
        from aiohttp import web
        
        app = web.Application()
        app.router.add_get('/health', self.health_check)
        app.router.add_get('/status', self.get_status)
        app.router.add_post('/restart/{component}', self.restart_component)
        app.router.add_post('/stop', self.stop_dynasty)
        
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', port)
        await site.start()
        
        logger.info(f"🌐 Dynasty API running on http://localhost:{port}")
        
    async def health_check(self, request):
        """Health check endpoint"""
        from aiohttp import web
        return web.json_response({'status': 'healthy'})
        
    async def get_status(self, request):
        """Get dynasty status"""
        from aiohttp import web
        return web.json_response(self.orchestrator.get_status_report())
        
    async def restart_component(self, request):
        """Restart a specific component"""
        from aiohttp import web
        component_name = request.match_info['component']
        
        if component_name in self.orchestrator.components:
            await self.orchestrator.components[component_name].restart()
            return web.json_response({'status': 'restarted', 'component': component_name})
        else:
            return web.json_response({'error': 'Component not found'}, status=404)
            
    async def stop_dynasty(self, request):
        """Stop the dynasty"""
        from aiohttp import web
        await self.orchestrator.stop_dynasty()
        return web.json_response({'status': 'stopping'})

async def main():
    """Main dynasty entry point"""
    logger.info("🏆 BENTON COUNTY DYNASTY MASTER ORCHESTRATOR")
    logger.info("==========================================")
    
    # Create orchestrator
    orchestrator = DynastyMasterOrchestrator()
    
    # Create API
    api = DynastyAPI(orchestrator)
    
    # Handle signals
    def signal_handler(sig, frame):
        logger.info("🛑 Shutdown signal received")
        asyncio.create_task(orchestrator.stop_dynasty())
        sys.exit(0)
        
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        # Start API
        await api.start()
        
        # Start dynasty
        await orchestrator.start_dynasty()
        
        # Keep running
        while orchestrator.running:
            await asyncio.sleep(1)
            
    except Exception as e:
        logger.error(f"Dynasty error: {e}")
        await orchestrator.stop_dynasty()
        raise

if __name__ == "__main__":
    # Check dependencies
    required_commands = ['python3', 'ollama']
    missing = []
    
    for cmd in required_commands:
        if not subprocess.run(['which', cmd], capture_output=True).returncode == 0:
            missing.append(cmd)
    
    if missing:
        logger.error(f"❌ Missing required commands: {missing}")
        logger.error("Please install dependencies first!")
        sys.exit(1)
    
    # Check port availability
    required_ports = [8000, 8080, 8081, 8082, 8083, 8084, 8090, 11434]
    blocked_ports = []
    
    for port in required_ports:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        if result == 0:
            blocked_ports.append(port)
    
    if blocked_ports:
        logger.warning(f"⚠️ Ports already in use: {blocked_ports}")
        logger.warning("Some components may fail to start")
    
    # Run the dynasty
    asyncio.run(main())