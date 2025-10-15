#!/usr/bin/env python3

from flask import Flask, render_template_string, jsonify, request
import json
from datetime import datetime
from ai_training_system import TerraFusionAITrainingSystem, TrainingConfig

app = Flask(__name__)
app.secret_key = "terrafusion-ai-training-secret"

# Initialize training system
training_system = TerraFusionAITrainingSystem()

@app.route('/')
def dashboard():
    """AI Training Dashboard"""
    return render_template_string('''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>TerraFusion AI Training System</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 1400px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; }
            .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .status-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .metric { padding: 15px; border-left: 4px solid #007bff; background: #f8f9fa; margin: 10px 0; }
            .btn { padding: 10px 20px; margin: 5px; border: none; border-radius: 4px; cursor: pointer; }
            .btn-primary { background: #007bff; color: white; }
            .btn-success { background: #28a745; color: white; }
            .btn-warning { background: #ffc107; color: black; }
            .btn-danger { background: #dc3545; color: white; }
            .status-ok { color: #28a745; }
            .status-warning { color: #ffc107; }
            .status-error { color: #dc3545; }
            .training-log { background: #000; color: #0f0; padding: 15px; border-radius: 4px; font-family: monospace; height: 300px; overflow-y: auto; }
            .model-card { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px; }
            .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; }
            .progress-fill { height: 100%; background: linear-gradient(90deg, #007bff, #28a745); transition: width 0.3s; }
            .feedback-form { background: #e3f2fd; padding: 15px; border-radius: 4px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🤖 TerraFusion AI Training System</h1>
                <p>Advanced Machine Learning & Agent Training Platform</p>
            </div>
            
            <div class="status-grid">
                <div class="card">
                    <h3>🎯 System Status</h3>
                    <div id="system-status">
                        <div class="metric">
                            <strong>Training Status:</strong> <span id="training-status">Loading...</span>
                        </div>
                        <div class="metric">
                            <strong>Auto-Training:</strong> <span id="auto-training-status">Loading...</span>
                        </div>
                        <div class="metric">
                            <strong>Active Models:</strong> <span id="active-models-count">Loading...</span>
                        </div>
                        <div class="metric">
                            <strong>Pending Feedback:</strong> <span id="pending-feedback">Loading...</span>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>🚀 Training Controls</h3>
                    <button class="btn btn-primary" onclick="trainValuationModel()">Train Valuation Model</button>
                    <button class="btn btn-success" onclick="trainRAGEmbeddings()">Update RAG Embeddings</button>
                    <button class="btn btn-warning" onclick="processFeedback()">Process Feedback</button>
                    <button class="btn btn-danger" onclick="toggleAutoTraining()">Toggle Auto-Training</button>
                </div>
            </div>
            
            <div class="card">
                <h3>📊 Active Models</h3>
                <div id="active-models">
                    Loading models...
                </div>
            </div>
            
            <div class="card">
                <h3>📈 Training Progress</h3>
                <div class="progress-bar">
                    <div class="progress-fill" id="training-progress" style="width: 0%"></div>
                </div>
                <div class="training-log" id="training-log">
                    TerraFusion AI Training System initialized...
                    Waiting for training commands...
                </div>
            </div>
            
            <div class="card">
                <h3>💬 Feedback System</h3>
                <div class="feedback-form">
                    <h4>Add Training Feedback</h4>
                    <form onsubmit="submitFeedback(event)">
                        <div style="margin: 10px 0;">
                            <label>Query:</label><br>
                            <textarea id="feedback-query" rows="2" style="width: 100%; padding: 5px;"></textarea>
                        </div>
                        <div style="margin: 10px 0;">
                            <label>Response:</label><br>
                            <textarea id="feedback-response" rows="2" style="width: 100%; padding: 5px;"></textarea>
                        </div>
                        <div style="margin: 10px 0;">
                            <label>Rating (1-5):</label>
                            <select id="feedback-rating" style="padding: 5px;">
                                <option value="">Select rating</option>
                                <option value="1">1 - Very Poor</option>
                                <option value="2">2 - Poor</option>
                                <option value="3">3 - Average</option>
                                <option value="4">4 - Good</option>
                                <option value="5">5 - Excellent</option>
                            </select>
                        </div>
                        <div style="margin: 10px 0;">
                            <label>Correction (optional):</label><br>
                            <textarea id="feedback-correction" rows="2" style="width: 100%; padding: 5px;"></textarea>
                        </div>
                        <div style="margin: 10px 0;">
                            <label>Property ID (optional):</label>
                            <input type="text" id="feedback-property-id" style="padding: 5px;">
                        </div>
                        <button type="submit" class="btn btn-primary">Submit Feedback</button>
                    </form>
                </div>
            </div>
            
            <div class="card">
                <h3>📋 Training Configuration</h3>
                <div id="training-config">
                    Loading configuration...
                </div>
            </div>
        </div>
        
        <script>
            let trainingInProgress = false;
            
            function updateStatus() {
                fetch('/api/status')
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('training-status').innerHTML = 
                            data.is_training ? '<span class="status-warning">Training in Progress</span>' : '<span class="status-ok">Ready</span>';
                        
                        document.getElementById('auto-training-status').innerHTML = 
                            data.auto_training_enabled ? '<span class="status-ok">Enabled</span>' : '<span class="status-error">Disabled</span>';
                        
                        document.getElementById('active-models-count').textContent = data.active_models.length;
                        document.getElementById('pending-feedback').textContent = data.feedback_stats.pending;
                        
                        // Update active models
                        const modelsHtml = data.active_models.map(model => `
                            <div class="model-card">
                                <strong>${model.model_id}</strong> (${model.type})<br>
                                Performance: ${(model.performance * 100).toFixed(1)}%<br>
                                Created: ${model.created_at}
                            </div>
                        `).join('');
                        document.getElementById('active-models').innerHTML = modelsHtml || 'No active models';
                        
                        // Update config
                        const configHtml = Object.entries(data.config).map(([key, value]) => `
                            <div class="metric">
                                <strong>${key}:</strong> ${value}
                            </div>
                        `).join('');
                        document.getElementById('training-config').innerHTML = configHtml;
                    })
                    .catch(error => {
                        console.error('Error updating status:', error);
                    });
            }
            
            function trainValuationModel() {
                if (trainingInProgress) {
                    alert('Training already in progress!');
                    return;
                }
                
                trainingInProgress = true;
                addToLog('Starting valuation model training...');
                updateProgress(10);
                
                fetch('/api/train/valuation', {method: 'POST'})
                    .then(response => response.json())
                    .then(data => {
                        addToLog(`Training completed: ${data.status}`);
                        if (data.status === 'success') {
                            addToLog(`Model ID: ${data.model_id}`);
                            addToLog(`Performance: ${(data.metrics.performance_score * 100).toFixed(1)}%`);
                            updateProgress(100);
                        } else {
                            addToLog(`Error: ${data.message}`);
                            updateProgress(0);
                        }
                        trainingInProgress = false;
                        updateStatus();
                    })
                    .catch(error => {
                        addToLog(`Training failed: ${error}`);
                        updateProgress(0);
                        trainingInProgress = false;
                    });
            }
            
            function trainRAGEmbeddings() {
                addToLog('Updating RAG embeddings...');
                updateProgress(30);
                
                fetch('/api/train/rag', {method: 'POST'})
                    .then(response => response.json())
                    .then(data => {
                        addToLog(`RAG update completed: ${data.status}`);
                        if (data.status === 'success') {
                            addToLog(`Documents processed: ${data.documents_processed}`);
                            addToLog(`Chunks created: ${data.chunks_created}`);
                            updateProgress(100);
                        } else {
                            addToLog(`Error: ${data.message}`);
                            updateProgress(0);
                        }
                        updateStatus();
                    })
                    .catch(error => {
                        addToLog(`RAG update failed: ${error}`);
                        updateProgress(0);
                    });
            }
            
            function processFeedback() {
                addToLog('Processing feedback for continuous learning...');
                updateProgress(50);
                
                fetch('/api/feedback/process', {method: 'POST'})
                    .then(response => response.json())
                    .then(data => {
                        addToLog(`Feedback processing completed: ${data.status}`);
                        if (data.status === 'success') {
                            addToLog(`Processed feedback items: ${data.processed_feedback}`);
                            data.improvements.forEach(improvement => {
                                addToLog(`Improvement: ${improvement}`);
                            });
                            updateProgress(100);
                        } else {
                            addToLog(`Error: ${data.message}`);
                            updateProgress(0);
                        }
                        updateStatus();
                    })
                    .catch(error => {
                        addToLog(`Feedback processing failed: ${error}`);
                        updateProgress(0);
                    });
            }
            
            function toggleAutoTraining() {
                fetch('/api/toggle-auto-training', {method: 'POST'})
                    .then(response => response.json())
                    .then(data => {
                        addToLog(`Auto-training ${data.enabled ? 'enabled' : 'disabled'}`);
                        updateStatus();
                    })
                    .catch(error => {
                        addToLog(`Failed to toggle auto-training: ${error}`);
                    });
            }
            
            function submitFeedback(event) {
                event.preventDefault();
                
                const feedback = {
                    query: document.getElementById('feedback-query').value,
                    response: document.getElementById('feedback-response').value,
                    rating: document.getElementById('feedback-rating').value,
                    correction: document.getElementById('feedback-correction').value,
                    property_id: document.getElementById('feedback-property-id').value,
                    feedback_type: 'user_submitted'
                };
                
                fetch('/api/feedback/add', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(feedback)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        addToLog('Feedback submitted successfully');
                        // Clear form
                        document.getElementById('feedback-query').value = '';
                        document.getElementById('feedback-response').value = '';
                        document.getElementById('feedback-rating').value = '';
                        document.getElementById('feedback-correction').value = '';
                        document.getElementById('feedback-property-id').value = '';
                        updateStatus();
                    } else {
                        addToLog('Failed to submit feedback');
                    }
                })
                .catch(error => {
                    addToLog(`Feedback submission failed: ${error}`);
                });
            }
            
            function addToLog(message) {
                const log = document.getElementById('training-log');
                const timestamp = new Date().toLocaleTimeString();
                log.innerHTML += `\\n[${timestamp}] ${message}`;
                log.scrollTop = log.scrollHeight;
            }
            
            function updateProgress(percent) {
                document.getElementById('training-progress').style.width = `${percent}%`;
                setTimeout(() => {
                    if (percent === 100) {
                        setTimeout(() => {
                            document.getElementById('training-progress').style.width = '0%';
                        }, 2000);
                    }
                }, 100);
            }
            
            // Update status every 10 seconds
            setInterval(updateStatus, 10000);
            
            // Initial status update
            updateStatus();
        </script>
    </body>
    </html>
    ''')

@app.route('/api/status')
def get_status():
    """Get training system status"""
    return jsonify(training_system.get_training_status())

@app.route('/api/train/valuation', methods=['POST'])
def train_valuation():
    """Train valuation model"""
    result = training_system.train_property_valuation_model()
    return jsonify(result)

@app.route('/api/train/rag', methods=['POST'])
def train_rag():
    """Train RAG embeddings"""
    result = training_system.train_rag_embeddings()
    return jsonify(result)

@app.route('/api/feedback/process', methods=['POST'])
def process_feedback():
    """Process feedback for continuous learning"""
    result = training_system.continuous_learning_from_feedback()
    return jsonify(result)

@app.route('/api/feedback/add', methods=['POST'])
def add_feedback():
    """Add feedback"""
    data = request.get_json()
    
    success = training_system.add_feedback(
        query=data.get('query', ''),
        response=data.get('response', ''),
        rating=int(data.get('rating')) if data.get('rating') else None,
        correction=data.get('correction'),
        property_id=data.get('property_id'),
        feedback_type=data.get('feedback_type', 'user_submitted')
    )
    
    return jsonify({"success": success})

@app.route('/api/toggle-auto-training', methods=['POST'])
def toggle_auto_training():
    """Toggle auto-training"""
    training_system.config.enable_auto_training = not training_system.config.enable_auto_training
    return jsonify({"enabled": training_system.config.enable_auto_training})

if __name__ == '__main__':
    print("🤖 TerraFusion AI Training System Starting...")
    print("🌐 Access at: http://localhost:5004")
    print("🎯 Features: Model Training, RAG Updates, Continuous Learning")
    app.run(host='0.0.0.0', port=5004, debug=True) 