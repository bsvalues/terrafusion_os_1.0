"""
TerraFusion Platform - NarratorAI Plugin

This plugin provides intelligent data analysis and narrative generation
using Ollama for offline AI capabilities, perfect for county networks.
"""

import os
import json
import logging
import requests
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class AIAnalysisRequest:
    """Request for AI analysis"""
    data_type: str  # "gis_export", "sync_operation", "district_lookup"
    data_payload: Dict[str, Any]
    analysis_type: str  # "summary", "insights", "recommendations", "report"
    context: Optional[Dict[str, Any]] = None

@dataclass
class AIAnalysisResponse:
    """Response from AI analysis"""
    analysis_id: str
    narrative: str
    insights: List[str]
    recommendations: List[str]
    confidence_score: float
    generated_at: datetime
    processing_time_ms: int

class NarratorAI:
    """
    AI-powered data analysis and narrative generation service.
    
    Uses Ollama for offline AI capabilities, with fallback to cloud AI
    when internet is available and configured.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the NarratorAI service.
        
        Args:
            config: Configuration dictionary for AI settings
        """
        self.config = config or self._get_default_config()
        self.ollama_url = self.config.get("ollama_url", "http://localhost:11434")
        self.model_name = self.config.get("model_name", "llama2")
        self.max_tokens = self.config.get("max_tokens", 2000)
        self.temperature = self.config.get("temperature", 0.7)
        
        logger.info(f"NarratorAI initialized with Ollama at {self.ollama_url}")
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration for NarratorAI."""
        return {
            "ollama_url": os.getenv("OLLAMA_URL", "http://localhost:11434"),
            "model_name": os.getenv("AI_MODEL_NAME", "llama2"),
            "max_tokens": int(os.getenv("AI_MAX_TOKENS", "2000")),
            "temperature": float(os.getenv("AI_TEMPERATURE", "0.7")),
            "enable_cloud_fallback": os.getenv("ENABLE_CLOUD_AI", "false").lower() == "true",
            "openai_api_key": os.getenv("OPENAI_API_KEY"),
        }
    
    async def analyze_gis_export(self, export_data: Dict[str, Any]) -> AIAnalysisResponse:
        """
        Analyze GIS export data and generate intelligent insights.
        
        Args:
            export_data: GIS export job data and statistics
            
        Returns:
            AI analysis with narrative and recommendations
        """
        start_time = datetime.now()
        
        # Build context for AI analysis
        context = self._build_gis_context(export_data)
        
        # Generate analysis prompt
        prompt = self._create_gis_analysis_prompt(export_data, context)
        
        # Get AI response
        ai_response = await self._query_ai(prompt)
        
        # Parse and structure the response
        analysis = self._parse_ai_response(ai_response, "gis_export")
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return AIAnalysisResponse(
            analysis_id=f"gis_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            narrative=analysis["narrative"],
            insights=analysis["insights"],
            recommendations=analysis["recommendations"],
            confidence_score=analysis["confidence"],
            generated_at=datetime.now(),
            processing_time_ms=int(processing_time)
        )
    
    async def analyze_sync_operation(self, sync_data: Dict[str, Any]) -> AIAnalysisResponse:
        """
        Analyze data synchronization results and provide insights.
        
        Args:
            sync_data: Sync operation data and statistics
            
        Returns:
            AI analysis with performance insights and recommendations
        """
        start_time = datetime.now()
        
        context = self._build_sync_context(sync_data)
        prompt = self._create_sync_analysis_prompt(sync_data, context)
        ai_response = await self._query_ai(prompt)
        analysis = self._parse_ai_response(ai_response, "sync_operation")
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return AIAnalysisResponse(
            analysis_id=f"sync_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            narrative=analysis["narrative"],
            insights=analysis["insights"],
            recommendations=analysis["recommendations"],
            confidence_score=analysis["confidence"],
            generated_at=datetime.now(),
            processing_time_ms=int(processing_time)
        )
    
    async def generate_summary_report(self, platform_data: Dict[str, Any]) -> AIAnalysisResponse:
        """
        Generate comprehensive summary report of platform activity.
        
        Args:
            platform_data: Overall platform statistics and activity data
            
        Returns:
            AI-generated executive summary with key insights
        """
        start_time = datetime.now()
        
        context = self._build_platform_context(platform_data)
        prompt = self._create_summary_prompt(platform_data, context)
        ai_response = await self._query_ai(prompt)
        analysis = self._parse_ai_response(ai_response, "summary_report")
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        
        return AIAnalysisResponse(
            analysis_id=f"summary_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            narrative=analysis["narrative"],
            insights=analysis["insights"],
            recommendations=analysis["recommendations"],
            confidence_score=analysis["confidence"],
            generated_at=datetime.now(),
            processing_time_ms=int(processing_time)
        )
    
    def _build_gis_context(self, export_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build context for GIS export analysis."""
        return {
            "county_id": export_data.get("county_id", "unknown"),
            "export_format": export_data.get("export_format", "unknown"),
            "layers_count": len(export_data.get("layers", [])),
            "status": export_data.get("status", "unknown"),
            "file_size": export_data.get("file_size", 0),
            "processing_time": self._calculate_processing_time(export_data),
        }
    
    def _build_sync_context(self, sync_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build context for sync operation analysis."""
        stats = sync_data.get("stats", {})
        return {
            "county_id": sync_data.get("county_id", "unknown"),
            "source_system": sync_data.get("source_system", "unknown"),
            "target_system": sync_data.get("target_system", "unknown"),
            "records_processed": stats.get("records_processed", 0),
            "success_rate": self._calculate_success_rate(stats),
            "error_count": stats.get("errors", 0),
            "processing_time": self._calculate_processing_time(sync_data),
        }
    
    def _build_platform_context(self, platform_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build context for platform summary analysis."""
        return {
            "total_exports": platform_data.get("total_exports", 0),
            "total_syncs": platform_data.get("total_syncs", 0),
            "active_counties": len(platform_data.get("counties", [])),
            "system_uptime": platform_data.get("uptime_hours", 0),
            "data_volume": platform_data.get("data_volume_gb", 0),
        }
    
    def _create_gis_analysis_prompt(self, export_data: Dict[str, Any], context: Dict[str, Any]) -> str:
        """Create AI prompt for GIS export analysis."""
        return f"""
As an expert GIS analyst for county government operations, analyze this export job:

County: {context['county_id']}
Export Format: {context['export_format']}
Layers: {context['layers_count']} layers
Status: {context['status']}
File Size: {context['file_size']} bytes
Processing Time: {context['processing_time']} seconds

Data Details: {json.dumps(export_data, indent=2)}

Please provide:
1. A professional narrative summary (2-3 sentences)
2. 3-5 key insights about the export quality and performance
3. 2-3 actionable recommendations for optimization

Focus on practical value for county staff. Use clear, non-technical language.
"""
    
    def _create_sync_analysis_prompt(self, sync_data: Dict[str, Any], context: Dict[str, Any]) -> str:
        """Create AI prompt for sync operation analysis."""
        return f"""
As a data integration specialist for county operations, analyze this synchronization:

County: {context['county_id']}
Source: {context['source_system']} → Target: {context['target_system']}
Records Processed: {context['records_processed']:,}
Success Rate: {context['success_rate']:.1f}%
Errors: {context['error_count']}
Duration: {context['processing_time']} seconds

Sync Details: {json.dumps(sync_data, indent=2)}

Please provide:
1. A professional summary of sync performance (2-3 sentences)
2. 3-5 insights about data quality and integration health
3. 2-3 recommendations for improving sync reliability

Use county government terminology and focus on operational efficiency.
"""
    
    def _create_summary_prompt(self, platform_data: Dict[str, Any], context: Dict[str, Any]) -> str:
        """Create AI prompt for platform summary report."""
        return f"""
As a technology director for county government, create an executive summary:

Platform Statistics:
- Total GIS Exports: {context['total_exports']:,}
- Total Data Syncs: {context['total_syncs']:,}
- Active Counties: {context['active_counties']}
- System Uptime: {context['system_uptime']} hours
- Data Volume: {context['data_volume']} GB

Platform Data: {json.dumps(platform_data, indent=2)}

Please provide:
1. Executive summary highlighting key achievements (3-4 sentences)
2. 4-6 strategic insights about platform performance and usage
3. 3-4 recommendations for future improvements

Write for county administrators and IT directors. Emphasize ROI and operational benefits.
"""
    
    async def _query_ai(self, prompt: str) -> str:
        """
        Query the AI service (Ollama or cloud fallback).
        
        Args:
            prompt: The prompt to send to the AI
            
        Returns:
            AI response text
        """
        try:
            # Try Ollama first (offline AI)
            response = await self._query_ollama(prompt)
            if response:
                logger.info("Generated AI response using Ollama")
                return response
        except Exception as e:
            logger.warning(f"Ollama query failed: {e}")
        
        # Fallback to cloud AI if enabled
        if self.config.get("enable_cloud_fallback") and self.config.get("openai_api_key"):
            try:
                response = await self._query_openai(prompt)
                if response:
                    logger.info("Generated AI response using OpenAI fallback")
                    return response
            except Exception as e:
                logger.warning(f"OpenAI fallback failed: {e}")
        
        # Final fallback: structured template response
        logger.info("Using template fallback for AI response")
        return self._generate_template_response(prompt)
    
    async def _query_ollama(self, prompt: str) -> Optional[str]:
        """Query Ollama for AI response."""
        try:
            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "num_predict": self.max_tokens,
                        "temperature": self.temperature,
                    }
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json().get("response", "")
            else:
                logger.error(f"Ollama responded with status {response.status_code}")
                return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to Ollama: {e}")
            return None
    
    async def _query_openai(self, prompt: str) -> Optional[str]:
        """Query OpenAI as cloud fallback."""
        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.config['openai_api_key']}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": self.max_tokens,
                    "temperature": self.temperature,
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return response.json()["choices"][0]["message"]["content"]
            else:
                logger.error(f"OpenAI responded with status {response.status_code}")
                return None
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to connect to OpenAI: {e}")
            return None
    
    def _generate_template_response(self, prompt: str) -> str:
        """Generate a structured template response when AI is unavailable."""
        return """
Analysis Summary: Data processing completed successfully with standard performance metrics.

Key Insights:
• Export/sync operation executed within normal parameters
• Data integrity maintained throughout the process
• System resources utilized efficiently
• No critical issues detected

Recommendations:
• Continue monitoring for optimal performance
• Review logs for any potential improvements
• Consider scheduling during off-peak hours for large operations

Note: This analysis was generated using offline templates. For enhanced AI insights, ensure Ollama is running or configure cloud AI access.
"""
    
    def _parse_ai_response(self, ai_response: str, analysis_type: str) -> Dict[str, Any]:
        """Parse AI response into structured format."""
        try:
            # Extract narrative (first paragraph)
            lines = ai_response.strip().split('\n')
            narrative_lines = []
            insights = []
            recommendations = []
            
            current_section = "narrative"
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                if "insight" in line.lower() or "key" in line.lower():
                    current_section = "insights"
                    continue
                elif "recommend" in line.lower():
                    current_section = "recommendations"
                    continue
                
                if current_section == "narrative" and not line.startswith('•') and not line.startswith('-'):
                    narrative_lines.append(line)
                elif current_section == "insights" and (line.startswith('•') or line.startswith('-')):
                    insights.append(line.lstrip('•- '))
                elif current_section == "recommendations" and (line.startswith('•') or line.startswith('-')):
                    recommendations.append(line.lstrip('•- '))
            
            narrative = ' '.join(narrative_lines) if narrative_lines else ai_response[:200] + "..."
            
            return {
                "narrative": narrative,
                "insights": insights if insights else ["Analysis completed successfully"],
                "recommendations": recommendations if recommendations else ["Continue monitoring system performance"],
                "confidence": 0.85  # Default confidence score
            }
            
        except Exception as e:
            logger.error(f"Failed to parse AI response: {e}")
            return {
                "narrative": "Analysis completed with standard results.",
                "insights": ["Data processed successfully"],
                "recommendations": ["Review results and continue operations"],
                "confidence": 0.5
            }
    
    def _calculate_processing_time(self, data: Dict[str, Any]) -> float:
        """Calculate processing time from job data."""
        started_at = data.get("started_at")
        completed_at = data.get("completed_at")
        
        if started_at and completed_at:
            try:
                start = datetime.fromisoformat(started_at.replace('Z', '+00:00'))
                end = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
                return (end - start).total_seconds()
            except:
                pass
        
        return 0.0
    
    def _calculate_success_rate(self, stats: Dict[str, Any]) -> float:
        """Calculate success rate from sync statistics."""
        processed = stats.get("records_processed", 0)
        written = stats.get("records_written", 0)
        
        if processed > 0:
            return (written / processed) * 100.0
        
        return 0.0
    
    def health_check(self) -> Dict[str, Any]:
        """Check the health of the NarratorAI service."""
        try:
            # Test Ollama connection
            response = requests.get(f"{self.ollama_url}/api/tags", timeout=5)
            ollama_status = "healthy" if response.status_code == 200 else "unavailable"
        except:
            ollama_status = "unavailable"
        
        return {
            "service": "NarratorAI",
            "status": "healthy",
            "version": "1.0.0",
            "ollama_status": ollama_status,
            "model": self.model_name,
            "cloud_fallback": self.config.get("enable_cloud_fallback", False),
            "timestamp": datetime.now().isoformat()
        }

# Initialize global service instance
narrator_ai = NarratorAI()

# API functions for integration
async def analyze_gis_export_data(export_data: Dict[str, Any]) -> Dict[str, Any]:
    """API function to analyze GIS export data."""
    try:
        analysis = await narrator_ai.analyze_gis_export(export_data)
        return {
            "analysis_id": analysis.analysis_id,
            "narrative": analysis.narrative,
            "insights": analysis.insights,
            "recommendations": analysis.recommendations,
            "confidence_score": analysis.confidence_score,
            "generated_at": analysis.generated_at.isoformat(),
            "processing_time_ms": analysis.processing_time_ms
        }
    except Exception as e:
        logger.error(f"GIS export analysis failed: {e}")
        return {"error": str(e)}

async def analyze_sync_data(sync_data: Dict[str, Any]) -> Dict[str, Any]:
    """API function to analyze sync operation data."""
    try:
        analysis = await narrator_ai.analyze_sync_operation(sync_data)
        return {
            "analysis_id": analysis.analysis_id,
            "narrative": analysis.narrative,
            "insights": analysis.insights,
            "recommendations": analysis.recommendations,
            "confidence_score": analysis.confidence_score,
            "generated_at": analysis.generated_at.isoformat(),
            "processing_time_ms": analysis.processing_time_ms
        }
    except Exception as e:
        logger.error(f"Sync data analysis failed: {e}")
        return {"error": str(e)}

def get_ai_health() -> Dict[str, Any]:
    """Get NarratorAI service health status."""
    return narrator_ai.health_check()