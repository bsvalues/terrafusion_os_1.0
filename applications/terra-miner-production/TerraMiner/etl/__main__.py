"""
ETL plugin discovery and execution module.

This module provides functionality to automatically discover and run ETL plugins.
It can be run directly to execute all available ETL plugins or imported to 
access the plugin discovery functionality.
"""
import logging
import pkgutil
import importlib
import inspect
from typing import List, Type, Dict, Any

from etl.base import BaseETL

# Configure logger
logger = logging.getLogger(__name__)

def discover_plugins() -> List[Type[BaseETL]]:
    """
    Discover all available ETL plugins in the etl package.
    
    Returns:
        List[Type[BaseETL]]: List of ETL plugin classes that inherit from BaseETL
    """
    plugins = []
    package = 'etl'
    
    logger.info("Discovering ETL plugins...")
    
    # Iterate over all modules in the etl package
    for _, module_name, is_pkg in pkgutil.iter_modules([package]):
        # Skip the base module and __main__
        if module_name in ['base', '__main__']:
            continue
            
        # Import the module
        logger.debug(f"Inspecting module: {module_name}")
        try:
            module_path = f"{package}.{module_name}"
            module = importlib.import_module(module_path)
            
            # Look for classes that inherit from BaseETL
            for name, obj in inspect.getmembers(module):
                if (
                    inspect.isclass(obj) and 
                    issubclass(obj, BaseETL) and 
                    obj is not BaseETL
                ):
                    logger.info(f"Found ETL plugin: {name} in {module_path}")
                    plugins.append(obj)
                    
        except Exception as e:
            logger.error(f"Error loading module {module_name}: {str(e)}")
    
    if not plugins:
        logger.warning("No ETL plugins were discovered")
    else:
        logger.info(f"Discovered {len(plugins)} ETL plugins")
    
    return plugins

def get_plugin_by_name(name: str) -> Type[BaseETL]:
    """
    Get a specific ETL plugin class by name.
    
    Args:
        name (str): Name of the ETL plugin class
        
    Returns:
        Type[BaseETL]: The ETL plugin class
        
    Raises:
        ValueError: If no plugin with the specified name is found
    """
    plugins = discover_plugins()
    for plugin in plugins:
        if plugin.__name__ == name:
            return plugin
    
    raise ValueError(f"No ETL plugin found with name: {name}")

def create_plugin_instance(plugin_name: str, config: Dict[str, Any] = None) -> BaseETL:
    """
    Create an instance of an ETL plugin by name with optional configuration.
    
    Args:
        plugin_name (str): Name of the ETL plugin class
        config (Dict[str, Any], optional): Configuration options for the ETL plugin
        
    Returns:
        BaseETL: An instance of the ETL plugin
    """
    plugin_class = get_plugin_by_name(plugin_name)
    return plugin_class(config=config)

def run_plugin(plugin_name: str, config: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Run a specific ETL plugin by name with optional configuration.
    
    Args:
        plugin_name (str): Name of the ETL plugin to run
        config (Dict[str, Any], optional): Configuration for the ETL plugin
        
    Returns:
        Dict[str, Any]: Result of the ETL process
    """
    plugin = create_plugin_instance(plugin_name, config)
    logger.info(f"Running ETL plugin: {plugin_name}")
    return plugin.run()

def run_all_plugins():
    """Run all discovered ETL plugins with default configuration."""
    plugins = discover_plugins()
    results = []
    
    for plugin_class in plugins:
        try:
            plugin = plugin_class()
            logger.info(f"Running ETL plugin: {plugin_class.__name__}")
            result = plugin.run()
            results.append({
                "plugin": plugin_class.__name__,
                "result": result
            })
        except Exception as e:
            logger.exception(f"Error running ETL plugin {plugin_class.__name__}: {str(e)}")
            results.append({
                "plugin": plugin_class.__name__,
                "error": str(e)
            })
    
    return results

if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Run all plugins
    logger.info("Starting ETL plugin execution")
    results = run_all_plugins()
    
    # Report results
    success_count = sum(1 for r in results if r.get("result", {}).get("success", False))
    logger.info(f"ETL execution complete. {success_count}/{len(results)} plugins succeeded")