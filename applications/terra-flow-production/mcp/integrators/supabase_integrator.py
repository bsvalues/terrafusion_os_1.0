"""
Supabase Integrator Module

This module integrates the Supabase agent with the MCP system, handling
registration and communication between the Supabase agent and other components.
"""

import logging
from typing import Dict, Any, Optional, Union, Tuple, List

from mcp.agents.supabase_agent import SupabaseAgent

# Setup logging
logging.basicConfig(level=logging.INFO,
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Global reference to the agent (used by register function)
_supabase_agent = None
_supabase_integrator = None

def register_supabase_agent() -> bool:
    """
    Register the Supabase agent with the MCP system
    
    Returns:
        True if registration was successful, False otherwise
    """
    global _supabase_agent, _supabase_integrator
    
    try:
        # Create the integrator if it doesn't exist
        if not _supabase_integrator:
            _supabase_integrator = SupabaseIntegrator()
        
        # Get the agent reference
        _supabase_agent = _supabase_integrator.get_agent()
        
        return _supabase_agent is not None
    except Exception as e:
        logger.error(f"Failed to register Supabase agent: {str(e)}")
        return False

class SupabaseIntegrator:
    """
    Integrator for the Supabase agent
    
    Handles registration and communication between the Supabase agent and other components.
    """
    
    def __init__(self, mcp_instance=None):
        """Initialize the Supabase integrator"""
        self.mcp = mcp_instance
        self.agent = None
        self.agent_id = None
        
        # Try to initialize the agent
        self._initialize_agent()
    
    def _initialize_agent(self) -> None:
        """Initialize the Supabase agent"""
        try:
            # Create the agent
            self.agent = SupabaseAgent()
            self.agent_id = self.agent.agent_id
            
            # Register with MCP if available
            if self.mcp:
                self.mcp.register_agent(self.agent)
                logger.info(f"Registered Supabase agent with ID: {self.agent_id}")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase agent: {str(e)}")
    
    def get_agent(self) -> Optional[SupabaseAgent]:
        """Get the Supabase agent instance"""
        return self.agent
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a task through the Supabase agent
        
        Args:
            task_data: Dictionary containing task parameters
            
        Returns:
            Dictionary with task results
        """
        if not self.agent:
            return {
                "success": False,
                "error": "Supabase agent not initialized"
            }
        
        return self.agent.process_task(task_data)
    
    def execute_query(self, table: str, select: str = "*", filters: Dict[str, Any] = None, 
                     order: str = None, limit: int = None) -> Dict[str, Any]:
        """
        Execute a database query
        
        Args:
            table: Table to query
            select: Fields to select
            filters: Query filters
            order: Order by clause
            limit: Result limit
            
        Returns:
            Query results
        """
        return self.process_task({
            "task_type": "supabase.database.query",
            "parameters": {
                "table": table,
                "select": select,
                "filters": filters or {},
                "order": order,
                "limit": limit
            }
        })
    
    def upload_file(self, file_path: str, bucket: str, storage_path: str = None,
                  content_type: str = None) -> Dict[str, Any]:
        """
        Upload a file to storage
        
        Args:
            file_path: Path to file
            bucket: Target bucket
            storage_path: Path in storage
            content_type: Content type
            
        Returns:
            Upload results
        """
        return self.process_task({
            "task_type": "supabase.storage.upload",
            "parameters": {
                "file_path": file_path,
                "bucket": bucket,
                "storage_path": storage_path,
                "content_type": content_type
            }
        })
    
    def list_files(self, bucket: str, path: str = "") -> Dict[str, Any]:
        """
        List files in storage
        
        Args:
            bucket: Bucket to list
            path: Path prefix
            
        Returns:
            List results
        """
        return self.process_task({
            "task_type": "supabase.storage.list",
            "parameters": {
                "bucket": bucket,
                "path": path
            }
        })
    
    def check_status(self) -> Dict[str, Any]:
        """
        Check Supabase service status
        
        Returns:
            Status check results
        """
        return self.process_task({
            "task_type": "supabase.status.check",
            "parameters": {}
        })