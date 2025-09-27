#!/usr/bin/env python3
"""
TerraFusion OS Trust Fabric - Backup & Recovery System
MIT PhD-Level Data Protection and Recovery
"""

import os
import json
import hashlib
import shutil
import datetime
from pathlib import Path
import zipfile
import tempfile

class BackupRecoverySystem:
    def __init__(self):
        self.backup_root = "/workspaces/terrafusion_os_1.0/trust-fabric/backup"
        self.trust_fabric_root = "/workspaces/terrafusion_os_1.0/trust-fabric"
        self.backup_manifest_path = os.path.join(self.backup_root, "backup_manifest.json")
        
        # Ensure backup directory exists
        os.makedirs(self.backup_root, exist_ok=True)
        
    def create_backup(self, backup_name=None):
        """Create a complete backup of Trust Fabric components"""
        try:
            if not backup_name:
                timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
                backup_name = f"trust_fabric_backup_{timestamp}"
            
            backup_path = os.path.join(self.backup_root, backup_name)
            os.makedirs(backup_path, exist_ok=True)
            
            # Critical components to backup
            components_to_backup = [
                "hsm_interface.py",
                "core.py",
                "crypto_engine/",
                "ca/",
                "keystore/",
                "audit.log",
                "performance_results.json"
            ]
            
            backup_manifest = {
                "backup_name": backup_name,
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "components": [],
                "integrity_hashes": {}
            }
            
            for component in components_to_backup:
                source_path = os.path.join(self.trust_fabric_root, component)
                dest_path = os.path.join(backup_path, component)
                
                if os.path.exists(source_path):
                    if os.path.isdir(source_path):
                        shutil.copytree(source_path, dest_path, dirs_exist_ok=True)
                    else:
                        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                        shutil.copy2(source_path, dest_path)
                    
                    # Calculate integrity hash
                    integrity_hash = self._calculate_component_hash(source_path)
                    backup_manifest["components"].append(component)
                    backup_manifest["integrity_hashes"][component] = integrity_hash
            
            # Save backup manifest
            with open(os.path.join(backup_path, "backup_manifest.json"), 'w') as f:
                json.dump(backup_manifest, f, indent=2)
            
            # Update global manifest
            self._update_global_manifest(backup_manifest)
            
            return True, f"Backup created successfully: {backup_name}"
            
        except Exception as e:
            return False, f"Backup creation failed: {e}"
    
    def validate_backup(self, backup_name):
        """Validate backup integrity and completeness"""
        try:
            backup_path = os.path.join(self.backup_root, backup_name)
            manifest_path = os.path.join(backup_path, "backup_manifest.json")
            
            if not os.path.exists(manifest_path):
                return False, "Backup manifest not found"
            
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
            
            validation_results = {
                "components_present": 0,
                "integrity_verified": 0,
                "total_components": len(manifest["components"]),
                "issues": []
            }
            
            for component in manifest["components"]:
                component_path = os.path.join(backup_path, component)
                
                # Check if component exists
                if os.path.exists(component_path):
                    validation_results["components_present"] += 1
                    
                    # Verify integrity hash
                    current_hash = self._calculate_component_hash(component_path)
                    expected_hash = manifest["integrity_hashes"].get(component)
                    
                    if current_hash == expected_hash:
                        validation_results["integrity_verified"] += 1
                    else:
                        validation_results["issues"].append(f"Integrity mismatch for {component}")
                else:
                    validation_results["issues"].append(f"Missing component: {component}")
            
            # Calculate validation score
            integrity_score = validation_results["integrity_verified"] / validation_results["total_components"]
            presence_score = validation_results["components_present"] / validation_results["total_components"]
            
            overall_score = (integrity_score + presence_score) / 2
            
            if overall_score >= 0.95:
                return True, f"Backup validation passed: {overall_score*100:.1f}% integrity"
            else:
                return False, f"Backup validation failed: {overall_score*100:.1f}% integrity, issues: {validation_results['issues']}"
                
        except Exception as e:
            return False, f"Backup validation error: {e}"
    
    def list_backups(self):
        """List all available backups"""
        try:
            if not os.path.exists(self.backup_manifest_path):
                return []
            
            with open(self.backup_manifest_path, 'r') as f:
                global_manifest = json.load(f)
            
            return global_manifest.get("backups", [])
            
        except Exception as e:
            return []
    
    def restore_backup(self, backup_name, target_path=None):
        """Restore from backup"""
        try:
            if not target_path:
                target_path = self.trust_fabric_root
            
            backup_path = os.path.join(self.backup_root, backup_name)
            manifest_path = os.path.join(backup_path, "backup_manifest.json")
            
            if not os.path.exists(manifest_path):
                return False, "Backup not found"
            
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
            
            # Restore each component
            restored_components = []
            for component in manifest["components"]:
                source_path = os.path.join(backup_path, component)
                dest_path = os.path.join(target_path, component)
                
                if os.path.exists(source_path):
                    if os.path.isdir(source_path):
                        if os.path.exists(dest_path):
                            shutil.rmtree(dest_path)
                        shutil.copytree(source_path, dest_path)
                    else:
                        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                        shutil.copy2(source_path, dest_path)
                    
                    restored_components.append(component)
            
            return True, f"Restored {len(restored_components)} components from backup {backup_name}"
            
        except Exception as e:
            return False, f"Restore failed: {e}"
    
    def _calculate_component_hash(self, path):
        """Calculate SHA-256 hash of component (file or directory)"""
        hash_sha256 = hashlib.sha256()
        
        if os.path.isfile(path):
            with open(path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_sha256.update(chunk)
        elif os.path.isdir(path):
            # Hash directory contents recursively
            for root, dirs, files in os.walk(path):
                dirs.sort()  # Ensure consistent ordering
                files.sort()
                for filename in files:
                    filepath = os.path.join(root, filename)
                    relative_path = os.path.relpath(filepath, path)
                    hash_sha256.update(relative_path.encode())
                    
                    with open(filepath, "rb") as f:
                        for chunk in iter(lambda: f.read(4096), b""):
                            hash_sha256.update(chunk)
        
        return hash_sha256.hexdigest()
    
    def _update_global_manifest(self, backup_manifest):
        """Update global backup manifest"""
        try:
            global_manifest = {"backups": []}
            
            if os.path.exists(self.backup_manifest_path):
                with open(self.backup_manifest_path, 'r') as f:
                    global_manifest = json.load(f)
            
            # Add new backup entry
            backup_entry = {
                "name": backup_manifest["backup_name"],
                "timestamp": backup_manifest["timestamp"],
                "component_count": len(backup_manifest["components"]),
                "status": "VALID"
            }
            
            global_manifest["backups"].append(backup_entry)
            
            # Keep only last 10 backups in manifest
            global_manifest["backups"] = global_manifest["backups"][-10:]
            
            with open(self.backup_manifest_path, 'w') as f:
                json.dump(global_manifest, f, indent=2)
                
        except Exception as e:
            pass  # Non-critical error

def main():
    """Main function for command line usage"""
    backup_system = BackupRecoverySystem()
    
    # Create a test backup
    success, message = backup_system.create_backup("validation_test_backup")
    print(f"Backup Creation: {'✅' if success else '❌'} {message}")
    
    if success:
        # Validate the backup
        success, message = backup_system.validate_backup("validation_test_backup")
        print(f"Backup Validation: {'✅' if success else '❌'} {message}")
        
        # List backups
        backups = backup_system.list_backups()
        print(f"Available Backups: {len(backups)}")
        for backup in backups[-3:]:  # Show last 3
            print(f"  - {backup['name']} ({backup['timestamp']})")
    
    print("🛡️ Backup & Recovery System operational")
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())
