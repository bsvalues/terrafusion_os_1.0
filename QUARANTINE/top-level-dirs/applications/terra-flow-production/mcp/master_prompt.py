"""
Master Prompt System

This module implements the Master Prompt system for coordinating all agents in the platform.
A "master prompt" serves as a central set of instructions pushed to every agent in the ecosystem,
establishing common goals, explaining the hierarchical structure, and setting guidelines for
inter-agent communication and self-improvement cycles.

The master prompt system maintains versioning, distribution, and synchronization of prompts
across all agents to ensure cohesive operation.
"""

import json
import time
import logging
import uuid
from typing import Dict, List, Optional, Any
from .agent_protocol import Message, MessageType, MessagePriority, create_command, create_event

logger = logging.getLogger(__name__)

class MasterPrompt:
    """
    Represents a master prompt with version control and metadata
    """
    
    def __init__(self, 
                 prompt_text: str, 
                 version: str = "1.0", 
                 prompt_id: Optional[str] = None,
                 author: str = "system",
                 created_at: Optional[float] = None,
                 description: Optional[str] = None,
                 tags: Optional[List[str]] = None,
                 directives: Optional[Dict[str, Any]] = None):
        """
        Initialize a new master prompt
        
        Args:
            prompt_text: The text of the master prompt
            version: Version string (default: "1.0")
            prompt_id: Optional unique ID (default: auto-generated UUID)
            author: Who created this prompt (default: "system")
            created_at: Timestamp when created (default: current time)
            description: Optional description of the prompt's purpose
            tags: Optional list of tags for categorization
            directives: Optional structured directives as a dictionary
        """
        self.prompt_text = prompt_text
        self.version = version
        self.prompt_id = prompt_id or str(uuid.uuid4())
        self.author = author
        self.created_at = created_at or time.time()
        self.description = description or ""
        self.tags = tags or []
        self.directives = directives or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert the master prompt to a dictionary representation"""
        return {
            "promptId": self.prompt_id,
            "version": self.version,
            "author": self.author,
            "createdAt": self.created_at,
            "promptText": self.prompt_text,
            "description": self.description,
            "tags": self.tags,
            "directives": self.directives
        }
    
    def to_json(self) -> str:
        """Convert the master prompt to a JSON string"""
        return json.dumps(self.to_dict())
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MasterPrompt':
        """Create a MasterPrompt object from a dictionary"""
        return cls(
            prompt_text=data.get("promptText", ""),
            version=data.get("version", "1.0"),
            prompt_id=data.get("promptId"),
            author=data.get("author", "system"),
            created_at=data.get("createdAt"),
            description=data.get("description"),
            tags=data.get("tags"),
            directives=data.get("directives")
        )
    
    @classmethod
    def from_json(cls, json_str: str) -> 'MasterPrompt':
        """Create a MasterPrompt object from a JSON string"""
        try:
            data = json.loads(json_str)
            return cls.from_dict(data)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse master prompt JSON: {e}")
            raise ValueError(f"Invalid master prompt JSON: {e}")

class MasterPromptManager:
    """
    Manages the creation, storage, versioning, and distribution of master prompts
    """
    
    def __init__(self, mcp_instance):
        """Initialize the manager with reference to MCP"""
        self.mcp = mcp_instance
        self.prompts = {}  # Dict of prompt_id -> {version -> MasterPrompt}
        self.active_prompts = {}  # Dict of prompt_id -> active version
        self.agent_registrations = {}  # Dict of agent_id -> set of prompt_ids
        self.logger = logging.getLogger(__name__)
    
    def create_prompt(self, 
                     prompt_text: str, 
                     description: Optional[str] = None,
                     tags: Optional[List[str]] = None,
                     author: str = "system",
                     directives: Optional[Dict[str, Any]] = None) -> MasterPrompt:
        """
        Create a new master prompt
        
        Args:
            prompt_text: The text of the master prompt
            description: Optional description of the prompt's purpose
            tags: Optional list of tags for categorization
            author: Who created this prompt
            directives: Optional structured directives as a dictionary
            
        Returns:
            The created MasterPrompt object
        """
        prompt = MasterPrompt(
            prompt_text=prompt_text,
            description=description,
            tags=tags,
            author=author,
            directives=directives
        )
        
        # Store the new prompt
        if prompt.prompt_id not in self.prompts:
            self.prompts[prompt.prompt_id] = {}
        
        self.prompts[prompt.prompt_id][prompt.version] = prompt
        
        # Set as active version for this prompt_id
        self.active_prompts[prompt.prompt_id] = prompt.version
        
        self.logger.info(f"Created new master prompt {prompt.prompt_id} v{prompt.version}")
        return prompt
    
    def update_prompt(self, 
                     prompt_id: str, 
                     prompt_text: str, 
                     description: Optional[str] = None,
                     tags: Optional[List[str]] = None,
                     author: str = "system",
                     directives: Optional[Dict[str, Any]] = None) -> MasterPrompt:
        """
        Update an existing master prompt by creating a new version
        
        Args:
            prompt_id: ID of the prompt to update
            prompt_text: New text for the master prompt
            description: Optional new description
            tags: Optional new tags
            author: Who updated this prompt
            directives: Optional new structured directives
            
        Returns:
            The updated MasterPrompt object
        """
        if prompt_id not in self.prompts:
            raise ValueError(f"Prompt {prompt_id} does not exist")
        
        # Determine the latest version
        versions = list(self.prompts[prompt_id].keys())
        latest_version = max(versions, key=lambda v: [int(x) for x in v.split('.')])
        
        # Increment version number
        major, minor = map(int, latest_version.split('.'))
        new_version = f"{major}.{minor+1}"
        
        # Create new version
        prompt = MasterPrompt(
            prompt_text=prompt_text,
            version=new_version,
            prompt_id=prompt_id,
            author=author,
            description=description or self.prompts[prompt_id][latest_version].description,
            tags=tags or self.prompts[prompt_id][latest_version].tags,
            directives=directives or self.prompts[prompt_id][latest_version].directives
        )
        
        # Store the new version
        self.prompts[prompt_id][new_version] = prompt
        
        # Set as active version
        self.active_prompts[prompt_id] = new_version
        
        self.logger.info(f"Updated master prompt {prompt_id} to v{new_version}")
        
        # Notify registered agents about the update
        self._broadcast_prompt_update(prompt)
        
        return prompt
    
    def get_prompt(self, prompt_id: str, version: Optional[str] = None) -> MasterPrompt:
        """
        Get a specific master prompt
        
        Args:
            prompt_id: ID of the prompt to retrieve
            version: Optional specific version (default: active version)
            
        Returns:
            The requested MasterPrompt object
        """
        if prompt_id not in self.prompts:
            raise ValueError(f"Prompt {prompt_id} does not exist")
        
        if version is None:
            # Use active version
            if prompt_id not in self.active_prompts:
                raise ValueError(f"No active version for prompt {prompt_id}")
            version = self.active_prompts[prompt_id]
        
        if version not in self.prompts[prompt_id]:
            raise ValueError(f"Version {version} of prompt {prompt_id} does not exist")
        
        return self.prompts[prompt_id][version]
    
    def set_active_version(self, prompt_id: str, version: str) -> bool:
        """
        Set the active version for a prompt
        
        Args:
            prompt_id: ID of the prompt
            version: Version to set as active
            
        Returns:
            True if successful, False otherwise
        """
        if prompt_id not in self.prompts:
            self.logger.error(f"Cannot set active version: Prompt {prompt_id} does not exist")
            return False
        
        if version not in self.prompts[prompt_id]:
            self.logger.error(f"Cannot set active version: Version {version} of prompt {prompt_id} does not exist")
            return False
        
        self.active_prompts[prompt_id] = version
        self.logger.info(f"Set active version of prompt {prompt_id} to v{version}")
        
        # Notify registered agents about the version change
        prompt = self.prompts[prompt_id][version]
        self._broadcast_prompt_update(prompt)
        
        return True
    
    def register_agent(self, agent_id: str, prompt_id: str) -> bool:
        """
        Register an agent to receive updates for a specific prompt
        
        Args:
            agent_id: ID of the agent to register
            prompt_id: ID of the prompt to subscribe to
            
        Returns:
            True if successful, False otherwise
        """
        if prompt_id not in self.prompts:
            self.logger.error(f"Cannot register agent: Prompt {prompt_id} does not exist")
            return False
        
        if agent_id not in self.agent_registrations:
            self.agent_registrations[agent_id] = set()
        
        self.agent_registrations[agent_id].add(prompt_id)
        self.logger.debug(f"Agent {agent_id} registered for prompt {prompt_id}")
        
        # Send the current prompt to the newly registered agent
        self._send_prompt_to_agent(agent_id, self.get_prompt(prompt_id))
        
        return True
    
    def unregister_agent(self, agent_id: str, prompt_id: Optional[str] = None) -> bool:
        """
        Unregister an agent from receiving updates for a specific prompt or all prompts
        
        Args:
            agent_id: ID of the agent to unregister
            prompt_id: Optional ID of the prompt to unsubscribe from (default: all prompts)
            
        Returns:
            True if successful, False otherwise
        """
        if agent_id not in self.agent_registrations:
            self.logger.error(f"Cannot unregister agent: Agent {agent_id} is not registered for any prompts")
            return False
        
        if prompt_id:
            if prompt_id not in self.agent_registrations[agent_id]:
                self.logger.error(f"Cannot unregister agent: Agent {agent_id} is not registered for prompt {prompt_id}")
                return False
            
            self.agent_registrations[agent_id].remove(prompt_id)
            self.logger.debug(f"Agent {agent_id} unregistered from prompt {prompt_id}")
        else:
            # Unregister from all prompts
            self.agent_registrations[agent_id] = set()
            self.logger.debug(f"Agent {agent_id} unregistered from all prompts")
        
        return True
    
    def _broadcast_prompt_update(self, prompt: MasterPrompt) -> None:
        """
        Broadcast a prompt update to all registered agents
        
        Args:
            prompt: The updated prompt to broadcast
        """
        # Find all agents registered for this prompt
        for agent_id, prompt_ids in self.agent_registrations.items():
            if prompt.prompt_id in prompt_ids:
                self._send_prompt_to_agent(agent_id, prompt)
    
    def _send_prompt_to_agent(self, agent_id: str, prompt: MasterPrompt) -> None:
        """
        Send a prompt to a specific agent
        
        Args:
            agent_id: ID of the agent to send to
            prompt: The prompt to send
        """
        if not hasattr(self.mcp, 'protocol'):
            self.logger.error("Cannot send prompt to agent: MCP does not have a protocol handler")
            return
        
        message = create_command(
            source="master_prompt_manager",
            target=agent_id,
            command_name="update_master_prompt",
            parameters=prompt.to_dict(),
            priority=MessagePriority.HIGH
        )
        
        success = self.mcp.protocol.send_message(message)
        if success:
            self.logger.debug(f"Sent prompt {prompt.prompt_id} v{prompt.version} to agent {agent_id}")
        else:
            self.logger.error(f"Failed to send prompt {prompt.prompt_id} v{prompt.version} to agent {agent_id}")

    def get_default_system_prompt(self) -> MasterPrompt:
        """
        Create or retrieve the default system master prompt
        
        Returns:
            The default system MasterPrompt
        """
        default_prompt_id = "system_default"
        
        # Check if default prompt exists
        if default_prompt_id in self.prompts and self.prompts[default_prompt_id]:
            # Return active version
            version = self.active_prompts.get(default_prompt_id, "1.0")
            return self.prompts[default_prompt_id][version]
        
        # Create default system prompt
        prompt_text = """
        Master Prompt – System Integration and Collaboration Directive

        Attention all agents: As part of our integrated system, each agent is responsible for executing its domain-specific 
        tasks while maintaining communication using our standard JSON messaging format. The Core serves as the master hub, 
        ensuring configuration consistency and orchestrating cross-module activities. The Replit AI Agent is your real-time
        coordinator, while the MCP monitors overall performance and directs task assignments when issues occur.

        Every action you perform must be logged in the shared replay buffer. On completion of every major task, review your 
        performance metrics and, if performance thresholds are not met, issue a 'task_request' for assistance. Furthermore,
        please ensure that you adhere to our established protocols for communication and security. Report any anomalies 
        immediately to the MCP.

        This directive remains effective in both standalone and integrated modes. Adapt and execute tasks based on real-time
        feedback while maintaining alignment with the overall system objectives. Your collaborative efforts drive continuous
        improvement and system optimization.
        """
        
        directives = {
            "log_experiences": True,
            "report_anomalies": True,
            "communication_protocol": "json",
            "performance_threshold": 0.75,
            "self_assessment_frequency": 3600,  # In seconds
            "collaboration_mode": "integrated"
        }
        
        tags = ["system", "default", "collaboration", "integration"]
        
        return self.create_prompt(
            prompt_text=prompt_text,
            description="Default system master prompt for all agents",
            tags=tags,
            author="system",
            directives=directives
        )