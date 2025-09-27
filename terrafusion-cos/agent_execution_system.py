#!/usr/bin/env python3
"""
TerraFusion OS Agent Execution System
Enforces MIT/PhD level workflow discipline for all AI agent actions
"""

import sys
import os
import json
from pathlib import Path
from datetime import datetime

# Add TerraFusion OS to path
sys.path.insert(0, str(Path(__file__).parent))

from workflow_system import enforce_workflow_discipline, require_context_review
from execution_wrapper import disciplined_execute

class TerraFusionAgentExecution:
    """TerraFusion OS Agent Execution System - Prevents Context Loss"""

    def __init__(self):
        self.agent_id = "TerraFusion_Agent_001"
        self.session_start = datetime.now()
        self.discipline_violations = 0
        self.context_reviews_completed = 0

        print("🧠 TerraFusion OS Agent Execution System Active")
        print("   MIT/PhD Level Systems Design - Context Loss Prevention")
        print("=" * 60)

    @disciplined_execute("Perform context review before action")
    def perform_context_review(self, user_query: str, attachments: list = None) -> dict:
        """Mandatory context review before any action"""

        review_result = require_context_review(user_query, attachments)
        self.context_reviews_completed += 1

        print(f"✅ Context Review Completed #{self.context_reviews_completed}")
        print(f"   Query: {user_query[:50]}...")
        print(f"   Timestamp: {review_result['timestamp']}")

        return review_result

    def validate_task_execution(self, action_description: str) -> bool:
        """Validate that action follows workflow discipline"""

        if not enforce_workflow_discipline(action_description):
            self.discipline_violations += 1
            print(f"🚨 DISCIPLINE VIOLATION #{self.discipline_violations}")
            print(f"   Action: {action_description}")
            print("   Context review or task validation failed")
            return False

        print(f"✅ Task Validation Passed: {action_description}")
        return True

    def execute_with_discipline(self, action_description: str, action_func, *args, **kwargs):
        """Execute any action with full workflow discipline"""

        try:
            # 1. Validate task execution
            if not self.validate_task_execution(action_description):
                raise WorkflowViolationError(f"Task validation failed for: {action_description}")

            # 2. Execute with discipline wrapper
            result = action_func(*args, **kwargs)

            # 3. Log successful execution
            print(f"✅ Action Completed: {action_description}")

            return result

        except Exception as e:
            print(f"❌ Action Failed: {action_description}")
            print(f"   Error: {str(e)}")
            raise

    def get_execution_status(self) -> dict:
        """Get current execution status"""

        session_duration = datetime.now() - self.session_start

        return {
            "agent_id": self.agent_id,
            "session_duration_seconds": session_duration.total_seconds(),
            "discipline_violations": self.discipline_violations,
            "context_reviews_completed": self.context_reviews_completed,
            "workflow_health": "EXCELLENT" if self.discipline_violations == 0 else "NEEDS_ATTENTION",
            "context_loss_prevention": "ACTIVE"
        }

class WorkflowViolationError(Exception):
    """Raised when workflow discipline is violated"""
    pass

# Global agent execution system
agent_execution = TerraFusionAgentExecution()

def get_agent_status():
    """Get agent execution status"""
    return agent_execution.get_execution_status()

if __name__ == "__main__":
    # Test the agent execution system
    status = get_agent_status()
    print("\n🤖 Agent Execution Status:")
    print(f"   Agent ID: {status['agent_id']}")
    print(f"   Workflow Health: {status['workflow_health']}")
    print(f"   Discipline Violations: {status['discipline_violations']}")
    print(f"   Context Loss Prevention: {status['context_loss_prevention']}")
    print("\n✅ TerraFusion OS Agent Execution System Ready")