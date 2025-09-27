#!/usr/bin/env python3
"""
TerraFusion OS Execution Wrapper
Enforces workflow discipline for all AI agent actions
"""

import sys
import os
from pathlib import Path

# Add TerraFusion OS to path
sys.path.insert(0, str(Path(__file__).parent))

from workflow_system import enforce_workflow_discipline, require_context_review, create_execution_checkpoint

class TerraFusionExecutionWrapper:
    """Wrapper that enforces TerraFusion OS workflow discipline"""

    def __init__(self):
        self.workflow_active = True

    def execute_with_discipline(self, action_description: str, action_function, *args, **kwargs):
        """Execute action with workflow discipline enforcement"""

        if not self.workflow_active:
            return action_function(*args, **kwargs)

        # 1. Enforce workflow discipline
        if not enforce_workflow_discipline(action_description):
            raise WorkflowDisciplineViolation(
                f"Workflow discipline violation for action: {action_description}"
            )

        # 2. Create execution checkpoint
        checkpoint_data = {
            "action": action_description,
            "args": str(args),
            "kwargs": str(kwargs)
        }
        checkpoint_id = create_execution_checkpoint(
            f"pre_{action_description.replace(' ', '_')}",
            checkpoint_data
        )

        try:
            # 3. Execute the action
            result = action_function(*args, **kwargs)

            # 4. Create post-execution checkpoint
            create_execution_checkpoint(
                f"post_{action_description.replace(' ', '_')}",
                {"result": "success", "checkpoint_id": checkpoint_id}
            )

            return result

        except Exception as e:
            # Create failure checkpoint
            create_execution_checkpoint(
                f"failed_{action_description.replace(' ', '_')}",
                {"error": str(e), "checkpoint_id": checkpoint_id}
            )
            raise

    def require_context_review(self, user_instructions: str, attachments: list = None):
        """Require context review before any action"""
        return require_context_review(user_instructions, attachments)

class WorkflowDisciplineViolation(Exception):
    """Raised when workflow discipline is violated"""
    pass

# Global execution wrapper
execution_wrapper = TerraFusionExecutionWrapper()

def disciplined_execute(action_description: str):
    """Decorator to enforce workflow discipline on functions"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            return execution_wrapper.execute_with_discipline(
                action_description, func, *args, **kwargs
            )
        return wrapper
    return decorator

# Export for use in other modules
__all__ = [
    'execution_wrapper',
    'disciplined_execute',
    'WorkflowDisciplineViolation'
]