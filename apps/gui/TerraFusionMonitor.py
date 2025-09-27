# TerraFusion OS 1.0 - System Tray Monitor
# Windows/macOS System Tray Application

import tkinter as tk
from tkinter import messagebox
import subprocess
import threading
import time
import os
import sys
import json
from datetime import datetime

# For system tray functionality
try:
    import pystray
    from PIL import Image, ImageDraw
    TRAY_AVAILABLE = True
except ImportError:
    TRAY_AVAILABLE = False
    print("Warning: pystray not available. System tray functionality disabled.")

class TerraFusionTray:
    def __init__(self):
        self.root = tk.Tk()
        self.root.withdraw()  # Hide the main window
        
        self.config = self.load_config()
        self.services_status = {}
        self.icon = None
        
        if TRAY_AVAILABLE:
            self.setup_tray()
        else:
            print("System tray not available. Running in console mode.")
            self.run_console_mode()
    
    def load_config(self):
        try:
            config_path = os.path.join(os.path.dirname(__file__), 'config', 'terrafusion.ini')
            if os.path.exists(config_path):
                return self.parse_ini_file(config_path)
            else:
                return self.get_default_config()
        except Exception as e:
            print(f"Configuration error: {e}")
            return self.get_default_config()
    
    def parse_ini_file(self, filepath):
        config = {}
        current_section = None
        
        with open(filepath, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('[') and line.endswith(']'):
                    current_section = line[1:-1]
                    config[current_section] = {}
                elif '=' in line and current_section:
                    key, value = line.split('=', 1)
                    config[current_section][key.strip()] = value.strip()
        
        return config
    
    def get_default_config(self):
        return {
            'County': {
                'Name': 'Benton County',
                'State': 'Washington'
            },
            'Database': {
                'Host': 'localhost',
                'Port': '5432',
                'Name': 'terrafusion_benton_production',
                'Username': 'terrafusion_db',
                'Password': ''
            }
        }
    
    def create_tray_icon(self):
        # Create a simple icon
        width = 64
        height = 64
        
        # Create image with TerraFusion colors
        image = Image.new('RGBA', (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        
        # Draw TerraFusion logo (simplified)
        draw.ellipse([8, 8, 56, 56], fill='#0891b2', outline='#00d2ff', width=2)
        draw.text((20, 25), "TF", fill='white', font=None)
        
        return image
    
    def setup_tray(self):
        # Create tray icon
        icon_image = self.create_tray_icon()
        
        # Create menu
        menu = pystray.Menu(
            pystray.MenuItem("TerraFusion OS 1.0", self.show_status, enabled=False),
            pystray.MenuItem("Benton County, WA", self.show_status, enabled=False),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Open Dashboard", self.open_dashboard),
            pystray.MenuItem("Open Monitor", self.open_monitor),
            pystray.MenuItem("Settings", self.open_settings),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("Start Services", self.start_services),
            pystray.MenuItem("Stop Services", self.stop_services),
            pystray.MenuItem("Restart Services", self.restart_services),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("System Status", self.show_system_status),
            pystray.MenuItem("View Logs", self.view_logs),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem("About", self.show_about),
            pystray.MenuItem("Exit", self.quit_tray)
        )
        
        # Create tray icon
        self.icon = pystray.Icon(
            "terrafusion_tray",
            icon_image,
            "TerraFusion OS 1.0 - Government AI Operating System",
            menu
        )
        
        # Start monitoring
        self.start_monitoring()
        
        # Run the tray icon
        self.icon.run()
    
    def run_console_mode(self):
        print("TerraFusion OS 1.0 - System Monitor")
        print("Running in console mode (system tray not available)")
        print("Press Ctrl+C to exit")
        
        try:
            while True:
                self.check_services()
                self.display_status()
                time.sleep(30)  # Check every 30 seconds
        except KeyboardInterrupt:
            print("\nShutting down TerraFusion monitor...")
    
    def start_monitoring(self):
        def monitor_loop():
            while True:
                self.check_services()
                self.update_tray_icon()
                time.sleep(30)  # Check every 30 seconds
        
        threading.Thread(target=monitor_loop, daemon=True).start()
    
    def check_services(self):
        services = {
            "Frontend": "http://localhost:\${{TF_FRONTEND_PORT:-3000}}/health",
            "Backend API": "http://localhost:\${{TF_FRONTEND_PORT:-3000}}/health",
            "AI Swarm": "http://localhost:\${{TF_FRONTEND_PORT:-3000}}/health",
            "Database": "localhost:\${{TF_FRONTEND_PORT:-3000}}",
            "Redis Cache": "localhost:\${{TF_FRONTEND_PORT:-3000}}",
            "Monitoring": "http://localhost:\${{TF_FRONTEND_PORT:-3000}}"
        }
        
        for service, endpoint in services.items():
            try:
                if endpoint.startswith("http"):
                    import requests
                    response = requests.get(endpoint, timeout=5)
                    self.services_status[service] = response.status_code == 200
                else:
                    import socket
                    host, port = endpoint.split(":")
                    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                    sock.settimeout(5)
                    result = sock.connect_ex((host, int(port)))
                    sock.close()
                    self.services_status[service] = result == 0
            except:
                self.services_status[service] = False
    
    def update_tray_icon(self):
        if not self.icon:
            return
        
        # Count online services
        online_count = sum(self.services_status.values())
        total_count = len(self.services_status)
        
        # Update tooltip
        if online_count == total_count:
            status_text = "All services online"
            self.icon.title = f"TerraFusion OS 1.0 - {status_text}"
        else:
            status_text = f"{online_count}/{total_count} services online"
            self.icon.title = f"TerraFusion OS 1.0 - {status_text}"
    
    def display_status(self):
        print(f"\n=== TerraFusion OS 1.0 Status - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ===")
        print(f"County: {self.config.get('County', {}).get('Name', 'N/A')}, {self.config.get('County', {}).get('State', 'N/A')}")
        print("Service Status:")
        
        for service, status in self.services_status.items():
            status_icon = "🟢" if status else "🔴"
            print(f"  {status_icon} {service}")
        
        online_count = sum(self.services_status.values())
        total_count = len(self.services_status)
        print(f"\nOverall Status: {online_count}/{total_count} services online")
    
    def show_status(self, icon, item):
        # Show current status
        online_count = sum(self.services_status.values())
        total_count = len(self.services_status)
        
        status_text = f"TerraFusion OS 1.0\n"
        status_text += f"Benton County, Washington\n"
        status_text += f"Status: {online_count}/{total_count} services online\n"
        status_text += f"Last Updated: {datetime.now().strftime('%H:%M:%S')}"
        
        messagebox.showinfo("TerraFusion Status", status_text)
    
    def open_dashboard(self, icon, item):
        try:
            subprocess.Popen([sys.executable, 'TerraFusionDashboard.py'])
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open dashboard: {str(e)}")
    
    def open_monitor(self, icon, item):
        try:
            import webbrowser
            webbrowser.open('http://localhost:\${{TF_FRONTEND_PORT:-3000}}')
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open monitor: {str(e)}")
    
    def open_settings(self, icon, item):
        try:
            subprocess.Popen([sys.executable, 'TerraFusionSettings.py'])
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open settings: {str(e)}")
    
    def start_services(self, icon, item):
        def start():
            try:
                subprocess.run(['docker-compose', '-f', 'compose.prod.yaml', '--env-file', '.env.prod', 'up', '-d'], 
                             check=True, capture_output=True, text=True)
                messagebox.showinfo("Success", "All TerraFusion services have been started successfully!")
            except subprocess.CalledProcessError as e:
                messagebox.showerror("Error", f"Failed to start services:\n{e.stderr}")
        
        threading.Thread(target=start, daemon=True).start()
    
    def stop_services(self, icon, item):
        def stop():
            try:
                subprocess.run(['docker-compose', '-f', 'compose.prod.yaml', '--env-file', '.env.prod', 'down'], 
                             check=True, capture_output=True, text=True)
                messagebox.showinfo("Success", "All TerraFusion services have been stopped.")
            except subprocess.CalledProcessError as e:
                messagebox.showerror("Error", f"Failed to stop services:\n{e.stderr}")
        
        threading.Thread(target=stop, daemon=True).start()
    
    def restart_services(self, icon, item):
        def restart():
            try:
                subprocess.run(['docker-compose', '-f', 'compose.prod.yaml', '--env-file', '.env.prod', 'restart'], 
                             check=True, capture_output=True, text=True)
                messagebox.showinfo("Success", "All TerraFusion services have been restarted successfully!")
            except subprocess.CalledProcessError as e:
                messagebox.showerror("Error", f"Failed to restart services:\n{e.stderr}")
        
        threading.Thread(target=restart, daemon=True).start()
    
    def show_system_status(self, icon, item):
        try:
            import psutil
            
            status_text = f"System Information:\n"
            status_text += f"OS: {sys.platform}\n"
            status_text += f"CPU Cores: {psutil.cpu_count()}\n"
            status_text += f"Memory Total: {psutil.virtual_memory().total // (1024**3)}GB\n"
            status_text += f"Memory Available: {psutil.virtual_memory().available // (1024**3)}GB\n"
            status_text += f"Disk Usage: {psutil.disk_usage('/').percent}%\n\n"
            
            status_text += f"TerraFusion Configuration:\n"
            status_text += f"County: {self.config.get('County', {}).get('Name', 'N/A')}\n"
            status_text += f"State: {self.config.get('County', {}).get('State', 'N/A')}\n"
            status_text += f"Database Host: {self.config.get('Database', {}).get('Host', 'N/A')}\n"
            status_text += f"Database Name: {self.config.get('Database', {}).get('Name', 'N/A')}"
            
            messagebox.showinfo("System Status", status_text)
        except Exception as e:
            messagebox.showerror("Error", f"Failed to get system status: {str(e)}")
    
    def view_logs(self, icon, item):
        try:
            log_file = 'logs/terrafusion.log'
            if os.path.exists(log_file):
                subprocess.Popen(['notepad', log_file])
            else:
                messagebox.showinfo("Logs", "Log files are located in the logs/ directory")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open logs: {str(e)}")
    
    def show_about(self, icon, item):
        about_text = """
TerraFusion OS 1.0
Government AI Operating System

Version: 1.0.0
County: Benton County, Washington
AI Agents: 1,008 Active

© 2025 TerraFusion Government AI
All rights reserved.

For support: support@terrafusion.com
        """
        messagebox.showinfo("About TerraFusion OS 1.0", about_text)
    
    def quit_tray(self, icon, item):
        if self.icon:
            self.icon.stop()
        self.root.quit()

def main():
    app = TerraFusionTray()
    if not TRAY_AVAILABLE:
        app.root.mainloop()

if __name__ == "__main__":
    main()
