# TerraFusion OS 1.0 - Main Dashboard Application
# Windows/macOS GUI Application

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import json
import subprocess
import threading
import time
import os
import sys
from datetime import datetime

class TerraFusionDashboard:
    def __init__(self, root):
        self.root = root
        self.root.title("TerraFusion OS 1.0 - Government AI Operating System")
        self.root.geometry("1200x800")
        self.root.configure(bg='#f0f0f0')
        
        # Set window icon
        try:
            self.root.iconbitmap('assets/terrafusion.ico')
        except:
            pass
        
        # Configure style
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # TerraFusion colors
        self.style.configure('TerraFusion.TFrame', background='#0891b2')
        self.style.configure('TerraFusion.TLabel', background='#0891b2', foreground='white', font=('Arial', 12, 'bold'))
        self.style.configure('TerraFusion.TButton', background='#00d2ff', foreground='white', font=('Arial', 10, 'bold'))
        
        self.setup_ui()
        self.load_config()
        self.start_monitoring()
    
    def setup_ui(self):
        # Main container
        main_frame = ttk.Frame(self.root)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Header
        header_frame = ttk.Frame(main_frame, style='TerraFusion.TFrame')
        header_frame.pack(fill=tk.X, pady=(0, 10))
        
        title_label = ttk.Label(header_frame, text="🏆 TerraFusion OS 1.0 - Government AI Operating System", style='TerraFusion.TLabel')
        title_label.pack(pady=10)
        
        subtitle_label = ttk.Label(header_frame, text="Benton County, Washington | 1,008 AI Agents Active", style='TerraFusion.TLabel')
        subtitle_label.pack(pady=(0, 10))
        
        # Status bar
        self.status_frame = ttk.Frame(main_frame)
        self.status_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.status_label = ttk.Label(self.status_frame, text="System Status: Initializing...", font=('Arial', 10))
        self.status_label.pack(side=tk.LEFT)
        
        self.time_label = ttk.Label(self.status_frame, text="", font=('Arial', 10))
        self.time_label.pack(side=tk.RIGHT)
        
        # Main content area
        content_frame = ttk.Frame(main_frame)
        content_frame.pack(fill=tk.BOTH, expand=True)
        
        # Left panel - Quick Actions
        left_panel = ttk.Frame(content_frame)
        left_panel.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))
        
        # Quick Actions
        actions_frame = ttk.LabelFrame(left_panel, text="Quick Actions", padding=10)
        actions_frame.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Button(actions_frame, text="🚀 Start All Services", command=self.start_all_services, style='TerraFusion.TButton').pack(fill=tk.X, pady=2)
        ttk.Button(actions_frame, text="⏹️ Stop All Services", command=self.stop_all_services, style='TerraFusion.TButton').pack(fill=tk.X, pady=2)
        ttk.Button(actions_frame, text="🔄 Restart Services", command=self.restart_services, style='TerraFusion.TButton').pack(fill=tk.X, pady=2)
        ttk.Button(actions_frame, text="📊 Open Monitor", command=self.open_monitor, style='TerraFusion.TButton').pack(fill=tk.X, pady=2)
        ttk.Button(actions_frame, text="⚙️ Settings", command=self.open_settings, style='TerraFusion.TButton').pack(fill=tk.X, pady=2)
        ttk.Button(actions_frame, text="💾 Backup System", command=self.backup_system, style='TerraFusion.TButton').pack(fill=tk.X, pady=2)
        
        # System Info
        info_frame = ttk.LabelFrame(left_panel, text="System Information", padding=10)
        info_frame.pack(fill=tk.X)
        
        self.info_text = tk.Text(info_frame, height=15, width=40, font=('Consolas', 9))
        self.info_text.pack(fill=tk.BOTH, expand=True)
        
        # Right panel - Main Dashboard
        right_panel = ttk.Frame(content_frame)
        right_panel.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        # Service Status
        services_frame = ttk.LabelFrame(right_panel, text="Service Status", padding=10)
        services_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Service status grid
        self.service_status = {}
        services = [
            ("Frontend", "http://localhost:\${{TF_FRONTEND_PORT:-3000}}"),
            ("Backend API", "http://localhost:\${{TF_FRONTEND_PORT:-3000}}"),
            ("AI Swarm", "http://localhost:\${{TF_FRONTEND_PORT:-3000}}"),
            ("Database", "localhost:\${{TF_FRONTEND_PORT:-3000}}"),
            ("Redis Cache", "localhost:\${{TF_FRONTEND_PORT:-3000}}"),
            ("Monitoring", "http://localhost:\${{TF_FRONTEND_PORT:-3000}}")
        ]
        
        for i, (service, endpoint) in enumerate(services):
            row = i // 2
            col = i % 2
            
            service_frame = ttk.Frame(services_frame)
            service_frame.grid(row=row, column=col, padx=5, pady=5, sticky='ew')
            
            ttk.Label(service_frame, text=f"{service}:", font=('Arial', 10, 'bold')).pack(anchor=tk.W)
            status_label = ttk.Label(service_frame, text="Checking...", foreground='orange')
            status_label.pack(anchor=tk.W)
            
            self.service_status[service] = status_label
        
        # Configure grid weights
        services_frame.columnconfigure(0, weight=1)
        services_frame.columnconfigure(1, weight=1)
        
        # AI Swarm Status
        swarm_frame = ttk.LabelFrame(right_panel, text="AI Swarm Status (1,008 Agents)", padding=10)
        swarm_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.swarm_status_label = ttk.Label(swarm_frame, text="AI Swarm: Initializing...", font=('Arial', 12))
        self.swarm_status_label.pack()
        
        self.agent_count_label = ttk.Label(swarm_frame, text="Active Agents: 0/1008", font=('Arial', 10))
        self.agent_count_label.pack()
        
        # Performance Metrics
        metrics_frame = ttk.LabelFrame(right_panel, text="Performance Metrics", padding=10)
        metrics_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create metrics display
        self.metrics_text = tk.Text(metrics_frame, font=('Consolas', 9))
        self.metrics_text.pack(fill=tk.BOTH, expand=True)
        
        # Menu bar
        self.create_menu()
    
    def create_menu(self):
        menubar = tk.Menu(self.root)
        self.root.config(menu=menubar)
        
        # File menu
        file_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="File", menu=file_menu)
        file_menu.add_command(label="Settings", command=self.open_settings)
        file_menu.add_command(label="Backup", command=self.backup_system)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.root.quit)
        
        # Services menu
        services_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Services", menu=services_menu)
        services_menu.add_command(label="Start All", command=self.start_all_services)
        services_menu.add_command(label="Stop All", command=self.stop_all_services)
        services_menu.add_command(label="Restart All", command=self.restart_services)
        services_menu.add_separator()
        services_menu.add_command(label="Monitor", command=self.open_monitor)
        
        # Tools menu
        tools_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Tools", menu=tools_menu)
        tools_menu.add_command(label="System Info", command=self.show_system_info)
        tools_menu.add_command(label="Logs", command=self.show_logs)
        tools_menu.add_command(label="Performance", command=self.show_performance)
        
        # Help menu
        help_menu = tk.Menu(menubar, tearoff=0)
        menubar.add_cascade(label="Help", menu=help_menu)
        help_menu.add_command(label="Documentation", command=self.show_documentation)
        help_menu.add_command(label="About", command=self.show_about)
    
    def load_config(self):
        try:
            config_path = os.path.join(os.path.dirname(__file__), 'config', 'terrafusion.ini')
            if os.path.exists(config_path):
                self.config = self.parse_ini_file(config_path)
            else:
                self.config = self.get_default_config()
        except Exception as e:
            messagebox.showerror("Configuration Error", f"Failed to load configuration: {str(e)}")
            self.config = self.get_default_config()
    
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
            },
            'HarrisPACS': {
                'ConnectionString': '',
                'ApiEndpoint': '',
                'ApiKey': ''
            },
            'Security': {
                'AzureTenantId': '',
                'AzureClientId': '',
                'AzureClientSecret': '',
                'JwtSecret': ''
            }
        }
    
    def start_all_services(self):
        def start_services():
            try:
                # Start Docker Compose services
                subprocess.run(['docker-compose', '-f', 'compose.prod.yaml', '--env-file', '.env.prod', 'up', '-d'], 
                             check=True, capture_output=True, text=True)
                
                self.root.after(0, lambda: self.update_status("All services started successfully", "green"))
                self.root.after(0, lambda: messagebox.showinfo("Success", "All TerraFusion services have been started successfully!"))
            except subprocess.CalledProcessError as e:
                self.root.after(0, lambda: self.update_status(f"Failed to start services: {e.stderr}", "red"))
                self.root.after(0, lambda: messagebox.showerror("Error", f"Failed to start services:\n{e.stderr}"))
        
        threading.Thread(target=start_services, daemon=True).start()
    
    def stop_all_services(self):
        def stop_services():
            try:
                # Stop Docker Compose services
                subprocess.run(['docker-compose', '-f', 'compose.prod.yaml', '--env-file', '.env.prod', 'down'], 
                             check=True, capture_output=True, text=True)
                
                self.root.after(0, lambda: self.update_status("All services stopped", "orange"))
                self.root.after(0, lambda: messagebox.showinfo("Success", "All TerraFusion services have been stopped."))
            except subprocess.CalledProcessError as e:
                self.root.after(0, lambda: self.update_status(f"Failed to stop services: {e.stderr}", "red"))
                self.root.after(0, lambda: messagebox.showerror("Error", f"Failed to stop services:\n{e.stderr}"))
        
        threading.Thread(target=stop_services, daemon=True).start()
    
    def restart_services(self):
        def restart_services():
            try:
                # Restart Docker Compose services
                subprocess.run(['docker-compose', '-f', 'compose.prod.yaml', '--env-file', '.env.prod', 'restart'], 
                             check=True, capture_output=True, text=True)
                
                self.root.after(0, lambda: self.update_status("All services restarted", "green"))
                self.root.after(0, lambda: messagebox.showinfo("Success", "All TerraFusion services have been restarted successfully!"))
            except subprocess.CalledProcessError as e:
                self.root.after(0, lambda: self.update_status(f"Failed to restart services: {e.stderr}", "red"))
                self.root.after(0, lambda: messagebox.showerror("Error", f"Failed to restart services:\n{e.stderr}"))
        
        threading.Thread(target=restart_services, daemon=True).start()
    
    def open_monitor(self):
        try:
            import webbrowser
            webbrowser.open('http://localhost:\${{TF_FRONTEND_PORT:-3000}}')
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open monitor: {str(e)}")
    
    def open_settings(self):
        try:
            subprocess.Popen([sys.executable, 'TerraFusionSettings.py'])
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open settings: {str(e)}")
    
    def backup_system(self):
        def perform_backup():
            try:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                backup_dir = f"backups/backup_{timestamp}"
                
                # Create backup directory
                os.makedirs(backup_dir, exist_ok=True)
                
                # Backup database
                subprocess.run([
                    'docker-compose', '-f', 'compose.prod.yaml', '--env-file', '.env.prod',
                    'exec', '-T', 'postgres', 'pg_dump', '-U', 'terrafusion_db', 
                    'terrafusion_benton_production'
                ], stdout=open(f"{backup_dir}/database.sql", 'w'), check=True)
                
                # Backup configuration
                subprocess.run(['cp', '-r', 'config', backup_dir], check=True)
                
                self.root.after(0, lambda: messagebox.showinfo("Success", f"Backup completed successfully!\nLocation: {backup_dir}"))
            except Exception as e:
                self.root.after(0, lambda: messagebox.showerror("Error", f"Backup failed: {str(e)}"))
        
        threading.Thread(target=perform_backup, daemon=True).start()
    
    def update_status(self, message, color):
        self.status_label.config(text=f"System Status: {message}")
        if color == "green":
            self.status_label.config(foreground="green")
        elif color == "red":
            self.status_label.config(foreground="red")
        elif color == "orange":
            self.status_label.config(foreground="orange")
    
    def update_time(self):
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.time_label.config(text=current_time)
        self.root.after(1000, self.update_time)
    
    def check_service_health(self):
        def health_check():
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
                        status = "🟢 Online" if response.status_code == 200 else "🔴 Offline"
                    else:
                        import socket
                        host, port = endpoint.split(":")
                        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                        sock.settimeout(5)
                        result = sock.connect_ex((host, int(port)))
                        sock.close()
                        status = "🟢 Online" if result == 0 else "🔴 Offline"
                except:
                    status = "🔴 Offline"
                
                self.root.after(0, lambda s=service, st=status: self.service_status[s].config(text=st))
        
        threading.Thread(target=health_check, daemon=True).start()
    
    def update_ai_swarm_status(self):
        def update_swarm():
            try:
                import requests
                response = requests.get("http://localhost:\${{TF_FRONTEND_PORT:-3000}}/status", timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    active_agents = data.get('active_agents', 0)
                    total_agents = data.get('total_agents', 1008)
                    
                    self.root.after(0, lambda: self.swarm_status_label.config(text=f"AI Swarm: 🟢 Active"))
                    self.root.after(0, lambda: self.agent_count_label.config(text=f"Active Agents: {active_agents}/{total_agents}"))
                else:
                    self.root.after(0, lambda: self.swarm_status_label.config(text="AI Swarm: 🔴 Offline"))
                    self.root.after(0, lambda: self.agent_count_label.config(text="Active Agents: 0/1008"))
            except:
                self.root.after(0, lambda: self.swarm_status_label.config(text="AI Swarm: 🔴 Offline"))
                self.root.after(0, lambda: self.agent_count_label.config(text="Active Agents: 0/1008"))
        
        threading.Thread(target=update_swarm, daemon=True).start()
    
    def update_metrics(self):
        def get_metrics():
            try:
                import requests
                response = requests.get("http://localhost:\${{TF_FRONTEND_PORT:-3000}}/metrics", timeout=5)
                if response.status_code == 200:
                    metrics = response.json()
                    
                    metrics_text = f"""
Performance Metrics:
===================
API Response Time: {metrics.get('api_response_time', 'N/A')}ms
Database Connections: {metrics.get('db_connections', 'N/A')}
Memory Usage: {metrics.get('memory_usage', 'N/A')}MB
CPU Usage: {metrics.get('cpu_usage', 'N/A')}%
Active Users: {metrics.get('active_users', 'N/A')}
Data Sync Status: {metrics.get('sync_status', 'N/A')}
Last Sync: {metrics.get('last_sync', 'N/A')}
Error Rate: {metrics.get('error_rate', 'N/A')}%
                    """
                    
                    self.root.after(0, lambda: self.metrics_text.delete(1.0, tk.END))
                    self.root.after(0, lambda: self.metrics_text.insert(1.0, metrics_text))
            except:
                pass
        
        threading.Thread(target=get_metrics, daemon=True).start()
    
    def update_system_info(self):
        def get_system_info():
            try:
                import psutil
                
                info_text = f"""
System Information:
==================
OS: {sys.platform}
Python Version: {sys.version}
CPU Cores: {psutil.cpu_count()}
Memory Total: {psutil.virtual_memory().total // (1024**3)}GB
Memory Available: {psutil.virtual_memory().available // (1024**3)}GB
Disk Usage: {psutil.disk_usage('/').percent}%

TerraFusion Configuration:
==========================
County: {self.config.get('County', {}).get('Name', 'N/A')}
State: {self.config.get('County', {}).get('State', 'N/A')}
Database Host: {self.config.get('Database', {}).get('Host', 'N/A')}
Database Name: {self.config.get('Database', {}).get('Name', 'N/A')}
PACS Connected: {'Yes' if self.config.get('HarrisPACS', {}).get('ConnectionString') else 'No'}
SSO Configured: {'Yes' if self.config.get('Security', {}).get('AzureTenantId') else 'No'}
                """
                
                self.root.after(0, lambda: self.info_text.delete(1.0, tk.END))
                self.root.after(0, lambda: self.info_text.insert(1.0, info_text))
            except Exception as e:
                self.root.after(0, lambda: self.info_text.delete(1.0, tk.END))
                self.root.after(0, lambda: self.info_text.insert(1.0, f"Error loading system info: {str(e)}"))
        
        threading.Thread(target=get_system_info, daemon=True).start()
    
    def start_monitoring(self):
        self.update_time()
        self.check_service_health()
        self.update_ai_swarm_status()
        self.update_metrics()
        self.update_system_info()
        
        # Schedule periodic updates
        self.root.after(30000, self.check_service_health)  # Every 30 seconds
        self.root.after(10000, self.update_ai_swarm_status)  # Every 10 seconds
        self.root.after(15000, self.update_metrics)  # Every 15 seconds
        self.root.after(60000, self.update_system_info)  # Every minute
    
    def show_system_info(self):
        self.update_system_info()
    
    def show_logs(self):
        try:
            subprocess.Popen(['notepad', 'logs/terrafusion.log'])
        except:
            messagebox.showinfo("Logs", "Log files are located in the logs/ directory")
    
    def show_performance(self):
        self.open_monitor()
    
    def show_documentation(self):
        try:
            import webbrowser
            webbrowser.open('https://terrafusion.com/docs')
        except:
            messagebox.showinfo("Documentation", "Documentation is available at https://terrafusion.com/docs")
    
    def show_about(self):
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

def main():
    root = tk.Tk()
    app = TerraFusionDashboard(root)
    root.mainloop()

if __name__ == "__main__":
    main()
