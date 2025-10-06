#!/usr/bin/env python3
"""
TerraFusion Component Generator API
Flask API that wraps ai-code-generator.py for dynamic UI generation

Classification: FOR OFFICIAL USE ONLY
Week 2 Day 8-10: Python API Endpoint
"""

import sys
import os
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
import logging
from datetime import datetime
from typing import Dict, Any

# Add ai-swarm-supreme-commander to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ai-swarm-supreme-commander', 'src', 'python'))

try:
    from ai_code_generator import (
        GenerationRequest,
        GenerationResult,
        TaskType,
        ComplianceLevel,
        ProjectType
    )
    HAS_AI_GENERATOR = True
except ImportError as e:
    print(f"Warning: Could not import ai-code-generator: {e}", file=sys.stderr)
    HAS_AI_GENERATOR = False

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('ComponentGeneratorAPI')

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for WebView2 communication

# Store generation history (for debugging Week 2)
generation_history = []

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'TerraFusion Component Generator API',
        'ai_generator_available': HAS_AI_GENERATOR,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/generate-component', methods=['POST'])
def generate_component():
    """
    Generate a React component based on user intent
    
    Request Body:
    {
        "intent": "show budget dashboard",
        "user_role": "budget-director",
        "context": {
            "county": "Benton County WA",
            "data_source": "postgres://..."
        }
    }
    
    Response:
    {
        "success": true,
        "component_code": "import React from 'react'...",
        "component_name": "BudgetDashboard",
        "timestamp": "2025-10-02T...",
        "generation_time_ms": 1234
    }
    """
    try:
        start_time = datetime.now()
        
        # Parse request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        intent = data.get('intent', '')
        user_role = data.get('user_role', 'user')
        context = data.get('context', {})
        
        if not intent:
            return jsonify({'error': 'Intent is required'}), 400
        
        logger.info(f"Generation request: intent='{intent}', role={user_role}")
        
        # Week 2: Use template-based generation (AI generation in Week 3)
        component_code, component_name = generate_component_from_template(
            intent, user_role, context
        )
        
        # Calculate generation time
        end_time = datetime.now()
        generation_time_ms = int((end_time - start_time).total_seconds() * 1000)
        
        # Store in history
        generation_history.append({
            'intent': intent,
            'user_role': user_role,
            'component_name': component_name,
            'timestamp': end_time.isoformat(),
            'generation_time_ms': generation_time_ms
        })
        
        # Keep only last 100 generations
        if len(generation_history) > 100:
            generation_history.pop(0)
        
        logger.info(f"Generated component: {component_name} in {generation_time_ms}ms")
        
        return jsonify({
            'success': True,
            'component_code': component_code,
            'component_name': component_name,
            'timestamp': end_time.isoformat(),
            'generation_time_ms': generation_time_ms
        })
        
    except Exception as e:
        logger.error(f"Generation failed: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

def generate_component_from_template(intent: str, user_role: str, context: Dict[str, Any]) -> tuple[str, str]:
    """
    Week 2: Template-based component generation
    Week 3: Will replace with full AI generation
    """
    
    # Parse intent to determine component type
    intent_lower = intent.lower()
    
    if 'budget' in intent_lower or 'financial' in intent_lower:
        return generate_budget_component(intent, user_role, context)
    elif 'property' in intent_lower or 'assessment' in intent_lower or 'parcel' in intent_lower:
        return generate_property_component(intent, user_role, context)
    elif 'dashboard' in intent_lower or 'overview' in intent_lower:
        return generate_dashboard_component(intent, user_role, context)
    else:
        return generate_default_component(intent, user_role, context)

def generate_budget_component(intent: str, user_role: str, context: Dict[str, Any]) -> tuple[str, str]:
    """Generate budget/financial component"""
    component_name = "BudgetDashboard"
    
    # Use string concatenation to avoid JSX/Python escaping conflicts
    component_code = (
        "import React, { useState, useEffect } from 'react';\n\n"
        "const BudgetDashboard = () => {\n"
        "  const [budgetData, setBudgetData] = useState(null);\n"
        "  const [loading, setLoading] = useState(true);\n"
        "  \n"
        "  useEffect(() => {\n"
        "    setTimeout(() => {\n"
        "      setBudgetData({\n"
        "        totalBudget: 12500000,\n"
        "        spent: 8750000,\n"
        "        remaining: 3750000,\n"
        "        departments: [\n"
        "          { name: 'Public Safety', budget: 4500000, spent: 3200000 },\n"
        "          { name: 'Infrastructure', budget: 3200000, spent: 2100000 },\n"
        "          { name: 'Administration', budget: 2800000, spent: 1950000 }\n"
        "        ]\n"
        "      });\n"
        "      setLoading(false);\n"
        "    }, 500);\n"
        "  }, []);\n"
        "  \n"
        "  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;\n"
        "  \n"
        "  return (\n"
        "    <div style={{ padding: '20px' }}>\n"
        "      <h1 style={{ color: '#0099ff' }}>Budget Dashboard</h1>\n"
        f"      <p>Intent: {intent}</p>\n"
        f"      <p>Role: {user_role}</p>\n"
        "      <div style={{ marginTop: '20px' }}>\n"
        "        <h2>Total: ${budgetData.totalBudget.toLocaleString()}</h2>\n"
        "        <div>Spent: ${budgetData.spent.toLocaleString()}</div>\n"
        "      </div>\n"
        "      <div style={{ marginTop: '20px', padding: '10px', background: '#fffbcc' }}>\n"
        "        <strong>🚀 Week 2 Template</strong>\n"
        "      </div>\n"
        "    </div>\n"
        "  );\n"
        "};\n\n"
        "export default BudgetDashboard;\n"
    )
    
    return component_code, component_name

def generate_property_component(intent: str, user_role: str, context: Dict[str, Any]) -> tuple[str, str]:
    """Generate property/assessment component"""
    component_name = "PropertyValuation"
    
    component_code = """
import React, { useState, useEffect } from 'react';

const PropertyValuation = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Week 2: Mock data
    setTimeout(() => {
      setProperties([
        { parcel: 'R123456789', address: '123 Main St, West Richland', value: 450000, sqft: 2400 },
        { parcel: 'R123456790', address: '456 Oak Ave, West Richland', value: 380000, sqft: 2100 },
        { parcel: 'R123456791', address: '789 Pine Rd, West Richland', value: 525000, sqft: 2800 },
        { parcel: 'R123456792', address: '321 Elm St, West Richland', value: 410000, sqft: 2250 }
      ]);
      setLoading(false);
    }, 500);
  }, []);
  
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Properties...</div>;
  }
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#0099ff' }}>Property Valuation</h1>
      <p style={{ color: '#666' }}>Intent: """ + intent + """</p>
      <p style={{ color: '#666' }}>Role: """ + user_role + """</p>
      
      <div style={{ marginTop: '20px' }}>
        <h3>West Richland Properties ({properties.length})</h3>
        {properties.map(prop => (
          <div key={prop.parcel} style={{ 
            marginTop: '15px', 
            padding: '15px', 
            background: 'white', 
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{prop.address}</div>
            <div style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
              Parcel: {prop.parcel}
            </div>
            <div style={{ marginTop: '10px' }}>
              <span style={{ fontSize: '20px', color: 'green', fontWeight: 'bold' }}>
                ${prop.value.toLocaleString()}
              </span>
              <span style={{ marginLeft: '20px', color: '#666' }}>
                {prop.sqft.toLocaleString()} sq ft
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#fffbcc', borderRadius: '4px' }}>
        <strong>🚀 Week 2 Template Component</strong>
      </div>
    </div>
  );
};

export default PropertyValuation;
"""
    
    return component_code, component_name

def generate_dashboard_component(intent: str, user_role: str, context: Dict[str, Any]) -> tuple[str, str]:
    """Generate generic dashboard component"""
    component_name = "Dashboard"
    
    component_code = """
import React from 'react';

const Dashboard = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#0099ff' }}>Dashboard</h1>
      <p style={{ color: '#666' }}>Intent: """ + intent + """</p>
      <p style={{ color: '#666' }}>Role: """ + user_role + """</p>
      
      <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div style={{ padding: '20px', background: '#f0f8ff', borderRadius: '8px' }}>
          <h3>Metric 1</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0099ff' }}>1,234</div>
        </div>
        <div style={{ padding: '20px', background: '#f0fff0', borderRadius: '8px' }}>
          <h3>Metric 2</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#00cc66' }}>5,678</div>
        </div>
        <div style={{ padding: '20px', background: '#fff0f0', borderRadius: '8px' }}>
          <h3>Metric 3</h3>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6666' }}>9,012</div>
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#fffbcc', borderRadius: '4px' }}>
        <strong>🚀 Week 2 Template Component</strong>
      </div>
    </div>
  );
};

export default Dashboard;
"""
    
    return component_code, component_name

def generate_default_component(intent: str, user_role: str, context: Dict[str, Any]) -> tuple[str, str]:
    """Generate default component for unrecognized intents"""
    component_name = "GeneratedComponent"
    
    component_code = """
import React from 'react';

const GeneratedComponent = () => {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#0099ff' }}>TerraFusion Component</h1>
      <p style={{ color: '#666' }}>Intent: """ + intent + """</p>
      <p style={{ color: '#666' }}>Role: """ + user_role + """</p>
      
      <div style={{ marginTop: '30px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Component Generated Successfully</h2>
        <p>This is a template component generated by TerraFusion AI.</p>
        <p>Week 3 will add full AI-powered component generation based on your intent.</p>
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', background: '#fffbcc', borderRadius: '4px' }}>
        <strong>🚀 Week 2 Template Component</strong>
      </div>
    </div>
  );
};

export default GeneratedComponent;
"""
    
    return component_code, component_name

@app.route('/api/generation-history', methods=['GET'])
def get_generation_history():
    """Get recent generation history (for debugging)"""
    return jsonify({
        'history': generation_history,
        'count': len(generation_history)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting TerraFusion Component Generator API on port {port}")
    logger.info(f"AI Generator Available: {HAS_AI_GENERATOR}")
    app.run(host='0.0.0.0', port=port, debug=False)  # Disable debug mode for Week 2
