"""
MVP Progress Reporting Module

This module provides functionality for generating comprehensive progress reports
on the current state of the MVP implementation, based on agent statuses, 
implementation metrics, and predefined completion criteria.

It integrates with the MCP status reporting system to collect data and generates
HTML and JSON reports for various stakeholders.
"""

import os
import time
import logging
import datetime
import json
from typing import Dict, Any, List, Optional, Union
from collections import defaultdict

from mcp.status_reporter import StatusReporter
from mcp.agent_protocol import Message, MessageType

logger = logging.getLogger(__name__)

# Component definitions with initial progress values
MVP_COMPONENTS = {
    "data_quality_module": {
        "name": "Data Quality & Compliance Module",
        "completion": 85,
        "subcomponents": {
            "validation_rules": {"name": "Validation Rules", "completion": 90},
            "data_sanitization": {"name": "Data Sanitization", "completion": 85},
            "compliance_checks": {"name": "Compliance Checks", "completion": 80},
            "quality_alerts": {"name": "Quality Alerts", "completion": 95},
        }
    },
    "ai_agent_framework": {
        "name": "AI Agent Framework",
        "completion": 80,
        "subcomponents": {
            "mcp_core": {"name": "MCP Core", "completion": 90},
            "agent_protocol": {"name": "Agent Protocol", "completion": 85},
            "message_broker": {"name": "Message Broker", "completion": 95},
            "knowledge_sharing": {"name": "Knowledge Sharing", "completion": 70}
        }
    },
    "prototype_agents": {
        "name": "Prototype Agents",
        "completion": 85,
        "subcomponents": {
            "data_quality_agent": {"name": "Data Quality Agent", "completion": 85},
            "compliance_agent": {"name": "Compliance Agent", "completion": 70},
            "monitoring_agent": {"name": "Monitoring Agent", "completion": 90},
            "power_query_agent": {"name": "Power Query Agent", "completion": 65},
            "sales_verification_agent": {"name": "Sales Verification Agent", "completion": 90}
        }
    },
    "testing_framework": {
        "name": "Testing Framework",
        "completion": 70,
        "subcomponents": {
            "unit_tests": {"name": "Unit Tests", "completion": 75},
            "integration_tests": {"name": "Integration Tests", "completion": 65},
            "validation_tests": {"name": "Validation Tests", "completion": 70},
            "test_automation": {"name": "Test Automation", "completion": 60}
        }
    },
    "data_integration": {
        "name": "Data Integration",
        "completion": 70,
        "subcomponents": {
            "gis_integration": {"name": "GIS Integration", "completion": 75},
            "property_data": {"name": "Property Data", "completion": 80},
            "tax_data": {"name": "Tax Data", "completion": 80},
            "valuation_data": {"name": "Valuation Data", "completion": 55}
        }
    },
    "user_interfaces": {
        "name": "User Interfaces",
        "completion": 75,
        "subcomponents": {
            "dashboard": {"name": "Dashboard", "completion": 85},
            "report_views": {"name": "Report Views", "completion": 70},
            "data_explorer": {"name": "Data Explorer", "completion": 65},
            "admin_interface": {"name": "Admin Interface", "completion": 75}
        }
    }
}

# Define MVP completion criteria
MVP_COMPLETION_CRITERIA = {
    "functional_requirements": [
        {"name": "Data quality validation framework", "complete": True},
        {"name": "Property data integration", "complete": True},
        {"name": "GIS data visualization", "complete": True},
        {"name": "User authentication & permissions", "complete": True},
        {"name": "Sales verification workflow", "complete": True},
        {"name": "Advanced reporting capabilities", "complete": False},
        {"name": "Multi-agent communications", "complete": True},
        {"name": "Knowledge sharing system", "complete": True},
    ],
    "performance_criteria": [
        {"name": "Database query response < 2s", "complete": True},
        {"name": "Page load time < 3s", "complete": True},
        {"name": "Report generation < 10s", "complete": False},
        {"name": "Data import processing < 5 min", "complete": False},
    ],
    "quality_standards": [
        {"name": "Test coverage > 70%", "complete": False},
        {"name": "Documentation for all APIs", "complete": False},
        {"name": "No critical security issues", "complete": True},
        {"name": "User workflow validation", "complete": False},
    ]
}

class ProgressReporter:
    """
    Progress reporting system that generates comprehensive reports on the
    current state of the MVP implementation
    """
    
    def __init__(self, status_reporter: StatusReporter = None):
        """
        Initialize the progress reporter
        
        Args:
            status_reporter: The status reporter instance to use for agent statuses
        """
        self.status_reporter = status_reporter
        self.components = MVP_COMPONENTS.copy()
        self.completion_criteria = MVP_COMPLETION_CRITERIA.copy()
        self.last_report_time = None
        self.reports_directory = os.environ.get("REPORTS_DIRECTORY", "reports")
        
        # Ensure reports directory exists
        os.makedirs(self.reports_directory, exist_ok=True)
        
    def update_component_progress(self, component_id: str, completion_percentage: int):
        """
        Update the completion percentage for a component
        
        Args:
            component_id: The ID of the component to update
            completion_percentage: The new completion percentage (0-100)
        """
        if component_id not in self.components:
            logger.warning(f"Unknown component ID: {component_id}")
            return
            
        # Validate percentage
        if not 0 <= completion_percentage <= 100:
            logger.warning(f"Invalid completion percentage: {completion_percentage}")
            completion_percentage = max(0, min(100, completion_percentage))
            
        # Update component
        self.components[component_id]["completion"] = completion_percentage
        logger.info(f"Updated progress for {component_id} to {completion_percentage}%")
        
    def update_subcomponent_progress(self, component_id: str, subcomponent_id: str, completion_percentage: int):
        """
        Update the completion percentage for a subcomponent
        
        Args:
            component_id: The ID of the parent component
            subcomponent_id: The ID of the subcomponent to update
            completion_percentage: The new completion percentage (0-100)
        """
        if component_id not in self.components:
            logger.warning(f"Unknown component ID: {component_id}")
            return
            
        if subcomponent_id not in self.components[component_id]["subcomponents"]:
            logger.warning(f"Unknown subcomponent ID: {subcomponent_id} for component {component_id}")
            return
            
        # Validate percentage
        if not 0 <= completion_percentage <= 100:
            logger.warning(f"Invalid completion percentage: {completion_percentage}")
            completion_percentage = max(0, min(100, completion_percentage))
            
        # Update subcomponent
        self.components[component_id]["subcomponents"][subcomponent_id]["completion"] = completion_percentage
        
        # Recalculate parent component completion
        subcomponents = self.components[component_id]["subcomponents"]
        total = sum(sc["completion"] for sc in subcomponents.values())
        avg_completion = total / len(subcomponents) if subcomponents else 0
        self.components[component_id]["completion"] = round(avg_completion)
        
        logger.info(f"Updated progress for {component_id}.{subcomponent_id} to {completion_percentage}%")
        
    def update_completion_criterion(self, category: str, criterion_name: str, complete: bool):
        """
        Update the completion status of a specific criterion
        
        Args:
            category: The criterion category (functional_requirements, performance_criteria, etc.)
            criterion_name: The name of the criterion to update
            complete: Whether the criterion is complete
        """
        if category not in self.completion_criteria:
            logger.warning(f"Unknown criterion category: {category}")
            return
            
        # Find and update the criterion
        found = False
        for criterion in self.completion_criteria[category]:
            if criterion["name"] == criterion_name:
                criterion["complete"] = complete
                found = True
                break
                
        if not found:
            logger.warning(f"Unknown criterion: {criterion_name} in category {category}")
            return
            
        logger.info(f"Updated completion status for {category}.{criterion_name} to {complete}")
        
    def get_overall_progress(self) -> int:
        """
        Calculate the overall MVP completion percentage
        
        Returns:
            Overall completion percentage (0-100)
        """
        if not self.components:
            return 0
            
        # Calculate weighted average of component completion
        total = sum(component["completion"] for component in self.components.values())
        avg_completion = total / len(self.components) if self.components else 0
        return round(avg_completion)
        
    def get_completion_criteria_status(self) -> Dict[str, Any]:
        """
        Get the status of all completion criteria
        
        Returns:
            Dictionary with status information for all criteria
        """
        result = {}
        
        for category, criteria in self.completion_criteria.items():
            total = len(criteria)
            completed = sum(1 for c in criteria if c["complete"])
            result[category] = {
                "total": total,
                "completed": completed,
                "percentage": round(completed / total * 100) if total > 0 else 0,
                "criteria": criteria
            }
            
        # Calculate overall completion across all categories
        all_criteria = [c for criteria in self.completion_criteria.values() for c in criteria]
        total = len(all_criteria)
        completed = sum(1 for c in all_criteria if c["complete"])
        
        result["overall"] = {
            "total": total,
            "completed": completed,
            "percentage": round(completed / total * 100) if total > 0 else 0
        }
        
        return result
        
    def generate_progress_report(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Generate a comprehensive progress report
        
        Args:
            force_refresh: If True, forces a refresh of all data instead of using cached values
            
        Returns:
            Dictionary with the full progress report
        """
        # Get agent statuses if status reporter is available
        agent_statuses = {}
        blockers = []
        if self.status_reporter:
            system_status = self.status_reporter.get_system_status(force_refresh=force_refresh)
            agent_statuses = system_status.get("agents", {})
            
            # Extract blockers
            for agent_id, blocker_info in system_status.get("blockers", {}).items():
                blockers.append({
                    "agent_id": agent_id,
                    "message": blocker_info.get("message", "Unknown blocker"),
                    "since": blocker_info.get("since", 0),
                    "details": blocker_info.get("details", {})
                })
                
        # Calculate overall progress
        overall_progress = self.get_overall_progress()
        
        # Get completion criteria status
        criteria_status = self.get_completion_criteria_status()
        
        # Create the report
        now = time.time()
        self.last_report_time = now
        
        report = {
            "timestamp": now,
            "date": datetime.datetime.fromtimestamp(now).strftime("%Y-%m-%d %H:%M:%S"),
            "overall_progress": overall_progress,
            "components": self.components,
            "completion_criteria": criteria_status,
            "agent_statuses": agent_statuses,
            "blockers": blockers,
            "remaining_work": self._calculate_remaining_work(),
            "critical_path": self._identify_critical_path()
        }
        
        # Save report to file
        self._save_report(report)
        
        return report
        
    def _calculate_remaining_work(self) -> List[Dict[str, Any]]:
        """
        Calculate remaining work items based on component progress
        
        Returns:
            List of remaining work items with priority
        """
        remaining_work = []
        
        # Check components and subcomponents that are not at 100%
        for component_id, component in self.components.items():
            if component["completion"] < 100:
                # Get incomplete subcomponents
                incomplete_subcomponents = []
                for subcomponent_id, subcomponent in component["subcomponents"].items():
                    if subcomponent["completion"] < 100:
                        incomplete_subcomponents.append({
                            "id": subcomponent_id,
                            "name": subcomponent["name"],
                            "completion": subcomponent["completion"],
                            "remaining": 100 - subcomponent["completion"]
                        })
                
                remaining_work.append({
                    "component_id": component_id,
                    "component_name": component["name"],
                    "completion": component["completion"],
                    "remaining": 100 - component["completion"],
                    "priority": self._calculate_priority(component),
                    "incomplete_subcomponents": incomplete_subcomponents
                })
                
        # Sort by priority (higher first)
        remaining_work.sort(key=lambda x: x["priority"], reverse=True)
        
        return remaining_work
        
    def _calculate_priority(self, component: Dict[str, Any]) -> float:
        """
        Calculate priority for a component based on completion and dependencies
        
        Args:
            component: The component to calculate priority for
            
        Returns:
            Priority score (higher means higher priority)
        """
        # Simple priority calculation based on % remaining and a base priority
        # This can be expanded to include dependencies and critical path analysis
        base_priority = {
            "data_quality_module": 8,
            "ai_agent_framework": 9,
            "prototype_agents": 7,
            "testing_framework": 6,
            "data_integration": 8,
            "user_interfaces": 5
        }.get(component.get("id", ""), 5)
        
        remaining = 100 - component["completion"]
        return (base_priority * remaining) / 100
        
    def _identify_critical_path(self) -> List[Dict[str, Any]]:
        """
        Identify the critical path for project completion
        
        Returns:
            List of components and tasks on the critical path
        """
        # This is a simplified version; a real implementation would use proper
        # dependency analysis and critical path calculation algorithms
        
        # Calculate remaining work
        remaining_work = self._calculate_remaining_work()
        
        # For now, we'll consider the highest priority items as the critical path
        critical_items = []
        
        # Take the top 3 items with highest priority
        critical_items = remaining_work[:3]
            
        return critical_items
        
    def _save_report(self, report: Dict[str, Any]):
        """
        Save the report to a file
        
        Args:
            report: The report to save
        """
        timestamp = datetime.datetime.fromtimestamp(report["timestamp"]).strftime("%Y%m%d_%H%M%S")
        filename = f"progress_report_{timestamp}.json"
        filepath = os.path.join(self.reports_directory, filename)
        
        try:
            with open(filepath, 'w') as f:
                json.dump(report, f, indent=2)
            logger.info(f"Saved progress report to {filepath}")
        except Exception as e:
            logger.error(f"Error saving progress report: {str(e)}")
            
    def generate_html_report(self, report: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate an HTML version of the progress report
        
        Args:
            report: The report data to use (if None, will generate a new report)
            
        Returns:
            HTML string for the report
        """
        if report is None:
            report = self.generate_progress_report()
            
        # Generate HTML (simplified version)
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>MVP Progress Report</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
            <!-- Styles removed to fix template rendering issues -->
        </head>
        <body>
            <div class="container my-5">
                <h1 class="mb-4">MVP Progress Report</h1>
                <p class="text-muted">Generated on: {date}</p>
                
                <div class="card mb-4">
                    <div class="card-header bg-primary text-white">
                        <h2 class="h5 mb-0">Overall Completion: {overall_progress}%</h2>
                    </div>
                    <div class="card-body">
                        <div class="progress" style="height: 25px;">
                            <div class="progress-bar bg-primary" role="progressbar" 
                                style="width: {overall_progress}%;" 
                                aria-valuenow="{overall_progress}" aria-valuemin="0" aria-valuemax="100">
                                {overall_progress}%
                            </div>
                        </div>
                    </div>
                </div>
                
                <h2 class="h4 mb-3">Component Status</h2>
        """.format(
            date=report["date"],
            overall_progress=report["overall_progress"]
        )
        
        # Add component cards
        for component_id, component in report["components"].items():
            html += """
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h3 class="h5 mb-0">{name}</h3>
                        <span class="badge bg-primary">{completion}%</span>
                    </div>
                    <div class="card-body">
                        <div class="progress mb-3">
                            <div class="progress-bar bg-primary" role="progressbar" 
                                style="width: {completion}%;" 
                                aria-valuenow="{completion}" aria-valuemin="0" aria-valuemax="100">
                                {completion}%
                            </div>
                        </div>
                        
                        <div class="row">
            """.format(
                name=component["name"],
                completion=component["completion"]
            )
            
            # Add subcomponents
            for subcomponent_id, subcomponent in component["subcomponents"].items():
                html += """
                            <div class="col-md-6 mb-2">
                                <div class="d-flex justify-content-between align-items-center">
                                    <span>{name}</span>
                                    <span class="badge bg-secondary completion-badge">{completion}%</span>
                                </div>
                                <div class="progress" style="height: 10px;">
                                    <div class="progress-bar bg-info" role="progressbar" 
                                        style="width: {completion}%;" 
                                        aria-valuenow="{completion}" aria-valuemin="0" aria-valuemax="100">
                                    </div>
                                </div>
                            </div>
                """.format(
                    name=subcomponent["name"],
                    completion=subcomponent["completion"]
                )
                
            html += """
                        </div>
                    </div>
                </div>
            """
        
        # Add completion criteria
        html += """
                <h2 class="h4 mb-3 mt-4">Completion Criteria</h2>
                <div class="row">
        """
        
        for category, data in report["completion_criteria"].items():
            if category == "overall":
                continue
                
            html += """
                    <div class="col-md-4 mb-4">
                        <div class="card h-100">
                            <div class="card-header d-flex justify-content-between align-items-center">
                                <h3 class="h6 mb-0">{category}</h3>
                                <span class="badge bg-primary">{percentage}%</span>
                            </div>
                            <div class="card-body">
                                <ul class="list-group list-group-flush">
            """.format(
                category=category.replace("_", " ").title(),
                percentage=data["percentage"]
            )
            
            for criterion in data["criteria"]:
                status = "bg-success" if criterion["complete"] else "bg-secondary"
                html += """
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        {name}
                                        <span class="badge {status}">{status_text}</span>
                                    </li>
                """.format(
                    name=criterion["name"],
                    status=status,
                    status_text="Complete" if criterion["complete"] else "Pending"
                )
                
            html += """
                                </ul>
                            </div>
                        </div>
                    </div>
            """
        
        # Add critical path
        html += """
                </div>
                
                <h2 class="h4 mb-3 mt-4">Critical Path</h2>
                <div class="card mb-4">
                    <div class="card-header bg-warning text-dark">
                        <h3 class="h5 mb-0">Highest Priority Items</h3>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead>
                                    <tr>
                                        <th>Component</th>
                                        <th>Completion</th>
                                        <th>Remaining</th>
                                        <th>Priority</th>
                                    </tr>
                                </thead>
                                <tbody>
        """
        
        for item in report["critical_path"]:
            html += """
                                    <tr>
                                        <td>{name}</td>
                                        <td>
                                            <div class="progress">
                                                <div class="progress-bar bg-primary" role="progressbar" 
                                                    style="width: {completion}%;" 
                                                    aria-valuenow="{completion}" aria-valuemin="0" aria-valuemax="100">
                                                    {completion}%
                                                </div>
                                            </div>
                                        </td>
                                        <td>{remaining}%</td>
                                        <td>{priority:.1f}</td>
                                    </tr>
            """.format(
                name=item["component_name"],
                completion=item["completion"],
                remaining=item["remaining"],
                priority=item["priority"]
            )
            
        html += """
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <h2 class="h4 mb-3 mt-4">Blockers & Issues</h2>
        """
        
        if report["blockers"]:
            html += """
                <div class="card mb-4">
                    <div class="card-header bg-danger text-white">
                        <h3 class="h5 mb-0">Current Blockers</h3>
                    </div>
                    <div class="card-body">
                        <div class="list-group">
            """
            
            for blocker in report["blockers"]:
                html += """
                            <div class="list-group-item list-group-item-danger">
                                <div class="d-flex w-100 justify-content-between">
                                    <h5 class="mb-1">{agent_id}</h5>
                                    <small>Since {since}</small>
                                </div>
                                <p class="mb-1">{message}</p>
                            </div>
                """.format(
                    agent_id=blocker["agent_id"],
                    since=datetime.datetime.fromtimestamp(blocker["since"]).strftime("%Y-%m-%d %H:%M"),
                    message=blocker["message"]
                )
                
            html += """
                        </div>
                    </div>
                </div>
            """
        else:
            html += """
                <div class="alert alert-success">
                    <h5>No Blockers</h5>
                    <p>There are currently no blockers affecting the project.</p>
                </div>
            """
            
        # Close HTML
        html += """
            </div>
            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
        </body>
        </html>
        """
        
        return html
        
    def save_html_report(self, report: Optional[Dict[str, Any]] = None):
        """
        Generate and save an HTML report
        
        Args:
            report: The report data to use (if None, will generate a new report)
        """
        html = self.generate_html_report(report)
        
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"progress_report_{timestamp}.html"
        filepath = os.path.join(self.reports_directory, filename)
        
        try:
            with open(filepath, 'w') as f:
                f.write(html)
            logger.info(f"Saved HTML progress report to {filepath}")
            return filepath
        except Exception as e:
            logger.error(f"Error saving HTML progress report: {str(e)}")
            return None