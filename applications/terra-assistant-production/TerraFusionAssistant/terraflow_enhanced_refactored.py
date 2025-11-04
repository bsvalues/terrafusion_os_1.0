"""
TerraFusionPlatform ICSF AI-Driven DevOps Framework (Enhanced Version)

A comprehensive interface for managing AI-powered code analysis and deployment workflows.
This is the refactored version with improved architecture and consistency.
"""

import streamlit as st
import os
import time
from datetime import datetime

from core.config import config
from state_manager import initialize_state_management, get_state_manager
from design_system import apply_design_system
from components import display_logo, display_user_info, display_system_status
from views.auth import display_login_page, handle_logout
from views.phase_workflow import display_phase_workflow
from views.dashboard import display_dashboard
from views.reports import display_reports
from views.mcp_console import display_mcp_console
from views.user_management import display_user_management_page
from auth_manager import validate_session

st.set_page_config(
    page_title=config.app_name,
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded",
)

apply_design_system()

def main():
    """Main application entry point."""
    # Initialize state management
    initialize_state_management()
    
    # Check if user is authenticated
    if not display_login_page():
        return
    
    # User is authenticated, display main app
    display_main_app()

def display_main_app():
    """Display the main application interface after authentication."""
    # Get user data from session token
    user_data = validate_session(st.session_state.get("auth_token", ""))
    if not user_data:
        # Invalid or expired session, clear session state and return to login
        if "auth_token" in st.session_state:
            del st.session_state["auth_token"]
        if "username" in st.session_state:
            del st.session_state["username"]
        st.rerun()
        return
    
    # Get state manager
    state_manager = get_state_manager()
    
    # Define phases - mapping from phase_id to display name
    phases = {
        "planning": "Planning",
        "solution_design": "Solution Design",
        "ticket_breakdown": "Ticket Breakdown",
        "implementation": "Implementation",
        "testing": "Testing",
        "reporting": "Reporting"
    }
    
    # Initialize current view if not set
    if 'current_view' not in st.session_state:
        st.session_state.current_view = "main"
    
    # Display appropriate view based on current_view
    if st.session_state.current_view == "user_management":
        # If current view is user management, display that
        display_user_management_view(user_data)
    else:
        # Otherwise display main app interface
        display_main_interface(user_data, phases)

def display_user_management_view(user_data):
    """
    Display the user management view.
    
    Args:
        user_data: Dictionary containing user information
    """
    # Sidebar for user management view
    with st.sidebar:
        display_logo()
        
        # Show logged in user
        display_user_info(user_data['username'], user_data['role'])
        
        st.sidebar.divider()
        
        # Back button
        if st.sidebar.button("← Back to Main View"):
            st.session_state.current_view = "main"
            st.rerun()
        
        st.sidebar.divider()
        
        # System status
        st.sidebar.markdown("### System Status")
        display_system_status()
        
        # Logout button
        if st.sidebar.button("🚪 Logout", key="logout_button"):
            handle_logout()
    
    # Main content for user management
    display_user_management_page()

def display_main_interface(user_data, phases):
    """
    Display the main application interface.
    
    Args:
        user_data: Dictionary containing user information
        phases: Dictionary mapping phase IDs to phase names
    """
    # Get state manager
    state_manager = get_state_manager()
    
    # Get current phase and phase statuses
    current_phase = state_manager.get_current_phase()
    phase_statuses = state_manager.get_phase_statuses()
    
    # Sidebar navigation
    with st.sidebar:
        display_logo()
        
        # Show logged in user
        display_user_info(user_data['username'], user_data['role'])
        
        # Display phases in sidebar
        st.sidebar.markdown("### Workflow Phases")
        for phase_id, phase_name in phases.items():
            status = phase_statuses.get(phase_id, "pending")
            is_current = phase_id == current_phase
            
            if status == "completed":
                icon = "✅"
            elif status == "in_progress":
                icon = "🔄"
            else:
                icon = "⏳"
                
            if is_current:
                st.sidebar.markdown(f"**{icon} {phase_name}**")
            else:
                st.sidebar.markdown(f"{icon} {phase_name}")
        
        st.sidebar.divider()
        
        # Admin section
        if user_data["role"] == "admin":
            with st.expander("🔧 Admin Tools", expanded=False):
                if st.button("User Management"):
                    st.session_state.current_view = "user_management"
                    st.rerun()
        
        # System status
        st.sidebar.markdown("### System Status")
        display_system_status()
        
        # Logout button
        if st.sidebar.button("🚪 Logout", key="logout_button"):
            handle_logout()
    
    # Main content
    st.markdown('<h1 class="header">TerraFusionPlatform ICSF AI-Driven DevOps Framework</h1>', unsafe_allow_html=True)
    st.markdown('<p class="subheader">A fully structured, autonomous environment for running high-quality, AI-assisted development workflows.</p>', unsafe_allow_html=True)
    
    # Create tabs for different views
    main_tabs = st.tabs(["DevOps Workflow", "Project Dashboard", "Reports", "MCP Console"])
    
    with main_tabs[0]:  # DevOps Workflow tab
        display_phase_workflow()
    
    with main_tabs[1]:  # Project Dashboard tab
        display_dashboard()
    
    with main_tabs[2]:  # Reports tab
        display_reports()
    
    with main_tabs[3]:  # MCP Console tab
        display_mcp_console()

if __name__ == "__main__":
    main()