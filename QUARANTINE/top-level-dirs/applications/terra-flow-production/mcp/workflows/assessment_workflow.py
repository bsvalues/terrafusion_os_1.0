"""
Property Assessment Workflow Coordinator for Benton County GeoAssessmentPro

This module implements a workflow coordinator that orchestrates the collaboration
between specialized agents for property assessment workflows. It uses the
Agent-to-Agent protocol to manage complex assessment tasks, ensuring compliance
with Washington State regulations and best practices.

Key features:
- Orchestrates multi-agent assessment workflows
- Manages state and dependencies between workflow steps
- Provides context sharing across specialized agents
- Tracks workflow progress and outcomes for auditing
"""

import logging
import datetime
import uuid
import time
from typing import Dict, List, Any, Optional, Union, Callable
from enum import Enum

from mcp.agent_protocol import AgentCommunicationProtocol, MessageType
from mcp.core import mcp_instance

# Configure logging
logger = logging.getLogger(__name__)

class WorkflowState(Enum):
    """Possible states for a workflow instance"""
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"


class WorkflowStepState(Enum):
    """Possible states for a workflow step"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class PropertyAssessmentWorkflow:
    """
    Workflow manager for property assessment processes
    
    This class orchestrates the complex workflow of property assessment,
    coordinating the activities of specialized agents including property valuation,
    tax law compliance, spatial analysis, and data quality.
    """
    
    def __init__(self, protocol_handler: Optional[AgentCommunicationProtocol] = None):
        """
        Initialize the property assessment workflow coordinator
        
        Args:
            protocol_handler: Agent communication protocol handler
        """
        self.protocol_handler = protocol_handler
        self.workflows = {}  # Store active workflow instances
        
        # Define workflow templates (predefined workflows)
        self.workflow_templates = {
            "annual_assessment": {
                "name": "Annual Property Assessment",
                "description": "Standard annual property assessment workflow",
                "steps": [
                    {
                        "id": "data_validation",
                        "name": "Property Data Validation",
                        "agent": "data_quality",
                        "task": "validate_property_data",
                        "required": True
                    },
                    {
                        "id": "spatial_analysis",
                        "name": "Property Spatial Analysis",
                        "agent": "spatial_analysis",
                        "task": "analyze_property_location",
                        "required": False,
                        "depends_on": ["data_validation"]
                    },
                    {
                        "id": "valuation",
                        "name": "Property Valuation",
                        "agent": "property_valuation",
                        "task": "comparable_properties",
                        "required": True,
                        "depends_on": ["data_validation"]
                    },
                    {
                        "id": "tax_compliance",
                        "name": "Tax Law Compliance Check",
                        "agent": "tax_law_compliance",
                        "task": "wa_state_compliance_check",
                        "required": True,
                        "depends_on": ["valuation"]
                    },
                    {
                        "id": "exemption_analysis",
                        "name": "Exemption Eligibility Analysis",
                        "agent": "tax_law_compliance",
                        "task": "tax_exemption_analysis",
                        "required": False,
                        "depends_on": ["tax_compliance"]
                    },
                    {
                        "id": "assessment_finalization",
                        "name": "Assessment Finalization",
                        "agent": "property_valuation",
                        "task": "finalize_assessment",
                        "required": True,
                        "depends_on": ["valuation", "tax_compliance", "exemption_analysis"]
                    }
                ]
            },
            "appeal_support": {
                "name": "Property Assessment Appeal Support",
                "description": "Workflow for generating appeal support documentation",
                "steps": [
                    {
                        "id": "data_validation",
                        "name": "Property Data Validation",
                        "agent": "data_quality",
                        "task": "validate_property_data",
                        "required": True
                    },
                    {
                        "id": "comparable_analysis",
                        "name": "Comparable Properties Analysis",
                        "agent": "property_valuation",
                        "task": "comparable_properties",
                        "required": True,
                        "depends_on": ["data_validation"]
                    },
                    {
                        "id": "law_compliance",
                        "name": "Regulatory Compliance Analysis",
                        "agent": "tax_law_compliance",
                        "task": "appeal_support",
                        "required": True,
                        "depends_on": ["data_validation"]
                    },
                    {
                        "id": "spatial_evidence",
                        "name": "Spatial Analysis Evidence",
                        "agent": "spatial_analysis",
                        "task": "generate_location_analysis",
                        "required": False,
                        "depends_on": ["data_validation"]
                    },
                    {
                        "id": "appeal_documentation",
                        "name": "Appeal Documentation Generation",
                        "agent": "tax_law_compliance",
                        "task": "compliance_documentation",
                        "required": True,
                        "depends_on": ["comparable_analysis", "law_compliance", "spatial_evidence"]
                    }
                ]
            },
            "special_valuation": {
                "name": "Special Valuation Assessment",
                "description": "Workflow for properties requiring special valuation handling",
                "steps": [
                    {
                        "id": "data_validation",
                        "name": "Property Data Validation",
                        "agent": "data_quality",
                        "task": "validate_property_data",
                        "required": True
                    },
                    {
                        "id": "special_classification",
                        "name": "Special Classification Analysis",
                        "agent": "tax_law_compliance",
                        "task": "special_valuation_guidance",
                        "required": True,
                        "depends_on": ["data_validation"]
                    },
                    {
                        "id": "valuation",
                        "name": "Specialized Valuation",
                        "agent": "property_valuation",
                        "task": "specialized_valuation",
                        "required": True,
                        "depends_on": ["special_classification"]
                    },
                    {
                        "id": "compliance_check",
                        "name": "Regulatory Compliance Check",
                        "agent": "tax_law_compliance",
                        "task": "wa_state_compliance_check",
                        "required": True,
                        "depends_on": ["valuation"]
                    },
                    {
                        "id": "documentation",
                        "name": "Special Valuation Documentation",
                        "agent": "tax_law_compliance",
                        "task": "compliance_documentation",
                        "required": True,
                        "depends_on": ["compliance_check"]
                    }
                ]
            }
        }
        
        logger.info(f"Property Assessment Workflow initialized with {len(self.workflow_templates)} templates")
    
    def create_workflow(
        self, 
        workflow_type: str, 
        property_id: str,
        parameters: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Create a new workflow instance
        
        Args:
            workflow_type: Type of workflow to create (must match a template name)
            property_id: ID of the property for this workflow
            parameters: Additional parameters for workflow configuration
            
        Returns:
            Workflow ID
        """
        if workflow_type not in self.workflow_templates:
            raise ValueError(f"Unknown workflow type: {workflow_type}")
        
        # Create a new workflow instance
        workflow_id = f"wf_{uuid.uuid4().hex[:8]}"
        
        # Get the template
        template = self.workflow_templates[workflow_type]
        
        # Create workflow instance
        workflow = {
            "id": workflow_id,
            "type": workflow_type,
            "name": template["name"],
            "description": template["description"],
            "property_id": property_id,
            "parameters": parameters or {},
            "state": WorkflowState.PENDING.value,
            "steps": [],
            "created_at": datetime.datetime.now().isoformat(),
            "started_at": None,
            "completed_at": None,
            "context": {
                "property_id": property_id,
                "shared_data": {}
            }
        }
        
        # Copy steps from template
        for step_template in template["steps"]:
            step = step_template.copy()
            step["state"] = WorkflowStepState.PENDING.value
            step["started_at"] = None
            step["completed_at"] = None
            step["result"] = None
            workflow["steps"].append(step)
        
        # Store workflow
        self.workflows[workflow_id] = workflow
        
        logger.info(f"Created {workflow_type} workflow {workflow_id} for property {property_id}")
        
        return workflow_id
    
    def start_workflow(self, workflow_id: str) -> bool:
        """
        Start a workflow
        
        Args:
            workflow_id: ID of the workflow to start
            
        Returns:
            True if workflow started successfully, False otherwise
        """
        if workflow_id not in self.workflows:
            logger.error(f"Workflow {workflow_id} not found")
            return False
        
        workflow = self.workflows[workflow_id]
        
        # Check if workflow can be started
        if workflow["state"] != WorkflowState.PENDING.value:
            logger.warning(f"Cannot start workflow {workflow_id} in state {workflow['state']}")
            return False
        
        # Update workflow state
        workflow["state"] = WorkflowState.RUNNING.value
        workflow["started_at"] = datetime.datetime.now().isoformat()
        
        # Start the first steps (those with no dependencies)
        for step in workflow["steps"]:
            if not step.get("depends_on") and step["state"] == WorkflowStepState.PENDING.value:
                self._start_step(workflow, step)
        
        logger.info(f"Started workflow {workflow_id}")
        
        return True
    
    def get_workflow_status(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of a workflow
        
        Args:
            workflow_id: ID of the workflow
            
        Returns:
            Workflow status information
        """
        if workflow_id not in self.workflows:
            logger.warning(f"Workflow {workflow_id} not found")
            return None
        
        workflow = self.workflows[workflow_id]
        
        # Count steps by state
        step_counts = {}
        for state in WorkflowStepState:
            step_counts[state.value] = sum(
                1 for step in workflow["steps"] if step["state"] == state.value
            )
        
        # Calculate progress percentage
        total_steps = len(workflow["steps"])
        completed_steps = step_counts.get(WorkflowStepState.COMPLETED.value, 0)
        skipped_steps = step_counts.get(WorkflowStepState.SKIPPED.value, 0)
        progress = round((completed_steps + skipped_steps) / total_steps * 100) if total_steps > 0 else 0
        
        return {
            "id": workflow_id,
            "type": workflow["type"],
            "name": workflow["name"],
            "property_id": workflow["property_id"],
            "state": workflow["state"],
            "progress": progress,
            "step_counts": step_counts,
            "started_at": workflow["started_at"],
            "completed_at": workflow["completed_at"],
            "steps": [
                {
                    "id": step["id"],
                    "name": step["name"],
                    "state": step["state"],
                    "agent": step["agent"],
                    "started_at": step["started_at"],
                    "completed_at": step["completed_at"]
                }
                for step in workflow["steps"]
            ]
        }
    
    def get_workflow_result(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the complete result of a workflow
        
        Args:
            workflow_id: ID of the workflow
            
        Returns:
            Complete workflow results including step results
        """
        if workflow_id not in self.workflows:
            logger.warning(f"Workflow {workflow_id} not found")
            return None
        
        workflow = self.workflows[workflow_id]
        
        # Check if workflow is completed
        if workflow["state"] != WorkflowState.COMPLETED.value:
            logger.warning(f"Workflow {workflow_id} is not completed yet")
            return None
        
        # Compile results from all steps
        step_results = {}
        for step in workflow["steps"]:
            if step["state"] == WorkflowStepState.COMPLETED.value:
                step_results[step["id"]] = step["result"]
        
        return {
            "id": workflow_id,
            "type": workflow["type"],
            "name": workflow["name"],
            "property_id": workflow["property_id"],
            "completed_at": workflow["completed_at"],
            "step_results": step_results,
            "context": workflow["context"]
        }
    
    def cancel_workflow(self, workflow_id: str) -> bool:
        """
        Cancel a running workflow
        
        Args:
            workflow_id: ID of the workflow to cancel
            
        Returns:
            True if workflow cancelled successfully, False otherwise
        """
        if workflow_id not in self.workflows:
            logger.warning(f"Workflow {workflow_id} not found")
            return False
        
        workflow = self.workflows[workflow_id]
        
        # Check if workflow can be cancelled
        if workflow["state"] not in [WorkflowState.RUNNING.value, WorkflowState.PAUSED.value]:
            logger.warning(f"Cannot cancel workflow {workflow_id} in state {workflow['state']}")
            return False
        
        # Update workflow state
        workflow["state"] = WorkflowState.FAILED.value
        
        # Update running steps
        for step in workflow["steps"]:
            if step["state"] == WorkflowStepState.RUNNING.value:
                step["state"] = WorkflowStepState.FAILED.value
        
        logger.info(f"Cancelled workflow {workflow_id}")
        
        return True
    
    def _start_step(self, workflow: Dict[str, Any], step: Dict[str, Any]) -> None:
        """
        Start a workflow step
        
        Args:
            workflow: Workflow instance
            step: Step to start
        """
        # Update step state
        step["state"] = WorkflowStepState.RUNNING.value
        step["started_at"] = datetime.datetime.now().isoformat()
        
        # Get agent and task
        agent_id = step["agent"]
        task_type = step["task"]
        
        # Get the agent
        agent = mcp_instance.get_agent(agent_id)
        if not agent:
            logger.error(f"Agent {agent_id} not found for step {step['id']}")
            step["state"] = WorkflowStepState.FAILED.value
            step["result"] = {"error": f"Agent {agent_id} not found"}
            self._check_workflow_completion(workflow)
            return
        
        # Prepare task data
        task_data = {
            "task_type": task_type,
            "workflow_id": workflow["id"],
            "step_id": step["id"],
            "property_id": workflow["property_id"],
            "context": workflow["context"]
        }
        
        # Add any step-specific parameters
        if "parameters" in step:
            task_data.update(step["parameters"])
        
        # Submit task to MCP
        task_id = mcp_instance.submit_task(
            agent_id, 
            task_data,
            lambda tid, result: self._handle_step_completion(workflow["id"], step["id"], result)
        )
        
        if not task_id:
            logger.error(f"Failed to submit task for step {step['id']}")
            step["state"] = WorkflowStepState.FAILED.value
            step["result"] = {"error": "Failed to submit task"}
            self._check_workflow_completion(workflow)
            return
        
        step["task_id"] = task_id
        logger.info(f"Started step {step['id']} in workflow {workflow['id']}")
    
    def _handle_step_completion(
        self,
        workflow_id: str,
        step_id: str, 
        result: Dict[str, Any]
    ) -> None:
        """
        Handle completion of a workflow step
        
        Args:
            workflow_id: ID of the workflow
            step_id: ID of the completed step
            result: Result from the task
        """
        if workflow_id not in self.workflows:
            logger.error(f"Workflow {workflow_id} not found")
            return
        
        workflow = self.workflows[workflow_id]
        
        # Find the step
        step = next((s for s in workflow["steps"] if s["id"] == step_id), None)
        if not step:
            logger.error(f"Step {step_id} not found in workflow {workflow_id}")
            return
        
        # Update step state and result
        step["state"] = (
            WorkflowStepState.COMPLETED.value
            if result.get("status") != "error"
            else WorkflowStepState.FAILED.value
        )
        step["completed_at"] = datetime.datetime.now().isoformat()
        step["result"] = result
        
        # Update workflow context with step result
        if "shared_data" not in workflow["context"]:
            workflow["context"]["shared_data"] = {}
        workflow["context"]["shared_data"][step_id] = result
        
        logger.info(f"Completed step {step_id} in workflow {workflow_id} with status {step['state']}")
        
        # Check if workflow failed
        if step["state"] == WorkflowStepState.FAILED.value and step.get("required", False):
            workflow["state"] = WorkflowState.FAILED.value
            logger.warning(f"Workflow {workflow_id} failed due to required step {step_id} failure")
            return
        
        # Start next steps if any dependencies are met
        self._start_next_steps(workflow)
        
        # Check if workflow is complete
        self._check_workflow_completion(workflow)
    
    def _start_next_steps(self, workflow: Dict[str, Any]) -> None:
        """
        Start the next steps in a workflow where dependencies are met
        
        Args:
            workflow: Workflow instance
        """
        if workflow["state"] != WorkflowState.RUNNING.value:
            return
        
        for step in workflow["steps"]:
            # Skip if step is not pending
            if step["state"] != WorkflowStepState.PENDING.value:
                continue
                
            # Check dependencies
            dependencies = step.get("depends_on", [])
            dependency_met = True
            
            for dep_id in dependencies:
                dep_step = next((s for s in workflow["steps"] if s["id"] == dep_id), None)
                if not dep_step or dep_step["state"] not in [
                    WorkflowStepState.COMPLETED.value, 
                    WorkflowStepState.SKIPPED.value
                ]:
                    dependency_met = False
                    break
            
            # Start step if dependencies are met
            if dependency_met:
                self._start_step(workflow, step)
    
    def _check_workflow_completion(self, workflow: Dict[str, Any]) -> None:
        """
        Check if a workflow is complete
        
        Args:
            workflow: Workflow instance
        """
        # Skip if workflow is not running
        if workflow["state"] != WorkflowState.RUNNING.value:
            return
        
        # Check if all steps are completed, skipped, or failed
        all_done = all(
            step["state"] in [
                WorkflowStepState.COMPLETED.value,
                WorkflowStepState.SKIPPED.value,
                WorkflowStepState.FAILED.value
            ]
            for step in workflow["steps"]
        )
        
        if all_done:
            # Check if any required steps failed
            required_failed = any(
                step["state"] == WorkflowStepState.FAILED.value and step.get("required", False)
                for step in workflow["steps"]
            )
            
            if required_failed:
                workflow["state"] = WorkflowState.FAILED.value
            else:
                workflow["state"] = WorkflowState.COMPLETED.value
                
            workflow["completed_at"] = datetime.datetime.now().isoformat()
            logger.info(f"Workflow {workflow['id']} completed with state {workflow['state']}")
            
            # If workflow completed successfully, compile final assessment report
            if workflow["state"] == WorkflowState.COMPLETED.value:
                self._generate_assessment_report(workflow)
    
    def _generate_assessment_report(self, workflow: Dict[str, Any]) -> None:
        """
        Generate a final assessment report for a completed workflow
        
        Args:
            workflow: Completed workflow instance
        """
        # Placeholder implementation - in a real system, this would generate a detailed report
        property_id = workflow["property_id"]
        
        # Compile results from relevant steps
        assessment_data = {}
        
        # Extract information from step results based on workflow type
        if workflow["type"] == "annual_assessment":
            # Get valuation result
            valuation_step = next(
                (s for s in workflow["steps"] if s["id"] == "valuation"), 
                None
            )
            if valuation_step and valuation_step["state"] == WorkflowStepState.COMPLETED.value:
                assessment_data["valuation"] = valuation_step["result"]
            
            # Get tax compliance result
            compliance_step = next(
                (s for s in workflow["steps"] if s["id"] == "tax_compliance"), 
                None
            )
            if compliance_step and compliance_step["state"] == WorkflowStepState.COMPLETED.value:
                assessment_data["compliance"] = compliance_step["result"]
            
            # Get exemption analysis result
            exemption_step = next(
                (s for s in workflow["steps"] if s["id"] == "exemption_analysis"), 
                None
            )
            if exemption_step and exemption_step["state"] == WorkflowStepState.COMPLETED.value:
                assessment_data["exemptions"] = exemption_step["result"]
        
        # Store the assessment report in the workflow context
        workflow["context"]["assessment_report"] = {
            "property_id": property_id,
            "assessment_date": datetime.datetime.now().isoformat(),
            "workflow_type": workflow["type"],
            "data": assessment_data
        }
        
        logger.info(f"Generated assessment report for workflow {workflow['id']}")


# Create a global instance
assessment_workflow = PropertyAssessmentWorkflow()