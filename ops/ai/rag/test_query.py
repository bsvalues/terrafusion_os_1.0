#!/usr/bin/env python3
"""
Test Suite: RAG Query Citations Contract
Session: 20251217_075319Z_ai-lab_rag-query-citations-contract

Tests the --json output mode and error handling per SpecLock.
"""

import json
import sys
import os
import pytest
from unittest.mock import patch, MagicMock

# Add the current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the module under test
from query import (
    validate_query,
    build_response,
    build_error_response,
    RAGQueryError,
    run_query_json,
)
IMPORTS_AVAILABLE = True


# =============================================================================
# Response Schema (from SpecLock)
# =============================================================================

EXPECTED_RESPONSE_SCHEMA = {
    "type": "object",
    "required": ["success", "answer", "citations", "metadata", "error"],
    "properties": {
        "success": {"type": "boolean"},
        "answer": {"type": ["string", "null"]},
        "citations": {
            "type": "array",
            "items": {
                "type": "object",
                "required": ["source", "chunk_index", "score", "snippet"],
                "properties": {
                    "source": {"type": "string"},
                    "chunk_index": {"type": "integer"},
                    "score": {"type": "number"},
                    "snippet": {"type": "string"},
                }
            }
        },
        "metadata": {
            "type": "object",
            "required": ["query", "latency_ms", "model", "embed_model", "chunks_retrieved", "collection"],
            "properties": {
                "query": {"type": "string"},
                "latency_ms": {"type": "integer"},
                "model": {"type": "string"},
                "embed_model": {"type": "string"},
                "chunks_retrieved": {"type": "integer"},
                "collection": {"type": "string"},
            }
        },
        "error": {
            "type": ["object", "null"],
            "properties": {
                "code": {"type": "string"},
                "message": {"type": "string"},
            }
        }
    }
}

ERROR_CODES = [
    "INVALID_QUERY",
    "NO_RESULTS", 
    "CONTEXT_INSUFFICIENT",
    "MODEL_UNAVAILABLE",
    "INDEX_UNAVAILABLE",
    "INTERNAL_ERROR",
]


# =============================================================================
# Unit Tests: Input Validation
# =============================================================================

@pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Module not yet implemented")
class TestInputValidation:
    """Test input validation per SpecLock."""
    
    def test_empty_query_returns_error(self):
        """Empty string should return INVALID_QUERY error."""
        result = validate_query("")
        assert result is not None
        assert result["code"] == "INVALID_QUERY"
        assert "empty" in result["message"].lower()
    
    def test_whitespace_only_query_returns_error(self):
        """Whitespace-only string should return INVALID_QUERY error."""
        result = validate_query("   \t\n  ")
        assert result is not None
        assert result["code"] == "INVALID_QUERY"
    
    def test_long_query_returns_error(self):
        """Query >4096 chars should return INVALID_QUERY error."""
        long_query = "x" * 4097
        result = validate_query(long_query)
        assert result is not None
        assert result["code"] == "INVALID_QUERY"
        assert "4096" in result["message"] or "exceed" in result["message"].lower()
    
    def test_valid_query_returns_none(self):
        """Valid query should return None (no error)."""
        result = validate_query("What is county isolation?")
        assert result is None
    
    def test_max_length_query_valid(self):
        """Query exactly 4096 chars should be valid."""
        query = "x" * 4096
        result = validate_query(query)
        assert result is None


# =============================================================================
# Unit Tests: Response Schema
# =============================================================================

@pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Module not yet implemented")
class TestResponseSchema:
    """Test response schema matches SpecLock."""
    
    def test_success_response_has_required_fields(self):
        """Success response must have all required fields."""
        response = build_response(
            answer="Test answer",
            citations=[{"source": "test.md", "chunk_index": 0, "score": 0.9, "snippet": "..."}],
            query="test query",
            latency_ms=100,
        )
        
        assert "success" in response
        assert "answer" in response
        assert "citations" in response
        assert "metadata" in response
        assert "error" in response
        
        assert response["success"] is True
        assert response["error"] is None
    
    def test_citations_have_required_fields(self):
        """Each citation must have source, chunk_index, score, snippet."""
        response = build_response(
            answer="Test",
            citations=[{"source": "file.md", "chunk_index": 0, "score": 0.85, "snippet": "text..."}],
            query="test",
            latency_ms=50,
        )
        
        citation = response["citations"][0]
        assert "source" in citation
        assert "chunk_index" in citation
        assert "score" in citation
        assert "snippet" in citation
        
        assert isinstance(citation["chunk_index"], int)
        assert isinstance(citation["score"], (int, float))
    
    def test_metadata_has_required_fields(self):
        """Metadata must have query, latency_ms, model, embed_model, chunks_retrieved, collection."""
        response = build_response(
            answer="Test",
            citations=[],
            query="test query",
            latency_ms=100,
        )
        
        meta = response["metadata"]
        assert "query" in meta
        assert "latency_ms" in meta
        assert "model" in meta
        assert "embed_model" in meta
        assert "chunks_retrieved" in meta
        assert "collection" in meta
        
        assert isinstance(meta["latency_ms"], int)
        assert isinstance(meta["chunks_retrieved"], int)
    
    def test_error_response_schema(self):
        """Error response must have success=False and error object."""
        response = build_error_response(
            code="INVALID_QUERY",
            message="Query is empty",
            query="",
            latency_ms=5,
        )
        
        assert response["success"] is False
        assert response["answer"] is None
        assert response["citations"] == []
        assert response["error"] is not None
        assert response["error"]["code"] == "INVALID_QUERY"
        assert response["error"]["message"] == "Query is empty"


# =============================================================================
# Unit Tests: Error Codes
# =============================================================================

@pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Module not yet implemented")
class TestErrorCodes:
    """Test all error codes from SpecLock are valid."""
    
    @pytest.mark.parametrize("code", ERROR_CODES)
    def test_error_code_produces_valid_response(self, code):
        """Each error code should produce a valid error response."""
        response = build_error_response(
            code=code,
            message=f"Test error for {code}",
            query="test",
            latency_ms=10,
        )
        
        assert response["success"] is False
        assert response["error"]["code"] == code


# =============================================================================
# Integration Tests (require mocking external services)
# =============================================================================

@pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="Module not yet implemented")
class TestIntegration:
    """Integration tests with mocked services."""
    
    @patch('query.requests.post')
    def test_model_unavailable_error(self, mock_post):
        """Ollama unreachable should return MODEL_UNAVAILABLE."""
        from query import run_query_json
        
        mock_post.side_effect = Exception("Connection refused")
        
        result = run_query_json("test query")
        assert result["success"] is False
        assert result["error"]["code"] == "MODEL_UNAVAILABLE"
    
    @patch('query.requests.get')
    def test_index_unavailable_error(self, mock_get):
        """Missing ChromaDB collection should return INDEX_UNAVAILABLE."""
        from query import run_query_json
        
        mock_get.return_value = MagicMock(status_code=404)
        
        result = run_query_json("test query")
        assert result["success"] is False
        assert result["error"]["code"] == "INDEX_UNAVAILABLE"


# =============================================================================
# JSON Schema Validation (optional, requires jsonschema)
# =============================================================================

try:
    from jsonschema import validate, ValidationError
    JSONSCHEMA_AVAILABLE = True
except ImportError:
    JSONSCHEMA_AVAILABLE = False


@pytest.mark.skipif(not IMPORTS_AVAILABLE or not JSONSCHEMA_AVAILABLE, 
                    reason="Module or jsonschema not available")
class TestJSONSchemaValidation:
    """Validate responses against JSON schema."""
    
    def test_success_response_validates(self):
        """Success response should validate against schema."""
        response = build_response(
            answer="Test answer",
            citations=[{"source": "test.md", "chunk_index": 0, "score": 0.9, "snippet": "..."}],
            query="test",
            latency_ms=100,
        )
        
        # Should not raise
        validate(instance=response, schema=EXPECTED_RESPONSE_SCHEMA)
    
    def test_error_response_validates(self):
        """Error response should validate against schema."""
        response = build_error_response(
            code="INVALID_QUERY",
            message="Empty query",
            query="",
            latency_ms=5,
        )
        
        # Should not raise
        validate(instance=response, schema=EXPECTED_RESPONSE_SCHEMA)


# =============================================================================
# Run tests
# =============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
