"""
Knowledge Sharing System Demo

This script demonstrates how to use the Knowledge Sharing System
to share insights and information between agents.
"""

import sys
import os
import time
import logging
from typing import Dict, Any, List

# Add the project root to the path so we can import from there
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from mcp.core import MCP
from mcp.message_broker import MessageBroker
from mcp.agent_protocol import AgentProtocol
from mcp.experience_buffer import ExperienceBuffer
from mcp.status_reporter import StatusReporter
from mcp.knowledge_sharing import KnowledgeSharingSystem

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SimpleAgent:
    """A simple agent to test knowledge sharing"""
    
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.capabilities = ["test", "share_knowledge"]
        self.status = "normal"
        
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process a task"""
        task_type = task_data.get("type", "unknown")
        
        if task_type == "share_knowledge":
            return {
                "success": True,
                "message": f"Agent {self.agent_id} processed knowledge sharing task"
            }
        elif task_type == "query_knowledge":
            return {
                "success": True,
                "message": f"Agent {self.agent_id} processed knowledge query task"
            }
        else:
            return {
                "success": False,
                "message": f"Agent {self.agent_id} doesn't know how to process task type {task_type}"
            }


def main():
    """Main function to demonstrate the knowledge sharing system"""
    
    logger.info("Initializing components...")
    
    # Create instances of all required components
    message_broker = MessageBroker()
    protocol = AgentProtocol(message_broker)
    experience_buffer = ExperienceBuffer()
    status_reporter = StatusReporter()
    knowledge_sharing = KnowledgeSharingSystem(message_broker)
    
    # Initialize MCP
    mcp = MCP(
        message_broker=message_broker,
        protocol=protocol,
        experience_buffer=experience_buffer,
        status_reporter=status_reporter,
        knowledge_sharing=knowledge_sharing
    )
    
    # Start MCP
    mcp.start()
    
    # Create and register some test agents
    agent1 = SimpleAgent("agent1")
    agent2 = SimpleAgent("agent2")
    agent3 = SimpleAgent("agent3")
    
    mcp.register_agent("agent1", agent1)
    mcp.register_agent("agent2", agent2)
    mcp.register_agent("agent3", agent3)
    
    logger.info("Agents registered, starting knowledge sharing demo...")
    
    # Add some knowledge entries
    entry1_id = mcp.add_knowledge(
        agent_id="agent1",
        title="Best Practices for Property Assessment",
        content="When assessing properties in rural Washington State, consider the impact of agricultural zoning on land value.",
        entry_type="insight",
        tags=["property_assessment", "best_practice", "rural", "washington"]
    )
    
    logger.info(f"Added knowledge entry: {entry1_id}")
    
    entry2_id = mcp.add_knowledge(
        agent_id="agent2",
        title="Common Errors in Valuation Models",
        content="Failure to account for waterfront property premiums can lead to systematic undervaluation in coastal areas.",
        entry_type="warning",
        tags=["valuation", "error", "waterfront", "coastal"]
    )
    
    logger.info(f"Added knowledge entry: {entry2_id}")
    
    entry3_id = mcp.add_knowledge(
        agent_id="agent3",
        title="Compliance with RCW 84.40.030",
        content="All property valuations must reflect fair market value per RCW 84.40.030, requiring consideration of recent sales of similar properties.",
        entry_type="compliance",
        tags=["legal", "rcw", "market_value", "compliance"]
    )
    
    logger.info(f"Added knowledge entry: {entry3_id}")
    
    # Query for knowledge
    results = mcp.query_knowledge(
        agent_id="agent1",
        query_text="valuation errors",
        limit=5
    )
    
    logger.info(f"Query results for 'valuation errors': {len(results)} entries found")
    for i, result in enumerate(results):
        logger.info(f"Result {i+1}: {result.get('title')} - {result.get('entry_type')}")
    
    # Query with tag filter
    results = mcp.query_knowledge(
        agent_id="agent2",
        query_text="compliance requirements",
        tags=["legal"],
        limit=5
    )
    
    logger.info(f"Query results for 'compliance requirements' with legal tag: {len(results)} entries found")
    for i, result in enumerate(results):
        logger.info(f"Result {i+1}: {result.get('title')} - {result.get('entry_type')}")
    
    # Get related knowledge
    related = mcp.get_related_knowledge(entry1_id, limit=2)
    logger.info(f"Related knowledge for entry {entry1_id}: {len(related)} entries found")
    for i, result in enumerate(related):
        logger.info(f"Related {i+1}: {result.get('title')} - {result.get('entry_type')}")
    
    # Provide feedback
    success = mcp.provide_knowledge_feedback(
        agent_id="agent2",
        entry_id=entry1_id,
        rating=4.5,
        feedback_text="Very useful information for rural property assessments."
    )
    
    logger.info(f"Feedback provided: {success}")
    
    # Get agent's knowledge
    agent1_knowledge = mcp.get_agent_knowledge("agent1")
    logger.info(f"Agent1 has contributed {len(agent1_knowledge)} knowledge entries")
    
    # Get specific knowledge entry
    entry = mcp.get_knowledge_entry(entry3_id)
    if entry:
        logger.info(f"Retrieved entry {entry3_id}: {entry.get('title')}")
    
    # Clean up
    logger.info("Demo completed, shutting down...")
    mcp.stop()


if __name__ == "__main__":
    main()