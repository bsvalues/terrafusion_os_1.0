#!/usr/bin/env python3
"""
TerraFusion RAG Ingestion Script
═══════════════════════════════════════════════════════════════════════════
Indexes documentation into ChromaDB for local RAG queries.
Incremental: only re-indexes changed files (hash-based).

Usage:
    tf ai ingest
    python3 ops/ai/rag/ingest.py

Requirements:
    pip install chromadb pyyaml requests
═══════════════════════════════════════════════════════════════════════════
"""

import os
import sys
import glob
import hashlib
import json
import time
import fnmatch
from pathlib import Path
from datetime import datetime

import yaml
import requests

# ═══════════════════════════════════════════════════════════════════════════
# Configuration
# ═══════════════════════════════════════════════════════════════════════════

OLLAMA_URL = "http://127.0.0.1:11434"
CHROMA_URL = "http://127.0.0.1:8000"
EMBED_MODEL = "nomic-embed-text"
ROOT_DIR = Path(__file__).parent.parent.parent.parent  # ops/ai/rag -> root
SOURCES_FILE = Path(__file__).parent / "sources.yaml"
STATE_DIR = Path(__file__).parent / "state"
MANIFEST_FILE = STATE_DIR / "manifest.json"

# ═══════════════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════════════

def sha256_file(filepath: str) -> str:
    """Compute SHA256 hash of a file."""
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        for block in iter(lambda: f.read(8192), b""):
            h.update(block)
    return h.hexdigest()


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Get embeddings from Ollama."""
    # Ollama expects individual embedding requests
    embeddings = []
    for text in texts:
        try:
            r = requests.post(
                f"{OLLAMA_URL}/api/embeddings",
                json={"model": EMBED_MODEL, "prompt": text},
                timeout=60
            )
            r.raise_for_status()
            embeddings.append(r.json()["embedding"])
        except Exception as e:
            print(f"  ⚠ Embedding failed: {e}")
            # Return zero vector as fallback
            embeddings.append([0.0] * 768)
    return embeddings


def chunk_text(text: str, size: int, overlap: int) -> list[str]:
    """Split text into overlapping chunks."""
    chunks = []
    i = 0
    while i < len(text):
        chunk = text[i:i + size].strip()
        if chunk:
            chunks.append(chunk)
        i += size - overlap
    return chunks if chunks else [text[:size]]


def matches_exclude(filepath: str, exclude_globs: list[str]) -> bool:
    """Check if filepath matches any exclude pattern."""
    for pattern in exclude_globs:
        if fnmatch.fnmatch(filepath, pattern):
            return True
        # Also check just the relative path
        if fnmatch.fnmatch(str(Path(filepath)), pattern):
            return True
    return False


def load_manifest() -> dict:
    """Load existing manifest or return empty."""
    if MANIFEST_FILE.exists():
        return json.loads(MANIFEST_FILE.read_text())
    return {"files": {}, "last_run": None, "stats": {}}


def save_manifest(manifest: dict):
    """Save manifest to disk."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    manifest["last_run"] = datetime.now().isoformat()
    MANIFEST_FILE.write_text(json.dumps(manifest, indent=2))


# ═══════════════════════════════════════════════════════════════════════════
# ChromaDB Client (REST API v2)
# ═══════════════════════════════════════════════════════════════════════════

class ChromaRESTClient:
    """Minimal ChromaDB REST client for v2 API."""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.tenant = "default_tenant"
        self.database = "default_database"
    
    def heartbeat(self) -> bool:
        """Check if ChromaDB is reachable."""
        try:
            r = self.session.get(f"{self.base_url}/api/v2/heartbeat", timeout=5)
            return r.status_code == 200
        except:
            return False
    
    def get_or_create_collection(self, name: str) -> str:
        """Get or create a collection, return its ID."""
        # Try to get existing
        r = self.session.get(
            f"{self.base_url}/api/v2/tenants/{self.tenant}/databases/{self.database}/collections/{name}"
        )
        if r.status_code == 200:
            return r.json()["id"]
        
        # Create new
        r = self.session.post(
            f"{self.base_url}/api/v2/tenants/{self.tenant}/databases/{self.database}/collections",
            json={"name": name, "metadata": {"hnsw:space": "cosine"}}
        )
        if r.status_code in (200, 201):
            return r.json()["id"]
        r.raise_for_status()
        return r.json()["id"]
    
    def upsert(self, collection_id: str, ids: list, embeddings: list, 
               documents: list, metadatas: list):
        """Upsert documents into collection."""
        r = self.session.post(
            f"{self.base_url}/api/v2/tenants/{self.tenant}/databases/{self.database}/collections/{collection_id}/upsert",
            json={
                "ids": ids,
                "embeddings": embeddings,
                "documents": documents,
                "metadatas": metadatas
            }
        )
        r.raise_for_status()
    
    def delete(self, collection_id: str, ids: list):
        """Delete documents by ID."""
        r = self.session.post(
            f"{self.base_url}/api/v2/tenants/{self.tenant}/databases/{self.database}/collections/{collection_id}/delete",
            json={"ids": ids}
        )
        r.raise_for_status()


# ═══════════════════════════════════════════════════════════════════════════
# Main Ingestion
# ═══════════════════════════════════════════════════════════════════════════

def main():
    print("📚 TerraFusion RAG Ingest")
    print("═" * 60)
    
    # Verify services
    print("Checking services...")
    
    # Check Ollama
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        models = [m["name"] for m in r.json().get("models", [])]
        if not any(EMBED_MODEL in m for m in models):
            print(f"❌ Embedding model '{EMBED_MODEL}' not found in Ollama")
            print(f"   Run: docker exec tf-ai-ollama ollama pull {EMBED_MODEL}")
            sys.exit(1)
        print(f"  ✓ Ollama ({EMBED_MODEL} available)")
    except Exception as e:
        print(f"❌ Ollama not reachable: {e}")
        sys.exit(1)
    
    # Check ChromaDB
    chroma = ChromaRESTClient(CHROMA_URL)
    if not chroma.heartbeat():
        print(f"❌ ChromaDB not reachable at {CHROMA_URL}")
        print("   Run: tf ai up")
        sys.exit(1)
    print("  ✓ ChromaDB")
    
    # Load config
    if not SOURCES_FILE.exists():
        print(f"❌ Sources file not found: {SOURCES_FILE}")
        sys.exit(1)
    
    config = yaml.safe_load(SOURCES_FILE.read_text())
    manifest = load_manifest()
    
    stats = {"indexed": 0, "skipped": 0, "chunks": 0, "errors": 0}
    
    # Process each collection
    for coll_name, coll_config in config["collections"].items():
        print(f"\n📁 Collection: {coll_name}")
        desc = coll_config.get("description", "")
        if desc:
            print(f"   {desc}")
        
        collection_id = chroma.get_or_create_collection(coll_name)
        
        # Gather files
        files = []
        for path_pattern in coll_config["paths"]:
            full_path = ROOT_DIR / path_pattern
            
            if full_path.is_file():
                files.append(str(full_path))
            elif full_path.is_dir():
                for ext in coll_config["include_ext"]:
                    files.extend(glob.glob(
                        str(full_path / f"**/*{ext}"), 
                        recursive=True
                    ))
            else:
                # Try as glob pattern
                matches = glob.glob(str(ROOT_DIR / f"**/{path_pattern}*"), recursive=True)
                for m in matches:
                    if Path(m).is_file():
                        for ext in coll_config["include_ext"]:
                            if m.endswith(ext):
                                files.append(m)
        
        # Filter excludes and directories
        exclude_globs = coll_config.get("exclude_globs", [])
        files = [f for f in files if not matches_exclude(f, exclude_globs)]
        files = [f for f in files if Path(f).is_file()]  # Skip directories
        files = list(set(files))  # Dedupe
        
        print(f"   Found {len(files)} files")
        
        chunk_size = coll_config["chunk"]["size"]
        chunk_overlap = coll_config["chunk"]["overlap"]
        
        for filepath in files:
            try:
                rel_path = str(Path(filepath).relative_to(ROOT_DIR))
            except ValueError:
                rel_path = filepath
            
            # Check hash
            file_hash = sha256_file(filepath)
            if manifest["files"].get(filepath) == file_hash:
                stats["skipped"] += 1
                continue
            
            # Read and chunk
            try:
                content = Path(filepath).read_text(encoding="utf-8", errors="ignore")
            except Exception as e:
                print(f"   ⚠ Cannot read {rel_path}: {e}")
                stats["errors"] += 1
                continue
            
            chunks = chunk_text(content, chunk_size, chunk_overlap)
            if not chunks:
                continue
            
            print(f"   📄 {rel_path} ({len(chunks)} chunks)")
            
            # Generate embeddings
            embeddings = embed_texts(chunks)
            
            # Prepare for upsert
            ids = [f"{rel_path}:{i}" for i in range(len(chunks))]
            metadatas = [{"source": rel_path, "chunk": i} for i in range(len(chunks))]
            
            # Upsert to Chroma
            try:
                chroma.upsert(collection_id, ids, embeddings, chunks, metadatas)
                manifest["files"][filepath] = file_hash
                stats["indexed"] += 1
                stats["chunks"] += len(chunks)
            except Exception as e:
                print(f"   ⚠ Upsert failed for {rel_path}: {e}")
                stats["errors"] += 1
    
    # Save manifest
    manifest["stats"] = stats
    save_manifest(manifest)
    
    # Summary
    print("\n" + "═" * 60)
    print("✅ RAG Ingest Complete")
    print(f"   Indexed: {stats['indexed']} files ({stats['chunks']} chunks)")
    print(f"   Skipped: {stats['skipped']} (unchanged)")
    if stats["errors"]:
        print(f"   Errors:  {stats['errors']}")
    print(f"   Manifest: {MANIFEST_FILE}")


if __name__ == "__main__":
    main()
