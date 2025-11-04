"""
Navigation Components Module

This module provides standardized navigation components for the TerraFusion UI.
"""
import streamlit as st
import os
from typing import List, Tuple, Dict, Optional, Union, Any

# Define the navigation structure with improved organization
NAVIGATION = [
    {"name": "Home", "icon": "🏠", "url": "/", "description": "Main dashboard and system overview", "category": "main"},
    
    # DevOps Core Services
    {"name": "Sync Service", "icon": "🔄", "url": "/Sync_Service_Dashboard", "description": "Data synchronization and ETL operations", "category": "devops"},
    {"name": "Workflow Visualization", "icon": "📊", "url": "/Workflow_Visualization", "description": "Visualize and optimize development workflows", "category": "devops"},
    {"name": "Agent Orchestration", "icon": "🤖", "url": "/Agent_Orchestration", "description": "Manage AI agent deployment and coordination", "category": "devops"},
    
    # Analysis Tools
    {"name": "Code Analysis", "icon": "🔍", "url": "/Code_Analysis_Dashboard", "description": "Code quality and architecture analysis", "category": "analysis"},
    {"name": "Repository Analysis", "icon": "📁", "url": "/Repository_Analysis", "description": "Repository health and structure analysis", "category": "analysis"},
    
    # Utilities
    {"name": "AI Chat Interface", "icon": "💬", "url": "/AI_Chat_Interface", "description": "Interact with AI assistants", "category": "utilities"},
    {"name": "API Status", "icon": "📡", "url": "/API_Status", "description": "Check API and service connectivity", "category": "utilities"},
]

# Define Navigation Categories
CATEGORIES = [
    {"id": "main", "name": "Overview", "icon": "📊"},
    {"id": "devops", "name": "DevOps Tools", "icon": "🛠️"},
    {"id": "analysis", "name": "Analysis", "icon": "📈"},
    {"id": "utilities", "name": "Utilities", "icon": "🧰"},
]

def get_current_page_name() -> str:
    """
    Get the current page name from the URL.
    
    Returns:
        str: The current page name
    """
    # Try to get the current script path
    try:
        # Get the script path from the session state if it's been set
        if 'current_page' in st.session_state:
            return st.session_state.current_page
        
        # Otherwise use the current main script path
        import inspect
        import os
        current_frame = inspect.currentframe()
        while current_frame:
            if 'self' in current_frame.f_locals and hasattr(current_frame.f_locals['self'], '__module__'):
                if current_frame.f_locals['self'].__module__ == 'streamlit.runtime.scriptrunner.script_runner':
                    if hasattr(current_frame.f_locals['self'], '_main_script_path'):
                        script_path = current_frame.f_locals['self']._main_script_path
                        page_name = os.path.splitext(os.path.basename(script_path))[0]
                        # Special case for main app
                        if page_name in ["app", "combined_app", "enhanced_app"]:
                            return "Home"
                        return page_name
            current_frame = current_frame.f_back
        
        # If we can't determine the page name, default to Home
        return "Home"
    except Exception as e:
        # If anything goes wrong, default to Home
        print(f"Error getting current page name: {e}")
        return "Home"

def render_sidebar_navigation():
    """
    Render the sidebar navigation with improved categorization and styling.
    """
    # Import the logo rendering function
    from components.styling import render_logo
    
    # Use the Logo function
    render_logo()
    
    current_page = get_current_page_name()
    
    # If we're on the main page (app.py), change current_page to "Home"
    if current_page in ["app", "combined_app", "enhanced_app"]:
        current_page = "Home"
    
    # Group navigation items by category
    nav_by_category = {}
    for nav_item in NAVIGATION:
        category = nav_item.get("category", "utilities")  # Default to utilities if not specified
        if category not in nav_by_category:
            nav_by_category[category] = []
        nav_by_category[category].append(nav_item)
    
    # Render navigation by category
    for category in CATEGORIES:
        category_id = category["id"]
        if category_id in nav_by_category and nav_by_category[category_id]:
            # Display category header
            st.sidebar.markdown(
                f"""
                <div style="margin-top: 1.5rem; margin-bottom: 0.75rem; color: var(--tf-text-secondary); 
                            font-size: 0.9rem; text-transform: uppercase; letter-spacing: 1px; display: flex; align-items: center;">
                    <span style="margin-right: 0.5rem;">{category["icon"]}</span>
                    {category["name"]}
                </div>
                """, 
                unsafe_allow_html=True
            )
            
            # Display items in this category
            for nav_item in nav_by_category[category_id]:
                page_name = nav_item["name"]
                page_icon = nav_item["icon"]
                page_url = nav_item["url"]
                page_desc = nav_item.get("description", "")
                
                # Check if this is the current page
                is_current = (page_name == current_page) or (
                    page_name == "Home" and current_page in ["app", "combined_app", "enhanced_app"]
                ) or (
                    page_url.strip('/') in current_page
                )
                
                # Apply reliable styling based on whether this is the current page
                if is_current:
                    nav_style = """
                        background-color: rgba(124, 77, 255, 0.12); 
                        color: #7c4dff; 
                        font-weight: 600;
                        border-radius: 0.5rem;
                    """
                    desc_color = "rgba(124, 77, 255, 0.7)"
                else:
                    nav_style = """
                        color: var(--tf-text-secondary);
                        transition: all 0.2s ease;
                        border-radius: 0.5rem;
                    """
                    desc_color = "var(--tf-text-tertiary)"
                    # Add hover style for non-active items
                    nav_style += """
                        :hover {
                            background-color: rgba(124, 77, 255, 0.08);
                            color: var(--tf-text);
                            transform: translateY(-2px);
                        }
                    """
                
                # For non-current items, make them clickable
                if not is_current:
                    if page_url == "/":
                        # For home page
                        click_action = "window.location.href = '/';"
                    else:
                        # For other pages
                        click_action = f"window.open('/{page_url.strip('/')}', '_self');"
                    
                    onclick = f"onclick=\"{click_action}\" style=\"cursor: pointer;\""
                else:
                    onclick = ""
                
                # Create navigation item with description
                st.sidebar.markdown(
                    f"""
                    <div style="display: flex; flex-direction: column; padding: 0.625rem 1rem; 
                                margin-bottom: 0.5rem; {nav_style}" {onclick}>
                        <div style="display: flex; align-items: center;">
                            <div style="margin-right: 0.625rem; font-size: 1.1em;">{page_icon}</div>
                            <div>{page_name}</div>
                        </div>
                        <div style="margin-left: 1.75rem; font-size: 0.75rem; color: {desc_color}; margin-top: 0.25rem;">
                            {page_desc}
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True
                )
    
    # Add system status indicator
    from bridge import bridge
    api_status = bridge.get_api_status()
    
    st.sidebar.markdown(
        """
        <hr style="border: none; height: 1px; 
                  background: rgba(124, 77, 255, 0.1); 
                  margin: 1.5rem 0 1rem 0;">
        """, 
        unsafe_allow_html=True
    )
    
    status_color = "#00e676" if api_status.get("success", False) else "#ff1744"
    status_text = "System Online" if api_status.get("success", False) else "System Error"
    
    st.sidebar.markdown(
        f"""
        <div style="display: flex; align-items: center; font-size: 0.8rem; color: var(--tf-text-secondary);">
            <div style="width: 8px; height: 8px; border-radius: 50%; background-color: {status_color}; 
                       margin-right: 0.5rem; box-shadow: 0 0 5px {status_color};"></div>
            <div>{status_text}</div>
            <div style="margin-left: auto; font-size: 0.7rem; color: var(--tf-text-tertiary);">
                v1.2.0
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

def render_breadcrumbs(additional_items=None):
    """
    Render breadcrumb navigation for the current page.
    
    Args:
        additional_items: Optional list of additional breadcrumb items as (name, url) tuples
    """
    current_page = get_current_page_name()
    
    # Start with home - use list instead of typed tuples
    breadcrumbs = []
    breadcrumbs.append(["Home", "/"])
    
    # If we're on a subpage, add it to the breadcrumbs
    if current_page not in ["app", "combined_app", "enhanced_app", "Home"]:
        # Find the navigation item for this page
        for nav_item in NAVIGATION:
            if nav_item["name"] == current_page or nav_item["url"].strip('/') in current_page:
                breadcrumbs.append([nav_item["name"], nav_item["url"]])
                break
    
    # Add any additional items
    if additional_items is not None:
        for item in additional_items:
            if (isinstance(item, tuple) or isinstance(item, list)) and len(item) == 2:
                breadcrumbs.append([item[0], item[1]])
    
    # Render the breadcrumbs with inline styles
    breadcrumb_html = '<div style="display: flex; align-items: center; font-size: 0.875rem; color: rgba(248, 249, 250, 0.65); margin-bottom: 1rem;">'
    
    for i, breadcrumb in enumerate(breadcrumbs):
        name, url = breadcrumb
        
        # For the last item, don't make it a link and apply a different style
        if i == len(breadcrumbs) - 1:
            breadcrumb_html += f'<div style="color: #7c4dff;">{name}</div>'
        else:
            breadcrumb_html += f'<div><a href="{url}" style="color: rgba(248, 249, 250, 0.85); text-decoration: none; transition: color 0.15s ease;">{name}</a></div>'
            
            # Add separator
            breadcrumb_html += '<div style="margin: 0 0.25rem;">/</div>'
    
    breadcrumb_html += '</div>'
    
    st.markdown(breadcrumb_html, unsafe_allow_html=True)

def render_page_header(title, subtitle=None, additional_breadcrumbs=None):
    """
    Render a standardized page header with title, subtitle, and breadcrumbs.
    
    Args:
        title: The page title
        subtitle: Optional subtitle
        additional_breadcrumbs: Optional additional breadcrumb items
    """
    # Render the breadcrumbs
    render_breadcrumbs(additional_breadcrumbs)
    
    # Render the title with simple styling
    st.markdown(
        f'''
        <div style="margin-bottom: 1rem;">
            <h1 style="font-size: 2.5rem; color: #7c4dff; margin-bottom: 0.5rem; font-weight: 700;">
                {title}
            </h1>
        </div>
        ''', 
        unsafe_allow_html=True
    )
    
    # Render the subtitle if provided
    if subtitle is not None:
        st.markdown(
            f'''
            <p style="font-size: 1.2rem; color: rgba(248, 249, 250, 0.85); margin-top: 0.5rem; margin-bottom: 1.5rem;">
                {subtitle}
            </p>
            ''', 
            unsafe_allow_html=True
        )
    
    # Add a simple separator
    st.markdown(
        '''
        <hr style="border: none; height: 1px; 
                  background: linear-gradient(to right, 
                  rgba(124, 77, 255, 0.05), 
                  rgba(124, 77, 255, 0.25), 
                  rgba(124, 77, 255, 0.05)); 
                  margin: 1.5rem 0;">
        ''', 
        unsafe_allow_html=True
    )