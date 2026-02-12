"""
SAGA Pattern Orchestrator
Implements distributed transaction management with automatic rollback patterns
"""
import uuid
import json
import time
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, asdict, field
import threading
import pickle
import os

logger = logging.getLogger(__name__)

class SagaStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATING = "compensating"
    CANCELLED = "cancelled"

class StepStatus(Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    COMPENSATED = "compensated"

@dataclass
class SagaStep:
    step_id: str
    name: str
    action: str
    compensation: str
    status: StepStatus = StepStatus.PENDING
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    retry_count: int = 0
    max_retries: int = 3

@dataclass
class SagaTransaction:
    saga_id: str
    name: str
    status: SagaStatus
    steps: List[SagaStep]
    current_step: int = 0
    context: Dict[str, Any] = field(default_factory=dict)
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    rollback_reason: Optional[str] = None

class SagaOrchestrator:
    def __init__(self, persistence_path: str = "saga_state"):
        self.active_sagas: Dict[str, SagaTransaction] = {}
        self.persistence_path = persistence_path
        self.step_handlers: Dict[str, Callable] = {}
        self.compensation_handlers: Dict[str, Callable] = {}
        self._lock = threading.RLock()
        
        # Load persisted state
        self._load_state()
        
        # Register built-in handlers
        self._register_builtin_handlers()
        
        logger.info("SAGA Orchestrator initialized")

    def _load_state(self):
        """Load persisted SAGA state from disk"""
        try:
            if os.path.exists(self.persistence_path):
                with open(self.persistence_path, 'rb') as f:
                    self.active_sagas = pickle.load(f)
                logger.info(f"Loaded {len(self.active_sagas)} persisted SAGAs")
            else:
                logger.info("No persisted SAGA state found, starting fresh")
        except Exception as e:
            logger.error(f"Failed to load SAGA state: {e}")
            self.active_sagas = {}

    def _save_state(self):
        """Persist SAGA state to disk"""
        try:
            os.makedirs(os.path.dirname(self.persistence_path) if os.path.dirname(self.persistence_path) else ".", exist_ok=True)
            with open(self.persistence_path, 'wb') as f:
                pickle.dump(self.active_sagas, f)
        except Exception as e:
            logger.error(f"Failed to save SAGA state: {e}")

    def _register_builtin_handlers(self):
        """Register built-in step and compensation handlers"""
        # PACS conversion handlers
        self.register_step_handler("pacs_validate_connection", self._handle_pacs_validate)
        self.register_step_handler("pacs_extract_data", self._handle_pacs_extract)
        self.register_step_handler("pacs_transform_data", self._handle_pacs_transform)
        self.register_step_handler("pacs_validate_data", self._handle_pacs_validate_data)
        self.register_step_handler("pacs_load_data", self._handle_pacs_load)
        
        # Compensation handlers
        self.register_compensation_handler("pacs_validate_connection", self._compensate_pacs_validate)
        self.register_compensation_handler("pacs_extract_data", self._compensate_pacs_extract)
        self.register_compensation_handler("pacs_transform_data", self._compensate_pacs_transform)
        self.register_compensation_handler("pacs_validate_data", self._compensate_pacs_validate_data)
        self.register_compensation_handler("pacs_load_data", self._compensate_pacs_load)

    def register_step_handler(self, action: str, handler: Callable):
        """Register a handler for a specific action"""
        self.step_handlers[action] = handler

    def register_compensation_handler(self, action: str, handler: Callable):
        """Register a compensation handler for a specific action"""
        self.compensation_handlers[action] = handler

    def start_saga(self, name: str, steps: List[Dict[str, Any]], context: Dict[str, Any] = None) -> str:
        """Start a new SAGA transaction"""
        saga_id = str(uuid.uuid4())
        
        saga_steps = []
        for i, step_config in enumerate(steps):
            step = SagaStep(
                step_id=f"{saga_id}_{i}",
                name=step_config["name"],
                action=step_config["action"],
                compensation=step_config.get("compensation", ""),
                max_retries=step_config.get("max_retries", 3)
            )
            saga_steps.append(step)

        saga_context = context if context is not None else {}
        saga = SagaTransaction(
            saga_id=saga_id,
            name=name,
            status=SagaStatus.PENDING,
            steps=saga_steps,
            context=saga_context,
            created_at=datetime.utcnow()
        )

        with self._lock:
            self.active_sagas[saga_id] = saga
            self._save_state()

        # Start execution in background thread
        threading.Thread(target=self._execute_saga, args=(saga_id,), daemon=True).start()
        
        logger.info(f"Started SAGA {saga_id}: {name}")
        return saga_id

    def _execute_saga(self, saga_id: str):
        """Execute a SAGA transaction"""
        with self._lock:
            saga = self.active_sagas.get(saga_id)
            if not saga:
                return

            saga.status = SagaStatus.RUNNING
            saga.started_at = datetime.utcnow()

        try:
            # Execute steps sequentially
            for i, step in enumerate(saga.steps):
                saga.current_step = i
                
                if not self._execute_step(saga, step):
                    # Step failed, start compensation
                    self._compensate_saga(saga)
                    return

            # All steps completed successfully
            with self._lock:
                saga.status = SagaStatus.COMPLETED
                saga.completed_at = datetime.utcnow()
                self._save_state()
                
            logger.info(f"SAGA {saga_id} completed successfully")

        except Exception as e:
            logger.error(f"SAGA {saga_id} failed with exception: {e}")
            with self._lock:
                saga.status = SagaStatus.FAILED
                saga.error = str(e)
                saga.completed_at = datetime.utcnow()
                self._save_state()

    def _execute_step(self, saga: SagaTransaction, step: SagaStep) -> bool:
        """Execute a single step in the SAGA"""
        step.status = StepStatus.RUNNING
        step.started_at = datetime.utcnow()
        
        handler = self.step_handlers.get(step.action)
        if not handler:
            step.status = StepStatus.FAILED
            step.error = f"No handler registered for action: {step.action}"
            step.completed_at = datetime.utcnow()
            return False

        max_retries = step.max_retries
        for attempt in range(max_retries + 1):
            try:
                step.retry_count = attempt
                result = handler(saga.context, step)
                
                step.status = StepStatus.COMPLETED
                step.result = result
                step.completed_at = datetime.utcnow()
                
                with self._lock:
                    self._save_state()
                
                logger.info(f"Step {step.name} completed successfully")
                return True
                
            except Exception as e:
                step.error = str(e)
                logger.warning(f"Step {step.name} failed (attempt {attempt + 1}/{max_retries + 1}): {e}")
                
                if attempt < max_retries:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    step.status = StepStatus.FAILED
                    step.completed_at = datetime.utcnow()
                    
                    with self._lock:
                        self._save_state()
                    
                    return False
        
        return False

    def _compensate_saga(self, saga: SagaTransaction):
        """Execute compensation for all completed steps"""
        saga.status = SagaStatus.COMPENSATING
        
        # Compensate completed steps in reverse order
        completed_steps = [s for s in saga.steps if s.status == StepStatus.COMPLETED]
        completed_steps.reverse()
        
        for step in completed_steps:
            self._compensate_step(saga, step)
        
        saga.status = SagaStatus.CANCELLED
        saga.completed_at = datetime.utcnow()
        
        with self._lock:
            self._save_state()
        
        logger.info(f"SAGA {saga.saga_id} compensated and cancelled")

    def _compensate_step(self, saga: SagaTransaction, step: SagaStep):
        """Execute compensation for a single step"""
        handler = self.compensation_handlers.get(step.action)
        if not handler:
            logger.warning(f"No compensation handler for step: {step.name}")
            return

        try:
            handler(saga.context, step)
            step.status = StepStatus.COMPENSATED
            logger.info(f"Step {step.name} compensated successfully")
        except Exception as e:
            logger.error(f"Failed to compensate step {step.name}: {e}")

    def get_saga_status(self, saga_id: str) -> Optional[Dict[str, Any]]:
        """Get status of a SAGA transaction"""
        saga = self.active_sagas.get(saga_id)
        if not saga:
            return None

        return {
            "saga_id": saga.saga_id,
            "name": saga.name,
            "status": saga.status.value,
            "current_step": saga.current_step,
            "total_steps": len(saga.steps),
            "created_at": saga.created_at.isoformat() if saga.created_at else None,
            "started_at": saga.started_at.isoformat() if saga.started_at else None,
            "completed_at": saga.completed_at.isoformat() if saga.completed_at else None,
            "error": saga.error,
            "steps": [
                {
                    "step_id": step.step_id,
                    "name": step.name,
                    "status": step.status.value,
                    "error": step.error,
                    "retry_count": step.retry_count,
                    "started_at": step.started_at.isoformat() if step.started_at else None,
                    "completed_at": step.completed_at.isoformat() if step.completed_at else None
                }
                for step in saga.steps
            ]
        }

    def list_active_workflows(self) -> List[Dict[str, Any]]:
        """List all active SAGA workflows"""
        workflows = []
        for saga_id, saga in self.active_sagas.items():
            workflows.append({
                "saga_id": saga_id,
                "name": saga.name,
                "status": saga.status.value,
                "current_step": saga.current_step,
                "total_steps": len(saga.steps),
                "created_at": saga.created_at.isoformat() if saga.created_at else None
            })
        return workflows

    def list_active_sagas(self) -> List[Dict[str, Any]]:
        """List all active SAGA workflows"""
        workflows = []
        for saga in self.active_sagas.values():
            if saga.status in [SagaStatus.PENDING, SagaStatus.RUNNING, SagaStatus.COMPENSATING]:
                workflows.append({
                    "saga_id": saga.saga_id,
                    "name": saga.name,
                    "status": saga.status.value,
                    "progress": f"{saga.current_step}/{len(saga.steps)}",
                    "created_at": saga.created_at.isoformat() if saga.created_at else None
                })
        return workflows

    def cancel_saga(self, saga_id: str) -> bool:
        """Cancel a running SAGA"""
        saga = self.active_sagas.get(saga_id)
        if not saga or saga.status not in [SagaStatus.PENDING, SagaStatus.RUNNING]:
            return False

        saga.rollback_reason = "User cancelled"
        self._compensate_saga(saga)
        return True

    # Built-in step handlers for PACS conversion
    def _handle_pacs_validate(self, context: Dict[str, Any], step: SagaStep) -> Dict[str, Any]:
        """Validate PACS connection"""
        # Simulate validation logic
        time.sleep(0.5)  # Simulate processing time
        return {"connection_valid": True, "server_version": "12.3.1"}

    def _handle_pacs_extract(self, context: Dict[str, Any], step: SagaStep) -> Dict[str, Any]:
        """Extract data from PACS system"""
        time.sleep(2.0)  # Simulate extraction time
        return {"records_extracted": 15000, "extraction_time": 2.0}

    def _handle_pacs_transform(self, context: Dict[str, Any], step: SagaStep) -> Dict[str, Any]:
        """Transform PACS data"""
        time.sleep(1.5)  # Simulate transformation time
        return {"records_transformed": 15000, "validation_errors": 12}

    def _handle_pacs_validate_data(self, context: Dict[str, Any], step: SagaStep) -> Dict[str, Any]:
        """Validate transformed data"""
        time.sleep(1.0)  # Simulate validation time
        return {"validation_passed": True, "quality_score": 99.2}

    def _handle_pacs_load(self, context: Dict[str, Any], step: SagaStep) -> Dict[str, Any]:
        """Load data into target system"""
        time.sleep(3.0)  # Simulate loading time
        return {"records_loaded": 15000, "load_time": 3.0}

    # Compensation handlers
    def _compensate_pacs_validate(self, context: Dict[str, Any], step: SagaStep):
        """Compensate PACS validation"""
        logger.info("Compensating PACS validation - closing connections")

    def _compensate_pacs_extract(self, context: Dict[str, Any], step: SagaStep):
        """Compensate PACS extraction"""
        logger.info("Compensating PACS extraction - cleaning temporary files")

    def _compensate_pacs_transform(self, context: Dict[str, Any], step: SagaStep):
        """Compensate PACS transformation"""
        logger.info("Compensating PACS transformation - reverting data changes")

    def _compensate_pacs_validate_data(self, context: Dict[str, Any], step: SagaStep):
        """Compensate PACS data validation"""
        logger.info("Compensating PACS data validation - clearing validation cache")

    def _compensate_pacs_load(self, context: Dict[str, Any], step: SagaStep):
        """Compensate PACS data load"""
        logger.info("Compensating PACS data load - rolling back database changes")

    def start_pacs_migration(self, config: Dict[str, Any]) -> str:
        """Start a complete PACS migration workflow"""
        steps = [
            {"name": "Validate Connection", "action": "pacs_validate_connection"},
            {"name": "Extract Data", "action": "pacs_extract_data"},
            {"name": "Transform Data", "action": "pacs_transform_data"},
            {"name": "Validate Data", "action": "pacs_validate_data"},
            {"name": "Load Data", "action": "pacs_load_data"}
        ]
        
        return self.start_saga("PACS Migration", steps, config)

    def start_property_update(self, config: Dict[str, Any]) -> str:
        """Start property assessment update workflow"""
        steps = [
            {"name": "Backup Current Data", "action": "backup_property_data"},
            {"name": "Update Assessments", "action": "update_property_assessments"},
            {"name": "Validate Updates", "action": "validate_property_updates"},
            {"name": "Notify Stakeholders", "action": "notify_property_updates"}
        ]
        
        return self.start_saga("Property Update", steps, config)

    def start_bulk_import(self, config: Dict[str, Any]) -> str:
        """Start bulk data import workflow"""
        steps = [
            {"name": "Validate Import File", "action": "validate_import_file"},
            {"name": "Parse Data", "action": "parse_import_data"},
            {"name": "Transform Records", "action": "transform_import_records"},
            {"name": "Import Data", "action": "import_bulk_data"}
        ]
        
        return self.start_saga("Bulk Import", steps, config)

# Global instance
saga_orchestrator = SagaOrchestrator()