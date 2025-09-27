"""
TerraFusion cOS Terra Flow
Workflow automation and process orchestration engine
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import uuid

class WorkflowStatus(Enum):
    """Workflow execution status"""
    DRAFT = "draft"
    ACTIVE = "active"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TaskStatus(Enum):
    """Individual task status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"

class ApprovalStatus(Enum):
    """Approval status"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ESCALATED = "escalated"

@dataclass
class WorkflowTask:
    """Individual task in workflow"""
    task_id: str
    task_name: str
    task_type: str
    description: str
    assigned_to: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    dependencies: List[str] = field(default_factory=list)
    estimated_duration: Optional[timedelta] = None
    actual_duration: Optional[timedelta] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    
@dataclass
class ApprovalStep:
    """Approval step in workflow"""
    approval_id: str
    approver_id: str
    approver_name: str
    approval_level: int
    status: ApprovalStatus = ApprovalStatus.PENDING
    required: bool = True
    approved_at: Optional[datetime] = None
    comments: Optional[str] = None

@dataclass
class Workflow:
    """Complete workflow definition"""
    workflow_id: str
    name: str
    description: str
    version: str
    status: WorkflowStatus = WorkflowStatus.DRAFT
    tasks: List[WorkflowTask] = field(default_factory=list)
    approval_chain: List[ApprovalStep] = field(default_factory=list)
    created_by: str = ""
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

class WorkflowEngine:
    """Core workflow execution engine"""
    
    def __init__(self):
        self.active_workflows: Dict[str, Workflow] = {}
        self.completed_workflows: Dict[str, Workflow] = {}
        self.task_executors: Dict[str, Callable] = {}
        
    def register_task_executor(self, task_type: str, executor: Callable):
        """Register task executor function"""
        self.task_executors[task_type] = executor
        
    async def start_workflow(self, workflow: Workflow) -> bool:
        """Start workflow execution"""
        try:
            workflow.status = WorkflowStatus.RUNNING
            workflow.started_at = datetime.now()
            self.active_workflows[workflow.workflow_id] = workflow
            
            logging.info(f"Started workflow: {workflow.name} ({workflow.workflow_id})")
            
            # Start task execution
            asyncio.create_task(self._execute_workflow(workflow))
            return True
            
        except Exception as e:
            logging.error(f"Failed to start workflow {workflow.workflow_id}: {str(e)}")
            workflow.status = WorkflowStatus.FAILED
            return False
            
    async def _execute_workflow(self, workflow: Workflow):
        """Execute workflow tasks"""
        try:
            for task in workflow.tasks:
                if await self._can_execute_task(task, workflow):
                    await self._execute_task(task, workflow)
                    
            # Check if workflow is complete
            if all(task.status == TaskStatus.COMPLETED for task in workflow.tasks):
                await self._complete_workflow(workflow)
                
        except Exception as e:
            logging.error(f"Workflow execution error: {str(e)}")
            workflow.status = WorkflowStatus.FAILED
            
    async def _can_execute_task(self, task: WorkflowTask, workflow: Workflow) -> bool:
        """Check if task can be executed (dependencies met)"""
        if task.status != TaskStatus.PENDING:
            return False
            
        for dep_id in task.dependencies:
            dep_task = next((t for t in workflow.tasks if t.task_id == dep_id), None)
            if not dep_task or dep_task.status != TaskStatus.COMPLETED:
                return False
                
        return True
        
    async def _execute_task(self, task: WorkflowTask, workflow: Workflow):
        """Execute individual task"""
        task.status = TaskStatus.RUNNING
        task.started_at = datetime.now()
        
        try:
            # Get task executor
            executor = self.task_executors.get(task.task_type)
            if executor:
                await executor(task, workflow)
            else:
                # Default task execution
                await self._default_task_execution(task)
                
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now()
            task.actual_duration = task.completed_at - task.started_at
            
            logging.info(f"Completed task: {task.task_name}")
            
        except Exception as e:
            task.status = TaskStatus.FAILED
            logging.error(f"Task execution failed: {task.task_name} - {str(e)}")
            
    async def _default_task_execution(self, task: WorkflowTask):
        """Default task execution for simple tasks"""
        # Simulate task execution
        await asyncio.sleep(1)
        
    async def _complete_workflow(self, workflow: Workflow):
        """Complete workflow execution"""
        workflow.status = WorkflowStatus.COMPLETED
        workflow.completed_at = datetime.now()
        
        # Move to completed workflows
        del self.active_workflows[workflow.workflow_id]
        self.completed_workflows[workflow.workflow_id] = workflow
        
        logging.info(f"Completed workflow: {workflow.name}")

class ProcessTemplates:
    """Government process templates"""
    
    def __init__(self):
        self.templates: Dict[str, Dict] = {}
        self._load_government_templates()
        
    def _load_government_templates(self):
        """Load standard government process templates"""
        self.templates = {
            "procurement_request": {
                "name": "Procurement Request Process",
                "description": "Standard government procurement workflow",
                "tasks": [
                    {
                        "task_name": "Initial Request",
                        "task_type": "form_submission",
                        "description": "Submit procurement request form"
                    },
                    {
                        "task_name": "Budget Verification",
                        "task_type": "budget_check",
                        "description": "Verify budget availability"
                    },
                    {
                        "task_name": "Manager Approval",
                        "task_type": "approval",
                        "description": "Department manager approval"
                    },
                    {
                        "task_name": "Vendor Selection",
                        "task_type": "vendor_evaluation",
                        "description": "Evaluate and select vendor"
                    },
                    {
                        "task_name": "Final Approval",
                        "task_type": "approval",
                        "description": "Final procurement approval"
                    }
                ]
            },
            "employee_onboarding": {
                "name": "Employee Onboarding Process",
                "description": "New employee onboarding workflow",
                "tasks": [
                    {
                        "task_name": "Background Check",
                        "task_type": "security_clearance",
                        "description": "Complete background verification"
                    },
                    {
                        "task_name": "Equipment Assignment",
                        "task_type": "resource_allocation",
                        "description": "Assign equipment and access"
                    },
                    {
                        "task_name": "Training Schedule",
                        "task_type": "training_assignment",
                        "description": "Schedule required training"
                    }
                ]
            }
        }
        
    def create_workflow_from_template(self, template_name: str, workflow_name: str) -> Optional[Workflow]:
        """Create workflow instance from template"""
        template = self.templates.get(template_name)
        if not template:
            return None
            
        workflow = Workflow(
            workflow_id=str(uuid.uuid4()),
            name=workflow_name,
            description=template["description"],
            version="1.0"
        )
        
        for i, task_template in enumerate(template["tasks"]):
            task = WorkflowTask(
                task_id=f"task_{i+1}",
                task_name=task_template["task_name"],
                task_type=task_template["task_type"],
                description=task_template["description"]
            )
            workflow.tasks.append(task)
            
        return workflow

class ApprovalChainManager:
    """Approval workflow management"""
    
    def __init__(self):
        self.approval_chains: Dict[str, List[ApprovalStep]] = {}
        
    def create_approval_chain(self, workflow_id: str, approvers: List[Dict]) -> List[ApprovalStep]:
        """Create approval chain for workflow"""
        chain = []
        
        for i, approver in enumerate(approvers):
            step = ApprovalStep(
                approval_id=f"approval_{i+1}",
                approver_id=approver["user_id"],
                approver_name=approver["name"],
                approval_level=i + 1,
                required=approver.get("required", True)
            )
            chain.append(step)
            
        self.approval_chains[workflow_id] = chain
        return chain
        
    async def process_approval(self, workflow_id: str, approval_id: str, approved: bool, comments: str = "") -> bool:
        """Process approval decision"""
        chain = self.approval_chains.get(workflow_id, [])
        
        for step in chain:
            if step.approval_id == approval_id:
                step.status = ApprovalStatus.APPROVED if approved else ApprovalStatus.REJECTED
                step.approved_at = datetime.now()
                step.comments = comments
                
                logging.info(f"Approval {approval_id} {'approved' if approved else 'rejected'}")
                return True
                
        return False

class DocumentRouter:
    """Document routing and tracking"""
    
    def __init__(self):
        self.document_routes: Dict[str, List[str]] = {}
        self.document_history: Dict[str, List[Dict]] = {}
        
    def route_document(self, document_id: str, workflow_id: str, route: List[str]):
        """Route document through workflow"""
        self.document_routes[document_id] = route
        
        if document_id not in self.document_history:
            self.document_history[document_id] = []
            
        self.document_history[document_id].append({
            "action": "routed",
            "workflow_id": workflow_id,
            "route": route,
            "timestamp": datetime.now()
        })

class FlowAnalytics:
    """Workflow performance analytics"""
    
    def __init__(self):
        self.metrics: Dict[str, Any] = {}
        
    def calculate_workflow_metrics(self, workflow: Workflow) -> Dict[str, Any]:
        """Calculate workflow performance metrics"""
        if not workflow.started_at:
            return {}
            
        total_duration = None
        if workflow.completed_at:
            total_duration = workflow.completed_at - workflow.started_at
            
        task_metrics = []
        for task in workflow.tasks:
            if task.actual_duration:
                task_metrics.append({
                    "task_name": task.task_name,
                    "duration_seconds": task.actual_duration.total_seconds(),
                    "status": task.status.value
                })
                
        return {
            "workflow_id": workflow.workflow_id,
            "total_duration_seconds": total_duration.total_seconds() if total_duration else None,
            "task_count": len(workflow.tasks),
            "completed_tasks": len([t for t in workflow.tasks if t.status == TaskStatus.COMPLETED]),
            "failed_tasks": len([t for t in workflow.tasks if t.status == TaskStatus.FAILED]),
            "task_metrics": task_metrics,
            "efficiency_score": self._calculate_efficiency_score(workflow)
        }
        
    def _calculate_efficiency_score(self, workflow: Workflow) -> float:
        """Calculate workflow efficiency score (0-100)"""
        if not workflow.tasks:
            return 0.0
            
        completed_ratio = len([t for t in workflow.tasks if t.status == TaskStatus.COMPLETED]) / len(workflow.tasks)
        return completed_ratio * 100

class TerraFlow:
    """Main Terra Flow service"""
    
    def __init__(self):
        self.workflow_engine = WorkflowEngine()
        self.process_templates = ProcessTemplates()
        self.approval_manager = ApprovalChainManager()
        self.document_router = DocumentRouter()
        self.analytics = FlowAnalytics()
        self.is_running = False
        
    async def start_flow_service(self):
        """Start the Terra Flow service"""
        logging.info("Starting Terra Flow workflow orchestration...")
        self.is_running = True
        
    def get_flow_status(self) -> Dict[str, Any]:
        """Get comprehensive flow status"""
        return {
            "service_active": self.is_running,
            "active_workflows": len(self.workflow_engine.active_workflows),
            "completed_workflows": len(self.workflow_engine.completed_workflows),
            "available_templates": len(self.process_templates.templates),
            "pending_approvals": len([chain for chain in self.approval_manager.approval_chains.values() 
                                   for step in chain if step.status == ApprovalStatus.PENDING]),
            "document_routes_active": len(self.document_router.document_routes),
            "last_updated": datetime.now().isoformat()
        }
        
    def get_management_interface_data(self) -> Dict[str, Any]:
        """Get data for Terra Flow management interface"""
        return {
            "service_name": "Terra Flow",
            "status": "Active" if self.is_running else "Inactive", 
            "flow_data": self.get_flow_status(),
            "capabilities": [
                "Visual Workflow Designer",
                "Government Process Templates",
                "Multi-Level Approval Chains",
                "Document Routing & Tracking",
                "External System Integration",
                "Performance Analytics & Optimization"
            ]
        }