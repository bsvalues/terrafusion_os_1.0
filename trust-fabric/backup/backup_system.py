#!/usr/bin/env python3
"""
Trust Fabric Backup System
Automated backup and recovery for cryptographic components
"""

import os
import shutil
import tarfile
import logging
import hashlib
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


class TrustFabricBackup:
    """Backup system for Trust Fabric components"""
    
    def __init__(self, backup_dir: str = "/workspaces/terrafusion_os_1.0/trust-fabric/backup"):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)
        self.logger = logging.getLogger(__name__)
        
        # Critical directories to backup
        self.critical_paths = [
            "/workspaces/terrafusion_os_1.0/trust-fabric/keys",
            "/workspaces/terrafusion_os_1.0/trust-fabric/crypto_engine",
            "/workspaces/terrafusion_os_1.0/trust-fabric/hsm_interface.py",
            "/workspaces/terrafusion_os_1.0/trust-fabric/tmp_bridge.py",
            "/workspaces/terrafusion_os_1.0/trust-fabric/audit.log"
        ]
    
    def create_backup(self, backup_name: Optional[str] = None) -> str:
        """Create full backup of Trust Fabric"""
        if not backup_name:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_name = f"trust_fabric_backup_{timestamp}"
        
        backup_path = self.backup_dir / f"{backup_name}.tar.gz"
        
        try:
            self.logger.info(f"Creating Trust Fabric backup: {backup_name}")
            
            with tarfile.open(backup_path, "w:gz") as tar:
                for path_str in self.critical_paths:
                    path = Path(path_str)
                    if path.exists():
                        if path.is_file():
                            tar.add(path, arcname=path.name)
                        else:
                            tar.add(path, arcname=path.name)
                        self.logger.info(f"Added to backup: {path}")
                    else:
                        self.logger.warning(f"Path not found, skipping: {path}")
            
            # Calculate backup hash
            backup_hash = self._calculate_file_hash(backup_path)
            hash_file = backup_path.with_suffix(".tar.gz.sha256")
            with open(hash_file, "w") as f:
                f.write(f"{backup_hash}  {backup_path.name}\n")
            
            self.logger.info(f"Backup created successfully: {backup_path}")
            self.logger.info(f"Backup hash: {backup_hash}")
            
            return str(backup_path)
            
        except Exception as e:
            self.logger.error(f"Backup creation failed: {e}")
            raise
    
    def restore_backup(self, backup_file: str, verify_hash: bool = True) -> bool:
        """Restore Trust Fabric from backup"""
        backup_path = Path(backup_file)
        
        if not backup_path.exists():
            self.logger.error(f"Backup file not found: {backup_path}")
            return False
        
        try:
            # Verify backup integrity
            if verify_hash:
                hash_file = backup_path.with_suffix(".tar.gz.sha256")
                if hash_file.exists():
                    with open(hash_file, "r") as f:
                        expected_hash = f.read().split()[0]
                    
                    actual_hash = self._calculate_file_hash(backup_path)
                    if actual_hash != expected_hash:
                        self.logger.error("Backup integrity check failed - hash mismatch")
                        return False
                    
                    self.logger.info("Backup integrity verified")
                else:
                    self.logger.warning("No hash file found - skipping integrity check")
            
            # Create restore directory
            restore_dir = self.backup_dir / "restore_temp"
            restore_dir.mkdir(exist_ok=True)
            
            # Extract backup
            self.logger.info(f"Restoring from backup: {backup_path}")
            with tarfile.open(backup_path, "r:gz") as tar:
                tar.extractall(restore_dir)
            
            # Copy restored files to their original locations
            trust_fabric_dir = Path("/workspaces/terrafusion_os_1.0/trust-fabric")
            
            for item in restore_dir.iterdir():
                if item.name == "keys":
                    dest = trust_fabric_dir / "keys"
                    if dest.exists():
                        shutil.rmtree(dest)
                    shutil.copytree(item, dest)
                    self.logger.info(f"Restored keys directory")
                
                elif item.name == "crypto_engine":
                    dest = trust_fabric_dir / "crypto_engine"
                    if dest.exists():
                        shutil.rmtree(dest)
                    shutil.copytree(item, dest)
                    self.logger.info(f"Restored crypto_engine directory")
                
                elif item.is_file():
                    dest = trust_fabric_dir / item.name
                    shutil.copy2(item, dest)
                    self.logger.info(f"Restored file: {item.name}")
            
            # Cleanup restore directory
            shutil.rmtree(restore_dir)
            
            self.logger.info("Trust Fabric restore completed successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Restore failed: {e}")
            return False
    
    def list_backups(self) -> List[Dict[str, str]]:
        """List available backups"""
        backups = []
        
        for backup_file in self.backup_dir.glob("trust_fabric_backup_*.tar.gz"):
            stat = backup_file.stat()
            hash_file = backup_file.with_suffix(".tar.gz.sha256")
            
            backup_info = {
                "name": backup_file.name,
                "path": str(backup_file),
                "size_mb": round(stat.st_size / 1024 / 1024, 2),
                "created": datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S"),
                "has_hash": hash_file.exists()
            }
            
            if hash_file.exists():
                with open(hash_file, "r") as f:
                    backup_info["hash"] = f.read().split()[0]
            
            backups.append(backup_info)
        
        # Sort by creation time (newest first)
        backups.sort(key=lambda x: x["created"], reverse=True)
        return backups
    
    def cleanup_old_backups(self, keep_count: int = 10) -> int:
        """Remove old backups, keeping only the most recent ones"""
        backups = self.list_backups()
        
        if len(backups) <= keep_count:
            self.logger.info(f"Only {len(backups)} backups found, no cleanup needed")
            return 0
        
        backups_to_remove = backups[keep_count:]
        removed_count = 0
        
        for backup in backups_to_remove:
            try:
                backup_path = Path(backup["path"])
                hash_file = backup_path.with_suffix(".tar.gz.sha256")
                
                backup_path.unlink()
                if hash_file.exists():
                    hash_file.unlink()
                
                self.logger.info(f"Removed old backup: {backup['name']}")
                removed_count += 1
                
            except Exception as e:
                self.logger.error(f"Failed to remove backup {backup['name']}: {e}")
        
        self.logger.info(f"Cleaned up {removed_count} old backups")
        return removed_count
    
    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA256 hash of file"""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    def verify_backup(self, backup_file: str) -> bool:
        """Verify backup integrity without restoring"""
        backup_path = Path(backup_file)
        hash_file = backup_path.with_suffix(".tar.gz.sha256")
        
        if not backup_path.exists():
            self.logger.error(f"Backup file not found: {backup_path}")
            return False
        
        if not hash_file.exists():
            self.logger.warning(f"Hash file not found: {hash_file}")
            return False
        
        try:
            with open(hash_file, "r") as f:
                expected_hash = f.read().split()[0]
            
            actual_hash = self._calculate_file_hash(backup_path)
            
            if actual_hash == expected_hash:
                self.logger.info(f"Backup verification successful: {backup_path.name}")
                return True
            else:
                self.logger.error(f"Backup verification failed: {backup_path.name}")
                return False
                
        except Exception as e:
            self.logger.error(f"Backup verification error: {e}")
            return False


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    backup_system = TrustFabricBackup()
    
    # Create a backup
    print("Creating Trust Fabric backup...")
    backup_file = backup_system.create_backup()
    print(f"✅ Backup created: {backup_file}")
    
    # List backups
    print("\n📋 Available backups:")
    backups = backup_system.list_backups()
    for backup in backups:
        status = "✅" if backup["has_hash"] else "⚠️"
        print(f"{status} {backup['name']} - {backup['size_mb']}MB - {backup['created']}")
    
    # Verify backup
    if backups:
        print(f"\n🔍 Verifying latest backup...")
        latest_backup = backups[0]["path"]
        if backup_system.verify_backup(latest_backup):
            print("✅ Backup verification passed")
        else:
            print("❌ Backup verification failed")
    
    print("\n💾 Trust Fabric backup system operational")
