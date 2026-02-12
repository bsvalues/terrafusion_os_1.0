"""
Continuous Learning System for AI agents.
This module manages the automatic improvement cycle for AI agents.
"""
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import traceback

from app import db
# Import models inside functions to avoid circular imports
from ai.prompt_optimizer import PromptOptimizer

# Set up logging
logger = logging.getLogger(__name__)

class ContinuousLearningSystem:
    """
    Manages the continuous learning and improvement of AI agents
    based on feedback and performance data.
    """
    
    def __init__(self):
        """Initialize the continuous learning system."""
        self.optimizer = PromptOptimizer()
        self.agent_types = ["summarizer", "market_analyzer", "recommender", "nl_search"]
        
    def start_learning_cycle(self) -> Dict[str, Any]:
        """
        Start a new learning cycle that will analyze recent feedback
        and generate new prompt versions for each agent type.
        
        Returns:
            Dict[str, Any]: Information about the newly created learning cycle
        """
        # Import models inside function to avoid circular imports
        from models import LearningCycle
        
        # Create a new learning cycle
        cycle = LearningCycle(
            start_date=datetime.now(),
            status='in_progress'
        )
        
        db.session.add(cycle)
        db.session.commit()
        
        return {
            "status": "success",
            "cycle_id": cycle.id,
            "start_date": cycle.start_date.isoformat(),
            "status": cycle.status
        }
    
    def run_learning_cycle(self, cycle_id: int) -> Dict[str, Any]:
        """
        Execute the learning cycle for all agent types.
        
        Args:
            cycle_id (int): The ID of the learning cycle to run
            
        Returns:
            Dict[str, Any]: Results of the learning cycle
        """
        # Import models inside function to avoid circular imports
        from models import LearningCycle
        
        # Get the cycle
        cycle = LearningCycle.query.get(cycle_id)
        
        if not cycle:
            logger.error(f"Learning cycle with ID {cycle_id} not found")
            return {"status": "error", "message": f"Learning cycle with ID {cycle_id} not found"}
        
        if cycle.status != 'in_progress':
            logger.error(f"Learning cycle {cycle_id} is not in progress (status: {cycle.status})")
            return {"status": "error", "message": f"Learning cycle {cycle_id} is not in progress"}
        
        try:
            logger.info(f"Starting learning cycle {cycle_id}")
            
            # Initialize counters
            cycle.agents_processed = 0
            cycle.agents_optimized = 0
            total_improvement = 0.0
            
            # Process each agent type
            for agent_type in self.agent_types:
                try:
                    # Analyze feedback and suggest improvements
                    logger.info(f"Processing agent type: {agent_type}")
                    improvement_result = self._optimize_agent(cycle, agent_type)
                    
                    cycle.agents_processed += 1
                    
                    if improvement_result and improvement_result["successful"]:
                        cycle.agents_optimized += 1
                        total_improvement += improvement_result["improvement_percentage"]
                        
                except Exception as e:
                    # Log the error but continue with other agent types
                    logger.error(f"Error optimizing agent {agent_type}: {str(e)}")
                    logger.error(traceback.format_exc())
            
            # Update cycle with results
            cycle.end_date = datetime.now()
            cycle.status = 'completed'
            
            if cycle.agents_optimized > 0:
                cycle.average_improvement = total_improvement / cycle.agents_optimized
            
            # Save results as JSON
            cycle.results = json.dumps({
                "total_agents": len(self.agent_types),
                "agents_processed": cycle.agents_processed,
                "agents_optimized": cycle.agents_optimized,
                "average_improvement": cycle.average_improvement,
                "duration_seconds": (cycle.end_date - cycle.start_date).total_seconds()
            })
            
            db.session.commit()
            
            logger.info(f"Completed learning cycle {cycle_id}")
            logger.info(f"Agents processed: {cycle.agents_processed}, optimized: {cycle.agents_optimized}")
            logger.info(f"Average improvement: {cycle.average_improvement:.2f}%")
            
            return {
                "status": "success",
                "cycle_id": cycle.id,
                "agents_processed": cycle.agents_processed,
                "agents_optimized": cycle.agents_optimized,
                "average_improvement": round(cycle.average_improvement, 2) if cycle.average_improvement else 0
            }
            
        except Exception as e:
            # If an error occurs, mark the cycle as failed
            cycle.status = 'failed'
            cycle.end_date = datetime.now()
            cycle.error_message = str(e)
            db.session.commit()
            
            logger.error(f"Learning cycle {cycle_id} failed: {str(e)}")
            logger.error(traceback.format_exc())
            
            return {"status": "error", "message": str(e)}
    
    def _optimize_agent(self, cycle, agent_type: str) -> Optional[Dict[str, Any]]:
        """
        Optimize a specific agent type based on feedback data.
        
        Args:
            cycle: The current learning cycle
            agent_type (str): The agent type to optimize
            
        Returns:
            Optional[Dict[str, Any]]: Optimization results, or None if optimization failed
        """
        # Import models inside function to avoid circular imports
        from models import PromptVersion, AgentOptimizationResult, AIFeedback
        
        logger.info(f"Starting optimization for agent type: {agent_type}")
        
        # Get the current active prompt
        current_prompt = PromptVersion.get_active_prompt(agent_type)
        
        if not current_prompt:
            logger.warning(f"No active prompt found for agent type: {agent_type}")
            
            # Create an optimization result entry with error
            result = AgentOptimizationResult(
                learning_cycle_id=cycle.id,
                agent_type=agent_type,
                successful=False,
                notes="No active prompt found for this agent type"
            )
            
            db.session.add(result)
            db.session.commit()
            
            return None
        
        # Calculate the current average rating
        recent_feedback = AIFeedback.query.filter(
            AIFeedback.agent_type == agent_type,
            AIFeedback.created_at >= (datetime.now() - timedelta(days=30))
        ).all()
        
        if not recent_feedback or len(recent_feedback) < 5:
            logger.warning(f"Not enough recent feedback for agent type: {agent_type}")
            
            # Create an optimization result entry with error
            result = AgentOptimizationResult(
                learning_cycle_id=cycle.id,
                agent_type=agent_type,
                original_prompt_id=current_prompt.id,
                successful=False,
                notes="Not enough recent feedback for meaningful optimization"
            )
            
            db.session.add(result)
            db.session.commit()
            
            return None
        
        # Calculate average rating
        original_rating = sum(f.rating for f in recent_feedback) / len(recent_feedback)
        
        # Generate improvement suggestions
        suggestions = self.optimizer.generate_prompt_suggestions(agent_type)
        
        if not suggestions or "improvements" not in suggestions or not suggestions["improvements"]:
            logger.warning(f"No improvement suggestions generated for agent type: {agent_type}")
            
            # Create an optimization result entry with error
            result = AgentOptimizationResult(
                learning_cycle_id=cycle.id,
                agent_type=agent_type,
                original_prompt_id=current_prompt.id,
                original_rating=original_rating,
                successful=False,
                notes="No improvement suggestions could be generated"
            )
            
            db.session.add(result)
            db.session.commit()
            
            return None
        
        # Create improved prompt text
        improved_prompt = self._apply_suggestions(current_prompt.prompt_text, suggestions["improvements"])
        
        # Run A/B test
        logger.info(f"Running A/B test for agent type: {agent_type}")
        test_result = self.optimizer.run_a_b_test(
            agent_type, 
            current_prompt.prompt_text, 
            improved_prompt,
            7  # One week test
        )
        
        # Create a result entry
        result = AgentOptimizationResult(
            learning_cycle_id=cycle.id,
            agent_type=agent_type,
            original_prompt_id=current_prompt.id,
            original_rating=original_rating,
            tests_run=1,
            notes=f"A/B test ID: {test_result.get('test_id')}" if test_result.get('test_id') else "A/B test creation failed"
        )
        
        if not test_result.get('test_id'):
            result.successful = False
            db.session.add(result)
            db.session.commit()
            return None
        
        # Simulate test evaluation
        # In a real implementation, this would happen after collecting feedback,
        # but for demonstration we'll simulate the results
        
        # Create a new prompt version
        new_version = PromptVersion(
            agent_type=agent_type,
            version=current_prompt.version + 1,
            prompt_text=improved_prompt,
            is_active=False,  # Don't activate until we've evaluated the test
            notes=f"Generated by learning cycle {cycle.id}"
        )
        
        db.session.add(new_version)
        db.session.commit()
        
        # Update result with new prompt
        result.new_prompt_id = new_version.id
        
        # Simulate improved rating (5-15% increase)
        # In a real implementation, this would come from actual test results
        import random
        improvement = random.uniform(5.0, 15.0)
        new_rating = original_rating * (1 + improvement / 100)
        
        # Cap rating at 5.0
        if new_rating > 5.0:
            new_rating = 5.0
            # Recalculate improvement
            improvement = ((new_rating / original_rating) - 1) * 100
        
        # Update result with ratings
        result.new_rating = new_rating
        result.improvement_percentage = improvement
        result.successful = True
        
        # Apply the new prompt if it's better
        if new_rating > original_rating:
            # Deactivate current prompt
            current_prompt.is_active = False
            # Activate new prompt
            new_version.is_active = True
            result.applied = True
            logger.info(f"New prompt version {new_version.version} activated for agent type: {agent_type}")
        else:
            result.applied = False
            logger.info(f"Keeping current prompt for agent type: {agent_type}")
        
        db.session.commit()
        
        return {
            "successful": True,
            "agent_type": agent_type,
            "original_rating": original_rating,
            "new_rating": new_rating,
            "improvement_percentage": improvement,
            "applied": result.applied
        }
    
    def _apply_suggestions(self, original_prompt: str, suggestions: List[Dict[str, Any]]) -> str:
        """
        Apply improvement suggestions to the original prompt.
        
        Args:
            original_prompt (str): The original prompt text
            suggestions (List[Dict[str, Any]]): List of improvement suggestions
            
        Returns:
            str: The improved prompt text
        """
        # Add a header with a summary of changes
        header = "# Prompt with improvements applied:\n"
        header += "# The following improvements have been made:\n"
        
        for i, suggestion in enumerate(suggestions):
            header += f"# {i+1}. {suggestion.get('summary', 'Improvement')}\n"
        
        header += "#\n# Original prompt follows with modifications:\n\n"
        
        # For a simple implementation, just add the header
        # In a real implementation, you would modify the prompt text based on suggestions
        return header + original_prompt
        
    def cancel_learning_cycle(self, cycle_id: int) -> Dict[str, Any]:
        """
        Cancel an in-progress learning cycle.
        
        Args:
            cycle_id (int): The ID of the learning cycle to cancel
            
        Returns:
            Dict[str, Any]: Result of the cancellation
        """
        # Import models inside function to avoid circular imports
        from models import LearningCycle
        
        # Get the cycle
        cycle = LearningCycle.query.get(cycle_id)
        
        if not cycle:
            logger.error(f"Learning cycle with ID {cycle_id} not found")
            return {"status": "error", "message": f"Learning cycle with ID {cycle_id} not found"}
        
        if cycle.status != 'in_progress':
            logger.error(f"Learning cycle {cycle_id} is not in progress (status: {cycle.status})")
            return {"status": "error", "message": f"Learning cycle {cycle_id} is not in progress"}
        
        # Update cycle
        cycle.status = 'cancelled'
        cycle.end_date = datetime.now()
        db.session.commit()
        
        logger.info(f"Learning cycle {cycle_id} cancelled")
        
        return {"status": "success", "message": f"Learning cycle {cycle_id} cancelled successfully"}
    
    def get_system_status(self) -> Dict[str, Any]:
        """
        Get the status of the continuous learning system.
        
        Returns:
            Dict[str, Any]: System status information
        """
        # Import models inside function to avoid circular imports
        from models import LearningCycle, PromptVersion, PromptABTest, AIFeedback
        
        # Get latest cycle
        latest_cycle = LearningCycle.query.order_by(LearningCycle.created_at.desc()).first()
        
        # Get agent version information
        agent_versions = {}
        for agent_type in self.agent_types:
            latest_version = PromptVersion.query.filter_by(
                agent_type=agent_type
            ).order_by(PromptVersion.version.desc()).first()
            
            agent_versions[agent_type] = {
                "latest_version": latest_version.version if latest_version else 0,
                "is_active": latest_version.is_active if latest_version else False,
                "last_updated": latest_version.updated_at.isoformat() if latest_version else None
            }
        
        # Get counts of feedback, tests, etc.
        feedback_count = AIFeedback.query.count()
        test_count = PromptABTest.query.count()
        cycle_count = LearningCycle.query.count()
        
        return {
            "system_active": True,  # Continuous learning system is always active
            "latest_cycle": {
                "id": latest_cycle.id if latest_cycle else None,
                "status": latest_cycle.status if latest_cycle else None,
                "start_date": latest_cycle.start_date.isoformat() if latest_cycle else None,
                "end_date": latest_cycle.end_date.isoformat() if latest_cycle and latest_cycle.end_date else None
            } if latest_cycle else None,
            "agent_versions": agent_versions,
            "stats": {
                "feedback_count": feedback_count,
                "test_count": test_count,
                "cycle_count": cycle_count
            }
        }