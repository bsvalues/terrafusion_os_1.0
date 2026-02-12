"""
Status Reporting Framework

This module implements a status reporting system for the MCP that utilizes
the enhanced message broker to broadcast agent status updates, progress information,
and system health metrics.

Key features:
- Hourly status updates from agents
- Progress visualization
- Blocker identification
- Escalation protocols
"""

import logging
import time
import threading
import json
import datetime
import queue
from typing import Dict, Any, List, Optional, Set, Union
from collections import defaultdict

from mcp.agent_protocol import Message, MessageType
from mcp.message_broker import MessageBroker, MessageFilter

logger = logging.getLogger(__name__)

# Status levels (in increasing severity)
STATUS_LEVELS = {
    'normal': 0,
    'warning': 1,
    'error': 2,
    'critical': 3,
    'blocked': 4
}

class StatusReporter:
    """
    Status reporting system that collects, processes, and disseminates status 
    information from agents throughout the system.
    """
    
    def __init__(self, message_broker: MessageBroker):
        """
        Initialize the status reporter
        
        Args:
            message_broker: The message broker to use for communication
        """
        self.message_broker = message_broker
        self.agent_statuses = {}  # Latest status from each agent
        self.blockers = {}  # Current blockers by agent
        self.status_history = defaultdict(list)  # Historical status by agent
        self.system_health = {
            'start_time': time.time(),
            'heartbeats': {},
            'last_system_check': time.time(),
            'overall_status': 'normal'
        }
        self.lock = threading.RLock()
        self.running = False
        self.reporter_thread = None
        
        # Configure status update interval (seconds)
        self.status_interval = 3600  # Default to hourly
        self.health_check_interval = 300  # Every 5 minutes
        
    def start(self):
        """Start the status reporter"""
        with self.lock:
            if self.running:
                logger.warning("Status reporter already running")
                return
                
            # Subscribe to the broker first
            self.message_broker.subscribe("status_reporter")
            
            # Subscribe to status update messages
            self.message_broker.subscribe_with_pattern(
                agent_id="status_reporter",
                message_filter=MessageFilter(
                    message_types=[MessageType.STATUS_UPDATE.value]
                )
            )
            
            self.running = True
            self.reporter_thread = threading.Thread(target=self._reporter_worker, daemon=True)
            self.reporter_thread.start()
            logger.info("Status reporter started")
            
    def stop(self):
        """Stop the status reporter"""
        with self.lock:
            if not self.running:
                logger.warning("Status reporter not running")
                return
                
            self.running = False
            if self.reporter_thread:
                self.reporter_thread.join(timeout=5.0)
                self.reporter_thread = None
            logger.info("Status reporter stopped")
    
    def register_agent(self, agent_id: str):
        """
        Register an agent with the status reporter
        
        Args:
            agent_id: The ID of the agent to register
        """
        with self.lock:
            if agent_id not in self.agent_statuses:
                self.agent_statuses[agent_id] = {
                    'status': 'normal',
                    'last_update': time.time(),
                    'message': 'Agent registered',
                    'details': {}
                }
                self.system_health['heartbeats'][agent_id] = time.time()
                logger.info(f"Agent {agent_id} registered with status reporter")
    
    def set_agent_status(self, agent_id: str, status: str, message: str, details: Optional[Dict[str, Any]] = None):
        """
        Set the status of an agent
        
        Args:
            agent_id: The ID of the agent
            status: The status level (normal, warning, error, critical, blocked)
            message: A message describing the status
            details: Additional details about the status
        """
        if status not in STATUS_LEVELS:
            logger.warning(f"Invalid status level: {status}")
            status = 'normal'
            
        with self.lock:
            # Create agent status if needed
            if agent_id not in self.agent_statuses:
                self.register_agent(agent_id)
                
            # Update agent status
            now = time.time()
            prev_status = self.agent_statuses.get(agent_id, {}).get('status')
            
            self.agent_statuses[agent_id] = {
                'status': status,
                'last_update': now,
                'message': message,
                'details': details or {}
            }
            
            # Update heartbeat
            self.system_health['heartbeats'][agent_id] = now
            
            # Add to history
            self.status_history[agent_id].append({
                'timestamp': now,
                'status': status,
                'message': message
            })
            
            # Trim history if needed (keep last 50 statuses)
            max_history = 50
            if len(self.status_history[agent_id]) > max_history:
                self.status_history[agent_id] = self.status_history[agent_id][-max_history:]
            
            # Handle blockers
            if status == 'blocked':
                self.blockers[agent_id] = {
                    'since': now,
                    'message': message,
                    'details': details or {}
                }
            elif agent_id in self.blockers and status != 'blocked':
                del self.blockers[agent_id]
                
            # Log status changes
            if prev_status != status:
                if STATUS_LEVELS.get(status, 0) >= STATUS_LEVELS.get('warning', 0):
                    logger.warning(f"Agent {agent_id} status changed to {status}: {message}")
                else:
                    logger.info(f"Agent {agent_id} status changed to {status}: {message}")
    
    def get_system_status(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Get the current system status
        
        Args:
            force_refresh: If True, forces a complete refresh of all agent statuses
            
        Returns:
            Dictionary with system status information
        """
        with self.lock:
            # Check for missing heartbeats
            self._check_agent_heartbeats()
            
            # If force_refresh, poll all agents for a status update
            if force_refresh:
                self._request_status_updates()
            
            # Calculate overall system status
            highest_status_level = 0
            status_counts = defaultdict(int)
            
            for agent_id, status_info in self.agent_statuses.items():
                status = status_info['status']
                status_level = STATUS_LEVELS.get(status, 0)
                status_counts[status] += 1
                highest_status_level = max(highest_status_level, status_level)
            
            # Map highest level back to status name
            overall_status = 'normal'
            for status, level in STATUS_LEVELS.items():
                if level == highest_status_level:
                    overall_status = status
                    break
            
            # Update system health
            self.system_health['overall_status'] = overall_status
            self.system_health['last_system_check'] = time.time()
            
            # Prepare response
            return {
                'timestamp': time.time(),
                'overall_status': overall_status,
                'uptime': time.time() - self.system_health['start_time'],
                'agent_count': len(self.agent_statuses),
                'status_counts': dict(status_counts),
                'blocker_count': len(self.blockers),
                'agents': self.agent_statuses.copy(),
                'blockers': self.blockers.copy(),
                'system_health': self.system_health.copy()
            }
    
    def get_agent_status(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of a specific agent
        
        Args:
            agent_id: The ID of the agent
            
        Returns:
            Dictionary with agent status information, or None if agent not found
        """
        with self.lock:
            if agent_id not in self.agent_statuses:
                return None
                
            status_info = self.agent_statuses[agent_id].copy()
            status_info['history'] = self.status_history[agent_id].copy()
            return status_info
    
    def get_blockers(self) -> Dict[str, Dict[str, Any]]:
        """
        Get all current blockers
        
        Returns:
            Dictionary mapping agent IDs to blocker information
        """
        with self.lock:
            return self.blockers.copy()
    
    def process_status_message(self, message: Message):
        """
        Process a status update message from an agent
        
        Args:
            message: The status update message
        """
        if message.message_type != MessageType.STATUS_UPDATE.value:
            logger.warning(f"Received non-status message: {message.message_type}")
            return
            
        try:
            payload = message.payload
            agent_id = message.source_agent_id
            status = payload.get('status', 'normal')
            status_message = payload.get('message', 'Status update')
            details = payload.get('details', {})
            
            self.set_agent_status(
                agent_id=agent_id,
                status=status,
                message=status_message,
                details=details
            )
        except Exception as e:
            logger.error(f"Error processing status message: {str(e)}")
    
    def _check_agent_heartbeats(self):
        """Check for missing heartbeats and update agent statuses"""
        now = time.time()
        heartbeat_timeout = 3600  # 1 hour
        
        for agent_id, last_heartbeat in self.system_health['heartbeats'].items():
            if now - last_heartbeat > heartbeat_timeout:
                # Agent is not responding
                if agent_id in self.agent_statuses:
                    self.set_agent_status(
                        agent_id=agent_id,
                        status='warning',
                        message=f"No heartbeat for {int((now - last_heartbeat) / 60)} minutes",
                        details={'last_heartbeat': last_heartbeat}
                    )
    
    def _reporter_worker(self):
        """Worker thread for the status reporter"""
        logger.info("Status reporter worker thread started")
        
        last_status_report = time.time()
        last_health_check = time.time()
        
        # Get the message queue from the broker
        message_queue = self.message_broker.subscribe("status_reporter")
        
        while self.running:
            try:
                now = time.time()
                
                # Check for incoming status messages
                try:
                    # Non-blocking queue check
                    message = message_queue.get(block=False)
                    if message and isinstance(message, Message):
                        if message.message_type == MessageType.STATUS_UPDATE.value:
                            self.process_status_message(message)
                        elif message.message_type == MessageType.STATUS_REQUEST.value:
                            logger.debug(f"Status reporter received a status request (forwarding)")
                except queue.Empty:
                    pass  # No messages in queue
                
                # Perform periodic health check
                if now - last_health_check >= self.health_check_interval:
                    self._check_agent_heartbeats()
                    last_health_check = now
                
                # Generate periodic status reports
                if now - last_status_report >= self.status_interval:
                    self._publish_status_report()
                    last_status_report = now
                
                # Sleep for a short interval
                time.sleep(0.1)
                
            except Exception as e:
                logger.error(f"Error in status reporter worker: {str(e)}")
                time.sleep(5.0)
        
        logger.info("Status reporter worker thread stopped")
    
    def _request_status_updates(self):
        """Request status updates from all registered agents"""
        try:
            # Create status request message
            request_msg = Message(
                source_agent_id="status_reporter",
                target_agent_id="broadcast",
                message_type=MessageType.STATUS_REQUEST.value,
                payload={
                    'timestamp': time.time(),
                    'request_type': 'status_update'
                }
            )
            
            # Publish the message
            self.message_broker.publish(request_msg)
            logger.info(f"Requested status updates from all agents ({len(self.agent_statuses)} registered)")
            
            # Give agents a small amount of time to respond
            time.sleep(0.5)
            
        except Exception as e:
            logger.error(f"Error requesting status updates: {str(e)}")
    
    def _publish_status_report(self):
        """Publish a system-wide status report"""
        try:
            # Get current system status
            system_status = self.get_system_status()
            
            # Create status report message
            status_msg = Message(
                source_agent_id="status_reporter",
                target_agent_id="broadcast",
                message_type=MessageType.STATUS_UPDATE.value,
                payload={
                    'type': 'system_status_report',
                    'timestamp': time.time(),
                    'report': system_status
                }
            )
            
            # Publish the message
            self.message_broker.publish(status_msg)
            
            # Log status report
            if system_status['overall_status'] != 'normal':
                logger.warning(f"Published system status report: {system_status['overall_status']}")
            else:
                logger.info("Published system status report: normal")
            
        except Exception as e:
            logger.error(f"Error publishing status report: {str(e)}")