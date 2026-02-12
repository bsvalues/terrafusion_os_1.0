#!/usr/bin/env python3
"""
TerraFusion Interactive Model Monitoring Dashboard with SHAP Values
This app provides visualizations for model drift, audit trails, and feature importance
"""

import os
import sys
import json
import datetime
import pandas as pd
import numpy as np
from pathlib import Path
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import dash
from dash import html, dcc, callback, Output, Input, State
import dash.dash_table as dash_table
import base64
from io import BytesIO
from PIL import Image

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up paths
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIT_PATH = os.path.join(PROJECT_ROOT, "models", "audit_logs", "inference_audit_log.csv")
FEEDBACK_PATH = os.path.join(PROJECT_ROOT, "models", "feedback", "condition_feedback.csv")
DRIFT_PATH = os.path.join(PROJECT_ROOT, "models", "drift_logs", "condition_drift_log.csv")
UPLOADS_PATH = os.path.join(PROJECT_ROOT, "uploads")
SAMPLE_IMAGES_PATH = os.path.join(PROJECT_ROOT, "data", "sample_images")

# Sample SHAP values for demonstration - in a real app, these would come from the model
SAMPLE_SHAP_VALUES = {
    "excellent": {
        "features": ["Roof Condition", "Exterior Paint", "Windows", "Siding", "Foundation", "Landscaping"],
        "values": [0.85, 0.67, 0.58, 0.45, 0.32, 0.28],
        "image_path": os.path.join(SAMPLE_IMAGES_PATH, "excellent_condition.jpg")
    },
    "good": {
        "features": ["Roof Condition", "Exterior Paint", "Windows", "Siding", "Foundation", "Landscaping"],
        "values": [0.56, 0.48, 0.42, 0.35, 0.28, 0.20],
        "image_path": os.path.join(SAMPLE_IMAGES_PATH, "good_condition.jpg")
    },
    "average": {
        "features": ["Roof Condition", "Exterior Paint", "Windows", "Siding", "Foundation", "Landscaping"],
        "values": [0.25, 0.18, 0.15, -0.12, -0.18, -0.22],
        "image_path": os.path.join(SAMPLE_IMAGES_PATH, "average_condition.jpg")
    },
    "fair": {
        "features": ["Roof Condition", "Exterior Paint", "Windows", "Siding", "Foundation", "Landscaping"],
        "values": [-0.15, -0.22, -0.32, -0.38, -0.45, -0.55],
        "image_path": os.path.join(SAMPLE_IMAGES_PATH, "fair_condition.jpg")
    },
    "poor": {
        "features": ["Roof Condition", "Exterior Paint", "Windows", "Siding", "Foundation", "Landscaping"],
        "values": [-0.45, -0.55, -0.62, -0.68, -0.75, -0.82],
        "image_path": os.path.join(SAMPLE_IMAGES_PATH, "poor_condition.jpg")
    }
}

# Function to load data
def load_data():
    data = {
        "audit": None,
        "feedback": None,
        "drift": None
    }
    
    # Load audit log if available
    try:
        if os.path.exists(AUDIT_PATH):
            data["audit"] = pd.read_csv(AUDIT_PATH)
            data["audit"]['timestamp'] = pd.to_datetime(data["audit"]['timestamp'])
            print(f"Loaded {len(data['audit'])} audit records")
        else:
            print(f"Audit log not found at {AUDIT_PATH}")
    except Exception as e:
        print(f"Error loading audit data: {str(e)}")
    
    # Load feedback data if available
    try:
        if os.path.exists(FEEDBACK_PATH):
            data["feedback"] = pd.read_csv(FEEDBACK_PATH)
            data["feedback"]['timestamp'] = pd.to_datetime(data["feedback"]['timestamp'])
            print(f"Loaded {len(data['feedback'])} feedback records")
        else:
            print(f"Feedback data not found at {FEEDBACK_PATH}")
    except Exception as e:
        print(f"Error loading feedback data: {str(e)}")
    
    # Load drift data if available
    try:
        if os.path.exists(DRIFT_PATH):
            data["drift"] = pd.read_csv(DRIFT_PATH)
            data["drift"]['date'] = pd.to_datetime(data["drift"]['date'])
            print(f"Loaded {len(data['drift'])} drift records")
        else:
            print(f"Drift data not found at {DRIFT_PATH}")
    except Exception as e:
        print(f"Error loading drift data: {str(e)}")
    
    return data

# Function to create demo data if no real data exists
def create_demo_data():
    demo_data = {
        "audit": None,
        "feedback": None,
        "drift": None
    }
    
    # Create demo audit data
    dates = pd.date_range(end=pd.Timestamp.now(), periods=200, freq='H')
    model_versions = np.random.choice(['1.0.0', '2.0.0', '2.1.0'], size=200, p=[0.3, 0.5, 0.2])
    scores = np.clip(np.random.normal(3.0, 1.0, size=200), 1.0, 5.0).round(1)
    execution_times = np.random.uniform(100, 500, size=200).round(2)
    fallback_used = np.random.choice([True, False], size=200, p=[0.1, 0.9])
    
    demo_data["audit"] = pd.DataFrame({
        'timestamp': dates,
        'filename': [f"property_{i}.jpg" for i in range(1, 201)],
        'model_name': ['condition_model'] * 200,
        'model_version': model_versions,
        'score': scores,
        'execution_time_ms': execution_times,
        'fallback_used': fallback_used
    })
    
    # Create demo feedback data
    feedback_dates = pd.date_range(end=pd.Timestamp.now(), periods=50, freq='D')
    ai_scores = np.clip(np.random.normal(3.0, 0.8, size=50), 1.0, 5.0).round(1)
    user_scores = np.clip(ai_scores + np.random.normal(0, 0.5, size=50), 1.0, 5.0).round(1)
    differences = (user_scores - ai_scores).round(2)
    abs_differences = np.abs(differences).round(2)
    model_versions = np.random.choice(['1.0.0', '2.0.0', '2.1.0'], size=50, p=[0.3, 0.5, 0.2])
    
    demo_data["feedback"] = pd.DataFrame({
        'timestamp': feedback_dates,
        'filename': [f"feedback_{i}.jpg" for i in range(1, 51)],
        'ai_score': ai_scores,
        'user_score': user_scores,
        'difference': differences,
        'model_version': model_versions,
        'abs_difference': abs_differences
    })
    
    # Create demo drift data
    drift_dates = pd.date_range(end=pd.Timestamp.now(), periods=30, freq='D')
    drift_data = []
    
    for version in ['1.0.0', '2.0.0', '2.1.0']:
        if version == '1.0.0':
            mean_drift = 0.3  # Conservative (scores too low)
        elif version == '2.0.0':
            mean_drift = -0.2  # Optimistic (scores too high)
        else:
            mean_drift = -0.5  # Very optimistic
        
        for date in drift_dates[-10:]:  # Last 10 days for each model
            noise = np.random.normal(0, 0.1)
            sample_count = np.random.randint(1, 10)
            
            if mean_drift > 0.1:
                direction = "conservative"
            elif mean_drift < -0.1:
                direction = "optimistic"
            else:
                direction = "neutral"
                
            drift_data.append({
                'date': date,
                'model_version': version,
                'mean_drift': mean_drift + noise,
                'median_drift': mean_drift + np.random.normal(0, 0.05),
                'std_drift': np.random.uniform(0.1, 0.3),
                'sample_count': sample_count,
                'max_drift': mean_drift + np.random.uniform(0.3, 0.7),
                'min_drift': mean_drift - np.random.uniform(0.3, 0.7),
                'drift_direction': direction
            })
    
    demo_data["drift"] = pd.DataFrame(drift_data)
    
    return demo_data

# Load data or create demo data if not available
data = load_data()

# Use demo data if any real data is missing
if data["audit"] is None or data["feedback"] is None or data["drift"] is None:
    print("Some real data is missing, using demo data instead")
    data = create_demo_data()

# Create sample images directory if it doesn't exist
os.makedirs(SAMPLE_IMAGES_PATH, exist_ok=True)

# Initialize Dash app
app = dash.Dash(
    __name__, 
    title="TerraFusion Model Monitoring Dashboard",
    meta_tags=[{"name": "viewport", "content": "width=device-width, initial-scale=1"}]
)

# Define app layout
app.layout = html.Div([
    # Header
    html.Div([
        html.H1("TerraFusion Model Monitoring Dashboard", className="app-header"),
        html.P("Real-time tracking of model performance, drift, and explainability"),
    ], className="header-container"),
    
    # Navigation Tabs
    dcc.Tabs(id="tabs", value="tab-overview", children=[
        # Overview Tab
        dcc.Tab(label="Overview", value="tab-overview", children=[
            html.Div([
                html.H2("Model Performance Overview"),
                
                # Statistics cards
                html.Div([
                    # Card 1: Total Predictions
                    html.Div([
                        html.H3("Total Predictions"),
                        html.P(f"{len(data['audit']):,}", className="stat-value")
                    ], className="stat-card"),
                    
                    # Card 2: Average Score
                    html.Div([
                        html.H3("Average Score"),
                        html.P(f"{data['audit']['score'].mean():.2f}", className="stat-value")
                    ], className="stat-card"),
                    
                    # Card 3: Feedback Count
                    html.Div([
                        html.H3("User Feedback"),
                        html.P(f"{len(data['feedback']):,}", className="stat-value")
                    ], className="stat-card"),
                    
                    # Card 4: Average Drift
                    html.Div([
                        html.H3("Average Drift"),
                        html.P(f"{data['drift']['mean_drift'].mean():.2f}", className="stat-value")
                    ], className="stat-card"),
                ], className="stats-container"),
                
                # Score Distribution and Version Usage
                html.Div([
                    # Score Distribution
                    html.Div([
                        html.H3("Score Distribution"),
                        dcc.Graph(
                            id="score-distribution",
                            figure=px.histogram(
                                data["audit"], 
                                x="score",
                                nbins=20,
                                title="Condition Score Distribution",
                                labels={"score": "Condition Score"},
                                color_discrete_sequence=["#3366cc"]
                            ).update_layout(
                                xaxis=dict(tickmode='linear', tick0=1, dtick=0.5),
                                xaxis_range=[1, 5]
                            )
                        )
                    ], className="graph-container"),
                    
                    # Version Usage
                    html.Div([
                        html.H3("Model Version Usage"),
                        dcc.Graph(
                            id="version-usage",
                            figure=px.pie(
                                data["audit"], 
                                names="model_version",
                                title="Model Version Distribution",
                                color_discrete_sequence=px.colors.qualitative.G10
                            ).update_traces(
                                textinfo='percent+label',
                                pull=[0.05, 0.05, 0.05]
                            )
                        )
                    ], className="graph-container"),
                ], className="row-container"),
                
                # Recent Activity
                html.Div([
                    html.H3("Recent Activity"),
                    dash_table.DataTable(
                        id="recent-activity-table",
                        columns=[
                            {"name": "Timestamp", "id": "timestamp"},
                            {"name": "Filename", "id": "filename"},
                            {"name": "Model Version", "id": "model_version"},
                            {"name": "Score", "id": "score"},
                            {"name": "Execution Time (ms)", "id": "execution_time_ms"},
                            {"name": "Fallback Used", "id": "fallback_used"}
                        ],
                        data=data["audit"].sort_values("timestamp", ascending=False).head(10).to_dict("records"),
                        style_cell={'textAlign': 'left', 'padding': '10px'},
                        style_header={
                            'backgroundColor': '#f8f9fa',
                            'fontWeight': 'bold',
                            'border': '1px solid #ddd'
                        },
                        style_data={'border': '1px solid #ddd'},
                        style_data_conditional=[{
                            'if': {'column_id': 'fallback_used', 'filter_query': '{fallback_used} eq "True"'},
                            'backgroundColor': '#fff3cd',
                            'color': '#856404'
                        }]
                    )
                ], className="table-container")
            ], className="tab-content")
        ]),
        
        # Drift Tab
        dcc.Tab(label="Model Drift", value="tab-drift", children=[
            html.Div([
                html.H2("Model Drift Analysis"),
                
                # Drift Controls
                html.Div([
                    html.Label("Select Time Range:"),
                    dcc.Dropdown(
                        id="drift-time-range",
                        options=[
                            {"label": "Last 7 Days", "value": 7},
                            {"label": "Last 14 Days", "value": 14},
                            {"label": "Last 30 Days", "value": 30},
                            {"label": "All Data", "value": 0}
                        ],
                        value=30,
                        clearable=False,
                        className="dropdown"
                    ),
                    
                    html.Label("Select Model Version:"),
                    dcc.Dropdown(
                        id="drift-model-version",
                        options=[
                            {"label": "All Versions", "value": "all"},
                            {"label": "v1.0.0", "value": "1.0.0"},
                            {"label": "v2.0.0", "value": "2.0.0"},
                            {"label": "v2.1.0", "value": "2.1.0"}
                        ],
                        value="all",
                        clearable=False,
                        className="dropdown"
                    )
                ], className="control-container"),
                
                # Drift Over Time Chart
                html.Div([
                    html.H3("Drift Over Time"),
                    dcc.Graph(id="drift-over-time")
                ], className="graph-container"),
                
                # Feedback Volume Chart
                html.Div([
                    html.H3("Feedback Volume"),
                    dcc.Graph(id="feedback-volume")
                ], className="graph-container"),
                
                # Drift Statistics
                html.Div([
                    html.H3("Drift Statistics"),
                    html.Div(id="drift-stats-container", className="stats-container")
                ]),
                
                # Drift Direction Breakdown
                html.Div([
                    html.H3("Drift Direction by Version"),
                    html.Div(id="drift-direction-container", className="row-container")
                ])
            ], className="tab-content")
        ]),
        
        # SHAP Values Tab
        dcc.Tab(label="SHAP Values", value="tab-shap", children=[
            html.Div([
                html.H2("Feature Importance Analysis"),
                
                # SHAP Values Controls
                html.Div([
                    html.Label("Select Property Condition:"),
                    dcc.Dropdown(
                        id="shap-condition-selector",
                        options=[
                            {"label": "Excellent (4.5-5.0)", "value": "excellent"},
                            {"label": "Good (3.5-4.4)", "value": "good"},
                            {"label": "Average (2.5-3.4)", "value": "average"},
                            {"label": "Fair (1.5-2.4)", "value": "fair"},
                            {"label": "Poor (1.0-1.4)", "value": "poor"}
                        ],
                        value="good",
                        clearable=False,
                        className="dropdown"
                    )
                ], className="control-container"),
                
                # Property Image and SHAP Visualization
                html.Div([
                    # Left side: Property Image
                    html.Div([
                        html.H3("Property Image"),
                        html.Div(id="property-image-container", className="image-container")
                    ], className="column-half"),
                    
                    # Right side: SHAP Values
                    html.Div([
                        html.H3("Feature Contributions"),
                        dcc.Graph(id="shap-waterfall")
                    ], className="column-half")
                ], className="row-container"),
                
                # SHAP Explanation
                html.Div([
                    html.H3("Understanding SHAP Values"),
                    html.P([
                        "SHAP (SHapley Additive exPlanations) values show how each feature contributes to pushing the prediction higher or lower. ",
                        "Positive values (red) increase the condition score, while negative values (blue) decrease it. ",
                        "The values represent the impact of each feature on the final prediction."
                    ]),
                    html.P([
                        "This analysis helps understand why a property received a particular condition score and identifies which specific ",
                        "attributes had the most significant impact."
                    ])
                ], className="explanation-container")
            ], className="tab-content")
        ]),
        
        # Audit Log Tab
        dcc.Tab(label="Audit Log", value="tab-audit", children=[
            html.Div([
                html.H2("Model Inference Audit Log"),
                
                # Audit Controls
                html.Div([
                    html.Label("Filter by Model Version:"),
                    dcc.Dropdown(
                        id="audit-model-version",
                        options=[
                            {"label": "All Versions", "value": "all"},
                            {"label": "v1.0.0", "value": "1.0.0"},
                            {"label": "v2.0.0", "value": "2.0.0"},
                            {"label": "v2.1.0", "value": "2.1.0"}
                        ],
                        value="all",
                        clearable=False,
                        className="dropdown"
                    ),
                    
                    html.Label("Filter by Score Range:"),
                    dcc.RangeSlider(
                        id="audit-score-range",
                        min=1,
                        max=5,
                        step=0.1,
                        marks={1: '1.0', 2: '2.0', 3: '3.0', 4: '4.0', 5: '5.0'},
                        value=[1, 5]
                    ),
                    
                    html.Label("Show Fallbacks Only:"),
                    dcc.Checklist(
                        id="audit-fallback-only",
                        options=[{"label": "Show only records using fallback", "value": "fallback"}],
                        value=[]
                    )
                ], className="control-container"),
                
                # Audit Table
                html.Div([
                    dash_table.DataTable(
                        id="audit-table",
                        columns=[
                            {"name": "Timestamp", "id": "timestamp"},
                            {"name": "Filename", "id": "filename"},
                            {"name": "Model Version", "id": "model_version"},
                            {"name": "Score", "id": "score"},
                            {"name": "Execution Time (ms)", "id": "execution_time_ms"},
                            {"name": "Fallback Used", "id": "fallback_used"}
                        ],
                        data=data["audit"].sort_values("timestamp", ascending=False).head(100).to_dict("records"),
                        page_size=15,
                        style_cell={'textAlign': 'left', 'padding': '10px'},
                        style_header={
                            'backgroundColor': '#f8f9fa',
                            'fontWeight': 'bold',
                            'border': '1px solid #ddd'
                        },
                        style_data={'border': '1px solid #ddd'},
                        style_data_conditional=[{
                            'if': {'column_id': 'fallback_used', 'filter_query': '{fallback_used} eq "True"'},
                            'backgroundColor': '#fff3cd',
                            'color': '#856404'
                        }]
                    )
                ], className="table-container"),
                
                # Metrics Over Time
                html.Div([
                    html.H3("Metrics Over Time"),
                    dcc.Graph(id="audit-metrics-over-time")
                ], className="graph-container")
            ], className="tab-content")
        ])
    ], className="tabs-container"),
    
    # Footer
    html.Div([
        html.P([
            "TerraFusion Model Monitoring Dashboard",
            html.Br(),
            "© 2025 TerraFusion Inc. All rights reserved."
        ])
    ], className="footer-container")
], className="app-container")

# Callback for drift tab
@app.callback(
    [Output("drift-over-time", "figure"),
     Output("feedback-volume", "figure"),
     Output("drift-stats-container", "children"),
     Output("drift-direction-container", "children")],
    [Input("drift-time-range", "value"),
     Input("drift-model-version", "value")]
)
def update_drift_tab(days, model_version):
    # Filter by time range
    if days > 0:
        cutoff_date = pd.Timestamp.now() - pd.Timedelta(days=days)
        filtered_drift = data["drift"][data["drift"]["date"] >= cutoff_date]
    else:
        filtered_drift = data["drift"]
    
    # Filter by model version if not "all"
    if model_version != "all":
        filtered_drift = filtered_drift[filtered_drift["model_version"] == model_version]
    
    # Drift over time chart
    drift_fig = px.line(
        filtered_drift, 
        x="date", 
        y="mean_drift", 
        color="model_version",
        labels={"date": "Date", "mean_drift": "Mean Drift", "model_version": "Model Version"},
        title="Model Drift Over Time (User Score - AI Score)",
        color_discrete_sequence=px.colors.qualitative.G10
    )
    
    # Add zero line
    drift_fig.add_shape(
        type="line",
        x0=filtered_drift["date"].min(),
        y0=0,
        x1=filtered_drift["date"].max(),
        y1=0,
        line=dict(color="gray", width=2, dash="dash")
    )
    
    # Feedback volume chart - get feedback data and aggregate by date
    if days > 0:
        cutoff_date = pd.Timestamp.now() - pd.Timedelta(days=days)
        filtered_feedback = data["feedback"][data["feedback"]["timestamp"].dt.date >= cutoff_date.date()]
    else:
        filtered_feedback = data["feedback"]
    
    # Only filter by model version if specified and not "all"
    if model_version != "all":
        filtered_feedback = filtered_feedback[filtered_feedback["model_version"] == model_version]
    
    # Group by date and count
    feedback_by_date = filtered_feedback.groupby(filtered_feedback["timestamp"].dt.date).size().reset_index()
    feedback_by_date.columns = ["date", "count"]
    
    # Convert date to datetime for plotting
    feedback_by_date["date"] = pd.to_datetime(feedback_by_date["date"])
    
    # Feedback volume chart
    volume_fig = px.bar(
        feedback_by_date, 
        x="date", 
        y="count",
        labels={"date": "Date", "count": "Feedback Count"},
        title="User Feedback Volume Over Time",
        color_discrete_sequence=["#3366cc"]
    )
    
    # Drift stats cards
    if len(filtered_drift) > 0:
        avg_drift = filtered_drift["mean_drift"].mean()
        max_drift = filtered_drift["mean_drift"].max()
        min_drift = filtered_drift["mean_drift"].min()
        total_samples = filtered_drift["sample_count"].sum()
        
        # Determine drift status
        drift_status = "neutral"
        drift_text = "No significant drift"
        
        if abs(avg_drift) > 0.5:
            drift_status = "critical"
            drift_text = "Critical drift detected"
        elif abs(avg_drift) > 0.2:
            drift_status = "warning"
            drift_text = "Moderate drift detected"
        
        drift_stats = [
            # Card 1: Average Drift
            html.Div([
                html.H3("Average Drift"),
                html.P(f"{avg_drift:.2f}", className=f"stat-value {drift_status}")
            ], className="stat-card"),
            
            # Card 2: Max Drift
            html.Div([
                html.H3("Maximum Drift"),
                html.P(f"{max_drift:.2f}", className="stat-value")
            ], className="stat-card"),
            
            # Card 3: Min Drift
            html.Div([
                html.H3("Minimum Drift"),
                html.P(f"{min_drift:.2f}", className="stat-value")
            ], className="stat-card"),
            
            # Card 4: Total Samples
            html.Div([
                html.H3("Total Feedback"),
                html.P(f"{total_samples:,}", className="stat-value")
            ], className="stat-card"),
            
            # Card 5: Drift Status
            html.Div([
                html.H3("Drift Status"),
                html.P(drift_text, className=f"stat-value {drift_status}")
            ], className="stat-card")
        ]
    else:
        drift_stats = [
            html.Div([
                html.H3("No Data"),
                html.P("No drift data available for the selected filters", className="no-data-message")
            ], className="stat-card full-width")
        ]
    
    # Drift direction breakdown
    direction_charts = []
    
    if len(filtered_drift) > 0:
        # Group by model version and drift direction
        direction_data = filtered_drift.groupby(["model_version", "drift_direction"]).size().reset_index()
        direction_data.columns = ["model_version", "drift_direction", "count"]
        
        # Get unique model versions
        unique_versions = direction_data["model_version"].unique()
        
        # Create a pie chart for each version
        for version in unique_versions:
            version_data = direction_data[direction_data["model_version"] == version]
            
            direction_fig = px.pie(
                version_data,
                values="count",
                names="drift_direction",
                title=f"Drift Direction for v{version}",
                color="drift_direction",
                color_discrete_map={
                    "conservative": "#ff9999",  # red
                    "neutral": "#99ff99",       # green
                    "optimistic": "#66b3ff"     # blue
                }
            )
            
            direction_charts.append(
                html.Div([
                    dcc.Graph(figure=direction_fig)
                ], className="column-third")
            )
    
    if not direction_charts:
        direction_charts = [
            html.Div([
                html.P("No drift direction data available for the selected filters", className="no-data-message")
            ], className="full-width")
        ]
    
    return drift_fig, volume_fig, drift_stats, direction_charts

# Callback for SHAP tab
@app.callback(
    [Output("property-image-container", "children"),
     Output("shap-waterfall", "figure")],
    [Input("shap-condition-selector", "value")]
)
def update_shap_tab(condition):
    # Get the SHAP data for the selected condition
    shap_data = SAMPLE_SHAP_VALUES.get(condition, SAMPLE_SHAP_VALUES["average"])
    
    # Path to the image
    image_path = shap_data["image_path"]
    
    # Use a placeholder image if the specified image doesn't exist
    if not os.path.exists(image_path):
        # Create a placeholder image
        placeholder = Image.new('RGB', (400, 300), color=(240, 240, 240))
        buffer = BytesIO()
        placeholder.save(buffer, format="PNG")
        buffer.seek(0)
        img_str = base64.b64encode(buffer.getvalue()).decode()
        
        image_component = html.Img(
            src=f"data:image/png;base64,{img_str}",
            className="property-image"
        )
    else:
        # Load the existing image
        with open(image_path, "rb") as img_file:
            img_str = base64.b64encode(img_file.read()).decode()
        
        image_component = html.Img(
            src=f"data:image/png;base64,{img_str}",
            className="property-image"
        )
    
    # Create the waterfall chart
    features = shap_data["features"]
    values = shap_data["values"]
    
    # Sort by absolute value for better visualization
    sorted_indices = np.argsort(np.abs(values))[::-1]
    sorted_features = [features[i] for i in sorted_indices]
    sorted_values = [values[i] for i in sorted_indices]
    
    # Create a base value based on the condition
    condition_base_values = {
        "excellent": 4.5,
        "good": 3.5,
        "average": 2.5,
        "fair": 1.5,
        "poor": 1.0
    }
    base_value = condition_base_values.get(condition, 2.5)
    
    # Create waterfall chart
    cumulative = base_value
    shap_fig = go.Figure()
    
    # Add base value
    shap_fig.add_trace(
        go.Bar(
            x=["Base Score"],
            y=[base_value],
            text=[f"{base_value:.1f}"],
            textposition="auto",
            marker=dict(color="#cccccc"),
            name="Base Score"
        )
    )
    
    # Add features
    for feature, value in zip(sorted_features, sorted_values):
        cumulative += value
        
        # Determine color based on value
        color = "#ff6666" if value > 0 else "#66a3ff"
        
        shap_fig.add_trace(
            go.Bar(
                x=[feature],
                y=[value],
                text=[f"{value:.2f}"],
                textposition="auto",
                marker=dict(color=color),
                name=feature
            )
        )
    
    # Add final prediction
    shap_fig.add_trace(
        go.Bar(
            x=["Final Score"],
            y=[cumulative],
            text=[f"{cumulative:.1f}"],
            textposition="auto",
            marker=dict(color="#66cc66"),
            name="Final Score"
        )
    )
    
    # Update layout
    shap_fig.update_layout(
        title=f"Feature Contributions to {condition.capitalize()} Condition Score",
        showlegend=False,
        height=500,
        margin=dict(l=10, r=10, t=50, b=50),
        yaxis=dict(
            title="Contribution to Score",
            zeroline=True,
            zerolinewidth=2,
            zerolinecolor="gray"
        )
    )
    
    return [image_component], shap_fig

# Callback for audit log tab
@app.callback(
    [Output("audit-table", "data"),
     Output("audit-metrics-over-time", "figure")],
    [Input("audit-model-version", "value"),
     Input("audit-score-range", "value"),
     Input("audit-fallback-only", "value")]
)
def update_audit_tab(model_version, score_range, fallback_only):
    # Start with all data
    filtered_data = data["audit"]
    
    # Filter by model version if not "all"
    if model_version != "all":
        filtered_data = filtered_data[filtered_data["model_version"] == model_version]
    
    # Filter by score range
    filtered_data = filtered_data[
        (filtered_data["score"] >= score_range[0]) & 
        (filtered_data["score"] <= score_range[1])
    ]
    
    # Filter by fallback if requested
    if fallback_only and "fallback" in fallback_only:
        filtered_data = filtered_data[filtered_data["fallback_used"] == True]
    
    # Sort by timestamp (newest first) and convert to dict for table
    table_data = filtered_data.sort_values("timestamp", ascending=False).head(100).to_dict("records")
    
    # Create metrics over time chart
    # Group by day and calculate metrics
    metrics_data = filtered_data.resample('D', on='timestamp').agg({
        'score': 'mean',
        'execution_time_ms': 'mean',
        'fallback_used': 'mean'
    }).reset_index()
    
    # Convert fallback rate to percentage
    metrics_data['fallback_rate'] = metrics_data['fallback_used'] * 100
    
    # Create subplot with two y-axes
    metrics_fig = make_subplots(specs=[[{"secondary_y": True}]])
    
    # Add score line
    metrics_fig.add_trace(
        go.Scatter(
            x=metrics_data['timestamp'],
            y=metrics_data['score'],
            name="Avg Score",
            line=dict(color="#3366cc", width=3)
        ),
        secondary_y=False
    )
    
    # Add fallback rate line
    metrics_fig.add_trace(
        go.Scatter(
            x=metrics_data['timestamp'],
            y=metrics_data['fallback_rate'],
            name="Fallback Rate (%)",
            line=dict(color="#ff6666", width=3, dash='dot')
        ),
        secondary_y=True
    )
    
    # Add execution time line
    metrics_fig.add_trace(
        go.Scatter(
            x=metrics_data['timestamp'],
            y=metrics_data['execution_time_ms'],
            name="Avg Execution Time (ms)",
            line=dict(color="#66cc66", width=2)
        ),
        secondary_y=True
    )
    
    # Update layout
    metrics_fig.update_layout(
        title="Model Metrics Over Time",
        xaxis_title="Date",
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="center", x=0.5)
    )
    
    # Update y-axes
    metrics_fig.update_yaxes(title_text="Average Score", secondary_y=False, range=[1, 5])
    metrics_fig.update_yaxes(title_text="Fallback Rate (%) / Execution Time (ms)", secondary_y=True)
    
    return table_data, metrics_fig

# Define CSS for styling
app.index_string = '''
<!DOCTYPE html>
<html>
    <head>
        {%metas%}
        <title>{%title%}</title>
        {%favicon%}
        {%css%}
        <style>
            :root {
                --primary-color: #2c3e50;
                --secondary-color: #3498db;
                --accent-color: #e74c3c;
                --background-color: #f8f9fa;
                --card-background: #ffffff;
                --text-color: #333333;
                --light-text: #7b8a8b;
                --border-color: #dee2e6;
                --success-color: #27ae60;
                --warning-color: #f39c12;
                --error-color: #e74c3c;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                background-color: var(--background-color);
                color: var(--text-color);
                line-height: 1.6;
            }
            
            .app-container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 20px;
            }
            
            .header-container {
                background-color: var(--primary-color);
                color: white;
                padding: 20px;
                border-radius: 8px 8px 0 0;
                margin-bottom: 0;
            }
            
            .header-container h1 {
                margin: 0;
                font-weight: 500;
                font-size: 28px;
            }
            
            .header-container p {
                margin: 5px 0 0 0;
                opacity: 0.8;
            }
            
            .tab-content {
                padding: 20px;
                background-color: var(--card-background);
                border-radius: 0 0 8px 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
                margin-bottom: 20px;
            }
            
            .tabs-container .tab {
                padding: 12px 20px;
            }
            
            h2 {
                margin-top: 0;
                color: var(--primary-color);
                border-bottom: 2px solid var(--border-color);
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            
            h3 {
                color: var(--primary-color);
                margin-top: 0;
                margin-bottom: 15px;
                font-weight: 500;
            }
            
            .stats-container {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .stat-card {
                background-color: var(--card-background);
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                flex: 1;
                min-width: 200px;
                text-align: center;
                border: 1px solid var(--border-color);
            }
            
            .stat-card.full-width {
                flex-basis: 100%;
            }
            
            .stat-card h3 {
                margin: 0 0 10px 0;
                font-size: 16px;
                color: var(--light-text);
            }
            
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                margin: 0;
                color: var(--primary-color);
            }
            
            .stat-value.warning {
                color: var(--warning-color);
            }
            
            .stat-value.critical {
                color: var(--error-color);
            }
            
            .stat-value.neutral {
                color: var(--success-color);
            }
            
            .row-container {
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .graph-container {
                background-color: var(--card-background);
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                flex: 1;
                min-width: 300px;
                margin-bottom: 20px;
                border: 1px solid var(--border-color);
            }
            
            .table-container {
                background-color: var(--card-background);
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                margin-bottom: 20px;
                overflow-x: auto;
                border: 1px solid var(--border-color);
            }
            
            .control-container {
                background-color: var(--card-background);
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                margin-bottom: 20px;
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
                align-items: center;
                border: 1px solid var(--border-color);
            }
            
            .control-container > div {
                flex: 1;
                min-width: 200px;
            }
            
            .dropdown {
                width: 100%;
                margin-bottom: 10px;
            }
            
            .column-half {
                flex-basis: calc(50% - 10px);
                min-width: 300px;
            }
            
            .column-third {
                flex-basis: calc(33.333% - 15px);
                min-width: 250px;
            }
            
            .image-container {
                background-color: var(--card-background);
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                text-align: center;
                border: 1px solid var(--border-color);
                margin-bottom: 20px;
            }
            
            .property-image {
                max-width: 100%;
                max-height: 400px;
                border-radius: 4px;
            }
            
            .explanation-container {
                background-color: var(--card-background);
                border-radius: 8px;
                padding: 15px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                margin-bottom: 20px;
                border: 1px solid var(--border-color);
                line-height: 1.5;
            }
            
            .no-data-message {
                padding: 30px;
                text-align: center;
                color: var(--light-text);
                font-style: italic;
            }
            
            .footer-container {
                text-align: center;
                padding: 20px;
                border-top: 1px solid var(--border-color);
                color: var(--light-text);
                font-size: 14px;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .row-container {
                    flex-direction: column;
                }
                
                .column-half, .column-third {
                    flex-basis: 100%;
                }
                
                .stats-container {
                    flex-direction: column;
                }
                
                .stat-card {
                    min-width: calc(100% - 30px);
                }
            }
        </style>
    </head>
    <body>
        {%app_entry%}
        <footer>
            {%config%}
            {%scripts%}
            {%renderer%}
        </footer>
    </body>
</html>
'''

if __name__ == "__main__":
    # Ensure the data directories exist
    os.makedirs(UPLOADS_PATH, exist_ok=True)
    os.makedirs(SAMPLE_IMAGES_PATH, exist_ok=True)
    
    # Run the app
    app.run_server(debug=True, host='0.0.0.0', port=8050)