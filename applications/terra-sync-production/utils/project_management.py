import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

class TaskPriority(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TaskStatus(Enum):
    BACKLOG = "backlog"
    IN_PROGRESS = "in_progress"
    TESTING = "testing"
    REVIEW = "review"
    DONE = "done"
    BLOCKED = "blocked"

@dataclass
class Task:
    id: str
    title: str
    description: str
    priority: TaskPriority
    status: TaskStatus
    assignee: Optional[str] = None
    created_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    tags: Optional[List[str]] = None
    dependencies: Optional[List[str]] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.tags is None:
            self.tags = []
        if self.dependencies is None:
            self.dependencies = []

class ProjectManager:
    def __init__(self, project_path: str = "project_data"):
        self.project_path = project_path
        self.tasks_file = os.path.join(project_path, "tasks.json")
        self.timeline_file = os.path.join(project_path, "timeline.json")
        self.team_file = os.path.join(project_path, "team.json")
        
        os.makedirs(project_path, exist_ok=True)
        self.logger = logging.getLogger(__name__)
        
        self.tasks: Dict[str, Task] = {}
        self.team_assignments = {}
        self.project_timeline = {}
        
        self._load_project_data()

    def _load_project_data(self):
        try:
            if os.path.exists(self.tasks_file):
                with open(self.tasks_file, 'r') as f:
                    tasks_data = json.load(f)
                    for task_id, task_data in tasks_data.items():
                        task_data['created_at'] = datetime.fromisoformat(task_data['created_at'])
                        if task_data.get('due_date'):
                            task_data['due_date'] = datetime.fromisoformat(task_data['due_date'])
                        task_data['priority'] = TaskPriority(task_data['priority'])
                        task_data['status'] = TaskStatus(task_data['status'])
                        self.tasks[task_id] = Task(**task_data)
                        
            if os.path.exists(self.team_file):
                with open(self.team_file, 'r') as f:
                    self.team_assignments = json.load(f)
                    
            if os.path.exists(self.timeline_file):
                with open(self.timeline_file, 'r') as f:
                    self.project_timeline = json.load(f)
                    
        except Exception as e:
            self.logger.error(f"Error loading project data: {e}")

    def _save_project_data(self):
        try:
            tasks_data = {}
            for task_id, task in self.tasks.items():
                task_dict = asdict(task)
                task_dict['created_at'] = task.created_at.isoformat() if task.created_at else datetime.now().isoformat()
                if task.due_date:
                    task_dict['due_date'] = task.due_date.isoformat()
                task_dict['priority'] = task.priority.value
                task_dict['status'] = task.status.value
                tasks_data[task_id] = task_dict
                
            with open(self.tasks_file, 'w') as f:
                json.dump(tasks_data, f, indent=2)
                
            with open(self.team_file, 'w') as f:
                json.dump(self.team_assignments, f, indent=2)
                
            with open(self.timeline_file, 'w') as f:
                json.dump(self.project_timeline, f, indent=2)
                
        except Exception as e:
            self.logger.error(f"Error saving project data: {e}")

    def create_task(self, title: str, description: str, priority: TaskPriority,
                   assignee: Optional[str] = None, due_date: Optional[datetime] = None,
                   estimated_hours: Optional[float] = None, tags: Optional[List[str]] = None) -> str:
        task_id = f"task_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        task = Task(
            id=task_id,
            title=title,
            description=description,
            priority=priority,
            status=TaskStatus.BACKLOG,
            assignee=assignee,
            due_date=due_date,
            estimated_hours=estimated_hours,
            tags=tags or []
        )
        
        self.tasks[task_id] = task
        self._save_project_data()
        
        self.logger.info(f"Created task {task_id}: {title}")
        return task_id

    def update_task_status(self, task_id: str, status: TaskStatus) -> bool:
        if task_id not in self.tasks:
            return False
            
        self.tasks[task_id].status = status
        self._save_project_data()
        
        self.logger.info(f"Updated task {task_id} status to {status.value}")
        return True

    def assign_task(self, task_id: str, assignee: str) -> bool:
        if task_id not in self.tasks:
            return False
            
        self.tasks[task_id].assignee = assignee
        
        if assignee not in self.team_assignments:
            self.team_assignments[assignee] = []
        if task_id not in self.team_assignments[assignee]:
            self.team_assignments[assignee].append(task_id)
            
        self._save_project_data()
        
        self.logger.info(f"Assigned task {task_id} to {assignee}")
        return True

    def get_tasks_by_status(self, status: TaskStatus) -> List[Task]:
        return [task for task in self.tasks.values() if task.status == status]

    def get_tasks_by_assignee(self, assignee: str) -> List[Task]:
        return [task for task in self.tasks.values() if task.assignee == assignee]

    def get_overdue_tasks(self) -> List[Task]:
        now = datetime.now()
        return [task for task in self.tasks.values() 
                if task.due_date and task.due_date < now and task.status != TaskStatus.DONE]

    def get_project_health(self) -> Dict[str, Any]:
        total_tasks = len(self.tasks)
        if total_tasks == 0:
            return {"status": "no_tasks", "health_score": 0}
            
        done_tasks = len(self.get_tasks_by_status(TaskStatus.DONE))
        in_progress_tasks = len(self.get_tasks_by_status(TaskStatus.IN_PROGRESS))
        blocked_tasks = len(self.get_tasks_by_status(TaskStatus.BLOCKED))
        overdue_tasks = len(self.get_overdue_tasks())
        
        completion_rate = done_tasks / total_tasks
        health_score = max(0, min(100, (completion_rate * 100) - (blocked_tasks * 10) - (overdue_tasks * 5)))
        
        return {
            "total_tasks": total_tasks,
            "done_tasks": done_tasks,
            "in_progress_tasks": in_progress_tasks,
            "blocked_tasks": blocked_tasks,
            "overdue_tasks": overdue_tasks,
            "completion_rate": completion_rate,
            "health_score": health_score,
            "status": "healthy" if health_score > 80 else "needs_attention" if health_score > 50 else "critical"
        }

    def generate_sprint_plan(self, sprint_duration_days: int = 14) -> Dict[str, Any]:
        available_tasks = [task for task in self.tasks.values() 
                          if task.status in [TaskStatus.BACKLOG, TaskStatus.IN_PROGRESS]]
        
        high_priority_tasks = [task for task in available_tasks if task.priority == TaskPriority.HIGH]
        medium_priority_tasks = [task for task in available_tasks if task.priority == TaskPriority.MEDIUM]
        
        sprint_tasks = high_priority_tasks[:5] + medium_priority_tasks[:10]
        
        total_estimated_hours = sum(task.estimated_hours or 8 for task in sprint_tasks)
        
        return {
            "sprint_duration_days": sprint_duration_days,
            "selected_tasks": [task.id for task in sprint_tasks],
            "total_estimated_hours": total_estimated_hours,
            "tasks_by_priority": {
                "high": len(high_priority_tasks),
                "medium": len(medium_priority_tasks)
            }
        }

class DevOpsManager:
    def __init__(self, project_root: str = "."):
        self.project_root = project_root
        self.logger = logging.getLogger(__name__)
        
    def check_code_quality(self) -> Dict[str, Any]:
        quality_report = {
            "python_files": 0,
            "total_lines": 0,
            "issues": [],
            "suggestions": []
        }
        
        for root, dirs, files in os.walk(self.project_root):
            if 'archive' in root or '__pycache__' in root or '.git' in root:
                continue
                
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    quality_report["python_files"] += 1
                    
                    try:
                        with open(file_path, 'r') as f:
                            lines = f.readlines()
                            quality_report["total_lines"] += len(lines)
                            
                            for i, line in enumerate(lines):
                                if len(line.strip()) > 120:
                                    quality_report["issues"].append(f"{file}:{i+1} - Line too long")
                                if line.strip().startswith('print(') and 'debug' not in file.lower():
                                    quality_report["suggestions"].append(f"{file}:{i+1} - Consider using logging instead of print")
                                    
                    except Exception as e:
                        quality_report["issues"].append(f"Could not read {file}: {e}")
        
        return quality_report
    
    def generate_deployment_checklist(self) -> List[str]:
        return [
            "Environment variables configured in .env",
            "Database connection tested",
            "SSL certificates in place",
            "Backup strategy implemented",
            "Monitoring and logging configured",
            "Performance testing completed",
            "Security scan passed",
            "Documentation updated",
            "Team trained on deployment process",
            "Rollback plan documented"
        ]
    
    def validate_security_configuration(self) -> Dict[str, Any]:
        security_report = {
            "ssl_configured": os.path.exists("ssl/cert.pem") and os.path.exists("ssl/key.pem"),
            "env_file_secure": os.path.exists(".env") and not os.path.exists(".env.example"),
            "secrets_not_in_code": True,
            "issues": []
        }
        
        for root, dirs, files in os.walk(self.project_root):
            if 'archive' in root or '__pycache__' in root:
                continue
                
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r') as f:
                            content = f.read()
                            if 'password' in content.lower() and '=' in content:
                                security_report["secrets_not_in_code"] = False
                                security_report["issues"].append(f"Potential hardcoded password in {file}")
                            if 'api_key' in content.lower() and '=' in content and 'environ' not in content:
                                security_report["secrets_not_in_code"] = False
                                security_report["issues"].append(f"Potential hardcoded API key in {file}")
                    except:
                        pass
        
        return security_report

def initialize_terrafusion_project():
    pm = ProjectManager()
    devops = DevOpsManager()
    
    initial_tasks = [
        {
            "title": "Codebase Cleanup and Architecture Review",
            "description": "Clean up unused code, organize files, and establish proper architecture",
            "priority": TaskPriority.HIGH,
            "estimated_hours": 16,
            "tags": ["cleanup", "architecture"]
        },
        {
            "title": "Environment Configuration Setup",
            "description": "Configure all environment variables and deployment settings",
            "priority": TaskPriority.HIGH,
            "estimated_hours": 8,
            "tags": ["devops", "configuration"]
        },
        {
            "title": "Security Hardening",
            "description": "Implement security best practices and SSL configuration",
            "priority": TaskPriority.HIGH,
            "estimated_hours": 12,
            "tags": ["security", "ssl"]
        },
        {
            "title": "Database Optimization",
            "description": "Optimize database schema and implement proper indexing",
            "priority": TaskPriority.MEDIUM,
            "estimated_hours": 10,
            "tags": ["database", "performance"]
        },
        {
            "title": "Monitoring and Logging Setup",
            "description": "Implement comprehensive monitoring and logging system",
            "priority": TaskPriority.MEDIUM,
            "estimated_hours": 8,
            "tags": ["monitoring", "logging"]
        },
        {
            "title": "Documentation and Training Materials",
            "description": "Create comprehensive documentation and training materials",
            "priority": TaskPriority.MEDIUM,
            "estimated_hours": 12,
            "tags": ["documentation", "training"]
        }
    ]
    
    for task_data in initial_tasks:
        pm.create_task(**task_data)
    
    return pm, devops

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    pm, devops = initialize_terrafusion_project()
    
    print("TerraFusion Project Management Initialized")
    print(f"Project Health: {pm.get_project_health()}")
    print(f"Code Quality Report: {devops.check_code_quality()}")
    print(f"Security Report: {devops.validate_security_configuration()}")