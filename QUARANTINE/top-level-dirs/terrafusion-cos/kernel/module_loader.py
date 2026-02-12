"""
TerraFusion cOS - Module Loader System
Auto-discovers and loads government modules from modules/government-core/

This is the core module loading system that makes cOS a complete operating system
by dynamically loading all 32+ government modules.
"""

import os
import json
import importlib.util
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class ModuleManifest:
    """Module manifest structure"""
    name: str
    version: str
    description: str
    type: str
    entry_point: str
    dependencies: List[str]
    capabilities: List[str]
    port: Optional[int] = None
    status: str = "available"


class ModuleLoader:
    """
    Dynamic Module Loader for TerraFusion cOS
    
    Scans modules/government-core/ directory and loads all available
    government modules into the operating system.
    """
    
    def __init__(self, workspace_root: Optional[str] = None):
        self.workspace_root = workspace_root or self._find_workspace_root()
        self.modules_path = Path(self.workspace_root) / "modules" / "government-core"
        self.loaded_modules: Dict[str, Any] = {}
        self.module_manifests: Dict[str, ModuleManifest] = {}
        
        logger.info(f"Module Loader initialized: {self.modules_path}")
    
    def _find_workspace_root(self) -> str:
        """Find TerraFusion workspace root"""
        current = Path.cwd()
        for _ in range(10):  # Search up to 10 levels
            if (current / "modules").exists():
                return str(current)
            if current.parent == current:
                break
            current = current.parent
        return str(Path.cwd())
    
    def discover_modules(self) -> List[str]:
        """
        Discover all available government modules
        
        Returns:
            List of module names found
        """
        logger.info("🔍 Discovering government modules...")
        
        if not self.modules_path.exists():
            logger.warning(f"Modules path not found: {self.modules_path}")
            return []
        
        modules = []
        for item in self.modules_path.iterdir():
            if item.is_dir() and not item.name.startswith('.'):
                # Check if it has a manifest or recognizable structure
                if self._is_valid_module(item):
                    modules.append(item.name)
                    logger.info(f"  ✅ Found module: {item.name}")
        
        logger.info(f"📦 Discovered {len(modules)} modules")
        return modules
    
    def _is_valid_module(self, module_path: Path) -> bool:
        """Check if directory is a valid module"""
        # Check for common module indicators
        indicators = [
            module_path / "package.json",
            module_path / "module.manifest.json",
            module_path / "README.md",
            module_path / "src",
            module_path / "frontend"
        ]
        return any(indicator.exists() for indicator in indicators)
    
    def load_module_manifest(self, module_name: str) -> Optional[ModuleManifest]:
        """
        Load module manifest file
        
        Args:
            module_name: Name of the module to load
            
        Returns:
            ModuleManifest object or None if not found
        """
        module_path = self.modules_path / module_name
        
        # Try different manifest file locations
        manifest_files = [
            module_path / "module.manifest.json",
            module_path / "package.json",
            module_path / "manifest.json"
        ]
        
        for manifest_file in manifest_files:
            if manifest_file.exists():
                try:
                    with open(manifest_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        return self._parse_manifest(module_name, data)
                except Exception as e:
                    logger.warning(f"Failed to parse manifest for {module_name}: {e}")
        
        # Create default manifest if none found
        return self._create_default_manifest(module_name)
    
    def _parse_manifest(self, module_name: str, data: Dict) -> ModuleManifest:
        """Parse manifest data into ModuleManifest object"""
        return ModuleManifest(
            name=data.get('name', module_name),
            version=data.get('version', '1.0.0'),
            description=data.get('description', f'{module_name} government module'),
            type=data.get('type', 'government'),
            entry_point=data.get('main', data.get('entryPoint', 'index.js')),
            dependencies=data.get('dependencies', []),
            capabilities=data.get('capabilities', []),
            port=data.get('port'),
            status='available'
        )
    
    def _create_default_manifest(self, module_name: str) -> ModuleManifest:
        """Create default manifest for module without manifest file"""
        return ModuleManifest(
            name=module_name,
            version='1.0.0',
            description=f'{module_name} government module',
            type='government',
            entry_point='index.js',
            dependencies=[],
            capabilities=['government-operations'],
            status='available'
        )
    
    def load_all_modules(self) -> Dict[str, ModuleManifest]:
        """
        Load all available government modules
        
        Returns:
            Dictionary of module_name: ModuleManifest
        """
        logger.info("📦 Loading all government modules...")
        
        modules = self.discover_modules()
        
        for module_name in modules:
            try:
                manifest = self.load_module_manifest(module_name)
                if manifest:
                    self.module_manifests[module_name] = manifest
                    logger.info(f"  ✅ Loaded: {manifest.name} v{manifest.version}")
            except Exception as e:
                logger.error(f"  ❌ Failed to load {module_name}: {e}")
        
        logger.info(f"✅ Loaded {len(self.module_manifests)} modules successfully")
        return self.module_manifests
    
    def get_module_info(self, module_name: str) -> Optional[ModuleManifest]:
        """Get information about a specific module"""
        return self.module_manifests.get(module_name)
    
    def get_all_modules(self) -> List[ModuleManifest]:
        """Get list of all loaded modules"""
        return list(self.module_manifests.values())
    
    def get_modules_by_type(self, module_type: str) -> List[ModuleManifest]:
        """Get modules filtered by type"""
        return [
            manifest for manifest in self.module_manifests.values()
            if manifest.type == module_type
        ]
    
    def get_module_status(self) -> Dict[str, Any]:
        """
        Get overall module loading status
        
        Returns:
            Status dictionary with module statistics
        """
        return {
            "total_discovered": len(self.module_manifests),
            "total_loaded": len([m for m in self.module_manifests.values() if m.status == "loaded"]),
            "total_available": len([m for m in self.module_manifests.values() if m.status == "available"]),
            "modules": {
                name: {
                    "name": manifest.name,
                    "version": manifest.version,
                    "status": manifest.status,
                    "type": manifest.type,
                    "capabilities": manifest.capabilities
                }
                for name, manifest in self.module_manifests.items()
            }
        }


# Singleton instance
_module_loader_instance: Optional[ModuleLoader] = None


def get_module_loader(workspace_root: Optional[str] = None) -> ModuleLoader:
    """Get the singleton module loader instance"""
    global _module_loader_instance
    if _module_loader_instance is None:
        _module_loader_instance = ModuleLoader(workspace_root)
    return _module_loader_instance


# CLI entry point for testing
if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    print("🏛️ TerraFusion cOS - Module Loader Test")
    print("=" * 60)
    
    loader = get_module_loader()
    modules = loader.load_all_modules()
    
    print(f"\n📊 Module Loading Complete:")
    print(f"   Total Modules: {len(modules)}")
    print(f"\n📋 Available Modules:")
    
    for name, manifest in modules.items():
        print(f"   ✅ {manifest.name} (v{manifest.version})")
        print(f"      Type: {manifest.type}")
        print(f"      Description: {manifest.description}")
        print()
    
    # Display status
    status = loader.get_module_status()
    print(f"\n🎯 Module System Status:")
    print(f"   Discovered: {status['total_discovered']}")
    print(f"   Available: {status['total_available']}")
    print(f"   Loaded: {status['total_loaded']}")

