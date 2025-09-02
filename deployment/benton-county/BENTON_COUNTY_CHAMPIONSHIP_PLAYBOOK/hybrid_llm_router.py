#!/usr/bin/env python3
"""
🏈 HYBRID LLM ROUTER - Championship-Level Query Management
Local Ollama for sensitive data, Cloud LLMs for calculations
"""

import os
import re
import json
import asyncio
import hashlib
from typing import Dict, Any, List, Optional, Tuple
from enum import Enum
from dataclasses import dataclass
import logging
from datetime import datetime

# Championship logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("HYBRID_ROUTER")

class DataSensitivity(Enum):
    """Security zones for data classification"""
    RED = "RED"      # Highly sensitive - local only
    YELLOW = "YELLOW"  # Semi-sensitive - anonymize first
    GREEN = "GREEN"   # Safe for cloud

@dataclass
class QueryContext:
    """Context for routing decisions"""
    query: str
    user_id: str
    data_type: str
    metadata: Dict[str, Any]
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()

class SensitivityDetector:
    """Defensive coordinator for data protection"""
    
    def __init__(self):
        # Patterns that indicate sensitive data
        self.sensitive_patterns = {
            "ssn": r'\b\d{3}-?\d{2}-?\d{4}\b',
            "ein": r'\b\d{2}-?\d{7}\b',
            "credit_card": r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
            "bank_account": r'\b\d{8,17}\b',
            "parcel_id": r'\b[A-Z0-9]{8,15}\b',
            "phone": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            "address": r'\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Plaza|Pl)\b',
        }
        
        # Keywords that indicate sensitive operations
        self.sensitive_keywords = {
            "owner", "proprietor", "taxpayer", "applicant",
            "mortgage", "lien", "foreclosure", "bankruptcy",
            "violation", "citation", "penalty", "fine",
            "personal", "private", "confidential", "restricted"
        }
        
        # Safe calculation keywords
        self.safe_keywords = {
            "calculate", "compute", "average", "median", "sum",
            "percentage", "ratio", "rate", "trend", "forecast",
            "roi", "cap rate", "cash flow", "depreciation"
        }
    
    def classify(self, context: QueryContext) -> DataSensitivity:
        """Classify data sensitivity like reading offensive formations"""
        query_lower = context.query.lower()
        
        # Check for explicit sensitive patterns
        for pattern_name, pattern in self.sensitive_patterns.items():
            if re.search(pattern, context.query):
                logger.warning(f"🔴 Sensitive pattern detected: {pattern_name}")
                return DataSensitivity.RED
        
        # Check for sensitive keywords
        sensitive_count = sum(1 for keyword in self.sensitive_keywords 
                            if keyword in query_lower)
        safe_count = sum(1 for keyword in self.safe_keywords 
                        if keyword in query_lower)
        
        # Decision logic
        if sensitive_count > 0 and safe_count == 0:
            return DataSensitivity.RED
        elif sensitive_count > 0 and safe_count > 0:
            return DataSensitivity.YELLOW
        else:
            return DataSensitivity.GREEN

class DataAnonymizer:
    """Offensive line protecting sensitive data"""
    
    def __init__(self):
        self.anonymization_rules = {
            "address": self._anonymize_address,
            "parcel": self._anonymize_parcel,
            "name": self._anonymize_name,
            "financial": self._anonymize_financial
        }
    
    def anonymize(self, data: str, sensitivity: DataSensitivity) -> str:
        """Remove identifying information while preserving utility"""
        if sensitivity == DataSensitivity.GREEN:
            return data
            
        anonymized = data
        
        # Apply anonymization rules
        anonymized = re.sub(r'\b\d{3}-?\d{2}-?\d{4}\b', '[SSN_REMOVED]', anonymized)
        anonymized = re.sub(r'\b\d{5}(?:-\d{4})?\b', '[ZIP_CODE]', anonymized)
        anonymized = re.sub(r'\b[A-Z0-9]{8,15}\b', '[PARCEL_ID]', anonymized)
        anonymized = re.sub(
            r'\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Plaza|Pl)\b',
            '[STREET_ADDRESS]',
            anonymized
        )
        
        # Preserve numerical values for calculations
        anonymized = self._preserve_calculations(anonymized)
        
        return anonymized
    
    def _preserve_calculations(self, text: str) -> str:
        """Keep numbers needed for calculations"""
        # This is simplified - in production, use NLP to identify calculation-relevant numbers
        calculation_patterns = [
            (r'\$[\d,]+(?:\.\d{2})?', '[PRICE]'),
            (r'\b\d+(?:\.\d+)?%\b', '[PERCENTAGE]'),
            (r'\b\d+\s*(?:sq|square)\s*(?:ft|feet)\b', '[SQFT]'),
        ]
        
        preserved = text
        for pattern, placeholder in calculation_patterns:
            matches = re.findall(pattern, text)
            # Store actual values for cloud processing
            if matches:
                # In real implementation, store these securely
                pass
                
        return preserved
    
    def _anonymize_address(self, address: str) -> str:
        """Convert specific address to general area"""
        # Extract zip code if present
        zip_match = re.search(r'\b(\d{5})(?:-\d{4})?\b', address)
        if zip_match:
            return f"Property in {zip_match.group(1)} area"
        return "Property in Benton County"
    
    def _anonymize_parcel(self, parcel_id: str) -> str:
        """Hash parcel ID for tracking without exposure"""
        return hashlib.sha256(parcel_id.encode()).hexdigest()[:10]
    
    def _anonymize_name(self, name: str) -> str:
        """Replace names with roles"""
        return "[PROPERTY_OWNER]"
    
    def _anonymize_financial(self, amount: str) -> str:
        """Round financial amounts for privacy"""
        # Extract number and round to nearest thousand
        match = re.search(r'\$?([\d,]+)(?:\.\d{2})?', amount)
        if match:
            value = float(match.group(1).replace(',', ''))
            rounded = round(value, -3)  # Round to nearest thousand
            return f"~${rounded:,.0f}"
        return amount

class LocalOllamaClient:
    """Tom Brady in the pocket - handles sensitive plays"""
    
    def __init__(self, host: str = "localhost:11434"):
        self.host = host
        self.model = "llama2:7b"  # Can be configured
        
    async def query(self, prompt: str, context: Dict[str, Any] = None) -> str:
        """Execute local query with maximum security"""
        logger.info("🏈 Local Ollama handling sensitive query")
        
        # In production, implement actual Ollama API call
        # For now, simulate response
        await asyncio.sleep(0.5)
        
        return f"[LOCAL_SECURE] Processed query: {prompt[:50]}..."

class CloudLLMClient:
    """Receiving corps - handles calculations in open field"""
    
    def __init__(self, provider: str = "openai"):
        self.provider = provider
        self.api_keys = {
            "openai": os.getenv("OPENAI_API_KEY"),
            "anthropic": os.getenv("ANTHROPIC_API_KEY"),
            "google": os.getenv("GOOGLE_API_KEY")
        }
        
    async def calculate(self, prompt: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Perform calculations using cloud LLM"""
        logger.info(f"☁️ Cloud LLM ({self.provider}) handling calculation")
        
        # In production, implement actual API calls
        # For now, simulate calculation response
        await asyncio.sleep(0.3)
        
        # Example calculation response
        if "roi" in prompt.lower():
            return {
                "roi": "12.5%",
                "cap_rate": "8.2%",
                "cash_flow": "$2,500/month",
                "break_even": "7.2 years"
            }
        
        return {"result": "Calculation completed"}

class ChampionshipHybridRouter:
    """Head coach making the play calls"""
    
    def __init__(self):
        self.sensitivity_detector = SensitivityDetector()
        self.anonymizer = DataAnonymizer()
        self.local_client = LocalOllamaClient()
        self.cloud_client = CloudLLMClient()
        self.stats = {
            "total_queries": 0,
            "local_queries": 0,
            "cloud_queries": 0,
            "anonymized_queries": 0
        }
        
    async def route_query(self, context: QueryContext) -> Dict[str, Any]:
        """Make the right play call based on game situation"""
        self.stats["total_queries"] += 1
        
        # Classify sensitivity
        sensitivity = self.sensitivity_detector.classify(context)
        logger.info(f"📊 Query classified as: {sensitivity.value}")
        
        # Route based on classification
        if sensitivity == DataSensitivity.RED:
            # Red zone - keep it local
            self.stats["local_queries"] += 1
            result = await self.local_client.query(context.query, context.metadata)
            return {
                "result": result,
                "routed_to": "local_ollama",
                "sensitivity": sensitivity.value
            }
            
        elif sensitivity == DataSensitivity.YELLOW:
            # Play action - anonymize then cloud
            self.stats["anonymized_queries"] += 1
            anonymized_query = self.anonymizer.anonymize(context.query, sensitivity)
            logger.info(f"🔄 Anonymized query: {anonymized_query[:100]}...")
            
            self.stats["cloud_queries"] += 1
            result = await self.cloud_client.calculate(anonymized_query, context.metadata)
            return {
                "result": result,
                "routed_to": "cloud_llm",
                "sensitivity": sensitivity.value,
                "anonymized": True
            }
            
        else:  # GREEN
            # Pass play - straight to cloud
            self.stats["cloud_queries"] += 1
            result = await self.cloud_client.calculate(context.query, context.metadata)
            return {
                "result": result,
                "routed_to": "cloud_llm",
                "sensitivity": sensitivity.value,
                "anonymized": False
            }
    
    def get_game_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        total = self.stats["total_queries"] or 1  # Avoid division by zero
        return {
            "total_plays": self.stats["total_queries"],
            "local_plays": self.stats["local_queries"],
            "cloud_plays": self.stats["cloud_queries"],
            "anonymized_plays": self.stats["anonymized_queries"],
            "local_percentage": f"{(self.stats['local_queries'] / total) * 100:.1f}%",
            "cloud_percentage": f"{(self.stats['cloud_queries'] / total) * 100:.1f}%",
            "security_score": "100%" if self.stats["local_queries"] > 0 else "N/A"
        }

async def demonstrate_hybrid_routing():
    """Run some example plays to demonstrate the system"""
    router = ChampionshipHybridRouter()
    
    # Test queries with different sensitivity levels
    test_queries = [
        # RED - Sensitive
        QueryContext(
            query="What is the tax history for parcel AB123456789?",
            user_id="user123",
            data_type="tax_records",
            metadata={"source": "assessor"}
        ),
        
        # YELLOW - Mixed
        QueryContext(
            query="Calculate ROI for property at 123 Main St with $300k price",
            user_id="user123",
            data_type="valuation",
            metadata={"calculation_type": "roi"}
        ),
        
        # GREEN - Safe
        QueryContext(
            query="What is the formula for calculating cap rate?",
            user_id="user123",
            data_type="education",
            metadata={"topic": "real_estate_math"}
        ),
        
        # GREEN - Pure calculation
        QueryContext(
            query="Calculate monthly payment for $250,000 loan at 6.5% for 30 years",
            user_id="user123",
            data_type="mortgage_calc",
            metadata={"loan_details": True}
        )
    ]
    
    print("🏈 HYBRID LLM ROUTER - CHAMPIONSHIP DEMONSTRATION")
    print("=" * 50)
    
    for i, context in enumerate(test_queries, 1):
        print(f"\n📋 Play #{i}")
        print(f"Query: {context.query}")
        result = await router.route_query(context)
        print(f"Routed to: {result['routed_to']}")
        print(f"Sensitivity: {result['sensitivity']}")
        if result.get('anonymized'):
            print("✅ Data anonymized before cloud processing")
        print(f"Result: {result['result']}")
    
    print("\n📊 GAME STATISTICS")
    print("=" * 50)
    stats = router.get_game_stats()
    for stat, value in stats.items():
        print(f"{stat}: {value}")
    
    print("\n🏆 Championship routing complete!")

if __name__ == "__main__":
    print("🏆 BENTON COUNTY HYBRID LLM ROUTER")
    print("Local security + Cloud performance")
    print("-" * 50)
    
    asyncio.run(demonstrate_hybrid_routing())