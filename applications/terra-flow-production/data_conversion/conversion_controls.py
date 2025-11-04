"""
Data Conversion Process Controls

This module implements rigorous controls for data conversion processes,
ensuring secure, validated, and auditable data transformations.
"""

import os
import logging
import json
import hashlib
import datetime
import uuid
from typing import Dict, List, Any, Optional, Union, Tuple

logger = logging.getLogger(__name__)

class ConversionManager:
    """
    Manages the data conversion process with comprehensive controls,
    validation, and error handling capabilities.
    """
    
    def __init__(self):
        """Initialize the conversion manager"""
        # Configure validation levels
        self.validation_levels = {
            'minimal': {
                'description': 'Basic format validation only',
                'schema_validation': True,
                'foreign_key_validation': False,
                'business_rule_validation': False,
                'completeness_checks': False,
                'quality_checks': False
            },
            'standard': {
                'description': 'Standard validation for routine conversions',
                'schema_validation': True,
                'foreign_key_validation': True,
                'business_rule_validation': True,
                'completeness_checks': True,
                'quality_checks': False
            },
            'strict': {
                'description': 'Strict validation for critical data',
                'schema_validation': True,
                'foreign_key_validation': True,
                'business_rule_validation': True,
                'completeness_checks': True,
                'quality_checks': True
            }
        }
        
        # Conversion pipeline stages
        self.pipeline_stages = [
            'extraction',
            'validation',
            'transformation',
            'enrichment',
            'loading',
            'verification'
        ]
        
        # Error handling modes
        self.error_handling_modes = {
            'abort_on_error': {
                'description': 'Abort the entire conversion if any error occurs',
                'continue_on_warning': True,
                'continue_on_error': False,
                'max_errors': 0
            },
            'continue_with_reporting': {
                'description': 'Continue processing after errors, but report them',
                'continue_on_warning': True,
                'continue_on_error': True,
                'max_errors': 100  # Arbitrary limit to prevent infinite errors
            },
            'skip_error_records': {
                'description': 'Skip individual records with errors and continue',
                'continue_on_warning': True,
                'continue_on_error': True,
                'record_level_skipping': True,
                'max_errors': 100  # Arbitrary limit
            }
        }
        
        # Recovery options
        self.recovery_options = {
            'automatic_checkpoint': {
                'description': 'Automatically create checkpoints during conversion',
                'enabled': True,
                'frequency': 1000,  # Records
                'max_checkpoints': 10
            },
            'rollback_capability': {
                'description': 'Ability to roll back to previous state',
                'enabled': True,
                'preserve_originals': True
            }
        }
        
        # Create directory for conversion logs and artifacts
        self.conversion_directory = os.environ.get('CONVERSION_DIR', 'data_conversion')
        os.makedirs(self.conversion_directory, exist_ok=True)
        
        logger.info("Conversion Manager initialized")
    
    def register_conversion_job(self, source_type: str, target_type: str, 
                               validation_level: str = 'standard',
                               error_handling: str = 'abort_on_error',
                               description: str = None) -> str:
        """
        Register a new data conversion job.
        
        Args:
            source_type: Source data type or format
            target_type: Target data type or format
            validation_level: Validation level to use
            error_handling: Error handling mode
            description: Description of the conversion job
            
        Returns:
            Job ID for tracking
        """
        # Generate unique job ID
        job_id = str(uuid.uuid4())
        
        # Validate and default the validation level
        if validation_level not in self.validation_levels:
            validation_level = 'standard'
            logger.warning(f"Unknown validation level: {validation_level}, defaulting to 'standard'")
        
        # Validate and default the error handling mode
        if error_handling not in self.error_handling_modes:
            error_handling = 'abort_on_error'
            logger.warning(f"Unknown error handling mode: {error_handling}, defaulting to 'abort_on_error'")
        
        # Create job record
        job = {
            'id': job_id,
            'source_type': source_type,
            'target_type': target_type,
            'validation_level': validation_level,
            'error_handling': error_handling,
            'description': description,
            'created_at': datetime.datetime.now().isoformat(),
            'status': 'registered',
            'stages_completed': [],
            'current_stage': None,
            'errors': [],
            'warnings': [],
            'checkpoints': [],
            'metrics': {
                'total_records': 0,
                'processed_records': 0,
                'error_records': 0,
                'warning_records': 0
            }
        }
        
        # Write job configuration to file
        job_file = os.path.join(self.conversion_directory, f"job_{job_id}.json")
        with open(job_file, 'w') as f:
            json.dump(job, f, indent=2)
        
        logger.info(f"Conversion job {job_id} registered: {source_type} to {target_type}")
        return job_id
    
    def start_conversion_job(self, job_id: str, source_data: Any) -> bool:
        """
        Start a registered conversion job.
        
        Args:
            job_id: Job ID from register_conversion_job
            source_data: Source data to convert (file path, data object, etc.)
            
        Returns:
            True if job started successfully, False otherwise
        """
        # Load job configuration
        job = self._load_job(job_id)
        if not job:
            return False
        
        # Update job status
        job['status'] = 'running'
        job['started_at'] = datetime.datetime.now().isoformat()
        job['current_stage'] = self.pipeline_stages[0]
        
        # Create immutable copy of source data if rollback enabled
        if self.recovery_options['rollback_capability']['enabled']:
            # In a real implementation, this would create a physical copy
            # or a database snapshot. For demonstration, just log it.
            logger.info(f"Creating backup of source data for job {job_id}")
            job['source_backup'] = f"backup_{job_id}_source"
        
        # Save updated job configuration
        self._save_job(job)
        
        logger.info(f"Conversion job {job_id} started")
        return True
    
    def record_stage_progress(self, job_id: str, stage: str, 
                             processed: int, total: int, 
                             status: str = 'in_progress') -> bool:
        """
        Update progress for a specific conversion stage.
        
        Args:
            job_id: Job ID
            stage: Current pipeline stage
            processed: Number of records processed
            total: Total number of records
            status: Stage status ('in_progress', 'completed', 'failed')
            
        Returns:
            True if update was successful, False otherwise
        """
        # Load job configuration
        job = self._load_job(job_id)
        if not job:
            return False
        
        # Validate stage
        if stage not in self.pipeline_stages:
            logger.warning(f"Unknown pipeline stage: {stage}")
            return False
        
        # Update job status
        job['current_stage'] = stage
        job['metrics']['processed_records'] = processed
        job['metrics']['total_records'] = total
        
        # Update stage status
        if status == 'completed':
            if stage not in job['stages_completed']:
                job['stages_completed'].append(stage)
            
            # Determine next stage if any
            try:
                current_index = self.pipeline_stages.index(stage)
                if current_index < len(self.pipeline_stages) - 1:
                    job['current_stage'] = self.pipeline_stages[current_index + 1]
                else:
                    # All stages completed
                    job['status'] = 'completed'
                    job['completed_at'] = datetime.datetime.now().isoformat()
            except ValueError:
                # Should never happen since we validate stage above
                pass
        elif status == 'failed':
            job['status'] = 'failed'
            job['failed_at'] = datetime.datetime.now().isoformat()
            job['failed_stage'] = stage
        
        # Calculate checkpoint if needed
        if (self.recovery_options['automatic_checkpoint']['enabled'] and
            processed % self.recovery_options['automatic_checkpoint']['frequency'] == 0):
            checkpoint_id = self._create_checkpoint(job)
            if checkpoint_id:
                job['checkpoints'].append({
                    'id': checkpoint_id,
                    'stage': stage,
                    'processed': processed,
                    'created_at': datetime.datetime.now().isoformat()
                })
        
        # Save updated job configuration
        self._save_job(job)
        
        logger.info(f"Conversion job {job_id}, stage {stage}: {processed}/{total} records processed ({status})")
        return True
    
    def report_conversion_error(self, job_id: str, error_type: str, 
                               details: Dict[str, Any], record_id: Any = None, 
                               severity: str = 'error') -> bool:
        """
        Report an error or warning that occurred during conversion.
        
        Args:
            job_id: Job ID
            error_type: Type of error
            details: Error details
            record_id: ID of the record with the error (if applicable)
            severity: Error severity ('error' or 'warning')
            
        Returns:
            True if error was reported successfully, False otherwise
        """
        # Load job configuration
        job = self._load_job(job_id)
        if not job:
            return False
        
        # Create error record
        error = {
            'id': str(uuid.uuid4()),
            'type': error_type,
            'details': details,
            'record_id': record_id,
            'severity': severity,
            'stage': job['current_stage'],
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        # Add to appropriate list
        if severity == 'error':
            job['errors'].append(error)
            job['metrics']['error_records'] += 1
            
            # Check if we should abort
            error_handling = self.error_handling_modes.get(job['error_handling'], 
                                                        self.error_handling_modes['abort_on_error'])
            if not error_handling['continue_on_error']:
                job['status'] = 'failed'
                job['failed_at'] = datetime.datetime.now().isoformat()
                job['failed_reason'] = error_type
                logger.error(f"Conversion job {job_id} failed due to error: {error_type}")
            
            # Check if we've exceeded max errors
            max_errors = error_handling.get('max_errors', 0)
            if max_errors > 0 and job['metrics']['error_records'] >= max_errors:
                job['status'] = 'failed'
                job['failed_at'] = datetime.datetime.now().isoformat()
                job['failed_reason'] = f"Exceeded maximum allowed errors ({max_errors})"
                logger.error(f"Conversion job {job_id} failed: exceeded maximum errors")
        else:
            job['warnings'].append(error)
            job['metrics']['warning_records'] += 1
        
        # Save updated job configuration
        self._save_job(job)
        
        if severity == 'error':
            logger.error(f"Conversion error in job {job_id}: {error_type}")
        else:
            logger.warning(f"Conversion warning in job {job_id}: {error_type}")
        
        return True
    
    def complete_conversion_job(self, job_id: str, 
                               verification_results: Dict[str, Any] = None) -> bool:
        """
        Mark a conversion job as completed with verification results.
        
        Args:
            job_id: Job ID
            verification_results: Results of final verification (if any)
            
        Returns:
            True if job was completed successfully, False otherwise
        """
        # Load job configuration
        job = self._load_job(job_id)
        if not job:
            return False
        
        # Check if job is in a valid state to complete
        if job['status'] not in ['running', 'completed']:
            logger.warning(f"Cannot complete job {job_id} with status {job['status']}")
            return False
        
        # Update job status
        job['status'] = 'completed'
        job['completed_at'] = datetime.datetime.now().isoformat()
        
        # Add verification results if provided
        if verification_results:
            job['verification_results'] = verification_results
        
        # Save updated job configuration
        self._save_job(job)
        
        logger.info(f"Conversion job {job_id} completed successfully")
        return True
    
    def rollback_conversion(self, job_id: str, checkpoint_id: str = None) -> bool:
        """
        Roll back a conversion job to a previous state.
        
        Args:
            job_id: Job ID
            checkpoint_id: Checkpoint ID to roll back to (if None, rolls back entirely)
            
        Returns:
            True if rollback was successful, False otherwise
        """
        # Load job configuration
        job = self._load_job(job_id)
        if not job:
            return False
        
        # Check if rollback is enabled
        if not self.recovery_options['rollback_capability']['enabled']:
            logger.warning(f"Rollback not enabled for job {job_id}")
            return False
        
        # Check if checkpoint exists if specified
        if checkpoint_id:
            checkpoint_found = False
            for checkpoint in job['checkpoints']:
                if checkpoint['id'] == checkpoint_id:
                    checkpoint_found = True
                    break
            
            if not checkpoint_found:
                logger.warning(f"Checkpoint {checkpoint_id} not found for job {job_id}")
                return False
        
        # Update job status
        job['status'] = 'rolled_back'
        job['rolled_back_at'] = datetime.datetime.now().isoformat()
        job['rolled_back_to'] = checkpoint_id or 'beginning'
        
        # In a real implementation, this would restore data from the backup
        # or checkpoint. For demonstration, just log it.
        if checkpoint_id:
            logger.info(f"Rolling back job {job_id} to checkpoint {checkpoint_id}")
        else:
            logger.info(f"Rolling back job {job_id} completely")
        
        # Save updated job configuration
        self._save_job(job)
        
        logger.info(f"Conversion job {job_id} rolled back successfully")
        return True
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get current status of a conversion job.
        
        Args:
            job_id: Job ID
            
        Returns:
            Dictionary with job status and metrics
        """
        # Load job configuration
        job = self._load_job(job_id)
        if not job:
            return {
                'id': job_id,
                'status': 'not_found',
                'error': 'Job not found'
            }
        
        # Return status and metrics
        return {
            'id': job['id'],
            'status': job['status'],
            'source_type': job['source_type'],
            'target_type': job['target_type'],
            'started_at': job.get('started_at'),
            'completed_at': job.get('completed_at'),
            'current_stage': job['current_stage'],
            'stages_completed': job['stages_completed'],
            'metrics': job['metrics'],
            'error_count': len(job['errors']),
            'warning_count': len(job['warnings']),
            'checkpoint_count': len(job['checkpoints'])
        }
    
    def _load_job(self, job_id: str) -> Dict[str, Any]:
        """
        Load job configuration from file.
        
        Args:
            job_id: Job ID
            
        Returns:
            Job configuration dictionary, or None if not found
        """
        job_file = os.path.join(self.conversion_directory, f"job_{job_id}.json")
        if not os.path.exists(job_file):
            logger.warning(f"Job file not found: {job_file}")
            return None
        
        try:
            with open(job_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading job file: {str(e)}")
            return None
    
    def _save_job(self, job: Dict[str, Any]) -> bool:
        """
        Save job configuration to file.
        
        Args:
            job: Job configuration dictionary
            
        Returns:
            True if save was successful, False otherwise
        """
        job_file = os.path.join(self.conversion_directory, f"job_{job['id']}.json")
        try:
            with open(job_file, 'w') as f:
                json.dump(job, f, indent=2)
            return True
        except Exception as e:
            logger.error(f"Error saving job file: {str(e)}")
            return False
    
    def _create_checkpoint(self, job: Dict[str, Any]) -> str:
        """
        Create a checkpoint for a conversion job.
        
        Args:
            job: Job configuration dictionary
            
        Returns:
            Checkpoint ID, or None if checkpoint creation failed
        """
        # Generate unique checkpoint ID
        checkpoint_id = str(uuid.uuid4())
        
        # In a real implementation, this would create a physical checkpoint
        # or a database snapshot. For demonstration, just log it.
        logger.info(f"Creating checkpoint {checkpoint_id} for job {job['id']}")
        
        # Limit number of checkpoints if needed
        max_checkpoints = self.recovery_options['automatic_checkpoint']['max_checkpoints']
        if len(job['checkpoints']) >= max_checkpoints:
            # Remove oldest checkpoint
            job['checkpoints'] = job['checkpoints'][-(max_checkpoints-1):]
        
        return checkpoint_id

# Create a singleton instance
conversion_manager = ConversionManager()