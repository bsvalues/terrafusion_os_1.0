"""
ExemptionSeer AI - Intelligent Property Exemption Classification

This AI agent uses natural language processing to automatically classify
property exemptions, detect anomalies, and provide audit insights for
county assessor offices.

Part of the TerraFusion PantheonOS AI Agent ecosystem.
"""

import os
import logging
import asyncio
import json
from datetime import datetime
from typing import Dict, List, Optional, Any
import aiohttp
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ExemptionRecord:
    """Structured exemption record for analysis"""
    parcel_id: str
    exemption_type: str
    exemption_code: str
    exemption_amount: float
    property_description: str
    owner_name: str
    assessment_year: int
    exemption_reason: str
    county_id: str = "benton-wa"

@dataclass
class ExemptionAnalysis:
    """AI analysis results for exemption records"""
    classification: str
    confidence_score: float
    risk_indicators: List[str]
    suggested_actions: List[str]
    audit_flags: List[str]
    ai_summary: str
    processing_timestamp: str

class ExemptionSeerAI:
    """
    Advanced AI agent for property exemption analysis and classification.
    
    Features:
    - Automatic exemption type classification
    - Anomaly detection in exemption patterns
    - Audit trail generation
    - Risk assessment and flagging
    - Natural language summaries
    """
    
    def __init__(self, ollama_url: str = "http://localhost:11434"):
        """
        Initialize the ExemptionSeer AI agent.
        
        Args:
            ollama_url: URL for the local Ollama AI service
        """
        self.ollama_url = ollama_url
        self.model_name = "llama3.2:3b"  # Default Ollama model
        self.initialized = False
        
        # Exemption classification patterns
        self.exemption_patterns = {
            "religious": ["church", "religious", "ministry", "temple", "mosque", "synagogue", "parish"],
            "charitable": ["charity", "nonprofit", "foundation", "relief", "humanitarian"],
            "educational": ["school", "university", "college", "academy", "education", "learning"],
            "governmental": ["government", "municipal", "county", "state", "federal", "public"],
            "veterans": ["veteran", "military", "armed forces", "vfw", "legion"],
            "disability": ["disabled", "handicapped", "accessibility", "special needs"],
            "senior": ["senior", "elderly", "retirement", "aged"],
            "agricultural": ["farm", "agricultural", "rural", "crop", "livestock", "barn"],
            "historical": ["historic", "heritage", "landmark", "preservation"],
            "environmental": ["conservation", "environmental", "green", "solar", "renewable"]
        }
        
        # Risk indicators for audit flagging
        self.risk_indicators = {
            "high_value": 50000,  # Exemptions over $50k
            "new_exemption": True,  # First-time exemptions
            "ownership_change": True,  # Recent ownership changes
            "multiple_exemptions": 2,  # More than 2 exemptions per parcel
            "incomplete_documentation": True  # Missing required docs
        }
        
    async def initialize(self) -> bool:
        """Initialize the AI service and verify connectivity."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.ollama_url}/api/tags") as response:
                    if response.status == 200:
                        models = await response.json()
                        available_models = [model['name'] for model in models.get('models', [])]
                        
                        if self.model_name in available_models:
                            logger.info(f"ExemptionSeer AI initialized with model: {self.model_name}")
                            self.initialized = True
                            return True
                        else:
                            logger.warning(f"Model {self.model_name} not found. Available: {available_models}")
                            return False
                    else:
                        logger.warning(f"Ollama service not responding: {response.status}")
                        return False
        except Exception as e:
            logger.error(f"Failed to initialize ExemptionSeer AI: {e}")
            return False
    
    async def analyze_exemption(self, exemption: ExemptionRecord) -> ExemptionAnalysis:
        """
        Perform comprehensive AI analysis of a property exemption.
        
        Args:
            exemption: ExemptionRecord to analyze
            
        Returns:
            ExemptionAnalysis with AI insights and recommendations
        """
        if not self.initialized:
            await self.initialize()
        
        # Generate analysis prompt
        analysis_prompt = self._create_analysis_prompt(exemption)
        
        # Get AI classification and insights
        ai_response = await self._query_ollama(analysis_prompt)
        
        # Perform rule-based analysis
        classification = self._classify_exemption_type(exemption)
        risk_indicators = self._detect_risk_indicators(exemption)
        audit_flags = self._generate_audit_flags(exemption)
        
        # Combine AI and rule-based analysis
        analysis = ExemptionAnalysis(
            classification=classification,
            confidence_score=self._calculate_confidence_score(exemption, ai_response),
            risk_indicators=risk_indicators,
            suggested_actions=self._generate_suggested_actions(exemption, risk_indicators),
            audit_flags=audit_flags,
            ai_summary=ai_response.get('summary', 'AI analysis not available'),
            processing_timestamp=datetime.utcnow().isoformat()
        )
        
        logger.info(f"ExemptionSeer analyzed parcel {exemption.parcel_id}: {classification}")
        return analysis
    
    def _create_analysis_prompt(self, exemption: ExemptionRecord) -> str:
        """Create AI analysis prompt for exemption review."""
        prompt = f"""
As an expert property tax assessor, analyze this exemption application:

Parcel ID: {exemption.parcel_id}
Property: {exemption.property_description}
Owner: {exemption.owner_name}
Exemption Type: {exemption.exemption_type}
Exemption Code: {exemption.exemption_code}
Amount: ${exemption.exemption_amount:,.2f}
Reason: {exemption.exemption_reason}
Year: {exemption.assessment_year}

Please provide:
1. Classification verification (religious, charitable, educational, etc.)
2. Risk assessment (low, medium, high)
3. Any red flags or concerns
4. Recommended follow-up actions
5. Brief summary for auditors

Focus on accuracy, compliance, and protecting taxpayer interests.
"""
        return prompt
    
    async def _query_ollama(self, prompt: str) -> Dict[str, Any]:
        """Query the local Ollama AI service."""
        if not self.initialized:
            return {"summary": "AI service not available - using rule-based analysis only"}
        
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,  # Lower temperature for more consistent analysis
                        "top_p": 0.9,
                        "num_predict": 300
                    }
                }
                
                async with session.post(f"{self.ollama_url}/api/generate", json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        ai_text = result.get('response', '')
                        
                        # Parse AI response into structured format
                        return {
                            "summary": ai_text,
                            "raw_response": result
                        }
                    else:
                        logger.warning(f"Ollama query failed: {response.status}")
                        return {"summary": "AI analysis failed - using rule-based analysis"}
        
        except Exception as e:
            logger.error(f"Ollama query error: {e}")
            return {"summary": "AI service error - using rule-based analysis only"}
    
    def _classify_exemption_type(self, exemption: ExemptionRecord) -> str:
        """Rule-based exemption classification."""
        description_lower = exemption.property_description.lower()
        reason_lower = exemption.exemption_reason.lower()
        combined_text = f"{description_lower} {reason_lower}"
        
        # Score each exemption type
        scores = {}
        for exemption_type, keywords in self.exemption_patterns.items():
            score = sum(1 for keyword in keywords if keyword in combined_text)
            if score > 0:
                scores[exemption_type] = score
        
        # Return highest scoring classification
        if scores:
            return max(scores.keys(), key=lambda k: scores[k])
        else:
            return "unclassified"
    
    def _detect_risk_indicators(self, exemption: ExemptionRecord) -> List[str]:
        """Detect potential risk indicators requiring attention."""
        indicators = []
        
        # High value exemption
        if exemption.exemption_amount > self.risk_indicators["high_value"]:
            indicators.append(f"High value exemption: ${exemption.exemption_amount:,.2f}")
        
        # Current year exemption (potentially new)
        current_year = datetime.now().year
        if exemption.assessment_year >= current_year:
            indicators.append("New or current year exemption")
        
        # Vague or minimal description
        if len(exemption.property_description) < 20:
            indicators.append("Insufficient property description")
        
        if len(exemption.exemption_reason) < 15:
            indicators.append("Incomplete exemption reasoning")
        
        # Unusual exemption codes
        common_codes = ["501", "502", "503", "504", "505"]  # Common WA exemption codes
        if exemption.exemption_code not in common_codes:
            indicators.append(f"Uncommon exemption code: {exemption.exemption_code}")
        
        return indicators
    
    def _generate_audit_flags(self, exemption: ExemptionRecord) -> List[str]:
        """Generate audit flags for follow-up review."""
        flags = []
        
        # High-priority flags
        if exemption.exemption_amount > 100000:
            flags.append("HIGH_VALUE_EXEMPTION")
        
        if "llc" in exemption.owner_name.lower() or "corp" in exemption.owner_name.lower():
            flags.append("CORPORATE_OWNERSHIP")
        
        # Documentation flags
        if not exemption.exemption_reason or len(exemption.exemption_reason) < 10:
            flags.append("INCOMPLETE_DOCUMENTATION")
        
        # Classification flags
        classification = self._classify_exemption_type(exemption)
        if classification == "unclassified":
            flags.append("UNCLASSIFIED_EXEMPTION")
        
        return flags
    
    def _generate_suggested_actions(self, exemption: ExemptionRecord, risk_indicators: List[str]) -> List[str]:
        """Generate suggested follow-up actions based on analysis."""
        actions = []
        
        if risk_indicators:
            actions.append("Schedule detailed review by senior assessor")
        
        if exemption.exemption_amount > 25000:
            actions.append("Verify supporting documentation on file")
            actions.append("Conduct site inspection if not completed recently")
        
        if "HIGH_VALUE_EXEMPTION" in self._generate_audit_flags(exemption):
            actions.append("Obtain board approval for high-value exemption")
        
        if "CORPORATE_OWNERSHIP" in self._generate_audit_flags(exemption):
            actions.append("Verify corporate eligibility for exemption type")
        
        classification = self._classify_exemption_type(exemption)
        if classification in ["religious", "charitable"]:
            actions.append("Verify 501(c)(3) status and current IRS determination letter")
        
        if not actions:
            actions.append("Standard processing - no additional actions required")
        
        return actions
    
    def _calculate_confidence_score(self, exemption: ExemptionRecord, ai_response: Dict) -> float:
        """Calculate confidence score for the analysis."""
        base_score = 0.7  # Base confidence for rule-based analysis
        
        # Increase confidence based on available information
        if len(exemption.property_description) > 50:
            base_score += 0.1
        
        if len(exemption.exemption_reason) > 30:
            base_score += 0.1
        
        # Decrease confidence for risk indicators
        risk_count = len(self._detect_risk_indicators(exemption))
        base_score -= (risk_count * 0.05)
        
        # AI service bonus
        if "AI service not available" not in ai_response.get('summary', ''):
            base_score += 0.1
        
        return min(max(base_score, 0.0), 1.0)  # Clamp between 0 and 1
    
    async def batch_analyze_exemptions(self, exemptions: List[ExemptionRecord]) -> List[ExemptionAnalysis]:
        """Analyze multiple exemptions in batch for efficiency."""
        logger.info(f"ExemptionSeer starting batch analysis of {len(exemptions)} exemptions")
        
        analyses = []
        for exemption in exemptions:
            try:
                analysis = await self.analyze_exemption(exemption)
                analyses.append(analysis)
            except Exception as e:
                logger.error(f"Failed to analyze exemption {exemption.parcel_id}: {e}")
                # Create fallback analysis
                fallback_analysis = ExemptionAnalysis(
                    classification="error",
                    confidence_score=0.0,
                    risk_indicators=["Analysis failed"],
                    suggested_actions=["Manual review required"],
                    audit_flags=["ANALYSIS_ERROR"],
                    ai_summary="Analysis failed - manual review required",
                    processing_timestamp=datetime.utcnow().isoformat()
                )
                analyses.append(fallback_analysis)
        
        logger.info(f"ExemptionSeer completed batch analysis: {len(analyses)} results")
        return analyses
    
    def get_exemption_statistics(self, analyses: List[ExemptionAnalysis]) -> Dict[str, Any]:
        """Generate statistical summary of exemption analyses."""
        if not analyses:
            return {"error": "No analyses provided"}
        
        classifications = [a.classification for a in analyses]
        risk_counts = [len(a.risk_indicators) for a in analyses]
        confidence_scores = [a.confidence_score for a in analyses]
        
        stats = {
            "total_exemptions": len(analyses),
            "classification_breakdown": {
                cls: classifications.count(cls) for cls in set(classifications)
            },
            "average_confidence": sum(confidence_scores) / len(confidence_scores),
            "high_risk_count": sum(1 for count in risk_counts if count >= 2),
            "audit_flag_counts": {},
            "processing_timestamp": datetime.utcnow().isoformat()
        }
        
        # Count audit flags
        all_flags = []
        for analysis in analyses:
            all_flags.extend(analysis.audit_flags)
        
        stats["audit_flag_counts"] = {
            flag: all_flags.count(flag) for flag in set(all_flags)
        }
        
        return stats

# Global instance for use in API endpoints
exemption_seer = ExemptionSeerAI()

async def analyze_exemption_data(exemption_data: Dict) -> Dict:
    """
    Main entry point for exemption analysis.
    Used by the TerraFusion API endpoints.
    """
    try:
        # Convert dictionary to ExemptionRecord
        exemption = ExemptionRecord(
            parcel_id=exemption_data.get('parcel_id', ''),
            exemption_type=exemption_data.get('exemption_type', ''),
            exemption_code=exemption_data.get('exemption_code', ''),
            exemption_amount=float(exemption_data.get('exemption_amount', 0)),
            property_description=exemption_data.get('property_description', ''),
            owner_name=exemption_data.get('owner_name', ''),
            assessment_year=int(exemption_data.get('assessment_year', datetime.now().year)),
            exemption_reason=exemption_data.get('exemption_reason', ''),
            county_id=exemption_data.get('county_id', 'benton-wa')
        )
        
        # Perform analysis
        analysis = await exemption_seer.analyze_exemption(exemption)
        
        # Convert to dictionary for JSON response
        return {
            "service": "ExemptionSeer AI",
            "version": "1.0.0",
            "parcel_id": exemption.parcel_id,
            "analysis": {
                "classification": analysis.classification,
                "confidence_score": analysis.confidence_score,
                "risk_indicators": analysis.risk_indicators,
                "suggested_actions": analysis.suggested_actions,
                "audit_flags": analysis.audit_flags,
                "ai_summary": analysis.ai_summary,
                "processing_timestamp": analysis.processing_timestamp
            },
            "status": "completed"
        }
        
    except Exception as e:
        logger.error(f"ExemptionSeer analysis failed: {e}")
        return {
            "service": "ExemptionSeer AI",
            "status": "error",
            "error": str(e),
            "message": "Analysis failed - manual review recommended"
        }

def get_exemption_seer_health() -> Dict:
    """Get health status of the ExemptionSeer AI service."""
    return {
        "service": "ExemptionSeer AI",
        "status": "operational" if exemption_seer.initialized else "initializing",
        "model": exemption_seer.model_name,
        "ollama_url": exemption_seer.ollama_url,
        "capabilities": [
            "exemption_classification",
            "risk_assessment",
            "audit_flagging",
            "batch_analysis",
            "statistical_reporting"
        ],
        "supported_exemption_types": list(exemption_seer.exemption_patterns.keys()),
        "timestamp": datetime.utcnow().isoformat()
    }

# Example usage and testing
if __name__ == "__main__":
    async def test_exemption_seer():
        """Test the ExemptionSeer AI with sample data."""
        # Sample exemption for testing
        sample_exemption = ExemptionRecord(
            parcel_id="123456789",
            exemption_type="Religious",
            exemption_code="501",
            exemption_amount=75000.00,
            property_description="First Baptist Church sanctuary and fellowship hall",
            owner_name="First Baptist Church of Kennewick",
            assessment_year=2025,
            exemption_reason="Religious organization providing worship services and community outreach",
            county_id="benton-wa"
        )
        
        # Initialize and test
        seer = ExemptionSeerAI()
        await seer.initialize()
        
        analysis = await seer.analyze_exemption(sample_exemption)
        
    
    # Run test if script is executed directly
    asyncio.run(test_exemption_seer())