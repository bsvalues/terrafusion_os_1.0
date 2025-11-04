import logging
from langchain_core.prompts import PromptTemplate
from langchain.chains import LLMChain
from langchain_openai import OpenAI
from langchain_core.tools import BaseTool

# Get logger
logger = logging.getLogger("pacs_assistant")

def create_levy_chain():
    """
    Create a chain for calculating property tax levies.
    
    Returns:
        LLMChain: A chain for calculating property tax levies
    """
    # Define the prompt template
    template = """
    You are an expert county assessor. Given this parcel record:
    {parcel_record}
    
    And these levy parameters:
    Tax rate = {tax_rate}
    Exemptions = {exemptions}
    
    Calculate the total tax due with a detailed breakdown.
    
    Follow these steps:
    1. Calculate the gross assessed value based on the parcel record
    2. Apply any exemptions to get the net assessed value
    3. Multiply by the tax rate to get the tax amount
    4. List any special assessments or fees
    5. Show the final total due
    
    Present your calculations in a clear, itemized format with explanations.
    """
    
    # Create the prompt
    levy_prompt = PromptTemplate(
        input_variables=["parcel_record", "tax_rate", "exemptions"],
        template=template
    )
    
    # Create the chain
    levy_chain = LLMChain(
        llm=OpenAI(temperature=0),
        prompt=levy_prompt,
        verbose=True
    )
    
    logger.info("Levy calculator chain created")
    return levy_chain

class LevyTool(BaseTool):
    """Tool for calculating property tax levies."""
    
    name: str = "levy_calc"
    description: str = (
        "Calculate property tax levies for a given parcel. "
        "Useful when you need to determine tax amounts due for properties. "
        "Requires parcel record information, tax rate, and applicable exemptions. "
        "Example usage: 'Calculate the levy for parcel A12345 with homestead exemption'"
    )
    
    def __init__(self, levy_chain):
        """Initialize with a levy calculation chain."""
        super().__init__()
        self.levy_chain = levy_chain
    
    def _run(self, query: str) -> str:
        """Execute the tool to calculate a levy."""
        logger.info(f"Running levy calculation for: {query}")
        
        # Extract parcel ID from the query if possible
        import re
        parcel_id_match = re.search(r'[A-Z]\d{5}', query)
        parcel_id = parcel_id_match.group(0) if parcel_id_match else "Unknown"
        
        # For a real implementation, we would query the database for the parcel record
        # Here we create a placeholder with instructions
        parcel_record = {
            "parcel_id": parcel_id,
            "description": "For a real implementation, query the database for this parcel's data"
        }
        
        # Determine tax rate and exemptions from query or use defaults
        tax_rate = 0.0125  # Default rate of 1.25%
        exemptions = ["Homestead"] if "homestead" in query.lower() else []
        
        # Run the levy calculation
        result = self.levy_chain({
            "parcel_record": parcel_record,
            "tax_rate": tax_rate,
            "exemptions": exemptions
        })
        
        return result["text"]
    
    async def _arun(self, query: str) -> str:
        """Async implementation of _run."""
        # For async compatibility, but still runs synchronously
        return self._run(query)
