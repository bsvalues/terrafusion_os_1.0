"""
Assessment Integration Module for Benton County GeoAssessmentPro

This module provides integration points for using the specialized assessment agents
and workflow coordinator in the application. It handles the registration of assessment-specific
agents and provides a simplified interface for creating and managing assessment workflows.
"""

import logging
from typing import Dict, List, Any, Optional, Union
import datetime

from mcp.core import mcp_instance
from mcp.workflows.assessment_workflow import PropertyAssessmentWorkflow, assessment_workflow

# Configure logging
logger = logging.getLogger(__name__)

class AssessmentIntegration:
    """
    Integration class for assessment agents and workflows
    
    This class provides a simplified interface for using the assessment
    capabilities in the application, handling agent registration and workflow
    management.
    """
    
    def __init__(self):
        """Initialize assessment integration"""
        self.initialized = False
        self.available_workflow_types = []
        
        # Reference to the workflow coordinator
        self.workflow_coordinator = assessment_workflow
        
        # Configure the protocol handler in the workflow coordinator
        if hasattr(self.workflow_coordinator, 'protocol_handler') and not self.workflow_coordinator.protocol_handler:
            self.workflow_coordinator.protocol_handler = mcp_instance.protocol_handler
    
    def initialize(self) -> bool:
        """
        Initialize assessment integration by registering required agents
        
        Returns:
            True if initialization successful, False otherwise
        """
        if self.initialized:
            return True
            
        try:
            # Register specialized assessment agents
            assessment_agents = [
                "property_valuation",
                "tax_law_compliance"
            ]
            
            registered_agents = []
            for agent_type in assessment_agents:
                agent_id = mcp_instance.register_workflow_agent(agent_type)
                if agent_id:
                    registered_agents.append(agent_id)
                    logger.info(f"Registered assessment agent: {agent_id}")
            
            # Check if all required agents were registered
            if len(registered_agents) != len(assessment_agents):
                logger.error("Failed to register all required assessment agents")
                return False
                
            # Update available workflow types from the workflow coordinator
            self.available_workflow_types = list(self.workflow_coordinator.workflow_templates.keys())
            
            self.initialized = True
            logger.info(f"Assessment integration initialized with {len(registered_agents)} specialized agents")
            logger.info(f"Available workflows: {', '.join(self.available_workflow_types)}")
            
            return True
        except Exception as e:
            logger.error(f"Error initializing assessment integration: {str(e)}")
            return False
    
    def create_assessment_workflow(
        self,
        workflow_type: str,
        property_id: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> Optional[str]:
        """
        Create an assessment workflow
        
        Args:
            workflow_type: Type of workflow to create
            property_id: ID of the property
            parameters: Additional parameters for workflow
            
        Returns:
            Workflow ID if successful, None otherwise
        """
        if not self.initialized:
            if not self.initialize():
                return None
        
        if workflow_type not in self.available_workflow_types:
            logger.error(f"Unknown workflow type: {workflow_type}")
            return None
        
        try:
            workflow_id = self.workflow_coordinator.create_workflow(
                workflow_type, 
                property_id,
                parameters
            )
            
            logger.info(f"Created assessment workflow: {workflow_id}")
            return workflow_id
        except Exception as e:
            logger.error(f"Error creating assessment workflow: {str(e)}")
            return None
    
    def start_assessment_workflow(self, workflow_id: str) -> bool:
        """
        Start an assessment workflow
        
        Args:
            workflow_id: ID of the workflow to start
            
        Returns:
            True if workflow started successfully, False otherwise
        """
        if not self.initialized:
            if not self.initialize():
                return False
        
        try:
            result = self.workflow_coordinator.start_workflow(workflow_id)
            if result:
                logger.info(f"Started assessment workflow: {workflow_id}")
            else:
                logger.error(f"Failed to start assessment workflow: {workflow_id}")
            return result
        except Exception as e:
            logger.error(f"Error starting assessment workflow: {str(e)}")
            return False
    
    def get_assessment_workflow_status(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of an assessment workflow
        
        Args:
            workflow_id: ID of the workflow
            
        Returns:
            Workflow status if successful, None otherwise
        """
        if not self.initialized:
            if not self.initialize():
                return None
        
        try:
            return self.workflow_coordinator.get_workflow_status(workflow_id)
        except Exception as e:
            logger.error(f"Error getting workflow status: {str(e)}")
            return None
    
    def get_assessment_workflow_result(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the result of a completed assessment workflow
        
        Args:
            workflow_id: ID of the workflow
            
        Returns:
            Workflow result if completed, None otherwise
        """
        if not self.initialized:
            if not self.initialize():
                return None
        
        try:
            return self.workflow_coordinator.get_workflow_result(workflow_id)
        except Exception as e:
            logger.error(f"Error getting workflow result: {str(e)}")
            return None
    
    def cancel_assessment_workflow(self, workflow_id: str) -> bool:
        """
        Cancel an assessment workflow
        
        Args:
            workflow_id: ID of the workflow to cancel
            
        Returns:
            True if workflow cancelled successfully, False otherwise
        """
        if not self.initialized:
            if not self.initialize():
                return False
        
        try:
            result = self.workflow_coordinator.cancel_workflow(workflow_id)
            if result:
                logger.info(f"Cancelled assessment workflow: {workflow_id}")
            else:
                logger.error(f"Failed to cancel assessment workflow: {workflow_id}")
            return result
        except Exception as e:
            logger.error(f"Error cancelling workflow: {str(e)}")
            return False
    
    def get_available_workflow_types(self) -> List[Dict[str, Any]]:
        """
        Get information about available workflow types
        
        Returns:
            List of available workflow types with descriptions
        """
        if not self.initialized:
            if not self.initialize():
                return []
        
        workflow_types = []
        for wf_type, template in self.workflow_coordinator.workflow_templates.items():
            workflow_types.append({
                "id": wf_type,
                "name": template.get("name", wf_type),
                "description": template.get("description", ""),
                "steps": len(template.get("steps", []))
            })
        
        return workflow_types
    
    def run_property_valuation(
        self,
        property_id: str,
        valuation_method: str = "sales_comparison"
    ) -> Optional[Dict[str, Any]]:
        """
        Run a property valuation without a full workflow
        
        Args:
            property_id: ID of the property to value
            valuation_method: Valuation method to use
            
        Returns:
            Valuation result if successful, None otherwise
        """
        if not self.initialized:
            if not self.initialize():
                return None
        
        # Get the property valuation agent
        agent = mcp_instance.get_agent("property_valuation")
        if not agent:
            logger.error("Property valuation agent not found")
            return None
        
        try:
            # Create task data
            task_data = {
                "task_type": "comparable_properties",
                "property_id": property_id,
                "valuation_method": valuation_method
            }
            
            # Submit the task
            task_id = mcp_instance.submit_task("property_valuation", task_data)
            if not task_id:
                logger.error("Failed to submit valuation task")
                return None
            
            # Wait for the task to complete
            max_wait = 60  # Maximum wait time in seconds
            wait_interval = 0.5  # Wait interval in seconds
            waited = 0
            
            while waited < max_wait:
                task_status = mcp_instance.get_task_status(task_id)
                if not task_status:
                    logger.error(f"Task {task_id} not found")
                    return None
                
                if task_status["status"] == "completed":
                    # Get the task result
                    result = mcp_instance.get_task_result(task_id)
                    if not result:
                        logger.error(f"No result for task {task_id}")
                        return None
                    
                    return result
                
                if task_status["status"] == "failed":
                    logger.error(f"Task {task_id} failed")
                    return None
                
                # Wait before checking again
                import time
                time.sleep(wait_interval)
                waited += wait_interval
            
            logger.error(f"Timeout waiting for valuation task {task_id}")
            return None
        except Exception as e:
            logger.error(f"Error running property valuation: {str(e)}")
            return None
    
    def check_exemption_eligibility(
        self,
        property_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Check tax exemption eligibility for a property
        
        Args:
            property_id: ID of the property to check
            
        Returns:
            Exemption eligibility result if successful, None otherwise
        """
        if not self.initialized:
            if not self.initialize():
                return None
        
        # Get the tax law compliance agent
        agent = mcp_instance.get_agent("tax_law_compliance")
        if not agent:
            logger.error("Tax law compliance agent not found")
            return None
        
        try:
            # Create task data
            task_data = {
                "task_type": "tax_exemption_analysis",
                "property_id": property_id
            }
            
            # Submit the task
            task_id = mcp_instance.submit_task("tax_law_compliance", task_data)
            if not task_id:
                logger.error("Failed to submit exemption analysis task")
                return None
            
            # Wait for the task to complete
            max_wait = 60  # Maximum wait time in seconds
            wait_interval = 0.5  # Wait interval in seconds
            waited = 0
            
            while waited < max_wait:
                task_status = mcp_instance.get_task_status(task_id)
                if not task_status:
                    logger.error(f"Task {task_id} not found")
                    return None
                
                if task_status["status"] == "completed":
                    # Get the task result
                    result = mcp_instance.get_task_result(task_id)
                    if not result:
                        logger.error(f"No result for task {task_id}")
                        return None
                    
                    return result
                
                if task_status["status"] == "failed":
                    logger.error(f"Task {task_id} failed")
                    return None
                
                # Wait before checking again
                import time
                time.sleep(wait_interval)
                waited += wait_interval
            
            logger.error(f"Timeout waiting for exemption analysis task {task_id}")
            return None
        except Exception as e:
            logger.error(f"Error checking exemption eligibility: {str(e)}")
            return None


# Create a global instance
assessment_integration = AssessmentIntegration()