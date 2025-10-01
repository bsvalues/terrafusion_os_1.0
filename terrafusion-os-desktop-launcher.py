#!/usr/bin/env python3
"""
TerraFusion OS Desktop Application Launcher
Native desktop environment for government operations
Integrates actual TerraFusion modules as desktop applications
"""

import asyncio
import json
import subprocess
import os
import signal
import sys
from datetime import datetime
from pathlib import Path
from aiohttp import web
import aiohttp_cors
import logging

class TerraFusionOSDesktop:
    """TerraFusion OS Native Desktop Environment"""
    
    def __init__(self):
        self.port = int(os.environ.get('TF_DESKTOP_PORT', 4000))
        self.logger = self._setup_logging()
        self.modules_path = Path("/workspaces/terrafusion_os_1.0/modules")
        self.running_modules = {}  # Track running module processes
        
        # Load actual TerraFusion modules
        self.government_modules = self._discover_modules()
        
        # Desktop environment config
        self.desktop_config = {
            "os_name": "TerraFusion cOS",
            "os_version": "1.0.0",
            "desktop_environment": "TerraFusion Government Desktop",
            "government_mode": True,
            "vendor_integration": True,
            "module_count": len(self.government_modules)
        }
        
        self.logger.info(f"🏛️ TerraFusion OS Desktop initialized with {len(self.government_modules)} modules")
    
    def _setup_logging(self):
        """Configure logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s | %(name)s | %(levelname)s | %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
        return logging.getLogger('TerraFusionOS.Desktop')
    
    def _discover_modules(self):
        """Discover actual TerraFusion modules"""
        modules = {}
        
        if not self.modules_path.exists():
            self.logger.warning("Modules directory not found")
            return modules
        
        # Scan for TerraFusion modules
        for module_dir in self.modules_path.iterdir():
            if module_dir.is_dir() and not module_dir.name.startswith('.'):
                manifest_path = module_dir / "module.manifest.json"
                pwa_path = module_dir / "PWA" / "plugin.json"
                
                # Check for module manifest
                if manifest_path.exists():
                    try:
                        with open(manifest_path) as f:
                            manifest = json.load(f)
                        modules[module_dir.name] = {
                            "name": manifest.get("name", module_dir.name),
                            "type": "native_module",
                            "path": str(module_dir),
                            "manifest": manifest,
                            "entry_point": module_dir / "index.html"
                        }
                    except Exception as e:
                        self.logger.warning(f"Failed to load manifest for {module_dir.name}: {e}")
                
                # Check for PWA plugin
                elif pwa_path.exists():
                    try:
                        with open(pwa_path) as f:
                            plugin = json.load(f)
                        modules[module_dir.name] = {
                            "name": plugin.get("name", module_dir.name),
                            "type": "pwa_module",
                            "path": str(module_dir),
                            "plugin": plugin,
                            "entry_point": module_dir / "PWA" / "index.js"
                        }
                    except Exception as e:
                        self.logger.warning(f"Failed to load PWA plugin for {module_dir.name}: {e}")
                
                # Basic module detection
                elif (module_dir / "index.html").exists():
                    modules[module_dir.name] = {
                        "name": module_dir.name.replace('-', ' ').title(),
                        "type": "html_module",
                        "path": str(module_dir),
                        "entry_point": module_dir / "index.html"
                    }
        
        return modules
    
    async def launch_module(self, module_id, vendor_context=None):
        """Launch a TerraFusion module as desktop application"""
        if module_id not in self.government_modules:
            raise ValueError(f"Module {module_id} not found")
        
        module = self.government_modules[module_id]
        self.logger.info(f"🚀 Launching {module['name']} ({module['type']})")
        
        try:
            if module['type'] == 'native_module':
                # Launch native module
                result = await self._launch_native_module(module_id, module, vendor_context)
            elif module['type'] == 'pwa_module':
                # Launch PWA module
                result = await self._launch_pwa_module(module_id, module, vendor_context)
            else:
                # Launch HTML module
                result = await self._launch_html_module(module_id, module, vendor_context)
            
            self.logger.info(f"✅ {module['name']} launched successfully")
            return result
            
        except Exception as e:
            self.logger.error(f"❌ Failed to launch {module['name']}: {e}")
            raise
    
    async def _launch_native_module(self, module_id, module, vendor_context):
        """Launch native TerraFusion module"""
        module_path = Path(module['path'])
        
        # Check for specific launch scripts
        if (module_path / "start.sh").exists():
            cmd = ["bash", str(module_path / "start.sh")]
        elif (module_path / "package.json").exists():
            cmd = ["npm", "start"]
            os.chdir(module_path)
        else:
            # Use electron to display the module
            cmd = ["electron", str(module['entry_point'])]
        
        # Launch the module process
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            cwd=module_path
        )
        
        self.running_modules[module_id] = {
            "process": process,
            "module": module,
            "started_at": datetime.now().isoformat(),
            "vendor_context": vendor_context
        }
        
        return {
            "module_id": module_id,
            "name": module['name'],
            "status": "launched",
            "pid": process.pid,
            "type": "native_desktop_application"
        }
    
    async def _launch_pwa_module(self, module_id, module, vendor_context):
        """Launch PWA module in desktop mode"""
        module_path = Path(module['path'])
        
        # For PWA modules, create a desktop window
        entry_point = module.get('entry_point', module_path / "index.html")
        
        # Use electron to create a native window for the PWA
        cmd = [
            "electron",
            "-e",
            f"""
            const {{ app, BrowserWindow }} = require('electron');
            app.whenReady().then(() => {{
                const win = new BrowserWindow({{
                    width: 1200,
                    height: 800,
                    title: '{module['name']}',
                    webPreferences: {{
                        nodeIntegration: true,
                        contextIsolation: false
                    }}
                }});
                win.loadFile('{entry_point}');
                win.webContents.openDevTools();
            }});
            app.on('window-all-closed', () => app.quit());
            """
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        self.running_modules[module_id] = {
            "process": process,
            "module": module,
            "started_at": datetime.now().isoformat(),
            "vendor_context": vendor_context
        }
        
        return {
            "module_id": module_id,
            "name": module['name'],
            "status": "launched",
            "pid": process.pid,
            "type": "pwa_desktop_application"
        }
    
    async def _launch_html_module(self, module_id, module, vendor_context):
        """Launch HTML module in electron window"""
        entry_point = module['entry_point']
        
        cmd = [
            "electron",
            "-e",
            f"""
            const {{ app, BrowserWindow }} = require('electron');
            app.whenReady().then(() => {{
                const win = new BrowserWindow({{
                    width: 1400,
                    height: 900,
                    title: '{module['name']} - TerraFusion Government Module',
                    webPreferences: {{
                        nodeIntegration: true,
                        contextIsolation: false
                    }}
                }});
                win.loadFile('{entry_point}');
                win.setMenuBarVisibility(false);
            }});
            app.on('window-all-closed', () => app.quit());
            """
        ]
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        self.running_modules[module_id] = {
            "process": process,
            "module": module,
            "started_at": datetime.now().isoformat(),
            "vendor_context": vendor_context
        }
        
        return {
            "module_id": module_id,
            "name": module['name'],
            "status": "launched",
            "pid": process.pid,
            "type": "html_desktop_application"
        }
    
    async def setup_routes(self):
        """Setup HTTP API routes"""
        app = web.Application()
        
        # CORS setup
        cors = aiohttp_cors.setup(app, defaults={
            "*": aiohttp_cors.ResourceOptions(
                allow_credentials=True,
                expose_headers="*",
                allow_headers="*",
                allow_methods="*"
            )
        })
        
        # Desktop OS API routes
        cors.add(app.router.add_get('/', self.desktop_home))
        cors.add(app.router.add_get('/api/desktop/status', self.desktop_status))
        cors.add(app.router.add_get('/api/modules', self.list_modules))
        cors.add(app.router.add_post('/api/modules/{module_id}/launch', self.launch_module_api))
        cors.add(app.router.add_get('/api/modules/running', self.running_modules_api))
        cors.add(app.router.add_post('/api/modules/{module_id}/close', self.close_module_api))
        
        # Vendor integration APIs
        cors.add(app.router.add_post('/api/vendor/launch', self.vendor_launch_api))
        cors.add(app.router.add_get('/api/vendor/modules', self.vendor_modules_api))
        
        return app
    
    async def desktop_home(self, request):
        """Main desktop interface"""
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>TerraFusion cOS - Government Desktop</title>
            <style>
                body {{ 
                    font-family: 'Segoe UI', Arial, sans-serif; 
                    margin: 0; 
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    color: white;
                    overflow-x: hidden;
                }}
                .desktop-header {{
                    background: rgba(0,0,0,0.3);
                    padding: 20px;
                    text-align: center;
                    border-bottom: 2px solid #4CAF50;
                }}
                .module-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    padding: 30px;
                    max-width: 1400px;
                    margin: 0 auto;
                }}
                .module-card {{
                    background: rgba(255,255,255,0.1);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid rgba(255,255,255,0.2);
                    backdrop-filter: blur(10px);
                    transition: all 0.3s ease;
                    cursor: pointer;
                }}
                .module-card:hover {{
                    transform: translateY(-5px);
                    background: rgba(255,255,255,0.15);
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                }}
                .module-name {{
                    font-size: 1.3em;
                    font-weight: bold;
                    margin-bottom: 10px;
                    color: #4CAF50;
                }}
                .module-type {{
                    font-size: 0.9em;
                    opacity: 0.8;
                    margin-bottom: 15px;
                }}
                .launch-btn {{
                    background: #4CAF50;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: background 0.3s;
                }}
                .launch-btn:hover {{
                    background: #45a049;
                }}
                .status-bar {{
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0,0,0,0.8);
                    padding: 10px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }}
            </style>
        </head>
        <body>
            <div class="desktop-header">
                <h1>🏛️ TerraFusion cOS</h1>
                <p>Government Operating System - Desktop Environment</p>
                <p>Available Modules: {len(self.government_modules)} | Running: <span id="running-count">0</span></p>
            </div>
            
            <div class="module-grid">
                {self._generate_module_cards()}
            </div>
            
            <div class="status-bar">
                <div>TerraFusion cOS v1.0.0 | Government Desktop</div>
                <div>Modules Loaded: {len(self.government_modules)}</div>
            </div>
            
            <script>
                async function launchModule(moduleId, moduleName) {{
                    try {{
                        console.log('🚀 Launching', moduleName);
                        const response = await fetch(`/api/modules/${{moduleId}}/launch`, {{
                            method: 'POST',
                            headers: {{ 'Content-Type': 'application/json' }},
                            body: JSON.stringify({{ vendor_context: {{ launched_from: 'desktop' }} }})
                        }});
                        
                        const result = await response.json();
                        
                        if (result.status === 'launched') {{
                            alert(`✅ ${{moduleName}} launched successfully!\\nPID: ${{result.pid}}\\nType: ${{result.type}}`);
                            updateRunningCount();
                        }} else {{
                            alert(`❌ Failed to launch ${{moduleName}}: ${{result.error || 'Unknown error'}}`);
                        }}
                    }} catch (error) {{
                        console.error('Launch error:', error);
                        alert(`❌ Failed to launch ${{moduleName}}: ${{error.message}}`);
                    }}
                }}
                
                async function updateRunningCount() {{
                    try {{
                        const response = await fetch('/api/modules/running');
                        const running = await response.json();
                        document.getElementById('running-count').textContent = running.running_modules.length;
                    }} catch (error) {{
                        console.error('Failed to update running count:', error);
                    }}
                }}
                
                // Update running count every 5 seconds
                setInterval(updateRunningCount, 5000);
                updateRunningCount();
            </script>
        </body>
        </html>
        """
        return web.Response(text=html, content_type='text/html')
    
    def _generate_module_cards(self):
        """Generate HTML cards for each module"""
        cards = []
        for module_id, module in self.government_modules.items():
            card = f"""
            <div class="module-card" onclick="launchModule('{module_id}', '{module['name']}')">
                <div class="module-name">{module['name']}</div>
                <div class="module-type">Type: {module['type']}</div>
                <div class="module-path">Path: {module['path']}</div>
                <button class="launch-btn" onclick="event.stopPropagation(); launchModule('{module_id}', '{module['name']}')">
                    Launch Application
                </button>
            </div>
            """
            cards.append(card)
        
        return '\n'.join(cards)
    
    async def desktop_status(self, request):
        """Desktop environment status"""
        return web.json_response({
            "status": "operational",
            "os_name": "TerraFusion cOS",
            "os_version": "1.0.0",
            "desktop_environment": "TerraFusion Government Desktop",
            "government_mode": True,
            "modules": {
                "total": len(self.government_modules),
                "running": len(self.running_modules),
                "available": list(self.government_modules.keys())
            },
            "vendor_integration": {
                "api_gateway": "http://localhost:8003",
                "vendor_substrate": "http://localhost:8000",
                "harris_pacs": "http://localhost:8001",
                "terra_flow": "http://localhost:8002"
            },
            "timestamp": datetime.now().isoformat()
        })
    
    async def list_modules(self, request):
        """List all available modules"""
        return web.json_response({
            "modules": self.government_modules,
            "count": len(self.government_modules)
        })
    
    async def launch_module_api(self, request):
        """API endpoint to launch a module"""
        module_id = request.match_info['module_id']
        
        try:
            data = await request.json() if request.content_type == 'application/json' else {}
            vendor_context = data.get('vendor_context')
            
            result = await self.launch_module(module_id, vendor_context)
            return web.json_response(result)
            
        except ValueError as e:
            return web.json_response({"error": str(e)}, status=404)
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
    async def running_modules_api(self, request):
        """Get list of running modules"""
        running = []
        for module_id, info in self.running_modules.items():
            # Check if process is still running
            if info['process'].returncode is None:
                running.append({
                    "module_id": module_id,
                    "name": info['module']['name'],
                    "pid": info['process'].pid,
                    "started_at": info['started_at'],
                    "type": info['module']['type']
                })
            else:
                # Remove completed processes
                del self.running_modules[module_id]
        
        return web.json_response({
            "running_modules": running,
            "count": len(running)
        })
    
    async def close_module_api(self, request):
        """Close a running module"""
        module_id = request.match_info['module_id']
        
        if module_id not in self.running_modules:
            return web.json_response({"error": "Module not running"}, status=404)
        
        try:
            process = self.running_modules[module_id]['process']
            process.terminate()
            await process.wait()
            
            del self.running_modules[module_id]
            
            return web.json_response({"status": "closed", "module_id": module_id})
            
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
    async def vendor_launch_api(self, request):
        """Vendor-specific module launch"""
        data = await request.json()
        module_id = data.get('module_id')
        vendor_info = data.get('vendor_info', {})
        
        if not module_id:
            return web.json_response({"error": "module_id required"}, status=400)
        
        try:
            result = await self.launch_module(module_id, vendor_info)
            return web.json_response({
                **result,
                "vendor_integration": True,
                "launched_for_vendor": vendor_info.get('vendor_name', 'Unknown')
            })
        except Exception as e:
            return web.json_response({"error": str(e)}, status=500)
    
    async def vendor_modules_api(self, request):
        """Get modules suitable for vendor demonstration"""
        vendor_modules = {}
        
        # Filter modules that are good for vendor demos
        demo_modules = ['ai-swarm', 'terra-fusion-sync', 'terra-flow', 'gispro', 'costforge-ai']
        
        for module_id in demo_modules:
            if module_id in self.government_modules:
                vendor_modules[module_id] = self.government_modules[module_id]
        
        return web.json_response({
            "vendor_modules": vendor_modules,
            "count": len(vendor_modules),
            "recommended_for_vendors": True
        })
    
    async def start_desktop_os(self):
        """Start the TerraFusion Desktop OS"""
        app = await self.setup_routes()
        
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, 'localhost', self.port)
        await site.start()
        
        self.logger.info(f"🖥️ TerraFusion cOS Desktop launched on http://localhost:{self.port}")
        self.logger.info(f"🏛️ Government Desktop Environment ready")
        self.logger.info(f"📱 Available modules: {', '.join(self.government_modules.keys())}")
        
        return runner

async def main():
    """Main entry point"""
    desktop = TerraFusionOSDesktop()
    
    try:
        runner = await desktop.start_desktop_os()
        print(f"\n🏛️ TerraFusion cOS Desktop Environment")
        print(f"🖥️ Desktop: http://localhost:{desktop.port}")
        print(f"📱 Modules: {len(desktop.government_modules)} available")
        print(f"🔗 Vendor APIs: Gateway on port 8003")
        print(f"\n✅ Ready for vendor demonstrations and government operations")
        
        # Keep running
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        print("\n🛑 Shutting down TerraFusion cOS Desktop...")
        
        # Close all running modules
        for module_id, info in desktop.running_modules.items():
            try:
                info['process'].terminate()
                await info['process'].wait()
            except:
                pass
        
        await runner.cleanup()

if __name__ == "__main__":
    asyncio.run(main())