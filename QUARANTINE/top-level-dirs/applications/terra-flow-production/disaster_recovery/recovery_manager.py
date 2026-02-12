"""
Disaster Recovery and Continuity Framework

This module implements a comprehensive backup and disaster recovery framework
for Benton County Washington Assessor's Office, ensuring data resilience
and business continuity.
"""

import os
import logging
import json
import hashlib
import datetime
import uuid
import subprocess
from typing import Dict, List, Any, Optional, Union, Tuple, Set

logger = logging.getLogger(__name__)

class RecoveryManager:
    """
    Manages backup, recovery, and business continuity processes.
    """
    
    def __init__(self):
        """Initialize the recovery manager"""
        # Backup configuration
        self.backup_config = {
            'database': {
                'full_backup_schedule': '1 day',
                'incremental_backup_schedule': '4 hours',
                'retention_period': '30 days',
                'encryption_enabled': True,
                'compression_enabled': True,
                'verification_enabled': True,
                'storage_locations': ['primary', 'secondary', 'offsite']
            },
            'files': {
                'backup_schedule': '1 day',
                'retention_period': '90 days',
                'encryption_enabled': True,
                'compression_enabled': True,
                'verification_enabled': True,
                'storage_locations': ['primary', 'secondary', 'offsite']
            },
            'configuration': {
                'backup_schedule': '1 week',
                'retention_period': '365 days',
                'encryption_enabled': True,
                'compression_enabled': True,
                'verification_enabled': True,
                'storage_locations': ['primary', 'secondary', 'offsite']
            }
        }
        
        # Recovery time and point objectives
        self.recovery_objectives = {
            'critical': {
                'rto': '1 hour',     # Recovery Time Objective
                'rpo': '15 minutes'  # Recovery Point Objective
            },
            'important': {
                'rto': '4 hours',
                'rpo': '1 hour'
            },
            'normal': {
                'rto': '24 hours',
                'rpo': '4 hours'
            },
            'archival': {
                'rto': '72 hours',
                'rpo': '24 hours'
            }
        }
        
        # Business continuity procedures
        self.continuity_procedures = {
            'database_failure': {
                'detection': 'automated_monitoring',
                'notification': ['sms', 'email', 'system_alert'],
                'procedure': 'database_failover',
                'responsible_team': 'database_admins',
                'verification': 'automated_testing'
            },
            'application_failure': {
                'detection': 'automated_monitoring',
                'notification': ['sms', 'email', 'system_alert'],
                'procedure': 'application_restart',
                'responsible_team': 'application_support',
                'verification': 'user_validation'
            },
            'network_failure': {
                'detection': 'automated_monitoring',
                'notification': ['sms', 'email', 'system_alert'],
                'procedure': 'network_failover',
                'responsible_team': 'network_operations',
                'verification': 'connectivity_testing'
            },
            'data_corruption': {
                'detection': 'data_validation',
                'notification': ['email', 'system_alert', 'ticket'],
                'procedure': 'data_recovery',
                'responsible_team': 'data_management',
                'verification': 'data_validation'
            },
            'security_incident': {
                'detection': 'security_monitoring',
                'notification': ['sms', 'email', 'phone', 'security_team'],
                'procedure': 'security_incident_response',
                'responsible_team': 'security_team',
                'verification': 'security_assessment'
            },
            'facility_disruption': {
                'detection': 'manual_reporting',
                'notification': ['sms', 'email', 'phone'],
                'procedure': 'remote_operations',
                'responsible_team': 'management',
                'verification': 'service_availability'
            }
        }
        
        # Regular testing schedule
        self.testing_schedule = {
            'database_recovery': '3 months',
            'file_recovery': '6 months',
            'full_disaster_recovery': '12 months',
            'failover_test': '6 months',
            'tabletop_exercise': '3 months'
        }
        
        # Create recovery directory
        self.recovery_directory = os.environ.get('RECOVERY_DIR', 'disaster_recovery')
        os.makedirs(self.recovery_directory, exist_ok=True)
        
        logger.info("Recovery Manager initialized")
    
    def create_backup(self, backup_type: str, source: str, 
                     priority: str = 'normal') -> str:
        """
        Create a backup of the specified type.
        
        Args:
            backup_type: Type of backup ('database', 'files', 'configuration')
            source: Source to backup (database name, file path, etc.)
            priority: Backup priority ('critical', 'important', 'normal', 'archival')
            
        Returns:
            Backup ID for reference
        """
        # Generate unique backup ID
        backup_id = str(uuid.uuid4())
        
        # Get current timestamp
        timestamp = datetime.datetime.now()
        
        # Get backup configuration
        if backup_type not in self.backup_config:
            logger.error(f"Unknown backup type: {backup_type}")
            return None
        
        config = self.backup_config[backup_type]
        
        # Create backup metadata
        backup_metadata = {
            'id': backup_id,
            'type': backup_type,
            'source': source,
            'priority': priority,
            'created_at': timestamp.isoformat(),
            'encryption_enabled': config['encryption_enabled'],
            'compression_enabled': config['compression_enabled'],
            'verification_enabled': config['verification_enabled'],
            'storage_locations': [],
            'size_bytes': 0,
            'status': 'pending',
            'verification_result': None
        }
        
        # Save backup metadata
        self._save_backup_metadata(backup_id, backup_metadata)
        
        # Start backup process
        try:
            # In a real implementation, this would handle different backup types
            # For demonstration, just log the process
            logger.info(f"Starting {backup_type} backup for {source} (ID: {backup_id})")
            
            backup_result = self._perform_backup(backup_type, source, backup_id, config)
            
            if backup_result['success']:
                # Update backup metadata
                backup_metadata['status'] = 'completed'
                backup_metadata['size_bytes'] = backup_result['size_bytes']
                backup_metadata['storage_locations'] = backup_result['storage_locations']
                backup_metadata['completed_at'] = datetime.datetime.now().isoformat()
                
                # Verify backup if enabled
                if config['verification_enabled']:
                    verification_result = self._verify_backup(backup_id, backup_type, backup_result['primary_location'])
                    backup_metadata['verification_result'] = verification_result
                
                logger.info(f"Backup {backup_id} completed successfully")
            else:
                # Update backup metadata with error
                backup_metadata['status'] = 'failed'
                backup_metadata['error'] = backup_result['error']
                logger.error(f"Backup {backup_id} failed: {backup_result['error']}")
            
            # Save updated metadata
            self._save_backup_metadata(backup_id, backup_metadata)
            
        except Exception as e:
            # Update backup metadata with error
            backup_metadata['status'] = 'failed'
            backup_metadata['error'] = str(e)
            self._save_backup_metadata(backup_id, backup_metadata)
            
            logger.error(f"Backup {backup_id} failed with exception: {str(e)}")
        
        return backup_id
    
    def restore_backup(self, backup_id: str, target: str = None, 
                      validation_required: bool = True) -> Dict[str, Any]:
        """
        Restore from a backup.
        
        Args:
            backup_id: ID of the backup to restore
            target: Target location for restore (if different from original)
            validation_required: Whether to validate restore before completing
            
        Returns:
            Dictionary with restore results
        """
        # Load backup metadata
        backup_metadata = self._load_backup_metadata(backup_id)
        if not backup_metadata:
            logger.error(f"Backup {backup_id} not found")
            return {'success': False, 'error': f"Backup {backup_id} not found"}
        
        # Check backup status
        if backup_metadata['status'] != 'completed':
            logger.error(f"Cannot restore from incomplete backup: {backup_id}")
            return {'success': False, 'error': "Cannot restore from incomplete backup"}
        
        # Start restore process
        try:
            # Set restore target if not specified
            if target is None:
                target = backup_metadata['source']
            
            logger.info(f"Starting restore from backup {backup_id} to {target}")
            
            # Perform the restore operation
            restore_result = self._perform_restore(backup_metadata, target)
            
            if not restore_result['success']:
                logger.error(f"Restore from backup {backup_id} failed: {restore_result['error']}")
                return restore_result
            
            # Validate restore if required
            if validation_required:
                validation_result = self._validate_restore(backup_metadata, target)
                
                if not validation_result['success']:
                    logger.error(f"Restore validation failed: {validation_result['error']}")
                    return validation_result
                
                logger.info(f"Restore validation successful for backup {backup_id}")
            
            logger.info(f"Restore from backup {backup_id} completed successfully")
            return {'success': True, 'message': "Restore completed successfully"}
            
        except Exception as e:
            logger.error(f"Restore from backup {backup_id} failed with exception: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def create_recovery_plan(self, scenario: str) -> Dict[str, Any]:
        """
        Create a detailed recovery plan for a specific scenario.
        
        Args:
            scenario: Recovery scenario (e.g., 'database_failure', 'security_incident')
            
        Returns:
            Dictionary with recovery plan
        """
        # Check if scenario exists
        if scenario not in self.continuity_procedures:
            logger.error(f"Unknown recovery scenario: {scenario}")
            return {'success': False, 'error': f"Unknown recovery scenario: {scenario}"}
        
        # Get procedure for scenario
        procedure = self.continuity_procedures[scenario]
        
        # Create recovery plan
        recovery_plan = {
            'id': str(uuid.uuid4()),
            'scenario': scenario,
            'created_at': datetime.datetime.now().isoformat(),
            'procedure': procedure,
            'steps': []
        }
        
        # Add detailed steps based on scenario
        if scenario == 'database_failure':
            recovery_plan['steps'] = [
                {'order': 1, 'action': 'Verify database failure', 'responsible': 'database_admins'},
                {'order': 2, 'action': 'Initiate database failover', 'responsible': 'database_admins'},
                {'order': 3, 'action': 'Verify application connectivity', 'responsible': 'application_support'},
                {'order': 4, 'action': 'Run data validation tests', 'responsible': 'data_management'},
                {'order': 5, 'action': 'Notify users of system status', 'responsible': 'communications'}
            ]
        elif scenario == 'application_failure':
            recovery_plan['steps'] = [
                {'order': 1, 'action': 'Verify application failure', 'responsible': 'application_support'},
                {'order': 2, 'action': 'Check for code or configuration changes', 'responsible': 'application_support'},
                {'order': 3, 'action': 'Restart application services', 'responsible': 'application_support'},
                {'order': 4, 'action': 'Verify connectivity and functionality', 'responsible': 'application_support'},
                {'order': 5, 'action': 'Notify users of system status', 'responsible': 'communications'}
            ]
        elif scenario == 'data_corruption':
            recovery_plan['steps'] = [
                {'order': 1, 'action': 'Isolate affected data', 'responsible': 'data_management'},
                {'order': 2, 'action': 'Determine corruption extent and cause', 'responsible': 'data_management'},
                {'order': 3, 'action': 'Identify most recent valid backup', 'responsible': 'database_admins'},
                {'order': 4, 'action': 'Restore from backup', 'responsible': 'database_admins'},
                {'order': 5, 'action': 'Validate restored data', 'responsible': 'data_management'},
                {'order': 6, 'action': 'Apply any necessary post-restore transactions', 'responsible': 'data_management'},
                {'order': 7, 'action': 'Verify application functionality', 'responsible': 'application_support'},
                {'order': 8, 'action': 'Notify users of system status', 'responsible': 'communications'}
            ]
        elif scenario == 'security_incident':
            recovery_plan['steps'] = [
                {'order': 1, 'action': 'Isolate affected systems', 'responsible': 'security_team'},
                {'order': 2, 'action': 'Assess scope of incident', 'responsible': 'security_team'},
                {'order': 3, 'action': 'Preserve evidence', 'responsible': 'security_team'},
                {'order': 4, 'action': 'Contain the incident', 'responsible': 'security_team'},
                {'order': 5, 'action': 'Eradicate threat', 'responsible': 'security_team'},
                {'order': 6, 'action': 'Restore from clean backups', 'responsible': 'database_admins'},
                {'order': 7, 'action': 'Apply security patches/updates', 'responsible': 'security_team'},
                {'order': 8, 'action': 'Verify system integrity', 'responsible': 'security_team'},
                {'order': 9, 'action': 'Notify appropriate authorities', 'responsible': 'management'},
                {'order': 10, 'action': 'Document incident and response', 'responsible': 'security_team'}
            ]
        else:
            # Generic steps for other scenarios
            recovery_plan['steps'] = [
                {'order': 1, 'action': 'Assess the situation', 'responsible': procedure['responsible_team']},
                {'order': 2, 'action': 'Notify key stakeholders', 'responsible': 'communications'},
                {'order': 3, 'action': 'Implement recovery procedure', 'responsible': procedure['responsible_team']},
                {'order': 4, 'action': 'Verify recovery success', 'responsible': procedure['responsible_team']},
                {'order': 5, 'action': 'Document incident and response', 'responsible': 'management'}
            ]
        
        # Add recovery objectives
        priority = 'normal'  # Default priority
        if scenario in ['database_failure', 'security_incident']:
            priority = 'critical'
        elif scenario in ['application_failure', 'data_corruption']:
            priority = 'important'
        
        recovery_plan['recovery_objectives'] = self.recovery_objectives[priority]
        
        # Save recovery plan
        plan_file = os.path.join(self.recovery_directory, f"recovery_plan_{recovery_plan['id']}.json")
        with open(plan_file, 'w') as f:
            json.dump(recovery_plan, f, indent=2)
        
        logger.info(f"Created recovery plan for scenario: {scenario}")
        return {'success': True, 'plan_id': recovery_plan['id'], 'plan': recovery_plan}
    
    def run_recovery_drill(self, scenario: str) -> Dict[str, Any]:
        """
        Run a recovery drill for a specific scenario.
        
        Args:
            scenario: Recovery scenario to drill
            
        Returns:
            Dictionary with drill results
        """
        # Create recovery plan for the scenario
        plan_result = self.create_recovery_plan(scenario)
        if not plan_result['success']:
            return plan_result
        
        recovery_plan = plan_result['plan']
        
        # Create drill record
        drill_id = str(uuid.uuid4())
        drill_record = {
            'id': drill_id,
            'scenario': scenario,
            'plan_id': recovery_plan['id'],
            'started_at': datetime.datetime.now().isoformat(),
            'status': 'in_progress',
            'steps_completed': [],
            'issues_found': [],
            'total_steps': len(recovery_plan['steps'])
        }
        
        # Save drill record
        self._save_drill_record(drill_id, drill_record)
        
        logger.info(f"Started recovery drill for scenario: {scenario}")
        
        # In a real implementation, this would actually simulate the recovery steps
        # For demonstration purposes, we'll just log the process
        
        try:
            # Simulate going through each step
            for step in recovery_plan['steps']:
                logger.info(f"Drill step {step['order']}: {step['action']} ({step['responsible']})")
                
                # Simulate step execution (in reality, this would involve actual testing)
                success = self._simulate_drill_step(step, scenario)
                
                if success:
                    drill_record['steps_completed'].append(step['order'])
                else:
                    drill_record['issues_found'].append({
                        'step': step['order'],
                        'action': step['action'],
                        'issue': "Step failed during drill simulation"
                    })
                
                # Update drill record
                drill_record['last_step'] = step['order']
                self._save_drill_record(drill_id, drill_record)
            
            # Complete the drill
            drill_record['status'] = 'completed'
            drill_record['completed_at'] = datetime.datetime.now().isoformat()
            
            # Calculate success rate
            steps_completed = len(drill_record['steps_completed'])
            success_rate = steps_completed / drill_record['total_steps'] * 100
            drill_record['success_rate'] = success_rate
            
            logger.info(f"Completed recovery drill for scenario: {scenario} (Success rate: {success_rate:.1f}%)")
            
            # Save final drill record
            self._save_drill_record(drill_id, drill_record)
            
            return {
                'success': True, 
                'drill_id': drill_id, 
                'steps_completed': steps_completed,
                'total_steps': drill_record['total_steps'],
                'issues_found': drill_record['issues_found'],
                'success_rate': success_rate
            }
            
        except Exception as e:
            # Update drill record with error
            drill_record['status'] = 'failed'
            drill_record['error'] = str(e)
            drill_record['completed_at'] = datetime.datetime.now().isoformat()
            self._save_drill_record(drill_id, drill_record)
            
            logger.error(f"Recovery drill failed with exception: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def analyze_recovery_readiness(self) -> Dict[str, Any]:
        """
        Analyze overall recovery readiness based on recent drills and tests.
        
        Returns:
            Dictionary with readiness analysis
        """
        # Collect recent drill records
        drill_records = self._get_recent_drill_records()
        
        # Get backup statistics
        backup_stats = self._get_backup_statistics()
        
        # Calculate overall readiness
        scenario_readiness = {}
        for scenario in self.continuity_procedures:
            # Find drills for this scenario
            scenario_drills = [d for d in drill_records if d['scenario'] == scenario]
            
            if scenario_drills:
                # Calculate average success rate
                success_rates = [d.get('success_rate', 0) for d in scenario_drills]
                avg_success_rate = sum(success_rates) / len(success_rates)
                
                # Get most recent drill date
                most_recent = max(scenario_drills, key=lambda d: d.get('completed_at', ''))
                most_recent_date = most_recent.get('completed_at', 'Unknown')
                
                # Determine drill frequency compliance
                frequency_compliance = self._check_drill_frequency_compliance(scenario, scenario_drills)
                
                scenario_readiness[scenario] = {
                    'avg_success_rate': avg_success_rate,
                    'last_drill_date': most_recent_date,
                    'frequency_compliance': frequency_compliance,
                    'drill_count': len(scenario_drills),
                    'readiness_score': (avg_success_rate * 0.7) + (frequency_compliance * 30)
                }
            else:
                scenario_readiness[scenario] = {
                    'avg_success_rate': 0,
                    'last_drill_date': 'Never',
                    'frequency_compliance': 0,
                    'drill_count': 0,
                    'readiness_score': 0
                }
        
        # Calculate overall readiness score
        if scenario_readiness:
            overall_score = sum(s['readiness_score'] for s in scenario_readiness.values()) / len(scenario_readiness)
        else:
            overall_score = 0
        
        # Create readiness report
        readiness_report = {
            'generated_at': datetime.datetime.now().isoformat(),
            'overall_readiness_score': overall_score,
            'scenario_readiness': scenario_readiness,
            'backup_statistics': backup_stats,
            'pending_actions': self._get_pending_recovery_actions(scenario_readiness)
        }
        
        # Save readiness report
        report_id = str(uuid.uuid4())
        report_file = os.path.join(self.recovery_directory, f"readiness_report_{report_id}.json")
        with open(report_file, 'w') as f:
            json.dump(readiness_report, f, indent=2)
        
        logger.info(f"Generated recovery readiness report: {report_id}")
        return {'success': True, 'report_id': report_id, 'report': readiness_report}
    
    def _perform_backup(self, backup_type: str, source: str, 
                       backup_id: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform the actual backup operation.
        
        Args:
            backup_type: Type of backup
            source: Source to backup
            backup_id: Backup ID
            config: Backup configuration
            
        Returns:
            Dictionary with backup results
        """
        # Create backup directory
        backup_dir = os.path.join(self.recovery_directory, 'backups', backup_id)
        os.makedirs(backup_dir, exist_ok=True)
        
        # In a real implementation, this would perform the actual backup
        # For demonstration purposes, just simulate the process
        
        if backup_type == 'database':
            # Simulate database backup
            backup_file = os.path.join(backup_dir, f"{source}_backup.sql")
            with open(backup_file, 'w') as f:
                f.write(f"-- Simulated database backup for {source}\n")
                f.write(f"-- Created at {datetime.datetime.now().isoformat()}\n")
                f.write("-- This is a placeholder file for demonstration purposes\n")
            
            # Simulate size
            size_bytes = 1024 * 1024 * 10  # 10 MB
            
        elif backup_type == 'files':
            # Simulate file backup
            backup_file = os.path.join(backup_dir, f"{os.path.basename(source)}_backup.tar.gz")
            with open(backup_file, 'w') as f:
                f.write(f"# Simulated file backup for {source}\n")
                f.write(f"# Created at {datetime.datetime.now().isoformat()}\n")
                f.write("# This is a placeholder file for demonstration purposes\n")
            
            # Simulate size
            size_bytes = 1024 * 1024 * 50  # 50 MB
            
        elif backup_type == 'configuration':
            # Simulate configuration backup
            backup_file = os.path.join(backup_dir, f"{os.path.basename(source)}_config_backup.json")
            with open(backup_file, 'w') as f:
                f.write('{"simulated": "configuration backup", ')
                f.write(f'"source": "{source}", ')
                f.write(f'"created_at": "{datetime.datetime.now().isoformat()}"')
                f.write('}')
            
            # Simulate size
            size_bytes = 1024 * 1024  # 1 MB
            
        else:
            return {'success': False, 'error': f"Unknown backup type: {backup_type}"}
        
        # Simulate storage to multiple locations
        storage_locations = []
        primary_location = backup_file
        
        for location in config['storage_locations']:
            storage_locations.append(location)
        
        return {
            'success': True,
            'primary_location': primary_location,
            'storage_locations': storage_locations,
            'size_bytes': size_bytes
        }
    
    def _verify_backup(self, backup_id: str, backup_type: str, 
                      backup_location: str) -> Dict[str, Any]:
        """
        Verify a backup to ensure it's valid and can be restored.
        
        Args:
            backup_id: Backup ID
            backup_type: Type of backup
            backup_location: Location of backup file
            
        Returns:
            Dictionary with verification results
        """
        # In a real implementation, this would verify the backup integrity
        # For demonstration purposes, just simulate the process
        
        # Check if backup file exists
        if not os.path.exists(backup_location):
            return {
                'success': False,
                'error': f"Backup file not found: {backup_location}"
            }
        
        # Calculate checksum
        checksum = self._calculate_checksum(backup_location)
        
        # For demo purposes, always return success
        return {
            'success': True,
            'checksum': checksum,
            'verified_at': datetime.datetime.now().isoformat(),
            'verification_method': 'file_integrity_check'
        }
    
    def _perform_restore(self, backup_metadata: Dict[str, Any], 
                        target: str) -> Dict[str, Any]:
        """
        Perform the actual restore operation.
        
        Args:
            backup_metadata: Backup metadata
            target: Restore target
            
        Returns:
            Dictionary with restore results
        """
        # In a real implementation, this would perform the actual restore
        # For demonstration purposes, just simulate the process
        
        logger.info(f"Simulating restore from backup {backup_metadata['id']} to {target}")
        
        # Simulate restore time based on size
        size_mb = backup_metadata['size_bytes'] / (1024 * 1024)
        
        # For demo purposes, always return success
        return {
            'success': True,
            'message': f"Restored {size_mb:.1f} MB of data to {target}",
            'restore_time_seconds': size_mb * 0.5  # Simulate 0.5 seconds per MB
        }
    
    def _validate_restore(self, backup_metadata: Dict[str, Any], 
                         target: str) -> Dict[str, Any]:
        """
        Validate a restore operation to ensure data integrity.
        
        Args:
            backup_metadata: Backup metadata
            target: Restore target
            
        Returns:
            Dictionary with validation results
        """
        # In a real implementation, this would validate the restored data
        # For demonstration purposes, just simulate the process
        
        logger.info(f"Simulating validation of restore to {target}")
        
        # For demo purposes, always return success
        return {
            'success': True,
            'message': f"Validated restore to {target}",
            'validation_method': 'data_integrity_check',
            'validated_at': datetime.datetime.now().isoformat()
        }
    
    def _simulate_drill_step(self, step: Dict[str, Any], scenario: str) -> bool:
        """
        Simulate execution of a drill step.
        
        Args:
            step: Step to simulate
            scenario: Recovery scenario
            
        Returns:
            True if step succeeded, False otherwise
        """
        # In a real implementation, this would simulate or execute the actual step
        # For demonstration purposes, just return success (with a small chance of failure)
        
        # Simulate a 10% chance of step failure
        import random
        return random.random() > 0.1
    
    def _save_backup_metadata(self, backup_id: str, metadata: Dict[str, Any]) -> None:
        """
        Save backup metadata to file.
        
        Args:
            backup_id: Backup ID
            metadata: Backup metadata
        """
        metadata_dir = os.path.join(self.recovery_directory, 'metadata')
        os.makedirs(metadata_dir, exist_ok=True)
        
        metadata_file = os.path.join(metadata_dir, f"backup_{backup_id}.json")
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
    
    def _load_backup_metadata(self, backup_id: str) -> Dict[str, Any]:
        """
        Load backup metadata from file.
        
        Args:
            backup_id: Backup ID
            
        Returns:
            Backup metadata dictionary, or None if not found
        """
        metadata_file = os.path.join(self.recovery_directory, 'metadata', f"backup_{backup_id}.json")
        if not os.path.exists(metadata_file):
            return None
        
        try:
            with open(metadata_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading backup metadata: {str(e)}")
            return None
    
    def _save_drill_record(self, drill_id: str, record: Dict[str, Any]) -> None:
        """
        Save drill record to file.
        
        Args:
            drill_id: Drill ID
            record: Drill record
        """
        drills_dir = os.path.join(self.recovery_directory, 'drills')
        os.makedirs(drills_dir, exist_ok=True)
        
        drill_file = os.path.join(drills_dir, f"drill_{drill_id}.json")
        with open(drill_file, 'w') as f:
            json.dump(record, f, indent=2)
    
    def _get_recent_drill_records(self) -> List[Dict[str, Any]]:
        """
        Get recent drill records.
        
        Returns:
            List of drill records
        """
        drills_dir = os.path.join(self.recovery_directory, 'drills')
        if not os.path.exists(drills_dir):
            return []
        
        drill_records = []
        
        # Get all drill files
        for filename in os.listdir(drills_dir):
            if filename.startswith('drill_') and filename.endswith('.json'):
                try:
                    with open(os.path.join(drills_dir, filename), 'r') as f:
                        drill_records.append(json.load(f))
                except Exception as e:
                    logger.error(f"Error loading drill record {filename}: {str(e)}")
        
        # Sort by date (most recent first)
        drill_records.sort(key=lambda d: d.get('started_at', ''), reverse=True)
        
        return drill_records
    
    def _get_backup_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about backups.
        
        Returns:
            Dictionary with backup statistics
        """
        metadata_dir = os.path.join(self.recovery_directory, 'metadata')
        if not os.path.exists(metadata_dir):
            return {
                'total_backups': 0,
                'backup_types': {},
                'total_size_bytes': 0,
                'average_size_bytes': 0,
                'last_backup_time': None
            }
        
        # Get all backup metadata files
        backups = []
        for filename in os.listdir(metadata_dir):
            if filename.startswith('backup_') and filename.endswith('.json'):
                try:
                    with open(os.path.join(metadata_dir, filename), 'r') as f:
                        backups.append(json.load(f))
                except Exception as e:
                    logger.error(f"Error loading backup metadata {filename}: {str(e)}")
        
        # Count backups by type
        backup_types = {}
        total_size = 0
        latest_backup = None
        
        for backup in backups:
            backup_type = backup.get('type')
            if backup_type in backup_types:
                backup_types[backup_type] += 1
            else:
                backup_types[backup_type] = 1
            
            total_size += backup.get('size_bytes', 0)
            
            # Track most recent backup
            if latest_backup is None or backup.get('created_at', '') > latest_backup.get('created_at', ''):
                latest_backup = backup
        
        return {
            'total_backups': len(backups),
            'backup_types': backup_types,
            'total_size_bytes': total_size,
            'average_size_bytes': total_size / len(backups) if backups else 0,
            'last_backup_time': latest_backup.get('created_at') if latest_backup else None
        }
    
    def _check_drill_frequency_compliance(self, scenario: str, 
                                         drill_records: List[Dict[str, Any]]) -> float:
        """
        Check if drill frequency complies with testing schedule.
        
        Args:
            scenario: Recovery scenario
            drill_records: List of drill records for this scenario
            
        Returns:
            Compliance score (0-100)
        """
        if not drill_records:
            return 0
        
        # Determine required frequency
        if scenario == 'database_failure':
            required_frequency = self.testing_schedule['database_recovery']
        elif scenario == 'application_failure':
            required_frequency = self.testing_schedule['failover_test']
        elif scenario == 'security_incident':
            required_frequency = self.testing_schedule['tabletop_exercise']
        else:
            required_frequency = self.testing_schedule['full_disaster_recovery']
        
        # Convert frequency to days
        required_days = 0
        if required_frequency.endswith('months'):
            months = int(required_frequency.split()[0])
            required_days = months * 30  # Approximate
        elif required_frequency.endswith('days'):
            required_days = int(required_frequency.split()[0])
        
        # Get most recent drill date
        most_recent = max(drill_records, key=lambda d: d.get('completed_at', ''))
        most_recent_date_str = most_recent.get('completed_at', '')
        
        if not most_recent_date_str:
            return 0
        
        # Calculate days since last drill
        try:
            most_recent_date = datetime.datetime.fromisoformat(most_recent_date_str)
            days_since = (datetime.datetime.now() - most_recent_date).days
            
            # Calculate compliance score
            if days_since <= required_days:
                return 100  # Fully compliant
            else:
                # Linearly decrease compliance as days pass
                compliance = max(0, 100 - ((days_since - required_days) / required_days * 100))
                return compliance
                
        except Exception as e:
            logger.error(f"Error calculating drill frequency compliance: {str(e)}")
            return 0
    
    def _get_pending_recovery_actions(self, scenario_readiness: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Determine pending recovery actions based on readiness analysis.
        
        Args:
            scenario_readiness: Scenario readiness scores
            
        Returns:
            List of pending actions
        """
        pending_actions = []
        
        for scenario, readiness in scenario_readiness.items():
            # Check if drill is needed
            if readiness['frequency_compliance'] < 70:
                pending_actions.append({
                    'action': f"Schedule recovery drill for {scenario}",
                    'priority': 'high' if readiness['frequency_compliance'] < 30 else 'medium',
                    'reason': f"Last drill was on {readiness['last_drill_date']} (compliance: {readiness['frequency_compliance']:.1f}%)"
                })
            
            # Check if success rate is low
            if 0 < readiness['avg_success_rate'] < 80:
                pending_actions.append({
                    'action': f"Improve recovery process for {scenario}",
                    'priority': 'high' if readiness['avg_success_rate'] < 50 else 'medium',
                    'reason': f"Success rate is only {readiness['avg_success_rate']:.1f}%"
                })
            
            # Check if never tested
            if readiness['drill_count'] == 0:
                pending_actions.append({
                    'action': f"Conduct initial recovery drill for {scenario}",
                    'priority': 'high',
                    'reason': "Recovery process has never been tested"
                })
        
        return pending_actions
    
    def _calculate_checksum(self, file_path: str) -> str:
        """
        Calculate SHA-256 checksum of a file.
        
        Args:
            file_path: Path to file
            
        Returns:
            Checksum as hexadecimal string
        """
        sha256 = hashlib.sha256()
        
        with open(file_path, 'rb') as f:
            for block in iter(lambda: f.read(4096), b''):
                sha256.update(block)
        
        return sha256.hexdigest()

# Create a singleton instance
recovery_manager = RecoveryManager()