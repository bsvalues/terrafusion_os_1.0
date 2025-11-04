import os
import logging
import numpy as np
import faiss
import json
import tempfile
from werkzeug.utils import secure_filename
from flask import current_app
from models import File, IndexedDocument, QueryLog, db
import datetime
import time
from typing import List, Dict, Any, Tuple

# Import OpenAI and LangChain
from openai import OpenAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
# Updated imports for LangChain (fixes deprecation warnings)
from langchain_community.document_loaders import TextLoader, PyPDFLoader, UnstructuredXMLLoader
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS as LangchainFAISS

logger = logging.getLogger(__name__)

# OpenAI API configuration
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
openai = OpenAI(api_key=OPENAI_API_KEY)

# Initialize embeddings model
embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

# Vector database configuration
VECTOR_DB_PATH = os.environ.get("VECTOR_DB_PATH", "vector_db")
os.makedirs(VECTOR_DB_PATH, exist_ok=True)

# Global vector store instance
vector_store = None

def initialize_vector_store():
    """Initialize the vector store from disk or create a new one"""
    global vector_store
    
    # Don't attempt to initialize vector store if OpenAI API key isn't available
    if not OPENAI_API_KEY:
        logger.warning("OpenAI API key not provided, RAG functionality will not be available")
        return
    
    try:
        if os.path.exists(os.path.join(VECTOR_DB_PATH, "index.faiss")):
            try:
                # Load existing vector store
                vector_store = LangchainFAISS.load_local(
                    VECTOR_DB_PATH,
                    embeddings
                )
                logger.info("Loaded existing vector store")
            except Exception as e:
                logger.error(f"Error loading vector store: {str(e)}")
                # Create a new vector store if loading fails, but don't fail the whole app
                try:
                    vector_store = LangchainFAISS.from_texts(["Benton County GIS System"], embeddings)
                    vector_store.save_local(VECTOR_DB_PATH)
                except Exception as e2:
                    logger.error(f"Failed to create new vector store: {str(e2)}")
        else:
            # Create a new vector store, but don't fail the whole app if it doesn't work
            try:
                vector_store = LangchainFAISS.from_texts(["Benton County GIS System"], embeddings)
                vector_store.save_local(VECTOR_DB_PATH)
                logger.info("Created new vector store")
            except Exception as e:
                logger.error(f"Failed to create new vector store: {str(e)}")
    except Exception as e:
        logger.error(f"Vector store initialization failed: {str(e)}")
        # Don't crash the app if vector store initialization fails

# Commenting out automatic initialization to prevent errors on startup
# initialize_vector_store() 
# We will initialize lazily when needed instead

def get_document_loader(file_path: str):
    """Get the appropriate document loader based on file extension"""
    if file_path.endswith('.pdf'):
        return PyPDFLoader(file_path)
    elif file_path.endswith('.xml'):
        return UnstructuredXMLLoader(file_path)
    else:
        # Default to text loader
        return TextLoader(file_path)

def index_document(file_path: str, file_id: int, description: str = ""):
    """Index a document for RAG search"""
    global vector_store
    
    # If no OpenAI API key is available, log it and return without trying to index
    if not OPENAI_API_KEY:
        logger.warning("OpenAI API key not available, skipping document indexing")
        return False
    
    if vector_store is None:
        initialize_vector_store()
        
    # If vector_store is still None after trying to initialize, it failed
    if vector_store is None:
        logger.error("Vector store initialization failed, cannot index document")
        return False
    
    try:
        # Check if document already indexed
        existing_index = IndexedDocument.query.filter_by(file_id=file_id).first()
        if existing_index:
            logger.info(f"Document already indexed: {file_id}")
            return True
        
        # Create a new index record
        index_record = IndexedDocument(
            file_id=file_id,
            status='pending'
        )
        db.session.add(index_record)
        db.session.commit()
        
        # Get the appropriate loader
        loader = get_document_loader(file_path)
        documents = loader.load()
        
        # Add description as a separate document
        if description:
            from langchain.schema.document import Document
            desc_doc = Document(page_content=description, metadata={"source": file_path, "description": True})
            documents.append(desc_doc)
        
        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        chunks = text_splitter.split_documents(documents)
        
        # Add file_id to metadata
        for chunk in chunks:
            chunk.metadata["file_id"] = file_id
        
        # Add to vector store
        vector_store.add_documents(chunks)
        vector_store.save_local(VECTOR_DB_PATH)
        
        # Update index record
        index_record.status = 'indexed'
        index_record.chunk_count = len(chunks)
        db.session.commit()
        
        logger.info(f"Successfully indexed document {file_id} with {len(chunks)} chunks")
        return True
    
    except Exception as e:
        logger.error(f"Error indexing document: {str(e)}")
        # Update index record with failure
        if 'index_record' in locals() and index_record is not None:
            index_record.status = 'failed'
            db.session.commit()
        return False

def process_query(query: str, user_id: int = None, max_results: int = 5) -> Dict[str, Any]:
    """Process a natural language query using RAG"""
    global vector_store
    
    # Check if OpenAI API key is available
    if not OPENAI_API_KEY:
        return {
            "answer": "The search functionality is currently unavailable due to missing API credentials. Please contact the administrator.",
            "files": [],
            "processing_time": 0
        }
    
    if vector_store is None:
        initialize_vector_store()
    
    # If vector store is still None after initialization, it failed
    if vector_store is None:
        return {
            "answer": "The search functionality is currently unavailable. Please try again later or contact the administrator.",
            "files": [],
            "processing_time": 0
        }
    
    start_time = time.time()
    
    try:
        # Search for relevant documents
        search_results = vector_store.similarity_search_with_score(query, k=max_results)
        
        # Extract content and metadata from search results
        contexts = []
        file_ids = set()
        
        for doc, score in search_results:
            contexts.append(doc.page_content)
            if 'file_id' in doc.metadata:
                file_ids.add(doc.metadata['file_id'])
        
        # Get file information for the results
        files = []
        if file_ids:
            file_records = File.query.filter(File.id.in_(file_ids)).all()
            files = [
                {
                    "id": f.id,
                    "filename": f.filename,
                    "description": f.description or "",
                    "upload_date": f.upload_date.strftime("%Y-%m-%d %H:%M:%S")
                }
                for f in file_records
            ]
        
        # Combine the contexts and query for the LLM
        context_text = "\n\n".join(contexts)
        prompt = f"""You are a GIS expert assistant for Benton County Assessor's Office. 
Use the following information to answer the user's question.
If you don't know the answer based on the provided information, say so directly.
Do not make up information. The answer should be specifically about Benton County's GIS data based on the context.

Context information:
{context_text}

User question: {query}

Provide a clear, concise answer in a professional tone. Include references to specific files if they contain the relevant information.
"""
        
        # Get response from OpenAI
        response = openai.chat.completions.create(
            model="gpt-4o", # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
            messages=[
                {"role": "system", "content": "You are a GIS expert assistant for Benton County, Washington."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        answer = response.choices[0].message.content
        
        # Calculate processing time
        processing_time = time.time() - start_time
        
        # Log query in database if user_id is provided
        if user_id:
            try:
                query_log = QueryLog.query.filter_by(user_id=user_id, query=query).first()
                if query_log:
                    query_log.response = answer
                    query_log.processing_time = processing_time
                db.session.commit()
            except Exception as e:
                logger.error(f"Error logging query to database: {str(e)}")
                # Continue even if logging fails
        
        # Return results
        return {
            "answer": answer,
            "files": files,
            "processing_time": round(processing_time, 2)
        }
    
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        return {
            "answer": f"Sorry, I encountered an error while processing your query: {str(e)}",
            "files": [],
            "processing_time": 0
        }
