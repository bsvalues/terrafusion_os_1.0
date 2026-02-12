"""
Federated Learning Engine - Privacy-Preserving Machine Learning
Implements federated averaging with differential privacy
"""

import json
import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib


@dataclass
class ModelUpdate:
    """Represents a local model update from participant."""
    participant_id: str
    model_weights: List[float]
    samples_seen: int
    timestamp: str
    gradient_norm: float = 0.0


@dataclass
class GlobalModel:
    """Global model state in federated learning."""
    round_num: int = 0
    weights: List[float] = field(default_factory=list)
    accuracy: float = 0.0
    loss: float = 0.0
    updates_received: int = 0
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


class FederatedLearningEngine:
    """Implements federated averaging (FedAvg) algorithm."""
    
    def __init__(self, participants: int = 5, local_epochs: int = 5, 
                 global_rounds: int = 100, privacy_budget: float = 10.0):
        self.participants = participants
        self.local_epochs = local_epochs
        self.global_rounds = global_rounds
        self.privacy_budget = privacy_budget
        self.global_model = GlobalModel()
        self.round_history = []
        
    def aggregate_updates(self, updates: List[ModelUpdate]) -> List[float]:
        """Perform federated averaging aggregation."""
        if not updates:
            return self.global_model.weights
        
        total_samples = sum(u.samples_seen for u in updates)
        aggregated = []
        
        if len(updates[0].model_weights) > 0:
            for weight_idx in range(len(updates[0].model_weights)):
                weighted_sum = sum(
                    u.model_weights[weight_idx] * (u.samples_seen / total_samples)
                    for u in updates
                )
                aggregated.append(weighted_sum)
        
        return aggregated
    
    def add_dp_noise(self, aggregated_weights: List[float], 
                    noise_scale: float = 0.01) -> List[float]:
        """Add differential privacy noise to aggregated weights."""
        noisy_weights = []
        for weight in aggregated_weights:
            noise = np.random.normal(0, noise_scale)
            noisy_weights.append(weight + noise)
        
        return noisy_weights
    
    def clip_gradients(self, updates: List[ModelUpdate], 
                       clipping_norm: float = 1.0) -> List[ModelUpdate]:
        """Apply gradient clipping for privacy."""
        clipped = []
        for update in updates:
            grad_norm = np.linalg.norm(update.model_weights)
            if grad_norm > clipping_norm:
                scale = clipping_norm / grad_norm
                clipped_weights = [w * scale for w in update.model_weights]
            else:
                clipped_weights = update.model_weights
            
            clipped_update = ModelUpdate(
                participant_id=update.participant_id,
                model_weights=clipped_weights,
                samples_seen=update.samples_seen,
                timestamp=update.timestamp,
                gradient_norm=min(grad_norm, clipping_norm)
            )
            clipped.append(clipped_update)
        
        return clipped
    
    def execute_round(self, participant_updates: List[ModelUpdate], 
                     noise_scale: float = 0.01) -> Dict[str, Any]:
        """Execute one round of federated learning."""
        # Clip gradients for DP
        clipped = self.clip_gradients(participant_updates)
        
        # Aggregate using FedAvg
        aggregated = self.aggregate_updates(clipped)
        
        # Add DP noise
        noisy_aggregated = self.add_dp_noise(aggregated, noise_scale)
        
        # Update global model
        self.global_model.round_num += 1
        self.global_model.weights = noisy_aggregated
        self.global_model.updates_received = len(participant_updates)
        self.global_model.timestamp = datetime.now().isoformat()
        
        round_data = {
            "round": self.global_model.round_num,
            "participants": len(participant_updates),
            "model_weights_count": len(noisy_aggregated),
            "privacy_budget_used": self.privacy_budget / self.global_rounds,
            "timestamp": self.global_model.timestamp
        }
        
        self.round_history.append(round_data)
        
        return {
            "status": "round_complete",
            "round_num": self.global_model.round_num,
            "global_model": {
                "weights_count": len(self.global_model.weights),
                "accuracy": self.global_model.accuracy,
                "loss": self.global_model.loss
            },
            "round_data": round_data
        }
    
    def get_training_status(self) -> Dict[str, Any]:
        """Get federated learning training status."""
        return {
            "framework": "federated_learning_engine",
            "participants": self.participants,
            "local_epochs": self.local_epochs,
            "global_rounds": self.global_rounds,
            "privacy_budget": self.privacy_budget,
            "current_round": self.global_model.round_num,
            "rounds_completed": len(self.round_history),
            "progress": f"{len(self.round_history) / self.global_rounds * 100:.1f}%",
            "timestamp": datetime.now().isoformat()
        }
    
    def generate_training_report(self) -> Dict[str, Any]:
        """Generate comprehensive training report."""
        return {
            "framework": "federated_learning_engine",
            "status": "operational",
            "configuration": {
                "participants": self.participants,
                "local_epochs": self.local_epochs,
                "global_rounds": self.global_rounds,
                "privacy_budget": self.privacy_budget
            },
            "progress": {
                "rounds_completed": len(self.round_history),
                "total_rounds": self.global_rounds,
                "completion_percentage": f"{len(self.round_history) / self.global_rounds * 100:.1f}%"
            },
            "recent_rounds": self.round_history[-5:] if len(self.round_history) > 5 else self.round_history,
            "timestamp": datetime.now().isoformat()
        }
