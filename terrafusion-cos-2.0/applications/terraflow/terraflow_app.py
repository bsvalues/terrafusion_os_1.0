#!/usr/bin/env python3
"""
TerraFlow - Workflow Orchestration Platform
MIT/PhD Level Systems Design - September 26, 2025
"""

import os
import sys
import json
import asyncio
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import threading
import subprocess
import webbrowser
from flask import Flask, render_template_string, jsonify, request
import psutil
import random

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WorkflowStatus(Enum):
    """Workflow status types"""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    PENDING = "pending"

class StepType(Enum):
    """Workflow step types"""
    DATA_PROCESSING = "data_processing"
    APPROVAL_GATE = "approval_gate"
    NOTIFICATION = "notification"
    INTEGRATION = "integration"
    VALIDATION = "validation"
    COMPLIANCE_CHECK = "compliance_check"

class Priority(Enum):
    """Priority levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class WorkflowStep:
    """Workflow step structure"""
    id: str
    name: str
    type: StepType
    status: str
    description: str
    assigned_to: Optional[str]
    estimated_duration: int  # minutes
    actual_duration: Optional[int]
    dependencies: List[str]
    completion_percentage: float

@dataclass
class Workflow:
    """Workflow structure"""
    id: str
    name: str
    description: str
    status: WorkflowStatus
    priority: Priority
    created_by: str
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    steps: List[WorkflowStep]
    total_steps: int
    completed_steps: int
    estimated_completion: Optional[datetime]

@dataclass
class ApprovalRequest:
    """Approval request structure"""
    id: str
    workflow_id: str
    step_id: str
    requester: str
    approver: str
    status: str
    request_message: str
    created_at: datetime
    responded_at: Optional[datetime]
    response_message: Optional[str]

class TerraFlow:
    """Complete TerraFlow Workflow Orchestration Platform"""
    
    def __init__(self):
        self.app = Flask(__name__)
        self.workflows: Dict[str, Workflow] = {}
        self.approval_requests: Dict[str, ApprovalRequest] = {}
        self.active_workflows: List[str] = []
        
        # Initialize workflow platform
        self._initialize_workflows()
        self._initialize_approval_requests()
        self._setup_routes()
        
        logger.info("🌊 TerraFlow initialized")
        logger.info("   Workflow Orchestration | Process Designer | Government Templates")
    
    def _initialize_workflows(self):
        """Initialize sample workflows"""
        workflows_data = [
            {
                "id": "workflow_001",
                "name": "FISMA Compliance Assessment",
                "description": "Complete FISMA compliance assessment workflow with automated checks and approvals",
                "status": WorkflowStatus.ACTIVE,
                "priority": Priority.CRITICAL,
                "created_by": "System Administrator",
                "total_steps": 8,
                "completed_steps": 5
            },
            {
                "id": "workflow_002",
                "name": "Vendor Integration Onboarding",
                "description": "Streamlined process for onboarding new vendor integrations",
                "status": WorkflowStatus.ACTIVE,
                "priority": Priority.HIGH,
                "created_by": "Integration Manager",
                "total_steps": 12,
                "completed_steps": 3
            },
            {
                "id": "workflow_003",
                "name": "Budget Approval Process",
                "description": "Multi-tier budget approval workflow with financial validation",
                "status": WorkflowStatus.PENDING,
                "priority": Priority.MEDIUM,
                "created_by": "Finance Director",
                "total_steps": 6,
                "completed_steps": 0
            },
            {
                "id": "workflow_004",
                "name": "Data Quality Assessment",
                "description": "Automated data quality checks across all integrated systems",
                "status": WorkflowStatus.COMPLETED,
                "priority": Priority.MEDIUM,
                "created_by": "Data Analyst",
                "total_steps": 10,
                "completed_steps": 10
            },
            {
                "id": "workflow_005",
                "name": "Security Incident Response",
                "description": "Emergency response workflow for security incidents",
                "status": WorkflowStatus.ACTIVE,
                "priority": Priority.CRITICAL,
                "created_by": "Security Officer",
                "total_steps": 15,
                "completed_steps": 7
            }
        ]
        
        for wf_data in workflows_data:
            # Generate sample steps for each workflow
            steps = []
            for i in range(wf_data["total_steps"]):
                step_status = "completed" if i < wf_data["completed_steps"] else "pending"
                completion = 100.0 if step_status == "completed" else random.uniform(0, 30) if i == wf_data["completed_steps"] else 0.0
                
                step = WorkflowStep(
                    id=f"{wf_data['id']}_step_{i+1:02d}",
                    name=f"Step {i+1}: {random.choice(['Validation', 'Processing', 'Approval', 'Integration', 'Review'])}",
                    type=random.choice(list(StepType)),
                    status=step_status,
                    description=f"Description for step {i+1} of {wf_data['name']}",
                    assigned_to=random.choice(["Alice Johnson", "Bob Smith", "Carol Wilson", "David Brown", None]),
                    estimated_duration=random.randint(30, 240),
                    actual_duration=random.randint(25, 300) if step_status == "completed" else None,
                    dependencies=[] if i == 0 else [f"{wf_data['id']}_step_{i:02d}"],
                    completion_percentage=completion
                )
                steps.append(step)
            
            workflow = Workflow(
                id=wf_data["id"],
                name=wf_data["name"],
                description=wf_data["description"],
                status=wf_data["status"],
                priority=wf_data["priority"],
                created_by=wf_data["created_by"],
                created_at=datetime.now() - timedelta(days=random.randint(1, 30)),
                started_at=datetime.now() - timedelta(hours=random.randint(1, 72)) if wf_data["status"] == WorkflowStatus.ACTIVE else None,
                completed_at=datetime.now() - timedelta(hours=random.randint(1, 24)) if wf_data["status"] == WorkflowStatus.COMPLETED else None,
                steps=steps,
                total_steps=wf_data["total_steps"],
                completed_steps=wf_data["completed_steps"],
                estimated_completion=datetime.now() + timedelta(hours=random.randint(2, 48)) if wf_data["status"] == WorkflowStatus.ACTIVE else None
            )
            
            self.workflows[workflow.id] = workflow
            
            if workflow.status == WorkflowStatus.ACTIVE:
                self.active_workflows.append(workflow.id)
        
        logger.info(f"✅ Initialized {len(self.workflows)} workflows")
    
    def _initialize_approval_requests(self):
        """Initialize sample approval requests"""
        requests_data = [
            {
                "id": "approval_001",
                "workflow_id": "workflow_001",
                "step_id": "workflow_001_step_06",
                "requester": "System Analyst",
                "approver": "Security Manager",
                "status": "pending",
                "request_message": "Please approve FISMA compliance validation results"
            },
            {
                "id": "approval_002",
                "workflow_id": "workflow_002",
                "step_id": "workflow_002_step_04",
                "requester": "Integration Specialist",
                "approver": "Technical Director",
                "status": "pending",
                "request_message": "Vendor API integration testing completed - approval needed to proceed"
            },
            {
                "id": "approval_003",
                "workflow_id": "workflow_005",
                "step_id": "workflow_005_step_08",
                "requester": "Incident Response Team",
                "approver": "Chief Information Officer",
                "status": "approved",
                "request_message": "Security incident containment measures approved"
            }
        ]
        
        for req_data in requests_data:
            request = ApprovalRequest(
                id=req_data["id"],
                workflow_id=req_data["workflow_id"],
                step_id=req_data["step_id"],
                requester=req_data["requester"],
                approver=req_data["approver"],
                status=req_data["status"],
                request_message=req_data["request_message"],
                created_at=datetime.now() - timedelta(hours=random.randint(1, 48)),
                responded_at=datetime.now() - timedelta(hours=random.randint(1, 12)) if req_data["status"] != "pending" else None,
                response_message="Approved with conditions" if req_data["status"] == "approved" else None
            )
            self.approval_requests[request.id] = request
        
        logger.info(f"✅ Initialized {len(self.approval_requests)} approval requests")
    
    def _setup_routes(self):
        """Setup Flask routes"""
        
        @self.app.route('/')
        def index():
            return render_template_string(self._get_html_template())
        
        @self.app.route('/api/workflow-status')
        def get_workflow_status():
            active_count = len([wf for wf in self.workflows.values() if wf.status == WorkflowStatus.ACTIVE])
            completed_today = len([wf for wf in self.workflows.values() if 
                                 wf.completed_at and wf.completed_at.date() == datetime.now().date()])
            pending_approvals = len([req for req in self.approval_requests.values() if req.status == "pending"])
            
            return jsonify({
                "status": "success",
                "workflow_platform": {
                    "total_workflows": len(self.workflows),
                    "active_workflows": active_count,
                    "completed_today": completed_today,
                    "pending_approvals": pending_approvals,
                    "average_completion_time": random.uniform(2.5, 4.8),  # hours
                    "success_rate": random.uniform(94.0, 98.5),
                    "automation_level": random.uniform(85.0, 92.0)
                }
            })
        
        @self.app.route('/api/workflows')
        def get_workflows():
            return jsonify({
                "status": "success",
                "workflows": [asdict(workflow) for workflow in self.workflows.values()]
            })
        
        @self.app.route('/api/approvals')
        def get_approvals():
            return jsonify({
                "status": "success",
                "approvals": [asdict(approval) for approval in self.approval_requests.values()]
            })
        
        @self.app.route('/api/workflow/<workflow_id>')
        def get_workflow(workflow_id):
            if workflow_id not in self.workflows:
                return jsonify({"status": "error", "message": "Workflow not found"}), 404
            
            return jsonify({
                "status": "success",
                "workflow": asdict(self.workflows[workflow_id])
            })
        
        @self.app.route('/api/start-workflow', methods=['POST'])
        def start_workflow():
            data = request.get_json()
            workflow_id = data.get('workflow_id')
            
            if workflow_id not in self.workflows:
                return jsonify({"status": "error", "message": "Workflow not found"}), 404
            
            workflow = self.workflows[workflow_id]
            if workflow.status != WorkflowStatus.PENDING:
                return jsonify({"status": "error", "message": "Workflow is not in pending status"}), 400
            
            # Start the workflow
            workflow.status = WorkflowStatus.ACTIVE
            workflow.started_at = datetime.now()
            workflow.estimated_completion = datetime.now() + timedelta(hours=random.randint(2, 48))
            
            if workflow_id not in self.active_workflows:
                self.active_workflows.append(workflow_id)
            
            return jsonify({
                "status": "success",
                "workflow": asdict(workflow)
            })
        
        @self.app.route('/api/approve-step', methods=['POST'])
        def approve_step():
            data = request.get_json()
            approval_id = data.get('approval_id')
            response_message = data.get('response_message', 'Approved')
            
            if approval_id not in self.approval_requests:
                return jsonify({"status": "error", "message": "Approval request not found"}), 404
            
            approval = self.approval_requests[approval_id]
            approval.status = "approved"
            approval.responded_at = datetime.now()
            approval.response_message = response_message
            
            return jsonify({
                "status": "success",
                "approval": asdict(approval)
            })
    
    def _get_html_template(self):
        """Get HTML template for TerraFlow"""
        return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TerraFlow - Workflow Orchestration Platform</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --tf-trust-blue: #0099ff;
            --tf-transcend-cyan: #00ffee;
            --tf-innovation-green: #00ffaa;
            --tf-deep-space: #0b1020;
            --tf-cosmic-void: #0a0f1c;
            --tf-quantum-glow: rgba(0, 255, 238, 0.3);
            --tf-glass-effect: rgba(0, 255, 238, 0.1);
            --tf-glass-border: rgba(0, 255, 238, 0.2);
            --tf-white: #ffffff;
            --tf-light-gray: #b0c4de;
            --tf-dark-gradient: linear-gradient(180deg, #0b1020 0%, #0a0f1c 100%);
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', -apple-system, system-ui, sans-serif;
            background: var(--tf-dark-gradient);
            color: var(--tf-white);
            min-height: 100vh;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        .terraflow-container {
            display: grid;
            grid-template-columns: 350px 1fr;
            grid-template-rows: 60px 1fr;
            grid-template-areas: 
                "sidebar header"
                "sidebar main";
            height: 100vh;
        }

        .header {
            grid-area: header;
            background: linear-gradient(135deg, var(--tf-trust-blue) 0%, var(--tf-transcend-cyan) 100%);
            border-bottom: 1px solid var(--tf-glass-border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 30px;
            box-shadow: 0 4px 20px rgba(0, 255, 238, 0.3);
        }

        .header h1 {
            font-size: 20px;
            font-weight: 700;
            color: var(--tf-white);
            text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .workflow-status {
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }

        .sidebar {
            grid-area: sidebar;
            background: rgba(11, 16, 32, 0.95);
            border-right: 1px solid var(--tf-glass-border);
            backdrop-filter: blur(20px);
            padding: 20px;
            overflow-y: auto;
        }

        .main-content {
            grid-area: main;
            padding: 30px;
            overflow-y: auto;
        }

        .stats-section {
            background: var(--tf-glass-effect);
            border: 1px solid var(--tf-glass-border);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            backdrop-filter: blur(20px);
        }

        .section-title {
            color: var(--tf-transcend-cyan);
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }

        .stat-item {
            text-align: center;
        }

        .stat-value {
            color: var(--tf-transcend-cyan);
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .stat-label {
            color: var(--tf-light-gray);
            font-size: 12px;
        }

        .approvals-section {
            background: var(--tf-glass-effect);
            border: 1px solid var(--tf-glass-border);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(20px);
        }

        .approval-item {
            background: rgba(0, 20, 40, 0.6);
            border: 1px solid var(--tf-glass-border);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
        }

        .approval-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }

        .approval-title {
            color: var(--tf-transcend-cyan);
            font-size: 14px;
            font-weight: 600;
        }

        .approval-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }

        .status-pending {
            background: rgba(255, 165, 0, 0.2);
            color: #ffa500;
            border: 1px solid rgba(255, 165, 0, 0.3);
        }

        .status-approved {
            background: rgba(0, 255, 170, 0.2);
            color: var(--tf-innovation-green);
            border: 1px solid rgba(0, 255, 170, 0.3);
        }

        .approval-message {
            color: var(--tf-light-gray);
            font-size: 12px;
            margin-bottom: 10px;
        }

        .approve-btn {
            background: linear-gradient(135deg, var(--tf-innovation-green), var(--tf-transcend-cyan));
            border: none;
            border-radius: 6px;
            color: var(--tf-white);
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .approve-btn:hover {
            box-shadow: 0 4px 20px var(--tf-quantum-glow);
            transform: translateY(-2px);
        }

        .workflows-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
        }

        .workflow-card {
            background: var(--tf-glass-effect);
            border: 1px solid var(--tf-glass-border);
            border-radius: 12px;
            padding: 20px;
            backdrop-filter: blur(20px);
            transition: all 0.3s ease;
        }

        .workflow-card:hover {
            border-color: rgba(0, 255, 238, 0.4);
            box-shadow: 0 8px 32px var(--tf-quantum-glow);
            transform: translateY(-2px);
        }

        .workflow-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .workflow-title {
            color: var(--tf-transcend-cyan);
            font-size: 16px;
            font-weight: 600;
        }

        .workflow-priority {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }

        .priority-critical {
            background: rgba(255, 0, 100, 0.2);
            color: #ff0064;
            border: 1px solid rgba(255, 0, 100, 0.3);
        }

        .priority-high {
            background: rgba(255, 165, 0, 0.2);
            color: #ffa500;
            border: 1px solid rgba(255, 165, 0, 0.3);
        }

        .priority-medium {
            background: rgba(0, 255, 170, 0.2);
            color: var(--tf-innovation-green);
            border: 1px solid rgba(0, 255, 170, 0.3);
        }

        .priority-low {
            background: rgba(176, 196, 222, 0.2);
            color: var(--tf-light-gray);
            border: 1px solid rgba(176, 196, 222, 0.3);
        }

        .workflow-description {
            color: var(--tf-light-gray);
            font-size: 14px;
            margin-bottom: 15px;
            line-height: 1.4;
        }

        .workflow-progress {
            margin: 15px 0;
        }

        .progress-label {
            color: var(--tf-light-gray);
            font-size: 12px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }

        .progress-bar {
            background: rgba(0, 20, 40, 0.8);
            border-radius: 10px;
            height: 8px;
            overflow: hidden;
        }

        .progress-fill {
            background: linear-gradient(90deg, var(--tf-trust-blue), var(--tf-transcend-cyan));
            height: 100%;
            border-radius: 10px;
            transition: width 0.3s ease;
        }

        .workflow-meta {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 15px;
        }

        .meta-item {
            text-align: center;
        }

        .meta-value {
            color: var(--tf-transcend-cyan);
            font-size: 14px;
            font-weight: 600;
        }

        .meta-label {
            color: var(--tf-light-gray);
            font-size: 10px;
        }

        .workflow-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }

        .start-btn {
            background: linear-gradient(135deg, var(--tf-trust-blue), var(--tf-transcend-cyan));
            border: none;
            border-radius: 6px;
            color: var(--tf-white);
            padding: 8px 16px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .start-btn:hover {
            box-shadow: 0 4px 20px var(--tf-quantum-glow);
            transform: translateY(-2px);
        }

        .start-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }

        .loading {
            text-align: center;
            padding: 40px;
            color: var(--tf-light-gray);
        }

        .spinner {
            border: 2px solid var(--tf-glass-border);
            border-top: 2px solid var(--tf-transcend-cyan);
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="terraflow-container">
        <div class="header">
            <h1>🌊 TerraFlow</h1>
            <div class="workflow-status" id="workflow-status">Orchestrating</div>
        </div>

        <div class="sidebar">
            <div class="stats-section">
                <div class="section-title">
                    📊 Platform Statistics
                </div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-value" id="total-workflows">--</div>
                        <div class="stat-label">Total Workflows</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="active-workflows">--</div>
                        <div class="stat-label">Active</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="completed-today">--</div>
                        <div class="stat-label">Completed Today</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="success-rate">--</div>
                        <div class="stat-label">Success Rate</div>
                    </div>
                </div>
            </div>

            <div class="approvals-section">
                <div class="section-title">
                    ✋ Pending Approvals
                </div>
                <div id="approvals-list">
                    <div class="loading">
                        <div class="spinner"></div>
                        Loading approvals...
                    </div>
                </div>
            </div>
        </div>

        <div class="main-content">
            <div class="section-title">
                🔄 Active Workflows
            </div>
            <div class="workflows-grid" id="workflows-grid">
                <div class="loading">
                    <div class="spinner"></div>
                    Loading workflows...
                </div>
            </div>
        </div>
    </div>

    <script>
        // Load workflow data
        async function loadWorkflowData() {
            try {
                // Load workflow status
                const statusResponse = await fetch('/api/workflow-status');
                const statusData = await statusResponse.json();
                
                if (statusData.status === 'success') {
                    const stats = statusData.workflow_platform;
                    document.getElementById('total-workflows').textContent = stats.total_workflows;
                    document.getElementById('active-workflows').textContent = stats.active_workflows;
                    document.getElementById('completed-today').textContent = stats.completed_today;
                    document.getElementById('success-rate').textContent = stats.success_rate.toFixed(1) + '%';
                }

                // Load workflows
                const workflowsResponse = await fetch('/api/workflows');
                const workflowsData = await workflowsResponse.json();
                
                if (workflowsData.status === 'success') {
                    const workflowsGrid = document.getElementById('workflows-grid');
                    workflowsGrid.innerHTML = workflowsData.workflows.map(workflow => {
                        const progress = (workflow.completed_steps / workflow.total_steps * 100) || 0;
                        const canStart = workflow.status === 'pending';
                        
                        return `
                            <div class="workflow-card">
                                <div class="workflow-header">
                                    <div class="workflow-title">${workflow.name}</div>
                                    <div class="workflow-priority priority-${workflow.priority}">${workflow.priority.toUpperCase()}</div>
                                </div>
                                <div class="workflow-description">${workflow.description}</div>
                                <div class="workflow-progress">
                                    <div class="progress-label">
                                        <span>Progress</span>
                                        <span>${progress.toFixed(0)}%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${progress}%"></div>
                                    </div>
                                </div>
                                <div class="workflow-meta">
                                    <div class="meta-item">
                                        <div class="meta-value">${workflow.total_steps}</div>
                                        <div class="meta-label">Total Steps</div>
                                    </div>
                                    <div class="meta-item">
                                        <div class="meta-value">${workflow.completed_steps}</div>
                                        <div class="meta-label">Completed</div>
                                    </div>
                                    <div class="meta-item">
                                        <div class="meta-value">${workflow.status.toUpperCase()}</div>
                                        <div class="meta-label">Status</div>
                                    </div>
                                </div>
                                <div class="workflow-actions">
                                    <button class="start-btn" onclick="startWorkflow('${workflow.id}')" ${!canStart ? 'disabled' : ''}>
                                        ${canStart ? 'Start Workflow' : 'Running'}
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('');
                }

                // Load approvals
                const approvalsResponse = await fetch('/api/approvals');
                const approvalsData = await approvalsResponse.json();
                
                if (approvalsData.status === 'success') {
                    const approvalsList = document.getElementById('approvals-list');
                    const pendingApprovals = approvalsData.approvals.filter(approval => approval.status === 'pending');
                    
                    if (pendingApprovals.length === 0) {
                        approvalsList.innerHTML = '<div style="color: var(--tf-light-gray); font-size: 12px; text-align: center; padding: 20px;">No pending approvals</div>';
                    } else {
                        approvalsList.innerHTML = pendingApprovals.map(approval => `
                            <div class="approval-item">
                                <div class="approval-header">
                                    <div class="approval-title">${approval.requester}</div>
                                    <div class="approval-status status-${approval.status}">${approval.status.toUpperCase()}</div>
                                </div>
                                <div class="approval-message">${approval.request_message}</div>
                                <button class="approve-btn" onclick="approveStep('${approval.id}')">Approve</button>
                            </div>
                        `).join('');
                    }
                }

            } catch (error) {
                console.error('Error loading workflow data:', error);
            }
        }

        // Start workflow
        async function startWorkflow(workflowId) {
            try {
                const response = await fetch('/api/start-workflow', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ workflow_id: workflowId })
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    alert(`Workflow "${data.workflow.name}" started successfully!`);
                    loadWorkflowData(); // Refresh data
                } else {
                    alert('Error starting workflow: ' + data.message);
                }
            } catch (error) {
                console.error('Error starting workflow:', error);
                alert('Error starting workflow');
            }
        }

        // Approve step
        async function approveStep(approvalId) {
            try {
                const response = await fetch('/api/approve-step', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        approval_id: approvalId,
                        response_message: 'Approved via TerraFlow interface'
                    })
                });
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    alert('Approval processed successfully!');
                    loadWorkflowData(); // Refresh data
                } else {
                    alert('Error processing approval: ' + data.message);
                }
            } catch (error) {
                console.error('Error processing approval:', error);
                alert('Error processing approval');
            }
        }

        // Initialize TerraFlow
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🌊 TerraFlow initialized');
            console.log('   Workflow Orchestration | Process Designer | Government Templates');
            loadWorkflowData();
        });
    </script>
</body>
</html>
        """
    
    def run(self, host='0.0.0.0', port=5008, debug=False):
        """Run the TerraFlow application"""
        logger.info("🌊 Starting TerraFlow...")
        logger.info(f"   Access at: http://localhost:{port}")
        logger.info("   Workflow Orchestration | Process Designer | Government Templates")
        
        try:
            self.app.run(host=host, port=port, debug=debug, threaded=True)
        except Exception as e:
            logger.error(f"❌ Failed to start TerraFlow: {e}")
            raise

def main():
    """Main entry point"""
    try:
        terraflow = TerraFlow()
        terraflow.run()
    except KeyboardInterrupt:
        logger.info("🛑 TerraFlow shutdown requested")
    except Exception as e:
        logger.error(f"❌ TerraFlow error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
