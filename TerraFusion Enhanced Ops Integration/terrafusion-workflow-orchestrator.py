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
import redis
import requests

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
    stdout: str
    stderr: str
    duration: float
    status: StepStatus
    artifacts: List[str] = None


class TerraFusionOrchestrator:
    def __init__(self, inventory_path: str = "ops/inventory-terrafusion.yaml"):
        self.inventory_path = Path(inventory_path)
        self.inventory = self._load_inventory()
        self.workflows = self.inventory.get('workflows', {})
        self.scripts = self.inventory.get('scripts', {})
        self.settings = self.inventory.get('settings', {})
        
        # Redis for coordination
        self.redis_client = None
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                decode_responses=True
            )
            self.redis_client.ping()
            logger.info("Connected to Redis for coordination")
        except Exception as e:
            logger.warning(f"Redis not available: {e}")
        
        # Execution context
        self.execution_id = f"exec-{datetime.now().strftime('%Y%m%d-%H%M%S')}-{os.getpid()}"
        self.county = os.getenv('TF_COUNTY', '')
        self.ai_monitor = os.getenv('TF_AI_MONITOR', 'enabled') == 'enabled'
        
    def _load_inventory(self) -> Dict:
        """Load the inventory YAML file"""
        if not self.inventory_path.exists():
            raise FileNotFoundError(f"Inventory not found: {self.inventory_path}")
        
        with open(self.inventory_path) as f:
            return yaml.safe_load(f)
    
    async def execute_workflow(self, workflow_name: str, params: Dict = None) -> Dict:
        """Execute a complete workflow"""
        if workflow_name not in self.workflows:
            raise ValueError(f"Workflow '{workflow_name}' not found")
        
        workflow = self.workflows[workflow_name]
        logger.info(f"Starting workflow: {workflow_name} [{self.execution_id}]")
        
        # Check for approval requirement
        if workflow.get('approval_required'):
            if not await self._get_approval(workflow_name):
                logger.warning(f"Workflow {workflow_name} not approved")
                return {'status': 'cancelled', 'reason': 'approval_denied'}
        
        # Initialize workflow state
        state = {
            'workflow': workflow_name,
            'execution_id': self.execution_id,
            'started_at': datetime.now().isoformat(),
            'steps': [],
            'status': 'running',
            'params': params or {}
        }
        
        # Store in Redis if available
        if self.redis_client:
            self.redis_client.setex(
                f"workflow:{self.execution_id}",
                3600,  # 1 hour TTL
                json.dumps(state)
            )
        
        # Execute steps
        try:
            for step in workflow.get('steps', []):
                result = await self._execute_step(step, state)
                state['steps'].append(result)
                
                # Check for failure
                if result['status'] == StepStatus.FAILED.value:
                    if not step.get('continue_on_error', False):
                        state['status'] = 'failed'
                        break
            
            if state['status'] == 'running':
                state['status'] = 'success'
                
        except Exception as e:
            logger.error(f"Workflow failed: {e}")
            state['status'] = 'failed'
            state['error'] = str(e)
        
        finally:
            state['ended_at'] = datetime.now().isoformat()
            
            # Generate report
            self._generate_report(state)
            
            # Send notifications
            await self._send_notifications(state)
        
        return state
    
    async def _execute_step(self, step: Dict, workflow_state: Dict) -> Dict:
        """Execute a single workflow step"""
        # Handle parallel execution
        if 'parallel' in step:
            return await self._execute_parallel_steps(step['parallel'], workflow_state)
        
        # Regular script execution
        script_name = step.get('script')
        if not script_name:
            raise ValueError("Step missing 'script' field")
        
        if script_name not in self.scripts:
            raise ValueError(f"Script '{script_name}' not found in inventory")
        
        script_config = self.scripts[script_name]
        script_path = script_config['path']
        
        logger.info(f"Executing step: {script_name}")
        
        # Check pre-conditions
        if not self._check_preconditions(script_config):
            logger.warning(f"Preconditions failed for {script_name}")
            return {
                'script': script_name,
                'status': StepStatus.SKIPPED.value,
                'reason': 'preconditions_failed'
            }
        
        # Manual trigger check
        if step.get('manual_trigger'):
            if not await self._wait_for_manual_trigger(script_name):
                return {
                    'script': script_name,
                    'status': StepStatus.SKIPPED.value,
                    'reason': 'manual_trigger_cancelled'
                }
        
        # Execute the script
        start_time = time.time()
        
        # Build command
        cmd = ["bash", "ops/shims/safe-run-tf.sh", script_name, "execute"]
        
        # Add parameters
        params = {**workflow_state.get('params', {}), **step.get('params', {})}
        env = os.environ.copy()
        env.update(script_config.get('env', {}))
        
        for key, value in params.items():
            env[f"PARAM_{key.upper()}"] = str(value)
        
        # Add TerraFusion context
        env['TF_EXECUTION_ID'] = self.execution_id
        env['TF_WORKFLOW'] = workflow_state['workflow']
        if self.county:
            env['TF_COUNTY'] = self.county
        
        # Execute
        try:
            result = subprocess.run(
                cmd,
                env=env,
                capture_output=True,
                text=True,
                timeout=script_config.get('timeout', 600)
            )
            
            duration = time.time() - start_time
            
            # Collect artifacts
            artifacts = self._collect_artifacts(script_config, script_name)
            
            return {
                'script': script_name,
                'exit_code': result.returncode,
                'stdout': result.stdout[-10000:],  # Last 10KB
                'stderr': result.stderr[-10000:],
                'duration': duration,
                'status': StepStatus.SUCCESS.value if result.returncode == 0 else StepStatus.FAILED.value,
                'artifacts': artifacts
            }
            
        except subprocess.TimeoutExpired:
            logger.error(f"Script {script_name} timed out")
            return {
                'script': script_name,
                'status': StepStatus.FAILED.value,
                'error': 'timeout',
                'duration': time.time() - start_time
            }
        except Exception as e:
            logger.error(f"Script {script_name} failed: {e}")
            return {
                'script': script_name,
                'status': StepStatus.FAILED.value,
                'error': str(e),
                'duration': time.time() - start_time
            }
    
    async def _execute_parallel_steps(self, steps: List, workflow_state: Dict) -> Dict:
        """Execute multiple steps in parallel"""
        logger.info(f"Executing {len(steps)} steps in parallel")
        
        with ThreadPoolExecutor(max_workers=self.settings.get('max_parallel_jobs', 10)) as executor:
            futures = []
            for step in steps:
                future = executor.submit(
                    asyncio.run,
                    self._execute_step(step, workflow_state)
                )
                futures.append((step, future))
            
            results = []
            for step, future in futures:
                try:
                    result = future.result(timeout=3600)  # 1 hour max
                    results.append(result)
                except Exception as e:
                    logger.error(f"Parallel step failed: {e}")
                    results.append({
                        'script': step.get('script', 'unknown'),
                        'status': StepStatus.FAILED.value,
                        'error': str(e)
                    })
        
        return {
            'parallel': True,
            'steps': results,
            'status': StepStatus.SUCCESS.value if all(
                r['status'] == StepStatus.SUCCESS.value for r in results
            ) else StepStatus.FAILED.value
        }
    
    def _check_preconditions(self, script_config: Dict) -> bool:
        """Check script preconditions"""
        for check in script_config.get('pre_checks', []):
            try:
                result = subprocess.run(
                    check,
                    shell=True,
                    capture_output=True,
                    timeout=10
                )
                if result.returncode != 0:
                    logger.warning(f"Precondition failed: {check}")
                    return False
            except Exception as e:
                logger.warning(f"Precondition check error: {e}")
                return False
        return True
    
    def _collect_artifacts(self, script_config: Dict, script_name: str) -> List[str]:
        """Collect artifacts generated by a script"""
        artifacts = []
        artifact_dir = Path(f"./var/artifacts/{script_name}")
        
        if artifact_dir.exists():
            # Find most recent artifact directory
            dirs = sorted(artifact_dir.glob("*"), key=lambda p: p.stat().st_mtime, reverse=True)
            if dirs:
                latest_dir = dirs[0]
                for file in latest_dir.rglob("*"):
                    if file.is_file():
                        artifacts.append(str(file))
        
        return artifacts
    
    async def _get_approval(self, workflow_name: str) -> bool:
        """Get approval for a workflow"""
        logger.info(f"Requesting approval for workflow: {workflow_name}")
        
        # Check for approval file
        approval_file = Path(f".approvals/{workflow_name}.approved")
        if approval_file.exists():
            # Check if approval is recent (within 1 hour)
            if time.time() - approval_file.stat().st_mtime < 3600:
                logger.info("Using cached approval")
                return True
        
        # Send approval request notification
        if self.ai_monitor:
            self._notify_approval_request(workflow_name)
        
        # Wait for approval (with timeout)
        timeout = 300  # 5 minutes
        start = time.time()
        
        while time.time() - start < timeout:
            if approval_file.exists():
                return True
            await asyncio.sleep(5)
        
        logger.warning(f"Approval timeout for {workflow_name}")
        return False
    
    async def _wait_for_manual_trigger(self, script_name: str) -> bool:
        """Wait for manual trigger confirmation"""
        logger.info(f"Waiting for manual trigger: {script_name}")
        
        print(f"\n⚠️  Manual trigger required for: {script_name}")
        print("Press ENTER to continue or 'q' to cancel: ", end='')
        
        try:
            response = input()
            return response.lower() != 'q'
        except KeyboardInterrupt:
            return False
    
    def _generate_report(self, state: Dict):
        """Generate workflow execution report"""
        report_dir = Path("./var/reports")
        report_dir.mkdir(parents=True, exist_ok=True)
        
        report_file = report_dir / f"workflow-{state['execution_id']}.json"
        
        with open(report_file, 'w') as f:
            json.dump(state, f, indent=2, default=str)
        
        logger.info(f"Report saved: {report_file}")
        
        # Generate markdown summary
        md_file = report_dir / f"workflow-{state['execution_id']}.md"
        with open(md_file, 'w') as f:
            f.write(f"# Workflow Execution Report\n\n")
            f.write(f"**Workflow:** {state['workflow']}\n")
            f.write(f"**Execution ID:** {state['execution_id']}\n")
            f.write(f"**Status:** {state['status']}\n")
            f.write(f"**Started:** {state.get('started_at')}\n")
            f.write(f"**Ended:** {state.get('ended_at')}\n\n")
            
            f.write("## Steps\n\n")
            for step in state.get('steps', []):
                if isinstance(step, dict):
                    if step.get('parallel'):
                        f.write("### Parallel Execution\n")
                        for substep in step.get('steps', []):
                            self._write_step_to_report(f, substep)
                    else:
                        self._write_step_to_report(f, step)
            
            if state.get('error'):
                f.write(f"\n## Error\n\n```\n{state['error']}\n```\n")
    
    def _write_step_to_report(self, f, step: Dict):
        """Write a single step to the report"""
        status_emoji = {
            'success': '✅',
            'failed': '❌',
            'skipped': '⏭️',
            'running': '🔄'
        }
        
        emoji = status_emoji.get(step.get('status'), '❓')
        f.write(f"- {emoji} **{step.get('script', 'unknown')}**")
        
        if step.get('duration'):
            f.write(f" ({step['duration']:.2f}s)")
        
        if step.get('error'):
            f.write(f"\n  - Error: {step['error']}")
        
        if step.get('artifacts'):
            f.write(f"\n  - Artifacts: {len(step['artifacts'])} files")
        
        f.write("\n")
    
    async def _send_notifications(self, state: Dict):
        """Send workflow completion notifications"""
        if not self.settings.get('notifications'):
            return
        
        # Determine notification level
        if state['status'] == 'failed':
            level = 'critical'
        elif state['status'] == 'success':
            level = 'info'
        else:
            level = 'warning'
        
        # Send to Slack
        if self.settings.get('notifications', {}).get('slack'):
            await self._send_slack_notification(state, level)
        
        # Trigger AI monitoring if enabled
        if self.ai_monitor and state['status'] == 'failed':
            self._trigger_ai_investigation(state)
    
    async def _send_slack_notification(self, state: Dict, level: str):
        """Send notification to Slack"""
        webhook_url = os.getenv('SLACK_WEBHOOK_URL')
        if not webhook_url:
            return
        
        color = {
            'critical': 'danger',
            'warning': 'warning',
            'info': 'good'
        }.get(level, 'default')
        
        message = {
            'attachments': [{
                'color': color,
                'title': f"Workflow: {state['workflow']}",
                'fields': [
                    {'title': 'Status', 'value': state['status'], 'short': True},
                    {'title': 'Execution ID', 'value': state['execution_id'], 'short': True},
                    {'title': 'Duration', 'value': self._calculate_duration(state), 'short': True},
                    {'title': 'County', 'value': self.county or 'N/A', 'short': True}
                ],
                'footer': 'TerraFusion Orchestrator',
                'ts': int(time.time())
            }]
        }
        
        try:
            requests.post(webhook_url, json=message, timeout=5)
        except Exception as e:
            logger.error(f"Failed to send Slack notification: {e}")
    
    def _calculate_duration(self, state: Dict) -> str:
        """Calculate workflow duration"""
        if 'started_at' in state and 'ended_at' in state:
            start = datetime.fromisoformat(state['started_at'])
            end = datetime.fromisoformat(state['ended_at'])
            duration = (end - start).total_seconds()
            return f"{duration:.2f}s"
        return "N/A"
    
    def _trigger_ai_investigation(self, state: Dict):
        """Trigger AI agents to investigate failure"""
        if not self.ai_monitor:
            return
        
        logger.info("Triggering AI investigation of workflow failure")
        
        # Send to AI swarm for analysis
        investigation_request = {
            'type': 'workflow_failure',
            'workflow': state['workflow'],
            'execution_id': state['execution_id'],
            'status': state['status'],
            'error': state.get('error'),
            'failed_steps': [
                s for s in state.get('steps', [])
                if isinstance(s, dict) and s.get('status') == 'failed'
            ]
        }
        
        # Publish to Redis for AI agents
        if self.redis_client:
            self.redis_client.publish(
                'terrafusion:ai:investigate',
                json.dumps(investigation_request)
            )
    
    def _notify_approval_request(self, workflow_name: str):
        """Send approval request notification"""
        logger.info(f"Sending approval request for {workflow_name}")
        
        # This would integrate with your approval system
        # For now, just log it
        approval_request = {
            'workflow': workflow_name,
            'execution_id': self.execution_id,
            'requested_at': datetime.now().isoformat(),
            'requested_by': os.getenv('USER', 'unknown')
        }
        
        if self.redis_client:
            self.redis_client.publish(
                'terrafusion:approvals:request',
                json.dumps(approval_request)
            )


async def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='TerraFusion Workflow Orchestrator')
    parser.add_argument('workflow', help='Workflow name to execute')
    parser.add_argument('--inventory', default='ops/inventory-terrafusion.yaml',
                       help='Path to inventory file')
    parser.add_argument('--params', type=json.loads, default={},
                       help='JSON parameters for workflow')
    parser.add_argument('--county', help='County context')
    parser.add_argument('--no-ai-monitor', action='store_true',
                       help='Disable AI monitoring')
    
    args = parser.parse_args()
    
    # Set environment
    if args.county:
        os.environ['TF_COUNTY'] = args.county
    if args.no_ai_monitor:
        os.environ['TF_AI_MONITOR'] = 'disabled'
    
    # Create orchestrator
    orchestrator = TerraFusionOrchestrator(args.inventory)
    
    # Execute workflow
    try:
        result = await orchestrator.execute_workflow(args.workflow, args.params)
        
        # Print summary
        print(f"\nWorkflow completed: {result['status']}")
        print(f"Execution ID: {result['execution_id']}")
        
        # Exit with appropriate code
        sys.exit(0 if result['status'] == 'success' else 1)
        
    except Exception as e:
        logger.error(f"Orchestrator failed: {e}")
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())