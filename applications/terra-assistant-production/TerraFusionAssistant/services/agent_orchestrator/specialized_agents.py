"""
Specialized Agents

This module implements specialized agents for various code analysis tasks.
"""

import os
import uuid
import logging
import time
import json
from typing import Dict, List, Any, Optional, Union, Set, Tuple

from services.agent_orchestrator.agent import Agent, AgentCapability
from services.agent_orchestrator.task import Task, TaskStatus, TaskPriority
from services.ai_models.ai_service import AIService

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CodeAnalysisAgent(Agent):
    """
    Agent for general code analysis tasks.
    
    This agent analyzes code structure, quality, and patterns
    using AI services to provide insights and recommendations.
    """
    
    def __init__(
        self,
        name: str = "CodeAnalysisAgent",
        description: str = "Analyzes code quality, structure, and patterns",
        capabilities: Optional[List[Union[AgentCapability, str]]] = None,
        max_concurrent_tasks: int = 2,
        agent_id: Optional[str] = None,
        ai_service: Optional[AIService] = None
    ):
        """
        Initialize the code analysis agent.
        
        Args:
            name: Agent name
            description: Agent description
            capabilities: Optional list of capabilities (will be set to default capabilities if not provided)
            max_concurrent_tasks: Maximum number of concurrent tasks
            agent_id: Optional agent ID (generated if not provided)
            ai_service: Optional AI service for code analysis
        """
        # Set default capabilities if none provided
        if capabilities is None:
            capabilities = [
                AgentCapability.CODE_ANALYSIS,
                AgentCapability.CODE_COMPLEXITY,
                AgentCapability.DOCUMENTATION_ANALYSIS
            ]
            
        super().__init__(
            name=name,
            description=description,
            capabilities=capabilities,
            max_concurrent_tasks=max_concurrent_tasks,
            agent_id=agent_id
        )
        
        # Initialize AI service
        self.ai_service = ai_service or AIService()
    
    def process_task(self, task: Task) -> Dict[str, Any]:
        """
        Process a code analysis task.
        
        Args:
            task: Task to process
            
        Returns:
            Dictionary containing analysis results
        """
        task_data = task.data
        
        # Extract task parameters
        code = task_data.get('code', '')
        language = task_data.get('language')
        analysis_type = task_data.get('analysis_type', 'review')
        file_path = task_data.get('file_path')
        
        # Log task information
        logger.info(f"Processing {analysis_type} task for {'file: ' + file_path if file_path else 'code snippet'}")
        
        # Read code from file if provided
        if not code and file_path:
            try:
                with open(file_path, 'r') as f:
                    code = f.read()
            except Exception as e:
                return {
                    'error': f"Error reading file: {str(e)}",
                    'status': 'failed'
                }
        
        # Check if code is provided
        if not code:
            return {
                'error': 'No code provided',
                'status': 'failed'
            }
        
        # Analyze code using AI service
        try:
            analysis_result = self.ai_service.analyze_code(
                code=code,
                analysis_type=analysis_type,
                language=language
            )
            
            # Extract the relevant parts from the AI service response
            if 'error' in analysis_result:
                return {
                    'error': analysis_result['error'],
                    'status': 'failed'
                }
            
            # Process and return the analysis results
            result = {
                'status': 'success',
                'language': language,
                'analysis_type': analysis_type,
                'results': analysis_result.get('data') or analysis_result.get('text', {}),
                'metadata': {
                    'model': analysis_result.get('model'),
                    'file_path': file_path,
                    'timestamp': time.time()
                }
            }
            
            return result
        
        except Exception as e:
            logger.error(f"Error analyzing code: {str(e)}")
            return {
                'error': f"Error analyzing code: {str(e)}",
                'status': 'failed'
            }

class SecurityAnalysisAgent(Agent):
    """
    Agent for security analysis of code repositories.
    
    This agent identifies security vulnerabilities, potential attack vectors,
    and recommends security best practices.
    """
    
    def __init__(
        self,
        name: str = "SecurityAnalysisAgent",
        description: str = "Identifies security vulnerabilities and recommends mitigations",
        capabilities: Optional[List[Union[AgentCapability, str]]] = None,
        max_concurrent_tasks: int = 2,
        agent_id: Optional[str] = None,
        ai_service: Optional[AIService] = None
    ):
        """
        Initialize the security analysis agent.
        
        Args:
            name: Agent name
            description: Agent description
            capabilities: Optional list of capabilities (will be set to default capabilities if not provided)
            max_concurrent_tasks: Maximum number of concurrent tasks
            agent_id: Optional agent ID (generated if not provided)
            ai_service: Optional AI service for security analysis
        """
        # Set default capabilities if none provided
        if capabilities is None:
            capabilities = [
                AgentCapability.SECURITY_REVIEW,
                AgentCapability.CODE_ANALYSIS
            ]
            
        super().__init__(
            name=name,
            description=description,
            capabilities=capabilities,
            max_concurrent_tasks=max_concurrent_tasks,
            agent_id=agent_id
        )
        
        # Initialize AI service
        self.ai_service = ai_service or AIService()
    
    def process_task(self, task: Task) -> Dict[str, Any]:
        """
        Process a security analysis task.
        
        Args:
            task: Task to process
            
        Returns:
            Dictionary containing security analysis results
        """
        task_data = task.data
        
        # Extract task parameters
        code = task_data.get('code', '')
        language = task_data.get('language')
        file_path = task_data.get('file_path')
        scan_type = task_data.get('scan_type', 'comprehensive')
        
        # Log task information
        logger.info(f"Processing security analysis task for {'file: ' + file_path if file_path else 'code snippet'}")
        
        # Read code from file if provided
        if not code and file_path:
            try:
                with open(file_path, 'r') as f:
                    code = f.read()
            except Exception as e:
                return {
                    'error': f"Error reading file: {str(e)}",
                    'status': 'failed'
                }
        
        # Check if code is provided
        if not code:
            return {
                'error': 'No code provided',
                'status': 'failed'
            }
        
        # Analyze code security using AI service
        try:
            analysis_result = self.ai_service.analyze_code(
                code=code,
                analysis_type='security',
                language=language
            )
            
            # Extract the relevant parts from the AI service response
            if 'error' in analysis_result:
                return {
                    'error': analysis_result['error'],
                    'status': 'failed'
                }
            
            # Process and return the security analysis results
            result = {
                'status': 'success',
                'language': language,
                'scan_type': scan_type,
                'security_analysis': analysis_result.get('data') or analysis_result.get('text', {}),
                'metadata': {
                    'model': analysis_result.get('model'),
                    'file_path': file_path,
                    'timestamp': time.time()
                }
            }
            
            return result
        
        except Exception as e:
            logger.error(f"Error analyzing code security: {str(e)}")
            return {
                'error': f"Error analyzing code security: {str(e)}",
                'status': 'failed'
            }

class ArchitectureAnalysisAgent(Agent):
    """
    Agent for analyzing software architecture.
    
    This agent analyzes the overall architecture of a codebase,
    identifies design patterns, and provides architectural recommendations.
    """
    
    def __init__(
        self,
        name: str = "ArchitectureAnalysisAgent",
        description: str = "Analyzes software architecture and design patterns",
        capabilities: Optional[List[Union[AgentCapability, str]]] = None,
        max_concurrent_tasks: int = 1,
        agent_id: Optional[str] = None,
        ai_service: Optional[AIService] = None
    ):
        """
        Initialize the architecture analysis agent.
        
        Args:
            name: Agent name
            description: Agent description
            capabilities: Optional list of capabilities (will be set to default capabilities if not provided)
            max_concurrent_tasks: Maximum number of concurrent tasks
            agent_id: Optional agent ID (generated if not provided)
            ai_service: Optional AI service for architecture analysis
        """
        # Set default capabilities if none provided
        if capabilities is None:
            capabilities = [
                AgentCapability.ARCHITECTURE_REVIEW,
                AgentCapability.DEPENDENCY_ANALYSIS
            ]
            
        super().__init__(
            name=name,
            description=description,
            capabilities=capabilities,
            max_concurrent_tasks=max_concurrent_tasks,
            agent_id=agent_id
        )
        
        # Initialize AI service
        self.ai_service = ai_service or AIService()
    
    def process_task(self, task: Task) -> Dict[str, Any]:
        """
        Process an architecture analysis task.
        
        Args:
            task: Task to process
            
        Returns:
            Dictionary containing architecture analysis results
        """
        task_data = task.data
        
        # Extract task parameters
        repo_path = task_data.get('repo_path')
        framework = task_data.get('framework')
        languages = task_data.get('languages', [])
        
        if not repo_path or not os.path.exists(repo_path):
            return {
                'error': f"Repository path not found: {repo_path}",
                'status': 'failed'
            }
        
        # Log task information
        logger.info(f"Processing architecture analysis task for repository: {repo_path}")
        
        # Analyze architecture
        try:
            # In a real implementation, this would involve:
            # 1. Scanning the repository to identify key files and modules
            # 2. Building a dependency graph
            # 3. Identifying architectural patterns
            # 4. Using AI to analyze and recommend improvements
            
            # For now, we'll simulate this with a basic analysis
            # by examining the directory structure
            
            directory_structure = self._analyze_directory_structure(repo_path)
            
            # Use AI to analyze the architecture based on directory structure
            architecture_prompt = f"""
            Analyze the software architecture of this repository based on its directory structure:
            
            {json.dumps(directory_structure, indent=2)}
            
            Languages: {', '.join(languages) if languages else 'Unknown'}
            Framework: {framework or 'Unknown'}
            
            Provide an analysis of:
            1. The overall architectural pattern (e.g., MVC, layered, microservices)
            2. Key components and their responsibilities
            3. Component dependencies and relationships
            4. Architectural strengths and weaknesses
            5. Recommendations for improvement
            
            Format your response as a JSON object with these sections.
            """
            
            ai_result = self.ai_service.generate_structured_output(
                prompt=architecture_prompt,
                output_schema={
                    "architectural_pattern": "string",
                    "components": [{"name": "string", "responsibility": "string"}],
                    "dependencies": [{"from": "string", "to": "string", "type": "string"}],
                    "strengths": ["string"],
                    "weaknesses": ["string"],
                    "recommendations": ["string"]
                }
            )
            
            # Process AI results
            if 'error' in ai_result:
                return {
                    'error': ai_result['error'],
                    'status': 'failed'
                }
            
            architecture_analysis = ai_result.get('data') or {}
            
            # Return the analysis results
            return {
                'status': 'success',
                'directory_structure': directory_structure,
                'architecture_analysis': architecture_analysis,
                'metadata': {
                    'repo_path': repo_path,
                    'languages': languages,
                    'framework': framework,
                    'timestamp': time.time()
                }
            }
        
        except Exception as e:
            logger.error(f"Error analyzing architecture: {str(e)}")
            return {
                'error': f"Error analyzing architecture: {str(e)}",
                'status': 'failed'
            }
    
    def _analyze_directory_structure(self, repo_path: str, max_depth: int = 3) -> Dict[str, Any]:
        """
        Analyze the directory structure of a repository.
        
        Args:
            repo_path: Path to the repository
            max_depth: Maximum directory depth to analyze
            
        Returns:
            Dictionary representing the directory structure
        """
        result = {}
        
        def _analyze_dir(path: str, current_depth: int = 0) -> Dict[str, Any]:
            if current_depth > max_depth:
                return {"truncated": True}
            
            dir_result = {}
            try:
                for item in os.listdir(path):
                    # Skip hidden files and directories
                    if item.startswith('.'):
                        continue
                    
                    item_path = os.path.join(path, item)
                    
                    if os.path.isdir(item_path):
                        dir_result[item] = _analyze_dir(item_path, current_depth + 1)
                    else:
                        if current_depth < max_depth: 
                            dir_result[item] = "file"
            except Exception as e:
                logger.error(f"Error analyzing directory {path}: {str(e)}")
                dir_result["error"] = str(e)
            
            return dir_result
        
        try:
            result = _analyze_dir(repo_path)
        except Exception as e:
            logger.error(f"Error analyzing repo structure: {str(e)}")
            result["error"] = str(e)
        
        return result

class DatabaseAnalysisAgent(Agent):
    """
    Agent for analyzing database schemas and usage in code.
    
    This agent analyzes database schemas, relationships, and how
    the application interacts with the database.
    """
    
    def __init__(
        self,
        name: str = "DatabaseAnalysisAgent",
        description: str = "Analyzes database schemas and database usage patterns",
        capabilities: Optional[List[Union[AgentCapability, str]]] = None,
        max_concurrent_tasks: int = 2,
        agent_id: Optional[str] = None,
        ai_service: Optional[AIService] = None
    ):
        """
        Initialize the database analysis agent.
        
        Args:
            name: Agent name
            description: Agent description
            capabilities: Optional list of capabilities (will be set to default capabilities if not provided)
            max_concurrent_tasks: Maximum number of concurrent tasks
            agent_id: Optional agent ID (generated if not provided)
            ai_service: Optional AI service for database analysis
        """
        # Set default capabilities if none provided
        if capabilities is None:
            capabilities = [
                AgentCapability.DATABASE_ANALYSIS,
                AgentCapability.CODE_ANALYSIS
            ]
            
        super().__init__(
            name=name,
            description=description,
            capabilities=capabilities,
            max_concurrent_tasks=max_concurrent_tasks,
            agent_id=agent_id
        )
        
        # Initialize AI service
        self.ai_service = ai_service or AIService()
    
    def process_task(self, task: Task) -> Dict[str, Any]:
        """
        Process a database analysis task.
        
        Args:
            task: Task to process
            
        Returns:
            Dictionary containing database analysis results
        """
        task_data = task.data
        
        # Extract task parameters
        schema_files = task_data.get('schema_files', [])
        db_type = task_data.get('db_type', 'unknown')
        orm_files = task_data.get('orm_files', [])
        
        # Log task information
        logger.info(f"Processing database analysis task for database type: {db_type}")
        
        # Check if schema files are provided
        if not schema_files and not orm_files:
            return {
                'error': 'No schema files or ORM files provided',
                'status': 'failed'
            }
        
        try:
            # Read schema files
            schema_contents = {}
            for file_path in schema_files:
                try:
                    with open(file_path, 'r') as f:
                        schema_contents[file_path] = f.read()
                except Exception as e:
                    logger.warning(f"Error reading schema file {file_path}: {str(e)}")
            
            # Read ORM files
            orm_contents = {}
            for file_path in orm_files:
                try:
                    with open(file_path, 'r') as f:
                        orm_contents[file_path] = f.read()
                except Exception as e:
                    logger.warning(f"Error reading ORM file {file_path}: {str(e)}")
            
            # If no files could be read, return error
            if not schema_contents and not orm_contents:
                return {
                    'error': 'Could not read any schema or ORM files',
                    'status': 'failed'
                }
            
            # Combine schema and ORM content for analysis
            combined_content = ""
            for file_path, content in schema_contents.items():
                combined_content += f"-- Schema file: {file_path}\n{content}\n\n"
            
            for file_path, content in orm_contents.items():
                combined_content += f"-- ORM file: {file_path}\n{content}\n\n"
            
            # Use AI to analyze the database schema
            db_analysis_prompt = f"""
            Analyze the following database schema and ORM definitions:
            
            {combined_content}
            
            Database type: {db_type}
            
            Provide an analysis of:
            1. Tables and their relationships
            2. Primary and foreign keys
            3. Indexes and constraints
            4. Potential performance issues
            5. Recommendations for improvement
            
            Format your response as a JSON object with these sections.
            """
            
            ai_result = self.ai_service.generate_structured_output(
                prompt=db_analysis_prompt,
                output_schema={
                    "tables": [{"name": "string", "description": "string", "columns": [{"name": "string", "type": "string", "description": "string"}]}],
                    "relationships": [{"from_table": "string", "to_table": "string", "type": "string", "description": "string"}],
                    "performance_considerations": ["string"],
                    "recommendations": ["string"]
                }
            )
            
            # Process AI results
            if 'error' in ai_result:
                return {
                    'error': ai_result['error'],
                    'status': 'failed'
                }
            
            db_analysis = ai_result.get('data') or {}
            
            # Return the analysis results
            return {
                'status': 'success',
                'db_type': db_type,
                'schema_files': list(schema_contents.keys()),
                'orm_files': list(orm_contents.keys()),
                'database_analysis': db_analysis,
                'metadata': {
                    'model': ai_result.get('model'),
                    'timestamp': time.time()
                }
            }
        
        except Exception as e:
            logger.error(f"Error analyzing database: {str(e)}")
            return {
                'error': f"Error analyzing database: {str(e)}",
                'status': 'failed'
            }