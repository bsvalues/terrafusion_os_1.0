"""
🏛️ TerraFusion County Mass Appraiser Market Intelligence Suite
Government. Transcended. - Advanced Analytics for Property Assessment Excellence

Features:
- Interactive Market Driver Analysis with AI Explanations
- Comparable Property Selection with Detailed Reasoning
- Market Trend Analysis with Statistical Significance
- Assessment Equity Analysis Tools
- Appeal Risk Assessment with Mitigation Strategies
- Portfolio Performance Analytics

Every AI insight is explainable, every data source is documented.
The appraiser retains full professional authority over all decisions.
"""

import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from datetime import datetime, timedelta
import json
from typing import Dict, List, Any
import requests

# Set page configuration
st.set_page_config(
    page_title="TerraFusion Mass Appraiser Intelligence Suite",
    page_icon="🏛️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for TerraFusion branding
st.markdown("""
<style>
    .main-header {
        background: linear-gradient(135deg, #0099ff 0%, #00ffee 50%, #00ffaa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.5rem;
        font-weight: 700;
        text-align: center;
        margin-bottom: 20px;
    }

    .tagline {
        text-align: center;
        color: #00ffee;
        font-size: 1.3rem;
        font-weight: 600;
        margin-bottom: 30px;
    }

    .metric-container {
        background: rgba(0, 255, 238, 0.1);
        border: 2px solid rgba(0, 255, 238, 0.3);
        border-radius: 15px;
        padding: 20px;
        margin: 10px 0;
    }

    .ai-insight {
        background: rgba(0, 255, 170, 0.1);
        border-left: 4px solid #00ffaa;
        padding: 15px;
        margin: 15px 0;
        border-radius: 0 10px 10px 0;
    }

    .data-source {
        background: rgba(0, 99, 255, 0.1);
        border: 1px solid rgba(0, 99, 255, 0.3);
        border-radius: 8px;
        padding: 8px 12px;
        margin: 5px;
        display: inline-block;
        font-size: 0.85rem;
    }

    .confidence-high { color: #00ffaa; font-weight: bold; }
    .confidence-medium { color: #ffee00; font-weight: bold; }
    .confidence-low { color: #ff6b6b; font-weight: bold; }
</style>
""", unsafe_allow_html=True)

def main():
    # Header
    st.markdown('<div class="main-header">TerraFusion Mass Appraiser Intelligence Suite</div>', unsafe_allow_html=True)
    st.markdown('<div class="tagline">Government. Transcended. - AI Analytics That Empower Professional Judgment</div>', unsafe_allow_html=True)

    # Sidebar for property selection and analysis options
    with st.sidebar:
        st.header("🎯 Analysis Configuration")

        # Property selection
        st.subheader("Property Selection")
        property_id = st.text_input("Property ID", value="R000567890", help="Enter the property ID for analysis")
        analysis_radius = st.slider("Market Analysis Radius (miles)", 0.5, 5.0, 2.0, 0.1)

        # Analysis options
        st.subheader("Analysis Options")
        include_market_drivers = st.checkbox("Market Driver Analysis", value=True)
        include_comparables = st.checkbox("Comparable Analysis", value=True)
        include_trends = st.checkbox("Market Trend Analysis", value=True)
        include_risk = st.checkbox("Risk Assessment", value=True)

        # AI transparency settings
        st.subheader("AI Transparency Settings")
        show_confidence = st.checkbox("Show AI Confidence Levels", value=True)
        show_data_sources = st.checkbox("Show Data Sources", value=True)
        show_reasoning = st.checkbox("Show AI Reasoning", value=True)

        # Run analysis button
        run_analysis = st.button("🚀 Run Comprehensive Analysis", type="primary")

    # Main content area
    if run_analysis:
        st.success(f"🎯 Running comprehensive analysis for Property {property_id}")

        # Create tabs for different analysis types
        tab1, tab2, tab3, tab4 = st.tabs(["🔍 Market Drivers", "🏠 Comparables", "📈 Market Trends", "⚖️ Risk Assessment"])

        with tab1:
            if include_market_drivers:
                display_market_driver_analysis(property_id, analysis_radius, show_confidence, show_data_sources, show_reasoning)

        with tab2:
            if include_comparables:
                display_comparable_analysis(property_id, analysis_radius, show_confidence, show_reasoning)

        with tab3:
            if include_trends:
                display_market_trend_analysis(property_id, show_confidence, show_data_sources)

        with tab4:
            if include_risk:
                display_risk_assessment(property_id, show_confidence, show_reasoning)

    else:
        # Welcome screen with capability overview
        display_welcome_screen()

def display_welcome_screen():
    """Display the welcome screen with capability overview"""
    st.markdown("## 🎯 Analytical Capabilities Overview")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("### 🔍 Market Driver Analysis")
        st.markdown("""
        - **AI-Powered Factor Identification**: Automatically identify key market drivers
        - **Impact Quantification**: Measure each driver's impact on property values
        - **Evidence Documentation**: Supporting data and statistical validation
        - **Confidence Scoring**: AI confidence levels for each insight
        """)

        st.markdown("### 🏠 Explainable Comparable Selection")
        st.markdown("""
        - **Intelligent Property Matching**: AI finds most relevant comparables
        - **Detailed Reasoning**: See exactly why each property was selected
        - **Adjustment Calculations**: Transparent value adjustment methodology
        - **Quality Scoring**: Data quality assessment for each comparable
        """)

    with col2:
        st.markdown("### 📈 Market Trend Analysis")
        st.markdown("""
        - **Statistical Trend Detection**: Identify significant market movements
        - **Time Series Analysis**: Historical patterns and future projections
        - **Data Source Documentation**: Complete transparency on data origins
        - **Significance Testing**: Statistical validity of trend observations
        """)

        st.markdown("### ⚖️ Risk Assessment & Equity Analysis")
        st.markdown("""
        - **Appeal Risk Scoring**: Predict likelihood of successful appeals
        - **Assessment Equity Analysis**: Identify potential inequities
        - **Portfolio Performance**: Analyze assessment accuracy across jurisdiction
        - **Mitigation Strategies**: AI-recommended improvement actions
        """)

    # Empowerment principles
    st.markdown("---")
    st.markdown("## 🏛️ Appraiser Empowerment Principles")

    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.markdown('<div class="metric-container">', unsafe_allow_html=True)
        st.markdown("### 🧠 AI Transparency")
        st.markdown("Every AI decision is explained with supporting evidence and confidence levels")
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="metric-container">', unsafe_allow_html=True)
        st.markdown("### 🎯 Professional Authority")
        st.markdown("Appraiser retains full decision-making authority and professional judgment")
        st.markdown('</div>', unsafe_allow_html=True)

    with col3:
        st.markdown('<div class="metric-container">', unsafe_allow_html=True)
        st.markdown("### 📚 Data Sources")
        st.markdown("Complete documentation of all data sources and methodologies used")
        st.markdown('</div>', unsafe_allow_html=True)

    with col4:
        st.markdown('<div class="metric-container">', unsafe_allow_html=True)
        st.markdown("### ⚡ Enhanced Capabilities")
        st.markdown("AI amplifies professional expertise without replacing human judgment")
        st.markdown('</div>', unsafe_allow_html=True)

def display_market_driver_analysis(property_id, radius, show_confidence, show_data_sources, show_reasoning):
    """Display comprehensive market driver analysis"""
    st.header("🔍 Market Driver Analysis")
    st.markdown(f"**Property:** {property_id} | **Analysis Radius:** {radius} miles")

    # Simulate market driver data
    drivers_data = {
        "School District Quality": {
            "impact": 35, "confidence": 92, "trend": "positive",
            "explanation": "Richland School District rates 9/10, creating 15-20% premium for family properties.",
            "evidence": [
                "Properties near Hanford High School average $47/sq ft vs $41/sq ft district-wide",
                "Parent surveys show school district is #1 factor in home selection (68% of buyers)",
                "12-month trend analysis shows 23% higher appreciation near top schools"
            ],
            "sources": ["WA State OSPI ratings", "GreatSchools.org API", "Recent sales analysis"]
        },
        "Employment Base Stability": {
            "impact": 28, "confidence": 88, "trend": "positive",
            "explanation": "Hanford Site and PNNL provide stable, high-wage employment creating recession-resistant demand.",
            "evidence": [
                "50,000+ direct/indirect jobs from federal facilities",
                "Average household income $89,400 vs WA state $78,200",
                "Employment grew 3.2% annually over past 5 years vs state average 2.1%"
            ],
            "sources": ["Bureau of Labor Statistics", "Hanford employment data", "PNNL workforce reports"]
        },
        "Infrastructure Development": {
            "impact": 22, "confidence": 81, "trend": "positive",
            "explanation": "SR-240 expansion and Columbia River crossing improvements increasing accessibility.",
            "evidence": [
                "Properties within 2 miles of improved highway access show 12% premium",
                "$2.3B in planned infrastructure improvements through 2028",
                "Commute time reductions of 15-20 minutes improve property desirability"
            ],
            "sources": ["WSDOT project data", "City planning documents", "Traffic pattern analysis"]
        },
        "Housing Supply Constraints": {
            "impact": 15, "confidence": 94, "trend": "neutral",
            "explanation": "Limited developable land due to geographic constraints creates supply limitations.",
            "evidence": [
                "Only 2,400 acres zoned for new residential development",
                "New construction permits down 18% due to land scarcity",
                "Geographic constraints limit expansion to north/south corridors only"
            ],
            "sources": ["County planning data", "Environmental constraints mapping", "Development permit tracking"]
        }
    }

    # Display drivers in columns
    for i, (driver_name, data) in enumerate(drivers_data.items()):
        if i % 2 == 0:
            col1, col2 = st.columns(2)

        with col1 if i % 2 == 0 else col2:
            with st.expander(f"**{driver_name}** - {data['impact']}% Market Impact", expanded=True):

                # Impact visualization
                fig = go.Figure(go.Indicator(
                    mode = "gauge+number",
                    value = data['impact'],
                    domain = {'x': [0, 1], 'y': [0, 1]},
                    title = {'text': "Market Impact %"},
                    gauge = {
                        'axis': {'range': [None, 50]},
                        'bar': {'color': "lightgreen"},
                        'steps': [
                            {'range': [0, 15], 'color': "lightgray"},
                            {'range': [15, 30], 'color': "yellow"},
                            {'range': [30, 50], 'color': "green"}
                        ],
                        'threshold': {
                            'line': {'color': "red", 'width': 4},
                            'thickness': 0.75,
                            'value': 40
                        }
                    }
                ))
                fig.update_layout(height=250)
                st.plotly_chart(fig, use_container_width=True)

                if show_reasoning:
                    st.markdown('<div class="ai-insight">', unsafe_allow_html=True)
                    st.markdown(f"**🤖 AI Analysis:** {data['explanation']}")
                    st.markdown('</div>', unsafe_allow_html=True)

                if show_confidence:
                    confidence_class = "confidence-high" if data['confidence'] >= 85 else "confidence-medium" if data['confidence'] >= 70 else "confidence-low"
                    st.markdown(f"**AI Confidence:** <span class='{confidence_class}'>{data['confidence']}%</span>", unsafe_allow_html=True)

                # Supporting evidence
                st.markdown("**📊 Supporting Evidence:**")
                for evidence in data['evidence']:
                    st.markdown(f"• {evidence}")

                if show_data_sources:
                    st.markdown("**📚 Data Sources:**")
                    for source in data['sources']:
                        st.markdown(f'<span class="data-source">{source}</span>', unsafe_allow_html=True)

def display_comparable_analysis(property_id, radius, show_confidence, show_reasoning):
    """Display explainable comparable property analysis"""
    st.header("🏠 Explainable Comparable Analysis")
    st.markdown(f"**Property:** {property_id} | **Search Radius:** {radius} miles")

    # Simulate comparable properties data
    comparables = [
        {
            "id": "R000123456",
            "address": "1425 Jadwin Ave, Richland, WA",
            "sale_price": 445000,
            "sale_date": "2024-10-15",
            "similarity": 96,
            "data_quality": 98,
            "reasoning": "Selected as PRIMARY comparable due to: (1) Identical neighborhood (Jadwin/Stevens), (2) Similar square footage (2,240 vs 2,180 sq ft = 2.7% difference), (3) Same year built (1978), (4) Similar lot size (0.31 vs 0.28 acres), (5) Recent sale date (45 days ago ensures current market conditions)",
            "adjustments": {
                "Size Adjustment": 3200,
                "Condition Adjustment": -2500,
                "Garage Adjustment": 0,
                "Final Adjusted Value": 445700
            }
        },
        {
            "id": "R000134567",
            "address": "732 Thayer Dr, Richland, WA",
            "sale_price": 438000,
            "sale_date": "2024-09-28",
            "similarity": 93,
            "data_quality": 95,
            "reasoning": "Selected as SUPPORTING comparable: (1) Same subdivision (Horn Rapids area), (2) Comparable size (2,156 sq ft vs 2,180 = 1.1% difference), (3) Similar age (1979 vs 1978), (4) Same school district boundary. AI confidence: 93% match on key value drivers.",
            "adjustments": {
                "Size Adjustment": 1200,
                "Condition Adjustment": 0,
                "Garage Adjustment": 3500,
                "Final Adjusted Value": 442700
            }
        },
        {
            "id": "R000145678",
            "address": "2847 Belmont Blvd, Richland, WA",
            "sale_price": 429000,
            "sale_date": "2024-11-02",
            "similarity": 89,
            "data_quality": 91,
            "reasoning": "Selected as MARKET RANGE comparable: (1) Different but comparable neighborhood (Belmont vs Stevens), (2) Similar characteristics (2,095 sq ft, 1976 build), (3) Very recent sale (4 days ago) provides current market pulse. Lower similarity due to neighborhood differences, but valuable for market timing validation.",
            "adjustments": {
                "Size Adjustment": 4250,
                "Condition Adjustment": 1800,
                "Location Adjustment": 5500,
                "Final Adjusted Value": 440550
            }
        }
    ]

    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Comparables Found", len(comparables))
    with col2:
        avg_similarity = np.mean([comp['similarity'] for comp in comparables])
        st.metric("Avg Similarity", f"{avg_similarity:.1f}%")
    with col3:
        avg_quality = np.mean([comp['data_quality'] for comp in comparables])
        st.metric("Avg Data Quality", f"{avg_quality:.1f}%")
    with col4:
        price_range = max([comp['sale_price'] for comp in comparables]) - min([comp['sale_price'] for comp in comparables])
        st.metric("Price Range", f"${price_range:,}")

    # Display each comparable
    for i, comp in enumerate(comparables):
        with st.expander(f"**Comparable {i+1}:** {comp['address']} - {comp['similarity']}% Similar", expanded=True):

            col1, col2 = st.columns([2, 1])

            with col1:
                # Comparable details
                st.markdown(f"**Sale Price:** ${comp['sale_price']:,}")
                st.markdown(f"**Sale Date:** {comp['sale_date']}")
                st.markdown(f"**Property ID:** {comp['id']}")

                if show_confidence:
                    st.markdown(f"**Similarity Score:** {comp['similarity']}%")
                    st.markdown(f"**Data Quality:** {comp['data_quality']}%")

                if show_reasoning:
                    st.markdown('<div class="ai-insight">', unsafe_allow_html=True)
                    st.markdown(f"**🤖 AI Selection Reasoning:** {comp['reasoning']}")
                    st.markdown('</div>', unsafe_allow_html=True)

            with col2:
                # Adjustment visualization
                adjustments_df = pd.DataFrame({
                    'Adjustment': list(comp['adjustments'].keys()),
                    'Value': list(comp['adjustments'].values())
                })

                fig = px.bar(
                    adjustments_df[:-1],  # Exclude final value
                    x='Adjustment',
                    y='Value',
                    title="Value Adjustments",
                    color='Value',
                    color_continuous_scale=['red', 'white', 'green']
                )
                fig.update_layout(height=250, showlegend=False)
                st.plotly_chart(fig, use_container_width=True)

            # Adjustments breakdown
            st.markdown("**⚖️ Value Adjustments:**")
            for adj_name, adj_value in comp['adjustments'].items():
                if adj_name == "Final Adjusted Value":
                    st.markdown(f"**{adj_name}:** ${adj_value:,}")
                else:
                    sign = "+" if adj_value >= 0 else ""
                    st.markdown(f"• {adj_name}: {sign}${adj_value:,}")

def display_market_trend_analysis(property_id, show_confidence, show_data_sources):
    """Display market trend analysis"""
    st.header("📈 Market Trend Analysis")
    st.markdown(f"**Property:** {property_id}")

    # Simulate trend data
    dates = pd.date_range(start='2023-01-01', end='2024-11-01', freq='M')

    # Property value trend
    base_value = 400000
    trend_data = []
    for i, date in enumerate(dates):
        # Simulate appreciation with seasonal variation
        appreciation = 1 + (0.087 * (i / 12))  # 8.7% annual appreciation
        seasonal = 1 + 0.02 * np.sin(2 * np.pi * i / 12)  # Seasonal variation
        noise = 1 + np.random.normal(0, 0.01)  # Market noise
        value = base_value * appreciation * seasonal * noise
        trend_data.append({"Date": date, "Median_Price": value})

    trend_df = pd.DataFrame(trend_data)

    # Create trend visualization
    fig = make_subplots(
        rows=2, cols=2,
        subplot_titles=("Property Value Trend", "Days on Market", "Price per Sq Ft", "Market Velocity"),
        specs=[[{"secondary_y": False}, {"secondary_y": False}],
               [{"secondary_y": False}, {"secondary_y": False}]]
    )

    # Property value trend
    fig.add_trace(
        go.Scatter(x=trend_df['Date'], y=trend_df['Median_Price'],
                  name='Median Price', line=dict(color='#00ffee')),
        row=1, col=1
    )

    # Days on Market trend (decreasing)
    dom_data = 60 - (np.arange(len(dates)) * 0.8) + np.random.normal(0, 2, len(dates))
    fig.add_trace(
        go.Scatter(x=dates, y=dom_data,
                  name='Days on Market', line=dict(color='#ff6b6b')),
        row=1, col=2
    )

    # Price per sq ft trend
    psf_data = 150 + (np.arange(len(dates)) * 1.2) + np.random.normal(0, 1, len(dates))
    fig.add_trace(
        go.Scatter(x=dates, y=psf_data,
                  name='Price/Sq Ft', line=dict(color='#00ffaa')),
        row=2, col=1
    )

    # Market velocity (sales volume)
    velocity_data = 100 + 20 * np.sin(2 * np.pi * np.arange(len(dates)) / 12) + np.random.normal(0, 5, len(dates))
    fig.add_trace(
        go.Scatter(x=dates, y=velocity_data,
                  name='Sales Volume', line=dict(color='#ffee00')),
        row=2, col=2
    )

    fig.update_layout(height=600, showlegend=False)
    st.plotly_chart(fig, use_container_width=True)

    # Trend insights
    st.markdown("## 📊 AI Trend Insights")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown('<div class="ai-insight">', unsafe_allow_html=True)
        st.markdown("**🔥 Property Value Appreciation**")
        st.markdown("- **Trend:** Increasing at 8.7% annually")
        st.markdown("- **Statistical Significance:** 94%")
        st.markdown("- **Driver:** Employment growth and supply constraints")
        if show_confidence:
            st.markdown("- **AI Confidence:** 94%")
        st.markdown('</div>', unsafe_allow_html=True)

        if show_data_sources:
            st.markdown("**📚 Data Sources:**")
            sources = ["County Assessor sales data", "MLS transaction records", "FHFA House Price Index"]
            for source in sources:
                st.markdown(f'<span class="data-source">{source}</span>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="ai-insight">', unsafe_allow_html=True)
        st.markdown("**⚡ Market Velocity**")
        st.markdown("- **Trend:** Days on Market decreasing 23%")
        st.markdown("- **Statistical Significance:** 88%")
        st.markdown("- **Driver:** Strong buyer demand vs limited inventory")
        if show_confidence:
            st.markdown("- **AI Confidence:** 88%")
        st.markdown('</div>', unsafe_allow_html=True)

        if show_data_sources:
            st.markdown("**📚 Data Sources:**")
            sources = ["MLS market statistics", "Local realtor reports", "Transaction timing data"]
            for source in sources:
                st.markdown(f'<span class="data-source">{source}</span>', unsafe_allow_html=True)

def display_risk_assessment(property_id, show_confidence, show_reasoning):
    """Display risk assessment analysis"""
    st.header("⚖️ Risk Assessment & Equity Analysis")
    st.markdown(f"**Property:** {property_id}")

    # Risk assessment metrics
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        st.metric("Appeal Risk", "Low", delta="-15%")
    with col2:
        st.metric("Assessment Accuracy", "94.2%", delta="+2.1%")
    with col3:
        st.metric("Market Position", "Balanced", delta="Stable")
    with col4:
        st.metric("Equity Score", "87%", delta="+3%")

    # Risk factors analysis
    risk_factors = {
        "Market Volatility": {"level": "Low", "score": 25, "impact": "Minimal"},
        "Assessment Appeal History": {"level": "Low", "score": 18, "impact": "Favorable"},
        "Neighborhood Stability": {"level": "High", "score": 85, "impact": "Positive"},
        "Data Quality": {"level": "High", "score": 94, "impact": "Excellent"},
        "Market Comparability": {"level": "High", "score": 89, "impact": "Strong"}
    }

    # Risk visualization
    risk_df = pd.DataFrame({
        'Factor': list(risk_factors.keys()),
        'Score': [data['score'] for data in risk_factors.values()],
        'Level': [data['level'] for data in risk_factors.values()]
    })

    fig = px.bar(
        risk_df,
        x='Factor',
        y='Score',
        color='Level',
        title="Risk Factor Assessment",
        color_discrete_map={'Low': '#ff6b6b', 'High': '#00ffaa'}
    )
    fig.update_layout(height=400)
    st.plotly_chart(fig, use_container_width=True)

    # Risk mitigation recommendations
    st.markdown("## 💡 AI Risk Mitigation Recommendations")

    if show_reasoning:
        recommendations = [
            {
                "risk": "Potential Assessment Appeal",
                "probability": "15%",
                "mitigation": "Document comparable selection rationale thoroughly. Consider additional recent sales analysis.",
                "confidence": "High"
            },
            {
                "risk": "Market Condition Changes",
                "probability": "25%",
                "mitigation": "Monitor interest rate impacts and employment indicators. Update assessments quarterly.",
                "confidence": "Medium"
            },
            {
                "risk": "Data Quality Issues",
                "probability": "8%",
                "mitigation": "Verify building characteristics through inspection. Cross-reference multiple data sources.",
                "confidence": "High"
            }
        ]

        for rec in recommendations:
            with st.expander(f"**{rec['risk']}** - {rec['probability']} Probability"):
                st.markdown(f"**🎯 Mitigation Strategy:** {rec['mitigation']}")
                if show_confidence:
                    conf_class = "confidence-high" if rec['confidence'] == "High" else "confidence-medium"
                    st.markdown(f"**AI Confidence:** <span class='{conf_class}'>{rec['confidence']}</span>", unsafe_allow_html=True)

if __name__ == "__main__":
    main()
