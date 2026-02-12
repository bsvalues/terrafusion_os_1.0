import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import time
import json
import random
from model_interface import ModelInterface
from agent_base import AgentState

# Set page configuration
st.set_page_config(
    page_title="Agent Orchestration Dashboard",
    page_icon="🤖",
    layout="wide"
)

# Define custom CSS
st.markdown("""
<style>
    .agent-card {
        border-radius: 5px;
        padding: 15px;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        background-color: #f8f9fa;
    }
    .agent-header {
        font-size: 18px;
        font-weight: bold;
        color: #333;
        margin-bottom: 10px;
    }
    .agent-capability {
        display: inline-block;
        padding: 3px 8px;
        margin: 2px;
        font-size: 12px;
        border-radius: 12px;
        background-color: #e0e0e0;
    }
    .task-card {
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 5px;
        background-color: #f0f0f0;
        border-left: 4px solid #2196f3;
    }
    .task-title {
        font-weight: bold;
        color: #333;
    }
    .status-indicator {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 5px;
    }
    .status-idle {
        background-color: #9e9e9e;
    }
    .status-busy {
        background-color: #ff9800;
    }
    .status-learning {
        background-color: #2196f3;
    }
    .status-offline {
        background-color: #f44336;
    }
    .status-initializing {
        background-color: #4caf50;
    }
    .message-card {
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 5px;
    }
    .message-from {
        font-weight: bold;
        margin-bottom: 5px;
    }
    .message-request {
        background-color: #e3f2fd;
        border-left: 4px solid #2196f3;
    }
    .message-response {
        background-color: #e8f5e9;
        border-left: 4px solid #4caf50;
    }
    .message-broadcast {
        background-color: #fff8e1;
        border-left: 4px solid #ffc107;
    }
    .message-alert {
        background-color: #ffebee;
        border-left: 4px solid #f44336;
    }
    .agent-stats {
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        color: #333;
    }
    .agent-stats-label {
        font-size: 14px;
        color: #555;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'model_interface' not in st.session_state:
    st.session_state.model_interface = ModelInterface()
    
if 'agents' not in st.session_state:
    # Create simulated agents
    st.session_state.agents = [
        {
            "id": "code_quality_1",
            "name": "Code Quality Agent",
            "type": "code_quality",
            "capabilities": ["code_review", "style_check", "documentation_analysis"],
            "status": AgentState.IDLE,
            "tasks_completed": 12,
            "tasks_in_progress": 0,
            "last_active": "2025-04-25 09:45:23"
        },
        {
            "id": "arch_analysis_1",
            "name": "Architecture Analysis Agent",
            "type": "architecture",
            "capabilities": ["architecture_review", "dependency_analysis", "pattern_detection"],
            "status": AgentState.IDLE,
            "tasks_completed": 8,
            "tasks_in_progress": 0,
            "last_active": "2025-04-25 10:12:08"
        },
        {
            "id": "db_analysis_1",
            "name": "Database Analysis Agent",
            "type": "database",
            "capabilities": ["schema_analysis", "query_optimization", "performance_tuning"],
            "status": AgentState.IDLE,
            "tasks_completed": 5,
            "tasks_in_progress": 0,
            "last_active": "2025-04-25 08:34:19"
        },
        {
            "id": "doc_agent_1",
            "name": "Documentation Agent",
            "type": "documentation",
            "capabilities": ["doc_generation", "coverage_analysis", "consistency_check"],
            "status": AgentState.IDLE,
            "tasks_completed": 15,
            "tasks_in_progress": 0,
            "last_active": "2025-04-25 11:02:40"
        },
        {
            "id": "learn_coord_1",
            "name": "Learning Coordinator",
            "type": "learning",
            "capabilities": ["pattern_identification", "feedback_analysis", "model_evaluation"],
            "status": AgentState.IDLE,
            "tasks_completed": 3,
            "tasks_in_progress": 0,
            "last_active": "2025-04-25 07:55:12"
        }
    ]
    
if 'tasks' not in st.session_state:
    # Create simulated task history
    st.session_state.tasks = [
        {
            "id": "task-001",
            "agent_id": "code_quality_1",
            "type": "code_review",
            "status": "completed",
            "created_at": "2025-04-25 08:30:45",
            "completed_at": "2025-04-25 08:32:10",
            "priority": "medium",
            "description": "Review code quality for login module"
        },
        {
            "id": "task-002",
            "agent_id": "arch_analysis_1",
            "type": "architecture_review",
            "status": "completed",
            "created_at": "2025-04-25 09:15:12",
            "completed_at": "2025-04-25 09:18:45",
            "priority": "high",
            "description": "Analyze API architecture for scalability"
        },
        {
            "id": "task-003",
            "agent_id": "db_analysis_1",
            "type": "query_optimization",
            "status": "completed",
            "created_at": "2025-04-25 08:20:33",
            "completed_at": "2025-04-25 08:23:10",
            "priority": "high",
            "description": "Optimize user search queries"
        }
    ]
    
if 'messages' not in st.session_state:
    # Create simulated message history
    st.session_state.messages = [
        {
            "id": "msg-001",
            "from_agent": "code_quality_1",
            "to_agent": "arch_analysis_1",
            "type": "request",
            "content": "Requesting architectural context for module review",
            "timestamp": "2025-04-25 09:30:45"
        },
        {
            "id": "msg-002",
            "from_agent": "arch_analysis_1",
            "to_agent": "code_quality_1",
            "type": "response",
            "content": "Architecture information for login module provided",
            "timestamp": "2025-04-25 09:31:20"
        },
        {
            "id": "msg-003",
            "from_agent": "learn_coord_1",
            "to_agent": "all",
            "type": "broadcast",
            "content": "New code quality pattern identified: excessive nested conditionals",
            "timestamp": "2025-04-25 10:05:15"
        }
    ]
    
if 'active_tasks' not in st.session_state:
    # No active tasks initially
    st.session_state.active_tasks = []

# Helper functions
def get_status_class(status):
    """Get CSS class for agent status"""
    if status == AgentState.IDLE:
        return "status-idle"
    elif status == AgentState.BUSY:
        return "status-busy"
    elif status == AgentState.LEARNING:
        return "status-learning"
    elif status == AgentState.OFFLINE:
        return "status-offline"
    else:  # INITIALIZING
        return "status-initializing"

def get_status_text(status):
    """Get text representation of agent status"""
    return status.value.capitalize()

def get_message_class(msg_type):
    """Get CSS class for message type"""
    if msg_type == "request":
        return "message-request"
    elif msg_type == "response":
        return "message-response"
    elif msg_type == "broadcast":
        return "message-broadcast"
    else:  # alert
        return "message-alert"

def simulate_task_execution():
    """Simulate task execution for demo purposes"""
    if not st.session_state.active_tasks:
        return
    
    # Update task progress
    for task in st.session_state.active_tasks:
        # Simulate progress
        task["progress"] = min(100, task.get("progress", 0) + random.randint(10, 30))
        
        # If task is complete, move to history
        if task["progress"] >= 100:
            task["status"] = "completed"
            task["completed_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
            
            # Find agent and update its status
            for agent in st.session_state.agents:
                if agent["id"] == task["agent_id"]:
                    agent["status"] = AgentState.IDLE
                    agent["tasks_completed"] += 1
                    agent["tasks_in_progress"] = 0
                    agent["last_active"] = task["completed_at"]
                    
                    # Add a message about task completion
                    new_msg = {
                        "id": f"msg-{len(st.session_state.messages) + 1:03d}",
                        "from_agent": agent["id"],
                        "to_agent": "all",
                        "type": "broadcast",
                        "content": f"Task '{task['description']}' completed",
                        "timestamp": task["completed_at"]
                    }
                    st.session_state.messages.append(new_msg)
                    break
            
            # Add to task history
            st.session_state.tasks.append(task)
    
    # Remove completed tasks
    st.session_state.active_tasks = [t for t in st.session_state.active_tasks if t["status"] != "completed"]

# Sidebar
st.sidebar.title("Agent System Controls")

# System Status
system_status = "Online" if st.session_state.model_interface.check_openai_status() or st.session_state.model_interface.check_anthropic_status() else "Limited Functionality"
st.sidebar.markdown(f"**System Status:** {system_status}")

# Agent Operations
st.sidebar.header("Agent Operations")

# Select agent for new task
selected_agent = st.sidebar.selectbox(
    "Select Agent",
    options=[agent["id"] for agent in st.session_state.agents],
    format_func=lambda x: next((a["name"] for a in st.session_state.agents if a["id"] == x), x)
)

selected_agent_info = next((a for a in st.session_state.agents if a["id"] == selected_agent), None)

if selected_agent_info:
    # Get capabilities for the selected agent
    capabilities = selected_agent_info.get("capabilities", [])
    
    task_type = st.sidebar.selectbox(
        "Task Type",
        options=capabilities
    )
    
    task_priority = st.sidebar.selectbox(
        "Priority",
        options=["low", "medium", "high"]
    )
    
    task_description = st.sidebar.text_area(
        "Task Description",
        placeholder="Enter task description..."
    )
    
    # Create task button
    if st.sidebar.button("Create Task"):
        if task_description.strip():
            # Check if agent is available
            if selected_agent_info["status"] == AgentState.IDLE:
                # Create new task
                new_task = {
                    "id": f"task-{len(st.session_state.tasks) + len(st.session_state.active_tasks) + 1:03d}",
                    "agent_id": selected_agent,
                    "type": task_type,
                    "status": "in_progress",
                    "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "completed_at": None,
                    "priority": task_priority,
                    "description": task_description,
                    "progress": 0
                }
                
                # Update agent status
                for agent in st.session_state.agents:
                    if agent["id"] == selected_agent:
                        agent["status"] = AgentState.BUSY
                        agent["tasks_in_progress"] = 1
                        agent["last_active"] = new_task["created_at"]
                        break
                
                # Add task to active tasks
                st.session_state.active_tasks.append(new_task)
                
                st.sidebar.success("Task created successfully!")
            else:
                st.sidebar.error(f"Agent is currently {selected_agent_info['status'].value} and cannot accept new tasks.")
        else:
            st.sidebar.error("Task description is required.")

# Agent Communication
st.sidebar.header("Agent Communication")

# Select sender and recipient
sender_agent = st.sidebar.selectbox(
    "From Agent",
    options=[agent["id"] for agent in st.session_state.agents],
    format_func=lambda x: next((a["name"] for a in st.session_state.agents if a["id"] == x), x),
    key="sender"
)

message_type = st.sidebar.selectbox(
    "Message Type",
    options=["request", "response", "broadcast", "alert"]
)

if message_type == "broadcast":
    recipient_agent = "all"
else:
    recipient_agent = st.sidebar.selectbox(
        "To Agent",
        options=[agent["id"] for agent in st.session_state.agents if agent["id"] != sender_agent] + ["all"],
        format_func=lambda x: "All Agents" if x == "all" else next((a["name"] for a in st.session_state.agents if a["id"] == x), x),
        key="recipient"
    )

message_content = st.sidebar.text_area(
    "Message Content",
    placeholder="Enter message content..."
)

# Send message button
if st.sidebar.button("Send Message"):
    if message_content.strip():
        # Create new message
        new_message = {
            "id": f"msg-{len(st.session_state.messages) + 1:03d}",
            "from_agent": sender_agent,
            "to_agent": recipient_agent,
            "type": message_type,
            "content": message_content,
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Add message to history
        st.session_state.messages.append(new_message)
        
        st.sidebar.success("Message sent successfully!")
    else:
        st.sidebar.error("Message content is required.")

# Add navigation back to homepage
if st.sidebar.button("Back to Home"):
    st.switch_page("app.py")

# Main content
st.title("Agent Orchestration Dashboard")

# Agent System Overview
st.header("Agent System Overview")

# Summary metrics
col1, col2, col3, col4, col5 = st.columns(5)

with col1:
    st.markdown(
        f"<div class='agent-stats'>{len(st.session_state.agents)}</div>"
        f"<div class='agent-stats-label'>Total Agents</div>",
        unsafe_allow_html=True
    )

with col2:
    active_agents = sum(1 for a in st.session_state.agents if a["status"] != AgentState.OFFLINE)
    st.markdown(
        f"<div class='agent-stats'>{active_agents}</div>"
        f"<div class='agent-stats-label'>Active Agents</div>",
        unsafe_allow_html=True
    )

with col3:
    busy_agents = sum(1 for a in st.session_state.agents if a["status"] == AgentState.BUSY)
    st.markdown(
        f"<div class='agent-stats'>{busy_agents}</div>"
        f"<div class='agent-stats-label'>Busy Agents</div>",
        unsafe_allow_html=True
    )

with col4:
    total_completed = sum(a["tasks_completed"] for a in st.session_state.agents)
    st.markdown(
        f"<div class='agent-stats'>{total_completed}</div>"
        f"<div class='agent-stats-label'>Tasks Completed</div>",
        unsafe_allow_html=True
    )

with col5:
    active_tasks_count = len(st.session_state.active_tasks)
    st.markdown(
        f"<div class='agent-stats'>{active_tasks_count}</div>"
        f"<div class='agent-stats-label'>Tasks In Progress</div>",
        unsafe_allow_html=True
    )

# Tabs for different views
tab1, tab2, tab3 = st.tabs(["Agent Status", "Task Management", "Agent Communication"])

with tab1:
    st.subheader("Agent Status")
    
    # Run simulation step
    simulate_task_execution()
    
    # Display agent cards
    for agent in st.session_state.agents:
        status_class = get_status_class(agent["status"])
        status_text = get_status_text(agent["status"])
        
        st.markdown(
            f"<div class='agent-card'>"
            f"<div class='agent-header'>{agent['name']} <span class='{status_class} status-indicator'></span> {status_text}</div>"
            f"<div>ID: {agent['id']}</div>"
            f"<div>Type: {agent['type']}</div>"
            f"<div>Tasks Completed: {agent['tasks_completed']}</div>"
            f"<div>Tasks In Progress: {agent['tasks_in_progress']}</div>"
            f"<div>Last Active: {agent['last_active']}</div>"
            f"<div style='margin-top: 10px'>Capabilities: "
            + " ".join([f"<span class='agent-capability'>{cap}</span>" for cap in agent['capabilities']])
            + "</div>"
            f"</div>",
            unsafe_allow_html=True
        )

with tab2:
    st.subheader("Task Management")
    
    # Active Tasks
    st.markdown("### Active Tasks")
    
    if st.session_state.active_tasks:
        for task in st.session_state.active_tasks:
            agent_name = next((a["name"] for a in st.session_state.agents if a["id"] == task["agent_id"]), task["agent_id"])
            
            # Display task card with progress bar
            st.markdown(
                f"<div class='task-card'>"
                f"<div class='task-title'>{task['description']}</div>"
                f"<div>ID: {task['id']}</div>"
                f"<div>Agent: {agent_name}</div>"
                f"<div>Type: {task['type']}</div>"
                f"<div>Priority: {task['priority']}</div>"
                f"<div>Created: {task['created_at']}</div>"
                f"</div>",
                unsafe_allow_html=True
            )
            
            # Add progress bar
            st.progress(task["progress"] / 100)
    else:
        st.info("No active tasks.")
    
    # Task History
    st.markdown("### Task History")
    
    if st.session_state.tasks:
        # Convert tasks to DataFrame for display
        df_tasks = pd.DataFrame(st.session_state.tasks)
        
        # Add agent name column
        df_tasks["agent_name"] = df_tasks["agent_id"].apply(
            lambda x: next((a["name"] for a in st.session_state.agents if a["id"] == x), x)
        )
        
        # Select columns for display
        display_cols = [
            "id", "agent_name", "type", "status", "priority", 
            "created_at", "completed_at", "description"
        ]
        
        # Filter columns that exist
        display_cols = [col for col in display_cols if col in df_tasks.columns]
        
        # Show dataframe
        st.dataframe(df_tasks[display_cols], use_container_width=True)
    else:
        st.info("No task history.")

with tab3:
    st.subheader("Agent Communication")
    
    # Display message history
    if st.session_state.messages:
        for message in reversed(st.session_state.messages):  # Show newest first
            sender_name = next((a["name"] for a in st.session_state.agents if a["id"] == message["from_agent"]), message["from_agent"])
            
            if message["to_agent"] == "all":
                recipient_name = "All Agents"
            else:
                recipient_name = next((a["name"] for a in st.session_state.agents if a["id"] == message["to_agent"]), message["to_agent"])
            
            msg_class = get_message_class(message["type"])
            
            st.markdown(
                f"<div class='message-card {msg_class}'>"
                f"<div class='message-from'>{sender_name} → {recipient_name} ({message['timestamp']})</div>"
                f"<div>{message['content']}</div>"
                f"</div>",
                unsafe_allow_html=True
            )
    else:
        st.info("No message history.")