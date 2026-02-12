"""
TerraFusionPlatform UI Components

This module provides reusable UI components for building consistent UIs across the platform.
"""

import streamlit as st
import pandas as pd
from typing import Dict, List, Any, Optional, Union, Callable
from datetime import datetime
import plotly.express as px
import plotly.graph_objects as go

# Import design system tokens
from design_system import (
    COLORS, TYPOGRAPHY, SPACING, BORDERS, SHADOWS, ANIMATION, Z_INDEX,
    card, alert, status_badge, loading_indicator, empty_state, section_title
)

def display_logo():
    """Display the TerraFusion logo and title."""
    logo_html = f"""
    <div class="logo-container">
        <div style="font-size: 2rem;">🚀</div>
        <div class="logo-text">TerraFusionPlatform</div>
    </div>
    """
    st.markdown(logo_html, unsafe_allow_html=True)

def display_user_info(username: str, role: str) -> None:
    """
    Display user information.
    
    Args:
        username: Username to display
        role: User's role
    """
    user_html = f"""
    <div style="margin-bottom: 1.5rem; padding: 0.75rem; background-color: rgba(124, 77, 255, 0.1); border-radius: 0.5rem;">
        <div style="font-size: 0.875rem; opacity: 0.7;">Logged in as</div>
        <div style="font-weight: 600; display: flex; align-items: center;">
            <span style="margin-right: 0.5rem;">👤</span> {username}
            <span style="margin-left: 0.5rem; font-size: 0.75rem; padding: 0.25rem 0.5rem; background-color: rgba(124, 77, 255, 0.2); border-radius: 0.25rem; text-transform: uppercase;">{role}</span>
        </div>
    </div>
    """
    st.markdown(user_html, unsafe_allow_html=True)

def display_phase_indicator(phases: Dict[str, str], current_phase: str) -> None:
    """
    Display a phase indicator showing the current phase.
    
    Args:
        phases: Dictionary mapping phase IDs to phase names
        current_phase: ID of the current phase
    """
    phase_html = '<div class="phase-indicator">'
    for phase_id, phase_name in phases.items():
        status_class = "active" if phase_id == current_phase else ""
        phase_html += f'<div class="phase-item {status_class}">{phase_name}</div>'
    phase_html += '</div>'
    
    st.markdown(phase_html, unsafe_allow_html=True)

def display_phase_progress_bars(
    phase_data: Dict[str, Dict[str, Any]], 
    phases: Dict[str, str],
    phase_statuses: Dict[str, str]
) -> None:
    """
    Display progress bars for all phases.
    
    Args:
        phase_data: Dictionary containing phase data
        phases: Dictionary mapping phase IDs to phase names
        phase_statuses: Dictionary mapping phase IDs to phase statuses
    """
    for phase_id, phase_info in phase_data.items():
        phase_name = phases.get(phase_id, phase_id.title())
        progress = phase_info["progress"]
        completed = phase_info["completed"]
        
        # Determine color based on status
        if completed:
            bar_color = COLORS["status"]["success"]  # Green for completed
        elif phase_id == phase_statuses.get(phase_id) == "in_progress":
            bar_color = COLORS["primary"]["main"]  # Purple for in-progress
        else:
            bar_color = "#555555"  # Grey for pending
        
        # Create a custom progress bar with HTML/CSS
        st.markdown(f"""
        <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span>{phase_name}</span>
                <span>{progress}%</span>
            </div>
            <div style="height: 10px; background-color: {COLORS["neutral"]["surface"]}; border-radius: 5px; overflow: hidden;">
                <div style="height: 100%; width: {progress}%; background-color: {bar_color};"></div>
            </div>
        </div>
        """, unsafe_allow_html=True)

def create_phase_status_chart(phase_statuses: Dict[str, str], phases: Dict[str, str]) -> go.Figure:
    """
    Create a horizontal bar chart for phase status visualization.
    
    Args:
        phase_statuses: Dictionary mapping phase IDs to phase statuses
        phases: Dictionary mapping phase IDs to phase names
        
    Returns:
        Plotly figure object
    """
    # Create a dataframe for the chart
    phases_df = pd.DataFrame({
        'Phase': list(phases.values()),
        'Status': list(phase_statuses.values()),
        'Order': list(range(len(phases)))
    })
    
    # Create a color map for the phase statuses
    color_map = {
        'completed': COLORS["status"]["success"],
        'in_progress': COLORS["primary"]["main"],
        'pending': COLORS["neutral"]["surface"]
    }
    
    # Create a horizontal bar chart for phase progress
    fig = px.bar(
        phases_df, 
        y='Phase', 
        x=[1] * len(phases_df),
        color='Status',
        color_discrete_map=color_map,
        orientation='h',
        height=240,
        text='Phase'
    )
    
    # Customize the layout
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(color=COLORS["text"]["secondary"]),
        showlegend=True,
        margin=dict(l=10, r=10, t=10, b=10),
        xaxis=dict(
            showgrid=False,
            showticklabels=False,
            zeroline=False
        ),
        yaxis=dict(
            autorange="reversed",
            showgrid=False,
            zeroline=False
        ),
        legend=dict(
            orientation="h",
            yanchor="bottom",
            y=1.02,
            xanchor="right",
            x=1
        ),
        barmode='relative'
    )
    
    # Update bar appearance
    fig.update_traces(
        marker_line_color='rgba(0,0,0,0)',
        marker_line_width=0,
        width=0.8,
        textposition='inside',
        insidetextanchor='middle',
        textfont=dict(color='white')
    )
    
    return fig

def create_phase_progress_chart(phase_data: Dict[str, Dict[str, Any]], phases: Dict[str, str]) -> go.Figure:
    """
    Create a horizontal bar chart showing progress for each phase.
    
    Args:
        phase_data: Dictionary containing phase data
        phases: Dictionary mapping phase IDs to phase names
        
    Returns:
        Plotly figure object
    """
    # Create a dataframe for the chart
    phase_completion_data = []
    for phase_id, phase_info in phase_data.items():
        phase_completion_data.append({
            "Phase": phases.get(phase_id, phase_id.title()),
            "Progress": phase_info["progress"]
        })
    
    phase_completion_df = pd.DataFrame(phase_completion_data)
    
    # Create a horizontal bar chart for phase progress
    fig = px.bar(
        phase_completion_df, 
        y='Phase', 
        x='Progress',
        orientation='h',
        range_x=[0, 100],
        height=300,
        color='Progress',
        color_continuous_scale=[(0, COLORS["neutral"]["surface"]), (0.5, COLORS["primary"]["main"]), (1, COLORS["status"]["success"])]
    )
    
    # Customize the layout
    fig.update_layout(
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        font=dict(color=COLORS["text"]["secondary"]),
        margin=dict(l=10, r=10, t=10, b=10),
        coloraxis_showscale=False,
        xaxis=dict(
            title="Progress (%)",
            showgrid=True,
            gridcolor=f'rgba(124,77,255,0.1)',
            zeroline=False
        ),
        yaxis=dict(
            autorange="reversed",
            showgrid=False,
            zeroline=False
        )
    )
    
    # Update bar appearance
    fig.update_traces(
        marker_line_color='rgba(0,0,0,0)',
        marker_line_width=0,
        texttemplate='%{x}%',
        textposition='outside',
        textfont=dict(color=COLORS["text"]["secondary"])
    )
    
    return fig

def display_phase_actions(current_phase: str) -> None:
    """
    Display phase-specific actions.
    
    Args:
        current_phase: ID of the current phase
    """
    action_card_html = '<div class="tf-card">'
    
    if current_phase == "planning":
        action_card_html += """
        <h3>Planning Phase Actions</h3>
        <p>Create the following documents to complete this phase:</p>
        <ul>
            <li>UX Audit - Document current user experience issues</li>
            <li>Data Flow Map - Map out how data moves through the system</li>
            <li>Problem List - Create a prioritized list of problems to solve</li>
        </ul>
        """
    elif current_phase == "solution_design":
        action_card_html += """
        <h3>Solution Design Actions</h3>
        <p>Design solutions for the identified problems:</p>
        <ul>
            <li>New UX Plan - Create wireframes and user flow diagrams</li>
            <li>Data Awareness Strategies - Design approaches for better state management</li>
            <li>Technical Approach - Document the implementation strategy</li>
        </ul>
        """
    elif current_phase == "ticket_breakdown":
        action_card_html += """
        <h3>Ticket Breakdown Actions</h3>
        <p>Break down the implementation into specific tasks:</p>
        <ul>
            <li>Create tickets with clear descriptions</li>
            <li>Define acceptance criteria for each ticket</li>
            <li>Estimate effort for implementation</li>
        </ul>
        """
    elif current_phase == "implementation":
        action_card_html += """
        <h3>Implementation Actions</h3>
        <p>Implement the solution according to the tickets:</p>
        <ul>
            <li>Write code according to the design</li>
            <li>Create unit tests for your implementation</li>
            <li>Document your implementation approach</li>
        </ul>
        """
    elif current_phase == "testing":
        action_card_html += """
        <h3>Testing Actions</h3>
        <p>Validate the implementation:</p>
        <ul>
            <li>Execute end-to-end testing</li>
            <li>Validate changes against acceptance criteria</li>
            <li>Measure and document performance improvements</li>
        </ul>
        """
    elif current_phase == "reporting":
        action_card_html += """
        <h3>Reporting Actions</h3>
        <p>Create project documentation:</p>
        <ul>
            <li>Create a comprehensive project completion report</li>
            <li>Document lessons learned throughout the project</li>
            <li>Provide recommendations for future enhancements</li>
        </ul>
        """
    
    action_card_html += '</div>'
    st.markdown(action_card_html, unsafe_allow_html=True)

def display_metric_card(title: str, value: Union[int, float, str], prefix: str = "") -> None:
    """
    Display a metric card.
    
    Args:
        title: Title of the metric
        value: Value to display
        prefix: Optional prefix to display before the value
    """
    st.markdown(f"""
    <div class="tf-card" style="text-align: center;">
        <h3 style="margin-top: 0; font-size: 1.1rem; color: {COLORS["text"]["secondary"]};">{title}</h3>
        <div style="font-size: 2rem; font-weight: 700; color: {COLORS["primary"]["main"]};">
            {prefix}{value}
        </div>
    </div>
    """, unsafe_allow_html=True)

def display_task_suggestions(suggested_tasks: List[str]) -> None:
    """
    Display AI task suggestions.
    
    Args:
        suggested_tasks: List of suggested tasks
    """
    suggestion_card_html = '<div class="tf-card">'
    suggestion_card_html += '<h4>Suggested Next Tasks</h4>'
    suggestion_card_html += '<ul style="padding-left: 1.5rem;">'
    
    for task in suggested_tasks:
        suggestion_card_html += f'<li style="margin-bottom: 0.75rem;">{task}</li>'
    
    suggestion_card_html += '</ul>'
    suggestion_card_html += '</div>'
    
    st.markdown(suggestion_card_html, unsafe_allow_html=True)

def display_phase_preview(preview_text: str) -> None:
    """
    Display a preview of the next phase.
    
    Args:
        preview_text: Text describing the next phase
    """
    if not preview_text:
        return
        
    st.markdown(f"""
    <div style="padding: 1rem; border-radius: 0.5rem; background-color: rgba(124, 77, 255, 0.1); margin-top: 1rem;">
        <h4 style="margin-top: 0;">🔮 Looking Ahead</h4>
        <p style="margin-bottom: 0;">{preview_text}</p>
    </div>
    """, unsafe_allow_html=True)

def display_report_card(title: str, phase: str, timestamp: datetime, filename: str) -> None:
    """
    Display a report card.
    
    Args:
        title: Report title
        phase: Phase the report belongs to
        timestamp: Timestamp when the report was created
        filename: Report filename
    """
    # Format report name for display
    display_name = title.replace('_', ' ').title()
    
    # Create a report card
    st.markdown(f"""
    <div class="report-card">
        <div style="font-weight: 600;">{display_name}</div>
        <div style="font-size: 0.8rem; margin-top: 0.5rem;">
            <span>Generated: {timestamp.strftime('%Y-%m-%d')}</span>
            <a href="exports/{phase}/{filename}" target="_blank" style="margin-left: 1rem; color: {COLORS["primary"]["main"]};">View Report</a>
        </div>
    </div>
    """, unsafe_allow_html=True)

def display_system_status() -> None:
    """Display the system status indicator."""
    st.markdown(f"""
    <div style="display: flex; align-items: center; font-size: 0.8rem; color: {COLORS["text"]["secondary"]};">
        <div style="width: 8px; height: 8px; border-radius: 50%; background-color: {COLORS["status"]["success"]}; 
                   margin-right: 0.5rem; box-shadow: 0 0 5px {COLORS["status"]["success"]};"></div>
        <div>System Online</div>
        <div style="margin-left: auto; font-size: 0.7rem; color: {COLORS["text"]["muted"]};">
            v1.1.0
        </div>
    </div>
    """, unsafe_allow_html=True)

def create_report_generation_form(
    current_phase: str,
    on_submit: Callable[[str, str], None]
) -> None:
    """
    Create a form for generating reports.
    
    Args:
        current_phase: ID of the current phase
        on_submit: Callback function when form is submitted
    """
    report_types = [
        "UX Audit",
        "Data Flow Map",
        "Problem List",
        "New UX Plan",
        "Data Awareness Strategy",
        "Technical Approach",
        "Ticket Breakdown",
        "Implementation Details",
        "Testing Results",
        "Project Completion"
    ]
    
    # Report generation form
    report_type = st.selectbox(
        "Report Type", 
        report_types
    )
    
    report_title = st.text_input("Report Title", value=report_type)
    
    if st.button("Generate Report"):
        on_submit(current_phase, report_title)

def create_mcp_command_console(
    on_execute: Callable[[str, Dict[str, str]], None]
) -> None:
    """
    Create the MCP command console UI.
    
    Args:
        on_execute: Callback function when a mission is executed
    """
    st.header("🧠 MCP Core Command Console")

    mission = st.selectbox("Select Mission Type", ["scaffold", "test", "secure"])
    params = {}

    if mission == "scaffold":
        # Scaffold mission parameters
        scaffold_type = st.selectbox(
            "Scaffold Type", 
            ["plugin", "service", "test", "graphql"],
            help="Type of code to scaffold"
        )
        params["scaffold_type"] = scaffold_type
        
        if scaffold_type == "plugin":
            params["plugin_name"] = st.text_input("Plugin Name", value="new_plugin")
            params["base_path"] = st.text_input("Base Path", value="generated_plugins/")
            params["description"] = st.text_area("Description", value="A TerraFusionPlatform plugin")
            
        elif scaffold_type == "service":
            params["service_name"] = st.text_input("Service Name", value="example_service")
            params["base_path"] = st.text_input("Base Path", value="services/")
            params["port"] = st.number_input("Service Port", value=5000, min_value=1024, max_value=65535)
            params["description"] = st.text_area("Description", value="A microservice for TerraFusionPlatform")
            
        elif scaffold_type == "test":
            params["module_name"] = st.text_input("Module Name", value="example_module")
            params["base_path"] = st.text_input("Base Path", value="src/")
            params["test_type"] = st.selectbox("Test Type", ["unit", "integration", "e2e"])
            
        elif scaffold_type == "graphql":
            params["schema_name"] = st.text_input("Schema Name", value="example_schema")
            params["base_path"] = st.text_input("Base Path", value="schemas/")
            entity_types = st.text_input("Entity Types (comma-separated)", value="User,Post,Comment")
            params["entity_types"] = [entity.strip() for entity in entity_types.split(",")]

    elif mission == "test":
        params["service"] = st.text_input("Service Name", value="valuation_service")
        params["test_type"] = st.selectbox("Test Type", ["unit", "integration", "system", "all"])
        params["verbose"] = st.checkbox("Verbose Output", value=True)

    elif mission == "secure":
        params["target_path"] = st.text_input("Target Directory", value="src/")
        params["scan_type"] = st.selectbox("Scan Type", ["basic", "dependencies", "secrets", "all"])
        params["fix_issues"] = st.checkbox("Auto-fix Issues", value=False)

    if st.button("🧠 Execute Mission"):
        on_execute(mission, params)