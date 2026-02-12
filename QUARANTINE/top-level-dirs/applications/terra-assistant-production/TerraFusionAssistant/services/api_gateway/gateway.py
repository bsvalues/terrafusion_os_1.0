"""
API Gateway

This module implements an API Gateway that provides a unified interface for all microservices
in the Code Deep Dive Analyzer platform, handling routing, authentication, and service discovery.
"""
import os
import json
import logging
import time
import uuid
import threading
from enum import Enum
from typing import Dict, List, Any, Optional, Union, Tuple, Set, Callable

class ServiceType(Enum):
    """Types of services in the system."""
    REPOSITORY = "repository"
    MODEL_HUB = "model_hub"
    NEURO_SYMBOLIC = "neuro_symbolic"
    MULTIMODAL = "multimodal"
    AGENT_ORCHESTRATOR = "agent_orchestrator"
    SDK = "sdk"
    KNOWLEDGE_GRAPH = "knowledge_graph"
    ACADEMIC = "academic"
    CUSTOM = "custom"


class ServiceStatus(Enum):
    """Status of a service in the system."""
    ONLINE = "online"
    OFFLINE = "offline"
    DEGRADED = "degraded"


class EndpointMethod(Enum):
    """HTTP methods supported by endpoints."""
    GET = "GET"
    POST = "POST"
    PUT = "PUT"
    DELETE = "DELETE"
    PATCH = "PATCH"


class AuthLevel(Enum):
    """Authentication levels for endpoints."""
    NONE = "none"
    USER = "user"
    ADMIN = "admin"
    SERVICE = "service"


class ServiceInfo:
    """
    Information about a service in the system.
    """
    
    def __init__(self, service_id: str, service_type: ServiceType, name: str,
               base_url: str, version: str, endpoints: List[Dict[str, Any]],
               health_endpoint: Optional[str] = None,
               metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize service information.
        
        Args:
            service_id: Unique identifier for the service
            service_type: Type of service
            name: Human-readable name
            base_url: Base URL for service API
            version: Service version
            endpoints: List of service endpoints
            health_endpoint: Optional health check endpoint
            metadata: Optional service metadata
        """
        self.id = service_id
        self.service_type = service_type
        self.name = name
        self.base_url = base_url
        self.version = version
        self.endpoints = endpoints
        self.health_endpoint = health_endpoint
        self.metadata = metadata or {}
        self.status = ServiceStatus.OFFLINE
        self.last_health_check = 0.0
        self.error = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert service info to a dictionary."""
        return {
            'id': self.id,
            'service_type': self.service_type.value,
            'name': self.name,
            'base_url': self.base_url,
            'version': self.version,
            'endpoints': self.endpoints,
            'health_endpoint': self.health_endpoint,
            'metadata': self.metadata,
            'status': self.status.value,
            'last_health_check': self.last_health_check,
            'error': self.error
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ServiceInfo':
        """
        Create service info from a dictionary.
        
        Args:
            data: Service info data dictionary
        
        Returns:
            ServiceInfo instance
        """
        service_info = cls(
            service_id=data['id'],
            service_type=ServiceType(data['service_type']),
            name=data['name'],
            base_url=data['base_url'],
            version=data['version'],
            endpoints=data['endpoints'],
            health_endpoint=data.get('health_endpoint'),
            metadata=data.get('metadata', {})
        )
        
        if 'status' in data:
            service_info.status = ServiceStatus(data['status'])
        
        service_info.last_health_check = data.get('last_health_check', 0.0)
        service_info.error = data.get('error')
        
        return service_info


class RouteInfo:
    """
    Information about an API route in the gateway.
    """
    
    def __init__(self, route_path: str, method: EndpointMethod,
               target_service: str, target_endpoint: str,
               auth_level: AuthLevel = AuthLevel.NONE,
               cache_ttl: int = 0,
               rate_limit: Optional[int] = None,
               description: Optional[str] = None,
               metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize route information.
        
        Args:
            route_path: Path of the route in the gateway
            method: HTTP method
            target_service: ID of the target service
            target_endpoint: Endpoint path in the target service
            auth_level: Authentication level required
            cache_ttl: Cache time-to-live in seconds (0 = no caching)
            rate_limit: Optional rate limit in requests per minute
            description: Optional route description
            metadata: Optional route metadata
        """
        self.path = route_path
        self.method = method
        self.target_service = target_service
        self.target_endpoint = target_endpoint
        self.auth_level = auth_level
        self.cache_ttl = cache_ttl
        self.rate_limit = rate_limit
        self.description = description
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert route info to a dictionary."""
        return {
            'path': self.path,
            'method': self.method.value,
            'target_service': self.target_service,
            'target_endpoint': self.target_endpoint,
            'auth_level': self.auth_level.value,
            'cache_ttl': self.cache_ttl,
            'rate_limit': self.rate_limit,
            'description': self.description,
            'metadata': self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'RouteInfo':
        """
        Create route info from a dictionary.
        
        Args:
            data: Route info data dictionary
        
        Returns:
            RouteInfo instance
        """
        return cls(
            route_path=data['path'],
            method=EndpointMethod(data['method']),
            target_service=data['target_service'],
            target_endpoint=data['target_endpoint'],
            auth_level=AuthLevel(data.get('auth_level', 'none')),
            cache_ttl=data.get('cache_ttl', 0),
            rate_limit=data.get('rate_limit'),
            description=data.get('description'),
            metadata=data.get('metadata', {})
        )


class ApiGateway:
    """
    API Gateway for the Code Deep Dive Analyzer platform.
    
    This class provides:
    - Service registry and discovery
    - Request routing and forwarding
    - Authentication and authorization
    - Rate limiting and caching
    - Health monitoring
    """
    
    def __init__(self, storage_dir: Optional[str] = None, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the API Gateway.
        
        Args:
            storage_dir: Optional directory for persistent storage
            config: Optional gateway configuration
        """
        # Set up storage directory
        if storage_dir is None:
            storage_dir = os.path.join(os.getcwd(), 'gateway_storage')
        
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        
        # Initialize logger
        self.logger = logging.getLogger('api_gateway')
        
        # Initialize service registry
        self.services = {}  # service_id -> ServiceInfo
        
        # Initialize routes
        self.routes = {}  # (method, path) -> RouteInfo
        
        # Initialize cache
        self.cache = {}  # (method, path, request_hash) -> (response, timestamp)
        
        # Initialize rate limits
        self.rate_limits = {}  # (client_id, method, path) -> List[timestamp]
        
        # Initialize default configuration
        self.config = {
            'default_timeout': 30,  # seconds
            'enable_caching': True,
            'enable_rate_limiting': True,
            'health_check_interval': 60,  # seconds
            'max_cache_size': 1000,  # entries
            'default_rate_limit': 60,  # requests per minute
            'authentication_enabled': True,
            'cors_enabled': True,
            'logging_level': 'INFO'
        }
        
        # Update with provided configuration
        if config:
            self.config.update(config)
        
        # Initialize threading controls
        self.running = False
        self.health_check_thread = None
        
        # Set up logging level
        logging_level = getattr(logging, self.config['logging_level'], logging.INFO)
        self.logger.setLevel(logging_level)
        
        # Load existing data
        self._load_data()
    
    def _load_data(self) -> None:
        """Load existing data from storage."""
        # Load service registry
        services_dir = os.path.join(self.storage_dir, 'services')
        if os.path.exists(services_dir):
            for filename in os.listdir(services_dir):
                if filename.endswith('.json'):
                    service_id = filename[:-5]  # Remove '.json'
                    service_path = os.path.join(services_dir, filename)
                    
                    try:
                        with open(service_path, 'r') as f:
                            service_data = json.load(f)
                        
                        service_info = ServiceInfo.from_dict(service_data)
                        self.services[service_id] = service_info
                        
                        self.logger.info(f"Loaded service info: {service_info.name} (ID: {service_id})")
                    
                    except Exception as e:
                        self.logger.error(f"Error loading service info from {service_path}: {e}")
        
        # Load routes
        routes_path = os.path.join(self.storage_dir, 'routes.json')
        if os.path.exists(routes_path):
            try:
                with open(routes_path, 'r') as f:
                    routes_data = json.load(f)
                
                for route_data in routes_data:
                    route_info = RouteInfo.from_dict(route_data)
                    self.routes[(route_info.method, route_info.path)] = route_info
                
                self.logger.info(f"Loaded {len(self.routes)} API routes")
            
            except Exception as e:
                self.logger.error(f"Error loading routes from {routes_path}: {e}")
        
        # Load configuration
        config_path = os.path.join(self.storage_dir, 'config.json')
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    stored_config = json.load(f)
                
                self.config.update(stored_config)
                
                self.logger.info("Loaded gateway configuration")
            
            except Exception as e:
                self.logger.error(f"Error loading configuration from {config_path}: {e}")
    
    def _save_service_info(self, service_info: ServiceInfo) -> None:
        """
        Save service info to storage.
        
        Args:
            service_info: Service info to save
        """
        services_dir = os.path.join(self.storage_dir, 'services')
        os.makedirs(services_dir, exist_ok=True)
        
        service_path = os.path.join(services_dir, f"{service_info.id}.json")
        
        with open(service_path, 'w') as f:
            json.dump(service_info.to_dict(), f, indent=2)
    
    def _save_routes(self) -> None:
        """Save routes to storage."""
        routes_path = os.path.join(self.storage_dir, 'routes.json')
        
        routes_data = [route_info.to_dict() for route_info in self.routes.values()]
        
        with open(routes_path, 'w') as f:
            json.dump(routes_data, f, indent=2)
    
    def _save_config(self) -> None:
        """Save configuration to storage."""
        config_path = os.path.join(self.storage_dir, 'config.json')
        
        with open(config_path, 'w') as f:
            json.dump(self.config, f, indent=2)
    
    def start(self) -> None:
        """Start the API Gateway."""
        if self.running:
            return
        
        self.running = True
        
        # Start health check thread
        self.health_check_thread = threading.Thread(target=self._health_check_loop)
        self.health_check_thread.daemon = True
        self.health_check_thread.start()
        
        self.logger.info("Started API Gateway")
    
    def stop(self) -> None:
        """Stop the API Gateway."""
        self.running = False
        
        # Wait for threads to stop
        if self.health_check_thread:
            self.health_check_thread.join(timeout=2.0)
        
        # Save data
        self._save_config()
        self._save_routes()
        
        for service_info in self.services.values():
            self._save_service_info(service_info)
        
        self.logger.info("Stopped API Gateway")
        
    def execute_cross_service_operation(self, operation_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a cross-service operation that may involve multiple services.
        
        Args:
            operation_name: Name of the operation to execute
            parameters: Parameters for the operation
            
        Returns:
            Operation results
        
        Raises:
            ValueError: If the operation is not supported
            RuntimeError: If the operation fails
        """
        self.logger.info(f"Executing cross-service operation: {operation_name}")
        
        # Validate parameters
        if not isinstance(parameters, dict):
            raise ValueError("Parameters must be a dictionary")
        
        # Execute operation based on operation name
        if operation_name == "analyze_repository":
            return self._analyze_repository_operation(parameters)
        elif operation_name == "generate_knowledge_graph":
            return self._generate_knowledge_graph_operation(parameters)
        elif operation_name == "evaluate_models":
            return self._evaluate_models_operation(parameters)
        elif operation_name == "orchestrate_agents":
            return self._orchestrate_agents_operation(parameters)
        elif operation_name == "perform_neuro_symbolic_analysis":
            return self._neuro_symbolic_analysis_operation(parameters)
        elif operation_name == "process_multimodal_data":
            return self._multimodal_processing_operation(parameters)
        elif operation_name == "integrate_academic_research":
            return self._academic_research_operation(parameters)
        elif operation_name == "manage_sdk_plugins":
            return self._sdk_plugins_operation(parameters)
        else:
            raise ValueError(f"Unsupported operation: {operation_name}")
    
    def _analyze_repository_operation(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute repository analysis operation.
        
        Args:
            parameters: Operation parameters
            
        Returns:
            Analysis results
        """
        # Validate required parameters
        if 'repo_url' not in parameters:
            raise ValueError("repo_url is required for repository analysis")
        
        repo_url = parameters['repo_url']
        repo_branch = parameters.get('repo_branch', 'main')
        
        # Use the repository service to clone the repository
        repository_service = None
        try:
            from services.repository_service.repository_manager import RepositoryManager
            repository_service = RepositoryManager()
            self.logger.info(f"Using repository service to clone {repo_url}")
        except ImportError:
            self.logger.warning("Repository service not available")
        
        # Initialize results
        results = {
            'repo_url': repo_url,
            'repo_branch': repo_branch,
            'timestamp': time.time(),
            'file_count': 0,
            'commit_count': 0,
            'branch_count': 0,
            'analysis_results': {}
        }
        
        # If repository service is available, clone and analyze
        if repository_service:
            try:
                # Clone repository
                repo_path = repository_service.clone_repository(repo_url, repo_branch)
                
                # Get repository stats
                stats = repository_service.get_repository_stats(repo_path)
                results.update(stats)
                
                # Analyze code quality
                try:
                    from services.code_analyzer.code_analyzer import CodeAnalyzer
                    code_analyzer = CodeAnalyzer()
                    code_analysis = code_analyzer.analyze_repository(repo_path)
                    results['analysis_results']['code_quality'] = code_analysis
                except ImportError:
                    self.logger.warning("Code analyzer service not available")
                
                # Analyze architecture
                try:
                    from services.agent_orchestrator.specialized_agents import ArchitectureAnalysisAgent
                    architecture_agent = ArchitectureAnalysisAgent("arch_analysis_1")
                    architecture_analysis = architecture_agent.analyze_architecture(repo_path)
                    results['analysis_results']['architecture'] = architecture_analysis
                except ImportError:
                    self.logger.warning("Architecture analysis agent not available")
                
            except Exception as e:
                self.logger.error(f"Error in repository analysis: {str(e)}")
                results['error'] = str(e)
                results['partial_results'] = results.copy()
        else:
            # Simulate analysis for demo purposes
            results = {
                'repo_url': repo_url,
                'repo_branch': repo_branch,
                'timestamp': time.time(),
                'file_count': 120,
                'commit_count': 45,
                'branch_count': 3,
                'analysis_results': {
                    'code_quality': {
                        'quality_score': 0.75,
                        'issues_found': 12,
                        'recommendations': [
                            "Consider refactoring the data processing module",
                            "Add more comprehensive test coverage",
                            "Update dependency versions"
                        ]
                    },
                    'architecture': {
                        'modularity_score': 0.68,
                        'coupling_score': 0.72,
                        'recommendations': [
                            "Extract the authentication logic into a separate service",
                            "Implement proper dependency injection",
                            "Add API versioning"
                        ]
                    }
                }
            }
        
        return results
    
    def _generate_knowledge_graph_operation(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate knowledge graph operation."""
        # This would be implemented similarly to _analyze_repository_operation
        # For now, return a placeholder
        return {
            'status': 'success',
            'operation': 'generate_knowledge_graph',
            'graph_nodes': 75,
            'graph_edges': 120
        }
    
    def _evaluate_models_operation(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate models operation."""
        # This would be implemented similarly to _analyze_repository_operation
        # For now, return a placeholder
        return {
            'status': 'success',
            'operation': 'evaluate_models',
            'models_evaluated': 3,
            'best_model': 'transformer_xl_v2'
        }
    
    def _orchestrate_agents_operation(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Orchestrate agents operation."""
        # This would be implemented similarly to _analyze_repository_operation
        # For now, return a placeholder
        return {
            'status': 'success',
            'operation': 'orchestrate_agents',
            'agents_deployed': 5,
            'tasks_completed': 12
        }
    
    def _neuro_symbolic_analysis_operation(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Neuro-symbolic analysis operation."""
        # This would be implemented similarly to _analyze_repository_operation
        # For now, return a placeholder
        return {
            'status': 'success',
            'operation': 'perform_neuro_symbolic_analysis',
            'rules_extracted': 8,
            'concepts_identified': 15
        }
    
    def _multimodal_processing_operation(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Multimodal processing operation."""
        # This would be implemented similarly to _analyze_repository_operation
        # For now, return a placeholder
        return {
            'status': 'success',
            'operation': 'process_multimodal_data',
            'modalities_processed': ['text', 'image', 'code'],
            'insights_generated': 7
        }
    
    def _academic_research_operation(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Academic research operation."""
        # This would be implemented similarly to _analyze_repository_operation
        # For now, return a placeholder
        return {
            'status': 'success',
            'operation': 'integrate_academic_research',
            'papers_analyzed': 12,
            'concepts_integrated': 5
        }
    
    def _sdk_plugins_operation(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """SDK plugins operation."""
        # This would be implemented similarly to _analyze_repository_operation
        # For now, return a placeholder
        return {
            'status': 'success',
            'operation': 'manage_sdk_plugins',
            'plugins_loaded': 3,
            'plugin_capabilities': ['code_analysis', 'visualization', 'reporting']
        }
    
    def _health_check_loop(self) -> None:
        """Health check thread loop."""
        while self.running:
            try:
                # Check services health
                for service_id, service_info in list(self.services.items()):
                    self._check_service_health(service_id)
                
                # Sleep for health check interval
                time.sleep(self.config['health_check_interval'])
            
            except Exception as e:
                self.logger.error(f"Error in health check loop: {e}")
                time.sleep(10)  # Sleep briefly on error
    
    def _check_service_health(self, service_id: str) -> bool:
        """
        Check the health of a service.
        
        Args:
            service_id: ID of the service to check
            
        Returns:
            True if service is healthy
        """
        if service_id not in self.services:
            return False
        
        service_info = self.services[service_id]
        
        if not service_info.health_endpoint:
            # No health endpoint defined, assume service is online
            service_info.status = ServiceStatus.ONLINE
            service_info.last_health_check = time.time()
            return True
        
        try:
            # In a real implementation, this would make an HTTP request
            # to the service's health endpoint. For this simplified
            # implementation, we'll just simulate a health check.
            is_healthy = True  # Simulated health check result
            
            # Update service status
            if is_healthy:
                service_info.status = ServiceStatus.ONLINE
                service_info.error = None
            else:
                service_info.status = ServiceStatus.DEGRADED
                service_info.error = "Failed health check"
            
            service_info.last_health_check = time.time()
            
            # Save service info
            self._save_service_info(service_info)
            
            return is_healthy
        
        except Exception as e:
            # Handle health check failure
            service_info.status = ServiceStatus.OFFLINE
            service_info.error = str(e)
            service_info.last_health_check = time.time()
            
            # Save service info
            self._save_service_info(service_info)
            
            self.logger.error(f"Health check failed for service {service_id}: {e}")
            return False
    
    def register_service(self, service_type: Union[str, ServiceType], name: str,
                      base_url: str, version: str, endpoints: List[Dict[str, Any]],
                      health_endpoint: Optional[str] = None,
                      metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Register a service with the gateway.
        
        Args:
            service_type: Type of service
            name: Human-readable name
            base_url: Base URL for service API
            version: Service version
            endpoints: List of service endpoints
            health_endpoint: Optional health check endpoint
            metadata: Optional service metadata
            
        Returns:
            Service ID
        """
        # Convert service_type from string if needed
        if isinstance(service_type, str):
            service_type = ServiceType(service_type)
        
        # Generate service ID
        service_id = str(uuid.uuid4())
        
        # Create service info
        service_info = ServiceInfo(
            service_id=service_id,
            service_type=service_type,
            name=name,
            base_url=base_url,
            version=version,
            endpoints=endpoints,
            health_endpoint=health_endpoint,
            metadata=metadata
        )
        
        # Add to registry
        self.services[service_id] = service_info
        
        # Save service info
        self._save_service_info(service_info)
        
        # Register default routes
        self._register_default_routes(service_info)
        
        self.logger.info(f"Registered service: {name} (ID: {service_id})")
        return service_id
    
    def _register_default_routes(self, service_info: ServiceInfo) -> None:
        """
        Register default routes for a service.
        
        Args:
            service_info: Service info to register routes for
        """
        for endpoint in service_info.endpoints:
            # Extract endpoint information
            path = endpoint.get('path', '/')
            methods = endpoint.get('methods', ['GET'])
            auth_level_str = endpoint.get('auth_level', 'none')
            cache_ttl = endpoint.get('cache_ttl', 0)
            rate_limit = endpoint.get('rate_limit')
            description = endpoint.get('description')
            
            # Convert auth level from string
            auth_level = AuthLevel(auth_level_str)
            
            # Generate route path
            service_type = service_info.service_type.value
            route_path = f"/api/{service_type}{path}"
            
            # Register route for each method
            for method_str in methods:
                method = EndpointMethod(method_str)
                
                # Create route info
                route_info = RouteInfo(
                    route_path=route_path,
                    method=method,
                    target_service=service_info.id,
                    target_endpoint=path,
                    auth_level=auth_level,
                    cache_ttl=cache_ttl,
                    rate_limit=rate_limit,
                    description=description
                )
                
                # Add to routes
                self.routes[(method, route_path)] = route_info
        
        # Save routes
        self._save_routes()
    
    def update_service(self, service_id: str,
                    base_url: Optional[str] = None,
                    version: Optional[str] = None,
                    endpoints: Optional[List[Dict[str, Any]]] = None,
                    health_endpoint: Optional[str] = None,
                    metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Update a service in the registry.
        
        Args:
            service_id: ID of the service to update
            base_url: Optional new base URL
            version: Optional new version
            endpoints: Optional new endpoints
            health_endpoint: Optional new health check endpoint
            metadata: Optional new metadata
            
        Returns:
            Update success
        """
        if service_id not in self.services:
            return False
        
        service_info = self.services[service_id]
        
        # Update fields
        if base_url is not None:
            service_info.base_url = base_url
        
        if version is not None:
            service_info.version = version
        
        if health_endpoint is not None:
            service_info.health_endpoint = health_endpoint
        
        if metadata is not None:
            service_info.metadata.update(metadata)
        
        # Update endpoints and routes if provided
        if endpoints is not None:
            service_info.endpoints = endpoints
            
            # Remove existing routes for this service
            self.routes = {
                key: route 
                for key, route in self.routes.items() 
                if route.target_service != service_id
            }
            
            # Register new routes
            self._register_default_routes(service_info)
        
        # Save service info
        self._save_service_info(service_info)
        
        self.logger.info(f"Updated service: {service_info.name} (ID: {service_id})")
        return True
    
    def deregister_service(self, service_id: str) -> bool:
        """
        Deregister a service from the gateway.
        
        Args:
            service_id: ID of the service to deregister
            
        Returns:
            Deregistration success
        """
        if service_id not in self.services:
            return False
        
        service_info = self.services[service_id]
        
        # Remove from registry
        del self.services[service_id]
        
        # Remove service file
        service_path = os.path.join(self.storage_dir, 'services', f"{service_id}.json")
        if os.path.exists(service_path):
            try:
                os.remove(service_path)
            except Exception as e:
                self.logger.error(f"Error removing service file {service_path}: {e}")
        
        # Remove routes for this service
        self.routes = {
            key: route 
            for key, route in self.routes.items() 
            if route.target_service != service_id
        }
        
        # Save routes
        self._save_routes()
        
        self.logger.info(f"Deregistered service: {service_info.name} (ID: {service_id})")
        return True
    
    def get_service_info(self, service_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a service.
        
        Args:
            service_id: ID of the service
            
        Returns:
            Service info dictionary or None if not found
        """
        if service_id not in self.services:
            return None
        
        return self.services[service_id].to_dict()
    
    def list_services(self, service_type: Optional[Union[str, ServiceType]] = None,
                   status: Optional[Union[str, ServiceStatus]] = None) -> List[Dict[str, Any]]:
        """
        List services in the registry.
        
        Args:
            service_type: Optional filter by service type
            status: Optional filter by status
            
        Returns:
            List of service info dictionaries
        """
        # Convert filters from strings if needed
        if isinstance(service_type, str):
            service_type = ServiceType(service_type)
        
        if isinstance(status, str):
            status = ServiceStatus(status)
        
        # Apply filters
        result = []
        
        for service_info in self.services.values():
            # Apply service type filter
            if service_type and service_info.service_type != service_type:
                continue
            
            # Apply status filter
            if status and service_info.status != status:
                continue
            
            # Add to result
            result.append(service_info.to_dict())
        
        return result
    
    def add_route(self, route_path: str, method: Union[str, EndpointMethod],
                target_service: str, target_endpoint: str,
                auth_level: Union[str, AuthLevel] = AuthLevel.NONE,
                cache_ttl: int = 0,
                rate_limit: Optional[int] = None,
                description: Optional[str] = None,
                metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Add a route to the gateway.
        
        Args:
            route_path: Path of the route in the gateway
            method: HTTP method
            target_service: ID of the target service
            target_endpoint: Endpoint path in the target service
            auth_level: Authentication level required
            cache_ttl: Cache time-to-live in seconds (0 = no caching)
            rate_limit: Optional rate limit in requests per minute
            description: Optional route description
            metadata: Optional route metadata
            
        Returns:
            Addition success
        """
        # Convert parameters from strings if needed
        if isinstance(method, str):
            method = EndpointMethod(method)
        
        if isinstance(auth_level, str):
            auth_level = AuthLevel(auth_level)
        
        # Check if target service exists
        if target_service not in self.services:
            return False
        
        # Create route info
        route_info = RouteInfo(
            route_path=route_path,
            method=method,
            target_service=target_service,
            target_endpoint=target_endpoint,
            auth_level=auth_level,
            cache_ttl=cache_ttl,
            rate_limit=rate_limit,
            description=description,
            metadata=metadata
        )
        
        # Add to routes
        self.routes[(method, route_path)] = route_info
        
        # Save routes
        self._save_routes()
        
        self.logger.info(f"Added route: {method.value} {route_path} -> {target_service}:{target_endpoint}")
        return True
    
    def remove_route(self, route_path: str, method: Union[str, EndpointMethod]) -> bool:
        """
        Remove a route from the gateway.
        
        Args:
            route_path: Path of the route in the gateway
            method: HTTP method
            
        Returns:
            Removal success
        """
        # Convert method from string if needed
        if isinstance(method, str):
            method = EndpointMethod(method)
        
        # Check if route exists
        if (method, route_path) not in self.routes:
            return False
        
        # Remove route
        del self.routes[(method, route_path)]
        
        # Save routes
        self._save_routes()
        
        self.logger.info(f"Removed route: {method.value} {route_path}")
        return True
    
    def get_route_info(self, route_path: str, method: Union[str, EndpointMethod]) -> Optional[Dict[str, Any]]:
        """
        Get information about a route.
        
        Args:
            route_path: Path of the route in the gateway
            method: HTTP method
            
        Returns:
            Route info dictionary or None if not found
        """
        # Convert method from string if needed
        if isinstance(method, str):
            method = EndpointMethod(method)
        
        # Check if route exists
        if (method, route_path) not in self.routes:
            return None
        
        return self.routes[(method, route_path)].to_dict()
    
    def list_routes(self, target_service: Optional[str] = None,
                 auth_level: Optional[Union[str, AuthLevel]] = None) -> List[Dict[str, Any]]:
        """
        List routes in the gateway.
        
        Args:
            target_service: Optional filter by target service
            auth_level: Optional filter by authentication level
            
        Returns:
            List of route info dictionaries
        """
        # Convert auth_level from string if needed
        if isinstance(auth_level, str):
            auth_level = AuthLevel(auth_level)
        
        # Apply filters
        result = []
        
        for route_info in self.routes.values():
            # Apply target service filter
            if target_service and route_info.target_service != target_service:
                continue
            
            # Apply auth level filter
            if auth_level and route_info.auth_level != auth_level:
                continue
            
            # Add to result
            result.append(route_info.to_dict())
        
        return result
    
    def handle_request(self, path: str, method: Union[str, EndpointMethod],
                    headers: Dict[str, str], body: Any,
                    query_params: Dict[str, str], client_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Handle an API request.
        
        Args:
            path: Request path
            method: HTTP method
            headers: Request headers
            body: Request body
            query_params: Query parameters
            client_id: Optional client identifier for rate limiting
            
        Returns:
            Response dictionary
        """
        # Convert method from string if needed
        if isinstance(method, str):
            method = EndpointMethod(method)
        
        # Find route
        route_key = (method, path)
        if route_key not in self.routes:
            return {
                'status': 404,
                'body': {'error': 'Not Found'},
                'headers': {'Content-Type': 'application/json'}
            }
        
        route_info = self.routes[route_key]
        
        # Check rate limit
        if self.config['enable_rate_limiting'] and route_info.rate_limit is not None and client_id is not None:
            rate_limit_key = (client_id, method, path)
            
            if not self._check_rate_limit(rate_limit_key, route_info.rate_limit):
                return {
                    'status': 429,
                    'body': {'error': 'Too Many Requests'},
                    'headers': {'Content-Type': 'application/json'}
                }
        
        # Check authentication
        if self.config['authentication_enabled'] and route_info.auth_level != AuthLevel.NONE:
            auth_result = self._authenticate_request(headers, route_info.auth_level)
            
            if not auth_result['success']:
                return {
                    'status': 401,
                    'body': {'error': auth_result['error']},
                    'headers': {'Content-Type': 'application/json'}
                }
        
        # Check service status
        target_service_id = route_info.target_service
        if target_service_id not in self.services:
            return {
                'status': 503,
                'body': {'error': 'Service Unavailable'},
                'headers': {'Content-Type': 'application/json'}
            }
        
        service_info = self.services[target_service_id]
        
        if service_info.status != ServiceStatus.ONLINE:
            return {
                'status': 503,
                'body': {'error': 'Service Unavailable', 'details': service_info.error},
                'headers': {'Content-Type': 'application/json'}
            }
        
        # Check cache
        request_hash = self._hash_request(body, query_params)
        cache_key = (method, path, request_hash)
        
        if self.config['enable_caching'] and route_info.cache_ttl > 0 and method == EndpointMethod.GET:
            cached_response = self._get_from_cache(cache_key, route_info.cache_ttl)
            
            if cached_response:
                # Add cache header
                cached_response['headers']['X-Cache'] = 'HIT'
                return cached_response
        
        # Forward request to target service
        response = self._forward_request(
            service_info=service_info,
            endpoint=route_info.target_endpoint,
            method=method,
            headers=headers,
            body=body,
            query_params=query_params
        )
        
        # Cache response if successful and cacheable
        if (self.config['enable_caching'] and 
            route_info.cache_ttl > 0 and 
            method == EndpointMethod.GET and 
            response['status'] >= 200 and 
            response['status'] < 300):
            
            self._add_to_cache(cache_key, response)
        
        return response
    
    def _check_rate_limit(self, rate_limit_key: Tuple, limit: int) -> bool:
        """
        Check if a request is within rate limits.
        
        Args:
            rate_limit_key: Rate limit key (client_id, method, path)
            limit: Rate limit in requests per minute
            
        Returns:
            True if within rate limit
        """
        current_time = time.time()
        
        # Initialize list of timestamps if needed
        if rate_limit_key not in self.rate_limits:
            self.rate_limits[rate_limit_key] = []
        
        # Get list of timestamps
        timestamps = self.rate_limits[rate_limit_key]
        
        # Remove timestamps older than 1 minute
        one_minute_ago = current_time - 60
        timestamps = [ts for ts in timestamps if ts > one_minute_ago]
        
        # Update list of timestamps
        self.rate_limits[rate_limit_key] = timestamps
        
        # Check rate limit
        if len(timestamps) >= limit:
            return False
        
        # Add current timestamp
        timestamps.append(current_time)
        
        return True
    
    def _authenticate_request(self, headers: Dict[str, str], required_level: AuthLevel) -> Dict[str, Any]:
        """
        Authenticate a request.
        
        Args:
            headers: Request headers
            required_level: Required authentication level
            
        Returns:
            Authentication result
        """
        # In a real implementation, this would verify the authentication token
        # and check if the user has the required access level.
        # For this simplified implementation, we'll just simulate authentication.
        
        # Check if Authorization header is present
        auth_header = headers.get('Authorization')
        
        if not auth_header:
            return {'success': False, 'error': 'Authorization header required'}
        
        # Parse Authorization header
        try:
            auth_type, token = auth_header.split(' ', 1)
            
            if auth_type.lower() != 'bearer':
                return {'success': False, 'error': 'Bearer authentication required'}
            
            # Verify token (simulated)
            if token == 'user_token':
                if required_level == AuthLevel.ADMIN or required_level == AuthLevel.SERVICE:
                    return {'success': False, 'error': 'Insufficient privileges'}
                
                return {'success': True, 'user_id': 'user123', 'level': AuthLevel.USER.value}
            
            elif token == 'admin_token':
                if required_level == AuthLevel.SERVICE:
                    return {'success': False, 'error': 'Insufficient privileges'}
                
                return {'success': True, 'user_id': 'admin456', 'level': AuthLevel.ADMIN.value}
            
            elif token == 'service_token':
                return {'success': True, 'service_id': 'service789', 'level': AuthLevel.SERVICE.value}
            
            else:
                return {'success': False, 'error': 'Invalid token'}
        
        except Exception as e:
            return {'success': False, 'error': f'Authentication error: {str(e)}'}
    
    def _hash_request(self, body: Any, query_params: Dict[str, str]) -> str:
        """
        Generate a hash for a request for caching.
        
        Args:
            body: Request body
            query_params: Query parameters
            
        Returns:
            Request hash
        """
        # Convert body to string
        if isinstance(body, dict) or isinstance(body, list):
            body_str = json.dumps(body, sort_keys=True)
        else:
            body_str = str(body)
        
        # Convert query params to string
        query_str = '&'.join(f"{k}={v}" for k, v in sorted(query_params.items()))
        
        # Combine and hash
        import hashlib
        combined = f"{body_str}|{query_str}"
        
        return hashlib.md5(combined.encode()).hexdigest()
    
    def _get_from_cache(self, cache_key: Tuple, ttl: int) -> Optional[Dict[str, Any]]:
        """
        Get a response from the cache.
        
        Args:
            cache_key: Cache key (method, path, request_hash)
            ttl: Cache time-to-live in seconds
            
        Returns:
            Cached response or None if not found or expired
        """
        if cache_key not in self.cache:
            return None
        
        response, timestamp = self.cache[cache_key]
        
        # Check if expired
        if time.time() - timestamp > ttl:
            del self.cache[cache_key]
            return None
        
        return response
    
    def _add_to_cache(self, cache_key: Tuple, response: Dict[str, Any]) -> None:
        """
        Add a response to the cache.
        
        Args:
            cache_key: Cache key (method, path, request_hash)
            response: Response to cache
        """
        # Add to cache
        self.cache[cache_key] = (response, time.time())
        
        # Check cache size
        if len(self.cache) > self.config['max_cache_size']:
            # Remove oldest entries
            items = sorted(self.cache.items(), key=lambda x: x[1][1])
            items_to_remove = items[:len(items) // 2]  # Remove half of the cache
            
            for key, _ in items_to_remove:
                del self.cache[key]
    
    def _forward_request(self, service_info: ServiceInfo, endpoint: str,
                      method: EndpointMethod, headers: Dict[str, str],
                      body: Any, query_params: Dict[str, str]) -> Dict[str, Any]:
        """
        Forward a request to a service.
        
        Args:
            service_info: Target service info
            endpoint: Target endpoint
            method: HTTP method
            headers: Request headers
            body: Request body
            query_params: Query parameters
            
        Returns:
            Response from the service
        """
        # In a real implementation, this would make an HTTP request
        # to the target service. For this simplified implementation,
        # we'll just simulate a response.
        
        # Construct target URL
        base_url = service_info.base_url.rstrip('/')
        endpoint = endpoint.lstrip('/')
        target_url = f"{base_url}/{endpoint}"
        
        # Add query parameters
        if query_params:
            query_string = '&'.join(f"{k}={v}" for k, v in query_params.items())
            target_url = f"{target_url}?{query_string}"
        
        # Log request
        self.logger.info(f"Forwarding {method.value} request to {target_url}")
        
        # Simulate response
        return {
            'status': 200,
            'body': {
                'message': 'Success',
                'service': service_info.name,
                'endpoint': endpoint,
                'method': method.value
            },
            'headers': {
                'Content-Type': 'application/json',
                'X-Service-ID': service_info.id
            }
        }
    
    def clear_cache(self) -> int:
        """
        Clear the response cache.
        
        Returns:
            Number of cache entries cleared
        """
        count = len(self.cache)
        self.cache = {}
        return count
    
    def update_config(self, config: Dict[str, Any]) -> bool:
        """
        Update the gateway configuration.
        
        Args:
            config: New configuration values
            
        Returns:
            Update success
        """
        # Update configuration
        self.config.update(config)
        
        # Save configuration
        self._save_config()
        
        # Update logging level if changed
        if 'logging_level' in config:
            logging_level = getattr(logging, self.config['logging_level'], logging.INFO)
            self.logger.setLevel(logging_level)
        
        self.logger.info("Updated gateway configuration")
        return True
    
    def get_config(self) -> Dict[str, Any]:
        """
        Get the gateway configuration.
        
        Returns:
            Gateway configuration
        """
        return self.config.copy()
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get gateway statistics.
        
        Returns:
            Gateway statistics
        """
        return {
            'services': {
                'total': len(self.services),
                'online': sum(1 for s in self.services.values() if s.status == ServiceStatus.ONLINE),
                'offline': sum(1 for s in self.services.values() if s.status == ServiceStatus.OFFLINE),
                'degraded': sum(1 for s in self.services.values() if s.status == ServiceStatus.DEGRADED)
            },
            'routes': len(self.routes),
            'cache': {
                'entries': len(self.cache),
                'max_size': self.config['max_cache_size']
            },
            'rate_limits': {
                'active_clients': len(self.rate_limits)
            }
        }