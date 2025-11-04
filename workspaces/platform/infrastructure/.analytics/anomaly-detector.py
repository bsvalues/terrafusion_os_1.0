import numpy as np
from collections import deque
from datetime import datetime, timedelta
import logging
import json

class AnomalyDetectionSystem:
    """Real-time anomaly detection for infrastructure."""

    def __init__(self, sensitivity='medium', window_size=100):
        self.sensitivity = sensitivity
        self.window_size = window_size
        self.baseline_window = deque(maxlen=window_size)
        self.anomalies = []
        self.alerts = []
        self.logger = logging.getLogger(__name__)

    async def process_metric(self, metric_name, value, timestamp=None):
        """Process incoming metric for anomalies."""
        try:
            if not timestamp:
                timestamp = datetime.now()

            # Maintain baseline
            self.baseline_window.append(value)

            if len(self.baseline_window) < 10:
                return {{'is_anomaly': False, 'reason': 'insufficient_baseline'}}

            # Calculate statistics
            baseline_mean = np.mean(list(self.baseline_window))
            baseline_std = np.std(list(self.baseline_window))

            # Anomaly detection
            z_score = abs((value - baseline_mean) / (baseline_std + 1e-10))
            
            threshold = {{'high': 2.5, 'medium': 3.0, 'low': 3.5}}.get(self.sensitivity, 3.0)
            is_anomaly = z_score > threshold

            result = {{
                'is_anomaly': is_anomaly,
                'metric_name': metric_name,
                'value': value,
                'baseline_mean': baseline_mean,
                'z_score': z_score,
                'timestamp': timestamp.isoformat(),
            }}

            if is_anomaly:
                self.anomalies.append(result)
                alert = {{
                    'type': 'anomaly_detected',
                    'metric': metric_name,
                    'severity': 'critical' if z_score > 5 else 'warning',
                    'value': value,
                    'timestamp': timestamp.isoformat(),
                }}
                self.alerts.append(alert)
                self.logger.warning(f"Anomaly detected in {{metric_name}}: {{z_score:.2f}}σ")

            return result

        except Exception as e:
            self.logger.error(f"Metric processing failed: {{e}}")
            return None

    async def get_anomaly_summary(self):
        """Get summary of recent anomalies."""
        recent_anomalies = [a for a in self.anomalies if (
            datetime.fromisoformat(a['timestamp']) > 
            datetime.now() - timedelta(hours=24)
        )]

        return {{
            'total_anomalies_24h': len(recent_anomalies),
            'critical_count': len([a for a in recent_anomalies if a.get('z_score', 0) > 5]),
            'warning_count': len([a for a in recent_anomalies if 3 < a.get('z_score', 0) <= 5]),
            'detection_rate': len(recent_anomalies) / 1440 * 100 if recent_anomalies else 0,
        }}

    async def reset_baseline(self):
        """Reset baseline for model retraining."""
        self.baseline_window.clear()
        self.logger.info("Baseline reset for retraining")

module.exports = AnomalyDetectionSystem;
