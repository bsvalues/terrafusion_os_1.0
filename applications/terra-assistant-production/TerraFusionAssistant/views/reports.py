"""
TerraFusionPlatform Reports View

This module handles the reports display and generation functionality.
"""

import streamlit as st
import os
import time
from datetime import datetime
import pandas as pd
from typing import Dict, List, Any

# Import state management
from state_manager import get_state_manager

# Import design system
from design_system import section_title

# Import UI components
from components import display_report_card

def display_reports() -> None:
    """Display the reports interface."""
    # Display section title
    section_title("Reports", "View and generate project reports")
    
    # Get phase data from state manager
    state_manager = get_state_manager()
    phase_data = state_manager.get_phase_data()
    current_phase = state_manager.get_current_phase()
    
    # Define phases - mapping from phase_id to display name
    phases = {
        "planning": "Planning",
        "solution_design": "Solution Design",
        "ticket_breakdown": "Ticket Breakdown",
        "implementation": "Implementation",
        "testing": "Testing",
        "reporting": "Reporting"
    }
    
    # Check if exports directory exists
    if not os.path.exists("exports"):
        os.makedirs("exports")
        for phase in phases:
            os.makedirs(f"exports/{phase}", exist_ok=True)
    
    # Display report filters
    st.markdown("### Report Filters")
    
    # Create filter columns
    col1, col2 = st.columns(2)
    
    with col1:
        phase_filter = st.multiselect(
            "Phase", 
            list(phases.values()),
            default=list(phases.values())
        )
    
    with col2:
        report_type_filter = st.multiselect(
            "Report Type",
            ["UX Audit", "Data Flow Map", "Problem List", "Implementation Details", "Testing Results", "Project Completion"],
            default=["UX Audit", "Data Flow Map", "Problem List", "Implementation Details", "Testing Results", "Project Completion"]
        )
    
    # Display reports
    st.markdown("### Available Reports")
    
    # Get reports from exports directory
    reports = get_reports()
    
    # Filter reports based on selection
    if phase_filter:
        phase_ids = [phase_id for phase_id, phase_name in phases.items() if phase_name in phase_filter]
        reports = [r for r in reports if r["phase"] in phase_ids]
    
    if report_type_filter:
        reports = [r for r in reports if any(rt.lower() in r["title"].lower() for rt in report_type_filter)]
    
    # Display filtered reports
    if reports:
        # Sort reports by date (newest first)
        reports.sort(key=lambda x: x["timestamp"], reverse=True)
        
        # Create a tabular layout
        report_cols = st.columns([3, 2, 2, 1])
        report_cols[0].markdown("**Report Name**")
        report_cols[1].markdown("**Phase**")
        report_cols[2].markdown("**Date**")
        report_cols[3].markdown("**Actions**")
        
        st.markdown("<hr style='margin: 0.5rem 0; opacity: 0.2;'>", unsafe_allow_html=True)
        
        # Display each report
        for report in reports:
            cols = st.columns([3, 2, 2, 1])
            
            # Report name
            cols[0].markdown(f"**{report['title']}**")
            
            # Phase
            phase_name = phases.get(report["phase"], report["phase"].title())
            cols[1].markdown(phase_name)
            
            # Date
            date_str = report["timestamp"].strftime("%Y-%m-%d")
            cols[2].markdown(date_str)
            
            # Actions
            if cols[3].button("View", key=f"view_{report['filename']}"):
                # In a real application, this would open the report
                with open(f"exports/{report['phase']}/{report['filename']}", "r") as f:
                    report_content = f.read()
                
                st.session_state.selected_report = {
                    "title": report["title"],
                    "content": report_content,
                    "phase": report["phase"],
                    "timestamp": report["timestamp"],
                    "filename": report["filename"]
                }
            
            st.markdown("<hr style='margin: 0.5rem 0; opacity: 0.2;'>", unsafe_allow_html=True)
    else:
        st.info("No reports found. Use the Generate Reports feature to create new reports.")
    
    # Display selected report if any
    if hasattr(st.session_state, "selected_report"):
        st.markdown("### Report Viewer")
        
        # Display report details
        report = st.session_state.selected_report
        phase_name = phases.get(report["phase"], report["phase"].title())
        
        st.markdown(f"**{report['title']}**")
        st.markdown(f"Phase: {phase_name} | Date: {report['timestamp'].strftime('%Y-%m-%d')}")
        
        # Display report content
        st.text_area("Report Content", report["content"], height=300)
        
        # Download button (in a real app this would download the file)
        if st.button("Download Report"):
            st.success("Report downloaded successfully.")
        
        # Close report viewer
        if st.button("Close"):
            delattr(st.session_state, "selected_report")
            st.rerun()
    
    # Generate new report section
    st.markdown("### Generate New Report")
    
    # Report generation form
    with st.form("generate_report_form"):
        # Report type selection
        report_type = st.selectbox(
            "Report Type",
            ["UX Audit", "Data Flow Map", "Problem List", "New UX Plan", 
             "Data Awareness Strategy", "Technical Approach", "Ticket Breakdown", 
             "Implementation Details", "Testing Results", "Project Completion"]
        )
        
        # Report title
        report_title = st.text_input("Report Title", value=report_type)
        
        # Report phase
        report_phase = st.selectbox(
            "Phase",
            list(phases.keys()),
            format_func=lambda x: phases.get(x, x.title())
        )
        
        # Generate button
        submit_button = st.form_submit_button("Generate Report")
        
        if submit_button:
            # Create a sample report (in a real app this would generate actual content)
            create_sample_report(report_title, report_phase)
            
            # Success message
            st.success(f"Report '{report_title}' generated successfully.")
            
            # Reload to show new report
            time.sleep(1)
            st.rerun()

def get_reports() -> List[Dict[str, Any]]:
    """
    Get all available reports from the exports directory.
    
    Returns:
        List of report dictionaries
    """
    reports = []
    
    # Check if exports directory exists
    if not os.path.exists("exports"):
        return reports
    
    # Scan the exports directory for reports
    for phase in os.listdir("exports"):
        phase_dir = os.path.join("exports", phase)
        
        # Skip if not a directory
        if not os.path.isdir(phase_dir):
            continue
        
        # Scan phase directory for reports
        for filename in os.listdir(phase_dir):
            # Skip non-report files
            if not filename.endswith(".txt") and not filename.endswith(".md"):
                continue
            
            # Get report metadata
            try:
                # Get file creation time
                file_path = os.path.join(phase_dir, filename)
                create_time = os.path.getctime(file_path)
                
                # Determine title from filename
                title = os.path.splitext(filename)[0].replace("_", " ").title()
                
                # Add report to list
                reports.append({
                    "title": title,
                    "phase": phase,
                    "filename": filename,
                    "timestamp": datetime.fromtimestamp(create_time)
                })
            except Exception as e:
                print(f"Error reading report {filename}: {e}")
    
    return reports

def create_sample_report(title: str, phase: str) -> None:
    """
    Create a sample report for demonstration purposes.
    
    Args:
        title: Report title
        phase: Report phase
    """
    # Create exports directory if it doesn't exist
    if not os.path.exists("exports"):
        os.makedirs("exports")
    
    # Create phase directory if it doesn't exist
    phase_dir = f"exports/{phase}"
    if not os.path.exists(phase_dir):
        os.makedirs(phase_dir)
    
    # Format filename
    filename = f"{title.lower().replace(' ', '_')}.txt"
    
    # Create report content
    content = f"""
# {title}
Phase: {phase.replace('_', ' ').title()}
Date: {datetime.now().strftime('%Y-%m-%d')}

## Executive Summary
This is a sample report generated for the TerraFusionPlatform project.

## Findings
- Finding 1: Lorem ipsum dolor sit amet
- Finding 2: Consectetur adipiscing elit
- Finding 3: Sed do eiusmod tempor incididunt

## Recommendations
1. Improve code organization through modularization
2. Enhance user experience with better error handling
3. Implement centralized state management
4. Create a unified design system

## Next Steps
- Review findings with the team
- Prioritize recommendations
- Create implementation tickets
- Schedule follow-up meeting

Generated by TerraFusionPlatform
"""
    
    # Write report to file
    with open(f"{phase_dir}/{filename}", "w") as f:
        f.write(content)