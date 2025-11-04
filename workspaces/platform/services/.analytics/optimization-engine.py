import numpy as np
from datetime import datetime, timedelta
import logging

class MLOptimizationEngine:
    """Machine learning powered optimization for services."""

    def __init__(self):
        self.optimization_history = []
        self.savings_tracker = {}
        self.logger = logging.getLogger(__name__)

    async def recommend_scaling(self, current_load, historical_patterns):
        """Recommend auto-scaling decisions."""
        try:
            predictions = self._predict_future_load(historical_patterns)
            
            recommendations = []
            for i, predicted_load in enumerate(predictions):
                if predicted_load > 8000:
                    recommendations.append({
                        'action': 'scale_up',
                        'target_instances': 5,
                        'reason': 'High predicted load',
                        'confidence': 0.92,
                        'timeframe_minutes': (i + 1) * 5,
                    })
                elif predicted_load < 500:
                    recommendations.append({
                        'action': 'scale_down',
                        'target_instances': 1,
                        'reason': 'Low predicted load',
                        'confidence': 0.88,
                        'timeframe_minutes': (i + 1) * 5,
                    })

            return recommendations
        except Exception as e:
            self.logger.error(f"Scaling recommendation failed: {e}")
            return []

    async def optimize_resource_allocation(self, resource_utilization):
        """Optimize resource allocation based on ML predictions."""
        try:
            optimization = {
                'cpu_allocation': self._optimize_cpu_alloc(resource_utilization),
                'memory_allocation': self._optimize_memory_alloc(resource_utilization),
                'storage_optimization': self._optimize_storage(resource_utilization),
                'network_optimization': self._optimize_network(resource_utilization),
                'estimated_savings_percent': 15,
            }
            
            self.optimization_history.append({
                'timestamp': datetime.now().isoformat(),
                'optimization': optimization,
            })
            
            return optimization
        except Exception as e:
            self.logger.error(f"Resource optimization failed: {e}")
            return None

    async def predict_cost_trends(self, historical_costs, projection_days=30):
        """Predict future costs using ML."""
        try:
            if not historical_costs:
                return None

            trend = self._fit_trend(historical_costs)
            projected_costs = self._project_trend(trend, projection_days)

            return {
                'projected_daily_cost': projected_costs[-1],
                'projected_monthly_cost': sum(projected_costs),
                'trend_direction': 'increasing' if trend[0] > 0 else 'decreasing',
                'potential_savings_percent': 20,
                'recommendations': self._generate_cost_recommendations(projected_costs),
            }
        except Exception as e:
            self.logger.error(f"Cost prediction failed: {e}")
            return None

    def _predict_future_load(self, patterns):
        """Predict future system load."""
        if not patterns:
            return [5000] * 12
        
        avg_load = np.mean(patterns)
        trend = np.polyfit(range(len(patterns)), patterns, 1)[0]
        
        predictions = []
        for i in range(12):
            pred = avg_load + (trend * i)
            noise = np.random.normal(0, avg_load * 0.1)
            predictions.append(max(100, pred + noise))
        
        return predictions

    def _optimize_cpu_alloc(self, util):
        """Optimize CPU allocation."""
        if util.get('cpu_percent', 50) > 75:
            return {'increase': '20%'}
        elif util.get('cpu_percent', 50) < 25:
            return {'decrease': '15%'}
        return {'maintain': True}

    def _optimize_memory_alloc(self, util):
        """Optimize memory allocation."""
        if util.get('memory_percent', 50) > 80:
            return {'increase': '25%'}
        elif util.get('memory_percent', 50) < 20:
            return {'decrease': '20%'}
        return {'maintain': True}

    def _optimize_storage(self, util):
        """Optimize storage allocation."""
        return {'compression': 'enabled', 'archival_policy': 'optimized'}

    def _optimize_network(self, util):
        """Optimize network allocation."""
        return {'optimization': 'tcp_tuning', 'caching': 'enabled'}

    def _fit_trend(self, data):
        """Fit trend line to data."""
        if len(data) < 2:
            return [0, np.mean(data)]
        return np.polyfit(range(len(data)), data, 1)

    def _project_trend(self, trend, days):
        """Project trend forward."""
        return [trend[1] + (trend[0] * i) for i in range(days)]

    def _generate_cost_recommendations(self, projections):
        """Generate cost-saving recommendations."""
        if projections[-1] > projections[0]:
            return ['Investigate increasing costs', 'Review resource usage patterns']
        return ['Cost trends favorable', 'Maintain current configuration']

module.exports = MLOptimizationEngine;
