"""
TerraFusionPlatform Dashboard View

This module handles the project dashboard display.
"""

import streamlit as st
import time
from datetime import datetime, timedelta

# Import state management
from state_manager import get_state_manager

# Import UI components
from components import (
    display_metric_card,
    create_phase_progress_chart,
    display_task_suggestions
)

def display_dashboard() -> None:
    """Display the project dashboard interface."""
    # Get state manager
    state_manager = get_state_manager()
    
    # Get the current phase and phase data
    current_phase = state_manager.get_current_phase()
    phase_data = state_manager.get_phase_data()
    
    # Define phases - mapping from phase_id to display name
    phases = {
        "planning": "Planning",
        "solution_design": "Solution Design",
        "ticket_breakdown": "Ticket Breakdown",
        "implementation": "Implementation",
        "testing": "Testing",
        "reporting": "Reporting"
    }
    
    # Display title
    st.markdown("## Project Dashboard")
    st.markdown("Overview of your project's performance and status.")
    
    # Quick stats row
    col1, col2, col3, col4 = st.columns(4)
    
    # Calculate stats
    project_progress = calculate_overall_progress(phase_data)
    days_remaining = calculate_days_remaining()
    completed_phases = sum(1 for status in state_manager.get_phase_statuses().values() if status == "completed")
    active_tasks = calculate_active_tasks()
    
    # Display stats
    with col1:
        display_metric_card("Project Progress", f"{project_progress}%")
    with col2:
        display_metric_card("Days Remaining", days_remaining)
    with col3:
        display_metric_card("Completed Phases", completed_phases)
    with col4:
        display_metric_card("Active Tasks", active_tasks)
    
    # Create two-column layout for charts
    chart_col1, chart_col2 = st.columns(2)
    
    with chart_col1:
        # Phase progress chart
        st.markdown("### Phase Progress")
        st.plotly_chart(
            create_phase_progress_chart(phase_data, phases),
            use_container_width=True,
            config={"displayModeBar": False}
        )
    
    with chart_col2:
        # Activity timeline
        st.markdown("### Recent Activity")
        display_activity_timeline()
    
    # Task section
    st.markdown("### Current Tasks")
    display_current_tasks()

def calculate_overall_progress(phase_data):
    """
    Calculate the overall project progress.
    
    Args:
        phase_data: Dictionary containing phase data
        
    Returns:
        Overall progress percentage
    """
    if not phase_data:
        return 0
    
    total_progress = sum(phase_info["progress"] for phase_info in phase_data.values())
    return round(total_progress / len(phase_data))

def calculate_days_remaining():
    """
    Calculate the number of days remaining in the project.
    
    Returns:
        Number of days remaining
    """
    # In a real application, this would come from a project timeline
    # Here we're just returning a placeholder value
    return 14

def calculate_active_tasks():
    """
    Calculate the number of active tasks.
    
    Returns:
        Number of active tasks
    """
    # In a real application, this would come from a task tracking system
    # Here we're just returning a placeholder value
    return 7

def display_activity_timeline():
    """Display a timeline of recent project activity."""
    # In a real application, this would come from a database or activity log
    # Here we're just displaying placeholder data
    current_time = datetime.now()
    
    activities = [
        {
            "action": "Phase Transition",
            "description": "Moved from Planning to Solution Design",
            "timestamp": current_time - timedelta(days=3, hours=4),
            "user": "admin"
        },
        {
            "action": "Report Generated",
            "description": "UX Audit Report",
            "timestamp": current_time - timedelta(days=3, hours=2),
            "user": "design_team"
        },
        {
            "action": "Task Completed",
            "description": "Document current UX pain points",
            "timestamp": current_time - timedelta(days=2, hours=8),
            "user": "design_team"
        },
        {
            "action": "Workflow Updated",
            "description": "Added new implementation tasks",
            "timestamp": current_time - timedelta(days=1, hours=5),
            "user": "admin"
        },
        {
            "action": "Progress Update",
            "description": "Solution Design progress at 65%",
            "timestamp": current_time - timedelta(hours=6),
            "user": "admin"
        }
    ]
    
    for activity in activities:
        # Format the timestamp
        time_str = activity["timestamp"].strftime("%m/%d %H:%M")
        
        # Create the activity card
        st.markdown(f"""
        <div style="padding: 0.5rem 0; border-bottom: 1px solid rgba(124, 77, 255, 0.1);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600;">{activity["action"]}</span>
                <span style="font-size: 0.8rem; color: #888;">{time_str}</span>
            </div>
            <div style="margin-top: 0.25rem;">{activity["description"]}</div>
            <div style="font-size: 0.8rem; color: #888; margin-top: 0.25rem;">by {activity["user"]}</div>
        </div>
        """, unsafe_allow_html=True)

def display_current_tasks():
    """Display current active tasks."""
    # In a real application, these would come from a task tracking system
    # Here we're just displaying placeholder data
    tasks = [
        {
            "name": "Create wireframes for revised UX",
            "status": "in_progress",
            "assigned_to": "design_team",
            "due_date": datetime.now() + timedelta(days=2)
        },
        {
            "name": "Design improved data flow diagrams",
            "status": "in_progress",
            "assigned_to": "architecture_team",
            "due_date": datetime.now() + timedelta(days=3)
        },
        {
            "name": "Develop a state management strategy",
            "status": "not_started",
            "assigned_to": "development_team",
            "due_date": datetime.now() + timedelta(days=5)
        },
        {
            "name": "Plan API refactoring for better consistency",
            "status": "not_started",
            "assigned_to": "architecture_team",
            "due_date": datetime.now() + timedelta(days=7)
        }
    ]
    
    # Create tabs for different task statuses
    task_tabs = st.tabs(["All Tasks", "In Progress", "Not Started", "Completed"])
    
    with task_tabs[0]:  # All Tasks tab
        for task in tasks:
            display_task_card(task)
    
    with task_tabs[1]:  # In Progress tab
        in_progress_tasks = [task for task in tasks if task["status"] == "in_progress"]
        if in_progress_tasks:
            for task in in_progress_tasks:
                display_task_card(task)
        else:
            st.info("No tasks in progress.")
    
    with task_tabs[2]:  # Not Started tab
        not_started_tasks = [task for task in tasks if task["status"] == "not_started"]
        if not_started_tasks:
            for task in not_started_tasks:
                display_task_card(task)
        else:
            st.info("No pending tasks.")
    
    with task_tabs[3]:  # Completed tab
        completed_tasks = [task for task in tasks if task["status"] == "completed"]
        if completed_tasks:
            for task in completed_tasks:
                display_task_card(task)
        else:
            st.info("No completed tasks.")

def display_task_card(task):
    """
    Display a task card.
    
    Args:
        task: Dictionary containing task information
    """
    # Define status colors
    status_colors = {
        "completed": "#4CAF50",
        "in_progress": "#7C4DFF",
        "not_started": "#9E9E9E"
    }
    
    # Format status for display
    status_display = task["status"].replace("_", " ").title()
    
    # Format due date
    due_date = task["due_date"].strftime("%m/%d/%Y")
    
    # Calculate days remaining
    days_remaining = (task["due_date"] - datetime.now()).days
    days_text = f"{days_remaining} days remaining" if days_remaining > 0 else "Due today" if days_remaining == 0 else "Overdue"
    
    # Create the task card
    st.markdown(f"""
    <div style="padding: 1rem; border-radius: 0.5rem; border: 1px solid rgba(124, 77, 255, 0.2); margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: 600;">{task["name"]}</span>
            <span style="font-size: 0.8rem; padding: 0.25rem 0.5rem; border-radius: 0.25rem; background-color: {status_colors[task["status"]]}; color: white;">{status_display}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 0.75rem; font-size: 0.9rem;">
            <span>Assigned to: {task["assigned_to"]}</span>
            <span>Due: {due_date}</span>
        </div>
        <div style="font-size: 0.8rem; color: #888; margin-top: 0.5rem;">{days_text}</div>
    </div>
    """, unsafe_allow_html=True)