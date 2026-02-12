import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from datetime import datetime
import logging

class AutonomousDecisionEngine:
    """AI-driven autonomous decision making engine."""

    def __init__(self, config):
        self.config = config
        self.logger = logging.getLogger(__name__)
        self.decision_history = []
        self.models = {}
        self.confidence_threshold = config.get('confidence_threshold', 0.90)

    async def make_decision(self, context, decision_type):
        """Make autonomous decision based on context."""
        try:
            self.logger.info(f"Making {decision_type} decision")
            
            # Extract features from context
            features = self._extract_features(context)
            
            # Get model prediction
            model = self._get_model(decision_type)
            prediction, confidence = model.predict_proba(features)
            
            # Log decision
            decision = {
                'timestamp': datetime.now().isoformat(),
                'type': decision_type,
                'prediction': prediction,
                'confidence': confidence,
                'context': context,
                'approved': confidence >= self.confidence_threshold,
            }
            
            self.decision_history.append(decision)
            
            return decision
            
        except Exception as e:
            self.logger.error(f"Decision making failed: {e}")
            return None

    async def recommend_action(self, situation):
        """Recommend autonomous action."""
        recommendations = []
        
        for action_type in ['scale', 'heal', 'optimize', 'alert']:
            decision = await self.make_decision(situation, action_type)
            if decision and decision['approved']:
                recommendations.append({
                    'action': action_type,
                    'confidence': decision['confidence'],
                    'timestamp': datetime.now().isoformat(),
                })
        
        return recommendations

    def _extract_features(self, context):
        """Extract ML features from context."""
        return np.array([[
            context.get('cpu_percent', 0),
            context.get('memory_percent', 0),
            context.get('error_rate', 0),
            context.get('latency_ms', 0),
        ]])

    def _get_model(self, decision_type):
        """Get decision model for type."""
        if decision_type not in self.models:
            self.models[decision_type] = GradientBoostingClassifier()
        return self.models[decision_type]

    async def explain_decision(self, decision):
        """Generate explanation for decision."""
        return {
            'decision': decision['type'],
            'confidence': decision['confidence'],
            'reasoning': f"Based on context: {decision['context']}",
            'alternative_actions': ['escalate', 'defer', 'reject'],
        }

    async def get_audit_trail(self):
        """Get decision audit trail."""
        return {
            'total_decisions': len(self.decision_history),
            'approved_decisions': len([d for d in self.decision_history if d['approved']]),
            'rejected_decisions': len([d for d in self.decision_history if not d['approved']]),
            'recent_decisions': self.decision_history[-10:],
        }

module.exports = AutonomousDecisionEngine;
