import os
import logging
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from models import Document
from utils.monitoring import record_query, record_response_time
import time

# Get logger
logger = logging.getLogger("pacs_assistant")

def create_rag_chain():
    """
    Create a simple RAG chain for document-based question answering.
    Without actual vector embeddings, this is a simplified version
    that uses basic text search and then provides context to the LLM.
    
    Returns:
        callable: A function that takes a query and returns an answer
    """
    try:
        # Check for OpenAI API key
        if not os.getenv("OPENAI_API_KEY"):
            logger.critical("OpenAI API key not found in environment variables")
            raise ValueError("OPENAI_API_KEY environment variable is required")
            
        # the newest OpenAI model is "gpt-4o" which was released May 13, 2024.
        # do not change this unless explicitly requested by the user
        llm = ChatOpenAI(
            model="gpt-4o",
            temperature=0
        )
        
        # Create a prompt template for RAG
        template = """You are Agent Smith, the AI assistant for TerraAgent, a property tax and valuation analysis system.

Context information is below:
---------------------------
{context}
---------------------------

Answer the question based on the context information provided. If you don't know the answer or the information isn't in the context, say so - don't make up information.

Question: {question}

Answer: """

        prompt = ChatPromptTemplate.from_template(template)
        
        # Create chain
        chain = (
            {"context": lambda x: x["context"], "question": lambda x: x["question"]}
            | prompt
            | llm
            | StrOutputParser()
        )
        
        return chain
        
    except Exception as e:
        logger.error(f"Error creating RAG chain: {str(e)}")
        return None


def search_for_relevant_documents(query, limit=3):
    """
    Search for documents relevant to the query.
    
    Args:
        query (str): User query
        limit (int): Maximum number of documents to return
        
    Returns:
        str: Combined document content
    """
    try:
        from utils.document_processor import search_documents
        
        # Get relevant documents
        documents = search_documents(query, limit=limit)
        
        if not documents:
            logger.warning(f"No relevant documents found for query: {query}")
            return "No relevant documents found in the knowledge base."
        
        # Combine document content
        context = "\n\n---\n\n".join([
            f"Document: {doc.title}\n\n{doc.content}" for doc in documents
        ])
        
        return context
        
    except Exception as e:
        logger.error(f"Error searching for documents: {str(e)}")
        return "Error retrieving document information."


def run_rag_query(question, chat_history=None):
    """
    Run a RAG query using the chain.
    
    Args:
        question (str): User question
        chat_history (list): List of (question, answer) tuples
        
    Returns:
        dict: Dict with answer
    """
    start_time = time.time()
    
    try:
        # Record the query
        record_query(query_type="rag")
        
        logger.info(f"Processing RAG query: {question}")
        
        # Create chain if not already created
        chain = create_rag_chain()
        
        if not chain:
            logger.error("Failed to create RAG chain")
            return {"answer": "I'm sorry, the document retrieval system is currently unavailable."}
        
        # Search for relevant documents
        context = search_for_relevant_documents(question)
        
        # Consider chat history if provided
        if chat_history and len(chat_history) > 0:
            # Append recent chat history to provide more context
            history_text = "\n".join([
                f"Previous Q: {q}\nPrevious A: {a}" 
                for q, a in chat_history[-3:]  # Last 3 exchanges
            ])
            context = f"{context}\n\nRecent conversation history:\n{history_text}"
        
        # Run the chain
        answer = chain({"context": context, "question": question})
        
        elapsed_time = time.time() - start_time
        record_response_time(elapsed_time, "rag")
        
        logger.info(f"RAG query processed in {elapsed_time:.2f}s")
        return {"answer": answer}
        
    except Exception as e:
        elapsed_time = time.time() - start_time
        logger.error(f"Error processing RAG query: {str(e)}")
        return {"answer": f"I encountered an error while processing your question: {str(e)}"}
    
    finally:
        if start_time:
            elapsed_time = time.time() - start_time
            record_response_time(elapsed_time, "rag")