"""
Enterprise Circuit Breaker Pattern for TerraFusion Platform

Implements fault tolerance and resilience patterns for county assessment systems:
- Circuit breaker pattern for external service calls
- Automatic failure detection and recovery
- Degraded service mode for critical operations
- Health monitoring and alerting
- Fallback strategies for county operations
"""

import time
import logging
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable, Union
from dataclasses import dataclass, asdict
from enum import Enum
from collections import deque
import statistics

logger = logging.getLogger(__name__)

class CircuitState(Enum):
    CLOSED = "CLOSED"      # Normal operation
    OPEN = "OPEN"          # Failing, blocking requests
    HALF_OPEN = "HALF_OPEN" # Testing if service recovered

@dataclass
class CircuitBreakerConfig:
    """Circuit breaker configuration"""
    failure_threshold: int = 5          # Failures before opening
    success_threshold: int = 3          # Successes before closing from half-open
    timeout_duration: int = 60          # Seconds to wait before trying half-open
    health_check_interval: int = 30     # Seconds between health checks
    slow_call_threshold: float = 5.0    # Seconds for slow call detection
    max_slow_calls: int = 3             # Max slow calls before opening

@dataclass
class CircuitMetrics:
    """Circuit breaker metrics"""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    slow_requests: int = 0
    state_changes: int = 0
    last_failure_time: Optional[datetime] = None
    last_success_time: Optional[datetime] = None
    average_response_time: float = 0.0

class CircuitBreaker:
    """Enterprise-grade circuit breaker implementation"""
    
    def __init__(self, name: str, config: CircuitBreakerConfig = None):
        self.name = name
        self.config = config or CircuitBreakerConfig()
        self.state = CircuitState.CLOSED
        self.metrics = CircuitMetrics()
        self.failure_count = 0
        self.success_count = 0
        self.last_failure_time = None
        self.response_times = deque(maxlen=100)  # Track last 100 response times
        self.lock = threading.RLock()
        
        # Health monitoring
        self.health_monitor_thread = None
        self.health_check_function = None
        self.is_monitoring = False
        
    def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection"""
        with self.lock:
            self.metrics.total_requests += 1
            
            # Check if circuit is open
            if self.state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self._transition_to_half_open()
                else:
                    raise CircuitBreakerOpenError(f"Circuit breaker {self.name} is OPEN")
            
            # Execute the function
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                execution_time = time.time() - start_time
                self._record_success(execution_time)
                return result
                
            except Exception as e:
                execution_time = time.time() - start_time
                self._record_failure(execution_time)
                raise e
    
    def _record_success(self, execution_time: float):
        """Record successful execution"""
        self.metrics.successful_requests += 1
        self.metrics.last_success_time = datetime.now()
        self.response_times.append(execution_time)
        
        # Check for slow calls
        if execution_time > self.config.slow_call_threshold:
            self.metrics.slow_requests += 1
            logger.warning(f"Slow call detected in {self.name}: {execution_time:.2f}s")
            
            # Too many slow calls can open circuit
            if self.metrics.slow_requests >= self.config.max_slow_calls:
                self._transition_to_open("Too many slow calls")
                return
        
        # Handle state transitions on success
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            if self.success_count >= self.config.success_threshold:
                self._transition_to_closed()
        elif self.state == CircuitState.CLOSED:
            # Reset failure count on success
            self.failure_count = 0
            
        # Update average response time
        if self.response_times:
            self.metrics.average_response_time = statistics.mean(self.response_times)
    
    def _record_failure(self, execution_time: float):
        """Record failed execution"""
        self.metrics.failed_requests += 1
        self.metrics.last_failure_time = datetime.now()
        self.last_failure_time = datetime.now()
        self.failure_count += 1
        
        logger.error(f"Failure recorded in circuit {self.name}: count={self.failure_count}")
        
        # Check if we should open the circuit
        if self.failure_count >= self.config.failure_threshold:
            self._transition_to_open("Failure threshold exceeded")
        elif self.state == CircuitState.HALF_OPEN:
            # Any failure in half-open state opens circuit
            self._transition_to_open("Failure in half-open state")
    
    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to attempt reset"""
        if not self.last_failure_time:
            return True
        
        time_since_failure = datetime.now() - self.last_failure_time
        return time_since_failure.total_seconds() >= self.config.timeout_duration
    
    def _transition_to_open(self, reason: str):
        """Transition circuit to OPEN state"""
        if self.state != CircuitState.OPEN:
            old_state = self.state
            self.state = CircuitState.OPEN
            self.metrics.state_changes += 1
            logger.error(f"Circuit {self.name} opened: {old_state} -> OPEN. Reason: {reason}")
    
    def _transition_to_half_open(self):
        """Transition circuit to HALF_OPEN state"""
        old_state = self.state
        self.state = CircuitState.HALF_OPEN
        self.success_count = 0
        self.metrics.state_changes += 1
        logger.info(f"Circuit {self.name} half-opened: {old_state} -> HALF_OPEN")
    
    def _transition_to_closed(self):
        """Transition circuit to CLOSED state"""
        old_state = self.state
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.success_count = 0
        self.metrics.state_changes += 1
        logger.info(f"Circuit {self.name} closed: {old_state} -> CLOSED")
    
    def register_health_check(self, health_check_func: Callable[[], bool]):
        """Register health check function for proactive monitoring"""
        self.health_check_function = health_check_func
        
    def start_health_monitoring(self):
        """Start background health monitoring"""
        if self.is_monitoring or not self.health_check_function:
            return
            
        self.is_monitoring = True
        self.health_monitor_thread = threading.Thread(
            target=self._health_monitor_loop, 
            daemon=True
        )
        self.health_monitor_thread.start()
        logger.info(f"Health monitoring started for circuit {self.name}")
    
    def stop_health_monitoring(self):
        """Stop background health monitoring"""
        self.is_monitoring = False
        if self.health_monitor_thread:
            self.health_monitor_thread.join(timeout=5)
        logger.info(f"Health monitoring stopped for circuit {self.name}")
    
    def _health_monitor_loop(self):
        """Background health monitoring loop"""
        while self.is_monitoring:
            try:
                if self.state == CircuitState.OPEN and self.health_check_function:
                    # Proactive health check for open circuits
                    if self.health_check_function():
                        logger.info(f"Health check passed for {self.name}, transitioning to half-open")
                        with self.lock:
                            self._transition_to_half_open()
                
                time.sleep(self.config.health_check_interval)
                
            except Exception as e:
                logger.error(f"Health monitoring error for {self.name}: {e}")
    
    def force_open(self, reason: str = "Manual override"):
        """Manually force circuit open"""
        with self.lock:
            self._transition_to_open(reason)
    
    def force_close(self, reason: str = "Manual override"):
        """Manually force circuit closed"""
        with self.lock:
            old_state = self.state
            self.state = CircuitState.CLOSED
            self.failure_count = 0
            self.success_count = 0
            self.metrics.state_changes += 1
            logger.info(f"Circuit {self.name} manually closed: {old_state} -> CLOSED. Reason: {reason}")
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get circuit breaker metrics"""
        success_rate = 0.0
        if self.metrics.total_requests > 0:
            success_rate = (self.metrics.successful_requests / self.metrics.total_requests) * 100
        
        return {
            "name": self.name,
            "state": self.state.value,
            "metrics": asdict(self.metrics),
            "success_rate_percent": round(success_rate, 2),
            "failure_count": self.failure_count,
            "config": asdict(self.config),
            "last_state_change": self.metrics.last_failure_time.isoformat() if self.metrics.last_failure_time else None
        }

class CircuitBreakerOpenError(Exception):
    """Exception raised when circuit breaker is open"""
    pass

class CircuitBreakerManager:
    """Manages multiple circuit breakers for different services"""
    
    def __init__(self):
        self.circuits: Dict[str, CircuitBreaker] = {}
        self.default_config = CircuitBreakerConfig()
        
    def get_or_create_circuit(self, name: str, config: CircuitBreakerConfig = None) -> CircuitBreaker:
        """Get existing circuit or create new one"""
        if name not in self.circuits:
            self.circuits[name] = CircuitBreaker(name, config or self.default_config)
        return self.circuits[name]
    
    def call_with_circuit_breaker(self, service_name: str, func: Callable, 
                                 fallback_func: Callable = None, 
                                 config: CircuitBreakerConfig = None, 
                                 *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection and optional fallback"""
        circuit = self.get_or_create_circuit(service_name, config)
        
        try:
            return circuit.call(func, *args, **kwargs)
        except CircuitBreakerOpenError:
            logger.warning(f"Circuit {service_name} is open, attempting fallback")
            if fallback_func:
                return fallback_func(*args, **kwargs)
            else:
                raise ServiceUnavailableError(f"Service {service_name} is unavailable and no fallback provided")
    
    def get_all_metrics(self) -> Dict[str, Any]:
        """Get metrics for all circuit breakers"""
        return {
            name: circuit.get_metrics() 
            for name, circuit in self.circuits.items()
        }
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health based on circuit states"""
        total_circuits = len(self.circuits)
        if total_circuits == 0:
            return {"status": "NO_CIRCUITS", "health_score": 100}
        
        open_circuits = sum(1 for c in self.circuits.values() if c.state == CircuitState.OPEN)
        half_open_circuits = sum(1 for c in self.circuits.values() if c.state == CircuitState.HALF_OPEN)
        closed_circuits = sum(1 for c in self.circuits.values() if c.state == CircuitState.CLOSED)
        
        # Calculate health score
        health_score = (closed_circuits / total_circuits) * 100
        
        if open_circuits == 0:
            status = "HEALTHY"
        elif open_circuits < total_circuits * 0.3:  # Less than 30% open
            status = "DEGRADED"
        else:
            status = "CRITICAL"
        
        return {
            "status": status,
            "health_score": round(health_score, 1),
            "total_circuits": total_circuits,
            "closed_circuits": closed_circuits,
            "half_open_circuits": half_open_circuits,
            "open_circuits": open_circuits,
            "circuits": {name: circuit.state.value for name, circuit in self.circuits.items()}
        }
    
    def start_all_health_monitoring(self):
        """Start health monitoring for all circuits"""
        for circuit in self.circuits.values():
            circuit.start_health_monitoring()
    
    def stop_all_health_monitoring(self):
        """Stop health monitoring for all circuits"""
        for circuit in self.circuits.values():
            circuit.stop_health_monitoring()

class ServiceUnavailableError(Exception):
    """Exception raised when service is unavailable and no fallback exists"""
    pass

# County-specific circuit breaker configurations
COUNTY_CIRCUIT_CONFIGS = {
    "pacs_conversion": CircuitBreakerConfig(
        failure_threshold=3,
        success_threshold=2,
        timeout_duration=120,  # 2 minutes for PACS systems
        slow_call_threshold=10.0,  # PACS can be slow
        max_slow_calls=5
    ),
    "gis_export": CircuitBreakerConfig(
        failure_threshold=5,
        success_threshold=3,
        timeout_duration=60,
        slow_call_threshold=15.0,  # GIS exports can be very slow
        max_slow_calls=3
    ),
    "district_lookup": CircuitBreakerConfig(
        failure_threshold=10,  # More tolerant for district lookups
        success_threshold=5,
        timeout_duration=30,
        slow_call_threshold=2.0,  # District lookups should be fast
        max_slow_calls=8
    ),
    "database": CircuitBreakerConfig(
        failure_threshold=3,
        success_threshold=2,
        timeout_duration=30,
        slow_call_threshold=5.0,
        max_slow_calls=5
    ),
    "external_api": CircuitBreakerConfig(
        failure_threshold=5,
        success_threshold=3,
        timeout_duration=90,
        slow_call_threshold=8.0,
        max_slow_calls=4
    )
}

# Global circuit breaker manager
circuit_manager = CircuitBreakerManager()

def with_circuit_breaker(service_name: str, fallback_func: Callable = None, 
                        config_name: str = None):
    """Decorator for circuit breaker protection"""
    def decorator(func: Callable):
        def wrapper(*args, **kwargs):
            config = COUNTY_CIRCUIT_CONFIGS.get(config_name) if config_name else None
            return circuit_manager.call_with_circuit_breaker(
                service_name, func, fallback_func, config, *args, **kwargs
            )
        return wrapper
    return decorator

def get_circuit_manager():
    """Get global circuit breaker manager"""
    return circuit_manager