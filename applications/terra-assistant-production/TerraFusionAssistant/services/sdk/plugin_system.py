"""
Plugin System

This module implements a plugin system for extending the Code Deep Dive Analyzer platform
with third-party integrations and custom functionality.
"""
import os
import sys
import json
import logging
import importlib
import importlib.util
import inspect
import time
import uuid
from enum import Enum
from typing import Dict, List, Any, Optional, Union, Tuple, Set, Callable, Type

class PluginType(Enum):
    """Types of plugins supported by the system."""
    ANALYZER = "analyzer"
    VISUALIZER = "visualizer"
    INTEGRATION = "integration"
    AGENT = "agent"
    MODEL = "model"
    CUSTOM = "custom"


class PluginStatus(Enum):
    """Status of a plugin in the system."""
    ENABLED = "enabled"
    DISABLED = "disabled"
    ERROR = "error"


class PluginMetadata:
    """
    Metadata for a plugin.
    """
    
    def __init__(self, plugin_id: str, name: str, version: str,
               description: str, plugin_type: PluginType,
               author: Optional[str] = None,
               website: Optional[str] = None,
               dependencies: Optional[List[str]] = None,
               entrypoint: Optional[str] = None,
               config_schema: Optional[Dict[str, Any]] = None):
        """
        Initialize plugin metadata.
        
        Args:
            plugin_id: Unique identifier for the plugin
            name: Human-readable name for the plugin
            version: Plugin version
            description: Description of the plugin
            plugin_type: Type of plugin
            author: Optional plugin author
            website: Optional plugin website
            dependencies: Optional list of plugin dependencies
            entrypoint: Optional plugin entrypoint module
            config_schema: Optional JSON schema for plugin configuration
        """
        self.id = plugin_id
        self.name = name
        self.version = version
        self.description = description
        self.plugin_type = plugin_type
        self.author = author
        self.website = website
        self.dependencies = dependencies or []
        self.entrypoint = entrypoint
        self.config_schema = config_schema or {}
        self.status = PluginStatus.DISABLED
        self.error = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert plugin metadata to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'version': self.version,
            'description': self.description,
            'plugin_type': self.plugin_type.value,
            'author': self.author,
            'website': self.website,
            'dependencies': self.dependencies,
            'entrypoint': self.entrypoint,
            'config_schema': self.config_schema,
            'status': self.status.value,
            'error': self.error
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'PluginMetadata':
        """
        Create plugin metadata from a dictionary.
        
        Args:
            data: Plugin metadata dictionary
        
        Returns:
            PluginMetadata instance
        """
        metadata = cls(
            plugin_id=data['id'],
            name=data['name'],
            version=data['version'],
            description=data['description'],
            plugin_type=PluginType(data['plugin_type']),
            author=data.get('author'),
            website=data.get('website'),
            dependencies=data.get('dependencies', []),
            entrypoint=data.get('entrypoint'),
            config_schema=data.get('config_schema', {})
        )
        
        if 'status' in data:
            metadata.status = PluginStatus(data['status'])
        
        metadata.error = data.get('error')
        
        return metadata


class Plugin:
    """
    Represents a plugin in the system.
    """
    
    def __init__(self, metadata: PluginMetadata, module=None, instance=None):
        """
        Initialize a plugin.
        
        Args:
            metadata: Plugin metadata
            module: Optional plugin module
            instance: Optional plugin instance
        """
        self.metadata = metadata
        self.module = module
        self.instance = instance
        self.config = {}
    
    def configure(self, config: Dict[str, Any]) -> bool:
        """
        Configure the plugin.
        
        Args:
            config: Plugin configuration
            
        Returns:
            Configuration success
        """
        if self.instance is None:
            return False
        
        try:
            if hasattr(self.instance, 'configure') and callable(self.instance.configure):
                self.instance.configure(config)
            
            self.config = config
            return True
        
        except Exception as e:
            self.metadata.error = str(e)
            self.metadata.status = PluginStatus.ERROR
            return False
    
    def initialize(self) -> bool:
        """
        Initialize the plugin.
        
        Returns:
            Initialization success
        """
        if self.instance is None:
            return False
        
        try:
            if hasattr(self.instance, 'initialize') and callable(self.instance.initialize):
                self.instance.initialize()
            
            self.metadata.status = PluginStatus.ENABLED
            return True
        
        except Exception as e:
            self.metadata.error = str(e)
            self.metadata.status = PluginStatus.ERROR
            return False
    
    def shutdown(self) -> bool:
        """
        Shutdown the plugin.
        
        Returns:
            Shutdown success
        """
        if self.instance is None:
            return False
        
        try:
            if hasattr(self.instance, 'shutdown') and callable(self.instance.shutdown):
                self.instance.shutdown()
            
            self.metadata.status = PluginStatus.DISABLED
            return True
        
        except Exception as e:
            self.metadata.error = str(e)
            self.metadata.status = PluginStatus.ERROR
            return False


class PluginManager:
    """
    Manages plugins in the system.
    
    This class provides:
    - Plugin discovery and loading
    - Plugin configuration and initialization
    - Plugin lifecycle management
    - Plugin dependency resolution
    """
    
    def __init__(self, plugins_dir: Optional[str] = None, storage_dir: Optional[str] = None):
        """
        Initialize the plugin manager.
        
        Args:
            plugins_dir: Optional directory for plugin modules
            storage_dir: Optional directory for persistent storage
        """
        # Set up plugins directory
        if plugins_dir is None:
            plugins_dir = os.path.join(os.getcwd(), 'plugins')
        
        self.plugins_dir = plugins_dir
        os.makedirs(plugins_dir, exist_ok=True)
        
        # Set up storage directory
        if storage_dir is None:
            storage_dir = os.path.join(os.getcwd(), 'plugin_storage')
        
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        
        # Initialize logger
        self.logger = logging.getLogger('plugin_manager')
        
        # Initialize plugins
        self.plugins = {}  # plugin_id -> Plugin
        
        # Initialize hooks registry for event-based processing
        self.hooks = {}  # hook_name -> List[Callable]
        
        # Load existing data
        self._load_data()
    
    def _load_data(self) -> None:
        """Load existing data from storage."""
        # Load plugin metadata
        metadata_dir = os.path.join(self.storage_dir, 'metadata')
        if os.path.exists(metadata_dir):
            for filename in os.listdir(metadata_dir):
                if filename.endswith('.json'):
                    plugin_id = filename[:-5]  # Remove '.json'
                    metadata_path = os.path.join(metadata_dir, filename)
                    
                    try:
                        with open(metadata_path, 'r') as f:
                            metadata_dict = json.load(f)
                        
                        metadata = PluginMetadata.from_dict(metadata_dict)
                        
                        # Create plugin (without module/instance)
                        self.plugins[plugin_id] = Plugin(metadata=metadata)
                        
                        self.logger.info(f"Loaded plugin metadata: {metadata.name} (ID: {plugin_id})")
                    
                    except Exception as e:
                        self.logger.error(f"Error loading plugin metadata from {metadata_path}: {e}")
        
        # Load plugin configurations
        config_dir = os.path.join(self.storage_dir, 'config')
        if os.path.exists(config_dir):
            for filename in os.listdir(config_dir):
                if filename.endswith('.json'):
                    plugin_id = filename[:-5]  # Remove '.json'
                    config_path = os.path.join(config_dir, filename)
                    
                    if plugin_id in self.plugins:
                        try:
                            with open(config_path, 'r') as f:
                                config = json.load(f)
                            
                            self.plugins[plugin_id].config = config
                            
                            self.logger.info(f"Loaded plugin config: {plugin_id}")
                        
                        except Exception as e:
                            self.logger.error(f"Error loading plugin config from {config_path}: {e}")
    
    def _save_plugin_metadata(self, plugin: Plugin) -> None:
        """
        Save plugin metadata to storage.
        
        Args:
            plugin: Plugin to save metadata for
        """
        metadata_dir = os.path.join(self.storage_dir, 'metadata')
        os.makedirs(metadata_dir, exist_ok=True)
        
        metadata_path = os.path.join(metadata_dir, f"{plugin.metadata.id}.json")
        
        with open(metadata_path, 'w') as f:
            json.dump(plugin.metadata.to_dict(), f, indent=2)
    
    def _save_plugin_config(self, plugin: Plugin) -> None:
        """
        Save plugin configuration to storage.
        
        Args:
            plugin: Plugin to save configuration for
        """
        config_dir = os.path.join(self.storage_dir, 'config')
        os.makedirs(config_dir, exist_ok=True)
        
        config_path = os.path.join(config_dir, f"{plugin.metadata.id}.json")
        
        with open(config_path, 'w') as f:
            json.dump(plugin.config, f, indent=2)
    
    def discover_plugins(self) -> List[str]:
        """
        Discover plugins in the plugins directory.
        
        Returns:
            List of discovered plugin IDs
        """
        discovered_plugins = []
        
        # Check if plugins directory exists
        if not os.path.exists(self.plugins_dir):
            return discovered_plugins
        
        # Iterate through subdirectories in plugins directory
        for item in os.listdir(self.plugins_dir):
            plugin_dir = os.path.join(self.plugins_dir, item)
            
            # Skip non-directories
            if not os.path.isdir(plugin_dir):
                continue
            
            # Check for plugin manifest
            manifest_path = os.path.join(plugin_dir, 'plugin.json')
            
            if os.path.exists(manifest_path):
                try:
                    # Load manifest
                    with open(manifest_path, 'r') as f:
                        manifest = json.load(f)
                    
                    # Check required fields
                    if not all(k in manifest for k in ['id', 'name', 'version', 'description', 'type']):
                        self.logger.warning(f"Skipping plugin in {plugin_dir}: Missing required fields in manifest")
                        continue
                    
                    plugin_id = manifest['id']
                    
                    # Create plugin metadata
                    metadata = PluginMetadata(
                        plugin_id=plugin_id,
                        name=manifest['name'],
                        version=manifest['version'],
                        description=manifest['description'],
                        plugin_type=PluginType(manifest['type']),
                        author=manifest.get('author'),
                        website=manifest.get('website'),
                        dependencies=manifest.get('dependencies', []),
                        entrypoint=manifest.get('entrypoint', 'plugin'),
                        config_schema=manifest.get('config_schema', {})
                    )
                    
                    # Create plugin (without module/instance)
                    self.plugins[plugin_id] = Plugin(metadata=metadata)
                    
                    # Save metadata
                    self._save_plugin_metadata(self.plugins[plugin_id])
                    
                    discovered_plugins.append(plugin_id)
                    
                    self.logger.info(f"Discovered plugin: {metadata.name} (ID: {plugin_id})")
                
                except Exception as e:
                    self.logger.error(f"Error discovering plugin in {plugin_dir}: {e}")
        
        return discovered_plugins
    
    def load_plugin(self, plugin_id: str) -> bool:
        """
        Load a plugin module.
        
        Args:
            plugin_id: ID of the plugin to load
            
        Returns:
            Loading success
        """
        if plugin_id not in self.plugins:
            return False
        
        plugin = self.plugins[plugin_id]
        
        # Skip if already loaded
        if plugin.module is not None:
            return True
        
        try:
            # Get plugin directory path
            plugin_dir = os.path.join(self.plugins_dir, plugin_id)
            
            if not os.path.exists(plugin_dir):
                self.logger.error(f"Plugin directory not found: {plugin_dir}")
                return False
            
            # Add plugin directory to sys.path temporarily
            sys.path.insert(0, plugin_dir)
            
            # Load module
            module_name = plugin.metadata.entrypoint or 'plugin'
            
            if os.path.exists(os.path.join(plugin_dir, f"{module_name}.py")):
                # Load as file
                spec = importlib.util.spec_from_file_location(
                    module_name, 
                    os.path.join(plugin_dir, f"{module_name}.py")
                )
                
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
            else:
                # Load as package
                module = importlib.import_module(module_name)
            
            # Get plugin class
            plugin_class = None
            
            for name, obj in inspect.getmembers(module):
                if inspect.isclass(obj) and hasattr(obj, 'is_plugin') and obj.is_plugin:
                    plugin_class = obj
                    break
            
            if plugin_class is None:
                # Fallback: look for classes that inherit from a Plugin base class
                for name, obj in inspect.getmembers(module):
                    if inspect.isclass(obj) and name.endswith('Plugin'):
                        plugin_class = obj
                        break
            
            if plugin_class is None:
                self.logger.error(f"No plugin class found in {module_name}")
                return False
            
            # Create plugin instance
            instance = plugin_class()
            
            # Update plugin
            plugin.module = module
            plugin.instance = instance
            
            # Restore sys.path
            sys.path.remove(plugin_dir)
            
            self.logger.info(f"Loaded plugin module: {plugin.metadata.name} (ID: {plugin_id})")
            return True
        
        except Exception as e:
            # Restore sys.path if needed
            if plugin_dir in sys.path:
                sys.path.remove(plugin_dir)
            
            # Update plugin status
            plugin.metadata.status = PluginStatus.ERROR
            plugin.metadata.error = str(e)
            
            # Save metadata
            self._save_plugin_metadata(plugin)
            
            self.logger.error(f"Error loading plugin {plugin_id}: {e}")
            return False
    
    def initialize_plugin(self, plugin_id: str, config: Optional[Dict[str, Any]] = None) -> bool:
        """
        Initialize a plugin.
        
        Args:
            plugin_id: ID of the plugin to initialize
            config: Optional plugin configuration
            
        Returns:
            Initialization success
        """
        if plugin_id not in self.plugins:
            return False
        
        plugin = self.plugins[plugin_id]
        
        # Load plugin if not already loaded
        if plugin.module is None and not self.load_plugin(plugin_id):
            return False
        
        # Configure plugin if config provided
        if config is not None:
            if not plugin.configure(config):
                return False
            
            # Save config
            self._save_plugin_config(plugin)
        
        # Check dependencies
        for dependency_id in plugin.metadata.dependencies:
            if dependency_id not in self.plugins:
                plugin.metadata.error = f"Dependency not found: {dependency_id}"
                plugin.metadata.status = PluginStatus.ERROR
                
                # Save metadata
                self._save_plugin_metadata(plugin)
                
                self.logger.error(f"Plugin {plugin_id} is missing dependency: {dependency_id}")
                return False
            
            dep_plugin = self.plugins[dependency_id]
            
            if dep_plugin.metadata.status != PluginStatus.ENABLED:
                plugin.metadata.error = f"Dependency not enabled: {dependency_id}"
                plugin.metadata.status = PluginStatus.ERROR
                
                # Save metadata
                self._save_plugin_metadata(plugin)
                
                self.logger.error(f"Plugin {plugin_id} depends on disabled plugin: {dependency_id}")
                return False
        
        # Initialize plugin
        if not plugin.initialize():
            return False
        
        # Register hooks
        self._register_plugin_hooks(plugin)
        
        # Save metadata
        self._save_plugin_metadata(plugin)
        
        self.logger.info(f"Initialized plugin: {plugin.metadata.name} (ID: {plugin_id})")
        return True
    
    def _register_plugin_hooks(self, plugin: Plugin) -> None:
        """
        Register hooks provided by a plugin.
        
        Args:
            plugin: Plugin to register hooks for
        """
        if plugin.instance is None:
            return
        
        # Look for hook methods in the plugin instance
        for name, method in inspect.getmembers(plugin.instance, inspect.ismethod):
            if name.startswith('hook_'):
                hook_name = name[5:]  # Remove 'hook_' prefix
                
                # Initialize hook list if needed
                if hook_name not in self.hooks:
                    self.hooks[hook_name] = []
                
                # Add hook method
                self.hooks[hook_name].append(method)
                
                self.logger.info(f"Registered hook '{hook_name}' from plugin {plugin.metadata.id}")
    
    def shutdown_plugin(self, plugin_id: str) -> bool:
        """
        Shutdown a plugin.
        
        Args:
            plugin_id: ID of the plugin to shutdown
            
        Returns:
            Shutdown success
        """
        if plugin_id not in self.plugins:
            return False
        
        plugin = self.plugins[plugin_id]
        
        # Skip if not initialized
        if plugin.metadata.status != PluginStatus.ENABLED:
            return True
        
        # Check if other plugins depend on this one
        dependent_plugins = []
        
        for other_id, other_plugin in self.plugins.items():
            if other_id != plugin_id and plugin_id in other_plugin.metadata.dependencies:
                dependent_plugins.append(other_id)
        
        if dependent_plugins:
            plugin.metadata.error = f"Other plugins depend on this plugin: {', '.join(dependent_plugins)}"
            
            # Save metadata
            self._save_plugin_metadata(plugin)
            
            self.logger.error(f"Cannot shutdown plugin {plugin_id} because other plugins depend on it: {dependent_plugins}")
            return False
        
        # Unregister hooks
        self._unregister_plugin_hooks(plugin)
        
        # Shutdown plugin
        if not plugin.shutdown():
            return False
        
        # Save metadata
        self._save_plugin_metadata(plugin)
        
        self.logger.info(f"Shutdown plugin: {plugin.metadata.name} (ID: {plugin_id})")
        return True
    
    def _unregister_plugin_hooks(self, plugin: Plugin) -> None:
        """
        Unregister hooks provided by a plugin.
        
        Args:
            plugin: Plugin to unregister hooks for
        """
        if plugin.instance is None:
            return
        
        # Look for hook methods in the plugin instance
        for name, method in inspect.getmembers(plugin.instance, inspect.ismethod):
            if name.startswith('hook_'):
                hook_name = name[5:]  # Remove 'hook_' prefix
                
                # Remove hook method if registered
                if hook_name in self.hooks and method in self.hooks[hook_name]:
                    self.hooks[hook_name].remove(method)
                    
                    self.logger.info(f"Unregistered hook '{hook_name}' from plugin {plugin.metadata.id}")
    
    def unload_plugin(self, plugin_id: str) -> bool:
        """
        Unload a plugin module.
        
        Args:
            plugin_id: ID of the plugin to unload
            
        Returns:
            Unloading success
        """
        if plugin_id not in self.plugins:
            return False
        
        plugin = self.plugins[plugin_id]
        
        # Shutdown plugin if enabled
        if plugin.metadata.status == PluginStatus.ENABLED and not self.shutdown_plugin(plugin_id):
            return False
        
        # Clear module and instance
        plugin.module = None
        plugin.instance = None
        
        # Update status
        plugin.metadata.status = PluginStatus.DISABLED
        
        # Save metadata
        self._save_plugin_metadata(plugin)
        
        self.logger.info(f"Unloaded plugin: {plugin.metadata.name} (ID: {plugin_id})")
        return True
    
    def get_plugin(self, plugin_id: str) -> Optional[Plugin]:
        """
        Get a plugin by ID.
        
        Args:
            plugin_id: ID of the plugin
            
        Returns:
            Plugin or None if not found
        """
        return self.plugins.get(plugin_id)
    
    def get_plugin_metadata(self, plugin_id: str) -> Optional[Dict[str, Any]]:
        """
        Get plugin metadata by ID.
        
        Args:
            plugin_id: ID of the plugin
            
        Returns:
            Plugin metadata dictionary or None if not found
        """
        if plugin_id not in self.plugins:
            return None
        
        return self.plugins[plugin_id].metadata.to_dict()
    
    def list_plugins(self, plugin_type: Optional[Union[str, PluginType]] = None,
                  status: Optional[Union[str, PluginStatus]] = None) -> List[Dict[str, Any]]:
        """
        List plugins in the system.
        
        Args:
            plugin_type: Optional filter by plugin type
            status: Optional filter by status
            
        Returns:
            List of plugin metadata dictionaries
        """
        # Convert filters from strings if needed
        if isinstance(plugin_type, str):
            plugin_type = PluginType(plugin_type)
        
        if isinstance(status, str):
            status = PluginStatus(status)
        
        # Apply filters
        result = []
        
        for plugin in self.plugins.values():
            # Apply plugin type filter
            if plugin_type and plugin.metadata.plugin_type != plugin_type:
                continue
            
            # Apply status filter
            if status and plugin.metadata.status != status:
                continue
            
            # Add to result
            result.append(plugin.metadata.to_dict())
        
        return result
    
    def call_hook(self, hook_name: str, *args, **kwargs) -> List[Any]:
        """
        Call all registered hook methods for a specific hook.
        
        Args:
            hook_name: Name of the hook to call
            *args: Positional arguments to pass to the hook methods
            **kwargs: Keyword arguments to pass to the hook methods
            
        Returns:
            List of results from the hook methods
        """
        if hook_name not in self.hooks:
            return []
        
        results = []
        
        for hook_method in self.hooks[hook_name]:
            try:
                result = hook_method(*args, **kwargs)
                results.append(result)
            
            except Exception as e:
                self.logger.error(f"Error calling hook '{hook_name}': {e}")
        
        return results
    
    def call_plugin_method(self, plugin_id: str, method_name: str, *args, **kwargs) -> Any:
        """
        Call a method on a plugin instance.
        
        Args:
            plugin_id: ID of the plugin
            method_name: Name of the method to call
            *args: Positional arguments to pass to the method
            **kwargs: Keyword arguments to pass to the method
            
        Returns:
            Result of the method call or None if not found or error
        """
        if plugin_id not in self.plugins:
            return None
        
        plugin = self.plugins[plugin_id]
        
        if plugin.instance is None:
            return None
        
        if not hasattr(plugin.instance, method_name) or not callable(getattr(plugin.instance, method_name)):
            return None
        
        try:
            method = getattr(plugin.instance, method_name)
            return method(*args, **kwargs)
        
        except Exception as e:
            self.logger.error(f"Error calling method '{method_name}' on plugin {plugin_id}: {e}")
            return None
    
    def install_plugin(self, plugin_source: str) -> Optional[str]:
        """
        Install a plugin from a source (directory).
        
        Args:
            plugin_source: Source directory containing the plugin
            
        Returns:
            Plugin ID or None if installation failed
        """
        try:
            # Check if source exists
            if not os.path.exists(plugin_source) or not os.path.isdir(plugin_source):
                self.logger.error(f"Plugin source not found: {plugin_source}")
                return None
            
            # Check for plugin manifest
            manifest_path = os.path.join(plugin_source, 'plugin.json')
            
            if not os.path.exists(manifest_path):
                self.logger.error(f"Plugin manifest not found: {manifest_path}")
                return None
            
            # Load manifest
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
            
            # Check required fields
            if not all(k in manifest for k in ['id', 'name', 'version', 'description', 'type']):
                self.logger.error(f"Missing required fields in plugin manifest: {manifest_path}")
                return None
            
            plugin_id = manifest['id']
            
            # Check if plugin already exists
            if plugin_id in self.plugins:
                self.logger.error(f"Plugin already exists: {plugin_id}")
                return None
            
            # Create plugin directory
            plugin_dir = os.path.join(self.plugins_dir, plugin_id)
            
            if os.path.exists(plugin_dir):
                self.logger.error(f"Plugin directory already exists: {plugin_dir}")
                return None
            
            # Copy plugin files
            import shutil
            shutil.copytree(plugin_source, plugin_dir)
            
            # Create plugin metadata
            metadata = PluginMetadata(
                plugin_id=plugin_id,
                name=manifest['name'],
                version=manifest['version'],
                description=manifest['description'],
                plugin_type=PluginType(manifest['type']),
                author=manifest.get('author'),
                website=manifest.get('website'),
                dependencies=manifest.get('dependencies', []),
                entrypoint=manifest.get('entrypoint', 'plugin'),
                config_schema=manifest.get('config_schema', {})
            )
            
            # Create plugin (without module/instance)
            self.plugins[plugin_id] = Plugin(metadata=metadata)
            
            # Save metadata
            self._save_plugin_metadata(self.plugins[plugin_id])
            
            self.logger.info(f"Installed plugin: {metadata.name} (ID: {plugin_id})")
            return plugin_id
        
        except Exception as e:
            self.logger.error(f"Error installing plugin: {e}")
            return None
    
    def uninstall_plugin(self, plugin_id: str) -> bool:
        """
        Uninstall a plugin.
        
        Args:
            plugin_id: ID of the plugin to uninstall
            
        Returns:
            Uninstallation success
        """
        if plugin_id not in self.plugins:
            return False
        
        # Unload plugin if loaded
        if self.plugins[plugin_id].module is not None and not self.unload_plugin(plugin_id):
            return False
        
        # Check if other plugins depend on this one
        dependent_plugins = []
        
        for other_id, other_plugin in self.plugins.items():
            if other_id != plugin_id and plugin_id in other_plugin.metadata.dependencies:
                dependent_plugins.append(other_id)
        
        if dependent_plugins:
            self.logger.error(f"Cannot uninstall plugin {plugin_id} because other plugins depend on it: {dependent_plugins}")
            return False
        
        # Remove plugin files
        plugin_dir = os.path.join(self.plugins_dir, plugin_id)
        
        if os.path.exists(plugin_dir):
            try:
                import shutil
                shutil.rmtree(plugin_dir)
            except Exception as e:
                self.logger.error(f"Error removing plugin directory {plugin_dir}: {e}")
        
        # Remove plugin metadata
        metadata_path = os.path.join(self.storage_dir, 'metadata', f"{plugin_id}.json")
        
        if os.path.exists(metadata_path):
            try:
                os.remove(metadata_path)
            except Exception as e:
                self.logger.error(f"Error removing plugin metadata {metadata_path}: {e}")
        
        # Remove plugin config
        config_path = os.path.join(self.storage_dir, 'config', f"{plugin_id}.json")
        
        if os.path.exists(config_path):
            try:
                os.remove(config_path)
            except Exception as e:
                self.logger.error(f"Error removing plugin config {config_path}: {e}")
        
        # Remove from plugins dictionary
        del self.plugins[plugin_id]
        
        self.logger.info(f"Uninstalled plugin: {plugin_id}")
        return True
    
    def update_plugin(self, plugin_id: str, plugin_source: str) -> bool:
        """
        Update a plugin from a source (directory).
        
        Args:
            plugin_id: ID of the plugin to update
            plugin_source: Source directory containing the updated plugin
            
        Returns:
            Update success
        """
        if plugin_id not in self.plugins:
            return False
        
        # Unload plugin if loaded
        if self.plugins[plugin_id].module is not None and not self.unload_plugin(plugin_id):
            return False
        
        # Uninstall plugin
        if not self.uninstall_plugin(plugin_id):
            return False
        
        # Install updated plugin
        new_plugin_id = self.install_plugin(plugin_source)
        
        if new_plugin_id is None or new_plugin_id != plugin_id:
            self.logger.error(f"Failed to install updated plugin: {plugin_id}")
            return False
        
        self.logger.info(f"Updated plugin: {plugin_id}")
        return True
    
    def validate_plugin_dependencies(self) -> Dict[str, List[str]]:
        """
        Validate plugin dependencies.
        
        Returns:
            Dictionary mapping plugin IDs to lists of missing dependency IDs
        """
        missing_dependencies = {}
        
        for plugin_id, plugin in self.plugins.items():
            missing = []
            
            for dependency_id in plugin.metadata.dependencies:
                if dependency_id not in self.plugins:
                    missing.append(dependency_id)
            
            if missing:
                missing_dependencies[plugin_id] = missing
        
        return missing_dependencies
    
    def auto_configure_plugin(self, plugin_id: str) -> bool:
        """
        Automatically configure a plugin using default values from its config schema.
        
        Args:
            plugin_id: ID of the plugin to configure
            
        Returns:
            Configuration success
        """
        if plugin_id not in self.plugins:
            return False
        
        plugin = self.plugins[plugin_id]
        
        # Generate default configuration from schema
        config = {}
        
        if plugin.metadata.config_schema:
            schema = plugin.metadata.config_schema
            
            # Process properties
            for prop_name, prop_schema in schema.get('properties', {}).items():
                if 'default' in prop_schema:
                    config[prop_name] = prop_schema['default']
        
        # Configure plugin
        if config:
            if not plugin.configure(config):
                return False
            
            # Save config
            self._save_plugin_config(plugin)
        
        return True