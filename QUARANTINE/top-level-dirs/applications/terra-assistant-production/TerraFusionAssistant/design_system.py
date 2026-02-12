"""
TerraFusionPlatform Design System

This module provides a consistent design system for the TerraFusionPlatform,
including color schemes, typography, spacing, and UI components.
"""

import streamlit as st

# Design tokens
COLORS = {
    "primary": {
        "main": "#7C4DFF",
        "light": "#B47CFF",
        "dark": "#3F1DCB",
        "text": "#FFFFFF"
    },
    "secondary": {
        "main": "#00E5FF",
        "light": "#6EFFFF",
        "dark": "#00B2CC",
        "text": "#000000"
    },
    "tertiary": {
        "main": "#FF4081",
        "light": "#FF79B0",
        "dark": "#C60055",
        "text": "#FFFFFF"
    },
    "neutral": {
        "background": "#121212",
        "surface": "#1E1E1E",
        "border": "#333333",
        "overlay": "rgba(0, 0, 0, 0.5)"
    },
    "text": {
        "primary": "#FFFFFF",
        "secondary": "#B3B3B3",
        "disabled": "#666666",
        "muted": "#999999"
    },
    "status": {
        "success": "#4CAF50",
        "warning": "#FFC107",
        "error": "#F44336",
        "info": "#2196F3"
    }
}

TYPOGRAPHY = {
    "family": {
        "primary": "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
        "monospace": "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace"
    },
    "weight": {
        "regular": 400,
        "medium": 500,
        "bold": 700
    },
    "size": {
        "xs": "0.75rem",
        "sm": "0.875rem",
        "md": "1rem",
        "lg": "1.125rem",
        "xl": "1.25rem",
        "xxl": "1.5rem",
        "heading1": "2.5rem",
        "heading2": "2rem",
        "heading3": "1.75rem",
        "heading4": "1.5rem",
        "heading5": "1.25rem",
        "heading6": "1rem"
    },
    "lineHeight": {
        "tight": 1.2,
        "normal": 1.5,
        "relaxed": 1.8
    }
}

SPACING = {
    "xs": "0.25rem",
    "sm": "0.5rem",
    "md": "1rem",
    "lg": "1.5rem",
    "xl": "2rem",
    "xxl": "3rem"
}

BORDERS = {
    "radius": {
        "xs": "2px",
        "sm": "4px",
        "md": "8px",
        "lg": "12px",
        "xl": "16px",
        "circle": "50%"
    },
    "width": {
        "thin": "1px",
        "medium": "2px",
        "thick": "4px"
    }
}

SHADOWS = {
    "none": "none",
    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "inner": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)"
}

ANIMATION = {
    "duration": {
        "fast": "100ms",
        "normal": "200ms",
        "slow": "300ms"
    },
    "easing": {
        "ease": "ease",
        "linear": "linear",
        "easeIn": "ease-in",
        "easeOut": "ease-out",
        "easeInOut": "ease-in-out"
    }
}

Z_INDEX = {
    "base": 0,
    "dropdown": 1000,
    "sticky": 1100,
    "fixed": 1200,
    "modal": 1300,
    "popup": 1400,
    "tooltip": 1500
}

def apply_design_system() -> None:
    """Apply the TerraFusion design system to the Streamlit app."""
    # Apply CSS styling
    st.markdown("""
    <style>
        /* Base styling */
        html, body, [data-testid="stAppViewContainer"] {
            background-color: #121212;
            color: #FFFFFF;
        }
        
        /* Typography */
        body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            font-size: 1rem;
            line-height: 1.5;
        }
        
        /* Header styling */
        .header {
            color: #FFFFFF;
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .subheader {
            color: #B3B3B3;
            font-size: 1.1rem;
            margin-bottom: 2rem;
        }
        
        /* Card styling */
        .tf-card {
            background-color: #1E1E1E;
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            border: 1px solid rgba(124, 77, 255, 0.2);
        }
        
        /* Phase indicator */
        .phase-indicator {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
            overflow-x: auto;
            padding-bottom: 0.5rem;
        }
        
        .phase-item {
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.875rem;
            margin-right: 0.5rem;
            white-space: nowrap;
            background-color: rgba(124, 77, 255, 0.1);
            border: 1px solid rgba(124, 77, 255, 0.2);
            color: #B3B3B3;
        }
        
        .phase-item.active {
            background-color: rgba(124, 77, 255, 0.2);
            border: 1px solid rgba(124, 77, 255, 0.5);
            color: #FFFFFF;
            font-weight: 500;
        }
        
        /* Report card */
        .report-card {
            padding: 1rem;
            border-radius: 8px;
            background-color: #1E1E1E;
            margin-bottom: 1rem;
            border: 1px solid rgba(124, 77, 255, 0.1);
        }
        
        /* Logo container */
        .logo-container {
            display: flex;
            align-items: center;
            margin-bottom: 1.5rem;
            padding: 0.5rem;
            border-radius: 8px;
        }
        
        .logo-text {
            font-size: 1.2rem;
            font-weight: 700;
            margin-left: 0.5rem;
            background: linear-gradient(90deg, #7C4DFF, #00E5FF);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        /* Button styling */
        .stButton > button {
            background-color: #7C4DFF;
            color: white;
            border: none;
            border-radius: 4px;
            padding: 0.5rem 1rem;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .stButton > button:hover {
            background-color: #B47CFF;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        /* Sidebar styling */
        [data-testid="stSidebar"] {
            background-color: #1A1A1A;
            border-right: 1px solid #333333;
        }
        
        /* Tab styling */
        .stTabs [data-baseweb="tab-list"] {
            gap: 8px;
        }
        
        .stTabs [data-baseweb="tab"] {
            height: auto;
            padding: 8px 16px;
            color: #B3B3B3;
            background-color: transparent;
            border-radius: 4px;
            border: 1px solid rgba(124, 77, 255, 0.1);
        }
        
        .stTabs [aria-selected="true"] {
            color: white;
            background-color: rgba(124, 77, 255, 0.1);
            border: 1px solid rgba(124, 77, 255, 0.5);
        }
    </style>
    """, unsafe_allow_html=True)

def section_title(title: str, subtitle: str = None) -> None:
    """
    Display a section title with optional subtitle.
    
    Args:
        title: The title text
        subtitle: Optional subtitle text
    """
    st.markdown(f'<h2 style="margin-bottom: 0.5rem;">{title}</h2>', unsafe_allow_html=True)
    if subtitle:
        st.markdown(f'<p style="color: {COLORS["text"]["secondary"]}; margin-bottom: 1.5rem;">{subtitle}</p>', unsafe_allow_html=True)
    st.markdown('<hr style="margin: 1.5rem 0; opacity: 0.2;">', unsafe_allow_html=True)

def card(content: str) -> None:
    """
    Display content in a card container.
    
    Args:
        content: The HTML content to display
    """
    st.markdown(f'<div class="tf-card">{content}</div>', unsafe_allow_html=True)

def alert(message: str, type: str = "info") -> None:
    """
    Display an alert message.
    
    Args:
        message: The message to display
        type: Alert type (info, success, warning, error)
    """
    # Map type to color
    color_map = {
        "info": COLORS["status"]["info"],
        "success": COLORS["status"]["success"],
        "warning": COLORS["status"]["warning"],
        "error": COLORS["status"]["error"]
    }
    
    # Get the color for the alert type
    color = color_map.get(type, COLORS["status"]["info"])
    
    # Display the alert
    st.markdown(f"""
    <div style="padding: 1rem; border-radius: 8px; background-color: rgba({color.replace('#', '').lstrip('0x')}, 0.1); 
                border-left: 4px solid {color}; margin-bottom: 1rem;">
        {message}
    </div>
    """, unsafe_allow_html=True)

def status_badge(text: str, status: str = "default") -> str:
    """
    Create a status badge HTML.
    
    Args:
        text: The text to display
        status: Badge status (default, success, warning, error, info)
        
    Returns:
        HTML string for the badge
    """
    # Map status to color
    color_map = {
        "default": COLORS["text"]["secondary"],
        "success": COLORS["status"]["success"],
        "warning": COLORS["status"]["warning"],
        "error": COLORS["status"]["error"],
        "info": COLORS["status"]["info"]
    }
    
    # Get the color for the status
    color = color_map.get(status, COLORS["text"]["secondary"])
    
    # Create the badge HTML
    return f"""
    <span style="display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; 
          font-size: 0.75rem; font-weight: 500; background-color: rgba({color.replace('#', '').lstrip('0x')}, 0.1); 
          color: {color}; border: 1px solid rgba({color.replace('#', '').lstrip('0x')}, 0.2);">
        {text}
    </span>
    """

def loading_indicator() -> None:
    """Display a loading indicator."""
    st.markdown(f"""
    <div style="display: flex; align-items: center; justify-content: center; margin: 2rem 0;">
        <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid rgba(124, 77, 255, 0.1); 
                  border-top-color: {COLORS["primary"]["main"]}; animation: spin 1s linear infinite;">
        </div>
        <span style="margin-left: 0.75rem; color: {COLORS["text"]["secondary"]};">Loading...</span>
    </div>
    
    <style>
        @keyframes spin {{
            to {{ transform: rotate(360deg); }}
        }}
    </style>
    """, unsafe_allow_html=True)

def empty_state(message: str, icon: str = "📦") -> None:
    """
    Display an empty state message.
    
    Args:
        message: The message to display
        icon: Optional icon
    """
    st.markdown(f"""
    <div style="text-align: center; padding: 3rem 2rem; background-color: {COLORS["neutral"]["surface"]}; 
                border-radius: 8px; border: 1px dashed {COLORS["neutral"]["border"]};">
        <div style="font-size: 3rem; margin-bottom: 1rem;">{icon}</div>
        <div style="color: {COLORS["text"]["secondary"]};">{message}</div>
    </div>
    """, unsafe_allow_html=True)