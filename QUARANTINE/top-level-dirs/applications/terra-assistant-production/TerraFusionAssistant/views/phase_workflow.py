"""
TerraFusionPlatform Phase Workflow View

This module handles the display and interaction with the workflow phases.
"""

import streamlit as st
from typing import Dict, Any, List, Optional

# Import state management
from state_manager import get_state_manager

# Import design system components
from design_system import section_title

# Import UI components
from components import (
    display_phase_indicator,
    display_phase_progress_bars,
    create_phase_status_chart,
    display_phase_actions,
    display_task_suggestions,
    display_phase_preview,
    create_report_generation_form
)

def display_phase_workflow() -> None:
    """Display the phase workflow interface."""
    # Get the state manager
    state_manager = get_state_manager()
    
    # Get the current phase and phase data
    current_phase = state_manager.get_current_phase()
    phase_data = state_manager.get_phase_data()
    phase_statuses = state_manager.get_phase_statuses()
    
    # Define phases - mapping from phase_id to display name
    phases = {
        "planning": "Planning",
        "solution_design": "Solution Design",
        "ticket_breakdown": "Ticket Breakdown",
        "implementation": "Implementation",
        "testing": "Testing",
        "reporting": "Reporting"
    }
    
    # Display section title
    section_title("DevOps Workflow", "Manage and track your project workflow")
    
    # Create a two-column layout
    col1, col2 = st.columns([2, 1])
    
    with col1:
        # Phase overview
        st.markdown("### Phase Overview")
        
        # Display the phase indicator
        display_phase_indicator(phases, current_phase)
        
        # Display the phase chart
        st.plotly_chart(
            create_phase_status_chart(phase_statuses, phases), 
            use_container_width=True,
            config={"displayModeBar": False}
        )
        
        # Display current phase heading
        current_phase_name = phases.get(current_phase, current_phase.title().replace("_", " "))
        st.markdown(f"### Current Phase: {current_phase_name}")
        
        # Display phase-specific actions
        display_phase_actions(current_phase)
        
        # Phase transition
        st.markdown("### Phase Transition")
        
        # Get the next phase
        next_phase = None
        phase_keys = list(phases.keys())
        if current_phase in phase_keys and phase_keys.index(current_phase) < len(phase_keys) - 1:
            next_phase_idx = phase_keys.index(current_phase) + 1
            next_phase = phase_keys[next_phase_idx]
        
        if next_phase:
            next_phase_name = phases.get(next_phase, next_phase.title().replace("_", " "))
            
            # Preview of the next phase
            next_phase_preview = get_next_phase_preview(next_phase)
            if next_phase_preview:
                display_phase_preview(next_phase_preview)
            
            # Transition button
            if st.button(f"Transition to {next_phase_name} Phase"):
                # Update the current phase
                state_manager.set_current_phase(next_phase)
                
                # Mark the previous phase as completed
                state_manager.set_phase_status(current_phase, "completed")
                
                # Mark the new phase as in progress
                state_manager.set_phase_status(next_phase, "in_progress")
                
                # Reload to show the updated state
                st.rerun()
        else:
            st.info("This is the final phase of the project.")
    
    with col2:
        # Phase progress
        st.markdown("### Phase Progress")
        
        # Display progress bars for all phases
        display_phase_progress_bars(phase_data, phases, phase_statuses)
        
        # Display suggested tasks based on the current phase
        st.markdown("### AI Suggested Tasks")
        suggested_tasks = get_suggested_tasks(current_phase)
        display_task_suggestions(suggested_tasks)
        
        # Report generation section
        st.markdown("### Generate Reports")
        
        # Callback function for report generation
        def on_report_submit(phase: str, title: str) -> None:
            st.session_state.report_generated = True
            st.session_state.report_title = title
            st.session_state.report_phase = phase
        
        # Report generation form
        create_report_generation_form(current_phase, on_report_submit)
        
        # Display success message if report was generated
        if st.session_state.get("report_generated", False):
            st.success(f"Report '{st.session_state.report_title}' generated successfully.")
            
            # Reset the flag
            st.session_state.report_generated = False

def get_suggested_tasks(phase: str) -> List[str]:
    """
    Get a list of AI-suggested tasks for the given phase.
    
    Args:
        phase: Current workflow phase
        
    Returns:
        List of suggested tasks
    """
    # In a real application, these would be generated by an AI or retrieved from a database
    suggestions = {
        "planning": [
            "Document current UX pain points",
            "Map data flows between services",
            "Identify key performance bottlenecks",
            "Create a prioritized problem list",
            "Define project success metrics"
        ],
        "solution_design": [
            "Create wireframes for revised UX",
            "Design improved data flow diagrams",
            "Develop a state management strategy",
            "Plan API refactoring for better consistency",
            "Design modular component architecture"
        ],
        "ticket_breakdown": [
            "Break down UX improvements into tasks",
            "Create tickets for state management implementation",
            "Define acceptance criteria for all tickets",
            "Estimate effort for implementation tasks",
            "Prioritize tickets for delivery"
        ],
        "implementation": [
            "Implement the design system module",
            "Create reusable UI components",
            "Implement centralized state management",
            "Refactor application structure",
            "Add CI/CD pipeline configurations"
        ],
        "testing": [
            "Create unit tests for core components",
            "Perform integration testing of services",
            "Validate UX improvements against requirements",
            "Benchmark system performance",
            "Conduct security testing"
        ],
        "reporting": [
            "Generate final project report",
            "Document architectural decisions",
            "Create user documentation",
            "Prepare deployment guides",
            "Document lessons learned"
        ]
    }
    
    return suggestions.get(phase, [
        "Review current project state",
        "Identify next steps",
        "Consult with stakeholders",
        "Update project documentation"
    ])

def get_next_phase_preview(next_phase: str) -> Optional[str]:
    """
    Get a preview description of the next phase.
    
    Args:
        next_phase: ID of the next phase
        
    Returns:
        Preview text for the next phase
    """
    previews = {
        "planning": "The Planning phase involves documenting current issues, mapping data flows, and creating a prioritized problem list.",
        "solution_design": "In the Solution Design phase, you'll create wireframes, design improved data flows, and develop a state management strategy.",
        "ticket_breakdown": "The Ticket Breakdown phase involves creating detailed work items, defining acceptance criteria, and estimating effort.",
        "implementation": "During Implementation, you'll build the design system, create reusable components, and refactor the application structure.",
        "testing": "The Testing phase involves validating the implementation against requirements, performance testing, and security analysis.",
        "reporting": "In the Reporting phase, you'll generate the final project documentation, create user guides, and document lessons learned."
    }
    
    return previews.get(next_phase)