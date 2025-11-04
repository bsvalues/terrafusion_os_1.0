"""
UI Components Module

This module provides reusable UI components for the TerraFusion UI.
"""

# Loading animation CSS
LOADING_CSS = """
<style>
@keyframes pulse {
  0% { opacity: 0.4; }
  50% { opacity: 0.8; }
  100% { opacity: 0.4; }
}

.tf-loading {
  animation: pulse 1.5s infinite ease-in-out;
  background: linear-gradient(90deg, rgba(124, 77, 255, 0.12), rgba(124, 77, 255, 0.2), rgba(124, 77, 255, 0.12));
  background-size: 200% 100%;
  border-radius: 4px;
  display: inline-block;
  height: 16px;
  margin: 5px 0;
}

.tf-loading.tf-loading-circle {
  border-radius: 50%;
  height: 40px;
  width: 40px;
}

.tf-skeleton-text {
  height: 18px;
  margin-bottom: 8px;
  width: 100%;
}

.tf-skeleton-title {
  height: 24px;
  margin-bottom: 12px;
  width: 70%;
}

.tf-skeleton-circle {
  border-radius: 50%;
  height: 64px;
  width: 64px;
}

.tf-skeleton-button {
  height: 38px;
  width: 120px;
  border-radius: 4px;
}

.tf-skeleton-image {
  height: 200px;
  width: 100%;
}

/* Animation for loading animations */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.tf-loading {
  animation: shimmer 2s infinite linear;
}

/* Notification styles */
.tf-notification {
  position: fixed;
  top: 1rem;
  right: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 9999;
  transition: transform 0.3s ease, opacity 0.3s ease;
  transform: translateX(0);
  opacity: 1;
}

.tf-notification.info {
  background-color: rgba(124, 77, 255, 0.95);
  color: white;
}

.tf-notification.success {
  background-color: rgba(0, 230, 118, 0.95);
  color: white;
}

.tf-notification.warning {
  background-color: rgba(255, 234, 0, 0.95);
  color: #1e1e1e;
}

.tf-notification.error {
  background-color: rgba(255, 23, 68, 0.95);
  color: white;
}

.tf-notification.hidden {
  transform: translateX(120%);
  opacity: 0;
}

/* Modal styles */
.tf-modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.tf-modal {
  background-color: var(--tf-card-bg);
  border-radius: 0.75rem;
  padding: 1.5rem;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(124, 77, 255, 0.25);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.tf-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(124, 77, 255, 0.15);
}

.tf-modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--tf-primary);
}

.tf-modal-close {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  color: var(--tf-text-tertiary);
}

.tf-modal-body {
  margin-bottom: 1.5rem;
}

.tf-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid rgba(124, 77, 255, 0.15);
}

/* Button styles */
.tf-button {
  background-color: var(--tf-primary);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.tf-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.tf-button.secondary {
  background-color: transparent;
  border: 1px solid var(--tf-primary);
  color: var(--tf-primary);
}

/* Subtle animations */
.tf-hover-scale {
  transition: transform 0.2s ease;
}

.tf-hover-scale:hover {
  transform: scale(1.02);
}

.tf-hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tf-hover-lift:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}
</style>
"""
import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
import uuid
import time
from typing import List, Dict, Any, Union, Optional, Tuple

# Loading CSS will be applied when needed, not automatically
def apply_loading_animations_css():
    """Apply loading animations CSS"""
    st.markdown(LOADING_CSS, unsafe_allow_html=True)

def render_card(title: str, content: str, icon: Optional[str] = None):
    """
    Render a card with a title, content, and optional icon.
    
    Args:
        title: Card title
        content: Card content
        icon: Optional icon (emoji or font awesome)
    """
    if icon:
        icon_html = f'<div style="font-size: 1.5rem; margin-bottom: 0.5rem;">{icon}</div>'
    else:
        icon_html = ''
    
    st.markdown(
        f"""
        <div style="background-color: var(--tf-card-bg); border: 1px solid rgba(124, 77, 255, 0.25);
                    border-radius: 0.75rem; padding: 1.5rem; margin-bottom: 1rem; position: relative;">
            {icon_html}
            <div style="font-size: 1.25rem; font-weight: 600; color: #7c4dff; margin-bottom: 0.75rem;">
                {title}
            </div>
            <div style="color: rgba(248, 249, 250, 0.85);">
                {content}
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

def render_metric_card(title: str, value: Union[str, int, float], unit: Optional[str] = None, 
                      icon: Optional[str] = None, trend: Optional[float] = None, 
                      health_status: Optional[str] = None):
    """
    Render a metric card showing a single KPI or metric.
    
    Args:
        title: Metric title
        value: Metric value
        unit: Optional unit of measurement
        icon: Optional icon (emoji or font awesome)
        trend: Optional trend value (positive for up, negative for down)
        health_status: Optional status ('healthy', 'warning', 'critical')
    """
    # Format the trend if provided
    if trend is not None:
        if trend > 0:
            trend_html = f'<span style="color: #00e676; font-size: 0.875rem; margin-left: 0.5rem;">+{trend}%</span>'
        elif trend < 0:
            trend_html = f'<span style="color: #ff1744; font-size: 0.875rem; margin-left: 0.5rem;">{trend}%</span>'
        else:
            trend_html = f'<span style="color: #ffea00; font-size: 0.875rem; margin-left: 0.5rem;">0%</span>'
    else:
        trend_html = ''
    
    # Add the unit if provided
    if unit:
        unit_html = f'<span style="font-size: 0.875rem; color: rgba(248, 249, 250, 0.65); margin-left: 0.25rem;">{unit}</span>'
    else:
        unit_html = ''
    
    # Add the icon if provided
    if icon:
        icon_html = f'<div style="font-size: 1.25rem; margin-bottom: 0.5rem; color: #7c4dff;">{icon}</div>'
    else:
        icon_html = ''
        
    # Set the color based on health status
    if health_status == "healthy":
        value_color = "#00e676"
        border_color = "rgba(0, 230, 118, 0.3)"
        indicator = '<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #00e676; margin-right: 0.5rem; box-shadow: 0 0 5px #00e676;"></span>'
    elif health_status == "warning":
        value_color = "#ffea00"
        border_color = "rgba(255, 234, 0, 0.3)"
        indicator = '<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #ffea00; margin-right: 0.5rem; box-shadow: 0 0 5px #ffea00;"></span>'
    elif health_status == "critical":
        value_color = "#ff1744"
        border_color = "rgba(255, 23, 68, 0.3)"
        indicator = '<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: #ff1744; margin-right: 0.5rem; box-shadow: 0 0 5px #ff1744;"></span>'
    else:
        value_color = "#7c4dff"
        border_color = "rgba(124, 77, 255, 0.25)"
        indicator = ''
    
    # Show indicator only if health status is provided
    status_indicator = indicator if health_status else ''
    
    st.markdown(
        f"""
        <div style="background-color: var(--tf-card-bg); border: 1px solid {border_color}; 
                    border-radius: 0.75rem; padding: 1.25rem; text-align: center; height: 100%;">
            {icon_html}
            <div style="color: rgba(248, 249, 250, 0.65); font-size: 0.875rem; margin-bottom: 0.5rem;">
                {title}
            </div>
            <div style="font-size: 2rem; font-weight: 700; color: {value_color}; margin-bottom: 0.25rem;">
                {status_indicator}{value}{unit_html}{trend_html}
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

def render_alert(message: str, level: str = "info", dismissible: bool = False):
    """
    Render an alert message with appropriate styling based on level.
    
    Args:
        message: Alert message
        level: Alert level ('info', 'success', 'warning', 'error')
        dismissible: Whether the alert can be dismissed
    """
    # Set the color based on the level
    if level == "success":
        color = "#00e676"
        icon = "✅"
    elif level == "warning":
        color = "#ffea00"
        icon = "⚠️"
    elif level == "error":
        color = "#ff1744"
        icon = "❌"
    else:  # info
        color = "#7c4dff"
        icon = "ℹ️"
    
    # Generate a unique ID for the alert if it's dismissible
    if dismissible:
        alert_id = f"alert_{hash(message) % 10000}"
        dismiss_button = f"""
        <span style="cursor: pointer; float: right;" 
              onclick="document.getElementById('{alert_id}').style.display='none'">
            ✕
        </span>
        """
        div_id = f'id="{alert_id}"'
    else:
        dismiss_button = ""
        div_id = ""
    
    st.markdown(
        f"""
        <div {div_id} style="background-color: rgba(30, 30, 30, 0.5); border-left: 3px solid {color};
                    border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 1rem;">
            {dismiss_button}
            <div style="display: flex; align-items: flex-start;">
                <div style="margin-right: 0.5rem;">{icon}</div>
                <div>{message}</div>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )

def render_info_tooltip(content: str, tooltip: str):
    """
    Render text with an info tooltip on hover.
    
    Args:
        content: The visible content
        tooltip: Tooltip text shown on hover
    """
    st.markdown(
        f"""
        <span style="position: relative; display: inline-block; cursor: help;"
              title="{tooltip}">
            {content}
            <span style="font-size: 0.8em; margin-left: 0.25rem; color: rgba(124, 77, 255, 0.7);">ⓘ</span>
        </span>
        """,
        unsafe_allow_html=True
    )

def render_tabs(tabs: List[Dict[str, str]], default_tab: int = 0):
    """
    Render custom tabs with styling matching the design system.
    
    Args:
        tabs: List of tab dicts with 'label' and 'content' keys
        default_tab: Index of the default active tab (0-based)
    """
    # Generate unique IDs for each tab
    tab_ids = [f"tab_{i}_{hash(tab['label']) % 10000}" for i, tab in enumerate(tabs)]
    
    # Create the tab header
    tab_header = '<div style="display: flex; border-bottom: 1px solid rgba(124, 77, 255, 0.25); margin-bottom: 1rem;">'
    
    for i, tab in enumerate(tabs):
        active_class = "font-weight: 600; color: #7c4dff; border-bottom: 2px solid #7c4dff;" if i == default_tab else ""
        tab_header += f"""
        <div style="padding: 0.5rem 1rem; cursor: pointer; {active_class}"
             onclick="activateTab('{tab_ids[i]}')">
            {tab['label']}
        </div>
        """
    
    tab_header += '</div>'
    
    # Create the tab content containers
    tab_content = ''
    for i, tab in enumerate(tabs):
        display = "block" if i == default_tab else "none"
        tab_content += f"""
        <div id="{tab_ids[i]}" style="display: {display};">
            {tab['content']}
        </div>
        """
    
    # Add JavaScript for tab switching
    tab_js = """
    <script>
    function activateTab(tabId) {
        // Hide all tab content
        var tabContents = document.querySelectorAll('[id^="tab_"]');
        tabContents.forEach(function(tab) {
            tab.style.display = 'none';
        });
        
        // Show the selected tab content
        document.getElementById(tabId).style.display = 'block';
        
        // Update tab header styling
        var tabHeaders = document.querySelectorAll('[onclick^="activateTab"]');
        tabHeaders.forEach(function(header) {
            if (header.getAttribute('onclick').includes(tabId)) {
                header.style.fontWeight = '600';
                header.style.color = '#7c4dff';
                header.style.borderBottom = '2px solid #7c4dff';
            } else {
                header.style.fontWeight = 'normal';
                header.style.color = '';
                header.style.borderBottom = 'none';
            }
        });
    }
    </script>
    """
    
    # Combine everything and render
    st.markdown(
        tab_header + tab_content + tab_js,
        unsafe_allow_html=True
    )

def render_progress_bar(value: float, max_value: float = 100, 
                      label: Optional[str] = None, style: str = "default"):
    """
    Render a progress bar with TerraFusion styling.
    
    Args:
        value: Current value
        max_value: Maximum value (100 by default)
        label: Optional label to display with the progress bar
        style: Style variant ('default', 'success', 'warning', 'error')
    """
    # Calculate percentage
    percentage = min(100, max(0, (value / max_value) * 100))
    
    # Determine color based on style
    if style == "success":
        color = "#00e676"
    elif style == "warning":
        color = "#ffea00"
    elif style == "error":
        color = "#ff1744"
    else:  # default
        color = "#7c4dff"
    
    # Label display
    label_html = f'<div style="margin-bottom: 0.25rem;">{label}</div>' if label else ''
    
    # Value display
    value_html = f'<div style="text-align: right; font-size: 0.875rem; color: rgba(248, 249, 250, 0.85);">{value}/{max_value}</div>'
    
    st.markdown(
        f"""
        {label_html}
        <div style="margin-bottom: 1rem;">
            <div style="height: 0.5rem; background-color: rgba(30, 30, 30, 0.5); 
                        border-radius: 0.25rem; margin-bottom: 0.25rem;">
                <div style="height: 100%; width: {percentage}%; background-color: {color}; 
                            border-radius: 0.25rem;"></div>
            </div>
            {value_html}
        </div>
        """,
        unsafe_allow_html=True
    )

def render_code_block(code: str, language: str = "python"):
    """
    Render a code block with syntax highlighting.
    
    Args:
        code: The code to display
        language: Programming language for syntax highlighting
    """
    # Add syntax highlighting with a dark theme
    st.markdown(
        f"""
        <pre style="background-color: #1a1a1a; padding: 1rem; border-radius: 0.5rem; 
                    overflow-x: auto; margin-bottom: 1rem; font-family: monospace; 
                    border-left: 3px solid #7c4dff;">
            <code class="language-{language}">{code}</code>
        </pre>
        """,
        unsafe_allow_html=True
    )

def render_tag(text: str, color: Optional[str] = None, size: str = "medium"):
    """
    Render a tag/badge with the specified text and styling.
    
    Args:
        text: Tag text
        color: Tag color (optional, uses primary color if not specified)
        size: Tag size ('small', 'medium', 'large')
    """
    # Determine the size
    if size == "small":
        padding = "0.2rem 0.4rem"
        font_size = "0.7rem"
    elif size == "large":
        padding = "0.4rem 0.8rem"
        font_size = "0.9rem"
    else:  # medium (default)
        padding = "0.25rem 0.5rem"
        font_size = "0.8rem"
    
    # Use the provided color or default to primary
    bg_color = color if color else "rgba(124, 77, 255, 0.15)"
    text_color = color if color else "#7c4dff"
    
    st.markdown(
        f"""
        <span style="display: inline-block; padding: {padding}; background-color: {bg_color}; 
                     color: {text_color}; border-radius: 0.35rem; font-weight: 500; 
                     font-size: {font_size};">
            {text}
        </span>
        """,
        unsafe_allow_html=True
    )

def render_timeline(events: List[Dict[str, Any]]):
    """
    Render a vertical timeline of events.
    
    Args:
        events: List of event dicts with 'time', 'title', and 'description' keys
    """
    html = '<div style="position: relative; padding-left: 2rem; margin-bottom: 1.5rem;">'
    
    # Add each event to the timeline
    for event in events:
        html += f"""
        <div style="margin-bottom: 1.5rem; position: relative;">
            <!-- Timeline line -->
            <div style="position: absolute; top: 0; bottom: -1.5rem; left: -1.5rem; width: 2px; 
                        background-color: rgba(124, 77, 255, 0.25);"></div>
            
            <!-- Timeline dot -->
            <div style="position: absolute; left: -1.625rem; top: 0.25rem; width: 0.75rem; 
                        height: 0.75rem; border-radius: 50%; background-color: #7c4dff;"></div>
            
            <!-- Event time -->
            <div style="font-size: 0.8rem; color: rgba(248, 249, 250, 0.65); margin-bottom: 0.25rem;">
                {event['time']}
            </div>
            
            <!-- Event title -->
            <div style="font-weight: 600; margin-bottom: 0.25rem; color: var(--tf-text);">
                {event['title']}
            </div>
            
            <!-- Event description -->
            <div style="color: rgba(248, 249, 250, 0.85);">
                {event.get('description', '')}
            </div>
        </div>
        """
    
    html += '</div>'
    
    st.markdown(html, unsafe_allow_html=True)

def render_loading_skeleton(type_of_skeleton="text", count=1, width=None):
    """
    Render a loading skeleton animation.
    
    Args:
        type_of_skeleton: Type of skeleton to render ("text", "title", "circle", "button", "image")
        count: Number of skeleton items to render
        width: Optional width of the skeleton (percentage or pixel value as string)
    """
    skeleton_class = f"tf-skeleton-{type_of_skeleton}"
    width_style = f"width: {width};" if width else ""
    
    for _ in range(count):
        st.markdown(
            f"""
            <div class="tf-loading {skeleton_class}" style="{width_style}"></div>
            """,
            unsafe_allow_html=True
        )

def render_loading_spinner(text="Loading...", size="medium"):
    """
    Render a loading spinner.
    
    Args:
        text: Text to display alongside the spinner
        size: Size of the spinner ("small", "medium", "large")
    """
    # Determine spinner size based on the parameter
    if size == "small":
        dimensions = "height: 24px; width: 24px;"
    elif size == "large":
        dimensions = "height: 56px; width: 56px;"
    else:  # medium (default)
        dimensions = "height: 40px; width: 40px;"
    
    st.markdown(
        f"""
        <div style="display: flex; align-items: center; margin: 1rem 0;">
            <div class="tf-loading tf-loading-circle" style="{dimensions}"></div>
            <div style="margin-left: 1rem; color: var(--tf-text-secondary);">{text}</div>
        </div>
        """,
        unsafe_allow_html=True
    )

def render_notification(message, type_of_notification="info", duration=5000):
    """
    Render a notification (toast message).
    
    Args:
        message: Notification message
        type_of_notification: Type of notification ("info", "success", "warning", "error")
        duration: Duration in milliseconds before the notification disappears
    """
    notification_id = f"notification_{uuid.uuid4().hex[:8]}"
    
    # Set icon based on notification type
    icon = "ℹ️"
    if type_of_notification == "success":
        icon = "✅"
    elif type_of_notification == "warning":
        icon = "⚠️"
    elif type_of_notification == "error":
        icon = "❌"
    
    # Create the notification HTML
    notification_html = f"""
    <div id="{notification_id}" class="tf-notification {type_of_notification}">
        <div style="display: flex; align-items: flex-start;">
            <div style="margin-right: 0.75rem;">{icon}</div>
            <div style="flex-grow: 1;">{message}</div>
            <div style="margin-left: 0.75rem; cursor: pointer;" 
                 onclick="document.getElementById('{notification_id}').classList.add('hidden')">✕</div>
        </div>
    </div>
    
    <script>
    // Auto-hide the notification after the specified duration
    setTimeout(function() {{
        const notification = document.getElementById('{notification_id}');
        if (notification) {{
            notification.classList.add('hidden');
        }}
    }}, {duration});
    </script>
    """
    
    st.markdown(notification_html, unsafe_allow_html=True)

def render_modal(title, content, show_modal=False, on_close=None):
    """
    Render a modal dialog.
    
    Args:
        title: Modal title
        content: Modal content (HTML string)
        show_modal: Whether to show the modal
        on_close: Optional JavaScript code to run when the modal is closed
    """
    if not show_modal:
        return
    
    modal_id = f"modal_{uuid.uuid4().hex[:8]}"
    close_js = on_close if on_close else ""
    
    modal_html = f"""
    <div id="{modal_id}" class="tf-modal-backdrop">
        <div class="tf-modal">
            <div class="tf-modal-header">
                <div class="tf-modal-title">{title}</div>
                <button class="tf-modal-close" onclick="closeModal()">✕</button>
            </div>
            <div class="tf-modal-body">
                {content}
            </div>
            <div class="tf-modal-footer">
                <button class="tf-button secondary" onclick="closeModal()">Cancel</button>
                <button class="tf-button" onclick="confirmModal()">OK</button>
            </div>
        </div>
    </div>
    
    <script>
    function closeModal() {{
        document.getElementById('{modal_id}').style.display = 'none';
        {close_js}
    }}
    
    function confirmModal() {{
        document.getElementById('{modal_id}').style.display = 'none';
        {close_js}
        // Add any confirmation logic here
    }}
    </script>
    """
    
    st.markdown(modal_html, unsafe_allow_html=True)

def create_gradient_chart(data, title=None, x_label=None, y_label=None, color='#7c4dff'):
    """
    Create a line chart with gradient fill beneath the line.
    
    Args:
        data: Data for the chart (can be a list, Series, or DataFrame)
        title: Chart title
        x_label: Label for x-axis
        y_label: Label for y-axis
        color: Base color for the gradient
        
    Returns:
        fig: Matplotlib figure object
    """
    # Create figure and axis
    fig, ax = plt.subplots(figsize=(10, 4))
    
    # Convert data to appropriate format if needed
    if isinstance(data, pd.DataFrame) or isinstance(data, pd.Series):
        y = data.values
        x = range(len(y))
    else:
        y = data
        x = range(len(y))
    
    # Plot the line
    ax.plot(x, y, color=color, linewidth=2)
    
    # Create gradient fill
    # Create gradient fill beneath the line
    gradient = np.linspace(0, 1, 100)
    gradient = np.vstack((gradient, gradient))
    
    # Customize colors for dark theme
    ax.set_facecolor('#1e1e1e')
    fig.patch.set_facecolor('#1e1e1e')
    
    # Fill the area beneath the line with a gradient
    ax.fill_between(x, y, color=color, alpha=0.2)
    
    # Set the title and labels if provided
    if title:
        ax.set_title(title, color='white', fontsize=14)
    if x_label:
        ax.set_xlabel(x_label, color='white')
    if y_label:
        ax.set_ylabel(y_label, color='white')
    
    # Customize the grid
    ax.grid(True, linestyle='--', alpha=0.2)
    
    # Customize the ticks
    ax.tick_params(colors='white')
    
    # Customize the spines
    for spine in ax.spines.values():
        spine.set_color('gray')
        spine.set_alpha(0.3)
    
    plt.tight_layout()
    
    return fig