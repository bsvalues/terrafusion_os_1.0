"""
TerraFusion Platform - GIS Export Module

This module provides the GIS Export functionality for the TerraFusion Platform.
"""

import os
import uuid
import json
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Supported export formats
SUPPORTED_FORMATS = ["shapefile", "geojson", "kml", "geopackage", "csv"]

class GisExportService:
    """
    Service class for handling GIS Export operations.
    
    This service manages the creation, processing, and delivery of geographic
    data exports from the TerraFusion Platform.
    """
    
    def __init__(self, storage_path: str = "exports"):
        """
        Initialize the GIS Export Service.
        
        Args:
            storage_path: Directory to store export files
        """
        self.storage_path = storage_path
        # Create storage directory if it doesn't exist
        os.makedirs(self.storage_path, exist_ok=True)
        logger.info(f"GIS Export Service initialized with storage path: {self.storage_path}")
    
    def create_export_job(self, 
                         county_id: str, 
                         username: str, 
                         export_format: str,
                         area_of_interest: Dict[str, Any],
                         layers: List[str],
                         parameters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Create a new GIS export job.
        
        Args:
            county_id: County identifier
            username: Username of the requester
            export_format: Format of the export (shapefile, geojson, etc.)
            area_of_interest: GeoJSON defining the area of interest
            layers: List of layers to include in the export
            parameters: Additional parameters for the export
            
        Returns:
            Dictionary with job details including the job_id
        """
        # Validate export format
        if export_format.lower() not in SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported export format: {export_format}. Supported formats: {', '.join(SUPPORTED_FORMATS)}")
        
        # Create a unique job ID
        job_id = str(uuid.uuid4())
        
        # Create job object
        job = {
            "job_id": job_id,
            "county_id": county_id,
            "username": username,
            "export_format": export_format.lower(),
            "area_of_interest": area_of_interest,
            "layers": layers,
            "parameters": parameters or {},
            "status": "PENDING",
            "created_at": datetime.utcnow().isoformat(),
            "started_at": None,
            "completed_at": None,
            "download_url": None,
            "message": "Export job created and pending processing."
        }
        
        # Save job to storage
        self._save_job(job)
        
        logger.info(f"Created GIS export job {job_id} for county {county_id}")
        return job
    
    def get_job_status(self, job_id: str) -> Dict[str, Any]:
        """
        Get the status of an export job.
        
        Args:
            job_id: ID of the export job
            
        Returns:
            Dictionary with job details
            
        Raises:
            FileNotFoundError: If job with the given ID does not exist
        """
        return self._load_job(job_id)
    
    def process_job(self, job_id: str) -> Dict[str, Any]:
        """
        Process a GIS export job.
        
        This method handles the actual export processing, including:
        - Fetching data from the database
        - Applying filters and transformations
        - Generating the output file in the requested format
        
        Args:
            job_id: ID of the export job
            
        Returns:
            Dictionary with updated job details
            
        Raises:
            FileNotFoundError: If job with the given ID does not exist
            ValueError: If job is not in PENDING status
        """
        # Load job
        job = self._load_job(job_id)
        
        # Validate job status
        if job["status"] != "PENDING":
            raise ValueError(f"Cannot process job {job_id} with status {job['status']}")
        
        # Update job status to PROCESSING
        job["status"] = "PROCESSING"
        job["started_at"] = datetime.utcnow().isoformat()
        job["message"] = "Export job is being processed."
        self._save_job(job)
        
        logger.info(f"Processing GIS export job {job_id}")
        
        try:
            # Simulate export processing
            county_id = job["county_id"]
            export_format = job["export_format"]
            layers = job["layers"]
            
            # File paths
            filename = f"{county_id}_{job_id}.{export_format}"
            if export_format == "shapefile":
                filename = f"{county_id}_{job_id}.zip"  # Shapefiles are delivered as ZIP
            
            file_path = os.path.join(self.storage_path, filename)
            
            # Call the appropriate export processor based on format
            if export_format == "geojson":
                self._process_geojson_export(job, file_path)
            elif export_format == "shapefile":
                self._process_shapefile_export(job, file_path)
            elif export_format == "kml":
                self._process_kml_export(job, file_path)
            elif export_format == "geopackage":
                self._process_geopackage_export(job, file_path)
            elif export_format == "csv":
                self._process_csv_export(job, file_path)
            else:
                raise ValueError(f"Unsupported export format: {export_format}")
            
            # Update job with success
            job["status"] = "COMPLETED"
            job["completed_at"] = datetime.utcnow().isoformat()
            job["download_url"] = f"/api/v1/gis-export/download/{job_id}"
            job["file_path"] = file_path
            job["file_size"] = os.path.getsize(file_path) if os.path.exists(file_path) else 0
            job["message"] = f"Export completed successfully with {len(layers)} layers."
            
        except Exception as e:
            # Update job with error
            job["status"] = "FAILED"
            job["completed_at"] = datetime.utcnow().isoformat()
            job["message"] = f"Export failed: {str(e)}"
            logger.error(f"Error processing GIS export job {job_id}: {e}", exc_info=True)
        
        # Save updated job
        self._save_job(job)
        logger.info(f"Finished processing GIS export job {job_id} with status {job['status']}")
        return job
    
    def cancel_job(self, job_id: str) -> Dict[str, Any]:
        """
        Cancel a pending or processing export job.
        
        Args:
            job_id: ID of the export job
            
        Returns:
            Dictionary with updated job details
            
        Raises:
            FileNotFoundError: If job with the given ID does not exist
            ValueError: If job is already completed or failed
        """
        # Load job
        job = self._load_job(job_id)
        
        # Validate job status
        if job["status"] in ["COMPLETED", "FAILED"]:
            raise ValueError(f"Cannot cancel job {job_id} with status {job['status']}")
        
        # Update job status to CANCELLED
        job["status"] = "CANCELLED"
        job["completed_at"] = datetime.utcnow().isoformat()
        job["message"] = "Export job cancelled by user."
        self._save_job(job)
        
        logger.info(f"Cancelled GIS export job {job_id}")
        return job
    
    def list_jobs(self, 
                 county_id: Optional[str] = None, 
                 status: Optional[str] = None,
                 username: Optional[str] = None,
                 limit: int = 100) -> List[Dict[str, Any]]:
        """
        List export jobs with optional filtering.
        
        Args:
            county_id: Filter by county ID
            status: Filter by job status
            username: Filter by username
            limit: Maximum number of jobs to return
            
        Returns:
            List of job dictionaries
        """
        jobs = []
        
        # Find all job files
        os.makedirs(self.storage_path, exist_ok=True)
        for filename in os.listdir(self.storage_path):
            if filename.endswith('.json'):
                try:
                    with open(os.path.join(self.storage_path, filename), 'r') as f:
                        job = json.load(f)
                        
                        # Apply filters
                        if county_id and job.get("county_id") != county_id:
                            continue
                        if status and job.get("status") != status:
                            continue
                        if username and job.get("username") != username:
                            continue
                        
                        jobs.append(job)
                except Exception as e:
                    logger.error(f"Error reading job file {filename}: {e}")
        
        # Sort by creation date (newest first) and apply limit
        jobs.sort(key=lambda j: j.get("created_at", ""), reverse=True)
        return jobs[:limit]
    
    def get_job_result(self, job_id: str) -> Dict[str, Any]:
        """
        Get the result information for a completed export job.
        
        Args:
            job_id: ID of the export job
            
        Returns:
            Dictionary with result details including file path and metadata
            
        Raises:
            FileNotFoundError: If job with the given ID does not exist
            ValueError: If job is not completed
        """
        # Load job
        job = self._load_job(job_id)
        
        # Validate job status
        if job["status"] != "COMPLETED":
            raise ValueError(f"Cannot get results for job {job_id} with status {job['status']}")
        
        # Return result information
        return {
            "job_id": job["job_id"],
            "county_id": job["county_id"],
            "export_format": job["export_format"],
            "layers": job["layers"],
            "file_path": job.get("file_path"),
            "file_size": job.get("file_size", 0),
            "download_url": job["download_url"],
            "completed_at": job["completed_at"]
        }
    
    def _save_job(self, job: Dict[str, Any]) -> None:
        """
        Save job details to a JSON file.
        
        Args:
            job: Job dictionary
        """
        job_id = job["job_id"]
        job_file = os.path.join(self.storage_path, f"{job_id}.json")
        
        with open(job_file, 'w') as f:
            json.dump(job, f, indent=2)
    
    def _load_job(self, job_id: str) -> Dict[str, Any]:
        """
        Load job details from a JSON file.
        
        Args:
            job_id: ID of the export job
            
        Returns:
            Job dictionary
            
        Raises:
            FileNotFoundError: If job with the given ID does not exist
        """
        job_file = os.path.join(self.storage_path, f"{job_id}.json")
        
        if not os.path.exists(job_file):
            raise FileNotFoundError(f"Export job {job_id} not found")
        
        with open(job_file, 'r') as f:
            return json.load(f)
    
    # Export processors for different formats
    def _process_geojson_export(self, job: Dict[str, Any], file_path: str) -> None:
        """Process a GeoJSON export."""
        county_id = job["county_id"]
        layers = job["layers"]
        area_of_interest = job["area_of_interest"]
        
        # In a real implementation, this would query the database and generate actual GeoJSON
        # For demonstration, we'll create a simple GeoJSON file
        
        features = []
        for i, layer in enumerate(layers):
            # Create a sample feature for each layer
            feature = {
                "type": "Feature",
                "id": f"{i+1}",
                "properties": {
                    "layer": layer,
                    "county": county_id,
                    "name": f"Feature {i+1}",
                    "description": f"Sample {layer} feature for {county_id}"
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
                }
            }
            features.append(feature)
        
        # Create the GeoJSON structure
        geojson = {
            "type": "FeatureCollection",
            "name": f"{county_id} Export",
            "features": features,
            "metadata": {
                "exported_by": job["username"],
                "exported_at": datetime.utcnow().isoformat(),
                "layers": layers,
                "area_of_interest": area_of_interest
            }
        }
        
        # Write to file
        with open(file_path, 'w') as f:
            json.dump(geojson, f, indent=2)
    
    def _process_shapefile_export(self, job: Dict[str, Any], file_path: str) -> None:
        """
        Process a Shapefile export.
        
        In a real implementation, this would use a library like Fiona or GeoPandas
        to create actual Shapefiles. For this demo, we'll create a simple placeholder file.
        """
        county_id = job["county_id"]
        layers = job["layers"]
        
        with open(file_path, 'w') as f:
            f.write(f"# TerraFusion Shapefile Export\n")
            f.write(f"# County: {county_id}\n")
            f.write(f"# Layers: {', '.join(layers)}\n")
            f.write(f"# Generated: {datetime.utcnow().isoformat()}\n")
            f.write(f"# This is a placeholder for a real Shapefile export.\n")
            f.write(f"# In production, this would be a ZIP file containing actual Shapefiles.\n")
    
    def _process_kml_export(self, job: Dict[str, Any], file_path: str) -> None:
        """Process a KML export."""
        county_id = job["county_id"]
        layers = job["layers"]
        
        # Create a simple KML file
        kml_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>{county_id} Export</name>
    <description>Exported layers: {', '.join(layers)}</description>
    <Style id="polygon">
      <LineStyle>
        <color>ff0000ff</color>
        <width>2</width>
      </LineStyle>
      <PolyStyle>
        <color>7f0000ff</color>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>Sample Feature</name>
      <description>This is a sample feature</description>
      <styleUrl>#polygon</styleUrl>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              0,0,0
              1,0,0
              1,1,0
              0,1,0
              0,0,0
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>
"""
        with open(file_path, 'w') as f:
            f.write(kml_content)
    
    def _process_geopackage_export(self, job: Dict[str, Any], file_path: str) -> None:
        """Process a GeoPackage export."""
        county_id = job["county_id"]
        layers = job["layers"]
        
        with open(file_path, 'w') as f:
            f.write(f"# TerraFusion GeoPackage Export\n")
            f.write(f"# County: {county_id}\n")
            f.write(f"# Layers: {', '.join(layers)}\n")
            f.write(f"# Generated: {datetime.utcnow().isoformat()}\n")
            f.write(f"# This is a placeholder for a real GeoPackage export.\n")
            f.write(f"# In production, this would be a GeoPackage database file (.gpkg).\n")
    
    def _process_csv_export(self, job: Dict[str, Any], file_path: str) -> None:
        """Process a CSV export."""
        county_id = job["county_id"]
        layers = job["layers"]
        
        # Create a simple CSV file
        with open(file_path, 'w') as f:
            f.write(f"id,layer,county,name,description,geometry\n")
            for i, layer in enumerate(layers):
                f.write(f"{i+1},{layer},{county_id},Feature {i+1},\"Sample {layer} feature for {county_id}\",\"POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))\"\n")


# Create a singleton instance
gis_export_service = GisExportService()