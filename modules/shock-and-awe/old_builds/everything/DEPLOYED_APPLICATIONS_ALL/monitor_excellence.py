#!/usr/bin/env python3
"""
TerraFusion Excellence Monitor - Real-time Platform Health Dashboard
Monitors all services, performance metrics, and system health
"""

import asyncio
import aiohttp
import psutil
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from rich.console import Console
from rich.table import Table
from rich.layout import Layout
from rich.panel import Panel
from rich.live import Live
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.text import Text
import redis
import psycopg2
from pathlib import Path

console = Console()

class ExcellenceMonitor:
    def __init__(self):
        self.services = {
            "Legacy Flask Services": {
                "TerraFusion Build": {"port": \${{TF_API_PORT:-5000}}, "tech": "Node.js", "health": "/api/health"},
                "TerraFlow": {"port": \${{TF_API_PORT:-5000}}, "tech": "Flask", "health": "/health"},
                "TerraFusionSync": {"port": \${{TF_API_PORT:-5000}}, "tech": "Flask", "health": "/health"},
                "TerraAgent": {"port": \${{TF_API_PORT:-5000}}, "tech": "Flask", "health": "/health"},
                "TerraFusionAssessor": {"port": \${{TF_API_PORT:-5000}}, "tech": "Next.js", "health": "/api/health"},
                "TerraFusionDashboard": {"port": \${{TF_API_PORT:-5000}}, "tech": "React", "health": "/api/health"},
                "TerraMiner": {"port": \${{TF_API_PORT:-5000}}, "tech": "Flask", "health": "/health"},
                "TerraFusionLevy": {"port": \${{TF_API_PORT:-5000}}, "tech": "Flask", "health": "/health"}
            },
            "Modern Rust Services": {
                "TerraFusionSync (Rust)": {"port": \${{TF_API_PORT:-5000}}, "tech": "Rust/Axum", "health": "/health"},
                "TerraAgent (Rust)": {"port": \${{TF_API_PORT:-5000}}, "tech": "Rust/Axum", "health": "/health"},
                "TerraMiner (Rust)": {"port": \${{TF_API_PORT:-5000}}, "tech": "Rust/Axum", "health": "/health"}
            },
            "Frontend Services": {
                "TerraFusion UI": {"port": \${{TF_API_PORT:-5000}}, "tech": "Next.js 15", "health": "/api/health"}
            },
            "Infrastructure": {
                "Redis Cache": {"port": \${{TF_API_PORT:-5000}}, "tech": "Redis", "health": None},
                "PostgreSQL": {"port": \${{TF_API_PORT:-5000}}, "tech": "PostgreSQL", "health": None}
            }
        }
        
        self.metrics = {
            "system": {},
            "services": {},
            "performance": {},
            "database": {},
            "cache": {}
        }
        
        self.alerts = []
        self.start_time = datetime.now()

    async def check_service_health(self, name: str, config: Dict) -> Dict:
        """Check individual service health"""
        result = {
            "name": name,
            "port": config["port"],
            "tech": config["tech"],
            "status": "UNKNOWN",
            "response_time": None,
            "health_data": None,
            "error": None
        }
        
        if config["health"] is None:
            if config["port"] == 6379:
                result["status"] = "UP" if self._check_redis() else "DOWN"
            elif config["port"] == 5432:
                result["status"] = "UP" if self._check_postgres() else "DOWN"
            return result
        
        url = f"http://localhost:{config['port']}{config['health']}"
        
        try:
            start = time.time()
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    response_time = (time.time() - start) * 1000
                    result["response_time"] = response_time
                    
                    if resp.status == 200:
                        result["status"] = "UP"
                        try:
                            result["health_data"] = await resp.json()
                        except:
                            result["health_data"] = await resp.text()
                    else:
                        result["status"] = "DOWN"
                        result["error"] = f"HTTP {resp.status}"
                        
        except asyncio.TimeoutError:
            result["status"] = "TIMEOUT"
            result["error"] = "Request timeout"
        except Exception as e:
            result["status"] = "ERROR"
            result["error"] = str(e)
        
        return result

    def _check_redis(self) -> bool:
        try:
            r = redis.Redis(host='localhost', port=\${{TF_REDIS_PORT:-6379}}, socket_connect_timeout=1)
            r.ping()
            
            info = r.info()
            self.metrics["cache"] = {
                "connected_clients": info.get("connected_clients", 0),
                "used_memory_human": info.get("used_memory_human", "0"),
                "total_commands_processed": info.get("total_commands_processed", 0)
            }
            return True
        except:
            return False

    def _check_postgres(self) -> bool:
        try:
            conn = psycopg2.connect(
                host="localhost",
                port=\${{TF_REDIS_PORT:-6379}},
                database="postgres",
                user="postgres",
                password="postgres",
                connect_timeout=3
            )
            
            cur = conn.cursor()
            cur.execute("SELECT count(*) FROM pg_stat_activity WHERE state = 'active'")
            active_connections = cur.fetchone()[0]
            
            cur.execute("SELECT pg_database_size('postgres')")
            db_size = cur.fetchone()[0]
            
            self.metrics["database"] = {
                "active_connections": active_connections,
                "database_size_mb": db_size / 1024 / 1024
            }
            
            cur.close()
            conn.close()
            return True
        except:
            return False

    def get_system_metrics(self) -> Dict:
        """Collect system-wide metrics"""
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "memory_used_gb": memory.used / (1024**3),
            "memory_total_gb": memory.total / (1024**3),
            "disk_percent": disk.percent,
            "disk_free_gb": disk.free / (1024**3),
            "uptime_hours": (datetime.now() - self.start_time).total_seconds() / 3600
        }

    def create_dashboard_layout(self) -> Layout:
        """Create the dashboard layout"""
        layout = Layout()
        
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="body"),
            Layout(name="footer", size=4)
        )
        
        layout["body"].split_row(
            Layout(name="services", ratio=2),
            Layout(name="metrics", ratio=1)
        )
        
        return layout

    def render_header(self) -> Panel:
        """Render dashboard header"""
        header_text = Text()
        header_text.append("TerraFusion Excellence Monitor", style="bold cyan")
        header_text.append(" | ", style="dim")
        header_text.append(datetime.now().strftime("%Y-%m-%d %H:%M:%S"), style="green")
        
        return Panel(header_text, style="bold blue")

    def render_services_table(self, service_results: List[Dict]) -> Table:
        """Render services status table"""
        table = Table(title="Service Health Status", expand=True)
        
        table.add_column("Service", style="cyan", width=30)
        table.add_column("Port", style="magenta", width=8)
        table.add_column("Technology", style="blue", width=15)
        table.add_column("Status", width=10)
        table.add_column("Response Time", style="yellow", width=15)
        
        for category, services in self.services.items():
            table.add_row(f"[bold]{category}[/bold]", "", "", "", "")
            
            for result in service_results:
                if result["name"] in services:
                    status_style = {
                        "UP": "bold green",
                        "DOWN": "bold red",
                        "TIMEOUT": "bold yellow",
                        "ERROR": "bold red",
                        "UNKNOWN": "dim"
                    }.get(result["status"], "white")
                    
                    response_time = f"{result['response_time']:.0f}ms" if result["response_time"] else "-"
                    
                    table.add_row(
                        f"  {result['name']}",
                        str(result["port"]),
                        result["tech"],
                        f"[{status_style}]{result['status']}[/{status_style}]",
                        response_time
                    )
        
        return table

    def render_metrics_panel(self) -> Panel:
        """Render system metrics panel"""
        metrics = self.get_system_metrics()
        
        content = f"""
[bold cyan]System Metrics[/bold cyan]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CPU Usage: {metrics['cpu_percent']:.1f}%
Memory: {metrics['memory_used_gb']:.1f}/{metrics['memory_total_gb']:.1f} GB ({metrics['memory_percent']:.1f}%)
Disk Free: {metrics['disk_free_gb']:.1f} GB ({100-metrics['disk_percent']:.1f}%)
Uptime: {metrics['uptime_hours']:.1f} hours

[bold cyan]Database Metrics[/bold cyan]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Active Connections: {self.metrics.get('database', {}).get('active_connections', 'N/A')}
Database Size: {self.metrics.get('database', {}).get('database_size_mb', 0):.1f} MB

[bold cyan]Cache Metrics[/bold cyan]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Connected Clients: {self.metrics.get('cache', {}).get('connected_clients', 'N/A')}
Memory Used: {self.metrics.get('cache', {}).get('used_memory_human', 'N/A')}
Commands Processed: {self.metrics.get('cache', {}).get('total_commands_processed', 'N/A')}
"""
        
        return Panel(content, title="Performance Metrics", style="green")

    def render_footer(self) -> Panel:
        """Render footer with alerts and commands"""
        footer_text = """
[bold yellow]Quick Commands:[/bold yellow]
• Start All: python deploy_modern_platform.py
• Check Status: python monitor_excellence.py
• View Logs: tail -f modern_deployment.log
• Stop Services: python stop_all_services.py
"""
        
        if self.alerts:
            footer_text = f"[bold red]ALERTS:[/bold red]\n" + "\n".join(self.alerts[-3:]) + "\n" + footer_text
        
        return Panel(footer_text, style="dim")

    async def monitor_loop(self):
        """Main monitoring loop"""
        layout = self.create_dashboard_layout()
        
        with Live(layout, refresh_per_second=1, console=console) as live:
            while True:
                try:
                    all_results = []
                    
                    for category, services in self.services.items():
                        for name, config in services.items():
                            result = await self.check_service_health(name, config)
                            all_results.append(result)
                    
                    down_services = [r["name"] for r in all_results if r["status"] == "DOWN"]
                    if down_services:
                        alert = f"[{datetime.now().strftime('%H:%M:%S')}] Services DOWN: {', '.join(down_services)}"
                        if alert not in self.alerts:
                            self.alerts.append(alert)
                    
                    layout["header"].update(self.render_header())
                    layout["services"].update(self.render_services_table(all_results))
                    layout["metrics"].update(self.render_metrics_panel())
                    layout["footer"].update(self.render_footer())
                    
                    await asyncio.sleep(5)
                    
                except KeyboardInterrupt:
                    break
                except Exception as e:
                    console.print(f"[red]Error in monitoring loop: {e}[/red]")
                    await asyncio.sleep(5)

async def main():
    console.print("""
[bold cyan]╔══════════════════════════════════════════════════════════════╗
║           TerraFusion Excellence Monitor v2.0                ║
║         Real-time Platform Health & Performance              ║
╚══════════════════════════════════════════════════════════════╝[/bold cyan]
    """)
    
    monitor = ExcellenceMonitor()
    await monitor.monitor_loop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        console.print("\n[yellow]Monitoring stopped by user[/yellow]") 