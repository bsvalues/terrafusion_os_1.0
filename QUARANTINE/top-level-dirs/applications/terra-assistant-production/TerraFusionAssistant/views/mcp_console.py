"""
TerraFusionPlatform MCP Console View

This module handles the Multi-agent Coordination Platform (MCP) console interface.
"""

import streamlit as st
import json
import time
from datetime import datetime
from typing import Dict, Any, List

# Import design system
from design_system import section_title

# Import UI components
from components import create_mcp_command_console

# Import MCP Core
from mcp_core import execute_mission

def display_mcp_console() -> None:
    """Display the MCP console interface."""
    # Display section title
    section_title("MCP Console", "Command and control interface for AI agents")
    
    # MCP explanation
    st.markdown("""
    The **Multi-agent Coordination Platform (MCP)** is an advanced AI-driven system that orchestrates 
    multiple specialized agents to perform complex software development tasks. 
    
    Use this console to issue high-level commands that will be automatically broken down into sub-tasks 
    and distributed to the appropriate agents.
    """)
    
    # Display the core status indicators
    display_core_status()
    
    # Display command console
    create_mcp_command_console(on_execute_mission)
    
    # Display mission logs if any
    if "mission_logs" in st.session_state:
        display_mission_logs()

def display_core_status() -> None:
    """Display MCP core status indicators."""
    # Create columns for status indicators
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        display_status_indicator("Core Services", "online", "#4CAF50")
    
    with col2:
        display_status_indicator("Agent Network", "operational", "#4CAF50")
    
    with col3:
        display_status_indicator("Resource Pool", "optimized", "#4CAF50")
    
    with col4:
        display_status_indicator("Integration Services", "active", "#4CAF50")

def display_status_indicator(name: str, status: str, color: str) -> None:
    """
    Display a status indicator.
    
    Args:
        name: Name of the service
        status: Status text
        color: Status color
    """
    st.markdown(f"""
    <div style="display: flex; align-items: center; padding: 1rem; border-radius: 0.5rem; background-color: rgba(0,0,0,0.1);">
        <div style="margin-right: 0.75rem; width: 12px; height: 12px; border-radius: 50%; background-color: {color}; 
                   box-shadow: 0 0 5px {color};"></div>
        <div>
            <div style="font-weight: 600;">{name}</div>
            <div style="font-size: 0.8rem; text-transform: uppercase;">{status}</div>
        </div>
    </div>
    """, unsafe_allow_html=True)

def on_execute_mission(mission_type: str, params: Dict[str, str]) -> None:
    """
    Handle mission execution.
    
    Args:
        mission_type: Type of mission to execute
        params: Mission parameters
    """
    # Initialize mission logs if not already
    if "mission_logs" not in st.session_state:
        st.session_state.mission_logs = []
    
    # Create a new mission log entry
    mission_log = {
        "mission_type": mission_type,
        "params": params,
        "status": "running",
        "start_time": datetime.now(),
        "logs": [
            {
                "timestamp": datetime.now(),
                "agent": "MCP Core",
                "message": f"Mission '{mission_type}' initiated with parameters {json.dumps(params)}"
            }
        ]
    }
    
    # Add to mission logs
    st.session_state.mission_logs.insert(0, mission_log)
    
    try:
        # Execute the actual mission using MCP Core
        result = execute_mission(mission_type, params)
        
        # Add success log entry
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "MCP Core",
            "message": result
        })
        
        # Mark mission as completed
        mission_log["status"] = "completed"
        mission_log["end_time"] = datetime.now()
        
        # Display success message
        st.success(result)
        
    except Exception as e:
        # Add error log entry
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "MCP Core",
            "message": f"Error: {str(e)}"
        })
        
        # Mark mission as failed
        mission_log["status"] = "failed"
        mission_log["end_time"] = datetime.now()
        
        # Display error message
        st.error(f"Mission failed: {str(e)}")
        
    # Add additional simulated log entries for richer UI
    simulate_mission_execution(mission_type, params)

def simulate_mission_execution(mission_type: str, params: Dict[str, str]) -> None:
    """
    Simulate mission execution by adding log entries.
    
    Args:
        mission_type: Type of mission
        params: Mission parameters
    """
    # In a real application, this would be handled by backend services
    # Here we're just simulating log entries
    
    # Get the mission log (it's the first one, which we just added)
    mission_log = st.session_state.mission_logs[0]
    
    # Add simulated log entries based on mission type
    if mission_type == "scaffold":
        plugin_name = params.get("plugin_name", "new_plugin")
        base_path = params.get("base_path", "generated_plugins/")
        
        # Add log entries
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "ArchitectAgent",
            "message": f"Analyzing project structure for plugin scaffolding: {plugin_name}"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "TemplateAgent",
            "message": f"Selecting optimal template for plugin type"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "CodegenAgent",
            "message": f"Generating plugin skeleton at {base_path}{plugin_name}"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "IntegrationAgent",
            "message": f"Creating integration hooks for plugin: {plugin_name}"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "TestingAgent",
            "message": f"Generating unit test scaffold for plugin"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "MCP Core",
            "message": f"Plugin scaffold completed successfully"
        })
    
    elif mission_type == "test":
        service = params.get("service", "valuation_service")
        
        # Add log entries
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "TestPlannerAgent",
            "message": f"Analyzing {service} for test coverage strategy"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "TestCaseAgent",
            "message": f"Generating test cases for {service} API endpoints"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "SecurityAgent",
            "message": f"Adding security-focused test cases for vulnerability prevention"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "TestRunnerAgent",
            "message": f"Executing test suite for {service}"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "TestReporterAgent",
            "message": f"Compiling test results for {service}"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "MCP Core",
            "message": f"Testing mission completed successfully"
        })
    
    elif mission_type == "secure":
        target_path = params.get("target_path", "src/")
        
        # Add log entries
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "SecurityAnalysisAgent",
            "message": f"Scanning {target_path} for security vulnerabilities"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "CodeAnalysisAgent",
            "message": f"Identifying potentially insecure patterns"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "SecurityAgent",
            "message": f"Generating security recommendations for identified issues"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "RemediationAgent",
            "message": f"Creating remediation plan for security issues"
        })
        
        mission_log["logs"].append({
            "timestamp": datetime.now(),
            "agent": "MCP Core",
            "message": f"Security analysis completed successfully"
        })
    
    # Mark the mission as completed
    mission_log["status"] = "completed"
    mission_log["end_time"] = datetime.now()

def display_mission_logs() -> None:
    """Display MCP mission logs."""
    st.markdown("### Mission Logs")
    
    # Display each mission log
    for idx, mission in enumerate(st.session_state.mission_logs):
        # Create a unique key for this mission
        mission_key = f"mission_{idx}"
        
        # Mission status indicator
        status_color = "#4CAF50" if mission["status"] == "completed" else "#FFC107"
        status_text = mission["status"].upper()
        
        # Format times
        start_time = mission["start_time"].strftime("%Y-%m-%d %H:%M:%S")
        end_time = mission.get("end_time", "").strftime("%Y-%m-%d %H:%M:%S") if "end_time" in mission else "In Progress"
        
        # Mission header
        with st.expander(f"{mission['mission_type'].title()} Mission - {status_text}", expanded=(idx == 0)):
            # Mission details
            st.markdown(f"""
            **Started:** {start_time}  
            **Completed:** {end_time}  
            **Parameters:** {json.dumps(mission['params'])}
            """)
            
            # Log entries
            st.markdown("#### Log Entries")
            
            for log in mission["logs"]:
                timestamp = log["timestamp"].strftime("%H:%M:%S")
                
                st.markdown(f"""
                <div style="display: flex; margin-bottom: 0.5rem;">
                    <div style="min-width: 80px; color: #888;">{timestamp}</div>
                    <div style="min-width: 150px; font-weight: 600;">{log['agent']}</div>
                    <div>{log['message']}</div>
                </div>
                """, unsafe_allow_html=True)