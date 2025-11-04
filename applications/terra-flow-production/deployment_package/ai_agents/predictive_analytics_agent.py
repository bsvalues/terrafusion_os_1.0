"""
Predictive Analytics Agent

This agent uses machine learning to analyze historical anomaly data and predict future trends,
focusing on proactive detection of potential issues before they occur.
"""

import os
import logging
import json
import datetime
import time
import numpy as np
import pandas as pd
import threading
import queue
from typing import Dict, List, Any, Optional, Union, Tuple

from app import db
from ai_agents.base_agent import AIAgent

# Import OpenAI for advanced analytics
from openai import OpenAI

# Configure logging
logger = logging.getLogger(__name__)

class PredictiveAnalyticsAgent(AIAgent):
    """
    AI agent that uses machine learning to predict future anomalies based on historical data,
    identifies patterns, and provides early warnings to prevent issues.
    """
    
    def __init__(self, agent_id: str, name: str = None, description: str = None,
                prediction_interval: int = 3600, **kwargs):
        """
        Initialize the Predictive Analytics Agent.
        
        Args:
            agent_id: Unique ID for the agent
            name: Name of the agent
            description: Description of the agent
            prediction_interval: Interval in seconds between predictions (default: 1 hour)
        """
        super().__init__(
            agent_id=agent_id,
            name=name or "PredictiveAnalyticsAgent",
            description=description or "Predicts future anomalies using ML techniques",
            capabilities=["anomaly_prediction", "trend_analysis", "pattern_recognition"]
        )
        
        # Agent configuration
        self.prediction_interval = prediction_interval
        self.last_prediction_time = 0
        self.prediction_thread = None
        self.running = False
        self.agent_type = "predictive_analytics"
        
        # OpenAI client for advanced analytics
        self.openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        
        # Prediction models and data
        self.historical_data = None
        self.prediction_results = []
        
        logger.info(f"Predictive Analytics Agent initialized: {self.name}")
    
    def start(self):
        """Start the agent's background processing"""
        if self.status != "initialized" and self.status != "stopped":
            logger.warning(f"Cannot start agent {self.agent_id} from status {self.status}")
            return
        
        self.running = True
        self.status = "running"
        
        # Start the main agent thread
        self.agent_thread = threading.Thread(target=self._agent_loop)
        self.agent_thread.daemon = True
        self.agent_thread.start()
        
        logger.info(f"Predictive Analytics Agent started: {self.name}")
    
    def stop(self):
        """Stop the agent's background processing"""
        if self.status != "running":
            logger.warning(f"Cannot stop agent {self.agent_id} from status {self.status}")
            return
        
        self.running = False
        if self.agent_thread:
            self.agent_thread.join(timeout=2.0)
        
        self.status = "stopped"
        logger.info(f"Predictive Analytics Agent stopped: {self.name}")
    
    def _agent_loop(self):
        """Main agent processing loop"""
        try:
            while self.running:
                # Process incoming messages
                self._process_messages()
                
                # Run predictions at the specified interval
                current_time = time.time()
                if current_time - self.last_prediction_time >= self.prediction_interval:
                    self._run_predictions()
                    self.last_prediction_time = current_time
                
                # Sleep briefly to prevent CPU overuse
                time.sleep(1.0)
                
        except Exception as e:
            logger.error(f"Error in agent loop for {self.name}: {str(e)}")
            self.status = "error"
    
    def _process_messages(self):
        """Process messages from the message queue"""
        try:
            # Check if there are messages without blocking
            while not self.message_queue.empty():
                message = self.message_queue.get_nowait()
                
                # Handle different message types
                if message.get("type") == "command":
                    self._handle_command(message)
                elif message.get("type") == "predict":
                    self._handle_prediction_request(message)
                elif message.get("type") == "data":
                    self._handle_data_update(message)
                
                # Mark message as processed
                self.message_queue.task_done()
                
        except queue.Empty:
            # No messages in queue
            pass
        except Exception as e:
            logger.error(f"Error processing messages for {self.name}: {str(e)}")
    
    def _handle_command(self, message: Dict[str, Any]):
        """Handle command messages"""
        command = message.get("command")
        
        if command == "predict_now":
            # Trigger immediate prediction
            self._run_predictions()
        elif command == "update_interval":
            # Update prediction interval
            new_interval = message.get("interval")
            if new_interval and isinstance(new_interval, (int, float)) and new_interval > 0:
                self.prediction_interval = new_interval
                logger.info(f"Updated prediction interval to {new_interval} seconds")
    
    def _handle_prediction_request(self, message: Dict[str, Any]):
        """Handle specific prediction request"""
        try:
            request_type = message.get("prediction_type", "general")
            target_entity = message.get("target_entity")
            
            # Perform specific prediction based on request type
            if request_type == "property":
                results = self._predict_property_anomalies(target_entity)
            elif request_type == "area":
                results = self._predict_area_anomalies(target_entity)
            elif request_type == "trend":
                results = self._predict_global_trends()
            else:
                results = self._predict_general_anomalies()
            
            # Send response if callback is provided
            callback_id = message.get("callback_id")
            if callback_id:
                response = {
                    "type": "prediction_result",
                    "callback_id": callback_id,
                    "results": results,
                    "timestamp": time.time()
                }
                self._send_response(message.get("sender"), response)
        
        except Exception as e:
            logger.error(f"Error handling prediction request: {str(e)}")
            # Send error response if callback is provided
            callback_id = message.get("callback_id")
            if callback_id:
                error_response = {
                    "type": "prediction_error",
                    "callback_id": callback_id,
                    "error": str(e),
                    "timestamp": time.time()
                }
                self._send_response(message.get("sender"), error_response)
    
    def _handle_data_update(self, message: Dict[str, Any]):
        """Handle data update messages"""
        data = message.get("data")
        
        if data and message.get("data_type") == "historical_anomalies":
            # Update historical data for predictions
            self._update_historical_data(data)
    
    def _send_response(self, recipient: str, response: Dict[str, Any]):
        """Send response message to another agent"""
        from ai_agents.agent_manager import agent_manager
        if recipient and agent_manager.agent_exists(recipient):
            agent_manager.send_message_to_agent(recipient, response)
    
    def _run_predictions(self):
        """Run prediction algorithms on historical data"""
        try:
            # Fetch recent anomaly data
            anomaly_data = self._fetch_anomaly_data()
            
            if not anomaly_data or len(anomaly_data) < 10:
                logger.info("Insufficient data for meaningful predictions")
                return
            
            # Process anomaly data
            self._update_historical_data(anomaly_data)
            
            # Run prediction analyses
            predictions = self._predict_general_anomalies()
            
            # Store prediction results
            self.prediction_results = predictions
            
            # Generate alerts for high-confidence predictions
            self._generate_prediction_alerts(predictions)
            
            logger.info(f"Completed predictive analysis with {len(predictions)} forecasts")
            
        except Exception as e:
            logger.error(f"Error running predictions: {str(e)}")
    
    def _fetch_anomaly_data(self) -> List[Dict[str, Any]]:
        """Fetch recent anomaly data from the database"""
        try:
            with db.session() as session:
                # Query recent anomalies (last 30 days)
                thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
                
                # Using SQLAlchemy core for more efficient querying
                query = """
                SELECT 
                    id, table_name, field_name, record_id, anomaly_type, 
                    severity, anomaly_score, detected_at, current_value, 
                    previous_value, status, anomaly_details
                FROM data_anomaly
                WHERE detected_at >= :thirty_days_ago
                ORDER BY detected_at DESC
                """
                
                result = session.execute(query, {"thirty_days_ago": thirty_days_ago})
                
                # Convert to list of dictionaries
                anomalies = [dict(row) for row in result.mappings()]
                return anomalies
                
        except Exception as e:
            logger.error(f"Error fetching anomaly data: {str(e)}")
            return []
    
    def _update_historical_data(self, anomaly_data: List[Dict[str, Any]]):
        """Update the agent's historical data with new anomalies"""
        # Convert to DataFrame for easier analysis
        df = pd.DataFrame(anomaly_data)
        
        # Save the data
        self.historical_data = df
    
    def _predict_general_anomalies(self) -> List[Dict[str, Any]]:
        """
        Predict general anomalies across all data.
        Returns list of prediction objects.
        """
        # If no historical data, return empty predictions
        if self.historical_data is None or len(self.historical_data) < 10:
            return []
        
        predictions = []
        try:
            # Group by table and field to look for patterns
            grouped = self.historical_data.groupby(['table_name', 'field_name'])
            
            for (table, field), group in grouped:
                if len(group) < 5:
                    continue  # Skip groups with too few samples
                
                # Calculate frequency (anomalies per day)
                min_date = group['detected_at'].min()
                max_date = group['detected_at'].max()
                days_range = max(1, (max_date - min_date).total_seconds() / 86400)
                frequency = len(group) / days_range
                
                # If frequency is increasing, this is a potential issue
                # We'll use OpenAI to analyze the pattern
                if len(group) >= 10 and frequency > 0.5:  # At least 10 samples and 1 anomaly every 2 days
                    prediction = self._analyze_anomaly_pattern(table, field, group)
                    if prediction:
                        predictions.append(prediction)
        
        except Exception as e:
            logger.error(f"Error in general anomaly prediction: {str(e)}")
        
        return predictions
    
    def _predict_property_anomalies(self, property_id: str) -> List[Dict[str, Any]]:
        """
        Predict anomalies for a specific property.
        Returns list of prediction objects.
        """
        if not property_id or self.historical_data is None:
            return []
        
        predictions = []
        try:
            # Filter data for the specific property
            property_data = self.historical_data[self.historical_data['record_id'] == property_id]
            
            if len(property_data) < 3:
                return []  # Not enough data for this property
            
            # Analyze property-specific patterns
            grouped = property_data.groupby(['field_name'])
            
            for field, group in grouped:
                # For properties with recurring issues, predict future occurrences
                if len(group) >= 3:  # At least 3 anomalies in history
                    prediction = self._analyze_property_pattern(property_id, field, group)
                    if prediction:
                        predictions.append(prediction)
        
        except Exception as e:
            logger.error(f"Error in property anomaly prediction: {str(e)}")
        
        return predictions
    
    def _predict_area_anomalies(self, area_code: str) -> List[Dict[str, Any]]:
        """
        Predict anomalies for a specific geographic area.
        Returns list of prediction objects.
        """
        if not area_code or self.historical_data is None:
            return []
        
        # This would require geographic data about properties
        # For now, return empty predictions
        return []
    
    def _predict_global_trends(self) -> Dict[str, Any]:
        """
        Predict global anomaly trends across the dataset.
        Returns trend analysis results.
        """
        if self.historical_data is None or len(self.historical_data) < 20:
            return {"status": "insufficient_data"}
        
        try:
            df = self.historical_data
            
            # Group by day to see trends over time
            df['date'] = pd.to_datetime(df['detected_at']).dt.date
            daily_counts = df.groupby('date').size()
            
            # Calculate 7-day rolling average
            rolling_avg = daily_counts.rolling(window=7, min_periods=1).mean()
            
            # Check if trend is increasing
            trend_increasing = rolling_avg.iloc[-1] > rolling_avg.iloc[-8] if len(rolling_avg) >= 8 else False
            
            # Get most common anomaly types
            common_types = df['anomaly_type'].value_counts().head(3).to_dict()
            
            # Get most affected tables
            affected_tables = df['table_name'].value_counts().head(3).to_dict()
            
            return {
                "status": "success",
                "trend_increasing": trend_increasing,
                "avg_daily_anomalies": rolling_avg.iloc[-1] if not rolling_avg.empty else 0,
                "common_anomaly_types": common_types,
                "most_affected_tables": affected_tables
            }
            
        except Exception as e:
            logger.error(f"Error in global trend prediction: {str(e)}")
            return {"status": "error", "message": str(e)}
    
    def _analyze_anomaly_pattern(self, table: str, field: str, group: pd.DataFrame) -> Optional[Dict[str, Any]]:
        """
        Use OpenAI to analyze anomaly patterns and predict future occurrences.
        Returns a prediction object if confident, otherwise None.
        """
        try:
            # Prepare data for analysis
            anomaly_data = group.sort_values('detected_at').to_dict('records')
            
            # Simplified data for the OpenAI prompt
            simplified_data = []
            for anomaly in anomaly_data[-10:]:  # Use last 10 anomalies max
                simplified_data.append({
                    "date": anomaly['detected_at'].isoformat() if isinstance(anomaly['detected_at'], datetime.datetime) else anomaly['detected_at'],
                    "type": anomaly['anomaly_type'],
                    "severity": anomaly['severity'],
                    "score": float(anomaly['anomaly_score']) if anomaly['anomaly_score'] is not None else None,
                    "current_value": anomaly['current_value'],
                    "previous_value": anomaly['previous_value']
                })
            
            # Create prompt for OpenAI
            prompt = f"""
            Analyze this time series of data anomalies for the table '{table}', field '{field}':
            {json.dumps(simplified_data, indent=2)}

            Provide the following analysis as a JSON object:
            1. Is there a pattern in when these anomalies occur?
            2. What's the most likely cause of these anomalies?
            3. What is the probability (0-1) we'll see another anomaly in this field in the next 7 days?
            4. What actions would you recommend to prevent future anomalies?

            Format your response as a JSON object with these keys: pattern_detected, likely_cause, future_probability, recommended_actions
            """
            
            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024
                messages=[
                    {"role": "system", "content": "You are an expert data analyst specializing in anomaly detection and prediction."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            analysis = json.loads(response.choices[0].message.content)
            
            # Only create a prediction if the probability is high enough
            if analysis.get('future_probability', 0) >= 0.6:
                # Create prediction object
                prediction = {
                    "prediction_id": f"pred_{int(time.time())}_{table}_{field}",
                    "table_name": table,
                    "field_name": field,
                    "prediction_type": "pattern",
                    "confidence": analysis.get('future_probability'),
                    "predicted_timeframe": "7_days",
                    "details": {
                        "pattern_detected": analysis.get('pattern_detected'),
                        "likely_cause": analysis.get('likely_cause'),
                        "recommended_actions": analysis.get('recommended_actions')
                    },
                    "created_at": datetime.datetime.utcnow().isoformat()
                }
                return prediction
            
            return None
            
        except Exception as e:
            logger.error(f"Error analyzing anomaly pattern: {str(e)}")
            return None
    
    def _analyze_property_pattern(self, property_id: str, field: str, group: pd.DataFrame) -> Optional[Dict[str, Any]]:
        """
        Analyze patterns for a specific property and field.
        Returns a prediction object if confident, otherwise None.
        """
        try:
            # For simplicity, use a basic frequency-based prediction
            # In a full implementation, this would use more sophisticated time series analysis
            
            # Sort by detection time
            sorted_anomalies = group.sort_values('detected_at')
            
            # Get time intervals between anomalies
            if len(sorted_anomalies) >= 3:
                times = sorted_anomalies['detected_at'].tolist()
                intervals = []
                
                for i in range(1, len(times)):
                    if isinstance(times[i], datetime.datetime) and isinstance(times[i-1], datetime.datetime):
                        interval = (times[i] - times[i-1]).total_seconds() / 86400  # in days
                        intervals.append(interval)
                
                # If we have consistent intervals, we can predict the next occurrence
                if intervals and len(intervals) >= 2:
                    avg_interval = sum(intervals) / len(intervals)
                    std_interval = np.std(intervals) if len(intervals) > 1 else 0
                    
                    # Only predict if intervals are consistent (low standard deviation)
                    if avg_interval > 0 and (std_interval / avg_interval < 0.5 or std_interval < 2):
                        last_time = times[-1]
                        if isinstance(last_time, datetime.datetime):
                            next_predicted = last_time + datetime.timedelta(days=avg_interval)
                            
                            # Create prediction object
                            prediction = {
                                "prediction_id": f"pred_{int(time.time())}_{property_id}_{field}",
                                "property_id": property_id,
                                "field_name": field,
                                "prediction_type": "property_recurrence",
                                "confidence": max(0.5, 1 - (std_interval / avg_interval) if avg_interval > 0 else 0),
                                "predicted_date": next_predicted.isoformat(),
                                "details": {
                                    "average_interval_days": avg_interval,
                                    "interval_consistency": 1 - (std_interval / avg_interval) if avg_interval > 0 else 0,
                                    "historical_anomaly_count": len(sorted_anomalies)
                                },
                                "created_at": datetime.datetime.utcnow().isoformat()
                            }
                            return prediction
            
            return None
            
        except Exception as e:
            logger.error(f"Error analyzing property pattern: {str(e)}")
            return None
    
    def _generate_prediction_alerts(self, predictions: List[Dict[str, Any]]):
        """Generate alerts for high-confidence predictions"""
        high_confidence_predictions = [p for p in predictions if p.get('confidence', 0) >= 0.75]
        
        if not high_confidence_predictions:
            return
        
        try:
            # Insert alerts into database
            with db.session() as session:
                for prediction in high_confidence_predictions:
                    # Create alert record
                    alert_data = {
                        "alert_type": "prediction",
                        "severity": "medium",  # Default severity for predictions
                        "title": f"Predicted anomaly in {prediction.get('table_name', 'unknown')}.{prediction.get('field_name', 'unknown')}",
                        "description": f"High confidence prediction ({prediction.get('confidence', 0):.2f}) of upcoming anomaly based on historical patterns.",
                        "details": json.dumps(prediction),
                        "created_at": datetime.datetime.utcnow(),
                        "status": "open"
                    }
                    
                    # Insert into appropriate alerts table
                    session.execute(
                        """
                        INSERT INTO data_quality_alert 
                        (alert_type, severity, title, description, details, created_at, status)
                        VALUES 
                        (:alert_type, :severity, :title, :description, :details, :created_at, :status)
                        """,
                        alert_data
                    )
                
                session.commit()
                
                logger.info(f"Generated {len(high_confidence_predictions)} prediction alerts")
                
        except Exception as e:
            logger.error(f"Error generating prediction alerts: {str(e)}")
    
    def get_recent_predictions(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get the most recent predictions made by the agent.
        
        Args:
            limit: Maximum number of predictions to return
            
        Returns:
            List of recent prediction objects
        """
        return self.prediction_results[-limit:] if self.prediction_results else []