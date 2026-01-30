#!/usr/bin/env python3
"""
TerraFusion RAG Query Script
═══════════════════════════════════════════════════════════════════════════
Query the local RAG system with source citations.

Usage:
    python3 ops/ai/rag/query.py "What is county isolation?"
    python3 ops/ai/rag/query.py --json "How does the API gateway work?"
    tf ai query "How does the API gateway work?"
═══════════════════════════════════════════════════════════════════════════
"""

import sys
import json
import time
import argparse
import requests
from pathlib import Path

OLLAMA_URL = "http://127.0.0.1:11434"
CHROMA_URL = "http://127.0.0.1:8000"
EMBED_MODEL = "nomic-embed-text"
CHAT_MODEL = "llama3.2:3b"
COLLECTION = "terrafusion_docs"
TOP_K = 5
MAX_QUERY_LENGTH = 4096
SNIPPET_LENGTH = 200

PROMPT_TEMPLATE = Path(__file__).parent / "prompts" / "terrafusion_rag.md"


# =============================================================================
# Error Codes (from SpecLock)
# =============================================================================

class RAGQueryError(Exception):
    """Custom exception for RAG query errors."""
    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


# =============================================================================
# Validation
# =============================================================================

def validate_query(query: str) -> dict | None:
    """
    Validate query input. Returns error dict if invalid, None if valid.
    
    Per SpecLock:
    - Empty/whitespace-only → INVALID_QUERY
    - >4096 chars → INVALID_QUERY
    """
    if not query or not query.strip():
        return {"code": "INVALID_QUERY", "message": "Query is empty or contains only whitespace"}
    
    if len(query) > MAX_QUERY_LENGTH:
        return {"code": "INVALID_QUERY", "message": f"Query exceeds maximum length of {MAX_QUERY_LENGTH} characters"}
    
    return None


# =============================================================================
# Response Builders
# =============================================================================

def build_response(
    answer: str,
    citations: list,
    query: str,
    latency_ms: int,
    model: str = CHAT_MODEL,
    embed_model: str = EMBED_MODEL,
    collection: str = COLLECTION,
) -> dict:
    """Build a successful JSON response per SpecLock schema."""
    return {
        "success": True,
        "answer": answer,
        "citations": citations,
        "metadata": {
            "query": query,
            "latency_ms": latency_ms,
            "model": model,
            "embed_model": embed_model,
            "chunks_retrieved": len(citations),
            "collection": collection,
        },
        "error": None,
    }


def build_error_response(
    code: str,
    message: str,
    query: str,
    latency_ms: int,
    model: str = CHAT_MODEL,
    embed_model: str = EMBED_MODEL,
    collection: str = COLLECTION,
) -> dict:
    """Build an error JSON response per SpecLock schema."""
    return {
        "success": False,
        "answer": None,
        "citations": [],
        "metadata": {
            "query": query,
            "latency_ms": latency_ms,
            "model": model,
            "embed_model": embed_model,
            "chunks_retrieved": 0,
            "collection": collection,
        },
        "error": {
            "code": code,
            "message": message,
        },
    }


# =============================================================================
# Core Functions
# =============================================================================

def embed(text: str) -> list[float]:
    """Get embedding for query."""
    r = requests.post(
        f"{OLLAMA_URL}/api/embeddings",
        json={"model": EMBED_MODEL, "prompt": text},
        timeout=30
    )
    r.raise_for_status()
    return r.json()["embedding"]


def search_chroma(query_embedding: list[float], n_results: int = TOP_K) -> tuple[list[dict], str | None]:
    """
    Search ChromaDB for similar documents.
    Returns (docs, error_code) - error_code is None on success.
    """
    # Get collection ID
    r = requests.get(
        f"{CHROMA_URL}/api/v2/tenants/default_tenant/databases/default_database/collections/{COLLECTION}"
    )
    if r.status_code != 200:
        return [], "INDEX_UNAVAILABLE"
    
    collection_id = r.json()["id"]
    
    # Query
    r = requests.post(
        f"{CHROMA_URL}/api/v2/tenants/default_tenant/databases/default_database/collections/{collection_id}/query",
        json={
            "query_embeddings": [query_embedding],
            "n_results": n_results,
            "include": ["documents", "metadatas", "distances"]
        }
    )
    r.raise_for_status()
    
    results = r.json()
    docs = []
    for i, doc in enumerate(results.get("documents", [[]])[0]):
        meta = results.get("metadatas", [[]])[0][i] if results.get("metadatas") else {}
        dist = results.get("distances", [[]])[0][i] if results.get("distances") else 0
        # Convert distance to similarity score (cosine distance → similarity)
        score = max(0, 1 - dist) if dist else 0.5
        docs.append({
            "content": doc,
            "source": meta.get("source", "unknown"),
            "chunk_index": meta.get("chunk", 0),
            "distance": dist,
            "score": round(score, 4),
            "snippet": doc[:SNIPPET_LENGTH] + "..." if len(doc) > SNIPPET_LENGTH else doc,
        })
    return docs, None


def generate_answer(question: str, context_docs: list[dict]) -> str:
    """Generate answer using Ollama with RAG context."""
    # Build context string
    context_parts = []
    for i, doc in enumerate(context_docs, 1):
        context_parts.append(f"[{i}] Source: {doc['source']}\n{doc['content']}")
    context = "\n\n---\n\n".join(context_parts)
    
    # Load prompt template
    if PROMPT_TEMPLATE.exists():
        template = PROMPT_TEMPLATE.read_text()
        prompt = template.replace("{{question}}", question).replace("{{retrieved_chunks}}", context)
    else:
        prompt = f"""Answer the following question using ONLY the provided context.
Cite sources by filename. If context is insufficient, say so.

Question: {question}

Context:
{context}

Answer:"""
    
    # Generate
    r = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={
            "model": CHAT_MODEL,
            "prompt": prompt,
            "stream": False
        },
        timeout=120
    )
    r.raise_for_status()
    return r.json()["response"]


# =============================================================================
# Main Query Functions
# =============================================================================

def run_query_json(query: str, top_k: int = TOP_K) -> dict:
    """
    Run RAG query and return structured JSON response.
    This is the main entry point for --json mode.
    """
    start_time = time.time()
    
    # Validate input
    validation_error = validate_query(query)
    if validation_error:
        latency_ms = int((time.time() - start_time) * 1000)
        return build_error_response(
            code=validation_error["code"],
            message=validation_error["message"],
            query=query,
            latency_ms=latency_ms,
        )
    
    try:
        # Embed query
        try:
            query_embedding = embed(query)
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            return build_error_response(
                code="MODEL_UNAVAILABLE",
                message=f"Embedding model not available: {str(e)}",
                query=query,
                latency_ms=latency_ms,
            )
        
        # Search ChromaDB
        docs, error_code = search_chroma(query_embedding, n_results=top_k)
        if error_code:
            latency_ms = int((time.time() - start_time) * 1000)
            return build_error_response(
                code=error_code,
                message=f"ChromaDB collection '{COLLECTION}' not found. Run 'tf ai ingest' first.",
                query=query,
                latency_ms=latency_ms,
            )
        
        if not docs:
            latency_ms = int((time.time() - start_time) * 1000)
            return build_error_response(
                code="NO_RESULTS",
                message="No relevant documents found for query",
                query=query,
                latency_ms=latency_ms,
            )
        
        # Generate answer
        try:
            answer = generate_answer(query, docs)
        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            return build_error_response(
                code="MODEL_UNAVAILABLE",
                message=f"Chat model not available: {str(e)}",
                query=query,
                latency_ms=latency_ms,
            )
        
        # Check for insufficient context (LLM indicates it)
        insufficient_markers = ["insufficient context", "cannot answer", "not enough information"]
        if any(marker in answer.lower() for marker in insufficient_markers):
            latency_ms = int((time.time() - start_time) * 1000)
            return build_error_response(
                code="CONTEXT_INSUFFICIENT",
                message="Retrieved context does not contain enough information to answer query",
                query=query,
                latency_ms=latency_ms,
            )
        
        # Build citations
        citations = [
            {
                "source": doc["source"],
                "chunk_index": doc["chunk_index"],
                "score": doc["score"],
                "snippet": doc["snippet"],
            }
            for doc in docs
        ]
        
        latency_ms = int((time.time() - start_time) * 1000)
        return build_response(
            answer=answer,
            citations=citations,
            query=query,
            latency_ms=latency_ms,
        )
        
    except Exception as e:
        latency_ms = int((time.time() - start_time) * 1000)
        return build_error_response(
            code="INTERNAL_ERROR",
            message=f"Unexpected error: {str(e)}",
            query=query,
            latency_ms=latency_ms,
        )


def run_query_plain(query: str, top_k: int = TOP_K):
    """Run RAG query with plain text output (original behavior)."""
    print(f"🔍 Query: {query}")
    print("=" * 60)
    
    # Embed query
    print("Embedding query...")
    query_embedding = embed(query)
    
    # Search
    print(f"Searching {COLLECTION}...")
    docs, error_code = search_chroma(query_embedding, n_results=top_k)
    
    if error_code == "INDEX_UNAVAILABLE":
        print(f"Collection '{COLLECTION}' not found. Run 'tf ai ingest' first.")
        sys.exit(1)
    
    if not docs:
        print("No relevant documents found.")
        sys.exit(1)
    
    print(f"Found {len(docs)} relevant chunks")
    print()
    
    # Generate answer
    print("Generating answer...")
    print("=" * 60)
    answer = generate_answer(query, docs)
    print(answer)
    
    # Show sources
    print()
    print("=" * 60)
    print("📚 Sources:")
    seen = set()
    for doc in docs:
        if doc["source"] not in seen:
            print(f"  - {doc['source']}")
            seen.add(doc["source"])


def main():
    parser = argparse.ArgumentParser(
        description="Query TerraFusion RAG system",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("query", nargs="*", help="The question to answer")
    parser.add_argument("--json", action="store_true", help="Output structured JSON response")
    parser.add_argument("--top-k", type=int, default=TOP_K, help=f"Number of context chunks (default: {TOP_K})")
    
    args = parser.parse_args()
    
    query = " ".join(args.query) if args.query else ""
    
    if args.json:
        result = run_query_json(query, top_k=args.top_k)
        print(json.dumps(result, indent=2))
        sys.exit(0 if result["success"] else 1)
    else:
        if not query:
            print("Usage: python3 query.py <question>")
            print("Example: python3 query.py 'What is county isolation?'")
            sys.exit(1)
        run_query_plain(query, top_k=args.top_k)


if __name__ == "__main__":
    main()
