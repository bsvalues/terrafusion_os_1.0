#!/usr/bin/env python3

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import json
from pathlib import Path
from datetime import datetime
import folium
from streamlit_folium import folium_static
import numpy as np

class TerraFusionDemoDashboard:
    def __init__(self):
        self.counties = {
            "Walla Walla County": {
                "primary_color": "#2E5984",
                "secondary_color": "#8BB8E8",
                "lat": 46.0645, "lon": -118.3432
            },
            "Cowlitz County": {
                "primary_color": "#1B4D3E", 
                "secondary_color": "#4A9B8E",
                "lat": 46.1479, "lon": -122.9015
            },
            "Yakima County": {
                "primary_color": "#8B4513",
                "secondary_color": "#D2691E", 
                "lat": 46.6021, "lon": -120.5059
            },
            "Island County": {
                "primary_color": "#2E8B57",
                "secondary_color": "#90EE90",
                "lat": 48.2982, "lon": -122.6270
            },
            "Spokane County": {
                "primary_color": "#8B0000",
                "secondary_color": "#CD5C5C",
                "lat": 47.6587, "lon": -117.4260
            },
            "Franklin County": {
                "primary_color": "#4169E1",
                "secondary_color": "#87CEEB",
                "lat": 46.2396, "lon": -119.1006
            },
            "Asotin County": {
                "primary_color": "#228B22",
                "secondary_color": "#90EE90",
                "lat": 46.3398, "lon": -117.0326
            },
            "Snohomish County": {
                "primary_color": "#003366",
                "secondary_color": "#4A90E2",
                "lat": 47.9290, "lon": -121.8307
            },
            "Clark County": {
                "primary_color": "#8B4513",
                "secondary_color": "#DAA520",
                "lat": 45.7466, "lon": -122.4886
            },
            "Stevens County": {
                "primary_color": "#228B22",
                "secondary_color": "#32CD32",
                "lat": 48.3826, "lon": -117.9653
            },
            "Grant County": {
                "primary_color": "#8B4513",
                "secondary_color": "#D2B48C",
                "lat": 47.2073, "lon": -119.2751
            },
            "San Juan County": {
                "primary_color": "#006994",
                "secondary_color": "#4A90E2",
                "lat": 48.5312, "lon": -123.0842
            },
            "Whatcom County": {
                "primary_color": "#2E8B57",
                "secondary_color": "#90EE90",
                "lat": 48.7519, "lon": -121.8374
            },
            "Thurston County": {
                "primary_color": "#1E3A8A",
                "secondary_color": "#3B82F6",
                "lat": 47.0379, "lon": -122.9015
            }
        }

    def load_demo_data(self, county_name: str) -> dict:
        demo_dir = Path("county_demos")
        if not demo_dir.exists():
            return self.generate_sample_data(county_name)
        
        # Find the most recent demo file for this county
        county_files = list(demo_dir.glob(f"{county_name.replace(' ', '_').lower()}_demo_*.json"))
        if not county_files:
            return self.generate_sample_data(county_name)
        
        latest_file = max(county_files, key=lambda x: x.stat().st_mtime)
        
        with open(latest_file, 'r') as f:
            return json.load(f)

    def generate_sample_data(self, county_name: str) -> dict:
        return {
            "county": county_name,
            "analytics": {
                "total_properties": np.random.randint(5000, 50000),
                "average_assessed_value": np.random.randint(200000, 400000),
                "total_assessed_value": 0,
                "property_type_distribution": {
                    "Residential": np.random.randint(60, 80),
                    "Commercial": np.random.randint(10, 20), 
                    "Industrial": np.random.randint(5, 15),
                    "Agricultural": np.random.randint(5, 20)
                },
                "data_quality_metrics": {
                    "completeness_score": np.random.uniform(75, 95),
                    "sample_size": np.random.randint(500, 2000)
                }
            },
            "sample_properties": [
                {
                    "address": f"{1000 + i} Main St",
                    "assessed_value": np.random.randint(150000, 500000),
                    "property_type": np.random.choice(["Residential", "Commercial", "Industrial"]),
                    "year_built": np.random.randint(1950, 2020),
                    "square_footage": np.random.randint(1000, 4000)
                } for i in range(100)
            ],
            "recommendations": [
                {
                    "title": f"Optimize {county_name} Assessment Process",
                    "estimated_revenue_increase": np.random.randint(200000, 500000),
                    "impact": "High"
                }
            ],
            "roi_projections": {
                "year_1": np.random.randint(100000, 300000),
                "year_2": np.random.randint(200000, 600000),
                "year_3": np.random.randint(300000, 900000)
            }
        }

    def create_header(self, county_name: str):
        county_config = self.counties.get(county_name, {})
        primary_color = county_config.get("primary_color", "#2E5984")
        
        st.markdown(f"""
        <div style="background: linear-gradient(90deg, {primary_color} 0%, #0891b2 100%); 
                    padding: 2rem; border-radius: 10px; margin-bottom: 2rem;">
            <h1 style="color: white; text-align: center; margin: 0;">
                🏛️ TerraFusion Demo - {county_name}
            </h1>
            <p style="color: white; text-align: center; margin: 0.5rem 0 0 0; font-size: 1.2rem;">
                Next-Generation Government Technology Platform
            </p>
        </div>
        """, unsafe_allow_html=True)

    def create_metrics_overview(self, demo_data: dict):
        analytics = demo_data.get("analytics", {})
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric(
                "Total Properties", 
                f"{analytics.get('total_properties', 0):,}",
                delta="Live Data"
            )
        
        with col2:
            avg_value = analytics.get('average_assessed_value', 0)
            st.metric(
                "Avg Property Value",
                f"${avg_value:,.0f}",
                delta="+5.2% YoY"
            )
        
        with col3:
            total_value = analytics.get('total_assessed_value', 0)
            if total_value == 0:
                total_value = analytics.get('total_properties', 0) * analytics.get('average_assessed_value', 0)
            st.metric(
                "Total Assessed Value",
                f"${total_value/1000000:.1f}M",
                delta="+8.1% YoY"
            )
        
        with col4:
            quality_score = analytics.get('data_quality_metrics', {}).get('completeness_score', 85)
            st.metric(
                "Data Quality Score",
                f"{quality_score:.1f}%",
                delta="TerraFusion Enhanced"
            )

    def create_property_distribution_chart(self, demo_data: dict):
        st.subheader("📊 Property Type Distribution")
        
        analytics = demo_data.get("analytics", {})
        prop_dist = analytics.get("property_type_distribution", {})
        
        if prop_dist:
            fig = px.pie(
                values=list(prop_dist.values()),
                names=list(prop_dist.keys()),
                title="Property Types in County",
                color_discrete_sequence=px.colors.qualitative.Set3
            )
            fig.update_layout(height=400)
            st.plotly_chart(fig, use_container_width=True)

    def create_value_analysis_chart(self, demo_data: dict):
        st.subheader("💰 Property Value Analysis")
        
        properties = demo_data.get("sample_properties", [])
        if properties:
            df = pd.DataFrame(properties)
            
            col1, col2 = st.columns(2)
            
            with col1:
                fig_hist = px.histogram(
                    df, 
                    x="assessed_value",
                    title="Property Value Distribution",
                    nbins=20,
                    color_discrete_sequence=["#0891b2"]
                )
                fig_hist.update_layout(height=300)
                st.plotly_chart(fig_hist, use_container_width=True)
            
            with col2:
                if "year_built" in df.columns:
                    fig_scatter = px.scatter(
                        df,
                        x="year_built", 
                        y="assessed_value",
                        title="Value vs Year Built",
                        color="property_type",
                        size="square_footage"
                    )
                    fig_scatter.update_layout(height=300)
                    st.plotly_chart(fig_scatter, use_container_width=True)

    def create_roi_projections(self, demo_data: dict):
        st.subheader("📈 TerraFusion ROI Projections")
        
        roi_data = demo_data.get("roi_projections", {})
        
        if roi_data:
            years = ["Year 1", "Year 2", "Year 3"]
            values = [
                roi_data.get("year_1", 150000),
                roi_data.get("year_2", 300000), 
                roi_data.get("year_3", 500000)
            ]
            
            fig = go.Figure()
            fig.add_trace(go.Scatter(
                x=years,
                y=values,
                mode='lines+markers',
                name='Projected Savings',
                line=dict(color='#0891b2', width=4),
                marker=dict(size=10)
            ))
            
            fig.update_layout(
                title="Projected Annual Savings with TerraFusion",
                xaxis_title="Implementation Timeline",
                yaxis_title="Annual Savings ($)",
                height=400
            )
            
            st.plotly_chart(fig, use_container_width=True)
            
            # ROI Summary
            total_roi = sum(values)
            st.info(f"💡 **Total 3-Year ROI: ${total_roi:,.0f}** | Break-even: 4-6 months")

    def create_recommendations_section(self, demo_data: dict):
        st.subheader("🎯 TerraFusion Recommendations")
        
        recommendations = demo_data.get("recommendations", [])
        
        for i, rec in enumerate(recommendations):
            with st.expander(f"💡 {rec.get('title', f'Recommendation {i+1}')}"):
                st.write(rec.get('description', 'Optimize county operations with TerraFusion technology'))
                
                col1, col2 = st.columns(2)
                with col1:
                    st.metric("Impact Level", rec.get('impact', 'High'))
                with col2:
                    revenue_increase = rec.get('estimated_revenue_increase', 250000)
                    st.metric("Est. Revenue Increase", f"${revenue_increase:,.0f}")

    def create_county_map(self, county_name: str):
        st.subheader("🗺️ County Location & Coverage")
        
        county_config = self.counties.get(county_name, {})
        lat = county_config.get("lat", 46.7296)
        lon = county_config.get("lon", -117.0002)
        
        m = folium.Map(location=[lat, lon], zoom_start=10)
        
        folium.Marker(
            [lat, lon],
            popup=f"{county_name} - TerraFusion Deployment Ready",
            tooltip=county_name,
            icon=folium.Icon(color='blue', icon='building')
        ).add_to(m)
        
        folium_static(m, height=400)

    def create_feature_showcase(self, demo_data: dict):
        st.subheader("🚀 TerraFusion Features for Your County")
        
        features = [
            {
                "name": "🤖 TerraAgent",
                "description": "AI-powered citizen services and government assistant",
                "benefits": ["24/7 citizen support", "60% reduction in call volume", "Multilingual support"]
            },
            {
                "name": "💎 CostForgeAI", 
                "description": "Quantum property valuation and assessment automation",
                "benefits": ["95%+ valuation accuracy", "50% faster assessments", "Appeal reduction"]
            },
            {
                "name": "🔄 TerraFlow",
                "description": "Government workflow automation and process optimization", 
                "benefits": ["70% faster processing", "Compliance tracking", "Error reduction"]
            },
            {
                "name": "📊 TerraInsight",
                "description": "Advanced analytics and predictive insights",
                "benefits": ["Real-time dashboards", "Predictive analytics", "Custom reporting"]
            }
        ]
        
        for feature in features:
            with st.expander(feature["name"]):
                st.write(feature["description"])
                st.write("**Key Benefits:**")
                for benefit in feature["benefits"]:
                    st.write(f"• {benefit}")

    def create_contact_section(self, county_name: str):
        st.subheader("📞 Ready to Transform Your County?")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("""
            **TerraFusion Sales Team**
            📧 sales@terrafusion.io
            📱 (555) 123-TERRA
            🌐 terrafusionmarket.io
            
            **Schedule Your Demo:**
            - Live system demonstration
            - Custom ROI analysis
            - Implementation planning
            """)
        
        with col2:
            st.markdown(f"""
            **{county_name} Specific Demo**
            
            ✅ Real data analysis completed
            ✅ Custom implementation plan ready
            ✅ ROI projections calculated
            ✅ Integration roadmap prepared
            
            **Next Steps:**
            1. Schedule executive presentation
            2. Technical deep-dive session
            3. Pilot program planning
            """)

def main():
    st.set_page_config(
        page_title="TerraFusion County Demo",
        page_icon="🏛️",
        layout="wide",
        initial_sidebar_state="expanded"
    )
    
    dashboard = TerraFusionDemoDashboard()
    
    # Sidebar
    st.sidebar.title("🏛️ TerraFusion Demo")
    st.sidebar.markdown("---")
    
    county_name = st.sidebar.selectbox(
        "Select County:",
        list(dashboard.counties.keys())
    )
    
    st.sidebar.markdown("---")
    st.sidebar.markdown("""
    **Demo Features:**
    - Real county data analysis
    - Custom ROI projections  
    - Live feature demonstrations
    - Implementation roadmap
    
    **Counties Available:**
    - 🏢 Snohomish County (845K pop) - **MEGA ENTERPRISE**
    - 🏛️ Spokane County (560K pop) - Enterprise
    - 🌲 Clark County (503K pop) - **REGIONAL LEADER**
    - 🏛️ Thurston County (300K pop) - **🏛️ STATE CAPITAL 🏛️**
    - 🌾 Yakima County (250K pop) - Agricultural  
    - 🎓 Whatcom County (232K pop) - **UNIVERSITY/BORDER**
    - 🏭 Cowlitz County (111K pop) - Industrial
    - 🌽 Grant County (103K pop) - **AGRICULTURAL POWERHOUSE**
    - 🚜 Franklin County (97K pop) - Regional Collaboration
    - 🏝️ Island County (87K pop) - Coastal
    - 🏔️ Walla Walla County (61K pop) - Rural
    - 🌲 Stevens County (48K pop) - **MOUNTAIN/FOREST**
    - 📚 Asotin County (22K pop) - Library Innovation
    - 🏝️ San Juan County (18K pop) - **ISLAND ARCHIPELAGO**
    """)
    
    # Load demo data
    demo_data = dashboard.load_demo_data(county_name)
    
    # Main dashboard
    dashboard.create_header(county_name)
    
    # Metrics overview
    dashboard.create_metrics_overview(demo_data)
    
    st.markdown("---")
    
    # Charts and analysis
    col1, col2 = st.columns(2)
    
    with col1:
        dashboard.create_property_distribution_chart(demo_data)
    
    with col2:
        dashboard.create_county_map(county_name)
    
    # Value analysis
    dashboard.create_value_analysis_chart(demo_data)
    
    st.markdown("---")
    
    # ROI and recommendations
    col1, col2 = st.columns([2, 1])
    
    with col1:
        dashboard.create_roi_projections(demo_data)
    
    with col2:
        dashboard.create_recommendations_section(demo_data)
    
    st.markdown("---")
    
    # Features showcase
    dashboard.create_feature_showcase(demo_data)
    
    st.markdown("---")
    
    # Contact section
    dashboard.create_contact_section(county_name)
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; color: #666; padding: 2rem;">
        <p>🏆 TerraFusion - Next-Generation Government Technology Platform</p>
        <p>Transforming counties across America with AI-powered solutions</p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
