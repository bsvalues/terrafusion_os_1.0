"""
TerraFusionPlatform State Manager

This module provides centralized state management for the TerraFusionPlatform,
making data visibility and state transitions more explicit and manageable.
"""

import os
import json
import time
from typing import Dict, Any, Optional, List
import streamlit as st

class StateManager:
    """
    Centralized state manager for the TerraFusionPlatform.
    
    This class provides methods for getting and setting application state,
    as well as persisting state to disk for persistence between sessions.
    """
    
    def __init__(self):
        """Initialize the state manager."""
        # Define the path to the state file
        self.state_file = "state.json"
        
        # Initialize the state
        self._initialize_state()
    
    def _initialize_state(self) -> None:
        """Initialize application state."""
        # Check if state exists in session state
        if "app_state" not in st.session_state:
            # Check if state file exists
            if os.path.exists(self.state_file):
                # Load state from file
                with open(self.state_file, "r") as f:
                    st.session_state.app_state = json.load(f)
            else:
                # Create default state
                st.session_state.app_state = {
                    "current_phase": "planning",
                    "phase_statuses": {
                        "planning": "in_progress",
                        "solution_design": "pending",
                        "ticket_breakdown": "pending",
                        "implementation": "pending",
                        "testing": "pending",
                        "reporting": "pending"
                    },
                    "phase_data": {
                        "planning": {
                            "progress": 35,
                            "completed": False,
                            "tasks": []
                        },
                        "solution_design": {
                            "progress": 0,
                            "completed": False,
                            "tasks": []
                        },
                        "ticket_breakdown": {
                            "progress": 0,
                            "completed": False,
                            "tasks": []
                        },
                        "implementation": {
                            "progress": 0,
                            "completed": False,
                            "tasks": []
                        },
                        "testing": {
                            "progress": 0,
                            "completed": False,
                            "tasks": []
                        },
                        "reporting": {
                            "progress": 0,
                            "completed": False,
                            "tasks": []
                        }
                    },
                    "tasks": {},
                    "reports": {},
                    "system_status": {
                        "services": {
                            "backend_api": "online",
                            "database": "online",
                            "storage": "online",
                            "ai_service": "online"
                        },
                        "last_updated": time.time()
                    }
                }
                
                # Save initial state to file
                self._save_state()
    
    def _save_state(self) -> None:
        """Save the current state to disk."""
        with open(self.state_file, "w") as f:
            json.dump(st.session_state.app_state, f, indent=4)
    
    def get_current_phase(self) -> str:
        """
        Get the current phase.
        
        Returns:
            Current phase ID
        """
        return st.session_state.app_state.get("current_phase", "planning")
    
    def set_current_phase(self, phase: str) -> None:
        """
        Set the current phase.
        
        Args:
            phase: New phase ID
        """
        st.session_state.app_state["current_phase"] = phase
        self._save_state()
    
    def get_phase_statuses(self) -> Dict[str, str]:
        """
        Get all phase statuses.
        
        Returns:
            Dictionary mapping phase IDs to their statuses
        """
        return st.session_state.app_state.get("phase_statuses", {})
    
    def set_phase_status(self, phase: str, status: str) -> None:
        """
        Set the status of a specific phase.
        
        Args:
            phase: Phase ID
            status: New status ('pending', 'in_progress', 'completed')
        """
        st.session_state.app_state["phase_statuses"][phase] = status
        self._save_state()
    
    def get_phase_data(self) -> Dict[str, Dict[str, Any]]:
        """
        Get data for all phases.
        
        Returns:
            Dictionary containing phase data
        """
        return st.session_state.app_state.get("phase_data", {})
    
    def set_phase_progress(self, phase: str, progress: int) -> None:
        """
        Set the progress percentage for a specific phase.
        
        Args:
            phase: Phase ID
            progress: Progress percentage (0-100)
        """
        # Ensure progress is within bounds
        progress = max(0, min(100, progress))
        
        # Update progress
        if phase in st.session_state.app_state["phase_data"]:
            st.session_state.app_state["phase_data"][phase]["progress"] = progress
            
            # Mark as completed if progress is 100%
            if progress == 100:
                st.session_state.app_state["phase_data"][phase]["completed"] = True
            
            self._save_state()
    
    def set_phase_completed(self, phase: str, completed: bool) -> None:
        """
        Set whether a phase is completed.
        
        Args:
            phase: Phase ID
            completed: Whether the phase is completed
        """
        if phase in st.session_state.app_state["phase_data"]:
            st.session_state.app_state["phase_data"][phase]["completed"] = completed
            
            # Update progress to 100% if marked as completed
            if completed:
                st.session_state.app_state["phase_data"][phase]["progress"] = 100
            
            self._save_state()
    
    def add_task(self, phase: str, task: Dict[str, Any]) -> str:
        """
        Add a new task.
        
        Args:
            phase: Phase ID
            task: Task data
            
        Returns:
            Task ID
        """
        # Generate a task ID
        task_id = f"task_{int(time.time())}"
        
        # Initialize tasks dict if it doesn't exist
        if "tasks" not in st.session_state.app_state:
            st.session_state.app_state["tasks"] = {}
        
        # Add task
        st.session_state.app_state["tasks"][task_id] = {
            "phase": phase,
            "created_at": time.time(),
            **task
        }
        
        # Add task to phase
        if phase in st.session_state.app_state["phase_data"]:
            st.session_state.app_state["phase_data"][phase]["tasks"].append(task_id)
        
        self._save_state()
        return task_id
    
    def update_task(self, task_id: str, task_data: Dict[str, Any]) -> None:
        """
        Update a task.
        
        Args:
            task_id: Task ID
            task_data: New task data
        """
        if "tasks" in st.session_state.app_state and task_id in st.session_state.app_state["tasks"]:
            # Update task
            st.session_state.app_state["tasks"][task_id].update(task_data)
            self._save_state()
    
    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a task by ID.
        
        Args:
            task_id: Task ID
            
        Returns:
            Task data or None if not found
        """
        if "tasks" in st.session_state.app_state and task_id in st.session_state.app_state["tasks"]:
            return st.session_state.app_state["tasks"][task_id]
        return None
    
    def get_tasks_by_phase(self, phase: str) -> List[Dict[str, Any]]:
        """
        Get all tasks for a specific phase.
        
        Args:
            phase: Phase ID
            
        Returns:
            List of task data
        """
        tasks = []
        
        if "tasks" in st.session_state.app_state:
            for task_id, task_data in st.session_state.app_state["tasks"].items():
                if task_data.get("phase") == phase:
                    tasks.append({
                        "id": task_id,
                        **task_data
                    })
        
        return tasks
    
    def add_report(self, phase: str, report: Dict[str, Any]) -> str:
        """
        Add a new report.
        
        Args:
            phase: Phase ID
            report: Report data
            
        Returns:
            Report ID
        """
        # Generate a report ID
        report_id = f"report_{int(time.time())}"
        
        # Initialize reports dict if it doesn't exist
        if "reports" not in st.session_state.app_state:
            st.session_state.app_state["reports"] = {}
        
        # Add report
        st.session_state.app_state["reports"][report_id] = {
            "phase": phase,
            "created_at": time.time(),
            **report
        }
        
        self._save_state()
        return report_id
    
    def get_reports_by_phase(self, phase: str) -> List[Dict[str, Any]]:
        """
        Get all reports for a specific phase.
        
        Args:
            phase: Phase ID
            
        Returns:
            List of report data
        """
        reports = []
        
        if "reports" in st.session_state.app_state:
            for report_id, report_data in st.session_state.app_state["reports"].items():
                if report_data.get("phase") == phase:
                    reports.append({
                        "id": report_id,
                        **report_data
                    })
        
        return reports
    
    def update_system_status(self, service: str, status: str) -> None:
        """
        Update the status of a system service.
        
        Args:
            service: Service name
            status: Service status
        """
        if "system_status" not in st.session_state.app_state:
            st.session_state.app_state["system_status"] = {
                "services": {},
                "last_updated": time.time()
            }
        
        # Update service status
        st.session_state.app_state["system_status"]["services"][service] = status
        st.session_state.app_state["system_status"]["last_updated"] = time.time()
        
        self._save_state()
    
    def get_system_status(self) -> Dict[str, Any]:
        """
        Get the system status.
        
        Returns:
            System status data
        """
        return st.session_state.app_state.get("system_status", {
            "services": {},
            "last_updated": time.time()
        })

# Global state manager instance
_state_manager = None

def initialize_state_management() -> None:
    """Initialize the state management system."""
    global _state_manager
    _state_manager = StateManager()

def get_state_manager() -> StateManager:
    """
    Get the state manager instance.
    
    Returns:
        StateManager instance
    """
    global _state_manager
    
    if _state_manager is None:
        initialize_state_management()
    
    return _state_manager