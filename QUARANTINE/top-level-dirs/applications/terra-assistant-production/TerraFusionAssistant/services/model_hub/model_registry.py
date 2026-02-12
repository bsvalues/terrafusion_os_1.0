"""
Model Registry

This module implements a model registry for managing AI models in the system.
It provides functionality for model versioning, storage, retrieval, and metadata tracking.
"""
import os
import json
import logging
import time
import uuid
import shutil
from typing import Dict, List, Any, Optional, Union, Tuple
from enum import Enum
from datetime import datetime

class ModelType(Enum):
    """Types of AI models supported by the system."""
    TEXT_CLASSIFICATION = "text_classification"
    CODE_CLASSIFICATION = "code_classification"
    CODE_GENERATION = "code_generation"
    TEXT_GENERATION = "text_generation"
    EMBEDDINGS = "embeddings"
    CODE_EMBEDDINGS = "code_embeddings"
    MULTIMODAL = "multimodal"
    NEURO_SYMBOLIC = "neuro_symbolic"
    GRAPH_NEURAL_NETWORK = "graph_neural_network"
    CUSTOM = "custom"


class ModelProvider(Enum):
    """AI model providers supported by the system."""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    LOCAL = "local"
    HUGGINGFACE = "huggingface"
    COHERE = "cohere"
    CUSTOM = "custom"


class ModelStatus(Enum):
    """Status of an AI model in the registry."""
    PENDING = "pending"
    READY = "ready"
    TRAINING = "training"
    EVALUATING = "evaluating"
    DEPLOYED = "deployed"
    ERROR = "error"
    ARCHIVED = "archived"


class ModelVersion:
    """
    Represents a specific version of an AI model.
    """
    
    def __init__(self, version_id: str, model_id: str, version_number: str,
                created_at: float, status: ModelStatus = ModelStatus.PENDING,
                metadata: Optional[Dict[str, Any]] = None,
                files: Optional[Dict[str, str]] = None,
                performance_metrics: Optional[Dict[str, float]] = None):
        """
        Initialize a model version.
        
        Args:
            version_id: Unique identifier for the version
            model_id: ID of the parent model
            version_number: Semantic version number (e.g., "1.0.0")
            created_at: Timestamp of creation
            status: Status of the version
            metadata: Optional version metadata
            files: Optional dictionary mapping file types to file paths
            performance_metrics: Optional performance metrics
        """
        self.id = version_id
        self.model_id = model_id
        self.version_number = version_number
        self.created_at = created_at
        self.status = status
        self.metadata = metadata or {}
        self.files = files or {}
        self.performance_metrics = performance_metrics or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model version to a dictionary."""
        return {
            'id': self.id,
            'model_id': self.model_id,
            'version_number': self.version_number,
            'created_at': self.created_at,
            'status': self.status.value,
            'metadata': self.metadata,
            'files': self.files,
            'performance_metrics': self.performance_metrics
        }


class Model:
    """
    Represents an AI model in the registry.
    """
    
    def __init__(self, model_id: str, name: str, description: str,
                model_type: ModelType, provider: ModelProvider,
                created_at: float, creator: Optional[str] = None,
                tags: Optional[List[str]] = None,
                metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize a model.
        
        Args:
            model_id: Unique identifier for the model
            name: Human-readable name
            description: Description of the model
            model_type: Type of model
            provider: Model provider
            created_at: Timestamp of creation
            creator: Optional creator identifier
            tags: Optional list of tags
            metadata: Optional model metadata
        """
        self.id = model_id
        self.name = name
        self.description = description
        self.model_type = model_type
        self.provider = provider
        self.created_at = created_at
        self.creator = creator
        self.tags = tags or []
        self.metadata = metadata or {}
        self.versions = {}  # version_id -> ModelVersion
        self.latest_version_id = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'model_type': self.model_type.value,
            'provider': self.provider.value,
            'created_at': self.created_at,
            'creator': self.creator,
            'tags': self.tags,
            'metadata': self.metadata,
            'latest_version_id': self.latest_version_id
        }


class ModelRegistry:
    """
    Registry for AI models in the system.
    
    This class provides:
    - Model registration and versioning
    - Model storage and retrieval
    - Model metadata tracking
    - Model discovery and search
    """
    
    def __init__(self, storage_dir: Optional[str] = None):
        """
        Initialize the model registry.
        
        Args:
            storage_dir: Optional directory for model storage
        """
        # Set up storage directory
        if storage_dir is None:
            storage_dir = os.path.join(os.getcwd(), 'model_storage')
        
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        
        # Set up metadata directory
        self.metadata_dir = os.path.join(storage_dir, 'metadata')
        os.makedirs(self.metadata_dir, exist_ok=True)
        
        # Set up model files directory
        self.files_dir = os.path.join(storage_dir, 'files')
        os.makedirs(self.files_dir, exist_ok=True)
        
        # Initialize logger
        self.logger = logging.getLogger('model_registry')
        
        # Initialize models
        self.models = {}  # model_id -> Model
        
        # Load existing models
        self._load_models()
    
    def _load_models(self) -> None:
        """Load existing models from storage."""
        try:
            # Load models
            models_dir = os.path.join(self.metadata_dir, 'models')
            if os.path.exists(models_dir):
                for filename in os.listdir(models_dir):
                    if filename.endswith('.json'):
                        model_id = filename[:-5]  # Remove '.json'
                        model_path = os.path.join(models_dir, filename)
                        
                        with open(model_path, 'r') as f:
                            model_data = json.load(f)
                        
                        model = Model(
                            model_id=model_data['id'],
                            name=model_data['name'],
                            description=model_data['description'],
                            model_type=ModelType(model_data['model_type']),
                            provider=ModelProvider(model_data['provider']),
                            created_at=model_data['created_at'],
                            creator=model_data.get('creator'),
                            tags=model_data.get('tags', []),
                            metadata=model_data.get('metadata', {})
                        )
                        
                        model.latest_version_id = model_data.get('latest_version_id')
                        
                        self.models[model_id] = model
            
            # Load versions
            versions_dir = os.path.join(self.metadata_dir, 'versions')
            if os.path.exists(versions_dir):
                for model_id in self.models:
                    model_versions_dir = os.path.join(versions_dir, model_id)
                    
                    if os.path.exists(model_versions_dir):
                        for filename in os.listdir(model_versions_dir):
                            if filename.endswith('.json'):
                                version_id = filename[:-5]  # Remove '.json'
                                version_path = os.path.join(model_versions_dir, filename)
                                
                                with open(version_path, 'r') as f:
                                    version_data = json.load(f)
                                
                                version = ModelVersion(
                                    version_id=version_data['id'],
                                    model_id=version_data['model_id'],
                                    version_number=version_data['version_number'],
                                    created_at=version_data['created_at'],
                                    status=ModelStatus(version_data['status']),
                                    metadata=version_data.get('metadata', {}),
                                    files=version_data.get('files', {}),
                                    performance_metrics=version_data.get('performance_metrics', {})
                                )
                                
                                self.models[model_id].versions[version_id] = version
            
            self.logger.info(f"Loaded {len(self.models)} models from storage")
        
        except Exception as e:
            self.logger.error(f"Error loading models from storage: {e}")
    
    def _save_model(self, model: Model) -> None:
        """
        Save a model to storage.
        
        Args:
            model: Model to save
        """
        models_dir = os.path.join(self.metadata_dir, 'models')
        os.makedirs(models_dir, exist_ok=True)
        
        model_path = os.path.join(models_dir, f"{model.id}.json")
        
        with open(model_path, 'w') as f:
            json.dump(model.to_dict(), f, indent=2)
    
    def _save_version(self, version: ModelVersion) -> None:
        """
        Save a model version to storage.
        
        Args:
            version: Model version to save
        """
        versions_dir = os.path.join(self.metadata_dir, 'versions', version.model_id)
        os.makedirs(versions_dir, exist_ok=True)
        
        version_path = os.path.join(versions_dir, f"{version.id}.json")
        
        with open(version_path, 'w') as f:
            json.dump(version.to_dict(), f, indent=2)
    
    def register_model(self, name: str, description: str,
                     model_type: Union[str, ModelType],
                     provider: Union[str, ModelProvider],
                     creator: Optional[str] = None,
                     tags: Optional[List[str]] = None,
                     metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Register a new model in the registry.
        
        Args:
            name: Human-readable name
            description: Description of the model
            model_type: Type of model
            provider: Model provider
            creator: Optional creator identifier
            tags: Optional list of tags
            metadata: Optional model metadata
            
        Returns:
            Model ID
        """
        # Convert enums from strings if needed
        if isinstance(model_type, str):
            model_type = ModelType(model_type)
        
        if isinstance(provider, str):
            provider = ModelProvider(provider)
        
        # Generate model ID
        model_id = str(uuid.uuid4())
        
        # Create model
        model = Model(
            model_id=model_id,
            name=name,
            description=description,
            model_type=model_type,
            provider=provider,
            created_at=time.time(),
            creator=creator,
            tags=tags,
            metadata=metadata
        )
        
        # Store model
        self.models[model_id] = model
        
        # Save model metadata
        self._save_model(model)
        
        self.logger.info(f"Registered model: {name} (ID: {model_id})")
        return model_id
    
    def get_model(self, model_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a model by ID.
        
        Args:
            model_id: ID of the model
            
        Returns:
            Model data dictionary or None if not found
        """
        if model_id not in self.models:
            return None
        
        model = self.models[model_id]
        
        # Get model data
        model_data = model.to_dict()
        
        # Add versions data
        model_data['versions'] = []
        
        for version_id, version in model.versions.items():
            model_data['versions'].append(version.to_dict())
        
        # Sort versions by creation time (newest first)
        model_data['versions'].sort(key=lambda v: v['created_at'], reverse=True)
        
        return model_data
    
    def list_models(self, model_type: Optional[Union[str, ModelType]] = None,
                  provider: Optional[Union[str, ModelProvider]] = None,
                  tags: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        List models in the registry.
        
        Args:
            model_type: Optional filter by model type
            provider: Optional filter by provider
            tags: Optional filter by tags
            
        Returns:
            List of model data dictionaries
        """
        # Convert enums from strings if needed
        if isinstance(model_type, str):
            model_type = ModelType(model_type)
        
        if isinstance(provider, str):
            provider = ModelProvider(provider)
        
        results = []
        
        for model in self.models.values():
            # Apply model type filter
            if model_type and model.model_type != model_type:
                continue
            
            # Apply provider filter
            if provider and model.provider != provider:
                continue
            
            # Apply tags filter
            if tags and not all(tag in model.tags for tag in tags):
                continue
            
            # Add basic model info (without versions)
            model_data = model.to_dict()
            model_data['version_count'] = len(model.versions)
            
            results.append(model_data)
        
        # Sort by creation time (newest first)
        results.sort(key=lambda m: m['created_at'], reverse=True)
        
        return results
    
    def create_model_version(self, model_id: str, version_number: str,
                           metadata: Optional[Dict[str, Any]] = None) -> Optional[str]:
        """
        Create a new version for a model.
        
        Args:
            model_id: ID of the model
            version_number: Semantic version number (e.g., "1.0.0")
            metadata: Optional version metadata
            
        Returns:
            Version ID or None if model not found
        """
        if model_id not in self.models:
            return None
        
        model = self.models[model_id]
        
        # Generate version ID
        version_id = str(uuid.uuid4())
        
        # Create version
        version = ModelVersion(
            version_id=version_id,
            model_id=model_id,
            version_number=version_number,
            created_at=time.time(),
            status=ModelStatus.PENDING,
            metadata=metadata
        )
        
        # Store version
        model.versions[version_id] = version
        
        # Update latest version
        model.latest_version_id = version_id
        
        # Save version metadata
        self._save_version(version)
        
        # Save updated model metadata
        self._save_model(model)
        
        self.logger.info(f"Created version {version_number} for model {model.name} (ID: {version_id})")
        return version_id
    
    def get_model_version(self, model_id: str, version_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a specific model version.
        
        Args:
            model_id: ID of the model
            version_id: ID of the version
            
        Returns:
            Version data dictionary or None if not found
        """
        if model_id not in self.models:
            return None
        
        model = self.models[model_id]
        
        if version_id not in model.versions:
            return None
        
        version = model.versions[version_id]
        return version.to_dict()
    
    def get_latest_model_version(self, model_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the latest version of a model.
        
        Args:
            model_id: ID of the model
            
        Returns:
            Version data dictionary or None if not found
        """
        if model_id not in self.models:
            return None
        
        model = self.models[model_id]
        
        if not model.latest_version_id or model.latest_version_id not in model.versions:
            return None
        
        version = model.versions[model.latest_version_id]
        return version.to_dict()
    
    def upload_model_file(self, model_id: str, version_id: str, 
                        file_type: str, file_path: str) -> bool:
        """
        Upload a file for a model version.
        
        Args:
            model_id: ID of the model
            version_id: ID of the version
            file_type: Type of file (e.g., "weights", "config", "vocabulary")
            file_path: Path to the file
            
        Returns:
            Upload success
        """
        if model_id not in self.models:
            return False
        
        model = self.models[model_id]
        
        if version_id not in model.versions:
            return False
        
        version = model.versions[version_id]
        
        # Create directory for model files
        model_files_dir = os.path.join(self.files_dir, model_id, version_id)
        os.makedirs(model_files_dir, exist_ok=True)
        
        # Determine destination path
        file_name = os.path.basename(file_path)
        dest_path = os.path.join(model_files_dir, file_name)
        
        try:
            # Copy file
            shutil.copy2(file_path, dest_path)
            
            # Update version metadata
            version.files[file_type] = dest_path
            
            # Save version metadata
            self._save_version(version)
            
            self.logger.info(f"Uploaded {file_type} file for model {model.name} version {version.version_number}")
            return True
        
        except Exception as e:
            self.logger.error(f"Error uploading file: {e}")
            return False
    
    def download_model_file(self, model_id: str, version_id: str,
                          file_type: str, destination: str) -> bool:
        """
        Download a file for a model version.
        
        Args:
            model_id: ID of the model
            version_id: ID of the version
            file_type: Type of file (e.g., "weights", "config", "vocabulary")
            destination: Destination path
            
        Returns:
            Download success
        """
        if model_id not in self.models:
            return False
        
        model = self.models[model_id]
        
        if version_id not in model.versions:
            return False
        
        version = model.versions[version_id]
        
        if file_type not in version.files:
            return False
        
        file_path = version.files[file_type]
        
        try:
            # Create destination directory if needed
            os.makedirs(os.path.dirname(destination), exist_ok=True)
            
            # Copy file
            shutil.copy2(file_path, destination)
            
            self.logger.info(f"Downloaded {file_type} file for model {model.name} version {version.version_number}")
            return True
        
        except Exception as e:
            self.logger.error(f"Error downloading file: {e}")
            return False
    
    def update_version_status(self, model_id: str, version_id: str,
                            status: Union[str, ModelStatus]) -> bool:
        """
        Update the status of a model version.
        
        Args:
            model_id: ID of the model
            version_id: ID of the version
            status: New status
            
        Returns:
            Update success
        """
        if model_id not in self.models:
            return False
        
        model = self.models[model_id]
        
        if version_id not in model.versions:
            return False
        
        # Convert status from string if needed
        if isinstance(status, str):
            status = ModelStatus(status)
        
        # Update status
        version = model.versions[version_id]
        version.status = status
        
        # Save version metadata
        self._save_version(version)
        
        self.logger.info(f"Updated status of model {model.name} version {version.version_number} to {status.value}")
        return True
    
    def add_performance_metrics(self, model_id: str, version_id: str,
                              metrics: Dict[str, float]) -> bool:
        """
        Add performance metrics for a model version.
        
        Args:
            model_id: ID of the model
            version_id: ID of the version
            metrics: Performance metrics
            
        Returns:
            Update success
        """
        if model_id not in self.models:
            return False
        
        model = self.models[model_id]
        
        if version_id not in model.versions:
            return False
        
        # Update metrics
        version = model.versions[version_id]
        version.performance_metrics.update(metrics)
        
        # Save version metadata
        self._save_version(version)
        
        self.logger.info(f"Added performance metrics for model {model.name} version {version.version_number}")
        return True
    
    def search_models(self, query: str) -> List[Dict[str, Any]]:
        """
        Search for models by name, description, or tags.
        
        Args:
            query: Search query
            
        Returns:
            List of matching model data dictionaries
        """
        query = query.lower()
        results = []
        
        for model in self.models.values():
            # Check name
            if query in model.name.lower():
                results.append(model.to_dict())
                continue
            
            # Check description
            if query in model.description.lower():
                results.append(model.to_dict())
                continue
            
            # Check tags
            if any(query in tag.lower() for tag in model.tags):
                results.append(model.to_dict())
                continue
        
        return results
    
    def delete_model(self, model_id: str, delete_files: bool = True) -> bool:
        """
        Delete a model from the registry.
        
        Args:
            model_id: ID of the model
            delete_files: Whether to delete associated files
            
        Returns:
            Deletion success
        """
        if model_id not in self.models:
            return False
        
        model = self.models[model_id]
        
        try:
            # Delete model metadata file
            model_path = os.path.join(self.metadata_dir, 'models', f"{model_id}.json")
            if os.path.exists(model_path):
                os.remove(model_path)
            
            # Delete version metadata files
            versions_dir = os.path.join(self.metadata_dir, 'versions', model_id)
            if os.path.exists(versions_dir):
                shutil.rmtree(versions_dir)
            
            # Delete model files if requested
            if delete_files:
                model_files_dir = os.path.join(self.files_dir, model_id)
                if os.path.exists(model_files_dir):
                    shutil.rmtree(model_files_dir)
            
            # Remove from memory
            del self.models[model_id]
            
            self.logger.info(f"Deleted model: {model.name} (ID: {model_id})")
            return True
        
        except Exception as e:
            self.logger.error(f"Error deleting model {model_id}: {e}")
            return False
    
    def delete_model_version(self, model_id: str, version_id: str,
                           delete_files: bool = True) -> bool:
        """
        Delete a model version from the registry.
        
        Args:
            model_id: ID of the model
            version_id: ID of the version
            delete_files: Whether to delete associated files
            
        Returns:
            Deletion success
        """
        if model_id not in self.models:
            return False
        
        model = self.models[model_id]
        
        if version_id not in model.versions:
            return False
        
        version = model.versions[version_id]
        
        try:
            # Delete version metadata file
            version_path = os.path.join(self.metadata_dir, 'versions', model_id, f"{version_id}.json")
            if os.path.exists(version_path):
                os.remove(version_path)
            
            # Delete version files if requested
            if delete_files:
                version_files_dir = os.path.join(self.files_dir, model_id, version_id)
                if os.path.exists(version_files_dir):
                    shutil.rmtree(version_files_dir)
            
            # Update latest version if needed
            if model.latest_version_id == version_id:
                # Find the next latest version
                remaining_versions = [v for v_id, v in model.versions.items() if v_id != version_id]
                
                if remaining_versions:
                    # Sort by creation time (newest first)
                    remaining_versions.sort(key=lambda v: v.created_at, reverse=True)
                    model.latest_version_id = remaining_versions[0].id
                else:
                    model.latest_version_id = None
                
                # Save updated model metadata
                self._save_model(model)
            
            # Remove from memory
            del model.versions[version_id]
            
            self.logger.info(f"Deleted version {version.version_number} of model {model.name}")
            return True
        
        except Exception as e:
            self.logger.error(f"Error deleting version {version_id} of model {model_id}: {e}")
            return False
    
    def get_model_deployment_info(self, model_id: str, version_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Get deployment information for a model version.
        
        Args:
            model_id: ID of the model
            version_id: Optional ID of the version (uses latest if not provided)
            
        Returns:
            Deployment information or None if not found
        """
        if model_id not in self.models:
            return None
        
        model = self.models[model_id]
        
        # Determine version to use
        if version_id:
            if version_id not in model.versions:
                return None
            version = model.versions[version_id]
        else:
            if not model.latest_version_id or model.latest_version_id not in model.versions:
                return None
            version = model.versions[model.latest_version_id]
        
        # Check if version is deployed
        if version.status != ModelStatus.DEPLOYED:
            return None
        
        # Get file paths
        files = {}
        for file_type, file_path in version.files.items():
            files[file_type] = file_path
        
        # Return deployment info
        return {
            'model_id': model_id,
            'model_name': model.name,
            'model_type': model.model_type.value,
            'provider': model.provider.value,
            'version_id': version.id,
            'version_number': version.version_number,
            'files': files,
            'performance_metrics': version.performance_metrics,
            'metadata': {**model.metadata, **version.metadata}
        }
    
    def compare_model_versions(self, model_id: str, version_id1: str,
                            version_id2: str) -> Optional[Dict[str, Any]]:
        """
        Compare two versions of a model.
        
        Args:
            model_id: ID of the model
            version_id1: ID of the first version
            version_id2: ID of the second version
            
        Returns:
            Comparison results or None if not found
        """
        if model_id not in self.models:
            return None
        
        model = self.models[model_id]
        
        if version_id1 not in model.versions or version_id2 not in model.versions:
            return None
        
        version1 = model.versions[version_id1]
        version2 = model.versions[version_id2]
        
        # Compare performance metrics
        metric_comparison = {}
        all_metrics = set(version1.performance_metrics.keys()) | set(version2.performance_metrics.keys())
        
        for metric in all_metrics:
            value1 = version1.performance_metrics.get(metric)
            value2 = version2.performance_metrics.get(metric)
            
            if value1 is not None and value2 is not None:
                difference = value2 - value1
                percent_change = (difference / value1) * 100 if value1 != 0 else float('inf')
                
                metric_comparison[metric] = {
                    'value1': value1,
                    'value2': value2,
                    'difference': difference,
                    'percent_change': percent_change
                }
            else:
                metric_comparison[metric] = {
                    'value1': value1,
                    'value2': value2,
                    'difference': None,
                    'percent_change': None
                }
        
        # Return comparison results
        return {
            'model_id': model_id,
            'model_name': model.name,
            'version1': {
                'id': version_id1,
                'number': version1.version_number,
                'created_at': version1.created_at,
                'status': version1.status.value
            },
            'version2': {
                'id': version_id2,
                'number': version2.version_number,
                'created_at': version2.created_at,
                'status': version2.status.value
            },
            'time_difference': version2.created_at - version1.created_at,
            'metrics_comparison': metric_comparison
        }