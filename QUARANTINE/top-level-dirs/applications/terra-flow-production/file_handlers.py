import os
import shutil
import uuid
import logging
from flask import current_app
from werkzeug.utils import secure_filename
from models import File, GISProject, db
import datetime
import json
from gis_utils import extract_gis_metadata
from config_loader import is_supabase_enabled
from storage_handlers import store_file, retrieve_file, delete_stored_file, get_file_url

# Configure logging
logger = logging.getLogger(__name__)

def allowed_file(filename):
    """Check if the file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def process_file_upload(file, filename, user_id, project_name, description):
    """Process an uploaded file and save it to the system"""
    # Get or create the project
    project = GISProject.query.filter_by(name=project_name, user_id=user_id).first()
    if not project:
        project = GISProject(name=project_name, description=f"Project for {project_name}", user_id=user_id)
        db.session.add(project)
        db.session.commit()
    
    # Create a new file record with temporary path
    file_record = File(
        filename=filename,
        original_filename=file.filename,
        file_path=os.path.join(current_app.config['UPLOAD_FOLDER'], 'temp', filename),  # Temporary path
        file_size=0,  # Will be updated after saving
        file_type=filename.rsplit('.', 1)[1].lower() if '.' in filename else '',
        user_id=user_id,
        project_id=project.id,
        description=description,
        file_metadata={}  # Initialized to empty JSON
    )
    
    # Save the file record to get an ID
    db.session.add(file_record)
    db.session.commit()
    
    # First save it temporarily to extract metadata
    temp_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'temp')
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, filename)
    file.save(temp_path)
    
    # Extract metadata if it's a GIS file
    try:
        metadata = extract_gis_metadata(temp_path, file_record.file_type)
        if metadata:
            file_record.file_metadata = metadata
    except Exception as e:
        logger.error(f"Error extracting metadata: {str(e)}")
    
    # Reset file pointer to beginning
    file.seek(0)
    
    # Store the file using the appropriate storage provider
    storage_result = store_file(file, filename, user_id, project_name)
    
    if not storage_result:
        # If storage fails, use local fallback
        logger.warning(f"Storage provider failed, using local fallback for file {filename}")
        
        # Create directory for the file using its ID
        file_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], str(file_record.id))
        os.makedirs(file_dir, exist_ok=True)
        
        # Save the file to disk
        file_path = os.path.join(file_dir, filename)
        # Copy from temp since file stream might be consumed
        shutil.copy(temp_path, file_path)
        
        # Update the file record with local path
        file_record.file_path = file_path
        file_record.file_size = os.path.getsize(file_path)
    else:
        # Update file record with storage info
        if storage_result.get('provider') == 'supabase':
            file_record.file_path = storage_result.get('path')
            file_record.file_metadata['storage_provider'] = 'supabase'
            file_record.file_metadata['bucket'] = storage_result.get('bucket')
            file_record.file_metadata['url'] = storage_result.get('url')
        else:
            file_record.file_path = storage_result.get('path')
            file_record.file_metadata['storage_provider'] = 'local'
        
        # Set file size
        if os.path.exists(temp_path):
            file_record.file_size = os.path.getsize(temp_path)
    
    # Clean up temporary file if it exists
    if os.path.exists(temp_path):
        try:
            os.remove(temp_path)
        except Exception as e:
            logger.warning(f"Failed to remove temp file {temp_path}: {str(e)}")
    
    db.session.commit()
    return file_record

def get_user_files(user_id):
    """Get all files belonging to a user"""
    return File.query.filter_by(user_id=user_id).order_by(File.upload_date.desc()).all()

def delete_file(file_id, user_id):
    """Delete a file from the system"""
    file_record = File.query.filter_by(id=file_id, user_id=user_id).first()
    
    if not file_record:
        raise Exception("File not found or you don't have permission to delete it")
    
    # Check if the file is stored with Supabase or locally
    storage_provider = file_record.file_metadata.get('storage_provider', 'local')
    
    # Delete the file using the appropriate storage handler
    if storage_provider == 'supabase':
        # Delete from Supabase storage
        success = delete_stored_file(file_id, file_record.filename)
        if not success:
            logger.warning(f"Failed to delete file {file_id} from Supabase storage")
    else:
        # Delete from local storage
        file_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], str(file_id))
        if os.path.exists(file_dir):
            try:
                shutil.rmtree(file_dir)
            except Exception as e:
                logger.error(f"Error deleting file directory {file_dir}: {str(e)}")
    
    # Delete the database record
    db.session.delete(file_record)
    db.session.commit()
    
    return True

def get_file_download_url(file_id, user_id=None):
    """
    Get a URL for downloading a file
    
    Args:
        file_id: ID of the file
        user_id: Optional user ID to verify ownership
        
    Returns:
        URL string for the file
    """
    file_record = File.query.get(file_id)
    
    if not file_record:
        logger.error(f"File not found: {file_id}")
        return None
        
    # Check if user has permission if user_id is provided
    if user_id and file_record.user_id != user_id:
        logger.error(f"User {user_id} does not have permission to access file {file_id}")
        return None
    
    # Check if file is stored in Supabase
    if file_record.file_metadata and 'storage_provider' in file_record.file_metadata:
        if file_record.file_metadata['storage_provider'] == 'supabase' and 'url' in file_record.file_metadata:
            # Return the Supabase URL directly
            return file_record.file_metadata['url']
    
    # For local files, return a route to the file
    return f"/download/{file_id}"

def get_file_path(file_id, user_id=None):
    """
    Get the local filesystem path for a file
    
    Args:
        file_id: ID of the file
        user_id: Optional user ID to verify ownership
        
    Returns:
        Local path to the file or None if it's not available locally
    """
    file_record = File.query.get(file_id)
    
    if not file_record:
        logger.error(f"File not found: {file_id}")
        return None
        
    # Check if user has permission if user_id is provided
    if user_id and file_record.user_id != user_id:
        logger.error(f"User {user_id} does not have permission to access file {file_id}")
        return None
    
    # If it's a Supabase file, retrieve it first
    if file_record.file_metadata and \
       file_record.file_metadata.get('storage_provider') == 'supabase':
        # Download the file to a temporary location
        temp_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        local_path = os.path.join(temp_dir, file_record.filename)
        
        # Use the storage handler to retrieve the file
        result = retrieve_file(file_id, file_record.filename, local_path)
        if result:
            return local_path
        else:
            return None
    
    # For local files, return the file path directly
    if os.path.exists(file_record.file_path):
        return file_record.file_path
    
    return None
