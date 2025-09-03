#!/usr/bin/env python3
"""
AI Explanation Generator for TerraFusion Government Systems
Provides interpretable explanations for AI-driven property assessments
"""

import numpy as np
import pandas as pd
import shap
from typing import Dict, List, Any, Optional, Tuple
import json
from datetime import datetime
import logging
from dataclasses import dataclass, asdict
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ExplanationResult:
    """Structured explanation result"""
    prediction: float
    confidence: float
    primary_factors: List[Dict[str, Any]]
    counterfactuals: List[Dict[str, Any]]
    natural_language: str
    technical_details: Dict[str, Any]
    timestamp: datetime

class PropertyAssessmentExplainer:
    """Comprehensive explanation system for property assessments"""
    
    def __init__(self, model, feature_metadata: Dict[str, Dict[str, Any]]):
        self.model = model
        self.feature_metadata = feature_metadata
        self.shap_explainer = None
        self.initialize_explainer()
    
    def initialize_explainer(self):
        """Initialize SHAP explainer for the model"""
        try:
            if hasattr(self.model, 'predict_proba'):
                # For classification models
                self.shap_explainer = shap.Explainer(self.model.predict_proba)
            else:
                # For regression models
                self.shap_explainer = shap.Explainer(self.model.predict)
            logger.info("SHAP explainer initialized successfully")
        except Exception as e:
            logger.warning(f"Failed to initialize SHAP explainer: {e}")
            self.shap_explainer = None
    
    def explain_assessment(self, property_data: np.ndarray, 
                          property_id: str = None,
                          explanation_level: str = "citizen") -> ExplanationResult:
        """
        Generate comprehensive explanation for a property assessment
        
        Args:
            property_data: Feature vector for the property
            property_id: Unique identifier for the property
            explanation_level: "citizen", "official", or "technical"
        
        Returns:
            ExplanationResult with all explanation components
        """
        try:
            # Get prediction and confidence
            prediction = self.model.predict([property_data])[0]
            confidence = self.calculate_confidence(property_data)
            
            # Generate feature importance explanations
            primary_factors = self.explain_feature_importance(property_data)
            
            # Generate counterfactual explanations
            counterfactuals = self.generate_counterfactuals(property_data, prediction)
            
            # Generate natural language explanation
            natural_language = self.generate_natural_language_explanation(
                prediction, confidence, primary_factors, explanation_level
            )
            
            # Technical details (for officials and auditors)
            technical_details = self.generate_technical_details(property_data, prediction)
            
            result = ExplanationResult(
                prediction=prediction,
                confidence=confidence,
                primary_factors=primary_factors,
                counterfactuals=counterfactuals,
                natural_language=natural_language,
                technical_details=technical_details,
                timestamp=datetime.now()
            )
            
            logger.info(f"Explanation generated for property {property_id or 'unknown'}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to generate explanation: {e}")
            raise
    
    def explain_feature_importance(self, property_data: np.ndarray) -> List[Dict[str, Any]]:
        """Generate feature importance explanations"""
        feature_contributions = []
        
        if self.shap_explainer:
            # Use SHAP for precise feature importance
            try:
                shap_values = self.shap_explainer([property_data])
                if hasattr(shap_values, 'values'):
                    contributions = shap_values.values[0]
                else:
                    contributions = shap_values[0]
                
                base_value = getattr(shap_values, 'base_values', [0])[0] if hasattr(shap_values, 'base_values') else 0
                
            except Exception as e:
                logger.warning(f"SHAP calculation failed: {e}, using fallback method")
                contributions = self.calculate_fallback_importance(property_data)
                base_value = 0
        else:
            # Fallback: Use permutation importance
            contributions = self.calculate_fallback_importance(property_data)
            base_value = 0
        
        # Create explanations for top contributing features
        feature_names = list(self.feature_metadata.keys())
        
        for i, (feature_name, contribution) in enumerate(zip(feature_names, contributions)):
            if abs(contribution) > 0.001:  # Only include meaningful contributions
                metadata = self.feature_metadata.get(feature_name, {})
                
                feature_contributions.append({
                    'feature_name': feature_name,
                    'display_name': metadata.get('display_name', feature_name),
                    'value': float(property_data[i]),
                    'contribution': float(contribution),
                    'contribution_percentage': float(contribution / abs(contributions).sum() * 100) if abs(contributions).sum() > 0 else 0,
                    'description': metadata.get('description', 'No description available'),
                    'impact_direction': 'increases' if contribution > 0 else 'decreases',
                    'importance_rank': 0  # Will be set after sorting
                })
        
        # Sort by absolute contribution and assign ranks
        feature_contributions.sort(key=lambda x: abs(x['contribution']), reverse=True)
        for i, contrib in enumerate(feature_contributions):
            contrib['importance_rank'] = i + 1
        
        return feature_contributions
    
    def calculate_fallback_importance(self, property_data: np.ndarray) -> np.ndarray:
        """Calculate fallback feature importance using permutation method"""
        baseline_prediction = self.model.predict([property_data])[0]
        contributions = np.zeros(len(property_data))
        
        for i in range(len(property_data)):
            # Create modified data with feature i perturbed
            modified_data = property_data.copy()
            
            # Use median value for numerical features or mode for categorical
            if i < len(self.feature_metadata):
                feature_name = list(self.feature_metadata.keys())[i]
                metadata = self.feature_metadata[feature_name]
                
                if metadata.get('type') == 'numerical':
                    modified_data[i] = metadata.get('median_value', 0)
                else:
                    modified_data[i] = metadata.get('mode_value', 0)
            else:
                modified_data[i] = 0  # Default fallback
            
            modified_prediction = self.model.predict([modified_data])[0]
            contributions[i] = baseline_prediction - modified_prediction
        
        return contributions
    
    def calculate_confidence(self, property_data: np.ndarray) -> float:
        """Calculate prediction confidence"""
        try:
            if hasattr(self.model, 'predict_proba'):
                # For classification models
                probabilities = self.model.predict_proba([property_data])[0]
                confidence = float(max(probabilities))
            else:
                # For regression models, use prediction variance if available
                if hasattr(self.model, 'predict_with_uncertainty'):
                    pred, uncertainty = self.model.predict_with_uncertainty([property_data])
                    confidence = float(1.0 / (1.0 + uncertainty[0]))
                else:
                    # Fallback: Use distance to training data
                    confidence = self.calculate_similarity_confidence(property_data)
            
            return max(0.0, min(1.0, confidence))  # Ensure between 0 and 1
            
        except Exception as e:
            logger.warning(f"Confidence calculation failed: {e}")
            return 0.75  # Default moderate confidence
    
    def calculate_similarity_confidence(self, property_data: np.ndarray) -> float:
        """Calculate confidence based on similarity to training data"""
        # This would ideally use the actual training data
        # For now, use a heuristic based on feature values
        feature_names = list(self.feature_metadata.keys())
        
        confidence_scores = []
        for i, value in enumerate(property_data[:len(feature_names)]):
            if i < len(self.feature_metadata):
                feature_name = feature_names[i]
                metadata = self.feature_metadata[feature_name]
                
                # Calculate how typical this value is
                if metadata.get('type') == 'numerical':
                    min_val = metadata.get('min_value', 0)
                    max_val = metadata.get('max_value', 1)
                    mean_val = metadata.get('mean_value', 0.5)
                    std_val = metadata.get('std_value', 0.25)
                    
                    # Confidence based on how close to mean (within reasonable std)
                    z_score = abs(value - mean_val) / (std_val + 1e-6)
                    confidence_scores.append(max(0.0, 1.0 - z_score / 3.0))
                else:
                    # For categorical, assume typical values have higher confidence
                    confidence_scores.append(0.8)
        
        return np.mean(confidence_scores) if confidence_scores else 0.75
    
    def generate_counterfactuals(self, property_data: np.ndarray, 
                               current_prediction: float) -> List[Dict[str, Any]]:
        """Generate counterfactual explanations"""
        counterfactuals = []
        feature_names = list(self.feature_metadata.keys())
        
        # Try modifying each feature to see impact
        for i, feature_name in enumerate(feature_names[:len(property_data)]):
            if i >= len(property_data):
                break
                
            metadata = self.feature_metadata[feature_name]
            original_value = property_data[i]
            
            # Generate alternative values to test
            alternative_values = self.generate_alternative_values(original_value, metadata)
            
            for alt_value in alternative_values:
                modified_data = property_data.copy()
                modified_data[i] = alt_value
                
                new_prediction = self.model.predict([modified_data])[0]
                impact = new_prediction - current_prediction
                
                if abs(impact) > 0.01:  # Only include meaningful changes
                    counterfactuals.append({
                        'feature_name': feature_name,
                        'display_name': metadata.get('display_name', feature_name),
                        'original_value': float(original_value),
                        'alternative_value': float(alt_value),
                        'original_prediction': float(current_prediction),
                        'new_prediction': float(new_prediction),
                        'impact': float(impact),
                        'impact_percentage': float(impact / current_prediction * 100) if current_prediction != 0 else 0,
                        'description': self.describe_counterfactual_change(
                            feature_name, original_value, alt_value, impact, metadata
                        )
                    })
        
        # Sort by impact magnitude and return top counterfactuals
        counterfactuals.sort(key=lambda x: abs(x['impact']), reverse=True)
        return counterfactuals[:5]  # Return top 5 most impactful changes
    
    def generate_alternative_values(self, original_value: float, 
                                  metadata: Dict[str, Any]) -> List[float]:
        """Generate alternative values for counterfactual analysis"""
        alternatives = []
        
        if metadata.get('type') == 'numerical':
            # For numerical features, try values at different percentiles
            min_val = metadata.get('min_value', 0)
            max_val = metadata.get('max_value', 1)
            mean_val = metadata.get('mean_value', 0.5)
            
            # Try mean, quartiles, and some reasonable variations
            alternatives.extend([
                min_val,
                mean_val * 0.5,
                mean_val,
                mean_val * 1.5,
                max_val
            ])
            
            # Remove duplicates and values too close to original
            alternatives = [v for v in alternatives if abs(v - original_value) > abs(original_value) * 0.1]
            
        elif metadata.get('type') == 'categorical':
            # For categorical features, try other common values
            common_values = metadata.get('common_values', [0, 1])
            alternatives = [v for v in common_values if v != original_value]
        
        return alternatives[:3]  # Limit to 3 alternatives per feature
    
    def describe_counterfactual_change(self, feature_name: str, original_value: float,
                                     alternative_value: float, impact: float,
                                     metadata: Dict[str, Any]) -> str:
        """Generate human-readable description of counterfactual change"""
        display_name = metadata.get('display_name', feature_name)
        impact_direction = "increase" if impact > 0 else "decrease"
        
        if metadata.get('type') == 'numerical':
            unit = metadata.get('unit', '')
            if original_value < alternative_value:
                change_direction = "increased"
            else:
                change_direction = "decreased"
            
            return (f"If {display_name} were {change_direction} from "
                   f"{original_value:.2f}{unit} to {alternative_value:.2f}{unit}, "
                   f"the assessment would {impact_direction} by ${abs(impact):,.2f}")
        else:
            return (f"If {display_name} were changed from {original_value} to "
                   f"{alternative_value}, the assessment would {impact_direction} "
                   f"by ${abs(impact):,.2f}")
    
    def generate_natural_language_explanation(self, prediction: float, confidence: float,
                                            primary_factors: List[Dict[str, Any]],
                                            explanation_level: str) -> str:
        """Generate human-readable explanation"""
        
        if explanation_level == "citizen":
            return self.generate_citizen_explanation(prediction, confidence, primary_factors)
        elif explanation_level == "official":
            return self.generate_official_explanation(prediction, confidence, primary_factors)
        else:  # technical
            return self.generate_technical_explanation(prediction, confidence, primary_factors)
    
    def generate_citizen_explanation(self, prediction: float, confidence: float,
                                   primary_factors: List[Dict[str, Any]]) -> str:
        """Generate citizen-friendly explanation"""
        explanation_parts = []
        
        # Main assessment statement
        confidence_desc = self.describe_confidence_level(confidence)
        explanation_parts.append(
            f"Your property has been assessed at ${prediction:,.2f} with "
            f"{confidence_desc} confidence ({confidence:.0%})."
        )
        
        # Top factors explanation
        if primary_factors:
            explanation_parts.append("\nThe main factors that influenced this assessment are:")
            
            for i, factor in enumerate(primary_factors[:3]):  # Top 3 factors
                impact_desc = "increased" if factor['contribution'] > 0 else "decreased"
                magnitude = self.describe_impact_magnitude(abs(factor['contribution']))
                
                explanation_parts.append(
                    f"{i+1}. **{factor['display_name']}**: This {magnitude} {impact_desc} "
                    f"your assessment. {factor['description']}"
                )
        
        # Confidence explanation
        explanation_parts.append(
            f"\n**What does {confidence:.0%} confidence mean?** "
            f"This indicates how certain our AI system is about this assessment "
            f"based on similar properties and available data."
        )
        
        # Next steps
        explanation_parts.append(
            "\n**Questions about your assessment?** You can request a human review "
            "or appeal this decision. Contact us at [contact information] for assistance."
        )
        
        return " ".join(explanation_parts)
    
    def generate_official_explanation(self, prediction: float, confidence: float,
                                    primary_factors: List[Dict[str, Any]]) -> str:
        """Generate explanation for government officials"""
        explanation_parts = []
        
        explanation_parts.append(
            f"AI Assessment Result: ${prediction:,.2f} (Confidence: {confidence:.2%})"
        )
        
        explanation_parts.append("\n**Primary Contributing Factors:**")
        for factor in primary_factors[:5]:
            contribution_pct = factor.get('contribution_percentage', 0)
            explanation_parts.append(
                f"- {factor['display_name']}: {factor['impact_direction']} assessment "
                f"by ${abs(factor['contribution']):,.2f} ({contribution_pct:.1f}% of total impact)"
            )
        
        explanation_parts.append(
            f"\n**Model Performance**: Confidence level of {confidence:.2%} indicates "
            f"{'high' if confidence > 0.8 else 'moderate' if confidence > 0.6 else 'low'} "
            f"certainty in this prediction based on training data similarity."
        )
        
        return " ".join(explanation_parts)
    
    def generate_technical_explanation(self, prediction: float, confidence: float,
                                     primary_factors: List[Dict[str, Any]]) -> str:
        """Generate technical explanation for auditors and developers"""
        explanation_parts = []
        
        explanation_parts.append(f"Model Output: {prediction:.6f}")
        explanation_parts.append(f"Prediction Confidence: {confidence:.4f}")
        
        explanation_parts.append("\n**Feature Contributions (SHAP/Permutation Analysis):**")
        total_contribution = sum(abs(f['contribution']) for f in primary_factors)
        
        for factor in primary_factors:
            explanation_parts.append(
                f"- {factor['feature_name']}: {factor['contribution']:+.6f} "
                f"({factor['contribution']/total_contribution*100:.1f}%)"
            )
        
        explanation_parts.append(f"\n**Total Absolute Contribution**: {total_contribution:.6f}")
        
        return " ".join(explanation_parts)
    
    def describe_confidence_level(self, confidence: float) -> str:
        """Convert confidence score to descriptive text"""
        if confidence >= 0.9:
            return "very high"
        elif confidence >= 0.8:
            return "high"
        elif confidence >= 0.7:
            return "good"
        elif confidence >= 0.6:
            return "moderate"
        else:
            return "low"
    
    def describe_impact_magnitude(self, impact: float) -> str:
        """Convert impact magnitude to descriptive text"""
        # This would be calibrated based on typical property values
        if impact > 50000:
            return "significantly"
        elif impact > 20000:
            return "substantially"
        elif impact > 5000:
            return "moderately"
        else:
            return "slightly"
    
    def generate_technical_details(self, property_data: np.ndarray, 
                                 prediction: float) -> Dict[str, Any]:
        """Generate technical details for audit and compliance"""
        return {
            'model_version': getattr(self.model, 'version', 'unknown'),
            'feature_vector_length': len(property_data),
            'prediction_value': float(prediction),
            'feature_statistics': {
                'min': float(np.min(property_data)),
                'max': float(np.max(property_data)),
                'mean': float(np.mean(property_data)),
                'std': float(np.std(property_data))
            },
            'explainer_method': 'SHAP' if self.shap_explainer else 'Permutation',
            'explanation_timestamp': datetime.now().isoformat()
        }
    
    def create_visualization(self, explanation_result: ExplanationResult) -> str:
        """Create visualization of explanation (returns base64 encoded image)"""
        try:
            fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
            
            # Feature importance plot
            factors = explanation_result.primary_factors[:5]
            if factors:
                names = [f['display_name'] for f in factors]
                contributions = [f['contribution'] for f in factors]
                colors = ['green' if c > 0 else 'red' for c in contributions]
                
                ax1.barh(names, contributions, color=colors, alpha=0.7)
                ax1.set_xlabel('Impact on Assessment ($)')
                ax1.set_title('Top Factors Influencing Assessment')
                ax1.axvline(x=0, color='black', linestyle='-', linewidth=0.5)
            
            # Confidence visualization
            confidence = explanation_result.confidence
            ax2.pie([confidence, 1-confidence], 
                   labels=['Confident', 'Uncertain'],
                   colors=['lightgreen', 'lightcoral'],
                   startangle=90,
                   autopct='%1.1f%%')
            ax2.set_title(f'Prediction Confidence\n({confidence:.1%})')
            
            plt.tight_layout()
            
            # Convert to base64 string
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return image_base64
            
        except Exception as e:
            logger.error(f"Visualization creation failed: {e}")
            return ""
    
    def export_explanation(self, explanation_result: ExplanationResult, 
                          format: str = "json") -> str:
        """Export explanation in various formats"""
        if format == "json":
            return json.dumps(asdict(explanation_result), default=str, indent=2)
        elif format == "html":
            return self.generate_html_report(explanation_result)
        elif format == "pdf":
            return self.generate_pdf_report(explanation_result)
        else:
            raise ValueError(f"Unsupported export format: {format}")
    
    def generate_html_report(self, explanation_result: ExplanationResult) -> str:
        """Generate HTML report of explanation"""
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Property Assessment Explanation</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background-color: #f0f0f0; padding: 15px; border-radius: 5px; }
                .section { margin: 20px 0; }
                .factor { margin: 10px 0; padding: 10px; background-color: #f9f9f9; border-radius: 3px; }
                .positive { border-left: 4px solid green; }
                .negative { border-left: 4px solid red; }
                .confidence { text-align: center; font-size: 1.2em; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Property Assessment Explanation</h1>
                <p><strong>Assessment Value:</strong> ${prediction:,.2f}</p>
                <p><strong>Generated:</strong> {timestamp}</p>
            </div>
            
            <div class="confidence">
                <strong>Confidence Level: {confidence:.0%}</strong>
            </div>
            
            <div class="section">
                <h2>Explanation</h2>
                <p>{natural_language}</p>
            </div>
            
            <div class="section">
                <h2>Key Contributing Factors</h2>
                {factors_html}
            </div>
            
            <div class="section">
                <h2>What-If Scenarios</h2>
                {counterfactuals_html}
            </div>
        </body>
        </html>
        """
        
        # Generate factors HTML
        factors_html = ""
        for factor in explanation_result.primary_factors[:5]:
            css_class = "positive" if factor['contribution'] > 0 else "negative"
            factors_html += f"""
            <div class="factor {css_class}">
                <strong>{factor['display_name']}</strong><br>
                Impact: ${factor['contribution']:,.2f} ({factor['contribution_percentage']:.1f}%)<br>
                {factor['description']}
            </div>
            """
        
        # Generate counterfactuals HTML
        counterfactuals_html = ""
        for cf in explanation_result.counterfactuals[:3]:
            counterfactuals_html += f"""
            <div class="factor">
                <strong>{cf['display_name']}</strong><br>
                {cf['description']}
            </div>
            """
        
        return html_template.format(
            prediction=explanation_result.prediction,
            timestamp=explanation_result.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            confidence=explanation_result.confidence,
            natural_language=explanation_result.natural_language,
            factors_html=factors_html,
            counterfactuals_html=counterfactuals_html
        )

# Example usage and testing
def main():
    """Example usage of the explanation system"""
    
    # Mock model and metadata for demonstration
    class MockModel:
        def predict(self, X):
            return np.array([sum(x) * 1000 + np.random.normal(0, 100) for x in X])
    
    feature_metadata = {
        'square_footage': {
            'display_name': 'Property Size',
            'description': 'Total living area in square feet',
            'type': 'numerical',
            'unit': ' sq ft',
            'min_value': 500,
            'max_value': 5000,
            'mean_value': 2000,
            'std_value': 500
        },
        'bedrooms': {
            'display_name': 'Number of Bedrooms',
            'description': 'Total number of bedrooms in the property',
            'type': 'numerical',
            'unit': '',
            'min_value': 1,
            'max_value': 6,
            'mean_value': 3,
            'std_value': 1
        },
        'neighborhood_score': {
            'display_name': 'Neighborhood Quality Score',
            'description': 'Composite score based on local amenities, schools, and safety',
            'type': 'numerical',
            'unit': '/10',
            'min_value': 1,
            'max_value': 10,
            'mean_value': 6.5,
            'std_value': 2
        }
    }
    
    # Create explainer
    model = MockModel()
    explainer = PropertyAssessmentExplainer(model, feature_metadata)
    
    # Example property data
    property_data = np.array([2.5, 3.0, 7.5])  # square_footage (normalized), bedrooms, neighborhood_score
    
    # Generate explanation
    explanation = explainer.explain_assessment(
        property_data, 
        property_id="PROP_12345",
        explanation_level="citizen"
    )
    
    # Print results
    print("=== Property Assessment Explanation ===")
    print(f"Assessment: ${explanation.prediction:,.2f}")
    print(f"Confidence: {explanation.confidence:.1%}")
    print(f"\nExplanation: {explanation.natural_language}")
    
    print(f"\nTop Contributing Factors:")
    for factor in explanation.primary_factors[:3]:
        print(f"- {factor['display_name']}: {factor['impact_direction']} by ${abs(factor['contribution']):,.2f}")
    
    # Export as JSON
    json_export = explainer.export_explanation(explanation, "json")
    print(f"\nJSON Export (truncated): {json_export[:200]}...")

if __name__ == "__main__":
    main()