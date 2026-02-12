import streamlit as st
import time
from datetime import datetime
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd
import numpy as np
from sync_service import SyncService, BatchConfiguration

# Set page configuration
st.set_page_config(
    page_title="TerraFusion Sync Service",
    page_icon="🔄",
    layout="wide"
)

# Define TerraFusion-specific CSS
st.markdown("""
<style>
    /* TerraFusion color palette and theme */
    :root {
        --tf-primary: #00e5ff;
        --tf-primary-dark: #00b8d4;
        --tf-background: #001529;
        --tf-card-bg: #0a2540;
        --tf-text: #ffffff;
        --tf-text-secondary: rgba(0, 229, 255, 0.7);
        --tf-text-tertiary: rgba(0, 229, 255, 0.5);
        --tf-border: rgba(0, 229, 255, 0.2);
        --tf-success: #00c853;
        --tf-warning: #ffd600;
        --tf-error: #ff1744;
    }
    
    /* Title styling */
    .dashboard-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--tf-primary);
        margin-bottom: 0.5rem;
    }
    
    .dashboard-subtitle {
        font-size: 1rem;
        color: var(--tf-text-secondary);
        margin-bottom: 2rem;
    }
    
    /* Metric cards */
    .metric-card {
        background-color: var(--tf-card-bg);
        border: 1px solid var(--tf-border);
        border-radius: 0.75rem;
        padding: 1.25rem;
        position: relative;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        height: 100%;
    }
    
    .metric-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 30px rgba(0, 229, 255, 0.15);
    }
    
    .metric-title {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--tf-text-secondary);
        margin-bottom: 0.5rem;
    }
    
    .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--tf-text);
    }
    
    .metric-unit {
        font-size: 0.75rem;
        color: var(--tf-text-tertiary);
        font-weight: 400;
    }
    
    .metric-trend {
        font-size: 0.75rem;
        margin-left: 0.25rem;
    }
    
    /* Health status indicators */
    .health-critical {
        border-left: 4px solid var(--tf-error);
    }
    
    .health-warning {
        border-left: 4px solid var(--tf-warning);
    }
    
    .health-moderate {
        border-left: 4px solid var(--tf-primary);
    }
    
    .health-healthy {
        border-left: 4px solid var(--tf-success);
    }
    
    /* Control panel styling */
    .control-panel {
        background-color: var(--tf-card-bg);
        border: 1px solid var(--tf-border);
        border-radius: 0.75rem;
        padding: 1.25rem;
        margin-bottom: 1rem;
    }
    
    .control-panel-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--tf-primary);
        margin-bottom: 1rem;
        border-bottom: 1px solid var(--tf-border);
        padding-bottom: 0.5rem;
    }
    
    .control-section {
        margin-bottom: 1.5rem;
    }
    
    .control-section-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--tf-text-secondary);
        margin-bottom: 0.75rem;
    }
    
    /* Insights & interpretations */
    .insight-card {
        background-color: rgba(0, 229, 255, 0.05);
        border: 1px solid var(--tf-border);
        border-radius: 0.75rem;
        padding: 1rem;
        margin-bottom: 1rem;
    }
    
    .insight-icon {
        color: var(--tf-primary);
        margin-right: 0.5rem;
    }
    
    .insight-text {
        color: var(--tf-text-secondary);
        font-size: 0.875rem;
    }
    
    /* Chart styling */
    .chart-container {
        background-color: var(--tf-card-bg);
        border: 1px solid var(--tf-border);
        border-radius: 0.75rem;
        padding: 1.25rem;
        margin-top: 1.5rem;
        margin-bottom: 1.5rem;
    }
    
    .chart-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--tf-primary);
        margin-bottom: 1rem;
    }
    
    /* History items */
    .history-item {
        background-color: var(--tf-card-bg);
        border: 1px solid var(--tf-border);
        border-radius: 0.5rem;
        padding: 0.875rem;
        margin-bottom: 0.75rem;
        position: relative;
    }
    
    .history-success {
        border-left: 4px solid var(--tf-success);
    }
    
    .history-failure {
        border-left: 4px solid var(--tf-error);
    }
    
    .history-time {
        font-size: 0.75rem;
        color: var(--tf-text-tertiary);
        margin-bottom: 0.25rem;
    }
    
    .history-details {
        font-size: 0.875rem;
        color: var(--tf-text);
    }
    
    /* Button styling */
    .tf-button {
        background-color: var(--tf-primary);
        color: var(--tf-background);
        font-weight: 600;
        border: none;
        padding: 0.625rem 1.25rem;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.2s ease;
        width: 100%;
        text-align: center;
        margin-bottom: 1rem;
    }
    
    .tf-button:hover {
        background-color: var(--tf-primary-dark);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 229, 255, 0.3);
    }
    
    /* Tab styling override */
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
        background-color: rgba(0, 229, 255, 0.05) !important;
        color: var(--tf-primary) !important;
        border-bottom: 3px solid var(--tf-primary) !important;
        font-weight: 600;
    }
    
    /* Expander styling override */
    .streamlit-expanderHeader {
        color: var(--tf-primary);
        font-weight: 600;
    }
    
    .streamlit-expanderContent {
        background-color: rgba(0, 229, 255, 0.05);
        border-radius: 0.375rem;
        padding: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'sync_service' not in st.session_state:
    st.session_state.sync_service = SyncService()
    
if 'sync_history' not in st.session_state:
    st.session_state.sync_history = []
    
if 'performance_metrics' not in st.session_state:
    st.session_state.performance_metrics = []
    
if 'show_advanced' not in st.session_state:
    st.session_state.show_advanced = False

# Helper functions
def format_size(size_bytes):
    """Format bytes to a readable string"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.2f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.2f} TB"

def get_health_class(health_status):
    """Get the CSS class based on health status"""
    if health_status == "critical":
        return "health-critical"
    elif health_status == "warning":
        return "health-warning"
    elif health_status == "moderate" or health_status == "elevated":
        return "health-moderate"
    else:
        return "health-healthy"

def create_metric_card(title, value, unit="", trend=None, health_status="healthy"):
    """Create a styled metric card"""
    health_class = get_health_class(health_status)
    trend_html = ""
    if trend:
        trend_icon = "↑" if trend > 0 else "↓"
        trend_color = "#ff1744" if (trend > 0 and "cpu" in title.lower()) or (trend < 0 and "throughput" in title.lower()) else "#00c853"
        trend_html = f'<span class="metric-trend" style="color: {trend_color}">{trend_icon} {abs(trend):.1f}%</span>'
    
    html = f"""
    <div class="metric-card {health_class}">
        <div class="metric-title">{title}</div>
        <div class="metric-value">{value}<span class="metric-unit"> {unit}</span> {trend_html}</div>
    </div>
    """
    return html

# Main content header
st.markdown('<h1 class="dashboard-title">Sync Service Dashboard</h1>', unsafe_allow_html=True)
st.markdown('<p class="dashboard-subtitle">Monitor and manage synchronization operations with real-time performance metrics</p>', unsafe_allow_html=True)

# Create a two-column layout with control panel in the sidebar
left_col, right_col = st.columns([2, 1])

with right_col:
    # Control Panel
    st.markdown('<div class="control-panel">', unsafe_allow_html=True)
    st.markdown('<div class="control-panel-title">Sync Control Panel</div>', unsafe_allow_html=True)
    
    # Sync Operations Section
    st.markdown('<div class="control-section">', unsafe_allow_html=True)
    st.markdown('<div class="control-section-title">Operation Type</div>', unsafe_allow_html=True)
    
    sync_type = st.selectbox(
        "Select sync operation type",
        ["Full Sync", "Incremental Sync", "Selective Sync"],
        label_visibility="collapsed"
    )
    
    # Initialize collections variable
    collections = ["code_repositories"]  # Default to code repositories
    
    if sync_type == "Selective Sync":
        st.markdown('<div class="control-section-title">Target Repositories</div>', unsafe_allow_html=True)
        collections = st.multiselect(
            "Select repositories to sync",
            ["code_repositories", "workflow_patterns", "architecture_templates", "code_metrics", "performance_data"],
            ["code_repositories"],
            label_visibility="collapsed"
        )
    
    # Advanced Options
    st.markdown('<div class="control-section-title">Advanced Configuration</div>', unsafe_allow_html=True)
    
    with st.expander("Performance Settings"):
        batch_size = st.slider("Initial Batch Size", 10, 500, 100)
        dynamic_sizing = st.checkbox("Enable Dynamic Batch Sizing", value=True)
        resource_aware = st.checkbox("Enable Resource-Aware Sizing", value=True)
        adaptive_learning = st.checkbox("Enable Adaptive Learning", value=True)
    
    # Resource simulation section
    st.markdown('<div class="control-section-title">Resource Simulation</div>', unsafe_allow_html=True)
    
    simulate_load = st.checkbox("Simulate System Load", value=False)
    if simulate_load:
        simulated_cpu = st.slider("CPU Load (%)", 10, 95, 40)
        simulated_memory = st.slider("Memory Load (%)", 10, 95, 50)
        simulated_disk_io = st.slider("Disk I/O (%)", 5, 90, 30)
        
        st.markdown(
            '<div style="font-size: 0.75rem; color: var(--tf-text-tertiary); margin-top: 0.5rem;">'
            'This simulation allows you to test how batch sizes adjust under different system loads. '
            'Higher values result in smaller batch sizes to prevent system overload.'
            '</div>',
            unsafe_allow_html=True
        )
    
    # Execute button
    if st.button("Run Sync Operation", type="primary"):
        # Prepare configuration based on advanced options
        config = {
            "batch_size": batch_size,
            "dynamic_sizing": dynamic_sizing,
            "resource_aware_sizing": resource_aware,
            "adaptive_learning": adaptive_learning,
            "workload_specific_sizing": True
        }
        
        # Add simulated resources if enabled
        if simulate_load:
            config["simulated_resources"] = {
                "cpu_percent": simulated_cpu,
                "memory_percent": simulated_memory,
                "disk_io_percent": simulated_disk_io
            }
        
        # Update the sync service with the new configuration
        batch_config = BatchConfiguration(
            initial_size=config["batch_size"],
            min_size=max(10, int(config["batch_size"] * 0.5)),
            max_size=min(500, int(config["batch_size"] * 2.0))
        )
        st.session_state.sync_service = SyncService(batch_config=batch_config, config=config)
        
        # Run the selected sync operation
        with st.spinner(f"Running {sync_type}..."):
            if sync_type == "Full Sync":
                result = st.session_state.sync_service.full_sync()
            elif sync_type == "Incremental Sync":
                result = st.session_state.sync_service.incremental_sync()
            else:  # Selective Sync
                result = st.session_state.sync_service.selective_sync(collections)
            
            # Add to history
            st.session_state.sync_history.append({
                "type": sync_type,
                "timestamp": result.get("end_time", ""),
                "records_processed": result.get("records_processed", 0),
                "success": result.get("success", False),
                "performance": result.get("performance_metrics", {})
            })
            
            # Get latest performance metrics with simulation values if enabled
            metrics = st.session_state.sync_service.get_performance_metrics()
            
            # If simulation is enabled, override the system resource values
            if simulate_load and "system_resources" in metrics:
                metrics["system_resources"]["cpu_percent"] = simulated_cpu
                metrics["system_resources"]["memory_percent"] = simulated_memory
                metrics["system_resources"]["disk_io_percent"] = simulated_disk_io
                metrics["interpretation"]["system_health"] = st.session_state.sync_service._interpret_system_health(metrics["system_resources"])
                
                # Recalculate optimal batch sizes based on simulated resources
                metrics["optimal_batch_sizes"] = st.session_state.sync_service._calculate_optimal_batch_sizes(
                    metrics["system_resources"], 
                    metrics.get("repository", {})
                )
                
                # Add explanation about simulation
                if "adjustment_explanations" not in metrics["optimal_batch_sizes"]:
                    metrics["optimal_batch_sizes"]["adjustment_explanations"] = []
                metrics["optimal_batch_sizes"]["adjustment_explanations"].insert(
                    0, f"Batch sizes calculated based on simulated resources: CPU {simulated_cpu}%, Memory {simulated_memory}%, Disk I/O {simulated_disk_io}%"
                )
            
            st.session_state.performance_metrics.append(metrics)
            
            st.success(f"{sync_type} completed successfully!")
    
    # Display options
    st.markdown('<div class="control-section-title">Display Options</div>', unsafe_allow_html=True)
    show_advanced = st.checkbox("Show Advanced Metrics", value=st.session_state.show_advanced)
    st.session_state.show_advanced = show_advanced
    
    # Back to home
    if st.button("Back to Home", key="back_home"):
        st.switch_page("app.py")
    
    st.markdown('</div>', unsafe_allow_html=True) # Close control panel div
    
    # History Section
    st.markdown('<div class="control-panel">', unsafe_allow_html=True)
    st.markdown('<div class="control-panel-title">Sync History</div>', unsafe_allow_html=True)
    
    if not st.session_state.sync_history:
        st.markdown('<div style="color: var(--tf-text-tertiary); font-size: 0.875rem; text-align: center; padding: 1rem;">No sync operations recorded yet</div>', unsafe_allow_html=True)
    else:
        for idx, history in enumerate(reversed(st.session_state.sync_history)):
            if idx >= 5:  # Show only last 5 history items
                break
                
            success_class = "history-success" if history.get("success", False) else "history-failure"
            records = history.get("records_processed", 0)
            timestamp = history.get("timestamp", "")
            
            if timestamp:
                time_str = datetime.fromtimestamp(timestamp).strftime("%H:%M:%S")
            else:
                time_str = "Unknown time"
                
            st.markdown(
                f'<div class="history-item {success_class}">'
                f'<div class="history-time">{time_str} - {history["type"]}</div>'
                f'<div class="history-details">{records} records processed</div>'
                f'</div>',
                unsafe_allow_html=True
            )
    
    st.markdown('</div>', unsafe_allow_html=True) # Close history panel div

with left_col:
    # Dashboard info expander
    with st.expander("About This Dashboard", expanded=False):
        st.markdown("""
        ### Resource-Aware SyncService Dashboard
        
        This dashboard demonstrates TerraFusion's advanced synchronization capabilities with real-time resource monitoring and adaptive performance optimization.
        
        **Key Features:**
        
        * **Dynamic Batch Sizing**: Automatically adjusts based on system resources and performance metrics
        * **Resource Monitoring**: Real-time tracking of CPU, memory, and I/O utilization
        * **Performance Optimization**: AI-driven recommendations for optimal sync configurations
        * **Advanced Simulations**: Test sync behavior under different resource conditions
        
        The system uses machine learning to continuously improve sync performance based on historical data and current conditions.
        """)
    
    # Performance Metrics Tabs
    tab1, tab2, tab3 = st.tabs(["System Resources", "Batch Processing", "Repository Metrics"])
    
    with tab1:
        st.markdown('<h3 style="color: var(--tf-primary); font-size: 1.5rem; margin-bottom: 1rem;">System Resource Monitoring</h3>', unsafe_allow_html=True)
        
        # Get current metrics
        metrics = st.session_state.sync_service.get_performance_metrics()
        system_resources = metrics.get("system_resources", {})
        system_health = metrics.get("interpretation", {}).get("system_health", {})
        
        # Create metrics grid
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            cpu_percent = system_resources.get("cpu_percent", 0)
            cpu_status = system_health.get("components", {}).get("cpu", "healthy")
            st.markdown(create_metric_card(
                "CPU Usage", 
                f"{cpu_percent:.1f}", 
                unit="%", 
                health_status=cpu_status
            ), unsafe_allow_html=True)
            
        with col2:
            memory_percent = system_resources.get("memory_percent", 0)
            memory_status = system_health.get("components", {}).get("memory", "healthy")
            st.markdown(create_metric_card(
                "Memory Usage", 
                f"{memory_percent:.1f}", 
                unit="%", 
                health_status=memory_status
            ), unsafe_allow_html=True)
            
        with col3:
            memory_used = system_resources.get("memory_used_mb", 0)
            st.markdown(create_metric_card(
                "Memory Used", 
                f"{memory_used:.1f}", 
                unit="MB"
            ), unsafe_allow_html=True)
            
        with col4:
            disk_io = system_resources.get("disk_io_percent", 0)
            disk_status = system_health.get("components", {}).get("disk_io", "healthy")
            st.markdown(create_metric_card(
                "Disk I/O", 
                f"{disk_io:.1f}", 
                unit="%", 
                health_status=disk_status
            ), unsafe_allow_html=True)
        
        # Resource interpretations
        if system_health.get("resource_interpretations"):
            st.markdown('<div style="margin-top: 1.5rem;"></div>', unsafe_allow_html=True)
            st.markdown('<h4 style="color: var(--tf-primary); font-size: 1.1rem; margin-bottom: 1rem;">System Insights</h4>', unsafe_allow_html=True)
            
            for interpretation in system_health.get("resource_interpretations", []):
                st.markdown(
                    f'<div class="insight-card">'
                    f'<span class="insight-icon">💡</span>'
                    f'<span class="insight-text">{interpretation}</span>'
                    f'</div>',
                    unsafe_allow_html=True
                )
        
        # Resource usage over time chart
        if st.session_state.performance_metrics:
            st.markdown('<div class="chart-container">', unsafe_allow_html=True)
            st.markdown('<div class="chart-title">Resource Usage Over Time</div>', unsafe_allow_html=True)
            
            # Prepare data
            timestamps = [i for i in range(len(st.session_state.performance_metrics))]
            cpu_values = [m.get("system_resources", {}).get("cpu_percent", 0) for m in st.session_state.performance_metrics]
            memory_values = [m.get("system_resources", {}).get("memory_percent", 0) for m in st.session_state.performance_metrics]
            disk_values = [m.get("system_resources", {}).get("disk_io_percent", 0) for m in st.session_state.performance_metrics]
            
            # Create dataframe
            df = pd.DataFrame({
                "Time": timestamps,
                "CPU Usage (%)": cpu_values,
                "Memory Usage (%)": memory_values,
                "Disk I/O (%)": disk_values
            })
            
            # Create chart with TerraFusion styling
            fig = px.line(df, x="Time", y=["CPU Usage (%)", "Memory Usage (%)", "Disk I/O (%)"])
            
            fig.update_layout(
                plot_bgcolor='rgba(1, 21, 41, 0.7)',
                paper_bgcolor='rgba(10, 37, 64, 0)',
                font=dict(color='rgba(255, 255, 255, 0.7)'),
                legend=dict(
                    font=dict(color='rgba(255, 255, 255, 0.7)'),
                    bgcolor='rgba(10, 37, 64, 0.3)',
                    bordercolor='rgba(0, 229, 255, 0.2)'
                ),
                height=350,
                margin=dict(l=20, r=20, t=30, b=20),
                xaxis=dict(
                    showgrid=True,
                    gridcolor='rgba(0, 229, 255, 0.1)',
                    zeroline=False
                ),
                yaxis=dict(
                    showgrid=True,
                    gridcolor='rgba(0, 229, 255, 0.1)',
                    zeroline=False
                )
            )
            
            # Update line colors to match TerraFusion palette
            fig.data[0].line.color = '#00e5ff'  # CPU - Primary TerraFusion color
            fig.data[1].line.color = '#4fc3f7'  # Memory - Secondary blue
            fig.data[2].line.color = '#ff9100'  # Disk I/O - Accent orange
            
            st.plotly_chart(fig, use_container_width=True)
            
            st.markdown('</div>', unsafe_allow_html=True) # Close chart container