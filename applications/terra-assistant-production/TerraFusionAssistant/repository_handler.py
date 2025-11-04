import os
import re
import git
import logging
import tempfile
from pathlib import Path
from collections import defaultdict

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clone_repository(repo_url, branch='main', temp_dir=None):
    """
    Clone a GitHub repository to a temporary directory
    
    Parameters:
    - repo_url: URL of the GitHub repository
    - branch: Branch to clone (default: main)
    - temp_dir: Directory to clone into (if None, creates a new temp dir)
    
    Returns:
    - str: Path to the cloned repository
    """
    logger.info(f"Cloning repository {repo_url} (branch: {branch})...")
    
    if not temp_dir:
        temp_dir = tempfile.mkdtemp()
    
    try:
        # Check if it's a valid GitHub URL
        github_pattern = r'^https?://github\.com/[^/]+/[^/]+(/)?$'
        if not re.match(github_pattern, repo_url):
            # Try to fix common URL issues
            if not repo_url.startswith(('http://', 'https://')):
                repo_url = 'https://' + repo_url
            
            # Add .git extension if missing
            if not repo_url.endswith('.git') and not repo_url.endswith('/'):
                repo_url = repo_url + '.git'
        
        # Clone the repository to the temporary directory
        git.Repo.clone_from(repo_url, temp_dir, branch=branch)
        
        logger.info(f"Repository cloned successfully to {temp_dir}")
        return temp_dir
    except Exception as e:
        logger.error(f"Error cloning repository: {str(e)}")
        raise Exception(f"Failed to clone repository: {str(e)}")

def get_repository_structure(repo_path):
    """
    Analyze the structure of a repository
    
    Parameters:
    - repo_path: Path to the cloned repository
    
    Returns:
    - dict: Repository structure information including file types, directories, etc.
    """
    logger.info(f"Analyzing repository structure at {repo_path}...")
    
    # Initialize counters and containers
    file_count = 0
    directory_count = 0
    file_types = defaultdict(int)
    top_level_dirs = []
    largest_files = []
    deepest_nesting = 0
    
    # Helper function to determine if a path should be skipped
    def should_skip(path):
        # Skip hidden files and directories
        if any(part.startswith('.') for part in Path(path).parts):
            return True
        
        # Skip common directories that shouldn't be analyzed
        skip_dirs = ['node_modules', 'venv', 'env', '__pycache__', 'dist', 'build', 'target']
        for skip_dir in skip_dirs:
            if f"/{skip_dir}/" in path or path.endswith(f"/{skip_dir}"):
                return True
        
        return False
    
    # Walk through the repository
    for root, dirs, files in os.walk(repo_path):
        # Calculate directory nesting level
        rel_path = os.path.relpath(root, repo_path)
        if rel_path != '.':
            nesting_level = len(rel_path.split(os.sep))
            deepest_nesting = max(deepest_nesting, nesting_level)
            
            # Save top-level directories
            if nesting_level == 1 and not should_skip(rel_path):
                top_level_dirs.append(rel_path)
        
        # Skip directories that shouldn't be analyzed
        dirs[:] = [d for d in dirs if not should_skip(os.path.join(rel_path, d))]
        
        # Count directories
        directory_count += len(dirs)
        
        # Process files
        for file in files:
            file_path = os.path.join(root, file)
            rel_file_path = os.path.relpath(file_path, repo_path)
            
            # Skip files that shouldn't be analyzed
            if should_skip(rel_file_path):
                continue
            
            # Count files and file types
            file_count += 1
            
            # Get file extension
            _, ext = os.path.splitext(file.lower())
            if ext:
                file_types[ext] += 1
            else:
                file_types['no_extension'] += 1
            
            # Track largest files
            try:
                file_size = os.path.getsize(file_path)
                largest_files.append({
                    'path': rel_file_path,
                    'size': file_size
                })
                # Keep only the top N largest files
                largest_files = sorted(largest_files, key=lambda x: x['size'], reverse=True)[:10]
            except:
                pass
    
    # Format the file types for output
    file_types_list = []
    for ext, count in sorted(file_types.items(), key=lambda x: x[1], reverse=True):
        ext_name = ext if ext != 'no_extension' else '(no extension)'
        file_types_list.append({
            'extension': ext_name,
            'count': count
        })
    
    # Create the result structure
    result = {
        'file_count': file_count,
        'directory_count': directory_count,
        'file_types': file_types_list,
        'top_level_dirs': top_level_dirs,
        'largest_files': largest_files,
        'deepest_nesting': deepest_nesting
    }
    
    logger.info(f"Repository structure analysis complete. Found {file_count} files in {directory_count} directories.")
    return result

def get_file_content(repo_path, file_path):
    """
    Read the content of a file in the repository
    
    Parameters:
    - repo_path: Path to the cloned repository
    - file_path: Relative path to the file within the repository
    
    Returns:
    - str: Content of the file
    """
    try:
        full_path = os.path.join(repo_path, file_path)
        with open(full_path, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
        return content
    except Exception as e:
        logger.error(f"Error reading file {file_path}: {str(e)}")
        return None