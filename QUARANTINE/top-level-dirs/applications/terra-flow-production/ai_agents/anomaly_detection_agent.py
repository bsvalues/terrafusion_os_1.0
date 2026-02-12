"""
Anomaly Detection Agent Module

This module provides an AI agent for detecting and classifying anomalies
in property assessment data.
"""

import os
import json
import logging
import datetime
import time
import uuid
from typing import Dict, List, Any, Optional, Tuple, Union

# Placeholder imports until all scientific libraries are installed
pd = None
np = None
sm = None
IsolationForest = None
LocalOutlierFactor = None
DBSCAN = None
StandardScaler = None
joblib = None
text = None
    
# Import common MCP agent base
from mcp.agents.base_agent import BaseAgent
# Safely import models
try:
    from models import Anomaly, AnomalyType, Property, Assessment
except ImportError:
    # Create placeholder classes for development/testing
    class Anomaly:
        pass
    class AnomalyType:
        pass
    class Property:
        pass
    class Assessment:
        pass

from app import db
from rag_functions import analyze_anomaly, suggest_anomaly_action

# Configure logging
logger = logging.getLogger(__name__)

class AnomalyDetectionAgent(BaseAgent):
    """
    Agent responsible for detecting anomalies in property data.
    This agent uses statistical methods and machine learning to identify
    potential data quality issues or unusual patterns in property assessment data.
    """
    
    def __init__(self, agent_id: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the anomaly detection agent.
        
        Args:
            agent_id: Optional unique identifier for this agent instance
            config: Optional configuration parameters
        """
        super().__init__()
        
        self.agent_id = agent_id or str(uuid.uuid4())[:8]
        self.config = config or {}
        self.name = "AnomalyDetectionAgent"
        self.description = "Detects and classifies anomalies in property assessment data"
        self.capabilities = [
            "anomaly_detection",
            "outlier_detection",
            "data_validation",
            "trend_analysis",
            "pattern_recognition",
            "anomaly_classification"
        ]
        
        # Models and configuration
        self.models = {}
        self.detection_thresholds = {
            "zscore": 3.0,                   # Z-score threshold for statistical outliers
            "isolation_forest": 0.1,         # Contamination parameter for IsolationForest
            "lof": 0.1,                      # Contamination parameter for LocalOutlierFactor
            "dbscan_eps": 0.5,               # DBSCAN epsilon parameter
            "dbscan_min_samples": 5,         # DBSCAN minimum samples parameter
            "value_change_percent": 20.0     # Percent change threshold for value changes
        }
        
        # Load custom thresholds from config if provided
        if "detection_thresholds" in self.config:
            self.detection_thresholds.update(self.config["detection_thresholds"])
        
        # Tracking and performance metrics
        self.last_detection_run = None
        self.detection_stats = {
            "total_anomalies_detected": 0,
            "false_positives": 0,
            "true_positives": 0,
            "detection_runs": 0
        }
        
        # Status tracking
        self.status = "initialized"
        self.last_activity = time.time()
    
    def get_agent_info(self) -> Dict[str, Any]:
        """
        Get information about this agent.
        
        Returns:
            Dict containing agent metadata
        """
        return {
            "id": self.agent_id,
            "name": self.name,
            "description": self.description,
            "capabilities": self.capabilities,
            "status": self.status,
            "last_activity": self.last_activity,
            "last_detection_run": self.last_detection_run,
            "detection_stats": self.detection_stats
        }
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process an anomaly detection task.
        
        Args:
            task_data: Dictionary containing task parameters
            
        Returns:
            Dict with task results
        """
        self.last_activity = time.time()
        
        if not task_data or "task_type" not in task_data:
            return {"error": "Invalid task data, missing task_type"}
            
        task_type = task_data.get("task_type")
        
        try:
            if task_type == "detect_anomalies":
                return self.detect_anomalies(task_data)
            elif task_type == "train_models":
                return self.train_detection_models(task_data)
            elif task_type == "classify_anomaly":
                return self.classify_anomaly(task_data)
            elif task_type == "suggest_action":
                return self.suggest_action(task_data)
            elif task_type == "validate_property_data":
                return self.validate_property_data(task_data)
            elif task_type == "analyze_trends":
                return self.analyze_trends(task_data)
            elif task_type == "agent_status":
                return self.get_agent_info()
            else:
                return {"error": f"Unsupported task type: {task_type}"}
        except Exception as e:
            logger.error(f"Error processing task: {str(e)}")
            return {"error": f"Error processing task: {str(e)}"}
    
    def detect_anomalies(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Detect anomalies in property assessment data.
        
        Args:
            task_data: Dictionary with detection parameters including:
                - method: Detection method to use
                - property_type: Optional filter for property type
                - area: Optional geographical area filter
                - max_anomalies: Maximum number of anomalies to return
                
        Returns:
            Dict with detected anomalies
        """
        self.status = "detecting_anomalies"
        start_time = time.time()
        
        # Extract parameters
        method = task_data.get("method", "combined")
        property_type = task_data.get("property_type")
        area = task_data.get("area")
        max_anomalies = task_data.get("max_anomalies", 100)
        
        detection_methods = {
            "statistical": self._detect_statistical_anomalies,
            "isolation_forest": self._detect_isolation_forest_anomalies,
            "lof": self._detect_lof_anomalies,
            "dbscan": self._detect_dbscan_anomalies,
            "value_change": self._detect_value_change_anomalies,
            "combined": self._detect_combined_anomalies
        }
        
        if method not in detection_methods:
            return {"error": f"Unknown detection method: {method}"}
        
        # Get the data from database
        try:
            # Use raw SQL for more complex queries
            data = self._fetch_property_data(property_type, area)
            
            if not data or len(data) == 0:
                return {"error": "No property data available for anomaly detection"}
            
            # Call the appropriate detection method
            detection_func = detection_methods[method]
            anomalies = detection_func(data)
            
            # Limit the number of anomalies returned
            anomalies = anomalies[:max_anomalies]
            
            # Save detected anomalies to database
            saved_anomalies = self._save_anomalies(anomalies)
            
            # Update statistics
            self.detection_stats["detection_runs"] += 1
            self.detection_stats["total_anomalies_detected"] += len(saved_anomalies)
            self.last_detection_run = datetime.datetime.utcnow().isoformat()
            
            processing_time = time.time() - start_time
            self.status = "idle"
            
            return {
                "status": "success",
                "method": method,
                "anomalies_detected": len(saved_anomalies),
                "anomalies": saved_anomalies,
                "processing_time": processing_time
            }
            
        except Exception as e:
            self.status = "error"
            logger.error(f"Error detecting anomalies: {str(e)}")
            return {"error": f"Error detecting anomalies: {str(e)}"}
    
    def _fetch_property_data(self, property_type=None, area=None):
        """
        Fetch property and assessment data from the database.
        
        Args:
            property_type: Optional property type filter
            area: Optional geographical area filter
            
        Returns:
            DataFrame with property data
        """
        if pd is None:
            raise ImportError("pandas is required for anomaly detection")
        
        # Build query conditions
        conditions = []
        params = {}
        
        if property_type:
            conditions.append("p.property_type = :property_type")
            params["property_type"] = property_type
            
        if area:
            # Assuming 'area' is a GeoJSON polygon for spatial filtering
            conditions.append("ST_Contains(ST_GeomFromGeoJSON(:area), p.location)")
            params["area"] = json.dumps(area)
        
        # Construct the WHERE clause
        where_clause = " AND ".join(conditions)
        if where_clause:
            where_clause = "WHERE " + where_clause
        
        # SQL query joining properties and their latest assessments
        query = f"""
        SELECT 
            p.id, p.parcel_id, p.address, p.city, p.state, p.zip_code, p.property_type,
            p.lot_size, p.year_built, p.bedrooms, p.bathrooms, p.total_area,
            p.owner_name, p.purchase_date, p.purchase_price,
            a.assessment_date, a.land_value, a.improvement_value, a.total_value,
            a.assessment_year, a.status as assessment_status
        FROM 
            properties p
        LEFT JOIN (
            SELECT 
                a1.*
            FROM 
                assessments a1
            INNER JOIN (
                SELECT 
                    property_id, MAX(assessment_date) as max_date
                FROM 
                    assessments
                GROUP BY 
                    property_id
            ) a2 ON a1.property_id = a2.property_id AND a1.assessment_date = a2.max_date
        ) a ON p.id = a.property_id
        {where_clause}
        ORDER BY p.id
        """
        
        try:
            # Use pandas to read SQL directly
            with db.engine.connect() as connection:
                data = pd.read_sql(query, connection, params=params)
            return data
        except Exception as e:
            logger.error(f"Error fetching property data: {str(e)}")
            raise
    
    def _detect_statistical_anomalies(self, data) -> List[Dict[str, Any]]:
        """
        Detect anomalies using statistical methods (z-score).
        
        Args:
            data: DataFrame with property data
            
        Returns:
            List of detected anomalies
        """
        if np is None or pd is None:
            raise ImportError("numpy and pandas are required for statistical anomaly detection")
        
        anomalies = []
        z_threshold = self.detection_thresholds["zscore"]
        
        # Analyze numerical columns for outliers
        numerical_cols = [
            'lot_size', 'year_built', 'bedrooms', 'bathrooms', 'total_area',
            'purchase_price', 'land_value', 'improvement_value', 'total_value'
        ]
        
        # Only use columns that exist in the data
        numerical_cols = [col for col in numerical_cols if col in data.columns]
        
        # Filter to only rows with values in key columns
        data_filtered = data.dropna(subset=['total_value', 'property_type'])
        
        # Process each property type separately to find contextual anomalies
        for prop_type in data_filtered['property_type'].unique():
            type_data = data_filtered[data_filtered['property_type'] == prop_type]
            
            if len(type_data) < 10:  # Skip if we don't have enough data
                continue
                
            for col in numerical_cols:
                try:
                    # Skip columns with too many missing values
                    if type_data[col].isna().sum() > 0.5 * len(type_data):
                        continue
                        
                    # Create a copy to avoid warning
                    type_subset = type_data.copy()
                    
                    # Calculate z-scores (ignoring nulls)
                    mean_val = type_subset[col].mean()
                    std_val = type_subset[col].std()
                    
                    if std_val == 0:  # Skip if standard deviation is zero
                        continue
                        
                    type_subset['z_score'] = (type_subset[col] - mean_val) / std_val
                    
                    # Find outliers
                    outliers = type_subset[np.abs(type_subset['z_score']) > z_threshold]
                    
                    # Create anomaly records
                    for _, row in outliers.iterrows():
                        anomaly = {
                            'property_id': str(row['id']),
                            'anomaly_type': 'statistical_outlier',
                            'description': f"{col} is {row['z_score']:.2f} standard deviations from the mean for {prop_type} properties",
                            'severity': 'medium' if abs(row['z_score']) < z_threshold * 1.5 else 'high',
                            'detection_method': 'z_score',
                            'detection_date': datetime.datetime.utcnow().isoformat(),
                            'affected_value': float(row[col]),
                            'expected_range': {
                                'min': float(mean_val - z_threshold * std_val),
                                'max': float(mean_val + z_threshold * std_val)
                            },
                            'z_score': float(row['z_score']),
                            'metadata': {
                                'property_type': prop_type,
                                'attribute': col,
                                'mean': float(mean_val),
                                'std_dev': float(std_val)
                            }
                        }
                        anomalies.append(anomaly)
                except Exception as e:
                    logger.warning(f"Error calculating z-scores for {col}: {str(e)}")
        
        return anomalies
    
    def _detect_isolation_forest_anomalies(self, data) -> List[Dict[str, Any]]:
        """
        Detect anomalies using Isolation Forest algorithm.
        
        Args:
            data: DataFrame with property data
            
        Returns:
            List of detected anomalies
        """
        if np is None or pd is None:
            raise ImportError("numpy, pandas, and sklearn are required for isolation forest")
        
        anomalies = []
        contamination = self.detection_thresholds["isolation_forest"]
        
        # Features to use for anomaly detection
        feature_cols = [
            'lot_size', 'year_built', 'bedrooms', 'bathrooms', 'total_area',
            'land_value', 'improvement_value', 'total_value'
        ]
        
        # Only use columns that exist in the data
        feature_cols = [col for col in feature_cols if col in data.columns]
        
        if not feature_cols:
            return []  # No usable features
            
        # Process each property type separately
        for prop_type in data['property_type'].unique():
            try:
                type_data = data[data['property_type'] == prop_type].copy()
                
                if len(type_data) < 20:  # Skip if we don't have enough data
                    continue
                
                # Prepare features, dropping rows with missing values
                X = type_data[feature_cols].dropna()
                if len(X) < 20:
                    continue
                    
                # Save index mapping to recover property information later
                index_map = X.index
                
                # Scale the features
                scaler = StandardScaler()
                X_scaled = scaler.fit_transform(X)
                
                # Train Isolation Forest
                clf = IsolationForest(
                    contamination=contamination,
                    n_estimators=100,
                    random_state=42
                )
                
                # Fit and predict
                y_pred = clf.fit_predict(X_scaled)
                
                # Find anomalies (where prediction is -1)
                anomaly_indices = np.where(y_pred == -1)[0]
                
                # Get anomaly scores (negative of decision function)
                scores = -clf.decision_function(X_scaled)
                
                # Create anomaly records
                for idx in anomaly_indices:
                    orig_idx = index_map[idx]
                    row = type_data.loc[orig_idx]
                    
                    # Calculate which features contributed most to the anomaly
                    feature_contribs = {}
                    for i, col in enumerate(feature_cols):
                        if pd.isna(row[col]):
                            continue
                        
                        # Calculate z-score of this feature to estimate contribution
                        mean_val = type_data[col].mean()
                        std_val = type_data[col].std()
                        
                        if std_val > 0:
                            z = abs((row[col] - mean_val) / std_val)
                            feature_contribs[col] = float(z)
                    
                    # Sort features by contribution
                    sorted_contribs = sorted(
                        feature_contribs.items(), 
                        key=lambda x: x[1], 
                        reverse=True
                    )
                    
                    # Describe the top contributors
                    if sorted_contribs:
                        top_features = sorted_contribs[:3]
                        feature_desc = ", ".join(
                            [f"{col} ({val:.2f} std)" for col, val in top_features]
                        )
                        description = f"Unusual combination of values detected for {prop_type} property. Unusual features: {feature_desc}"
                    else:
                        description = f"Unusual combination of values detected for {prop_type} property"
                    
                    anomaly = {
                        'property_id': str(row['id']),
                        'anomaly_type': 'multivariate_outlier',
                        'description': description,
                        'severity': 'high' if scores[idx] > 0.8 else 'medium',
                        'detection_method': 'isolation_forest',
                        'detection_date': datetime.datetime.utcnow().isoformat(),
                        'anomaly_score': float(scores[idx]),
                        'metadata': {
                            'property_type': prop_type,
                            'feature_contributions': dict(sorted_contribs),
                            'model_config': {
                                'contamination': contamination,
                                'n_estimators': 100
                            }
                        }
                    }
                    anomalies.append(anomaly)
            
            except Exception as e:
                logger.warning(f"Error in isolation forest for {prop_type}: {str(e)}")
        
        return anomalies
    
    def _detect_lof_anomalies(self, data) -> List[Dict[str, Any]]:
        """
        Detect anomalies using Local Outlier Factor algorithm.
        
        Args:
            data: DataFrame with property data
            
        Returns:
            List of detected anomalies
        """
        # Implementation similar to isolation forest but using LOF
        # Would be implemented similarly to _detect_isolation_forest_anomalies
        return []  # Placeholder for actual implementation
    
    def _detect_dbscan_anomalies(self, data) -> List[Dict[str, Any]]:
        """
        Detect anomalies using DBSCAN clustering.
        
        Args:
            data: DataFrame with property data
            
        Returns:
            List of detected anomalies
        """
        # Implementation using DBSCAN to find outliers
        # Would be implemented similarly to isolation forest but using DBSCAN
        return []  # Placeholder for actual implementation
    
    def _detect_value_change_anomalies(self, data) -> List[Dict[str, Any]]:
        """
        Detect anomalies based on significant changes in property values.
        
        Args:
            data: DataFrame with property data
            
        Returns:
            List of detected anomalies
        """
        if pd is None:
            raise ImportError("pandas is required for value change detection")
        
        anomalies = []
        change_threshold = self.detection_thresholds["value_change_percent"]
        
        try:
            # This requires assessment history data, so we need a different query
            # For each property, we need to get the current and previous assessment
            with db.engine.connect() as connection:
                query = """
                WITH RankedAssessments AS (
                    SELECT 
                        a.*,
                        p.property_type,
                        ROW_NUMBER() OVER (PARTITION BY a.property_id ORDER BY a.assessment_date DESC) as row_num
                    FROM 
                        assessments a
                    JOIN 
                        properties p ON a.property_id = p.id
                )
                SELECT 
                    r1.property_id, 
                    r1.assessment_date as current_date,
                    r1.total_value as current_value,
                    r2.assessment_date as previous_date,
                    r2.total_value as previous_value,
                    r1.property_type
                FROM 
                    RankedAssessments r1
                LEFT JOIN 
                    RankedAssessments r2 ON r1.property_id = r2.property_id AND r2.row_num = 2
                WHERE 
                    r1.row_num = 1
                AND 
                    r2.assessment_date IS NOT NULL  -- Ensure there is a previous assessment
                """
                
                assessment_changes = pd.read_sql(query, connection)
            
            if len(assessment_changes) == 0:
                return []
                
            # Calculate percent change
            assessment_changes['percent_change'] = (
                (assessment_changes['current_value'] - assessment_changes['previous_value']) / 
                assessment_changes['previous_value'] * 100
            )
            
            # Find significant changes
            significant_increases = assessment_changes[assessment_changes['percent_change'] > change_threshold]
            significant_decreases = assessment_changes[assessment_changes['percent_change'] < -change_threshold]
            
            # Process increases
            for _, row in significant_increases.iterrows():
                anomaly = {
                    'property_id': str(row['property_id']),
                    'anomaly_type': 'value_change',
                    'description': f"Property value increased by {row['percent_change']:.1f}% (from ${float(row['previous_value']):,.2f} to ${float(row['current_value']):,.2f})",
                    'severity': 'high' if row['percent_change'] > 2 * change_threshold else 'medium',
                    'detection_method': 'value_change_detection',
                    'detection_date': datetime.datetime.utcnow().isoformat(),
                    'metadata': {
                        'property_type': row['property_type'],
                        'current_value': float(row['current_value']),
                        'previous_value': float(row['previous_value']),
                        'percent_change': float(row['percent_change']),
                        'current_date': row['current_date'].strftime('%Y-%m-%d') if not pd.isna(row['current_date']) else None,
                        'previous_date': row['previous_date'].strftime('%Y-%m-%d') if not pd.isna(row['previous_date']) else None
                    }
                }
                anomalies.append(anomaly)
                
            # Process decreases  
            for _, row in significant_decreases.iterrows():
                anomaly = {
                    'property_id': str(row['property_id']),
                    'anomaly_type': 'value_change',
                    'description': f"Property value decreased by {abs(row['percent_change']):.1f}% (from ${float(row['previous_value']):,.2f} to ${float(row['current_value']):,.2f})",
                    'severity': 'high' if abs(row['percent_change']) > 2 * change_threshold else 'medium',
                    'detection_method': 'value_change_detection',
                    'detection_date': datetime.datetime.utcnow().isoformat(),
                    'metadata': {
                        'property_type': row['property_type'],
                        'current_value': float(row['current_value']),
                        'previous_value': float(row['previous_value']),
                        'percent_change': float(row['percent_change']),
                        'current_date': row['current_date'].strftime('%Y-%m-%d') if not pd.isna(row['current_date']) else None,
                        'previous_date': row['previous_date'].strftime('%Y-%m-%d') if not pd.isna(row['previous_date']) else None
                    }
                }
                anomalies.append(anomaly)
                
        except Exception as e:
            logger.warning(f"Error detecting value changes: {str(e)}")
            
        return anomalies
    
    def _detect_combined_anomalies(self, data) -> List[Dict[str, Any]]:
        """
        Detect anomalies using a combination of methods.
        
        Args:
            data: DataFrame with property data
            
        Returns:
            List of detected anomalies
        """
        # Combine results from multiple methods
        all_anomalies = []
        
        methods = [
            self._detect_statistical_anomalies,
            self._detect_isolation_forest_anomalies,
            self._detect_value_change_anomalies
        ]
        
        for method in methods:
            try:
                anomalies = method(data)
                all_anomalies.extend(anomalies)
            except Exception as e:
                logger.warning(f"Error in detection method {method.__name__}: {str(e)}")
        
        return all_anomalies
    
    def _save_anomalies(self, anomalies: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Save detected anomalies to the database.
        
        Args:
            anomalies: List of anomaly dictionaries
            
        Returns:
            List of saved anomaly data
        """
        saved_anomalies = []
        
        for anomaly_data in anomalies:
            try:
                # Check if property exists
                property_id = anomaly_data.get('property_id')
                if not property_id:
                    continue
                
                # Get or create the anomaly type
                anomaly_type_name = anomaly_data.get('anomaly_type', 'unknown')
                anomaly_type = AnomalyType.query.filter_by(name=anomaly_type_name).first()
                
                if not anomaly_type:
                    # Create a new anomaly type if it doesn't exist
                    anomaly_type = AnomalyType(
                        name=anomaly_type_name,
                        description=f"Anomalies detected via {anomaly_data.get('detection_method', 'unknown')}"
                    )
                    db.session.add(anomaly_type)
                    db.session.flush()  # Get the ID without committing
                
                # Check if similar anomaly already exists for this property
                existing_anomaly = Anomaly.query.filter_by(
                    property_id=property_id,
                    anomaly_type_id=anomaly_type.id,
                    status='active'
                ).first()
                
                if existing_anomaly:
                    # Update existing anomaly
                    existing_anomaly.description = anomaly_data.get('description', '')
                    existing_anomaly.severity = anomaly_data.get('severity', 'medium')
                    existing_anomaly.detection_date = datetime.datetime.utcnow()
                    existing_anomaly.metadata = anomaly_data.get('metadata', {})
                    db.session.add(existing_anomaly)
                    
                    saved_anomaly = existing_anomaly
                else:
                    # Create new anomaly
                    new_anomaly = Anomaly(
                        property_id=property_id,
                        anomaly_type_id=anomaly_type.id,
                        description=anomaly_data.get('description', ''),
                        severity=anomaly_data.get('severity', 'medium'),
                        status='active',
                        detection_date=datetime.datetime.utcnow(),
                        detection_method=anomaly_data.get('detection_method', 'unknown'),
                        metadata=anomaly_data.get('metadata', {})
                    )
                    db.session.add(new_anomaly)
                    db.session.flush()  # Get the ID without committing
                    
                    saved_anomaly = new_anomaly
                
                # Convert to dictionary for return
                saved_anomalies.append({
                    'id': str(saved_anomaly.id),
                    'property_id': str(saved_anomaly.property_id),
                    'anomaly_type': anomaly_type.name,
                    'description': saved_anomaly.description,
                    'severity': saved_anomaly.severity,
                    'status': saved_anomaly.status,
                    'detection_date': saved_anomaly.detection_date.isoformat() if saved_anomaly.detection_date else None,
                    'detection_method': saved_anomaly.detection_method,
                    'metadata': saved_anomaly.metadata
                })
                
            except Exception as e:
                logger.error(f"Error saving anomaly: {str(e)}")
        
        # Commit all changes
        try:
            db.session.commit()
        except Exception as e:
            logger.error(f"Error committing anomalies to database: {str(e)}")
            db.session.rollback()
        
        return saved_anomalies
    
    def train_detection_models(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Train anomaly detection models with current data.
        
        Args:
            task_data: Dictionary with training parameters
            
        Returns:
            Dict with training results
        """
        self.status = "training_models"
        
        # Extract parameters
        property_type = task_data.get("property_type")
        model_type = task_data.get("model_type", "isolation_forest")
        
        try:
            # Get data for training
            data = self._fetch_property_data(property_type)
            
            if len(data) < 50:  # Not enough data for reliable training
                return {
                    "status": "error",
                    "message": f"Not enough data to train model (got {len(data)} records, need at least 50)"
                }
            
            # Training logic would depend on the model type
            if model_type == "isolation_forest":
                feature_cols = [
                    'lot_size', 'year_built', 'bedrooms', 'bathrooms', 'total_area',
                    'land_value', 'improvement_value', 'total_value'
                ]
                
                # Only use columns that exist in the data
                feature_cols = [col for col in feature_cols if col in data.columns]
                
                # Train for each property type
                models = {}
                for prop_type in data['property_type'].unique():
                    type_data = data[data['property_type'] == prop_type].copy()
                    
                    if len(type_data) < 30:  # Skip if we don't have enough data
                        continue
                    
                    # Prepare features, dropping rows with missing values
                    X = type_data[feature_cols].dropna()
                    if len(X) < 30:
                        continue
                    
                    # Scale the features
                    scaler = StandardScaler()
                    X_scaled = scaler.fit_transform(X)
                    
                    # Train Isolation Forest
                    clf = IsolationForest(
                        contamination=self.detection_thresholds["isolation_forest"],
                        n_estimators=100,
                        random_state=42
                    )
                    
                    # Fit model
                    clf.fit(X_scaled)
                    
                    # Save model
                    models[prop_type] = {
                        "model": clf,
                        "scaler": scaler,
                        "feature_cols": feature_cols
                    }
                
                # Store trained models
                self.models[model_type] = models
                
                return {
                    "status": "success",
                    "model_type": model_type,
                    "property_types_trained": list(models.keys()),
                    "training_data_size": len(data)
                }
            
            else:
                return {
                    "status": "error",
                    "message": f"Unsupported model type: {model_type}"
                }
                
        except Exception as e:
            self.status = "error"
            logger.error(f"Error training models: {str(e)}")
            return {"error": f"Error training models: {str(e)}"}
        finally:
            self.status = "idle"
    
    def classify_anomaly(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classify an existing anomaly using AI.
        
        Args:
            task_data: Dictionary with anomaly data
            
        Returns:
            Dict with classification results
        """
        self.status = "classifying_anomaly"
        
        try:
            anomaly_id = task_data.get("anomaly_id")
            if not anomaly_id:
                return {"error": "Missing anomaly_id"}
                
            # Get the anomaly from database
            anomaly = Anomaly.query.get(anomaly_id)
            if not anomaly:
                return {"error": f"Anomaly with ID {anomaly_id} not found"}
                
            # Get related property data if available
            property_data = None
            if anomaly.property_id:
                property_obj = Property.query.get(anomaly.property_id)
                if property_obj:
                    # Convert property object to dictionary
                    property_data = {
                        "id": str(property_obj.id),
                        "parcel_id": property_obj.parcel_id,
                        "address": property_obj.address,
                        "property_type": property_obj.property_type,
                        "year_built": property_obj.year_built,
                        "total_area": property_obj.total_area,
                        "lot_size": property_obj.lot_size,
                        "bedrooms": property_obj.bedrooms,
                        "bathrooms": property_obj.bathrooms,
                        "owner_name": property_obj.owner_name,
                        "purchase_date": property_obj.purchase_date.isoformat() if property_obj.purchase_date else None,
                        "purchase_price": float(property_obj.purchase_price) if property_obj.purchase_price else None
                    }
            
            # Convert anomaly to dictionary for analysis
            anomaly_dict = {
                "id": str(anomaly.id),
                "description": anomaly.description,
                "severity": anomaly.severity,
                "status": anomaly.status,
                "detection_date": anomaly.detection_date.isoformat() if anomaly.detection_date else None,
                "detection_method": anomaly.detection_method,
                "metadata": anomaly.metadata
            }
            
            # Analyze the anomaly using LLM
            classification_result = analyze_anomaly(anomaly.description, property_data)
            
            # Update the anomaly with classification results
            if "classification" in classification_result:
                # Update anomaly in database with the classification
                anomaly.classification = classification_result.get("classification")
                anomaly.analysis_date = datetime.datetime.utcnow()
                anomaly.analyzed_by = "AnomalyDetectionAgent"
                
                if "recommended_priority" in classification_result:
                    anomaly.priority = classification_result["recommended_priority"]
                    
                if "risk_level" in classification_result:
                    anomaly.risk_level = classification_result["risk_level"]
                    
                # Commit the changes
                db.session.commit()
            
            # Return the classification results
            return {
                "status": "success",
                "anomaly_id": anomaly_id,
                "classification_result": classification_result
            }
            
        except Exception as e:
            self.status = "error"
            logger.error(f"Error classifying anomaly: {str(e)}")
            return {"error": f"Error classifying anomaly: {str(e)}"}
        finally:
            self.status = "idle"
    
    def suggest_action(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Suggest actions for handling an anomaly.
        
        Args:
            task_data: Dictionary with anomaly data
            
        Returns:
            Dict with suggested actions
        """
        self.status = "suggesting_action"
        
        try:
            anomaly_id = task_data.get("anomaly_id")
            if not anomaly_id:
                return {"error": "Missing anomaly_id"}
                
            # Get the anomaly from database
            anomaly = Anomaly.query.get(anomaly_id)
            if not anomaly:
                return {"error": f"Anomaly with ID {anomaly_id} not found"}
                
            # Convert anomaly to dictionary
            anomaly_data = {
                "id": str(anomaly.id),
                "anomaly_type": anomaly.anomaly_type.name if anomaly.anomaly_type else "unknown",
                "description": anomaly.description,
                "severity": anomaly.severity,
                "status": anomaly.status,
                "detection_method": anomaly.detection_method,
                "classification": anomaly.classification if hasattr(anomaly, 'classification') else None,
                "metadata": anomaly.metadata
            }
            
            # Get suggested actions from LLM
            action_result = suggest_anomaly_action(anomaly_data)
            
            # Return the suggested actions
            return {
                "status": "success",
                "anomaly_id": anomaly_id,
                "suggested_actions": action_result
            }
            
        except Exception as e:
            self.status = "error"
            logger.error(f"Error suggesting actions: {str(e)}")
            return {"error": f"Error suggesting actions: {str(e)}"}
        finally:
            self.status = "idle"
    
    def validate_property_data(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate property data for inconsistencies and errors.
        
        Args:
            task_data: Dictionary with property data or ID
            
        Returns:
            Dict with validation results
        """
        self.status = "validating_data"
        
        try:
            property_id = task_data.get("property_id")
            if not property_id:
                return {"error": "Missing property_id"}
                
            # Get the property from database
            property_obj = Property.query.get(property_id)
            if not property_obj:
                return {"error": f"Property with ID {property_id} not found"}
                
            # Create a list of validation checks
            validations = []
            
            # Check for missing required fields
            required_fields = ['parcel_id', 'address', 'property_type']
            for field in required_fields:
                value = getattr(property_obj, field, None)
                if not value:
                    validations.append({
                        "check": "required_field",
                        "field": field,
                        "status": "failed",
                        "message": f"Required field '{field}' is missing"
                    })
                else:
                    validations.append({
                        "check": "required_field",
                        "field": field,
                        "status": "passed"
                    })
            
            # Check for logical consistency in numeric fields
            # For example, bedrooms should be a non-negative integer
            if property_obj.bedrooms is not None:
                if property_obj.bedrooms < 0 or not float(property_obj.bedrooms).is_integer():
                    validations.append({
                        "check": "logical_consistency",
                        "field": "bedrooms",
                        "status": "failed",
                        "message": f"Bedrooms should be a non-negative integer, got {property_obj.bedrooms}"
                    })
                else:
                    validations.append({
                        "check": "logical_consistency",
                        "field": "bedrooms",
                        "status": "passed"
                    })
            
            # Check if total_area is reasonable for the property type
            if property_obj.total_area is not None and property_obj.property_type:
                area_ranges = {
                    "residential": (500, 10000),   # 500-10,000 sq ft for residential
                    "commercial": (1000, 100000),  # 1,000-100,000 sq ft for commercial
                    "industrial": (2000, 500000),  # 2,000-500,000 sq ft for industrial
                    "agricultural": (1000, 1000000)  # 1,000-1,000,000 sq ft for agricultural
                }
                
                if property_obj.property_type.lower() in area_ranges:
                    min_area, max_area = area_ranges[property_obj.property_type.lower()]
                    if property_obj.total_area < min_area or property_obj.total_area > max_area:
                        validations.append({
                            "check": "value_range",
                            "field": "total_area",
                            "status": "failed",
                            "message": f"Total area ({property_obj.total_area} sq ft) is outside the typical range for {property_obj.property_type} properties ({min_area}-{max_area} sq ft)"
                        })
                    else:
                        validations.append({
                            "check": "value_range",
                            "field": "total_area",
                            "status": "passed"
                        })
            
            # Check for assessments
            assessments = Assessment.query.filter_by(property_id=property_id).count()
            if assessments == 0:
                validations.append({
                    "check": "assessments_exist",
                    "status": "failed",
                    "message": "Property has no assessments"
                })
            else:
                validations.append({
                    "check": "assessments_exist",
                    "status": "passed",
                    "message": f"Property has {assessments} assessments"
                })
            
            # Summarize validation results
            validation_result = {
                "property_id": property_id,
                "validation_date": datetime.datetime.utcnow().isoformat(),
                "validations": validations,
                "failed_checks": sum(1 for v in validations if v["status"] == "failed"),
                "passed_checks": sum(1 for v in validations if v["status"] == "passed"),
                "status": "valid" if all(v["status"] == "passed" for v in validations) else "invalid"
            }
            
            return {
                "status": "success",
                "validation_result": validation_result
            }
            
        except Exception as e:
            self.status = "error"
            logger.error(f"Error validating property data: {str(e)}")
            return {"error": f"Error validating property data: {str(e)}"}
        finally:
            self.status = "idle"
    
    def analyze_trends(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze trends in property data over time.
        
        Args:
            task_data: Dictionary with trend analysis parameters
            
        Returns:
            Dict with trend analysis results
        """
        self.status = "analyzing_trends"
        
        try:
            # Extract parameters
            property_type = task_data.get("property_type")
            area = task_data.get("area")
            time_period = task_data.get("time_period", "1y")  # Default to 1 year
            
            # Determine the date range based on time period
            end_date = datetime.datetime.utcnow()
            
            if time_period.endswith('y'):
                years = int(time_period[:-1])
                start_date = end_date - datetime.timedelta(days=years*365)
            elif time_period.endswith('m'):
                months = int(time_period[:-1])
                start_date = end_date - datetime.timedelta(days=months*30)
            elif time_period.endswith('d'):
                days = int(time_period[:-1])
                start_date = end_date - datetime.timedelta(days=days)
            else:
                # Default to 1 year if format is unrecognized
                start_date = end_date - datetime.timedelta(days=365)
            
            # Fetch assessment data for the specified period
            with db.engine.connect() as connection:
                query = """
                SELECT 
                    a.assessment_date, 
                    p.property_type,
                    a.land_value, 
                    a.improvement_value, 
                    a.total_value
                FROM 
                    assessments a
                JOIN 
                    properties p ON a.property_id = p.id
                WHERE 
                    a.assessment_date BETWEEN :start_date AND :end_date
                """
                
                params = {"start_date": start_date, "end_date": end_date}
                
                if property_type:
                    query += " AND p.property_type = :property_type"
                    params["property_type"] = property_type
                    
                if area:
                    # Assuming 'area' is a GeoJSON polygon for spatial filtering
                    query += " AND ST_Contains(ST_GeomFromGeoJSON(:area), p.location)"
                    params["area"] = json.dumps(area)
                
                assessments_df = pd.read_sql(query, connection, params=params)
            
            if len(assessments_df) == 0:
                return {
                    "status": "error",
                    "message": "No assessment data available for the specified period and filters"
                }
            
            # Convert assessment_date to datetime if it's not already
            assessments_df['assessment_date'] = pd.to_datetime(assessments_df['assessment_date'])
            
            # Group by month and property_type
            assessments_df['month'] = assessments_df['assessment_date'].dt.to_period('M')
            
            # Calculate average values by month and property type
            monthly_averages = assessments_df.groupby(['month', 'property_type']).agg({
                'land_value': 'mean',
                'improvement_value': 'mean',
                'total_value': 'mean'
            }).reset_index()
            
            # Convert period to string for JSON serialization
            monthly_averages['month'] = monthly_averages['month'].astype(str)
            
            # Calculate trends (percent change from start to end)
            trends = {}
            for prop_type in monthly_averages['property_type'].unique():
                type_data = monthly_averages[monthly_averages['property_type'] == prop_type]
                
                if len(type_data) < 2:
                    continue
                    
                # Sort by month
                type_data = type_data.sort_values('month')
                
                # Calculate percent changes
                start_value = type_data['total_value'].iloc[0]
                end_value = type_data['total_value'].iloc[-1]
                
                if start_value > 0:
                    percent_change = (end_value - start_value) / start_value * 100
                    
                    trends[prop_type] = {
                        "start_date": type_data['month'].iloc[0],
                        "end_date": type_data['month'].iloc[-1],
                        "start_value": float(start_value),
                        "end_value": float(end_value),
                        "percent_change": float(percent_change),
                        "trend_direction": "up" if percent_change > 0 else "down"
                    }
            
            # Prepare monthly data for charts
            chart_data = []
            for _, row in monthly_averages.iterrows():
                chart_data.append({
                    "month": row['month'],
                    "property_type": row['property_type'],
                    "land_value": float(row['land_value']),
                    "improvement_value": float(row['improvement_value']),
                    "total_value": float(row['total_value'])
                })
            
            return {
                "status": "success",
                "time_period": time_period,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "property_type": property_type if property_type else "all",
                "trends": trends,
                "chart_data": chart_data
            }
            
        except Exception as e:
            self.status = "error"
            logger.error(f"Error analyzing trends: {str(e)}")
            return {"error": f"Error analyzing trends: {str(e)}"}
        finally:
            self.status = "idle"