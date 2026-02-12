import streamlit as st
import pandas as pd
import numpy as np
import networkx as nx
import plotly.graph_objects as go
import plotly.express as px
import json
import re
from model_interface import ModelInterface

# Set page configuration
st.set_page_config(
    page_title="TerraFusion Workflow Visualization",
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
    
    /* Graph container */
    .graph-container {
        background-color: var(--tf-card-bg);
        border: 1px solid var(--tf-border);
        border-radius: 0.75rem;
        padding: 1.25rem;
        margin-top: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 0 20px rgba(0, 229, 255, 0.1);
    }
    
    /* Card components */
    .tf-card {
        background-color: var(--tf-card-bg);
        border: 1px solid var(--tf-border);
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        position: relative;
        overflow: hidden;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .tf-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 30px rgba(0, 229, 255, 0.15);
    }
    
    .tf-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background-color: var(--tf-primary);
        opacity: 0.7;
    }
    
    .card-title {
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--tf-primary);
        margin-bottom: 1rem;
    }
    
    /* Step card for workflow steps */
    .step-card {
        background-color: var(--tf-card-bg);
        border: 1px solid var(--tf-border);
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 0.75rem;
        position: relative;
    }
    
    .step-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 3px;
        height: 100%;
        background-color: var(--tf-primary);
        opacity: 0.7;
    }
    
    .step-title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--tf-primary);
        margin-bottom: 0.5rem;
    }
    
    .step-info {
        font-size: 0.875rem;
        color: var(--tf-text-secondary);
        margin-top: 0.5rem;
    }
    
    /* Metric cards */
    .metric-card {
        background-color: var(--tf-card-bg);
        border: 1px solid var(--tf-border);
        border-radius: 0.75rem;
        padding: 1.25rem;
        text-align: center;
        height: 100%;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .metric-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 30px rgba(0, 229, 255, 0.15);
    }
    
    .metric-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--tf-text-secondary);
        margin-bottom: 0.75rem;
    }
    
    .metric-value {
        font-size: 2rem;
        font-weight: 700;
        color: var(--tf-text);
        margin-bottom: 0.25rem;
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
    
    /* Code block styling */
    .code-block {
        background-color: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--tf-border);
        border-radius: 0.375rem;
        padding: 1rem;
        font-family: monospace;
        color: var(--tf-text);
        margin-bottom: 1rem;
        overflow-x: auto;
    }
</style>
""", unsafe_allow_html=True)

# Helper functions for workflow visualization
def create_graph_from_workflow(workflow_data):
    """Create a NetworkX graph from workflow data"""
    G = nx.DiGraph()
    
    # Add nodes
    for step in workflow_data["steps"]:
        G.add_node(step["id"], **step)
    
    # Add edges (dependencies)
    for step in workflow_data["steps"]:
        if "depends_on" in step:
            for dependency in step["depends_on"]:
                G.add_edge(dependency, step["id"])
    
    return G

def identify_critical_path(G):
    """Identify the critical path in the workflow graph"""
    # Find all paths from sources to sinks
    sources = [n for n, d in G.in_degree() if d == 0]
    sinks = [n for n, d in G.out_degree() if d == 0]
    
    all_paths = []
    for source in sources:
        for sink in sinks:
            try:
                paths = list(nx.all_simple_paths(G, source, sink))
                all_paths.extend(paths)
            except nx.NetworkXNoPath:
                pass
    
    if not all_paths:
        return None
    
    # Find the longest path
    longest_path = max(all_paths, key=len)
    return longest_path

def plot_workflow_graph(G, critical_path=None):
    """Create a Plotly graph visualization of the workflow"""
    # Use Fruchterman-Reingold layout
    pos = nx.spring_layout(G, seed=42)
    
    # Create edge traces
    edge_trace = []
    for edge in G.edges():
        x0, y0 = pos[edge[0]]
        x1, y1 = pos[edge[1]]
        
        is_critical = False
        if critical_path and len(critical_path) > 1:
            for i in range(len(critical_path) - 1):
                if critical_path[i] == edge[0] and critical_path[i + 1] == edge[1]:
                    is_critical = True
                    break
        
        edge_color = "#00e5ff" if is_critical else "rgba(255, 255, 255, 0.3)"
        edge_width = 3 if is_critical else 1
        
        edge_trace.append(
            go.Scatter(
                x=[x0, x1, None],
                y=[y0, y1, None],
                line=dict(width=edge_width, color=edge_color),
                hoverinfo='none',
                mode='lines'
            )
        )
    
    # Create node trace
    node_x = []
    node_y = []
    node_text = []
    node_color = []
    node_size = []
    
    for node in G.nodes():
        x, y = pos[node]
        node_x.append(x)
        node_y.append(y)
        
        node_data = G.nodes[node]
        node_text.append(f"{node_data.get('name', node)}<br>{node_data.get('type', 'task')}")
        
        # Critical path nodes
        if critical_path and node in critical_path:
            node_color.append("#00e5ff")
            node_size.append(20)
        else:
            node_color.append("rgba(255, 255, 255, 0.7)")
            node_size.append(15)
    
    node_trace = go.Scatter(
        x=node_x, y=node_y,
        mode='markers+text',
        hoverinfo='text',
        text=node_text,
        marker=dict(
            color=node_color,
            size=node_size,
            line=dict(width=1, color='#001529')
        ),
        textposition="top center",
        textfont=dict(
            color="rgba(255, 255, 255, 0.7)",
            size=10
        )
    )
    
    # Create figure
    fig = go.Figure(data=edge_trace + [node_trace],
                  layout=go.Layout(
                      showlegend=False,
                      hovermode='closest',
                      margin=dict(b=20, l=5, r=5, t=40),
                      xaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                      yaxis=dict(showgrid=False, zeroline=False, showticklabels=False),
                      plot_bgcolor='#001529',
                      paper_bgcolor='#0a2540',
                      title={
                          'text': 'Workflow Dependency Graph',
                          'font': {'color': '#00e5ff', 'size': 16},
                          'y': 0.95
                      },
                      font={'color': 'rgba(255, 255, 255, 0.7)'}
                  ))
    
    return fig

def extract_workflow_from_code(code, language):
    """Extract workflow structure from code"""
    if not st.session_state.model_interface.check_openai_status() and not st.session_state.model_interface.check_anthropic_status():
        st.error("No AI services available. Please configure API keys.")
        return None
    
    prompt = f"""
    Analyze the following {language} code and identify the workflow or process steps:
    
    ```{language.lower()}
    {code}
    ```
    
    Extract a detailed workflow structure, including:
    1. All distinct steps or functions in the process
    2. Dependencies between steps
    3. Estimated complexity/duration of each step
    
    Format your response as a JSON object with the following structure:
    {{
        "workflow_name": "Name of the workflow",
        "workflow_description": "Brief description of the workflow",
        "steps": [
            {{
                "id": "unique_id",
                "name": "Step name",
                "description": "What this step does",
                "type": "task/decision/process",
                "depends_on": ["id_of_dependency"],
                "duration": number from 1-10 representing complexity
            }}
        ]
    }}
    """
    
    try:
        # Use available model
        provider = "openai" if st.session_state.model_interface.check_openai_status() else "anthropic"
        system_message = "You are an expert code analyzer specialized in extracting workflow structures from code."
        
        response = st.session_state.model_interface.generate_text(
            prompt=prompt,
            system_message=system_message,
            provider=provider
        )
        
        # Extract JSON from the response
        json_match = re.search(r"```json\n(.*?)\n```", response, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find JSON without the markdown code block
            json_match = re.search(r"({.*})", response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response
        
        # Clean up and parse JSON
        cleaned_json = re.sub(r"^[^{]*", "", json_str)
        cleaned_json = re.sub(r"[^}]*$", "", cleaned_json)
        
        workflow_data = json.loads(cleaned_json)
        return workflow_data
    except Exception as e:
        st.error(f"Error extracting workflow: {str(e)}")
        return None

def analyze_workflow_efficiency(workflow_data):
    """Analyze the efficiency of a workflow structure"""
    if not st.session_state.model_interface.check_openai_status() and not st.session_state.model_interface.check_anthropic_status():
        st.error("No AI services available. Please configure API keys.")
        return None
    
    prompt = f"""
    Analyze the following workflow structure and provide detailed efficiency insights:
    
    Workflow JSON:
    {json.dumps(workflow_data, indent=2)}
    
    Provide a comprehensive analysis including:
    1. A high-level assessment of workflow efficiency
    2. Identification of bottlenecks and parallel processing opportunities
    3. Specific recommendations for optimization
    
    Format your response as a JSON object with the following structure:
    {{
        "efficiency_score": number from 0-100,
        "analysis": "High-level assessment",
        "bottlenecks": [
            {{
                "step_id": "id of bottleneck step",
                "impact": "High/Medium/Low",
                "recommendation": "How to address this bottleneck"
            }}
        ],
        "optimization_opportunities": [
            {{
                "type": "Type of optimization",
                "description": "Description of the opportunity",
                "steps_affected": ["step_id1", "step_id2"],
                "estimated_improvement": "Estimated improvement"
            }}
        ],
        "overall_recommendations": [
            "Recommendation 1",
            "Recommendation 2"
        ]
    }}
    """
    
    try:
        # Use available model
        provider = "openai" if st.session_state.model_interface.check_openai_status() else "anthropic"
        system_message = "You are an expert workflow optimization analyst specialized in improving process efficiency."
        
        response = st.session_state.model_interface.generate_text(
            prompt=prompt,
            system_message=system_message,
            provider=provider
        )
        
        # Extract JSON from the response
        json_match = re.search(r"```json\n(.*?)\n```", response, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # Try to find JSON without the markdown code block
            json_match = re.search(r"({.*})", response, re.DOTALL)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = response
        
        # Clean up and parse JSON
        cleaned_json = re.sub(r"^[^{]*", "", json_str)
        cleaned_json = re.sub(r"[^}]*$", "", cleaned_json)
        
        return json.loads(cleaned_json)
    except Exception as e:
        st.error(f"Error analyzing workflow: {str(e)}")
        return None

# Example workflow data for demonstration
EXAMPLE_WORKFLOW_DATA = {
    "workflow_name": "E-commerce Order Processing",
    "workflow_description": "Process a customer order from initial request to completion",
    "steps": [
        {
            "id": "validate_order",
            "name": "Validate Order Request",
            "description": "Check if the order request contains all required information",
            "type": "decision",
            "depends_on": [],
            "duration": 2
        },
        {
            "id": "create_order",
            "name": "Create Order in Database",
            "description": "Create a new order record in the database",
            "type": "task",
            "depends_on": ["validate_order"],
            "duration": 3
        },
        {
            "id": "check_inventory",
            "name": "Check Inventory",
            "description": "Verify that items are in stock",
            "type": "task",
            "depends_on": ["create_order"],
            "duration": 4
        },
        {
            "id": "process_payment",
            "name": "Process Payment",
            "description": "Process the customer's payment method",
            "type": "task",
            "depends_on": ["check_inventory"],
            "duration": 7
        },
        {
            "id": "reserve_inventory",
            "name": "Reserve Inventory",
            "description": "Reserve the inventory items for this order",
            "type": "task",
            "depends_on": ["process_payment"],
            "duration": 3
        },
        {
            "id": "confirm_order",
            "name": "Confirm Order",
            "description": "Mark the order as confirmed in the system",
            "type": "task",
            "depends_on": ["reserve_inventory"],
            "duration": 1
        },
        {
            "id": "send_confirmation",
            "name": "Send Confirmation Email",
            "description": "Send an order confirmation email to the customer",
            "type": "task",
            "depends_on": ["confirm_order"],
            "duration": 2
        },
        {
            "id": "get_order_details",
            "name": "Return Order Details",
            "description": "Retrieve and return the complete order details",
            "type": "task",
            "depends_on": ["send_confirmation"],
            "duration": 1
        }
    ]
}

# Example workflow analysis for demonstration
EXAMPLE_WORKFLOW_ANALYSIS = {
    "efficiency_score": 68,
    "analysis": "The workflow follows a logical sequence, but there are several bottlenecks and opportunities for parallel processing. The payment processing step is the most time-consuming and creates a single point of failure.",
    "bottlenecks": [
        {
            "step_id": "process_payment",
            "impact": "High",
            "recommendation": "Consider implementing payment processing service scaling or moving to an asynchronous processing model."
        },
        {
            "step_id": "check_inventory",
            "impact": "Medium",
            "recommendation": "Implement a caching layer for inventory status to reduce database load."
        }
    ],
    "optimization_opportunities": [
        {
            "type": "Parallel Processing",
            "description": "Some steps could be processed in parallel rather than sequentially",
            "steps_affected": ["check_inventory", "process_payment"],
            "estimated_improvement": "25-30% reduction in overall processing time"
        },
        {
            "type": "Caching",
            "description": "Implement caching for frequently accessed data",
            "steps_affected": ["check_inventory", "get_order_details"],
            "estimated_improvement": "40-50% reduction in database load"
        }
    ],
    "overall_recommendations": [
        "Implement an asynchronous processing model for payment handling",
        "Add parallel processing for independent steps like inventory checking and payment processing",
        "Implement a caching layer for inventory status",
        "Add retry logic for critical steps like payment processing",
        "Consider breaking down the monolithic workflow into microservices"
    ]
}

# Initialize session state
if 'model_interface' not in st.session_state:
    st.session_state.model_interface = ModelInterface()
    
if 'workflow_data' not in st.session_state:
    st.session_state.workflow_data = None
    
if 'workflow_details' not in st.session_state:
    st.session_state.workflow_details = None
    
if 'analyzed_code' not in st.session_state:
    st.session_state.analyzed_code = None

# Main content
st.markdown('<h1 class="dashboard-title">Workflow Visualization & Analysis</h1>', unsafe_allow_html=True)
st.markdown('<p class="dashboard-subtitle">Analyze workflows, identify bottlenecks, and optimize processes with AI</p>', unsafe_allow_html=True)

# Create a two-column layout
left_col, right_col = st.columns([2, 1])

with right_col:
    st.markdown('<div class="tf-card">', unsafe_allow_html=True)
    st.markdown('<div class="card-title">Workflow Input</div>', unsafe_allow_html=True)
    
    # Input method selection
    input_method = st.radio(
        "Input Method",
        ["Example Workflow", "Custom Code"],
        label_visibility="collapsed"
    )
    
    if input_method == "Example Workflow":
        # Example workflow selection
        st.success("Using pre-loaded example workflow")
        st.session_state.workflow_data = EXAMPLE_WORKFLOW_DATA
        st.session_state.workflow_details = EXAMPLE_WORKFLOW_ANALYSIS
    else:
        # Custom code input
        code_language = st.selectbox(
            "Select Language",
            ["Python", "JavaScript", "TypeScript", "Java", "C#", "Go", "SQL"]
        )
        
        code_to_analyze = st.text_area(
            "Enter Code to Analyze",
            height=300,
            placeholder=f"Paste your {code_language} code here..."
        )
        
        # Analyze button
        if st.button("Analyze Workflow", type="primary"):
            if not code_to_analyze.strip():
                st.error("Please enter code to analyze")
            else:
                with st.spinner("Analyzing workflow..."):
                    # Extract workflow from code
                    workflow_data = extract_workflow_from_code(code_to_analyze, code_language)
                    
                    if workflow_data:
                        st.session_state.workflow_data = workflow_data
                        st.session_state.analyzed_code = code_to_analyze
                        
                        # Analyze workflow efficiency
                        st.session_state.workflow_details = analyze_workflow_efficiency(workflow_data)
                        
                        st.success("Workflow analysis completed!")
    
    # Back to home
    if st.button("Back to Home"):
        st.switch_page("app.py")
    
    st.markdown('</div>', unsafe_allow_html=True)  # Close card div

with left_col:
    # Display workflow visualization and analysis
    if st.session_state.workflow_data and st.session_state.workflow_details:
        workflow_data = st.session_state.workflow_data
        workflow_details = st.session_state.workflow_details
        
        # Overview section
        st.markdown('<div class="tf-card">', unsafe_allow_html=True)
        st.markdown(f'<div class="card-title">{workflow_data.get("workflow_name", "Unnamed Workflow")}</div>', unsafe_allow_html=True)
        st.markdown(f'<p>{workflow_data.get("workflow_description", "No description available")}</p>', unsafe_allow_html=True)
        
        # Display metrics
        metrics = workflow_data.get('metrics', {})
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown(
                f'<div class="metric-card">'
                f'<div class="metric-label">Total Steps</div>'
                f'<div class="metric-value">{metrics.get("total_steps", len(workflow_data.get("steps", [])))}</div>'
                f'</div>',
                unsafe_allow_html=True
            )
        
        with col2:
            st.markdown(
                f'<div class="metric-card">'
                f'<div class="metric-label">Efficiency Score</div>'
                f'<div class="metric-value">{workflow_details.get("efficiency_score", 0)}/100</div>'
                f'</div>',
                unsafe_allow_html=True
            )
        
        with col3:
            bottlenecks = workflow_details.get('bottlenecks', [])
            bottleneck_count = len(bottlenecks)
            
            st.markdown(
                f'<div class="metric-card">'
                f'<div class="metric-label">Bottlenecks Identified</div>'
                f'<div class="metric-value">{bottleneck_count}</div>'
                f'</div>',
                unsafe_allow_html=True
            )
        st.markdown('</div>', unsafe_allow_html=True)  # Close card div
        
        # Visualization tab
        st.markdown('<div class="graph-container">', unsafe_allow_html=True)
        st.markdown('<div class="card-title">Workflow Visualization</div>', unsafe_allow_html=True)
        
        try:
            # Create graph from workflow data
            G = create_graph_from_workflow(workflow_data)
            
            # Identify critical path
            critical_path = identify_critical_path(G)
            
            # Create visualization
            fig = plot_workflow_graph(G, critical_path)
            
            # Display the graph
            st.plotly_chart(fig, use_container_width=True)
            
            # Show critical path
            if critical_path:
                st.markdown('<div class="step-card">', unsafe_allow_html=True)
                st.markdown('<div class="step-title">Critical Path</div>', unsafe_allow_html=True)
                critical_steps = [workflow_data["steps"][i]["name"] for i in range(len(workflow_data["steps"])) 
                                if workflow_data["steps"][i]["id"] in critical_path]
                st.markdown(f'<div class="step-info">{" → ".join(critical_steps)}</div>', unsafe_allow_html=True)
                st.markdown('</div>', unsafe_allow_html=True)
        except Exception as e:
            st.error(f"Error creating workflow visualization: {str(e)}")
        
        st.markdown('</div>', unsafe_allow_html=True)  # Close container div
        
        # Analysis tabs
        tab1, tab2, tab3 = st.tabs(["Efficiency Analysis", "Bottlenecks", "Recommendations"])
        
        with tab1:
            st.markdown('<div class="tf-card">', unsafe_allow_html=True)
            st.markdown('<div class="card-title">Efficiency Analysis</div>', unsafe_allow_html=True)
            
            # Overall efficiency score
            score = workflow_details.get('efficiency_score', 0)
            col1, col2 = st.columns([1, 5])
            
            with col1:
                st.markdown(
                    f'<div style="width: 70px; height: 70px; background-color: rgba(0, 229, 255, 0.1); '
                    f'border-radius: 50%; display: flex; align-items: center; justify-content: center; '
                    f'font-size: 1.8rem; font-weight: 700; color: var(--tf-primary); border: 2px solid var(--tf-primary);">'
                    f'{score}</div>',
                    unsafe_allow_html=True
                )
            
            with col2:
                st.markdown(workflow_details.get('analysis', 'No analysis available'))
            
            st.markdown('</div>', unsafe_allow_html=True)  # Close card div
        
        with tab2:
            st.markdown('<div class="tf-card">', unsafe_allow_html=True)
            st.markdown('<div class="card-title">Identified Bottlenecks</div>', unsafe_allow_html=True)
            
            bottlenecks = workflow_details.get('bottlenecks', [])
            
            if bottlenecks:
                for i, bottleneck in enumerate(bottlenecks):
                    step_id = bottleneck.get("step_id", "")
                    step_name = next((step["name"] for step in workflow_data["steps"] if step["id"] == step_id), step_id)
                    
                    impact = bottleneck.get('impact', 'Unknown')
                    impact_color = "#ff1744" if impact == "High" else "#ffd600" if impact == "Medium" else "#00c853"
                    
                    st.markdown(
                        f'<div class="step-card">'
                        f'<div class="step-title">{step_name}</div>'
                        f'<div><strong>Impact:</strong> <span style="color: {impact_color};">{impact}</span></div>'
                        f'<div class="step-info"><strong>Recommendation:</strong> {bottleneck.get("recommendation", "None provided")}</div>'
                        f'</div>',
                        unsafe_allow_html=True
                    )
            else:
                st.info("No bottlenecks identified in this workflow.")
            
            st.markdown('</div>', unsafe_allow_html=True)  # Close card div
        
        with tab3:
            st.markdown('<div class="tf-card">', unsafe_allow_html=True)
            st.markdown('<div class="card-title">Optimization Recommendations</div>', unsafe_allow_html=True)
            
            recommendations = workflow_details.get('overall_recommendations', [])
            
            if recommendations:
                for i, recommendation in enumerate(recommendations):
                    st.markdown(
                        f'<div class="step-card">'
                        f'<div class="step-info">📌 {recommendation}</div>'
                        f'</div>',
                        unsafe_allow_html=True
                    )
            else:
                st.info("No specific recommendations provided.")
            
            # Optimization opportunities
            opportunities = workflow_details.get('optimization_opportunities', [])
            
            if opportunities:
                st.markdown('<div class="card-title" style="margin-top: 1rem;">Optimization Opportunities</div>', unsafe_allow_html=True)
                
                for opportunity in opportunities:
                    affected_steps = opportunity.get("steps_affected", [])
                    affected_step_names = []
                    
                    for step_id in affected_steps:
                        step_name = next((step["name"] for step in workflow_data["steps"] if step["id"] == step_id), step_id)
                        affected_step_names.append(step_name)
                    
                    st.markdown(
                        f'<div class="step-card">'
                        f'<div class="step-title">{opportunity.get("type", "Optimization")}</div>'
                        f'<div>{opportunity.get("description", "No description")}</div>'
                        f'<div class="step-info"><strong>Affected Steps:</strong> {", ".join(affected_step_names)}</div>'
                        f'<div class="step-info"><strong>Estimated Improvement:</strong> {opportunity.get("estimated_improvement", "Unknown")}</div>'
                        f'</div>',
                        unsafe_allow_html=True
                    )
            
            st.markdown('</div>', unsafe_allow_html=True)  # Close card div
        
        # Workflow steps expander
        with st.expander("View Workflow Steps", expanded=False):
            steps = workflow_data.get("steps", [])
            for step in steps:
                deps = step.get("depends_on", [])
                dep_names = []
                
                for dep_id in deps:
                    dep_step = next((s for s in steps if s["id"] == dep_id), None)
                    if dep_step:
                        dep_names.append(dep_step["name"])
                
                st.markdown(
                    f'<div class="step-card">'
                    f'<div class="step-title">{step.get("name", "Unnamed Step")} ({step.get("id", "no-id")})</div>'
                    f'<div>{step.get("description", "No description")}</div>'
                    f'<div class="step-info"><strong>Type:</strong> {step.get("type", "task")}</div>'
                    f'<div class="step-info"><strong>Duration/Complexity:</strong> {step.get("duration", 1)}/10</div>'
                    f'<div class="step-info"><strong>Status:</strong> {step.get("status", "pending")}</div>'
                    f'<div class="step-info"><strong>Dependencies:</strong> {", ".join(dep_names) if dep_names else "None"}</div>'
                    f'</div>',
                    unsafe_allow_html=True
                )
    else:
        # Welcome message
        st.markdown('<div class="tf-card">', unsafe_allow_html=True)
        st.markdown('<div class="card-title">Welcome to Workflow Visualization & Analysis</div>', unsafe_allow_html=True)
        
        st.markdown("""
        This tool analyzes code to extract and visualize the workflow structure, identify bottlenecks, 
        and provide optimization recommendations.
        
        ### How to use this tool:
        1. Select "Example Workflow" or "Custom Code" in the side panel
        2. Choose from example workflows or enter your own code
        3. Click "Analyze Workflow" to generate insights
        
        The analysis will provide you with:
        - Visual representation of the workflow structure
        - Identification of the critical path
        - Bottleneck detection and analysis
        - Optimization recommendations
        """)
        
        st.markdown('</div>', unsafe_allow_html=True)  # Close card div
        
        # Show example visualization
        st.image("https://miro.medium.com/max/1400/1*5tZVj32BW2PR2o7j6WZE9A.png", 
                caption="Example workflow visualization", 
                use_column_width=True)