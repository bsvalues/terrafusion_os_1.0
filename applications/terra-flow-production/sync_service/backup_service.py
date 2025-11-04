
import logging
import shutil
from datetime import datetime
from pathlib import Path
import json
import sqlite3
from typing import Optional

logger = logging.getLogger(__name__)

class BackupService:
    def __init__(self, backup_dir: str = "backups"):
        self.backup_dir = Path(backup_dir)
        self.backup_dir.mkdir(exist_ok=True)
        
    def create_backup(self, data: Any, metadata: Dict[str, Any]) -> str:
        """Create a backup with metadata
        
        Args:
            data: Data to backup
            metadata: Backup metadata
            
        Returns:
            Backup ID
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_id = f"backup_{timestamp}"
        
        backup_path = self.backup_dir / backup_id
        backup_path.mkdir()
        
        # Save data
        with open(backup_path / "data.json", "w") as f:
            json.dump(data, f)
            
        # Save metadata
        with open(backup_path / "metadata.json", "w") as f:
            json.dump({
                "backup_id": backup_id,
                "timestamp": timestamp,
                "metadata": metadata
            }, f)
            
        logger.info(f"Created backup {backup_id}")
        return backup_id
        
    def restore_backup(self, backup_id: str) -> Optional[Dict[str, Any]]:
        """Restore data from a backup
        
        Args:
            backup_id: ID of backup to restore
            
        Returns:
            Restored data or None if backup not found
        """
        backup_path = self.backup_dir / backup_id
        
        if not backup_path.exists():
            return None
            
        # Load data
        with open(backup_path / "data.json", "r") as f:
            data = json.load(f)
            
        logger.info(f"Restored backup {backup_id}")
        return data

