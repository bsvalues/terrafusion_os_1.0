"""
Differential Privacy Engine - Advanced Privacy-Preserving Analytics
Implements Laplace and Gaussian mechanisms with epsilon-delta guarantees
"""

import json
import math
import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Any, Tuple
from datetime import datetime, timedelta
import hashlib


@dataclass
class DifferentialPrivacyParams:
    """Differential privacy parameters."""
    epsilon: float
    delta: float
    sensitivity: float
    noise_mechanism: str = "laplace"
    
    def validate(self):
        """Validate DP parameters."""
        assert 0 < self.epsilon <= 10, "Epsilon must be in (0, 10]"
        assert 0 < self.delta <= 1, "Delta must be in (0, 1]"
        assert self.sensitivity > 0, "Sensitivity must be positive"


class DifferentialPrivacyEngine:
    """Implements differential privacy mechanisms."""
    
    def __init__(self, params: DifferentialPrivacyParams):
        self.params = params
        self.params.validate()
        self.query_log = []
        self.privacy_budget = params.epsilon
        
    def laplace_mechanism(self, query_result: float) -> float:
        """Add Laplace noise for differential privacy."""
        scale = self.params.sensitivity / self.params.epsilon
        noise = np.random.laplace(0, scale)
        return query_result + noise
    
    def gaussian_mechanism(self, query_result: float) -> float:
        """Add Gaussian noise for differential privacy."""
        sigma = self.params.sensitivity * math.sqrt(2 * math.log(1.25 / self.params.delta)) / self.params.epsilon
        noise = np.random.normal(0, sigma)
        return query_result + noise
    
    def add_noise(self, query_result: float) -> float:
        """Add noise based on configured mechanism."""
        if self.params.noise_mechanism == "laplace":
            return self.laplace_mechanism(query_result)
        elif self.params.noise_mechanism == "gaussian":
            return self.gaussian_mechanism(query_result)
        else:
            raise ValueError(f"Unknown noise mechanism: {self.params.noise_mechanism}")
    
    def execute_query(self, query_name: str, query_result: float, epsilon_cost: float = None) -> Dict[str, Any]:
        """Execute query with differential privacy guarantees."""
        if epsilon_cost is None:
            epsilon_cost = self.params.epsilon
        
        if epsilon_cost > self.privacy_budget:
            return {
                "status": "privacy_budget_exceeded",
                "query": query_name,
                "remaining_budget": self.privacy_budget,
                "required_cost": epsilon_cost,
                "result": None
            }
        
        noisy_result = self.add_noise(query_result)
        self.privacy_budget -= epsilon_cost
        
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "query": query_name,
            "true_result": query_result,
            "noisy_result": noisy_result,
            "epsilon_cost": epsilon_cost,
            "remaining_budget": self.privacy_budget,
            "mechanism": self.params.noise_mechanism
        }
        self.query_log.append(log_entry)
        
        return {
            "status": "success",
            "query": query_name,
            "result": noisy_result,
            "epsilon_cost": epsilon_cost,
            "remaining_budget": self.privacy_budget,
            "timestamp": log_entry["timestamp"]
        }
    
    def get_privacy_loss(self) -> Dict[str, Any]:
        """Calculate accumulated privacy loss."""
        total_epsilon_spent = self.params.epsilon - self.privacy_budget
        
        return {
            "total_epsilon_spent": total_epsilon_spent,
            "remaining_epsilon": self.privacy_budget,
            "delta": self.params.delta,
            "total_queries": len(self.query_log),
            "privacy_budget_exhausted": self.privacy_budget <= 0
        }
    
    def generate_privacy_report(self) -> Dict[str, Any]:
        """Generate detailed privacy report."""
        return {
            "framework": "differential_privacy_engine",
            "status": "operational",
            "epsilon": self.params.epsilon,
            "delta": self.params.delta,
            "sensitivity": self.params.sensitivity,
            "noise_mechanism": self.params.noise_mechanism,
            "total_queries": len(self.query_log),
            "privacy_loss": self.get_privacy_loss(),
            "queries_executed": self.query_log[-10:] if len(self.query_log) > 10 else self.query_log,
            "timestamp": datetime.now().isoformat()
        }


class PrivacyBudgetAllocator:
    """Allocate privacy budget across queries and analysis tasks."""
    
    def __init__(self, total_epsilon: float, total_delta: float):
        self.total_epsilon = total_epsilon
        self.total_delta = total_delta
        self.allocations = {}
    
    def allocate_budget(self, task_name: str, epsilon_fraction: float, delta_fraction: float = None) -> Dict[str, float]:
        """Allocate privacy budget to specific task."""
        if delta_fraction is None:
            delta_fraction = epsilon_fraction
        
        allocated = {
            "task": task_name,
            "epsilon": self.total_epsilon * epsilon_fraction,
            "delta": self.total_delta * delta_fraction,
            "allocation_date": datetime.now().isoformat()
        }
        
        self.allocations[task_name] = allocated
        return allocated
    
    def get_budget_status(self) -> Dict[str, Any]:
        """Get budget allocation status."""
        return {
            "total_epsilon": self.total_epsilon,
            "total_delta": self.total_delta,
            "allocations": self.allocations,
            "allocated_epsilon": sum(a["epsilon"] for a in self.allocations.values()),
            "allocated_delta": sum(a["delta"] for a in self.allocations.values()),
            "timestamp": datetime.now().isoformat()
        }
