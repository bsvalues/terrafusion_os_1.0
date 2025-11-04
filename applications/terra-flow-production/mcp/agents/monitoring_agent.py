"""
Monitoring Agent Module

This module implements a specialized agent for system monitoring, health checks,
and automated alert generation.
"""

import logging
import time
import os
import json
import threading
import datetime
from typing import Dict, List, Any, Optional

from .base_agent import BaseAgent
from ..core import mcp_instance

# Import optional dependencies
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

class MonitoringAgent(BaseAgent):
    """
    Agent responsible for system monitoring and health checks
    """
    
    def __init__(self):
        """Initialize the monitoring agent"""
        super().__init__()
        self.capabilities = [
            "system_health_check",
            "resource_monitoring",
            "performance_tracking",
            "alert_generation"
        ]
        
        # Monitoring configuration
        self.monitoring_interval = 60  # seconds
        self.alert_thresholds = {
            "cpu_percent": 80.0,  # CPU usage percentage
            "memory_percent": 80.0,  # Memory usage percentage
            "disk_percent": 85.0,  # Disk usage percentage
            "agent_response_time": 5.0  # Maximum allowed agent response time in seconds
        }
        self.monitoring_data = {
            "system": {
                "snapshots": [],
                "max_snapshots": 60  # Keep up to 60 snapshots (1 hour at 60s interval)
            },
            "agents": {},  # Agent performance metrics
            "alerts": []  # List of active alerts
        }
        self.monitoring_active = False
        self.monitoring_thread = None
        
        # Start monitoring if initialized
        self.start_monitoring()
        
        self.logger.info("Monitoring Agent initialized")
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a monitoring task"""
        self.last_activity = time.time()
        
        if not task_data or "task_type" not in task_data:
            return {"error": "Invalid task data, missing task_type"}
        
        task_type = task_data["task_type"]
        
        if task_type == "system_health_check":
            return self.check_system_health(task_data)
        elif task_type == "resource_monitoring":
            return self.get_resource_usage(task_data)
        elif task_type == "performance_tracking":
            return self.get_performance_data(task_data)
        elif task_type == "alert_generation":
            return self.generate_alerts(task_data)
        else:
            return {"error": f"Unsupported task type: {task_type}"}
    
    def start_monitoring(self) -> bool:
        """Start the background monitoring thread"""
        if self.monitoring_active:
            return False
        
        self.monitoring_active = True
        self.monitoring_thread = threading.Thread(target=self._monitoring_loop)
        self.monitoring_thread.daemon = True
        self.monitoring_thread.start()
        self.logger.info("Monitoring thread started")
        return True
    
    def stop_monitoring(self) -> bool:
        """Stop the background monitoring thread"""
        if not self.monitoring_active:
            return False
        
        self.monitoring_active = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=5.0)
        self.logger.info("Monitoring thread stopped")
        return True
    
    def _monitoring_loop(self):
        """Background monitoring loop that runs continuously"""
        while self.monitoring_active:
            try:
                # Collect system metrics
                self._collect_system_metrics()
                
                # Check agent health
                self._check_agent_health()
                
                # Generate alerts if needed
                self._generate_system_alerts()
                
                # Update status
                self.set_status("monitoring")
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {str(e)}")
            
            # Sleep for the monitoring interval
            time.sleep(self.monitoring_interval)
    
    def _collect_system_metrics(self):
        """Collect current system metrics"""
        try:
            if not HAS_PSUTIL:
                # Create basic snapshot if psutil is not available
                snapshot = {
                    "timestamp": time.time(),
                    "datetime": datetime.datetime.now().isoformat(),
                    "system": {
                        "cpu_percent": 0.0,
                        "memory_percent": 0.0,
                        "memory_used_mb": 0.0,
                        "memory_available_mb": 0.0,
                        "disk_percent": 0.0,
                        "disk_used_gb": 0.0,
                        "disk_free_gb": 0.0
                    },
                    "network": {
                        "bytes_sent": 0,
                        "bytes_recv": 0,
                        "packets_sent": 0,
                        "packets_recv": 0,
                        "errin": 0,
                        "errout": 0
                    },
                    "process": {
                        "memory_mb": 0.0,
                        "cpu_percent": 0.0
                    }
                }
                
                # Add snapshot to monitoring data
                self.monitoring_data["system"]["snapshots"].append(snapshot)
                
                # Keep only the most recent snapshots
                if len(self.monitoring_data["system"]["snapshots"]) > self.monitoring_data["system"]["max_snapshots"]:
                    self.monitoring_data["system"]["snapshots"].pop(0)
                
                self.logger.warning("psutil not available, using default values for system metrics")
                return
                
            # Get CPU, memory, and disk metrics
            cpu_percent = psutil.cpu_percent(interval=0.5)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Get network stats (basic)
            net_io = psutil.net_io_counters()
            
            # Get process info
            process = psutil.Process(os.getpid())
            process_memory = process.memory_info().rss / (1024 * 1024)  # MB
            process_cpu = process.cpu_percent(interval=0.1)
            
            # Create snapshot
            snapshot = {
                "timestamp": time.time(),
                "datetime": datetime.datetime.now().isoformat(),
                "system": {
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_used_mb": memory.used / (1024 * 1024),
                    "memory_available_mb": memory.available / (1024 * 1024),
                    "disk_percent": disk.percent,
                    "disk_used_gb": disk.used / (1024 * 1024 * 1024),
                    "disk_free_gb": disk.free / (1024 * 1024 * 1024)
                },
                "network": {
                    "bytes_sent": net_io.bytes_sent,
                    "bytes_recv": net_io.bytes_recv,
                    "packets_sent": net_io.packets_sent,
                    "packets_recv": net_io.packets_recv,
                    "errin": net_io.errin,
                    "errout": net_io.errout
                },
                "process": {
                    "memory_mb": process_memory,
                    "cpu_percent": process_cpu
                }
            }
            
            # Add snapshot to monitoring data
            self.monitoring_data["system"]["snapshots"].append(snapshot)
            
            # Keep only the most recent snapshots
            if len(self.monitoring_data["system"]["snapshots"]) > self.monitoring_data["system"]["max_snapshots"]:
                self.monitoring_data["system"]["snapshots"].pop(0)
        
        except Exception as e:
            self.logger.error(f"Error collecting system metrics: {str(e)}")
    
    def _check_agent_health(self):
        """Check the health of all registered agents"""
        try:
            current_agents = mcp_instance.get_agent_info()
            
            # Initialize agent data if not present
            for agent_id in current_agents:
                if agent_id not in self.monitoring_data["agents"]:
                    self.monitoring_data["agents"][agent_id] = {
                        "response_times": [],
                        "last_check": None,
                        "status_history": []
                    }
            
            # Check each agent's health
            for agent_id, agent_info in current_agents.items():
                try:
                    start_time = time.time()
                    
                    # Simple ping test - just get the agent status
                    status = agent_info.get('status', 'unknown')
                    
                    end_time = time.time()
                    response_time = end_time - start_time
                    
                    # Update agent metrics
                    agent_data = self.monitoring_data["agents"][agent_id]
                    agent_data["response_times"].append(response_time)
                    agent_data["last_check"] = time.time()
                    agent_data["last_status"] = status
                    
                    # Keep only the last 10 response times
                    if len(agent_data["response_times"]) > 10:
                        agent_data["response_times"].pop(0)
                    
                    # Add status to history if changed
                    if not agent_data["status_history"] or agent_data["status_history"][-1]["status"] != status:
                        agent_data["status_history"].append({
                            "timestamp": time.time(),
                            "datetime": datetime.datetime.now().isoformat(),
                            "status": status
                        })
                    
                    # Keep only the last 20 status changes
                    if len(agent_data["status_history"]) > 20:
                        agent_data["status_history"].pop(0)
                    
                except Exception as e:
                    self.logger.error(f"Error checking agent {agent_id}: {str(e)}")
        
        except Exception as e:
            self.logger.error(f"Error in agent health check: {str(e)}")
    
    def _generate_system_alerts(self):
        """Generate alerts based on system metrics"""
        try:
            alerts = []
            
            # Check system metrics from the most recent snapshot
            if self.monitoring_data["system"]["snapshots"]:
                snapshot = self.monitoring_data["system"]["snapshots"][-1]
                
                # Check CPU usage
                if snapshot["system"]["cpu_percent"] > self.alert_thresholds["cpu_percent"]:
                    alerts.append({
                        "type": "high_cpu_usage",
                        "severity": "warning",
                        "message": f"High CPU usage: {snapshot['system']['cpu_percent']:.1f}%",
                        "details": {
                            "current": snapshot["system"]["cpu_percent"],
                            "threshold": self.alert_thresholds["cpu_percent"]
                        },
                        "timestamp": time.time(),
                        "datetime": datetime.datetime.now().isoformat()
                    })
                
                # Check memory usage
                if snapshot["system"]["memory_percent"] > self.alert_thresholds["memory_percent"]:
                    alerts.append({
                        "type": "high_memory_usage",
                        "severity": "warning",
                        "message": f"High memory usage: {snapshot['system']['memory_percent']:.1f}%",
                        "details": {
                            "current": snapshot["system"]["memory_percent"],
                            "threshold": self.alert_thresholds["memory_percent"]
                        },
                        "timestamp": time.time(),
                        "datetime": datetime.datetime.now().isoformat()
                    })
                
                # Check disk usage
                if snapshot["system"]["disk_percent"] > self.alert_thresholds["disk_percent"]:
                    alerts.append({
                        "type": "high_disk_usage",
                        "severity": "warning",
                        "message": f"High disk usage: {snapshot['system']['disk_percent']:.1f}%",
                        "details": {
                            "current": snapshot["system"]["disk_percent"],
                            "threshold": self.alert_thresholds["disk_percent"]
                        },
                        "timestamp": time.time(),
                        "datetime": datetime.datetime.now().isoformat()
                    })
            
            # Check agent response times
            for agent_id, agent_data in self.monitoring_data["agents"].items():
                if agent_data["response_times"]:
                    avg_response_time = sum(agent_data["response_times"]) / len(agent_data["response_times"])
                    
                    if avg_response_time > self.alert_thresholds["agent_response_time"]:
                        alerts.append({
                            "type": "slow_agent_response",
                            "severity": "warning",
                            "message": f"Slow agent response: {agent_id} ({avg_response_time:.2f}s)",
                            "details": {
                                "agent_id": agent_id,
                                "avg_response_time": avg_response_time,
                                "threshold": self.alert_thresholds["agent_response_time"]
                            },
                            "timestamp": time.time(),
                            "datetime": datetime.datetime.now().isoformat()
                        })
            
            # Update alerts
            self.monitoring_data["alerts"] = alerts
            
            # Log alerts
            for alert in alerts:
                self.logger.warning(f"Alert: {alert['message']} ({alert['type']})")
        
        except Exception as e:
            self.logger.error(f"Error generating alerts: {str(e)}")
    
    def check_system_health(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform a comprehensive system health check"""
        self.set_status("checking_health")
        
        try:
            start_time = time.time()
            
            # Collect fresh system metrics
            self._collect_system_metrics()
            
            # Get the latest snapshot
            if not self.monitoring_data["system"]["snapshots"]:
                return {"error": "No system metrics available"}
            
            snapshot = self.monitoring_data["system"]["snapshots"][-1]
            
            # Determine system health status
            system_status = "healthy"
            status_reasons = []
            
            # Check CPU
            if snapshot["system"]["cpu_percent"] > self.alert_thresholds["cpu_percent"]:
                system_status = "warning"
                status_reasons.append(f"High CPU usage: {snapshot['system']['cpu_percent']:.1f}%")
            
            # Check memory
            if snapshot["system"]["memory_percent"] > self.alert_thresholds["memory_percent"]:
                system_status = "warning"
                status_reasons.append(f"High memory usage: {snapshot['system']['memory_percent']:.1f}%")
            
            # Check disk
            if snapshot["system"]["disk_percent"] > self.alert_thresholds["disk_percent"]:
                system_status = "warning"
                status_reasons.append(f"High disk usage: {snapshot['system']['disk_percent']:.1f}%")
            
            # Check agent health
            agent_health = {}
            for agent_id, agent_data in self.monitoring_data["agents"].items():
                if not agent_data["response_times"]:
                    agent_health[agent_id] = {
                        "status": "unknown",
                        "message": "No response data available"
                    }
                    continue
                
                avg_response_time = sum(agent_data["response_times"]) / len(agent_data["response_times"])
                last_status = agent_data.get("last_status", "unknown")
                
                if avg_response_time > self.alert_thresholds["agent_response_time"]:
                    agent_health[agent_id] = {
                        "status": "warning",
                        "message": f"Slow response time: {avg_response_time:.2f}s",
                        "avg_response_time": avg_response_time,
                        "last_status": last_status
                    }
                    system_status = "warning"
                    status_reasons.append(f"Agent {agent_id} has slow response time")
                else:
                    agent_health[agent_id] = {
                        "status": "healthy",
                        "message": f"Normal response time: {avg_response_time:.2f}s",
                        "avg_response_time": avg_response_time,
                        "last_status": last_status
                    }
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            return {
                "status": "success",
                "health_check": {
                    "timestamp": time.time(),
                    "datetime": datetime.datetime.now().isoformat(),
                    "system_status": system_status,
                    "status_reasons": status_reasons,
                    "system_metrics": {
                        "cpu_percent": snapshot["system"]["cpu_percent"],
                        "memory_percent": snapshot["system"]["memory_percent"],
                        "disk_percent": snapshot["system"]["disk_percent"],
                        "memory_used_mb": snapshot["system"]["memory_used_mb"],
                        "memory_available_mb": snapshot["system"]["memory_available_mb"],
                        "disk_used_gb": snapshot["system"]["disk_used_gb"],
                        "disk_free_gb": snapshot["system"]["disk_free_gb"]
                    },
                    "process_metrics": {
                        "memory_mb": snapshot["process"]["memory_mb"],
                        "cpu_percent": snapshot["process"]["cpu_percent"]
                    },
                    "agent_health": agent_health
                },
                "processing_time": processing_time
            }
            
        except Exception as e:
            self.logger.error(f"Health check error: {str(e)}")
            return {"error": f"Health check failed: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def get_resource_usage(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get detailed resource usage information"""
        self.set_status("monitoring_resources")
        
        try:
            start_time = time.time()
            
            # Get the time period to analyze
            period = task_data.get("period", "recent")  # recent, hour, all
            
            # Get snapshots based on period
            snapshots = self.monitoring_data["system"]["snapshots"]
            
            if period == "recent":
                # Get most recent snapshot
                if not snapshots:
                    return {"error": "No resource data available"}
                selected_snapshots = [snapshots[-1]]
                
            elif period == "hour":
                # Get up to last hour of snapshots
                hour_ago = time.time() - 3600
                selected_snapshots = [s for s in snapshots if s["timestamp"] >= hour_ago]
                
                if not selected_snapshots:
                    return {"error": "No resource data available for the last hour"}
                
            else:  # all
                selected_snapshots = snapshots
                
                if not selected_snapshots:
                    return {"error": "No resource data available"}
            
            # Calculate statistics
            if len(selected_snapshots) > 1:
                # Calculate averages and trends
                cpu_values = [s["system"]["cpu_percent"] for s in selected_snapshots]
                memory_values = [s["system"]["memory_percent"] for s in selected_snapshots]
                disk_values = [s["system"]["disk_percent"] for s in selected_snapshots]
                
                # Current values (most recent)
                current_cpu = selected_snapshots[-1]["system"]["cpu_percent"]
                current_memory = selected_snapshots[-1]["system"]["memory_percent"]
                current_disk = selected_snapshots[-1]["system"]["disk_percent"]
                
                # Average values
                avg_cpu = sum(cpu_values) / len(cpu_values)
                avg_memory = sum(memory_values) / len(memory_values)
                avg_disk = sum(disk_values) / len(disk_values)
                
                # Trend (simple slope between first and last)
                trend_cpu = cpu_values[-1] - cpu_values[0]
                trend_memory = memory_values[-1] - memory_values[0]
                trend_disk = disk_values[-1] - disk_values[0]
                
                # Resource fluctuation (standard deviation)
                if len(cpu_values) > 2:
                    import statistics
                    fluc_cpu = statistics.stdev(cpu_values)
                    fluc_memory = statistics.stdev(memory_values)
                    fluc_disk = statistics.stdev(disk_values)
                else:
                    fluc_cpu = abs(cpu_values[-1] - cpu_values[0]) / 2
                    fluc_memory = abs(memory_values[-1] - memory_values[0]) / 2
                    fluc_disk = abs(disk_values[-1] - disk_values[0]) / 2
                
                statistics = {
                    "current": {
                        "cpu_percent": current_cpu,
                        "memory_percent": current_memory,
                        "disk_percent": current_disk
                    },
                    "average": {
                        "cpu_percent": avg_cpu,
                        "memory_percent": avg_memory,
                        "disk_percent": avg_disk
                    },
                    "trend": {
                        "cpu_percent": trend_cpu,
                        "memory_percent": trend_memory,
                        "disk_percent": trend_disk
                    },
                    "fluctuation": {
                        "cpu_percent": fluc_cpu,
                        "memory_percent": fluc_memory,
                        "disk_percent": fluc_disk
                    },
                    "samples": len(selected_snapshots),
                    "time_period": {
                        "start": selected_snapshots[0]["datetime"],
                        "end": selected_snapshots[-1]["datetime"]
                    }
                }
            else:
                # Just current values for a single snapshot
                snapshot = selected_snapshots[0]
                statistics = {
                    "current": {
                        "cpu_percent": snapshot["system"]["cpu_percent"],
                        "memory_percent": snapshot["system"]["memory_percent"],
                        "disk_percent": snapshot["system"]["disk_percent"]
                    },
                    "samples": 1,
                    "time_period": {
                        "start": snapshot["datetime"],
                        "end": snapshot["datetime"]
                    }
                }
            
            # Get details about running processes (top consumers)
            try:
                top_processes = []
                for proc in sorted(psutil.process_iter(['pid', 'name', 'username', 'memory_percent', 'cpu_percent']), 
                                   key=lambda p: p.info['cpu_percent'] + p.info['memory_percent'] * 10, 
                                   reverse=True)[:5]:
                    top_processes.append({
                        "pid": proc.info['pid'],
                        "name": proc.info['name'],
                        "username": proc.info['username'],
                        "memory_percent": proc.info['memory_percent'],
                        "cpu_percent": proc.info['cpu_percent']
                    })
            except Exception as proc_err:
                self.logger.warning(f"Error getting process info: {str(proc_err)}")
                top_processes = []
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            return {
                "status": "success",
                "resource_usage": {
                    "timestamp": time.time(),
                    "datetime": datetime.datetime.now().isoformat(),
                    "period": period,
                    "statistics": statistics,
                    "current_snapshot": selected_snapshots[-1],
                    "top_processes": top_processes
                },
                "processing_time": processing_time
            }
            
        except Exception as e:
            self.logger.error(f"Resource monitoring error: {str(e)}")
            return {"error": f"Resource monitoring failed: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def get_performance_data(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get performance tracking data for agents"""
        self.set_status("tracking_performance")
        
        try:
            start_time = time.time()
            
            # Get the agent_id if specified
            agent_id = task_data.get("agent_id")
            
            if agent_id:
                # Get data for a specific agent
                if agent_id not in self.monitoring_data["agents"]:
                    return {"error": f"No performance data available for agent {agent_id}"}
                
                agent_data = self.monitoring_data["agents"][agent_id]
                
                result = {
                    "agent_id": agent_id,
                    "performance": {
                        "response_times": agent_data["response_times"],
                        "avg_response_time": sum(agent_data["response_times"]) / len(agent_data["response_times"]) if agent_data["response_times"] else None,
                        "last_check": agent_data["last_check"],
                        "last_status": agent_data.get("last_status", "unknown"),
                        "status_history": agent_data["status_history"]
                    }
                }
            else:
                # Get data for all agents
                result = {
                    "agents": {}
                }
                
                for agent_id, agent_data in self.monitoring_data["agents"].items():
                    result["agents"][agent_id] = {
                        "avg_response_time": sum(agent_data["response_times"]) / len(agent_data["response_times"]) if agent_data["response_times"] else None,
                        "last_check": agent_data["last_check"],
                        "last_status": agent_data.get("last_status", "unknown"),
                        "status_history_count": len(agent_data["status_history"])
                    }
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            return {
                "status": "success",
                "performance_data": result,
                "processing_time": processing_time
            }
            
        except Exception as e:
            self.logger.error(f"Performance tracking error: {str(e)}")
            return {"error": f"Performance tracking failed: {str(e)}"}
        finally:
            self.set_status("idle")
    
    def generate_alerts(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate and return system alerts"""
        self.set_status("generating_alerts")
        
        try:
            start_time = time.time()
            
            # Refresh alerts
            self._generate_system_alerts()
            
            # Get alerts
            alerts = self.monitoring_data["alerts"]
            
            # Get latest system health
            system_health = None
            if self.monitoring_data["system"]["snapshots"]:
                snapshot = self.monitoring_data["system"]["snapshots"][-1]
                system_health = {
                    "cpu_percent": snapshot["system"]["cpu_percent"],
                    "memory_percent": snapshot["system"]["memory_percent"],
                    "disk_percent": snapshot["system"]["disk_percent"]
                }
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            return {
                "status": "success",
                "alerts": {
                    "count": len(alerts),
                    "items": alerts,
                    "system_health": system_health,
                    "thresholds": self.alert_thresholds
                },
                "processing_time": processing_time
            }
            
        except Exception as e:
            self.logger.error(f"Alert generation error: {str(e)}")
            return {"error": f"Alert generation failed: {str(e)}"}
        finally:
            self.set_status("idle")

# Register this agent with the MCP
mcp_instance.register_agent("monitoring", MonitoringAgent())