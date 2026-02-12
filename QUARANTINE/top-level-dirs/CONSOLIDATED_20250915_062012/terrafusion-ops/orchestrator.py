#!/usr/bin/env python3
"""
ops/orchestrator.py
TerraFusion Workflow Orchestrator - Executes complex multi-step workflows
with parallel execution, approvals, and AI agent coordination
"""

import yaml
import json
import asyncio
import subprocess
import sys
import os
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] [%(name)s] %(message)s',
    handlers=[
        logging.FileHandler('./var/log/ops/orchestrator.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('TerraFusionOrchestrator')


class StepStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"
    APPROVED = "approved"
    WAITING_APPROVAL = "waiting_approval"


@dataclass
class ScriptResult:
    name: str
    exit_code: int
    duration: float
    output: str
    error: str


@dataclass
class WorkflowStep:
    name: str
    script_name: str
    status: StepStatus = StepStatus.PENDING
    result: Optional[ScriptResult] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class TerraFusionOrchestrator:
    def __init__(self, inventory_path: str = "ops/inventory-terrafusion.yaml"):
        self.inventory_path = inventory_path
        self.inventory = {}
        self.load_inventory()
        
        # State tracking
        self.active_workflows = {}
        self.execution_history = []
        
        # Configuration
        self.enable_ai_monitoring = True
        self.enable_slack_notifications = True
        self.max_parallel_executions = 3
        
    def load_inventory(self):
        """Load the TerraFusion operations inventory"""
        try:
            with open(self.inventory_path, 'r') as f:
                self.inventory = yaml.safe_load(f)
            logger.info(f"Loaded inventory from {self.inventory_path}")
        except Exception as e:
            logger.error(f"Failed to load inventory: {e}")
            raise
    
    def execute_script(self, script_name: str, params: Dict = None) -> ScriptResult:
        """Execute a single script using the safe-run wrapper"""
        if script_name not in self.inventory.get('scripts', {}):
            raise ValueError(f"Script '{script_name}' not found in inventory")
        
        script_config = self.inventory['scripts'][script_name]
        
        # Prepare environment
        env = os.environ.copy()
        if params:
            for key, value in params.items():
                env[f"TF_{key.upper()}"] = str(value)
        
        # Add script-specific environment variables
        if 'env' in script_config:
            env.update(script_config['env'])
        
        # Execute using safe-run wrapper
        cmd = [
            'bash', 
            'ops/shims/safe-run-tf.sh', 
            script_name, 
            'execute'
        ]
        
        logger.info(f"Executing script: {script_name}")
        start_time = time.time()
        
        try:
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=script_config.get('timeout', 600)
            )
            
            duration = time.time() - start_time
            
            script_result = ScriptResult(
                name=script_name,
                exit_code=result.returncode,
                duration=duration,
                output=result.stdout,
                error=result.stderr
            )
            
            if result.returncode == 0:
                logger.info(f"Script completed successfully: {script_name} ({duration:.2f}s)")
            else:
                logger.error(f"Script failed: {script_name} (exit code: {result.returncode})")
            
            return script_result
            
        except subprocess.TimeoutExpired:
            duration = time.time() - start_time
            logger.error(f"Script timed out: {script_name} ({duration:.2f}s)")
            return ScriptResult(
                name=script_name,
                exit_code=124,
                duration=duration,
                output="",
                error="Script execution timed out"
            )
        except Exception as e:
            duration = time.time() - start_time
            logger.error(f"Script execution failed: {script_name} - {e}")
            return ScriptResult(
                name=script_name,
                exit_code=1,
                duration=duration,
                output="",
                error=str(e)
            )
    
    def execute_workflow(self, workflow_name: str, params: Dict = None) -> bool:
        """Execute a complete workflow"""
        if workflow_name not in self.inventory.get('workflows', {}):
            raise ValueError(f"Workflow '{workflow_name}' not found in inventory")
        
        workflow_config = self.inventory['workflows'][workflow_name]
        steps = workflow_config['steps']
        
        logger.info(f"Starting workflow: {workflow_name}")
        
        # Create workflow steps
        workflow_steps = []
        for step_name in steps:
            step = WorkflowStep(
                name=step_name,
                script_name=step_name
            )
            workflow_steps.append(step)
        
        # Track workflow
        workflow_id = f"{workflow_name}_{int(time.time())}"
        self.active_workflows[workflow_id] = {
            'name': workflow_name,
            'steps': workflow_steps,
            'started_at': datetime.now(),
            'status': 'running'
        }
        
        success = True
        
        # Check if workflow requires approval
        if workflow_config.get('requires_approval', False):
            logger.info(f"Workflow requires approval: {workflow_name}")
            if not self.request_approval(workflow_name):
                logger.info(f"Workflow approval denied: {workflow_name}")
                return False
        
        # Execute steps
        if workflow_config.get('parallel', False):
            success = self.execute_steps_parallel(workflow_steps, params)
        else:
            success = self.execute_steps_sequential(workflow_steps, params)
        
        # Update workflow status
        self.active_workflows[workflow_id]['status'] = 'completed' if success else 'failed'
        self.active_workflows[workflow_id]['completed_at'] = datetime.now()
        
        logger.info(f"Workflow completed: {workflow_name} (success: {success})")
        return success
    
    def execute_steps_sequential(self, steps: List[WorkflowStep], params: Dict = None) -> bool:
        """Execute workflow steps sequentially"""
        for step in steps:
            step.status = StepStatus.RUNNING
            step.started_at = datetime.now()
            
            try:
                result = self.execute_script(step.script_name, params)
                step.result = result
                step.completed_at = datetime.now()
                
                if result.exit_code == 0:
                    step.status = StepStatus.SUCCESS
                else:
                    step.status = StepStatus.FAILED
                    logger.error(f"Step failed: {step.name}")
                    return False
                    
            except Exception as e:
                step.status = StepStatus.FAILED
                step.completed_at = datetime.now()
                logger.error(f"Step execution failed: {step.name} - {e}")
                return False
        
        return True
    
    def execute_steps_parallel(self, steps: List[WorkflowStep], params: Dict = None) -> bool:
        """Execute workflow steps in parallel"""
        with ThreadPoolExecutor(max_workers=self.max_parallel_executions) as executor:
            # Submit all steps
            future_to_step = {}
            for step in steps:
                step.status = StepStatus.RUNNING
                step.started_at = datetime.now()
                future = executor.submit(self.execute_script, step.script_name, params)
                future_to_step[future] = step
            
            # Collect results
            success = True
            for future in as_completed(future_to_step):
                step = future_to_step[future]
                try:
                    result = future.result()
                    step.result = result
                    step.completed_at = datetime.now()
                    
                    if result.exit_code == 0:
                        step.status = StepStatus.SUCCESS
                    else:
                        step.status = StepStatus.FAILED
                        success = False
                        
                except Exception as e:
                    step.status = StepStatus.FAILED
                    step.completed_at = datetime.now()
                    success = False
                    logger.error(f"Parallel step failed: {step.name} - {e}")
            
            return success
    
    def request_approval(self, workflow_name: str) -> bool:
        """Request approval for workflow execution"""
        # In a real implementation, this would integrate with approval systems
        # For now, we'll use a simple prompt
        try:
            response = input(f"Approve execution of workflow '{workflow_name}'? (y/N): ")
            return response.lower() in ['y', 'yes']
        except KeyboardInterrupt:
            return False
    
    def get_workflow_status(self, workflow_id: str) -> Dict:
        """Get status of a workflow"""
        if workflow_id in self.active_workflows:
            return self.active_workflows[workflow_id]
        return None
    
    def list_workflows(self) -> List[str]:
        """List available workflows"""
        return list(self.inventory.get('workflows', {}).keys())
    
    def list_scripts(self) -> List[str]:
        """List available scripts"""
        return list(self.inventory.get('scripts', {}).keys())


def main():
    """Main CLI interface"""
    if len(sys.argv) < 2:
        print("Usage: python3 ops/orchestrator.py <workflow|script> [params_json]")
        print("\nAvailable workflows:")
        orchestrator = TerraFusionOrchestrator()
        for workflow in orchestrator.list_workflows():
            print(f"  - {workflow}")
        print("\nAvailable scripts:")
        for script in orchestrator.list_scripts():
            print(f"  - {script}")
        sys.exit(1)
    
    target = sys.argv[1]
    params = {}
    
    if len(sys.argv) > 2:
        try:
            params = json.loads(sys.argv[2])
        except json.JSONDecodeError:
            logger.error("Invalid JSON parameters")
            sys.exit(1)
    
    orchestrator = TerraFusionOrchestrator()
    
    # Determine if target is a workflow or script
    if target in orchestrator.list_workflows():
        success = orchestrator.execute_workflow(target, params)
        sys.exit(0 if success else 1)
    elif target in orchestrator.list_scripts():
        result = orchestrator.execute_script(target, params)
        sys.exit(result.exit_code)
    else:
        logger.error(f"Unknown target: {target}")
        sys.exit(1)


if __name__ == "__main__":
    main()