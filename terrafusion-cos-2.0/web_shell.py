#!/usr/bin/env python3
"""
TerraFusion cOS Web-Based Desktop Shell
Modern interface using WebView instead of primitive tkinter
"""

import os
import sys
import subprocess
import threading
import time
import webbrowser
from pathlib import Path
import http.server
import socketserver
from urllib.parse import urlparse

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from brand import colors, typography, visual_language
from kernel.main import TerraFusionKernel
import logging

logger = logging.getLogger(__name__)

class TerraFusionWebShell:
    """Modern web-based desktop shell for TerraFusion cOS"""
    
    def __init__(self):
        self.kernel = None
        self.web_server = None
        self.api_port = 8084
        self.shell_url = None
        
    def start_api_server(self):
        """Start FastAPI server with real-time API"""
        try:
            from api_server import TerraFusionAPI
            
            # Find available port
            for port in range(8090, 8100):
                try:
                    self.server_port = port
                    self.shell_url = f"http://localhost:{port}/"
                    
                    logger.info(f"🌐 TerraFusion API server starting on port {port}")
                    
                    # Start API server in background thread
                    api = TerraFusionAPI()
                    server_thread = threading.Thread(
                        target=api.run,
                        args=("localhost", port),
                        daemon=True
                    )
                    server_thread.start()
                    self.web_server = api
                    
                    # Give server time to start
                    time.sleep(1)
                    break
                    
                except OSError:
                    continue
            else:
                raise Exception("No available ports found")
                
        except Exception as e:
            logger.error(f"❌ Failed to start API server: {e}")
            raise
    
    def launch_browser(self):
        """Launch the web interface in default browser"""
        try:
            logger.info(f"🚀 Opening TerraFusion cOS at {self.shell_url}")
            
            # Try to use system's default browser
            webbrowser.open(self.shell_url)
            
            # For development, also try to open in specific browsers
            browsers_to_try = [
                'google-chrome',
                'chromium-browser', 
                'firefox',
                'microsoft-edge'
            ]
            
            for browser in browsers_to_try:
                try:
                    subprocess.run([browser, self.shell_url], 
                                 check=False, 
                                 stdout=subprocess.DEVNULL, 
                                 stderr=subprocess.DEVNULL)
                    break
                except FileNotFoundError:
                    continue
                    
        except Exception as e:
            logger.error(f"❌ Failed to launch browser: {e}")
            logger.info(f"💡 Please manually open: {self.shell_url}")
    
    def try_native_webview(self):
        """Try to use native webview if available"""
        try:
            # Try webview library for native window
            import webview
            
            logger.info("🎯 Using native webview for desktop interface")
            
            webview.create_window(
                title="TerraFusion cOS - Government Technology Platform",
                url=self.shell_url,
                width=1400,
                height=900,
                min_size=(1000, 700),
                resizable=True,
                maximized=False,
                on_top=False,
                shadow=True,
                vibrancy=True
            )
            
            webview.start(debug=False)
            
        except ImportError:
            logger.info("📋 Native webview not available, using browser")
            return False
        except Exception as e:
            logger.error(f"❌ Native webview failed: {e}")
            logger.info("🌐 Falling back to browser mode...")
            self.launch_browser()
            return False
            
        return True
    
    def start_kernel_services(self):
        """Start TerraFusion kernel and services"""
        try:
            logger.info("🔧 Starting TerraFusion kernel services...")
            
            self.kernel = TerraFusionKernel()
            
            # Start kernel in background thread
            kernel_thread = threading.Thread(
                target=self.kernel.start,
                daemon=True
            )
            kernel_thread.start()
            
            # Give services time to start
            time.sleep(2)
            
            logger.info("✅ Kernel services started")
            
        except Exception as e:
            logger.error(f"❌ Failed to start kernel services: {e}")
            # Continue anyway - the web interface can still show
    
    def run(self):
        """Run the TerraFusion cOS web-based desktop"""
        try:
            print(f"""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║  ████████╗███████╗██████╗ ██████╗  █████╗ ███████╗██╗   ██╗███████╗██╗ ██████╗  ║
║  ╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██║   ██║██╔════╝██║██╔═══██╗ ║
║     ██║   █████╗  ██████╔╝██████╔╝███████║█████╗  ██║   ██║███████╗██║██║   ██║ ║
║     ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║██╔══╝  ██║   ██║╚════██║██║██║   ██║ ║
║     ██║   ███████╗██║  ██║██║  ██║██║  ██║██║     ╚██████╔╝███████║██║╚██████╔╝ ║
║     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝  ║
║                                                                               ║
║                         TerraFusion cOS                                      ║
║                            Government. Transcended.                          ║
║                                                                               ║
║  🌐 Modern Web-Based Desktop Interface                                       ║
║  ✨ WebGL-Enhanced Brand Experience                                          ║
║  🚀 Professional Government Technology Platform                              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
            """)
            
            # Start API server
            self.start_api_server()
            
            # Start kernel services
            self.start_kernel_services()
            
            # Try native webview first, fallback to browser
            if not self.try_native_webview():
                self.launch_browser()
                
                print(f"""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║                    🚀 TERRAFUSION cOS WEB INTERFACE READY                    ║
║                                                                               ║
║  🌐 Interface URL: {self.shell_url:<50} ║
║  ✨ WebGL Effects: Enabled                                                   ║
║  🎨 Brand Assets: Professional Government Theme                              ║
║  🏢 Vendor Platform: Ready for Woolpert, AECOM, Esri                        ║
║                                                                               ║
║  Press Ctrl+C to shutdown the system                                        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
                """)
                
                # Keep server running
                try:
                    while True:
                        time.sleep(1)
                except KeyboardInterrupt:
                    logger.info("🛑 Shutdown requested by user")
            
        except Exception as e:
            logger.error(f"❌ Failed to start TerraFusion cOS web shell: {e}")
            sys.exit(1)
        finally:
            self.shutdown()
    
    def shutdown(self):
        """Shutdown the web shell and services"""
        try:
            logger.info("🛑 Shutting down TerraFusion cOS...")
            
            if self.web_server:
                self.web_server.shutdown()
                
            if self.kernel:
                self.kernel.stop()
                
            logger.info("✅ Shutdown complete")
            
        except Exception as e:
            logger.error(f"❌ Error during shutdown: {e}")

def main():
    """Main entry point"""
    # Setup logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    try:
        # Try to install webview for native window
        try:
            import webview
            logger.info("✅ Native webview available")
        except ImportError:
            logger.info("💡 Installing pywebview for native desktop window...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", "pywebview"])
                logger.info("✅ pywebview installed successfully")
            except subprocess.CalledProcessError:
                logger.info("📋 pywebview installation failed, will use browser fallback")
    except Exception as e:
        logger.info(f"📋 Will use browser fallback: {e}")
    
    # Create and run web shell
    shell = TerraFusionWebShell()
    shell.run()

if __name__ == "__main__":
    main()