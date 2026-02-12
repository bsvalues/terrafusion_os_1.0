"""
Conversion Manager Module

This module implements the Conversion Manager class for data conversion processes,
providing a central interface for all data conversion operations.
"""

import os
import logging
import json
import datetime
import uuid
from typing import Dict, List, Any, Optional, Tuple

from data_conversion.conversion_controls import ConversionManager as BaseConversionManager

logger = logging.getLogger(__name__)

class ConversionManager(BaseConversionManager):
    """
    Enhanced Conversion Manager that extends the base functionality
    with additional features for the GeoAssessmentPro platform.
    """
    
    def __init__(self):
        """Initialize the conversion manager with enhanced settings"""
        super().__init__()
        
        # Initialization state
        self._initialized = True
        
        # Additional configuration for GIS data
        self.gis_formats = {
            'shapefile': {
                'extensions': ['.shp', '.shx', '.dbf', '.prj'],
                'required_extensions': ['.shp', '.dbf'],
                'description': 'ESRI Shapefile format'
            },
            'geojson': {
                'extensions': ['.geojson', '.json'],
                'required_extensions': ['.geojson'],
                'description': 'GeoJSON format'
            },
            'geopackage': {
                'extensions': ['.gpkg'],
                'required_extensions': ['.gpkg'],
                'description': 'OGC GeoPackage format'
            },
            'kml': {
                'extensions': ['.kml'],
                'required_extensions': ['.kml'],
                'description': 'Keyhole Markup Language'
            },
            'gml': {
                'extensions': ['.gml'],
                'required_extensions': ['.gml'],
                'description': 'Geography Markup Language'
            }
        }
        
        # Additional pipeline stages for GIS data
        self.gis_pipeline_stages = [
            'coordinate_transformation',
            'topology_validation',
            'simplification',
            'spatial_indexing'
        ]
        
        # Extended pipeline for GIS data
        self.pipeline_stages.extend(self.gis_pipeline_stages)
        
        logger.info("Enhanced Conversion Manager initialized with GIS capabilities")
        
    def is_initialized(self) -> bool:
        """
        Check if the conversion manager is properly initialized.
        
        Returns:
            True if initialized, False otherwise
        """
        return self._initialized
    
    def convert_gis_format(self, job_id: str, source_path: str, target_format: str,
                          target_path: Optional[str] = None, options: Dict[str, Any] = None) -> bool:
        """
        Convert GIS data from one format to another.
        
        Args:
            job_id: Job ID from register_conversion_job
            source_path: Source file path
            target_format: Target GIS format
            target_path: Optional target file path (if None, generated automatically)
            options: Optional conversion options
            
        Returns:
            True if conversion successful, False otherwise
        """
        # Generate target path if not provided
        if not target_path:
            source_dir = os.path.dirname(source_path)
            source_name = os.path.splitext(os.path.basename(source_path))[0]
            ext = self.gis_formats.get(target_format, {}).get('extensions', ['.unknown'])[0]
            target_path = os.path.join(source_dir, f"{source_name}_converted{ext}")
        
        # Load job configuration
        job = self._load_job(job_id)
        if not job:
            logger.error(f"Could not load job {job_id}")
            return False
        
        # Update job status
        job['status'] = 'running'
        job['current_stage'] = 'extraction'
        job['source_path'] = source_path
        job['target_path'] = target_path
        job['target_format'] = target_format
        job['conversion_options'] = options or {}
        
        # Save job state
        self._save_job(job)
        
        try:
            # Use GeoPandas for conversion
            import geopandas as gpd
            
            # Update job progress
            self.record_stage_progress(job_id, 'extraction', 0, 1, 'in_progress')
            
            # Read source data
            try:
                gdf = gpd.read_file(source_path)
                logger.info(f"Successfully read {len(gdf)} features from {source_path}")
                
                # Update job progress
                self.record_stage_progress(job_id, 'extraction', 1, 1, 'completed')
                self.record_stage_progress(job_id, 'validation', 0, 1, 'in_progress')
                
                # Basic validation
                if gdf.empty:
                    self.report_conversion_error(
                        job_id, 'empty_data', 
                        {'message': 'Source data contains no features'},
                        severity='warning'
                    )
                
                if 'geometry' not in gdf.columns:
                    self.report_conversion_error(
                        job_id, 'missing_geometry', 
                        {'message': 'Source data has no geometry column'},
                        severity='error'
                    )
                    return False
                
                # Check for null geometries
                null_geoms = gdf[gdf.geometry.isna()].index.tolist()
                if null_geoms:
                    self.report_conversion_error(
                        job_id, 'null_geometries', 
                        {'message': f'Source data contains {len(null_geoms)} null geometries',
                         'affected_rows': null_geoms[:10]},  # Show first 10 only
                        severity='warning'
                    )
                
                # Update job progress
                self.record_stage_progress(job_id, 'validation', 1, 1, 'completed')
                self.record_stage_progress(job_id, 'transformation', 0, 1, 'in_progress')
                
                # Apply transformations if needed
                if options and 'crs' in options:
                    target_crs = options['crs']
                    source_crs = gdf.crs
                    
                    if source_crs != target_crs:
                        try:
                            gdf = gdf.to_crs(target_crs)
                            logger.info(f"Transformed CRS from {source_crs} to {target_crs}")
                        except Exception as e:
                            self.report_conversion_error(
                                job_id, 'crs_transformation_error', 
                                {'message': f'Failed to transform CRS: {str(e)}',
                                 'source_crs': str(source_crs),
                                 'target_crs': str(target_crs)},
                                severity='error'
                            )
                            return False
                
                # Simplification if requested
                if options and options.get('simplify'):
                    tolerance = float(options.get('simplify_tolerance', 0.001))
                    try:
                        gdf.geometry = gdf.geometry.simplify(tolerance)
                        logger.info(f"Simplified geometries with tolerance {tolerance}")
                    except Exception as e:
                        self.report_conversion_error(
                            job_id, 'simplification_error', 
                            {'message': f'Failed to simplify geometries: {str(e)}',
                             'tolerance': tolerance},
                            severity='warning'
                        )
                
                # Update job progress
                self.record_stage_progress(job_id, 'transformation', 1, 1, 'completed')
                self.record_stage_progress(job_id, 'loading', 0, 1, 'in_progress')
                
                # Save to target format
                try:
                    if target_format == 'shapefile':
                        gdf.to_file(target_path, driver='ESRI Shapefile')
                    elif target_format == 'geojson':
                        gdf.to_file(target_path, driver='GeoJSON')
                    elif target_format == 'geopackage':
                        gdf.to_file(target_path, driver='GPKG')
                    elif target_format == 'kml':
                        gdf.to_file(target_path, driver='KML')
                    else:
                        # Default to GeoJSON for unknown formats
                        gdf.to_file(target_path, driver='GeoJSON')
                    
                    logger.info(f"Successfully saved {len(gdf)} features to {target_path}")
                    
                    # Update job progress
                    self.record_stage_progress(job_id, 'loading', 1, 1, 'completed')
                    
                except Exception as e:
                    self.report_conversion_error(
                        job_id, 'save_error', 
                        {'message': f'Failed to save to target format: {str(e)}',
                         'target_format': target_format,
                         'target_path': target_path},
                        severity='error'
                    )
                    return False
                
                # Complete the job
                verification_results = {
                    'feature_count': len(gdf),
                    'columns': list(gdf.columns),
                    'source_format': self._detect_format(source_path),
                    'target_format': target_format,
                    'crs': str(gdf.crs)
                }
                
                self.complete_conversion_job(job_id, verification_results)
                return True
                
            except Exception as e:
                self.report_conversion_error(
                    job_id, 'read_error', 
                    {'message': f'Failed to read source data: {str(e)}',
                     'source_path': source_path},
                    severity='error'
                )
                return False
            
        except ImportError as e:
            # GeoPandas not available
            self.report_conversion_error(
                job_id, 'missing_dependency', 
                {'message': f'GeoPandas library not available: {str(e)}'},
                severity='error'
            )
            return False
        except Exception as e:
            # Generic error
            self.report_conversion_error(
                job_id, 'conversion_error', 
                {'message': f'Unexpected error during conversion: {str(e)}'},
                severity='error'
            )
            return False
    
    def _detect_format(self, file_path: str) -> str:
        """
        Detect the GIS format of a file based on extension.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Format name or 'unknown'
        """
        ext = os.path.splitext(file_path)[1].lower()
        
        for format_name, format_info in self.gis_formats.items():
            if ext in format_info['extensions']:
                return format_name
        
        return 'unknown'
    
    def validate_gis_data(self, source_path: str) -> Dict[str, Any]:
        """
        Validate GIS data and report issues.
        
        Args:
            source_path: Path to the GIS data file
            
        Returns:
            Validation results
        """
        results = {
            'valid': False,
            'errors': [],
            'warnings': [],
            'format': self._detect_format(source_path),
            'file_size': 0,
            'feature_count': 0
        }
        
        try:
            # Get file size
            file_size = os.path.getsize(source_path)
            results['file_size'] = file_size
            
            # Use GeoPandas for validation
            import geopandas as gpd
            
            try:
                gdf = gpd.read_file(source_path)
                results['feature_count'] = len(gdf)
                results['crs'] = str(gdf.crs)
                results['columns'] = list(gdf.columns)
                
                # Check for null geometries
                null_geoms = gdf[gdf.geometry.isna()].index.tolist()
                if null_geoms:
                    results['warnings'].append({
                        'type': 'null_geometries',
                        'message': f'Data contains {len(null_geoms)} null geometries',
                        'affected_rows': null_geoms[:10]  # Show first 10 only
                    })
                
                # Check for invalid geometries
                if hasattr(gdf.geometry, 'is_valid'):
                    invalid_geoms = gdf[~gdf.geometry.is_valid].index.tolist()
                    if invalid_geoms:
                        results['errors'].append({
                            'type': 'invalid_geometries',
                            'message': f'Data contains {len(invalid_geoms)} invalid geometries',
                            'affected_rows': invalid_geoms[:10]  # Show first 10 only
                        })
                
                # Consider valid if we have features and no serious errors
                if len(results['errors']) == 0 and results['feature_count'] > 0:
                    results['valid'] = True
                
            except Exception as e:
                results['errors'].append({
                    'type': 'read_error',
                    'message': f'Failed to read source data: {str(e)}'
                })
                
        except ImportError as e:
            results['errors'].append({
                'type': 'missing_dependency',
                'message': f'GeoPandas library not available: {str(e)}'
            })
        except Exception as e:
            results['errors'].append({
                'type': 'validation_error',
                'message': f'Unexpected error during validation: {str(e)}'
            })
        
        return results


# Create a singleton instance
conversion_manager = ConversionManager()