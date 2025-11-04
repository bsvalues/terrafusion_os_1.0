"""
Agent Recovery System

This module provides functionality to monitor and recover AI agents that are unhealthy
or have been inactive for too long. It implements automatic detection, restart,
and notification mechanisms.
"""

import os
import time
import logging
import threading
from typing import Dict, List, Optional, Set, Tuple
from datetime import datetime, timedelta
import json
import psutil

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
INACTIVITY_THRESHOLD = 900  # seconds (15 minutes)
MAX_RESTART_ATTEMPTS = 3
RESTART_COOLDOWN = 300  # seconds (5 minutes)
HEALTH_CHECK_INTERVAL = 60  # seconds (1 minute)

class AgentRecoverySystem:
    """
    System for monitoring and recovering unhealthy AI agents
    """
    
    def __init__(self, app_context=None):
        """
        Initialize the Agent Recovery System
        
        Args:
            app_context: Optional Flask app context
        """
        self.app_context = app_context
        self.running = False
        self.recovery_thread = None
        self.restart_attempts = {}  # Track restart attempts by agent_id
        self.last_restart = {}  # Track last restart time by agent_id
        self.recovered_agents = set()  # Track successfully recovered agents
        self.recovery_metrics = {
            "total_recoveries": 0,
            "successful_recoveries": 0,
            "failed_recoveries": 0,
            "last_recovery_time": None,
            "agents_restarted": []
        }
        
        # Load MCP
        try:
            from ai_agents.mcp_core import get_mcp
            self.mcp = get_mcp()
        except ImportError:
            logger.error("Failed to import MCP. Agent recovery will not work.")
            self.mcp = None
    
    def start(self):
        """
        Start the agent recovery system
        """
        if self.running:
            logger.warning("Agent recovery system already running")
            return
            
        self.running = True
        self.recovery_thread = threading.Thread(target=self._monitor_loop)
        self.recovery_thread.daemon = True
        self.recovery_thread.start()
        logger.info("Agent recovery system started")
    
    def stop(self):
        """
        Stop the agent recovery system
        """
        self.running = False
        if self.recovery_thread:
            self.recovery_thread.join(timeout=5)
        logger.info("Agent recovery system stopped")
    
    def _monitor_loop(self):
        """
        Main monitoring loop
        """
        while self.running:
            try:
                if self.app_context:
                    with self.app_context():
                        self._check_and_recover_agents()
                else:
                    self._check_and_recover_agents()
            except Exception as e:
                logger.error(f"Error in agent recovery monitoring loop: {str(e)}")
            
            # Sleep before next check
            time.sleep(HEALTH_CHECK_INTERVAL)
    
    def _check_and_recover_agents(self):
        """
        Check agent health and recover unhealthy agents
        """
        if not self.mcp:
            logger.warning("No MCP available, skipping agent recovery check")
            return
            
        # Get list of inactive agents
        inactive_agents = self._get_inactive_agents()
        
        # Get list of unhealthy agents
        unhealthy_agents = self._get_unhealthy_agents()
        
        # Combine inactive and unhealthy agents
        agents_to_recover = inactive_agents.union(unhealthy_agents)
        
        # Recover agents
        for agent_id in agents_to_recover:
            self._recover_agent(agent_id)
    
    def _get_inactive_agents(self) -> Set[str]:
        """
        Get set of inactive agent IDs
        
        Returns:
            Set of agent IDs that are inactive
        """
        inactive_agents = set()
        
        for agent_id, agent in self.mcp.active_agents.items():
            # Check last activity time
            if hasattr(agent, 'last_activity'):
                last_activity = agent.last_activity
                if isinstance(last_activity, datetime):
                    inactivity_time = (datetime.now() - last_activity).total_seconds()
                    if inactivity_time > INACTIVITY_THRESHOLD:
                        logger.warning(f"Agent {agent_id} has been inactive for {inactivity_time:.1f} seconds")
                        inactive_agents.add(agent_id)
            
            # Check if agent process is still running
            if hasattr(agent, 'process_id'):
                if not self._is_process_running(agent.process_id):
                    logger.warning(f"Agent {agent_id} process {agent.process_id} is not running")
                    inactive_agents.add(agent_id)
        
        return inactive_agents
    
    def _get_unhealthy_agents(self) -> Set[str]:
        """
        Get set of unhealthy agent IDs
        
        Returns:
            Set of agent IDs that are unhealthy
        """
        unhealthy_agents = set()
        
        for agent_id, agent in self.mcp.active_agents.items():
            # Check agent health status
            if hasattr(agent, 'health'):
                if agent.health < 0.5:  # Health below 50%
                    logger.warning(f"Agent {agent_id} health is low: {agent.health:.2f}")
                    unhealthy_agents.add(agent_id)
            
            # Check agent error count
            if hasattr(agent, 'error_count'):
                if agent.error_count > 5:  # More than 5 errors
                    logger.warning(f"Agent {agent_id} has {agent.error_count} errors")
                    unhealthy_agents.add(agent_id)
        
        return unhealthy_agents
    
    def _is_process_running(self, pid: int) -> bool:
        """
        Check if a process is running
        
        Args:
            pid: Process ID
            
        Returns:
            True if process is running, False otherwise
        """
        try:
            process = psutil.Process(pid)
            return process.is_running()
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            return False
    
    def _recover_agent(self, agent_id: str):
        """
        Recover an agent by restarting it
        
        Args:
            agent_id: ID of the agent to recover
        """
        # Skip if recently restarted
        now = time.time()
        if agent_id in self.last_restart:
            time_since_restart = now - self.last_restart[agent_id]
            if time_since_restart < RESTART_COOLDOWN:
                logger.info(f"Skipping restart of agent {agent_id}, last restart was {time_since_restart:.1f} seconds ago")
                return
        
        # Check restart attempts
        restart_attempts = self.restart_attempts.get(agent_id, 0)
        if restart_attempts >= MAX_RESTART_ATTEMPTS:
            logger.warning(f"Agent {agent_id} has reached maximum restart attempts ({MAX_RESTART_ATTEMPTS})")
            return
        
        # Get agent type
        agent_type = None
        if agent_id in self.mcp.active_agents:
            agent = self.mcp.active_agents[agent_id]
            if hasattr(agent, 'agent_type'):
                agent_type = agent.agent_type
        
        # Restart agent
        logger.info(f"Restarting agent {agent_id} (type: {agent_type})")
        
        try:
            # Stop the old agent
            self.mcp.stop_agent(agent_id)
            
            # Create a new agent of the same type
            if agent_type:
                new_agent = self.mcp.create_agent(agent_type)
                logger.info(f"Created new agent {new_agent.id} of type {agent_type}")
                
                # Update recovery metrics
                self.recovery_metrics["total_recoveries"] += 1
                self.recovery_metrics["successful_recoveries"] += 1
                self.recovery_metrics["last_recovery_time"] = datetime.now().isoformat()
                self.recovery_metrics["agents_restarted"].append({
                    "agent_id": agent_id,
                    "new_agent_id": new_agent.id,
                    "agent_type": agent_type,
                    "time": datetime.now().isoformat()
                })
                
                # Reset restart attempts if successful
                self.restart_attempts[agent_id] = 0
                self.last_restart[agent_id] = now
                self.recovered_agents.add(agent_id)
            else:
                logger.error(f"Could not determine agent type for {agent_id}, cannot restart")
                self.recovery_metrics["failed_recoveries"] += 1
        except Exception as e:
            logger.error(f"Failed to restart agent {agent_id}: {str(e)}")
            self.restart_attempts[agent_id] = restart_attempts + 1
            self.recovery_metrics["failed_recoveries"] += 1
    
    def get_metrics(self) -> Dict:
        """
        Get recovery metrics
        
        Returns:
            Dictionary with recovery metrics
        """
        return {
            "metrics": self.recovery_metrics,
            "restart_attempts": self.restart_attempts,
            "recovered_agents": list(self.recovered_agents)
        }

# Singleton instance
_recovery_system = None

def initialize_recovery_system(app_context=None):
    """
    Initialize the agent recovery system
    
    Args:
        app_context: Optional Flask app context
    """
    global _recovery_system
    if _recovery_system is None:
        _recovery_system = AgentRecoverySystem(app_context)
        _recovery_system.start()
    return _recovery_system

def get_recovery_system():
    """
    Get the agent recovery system instance
    
    Returns:
        AgentRecoverySystem instance
    """
    global _recovery_system
    if _recovery_system is None:
        _recovery_system = initialize_recovery_system()
    return _recovery_system

if __name__ == "__main__":
    # Run as standalone script for testing
    recovery = AgentRecoverySystem()
    recovery.start()
    
    try:
        while True:
            time.sleep(10)
            metrics = recovery.get_metrics()
            print(f"Recovery metrics: {json.dumps(metrics, indent=2)}")
    except KeyboardInterrupt:
        recovery.stop()
        print("Recovery system stopped")