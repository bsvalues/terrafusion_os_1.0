"""
Privacy Risk Assessment Engine - Evaluate Re-identification and Inference Attacks
"""

import json
import math
from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from datetime import datetime


@dataclass
class PrivacyRiskMetrics:
    """Privacy risk assessment metrics."""
    re_identification_risk: float
    information_leakage: float
    inference_attack_vulnerability: float
    membership_inference_risk: float
    overall_risk_score: float
    risk_level: str
    recommendations: List[str]


class PrivacyRiskAssessmentEngine:
    """Assess privacy risks including re-identification and inference attacks."""
    
    def __init__(self, dataset_size: int = 1000000, 
                 quasi_identifiers: int = 5,
                 sensitive_attributes: int = 10):
        self.dataset_size = dataset_size
        self.quasi_identifiers = quasi_identifiers
        self.sensitive_attributes = sensitive_attributes
        self.risk_assessments = []
    
    def calculate_re_identification_risk(self, k: int = 5) -> float:
        """Calculate k-anonymity re-identification risk."""
        if k <= 0:
            k = 1
        
        # Risk is inverse of k-anonymity level
        risk = 1.0 / max(k, 1)
        
        # Adjust based on quasi-identifiers
        risk = risk * math.sqrt(self.quasi_identifiers) / 10
        
        return min(risk, 1.0)
    
    def calculate_information_leakage(self, epsilon: float = 1.0, 
                                     delta: float = 1e-6) -> float:
        """Calculate information leakage under differential privacy."""
        if epsilon <= 0:
            epsilon = 0.1
        
        # Lower epsilon indicates less leakage
        leakage = 1.0 / (1.0 + math.exp(-epsilon))
        
        # Adjust for delta
        delta_factor = -math.log(delta) if delta > 0 else 1.0
        leakage = leakage / delta_factor
        
        return min(leakage, 1.0)
    
    def calculate_inference_attack_vulnerability(self, 
                                                model_accuracy: float = 0.85,
                                                attribute_cardinality: int = 2) -> float:
        """Calculate vulnerability to inference attacks."""
        # Higher model accuracy increases vulnerability
        vulnerability = model_accuracy
        
        # Adjust for attribute cardinality (more values = lower attack accuracy)
        adjustment = math.log(attribute_cardinality + 1) / 10
        vulnerability = vulnerability - adjustment
        
        return max(0, min(vulnerability, 1.0))
    
    def calculate_membership_inference_risk(self, 
                                           train_test_gap: float = 0.1,
                                           shadow_model_accuracy: float = 0.85) -> float:
        """Calculate membership inference attack risk."""
        # Risk increases with train-test accuracy gap
        risk = train_test_gap * shadow_model_accuracy
        
        return min(risk, 1.0)
    
    def assess_privacy_risk(self, k: int = 5, epsilon: float = 1.0,
                           delta: float = 1e-6, model_accuracy: float = 0.85,
                           train_test_gap: float = 0.1) -> PrivacyRiskMetrics:
        """Perform comprehensive privacy risk assessment."""
        re_id_risk = self.calculate_re_identification_risk(k)
        info_leakage = self.calculate_information_leakage(epsilon, delta)
        inference_vuln = self.calculate_inference_attack_vulnerability(model_accuracy)
        membership_risk = self.calculate_membership_inference_risk(train_test_gap, model_accuracy)
        
        overall_score = (re_id_risk + info_leakage + inference_vuln + membership_risk) / 4.0
        
        if overall_score < 0.1:
            risk_level = "MINIMAL"
        elif overall_score < 0.3:
            risk_level = "LOW"
        elif overall_score < 0.6:
            risk_level = "MEDIUM"
        elif overall_score < 0.8:
            risk_level = "HIGH"
        else:
            risk_level = "CRITICAL"
        
        recommendations = self._generate_recommendations(
            re_id_risk, info_leakage, inference_vuln, membership_risk, risk_level
        )
        
        metrics = PrivacyRiskMetrics(
            re_identification_risk=re_id_risk,
            information_leakage=info_leakage,
            inference_attack_vulnerability=inference_vuln,
            membership_inference_risk=membership_risk,
            overall_risk_score=overall_score,
            risk_level=risk_level,
            recommendations=recommendations
        )
        
        self.risk_assessments.append({
            "timestamp": datetime.now().isoformat(),
            "metrics": {
                "re_id_risk": re_id_risk,
                "info_leakage": info_leakage,
                "inference_vuln": inference_vuln,
                "membership_risk": membership_risk,
                "overall_score": overall_score,
                "risk_level": risk_level
            }
        })
        
        return metrics
    
    def _generate_recommendations(self, re_id_risk: float, info_leakage: float,
                                 inference_vuln: float, membership_risk: float,
                                 risk_level: str) -> List[str]:
        """Generate privacy mitigation recommendations."""
        recommendations = []
        
        if re_id_risk > 0.5:
            recommendations.append("Increase k-anonymity level (target k > 5)")
        
        if info_leakage > 0.5:
            recommendations.append("Reduce epsilon value in differential privacy (target < 0.5)")
        
        if inference_vuln > 0.5:
            recommendations.append("Apply gradient perturbation and model regularization")
        
        if membership_risk > 0.3:
            recommendations.append("Use differential privacy in training (DP-SGD)")
        
        if risk_level == "CRITICAL":
            recommendations.append("Perform immediate privacy audit and implement enhanced protections")
        
        if not recommendations:
            recommendations.append("Continue monitoring privacy metrics")
        
        return recommendations
    
    def generate_privacy_risk_report(self) -> Dict[str, Any]:
        """Generate comprehensive privacy risk report."""
        return {
            "framework": "privacy_risk_assessment_engine",
            "status": "operational",
            "dataset_configuration": {
                "dataset_size": self.dataset_size,
                "quasi_identifiers": self.quasi_identifiers,
                "sensitive_attributes": self.sensitive_attributes
            },
            "assessments_performed": len(self.risk_assessments),
            "recent_assessments": self.risk_assessments[-5:] if len(self.risk_assessments) > 5 else self.risk_assessments,
            "timestamp": datetime.now().isoformat()
        }
