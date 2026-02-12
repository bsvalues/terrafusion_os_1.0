"""
Intelligent Auto-Scaling Engine for TerraFusion Platform

Implements predictive scaling and resource optimization for county assessment systems:
- Machine learning-based load prediction
- Automatic resource scaling based on county workload patterns
- Cost optimization through intelligent resource allocation
- Peak period prediction for assessment seasons
- Dynamic connection pool sizing
- Memory and CPU optimization
"""

import asyncio
import logging
import time
import threading
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
from collections import deque
import statistics
import math

logger = logging.getLogger(__name__)

class ScalingDirection(Enum):
    UP = "UP"
    DOWN = "DOWN"
    STABLE = "STABLE"

class ResourceType(Enum):
    CPU = "CPU"
    MEMORY = "MEMORY"
    DATABASE_CONNECTIONS = "DATABASE_CONNECTIONS"
    CACHE_SIZE = "CACHE_SIZE"
    WORKER_THREADS = "WORKER_THREADS"

@dataclass
class ScalingMetric:
    """Scaling decision metrics"""
    timestamp: datetime
    resource_type: ResourceType
    current_value: float
    target_value: float
    utilization_percent: float
    prediction_confidence: float
    scaling_direction: ScalingDirection

@dataclass
class WorkloadPattern:
    """County workload pattern analysis"""
    pattern_name: str
    time_of_day_multiplier: Dict[int, float]  # Hour -> multiplier
    day_of_week_multiplier: Dict[int, float]  # Day -> multiplier
    seasonal_multiplier: Dict[int, float]     # Month -> multiplier
    assessment_period_boost: float = 2.5     # Assessment season boost
    confidence_score: float = 0.0

@dataclass
class ResourceLimits:
    """Resource scaling limits"""
    min_value: float
    max_value: float
    scale_up_threshold: float = 80.0    # % utilization to scale up
    scale_down_threshold: float = 30.0  # % utilization to scale down
    cooldown_seconds: int = 300         # Minimum time between scaling actions

class PredictiveAnalyzer:
    """Machine learning-based workload prediction"""
    
    def __init__(self):
        self.historical_data = deque(maxlen=10080)  # 1 week of minute-level data
        self.patterns = {}
        self.prediction_accuracy = 0.75  # Initial accuracy estimate
        
    def record_workload_data(self, timestamp: datetime, 
                           cpu_usage: float, memory_usage: float, 
                           request_count: int, response_time: float):
        """Record workload data point"""
        data_point = {
            "timestamp": timestamp,
            "cpu_usage": cpu_usage,
            "memory_usage": memory_usage,
            "request_count": request_count,
            "response_time": response_time,
            "hour": timestamp.hour,
            "day_of_week": timestamp.weekday(),
            "month": timestamp.month,
            "is_assessment_period": self._is_assessment_period(timestamp)
        }
        
        self.historical_data.append(data_point)
        
        # Update patterns periodically
        if len(self.historical_data) % 1440 == 0:  # Once per day
            self._update_patterns()
    
    def _is_assessment_period(self, timestamp: datetime) -> bool:
        """Determine if timestamp is during assessment period"""
        # Typical county assessment periods: March-May, September-November
        return timestamp.month in [3, 4, 5, 9, 10, 11]
    
    def _update_patterns(self):
        """Update workload patterns based on historical data"""
        if len(self.historical_data) < 1440:  # Need at least 24 hours
            return
        
        # Analyze hourly patterns
        hourly_loads = {}
        for hour in range(24):
            hour_data = [d for d in self.historical_data if d["hour"] == hour]
            if hour_data:
                avg_cpu = statistics.mean([d["cpu_usage"] for d in hour_data])
                avg_requests = statistics.mean([d["request_count"] for d in hour_data])
                hourly_loads[hour] = (avg_cpu + avg_requests) / 2
        
        # Normalize hourly patterns
        if hourly_loads:
            max_load = max(hourly_loads.values())
            hourly_multipliers = {
                hour: load / max_load if max_load > 0 else 1.0
                for hour, load in hourly_loads.items()
            }
        else:
            hourly_multipliers = {hour: 1.0 for hour in range(24)}
        
        # Analyze daily patterns
        daily_loads = {}
        for day in range(7):
            day_data = [d for d in self.historical_data if d["day_of_week"] == day]
            if day_data:
                avg_cpu = statistics.mean([d["cpu_usage"] for d in day_data])
                avg_requests = statistics.mean([d["request_count"] for d in day_data])
                daily_loads[day] = (avg_cpu + avg_requests) / 2
        
        # Normalize daily patterns
        if daily_loads:
            max_daily = max(daily_loads.values())
            daily_multipliers = {
                day: load / max_daily if max_daily > 0 else 1.0
                for day, load in daily_loads.items()
            }
        else:
            daily_multipliers = {day: 1.0 for day in range(7)}
        
        # Create pattern
        self.patterns["county_workload"] = WorkloadPattern(
            pattern_name="county_workload",
            time_of_day_multiplier=hourly_multipliers,
            day_of_week_multiplier=daily_multipliers,
            seasonal_multiplier={month: 1.0 for month in range(1, 13)},
            confidence_score=min(len(self.historical_data) / 10080, 1.0)
        )
        
        logger.info("Updated workload patterns based on historical data")
    
    def predict_load(self, target_time: datetime, hours_ahead: int = 1) -> Dict[str, float]:
        """Predict workload at target time"""
        if "county_workload" not in self.patterns:
            # Return baseline prediction if no patterns available
            return {
                "predicted_cpu": 50.0,
                "predicted_memory": 60.0,
                "predicted_requests": 100,
                "confidence": 0.3
            }
        
        pattern = self.patterns["county_workload"]
        
        # Get multipliers for target time
        hour_multiplier = pattern.time_of_day_multiplier.get(target_time.hour, 1.0)
        day_multiplier = pattern.day_of_week_multiplier.get(target_time.weekday(), 1.0)
        seasonal_multiplier = pattern.seasonal_multiplier.get(target_time.month, 1.0)
        
        # Assessment period boost
        assessment_boost = pattern.assessment_period_boost if self._is_assessment_period(target_time) else 1.0
        
        # Calculate base load from recent data
        recent_data = list(self.historical_data)[-60:]  # Last hour
        if recent_data:
            base_cpu = statistics.mean([d["cpu_usage"] for d in recent_data])
            base_memory = statistics.mean([d["memory_usage"] for d in recent_data])
            base_requests = statistics.mean([d["request_count"] for d in recent_data])
        else:
            base_cpu, base_memory, base_requests = 50.0, 60.0, 100
        
        # Apply multipliers
        total_multiplier = hour_multiplier * day_multiplier * seasonal_multiplier * assessment_boost
        
        predicted_cpu = min(base_cpu * total_multiplier, 100.0)
        predicted_memory = min(base_memory * total_multiplier, 100.0)
        predicted_requests = base_requests * total_multiplier
        
        return {
            "predicted_cpu": predicted_cpu,
            "predicted_memory": predicted_memory,
            "predicted_requests": predicted_requests,
            "confidence": pattern.confidence_score * (1.0 - hours_ahead * 0.1)  # Decrease with time
        }

class ResourceScaler:
    """Manages scaling of specific resource types"""
    
    def __init__(self, resource_type: ResourceType, limits: ResourceLimits):
        self.resource_type = resource_type
        self.limits = limits
        self.current_value = limits.min_value
        self.last_scaling_time = None
        self.scaling_history = deque(maxlen=100)
        
    def should_scale(self, utilization_percent: float, prediction: Dict[str, float]) -> Tuple[bool, ScalingDirection]:
        """Determine if scaling is needed"""
        now = datetime.now()
        
        # Check cooldown period
        if (self.last_scaling_time and 
            (now - self.last_scaling_time).total_seconds() < self.limits.cooldown_seconds):
            return False, ScalingDirection.STABLE
        
        # Scale up conditions
        if utilization_percent > self.limits.scale_up_threshold:
            if self.current_value < self.limits.max_value:
                return True, ScalingDirection.UP
        
        # Scale down conditions
        elif utilization_percent < self.limits.scale_down_threshold:
            # Only scale down if prediction also suggests lower load
            predicted_util = self._get_predicted_utilization(prediction)
            if predicted_util < self.limits.scale_down_threshold * 1.2:  # 20% buffer
                if self.current_value > self.limits.min_value:
                    return True, ScalingDirection.DOWN
        
        return False, ScalingDirection.STABLE
    
    def _get_predicted_utilization(self, prediction: Dict[str, float]) -> float:
        """Get predicted utilization for this resource type"""
        if self.resource_type == ResourceType.CPU:
            return prediction.get("predicted_cpu", 50.0)
        elif self.resource_type == ResourceType.MEMORY:
            return prediction.get("predicted_memory", 60.0)
        else:
            # For other resources, use CPU as proxy
            return prediction.get("predicted_cpu", 50.0)
    
    def execute_scaling(self, direction: ScalingDirection) -> float:
        """Execute scaling action and return new value"""
        old_value = self.current_value
        
        if direction == ScalingDirection.UP:
            # Increase by 25% or minimum increment
            increment = max(self.current_value * 0.25, 1.0)
            self.current_value = min(self.current_value + increment, self.limits.max_value)
        
        elif direction == ScalingDirection.DOWN:
            # Decrease by 20% or minimum decrement
            decrement = max(self.current_value * 0.20, 1.0)
            self.current_value = max(self.current_value - decrement, self.limits.min_value)
        
        self.last_scaling_time = datetime.now()
        
        # Record scaling action
        self.scaling_history.append({
            "timestamp": self.last_scaling_time,
            "direction": direction.value,
            "old_value": old_value,
            "new_value": self.current_value,
            "resource_type": self.resource_type.value
        })
        
        logger.info(f"Scaled {self.resource_type.value} {direction.value}: {old_value} -> {self.current_value}")
        
        return self.current_value

class AutoScalingEngine:
    """Main auto-scaling engine coordinating all resources"""
    
    def __init__(self):
        self.predictor = PredictiveAnalyzer()
        self.scalers = self._initialize_scalers()
        self.is_running = False
        self.scaling_thread = None
        self.metrics_history = deque(maxlen=1440)  # 24 hours
        
        # Callbacks for actual resource changes
        self.scaling_callbacks = {}
        
    def _initialize_scalers(self) -> Dict[ResourceType, ResourceScaler]:
        """Initialize resource scalers with county-specific limits"""
        return {
            ResourceType.DATABASE_CONNECTIONS: ResourceScaler(
                ResourceType.DATABASE_CONNECTIONS,
                ResourceLimits(min_value=5, max_value=50, scale_up_threshold=80, scale_down_threshold=30)
            ),
            ResourceType.CACHE_SIZE: ResourceScaler(
                ResourceType.CACHE_SIZE,
                ResourceLimits(min_value=50, max_value=500, scale_up_threshold=85, scale_down_threshold=25)  # MB
            ),
            ResourceType.WORKER_THREADS: ResourceScaler(
                ResourceType.WORKER_THREADS,
                ResourceLimits(min_value=2, max_value=20, scale_up_threshold=75, scale_down_threshold=35)
            )
        }
    
    def register_scaling_callback(self, resource_type: ResourceType, callback: callable):
        """Register callback for actual resource scaling"""
        self.scaling_callbacks[resource_type] = callback
    
    def start_auto_scaling(self):
        """Start automatic scaling"""
        if self.is_running:
            return
        
        self.is_running = True
        self.scaling_thread = threading.Thread(target=self._scaling_loop, daemon=True)
        self.scaling_thread.start()
        logger.info("Auto-scaling engine started")
    
    def stop_auto_scaling(self):
        """Stop automatic scaling"""
        self.is_running = False
        if self.scaling_thread:
            self.scaling_thread.join(timeout=10)
        logger.info("Auto-scaling engine stopped")
    
    def _scaling_loop(self):
        """Main auto-scaling loop"""
        while self.is_running:
            try:
                self._perform_scaling_analysis()
                time.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Auto-scaling error: {e}")
                time.sleep(60)
    
    def _perform_scaling_analysis(self):
        """Perform scaling analysis and actions"""
        now = datetime.now()
        
        # Get current system metrics (would integrate with actual monitoring)
        current_metrics = self._get_current_metrics()
        
        # Record data for learning
        self.predictor.record_workload_data(
            now,
            current_metrics["cpu_usage"],
            current_metrics["memory_usage"],
            current_metrics["request_count"],
            current_metrics["response_time"]
        )
        
        # Get predictions for next hour
        predictions = self.predictor.predict_load(now + timedelta(hours=1))
        
        # Analyze each resource type
        scaling_decisions = []
        
        for resource_type, scaler in self.scalers.items():
            utilization = self._get_resource_utilization(resource_type, current_metrics)
            should_scale, direction = scaler.should_scale(utilization, predictions)
            
            if should_scale:
                new_value = scaler.execute_scaling(direction)
                
                # Execute actual scaling via callback
                if resource_type in self.scaling_callbacks:
                    try:
                        self.scaling_callbacks[resource_type](new_value)
                    except Exception as e:
                        logger.error(f"Scaling callback error for {resource_type.value}: {e}")
                
                scaling_decisions.append(ScalingMetric(
                    timestamp=now,
                    resource_type=resource_type,
                    current_value=new_value,
                    target_value=new_value,
                    utilization_percent=utilization,
                    prediction_confidence=predictions["confidence"],
                    scaling_direction=direction
                ))
        
        # Record metrics
        if scaling_decisions:
            self.metrics_history.extend(scaling_decisions)
    
    def _get_current_metrics(self) -> Dict[str, float]:
        """Get current system metrics (placeholder - would integrate with monitoring)"""
        try:
            import psutil
            cpu_usage = psutil.cpu_percent(interval=1)
            memory_usage = psutil.virtual_memory().percent
            
            # Simulate request metrics based on CPU load
            request_count = max(1, int(cpu_usage * 2))
            response_time = 100 + (cpu_usage * 10)  # Increase response time with CPU
            
            return {
                "cpu_usage": cpu_usage,
                "memory_usage": memory_usage,
                "request_count": request_count,
                "response_time": response_time
            }
        except:
            # Fallback values
            return {
                "cpu_usage": 45.0,
                "memory_usage": 60.0,
                "request_count": 50,
                "response_time": 150
            }
    
    def _get_resource_utilization(self, resource_type: ResourceType, metrics: Dict[str, float]) -> float:
        """Get utilization percentage for specific resource"""
        if resource_type == ResourceType.DATABASE_CONNECTIONS:
            # Simulate DB connection utilization based on request count
            scaler = self.scalers[resource_type]
            connection_usage = min(metrics["request_count"] / 2, scaler.current_value)
            return (connection_usage / scaler.current_value) * 100
        
        elif resource_type == ResourceType.CACHE_SIZE:
            # Cache utilization tends to follow memory patterns
            return metrics["memory_usage"] * 0.8  # Assuming cache uses 80% of memory pressure
        
        elif resource_type == ResourceType.WORKER_THREADS:
            # Worker thread utilization follows CPU patterns
            return metrics["cpu_usage"]
        
        return 50.0  # Default
    
    def get_scaling_status(self) -> Dict[str, Any]:
        """Get current scaling status and metrics"""
        recent_predictions = self.predictor.predict_load(datetime.now() + timedelta(hours=1))
        
        return {
            "auto_scaling_active": self.is_running,
            "resource_status": {
                resource_type.value: {
                    "current_value": scaler.current_value,
                    "min_value": scaler.limits.min_value,
                    "max_value": scaler.limits.max_value,
                    "last_scaling": scaler.last_scaling_time.isoformat() if scaler.last_scaling_time else None,
                    "scaling_history_count": len(scaler.scaling_history)
                }
                for resource_type, scaler in self.scalers.items()
            },
            "predictions": recent_predictions,
            "historical_data_points": len(self.predictor.historical_data),
            "pattern_confidence": self.predictor.patterns.get("county_workload", {}).get("confidence_score", 0.0),
            "recent_scaling_actions": [asdict(metric) for metric in list(self.metrics_history)[-10:]],
            "last_updated": datetime.now().isoformat()
        }
    
    def get_optimization_recommendations(self) -> List[Dict[str, Any]]:
        """Get scaling optimization recommendations"""
        recommendations = []
        
        # Analyze scaling patterns
        recent_scalings = list(self.metrics_history)[-20:]
        
        if len(recent_scalings) > 5:
            # Check for oscillation (frequent up/down scaling)
            directions = [m.scaling_direction for m in recent_scalings]
            up_count = directions.count(ScalingDirection.UP)
            down_count = directions.count(ScalingDirection.DOWN)
            
            if abs(up_count - down_count) <= 2 and (up_count + down_count) > 10:
                recommendations.append({
                    "type": "SCALING_OSCILLATION",
                    "priority": "HIGH",
                    "description": "Frequent scaling oscillation detected",
                    "recommendation": "Increase cooldown periods or adjust thresholds",
                    "impact": "Reduced system instability"
                })
        
        # Check for underutilized resources
        for resource_type, scaler in self.scalers.items():
            if scaler.current_value > scaler.limits.min_value * 2:
                recent_history = list(scaler.scaling_history)[-10:]
                down_scalings = [h for h in recent_history if h["direction"] == "DOWN"]
                
                if len(down_scalings) < 2:  # Not scaling down enough
                    recommendations.append({
                        "type": "UNDERUTILIZATION",
                        "priority": "MEDIUM",
                        "resource": resource_type.value,
                        "description": f"{resource_type.value} may be over-provisioned",
                        "recommendation": "Consider lowering scale-down threshold",
                        "impact": "Cost optimization"
                    })
        
        # County-specific recommendations
        if self.predictor.patterns and "county_workload" in self.predictor.patterns:
            pattern = self.predictor.patterns["county_workload"]
            
            # Assessment period preparation
            now = datetime.now()
            if self.predictor._is_assessment_period(now + timedelta(days=30)):
                recommendations.append({
                    "type": "SEASONAL_PREPARATION",
                    "priority": "HIGH",
                    "description": "Assessment period approaching in 30 days",
                    "recommendation": "Pre-scale resources to handle increased load",
                    "impact": "Prevent performance degradation during peak period"
                })
        
        return recommendations

# Global auto-scaling engine
auto_scaler = AutoScalingEngine()

def get_auto_scaler():
    """Get global auto-scaling engine"""
    return auto_scaler

def initialize_auto_scaling():
    """Initialize auto-scaling with county-specific configuration"""
    # Register scaling callbacks (would integrate with actual resource managers)
    def scale_database_connections(new_value: float):
        logger.info(f"Would scale database connections to {new_value}")
        # Integration point for actual database pool scaling
    
    def scale_cache_size(new_value: float):
        logger.info(f"Would scale cache size to {new_value} MB")
        # Integration point for actual cache scaling
    
    def scale_worker_threads(new_value: float):
        logger.info(f"Would scale worker threads to {new_value}")
        # Integration point for actual thread pool scaling
    
    auto_scaler.register_scaling_callback(ResourceType.DATABASE_CONNECTIONS, scale_database_connections)
    auto_scaler.register_scaling_callback(ResourceType.CACHE_SIZE, scale_cache_size)
    auto_scaler.register_scaling_callback(ResourceType.WORKER_THREADS, scale_worker_threads)
    
    auto_scaler.start_auto_scaling()
    logger.info("Auto-scaling initialized for county operations")