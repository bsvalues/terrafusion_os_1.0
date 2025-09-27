#!/usr/bin/env python3
"""
REAL Trust Fabric - No More Configuration Theater
This demonstrates how to actually ENFORCE service behavior
"""

import subprocess
import time
import socket
import psutil
import os
import signal
from typing import List, Dict

class RealTrustFabric:
    """Trust Fabric that actually CONTROLS processes, doesn't just suggest"""
    
    def __init__(self):
        print("🚀 REAL TRUST FABRIC - PROCESS ENFORCER")
        print("=" * 50)
        self.managed_processes: Dict[str, subprocess.Popen] = {}
        self.assigned_ports: Dict[str, int] = {}
        
        # Kill any existing TerraFusion processes
        self.nuclear_cleanup()
        
    def nuclear_cleanup(self):
        """Kill ALL TerraFusion processes - no mercy"""
        print("☢️  NUCLEAR CLEANUP: Terminating all TerraFusion processes")
        
        killed_count = 0
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                cmdline = ' '.join(proc.info['cmdline'] or []).lower()
                name = (proc.info['name'] or '').lower()
                
                # Kill anything TerraFusion related
                if any(keyword in cmdline or keyword in name for keyword in 
                       ['terrafusion', 'dotnet run', 'npm run dev', 'vite']):
                    print(f"💀 Terminating: {proc.info['name']} (PID: {proc.info['pid']})")
                    try:
                        proc.terminate()
                        killed_count += 1
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
            except:
                continue
                
        print(f"🧹 Cleanup complete: {killed_count} processes terminated")
        time.sleep(3)  # Let processes die
        
    def is_port_free(self, port: int) -> bool:
        """Check if port is actually free"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return True
        except OSError:
            return False
            
    def enforce_port_assignment(self, service: str, port: int) -> bool:
        """ENFORCEMENT: Service gets assigned port or dies"""
        print(f"🔒 ENFORCING port {port} assignment for {service}")
        
        if not self.is_port_free(port):
            print(f"❌ Port {port} is occupied - clearing it")
            self.kill_port_squatter(port)
            time.sleep(1)
            
        if not self.is_port_free(port):
            raise Exception(f"Could not clear port {port} for {service}")
            
        self.assigned_ports[service] = port
        print(f"✅ Port {port} secured for {service}")
        return True
        
    def kill_port_squatter(self, port: int):
        """Kill whatever process is using this port"""
        for conn in psutil.net_connections(kind='inet'):
            if conn.laddr.port == port and conn.status == psutil.CONN_LISTEN:
                try:
                    proc = psutil.Process(conn.pid)
                    print(f"💀 Killing port squatter: {proc.name()} (PID: {conn.pid})")
                    proc.terminate()
                except:
                    pass
                    
    def start_frontend_enforced(self) -> subprocess.Popen:
        """Start frontend with STRICT port enforcement - no scanning allowed"""
        port=\${{TF_FRONTEND_PORT:-3000}}
        self.enforce_port_assignment("frontend", port)
        
        print(f"🚀 Starting ENFORCED frontend on port {port}")
        print("   Using --strictPort to prevent port scanning")
        
        # Set environment
        env = os.environ.copy()
        env.update({
            'PORT': str(port),
            'VITE_STRICT_PORT': 'true',
            'NODE_ENV': 'development'
        })
        
        # Use --strictPort to make Vite fail if port unavailable
        cmd = [
            'npm', 'run', 'dev', '--', 
            '--port', str(port), 
            '--strictPort'  # This is the key!
        ]
        
        print(f"   Command: {' '.join(cmd)}")
        
        process = subprocess.Popen(
            cmd,
            cwd='frontend',
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        self.managed_processes['frontend'] = process
        
        # Wait and verify it actually uses our port
        print("⏳ Waiting for frontend to start...")
        for i in range(10):
            time.sleep(1)
            if not self.is_port_free(port):
                print(f"✅ Frontend confirmed on port {port}")
                return process
                
        # If we get here, frontend failed to use our port
        print(f"❌ Frontend failed to use assigned port {port}")
        process.kill()
        raise Exception("Frontend refused Trust Fabric port assignment")
        
    def start_backend_enforced(self) -> subprocess.Popen:
        """Start backend with strict port enforcement"""
        port=\${{TF_FRONTEND_PORT:-3000}}
        self.enforce_port_assignment("backend", port)
        
        print(f"🚀 Starting ENFORCED backend on port {port}")
        
        env = os.environ.copy()
        env.update({
            'ASPNETCORE_ENVIRONMENT': 'Development',
            'ASPNETCORE_URLS': f'http://localhost:{port}'
        })
        
        cmd = ['dotnet', 'run']
        
        process = subprocess.Popen(
            cmd,
            cwd='backend/TerraFusion.API',
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        self.managed_processes['backend'] = process
        
        # Wait and verify
        print("⏳ Waiting for backend to start...")
        for i in range(15):
            time.sleep(1)
            if not self.is_port_free(port):
                print(f"✅ Backend confirmed on port {port}")
                return process
                
        print(f"❌ Backend failed to use assigned port {port}")
        process.kill()
        raise Exception("Backend refused Trust Fabric port assignment")
        
    def monitor_enforcement(self):
        """Continuous monitoring - kill any rogue processes"""
        print("🔄 Starting continuous enforcement monitoring...")
        
        while True:
            time.sleep(5)
            
            # Check if our processes are still alive
            for service, process in self.managed_processes.items():
                if process.poll() is not None:
                    print(f"⚠️  {service} process died - restarting")
                    if service == 'frontend':
                        self.start_frontend_enforced()
                    elif service == 'backend':
                        self.start_backend_enforced()
                        
            # Kill any unauthorized TerraFusion processes
            self.kill_unauthorized_processes()
            
    def kill_unauthorized_processes(self):
        """Kill any TerraFusion process not managed by us"""
        authorized_pids = {proc.pid for proc in self.managed_processes.values()}
        
        for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
            try:
                if proc.info['pid'] in authorized_pids:
                    continue
                    
                cmdline = ' '.join(proc.info['cmdline'] or []).lower()
                if 'terrafusion' in cmdline or 'npm run dev' in cmdline:
                    print(f"💀 Killing unauthorized process: {proc.info['name']} (PID: {proc.info['pid']})")
                    proc.terminate()
            except:
                continue

def main():
    """Demonstrate REAL Trust Fabric enforcement"""
    fabric = RealTrustFabric()
    
    try:
        # Start services with enforcement
        print("\n🔐 STARTING ENFORCED ECOSYSTEM")
        print("=" * 40)
        
        backend_proc = fabric.start_backend_enforced()
        frontend_proc = fabric.start_frontend_enforced()
        
        print("\n✅ TRUST FABRIC ECOSYSTEM ENFORCED")
        print("=" * 40)
        print(f"🖥️  Backend: http://localhost:{fabric.assigned_ports['backend']}")
        print(f"🌐 Frontend: http://localhost:{fabric.assigned_ports['frontend']}")
        print(f"🔐 Backend PID: {backend_proc.pid} (MANAGED)")
        print(f"🔐 Frontend PID: {frontend_proc.pid} (MANAGED)")
        
        print("\n🛡️  Trust Fabric now OWNS these processes")
        print("💀 Any unauthorized TerraFusion process will be terminated")
        
        # Start monitoring
        fabric.monitor_enforcement()
        
    except KeyboardInterrupt:
        print("\n🛑 Shutting down Trust Fabric...")
        for service, process in fabric.managed_processes.items():
            print(f"💀 Terminating {service} (PID: {process.pid})")
            process.terminate()
            
if __name__ == "__main__":
    main()
