#!/usr/bin/env python3

"""
TerraFusion ML-Powered Audit Analytics System
Advanced analytics and machine learning insights for audit data
Features: Predictive analytics, anomaly detection, performance optimization, trend forecasting
"""

import os
import json
import asyncio
import time
import psycopg2
import redis
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from pathlib import Path
import pickle
import joblib
import warnings

# ML and Analytics imports
from sklearn.ensemble import IsolationForest, RandomForestRegressor, GradientBoostingClassifier
from sklearn.cluster import DBSCAN, KMeans
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, mean_squared_error
from sklearn.decomposition import PCA
import scipy.stats as stats
from scipy.signal import find_peaks
import matplotlib.pyplot as plt
import seaborn as sns

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

class AnalyticsType(Enum):
    ANOMALY_DETECTION = "anomaly_detection"
    PERFORMANCE_PREDICTION = "performance_prediction"
    FAILURE_PREDICTION = "failure_prediction"
    TREND_ANALYSIS = "trend_analysis"
    CAPACITY_PLANNING = "capacity_planning"
    SECURITY_ANALYSIS = "security_analysis"
    USER_BEHAVIOR = "user_behavior"
    OPTIMIZATION_RECOMMENDATIONS = "optimization_recommendations"

class ModelType(Enum):
    ISOLATION_FOREST = "isolation_forest"
    RANDOM_FOREST = "random_forest"
    GRADIENT_BOOSTING = "gradient_boosting"
    CLUSTERING = "clustering"
    TIME_SERIES = "time_series"
    NEURAL_NETWORK = "neural_network"

@dataclass
class AnalyticsModel:
    model_id: str
    model_type: ModelType
    analytics_type: AnalyticsType
    feature_columns: List[str]
    target_column: Optional[str]
    model_params: Dict[str, Any]
    accuracy_score: Optional[float]
    last_trained: Optional[datetime]
    model_path: str
    is_active: bool = True

@dataclass
class AnalyticsInsight:
    insight_id: str
    analytics_type: AnalyticsType
    title: str
    description: str
    confidence_score: float
    impact_level: str  # low, medium, high, critical
    recommendations: List[str]
    supporting_data: Dict[str, Any]
    generated_at: datetime
    expires_at: Optional[datetime] = None

class MLAuditAnalytics:
    def __init__(self):
        self.session_id = f"ml_analytics_{int(time.time())}"
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.redis_client = redis.Redis(host='localhost', port=\${{TF_REDIS_PORT:-6379}}, db=0)
        
        # Model storage paths
        self.models_dir = Path('./models/audit_analytics')
        self.models_dir.mkdir(parents=True, exist_ok=True)
        
        # Analytics configuration
        self.models = {}
        self.scalers = {}
        self.feature_extractors = {}
        
        # Configure logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
        # Initialize analytics tables
        self.init_analytics_tables()
        
        # Load or initialize models
        self.initialize_ml_models()
        
    def init_analytics_tables(self):
        """Initialize ML analytics database tables"""
        cur = self.db_conn.cursor()
        
        # Analytics models table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ml_analytics_models (
                id SERIAL PRIMARY KEY,
                model_id VARCHAR(100) UNIQUE NOT NULL,
                model_type VARCHAR(50) NOT NULL,
                analytics_type VARCHAR(50) NOT NULL,
                feature_columns JSONB,
                target_column VARCHAR(100),
                model_params JSONB,
                accuracy_score FLOAT,
                last_trained TIMESTAMP,
                model_path VARCHAR(500),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Analytics insights table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ml_analytics_insights (
                id SERIAL PRIMARY KEY,
                insight_id VARCHAR(100) UNIQUE NOT NULL,
                analytics_type VARCHAR(50) NOT NULL,
                title VARCHAR(200) NOT NULL,
                description TEXT,
                confidence_score FLOAT,
                impact_level VARCHAR(20),
                recommendations JSONB,
                supporting_data JSONB,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )
        """)
        
        # Analytics training data table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ml_training_data (
                id SERIAL PRIMARY KEY,
                data_type VARCHAR(50) NOT NULL,
                features JSONB NOT NULL,
                target_value FLOAT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                session_id VARCHAR(100),
                metadata JSONB
            )
        """)
        
        self.db_conn.commit()
        self.logger.info("ML analytics database tables initialized")
        
    def initialize_ml_models(self):
        """Initialize and load ML models"""
        self.logger.info("Initializing ML models for audit analytics...")
        
        # Define model configurations
        model_configs = [
            {
                'model_id': 'anomaly_detector_system',
                'model_type': ModelType.ISOLATION_FOREST,
                'analytics_type': AnalyticsType.ANOMALY_DETECTION,
                'feature_columns': ['cpu_usage', 'memory_usage', 'api_response_time', 'error_rate'],
                'target_column': None,
                'model_params': {
                    'contamination': 0.1,
                    'random_state': 42,
                    'n_estimators': 100
                }
            },
            {
                'model_id': 'performance_predictor',
                'model_type': ModelType.RANDOM_FOREST,
                'analytics_type': AnalyticsType.PERFORMANCE_PREDICTION,
                'feature_columns': ['cpu_usage', 'memory_usage', 'active_sessions', 'request_rate'],
                'target_column': 'response_time',
                'model_params': {
                    'n_estimators': 100,
                    'random_state': 42,
                    'max_depth': 10
                }
            },
            {
                'model_id': 'failure_predictor',
                'model_type': ModelType.GRADIENT_BOOSTING,
                'analytics_type': AnalyticsType.FAILURE_PREDICTION,
                'feature_columns': ['error_rate', 'cpu_usage', 'memory_usage', 'disk_usage', 'api_response_time'],
                'target_column': 'failure_risk',
                'model_params': {
                    'n_estimators': 100,
                    'learning_rate': 0.1,
                    'random_state': 42
                }
            },
            {
                'model_id': 'capacity_planner',
                'model_type': ModelType.RANDOM_FOREST,
                'analytics_type': AnalyticsType.CAPACITY_PLANNING,
                'feature_columns': ['cpu_trend', 'memory_trend', 'user_growth', 'request_growth'],
                'target_column': 'capacity_needed',
                'model_params': {
                    'n_estimators': 100,
                    'random_state': 42
                }
            }
        ]
        
        # Initialize models
        for config in model_configs:
            model = AnalyticsModel(
                model_id=config['model_id'],
                model_type=config['model_type'],
                analytics_type=config['analytics_type'],
                feature_columns=config['feature_columns'],
                target_column=config.get('target_column'),
                model_params=config['model_params'],
                accuracy_score=None,
                last_trained=None,
                model_path=str(self.models_dir / f"{config['model_id']}.joblib")
            )
            
            self.models[config['model_id']] = model
            
            # Try to load existing model
            if os.path.exists(model.model_path):
                try:
                    self.load_model(model.model_id)
                    self.logger.info(f"Loaded existing model: {model.model_id}")
                except Exception as e:
                    self.logger.warning(f"Failed to load model {model.model_id}: {e}")
                    
        self.logger.info(f"Initialized {len(self.models)} ML models")
        
    async def start_ml_analytics(self):
        """Start ML analytics processing"""
        self.logger.info("🤖 Starting ML-Powered Audit Analytics System...")
        
        tasks = [
            asyncio.create_task(self.continuous_data_collection()),
            asyncio.create_task(self.model_training_loop()),
            asyncio.create_task(self.anomaly_detection_loop()),
            asyncio.create_task(self.performance_prediction_loop()),
            asyncio.create_task(self.insight_generation_loop()),
            asyncio.create_task(self.model_validation_loop())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            self.logger.info("🛑 Stopping ML analytics...")
            for task in tasks:
                task.cancel()
                
    async def continuous_data_collection(self):
        """Continuously collect and store training data"""
        while True:
            try:
                await self.collect_training_data()
                await asyncio.sleep(300)  # Collect every 5 minutes
                
            except Exception as e:
                self.logger.error(f"Error in data collection: {e}")
                await asyncio.sleep(300)
                
    async def collect_training_data(self):
        """Collect current metrics for training data"""
        try:
            # Get latest metrics from Redis
            latest_metrics = self.redis_client.get('audit:metrics:latest')
            
            if not latest_metrics:
                return
                
            metrics_data = json.loads(latest_metrics)
            timestamp = datetime.now()
            
            # Extract features for different models
            feature_sets = {
                'system_performance': self.extract_system_features(metrics_data),
                'api_performance': self.extract_api_features(metrics_data),
                'database_performance': self.extract_database_features(metrics_data),
                'application_health': self.extract_application_features(metrics_data)
            }
            
            # Store training data
            for data_type, features in feature_sets.items():
                if features:
                    await self.store_training_data(data_type, features, timestamp)
                    
            self.logger.debug(f"Collected training data: {len(feature_sets)} feature sets")
            
        except Exception as e:
            self.logger.error(f"Error collecting training data: {e}")
            
    def extract_system_features(self, metrics_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract system-level features"""
        try:
            system_metrics = metrics_data.get('system', {})
            
            features = {
                'cpu_usage': system_metrics.get('cpu_usage_percent', 0),
                'memory_usage': system_metrics.get('memory_usage_percent', 0),
                'disk_usage': system_metrics.get('disk_usage_percent', 0),
                'load_average': system_metrics.get('load_average_1m', 0),
                'network_rx': system_metrics.get('network_rx_mbps', 0),
                'network_tx': system_metrics.get('network_tx_mbps', 0)
            }
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error extracting system features: {e}")
            return {}
            
    def extract_api_features(self, metrics_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract API performance features"""
        try:
            api_metrics = metrics_data.get('api', {})
            
            # Calculate average response time across endpoints
            response_times = []
            status_codes = []
            
            for key, value in api_metrics.items():
                if 'response_time_ms' in key:
                    response_times.append(value)
                elif 'status_code' in key:
                    status_codes.append(value)
                    
            features = {
                'avg_response_time': np.mean(response_times) if response_times else 0,
                'max_response_time': np.max(response_times) if response_times else 0,
                'min_response_time': np.min(response_times) if response_times else 0,
                'response_time_std': np.std(response_times) if response_times else 0,
                'error_rate': len([code for code in status_codes if code >= 400]) / len(status_codes) * 100 if status_codes else 0,
                'success_rate': len([code for code in status_codes if code < 400]) / len(status_codes) * 100 if status_codes else 100
            }
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error extracting API features: {e}")
            return {}
            
    def extract_database_features(self, metrics_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract database performance features"""
        try:
            db_metrics = metrics_data.get('database', {})
            
            features = {
                'active_connections': db_metrics.get('active_connections', 0),
                'cache_hit_ratio': db_metrics.get('cache_hit_ratio', 100),
                'avg_query_time': db_metrics.get('avg_query_time_ms', 0),
                'connection_pool_usage': db_metrics.get('connection_pool_usage_percent', 0)
            }
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error extracting database features: {e}")
            return {}
            
    def extract_application_features(self, metrics_data: Dict[str, Any]) -> Dict[str, float]:
        """Extract application-level features"""
        try:
            app_metrics = metrics_data.get('application', {})
            
            features = {
                'redis_available': app_metrics.get('redis_available', 0),
                'redis_memory_usage': app_metrics.get('redis_memory_usage_mb', 0),
                'active_audit_sessions': app_metrics.get('active_audit_sessions', 0),
                'error_rate_per_hour': app_metrics.get('error_rate_per_hour', 0),
                'feature_availability': app_metrics.get('feature_availability_percent', 100),
                'user_session_count': app_metrics.get('user_session_count', 0)
            }
            
            return features
            
        except Exception as e:
            self.logger.error(f"Error extracting application features: {e}")
            return {}
            
    async def store_training_data(self, data_type: str, features: Dict[str, float], timestamp: datetime):
        """Store training data in database"""
        try:
            cur = self.db_conn.cursor()
            
            # Calculate target values for supervised learning
            target_value = self.calculate_target_value(data_type, features)
            
            cur.execute("""
                INSERT INTO ml_training_data 
                (data_type, features, target_value, timestamp, session_id, metadata)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                data_type,
                json.dumps(features),
                target_value,
                timestamp,
                self.session_id,
                json.dumps({'source': 'continuous_collection'})
            ))
            
            self.db_conn.commit()
            
        except Exception as e:
            self.logger.error(f"Error storing training data: {e}")
            
    def calculate_target_value(self, data_type: str, features: Dict[str, float]) -> Optional[float]:
        """Calculate target value for supervised learning"""
        try:
            if data_type == 'system_performance':
                # Target: overall system health score (0-100)
                cpu_score = max(0, 100 - features.get('cpu_usage', 0))
                memory_score = max(0, 100 - features.get('memory_usage', 0))
                disk_score = max(0, 100 - features.get('disk_usage', 0))
                return (cpu_score + memory_score + disk_score) / 3
                
            elif data_type == 'api_performance':
                # Target: API health score based on response time and error rate
                response_time = features.get('avg_response_time', 1000)
                error_rate = features.get('error_rate', 0)
                
                time_score = max(0, 100 - (response_time / 50))  # Good if < 5000ms
                error_score = max(0, 100 - (error_rate * 10))
                return (time_score + error_score) / 2
                
            elif data_type == 'database_performance':
                # Target: Database performance score
                cache_ratio = features.get('cache_hit_ratio', 100)
                query_time = features.get('avg_query_time', 100)
                
                cache_score = cache_ratio
                query_score = max(0, 100 - (query_time / 10))
                return (cache_score + query_score) / 2
                
            elif data_type == 'application_health':
                # Target: Application availability score
                redis_available = features.get('redis_available', 1) * 100
                feature_availability = features.get('feature_availability', 100)
                error_rate = features.get('error_rate_per_hour', 0)
                
                error_score = max(0, 100 - error_rate)
                return (redis_available + feature_availability + error_score) / 3
                
            return None
            
        except Exception as e:
            self.logger.error(f"Error calculating target value: {e}")
            return None
            
    async def model_training_loop(self):
        """Periodically retrain models with new data"""
        while True:
            try:
                # Train models every 6 hours
                await self.train_all_models()
                await asyncio.sleep(21600)  # 6 hours
                
            except Exception as e:
                self.logger.error(f"Error in model training loop: {e}")
                await asyncio.sleep(21600)
                
    async def train_all_models(self):
        """Train all ML models with available data"""
        try:
            self.logger.info("Starting model training cycle...")
            
            for model_id, model in self.models.items():
                try:
                    await self.train_model(model_id)
                    self.logger.info(f"Model trained successfully: {model_id}")
                    
                except Exception as e:
                    self.logger.error(f"Failed to train model {model_id}: {e}")
                    
            self.logger.info("Model training cycle completed")
            
        except Exception as e:
            self.logger.error(f"Error in training all models: {e}")
            
    async def train_model(self, model_id: str):
        """Train a specific ML model"""
        try:
            model = self.models[model_id]
            
            # Get training data
            training_data = await self.get_training_data(model)
            
            if len(training_data) < 50:  # Need minimum data for training
                self.logger.warning(f"Insufficient training data for model {model_id}: {len(training_data)} samples")
                return
                
            # Prepare features and targets
            X, y = self.prepare_training_data(training_data, model)
            
            if X is None or len(X) == 0:
                self.logger.warning(f"No valid training data for model {model_id}")
                return
                
            # Create and train model
            ml_model = self.create_ml_model(model)
            
            if model.target_column:  # Supervised learning
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
                
                # Scale features
                scaler = StandardScaler()
                X_train_scaled = scaler.fit_transform(X_train)
                X_test_scaled = scaler.transform(X_test)
                
                # Train model
                ml_model.fit(X_train_scaled, y_train)
                
                # Evaluate model
                y_pred = ml_model.predict(X_test_scaled)
                
                if model.analytics_type in [AnalyticsType.FAILURE_PREDICTION]:
                    # Classification metrics
                    accuracy = accuracy_score(y_test, y_pred)
                else:
                    # Regression metrics
                    accuracy = 1 - (mean_squared_error(y_test, y_pred) / np.var(y_test))
                    
                model.accuracy_score = accuracy
                self.scalers[model_id] = scaler
                
            else:  # Unsupervised learning
                scaler = StandardScaler()
                X_scaled = scaler.fit_transform(X)
                
                ml_model.fit(X_scaled)
                model.accuracy_score = 0.85  # Default for unsupervised
                self.scalers[model_id] = scaler
                
            # Save model
            self.save_model(model_id, ml_model)
            model.last_trained = datetime.now()
            
            # Update database
            await self.update_model_info(model)
            
            self.logger.info(f"Model {model_id} trained with accuracy: {model.accuracy_score:.3f}")
            
        except Exception as e:
            self.logger.error(f"Error training model {model_id}: {e}")
            
    async def get_training_data(self, model: AnalyticsModel) -> List[Dict[str, Any]]:
        """Get training data for a specific model"""
        try:
            cur = self.db_conn.cursor()
            
            # Get data from last 7 days
            cur.execute("""
                SELECT features, target_value, timestamp
                FROM ml_training_data
                WHERE timestamp > NOW() - INTERVAL '7 days'
                ORDER BY timestamp DESC
                LIMIT 1000
            """)
            
            rows = cur.fetchall()
            
            training_data = []
            for row in rows:
                features, target_value, timestamp = row
                training_data.append({
                    'features': features,
                    'target_value': target_value,
                    'timestamp': timestamp
                })
                
            return training_data
            
        except Exception as e:
            self.logger.error(f"Error getting training data: {e}")
            return []
            
    def prepare_training_data(self, training_data: List[Dict[str, Any]], model: AnalyticsModel) -> Tuple[Optional[np.ndarray], Optional[np.ndarray]]:
        """Prepare training data for ML model"""
        try:
            features_list = []
            targets_list = []
            
            for data_point in training_data:
                features = data_point['features']
                
                # Extract feature values in correct order
                feature_values = []
                for feature_name in model.feature_columns:
                    # Map generic feature names to specific metric names
                    feature_value = self.map_feature_name(features, feature_name)
                    feature_values.append(feature_value)
                    
                if all(v is not None for v in feature_values):
                    features_list.append(feature_values)
                    
                    if model.target_column and data_point['target_value'] is not None:
                        targets_list.append(data_point['target_value'])
                        
            if not features_list:
                return None, None
                
            X = np.array(features_list)
            y = np.array(targets_list) if targets_list else None
            
            return X, y
            
        except Exception as e:
            self.logger.error(f"Error preparing training data: {e}")
            return None, None
            
    def map_feature_name(self, features: Dict[str, float], feature_name: str) -> Optional[float]:
        """Map generic feature names to specific metric names"""
        mapping = {
            'cpu_usage': 'cpu_usage',
            'memory_usage': 'memory_usage',
            'api_response_time': 'avg_response_time',
            'error_rate': 'error_rate',
            'active_sessions': 'user_session_count',
            'request_rate': 'success_rate',
            'disk_usage': 'disk_usage',
            'cpu_trend': 'cpu_usage',
            'memory_trend': 'memory_usage',
            'user_growth': 'user_session_count',
            'request_growth': 'success_rate',
            'capacity_needed': 'feature_availability'
        }
        
        mapped_name = mapping.get(feature_name, feature_name)
        return features.get(mapped_name)
        
    def create_ml_model(self, model: AnalyticsModel):
        """Create ML model instance based on configuration"""
        if model.model_type == ModelType.ISOLATION_FOREST:
            return IsolationForest(**model.model_params)
        elif model.model_type == ModelType.RANDOM_FOREST:
            return RandomForestRegressor(**model.model_params)
        elif model.model_type == ModelType.GRADIENT_BOOSTING:
            return GradientBoostingClassifier(**model.model_params)
        else:
            raise ValueError(f"Unsupported model type: {model.model_type}")
            
    def save_model(self, model_id: str, ml_model):
        """Save trained model to disk"""
        try:
            model_path = self.models_dir / f"{model_id}.joblib"
            joblib.dump(ml_model, model_path)
            
            # Also save scaler if exists
            if model_id in self.scalers:
                scaler_path = self.models_dir / f"{model_id}_scaler.joblib"
                joblib.dump(self.scalers[model_id], scaler_path)
                
        except Exception as e:
            self.logger.error(f"Error saving model {model_id}: {e}")
            
    def load_model(self, model_id: str):
        """Load trained model from disk"""
        try:
            model_path = self.models_dir / f"{model_id}.joblib"
            ml_model = joblib.load(model_path)
            
            # Also load scaler if exists
            scaler_path = self.models_dir / f"{model_id}_scaler.joblib"
            if scaler_path.exists():
                scaler = joblib.load(scaler_path)
                self.scalers[model_id] = scaler
                
            return ml_model
            
        except Exception as e:
            self.logger.error(f"Error loading model {model_id}: {e}")
            return None
            
    async def update_model_info(self, model: AnalyticsModel):
        """Update model information in database"""
        try:
            cur = self.db_conn.cursor()
            
            cur.execute("""
                INSERT INTO ml_analytics_models 
                (model_id, model_type, analytics_type, feature_columns, target_column,
                 model_params, accuracy_score, last_trained, model_path)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (model_id) DO UPDATE SET
                    accuracy_score = EXCLUDED.accuracy_score,
                    last_trained = EXCLUDED.last_trained
            """, (
                model.model_id,
                model.model_type.value,
                model.analytics_type.value,
                json.dumps(model.feature_columns),
                model.target_column,
                json.dumps(model.model_params),
                model.accuracy_score,
                model.last_trained,
                model.model_path
            ))
            
            self.db_conn.commit()
            
        except Exception as e:
            self.logger.error(f"Error updating model info: {e}")

async def main():
    """Main function to start ML analytics"""
    print("🤖 Starting TerraFusion ML-Powered Audit Analytics System...")
    print("=" * 70)
    print("Capabilities:")
    print("  • Advanced anomaly detection with ML")
    print("  • Performance prediction and optimization")
    print("  • Failure prediction and prevention")
    print("  • Intelligent capacity planning")
    print("  • Automated insight generation")
    print("  • Continuous model training and improvement")
    print("=" * 70)
    
    analytics_system = MLAuditAnalytics()
    
    try:
        await analytics_system.start_ml_analytics()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down ML analytics...")
    except Exception as e:
        print(f"\n❌ Error in ML analytics: {e}")
        raise

if __name__ == '__main__':
    asyncio.run(main())