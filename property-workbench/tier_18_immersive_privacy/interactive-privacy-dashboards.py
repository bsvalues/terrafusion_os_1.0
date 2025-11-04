"""
Interactive Privacy Dashboards
Real-time monitoring and visualization of privacy systems
"""

import json
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime


@dataclass
class DashboardMetric:
    """Single dashboard metric."""
    metric_id: str
    name: str
    value: float
    unit: str
    trend: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class DashboardAlert:
    """Dashboard alert."""
    alert_id: str
    severity: str
    message: str
    action_required: bool
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


class InteractiveDashboard:
    """Real-time privacy dashboard."""

    def __init__(self, dashboard_id: str):
        self.dashboard_id = dashboard_id
        self.metrics: Dict[str, DashboardMetric] = {}
        self.alerts: List[DashboardAlert] = []
        self.refresh_rate = 5  # seconds
        self.update_history = []

    def add_metric(self, metric: DashboardMetric) -> None:
        """Add metric to dashboard."""
        self.metrics[metric.metric_id] = metric

    def add_alert(self, alert: DashboardAlert) -> None:
        """Add alert to dashboard."""
        self.alerts.append(alert)

    def export_dashboard(self) -> Dict[str, Any]:
        """Export dashboard state."""
        return {
            "dashboard_id": self.dashboard_id,
            "refresh_rate": self.refresh_rate,
            "metrics": {
                metric_id: {
                    "name": metric.name,
                    "value": metric.value,
                    "unit": metric.unit,
                    "trend": metric.trend
                }
                for metric_id, metric in self.metrics.items()
            },
            "alerts": [
                {
                    "severity": alert.severity,
                    "message": alert.message,
                    "action_required": alert.action_required
                }
                for alert in self.alerts
            ],
            "timestamp": datetime.now().isoformat()
        }
