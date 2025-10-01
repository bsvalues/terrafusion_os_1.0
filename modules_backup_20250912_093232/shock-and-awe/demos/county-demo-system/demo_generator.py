#!/usr/bin/env python3

import asyncio
import aiohttp
import json
import os
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import uuid
import time
from pathlib import Path

@dataclass
class CountyConfig:
    name: str
    state: str
    population: int
    data_sources: List[Dict[str, Any]]
    demo_customizations: Dict[str, Any]

class TerraFusionDemoGenerator:
    def __init__(self):
        self.counties = [
            CountyConfig(
                name="Walla Walla County",
                state="Washington",
                population=60760,
                data_sources=[{
                    "type": "arcgis_feature_server",
                    "url": "https://services8.arcgis.com/COL6rRPkF9w28VGX/arcgis/rest/services/Tax_Parcels/FeatureServer/0",
                    "name": "Tax Parcels",
                    "rate_limit": 0.1
                }],
                demo_customizations={
                    "primary_color": "#2E5984",
                    "secondary_color": "#8BB8E8",
                    "logo_url": None,
                    "contact_info": {
                        "department": "Walla Walla County Assessor",
                        "phone": "(509) 524-2530",
                        "email": "assessor@co.walla-walla.wa.us",
                        "website": "https://www.co.walla-walla.wa.us"
                    },
                    "key_features": [
                        "Property Tax Optimization",
                        "Assessment Appeals Management", 
                        "Market Value Analysis",
                        "Revenue Forecasting"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "Property Value Analysis",
                            "description": "Analyze property values across different districts",
                            "expected_outcome": "Identify undervalued properties and tax optimization opportunities"
                        },
                        {
                            "name": "Assessment Appeals Processing",
                            "description": "Streamline property assessment appeals workflow",
                            "expected_outcome": "Reduce appeals processing time by 60%"
                        }
                    ]
                }
            ),
            CountyConfig(
                name="Cowlitz County",
                state="Washington", 
                population=110730,
                data_sources=[{
                    "type": "arcgis_map_server",
                    "url": "https://cowlitzgis.net/ccserver/rest/services/Cadastral/Parcels/MapServer",
                    "name": "Cadastral Parcels",
                    "rate_limit": 0.15
                }],
                demo_customizations={
                    "primary_color": "#1B4D3E",
                    "secondary_color": "#4A9B8E",
                    "logo_url": None,
                    "contact_info": {
                        "department": "Cowlitz County GIS Department",
                        "phone": "(360) 577-3030", 
                        "email": "gis@co.cowlitz.wa.us",
                        "website": "https://www.co.cowlitz.wa.us"
                    },
                    "key_features": [
                        "Land Use Planning",
                        "Zoning Compliance",
                        "Development Tracking",
                        "Environmental Impact Assessment"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "Land Use Optimization",
                            "description": "Optimize land use planning and zoning decisions",
                            "expected_outcome": "Improve development planning efficiency by 40%"
                        }
                    ]
                }
            ),
            CountyConfig(
                name="Yakima County",
                state="Washington",
                population=249670,
                data_sources=[{
                    "type": "open_data_hub",
                    "url": "https://gis-yakimacounty.opendata.arcgis.com/api/v1/datasets",
                    "name": "Open Data Hub",
                    "rate_limit": 0.2
                }],
                demo_customizations={
                    "primary_color": "#8B4513",
                    "secondary_color": "#D2691E",
                    "logo_url": None,
                    "contact_info": {
                        "department": "Yakima County Information Services",
                        "phone": "(509) 574-1500",
                        "email": "gis@co.yakima.wa.us", 
                        "website": "https://www.yakimacounty.us"
                    },
                    "key_features": [
                        "Agricultural Land Assessment",
                        "Water Rights Management",
                        "Crop Yield Analysis",
                        "Rural Property Valuation"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "Agricultural Assessment",
                            "description": "Comprehensive agricultural land and water rights analysis",
                            "expected_outcome": "Optimize agricultural taxation and resource allocation"
                        }
                    ]
                }
            ),
            CountyConfig(
                name="Island County",
                state="Washington",
                population=86857,
                data_sources=[{
                    "type": "open_data_hub", 
                    "url": "https://data-islandcountygis.opendata.arcgis.com/api/v1/datasets",
                    "name": "Island County Open Data",
                    "rate_limit": 0.12
                }],
                demo_customizations={
                    "primary_color": "#2E8B57",
                    "secondary_color": "#90EE90",
                    "logo_url": None,
                    "contact_info": {
                        "department": "Island County GIS",
                        "phone": "(360) 679-7354",
                        "email": "gis@islandcounty.net",
                        "website": "https://www.islandcounty.net"
                    },
                    "key_features": [
                        "Waterfront Property Management",
                        "Environmental Compliance",
                        "Tourism Impact Analysis", 
                        "Coastal Zone Planning"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "Coastal Property Management",
                            "description": "Manage coastal and waterfront property assessments",
                            "expected_outcome": "Balance environmental protection with property taxation"
                        }
                    ]
                }
            ),
            CountyConfig(
                name="Spokane County",
                state="Washington",
                population=560374,
                data_sources=[
                    {
                        "type": "open_data_hub",
                        "url": "https://gisdatacatalog-spokanecounty.opendata.arcgis.com/api/v1/datasets",
                        "name": "Spokane County GIS Data Catalog",
                        "rate_limit": 0.15
                    },
                    {
                        "type": "rest_api",
                        "url": "https://cp.spokanecounty.org/SCOUT/SCOUTDASHBOARD/",
                        "name": "SCOUT Property System",
                        "rate_limit": 0.2
                    }
                ],
                demo_customizations={
                    "primary_color": "#8B0000",
                    "secondary_color": "#CD5C5C",
                    "logo_url": None,
                    "contact_info": {
                        "department": "Spokane County Assessor's Office",
                        "phone": "(509) 477-3698",
                        "email": "assessor@spokanecounty.org",
                        "website": "https://www.spokanecounty.gov"
                    },
                    "key_features": [
                        "Enterprise Property Assessment",
                        "Advanced Tax Revenue Optimization",
                        "Multi-Jurisdictional Coordination",
                        "Large-Scale Data Analytics",
                        "Automated Valuation Models",
                        "Appeal Processing Automation"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "Enterprise Property Valuation",
                            "description": "Large-scale automated property assessment for 560K+ population",
                            "expected_outcome": "Increase assessment accuracy by 25% and reduce processing time by 60%"
                        },
                        {
                            "name": "Tax Revenue Optimization",
                            "description": "AI-powered analysis to identify undervalued properties and tax optimization opportunities",
                            "expected_outcome": "Increase annual tax revenue by $5-10M while maintaining fairness"
                        },
                        {
                            "name": "Multi-Jurisdictional Coordination",
                            "description": "Coordinate with Spokane City, smaller municipalities, and special districts",
                            "expected_outcome": "Streamline inter-governmental processes and reduce administrative overhead"
                        }
                    ]
                }
            ),
            CountyConfig(
                name="Franklin County",
                state="Washington",
                population=96749,
                data_sources=[
                    {
                        "type": "arcgis_feature_server",
                        "url": "https://gisportal.franklin.co.franklin.wa.us/arcgisportal/rest/services",
                        "name": "Franklin County GIS Portal",
                        "rate_limit": 0.15
                    },
                    {
                        "type": "rest_api",
                        "url": "https://gisportal.franklin.co.franklin.wa.us/arcgisportal/apps/webappviewer/index.html?id=846bb05aa7b14e4c8c901baa97515953",
                        "name": "Assessor Map System",
                        "rate_limit": 0.2
                    }
                ],
                demo_customizations={
                    "primary_color": "#4169E1",
                    "secondary_color": "#87CEEB",
                    "logo_url": None,
                    "contact_info": {
                        "department": "Franklin County GIS Department",
                        "phone": "(509) 545-3525",
                        "email": "gis@franklincountywa.gov",
                        "website": "https://www.franklincountywa.gov"
                    },
                    "key_features": [
                        "Multi-Agency Collaboration (FRIS)",
                        "Agricultural Land Management",
                        "Irrigation District Integration",
                        "Public Works Coordination",
                        "Regional Information Sharing",
                        "Infrastructure Asset Management"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "Regional Information System Integration",
                            "description": "Coordinate between Franklin County, Public Works, Utility District, and Irrigation District",
                            "expected_outcome": "Streamline inter-agency data sharing and reduce administrative overhead by 45%"
                        },
                        {
                            "name": "Agricultural Land Assessment",
                            "description": "Comprehensive assessment of agricultural properties with irrigation rights integration",
                            "expected_outcome": "Improve agricultural property valuations and optimize water rights taxation"
                        },
                        {
                            "name": "Infrastructure Asset Management",
                            "description": "Coordinate road maintenance, utility infrastructure, and irrigation systems",
                            "expected_outcome": "Reduce infrastructure maintenance costs by 30% through predictive analytics"
                        }
                    ]
                }
            ),
            CountyConfig(
                name="Asotin County",
                state="Washington",
                population=22285,
                data_sources=[
                    {
                        "type": "open_data_hub",
                        "url": "https://data.wa.gov/browse?tags=asotin+county",
                        "name": "Asotin County Open Data Portal (via data.wa.gov)",
                        "rate_limit": 0.2
                    },
                    {
                        "type": "rest_api",
                        "url": "https://www.asotincountylibrary.org/open-data",
                        "name": "Library-Hosted Open Data Initiative",
                        "rate_limit": 0.25
                    }
                ],
                demo_customizations={
                    "primary_color": "#228B22",
                    "secondary_color": "#90EE90",
                    "logo_url": None,
                    "contact_info": {
                        "department": "Asotin County Library District",
                        "phone": "(509) 758-5454",
                        "email": "info@asotincountylibrary.org",
                        "website": "https://www.asotincountylibrary.org"
                    },
                    "key_features": [
                        "Library-Led Data Transparency",
                        "Community-Driven Open Data",
                        "Multi-Department Integration",
                        "Health & Safety Data Analytics",
                        "Environmental Monitoring",
                        "Public Service Optimization",
                        "Small County Innovation Model"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "Community-Driven Data Transparency",
                            "description": "Library-led initiative to make county data accessible to citizens through multiple departments",
                            "expected_outcome": "Increase citizen engagement and government transparency while reducing FOIA requests by 50%"
                        },
                        {
                            "name": "Small County Innovation Model",
                            "description": "Demonstrate how smaller counties can leverage technology for maximum impact with limited resources",
                            "expected_outcome": "Achieve enterprise-level capabilities at small county budget - 300% ROI within first year"
                        },
                        {
                            "name": "Multi-Department Data Integration",
                            "description": "Integrate health, government, environment, law enforcement, fire, elections, and library data",
                            "expected_outcome": "Create unified county dashboard reducing administrative overhead by 40%"
                        },
                        {
                            "name": "Grant-Funded Technology Advancement",
                            "description": "Show how federal grants (IMLS) can fund county technology improvements",
                            "expected_outcome": "Leverage federal funding to modernize county operations and attract additional grants"
                        }
                    ]
                }
            ),
            CountyConfig(
                name="Snohomish County",
                state="Washington",
                population=844761,
                data_sources=[
                    {
                        "type": "open_data_hub",
                        "url": "https://snohomishcountywa.gov/6206/GIS-Open-Data",
                        "name": "Snohomish County GIS Open Data",
                        "rate_limit": 0.1
                    },
                    {
                        "type": "rest_api",
                        "url": "https://www.snohomishcountywa.gov/1402/Maps-GIS",
                        "name": "Enterprise GIS Collaboration Team",
                        "rate_limit": 0.15
                    }
                ],
                demo_customizations={
                    "primary_color": "#003366",
                    "secondary_color": "#4A90E2",
                    "logo_url": None,
                    "contact_info": {
                        "department": "Snohomish County Information Technology",
                        "phone": "(425) 312-0500",
                        "email": "gis@snohomishcountywa.gov",
                        "website": "https://snohomishcountywa.gov"
                    },
                    "key_features": [
                        "Enterprise GIS Collaboration",
                        "Large-Scale Property Assessment (320K+ properties)",
                        "Multi-Departmental Integration",
                        "Advanced Demographics Analytics",
                        "Growth Management Planning",
                        "Buildable Lands Analysis",
                        "Regional Transportation Coordination",
                        "Environmental Impact Assessment"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "Enterprise Property Assessment at Scale",
                            "description": "Manage 320,000+ properties with automated valuation and assessment workflows",
                            "expected_outcome": "Process 30% more assessments with 25% fewer staff through AI automation"
                        },
                        {
                            "name": "Growth Management & Planning",
                            "description": "Advanced buildable lands analysis and growth monitoring for 845K population",
                            "expected_outcome": "Optimize urban growth planning and reduce development approval time by 40%"
                        },
                        {
                            "name": "Multi-Departmental Enterprise Integration",
                            "description": "Coordinate between Assessor, Planning, Public Works, Emergency Management, and IT",
                            "expected_outcome": "Reduce inter-departmental coordination time by 50% and eliminate data silos"
                        },
                        {
                            "name": "Regional Transportation & Infrastructure",
                            "description": "Large-scale infrastructure planning and transportation coordination",
                            "expected_outcome": "Improve infrastructure project delivery by 35% through predictive analytics"
                        }
                    ]
                }
            ),
            CountyConfig(
                name="Clark County",
                state="Washington",
                population=503311,
                data_sources=[
                    {
                        "type": "open_data_hub",
                        "url": "https://hub-clarkcountywa.opendata.arcgis.com/",
                        "name": "Clark County Open Data Hub",
                        "rate_limit": 0.1
                    },
                    {
                        "type": "rest_api",
                        "url": "https://gis.clark.wa.gov/gishome/",
                        "name": "Geographic Information Services",
                        "rate_limit": 0.15
                    }
                ],
                demo_customizations={
                    "primary_color": "#8B4513",
                    "secondary_color": "#DAA520",
                    "logo_url": None,
                    "contact_info": {
                        "department": "Clark County Geographic Information Services",
                        "phone": "(564) 397-4652",
                        "email": "gistechsupport@clark.wa.gov",
                        "website": "https://clark.wa.gov"
                    },
                    "key_features": [
                        "Comprehensive Open Data Hub",
                        "Advanced Property Information Center",
                        "Multi-Platform Integration (MapsOnline)",
                        "Land Records Management",
                        "Development Review Automation",
                        "Environmental Health Integration",
                        "Community Health Data Analytics",
                        "Cross-Border Coordination (Oregon)"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "Comprehensive Property & Land Management",
                            "description": "Integrate property records, permits, surveyor data, and development review for 500K+ population",
                            "expected_outcome": "Reduce property transaction processing time by 45% and eliminate data inconsistencies"
                        },
                        {
                            "name": "Public Health Data Integration",
                            "description": "Combine GIS with comprehensive health data including climate, demographics, and community health",
                            "expected_outcome": "Enable data-driven public health decisions and reduce response time to health emergencies by 60%"
                        },
                        {
                            "name": "Cross-Border Regional Coordination",
                            "description": "Coordinate with Oregon counties and Portland metro area for regional planning",
                            "expected_outcome": "Streamline cross-border processes and improve regional development coordination"
                        },
                        {
                            "name": "Advanced Development Review Process",
                            "description": "Automate complex development review workflows with integrated permitting and environmental analysis",
                            "expected_outcome": "Reduce development approval timeline by 50% while maintaining compliance standards"
                        }
                    ]
                }
            ),
            CountyConfig(
                name="Stevens County",
                state="Washington",
                population=48229,
                data_sources=[
                    {
                        "type": "rest_api",
                        "url": "https://www.stevenscountywa.gov/20840/gis-and-mapping",
                        "name": "Stevens County GIS and Mapping",
                        "rate_limit": 0.2
                    }
                ],
                demo_customizations={
                    "primary_color": "#228B22",
                    "secondary_color": "#32CD32",
                    "logo_url": None,
                    "contact_info": {
                        "department": "Stevens County GIS Department",
                        "phone": "(509) 684-7555",
                        "email": "gis@stevenscountywa.gov",
                        "website": "https://www.stevenscountywa.gov"
                    },
                    "key_features": [
                        "Rural Mountain County Management",
                        "Forest Land Assessment",
                        "Natural Resource Management",
                        "Remote Area Service Delivery",
                        "Recreational Land Planning",
                        "Environmental Conservation",
                        "Small Rural Community Coordination"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "Rural Mountain County Operations",
                            "description": "Manage forest lands, natural resources, and remote communities across mountainous terrain",
                            "expected_outcome": "Optimize rural service delivery and reduce operational costs by 35% through efficient resource allocation"
                        },
                        {
                            "name": "Natural Resource Management",
                            "description": "Integrate forest management, mining, and recreational land use planning",
                            "expected_outcome": "Balance economic development with environmental conservation while streamlining permitting processes"
                        },
                        {
                            "name": "Remote Community Service Delivery",
                            "description": "Provide government services to dispersed rural populations efficiently",
                            "expected_outcome": "Improve citizen service access by 50% while reducing travel and administrative costs"
                        }
                    ]
                }
            ),
            CountyConfig(
                name="Grant County",
                state="Washington",
                population=102678,
                data_sources=[
                    {
                        "type": "open_data_hub",
                        "url": "https://data-grantcountywa.opendata.arcgis.com/",
                        "name": "Grant County Open Data Hub",
                        "rate_limit": 0.15
                    },
                    {
                        "type": "rest_api",
                        "url": "https://www.grantcountywa.gov/172/Geographic-Information-Systems-GIS",
                        "name": "Grant County GIS Department",
                        "rate_limit": 0.2
                    }
                ],
                demo_customizations={
                    "primary_color": "#8B4513",
                    "secondary_color": "#D2B48C",
                    "logo_url": None,
                    "contact_info": {
                        "department": "Grant County GIS Department",
                        "phone": "(509) 754-2011",
                        "email": "gis@grantcountywa.gov",
                        "website": "https://www.grantcountywa.gov"
                    },
                    "key_features": [
                        "Large-Scale Agricultural Management",
                        "Irrigation District Coordination",
                        "Site Addressing for Rural Areas",
                        "Agricultural Land Assessment",
                        "Water Rights Management",
                        "Rural Development Planning",
                        "Multi-Language Community Services"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "Agricultural Land Management at Scale",
                            "description": "Manage extensive agricultural operations, irrigation systems, and rural addressing for 100K+ population",
                            "expected_outcome": "Increase agricultural productivity tracking by 40% and streamline rural property management"
                        },
                        {
                            "name": "Irrigation and Water Rights Integration",
                            "description": "Coordinate complex irrigation districts and water rights with property assessments",
                            "expected_outcome": "Optimize water resource allocation and reduce irrigation disputes by 60%"
                        },
                        {
                            "name": "Rural Site Addressing and Development",
                            "description": "Manage site addressing across vast rural areas and coordinate development planning",
                            "expected_outcome": "Improve emergency response times by 30% through better addressing and reduce development approval time"
                        },
                        {
                            "name": "Diverse Community Services",
                            "description": "Serve diverse agricultural communities with multi-language support and cultural sensitivity",
                            "expected_outcome": "Increase community engagement by 45% and improve service accessibility for all residents"
                        }
                    ]
                }
            ),
            CountyConfig(
                name="San Juan County",
                state="Washington",
                population=18266,
                data_sources=[
                    {
                        "type": "rest_api",
                        "url": "https://www.sanjuancountywa.gov/150/Parcel-Search-and-Maps",
                        "name": "San Juan County Parcel Search and Maps",
                        "rate_limit": 0.25
                    }
                ],
                demo_customizations={
                    "primary_color": "#006994",
                    "secondary_color": "#4A90E2",
                    "logo_url": None,
                    "contact_info": {
                        "department": "San Juan County Assessor's Office",
                        "phone": "(360) 378-2171",
                        "email": "assessor@sanjuanco.com",
                        "website": "https://www.sanjuancountywa.gov"
                    },
                    "key_features": [
                        "Island Archipelago Management",
                        "Marine Property Assessment",
                        "Ferry-Dependent Community Services",
                        "Tourism and Recreation Land Planning",
                        "Environmental Conservation",
                        "Remote Island Coordination",
                        "High-Value Property Management",
                        "Seasonal Population Fluctuation Management"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "Island Archipelago Operations",
                            "description": "Manage government services across multiple islands with ferry-dependent transportation",
                            "expected_outcome": "Optimize inter-island coordination and reduce service delivery costs by 40% through digital solutions"
                        },
                        {
                            "name": "High-Value Marine Property Management",
                            "description": "Assess and manage premium waterfront and island properties with complex valuations",
                            "expected_outcome": "Increase assessment accuracy for marine properties by 35% and streamline high-value property processes"
                        },
                        {
                            "name": "Tourism and Environmental Balance",
                            "description": "Balance tourism economic benefits with environmental protection and resident needs",
                            "expected_outcome": "Create sustainable tourism management reducing environmental impact by 30% while maintaining economic benefits"
                        },
                        {
                            "name": "Seasonal Population Management",
                            "description": "Manage services for dramatic seasonal population fluctuations (summer tourism influx)",
                            "expected_outcome": "Optimize resource allocation for seasonal demands and improve year-round resident services"
                        }
                    ]
                }
            ),
            CountyConfig(
                name="Whatcom County",
                state="Washington",
                population=232000,
                data_sources=[
                    {
                        "type": "rest_api",
                        "url": "https://www.whatcomcounty.us/714/Maps-Geographic-Information-System-GIS",
                        "name": "Whatcom County GIS and Maps",
                        "rate_limit": 0.15
                    },
                    {
                        "type": "rest_api",
                        "url": "https://www.whatcomcounty.us/2979/Map-Portal",
                        "name": "Whatcom County Map Portal",
                        "rate_limit": 0.2
                    }
                ],
                demo_customizations={
                    "primary_color": "#2E8B57",
                    "secondary_color": "#90EE90",
                    "logo_url": None,
                    "contact_info": {
                        "department": "Whatcom County Information Technology - GIS",
                        "phone": "(360) 778-5000",
                        "email": "gis@co.whatcom.wa.us",
                        "website": "https://www.whatcomcounty.us"
                    },
                    "key_features": [
                        "University Town Integration (Western Washington University)",
                        "International Border Coordination (Canada)",
                        "Advanced Watershed Management",
                        "Comprehensive Map Portal System",
                        "Natural Hazards Management",
                        "Multi-Modal Transportation Planning",
                        "Conservation Easement Programs",
                        "Flood Risk Assessment and Planning",
                        "Emergency Management Integration"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "University-Community Integration",
                            "description": "Coordinate county services with major university presence (WWU) including student housing, transportation, and economic impact",
                            "expected_outcome": "Optimize town-gown relationships and increase student civic engagement by 50% while managing growth impacts"
                        },
                        {
                            "name": "International Border Operations",
                            "description": "Manage cross-border coordination with Canada including trade, transportation, and emergency services",
                            "expected_outcome": "Streamline international coordination processes and improve cross-border emergency response by 45%"
                        },
                        {
                            "name": "Advanced Watershed and Environmental Management",
                            "description": "Comprehensive watershed management with flood risk assessment and conservation programs",
                            "expected_outcome": "Reduce flood risk by 35% and increase conservation program participation through integrated data management"
                        },
                        {
                            "name": "Comprehensive Emergency and Natural Hazards Management",
                            "description": "Integrate natural hazards planning with emergency management across diverse geography",
                            "expected_outcome": "Improve emergency response times by 40% and enhance community resilience through predictive analytics"
                        }
                    ]
                }
            ),
            CountyConfig(
                name="Thurston County",
                state="Washington",
                population=300000,
                data_sources=[
                    {
                        "type": "open_data_hub",
                        "url": "https://gisdata-thurston.opendata.arcgis.com/",
                        "name": "Thurston County GIS Open Data",
                        "rate_limit": 0.15
                    },
                    {
                        "type": "rest_api",
                        "url": "https://www.thurstoncountywa.gov/departments/geodata-center",
                        "name": "Thurston County GeoData Center",
                        "rate_limit": 0.2
                    }
                ],
                demo_customizations={
                    "primary_color": "#1E3A8A",
                    "secondary_color": "#3B82F6",
                    "logo_url": None,
                    "contact_info": {
                        "department": "Thurston County GeoData Center",
                        "phone": "(360) 754-4594",
                        "email": "geodata@co.thurston.wa.us",
                        "website": "https://www.thurstoncountywa.gov"
                    },
                    "key_features": [
                        "STATE CAPITAL COUNTY OPERATIONS",
                        "Legislative District Management",
                        "State Government Coordination",
                        "Regional Planning Authority (TRPC)",
                        "Advanced GeoData Center Services",
                        "Multi-Jurisdictional Coordination (Olympia, Lacey, Tumwater)",
                        "Fastest Growing County Management",
                        "State Agency Integration",
                        "Capitol Campus Coordination",
                        "Legislative Session Management"
                    ],
                    "demo_scenarios": [
                        {
                            "name": "State Capital County Operations",
                            "description": "Manage county operations in coordination with Washington State government, legislature, and state agencies",
                            "expected_outcome": "Optimize state-county coordination and demonstrate seamless integration with state government operations"
                        },
                        {
                            "name": "Legislative District and Electoral Management",
                            "description": "Advanced management of legislative districts, electoral processes, and state political coordination",
                            "expected_outcome": "Streamline electoral processes by 40% and enhance legislative district management accuracy"
                        },
                        {
                            "name": "Multi-Jurisdictional Regional Authority",
                            "description": "Coordinate between Thurston County, cities of Olympia (state capital), Lacey, Tumwater, and state agencies",
                            "expected_outcome": "Reduce inter-governmental coordination time by 45% and eliminate administrative redundancies"
                        },
                        {
                            "name": "Rapid Growth Management (Fastest Growing County)",
                            "description": "Manage rapid population growth while maintaining government service quality and state capital functions",
                            "expected_outcome": "Accommodate 25% population growth while maintaining service levels and state government coordination"
                        },
                        {
                            "name": "State Agency and Capitol Campus Integration",
                            "description": "Integrate county services with state agencies, capitol campus operations, and legislative session management",
                            "expected_outcome": "Create seamless state-county service delivery and reduce bureaucratic friction by 50%"
                        }
                    ]
                }
            )
        ]
        
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def scrape_county_data(self, county: CountyConfig) -> Dict[str, Any]:
        print(f"🔄 Scraping data for {county.name}...")
        
        scraped_data = {
            "county": county.name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data_sources": [],
            "total_records": 0,
            "sample_records": [],
            "data_quality_score": 0.0
        }
        
        for source in county.data_sources:
            try:
                source_data = await self._scrape_data_source(source)
                scraped_data["data_sources"].append(source_data)
                scraped_data["total_records"] += source_data.get("record_count", 0)
                scraped_data["sample_records"].extend(source_data.get("sample_records", []))
                
                await asyncio.sleep(source["rate_limit"])
                
            except Exception as e:
                print(f"❌ Failed to scrape {source['name']}: {str(e)}")
                continue
        
        scraped_data["data_quality_score"] = self._calculate_data_quality(scraped_data["sample_records"])
        
        print(f"✅ {county.name}: {scraped_data['total_records']} records, Quality: {scraped_data['data_quality_score']:.1f}%")
        return scraped_data

    async def _scrape_data_source(self, source: Dict[str, Any]) -> Dict[str, Any]:
        if source["type"] == "arcgis_feature_server":
            return await self._scrape_feature_server(source)
        elif source["type"] == "arcgis_map_server":
            return await self._scrape_map_server(source)
        elif source["type"] == "open_data_hub":
            return await self._scrape_open_data_hub(source)
        else:
            return {"name": source["name"], "record_count": 0, "sample_records": []}

    async def _scrape_feature_server(self, source: Dict[str, Any]) -> Dict[str, Any]:
        query_url = f"{source['url']}?where=1%3D1&outFields=*&returnGeometry=false&f=json&resultRecordCount=1000"
        
        async with self.session.get(query_url) as response:
            data = await response.json()
            
            features = data.get("features", [])
            sample_records = [f.get("attributes", {}) for f in features[:100]]
            
            return {
                "name": source["name"],
                "type": source["type"], 
                "record_count": len(features),
                "sample_records": sample_records,
                "fields": list(sample_records[0].keys()) if sample_records else []
            }

    async def _scrape_map_server(self, source: Dict[str, Any]) -> Dict[str, Any]:
        layer_url = f"{source['url']}/0"
        query_url = f"{layer_url}/query?where=1%3D1&outFields=*&returnGeometry=false&f=json&resultRecordCount=1000"
        
        async with self.session.get(query_url) as response:
            data = await response.json()
            
            features = data.get("features", [])
            sample_records = [f.get("attributes", {}) for f in features[:100]]
            
            return {
                "name": source["name"],
                "type": source["type"],
                "record_count": len(features),
                "sample_records": sample_records,
                "fields": list(sample_records[0].keys()) if sample_records else []
            }

    async def _scrape_open_data_hub(self, source: Dict[str, Any]) -> Dict[str, Any]:
        async with self.session.get(source["url"]) as response:
            data = await response.json()
            
            datasets = data.get("data", [])[:5]  # Limit to first 5 datasets
            all_records = []
            total_count = 0
            
            for dataset in datasets:
                dataset_id = dataset.get("id")
                if dataset_id:
                    # Try to get actual data from the dataset
                    try:
                        data_url = f"https://services.arcgis.com/server/rest/services/{dataset_id}/FeatureServer/0/query?where=1%3D1&outFields=*&f=json&resultRecordCount=200"
                        async with self.session.get(data_url) as data_response:
                            dataset_data = await data_response.json()
                            features = dataset_data.get("features", [])
                            total_count += len(features)
                            all_records.extend([f.get("attributes", {}) for f in features[:20]])
                    except:
                        # If direct data access fails, use dataset metadata
                        all_records.append({
                            "dataset_name": dataset.get("name", "Unknown"),
                            "dataset_id": dataset_id,
                            "modified_date": dataset.get("updatedAt", "Unknown")
                        })
                    
                    await asyncio.sleep(0.1)  # Rate limiting
            
            return {
                "name": source["name"],
                "type": source["type"],
                "record_count": total_count,
                "sample_records": all_records[:100],
                "fields": list(all_records[0].keys()) if all_records else []
            }

    def _calculate_data_quality(self, records: List[Dict[str, Any]]) -> float:
        if not records:
            return 0.0
        
        # Calculate completeness score
        total_fields = 0
        complete_fields = 0
        
        for record in records:
            for key, value in record.items():
                total_fields += 1
                if value is not None and str(value).strip() != "":
                    complete_fields += 1
        
        completeness_score = (complete_fields / total_fields * 100) if total_fields > 0 else 0
        
        # Factor in field diversity
        unique_fields = set()
        for record in records:
            unique_fields.update(record.keys())
        
        field_diversity_score = min(len(unique_fields) / 20 * 100, 100)  # Max 20 fields for 100%
        
        # Weighted average
        return completeness_score * 0.7 + field_diversity_score * 0.3

    def generate_demo_data(self, scraped_data: Dict[str, Any], county_config: CountyConfig) -> Dict[str, Any]:
        print(f"🎯 Generating demo data for {county_config.name}...")
        
        demo_data = {
            "id": str(uuid.uuid4()),
            "county": county_config.name,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "customizations": asdict(county_config).get("demo_customizations", {}),
            "sample_properties": self._generate_sample_properties(scraped_data["sample_records"]),
            "analytics": self._generate_analytics(scraped_data),
            "recommendations": self._generate_recommendations(county_config),
            "terrafusion_features": self._generate_terrafusion_features(county_config),
            "roi_projections": self._generate_roi_projections(county_config)
        }
        
        return demo_data

    def _generate_sample_properties(self, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        properties = []
        
        for i, record in enumerate(records[:50]):  # Limit to 50 sample properties
            # Extract property data with fallbacks
            property_data = {
                "id": str(uuid.uuid4()),
                "address": self._extract_field(record, ["address", "property_address", "site_addr", "full_address"]) or f"{1000 + i} Main St",
                "assessed_value": self._extract_numeric_field(record, ["assessed_value", "total_value", "market_value"]) or (100000 + i * 5000),
                "owner": self._extract_field(record, ["owner", "owner_name", "taxpayer_name"]) or f"Property Owner {i+1}",
                "property_type": self._extract_field(record, ["property_type", "land_use", "use_code"]) or "Residential",
                "square_footage": self._extract_numeric_field(record, ["sqft", "square_feet", "building_area"]) or (1500 + i * 50),
                "year_built": self._extract_numeric_field(record, ["year_built", "construction_year", "built_year"]) or (1980 + i % 40),
                "lot_size": self._extract_numeric_field(record, ["lot_size", "acreage", "lot_area"]) or (0.25 + i * 0.1),
                "zoning": self._extract_field(record, ["zoning", "zone_code", "zoning_district"]) or "R-1"
            }
            
            properties.append(property_data)
        
        return properties

    def _extract_field(self, record: Dict[str, Any], possible_fields: List[str]) -> Optional[str]:
        for field in possible_fields:
            value = record.get(field)
            if value is not None and str(value).strip():
                return str(value)
        return None

    def _extract_numeric_field(self, record: Dict[str, Any], possible_fields: List[str]) -> Optional[float]:
        for field in possible_fields:
            value = record.get(field)
            if value is not None:
                try:
                    return float(str(value).replace(',', '').replace('$', ''))
                except (ValueError, TypeError):
                    continue
        return None

    def _generate_analytics(self, scraped_data: Dict[str, Any]) -> Dict[str, Any]:
        records = scraped_data.get("sample_records", [])
        
        # Calculate basic statistics
        total_properties = scraped_data.get("total_records", len(records))
        
        # Extract assessed values
        assessed_values = []
        for record in records:
            value = self._extract_numeric_field(record, ["assessed_value", "total_value", "market_value"])
            if value:
                assessed_values.append(value)
        
        avg_value = sum(assessed_values) / len(assessed_values) if assessed_values else 250000
        total_value = avg_value * total_properties
        
        return {
            "total_properties": total_properties,
            "average_assessed_value": avg_value,
            "total_assessed_value": total_value,
            "median_assessed_value": sorted(assessed_values)[len(assessed_values)//2] if assessed_values else avg_value,
            "property_type_distribution": self._calculate_property_type_distribution(records),
            "value_ranges": self._calculate_value_ranges(assessed_values),
            "data_quality_metrics": {
                "completeness_score": scraped_data.get("data_quality_score", 0),
                "total_fields_analyzed": len(set().union(*(r.keys() for r in records))) if records else 0,
                "sample_size": len(records)
            }
        }

    def _calculate_property_type_distribution(self, records: List[Dict[str, Any]]) -> Dict[str, int]:
        distribution = {}
        for record in records:
            prop_type = self._extract_field(record, ["property_type", "land_use", "use_code"]) or "Unknown"
            distribution[prop_type] = distribution.get(prop_type, 0) + 1
        return distribution

    def _calculate_value_ranges(self, values: List[float]) -> Dict[str, int]:
        if not values:
            return {}
        
        ranges = {
            "Under $100k": 0,
            "$100k - $250k": 0,
            "$250k - $500k": 0,
            "$500k - $1M": 0,
            "Over $1M": 0
        }
        
        for value in values:
            if value < 100000:
                ranges["Under $100k"] += 1
            elif value < 250000:
                ranges["$100k - $250k"] += 1
            elif value < 500000:
                ranges["$250k - $500k"] += 1
            elif value < 1000000:
                ranges["$500k - $1M"] += 1
            else:
                ranges["Over $1M"] += 1
        
        return ranges

    def _generate_recommendations(self, county_config: CountyConfig) -> List[Dict[str, Any]]:
        base_recommendations = [
            {
                "id": str(uuid.uuid4()),
                "title": f"Optimize {county_config.name} Property Assessment Workflow",
                "description": f"Implement TerraFusion's AI-powered assessment tools to improve accuracy and efficiency",
                "impact": "High",
                "estimated_revenue_increase": 250000 * (county_config.population / 100000),
                "implementation_complexity": "Medium",
                "timeframe": "3-6 months"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Deploy Automated Valuation Models (AVM)",
                "description": "Use machine learning to provide consistent, accurate property valuations",
                "impact": "Very High", 
                "estimated_revenue_increase": 500000 * (county_config.population / 100000),
                "implementation_complexity": "High",
                "timeframe": "6-12 months"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Implement Real-time Market Analysis",
                "description": "Track market trends and automatically adjust assessments based on current conditions",
                "impact": "High",
                "estimated_revenue_increase": 300000 * (county_config.population / 100000),
                "implementation_complexity": "Medium",
                "timeframe": "4-8 months"
            }
        ]
        
        return base_recommendations

    def _generate_terrafusion_features(self, county_config: CountyConfig) -> Dict[str, Any]:
        return {
            "core_applications": [
                {
                    "name": "TerraAgent",
                    "description": "AI-powered government assistant for citizen services",
                    "benefits": ["24/7 citizen support", "Reduced call center load", "Improved service delivery"]
                },
                {
                    "name": "CostForgeAI", 
                    "description": "Quantum property valuation and cost analysis",
                    "benefits": ["95%+ valuation accuracy", "Automated assessment updates", "Appeal reduction"]
                },
                {
                    "name": "TerraFlow",
                    "description": "Workflow automation for government processes",
                    "benefits": ["60% faster processing", "Reduced manual errors", "Compliance tracking"]
                },
                {
                    "name": "TerraInsight",
                    "description": "Advanced analytics and reporting dashboard",
                    "benefits": ["Real-time insights", "Predictive analytics", "Custom reporting"]
                }
            ],
            "county_specific_features": county_config.demo_customizations.get("key_features", []),
            "integration_capabilities": [
                "Existing GIS systems",
                "Property management software",
                "Financial systems",
                "State reporting systems",
                "Public portals"
            ]
        }

    def _generate_roi_projections(self, county_config: CountyConfig) -> Dict[str, Any]:
        population = county_config.population
        base_budget = population * 1000  # Estimate $1000 per capita county budget
        
        return {
            "implementation_cost": {
                "year_1": base_budget * 0.02,  # 2% of budget
                "year_2": base_budget * 0.01,  # 1% of budget
                "year_3": base_budget * 0.005  # 0.5% of budget
            },
            "projected_savings": {
                "year_1": base_budget * 0.05,   # 5% savings
                "year_2": base_budget * 0.08,   # 8% savings  
                "year_3": base_budget * 0.12    # 12% savings
            },
            "roi_percentage": {
                "year_1": 150,  # 150% ROI
                "year_2": 700,  # 700% ROI
                "year_3": 2300  # 2300% ROI
            },
            "break_even_timeline": "4-6 months",
            "total_3_year_roi": base_budget * 0.25  # 25% of annual budget over 3 years
        }

    async def generate_all_county_demos(self) -> Dict[str, Dict[str, Any]]:
        print("🚀 Starting TerraFusion County Demo Generation System...")
        
        all_demos = {}
        
        for county in self.counties:
            try:
                # Scrape data
                scraped_data = await self.scrape_county_data(county)
                
                # Generate demo
                demo_data = self.generate_demo_data(scraped_data, county)
                
                # Save demo data
                output_dir = Path("county_demos")
                output_dir.mkdir(exist_ok=True)
                
                filename = f"{county.name.replace(' ', '_').lower()}_demo_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                output_path = output_dir / filename
                
                with open(output_path, 'w') as f:
                    json.dump(demo_data, f, indent=2, default=str)
                
                all_demos[county.name] = demo_data
                
                print(f"✅ Demo generated for {county.name}: {output_path}")
                
            except Exception as e:
                print(f"❌ Failed to generate demo for {county.name}: {str(e)}")
                continue
        
        print(f"\n🏆 TerraFusion Demo Generation Complete!")
        print(f"Generated {len(all_demos)} county demos")
        
        return all_demos

async def main():
    async with TerraFusionDemoGenerator() as generator:
        demos = await generator.generate_all_county_demos()
        
        print("\n📊 Summary:")
        for county_name, demo_data in demos.items():
            analytics = demo_data.get("analytics", {})
            print(f"• {county_name}: {analytics.get('total_properties', 0)} properties, "
                  f"${analytics.get('average_assessed_value', 0):,.0f} avg value")

if __name__ == "__main__":
    asyncio.run(main())
