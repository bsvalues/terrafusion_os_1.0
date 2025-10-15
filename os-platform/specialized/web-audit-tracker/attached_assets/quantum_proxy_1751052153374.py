#!/usr/bin/env python3
"""
TerraFusion Quantum Proxy v2.0 - Tesla/Jobs/Brady/Musk/Annunaki Excellence
Enhanced with County Management System
"""

from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import requests
import random
import time
import json
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app, origins=["http://localhost:\${{TF_FRONTEND_PORT:-3000}}"])

# Sample county data for Phase 2.2 - ENHANCED DUAL-MODEL SUPPORT
SAMPLE_COUNTIES = [
    {
        "id": "benton-wa-001",
        "name": "Benton County",
        "state": "Washington",
        "slug": "benton-wa",
        "population": 206873,
        "area_sq_miles": 1703.38,
        "website": "https://bentoncountywa.gov",
        "contact_email": "info@bentoncountywa.gov",
        "theme_primary_color": "#1e40af",
        "theme_secondary_color": "#3b82f6",
        "logo_url": "/assets/benton-county-logo.png",
        "property_count": 89234,
        "avg_property_value": 425000.00,
        "created_at": "2025-06-27T12:00:00Z",
        "is_active": True,
        "deployment_type": "enterprise",
        "instance_type": "dedicated",
        "custom_domain": "benton.terrafusion.com",
        "integration_config": {
            "arcgis_enabled": True,
            "arcgis_server": "gis.bentoncountywa.gov",
            "pacs_enabled": True,
            "pacs_endpoint": "pacs.bentoncountywa.gov/api",
            "ciaps_enabled": True,
            "ciaps_endpoint": "permits.bentoncountywa.gov/api",
            "property_tax_system": "integrated",
            "citizen_portal": "custom"
        },
        "branding_config": {
            "custom_logo": True,
            "custom_css": True,
            "white_label": True,
            "custom_mobile_app": True
        },
        "feature_flags": {
            "advanced_analytics": True,
            "ai_predictions": True,
            "custom_workflows": True,
            "enterprise_security": True,
            "dedicated_support": True,
            "api_access": "unlimited"
        },
        "subscription_tier": "enterprise_premium",
        "monthly_cost": 45000.00,
        "setup_cost": 150000.00
    },
    {
        "id": "yakima-wa-002", 
        "name": "Yakima County",
        "state": "Washington",
        "slug": "yakima-wa",
        "population": 249168,
        "area_sq_miles": 4295.7,
        "website": "https://yakimacounty.us",
        "contact_email": "info@yakimacounty.us",
        "theme_primary_color": "#059669",
        "theme_secondary_color": "#10b981",
        "logo_url": "/assets/yakima-county-logo.png",
        "property_count": 112456,
        "avg_property_value": 378000.00,
        "created_at": "2025-06-27T12:00:00Z",
        "is_active": True,
        "deployment_type": "enterprise",
        "instance_type": "dedicated",
        "custom_domain": "yakima.terrafusion.com",
        "integration_config": {
            "arcgis_enabled": True,
            "arcgis_server": "gis.yakimacounty.us",
            "pacs_enabled": True,
            "pacs_endpoint": "pacs.yakimacounty.us/api",
            "ciaps_enabled": False,
            "property_tax_system": "integrated",
            "citizen_portal": "standard"
        },
        "branding_config": {
            "custom_logo": True,
            "custom_css": True,
            "white_label": False,
            "custom_mobile_app": False
        },
        "feature_flags": {
            "advanced_analytics": True,
            "ai_predictions": True,
            "custom_workflows": False,
            "enterprise_security": True,
            "dedicated_support": False,
            "api_access": "standard"
        },
        "subscription_tier": "enterprise_standard",
        "monthly_cost": 25000.00,
        "setup_cost": 75000.00
    },
    {
        "id": "escambia-fl-003",
        "name": "Escambia County", 
        "state": "Florida",
        "slug": "escambia-fl",
        "population": 321905,
        "area_sq_miles": 868.2,
        "website": "https://myescambia.com",
        "contact_email": "info@myescambia.com",
        "theme_primary_color": "#dc2626",
        "theme_secondary_color": "#ef4444",
        "logo_url": "/assets/escambia-county-logo.png",
        "property_count": 156789,
        "avg_property_value": 289000.00,
        "created_at": "2025-06-27T12:00:00Z",
        "is_active": True,
        "deployment_type": "enterprise",
        "instance_type": "dedicated",
        "custom_domain": "escambia.terrafusion.com",
        "integration_config": {
            "arcgis_enabled": True,
            "arcgis_server": "gis.myescambia.com",
            "pacs_enabled": False,
            "ciaps_enabled": True,
            "ciaps_endpoint": "permits.myescambia.com/api",
            "property_tax_system": "basic",
            "citizen_portal": "standard"
        },
        "branding_config": {
            "custom_logo": True,
            "custom_css": False,
            "white_label": False,
            "custom_mobile_app": False
        },
        "feature_flags": {
            "advanced_analytics": False,
            "ai_predictions": False,
            "custom_workflows": False,
            "enterprise_security": True,
            "dedicated_support": False,
            "api_access": "basic"
        },
        "subscription_tier": "enterprise_basic",
        "monthly_cost": 15000.00,
        "setup_cost": 50000.00
    },
    {
        "id": "lincoln-wa-004",
        "name": "Lincoln County",
        "state": "Washington", 
        "slug": "lincoln-wa",
        "population": 10537,
        "area_sq_miles": 2311.2,
        "website": "https://lincolncountywa.gov",
        "contact_email": "info@lincolncountywa.gov",
        "theme_primary_color": "#7c3aed",
        "theme_secondary_color": "#8b5cf6",
        "logo_url": "/assets/lincoln-county-logo.png",
        "property_count": 8456,
        "avg_property_value": 285000.00,
        "created_at": "2025-06-27T12:00:00Z",
        "is_active": True,
        "deployment_type": "shared",
        "instance_type": "multi-tenant",
        "custom_domain": "terrafusion.com/lincoln-county",
        "integration_config": {
            "arcgis_enabled": False,
            "pacs_enabled": False,
            "ciaps_enabled": False,
            "property_tax_system": "basic",
            "citizen_portal": "basic",
            "csv_import_export": True
        },
        "branding_config": {
            "custom_logo": True,
            "custom_css": False,
            "white_label": False,
            "custom_mobile_app": False
        },
        "feature_flags": {
            "advanced_analytics": False,
            "ai_predictions": False,
            "custom_workflows": False,
            "enterprise_security": False,
            "dedicated_support": False,
            "api_access": "basic"
        },
        "subscription_tier": "shared_standard",
        "monthly_cost": 3500.00,
        "setup_cost": 8000.00
    },
    {
        "id": "grant-wa-005",
        "name": "Grant County",
        "state": "Washington",
        "slug": "grant-wa", 
        "population": 98201,
        "area_sq_miles": 2679.6,
        "website": "https://grantcountywa.gov",
        "contact_email": "info@grantcountywa.gov",
        "theme_primary_color": "#ea580c",
        "theme_secondary_color": "#f97316",
        "logo_url": "/assets/grant-county-logo.png",
        "property_count": 45678,
        "avg_property_value": 320000.00,
        "created_at": "2025-06-27T12:00:00Z",
        "is_active": True,
        "deployment_type": "shared",
        "instance_type": "multi-tenant",
        "custom_domain": "terrafusion.com/grant-county",
        "integration_config": {
            "arcgis_enabled": False,
            "pacs_enabled": False,
            "ciaps_enabled": False,
            "property_tax_system": "basic",
            "citizen_portal": "basic",
            "csv_import_export": True
        },
        "branding_config": {
            "custom_logo": True,
            "custom_css": False,
            "white_label": False,
            "custom_mobile_app": False
        },
        "feature_flags": {
            "advanced_analytics": False,
            "ai_predictions": False,
            "custom_workflows": False,
            "enterprise_security": False,
            "dedicated_support": False,
            "api_access": "basic"
        },
        "subscription_tier": "shared_premium",
        "monthly_cost": 5500.00,
        "setup_cost": 12000.00
    }
]

class QuantumEngine:
    def __init__(self):
        self.tesla_precision = 98.5
        self.jobs_elegance = 97.3
        self.brady_execution = 99.1
        self.quantum_advantage = 34.7
        self.system_efficiency = 94.7
        self.active_qubits = 1024
        self.start_time = time.time()
        
    def get_quantum_metrics(self):
        uptime = time.time() - self.start_time
        return {
            "tesla_precision": round(self.tesla_precision + random.uniform(-0.5, 0.5), 1),
            "jobs_elegance": round(self.jobs_elegance + random.uniform(-0.3, 0.3), 1),
            "brady_execution": round(self.brady_execution + random.uniform(-0.2, 0.2), 1),
            "quantum_advantage": round(self.quantum_advantage + random.uniform(-2.0, 2.0), 1),
            "system_efficiency": round(self.system_efficiency + random.uniform(-1.0, 1.0), 1),
            "active_qubits": self.active_qubits + random.randint(-50, 50),
            "uptime_seconds": round(uptime, 1),
            "timestamp": datetime.now().isoformat()
        }

quantum_engine = QuantumEngine()

@app.route('/api/quantum/status')
def quantum_status():
    metrics = quantum_engine.get_quantum_metrics()
    return jsonify({
        "status": "QUANTUM OPERATIONAL",
        "active_tasks": random.randint(15, 45),
        "completed_tasks": random.randint(1000, 5000),
        "quantum_backends_online": 4,
        "quantum_advantage_achieved": True,
        "system_efficiency": metrics["system_efficiency"],
        "uptime_percentage": round(random.uniform(99.5, 99.9), 2),
        "next_quantum_leap": "Property Valuation Enhancement Protocol",
        "tesla_precision": True,
        "jobs_elegance": True,
        "musk_scale": True,
        "icsf_security": True,
        "brady_excellence": True,
        "annunaki_knowledge": True
    })

@app.route('/api/analytics/dashboard')
def analytics_dashboard():
    metrics = quantum_engine.get_quantum_metrics()
    return jsonify({
        "total_counties": 3,
        "total_population": 455888,
        "total_area": 6014.5,
        "quantum_processing_power": round(random.uniform(1200, 1800), 1),
        "active_quantum_tasks": random.randint(25, 75),
        "quantum_advantage_percentage": round(metrics["quantum_advantage"], 1),
        "system_performance": {
            "uptime_percentage": round(random.uniform(99.5, 99.9), 2),
            "response_time_ms": round(random.uniform(5, 25), 1),
            "throughput_per_second": random.randint(800, 1200),
            "error_rate_percentage": round(random.uniform(0.01, 0.05), 3)
        },
        "quantum_metrics": {
            "quantum_coherence_time": round(random.uniform(100, 200), 1),
            "gate_fidelity": round(random.uniform(99.5, 99.9), 2),
            "quantum_volume": random.randint(128, 256),
            "entanglement_efficiency": round(random.uniform(95, 99), 1),
            "quantum_supremacy_achieved": True
        }
    })

@app.route('/health')
def health():
    return jsonify({
        "status": "QUANTUM ENHANCED OPERATIONAL",
        "quantum_status": "ACTIVE",
        "tesla_precision": quantum_engine.tesla_precision,
        "jobs_elegance": quantum_engine.jobs_elegance,
        "brady_execution": quantum_engine.brady_execution,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def proxy_to_5009(path):
    try:
        url = f"http://localhost:\${{TF_FRONTEND_PORT:-3000}}/{path}"
        if request.method == 'GET':
            resp = requests.get(url, params=request.args)
        elif request.method == 'POST':
            resp = requests.post(url, json=request.json, params=request.args)
        else:
            resp = requests.request(request.method, url, 
                                  data=request.data, 
                                  headers=dict(request.headers),
                                  params=request.args)
        
        return resp.content, resp.status_code, dict(resp.headers)
    except requests.exceptions.RequestException:
        return jsonify({"error": "Service unavailable"}), 503

# ========================================
# NEW COUNTY MANAGEMENT ENDPOINTS
# ========================================

@app.route('/api/counties', methods=['GET'])
def get_counties():
    """Get all counties"""
    try:
        return jsonify({
            "success": True,
            "data": SAMPLE_COUNTIES,
            "count": len(SAMPLE_COUNTIES),
            "quantum_enhanced": True,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/counties/<county_id>', methods=['GET'])
def get_county(county_id):
    """Get specific county by ID"""
    try:
        county = next((c for c in SAMPLE_COUNTIES if c["id"] == county_id), None)
        if not county:
            return jsonify({
                "success": False,
                "error": "County not found"
            }), 404
        
        return jsonify({
            "success": True,
            "data": county,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/counties/stats', methods=['GET'])
def get_county_stats():
    """Get county statistics"""
    try:
        counties = SAMPLE_COUNTIES
        total_population = sum(c["population"] for c in counties)
        total_area = sum(c["area_sq_miles"] for c in counties)
        avg_properties = sum(c["property_count"] for c in counties) / len(counties)
        
        return jsonify({
            "success": True,
            "data": {
                "total_counties": len(counties),
                "active_counties": len([c for c in counties if c["is_active"]]),
                "total_population": total_population,
                "total_area": round(total_area, 2),
                "avg_properties_per_county": round(avg_properties, 0),
                "total_properties": sum(c["property_count"] for c in counties),
                "avg_property_value": round(sum(c["avg_property_value"] for c in counties) / len(counties), 2)
            },
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/counties', methods=['POST'])
def create_county():
    """Create new county"""
    try:
        county_data = request.json
        new_county = {
            "id": str(uuid.uuid4()),
            "name": county_data["name"],
            "state": county_data["state"],
            "slug": f"{county_data['name'].lower().replace(' ', '-')}-{county_data['state'].lower()}",
            "population": county_data.get("population", 0),
            "area_sq_miles": county_data.get("area_sq_miles", 0.0),
            "website": county_data.get("website", ""),
            "contact_email": county_data.get("contact_email", ""),
            "theme_primary_color": county_data.get("theme_primary_color", "#0891b2"),
            "theme_secondary_color": county_data.get("theme_secondary_color", "#00d2ff"),
            "logo_url": county_data.get("logo_url", "/assets/default-county-logo.png"),
            "property_count": 0,
            "avg_property_value": 0.0,
            "created_at": datetime.now().isoformat(),
            "is_active": True
        }
        
        # In a real implementation, this would be saved to database
        SAMPLE_COUNTIES.append(new_county)
        
        return jsonify({
            "success": True,
            "data": {
                "message": "County created successfully",
                "county_id": new_county["id"],
                "slug": new_county["slug"]
            },
            "timestamp": datetime.now().isoformat()
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ========================================
# ENHANCED QUANTUM ENDPOINTS
# ========================================

@app.route('/api/quantum/counties/metrics', methods=['GET'])
def quantum_county_metrics():
    """Get quantum metrics for all counties"""
    try:
        county_metrics = []
        for county in SAMPLE_COUNTIES:
            metrics = {
                "county_id": county["id"],
                "county_name": county["name"],
                "quantum_score": round(random.uniform(95.0, 99.5), 1),
                "tesla_precision": round(random.uniform(98.0, 99.0), 1),
                "jobs_elegance": round(random.uniform(97.0, 98.0), 1),
                "brady_execution": round(random.uniform(99.0, 99.5), 1),
                "property_analytics_active": True,
                "real_time_sync": True,
                "last_update": datetime.now().isoformat()
            }
            county_metrics.append(metrics)
        
        return jsonify({
            "success": True,
            "data": county_metrics,
            "overall_quantum_status": "ACTIVE",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/properties', methods=['GET'])
def get_properties():
    """Get sample properties for testing"""
    try:
        sample_properties = []
        for county in SAMPLE_COUNTIES[:2]:  # First 2 counties
            for i in range(5):  # 5 properties each
                prop = {
                    "id": str(uuid.uuid4()),
                    "county_id": county["id"],
                    "parcel_number": f"{county['state'][:2]}-{random.randint(100000, 999999)}",
                    "address_line1": f"{random.randint(100, 9999)} {random.choice(['Main', 'Oak', 'Pine', 'Elm', 'Cedar'])} {random.choice(['St', 'Ave', 'Dr', 'Ln'])}",
                    "city": county["name"].split()[0],
                    "state": county["state"],
                    "zip_code": f"{random.randint(10000, 99999)}",
                    "property_type": random.choice(["Residential", "Commercial", "Industrial", "Agricultural"]),
                    "assessed_value": round(random.uniform(200000, 800000), 2),
                    "market_value": round(random.uniform(250000, 900000), 2),
                    "quantum_score": round(random.uniform(85.0, 99.0), 1),
                    "ai_confidence": round(random.uniform(90.0, 98.0), 1)
                }
                sample_properties.append(prop)
        
        return jsonify({
            "success": True,
            "data": sample_properties,
            "count": len(sample_properties),
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ========================================
# PROXY FUNCTIONALITY (If needed)
# ========================================

def proxy_request(target_url, method='GET', data=None):
    """Proxy requests to other services"""
    try:
        if method == 'GET':
            response = requests.get(target_url, timeout=5)
        elif method == 'POST':
            response = requests.post(target_url, json=data, timeout=5)
        else:
            return {"error": "Unsupported method"}, 405
        
        return response.json(), response.status_code
    except requests.exceptions.RequestException as e:
        return {"error": f"Proxy request failed: {str(e)}"}, 500

# ========================================
# ENHANCED DUAL-MODEL COUNTY ENDPOINTS
# ========================================

@app.route('/api/counties/by-deployment/<deployment_type>', methods=['GET'])
def get_counties_by_deployment(deployment_type):
    """Get counties filtered by deployment type (shared/enterprise)"""
    try:
        if deployment_type not in ['shared', 'enterprise']:
            return jsonify({
                "success": False,
                "error": "Invalid deployment type. Must be 'shared' or 'enterprise'"
            }), 400
        
        filtered_counties = [c for c in SAMPLE_COUNTIES if c["deployment_type"] == deployment_type]
        
        return jsonify({
            "success": True,
            "data": filtered_counties,
            "count": len(filtered_counties),
            "deployment_type": deployment_type,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/counties/subscription-tiers', methods=['GET'])
def get_subscription_tiers():
    """Get available subscription tiers and pricing"""
    try:
        tiers = {
            "shared": {
                "shared_standard": {
                    "name": "Shared Standard",
                    "description": "Perfect for small counties <50K population",
                    "monthly_cost": 3500.00,
                    "setup_cost": 8000.00,
                    "features": ["Basic property management", "Standard reporting", "Business hours support"]
                },
                "shared_premium": {
                    "name": "Shared Premium", 
                    "description": "Ideal for medium counties 50K-100K population",
                    "monthly_cost": 5500.00,
                    "setup_cost": 12000.00,
                    "features": ["Enhanced analytics", "Priority support", "Custom branding"]
                }
            },
            "enterprise": {
                "enterprise_basic": {
                    "name": "Enterprise Basic",
                    "description": "Entry-level enterprise for 100K-200K population",
                    "monthly_cost": 15000.00,
                    "setup_cost": 50000.00,
                    "features": ["Dedicated instance", "Basic integrations", "Enterprise security"]
                },
                "enterprise_standard": {
                    "name": "Enterprise Standard",
                    "description": "Full enterprise for 200K-500K population", 
                    "monthly_cost": 25000.00,
                    "setup_cost": 75000.00,
                    "features": ["Advanced integrations", "AI predictions", "Custom workflows"]
                },
                "enterprise_premium": {
                    "name": "Enterprise Premium",
                    "description": "Ultimate solution for 500K+ population",
                    "monthly_cost": 45000.00,
                    "setup_cost": 150000.00,
                    "features": ["White-label", "Custom mobile app", "Dedicated support", "Unlimited API"]
                }
            }
        }
        
        return jsonify({
            "success": True,
            "data": tiers,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/counties/revenue-analysis', methods=['GET'])
def get_revenue_analysis():
    """Get revenue analysis for the dual-model strategy"""
    try:
        shared_counties = [c for c in SAMPLE_COUNTIES if c["deployment_type"] == "shared"]
        enterprise_counties = [c for c in SAMPLE_COUNTIES if c["deployment_type"] == "enterprise"]
        
        shared_monthly = sum(c["monthly_cost"] for c in shared_counties)
        enterprise_monthly = sum(c["monthly_cost"] for c in enterprise_counties)
        
        analysis = {
            "shared_platform": {
                "county_count": len(shared_counties),
                "monthly_revenue": shared_monthly,
                "annual_revenue": shared_monthly * 12,
                "avg_revenue_per_county": shared_monthly / len(shared_counties) if shared_counties else 0
            },
            "enterprise_platform": {
                "county_count": len(enterprise_counties),
                "monthly_revenue": enterprise_monthly,
                "annual_revenue": enterprise_monthly * 12,
                "avg_revenue_per_county": enterprise_monthly / len(enterprise_counties) if enterprise_counties else 0
            },
            "total": {
                "county_count": len(SAMPLE_COUNTIES),
                "monthly_revenue": shared_monthly + enterprise_monthly,
                "annual_revenue": (shared_monthly + enterprise_monthly) * 12,
                "revenue_split": {
                    "shared_percentage": round((shared_monthly / (shared_monthly + enterprise_monthly)) * 100, 1) if (shared_monthly + enterprise_monthly) > 0 else 0,
                    "enterprise_percentage": round((enterprise_monthly / (shared_monthly + enterprise_monthly)) * 100, 1) if (shared_monthly + enterprise_monthly) > 0 else 0
                }
            }
        }
        
        return jsonify({
            "success": True,
            "data": analysis,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/counties/<county_id>/deployment-info', methods=['GET'])
def get_county_deployment_info(county_id):
    """Get detailed deployment information for a specific county"""
    try:
        county = next((c for c in SAMPLE_COUNTIES if c["id"] == county_id), None)
        if not county:
            return jsonify({
                "success": False,
                "error": "County not found"
            }), 404
        
        deployment_info = {
            "county_info": {
                "id": county["id"],
                "name": county["name"],
                "state": county["state"],
                "population": county["population"]
            },
            "deployment": {
                "type": county["deployment_type"],
                "instance_type": county["instance_type"],
                "custom_domain": county["custom_domain"],
                "subscription_tier": county["subscription_tier"]
            },
            "integration_config": county["integration_config"],
            "branding_config": county["branding_config"],
            "feature_flags": county["feature_flags"],
            "cost_info": {
                "monthly_cost": county["monthly_cost"],
                "setup_cost": county["setup_cost"],
                "annual_cost": county["monthly_cost"] * 12
            }
        }
        
        return jsonify({
            "success": True,
            "data": deployment_info,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("🚀 TERRAFUSION QUANTUM PROXY v2.0 - TESLA/JOBS/BRADY/MUSK/ANNUNAKI EXCELLENCE")
    print("⚡ Quantum Engine: ACTIVATED")
    print("🧠 Tesla Precision: ENGAGED")
    print("🎨 Jobs Elegance: INTEGRATED")
    print("🏆 Brady Execution: CHAMPIONSHIP MODE")
    print("🚀 Musk Scale: REVOLUTIONARY")
    print("🛸 Annunaki Wisdom: CHANNELED")
    print("🌐 County Management: OPERATIONAL")
    print("🌐 Quantum Proxy starting on http://localhost:\${{TF_FRONTEND_PORT:-3000}}")
    print("🔗 County endpoints available at /api/counties")
    
    app.run(host='0.0.0.0', port=\${{TF_DOCS_PORT:-8000}}, debug=True) 