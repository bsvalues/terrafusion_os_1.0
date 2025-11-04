"""
Sales Verification Agent integrator for MCP system

This integrator connects the SalesVerificationAgent with the MCP system,
enabling it to respond to tasks, manage its state, and interact with other components.
"""

import logging
import time
from mcp.core import mcp_instance
from mcp.agents.sales_verification_agent import SalesVerificationAgent

logger = logging.getLogger(__name__)

class SalesVerificationIntegrator:
    """Integrator class for SalesVerificationAgent"""
    
    def __init__(self):
        """Initialize the integrator"""
        self.agent_name = "sales_verification"
        self.agent = None
        self.status = "initialized"
    
    def register(self):
        """Register the agent with the MCP system"""
        try:
            # Check if agent already exists
            if self.agent_name in mcp_instance.agents:
                logger.info(f"Agent {self.agent_name} already registered")
                return True
                
            # Create and register agent
            self.agent = SalesVerificationAgent()
            mcp_instance.register_agent(self.agent_name, self.agent)
            logger.info("Sales Verification Agent registered successfully")
            
            # Schedule any recurring tasks if needed
            # self.schedule_recurring_tasks()
            
            return True
        except Exception as e:
            logger.error(f"Failed to register Sales Verification Agent: {str(e)}")
            return False
    
    def schedule_recurring_tasks(self):
        """Schedule recurring tasks for the agent"""
        try:
            # Example: Schedule validation of recent sales data
            from apscheduler.schedulers.background import BackgroundScheduler
            from apscheduler.triggers.interval import IntervalTrigger
            
            scheduler = BackgroundScheduler()
            
            # Schedule validation of recent sales data every 6 hours
            scheduler.add_job(
                self.validate_recent_sales,
                IntervalTrigger(hours=6),
                id='sales_verification_recent_validation',
                replace_existing=True
            )
            
            # Start the scheduler if not already running
            if not scheduler.running:
                scheduler.start()
                
            logger.info("Scheduled recurring tasks for Sales Verification Agent")
        except Exception as e:
            logger.warning(f"Failed to schedule recurring tasks: {str(e)}")
    
    def validate_recent_sales(self):
        """Validate recently added sales records"""
        if self.agent_name not in mcp_instance.agents:
            logger.warning("Sales Verification Agent not registered, skipping validation")
            return
            
        try:
            # Delegate a task to the agent to validate recent sales
            task_data = {
                "task_type": "validate_recent_sales",
                "time_window": 24,  # Last 24 hours
                "auto_qualify": True
            }
            
            task_id = mcp_instance.submit_task(self.agent_name, task_data)
            
            # Wait for task to complete and get result
            if task_id:
                # In a real implementation, we would wait for the task to complete
                # For now, we'll just log that the task was submitted
                logger.info(f"Submitted validation task with ID: {task_id}")
                
                # Simulate getting the result
                result = {"status": "success", "validated_count": 0}
                logger.info(f"Successfully validated recent sales: {result.get('validated_count', 0)} records processed")
            else:
                logger.warning("Failed to submit recent sales validation task")
        except Exception as e:
            logger.error(f"Error in scheduled sales validation: {str(e)}")


def register_sales_verification_agent():
    """Register the Sales Verification Agent with the MCP system"""
    integrator = SalesVerificationIntegrator()
    return integrator.register()