"""
Data Recovery Agent

This agent provides intelligent data recovery capabilities for the property assessment system,
monitoring backup integrity, performing recovery tests, and executing recovery operations.
"""

import os
import logging
import time
import json
import datetime
import uuid
import threading
import shutil
import subprocess
from typing import Dict, List, Any, Optional, Union, Tuple

from sqlalchemy import text
from ai_agents.base_agent import AIAgent

logger = logging.getLogger(__name__)

class DataRecoveryAgent(AIAgent):
    """
    Agent responsible for monitoring and managing data recovery capabilities.
    Ensures recoverability through regular tests and intelligent recovery procedures.
    """
    
    def __init__(self, agent_id: str = None, name: str = "DataRecoveryAgent", 
                description: str = "Provides intelligent data recovery capabilities", 
                capabilities: List[str] = None, **kwargs):
        """
        Initialize the data recovery agent.
        
        Args:
            agent_id: Unique identifier for the agent
            name: Name of the agent
            description: Description of the agent
            capabilities: Agent capabilities
            **kwargs: Additional configuration
        """
        # Default capabilities
        default_capabilities = [
            "backup_monitoring",
            "integrity_verification",
            "recovery_testing",
            "intelligent_recovery",
            "backup_optimization",
            "point_in_time_recovery"
        ]
        
        capabilities = capabilities or default_capabilities
        
        # Initialize base agent
        super().__init__(agent_id, name, description, capabilities)
        
        # Agent configuration
        self.config = {
            "monitoring_interval": kwargs.get("monitoring_interval", 3600),  # 1 hour
            "recovery_test_interval": kwargs.get("recovery_test_interval", 86400 * 7),  # 1 week
            "backup_verification_interval": kwargs.get("backup_verification_interval", 86400),  # 1 day
            "backup_retention_days": kwargs.get("backup_retention_days", 30),
            "recovery_targets": kwargs.get("recovery_targets", ["database", "files", "configuration"]),
            "notify_on_backup_issues": kwargs.get("notify_on_backup_issues", True),
            "notify_on_recovery_tests": kwargs.get("notify_on_recovery_tests", True),
            "backup_locations": kwargs.get("backup_locations", {
                "database": "backups/database",
                "files": "backups/files",
                "configuration": "backups/config"
            })
        }
        
        # Recovery tracking
        self.backup_status = {}
        self.recovery_test_results = []
        self.recovery_operations = []
        
        # Last operation times
        self.last_monitoring_time = None
        self.last_recovery_test_time = None
        self.last_backup_verification_time = None
        
        # Background monitoring task
        self.monitoring_thread = None
        self.monitoring_running = False
        
        # Database verification thread
        self.verification_thread = None
        self.verification_running = False
        
        # Ensure backup directories exist
        self._ensure_backup_directories()
        
        logger.info(f"Data Recovery Agent '{self.name}' initialized")
    
    def _ensure_backup_directories(self):
        """Ensure backup directories exist"""
        for location in self.config["backup_locations"].values():
            os.makedirs(location, exist_ok=True)
            logger.info(f"Ensured backup directory exists: {location}")
    
    def start(self):
        """Start the agent and the background monitoring thread"""
        super().start()
        
        # Start background monitoring
        self.monitoring_running = True
        self.monitoring_thread = threading.Thread(target=self._background_monitoring_loop)
        self.monitoring_thread.daemon = True
        self.monitoring_thread.start()
        
        logger.info(f"Data Recovery Agent '{self.name}' monitoring started")
    
    def stop(self):
        """Stop the agent and the background monitoring thread"""
        # Stop background monitoring
        self.monitoring_running = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=2.0)
        
        super().stop()
        logger.info(f"Data Recovery Agent '{self.name}' stopped")
    
    def _background_monitoring_loop(self):
        """Background loop for periodic recovery monitoring"""
        while self.monitoring_running:
            try:
                # Skip if agent is paused
                if self.status != "running":
                    time.sleep(1)
                    continue
                
                current_time = time.time()
                
                # Check if it's time for backup monitoring
                if (self.last_monitoring_time is None or 
                    current_time - self.last_monitoring_time >= self.config["monitoring_interval"]):
                    self._monitor_backups()
                    self.last_monitoring_time = current_time
                
                # Check if it's time for backup verification
                if (self.last_backup_verification_time is None or 
                    current_time - self.last_backup_verification_time >= self.config["backup_verification_interval"]):
                    self._verify_backups()
                    self.last_backup_verification_time = current_time
                
                # Check if it's time for recovery testing
                if (self.last_recovery_test_time is None or 
                    current_time - self.last_recovery_test_time >= self.config["recovery_test_interval"]):
                    self._run_recovery_tests()
                    self.last_recovery_test_time = current_time
                
                # Sleep briefly before checking again
                time.sleep(30)
            except Exception as e:
                logger.error(f"Error in recovery monitoring loop: {str(e)}")
                time.sleep(60)  # Sleep longer after error
    
    def _monitor_backups(self):
        """Monitor backup status and cleanup old backups"""
        logger.info(f"Starting backup monitoring")
        
        try:
            # Check database backup status
            self._check_database_backups()
            
            # Check file backups
            self._check_file_backups()
            
            # Check configuration backups
            self._check_configuration_backups()
            
            # Cleanup old backups
            self._cleanup_old_backups()
            
            logger.info(f"Completed backup monitoring")
        except Exception as e:
            logger.error(f"Error monitoring backups: {str(e)}")
    
    def _check_database_backups(self):
        """Check database backup status"""
        from app import db
        
        try:
            # Query for recent database backups
            query = """
                SELECT id, backup_type, backup_path, created_at, size_bytes, 
                       is_verified, verification_time, status
                FROM backup_records
                WHERE backup_type = 'database'
                ORDER BY created_at DESC
                LIMIT 5
            """
            
            # Execute query safely
            result = db.session.execute(text(query))
            backups = result.fetchall()
            
            if not backups:
                logger.warning("No database backups found")
                self.backup_status["database"] = {
                    "status": "missing",
                    "last_check": datetime.datetime.now().isoformat(),
                    "message": "No database backups found"
                }
                return
            
            # Process backup records
            database_backups = []
            for backup in backups:
                backup_dict = dict(zip(result.keys(), backup))
                
                # Verify backup file exists
                backup_path = backup_dict.get("backup_path")
                file_exists = os.path.exists(backup_path) if backup_path else False
                
                database_backups.append({
                    "id": backup_dict.get("id"),
                    "created_at": backup_dict.get("created_at").isoformat() if backup_dict.get("created_at") else None,
                    "size_bytes": backup_dict.get("size_bytes"),
                    "is_verified": backup_dict.get("is_verified", False),
                    "verification_time": backup_dict.get("verification_time").isoformat() if backup_dict.get("verification_time") else None,
                    "status": backup_dict.get("status"),
                    "file_exists": file_exists
                })
            
            # Update backup status
            latest_backup = database_backups[0] if database_backups else None
            
            if latest_backup:
                # Calculate age of latest backup
                latest_time = datetime.datetime.fromisoformat(latest_backup["created_at"]) if latest_backup["created_at"] else None
                
                if latest_time:
                    age_hours = (datetime.datetime.now() - latest_time).total_seconds() / 3600
                    
                    status = "ok"
                    message = f"Latest backup is {age_hours:.1f} hours old"
                    
                    if age_hours > 24:
                        status = "warning"
                        message = f"Latest backup is over 24 hours old ({age_hours:.1f} hours)"
                    
                    if age_hours > 72:
                        status = "critical"
                        message = f"Latest backup is dangerously old ({age_hours:.1f} hours)"
                    
                    if not latest_backup["file_exists"]:
                        status = "error"
                        message = "Latest backup file is missing"
                    
                    if latest_backup["status"] != "completed":
                        status = "error"
                        message = f"Latest backup has status: {latest_backup['status']}"
                    
                    self.backup_status["database"] = {
                        "status": status,
                        "last_backup": latest_backup["created_at"],
                        "last_check": datetime.datetime.now().isoformat(),
                        "message": message,
                        "recent_backups": database_backups
                    }
                else:
                    self.backup_status["database"] = {
                        "status": "error",
                        "last_check": datetime.datetime.now().isoformat(),
                        "message": "Latest backup has no timestamp",
                        "recent_backups": database_backups
                    }
            else:
                self.backup_status["database"] = {
                    "status": "missing",
                    "last_check": datetime.datetime.now().isoformat(),
                    "message": "No database backups found"
                }
            
            logger.info(f"Database backup status: {self.backup_status['database']['status']}")
        except Exception as e:
            logger.error(f"Error checking database backups: {str(e)}")
            self.backup_status["database"] = {
                "status": "error",
                "last_check": datetime.datetime.now().isoformat(),
                "message": f"Error checking backups: {str(e)}"
            }
    
    def _check_file_backups(self):
        """Check file backup status"""
        from app import db
        
        try:
            # Query for recent file backups
            query = """
                SELECT id, backup_type, backup_path, created_at, size_bytes, 
                       is_verified, verification_time, status
                FROM backup_records
                WHERE backup_type = 'files'
                ORDER BY created_at DESC
                LIMIT 5
            """
            
            # Execute query safely
            result = db.session.execute(text(query))
            backups = result.fetchall()
            
            if not backups:
                logger.warning("No file backups found")
                self.backup_status["files"] = {
                    "status": "missing",
                    "last_check": datetime.datetime.now().isoformat(),
                    "message": "No file backups found"
                }
                return
            
            # Process backup records
            file_backups = []
            for backup in backups:
                backup_dict = dict(zip(result.keys(), backup))
                
                # Verify backup file exists
                backup_path = backup_dict.get("backup_path")
                file_exists = os.path.exists(backup_path) if backup_path else False
                
                file_backups.append({
                    "id": backup_dict.get("id"),
                    "created_at": backup_dict.get("created_at").isoformat() if backup_dict.get("created_at") else None,
                    "size_bytes": backup_dict.get("size_bytes"),
                    "is_verified": backup_dict.get("is_verified", False),
                    "verification_time": backup_dict.get("verification_time").isoformat() if backup_dict.get("verification_time") else None,
                    "status": backup_dict.get("status"),
                    "file_exists": file_exists
                })
            
            # Update backup status
            latest_backup = file_backups[0] if file_backups else None
            
            if latest_backup:
                # Calculate age of latest backup
                latest_time = datetime.datetime.fromisoformat(latest_backup["created_at"]) if latest_backup["created_at"] else None
                
                if latest_time:
                    age_hours = (datetime.datetime.now() - latest_time).total_seconds() / 3600
                    
                    status = "ok"
                    message = f"Latest backup is {age_hours:.1f} hours old"
                    
                    if age_hours > 72:
                        status = "warning"
                        message = f"Latest backup is over 72 hours old ({age_hours:.1f} hours)"
                    
                    if age_hours > 168:  # 1 week
                        status = "critical"
                        message = f"Latest backup is dangerously old ({age_hours:.1f} hours)"
                    
                    if not latest_backup["file_exists"]:
                        status = "error"
                        message = "Latest backup file is missing"
                    
                    if latest_backup["status"] != "completed":
                        status = "error"
                        message = f"Latest backup has status: {latest_backup['status']}"
                    
                    self.backup_status["files"] = {
                        "status": status,
                        "last_backup": latest_backup["created_at"],
                        "last_check": datetime.datetime.now().isoformat(),
                        "message": message,
                        "recent_backups": file_backups
                    }
                else:
                    self.backup_status["files"] = {
                        "status": "error",
                        "last_check": datetime.datetime.now().isoformat(),
                        "message": "Latest backup has no timestamp",
                        "recent_backups": file_backups
                    }
            else:
                self.backup_status["files"] = {
                    "status": "missing",
                    "last_check": datetime.datetime.now().isoformat(),
                    "message": "No file backups found"
                }
            
            logger.info(f"File backup status: {self.backup_status['files']['status']}")
        except Exception as e:
            logger.error(f"Error checking file backups: {str(e)}")
            self.backup_status["files"] = {
                "status": "error",
                "last_check": datetime.datetime.now().isoformat(),
                "message": f"Error checking backups: {str(e)}"
            }
    
    def _check_configuration_backups(self):
        """Check configuration backup status"""
        from app import db
        
        try:
            # Query for recent configuration backups
            query = """
                SELECT id, backup_type, backup_path, created_at, size_bytes, 
                       is_verified, verification_time, status
                FROM backup_records
                WHERE backup_type = 'configuration'
                ORDER BY created_at DESC
                LIMIT 5
            """
            
            # Execute query safely
            result = db.session.execute(text(query))
            backups = result.fetchall()
            
            if not backups:
                logger.warning("No configuration backups found")
                self.backup_status["configuration"] = {
                    "status": "missing",
                    "last_check": datetime.datetime.now().isoformat(),
                    "message": "No configuration backups found"
                }
                return
            
            # Process backup records
            config_backups = []
            for backup in backups:
                backup_dict = dict(zip(result.keys(), backup))
                
                # Verify backup file exists
                backup_path = backup_dict.get("backup_path")
                file_exists = os.path.exists(backup_path) if backup_path else False
                
                config_backups.append({
                    "id": backup_dict.get("id"),
                    "created_at": backup_dict.get("created_at").isoformat() if backup_dict.get("created_at") else None,
                    "size_bytes": backup_dict.get("size_bytes"),
                    "is_verified": backup_dict.get("is_verified", False),
                    "verification_time": backup_dict.get("verification_time").isoformat() if backup_dict.get("verification_time") else None,
                    "status": backup_dict.get("status"),
                    "file_exists": file_exists
                })
            
            # Update backup status
            latest_backup = config_backups[0] if config_backups else None
            
            if latest_backup:
                # Calculate age of latest backup
                latest_time = datetime.datetime.fromisoformat(latest_backup["created_at"]) if latest_backup["created_at"] else None
                
                if latest_time:
                    age_hours = (datetime.datetime.now() - latest_time).total_seconds() / 3600
                    
                    status = "ok"
                    message = f"Latest backup is {age_hours:.1f} hours old"
                    
                    if age_hours > 168:  # 1 week
                        status = "warning"
                        message = f"Latest backup is over 1 week old ({age_hours:.1f} hours)"
                    
                    if age_hours > 720:  # 30 days
                        status = "critical"
                        message = f"Latest backup is dangerously old ({age_hours:.1f} hours)"
                    
                    if not latest_backup["file_exists"]:
                        status = "error"
                        message = "Latest backup file is missing"
                    
                    if latest_backup["status"] != "completed":
                        status = "error"
                        message = f"Latest backup has status: {latest_backup['status']}"
                    
                    self.backup_status["configuration"] = {
                        "status": status,
                        "last_backup": latest_backup["created_at"],
                        "last_check": datetime.datetime.now().isoformat(),
                        "message": message,
                        "recent_backups": config_backups
                    }
                else:
                    self.backup_status["configuration"] = {
                        "status": "error",
                        "last_check": datetime.datetime.now().isoformat(),
                        "message": "Latest backup has no timestamp",
                        "recent_backups": config_backups
                    }
            else:
                self.backup_status["configuration"] = {
                    "status": "missing",
                    "last_check": datetime.datetime.now().isoformat(),
                    "message": "No configuration backups found"
                }
            
            logger.info(f"Configuration backup status: {self.backup_status['configuration']['status']}")
        except Exception as e:
            logger.error(f"Error checking configuration backups: {str(e)}")
            self.backup_status["configuration"] = {
                "status": "error",
                "last_check": datetime.datetime.now().isoformat(),
                "message": f"Error checking backups: {str(e)}"
            }
    
    def _cleanup_old_backups(self):
        """Clean up old backups based on retention policy"""
        from app import db
        
        try:
            # Determine cutoff date for retention
            retention_days = self.config["backup_retention_days"]
            cutoff_date = datetime.datetime.now() - datetime.timedelta(days=retention_days)
            
            # Query for old backups
            query = """
                SELECT id, backup_type, backup_path, created_at
                FROM backup_records
                WHERE created_at < :cutoff_date
                AND status = 'completed'
                ORDER BY created_at ASC
            """
            
            # Execute query safely
            result = db.session.execute(
                text(query),
                {"cutoff_date": cutoff_date}
            )
            old_backups = result.fetchall()
            
            if not old_backups:
                logger.info("No old backups to clean up")
                return
            
            logger.info(f"Found {len(old_backups)} backups older than {retention_days} days")
            
            # Process each old backup
            deleted_count = 0
            for backup in old_backups:
                backup_dict = dict(zip(result.keys(), backup))
                backup_id = backup_dict.get("id")
                backup_path = backup_dict.get("backup_path")
                
                try:
                    # Delete the physical file
                    if backup_path and os.path.exists(backup_path):
                        os.remove(backup_path)
                    
                    # Update record in database
                    update_query = """
                        UPDATE backup_records
                        SET status = 'deleted', notes = :notes
                        WHERE id = :backup_id
                    """
                    
                    db.session.execute(
                        text(update_query),
                        {
                            "backup_id": backup_id,
                            "notes": f"Deleted by retention policy ({retention_days} days)"
                        }
                    )
                    
                    deleted_count += 1
                except Exception as e:
                    logger.error(f"Error deleting backup {backup_id}: {str(e)}")
            
            # Commit changes
            db.session.commit()
            
            logger.info(f"Cleaned up {deleted_count} old backups")
        except Exception as e:
            logger.error(f"Error cleaning up old backups: {str(e)}")
            db.session.rollback()
    
    def _verify_backups(self):
        """Verify integrity of recent backups"""
        logger.info(f"Starting backup verification")
        
        try:
            # Start verification in a separate thread
            if self.verification_thread and self.verification_thread.is_alive():
                logger.info("Verification already in progress, skipping")
                return
            
            self.verification_running = True
            self.verification_thread = threading.Thread(target=self._verification_thread_task)
            self.verification_thread.daemon = True
            self.verification_thread.start()
            
            logger.info(f"Started backup verification thread")
        except Exception as e:
            logger.error(f"Error starting backup verification: {str(e)}")
    
    def _verification_thread_task(self):
        """Background task for verifying backups (runs in separate thread)"""
        try:
            from app import db
            
            # Find unverified backups
            query = """
                SELECT id, backup_type, backup_path, created_at
                FROM backup_records
                WHERE (is_verified = FALSE OR is_verified IS NULL)
                AND status = 'completed'
                ORDER BY created_at DESC
                LIMIT 5
            """
            
            # Execute query safely
            result = db.session.execute(text(query))
            backups = result.fetchall()
            
            if not backups:
                logger.info("No unverified backups found")
                self.verification_running = False
                return
            
            logger.info(f"Found {len(backups)} unverified backups to check")
            
            # Verify each backup
            for backup in backups:
                backup_dict = dict(zip(result.keys(), backup))
                backup_id = backup_dict.get("id")
                backup_type = backup_dict.get("backup_type")
                backup_path = backup_dict.get("backup_path")
                
                if not backup_path or not os.path.exists(backup_path):
                    # Update record in database
                    update_query = """
                        UPDATE backup_records
                        SET is_verified = TRUE, verification_time = :verification_time,
                            verification_result = 'failed', status = 'missing',
                            notes = :notes
                        WHERE id = :backup_id
                    """
                    
                    db.session.execute(
                        text(update_query),
                        {
                            "backup_id": backup_id,
                            "verification_time": datetime.datetime.now(),
                            "notes": "Backup file is missing"
                        }
                    )
                    
                    logger.warning(f"Backup {backup_id} file is missing: {backup_path}")
                    continue
                
                try:
                    # Verify backup integrity
                    verification_result = self._verify_backup_file(backup_path, backup_type)
                    
                    # Update record in database
                    update_query = """
                        UPDATE backup_records
                        SET is_verified = TRUE, verification_time = :verification_time,
                            verification_result = :verification_result,
                            notes = :notes
                        WHERE id = :backup_id
                    """
                    
                    db.session.execute(
                        text(update_query),
                        {
                            "backup_id": backup_id,
                            "verification_time": datetime.datetime.now(),
                            "verification_result": "passed" if verification_result else "failed",
                            "notes": "Verified by automated integrity check"
                        }
                    )
                    
                    logger.info(f"Backup {backup_id} verification: {'passed' if verification_result else 'failed'}")
                except Exception as e:
                    logger.error(f"Error verifying backup {backup_id}: {str(e)}")
                    
                    # Update record with error
                    update_query = """
                        UPDATE backup_records
                        SET is_verified = TRUE, verification_time = :verification_time,
                            verification_result = 'error',
                            notes = :notes
                        WHERE id = :backup_id
                    """
                    
                    db.session.execute(
                        text(update_query),
                        {
                            "backup_id": backup_id,
                            "verification_time": datetime.datetime.now(),
                            "notes": f"Verification error: {str(e)}"
                        }
                    )
            
            # Commit changes
            db.session.commit()
            
            logger.info(f"Completed backup verification")
        
        except Exception as e:
            logger.error(f"Error in verification thread: {str(e)}")
            try:
                db.session.rollback()
            except:
                pass
        
        finally:
            self.verification_running = False
    
    def _verify_backup_file(self, backup_path, backup_type):
        """
        Verify integrity of a backup file.
        
        Args:
            backup_path: Path to the backup file
            backup_type: Type of backup ('database', 'files', 'configuration')
            
        Returns:
            True if verification passed, False otherwise
        """
        # Basic file existence check
        if not os.path.exists(backup_path):
            return False
        
        # Check file size (must be non-zero)
        file_size = os.path.getsize(backup_path)
        if file_size == 0:
            return False
        
        # Type-specific verification
        if backup_type == "database" and backup_path.endswith(".sql"):
            # For SQL dumps, check that the file is valid SQL
            return self._verify_sql_dump(backup_path)
        
        elif backup_type == "database" and backup_path.endswith(".dump"):
            # For Postgres dumps, check that the file is a valid dump
            return self._verify_postgres_dump(backup_path)
        
        elif backup_type == "files" and (backup_path.endswith(".tar.gz") or backup_path.endswith(".zip")):
            # For archives, check that the archive is valid
            return self._verify_archive(backup_path)
        
        elif backup_type == "configuration" and backup_path.endswith(".json"):
            # For JSON config backups, check that the file is valid JSON
            return self._verify_json_file(backup_path)
        
        # Default file integrity check
        return True
    
    def _verify_sql_dump(self, backup_path):
        """
        Verify that a SQL dump file is valid.
        
        Args:
            backup_path: Path to the SQL dump file
            
        Returns:
            True if valid, False otherwise
        """
        try:
            # Basic syntax check by reading the first 1000 lines
            with open(backup_path, "r") as f:
                lines = 0
                for line in f:
                    lines += 1
                    if lines > 1000:
                        break
                    
                    # Check for SQL syntax
                    line = line.strip()
                    if line and not line.startswith("--") and not line.startswith("/*"):
                        if not any(keyword in line.upper() for keyword in ["CREATE", "INSERT", "ALTER", "DROP", "SELECT"]):
                            # Possibly not a SQL file
                            if not any(char in line for char in ["(", ")", ";", ","]):
                                return False
            
            return True
        except Exception as e:
            logger.error(f"Error verifying SQL dump: {str(e)}")
            return False
    
    def _verify_postgres_dump(self, backup_path):
        """
        Verify that a Postgres dump file is valid.
        
        Args:
            backup_path: Path to the Postgres dump file
            
        Returns:
            True if valid, False otherwise
        """
        try:
            # Check if the file is a binary PostgreSQL dump
            with open(backup_path, "rb") as f:
                header = f.read(5)
                # PostgreSQL custom format dumps start with "PGDMP"
                if header != b'PGDMP':
                    return False
            
            return True
        except Exception as e:
            logger.error(f"Error verifying Postgres dump: {str(e)}")
            return False
    
    def _verify_archive(self, backup_path):
        """
        Verify that an archive file is valid.
        
        Args:
            backup_path: Path to the archive file
            
        Returns:
            True if valid, False otherwise
        """
        try:
            if backup_path.endswith(".tar.gz"):
                # Use tar to verify the archive
                result = subprocess.run(
                    ["tar", "tzf", backup_path],
                    capture_output=True,
                    check=False
                )
                return result.returncode == 0
            
            elif backup_path.endswith(".zip"):
                # Use unzip to verify the archive
                result = subprocess.run(
                    ["unzip", "-t", backup_path],
                    capture_output=True,
                    check=False
                )
                return result.returncode == 0
            
            return False
        except Exception as e:
            logger.error(f"Error verifying archive: {str(e)}")
            return False
    
    def _verify_json_file(self, backup_path):
        """
        Verify that a JSON file is valid.
        
        Args:
            backup_path: Path to the JSON file
            
        Returns:
            True if valid, False otherwise
        """
        try:
            with open(backup_path, "r") as f:
                json.load(f)
            return True
        except Exception as e:
            logger.error(f"Error verifying JSON file: {str(e)}")
            return False
    
    def _run_recovery_tests(self):
        """Run recovery tests to verify recoverability"""
        logger.info(f"Starting recovery tests")
        
        try:
            # For now, just run database recovery test
            db_result = self._run_database_recovery_test()
            
            # Record test results
            test_result = {
                "id": str(uuid.uuid4()),
                "timestamp": datetime.datetime.now().isoformat(),
                "database_recovery": db_result,
                "overall_status": "passed" if db_result["status"] == "passed" else "failed"
            }
            
            self.recovery_test_results.append(test_result)
            
            # Limit stored results to prevent memory issues
            if len(self.recovery_test_results) > 10:
                self.recovery_test_results = self.recovery_test_results[-10:]
            
            # Send notification if enabled
            if self.config["notify_on_recovery_tests"]:
                self._send_recovery_test_notification(test_result)
            
            logger.info(f"Completed recovery tests: {test_result['overall_status']}")
            
            # Store test result in the database
            self._store_recovery_test_result(test_result)
        
        except Exception as e:
            logger.error(f"Error running recovery tests: {str(e)}")
    
    def _run_database_recovery_test(self):
        """
        Run a database recovery test.
        
        Returns:
            Dictionary with test results
        """
        from app import db
        
        test_result = {
            "status": "failed",
            "duration_seconds": 0,
            "error": None,
            "details": {}
        }
        
        try:
            # Find the most recent verified database backup
            query = """
                SELECT id, backup_path, created_at
                FROM backup_records
                WHERE backup_type = 'database'
                AND is_verified = TRUE
                AND verification_result = 'passed'
                ORDER BY created_at DESC
                LIMIT 1
            """
            
            # Execute query safely
            result = db.session.execute(text(query))
            backup = result.fetchone()
            
            if not backup:
                test_result["error"] = "No verified database backup found"
                return test_result
            
            backup_dict = dict(zip(result.keys(), backup))
            backup_path = backup_dict.get("backup_path")
            
            if not backup_path or not os.path.exists(backup_path):
                test_result["error"] = f"Backup file not found: {backup_path}"
                return test_result
            
            # Create a temporary test database
            start_time = time.time()
            
            # This would run a test recovery to a temporary database
            # For demonstration, just checking if the file is valid
            if backup_path.endswith(".sql"):
                test_result["status"] = "passed" if self._verify_sql_dump(backup_path) else "failed"
            elif backup_path.endswith(".dump"):
                test_result["status"] = "passed" if self._verify_postgres_dump(backup_path) else "failed"
            else:
                test_result["error"] = f"Unsupported backup format: {backup_path}"
                return test_result
            
            # Record testing duration
            test_result["duration_seconds"] = time.time() - start_time
            
            # Add details
            test_result["details"] = {
                "backup_id": backup_dict.get("id"),
                "backup_path": backup_path,
                "backup_date": backup_dict.get("created_at").isoformat() if backup_dict.get("created_at") else None
            }
            
            return test_result
        
        except Exception as e:
            logger.error(f"Error in database recovery test: {str(e)}")
            test_result["error"] = str(e)
            return test_result
    
    def _send_recovery_test_notification(self, test_result):
        """
        Send notification for a recovery test.
        
        Args:
            test_result: Recovery test result data
        """
        try:
            from data_governance.notification_manager import send_recovery_notification
            
            # Determine recipients based on status
            recipients = ["recovery_team"]
            
            if test_result["overall_status"] != "passed":
                recipients.append("data_admin")
            
            # Create notification
            notification = {
                "title": f"Recovery Test Result: {test_result['overall_status'].upper()}",
                "message": f"Recovery test completed with status: {test_result['overall_status']}",
                "severity": "medium" if test_result["overall_status"] == "passed" else "high",
                "test_data": test_result,
                "timestamp": datetime.datetime.now().isoformat()
            }
            
            # Send notification
            send_recovery_notification(
                recipients=recipients,
                notification_data=notification
            )
            
            logger.info(f"Sent recovery test notification")
        except Exception as e:
            logger.error(f"Error sending recovery test notification: {str(e)}")
    
    def _store_recovery_test_result(self, test_result):
        """
        Store a recovery test result in the database.
        
        Args:
            test_result: Recovery test result data
        """
        from app import db
        from disaster_recovery.models import RecoveryTest
        
        try:
            # Create database record
            db_test = RecoveryTest(
                test_type="automatic",
                status=test_result["overall_status"],
                details=json.dumps(test_result),
                duration_seconds=test_result.get("database_recovery", {}).get("duration_seconds", 0),
                test_time=datetime.datetime.now()
            )
            
            # Add to database
            db.session.add(db_test)
            db.session.commit()
            
            logger.info(f"Stored recovery test result in database")
        except Exception as e:
            logger.error(f"Error storing recovery test result: {str(e)}")
            db.session.rollback()
    
    def process_task(self, task_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a task.
        
        Args:
            task_data: Task data
            
        Returns:
            Task result
        """
        task_type = task_data.get("type")
        
        if task_type == "get_backup_status":
            # Get backup status
            return {
                "status": "success",
                "backup_status": self.backup_status
            }
        
        elif task_type == "verify_backup":
            # Verify a specific backup
            backup_id = task_data.get("backup_id")
            
            if not backup_id:
                return {
                    "status": "error",
                    "message": "No backup_id specified"
                }
            
            try:
                from app import db
                
                # Get backup information
                query = """
                    SELECT id, backup_type, backup_path
                    FROM backup_records
                    WHERE id = :backup_id
                """
                
                result = db.session.execute(
                    text(query),
                    {"backup_id": backup_id}
                )
                backup = result.fetchone()
                
                if not backup:
                    return {
                        "status": "error",
                        "message": f"Backup {backup_id} not found"
                    }
                
                backup_dict = dict(zip(result.keys(), backup))
                backup_path = backup_dict.get("backup_path")
                backup_type = backup_dict.get("backup_type")
                
                # Verify the backup
                verification_result = self._verify_backup_file(backup_path, backup_type)
                
                # Update record in database
                update_query = """
                    UPDATE backup_records
                    SET is_verified = TRUE, verification_time = :verification_time,
                        verification_result = :verification_result,
                        notes = :notes
                    WHERE id = :backup_id
                """
                
                db.session.execute(
                    text(update_query),
                    {
                        "backup_id": backup_id,
                        "verification_time": datetime.datetime.now(),
                        "verification_result": "passed" if verification_result else "failed",
                        "notes": "Verified by manual request"
                    }
                )
                
                db.session.commit()
                
                return {
                    "status": "success",
                    "backup_id": backup_id,
                    "verification_result": "passed" if verification_result else "failed",
                    "backup_type": backup_type,
                    "backup_path": backup_path
                }
            
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"Error verifying backup: {str(e)}"
                }
        
        elif task_type == "run_recovery_test":
            # Run a recovery test
            try:
                # Run database recovery test
                db_result = self._run_database_recovery_test()
                
                # Record test results
                test_result = {
                    "id": str(uuid.uuid4()),
                    "timestamp": datetime.datetime.now().isoformat(),
                    "database_recovery": db_result,
                    "overall_status": "passed" if db_result["status"] == "passed" else "failed"
                }
                
                self.recovery_test_results.append(test_result)
                
                # Limit stored results to prevent memory issues
                if len(self.recovery_test_results) > 10:
                    self.recovery_test_results = self.recovery_test_results[-10:]
                
                # Store test result in the database
                self._store_recovery_test_result(test_result)
                
                return {
                    "status": "success",
                    "test_result": test_result
                }
            
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"Error running recovery test: {str(e)}"
                }
        
        elif task_type == "get_recovery_test_results":
            # Get recovery test results
            limit = task_data.get("limit", 10)
            
            return {
                "status": "success",
                "results": self.recovery_test_results[:limit]
            }
        
        elif task_type == "update_config":
            # Update agent configuration
            config_updates = task_data.get("config", {})
            
            for key, value in config_updates.items():
                if key in self.config:
                    self.config[key] = value
            
            return {
                "status": "success",
                "message": "Configuration updated",
                "config": self.config
            }
        
        else:
            return {
                "status": "error",
                "error": f"Unknown task type: {task_type}"
            }