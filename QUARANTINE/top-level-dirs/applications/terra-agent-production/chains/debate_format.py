"""
Samson and Michael Debate Format Chain
Implementation of the dual-perspective debate format for balanced responses.
"""

import os
import logging
from langchain_openai import OpenAI
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from typing import Dict, Any
from utils.ollama_client import get_ollama_client, ensure_model_available

# Get logger
logger = logging.getLogger("pacs_assistant")

def create_debate_chain():
    """
    Create a chain for the Samson and Michael debate format.
    
    Returns:
        callable: A function for generating dual-perspective responses
    """
    try:
        # Initialize the OpenAI LLM
        llm = OpenAI(
            temperature=0.7
        )
        
        # Create the debate format prompt
        debate_prompt = PromptTemplate(
            input_variables=["query", "context"],
            template="""You are implementing the famous Samson and Michael debate format from Davian. 
When responding to queries, you must provide two balanced perspectives:

1. Samson presents the positive aspects, benefits, and supporting arguments
2. Michael presents the opposing view, limitations, and alternative considerations

Context: {context}

Query: {query}

Respond in this exact format:

[ Samson ] - Present the positive aspects, benefits, and supporting arguments for this topic. If it involves programming, provide working code with explanations of its advantages.

[ Michael ] - Present the opposing view, limitations, potential issues, and alternative considerations. If it involves programming, provide alternative code approaches or highlight potential problems with the first approach.

Remember to:
- Provide step-by-step guidance when applicable
- Be balanced and educational
- Include working code examples for programming questions
- Maintain the formal debate structure
"""
        )
        
        # Create the LLM chain
        debate_chain = LLMChain(
            llm=llm,
            prompt=debate_prompt,
            verbose=True
        )
        
        logger.info("Debate format chain created successfully")
        return debate_chain
        
    except Exception as e:
        logger.error(f"Error creating debate chain: {str(e)}")
        return None

def run_debate_format(query: str):
    """
    Execute the Samson and Michael debate format for a given query.
    
    Args:
        query (str): The query to analyze in debate format
        
    Returns:
        str: Formatted debate response
    """
    try:
        # Check if query starts with "Judge -" to trigger debate format
        if not query.strip().lower().startswith("judge -"):
            return "To use the debate format, please start your query with 'Judge - ' followed by your question."
        
        # Remove "Judge -" prefix
        clean_query = query.strip()[7:].strip()
        
        # Get relevant context from documents
        context = get_relevant_context(clean_query)
        
        # Try Ollama first, fallback to OpenAI
        ollama_client = get_ollama_client()
        
        if ollama_client:
            response = run_ollama_debate(ollama_client, clean_query, context)
            if response:
                logger.info(f"Debate format response generated with Ollama for query: {clean_query}")
                return response
        
        # Fallback to OpenAI
        debate_chain = create_debate_chain()
        if not debate_chain:
            return "Debate format is currently unavailable. Please check your AI model configuration."
        
        # Generate the debate response
        response = debate_chain.run(
            query=clean_query,
            context=context
        )
        
        logger.info(f"Debate format response generated with OpenAI for query: {clean_query}")
        return response
        
    except Exception as e:
        logger.error(f"Error in debate format: {str(e)}")
        return f"Error generating debate response: {str(e)}"

def run_ollama_debate(ollama_client, query: str, context: str) -> str:
    """
    Run debate format using local Ollama model.
    
    Args:
        ollama_client: Ollama client instance
        query (str): The query to analyze
        context (str): Relevant context
        
    Returns:
        str: Formatted debate response or empty string if failed
    """
    try:
        # Ensure model is available
        model_name = "llama3.2:3b"
        if not ensure_model_available(ollama_client, model_name):
            logger.warning(f"Model {model_name} not available")
            return ""
        
        # Create the debate prompt
        system_prompt = """You are implementing the famous Samson and Michael debate format from Davian. 
When responding to queries, you must provide two balanced perspectives:

1. Samson presents the positive aspects, benefits, and supporting arguments
2. Michael presents the opposing view, limitations, and alternative considerations

Always respond in this exact format:

[ Samson ] - Present the positive aspects, benefits, and supporting arguments for this topic. If it involves programming, provide working code with explanations of its advantages.

[ Michael ] - Present the opposing view, limitations, potential issues, and alternative considerations. If it involves programming, provide alternative code approaches or highlight potential problems with the first approach.

Remember to:
- Provide step-by-step guidance when applicable
- Be balanced and educational
- Include working code examples for programming questions
- Maintain the formal debate structure"""
        
        user_prompt = f"Context: {context}\n\nQuery: {query}"
        
        # Generate response using Ollama
        response = ollama_client.generate(
            model=model_name,
            prompt=user_prompt,
            system=system_prompt
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error running Ollama debate: {str(e)}")
        return ""

def get_relevant_context(query: str) -> str:
    """Get relevant context for the query from documents."""
    try:
        from utils.document_processor import search_documents
        
        # Search for relevant documents
        documents = search_documents(query, limit=2)
        
        if not documents:
            return "No specific context available from knowledge base."
        
        # Combine document content
        context = "\n\n".join([
            f"Reference: {doc.title}\n{doc.content[:500]}..." 
            for doc in documents
        ])
        
        return context
        
    except Exception as e:
        logger.error(f"Error getting context: {str(e)}")
        return "Context retrieval unavailable."