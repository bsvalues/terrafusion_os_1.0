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
        # Configuration driven: use environment variables where possible
        self.api_port = int(os.getenv("TF_API_PORT", os.getenv("TF_SHELL_API_PORT", "8084")))
        self.shell_url = None

        # Server port will be selected from a configurable range
        self.server_port = None

        # Shutdown coordination
        self.shutdown_event = threading.Event()
        
    def start_api_server(self):
        """Start FastAPI server with real-time API"""
        try:
            from .api_server import TerraFusionAPI
            # Find available port using configurable range
            start_port = int(os.getenv("TF_SHELL_PORT_RANGE_START", "8090"))
            end_port = int(os.getenv("TF_SHELL_PORT_RANGE_END", "8100"))

            for port in range(start_port, end_port):
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
                    # try next port
                    continue
            else:
                raise Exception("No available ports found in configured range")
                
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
            # Optional explicit browser choice via env var (do not auto-install)
            explicit_browser = os.getenv("TF_SHELL_BROWSER")
            if explicit_browser:
                try:
                    subprocess.run([explicit_browser, self.shell_url],
                                   check=False,
                                   stdout=subprocess.DEVNULL,
                                   stderr=subprocess.DEVNULL)
                except FileNotFoundError:
                    logger.debug(f"Requested browser '{explicit_browser}' not found")

            # Optional list of browsers to try if operator opted-in via TF_TRY_BROWSERS=true
            if os.getenv("TF_TRY_BROWSERS", "false").lower() == "true":
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
            logger.exception(f"❌ Failed to start kernel services: {e}")
            # Do not crash the shell; log and continue with UI available
    
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
║  🏢 Vendor substrate: available (vendors integrate via vendor hub)           ║
║                                                                               ║
║  Press Ctrl+C to shutdown the system                                        ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
                """)

                # Keep server running until shutdown event is set
                try:
                    self.shutdown_event.wait()
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
            
            # Signal shutdown to any waiting threads
            try:
                self.shutdown_event.set()
            except Exception:
                pass

            if self.web_server:
                # Some API server implementations (like desktop.api_server.TerraFusionAPI)
                # don't expose a shutdown() helper. Prefer calling it if present,
                # otherwise skip and rely on process exit or external orchestration.
                shutdown_fn = getattr(self.web_server, 'shutdown', None)
                if callable(shutdown_fn):
                    try:
                        shutdown_fn()
                    except Exception:
                        logger.exception("Error shutting down web server")
                else:
                    logger.debug("web_server has no shutdown() method; skipping explicit shutdown")

            if self.kernel:
                try:
                    self.kernel.stop()
                except Exception:
                    logger.exception("Error stopping kernel")

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
        # Do NOT perform runtime pip installs. If native webview is required
        # operators should install `pywebview` beforehand. We attempt to
        # import it only if `TF_USE_NATIVE_WEBVIEW` is set to true.
        try:
            if os.getenv("TF_USE_NATIVE_WEBVIEW", "false").lower() == "true":
                import webview  # type: ignore
                logger.info("Native webview available")
        except Exception:
            logger.info("Native webview not available; falling back to system browser")
    except Exception:
        logger.exception("Unexpected error during startup checks")
    
    # Create and run web shell
    shell = TerraFusionWebShell()

    # Setup signal handlers for clean shutdown
    try:
        import signal

        def _handle_signal(signum, frame):
            logger.info(f"Received signal {signum}; shutting down")
            try:
                shell.shutdown()
            except Exception:
                logger.exception("Error during signal shutdown")

        signal.signal(signal.SIGINT, _handle_signal)
        signal.signal(signal.SIGTERM, _handle_signal)
    except Exception:
        logger.debug("Signal handlers not installed")

    shell.run()

if __name__ == "__main__":
    main()