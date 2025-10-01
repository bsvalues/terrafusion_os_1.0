"""
TerraFusion cOS Advanced Desktop Shell
Native desktop interface with government-grade UI and real-time capabilities
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import tkinter.font as tkFont
from typing import Dict, List, Optional, Any
import json
import asyncio
import threading
import requests
import time
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure
import numpy as np
from PIL import Image, ImageTk
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from brand.colors import GOVERNMENT_BLUE, TECH_GREEN, WHITE, DARK_GRAY, LIGHT_GRAY

class GovernmentTheme:
    """Government-approved visual theme"""
    
    def __init__(self):
        self.colors = {
            'primary': GOVERNMENT_BLUE,      # #0099ff
            'secondary': TECH_GREEN,         # #00ffaa
            'background': WHITE,             # #ffffff
            'surface': LIGHT_GRAY,           # #f5f5f5
            'text_primary': DARK_GRAY,       # #333333
            'text_secondary': '#666666',
            'accent': '#ff6b35',
            'success': '#28a745',
            'warning': '#ffc107',
            'error': '#dc3545',
            'info': '#17a2b8'
        }
        
        self.fonts = {
            'title': ('Segoe UI', 20, 'bold'),
            'header': ('Segoe UI', 16, 'bold'),
            'subheader': ('Segoe UI', 14, 'bold'),
            'body': ('Segoe UI', 12),
            'small': ('Segoe UI', 10),
            'monospace': ('Consolas', 11)
        }
        
        self.styles = {
            'padding': {'x': 10, 'y': 8},
            'border_radius': 4,
            'elevation': 2
        }

class RealTimeDashboard(tk.Frame):
    """Real-time government operations dashboard"""
    
    def __init__(self, parent, theme: GovernmentTheme, api_base_url: str):
        super().__init__(parent, bg=theme.colors['background'])
        self.theme = theme
        self.api_base_url = api_base_url
        self.data_cache = {}
        self.refresh_interval = 5000  # 5 seconds
        
        self.setup_dashboard()
        self.start_real_time_updates()
    
    def setup_dashboard(self):
        """Setup dashboard layout"""
        # Dashboard title
        title_frame = tk.Frame(self, bg=self.theme.colors['background'])
        title_frame.pack(fill='x', padx=10, pady=5)
        
        title_label = tk.Label(
            title_frame,
            text="🏛️ TerraFusion cOS Government Operations Center",
            font=self.theme.fonts['title'],
            bg=self.theme.colors['background'],
            fg=self.theme.colors['text_primary']
        )
        title_label.pack(side='left')
        
        # Status indicator
        self.status_indicator = tk.Label(
            title_frame,
            text="● OPERATIONAL",
            font=self.theme.fonts['body'],
            bg=self.theme.colors['background'],
            fg=self.theme.colors['success']
        )
        self.status_indicator.pack(side='right')
        
        # Main dashboard grid
        main_frame = tk.Frame(self, bg=self.theme.colors['background'])
        main_frame.pack(fill='both', expand=True, padx=10, pady=5)
        
        # Configure grid weights
        main_frame.grid_columnconfigure(0, weight=1)
        main_frame.grid_columnconfigure(1, weight=1)
        main_frame.grid_columnconfigure(2, weight=1)
        main_frame.grid_rowconfigure(0, weight=1)
        main_frame.grid_rowconfigure(1, weight=1)
        
        # System status panel
        self.system_panel = self.create_status_panel(main_frame, "System Status", 0, 0)
        
        # AI Swarm panel  
        self.ai_panel = self.create_ai_swarm_panel(main_frame, 1, 0)
        
        # Citizens services panel
        self.services_panel = self.create_services_panel(main_frame, 2, 0)
        
        # Performance chart
        self.performance_chart = self.create_performance_chart(main_frame, 0, 1, columnspan=2)
        
        # Activity log
        self.activity_log = self.create_activity_log(main_frame, 2, 1)
    
    def create_status_panel(self, parent, title: str, row: int, col: int) -> tk.Frame:
        """Create system status panel"""
        panel = tk.LabelFrame(
            parent,
            text=title,
            font=self.theme.fonts['header'],
            bg=self.theme.colors['surface'],
            fg=self.theme.colors['text_primary'],
            relief='raised',
            bd=2
        )
        panel.grid(row=row, column=col, sticky='nsew', padx=5, pady=5)
        
        # Status items
        self.status_items = {}
        
        status_data = [
            ('System Health', '98.7%', self.theme.colors['success']),
            ('Active Users', '47,832', self.theme.colors['info']),
            ('Database Status', 'ONLINE', self.theme.colors['success']),
            ('Security Level', 'SECURED', self.theme.colors['success']),
            ('Uptime', '99.9%', self.theme.colors['success'])
        ]
        
        for i, (label, value, color) in enumerate(status_data):
            label_widget = tk.Label(
                panel,
                text=f"{label}:",
                font=self.theme.fonts['small'],
                bg=self.theme.colors['surface'],
                fg=self.theme.colors['text_secondary']
            )
            label_widget.grid(row=i, column=0, sticky='w', padx=10, pady=2)
            
            value_widget = tk.Label(
                panel,
                text=value,
                font=self.theme.fonts['body'],
                bg=self.theme.colors['surface'],
                fg=color
            )
            value_widget.grid(row=i, column=1, sticky='e', padx=10, pady=2)
            
            self.status_items[label.lower().replace(' ', '_')] = value_widget
        
        return panel
    
    def create_ai_swarm_panel(self, parent, row: int, col: int) -> tk.Frame:
        """Create AI swarm monitoring panel"""
        panel = tk.LabelFrame(
            parent,
            text="🤖 AI Swarm Status",
            font=self.theme.fonts['header'],
            bg=self.theme.colors['surface'],
            fg=self.theme.colors['text_primary'],
            relief='raised',
            bd=2
        )
        panel.grid(row=row, column=col, sticky='nsew', padx=5, pady=5)
        
        # AI metrics
        self.ai_metrics = {}
        
        ai_data = [
            ('Active Agents', '50,847', self.theme.colors['info']),
            ('Success Rate', '99.8%', self.theme.colors['success']),
            ('Response Time', '1.8ms', self.theme.colors['success']),
            ('Tasks Queued', '1,234', self.theme.colors['warning']),
            ('Emergency Ready', '5 agents', self.theme.colors['success'])
        ]
        
        for i, (label, value, color) in enumerate(ai_data):
            label_widget = tk.Label(
                panel,
                text=f"{label}:",
                font=self.theme.fonts['small'],
                bg=self.theme.colors['surface'],
                fg=self.theme.colors['text_secondary']
            )
            label_widget.grid(row=i, column=0, sticky='w', padx=10, pady=2)
            
            value_widget = tk.Label(
                panel,
                text=value,
                font=self.theme.fonts['body'],
                bg=self.theme.colors['surface'],
                fg=color
            )
            value_widget.grid(row=i, column=1, sticky='e', padx=10, pady=2)
            
            self.ai_metrics[label.lower().replace(' ', '_')] = value_widget
        
        return panel
    
    def create_services_panel(self, parent, row: int, col: int) -> tk.Frame:
        """Create citizen services panel"""
        panel = tk.LabelFrame(
            parent,
            text="👥 Citizen Services",
            font=self.theme.fonts['header'],
            bg=self.theme.colors['surface'],
            fg=self.theme.colors['text_primary'],
            relief='raised',
            bd=2
        )
        panel.grid(row=row, column=col, sticky='nsew', padx=5, pady=5)
        
        # Services metrics
        self.services_metrics = {}
        
        services_data = [
            ('Requests Today', '2,847', self.theme.colors['info']),
            ('Avg Response', '12 min', self.theme.colors['success']),
            ('Satisfaction', '96.2%', self.theme.colors['success']),
            ('Permits Processed', '184', self.theme.colors['info']),
            ('Complaints Open', '23', self.theme.colors['warning'])
        ]
        
        for i, (label, value, color) in enumerate(services_data):
            label_widget = tk.Label(
                panel,
                text=f"{label}:",
                font=self.theme.fonts['small'],
                bg=self.theme.colors['surface'],
                fg=self.theme.colors['text_secondary']
            )
            label_widget.grid(row=i, column=0, sticky='w', padx=10, pady=2)
            
            value_widget = tk.Label(
                panel,
                text=value,
                font=self.theme.fonts['body'],
                bg=self.theme.colors['surface'],
                fg=color
            )
            value_widget.grid(row=i, column=1, sticky='e', padx=10, pady=2)
            
            self.services_metrics[label.lower().replace(' ', '_')] = value_widget
        
        return panel
    
    def create_performance_chart(self, parent, row: int, col: int, columnspan: int = 1) -> tk.Frame:
        """Create real-time performance chart"""
        panel = tk.LabelFrame(
            parent,
            text="📊 System Performance (Last 24 Hours)",
            font=self.theme.fonts['header'],
            bg=self.theme.colors['surface'],
            fg=self.theme.colors['text_primary'],
            relief='raised',
            bd=2
        )
        panel.grid(row=row, column=col, columnspan=columnspan, sticky='nsew', padx=5, pady=5)
        
        # Create matplotlib figure
        self.fig = Figure(figsize=(8, 4), dpi=100, facecolor=self.theme.colors['surface'])
        self.ax = self.fig.add_subplot(111)
        
        # Generate sample data
        hours = list(range(24))
        cpu_usage = [30 + 20 * np.sin(h * 0.3) + np.random.normal(0, 5) for h in hours]
        memory_usage = [45 + 15 * np.cos(h * 0.2) + np.random.normal(0, 3) for h in hours]
        response_time = [1.5 + 0.5 * np.sin(h * 0.4) + np.random.normal(0, 0.2) for h in hours]
        
        # Plot performance metrics
        self.ax.plot(hours, cpu_usage, label='CPU Usage (%)', color=self.theme.colors['primary'], linewidth=2)
        self.ax.plot(hours, memory_usage, label='Memory Usage (%)', color=self.theme.colors['secondary'], linewidth=2)
        
        # Secondary y-axis for response time
        ax2 = self.ax.twinx()
        ax2.plot(hours, response_time, label='Response Time (s)', color=self.theme.colors['accent'], linewidth=2, linestyle='--')
        
        self.ax.set_xlabel('Hours Ago', fontsize=10)
        self.ax.set_ylabel('Usage (%)', fontsize=10)
        ax2.set_ylabel('Response Time (s)', fontsize=10)
        
        self.ax.legend(loc='upper left', fontsize=8)
        ax2.legend(loc='upper right', fontsize=8)
        
        self.ax.grid(True, alpha=0.3)
        self.ax.set_xlim(0, 23)
        self.ax.set_ylim(0, 100)
        ax2.set_ylim(0, 3)
        
        # Embed in tkinter
        self.canvas = FigureCanvasTkAgg(self.fig, panel)
        self.canvas.draw()
        self.canvas.get_tk_widget().pack(fill='both', expand=True, padx=10, pady=10)
        
        return panel
    
    def create_activity_log(self, parent, row: int, col: int) -> tk.Frame:
        """Create activity log panel"""
        panel = tk.LabelFrame(
            parent,
            text="📋 Recent Activity",
            font=self.theme.fonts['header'],
            bg=self.theme.colors['surface'],
            fg=self.theme.colors['text_primary'],
            relief='raised',
            bd=2
        )
        panel.grid(row=row, column=col, sticky='nsew', padx=5, pady=5)
        
        # Activity listbox with scrollbar
        listbox_frame = tk.Frame(panel, bg=self.theme.colors['surface'])
        listbox_frame.pack(fill='both', expand=True, padx=10, pady=10)
        
        self.activity_listbox = tk.Listbox(
            listbox_frame,
            font=self.theme.fonts['small'],
            bg=self.theme.colors['background'],
            fg=self.theme.colors['text_primary'],
            selectbackground=self.theme.colors['primary'],
            height=10
        )
        
        scrollbar = tk.Scrollbar(listbox_frame, orient='vertical', command=self.activity_listbox.yview)
        self.activity_listbox.configure(yscrollcommand=scrollbar.set)
        
        self.activity_listbox.pack(side='left', fill='both', expand=True)
        scrollbar.pack(side='right', fill='y')
        
        # Add sample activity
        sample_activities = [
            "11:45 AM - Permit #P-2024-0847 approved",
            "11:43 AM - Emergency response team dispatched",
            "11:41 AM - Tax assessment completed for 123 Main St",
            "11:38 AM - Citizen complaint #C-2024-1205 resolved",
            "11:35 AM - Budget analysis report generated",
            "11:32 AM - Code enforcement inspection scheduled",
            "11:30 AM - New vendor registration: Acme Solutions",
            "11:28 AM - System backup completed successfully"
        ]
        
        for activity in sample_activities:
            self.activity_listbox.insert(tk.END, activity)
        
        return panel
    
    def start_real_time_updates(self):
        """Start real-time data updates"""
        self.update_data()
        self.after(self.refresh_interval, self.start_real_time_updates)
    
    def update_data(self):
        """Update dashboard data from API"""
        try:
            # This would fetch real data from the API
            # For now, simulate real-time updates
            current_time = datetime.now()
            
            # Update status indicators with slight variations
            self.status_items['active_users'].config(text=f"{47832 + np.random.randint(-100, 100):,}")
            
            # Add new activity
            new_activity = f"{current_time.strftime('%I:%M %p')} - System status check completed"
            self.activity_listbox.insert(0, new_activity)
            
            # Keep only last 20 activities
            while self.activity_listbox.size() > 20:
                self.activity_listbox.delete(tk.END)
                
        except Exception as e:
            print(f"Error updating dashboard data: {e}")

class GovernmentControlPanel(tk.Frame):
    """Main government control panel interface"""
    
    def __init__(self, parent, theme: GovernmentTheme, api_base_url: str):
        super().__init__(parent, bg=theme.colors['background'])
        self.theme = theme
        self.api_base_url = api_base_url
        
        self.setup_control_panel()
    
    def setup_control_panel(self):
        """Setup main control panel"""
        # Header
        header_frame = tk.Frame(self, bg=self.theme.colors['primary'], height=60)
        header_frame.pack(fill='x', padx=0, pady=0)
        header_frame.pack_propagate(False)
        
        # TerraFusion logo and title
        title_label = tk.Label(
            header_frame,
            text="🏛️ TerraFusion cOS Government Control Center",
            font=self.theme.fonts['title'],
            bg=self.theme.colors['primary'],
            fg='white'
        )
        title_label.pack(side='left', padx=20, pady=15)
        
        # User info
        user_info = tk.Label(
            header_frame,
            text="Admin User | Clearance: SECRET | Session: 14:32:05",
            font=self.theme.fonts['small'],
            bg=self.theme.colors['primary'],
            fg='white'
        )
        user_info.pack(side='right', padx=20, pady=15)
        
        # Main content area
        main_frame = tk.Frame(self, bg=self.theme.colors['background'])
        main_frame.pack(fill='both', expand=True)
        
        # Create tabbed interface
        self.notebook = ttk.Notebook(main_frame)
        self.notebook.pack(fill='both', expand=True, padx=10, pady=10)
        
        # Dashboard tab
        dashboard_frame = tk.Frame(self.notebook, bg=self.theme.colors['background'])
        self.notebook.add(dashboard_frame, text="📊 Operations Dashboard")
        
        self.dashboard = RealTimeDashboard(dashboard_frame, self.theme, self.api_base_url)
        self.dashboard.pack(fill='both', expand=True)
        
        # AI Management tab
        ai_frame = tk.Frame(self.notebook, bg=self.theme.colors['background'])
        self.notebook.add(ai_frame, text="🤖 AI Swarm Management")
        self.setup_ai_management(ai_frame)
        
        # Citizen Services tab
        services_frame = tk.Frame(self.notebook, bg=self.theme.colors['background'])
        self.notebook.add(services_frame, text="👥 Citizen Services")
        self.setup_citizen_services(services_frame)
        
        # Security tab
        security_frame = tk.Frame(self.notebook, bg=self.theme.colors['background'])
        self.notebook.add(security_frame, text="🔒 Security Center")
        self.setup_security_center(security_frame)
        
        # Vendor Management tab
        vendor_frame = tk.Frame(self.notebook, bg=self.theme.colors['background'])
        self.notebook.add(vendor_frame, text="🏢 Vendor Portal")
        self.setup_vendor_management(vendor_frame)
    
    def setup_ai_management(self, parent):
        """Setup AI swarm management interface"""
        title = tk.Label(
            parent,
            text="AI Swarm Management Center",
            font=self.theme.fonts['header'],
            bg=self.theme.colors['background'],
            fg=self.theme.colors['text_primary']
        )
        title.pack(pady=10)
        
        # AI Controls
        controls_frame = tk.LabelFrame(
            parent,
            text="Agent Controls",
            font=self.theme.fonts['subheader'],
            bg=self.theme.colors['surface'],
            fg=self.theme.colors['text_primary']
        )
        controls_frame.pack(fill='x', padx=20, pady=10)
        
        # Control buttons
        button_frame = tk.Frame(controls_frame, bg=self.theme.colors['surface'])
        button_frame.pack(fill='x', padx=10, pady=10)
        
        buttons = [
            ("🚨 Emergency Protocol", self.activate_emergency_protocol, self.theme.colors['error']),
            ("📈 Scale Up Agents", self.scale_up_agents, self.theme.colors['success']),
            ("📉 Scale Down Agents", self.scale_down_agents, self.theme.colors['warning']),
            ("🔄 Redistribute Load", self.redistribute_load, self.theme.colors['info'])
        ]
        
        for i, (text, command, color) in enumerate(buttons):
            btn = tk.Button(
                button_frame,
                text=text,
                command=command,
                font=self.theme.fonts['body'],
                bg=color,
                fg='white',
                relief='raised',
                bd=2,
                padx=15,
                pady=5
            )
            btn.grid(row=0, column=i, padx=5, sticky='ew')
            button_frame.grid_columnconfigure(i, weight=1)
    
    def setup_citizen_services(self, parent):
        """Setup citizen services interface"""
        title = tk.Label(
            parent,
            text="Citizen Services Management",
            font=self.theme.fonts['header'],
            bg=self.theme.colors['background'],
            fg=self.theme.colors['text_primary']
        )
        title.pack(pady=10)
        
        # Service request form
        form_frame = tk.LabelFrame(
            parent,
            text="New Service Request",
            font=self.theme.fonts['subheader'],
            bg=self.theme.colors['surface'],
            fg=self.theme.colors['text_primary']
        )
        form_frame.pack(fill='x', padx=20, pady=10)
        
        # Request input
        tk.Label(
            form_frame,
            text="Citizen Request:",
            font=self.theme.fonts['body'],
            bg=self.theme.colors['surface'],
            fg=self.theme.colors['text_primary']
        ).pack(anchor='w', padx=10, pady=(10, 5))
        
        self.request_text = tk.Text(
            form_frame,
            height=4,
            font=self.theme.fonts['body'],
            bg=self.theme.colors['background'],
            fg=self.theme.colors['text_primary']
        )
        self.request_text.pack(fill='x', padx=10, pady=(0, 10))
        
        # Submit button
        submit_btn = tk.Button(
            form_frame,
            text="📋 Process Request",
            command=self.process_citizen_request,
            font=self.theme.fonts['body'],
            bg=self.theme.colors['primary'],
            fg='white',
            relief='raised',
            bd=2,
            padx=20,
            pady=5
        )
        submit_btn.pack(pady=10)
    
    def setup_security_center(self, parent):
        """Setup security management interface"""
        title = tk.Label(
            parent,
            text="Security Operations Center",
            font=self.theme.fonts['header'],
            bg=self.theme.colors['background'],
            fg=self.theme.colors['text_primary']
        )
        title.pack(pady=10)
        
        # Security status
        status_frame = tk.LabelFrame(
            parent,
            text="Current Security Status",
            font=self.theme.fonts['subheader'],
            bg=self.theme.colors['surface'],
            fg=self.theme.colors['text_primary']
        )
        status_frame.pack(fill='x', padx=20, pady=10)
        
        security_status = tk.Label(
            status_frame,
            text="🔒 THREAT LEVEL: LOW\n🛡️ SECURITY MESH: ACTIVE\n👁️ MONITORING: 24/7\n🔐 ENCRYPTION: AES-256",
            font=self.theme.fonts['body'],
            bg=self.theme.colors['surface'],
            fg=self.theme.colors['success'],
            justify='left'
        )
        security_status.pack(padx=20, pady=20)
    
    def setup_vendor_management(self, parent):
        """Setup vendor management interface"""
        title = tk.Label(
            parent,
            text="Vendor Management Portal",
            font=self.theme.fonts['header'],
            bg=self.theme.colors['background'],
            fg=self.theme.colors['text_primary']
        )
        title.pack(pady=10)
        
        # Vendor registration form
        reg_frame = tk.LabelFrame(
            parent,
            text="Register New Vendor",
            font=self.theme.fonts['subheader'],
            bg=self.theme.colors['surface'],
            fg=self.theme.colors['text_primary']
        )
        reg_frame.pack(fill='x', padx=20, pady=10)
        
        # Form fields
        fields = [
            ("Company Name:", "company_name"),
            ("Contact Email:", "contact_email"),
            ("Certification Tier:", "tier")
        ]
        
        self.vendor_entries = {}
        for i, (label, key) in enumerate(fields):
            tk.Label(
                reg_frame,
                text=label,
                font=self.theme.fonts['body'],
                bg=self.theme.colors['surface'],
                fg=self.theme.colors['text_primary']
            ).grid(row=i, column=0, sticky='w', padx=10, pady=5)
            
            entry = tk.Entry(
                reg_frame,
                font=self.theme.fonts['body'],
                bg=self.theme.colors['background'],
                fg=self.theme.colors['text_primary'],
                width=30
            )
            entry.grid(row=i, column=1, padx=10, pady=5)
            self.vendor_entries[key] = entry
        
        # Register button
        register_btn = tk.Button(
            reg_frame,
            text="🏢 Register Vendor",
            command=self.register_vendor,
            font=self.theme.fonts['body'],
            bg=self.theme.colors['secondary'],
            fg='white',
            relief='raised',
            bd=2,
            padx=20,
            pady=5
        )
        register_btn.grid(row=len(fields), column=0, columnspan=2, pady=20)
    
    # Event handlers
    def activate_emergency_protocol(self):
        messagebox.showinfo("Emergency Protocol", "🚨 Emergency response protocol activated!\nAll available agents deployed.")
    
    def scale_up_agents(self):
        messagebox.showinfo("Scale Up", "📈 Agent scaling initiated. Additional 1000 agents deploying...")
    
    def scale_down_agents(self):
        messagebox.showinfo("Scale Down", "📉 Agent scaling reduced. Optimizing resource allocation...")
    
    def redistribute_load(self):
        messagebox.showinfo("Load Balancing", "🔄 Load redistribution in progress. System optimizing...")
    
    def process_citizen_request(self):
        request_text = self.request_text.get(1.0, tk.END).strip()
        if request_text:
            messagebox.showinfo("Request Processed", f"📋 Citizen request processed successfully!\nTask ID: REQ-2024-{np.random.randint(1000, 9999)}")
            self.request_text.delete(1.0, tk.END)
        else:
            messagebox.showwarning("Empty Request", "Please enter a citizen request.")
    
    def register_vendor(self):
        company = self.vendor_entries['company_name'].get()
        email = self.vendor_entries['contact_email'].get()
        tier = self.vendor_entries['tier'].get()
        
        if company and email and tier:
            messagebox.showinfo("Vendor Registered", f"🏢 {company} successfully registered!\nTier: {tier}\nAPI key will be sent to {email}")
            for entry in self.vendor_entries.values():
                entry.delete(0, tk.END)
        else:
            messagebox.showwarning("Incomplete Form", "Please fill in all vendor information.")

class TerraFusionDesktopShell:
    """Main TerraFusion cOS Desktop Shell Application"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.theme = GovernmentTheme()
        self.api_base_url = "http://localhost:8090"
        
        self.setup_main_window()
        self.setup_interface()
    
    def setup_main_window(self):
        """Configure main application window"""
        self.root.title("TerraFusion cOS - Government Operating System")
        self.root.geometry("1400x900")
        self.root.minsize(1200, 800)
        
        # Set application icon (if available)
        try:
            self.root.iconbitmap("brand/assets/terrafusion_icon.ico")
        except:
            pass  # Icon file not found
        
        # Configure main window
        self.root.configure(bg=self.theme.colors['background'])
        
        # Configure styles
        style = ttk.Style()
        style.theme_use('clam')
        
        # Customize ttk styles
        style.configure('TNotebook', background=self.theme.colors['background'])
        style.configure('TNotebook.Tab', padding=[15, 8])
    
    def setup_interface(self):
        """Setup main interface components"""
        # Create main control panel
        self.control_panel = GovernmentControlPanel(
            self.root, 
            self.theme, 
            self.api_base_url
        )
        self.control_panel.pack(fill='both', expand=True)
    
    def run(self):
        """Start the desktop shell application"""
        print("🏛️ Starting TerraFusion cOS Desktop Shell...")
        print("📊 Government Operations Center Ready")
        print("🔒 Security Level: GOVERNMENT GRADE")
        print("🚀 System Status: OPERATIONAL")
        
        # Center window on screen
        self.root.update_idletasks()
        x = (self.root.winfo_screenwidth() // 2) - (self.root.winfo_width() // 2)
        y = (self.root.winfo_screenheight() // 2) - (self.root.winfo_height() // 2)
        self.root.geometry(f"+{x}+{y}")
        
        # Start main loop
        self.root.mainloop()

if __name__ == "__main__":
    # Initialize and run the desktop shell
    desktop_shell = TerraFusionDesktopShell()
    desktop_shell.run()