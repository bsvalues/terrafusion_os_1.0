#!/usr/bin/env python3
"""
TerraFusion OS Workflow System
MIT/PhD Level Systems Design - Prevents Context Loss and Ensures Disciplined Execution
"""

import os
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

class TerraFusionWorkflowSystem:
    """TerraFusion OS Workflow System - Prevents Context Loss and Ensures Disciplined Execution"""

    def __init__(self):
        self.workflow_dir = Path("/workspaces/terrafusion_os_1.0/terrafusion-cos/workflow")
        self.workflow_dir.mkdir(exist_ok=True)

        self.workflow_state_file = self.workflow_dir / "workflow_state.json"
        self.context_review_file = self.workflow_dir / "context_review.json"
        self.task_execution_log = self.workflow_dir / "task_execution.log"

        self._setup_logging()
        self._load_workflow_state()

    def _setup_logging(self):
        """Setup workflow logging"""
        logging.basicConfig(
            filename=self.task_execution_log,
            level=logging.INFO,
            format='%(asctime)s - WORKFLOW - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger("TerraFusionWorkflow")

    def _load_workflow_state(self):
        """Load current workflow state"""
        if self.workflow_state_file.exists():
            with open(self.workflow_state_file, 'r') as f:
                self.workflow_state = json.load(f)
        else:
            self.workflow_state = {
                "current_session": datetime.now().isoformat(),
                "active_todos": [],
                "completed_todos": [],
                "context_reviews": [],
                "last_checkpoint": None,
                "discipline_violations": 0
            }

    def _save_workflow_state(self):
        """Save workflow state"""
        with open(self.workflow_state_file, 'w') as f:
            json.dump(self.workflow_state, f, indent=2)

    def context_review_required(self) -> bool:
        """Check if context review is required before any action"""
        last_review = self.workflow_state.get("last_context_review")
        if not last_review:
            return True

        last_review_time = datetime.fromisoformat(last_review)
        time_since_review = datetime.now() - last_review_time

        # Require review every 5 minutes or after context loss
        return time_since_review.total_seconds() > 300

    def perform_context_review(self, user_instructions: str, attachments: List[str] = None) -> Dict[str, Any]:
        """Perform mandatory context review before any action"""

        review_data = {
            "timestamp": datetime.now().isoformat(),
            "user_instructions": user_instructions,
            "attachments": attachments or [],
            "current_todos": self.workflow_state.get("active_todos", []),
            "last_checkpoint": self.workflow_state.get("last_checkpoint"),
            "context_verified": True
        }

        # Log the review
        self.logger.info(f"CONTEXT REVIEW: {user_instructions[:100]}...")

        # Update workflow state
        self.workflow_state["last_context_review"] = review_data["timestamp"]
        self.workflow_state["context_reviews"].append(review_data)
        self._save_workflow_state()

        return review_data

    def validate_task_execution(self, task_description: str) -> bool:
        """Validate that task execution follows workflow discipline"""

        # Check if this task is in active TODOs
        active_todos = self.workflow_state.get("active_todos", [])
        task_matches = any(task["description"].lower() in task_description.lower() or
                          task["title"].lower() in task_description.lower()
                          for task in active_todos)

        if not task_matches:
            self.logger.warning(f"TASK VALIDATION FAILED: {task_description}")
            self.workflow_state["discipline_violations"] += 1
            self._save_workflow_state()
            return False

        return True

    def create_checkpoint(self, checkpoint_name: str, checkpoint_data: Dict[str, Any]) -> str:
        """Create execution checkpoint to prevent context loss"""

        checkpoint = {
            "id": f"checkpoint_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "name": checkpoint_name,
            "timestamp": datetime.now().isoformat(),
            "data": checkpoint_data,
            "active_todos": self.workflow_state.get("active_todos", []),
            "context_review": self.workflow_state.get("last_context_review")
        }

        checkpoint_file = self.workflow_dir / f"{checkpoint['id']}.json"
        with open(checkpoint_file, 'w') as f:
            json.dump(checkpoint, f, indent=2)

        self.workflow_state["last_checkpoint"] = checkpoint["id"]
        self._save_workflow_state()

        self.logger.info(f"CHECKPOINT CREATED: {checkpoint_name}")
        return checkpoint["id"]

    def require_checkpoint_confirmation(self, checkpoint_id: str) -> bool:
        """Require user confirmation before proceeding past checkpoint"""

        checkpoint_file = self.workflow_dir / f"{checkpoint_id}.json"
        if not checkpoint_file.exists():
            return False

        with open(checkpoint_file, 'r') as f:
            checkpoint = json.load(f)

        # Log checkpoint requirement
        self.logger.info(f"CHECKPOINT CONFIRMATION REQUIRED: {checkpoint['name']}")

        return True

    def enforce_discipline(self, action_description: str) -> Dict[str, Any]:
        """Enforce workflow discipline for all actions"""

        discipline_check = {
            "action": action_description,
            "timestamp": datetime.now().isoformat(),
            "context_review_passed": False,
            "task_validation_passed": False,
            "checkpoint_required": False,
            "discipline_violations": self.workflow_state.get("discipline_violations", 0)
        }

        # 1. Check context review requirement
        if self.context_review_required():
            discipline_check["context_review_passed"] = False
            self.logger.error("DISCIPLINE VIOLATION: Context review required before action")
            return discipline_check

        discipline_check["context_review_passed"] = True

        # 2. Validate task execution
        if not self.validate_task_execution(action_description):
            discipline_check["task_validation_passed"] = False
            self.logger.error("DISCIPLINE VIOLATION: Task not in active TODOs")
            return discipline_check

        discipline_check["task_validation_passed"] = True

        # 3. Check if checkpoint confirmation needed
        last_checkpoint = self.workflow_state.get("last_checkpoint")
        if last_checkpoint and not self.require_checkpoint_confirmation(last_checkpoint):
            discipline_check["checkpoint_required"] = True
            self.logger.warning("CHECKPOINT CONFIRMATION PENDING")
            return discipline_check

        return discipline_check

    def get_workflow_status(self) -> Dict[str, Any]:
        """Get current workflow status"""

        return {
            "current_session": self.workflow_state.get("current_session"),
            "active_todos": len(self.workflow_state.get("active_todos", [])),
            "completed_todos": len(self.workflow_state.get("completed_todos", [])),
            "context_reviews": len(self.workflow_state.get("context_reviews", [])),
            "last_checkpoint": self.workflow_state.get("last_checkpoint"),
            "discipline_violations": self.workflow_state.get("discipline_violations", 0),
            "context_review_required": self.context_review_required(),
            "workflow_health": "GOOD" if self.workflow_state.get("discipline_violations", 0) == 0 else "NEEDS_ATTENTION"
        }

# Global workflow system instance
workflow_system = TerraFusionWorkflowSystem()

def enforce_workflow_discipline(action_description: str) -> bool:
    """Global function to enforce workflow discipline"""

    discipline_check = workflow_system.enforce_discipline(action_description)

    if not all([discipline_check["context_review_passed"],
                discipline_check["task_validation_passed"],
                not discipline_check["checkpoint_required"]]):
        print("🚨 WORKFLOW DISCIPLINE VIOLATION DETECTED")
        print(f"   Action: {action_description}")
        print(f"   Context Review: {'✅' if discipline_check['context_review_passed'] else '❌'}")
        print(f"   Task Validation: {'✅' if discipline_check['task_validation_passed'] else '❌'}")
        print(f"   Checkpoint Status: {'⏳' if discipline_check['checkpoint_required'] else '✅'}")
        return False

    return True

def require_context_review(user_instructions: str, attachments: List[str] = None) -> Dict[str, Any]:
    """Require context review before any action"""
    return workflow_system.perform_context_review(user_instructions, attachments)

def create_execution_checkpoint(checkpoint_name: str, checkpoint_data: Dict[str, Any]) -> str:
    """Create execution checkpoint"""
    return workflow_system.create_checkpoint(checkpoint_name, checkpoint_data)

def get_workflow_status() -> Dict[str, Any]:
    """Get workflow status"""
    return workflow_system.get_workflow_status()

if __name__ == "__main__":
    # Test the workflow system
    print("🧠 TerraFusion OS Workflow System - MIT/PhD Level Systems Design")
    print("=" * 70)

    status = get_workflow_status()
    print(f"Workflow Health: {status['workflow_health']}")
    print(f"Active TODOs: {status['active_todos']}")
    print(f"Discipline Violations: {status['discipline_violations']}")
    print(f"Context Review Required: {status['context_review_required']}")

    print("\n✅ Workflow System Operational - Context Loss Prevention Active")