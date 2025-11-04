import streamlit as st
import pandas as pd
import numpy as np
import time
import re
import json
import os
from datetime import datetime
from model_interface import ModelInterface

# Set page configuration
st.set_page_config(
    page_title="AI Chat Interface",
    page_icon="💬",
    layout="wide"
)

# Define custom CSS
st.markdown("""
<style>
    .chat-container {
        border-radius: 10px;
        border: 1px solid #ddd;
        padding: 20px;
        margin-bottom: 20px;
        background-color: #f8f9fa;
        height: 400px;
        overflow-y: auto;
    }
    .user-message {
        background-color: #e3f2fd;
        border-radius: 15px 15px 0 15px;
        padding: 10px 15px;
        margin: 5px 0;
        margin-left: 20%;
        max-width: 80%;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .assistant-message {
        background-color: #f0f0f0;
        border-radius: 15px 15px 15px 0;
        padding: 10px 15px;
        margin: 5px 0;
        margin-right: 20%;
        max-width: 80%;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }
    .message-content {
        margin: 0;
        font-size: 16px;
    }
    .message-time {
        font-size: 12px;
        color: #888;
        text-align: right;
        margin-top: 5px;
    }
    .message-sender {
        font-weight: bold;
        margin-bottom: 5px;
    }
    .typing-indicator {
        display: inline-block;
        width: 20px;
        text-align: left;
    }
    .panel-header {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
    }
    .agent-chip {
        display: inline-block;
        padding: 4px 12px;
        margin-right: 8px;
        margin-bottom: 8px;
        border-radius: 20px;
        font-size: 14px;
        background-color: #e8f5e9;
        color: #333;
        cursor: pointer;
    }
    .agent-chip.active {
        background-color: #4caf50;
        color: white;
    }
    .code-block {
        background-color: #f5f5f5;
        border-radius: 5px;
        padding: 10px;
        margin: 10px 0;
        overflow-x: auto;
        font-family: monospace;
    }
    .tools-panel {
        background-color: #f0f0f0;
        border-radius: 10px;
        padding: 15px;
        margin-bottom: 15px;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'model_interface' not in st.session_state:
    st.session_state.model_interface = ModelInterface()

if 'chat_history' not in st.session_state:
    st.session_state.chat_history = []

if 'active_agents' not in st.session_state:
    st.session_state.active_agents = ["CodeQualityAgent"]

if 'code_context' not in st.session_state:
    st.session_state.code_context = None

# Helper functions
def process_message(message, active_agents):
    """Process a user message and generate AI response"""
    if not st.session_state.model_interface.check_openai_status() and not st.session_state.model_interface.check_anthropic_status():
        return "I'm sorry, but I don't have access to AI services at the moment. Please configure API keys to continue."
    
    # Format active agents as context
    agent_context = "\n".join([f"- {agent}" for agent in active_agents])
    
    # Add code context if provided
    code_snippet = ""
    if st.session_state.code_context:
        code_lang = st.session_state.code_context.get("language", "")
        code_content = st.session_state.code_context.get("code", "")
        code_snippet = f"\nCode context (in {code_lang}):\n```{code_lang}\n{code_content}\n```\n"
    
    # Build system message
    system_message = f"""
    You are an AI assistant specialized in software development and code analysis.
    You have access to the following specialized agents for detailed analysis:
    {agent_context}
    
    When providing code examples, wrap them in markdown code blocks with the appropriate language tag.
    Be clear, concise, and helpful in your responses.
    {code_snippet}
    """
    
    # Get response from model
    try:
        # Determine which provider to use
        provider = "openai" if st.session_state.model_interface.check_openai_status() else "anthropic"
        
        response = st.session_state.model_interface.generate_text(
            prompt=message,
            system_message=system_message,
            provider=provider
        )
        
        return response
    except Exception as e:
        return f"I encountered an error: {str(e)}"

def format_code_blocks(text):
    """Format code blocks in markdown to display properly"""
    # Replace code blocks with styled divs
    pattern = r"```([a-zA-Z0-9]*)\n(.*?)```"
    
    def replacement(match):
        language = match.group(1) or ""
        code = match.group(2)
        return f'<div class="code-block"><div>{language}</div>{code}</div>'
    
    formatted_text = re.sub(pattern, replacement, text, flags=re.DOTALL)
    return formatted_text

# Sidebar
st.sidebar.title("Chat Configuration")

# Model selection
st.sidebar.subheader("AI Model")
if st.session_state.model_interface.check_openai_status():
    st.sidebar.success("✅ OpenAI API Connected")
    preferred_model = "openai"
else:
    st.sidebar.error("❌ OpenAI API Not Connected")
    
if st.session_state.model_interface.check_anthropic_status():
    st.sidebar.success("✅ Anthropic API Connected")
    if not st.session_state.model_interface.check_openai_status():
        preferred_model = "anthropic"
else:
    st.sidebar.error("❌ Anthropic API Not Connected")

if not (st.session_state.model_interface.check_openai_status() or st.session_state.model_interface.check_anthropic_status()):
    st.sidebar.warning("⚠️ No AI models connected. Please configure API keys.")

# Agent selection
st.sidebar.subheader("Active Agents")
st.sidebar.markdown("Select the specialized agents to activate:")

agents = [
    "CodeQualityAgent",
    "ArchitectureAgent",
    "DatabaseAgent",
    "DocumentationAgent",
    "SecurityAgent",
    "PerformanceAgent"
]

# Use columns to display agent checkboxes
col1, col2 = st.sidebar.columns(2)
active_agents = []

for i, agent in enumerate(agents):
    col = col1 if i % 2 == 0 else col2
    if col.checkbox(agent, value=agent in st.session_state.active_agents):
        active_agents.append(agent)

st.session_state.active_agents = active_agents

# Code context
st.sidebar.subheader("Code Context")
code_language = st.sidebar.selectbox(
    "Language",
    ["Python", "JavaScript", "TypeScript", "Java", "C#", "Go", "SQL", "None"],
    index=7  # Default to "None"
)

if code_language != "None":
    code_content = st.sidebar.text_area(
        f"Add {code_language} code context",
        height=200,
        placeholder=f"Paste {code_language} code here to provide context for the AI..."
    )
    
    if code_content:
        st.session_state.code_context = {
            "language": code_language.lower(),
            "code": code_content
        }
    elif st.sidebar.button("Clear Code Context"):
        st.session_state.code_context = None
else:
    st.session_state.code_context = None

# Chat history controls
if st.session_state.chat_history:
    if st.sidebar.button("Clear Chat History"):
        st.session_state.chat_history = []
        st.sidebar.success("Chat history cleared!")

# Add navigation back to homepage
if st.sidebar.button("Back to Home"):
    st.switch_page("app.py")

# Main content
st.title("AI Chat Interface")

# AI capability description
st.markdown("""
This interactive chat interface allows you to communicate with specialized AI agents trained for software analysis.
Each agent brings unique capabilities for analyzing different aspects of your code or software architecture.

**Available Agents:**
- **CodeQualityAgent**: Analyzes code quality, style, and readability
- **ArchitectureAgent**: Evaluates software architecture and design patterns
- **DatabaseAgent**: Specializes in database schema and query optimization
- **DocumentationAgent**: Assesses documentation completeness and quality
- **SecurityAgent**: Identifies potential security vulnerabilities
- **PerformanceAgent**: Analyzes and optimizes code performance
""")

# Check if AI services are available
if not (st.session_state.model_interface.check_openai_status() or st.session_state.model_interface.check_anthropic_status()):
    st.warning("⚠️ No AI models are currently connected. Please configure OpenAI or Anthropic API keys to use this feature.")

# Active agent display
st.markdown("### Active Agents")
if active_agents:
    agent_html = "".join([f'<div class="agent-chip active">{agent}</div>' for agent in active_agents])
    st.markdown(f'<div>{agent_html}</div>', unsafe_allow_html=True)
else:
    st.warning("No agents are currently active. Please select at least one agent from the sidebar.")

# Code context display
if st.session_state.code_context:
    with st.expander("Code Context", expanded=False):
        st.code(st.session_state.code_context["code"], language=st.session_state.code_context["language"])

# Chat container
st.markdown("### Chat")
chat_container = st.container()

# Message input
user_message = st.text_area("Type your message", height=100, placeholder="Ask me anything about code, architecture, or development...")
col1, col2 = st.columns([6, 1])
with col2:
    if st.button("Send", use_container_width=True, disabled=not active_agents):
        if user_message:
            # Add user message to chat history
            st.session_state.chat_history.append({
                "role": "user",
                "content": user_message,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            })
            
            # Show a spinner while generating response
            with st.spinner("AI is thinking..."):
                # Process message and get response
                response = process_message(user_message, active_agents)
                
                # Add AI response to chat history
                st.session_state.chat_history.append({
                    "role": "assistant",
                    "content": response,
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })
            
            # Clear the input area
            st.experimental_rerun()

# Display chat history
with chat_container:
    st.markdown('<div class="chat-container">', unsafe_allow_html=True)
    
    if not st.session_state.chat_history:
        st.markdown('<div style="text-align: center; color: #888; margin-top: 150px;">Start a conversation by typing a message below.</div>', unsafe_allow_html=True)
    else:
        for message in st.session_state.chat_history:
            if message["role"] == "user":
                st.markdown(f"""
                <div class="user-message">
                    <div class="message-sender">You</div>
                    <div class="message-content">{message["content"]}</div>
                    <div class="message-time">{message["timestamp"]}</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                # Format any code blocks in the assistant's message
                formatted_content = format_code_blocks(message["content"])
                
                st.markdown(f"""
                <div class="assistant-message">
                    <div class="message-sender">AI Assistant</div>
                    <div class="message-content">{formatted_content}</div>
                    <div class="message-time">{message["timestamp"]}</div>
                </div>
                """, unsafe_allow_html=True)
    
    st.markdown('</div>', unsafe_allow_html=True)

# Tools panel
with st.expander("Developer Tools", expanded=False):
    st.markdown('<div class="panel-header">Quick Tools</div>', unsafe_allow_html=True)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("Generate Code Documentation"):
            prompt = "Please help me generate comprehensive documentation for the provided code. Include function purpose, parameters, return values, and usage examples."
            
            # Add user message to chat history
            st.session_state.chat_history.append({
                "role": "user",
                "content": prompt,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            })
            
            # Show a spinner while generating response
            with st.spinner("Generating documentation..."):
                # Process message and get response
                response = process_message(prompt, active_agents)
                
                # Add AI response to chat history
                st.session_state.chat_history.append({
                    "role": "assistant",
                    "content": response,
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })
            
            st.experimental_rerun()
    
    with col2:
        if st.button("Code Review"):
            prompt = "Please review the provided code for quality issues, potential bugs, and improvements. Focus on style, efficiency, best practices, and maintainability."
            
            # Add user message to chat history
            st.session_state.chat_history.append({
                "role": "user",
                "content": prompt,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            })
            
            # Show a spinner while generating response
            with st.spinner("Reviewing code..."):
                # Process message and get response
                response = process_message(prompt, active_agents)
                
                # Add AI response to chat history
                st.session_state.chat_history.append({
                    "role": "assistant",
                    "content": response,
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })
            
            st.experimental_rerun()
    
    with col3:
        if st.button("Optimize Performance"):
            prompt = "Please analyze the code for performance issues and suggest optimizations. Focus on time complexity, memory usage, and efficient algorithms."
            
            # Add user message to chat history
            st.session_state.chat_history.append({
                "role": "user",
                "content": prompt,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            })
            
            # Show a spinner while generating response
            with st.spinner("Analyzing performance..."):
                # Process message and get response
                response = process_message(prompt, active_agents)
                
                # Add AI response to chat history
                st.session_state.chat_history.append({
                    "role": "assistant",
                    "content": response,
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })
            
            st.experimental_rerun()
    
    # Second row of tools
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("Explain Code"):
            prompt = "Please explain how the provided code works in simple terms. Break down the logic and functionality step by step."
            
            # Add user message to chat history
            st.session_state.chat_history.append({
                "role": "user",
                "content": prompt,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            })
            
            # Show a spinner while generating response
            with st.spinner("Explaining code..."):
                # Process message and get response
                response = process_message(prompt, active_agents)
                
                # Add AI response to chat history
                st.session_state.chat_history.append({
                    "role": "assistant",
                    "content": response,
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })
            
            st.experimental_rerun()
    
    with col2:
        if st.button("Security Check"):
            prompt = "Please analyze the code for security vulnerabilities, such as SQL injection, XSS, CSRF, or other common security issues. Suggest fixes for any issues found."
            
            # Add user message to chat history
            st.session_state.chat_history.append({
                "role": "user",
                "content": prompt,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            })
            
            # Show a spinner while generating response
            with st.spinner("Checking security..."):
                # Process message and get response
                response = process_message(prompt, active_agents)
                
                # Add AI response to chat history
                st.session_state.chat_history.append({
                    "role": "assistant",
                    "content": response,
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })
            
            st.experimental_rerun()
    
    with col3:
        if st.button("Generate Test Cases"):
            prompt = "Please help me generate comprehensive test cases for the provided code. Include unit tests covering various scenarios, edge cases, and possible failure modes."
            
            # Add user message to chat history
            st.session_state.chat_history.append({
                "role": "user",
                "content": prompt,
                "timestamp": datetime.now().strftime("%H:%M:%S")
            })
            
            # Show a spinner while generating response
            with st.spinner("Generating test cases..."):
                # Process message and get response
                response = process_message(prompt, active_agents)
                
                # Add AI response to chat history
                st.session_state.chat_history.append({
                    "role": "assistant",
                    "content": response,
                    "timestamp": datetime.now().strftime("%H:%M:%S")
                })
            
            st.experimental_rerun()