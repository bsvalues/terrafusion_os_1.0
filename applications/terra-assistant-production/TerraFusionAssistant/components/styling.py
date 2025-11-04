"""
Styling Utilities Module

This module provides functions for loading and applying the TerraFusion UI styling.
"""
import streamlit as st
import os
import base64

def apply_terraflow_style():
    """
    Apply the TerraFusion style to the Streamlit app.
    """
    # Apply consistent styling across all pages
    st.markdown(
        """
        <style>
        /* TerraFusion Modern UI Theme with Cyberpunk Accents */
        :root {
            /* Brand colors - primary palette */
            --tf-primary: #7c4dff;
            --tf-primary-light: #b47cff;
            --tf-primary-dark: #3f1dcb;
            --tf-accent: #00e0e0;
            --tf-accent-light: #73ffff;
            --tf-accent-dark: #00b0b0;
            
            /* UI colors */
            --tf-background: #121212;
            --tf-card-bg: #1e1e1e;
            --tf-surface: #252525;
            --tf-surface-variant: #303030;
            
            /* Text colors */
            --tf-text: #f8f9fa;
            --tf-text-secondary: rgba(248, 249, 250, 0.85);
            --tf-text-tertiary: rgba(248, 249, 250, 0.65);
            --tf-text-disabled: rgba(248, 249, 250, 0.40);
            
            /* Border and divider */
            --tf-border: rgba(124, 77, 255, 0.25);
            --tf-border-light: rgba(124, 77, 255, 0.1);
            --tf-divider: rgba(248, 249, 250, 0.1);
            
            /* Status colors */
            --tf-success: #00e676;
            --tf-warning: #ffea00;
            --tf-error: #ff1744;
            --tf-info: #29b6f6;
            
            /* Elevation and shadow */
            --tf-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.2);
            --tf-shadow-md: 0 4px 8px rgba(0, 0, 0, 0.3);
            --tf-shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.4);
            
            /* Animation */
            --tf-transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
            --tf-transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
            --tf-transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
            
            /* Opacity */
            --tf-opacity-hover: 0.8;
            --tf-opacity-active: 0.6;
            --tf-opacity-disabled: 0.4;
            
            /* Spacing */
            --tf-space-xs: 0.25rem;
            --tf-space-sm: 0.5rem;
            --tf-space-md: 1rem;
            --tf-space-lg: 1.5rem;
            --tf-space-xl: 2rem;
            --tf-space-xxl: 3rem;
            
            /* Cyberpunk glow effect */
            --tf-glow-strength: 8px;
            --tf-glow-color: rgba(124, 77, 255, 0.3);
        }
        
        /* Base styles for Streamlit elements */
        .stApp {
            background-color: var(--tf-background);
            color: var(--tf-text);
            font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, 'Open Sans', sans-serif;
        }
        
        /* Typography hierarchy */
        h1, h2, h3, h4, h5, h6 {
            color: var(--tf-text);
            font-weight: 600;
            margin-bottom: var(--tf-space-md);
            line-height: 1.2;
        }
        
        h1 {
            font-size: 2.5rem;
            font-weight: 700;
        }
        
        h2 {
            font-size: 2rem;
            position: relative;
        }
        
        h3 {
            font-size: 1.5rem;
            color: var(--tf-primary);
        }
        
        h4 {
            font-size: 1.25rem;
            color: var(--tf-accent);
        }
        
        p {
            margin-bottom: var(--tf-space-md);
            font-size: 1rem;
            line-height: 1.6;
        }
        
        /* Button styles with consistent design */
        .stButton > button {
            background-color: var(--tf-primary) !important;
            color: white !important;
            font-weight: 500 !important;
            border: none !important;
            padding: 0.6rem 1.25rem !important;
            border-radius: 0.375rem !important;
            transition: all var(--tf-transition-normal) !important;
            box-shadow: var(--tf-shadow-sm) !important;
            width: 100% !important;
        }
        
        .stButton > button:hover {
            transform: translateY(-2px) !important;
            box-shadow: var(--tf-shadow-md) !important;
            background-color: var(--tf-primary-light) !important;
        }
        
        .stButton > button:active {
            transform: translateY(0) !important;
            box-shadow: var(--tf-shadow-sm) !important;
            background-color: var(--tf-primary-dark) !important;
        }
        
        /* Selectbox and multiselect styling */
        .stSelectbox, .stMultiselect {
            color: var(--tf-text) !important;
        }
        
        .stSelectbox > div > div, .stMultiselect > div > div {
            background-color: var(--tf-surface) !important;
            border-color: var(--tf-border) !important;
        }
        
        /* Slider styling */
        .stSlider > div > div > div {
            color: var(--tf-primary) !important;
        }
        
        /* Checkbox styling */
        .stCheckbox > div > div > div {
            color: var(--tf-text-secondary) !important;
        }
        
        /* Radio button styling */
        .stRadio > div {
            color: var(--tf-text-secondary) !important;
        }
        
        /* Text input styling */
        .stTextInput > div > div > input {
            background-color: var(--tf-surface) !important;
            color: var(--tf-text) !important;
            border-color: var(--tf-border) !important;
        }
        
        /* Number input styling */
        .stNumberInput > div > div > input {
            background-color: var(--tf-surface) !important;
            color: var(--tf-text) !important;
            border-color: var(--tf-border) !important;
        }
        
        /* Tab styling */
        .stTabs [data-baseweb="tab-list"] {
            gap: 8px;
            border-bottom: 1px solid var(--tf-border);
        }
        
        .stTabs [data-baseweb="tab"] {
            height: 50px;
            white-space: pre-wrap;
            background-color: transparent;
            border-radius: 4px 4px 0px 0px;
            color: var(--tf-text-secondary);
            border-bottom: 3px solid transparent;
        }
        
        .stTabs [aria-selected="true"] {
            background-color: rgba(124, 77, 255, 0.05) !important;
            color: var(--tf-primary) !important;
            border-bottom: 3px solid var(--tf-primary) !important;
            font-weight: 600;
        }
        
        /* Expander styling */
        .streamlit-expanderHeader {
            color: var(--tf-primary);
            font-weight: 600;
        }
        
        .streamlit-expanderContent {
            background-color: rgba(124, 77, 255, 0.05);
            border-radius: 0.375rem;
            padding: var(--tf-space-sm);
        }
        
        /* Dataframe styling */
        .dataframe {
            background-color: var(--tf-surface) !important;
            color: var(--tf-text-secondary) !important;
            border-color: var(--tf-border) !important;
        }
        
        .dataframe th {
            background-color: var(--tf-surface-variant) !important;
            color: var(--tf-text) !important;
        }
        
        /* Metric Component */
        [data-testid="stMetric"] {
            background-color: var(--tf-card-bg);
            padding: var(--tf-space-md);
            border-radius: 0.5rem;
            border: 1px solid var(--tf-border);
            box-shadow: var(--tf-shadow-sm);
            transition: transform var(--tf-transition-normal);
        }
        
        [data-testid="stMetric"]:hover {
            transform: translateY(-2px);
            box-shadow: var(--tf-shadow-md);
        }
        
        [data-testid="stMetric"] > div {
            color: var(--tf-primary);
        }
        
        [data-testid="stMetric"] > div:first-child {
            color: var(--tf-text-secondary);
        }
        
        /* Card components */
        .tf-card {
            background-color: var(--tf-card-bg);
            border: 1px solid var(--tf-border);
            border-radius: 0.75rem;
            padding: var(--tf-space-lg);
            margin-bottom: var(--tf-space-lg);
            position: relative;
            box-shadow: var(--tf-shadow-sm);
            transition: transform var(--tf-transition-normal), box-shadow var(--tf-transition-normal);
        }
        
        .tf-card:hover {
            transform: translateY(-2px);
            box-shadow: var(--tf-shadow-md);
        }
        
        /* Header styles for pages */
        .dashboard-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--tf-primary);
            margin-bottom: var(--tf-space-xs);
        }
        
        .dashboard-subtitle {
            font-size: 1rem;
            color: var(--tf-text-secondary);
            margin-bottom: var(--tf-space-xl);
        }
        
        .section-header {
            font-size: 1.5rem;
            font-weight: 700;
            margin: var(--tf-space-xl) 0 var(--tf-space-md) 0;
            color: var(--tf-primary);
            position: relative;
            display: inline-block;
        }
        
        /* Component-specific styles */
        
        /* Metrics cards */
        .metric-card {
            background-color: var(--tf-card-bg);
            border: 1px solid var(--tf-border);
            border-radius: 0.75rem;
            padding: var(--tf-space-md);
            text-align: center;
            height: 100%;
            transition: transform var(--tf-transition-normal), box-shadow var(--tf-transition-normal);
        }
        
        .metric-card:hover {
            transform: translateY(-3px);
            box-shadow: var(--tf-shadow-md);
        }
        
        .metric-title {
            color: var(--tf-text-secondary);
            font-size: 0.875rem;
            margin-bottom: var(--tf-space-sm);
        }
        
        .metric-value {
            font-size: 2rem;
            font-weight: 700;
            color: var(--tf-primary);
            margin-bottom: var(--tf-space-xs);
        }
        
        .metric-unit {
            font-size: 0.75rem;
            color: var(--tf-text-tertiary);
        }
        
        /* Control panels for interactive components */
        .control-panel {
            background-color: var(--tf-card-bg);
            border: 1px solid var(--tf-border);
            border-radius: 0.75rem;
            padding: var(--tf-space-md);
            margin-bottom: var(--tf-space-md);
            box-shadow: var(--tf-shadow-sm);
        }
        
        .control-panel-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: var(--tf-primary);
            margin-bottom: var(--tf-space-md);
            border-bottom: 1px solid var(--tf-border);
            padding-bottom: var(--tf-space-sm);
        }
        
        /* Status indicators */
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: var(--tf-space-sm);
        }
        
        .status-success {
            background-color: var(--tf-success);
            box-shadow: 0 0 8px var(--tf-success);
        }
        
        .status-warning {
            background-color: var(--tf-warning);
            box-shadow: 0 0 8px var(--tf-warning);
        }
        
        .status-error {
            background-color: var(--tf-error);
            box-shadow: 0 0 8px var(--tf-error);
        }
        
        .status-offline {
            background-color: var(--tf-text-disabled);
        }
        
        /* Tags and badges */
        .tf-tag {
            display: inline-block;
            font-size: 0.75rem;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            background-color: rgba(124, 77, 255, 0.1);
            color: var(--tf-primary);
            margin-right: var(--tf-space-xs);
            margin-bottom: var(--tf-space-xs);
        }
        
        /* Graph containers for visualizations */
        .graph-container {
            background-color: var(--tf-card-bg);
            border: 1px solid var(--tf-border);
            border-radius: 0.75rem;
            padding: var(--tf-space-md);
            margin-top: var(--tf-space-lg);
            margin-bottom: var(--tf-space-lg);
            box-shadow: var(--tf-shadow-sm);
        }
        
        /* Workflow visualization elements */
        .workflow-step {
            background-color: var(--tf-surface);
            border: 1px solid var(--tf-border);
            border-radius: 0.5rem;
            padding: var(--tf-space-md);
            margin-bottom: var(--tf-space-sm);
            position: relative;
            transition: transform var(--tf-transition-normal);
        }
        
        .workflow-step:hover {
            transform: translateY(-2px);
            box-shadow: var(--tf-shadow-sm);
        }
        
        .workflow-step-active {
            border-left: 3px solid var(--tf-primary);
        }
        
        /* Code blocks */
        .code-block {
            background-color: rgba(0, 0, 0, 0.3);
            border: 1px solid var(--tf-border);
            border-radius: 0.375rem;
            padding: var(--tf-space-md);
            font-family: 'JetBrains Mono', monospace;
            color: var(--tf-text);
            margin-bottom: var(--tf-space-md);
            overflow-x: auto;
        }
        
        /* Toast notifications */
        .toast-notification {
            position: fixed;
            top: var(--tf-space-lg);
            right: var(--tf-space-lg);
            padding: var(--tf-space-md);
            border-radius: 0.5rem;
            background-color: var(--tf-surface);
            border-left: 3px solid var(--tf-primary);
            box-shadow: var(--tf-shadow-md);
            z-index: 9999;
            max-width: 300px;
        }
        
        /* Loading animations */
        .loading-pulse {
            display: inline-block;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background-color: var(--tf-primary);
            box-shadow: 0 0 var(--tf-glow-strength) var(--tf-glow-color);
            animation: pulse 1.5s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.4; }
            100% { opacity: 1; }
        }
        
        /* Timeline elements */
        .timeline-container {
            position: relative;
            margin-left: var(--tf-space-xl);
            padding-left: var(--tf-space-xl);
            border-left: 2px solid var(--tf-border);
        }
        
        .timeline-item {
            position: relative;
            margin-bottom: var(--tf-space-lg);
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: calc(-1 * var(--tf-space-xl) - 6px);
            top: 6px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: var(--tf-primary);
            box-shadow: 0 0 var(--tf-glow-strength) var(--tf-glow-color);
        }
        
        /* DevOps specific elements */
        .devops-status-panel {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: var(--tf-space-md);
            margin-bottom: var(--tf-space-lg);
        }
        
        .deployment-stage {
            position: relative;
            background-color: var(--tf-surface);
            border: 1px solid var(--tf-border);
            border-radius: 0.5rem;
            padding: var(--tf-space-md);
            margin-bottom: var(--tf-space-md);
        }
        
        .deployment-stage-active {
            border-color: var(--tf-primary);
            background-color: rgba(124, 77, 255, 0.1);
        }
        
        .deployment-stage-complete {
            border-color: var(--tf-success);
        }
        
        .deployment-stage-failed {
            border-color: var(--tf-error);
        }
        
        /* Data flow visualization */
        .data-flow-container {
            position: relative;
            overflow: hidden;
            margin: var(--tf-space-lg) 0;
        }
        
        .data-flow-node {
            background-color: var(--tf-surface);
            border: 1px solid var(--tf-border);
            border-radius: 0.5rem;
            padding: var(--tf-space-md);
            margin-bottom: var(--tf-space-md);
            position: relative;
            transition: transform var(--tf-transition-normal), box-shadow var(--tf-transition-normal);
        }
        
        .data-flow-node:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 var(--tf-glow-strength) var(--tf-glow-color);
        }
        
        /* Footer */
        .footer {
            text-align: center;
            padding: var(--tf-space-xl) 0 var(--tf-space-md) 0;
            color: var(--tf-text-tertiary);
            font-size: 0.75rem;
            margin-top: var(--tf-space-xxl);
            border-top: 1px solid var(--tf-border-light);
        }
        </style>
        """, 
        unsafe_allow_html=True
    )

def get_image_base64(img_path):
    """
    Get the base64 encoded string of an image.
    
    Args:
        img_path: Path to the image file
        
    Returns:
        str: Base64 encoded string of the image
    """
    try:
        with open(img_path, "rb") as img_file:
            return base64.b64encode(img_file.read()).decode()
    except Exception as e:
        st.warning(f"Error loading image: {e}")
        return None

def get_theme_toggle_script():
    """Get the JavaScript for theme toggling."""
    return """
    <script>
    // Store the current theme in session storage
    const getCurrentTheme = () => {
        return sessionStorage.getItem('terraflow_theme') || 'dark';
    };
    
    // Set theme-specific variables
    const setThemeVariables = (isDark) => {
        const root = document.documentElement;
        
        // Base colors
        if (isDark) {
            root.style.setProperty('--tf-background', '#121212');
            root.style.setProperty('--tf-card-bg', '#1e1e1e');
            root.style.setProperty('--tf-text', '#f8f9fa');
            root.style.setProperty('--tf-text-secondary', 'rgba(248, 249, 250, 0.85)');
            root.style.setProperty('--tf-text-tertiary', 'rgba(248, 249, 250, 0.65)');
        } else {
            root.style.setProperty('--tf-background', '#f8f9fa');
            root.style.setProperty('--tf-card-bg', '#ffffff');
            root.style.setProperty('--tf-text', '#212529');
            root.style.setProperty('--tf-text-secondary', 'rgba(33, 37, 41, 0.85)');
            root.style.setProperty('--tf-text-tertiary', 'rgba(33, 37, 41, 0.65)');
        }
    };
    
    // Toggle theme function
    const toggleTheme = () => {
        const currentTheme = getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Store the new theme
        sessionStorage.setItem('terraflow_theme', newTheme);
        
        // Apply the theme
        setThemeVariables(newTheme === 'dark');
        
        // Update the toggle button
        const toggleButton = document.getElementById('theme-toggle');
        if (toggleButton) {
            toggleButton.innerHTML = newTheme === 'dark' ? '☀️' : '🌙';
        }
    };
    
    // Apply the current theme when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        const currentTheme = getCurrentTheme();
        setThemeVariables(currentTheme === 'dark');
        
        // Update toggle button if it exists
        const toggleButton = document.getElementById('theme-toggle');
        if (toggleButton) {
            toggleButton.innerHTML = currentTheme === 'dark' ? '☀️' : '🌙';
        }
    });
    </script>
    """

def render_logo():
    """
    Render the TerraFusion logo and theme toggle.
    """
    # Add theme toggle script
    theme_toggle_script = get_theme_toggle_script()
    st.sidebar.markdown(theme_toggle_script, unsafe_allow_html=True)
    
    # Create logo with theme toggle button
    logo_html = f"""
    <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(124, 77, 255, 0.1); display: flex; justify-content: space-between; align-items: center;">
        <div style="font-size: 1.5rem; font-weight: 700; color: #7c4dff;">
            TerraFusion AI
        </div>
        <button id="theme-toggle" onclick="toggleTheme()" 
                style="background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--tf-text);">
            ☀️
        </button>
    </div>
    """
    
    st.sidebar.markdown(logo_html, unsafe_allow_html=True)