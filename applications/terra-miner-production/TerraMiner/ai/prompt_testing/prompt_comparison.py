"""
Prompt Testing Module - Handles A/B testing of different prompt formulations.
"""
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional, Union

# Configure logger
logger = logging.getLogger(__name__)

# Import models for database interactions
try:
    from app import db
    from models import AIPromptTest, AIPromptResult
except ImportError as e:
    logger.warning(f"Could not import database models: {str(e)}")
    db = None
    AIPromptTest = None
    AIPromptResult = None

# Attempt to import AI client services
try:
    from ai.clients import get_openai_client, get_anthropic_client
except ImportError as e:
    logger.warning(f"Could not import AI clients: {str(e)}")
    get_openai_client = None
    get_anthropic_client = None


def run_prompt_comparison(
    agent_type: str,
    prompt_a: str,
    prompt_b: str,
    test_input: str,
    use_gpt4: bool = False
) -> Dict[str, Any]:
    """
    Run a comparison between two prompts and return the results.
    
    Args:
        agent_type: Type of agent to use for testing (e.g., summarizer, recommender)
        prompt_a: The first prompt to test (baseline)
        prompt_b: The second prompt to test (variation)
        test_input: The input data to process with both prompts
        use_gpt4: Whether to use GPT-4 (more expensive but more capable)
        
    Returns:
        Dictionary containing the results for both prompts
    """
    logger.info(f"Running prompt comparison for agent type: {agent_type}")
    
    # Select the model to use
    model = "gpt-4" if use_gpt4 else "gpt-3.5-turbo"
    
    # Placeholder for real results
    result_a = process_prompt(prompt_a, test_input, model, agent_type, "A")
    result_b = process_prompt(prompt_b, test_input, model, agent_type, "B")
    
    # Compare the results to find key differences
    differences = compare_results(result_a, result_b)
    
    # Add the differences to the results
    if result_a and "metadata" in result_a:
        result_a["metadata"]["differences"] = differences
    
    if result_b and "metadata" in result_b:
        result_b["metadata"]["differences"] = differences
    
    return {
        "result_a": result_a,
        "result_b": result_b,
        "agent_type": agent_type,
        "model": model
    }


def process_prompt(
    prompt: str,
    input_data: str,
    model: str,
    agent_type: str,
    variant_label: str
) -> Dict[str, Any]:
    """
    Process a single prompt and return the results.
    
    Args:
        prompt: The prompt template to use
        input_data: The input data to insert into the prompt
        model: The AI model to use
        agent_type: Type of agent (for telemetry and modeling)
        variant_label: Label for this variant (e.g., "A" or "B")
        
    Returns:
        Dictionary with response content and metadata
    """
    # Start timing the request
    start_time = time.time()
    
    # Construct the full prompt by inserting the input data
    # We replace {input} with the actual input data
    full_prompt = prompt.replace("{input}", input_data)
    
    # Log what we're doing
    logger.info(f"Processing {agent_type} prompt variant {variant_label} using {model}")
    
    try:
        # Get the appropriate AI client
        if model.startswith("gpt"):
            # Use OpenAI API
            if get_openai_client:
                client = get_openai_client()
                response = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": full_prompt}],
                    temperature=0.7,
                    max_tokens=1000
                )
                
                # Extract the content from the response
                content = response.choices[0].message.content
                tokens = response.usage.total_tokens
                
                # For demonstration purposes, we'll calculate a mock quality score
                # In a real system, this would be calculated through more sophisticated means
                quality_score = min(95, 70 + (len(content) // 50))
                
                # Format the response
                raw_response = str(response)
                
            else:
                # Mock response for when client isn't available
                content = f"Example {agent_type} response for variant {variant_label}."
                tokens = len(full_prompt.split()) + len(content.split())
                quality_score = 85
                raw_response = json.dumps({"content": content})
                
        elif model.startswith("claude"):
            # Use Anthropic API
            if get_anthropic_client:
                client = get_anthropic_client()
                response = client.messages.create(
                    model=model,
                    messages=[{"role": "user", "content": full_prompt}],
                    max_tokens=1000
                )
                
                # Extract content
                content = response.content[0].text
                tokens = response.usage.input_tokens + response.usage.output_tokens
                quality_score = min(95, 75 + (len(content) // 60))
                raw_response = str(response)
            else:
                # Mock response for when client isn't available
                content = f"Example {agent_type} response using Claude for variant {variant_label}."
                tokens = len(full_prompt.split()) + len(content.split())
                quality_score = 87
                raw_response = json.dumps({"content": content})
        else:
            # Default mock response for unknown models
            content = f"Simulated response for {model} model, variant {variant_label}."
            tokens = len(full_prompt.split()) + len(content.split())
            quality_score = 80
            raw_response = json.dumps({"content": content})
            
        # Calculate time taken
        time_taken = int((time.time() - start_time) * 1000)  # Convert to milliseconds
        
        # Compile the result
        result = {
            "content": content,
            "raw": raw_response,
            "metadata": {
                "time_taken": time_taken,
                "token_count": tokens,
                "quality_score": quality_score,
                "model": model,
                "timestamp": datetime.now().isoformat(),
                "variant": variant_label,
                # We might tokenize the content for token-level analysis
                "tokens": content.split()[:50]  # Just the first 50 tokens for display
            }
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Error processing prompt: {str(e)}")
        return {
            "content": f"Error: {str(e)}",
            "raw": str(e),
            "metadata": {
                "time_taken": int((time.time() - start_time) * 1000),
                "error": str(e),
                "timestamp": datetime.now().isoformat(),
                "variant": variant_label
            }
        }


def compare_results(result_a: Dict[str, Any], result_b: Dict[str, Any]) -> List[str]:
    """
    Compare two prompt results and identify key differences.
    
    Args:
        result_a: The result from the first prompt
        result_b: The result from the second prompt
        
    Returns:
        List of strings describing key differences
    """
    differences = []
    
    # Check if we have valid results to compare
    if not (result_a and result_b and "content" in result_a and "content" in result_b):
        differences.append("Unable to compare results due to missing content")
        return differences
    
    content_a = result_a["content"]
    content_b = result_b["content"]
    
    # Compare response lengths
    len_a = len(content_a)
    len_b = len(content_b)
    len_diff = abs(len_a - len_b)
    len_percent = (len_diff / max(len_a, len_b)) * 100
    
    if len_percent > 20:  # If length differs by more than 20%
        if len_a > len_b:
            differences.append(f"Response A is {len_percent:.1f}% longer than Response B")
        else:
            differences.append(f"Response B is {len_percent:.1f}% longer than Response A")
    
    # Compare token counts if available
    if ("metadata" in result_a and "token_count" in result_a["metadata"] and 
        "metadata" in result_b and "token_count" in result_b["metadata"]):
        
        tokens_a = result_a["metadata"]["token_count"]
        tokens_b = result_b["metadata"]["token_count"]
        token_diff = abs(tokens_a - tokens_b)
        token_percent = (token_diff / max(tokens_a, tokens_b)) * 100
        
        if token_percent > 15:  # If token count differs by more than 15%
            if tokens_a > tokens_b:
                differences.append(f"Response A uses {token_diff} more tokens (+{token_percent:.1f}%)")
            else:
                differences.append(f"Response B uses {token_diff} more tokens (+{token_percent:.1f}%)")
    
    # Compare response time if available
    if ("metadata" in result_a and "time_taken" in result_a["metadata"] and 
        "metadata" in result_b and "time_taken" in result_b["metadata"]):
        
        time_a = result_a["metadata"]["time_taken"]
        time_b = result_b["metadata"]["time_taken"]
        time_diff = abs(time_a - time_b)
        time_percent = (time_diff / max(time_a, time_b)) * 100
        
        if time_percent > 30:  # If processing time differs by more than 30%
            if time_a > time_b:
                differences.append(f"Response A took {time_percent:.1f}% longer to generate")
            else:
                differences.append(f"Response B took {time_percent:.1f}% longer to generate")
    
    # Simple content analysis - look for structures like lists, code blocks, etc.
    contains_list_a = "- " in content_a or "\n1. " in content_a
    contains_list_b = "- " in content_b or "\n1. " in content_b
    
    if contains_list_a and not contains_list_b:
        differences.append("Response A contains lists, while Response B does not")
    elif contains_list_b and not contains_list_a:
        differences.append("Response B contains lists, while Response A does not")
    
    # Check for code blocks
    contains_code_a = "```" in content_a
    contains_code_b = "```" in content_b
    
    if contains_code_a and not contains_code_b:
        differences.append("Response A contains code blocks, while Response B does not")
    elif contains_code_b and not contains_code_a:
        differences.append("Response B contains code blocks, while Response A does not")
    
    # Add basic semantic difference summary
    # In a real system, this would use more sophisticated NLP techniques
    differences.append("Content organization and emphasis differs between responses")
    
    return differences


def save_prompt_comparison(
    agent_type: str,
    prompt_a: str,
    prompt_b: str,
    result_a: Dict[str, Any],
    result_b: Dict[str, Any]
) -> Optional[int]:
    """
    Save the prompt comparison results to the database.
    
    Args:
        agent_type: Type of agent used for the test
        prompt_a: First prompt template
        prompt_b: Second prompt template
        result_a: Results from the first prompt
        result_b: Results from the second prompt
        
    Returns:
        ID of the created test record, or None if saving failed
    """
    # If database components aren't available, we can't save
    if not all([db, AIPromptTest, AIPromptResult]):
        logger.warning("Cannot save prompt comparison: database components not available")
        return None
    
    try:
        # Create a new test record
        test = AIPromptTest(
            agent_type=agent_type,
            prompt_a=prompt_a,
            prompt_b=prompt_b,
            timestamp=datetime.now(),
            metrics=json.dumps({
                "time_taken_a": result_a.get("metadata", {}).get("time_taken"),
                "time_taken_b": result_b.get("metadata", {}).get("time_taken"),
                "token_count_a": result_a.get("metadata", {}).get("token_count"),
                "token_count_b": result_b.get("metadata", {}).get("token_count"),
                "quality_score_a": result_a.get("metadata", {}).get("quality_score"),
                "quality_score_b": result_b.get("metadata", {}).get("quality_score"),
            })
        )
        
        # Add to the session and flush to get the ID
        db.session.add(test)
        db.session.flush()
        
        # Now create the result records
        result_record_a = AIPromptResult(
            test_id=test.id,
            variant="A",
            content=result_a.get("content", ""),
            raw_response=result_a.get("raw", ""),
            response_metadata=json.dumps(result_a.get("metadata", {}))
        )
        
        result_record_b = AIPromptResult(
            test_id=test.id,
            variant="B",
            content=result_b.get("content", ""),
            raw_response=result_b.get("raw", ""),
            response_metadata=json.dumps(result_b.get("metadata", {}))
        )
        
        # Add the results to the session
        db.session.add(result_record_a)
        db.session.add(result_record_b)
        
        # Commit all changes
        db.session.commit()
        
        logger.info(f"Saved prompt comparison with ID {test.id}")
        return test.id
        
    except Exception as e:
        logger.error(f"Error saving prompt comparison: {str(e)}")
        if db:
            db.session.rollback()
        return None