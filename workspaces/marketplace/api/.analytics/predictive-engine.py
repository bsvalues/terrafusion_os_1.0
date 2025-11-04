import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from datetime import datetime, timedelta
import json
import logging

class PredictiveAnalyticsEngine:
    """Machine learning engine for predictive operations."""

    def __init__(self, config_path=None):
        self.logger = logging.getLogger(__name__)
        self.models = {}
        self.scalers = {}
        self.feature_importance = {}
        self.prediction_cache = {}
        self.last_update = None

    async def train_models(self, historical_data, feature_columns):
        """Train predictive models."""
        try:
            self.logger.info("Training predictive models")
            
            # Prepare data
            X = historical_data[feature_columns]
            
            # Time series forecasting model
            if 'timestamp' in historical_data.columns:
                y_timeseries = historical_data['value'].shift(-1)
                self.models['timeseries'] = self._create_timeseries_model()
                self.models['timeseries'].fit(X, y_timeseries.dropna())
            
            # Performance prediction model
            if 'performance_metric' in historical_data.columns:
                y_performance = historical_data['performance_metric']
                self.models['performance'] = RandomForestRegressor(
                    n_estimators=100,
                    max_depth=20,
                    random_state=42
                )
                self.models['performance'].fit(X, y_performance)
                self.feature_importance['performance'] = self._get_feature_importance(
                    self.models['performance'], feature_columns
                )
            
            # Anomaly detection model
            self.models['anomaly'] = self._create_anomaly_detector()
            
            self.last_update = datetime.now()
            self.logger.info("Models trained successfully")
            return True
        except Exception as e:
            self.logger.error(f"Model training failed: {e}")
            return False

    async def predict(self, features, prediction_type='performance'):
        """Generate predictions."""
        try:
            if prediction_type not in self.models:
                self.logger.warning(f"Model not found: {prediction_type}")
                return None
            
            model = self.models[prediction_type]
            prediction = model.predict([features])[0]
            
            # Cache prediction
            cache_key = f"{prediction_type}_{datetime.now().timestamp()}"
            self.prediction_cache[cache_key] = {
                'prediction': prediction,
                'timestamp': datetime.now().isoformat(),
                'confidence': self._calculate_confidence(prediction),
            }
            
            return prediction
        except Exception as e:
            self.logger.error(f"Prediction failed: {e}")
            return None

    async def detect_anomalies(self, data_point, baseline_stats):
        """Detect anomalies in real-time data."""
        try:
            mean = baseline_stats.get('mean', 0)
            std = baseline_stats.get('std', 1)
            
            # Z-score anomaly detection
            z_score = abs((data_point - mean) / std)
            is_anomaly = z_score > 3  # 3-sigma rule
            
            return {
                'is_anomaly': is_anomaly,
                'z_score': z_score,
                'severity': 'high' if z_score > 5 else 'medium' if z_score > 3 else 'low',
                'timestamp': datetime.now().isoformat(),
            }
        except Exception as e:
            self.logger.error(f"Anomaly detection failed: {e}")
            return None

    async def optimize_resources(self, current_metrics, constraints):
        """Recommend resource optimization."""
        try:
            recommendations = {
                'cpu_allocation': self._optimize_cpu(current_metrics),
                'memory_allocation': self._optimize_memory(current_metrics),
                'scaling_action': self._determine_scaling_action(current_metrics),
                'cost_savings_percent': self._estimate_savings(current_metrics),
                'timestamp': datetime.now().isoformat(),
            }
            return recommendations
        except Exception as e:
            self.logger.error(f"Optimization failed: {e}")
            return None

    def _create_timeseries_model(self):
        """Create time series forecasting model."""
        return Pipeline([
            ('scaler', StandardScaler()),
            ('model', RandomForestRegressor(
                n_estimators=50,
                max_depth=15,
                random_state=42
            ))
        ])

    def _create_anomaly_detector(self):
        """Create anomaly detection model."""
        from sklearn.ensemble import IsolationForest
        return IsolationForest(
            contamination=0.05,
            random_state=42,
            n_estimators=100
        )

    def _get_feature_importance(self, model, feature_names):
        """Extract feature importance from model."""
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            return dict(zip(feature_names, importances))
        return {}

    def _calculate_confidence(self, prediction):
        """Calculate prediction confidence."""
        return min(0.95, 0.5 + (prediction / 100))

    def _optimize_cpu(self, metrics):
        """Optimize CPU allocation."""
        current_usage = metrics.get('cpu_percent', 50)
        if current_usage > 80:
            return {'action': 'increase', 'percent': 20}
        elif current_usage < 30:
            return {'action': 'decrease', 'percent': 15}
        return {'action': 'maintain', 'percent': 0}

    def _optimize_memory(self, metrics):
        """Optimize memory allocation."""
        current_usage = metrics.get('memory_percent', 50)
        if current_usage > 85:
            return {'action': 'increase', 'percent': 25}
        elif current_usage < 25:
            return {'action': 'decrease', 'percent': 20}
        return {'action': 'maintain', 'percent': 0}

    def _determine_scaling_action(self, metrics):
        """Determine scaling decision."""
        load = metrics.get('request_rate', 0)
        if load > 1000:
            return {'action': 'scale_up', 'instances': 2}
        elif load < 100:
            return {'action': 'scale_down', 'instances': 1}
        return {'action': 'maintain', 'instances': 0}

    def _estimate_savings(self, metrics):
        """Estimate cost savings from optimization."""
        return min(30, metrics.get('optimization_potential', 15))

    async def get_dashboard_metrics(self):
        """Get metrics for analytics dashboard."""
        return {
            'models_trained': len(self.models),
            'last_update': self.last_update.isoformat() if self.last_update else None,
            'cached_predictions': len(self.prediction_cache),
            'feature_importance': self.feature_importance,
            'system_health': 'operational',
        }

module.exports = PredictiveAnalyticsEngine;
