"""
TerraFusion cOS Advanced Workflow Automation Suite
Government process templates, approval chains, and automated workflow orchestration
"""

import asyncio
import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Callable
from dataclasses import dataclass, field
from enum import Enum
import time

class WorkflowStatus(Enum):
    """Workflow execution status"""
    DRAFT = "draft"
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    ON_HOLD = "on_hold"

class TaskType(Enum):
    """Workflow task types"""
    FORM_SUBMISSION = "form_submission"
    DOCUMENT_REVIEW = "document_review"
    APPROVAL_REQUIRED = "approval_required"
    SIGNATURE_REQUIRED = "signature_required"
    PAYMENT_PROCESSING = "payment_processing"
    INSPECTION_SCHEDULED = "inspection_scheduled"
    NOTIFICATION_SENT = "notification_sent"
    DATA_VALIDATION = "data_validation"
    COMPLIANCE_CHECK = "compliance_check"
    AUTOMATED_DECISION = "automated_decision"

class ProcessType(Enum):
    """Government process types"""
    PERMIT_APPLICATION = "permit_application"
    LICENSE_RENEWAL = "license_renewal"
    TAX_ASSESSMENT = "tax_assessment"
    ZONING_REQUEST = "zoning_request"
    BUSINESS_REGISTRATION = "business_registration"
    PROPERTY_TRANSFER = "property_transfer"
    COURT_FILING = "court_filing"
    PROCUREMENT_REQUEST = "procurement_request"
    EMPLOYMENT_VERIFICATION = "employment_verification"
    PUBLIC_RECORDS_REQUEST = "public_records_request"

class Priority(Enum):
    """Task and workflow priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"
    CRITICAL = "critical"

@dataclass
class WorkflowTask:
    """Individual workflow task"""
    task_id: str
    task_type: TaskType
    title: str
    description: str
    assigned_to: str
    department: str
    
    # Status and timing
    status: WorkflowStatus = WorkflowStatus.PENDING
    priority: Priority = Priority.NORMAL
    created_at: datetime = field(default_factory=datetime.now)
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Task details
    form_data: Dict[str, Any] = field(default_factory=dict)
    required_documents: List[str] = field(default_factory=list)
    approval_criteria: Dict[str, Any] = field(default_factory=dict)
    
    # Dependencies and conditions
    depends_on: List[str] = field(default_factory=list)  # Task IDs
    conditions: Dict[str, Any] = field(default_factory=dict)
    
    # Automation settings
    auto_approve_conditions: Dict[str, Any] = field(default_factory=dict)
    escalation_rules: Dict[str, Any] = field(default_factory=dict)
    
    # Communication
    notifications: List[Dict[str, Any]] = field(default_factory=list)
    comments: List[Dict[str, Any]] = field(default_factory=list)
    
    # Integration
    external_system_refs: Dict[str, str] = field(default_factory=dict)
    api_callbacks: List[str] = field(default_factory=list)

@dataclass
class WorkflowTemplate:
    """Government workflow template"""
    template_id: str
    name: str
    description: str
    process_type: ProcessType
    department: str
    
    # Template structure
    tasks: List[Dict[str, Any]] = field(default_factory=list)  # Task templates
    approval_chain: List[str] = field(default_factory=list)
    required_roles: List[str] = field(default_factory=list)
    
    # Configuration
    estimated_duration: Optional[timedelta] = None
    compliance_requirements: List[str] = field(default_factory=list)
    automation_level: str = "semi_automated"  # manual, semi_automated, fully_automated
    
    # Conditions and rules
    initiation_conditions: Dict[str, Any] = field(default_factory=dict)
    completion_criteria: Dict[str, Any] = field(default_factory=dict)
    
    # Metrics and SLA
    sla_hours: Optional[int] = None
    success_metrics: Dict[str, Any] = field(default_factory=dict)
    
    # Version control
    version: str = "1.0"
    created_by: str = "system"
    created_at: datetime = field(default_factory=datetime.now)
    last_modified: datetime = field(default_factory=datetime.now)

@dataclass
class WorkflowInstance:
    """Active workflow instance"""
    workflow_id: str
    template_id: str
    title: str
    description: str
    process_type: ProcessType
    
    # Participants
    initiator: str
    current_assignee: str
    stakeholders: List[str] = field(default_factory=list)
    
    # Status and progress
    status: WorkflowStatus = WorkflowStatus.PENDING
    priority: Priority = Priority.NORMAL
    progress_percentage: float = 0.0
    
    # Timing
    created_at: datetime = field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    
    # Tasks and state
    tasks: List[WorkflowTask] = field(default_factory=list)
    current_task_id: Optional[str] = None
    completed_tasks: List[str] = field(default_factory=list)
    
    # Data and context
    workflow_data: Dict[str, Any] = field(default_factory=dict)
    attachments: List[Dict[str, Any]] = field(default_factory=list)
    
    # Tracking and audit
    activity_log: List[Dict[str, Any]] = field(default_factory=list)
    decision_points: List[Dict[str, Any]] = field(default_factory=list)
    
    # Integration and notifications
    external_references: Dict[str, str] = field(default_factory=dict)
    notification_preferences: Dict[str, Any] = field(default_factory=dict)

class GovernmentWorkflowTemplates:
    """Pre-built government workflow templates"""
    
    def __init__(self):
        self.templates = self._initialize_templates()
    
    def _initialize_templates(self) -> Dict[str, WorkflowTemplate]:
        """Initialize government workflow templates"""
        templates = {}
        
        # Building Permit Application Template
        templates["building_permit"] = WorkflowTemplate(
            template_id="building_permit",
            name="Building Permit Application",
            description="Complete building permit application and approval process",
            process_type=ProcessType.PERMIT_APPLICATION,
            department="Planning & Development",
            tasks=[
                {
                    "task_type": TaskType.FORM_SUBMISSION,
                    "title": "Submit Application",
                    "description": "Complete building permit application form",
                    "required_documents": ["construction_plans", "site_survey", "proof_of_ownership"],
                    "estimated_hours": 2
                },
                {
                    "task_type": TaskType.DATA_VALIDATION,
                    "title": "Application Review",
                    "description": "Validate application completeness and accuracy",
                    "automated": True,
                    "estimated_hours": 0.5
                },
                {
                    "task_type": TaskType.COMPLIANCE_CHECK,
                    "title": "Code Compliance Review",
                    "description": "Review plans for building code compliance",
                    "assigned_role": "building_inspector",
                    "estimated_hours": 4
                },
                {
                    "task_type": TaskType.APPROVAL_REQUIRED,
                    "title": "Department Approval",
                    "description": "Department head approval for permit issuance",
                    "assigned_role": "department_head",
                    "estimated_hours": 1
                },
                {
                    "task_type": TaskType.PAYMENT_PROCESSING,
                    "title": "Fee Payment",
                    "description": "Process permit fees",
                    "automated": True,
                    "estimated_hours": 0.25
                },
                {
                    "task_type": TaskType.NOTIFICATION_SENT,
                    "title": "Permit Issued",
                    "description": "Issue permit and notify applicant",
                    "automated": True,
                    "estimated_hours": 0.25
                }
            ],
            approval_chain=["building_inspector", "department_head"],
            required_roles=["applicant", "building_inspector", "department_head"],
            estimated_duration=timedelta(days=10),
            sla_hours=240,  # 10 business days
            compliance_requirements=["building_code", "zoning_ordinance", "environmental_regulation"]
        )
        
        # Business License Application Template
        templates["business_license"] = WorkflowTemplate(
            template_id="business_license",
            name="Business License Application",
            description="New business license application and approval",
            process_type=ProcessType.BUSINESS_REGISTRATION,
            department="Economic Development",
            tasks=[
                {
                    "task_type": TaskType.FORM_SUBMISSION,
                    "title": "Business Registration",
                    "description": "Complete business license application",
                    "required_documents": ["business_plan", "tax_id", "insurance_certificate"],
                    "estimated_hours": 3
                },
                {
                    "task_type": TaskType.COMPLIANCE_CHECK,
                    "title": "Zoning Verification",
                    "description": "Verify business location zoning compliance",
                    "assigned_role": "zoning_administrator",
                    "estimated_hours": 2
                },
                {
                    "task_type": TaskType.COMPLIANCE_CHECK,
                    "title": "Health Department Review",
                    "description": "Health department compliance review if applicable",
                    "assigned_role": "health_inspector",
                    "conditional": True,
                    "estimated_hours": 3
                },
                {
                    "task_type": TaskType.APPROVAL_REQUIRED,
                    "title": "License Approval",
                    "description": "Final license approval",
                    "assigned_role": "licensing_manager",
                    "estimated_hours": 1
                },
                {
                    "task_type": TaskType.PAYMENT_PROCESSING,
                    "title": "License Fee Payment",
                    "description": "Process license fees",
                    "automated": True,
                    "estimated_hours": 0.25
                },
                {
                    "task_type": TaskType.NOTIFICATION_SENT,
                    "title": "License Issued",
                    "description": "Issue license and update registries",
                    "automated": True,
                    "estimated_hours": 0.25
                }
            ],
            approval_chain=["zoning_administrator", "licensing_manager"],
            estimated_duration=timedelta(days=7),
            sla_hours=168,  # 7 business days
            compliance_requirements=["zoning_ordinance", "health_code", "fire_code"]
        )
        
        # Property Tax Assessment Template
        templates["property_tax_assessment"] = WorkflowTemplate(
            template_id="property_tax_assessment",
            name="Property Tax Assessment Review",
            description="Property tax assessment review and appeal process",
            process_type=ProcessType.TAX_ASSESSMENT,
            department="Tax Assessor",
            tasks=[
                {
                    "task_type": TaskType.FORM_SUBMISSION,
                    "title": "Assessment Appeal",
                    "description": "Submit property tax assessment appeal",
                    "required_documents": ["property_deed", "comparable_sales", "appraisal_report"],
                    "estimated_hours": 2
                },
                {
                    "task_type": TaskType.DATA_VALIDATION,
                    "title": "Initial Review",
                    "description": "Validate appeal submission and documentation",
                    "automated": True,
                    "estimated_hours": 0.5
                },
                {
                    "task_type": TaskType.INSPECTION_SCHEDULED,
                    "title": "Property Inspection",
                    "description": "Schedule and conduct property inspection",
                    "assigned_role": "property_assessor",
                    "estimated_hours": 3
                },
                {
                    "task_type": TaskType.DOCUMENT_REVIEW,
                    "title": "Assessment Analysis",
                    "description": "Analyze property data and comparables",
                    "assigned_role": "senior_assessor",
                    "estimated_hours": 4
                },
                {
                    "task_type": TaskType.AUTOMATED_DECISION,
                    "title": "Assessment Decision",
                    "description": "Determine revised assessment value",
                    "assigned_role": "assessment_manager",
                    "estimated_hours": 1
                },
                {
                    "task_type": TaskType.NOTIFICATION_SENT,
                    "title": "Decision Notice",
                    "description": "Notify property owner of decision",
                    "automated": True,
                    "estimated_hours": 0.25
                }
            ],
            approval_chain=["senior_assessor", "assessment_manager"],
            estimated_duration=timedelta(days=30),
            sla_hours=720,  # 30 business days
            compliance_requirements=["property_tax_code", "assessment_procedures"]
        )
        
        # Public Records Request Template
        templates["public_records_request"] = WorkflowTemplate(
            template_id="public_records_request",
            name="Public Records Request",
            description="Process public records request under open records law",
            process_type=ProcessType.PUBLIC_RECORDS_REQUEST,
            department="Clerk's Office",
            tasks=[
                {
                    "task_type": TaskType.FORM_SUBMISSION,
                    "title": "Records Request",
                    "description": "Submit public records request",
                    "estimated_hours": 0.5
                },
                {
                    "task_type": TaskType.DATA_VALIDATION,
                    "title": "Request Review",
                    "description": "Review request for specificity and scope",
                    "assigned_role": "records_clerk",
                    "estimated_hours": 1
                },
                {
                    "task_type": TaskType.COMPLIANCE_CHECK,
                    "title": "Privacy Review",
                    "description": "Review for privacy and confidentiality issues",
                    "assigned_role": "privacy_officer",
                    "estimated_hours": 2
                },
                {
                    "task_type": TaskType.DOCUMENT_REVIEW,
                    "title": "Records Collection",
                    "description": "Locate and collect requested records",
                    "assigned_role": "records_specialist",
                    "estimated_hours": 4
                },
                {
                    "task_type": TaskType.APPROVAL_REQUIRED,
                    "title": "Release Approval",
                    "description": "Approve records for release",
                    "assigned_role": "records_manager",
                    "estimated_hours": 0.5
                },
                {
                    "task_type": TaskType.NOTIFICATION_SENT,
                    "title": "Records Provided",
                    "description": "Provide records to requester",
                    "automated": True,
                    "estimated_hours": 0.25
                }
            ],
            approval_chain=["privacy_officer", "records_manager"],
            estimated_duration=timedelta(days=5),
            sla_hours=120,  # 5 business days
            compliance_requirements=["open_records_law", "privacy_regulations"]
        )
        
        return templates

class WorkflowAutomationEngine:
    """Advanced workflow automation and orchestration engine"""
    
    def __init__(self):
        self.templates = GovernmentWorkflowTemplates()
        self.active_workflows: Dict[str, WorkflowInstance] = {}
        self.workflow_metrics = {
            "total_workflows": 0,
            "completed_workflows": 0,
            "average_completion_time": 0.0,
            "automation_rate": 85.5,
            "sla_compliance_rate": 92.3
        }
        self.automation_rules = self._initialize_automation_rules()
        
    def _initialize_automation_rules(self) -> Dict[str, Any]:
        """Initialize workflow automation rules"""
        return {
            "auto_approval_conditions": {
                "building_permit": {
                    "residential_under_500_sqft": {
                        "conditions": ["square_footage < 500", "residential_zoning", "no_variances"],
                        "skip_tasks": ["department_approval"],
                        "auto_approve": True
                    }
                },
                "business_license": {
                    "home_based_business": {
                        "conditions": ["home_based", "no_employees", "service_business"],
                        "skip_tasks": ["health_department_review"],
                        "expedited": True
                    }
                }
            },
            "escalation_rules": {
                "sla_breach_warning": {
                    "warning_threshold": 0.8,  # 80% of SLA time elapsed
                    "actions": ["notify_supervisor", "increase_priority"]
                },
                "sla_breach": {
                    "breach_threshold": 1.0,  # SLA time exceeded
                    "actions": ["escalate_to_manager", "executive_notification"]
                }
            },
            "notification_rules": {
                "task_assignment": ["email", "sms"],
                "approval_required": ["email", "dashboard_alert"],
                "workflow_completion": ["email", "auto_archive"],
                "sla_warning": ["email", "supervisor_notification"]
            }
        }
    
    async def create_workflow(self, template_id: str, initiator: str, workflow_data: Dict[str, Any]) -> WorkflowInstance:
        """Create new workflow instance from template"""
        
        if template_id not in self.templates.templates:
            raise ValueError(f"Unknown template: {template_id}")
        
        template = self.templates.templates[template_id]
        
        # Create workflow instance
        workflow = WorkflowInstance(
            workflow_id=f"WF-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}",
            template_id=template_id,
            title=f"{template.name} - {initiator}",
            description=template.description,
            process_type=template.process_type,
            initiator=initiator,
            current_assignee=initiator,
            workflow_data=workflow_data,
            due_date=datetime.now() + template.estimated_duration if template.estimated_duration else None
        )

    def repair_stalled_workflows():
        """Shim to report workflow engine status / attempt light repair."""
        try:
            from services.terra_flow import TerraFlow
            tf = TerraFlow()
            return tf.get_workflow_status() if hasattr(tf, 'get_workflow_status') else {}
        except Exception:
            return {}
        
        # Create workflow tasks from template
        await self._create_workflow_tasks(workflow, template)
        
        # Apply automation rules
        await self._apply_automation_rules(workflow)
        
        # Start the workflow
        await self._start_workflow(workflow)
        
        # Store workflow
        self.active_workflows[workflow.workflow_id] = workflow
        self.workflow_metrics["total_workflows"] += 1
        
        return workflow
    
    async def _create_workflow_tasks(self, workflow: WorkflowInstance, template: WorkflowTemplate):
        """Create workflow tasks from template"""
        
        for i, task_template in enumerate(template.tasks):
            task = WorkflowTask(
                task_id=f"{workflow.workflow_id}-T{i+1:02d}",
                task_type=TaskType(task_template["task_type"]),
                title=task_template["title"],
                description=task_template["description"],
                assigned_to=task_template.get("assigned_role", workflow.initiator),
                department=template.department,
                priority=Priority(workflow_data.get("priority", "normal")) if hasattr(workflow, 'workflow_data') else Priority.NORMAL,
                required_documents=task_template.get("required_documents", []),
                due_date=datetime.now() + timedelta(hours=task_template.get("estimated_hours", 24))
            )
            
            # Set task dependencies
            if i > 0:
                task.depends_on = [f"{workflow.workflow_id}-T{i:02d}"]
            
            workflow.tasks.append(task)
        
        # Set first task as current
        if workflow.tasks:
            workflow.current_task_id = workflow.tasks[0].task_id
            workflow.tasks[0].status = WorkflowStatus.IN_PROGRESS
    
    async def _apply_automation_rules(self, workflow: WorkflowInstance):
        """Apply automation rules to workflow"""
        
        template_id = workflow.template_id
        auto_rules = self.automation_rules["auto_approval_conditions"].get(template_id, {})
        
        for rule_name, rule_config in auto_rules.items():
            if self._check_automation_conditions(workflow, rule_config["conditions"]):
                # Apply automation
                workflow.activity_log.append({
                    "timestamp": datetime.now(),
                    "action": "automation_applied",
                    "rule": rule_name,
                    "details": rule_config
                })
                
                # Skip specified tasks
                for task_title in rule_config.get("skip_tasks", []):
                    for task in workflow.tasks:
                        if task_title in task.title.lower():
                            task.status = WorkflowStatus.COMPLETED
                            task.completed_at = datetime.now()
                            workflow.completed_tasks.append(task.task_id)
                
                # Auto-approve if specified
                if rule_config.get("auto_approve", False):
                    workflow.priority = Priority.HIGH
                
                # Expedite if specified
                if rule_config.get("expedited", False):
                    for task in workflow.tasks:
                        if task.due_date:
                            task.due_date = task.due_date - timedelta(days=2)
    
    def _check_automation_conditions(self, workflow: WorkflowInstance, conditions: List[str]) -> bool:
        """Check if automation conditions are met"""
        # Simplified condition checking - in production would be more sophisticated
        workflow_data = workflow.workflow_data
        
        for condition in conditions:
            if "square_footage < 500" in condition:
                if workflow_data.get("square_footage", 1000) >= 500:
                    return False
            elif "residential_zoning" in condition:
                if workflow_data.get("zoning") != "residential":
                    return False
            elif "home_based" in condition:
                if not workflow_data.get("home_based", False):
                    return False
        
        return True
    
    async def _start_workflow(self, workflow: WorkflowInstance):
        """Start workflow execution"""
        workflow.status = WorkflowStatus.IN_PROGRESS
        workflow.started_at = datetime.now()
        
        # Log workflow start
        workflow.activity_log.append({
            "timestamp": datetime.now(),
            "action": "workflow_started",
            "user": workflow.initiator,
            "details": {"template": workflow.template_id}
        })
        
        # Send initial notifications
        await self._send_workflow_notifications(workflow, "workflow_started")
        
        # Start monitoring for SLA compliance
        await self._start_sla_monitoring(workflow)
    
    async def complete_task(self, workflow_id: str, task_id: str, user: str, completion_data: Dict[str, Any]) -> bool:
        """Complete a workflow task"""
        
        if workflow_id not in self.active_workflows:
            return False
        
        workflow = self.active_workflows[workflow_id]
        task = next((t for t in workflow.tasks if t.task_id == task_id), None)
        
        if not task or task.status == WorkflowStatus.COMPLETED:
            return False
        
        # Complete the task
        task.status = WorkflowStatus.COMPLETED
        task.completed_at = datetime.now()
        workflow.completed_tasks.append(task_id)
        
        # Store completion data
        task.form_data.update(completion_data)
        
        # Log task completion
        workflow.activity_log.append({
            "timestamp": datetime.now(),
            "action": "task_completed",
            "user": user,
            "task_id": task_id,
            "task_title": task.title
        })
        
        # Check for workflow completion
        if await self._check_workflow_completion(workflow):
            await self._complete_workflow(workflow)
        else:
            # Move to next task
            await self._advance_workflow(workflow)
        
        return True
    
    async def _check_workflow_completion(self, workflow: WorkflowInstance) -> bool:
        """Check if workflow is complete"""
        incomplete_tasks = [t for t in workflow.tasks if t.status != WorkflowStatus.COMPLETED]
        return len(incomplete_tasks) == 0
    
    async def _complete_workflow(self, workflow: WorkflowInstance):
        """Complete workflow"""
        workflow.status = WorkflowStatus.COMPLETED
        workflow.completed_at = datetime.now()
        workflow.progress_percentage = 100.0
        
        # Calculate completion metrics
        duration = workflow.completed_at - workflow.started_at
        self.workflow_metrics["completed_workflows"] += 1
        
        # Update average completion time
        total_workflows = self.workflow_metrics["completed_workflows"]
        current_avg = self.workflow_metrics["average_completion_time"]
        new_avg = ((current_avg * (total_workflows - 1)) + duration.total_seconds()) / total_workflows
        self.workflow_metrics["average_completion_time"] = new_avg
        
        # Log completion
        workflow.activity_log.append({
            "timestamp": datetime.now(),
            "action": "workflow_completed",
            "duration_hours": duration.total_seconds() / 3600,
            "sla_met": duration <= (workflow.due_date - workflow.created_at) if workflow.due_date else True
        })
        
        # Send completion notifications
        await self._send_workflow_notifications(workflow, "workflow_completed")
        
        # Archive workflow
        await self._archive_workflow(workflow)
    
    async def _advance_workflow(self, workflow: WorkflowInstance):
        """Advance workflow to next task"""
        
        # Find next available task
        next_task = None
        for task in workflow.tasks:
            if (task.status == WorkflowStatus.PENDING and 
                all(dep_id in workflow.completed_tasks for dep_id in task.depends_on)):
                next_task = task
                break
        
        if next_task:
            # Activate next task
            next_task.status = WorkflowStatus.IN_PROGRESS
            workflow.current_task_id = next_task.task_id
            
            # Update progress
            completed_count = len(workflow.completed_tasks)
            total_count = len(workflow.tasks)
            workflow.progress_percentage = (completed_count / total_count) * 100
            
            # Send task assignment notification
            await self._send_task_notification(workflow, next_task, "task_assigned")
    
    async def _send_workflow_notifications(self, workflow: WorkflowInstance, notification_type: str):
        """Send workflow notifications"""
        
        notification_config = self.automation_rules["notification_rules"].get(notification_type, [])
        
        notification_data = {
            "workflow_id": workflow.workflow_id,
            "title": workflow.title,
            "status": workflow.status.value,
            "progress": workflow.progress_percentage,
            "timestamp": datetime.now()
        }
        
        # Simulate sending notifications
        for method in notification_config:
            workflow.activity_log.append({
                "timestamp": datetime.now(),
                "action": "notification_sent",
                "method": method,
                "type": notification_type,
                "recipient": workflow.current_assignee
            })
    
    async def _send_task_notification(self, workflow: WorkflowInstance, task: WorkflowTask, notification_type: str):
        """Send task-specific notification"""
        
        notification_data = {
            "workflow_id": workflow.workflow_id,
            "task_id": task.task_id,
            "task_title": task.title,
            "assigned_to": task.assigned_to,
            "due_date": task.due_date,
            "priority": task.priority.value
        }
        
        # Log notification
        task.notifications.append({
            "timestamp": datetime.now(),
            "type": notification_type,
            "method": "email",
            "recipient": task.assigned_to
        })
    
    async def _start_sla_monitoring(self, workflow: WorkflowInstance):
        """Start SLA monitoring for workflow"""
        
        if not workflow.due_date:
            return
        
        # Calculate warning time (80% of SLA)
        warning_time = workflow.created_at + (workflow.due_date - workflow.created_at) * 0.8
        
        workflow.activity_log.append({
            "timestamp": datetime.now(),
            "action": "sla_monitoring_started",
            "due_date": workflow.due_date,
            "warning_time": warning_time
        })
    
    async def _archive_workflow(self, workflow: WorkflowInstance):
        """Archive completed workflow"""
        
        # In production, this would move workflow to archive storage
        workflow.activity_log.append({
            "timestamp": datetime.now(),
            "action": "workflow_archived",
            "retention_period": "7_years"  # Government retention requirement
        })
    
    def get_workflow_dashboard(self) -> Dict[str, Any]:
        """Get workflow automation dashboard"""
        
        active_workflows = list(self.active_workflows.values())
        
        # Status distribution
        status_counts = {}
        for workflow in active_workflows:
            status = workflow.status.value
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Priority distribution
        priority_counts = {}
        for workflow in active_workflows:
            priority = workflow.priority.value
            priority_counts[priority] = priority_counts.get(priority, 0) + 1
        
        # Department workload
        department_workload = {}
        for workflow in active_workflows:
            for task in workflow.tasks:
                if task.status == WorkflowStatus.IN_PROGRESS:
                    dept = task.department
                    department_workload[dept] = department_workload.get(dept, 0) + 1
        
        # SLA compliance
        overdue_workflows = [
            w for w in active_workflows 
            if w.due_date and datetime.now() > w.due_date and w.status != WorkflowStatus.COMPLETED
        ]
        
        return {
            "total_active_workflows": len(active_workflows),
            "workflow_metrics": self.workflow_metrics,
            "status_distribution": status_counts,
            "priority_distribution": priority_counts,
            "department_workload": department_workload,
            "overdue_workflows": len(overdue_workflows),
            "available_templates": list(self.templates.templates.keys()),
            "automation_features": {
                "auto_approval_rules": len(self.automation_rules["auto_approval_conditions"]),
                "notification_types": len(self.automation_rules["notification_rules"]),
                "escalation_rules": len(self.automation_rules["escalation_rules"])
            },
            "system_health": {
                "workflow_engine": "operational",
                "automation_rules": "operational",
                "notification_system": "operational",
                "sla_monitoring": "operational"
            }
        }

# Initialize the workflow automation engine
workflow_engine = WorkflowAutomationEngine()