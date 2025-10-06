#!/usr/bin/env python3
"""
TerraFusion Component Generator API - SIMPLIFIED VERSION
Week 2 Day 8-10: Template-based component generation
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('ComponentGeneratorAPI')

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'TerraFusion Component Generator API',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/generate-component', methods=['POST'])
def generate_component():
    try:
        data = request.get_json()
        intent = data.get('intent', '')
        user_role = data.get('user_role', 'user')
        
        start = datetime.now()
        
        # Simple template generation
        component_name = "GeneratedComponent"
        component_code = """import React from 'react';

const GeneratedComponent = () => {
  return (
    <div style={{padding: '40px', fontFamily: 'Arial'}}>
      <h1 style={{color: '#0099ff'}}>TerraFusion Component</h1>
      <div style={{marginTop: '20px', padding: '20px', background: '#f5f5f5'}}>
        <h2>Component Generated Successfully</h2>
        <p><strong>Intent:</strong> %INTENT%</p>
        <p><strong>Role:</strong> %ROLE%</p>
      </div>
      <div style={{marginTop: '20px', padding: '10px', background: '#fffbcc'}}>
        <strong>🚀 Week 2 Template Component</strong>
      </div>
    </div>
  );
};

export default GeneratedComponent;
""".replace('%INTENT%', intent).replace('%ROLE%', user_role)
        
        generation_time_ms = int((datetime.now() - start).total_seconds() * 1000)
        
        logger.info(f"Generated {component_name} in {generation_time_ms}ms")
        
        return jsonify({
            'success': True,
            'component_code': component_code,
            'component_name': component_name,
            'timestamp': datetime.now().isoformat(),
            'generation_time_ms': generation_time_ms
        })
        
    except Exception as e:
        logger.error(f"Generation failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"Starting TerraFusion Component Generator API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
