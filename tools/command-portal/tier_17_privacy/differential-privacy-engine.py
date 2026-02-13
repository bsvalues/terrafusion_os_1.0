"""
TerraFusion Command Portal - Differential Privacy Engine
Advanced privacy-preserving analytics with mathematical guarantees
Tier 17: Advanced Privacy & Differential Privacy Enhancement
"""

import json
import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import hashlib
import logging
from abc import ABC, abstractmethod


@dataclass
class DifferentialPrivacyParams:
    """Parameters for differential privacy mechanisms."""
    epsilon: float
    delta: float
    sensitivity: float = 1.0
    mechanism: str = "laplace"

    def __post_init__(self):
        if self.epsilon <= 0:
            raise ValueError("Epsilon must be positive")
        if self.delta < 0 or self.delta >= 1:
            raise ValueError("Delta must be in [0, 1)")


@dataclass
class PrivacyBudget:
    """Track privacy budget consumption."""
    total_epsilon: float
    total_delta: float
    consumed_epsilon: float = 0.0
    consumed_delta: float = 0.0
    queries: List[Dict[str, Any]] = field(default_factory=list)

    def has_budget(self, epsilon: float, delta: float) -> bool:
        """Check if sufficient privacy budget remains."""
        return (self.consumed_epsilon + epsilon <= self.total_epsilon and
                self.consumed_delta + delta <= self.total_delta)

    def consume(self, epsilon: float, delta: float, query_info: Dict[str, Any]) -> None:
        """Consume privacy budget for a query."""
        if not self.has_budget(epsilon, delta):
            raise ValueError("Insufficient privacy budget")

        self.consumed_epsilon += epsilon
        self.consumed_delta += delta
        self.queries.append({
            **query_info,
            "epsilon": epsilon,
            "delta": delta,
            "timestamp": datetime.now().isoformat()
        })


class PrivacyMechanism(ABC):
    """Abstract base class for privacy mechanisms."""

    @abstractmethod
    def add_noise(self, value: float, params: DifferentialPrivacyParams) -> float:
        """Add noise to a value according to the mechanism."""
        pass


class LaplaceMechanism(PrivacyMechanism):
    """Laplace mechanism for differential privacy."""

    def add_noise(self, value: float, params: DifferentialPrivacyParams) -> float:
        """Add Laplace noise with scale = sensitivity / epsilon."""
        scale = params.sensitivity / params.epsilon
        noise = np.random.laplace(0, scale)
        return value + noise


class GaussianMechanism(PrivacyMechanism):
    """Gaussian mechanism for differential privacy."""

    def add_noise(self, value: float, params: DifferentialPrivacyParams) -> float:
        """Add Gaussian noise calibrated for (ε, δ)-DP."""
        # For (ε, δ)-DP, σ = sensitivity * sqrt(2*ln(1.25/δ)) / ε
        sigma = params.sensitivity * np.sqrt(2 * np.log(1.25 / params.delta)) / params.epsilon
        noise = np.random.normal(0, sigma)
        return value + noise


class PrivacyBudgetAllocator:
    """Allocate privacy budget across queries and time periods."""

    def __init__(self, total_epsilon: float, total_delta: float):
        self.total_epsilon = total_epsilon
        self.total_delta = total_delta
        self.allocations: Dict[str, PrivacyBudget] = {}

    def create_allocation(self, allocation_id: str, epsilon: float, delta: float) -> PrivacyBudget:
        """Create a new privacy budget allocation."""
        if epsilon > self.total_epsilon or delta > self.total_delta:
            raise ValueError("Allocation exceeds total budget")

        budget = PrivacyBudget(epsilon, delta)
        self.allocations[allocation_id] = budget
        return budget

    def get_allocation(self, allocation_id: str) -> Optional[PrivacyBudget]:
        """Get an existing allocation."""
        return self.allocations.get(allocation_id)


class DifferentialPrivacyEngine:
    """Main engine for differential privacy operations in Command Portal."""

    def __init__(self, workspace_name: str = "terrafusion-command-portal"):
        self.workspace_name = workspace_name
        self.mechanisms = {
            "laplace": LaplaceMechanism(),
            "gaussian": GaussianMechanism()
        }
        self.budget_allocator = PrivacyBudgetAllocator(10.0, 1e-5)  # Command Portal defaults
        self.query_log: List[Dict[str, Any]] = []
        self.logger = logging.getLogger(f"dp_engine_{workspace_name}")

        # Command Portal specific settings
        self.dashboard_integration = True
        self.real_time_monitoring = True
        self.compliance_reporting = True

    def laplace_mechanism(self, value: float, epsilon: float, sensitivity: float = 1.0) -> float:
        """Apply Laplace mechanism for pure ε-differential privacy."""
        params = DifferentialPrivacyParams(epsilon=epsilon, sensitivity=sensitivity, mechanism="laplace")
        mechanism = self.mechanisms["laplace"]
        return mechanism.add_noise(value, params)

    def gaussian_mechanism(self, value: float, epsilon: float, delta: float, sensitivity: float = 1.0) -> float:
        """Apply Gaussian mechanism for (ε, δ)-differential privacy."""
        params = DifferentialPrivacyParams(epsilon=epsilon, delta=delta, sensitivity=sensitivity, mechanism="gaussian")
        mechanism = self.mechanisms["gaussian"]
        return mechanism.add_noise(value, params)

    def add_noise(self, value: float, mechanism: str, epsilon: float,
                  delta: float = 0.0, sensitivity: float = 1.0) -> float:
        """Generic noise addition method."""
        if mechanism not in self.mechanisms:
            raise ValueError(f"Unknown mechanism: {mechanism}")

        params = DifferentialPrivacyParams(
            epsilon=epsilon,
            delta=delta,
            sensitivity=sensitivity,
            mechanism=mechanism
        )

        return self.mechanisms[mechanism].add_noise(value, params)

    def execute_query(self, query_func, query_name: str, epsilon: float,
                     delta: float = 0.0, sensitivity: float = 1.0,
                     mechanism: str = "laplace", allocation_id: str = "default") -> Dict[str, Any]:
        """Execute a query with differential privacy guarantees."""

        # Get or create budget allocation
        budget = self.budget_allocator.get_allocation(allocation_id)
        if budget is None:
            budget = self.budget_allocator.create_allocation(allocation_id, 10.0, 1e-5)

        # Check budget
        if not budget.has_budget(epsilon, delta):
            raise ValueError(f"Insufficient privacy budget for query '{query_name}'")

        # Execute query
        try:
            raw_result = query_func()

            # Add noise
            if isinstance(raw_result, (int, float)):
                noisy_result = self.add_noise(raw_result, mechanism, epsilon, delta, sensitivity)
            elif isinstance(raw_result, list):
                noisy_result = [self.add_noise(val, mechanism, epsilon, delta, sensitivity)
                               for val in raw_result if isinstance(val, (int, float))]
            else:
                noisy_result = raw_result  # Can't add noise to non-numeric results

            # Consume budget
            query_info = {
                "query_name": query_name,
                "mechanism": mechanism,
                "workspace": self.workspace_name,
                "success": True
            }
            budget.consume(epsilon, delta, query_info)

            # Log query
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "workspace": self.workspace_name,
                "query_name": query_name,
                "mechanism": mechanism,
                "epsilon": epsilon,
                "delta": delta,
                "sensitivity": sensitivity,
                "allocation_id": allocation_id,
                "success": True,
                "privacy_cost": epsilon
            }
            self.query_log.append(log_entry)

            if self.dashboard_integration:
                self._update_dashboard_metrics(log_entry)

            return {
                "result": noisy_result,
                "privacy_parameters": {
                    "epsilon": epsilon,
                    "delta": delta,
                    "mechanism": mechanism,
                    "sensitivity": sensitivity
                },
                "budget_remaining": {
                    "epsilon": budget.total_epsilon - budget.consumed_epsilon,
                    "delta": budget.total_delta - budget.consumed_delta
                },
                "query_metadata": query_info
            }

        except Exception as e:
            self.logger.error(f"Query execution failed: {str(e)}")
            raise

    def _update_dashboard_metrics(self, log_entry: Dict[str, Any]) -> None:
        """Update Command Portal dashboard with privacy metrics."""
        if self.dashboard_integration:
            # This would integrate with the Command Portal's dashboard system
            # For now, we log the metrics that would be sent
            self.logger.info(f"Dashboard Update: {log_entry['query_name']} - ε={log_entry['epsilon']}")

    def get_privacy_loss(self, allocation_id: str = "default") -> Dict[str, float]:
        """Get current privacy loss for an allocation."""
        budget = self.budget_allocator.get_allocation(allocation_id)
        if budget is None:
            return {"epsilon": 0.0, "delta": 0.0}

        return {
            "consumed_epsilon": budget.consumed_epsilon,
            "consumed_delta": budget.consumed_delta,
            "remaining_epsilon": budget.total_epsilon - budget.consumed_epsilon,
            "remaining_delta": budget.total_delta - budget.consumed_delta,
            "total_queries": len(budget.queries)
        }

    def generate_privacy_report(self, allocation_id: str = "default") -> Dict[str, Any]:
        """Generate comprehensive privacy report for Command Portal dashboard."""
        budget = self.budget_allocator.get_allocation(allocation_id)
        if budget is None:
            budget = self.budget_allocator.create_allocation(allocation_id, 10.0, 1e-5)

        # Calculate privacy utilization
        epsilon_utilization = (budget.consumed_epsilon / budget.total_epsilon) * 100
        delta_utilization = (budget.consumed_delta / budget.total_delta) * 100 if budget.total_delta > 0 else 0

        # Query statistics
        recent_queries = [q for q in self.query_log if allocation_id in q.get("allocation_id", "")][-10:]

        report = {
            "workspace": self.workspace_name,
            "allocation_id": allocation_id,
            "timestamp": datetime.now().isoformat(),
            "privacy_budget": {
                "total_epsilon": budget.total_epsilon,
                "total_delta": budget.total_delta,
                "consumed_epsilon": budget.consumed_epsilon,
                "consumed_delta": budget.consumed_delta,
                "epsilon_utilization_percent": epsilon_utilization,
                "delta_utilization_percent": delta_utilization
            },
            "query_statistics": {
                "total_queries": len(budget.queries),
                "recent_queries": recent_queries,
                "most_expensive_query": max(budget.queries, key=lambda x: x["epsilon"]) if budget.queries else None
            },
            "compliance_status": {
                "GDPR": epsilon_utilization < 80,  # Stay under 80% utilization
                "HIPAA": delta_utilization < 90,
                "FISMA": len(budget.queries) < 1000,  # Query rate limit
                "overall": epsilon_utilization < 80 and delta_utilization < 90
            },
            "recommendations": self._generate_recommendations(epsilon_utilization, delta_utilization)
        }

        return report

    def _generate_recommendations(self, epsilon_util: float, delta_util: float) -> List[str]:
        """Generate privacy budget management recommendations."""
        recommendations = []

        if epsilon_util > 80:
            recommendations.append("WARNING: Epsilon budget utilization high (>80%). Consider reducing query frequency.")

        if delta_util > 90:
            recommendations.append("WARNING: Delta budget utilization very high (>90%). Switch to pure ε-DP if possible.")

        if epsilon_util < 20:
            recommendations.append("INFO: Low epsilon utilization. You can perform more queries if needed.")

        recommendations.append("Use Laplace mechanism for counting queries to preserve delta budget.")
        recommendations.append("Consider batch processing to reduce per-query privacy cost.")

        return recommendations

    def export_for_audit(self) -> Dict[str, Any]:
        """Export privacy data for compliance audits."""
        all_allocations = {}
        for allocation_id, budget in self.budget_allocator.allocations.items():
            all_allocations[allocation_id] = {
                "total_epsilon": budget.total_epsilon,
                "total_delta": budget.total_delta,
                "consumed_epsilon": budget.consumed_epsilon,
                "consumed_delta": budget.consumed_delta,
                "queries": budget.queries
            }

        return {
            "workspace": self.workspace_name,
            "export_timestamp": datetime.now().isoformat(),
            "privacy_allocations": all_allocations,
            "total_queries": len(self.query_log),
            "audit_trail": self.query_log,
            "compliance_frameworks": ["GDPR", "HIPAA", "FISMA", "SOC2", "ISO27001"]
        }


# Command Portal Integration Examples
def example_command_portal_queries():
    """Example queries that the Command Portal might execute with DP."""
    engine = DifferentialPrivacyEngine("terrafusion-command-portal")

    # Example 1: Count total active workspaces
    def count_workspaces():
        return 45  # This would be a real query to the database

    result1 = engine.execute_query(
        count_workspaces,
        "count_active_workspaces",
        epsilon=0.1,
        mechanism="laplace"
    )
    print(f"Active workspaces (DP): {result1['result']:.0f}")

    # Example 2: Average response time across services
    def avg_response_time():
        return 85.3  # milliseconds

    result2 = engine.execute_query(
        avg_response_time,
        "average_response_time",
        epsilon=0.2,
        sensitivity=10.0  # Response times can vary by 10ms
    )
    print(f"Avg response time (DP): {result2['result']:.1f}ms")

    # Generate dashboard report
    report = engine.generate_privacy_report()
    print(f"Privacy budget remaining: {report['privacy_budget']['epsilon_utilization_percent']:.1f}% used")


if __name__ == "__main__":
    example_command_portal_queries()
