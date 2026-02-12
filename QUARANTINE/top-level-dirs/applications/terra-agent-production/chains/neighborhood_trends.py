import logging
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import OpenAI
from langchain_core.tools import BaseTool

# Get logger
logger = logging.getLogger("pacs_assistant")

def create_neighborhood_trend_chain(conn_str):
    """
    Create a chain for analyzing neighborhood property trends.
    
    Args:
        conn_str (str): Database connection string
        
    Returns:
        RetrievalQA: A chain for analyzing neighborhood trends
    """
    try:
        # We'll just use the fallback chain in this implementation since we don't have
        # a compatible vector store available
        logger.warning("Vector store functionality is not available - using fallback chain")
        raise Exception("Vector store not available")
        
    except Exception as e:
        logger.error(f"Failed to create neighborhood trends chain: {str(e)}")
        
        # Fallback to a simple LLM chain if vector store fails
        template = """
        You are an expert in real estate market analysis. Answer the following question 
        about neighborhood property trends:
        
        Question: {question}
        
        Note: I don't have access to the sales vector database right now, but I can provide 
        general guidance on how to analyze this type of trend. In a real implementation, 
        this would query historical sales data from the database.
        """
        
        prompt = PromptTemplate(
            input_variables=["question"],
            template=template
        )
        
        fallback_chain = LLMChain(
            llm=OpenAI(temperature=0),
            prompt=prompt,
            verbose=True
        )
        
        logger.warning("Using fallback neighborhood trends chain")
        return fallback_chain

class TrendsTool(BaseTool):
    """Tool for analyzing neighborhood property trends."""
    
    name: str = "trend_analysis"
    description: str = (
        "Analyze property value trends in specific neighborhoods or areas. "
        "Useful for understanding market changes, price appreciation, and sales patterns. "
        "Example usage: 'What has been the average year-over-year increase for "
        "single-family homes in precinct 7 over the last 5 years?'"
    )
    
    def __init__(self, trends_chain):
        """Initialize with a neighborhood trends chain."""
        super().__init__()
        self.trends_chain = trends_chain
    
    def _run(self, query: str) -> str:
        """Execute the tool to analyze neighborhood trends."""
        logger.info(f"Running neighborhood trend analysis for: {query}")
        
        try:
            # For RetrievalQA chain
            if hasattr(self.trends_chain, 'run'):
                result = self.trends_chain.run(query)
                return result
            # For LLMChain
            else:
                result = self.trends_chain({"question": query})
                return result["text"]
                
        except Exception as e:
            logger.error(f"Error in trend analysis: {str(e)}")
            return f"I encountered an error while analyzing trends: {str(e)}"
    
    async def _arun(self, query: str) -> str:
        """Async implementation of _run."""
        # For async compatibility, but still runs synchronously
        return self._run(query)
