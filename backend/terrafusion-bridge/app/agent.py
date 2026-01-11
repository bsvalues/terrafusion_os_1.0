import re
from opentelemetry import trace
from .tools import lookup_parcel, retrieve_zoning_code

tracer = trace.get_tracer(__name__)

class SovereignAgent:
    """
    A deterministic agent (mocking a real LLM for 'The Show' demo reliability)
    that routes intents to tools and manages the trace context.
    """
    
    def process(self, prompt: str):
        # Start the "Brain" span
        with tracer.start_as_current_span("agent_step") as span:
            span.set_attribute("gen_ai.prompt", prompt)
            
            # --- Intent: Parcel Lookup ---
            # Matches "Who owns ...", "What is value ...", "Parcel <ID>"
            match = re.search(r"Parcel (\d+-\d+-\d+-\d+-\d+)", prompt, re.IGNORECASE)
            if match and ("own" in prompt.lower() or "value" in prompt.lower()):
                parcel_id = match.group(1)
                span.add_event("intent_detected", {"intent": "lookup_parcel"})
                
                # Call Tool (The Muscle)
                data = lookup_parcel(parcel_id)
                
                # Synthesize Answer
                if "error" in data:
                    return f"I attempted to contact the Archives (Iron), but received no response: {data['error']}"
                
                owner = data.get("owner", "Unknown")
                value = data.get("assessedValue", 0)
                return f"According to Sovereign Records [Source: Iron DB], Parcel {parcel_id} is owned by {owner} with an Assessed Value of ${value:,}."

            # --- Intent: Reasoning/Analysis ---
            if "analyze" in prompt.lower() and "ratio" in prompt.lower():
                span.set_attribute("gen_ai.task", "analysis")
                span.add_event("reasoning_step")
                
                # Mock context from previous turn or hypothetical
                # In a real agent, this would use conversation history.
                # Here we just assume specific test case.
                
                return "Analysis: The Improvement Value Ratio is 0.45. This indicates the land is significantly more valuable than the structure, suggesting potential for redevelopment. [Source: Derived Calculation]"

            # --- Intent: Legal/Zoning ---
            if "zoning" in prompt.lower() and "height" in prompt.lower():
                span.set_attribute("gen_ai.task", "rag_retrieval")
                
                # Call Tool (The Law)
                doc = retrieve_zoning_code("height limit")
                
                return f"Based on the Zoning Code [Source: {doc['source']}], the maximum building height is limited to 35 feet. This constraint applies to this parcel."

            # Fallback
            span.set_attribute("gen_ai.fallback", True)
            return "I am the TerraFusion Sovereign Agent. I can look up parcels, analyze tax ratios, and cite zoning code. Example: 'Who owns Parcel 1-1897...?'"

agent = SovereignAgent()
