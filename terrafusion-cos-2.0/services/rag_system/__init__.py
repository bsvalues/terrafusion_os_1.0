"""
📚 TerraFusion RAG System
═════════════════════════════════════════════════════════════════

Retrieval-Augmented Generation system designed for government document processing
and intelligent information retrieval using ChromaDB and advanced embeddings.

Features:
- Government document processing
- FISMA-compliant data handling
- Advanced semantic search
- Real-time document ingestion
- Multi-modal document understanding
"""

from .rag_engine import TerraFusionRAGEngine
from .document_processor import GovernmentDocumentProcessor
from .vector_store import TerraFusionVectorStore
from .embedding_service import AdvancedEmbeddingService
from .query_processor import IntelligentQueryProcessor

__all__ = [
    'TerraFusionRAGEngine',
    'GovernmentDocumentProcessor',
    'TerraFusionVectorStore', 
    'AdvancedEmbeddingService',
    'IntelligentQueryProcessor'
]

__version__ = "1.0.0"
__author__ = "TerraFusion AI Systems"
__description__ = "Government-grade RAG Architecture"