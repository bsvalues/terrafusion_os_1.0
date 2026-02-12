"""
Repository Manager

This module handles repository operations including cloning, analysis,
and tracking the evolution of code over time.
"""
import os
import json
import logging
import time
import uuid
import shutil
import re
import tempfile
import subprocess
from typing import Dict, List, Any, Optional, Union, Tuple, Set
from datetime import datetime, timedelta
from enum import Enum

class RepositoryType(Enum):
    """Types of repositories supported by the system."""
    GIT = "git"
    SVN = "svn"
    MERCURIAL = "mercurial"
    LOCAL = "local"


class RepositoryStatus(Enum):
    """Possible statuses for a repository."""
    INITIALIZING = "initializing"
    CLONING = "cloning"
    READY = "ready"
    ANALYZING = "analyzing"
    ERROR = "error"
    DELETED = "deleted"


class CodeFile:
    """
    Represents a code file in a repository.
    """
    
    def __init__(self, file_id: str, repository_id: str, path: str, 
                language: str, size: int, last_modified: float,
                metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize a code file.
        
        Args:
            file_id: Unique identifier for the file
            repository_id: ID of the parent repository
            path: Path to the file within the repository
            language: Programming language of the file
            size: File size in bytes
            last_modified: Timestamp of last modification
            metadata: Optional file metadata
        """
        self.id = file_id
        self.repository_id = repository_id
        self.path = path
        self.language = language
        self.size = size
        self.last_modified = last_modified
        self.metadata = metadata or {}
        self.content_hash = None
        self.analysis_results = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert file to a dictionary."""
        return {
            'id': self.id,
            'repository_id': self.repository_id,
            'path': self.path,
            'language': self.language,
            'size': self.size,
            'last_modified': self.last_modified,
            'metadata': self.metadata,
            'content_hash': self.content_hash,
            'analysis_results': self.analysis_results
        }


class Repository:
    """
    Represents a code repository.
    """
    
    def __init__(self, repo_id: str, name: str, url: str, repo_type: RepositoryType,
                local_path: str, default_branch: str = "main",
                credentials: Optional[Dict[str, Any]] = None,
                metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize a repository.
        
        Args:
            repo_id: Unique identifier for the repository
            name: Human-readable name
            url: URL of the repository
            repo_type: Type of repository
            local_path: Local path where the repository is/will be stored
            default_branch: Default branch to use
            credentials: Optional credentials for repository access
            metadata: Optional repository metadata
        """
        self.id = repo_id
        self.name = name
        self.url = url
        self.repo_type = repo_type
        self.local_path = local_path
        self.default_branch = default_branch
        self.credentials = credentials or {}
        self.metadata = metadata or {}
        self.status = RepositoryStatus.INITIALIZING
        self.last_sync = None
        self.created_at = time.time()
        self.error = None
        self.files = {}  # file_id -> CodeFile
        self.current_operation = None
        self.branch_history = {}  # branch_name -> list of commit metadata
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert repository to a dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'url': self.url,
            'repo_type': self.repo_type.value,
            'local_path': self.local_path,
            'default_branch': self.default_branch,
            'metadata': self.metadata,
            'status': self.status.value,
            'last_sync': self.last_sync,
            'created_at': self.created_at,
            'error': self.error,
            'current_operation': self.current_operation
        }


class CommitInfo:
    """
    Information about a commit in a repository.
    """
    
    def __init__(self, commit_id: str, repository_id: str, hash: str,
                message: str, author: str, timestamp: float,
                branch: str, parent_hashes: List[str],
                changed_files: List[str], metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize commit information.
        
        Args:
            commit_id: Unique identifier for the commit
            repository_id: ID of the parent repository
            hash: Commit hash
            message: Commit message
            author: Author of the commit
            timestamp: Timestamp of the commit
            branch: Branch the commit is on
            parent_hashes: List of parent commit hashes
            changed_files: List of files changed in the commit
            metadata: Optional commit metadata
        """
        self.id = commit_id
        self.repository_id = repository_id
        self.hash = hash
        self.message = message
        self.author = author
        self.timestamp = timestamp
        self.branch = branch
        self.parent_hashes = parent_hashes
        self.changed_files = changed_files
        self.metadata = metadata or {}
        self.analysis_results = {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert commit info to a dictionary."""
        return {
            'id': self.id,
            'repository_id': self.repository_id,
            'hash': self.hash,
            'message': self.message,
            'author': self.author,
            'timestamp': self.timestamp,
            'branch': self.branch,
            'parent_hashes': self.parent_hashes,
            'changed_files': self.changed_files,
            'metadata': self.metadata,
            'analysis_results': self.analysis_results
        }


class BranchInfo:
    """
    Information about a branch in a repository.
    """
    
    def __init__(self, branch_id: str, repository_id: str, name: str,
                head_commit: str, last_updated: float,
                metadata: Optional[Dict[str, Any]] = None):
        """
        Initialize branch information.
        
        Args:
            branch_id: Unique identifier for the branch
            repository_id: ID of the parent repository
            name: Branch name
            head_commit: Hash of the head commit
            last_updated: Timestamp of last update
            metadata: Optional branch metadata
        """
        self.id = branch_id
        self.repository_id = repository_id
        self.name = name
        self.head_commit = head_commit
        self.last_updated = last_updated
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert branch info to a dictionary."""
        return {
            'id': self.id,
            'repository_id': self.repository_id,
            'name': self.name,
            'head_commit': self.head_commit,
            'last_updated': self.last_updated,
            'metadata': self.metadata
        }


class RepositoryManager:
    """
    Manager for code repositories.
    
    This class provides:
    - Repository cloning and management
    - File tracking and analysis
    - Commit history tracking
    - Code evolution analysis
    """
    
    def __init__(self, storage_dir: Optional[str] = None,
                repositories_dir: Optional[str] = None):
        """
        Initialize the repository manager.
        
        Args:
            storage_dir: Directory for metadata storage
            repositories_dir: Directory for storing cloned repositories
        """
        # Set up storage directory
        if storage_dir is None:
            storage_dir = os.path.join(os.getcwd(), 'repository_storage')
        
        self.storage_dir = storage_dir
        os.makedirs(storage_dir, exist_ok=True)
        
        # Set up repositories directory
        if repositories_dir is None:
            repositories_dir = os.path.join(os.getcwd(), 'repositories')
        
        self.repositories_dir = repositories_dir
        os.makedirs(repositories_dir, exist_ok=True)
        
        # Initialize data structures
        self.repositories = {}  # repo_id -> Repository
        self.commits = {}  # commit_id -> CommitInfo
        self.branches = {}  # branch_id -> BranchInfo
        self.repo_commits = {}  # repo_id -> set of commit_ids
        self.repo_branches = {}  # repo_id -> set of branch_ids
        
        # Initialize logger
        self.logger = logging.getLogger('repository_manager')
        
        # Load existing data
        self._load_repositories()
    
    def _load_repositories(self) -> None:
        """Load existing repositories from storage."""
        metadata_dir = os.path.join(self.storage_dir, 'metadata')
        
        if not os.path.exists(metadata_dir):
            os.makedirs(metadata_dir)
            return
        
        # Load repositories
        for filename in os.listdir(metadata_dir):
            if filename.endswith('.json'):
                try:
                    file_path = os.path.join(metadata_dir, filename)
                    with open(file_path, 'r') as f:
                        data = json.load(f)
                    
                    if data['type'] == 'repository':
                        repo_data = data['data']
                        repo_id = repo_data['id']
                        
                        repository = Repository(
                            repo_id=repo_id,
                            name=repo_data['name'],
                            url=repo_data['url'],
                            repo_type=RepositoryType(repo_data['repo_type']),
                            local_path=repo_data['local_path'],
                            default_branch=repo_data['default_branch'],
                            metadata=repo_data.get('metadata', {})
                        )
                        
                        repository.status = RepositoryStatus(repo_data['status'])
                        repository.last_sync = repo_data.get('last_sync')
                        repository.created_at = repo_data.get('created_at', time.time())
                        repository.error = repo_data.get('error')
                        
                        self.repositories[repo_id] = repository
                        self.repo_commits[repo_id] = set()
                        self.repo_branches[repo_id] = set()
                        
                        self.logger.info(f"Loaded repository: {repository.name} (ID: {repo_id})")
                
                except Exception as e:
                    self.logger.error(f"Error loading repository from {filename}: {str(e)}")
    
    def _save_repository(self, repository: Repository) -> None:
        """
        Save repository metadata to storage.
        
        Args:
            repository: Repository to save
        """
        metadata_dir = os.path.join(self.storage_dir, 'metadata')
        os.makedirs(metadata_dir, exist_ok=True)
        
        file_path = os.path.join(metadata_dir, f"{repository.id}.json")
        
        data = {
            'type': 'repository',
            'data': repository.to_dict()
        }
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _save_commit(self, commit: CommitInfo) -> None:
        """
        Save commit metadata to storage.
        
        Args:
            commit: Commit to save
        """
        commits_dir = os.path.join(self.storage_dir, 'commits', commit.repository_id)
        os.makedirs(commits_dir, exist_ok=True)
        
        file_path = os.path.join(commits_dir, f"{commit.id}.json")
        
        data = {
            'type': 'commit',
            'data': commit.to_dict()
        }
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _save_branch(self, branch: BranchInfo) -> None:
        """
        Save branch metadata to storage.
        
        Args:
            branch: Branch to save
        """
        branches_dir = os.path.join(self.storage_dir, 'branches', branch.repository_id)
        os.makedirs(branches_dir, exist_ok=True)
        
        file_path = os.path.join(branches_dir, f"{branch.id}.json")
        
        data = {
            'type': 'branch',
            'data': branch.to_dict()
        }
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    def create_repository(self, name: str, url: str, 
                        repo_type: Union[str, RepositoryType] = RepositoryType.GIT,
                        default_branch: str = "main",
                        credentials: Optional[Dict[str, Any]] = None,
                        metadata: Optional[Dict[str, Any]] = None) -> str:
        """
        Create a new repository.
        
        Args:
            name: Human-readable name
            url: URL of the repository
            repo_type: Type of repository
            default_branch: Default branch to use
            credentials: Optional credentials for repository access
            metadata: Optional repository metadata
            
        Returns:
            Repository ID
        """
        # Generate repository ID
        repo_id = str(uuid.uuid4())
        
        # Convert repo_type to enum if string
        if isinstance(repo_type, str):
            repo_type = RepositoryType(repo_type)
        
        # Create local path
        local_path = os.path.join(self.repositories_dir, repo_id)
        
        # Create repository object
        repository = Repository(
            repo_id=repo_id,
            name=name,
            url=url,
            repo_type=repo_type,
            local_path=local_path,
            default_branch=default_branch,
            credentials=credentials,
            metadata=metadata
        )
        
        # Store repository
        self.repositories[repo_id] = repository
        self.repo_commits[repo_id] = set()
        self.repo_branches[repo_id] = set()
        
        # Save repository metadata
        self._save_repository(repository)
        
        self.logger.info(f"Created repository: {name} (ID: {repo_id})")
        return repo_id
    
    def get_repository(self, repo_id: str) -> Optional[Repository]:
        """
        Get a repository by ID.
        
        Args:
            repo_id: ID of the repository
            
        Returns:
            Repository or None if not found
        """
        return self.repositories.get(repo_id)
    
    def delete_repository(self, repo_id: str, delete_local: bool = True) -> bool:
        """
        Delete a repository.
        
        Args:
            repo_id: ID of the repository to delete
            delete_local: Whether to delete the local clone
            
        Returns:
            Deletion success
        """
        if repo_id not in self.repositories:
            return False
        
        repository = self.repositories[repo_id]
        
        # Delete local clone if requested
        if delete_local and os.path.exists(repository.local_path):
            try:
                shutil.rmtree(repository.local_path)
            except Exception as e:
                self.logger.error(f"Error deleting local clone of repository {repo_id}: {str(e)}")
        
        # Mark as deleted
        repository.status = RepositoryStatus.DELETED
        self._save_repository(repository)
        
        # Remove from in-memory storage
        del self.repositories[repo_id]
        
        if repo_id in self.repo_commits:
            del self.repo_commits[repo_id]
        
        if repo_id in self.repo_branches:
            del self.repo_branches[repo_id]
        
        self.logger.info(f"Deleted repository: {repository.name} (ID: {repo_id})")
        return True
    
    def clone_repository(self, repo_id: str) -> bool:
        """
        Clone a repository to local storage.
        
        Args:
            repo_id: ID of the repository to clone
            
        Returns:
            Cloning success
        """
        if repo_id not in self.repositories:
            return False
        
        repository = self.repositories[repo_id]
        
        # Check if already cloned
        if os.path.exists(repository.local_path) and os.path.isdir(repository.local_path):
            if os.path.exists(os.path.join(repository.local_path, '.git')):
                self.logger.info(f"Repository {repo_id} is already cloned")
                repository.status = RepositoryStatus.READY
                self._save_repository(repository)
                return True
        
        # Update status
        repository.status = RepositoryStatus.CLONING
        repository.current_operation = "Cloning repository"
        self._save_repository(repository)
        
        # Create directory if it doesn't exist
        os.makedirs(repository.local_path, exist_ok=True)
        
        try:
            # Determine clone command based on repository type
            if repository.repo_type == RepositoryType.GIT:
                # Prepare git clone command
                cmd = ['git', 'clone', repository.url, repository.local_path]
                
                # Add credentials if provided
                if repository.credentials:
                    if 'username' in repository.credentials and 'password' in repository.credentials:
                        # Use URL with credentials
                        url_parts = repository.url.split('://')
                        if len(url_parts) > 1:
                            auth_url = f"{url_parts[0]}://{repository.credentials['username']}:{repository.credentials['password']}@{url_parts[1]}"
                            cmd = ['git', 'clone', auth_url, repository.local_path]
                    elif 'ssh_key' in repository.credentials:
                        # Use SSH key
                        # In a real implementation, this would set up an SSH agent or GIT_SSH_COMMAND
                        pass
                
                # Execute clone command
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    raise Exception(f"Git clone failed: {result.stderr}")
                
                # Checkout the default branch
                if repository.default_branch:
                    checkout_cmd = ['git', '-C', repository.local_path, 'checkout', repository.default_branch]
                    checkout_result = subprocess.run(checkout_cmd, capture_output=True, text=True)
                    
                    if checkout_result.returncode != 0:
                        self.logger.warning(f"Failed to checkout branch {repository.default_branch}: {checkout_result.stderr}")
            
            elif repository.repo_type == RepositoryType.SVN:
                # Prepare SVN checkout command
                cmd = ['svn', 'checkout', repository.url, repository.local_path]
                
                # Add credentials if provided
                if repository.credentials:
                    if 'username' in repository.credentials and 'password' in repository.credentials:
                        cmd.extend(['--username', repository.credentials['username'], '--password', repository.credentials['password']])
                
                # Execute checkout command
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    raise Exception(f"SVN checkout failed: {result.stderr}")
            
            elif repository.repo_type == RepositoryType.MERCURIAL:
                # Prepare Mercurial clone command
                cmd = ['hg', 'clone', repository.url, repository.local_path]
                
                # Execute clone command
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    raise Exception(f"Mercurial clone failed: {result.stderr}")
            
            elif repository.repo_type == RepositoryType.LOCAL:
                # For local repositories, just copy the files
                if os.path.exists(repository.url) and os.path.isdir(repository.url):
                    shutil.copytree(repository.url, repository.local_path, dirs_exist_ok=True)
                else:
                    raise Exception(f"Local repository path {repository.url} does not exist or is not a directory")
            
            # Update repository status
            repository.status = RepositoryStatus.READY
            repository.last_sync = time.time()
            repository.error = None
            repository.current_operation = None
            
            # Save metadata
            self._save_repository(repository)
            
            # Analyze the repository
            self._scan_repository_files(repo_id)
            self._analyze_repository_history(repo_id)
            
            self.logger.info(f"Successfully cloned repository: {repository.name} (ID: {repo_id})")
            return True
        
        except Exception as e:
            # Update repository status on error
            repository.status = RepositoryStatus.ERROR
            repository.error = str(e)
            repository.current_operation = None
            
            # Save metadata
            self._save_repository(repository)
            
            self.logger.error(f"Error cloning repository {repo_id}: {str(e)}")
            return False
    
    def update_repository(self, repo_id: str) -> bool:
        """
        Update a cloned repository.
        
        Args:
            repo_id: ID of the repository to update
            
        Returns:
            Update success
        """
        if repo_id not in self.repositories:
            return False
        
        repository = self.repositories[repo_id]
        
        # Check if cloned
        if not os.path.exists(repository.local_path) or not os.path.isdir(repository.local_path):
            return self.clone_repository(repo_id)
        
        # Update status
        repository.current_operation = "Updating repository"
        self._save_repository(repository)
        
        try:
            # Determine update command based on repository type
            if repository.repo_type == RepositoryType.GIT:
                # Prepare git pull command
                cmd = ['git', '-C', repository.local_path, 'pull']
                
                # Execute pull command
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    raise Exception(f"Git pull failed: {result.stderr}")
            
            elif repository.repo_type == RepositoryType.SVN:
                # Prepare SVN update command
                cmd = ['svn', 'update', repository.local_path]
                
                # Execute update command
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    raise Exception(f"SVN update failed: {result.stderr}")
            
            elif repository.repo_type == RepositoryType.MERCURIAL:
                # Prepare Mercurial pull command
                cmd = ['hg', '-R', repository.local_path, 'pull', '-u']
                
                # Execute pull command
                result = subprocess.run(cmd, capture_output=True, text=True)
                
                if result.returncode != 0:
                    raise Exception(f"Mercurial pull failed: {result.stderr}")
            
            elif repository.repo_type == RepositoryType.LOCAL:
                # For local repositories, just re-copy the files
                if os.path.exists(repository.url) and os.path.isdir(repository.url):
                    shutil.copytree(repository.url, repository.local_path, dirs_exist_ok=True)
                else:
                    raise Exception(f"Local repository path {repository.url} does not exist or is not a directory")
            
            # Update repository status
            repository.last_sync = time.time()
            repository.error = None
            repository.current_operation = None
            
            # Save metadata
            self._save_repository(repository)
            
            # Re-scan the repository
            self._scan_repository_files(repo_id)
            self._analyze_repository_history(repo_id)
            
            self.logger.info(f"Successfully updated repository: {repository.name} (ID: {repo_id})")
            return True
        
        except Exception as e:
            # Update repository status on error
            repository.error = str(e)
            repository.current_operation = None
            
            # Save metadata
            self._save_repository(repository)
            
            self.logger.error(f"Error updating repository {repo_id}: {str(e)}")
            return False
    
    def _scan_repository_files(self, repo_id: str) -> None:
        """
        Scan a repository for code files.
        
        Args:
            repo_id: ID of the repository to scan
        """
        if repo_id not in self.repositories:
            return
        
        repository = self.repositories[repo_id]
        
        # Update status
        repository.current_operation = "Scanning files"
        self._save_repository(repository)
        
        # Clear existing files
        repository.files = {}
        
        # Get repository path
        repo_path = repository.local_path
        
        # Check if path exists
        if not os.path.exists(repo_path) or not os.path.isdir(repo_path):
            self.logger.error(f"Repository path {repo_path} does not exist or is not a directory")
            return
        
        # Walk the directory and find code files
        for root, dirs, files in os.walk(repo_path):
            # Skip hidden directories (e.g. .git)
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
            for file in files:
                # Skip hidden files
                if file.startswith('.'):
                    continue
                
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, repo_path)
                
                # Get file size
                size = os.path.getsize(file_path)
                
                # Get last modified time
                last_modified = os.path.getmtime(file_path)
                
                # Determine language based on file extension
                extension = os.path.splitext(file)[1].lower()
                language = self._get_language_from_extension(extension)
                
                # Skip non-code files
                if not language:
                    continue
                
                # Create file ID
                file_id = str(uuid.uuid4())
                
                # Create code file object
                code_file = CodeFile(
                    file_id=file_id,
                    repository_id=repo_id,
                    path=rel_path,
                    language=language,
                    size=size,
                    last_modified=last_modified
                )
                
                # Calculate content hash
                code_file.content_hash = self._calculate_file_hash(file_path)
                
                # Store the file
                repository.files[file_id] = code_file
        
        # Update status
        repository.current_operation = None
        self._save_repository(repository)
        
        self.logger.info(f"Scanned {len(repository.files)} files in repository {repo_id}")
    
    def _get_language_from_extension(self, extension: str) -> Optional[str]:
        """
        Determine programming language from file extension.
        
        Args:
            extension: File extension (with dot)
            
        Returns:
            Language name or None if not a code file
        """
        # Map of extensions to languages
        language_map = {
            '.py': 'Python',
            '.java': 'Java',
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.html': 'HTML',
            '.css': 'CSS',
            '.c': 'C',
            '.cpp': 'C++',
            '.h': 'C/C++ Header',
            '.cs': 'C#',
            '.go': 'Go',
            '.rb': 'Ruby',
            '.php': 'PHP',
            '.swift': 'Swift',
            '.kt': 'Kotlin',
            '.rs': 'Rust',
            '.scala': 'Scala',
            '.sql': 'SQL',
            '.sh': 'Shell',
            '.bat': 'Batch',
            '.ps1': 'PowerShell',
            '.md': 'Markdown',
            '.json': 'JSON',
            '.xml': 'XML',
            '.yaml': 'YAML',
            '.yml': 'YAML'
        }
        
        return language_map.get(extension)
    
    def _calculate_file_hash(self, file_path: str) -> str:
        """
        Calculate a hash of a file's contents.
        
        Args:
            file_path: Path to the file
            
        Returns:
            Content hash
        """
        import hashlib
        
        hasher = hashlib.sha256()
        
        try:
            with open(file_path, 'rb') as f:
                # Read in chunks to handle large files
                for chunk in iter(lambda: f.read(4096), b''):
                    hasher.update(chunk)
            
            return hasher.hexdigest()
        except Exception as e:
            self.logger.error(f"Error calculating hash for {file_path}: {str(e)}")
            return "error"
    
    def _analyze_repository_history(self, repo_id: str) -> None:
        """
        Analyze the commit history of a repository.
        
        Args:
            repo_id: ID of the repository to analyze
        """
        if repo_id not in self.repositories:
            return
        
        repository = self.repositories[repo_id]
        
        # Update status
        repository.current_operation = "Analyzing history"
        self._save_repository(repository)
        
        try:
            # Get repository path
            repo_path = repository.local_path
            
            # Check if path exists
            if not os.path.exists(repo_path) or not os.path.isdir(repo_path):
                self.logger.error(f"Repository path {repo_path} does not exist or is not a directory")
                return
            
            # Clear existing data
            if repo_id in self.repo_commits:
                self.repo_commits[repo_id].clear()
            else:
                self.repo_commits[repo_id] = set()
            
            if repo_id in self.repo_branches:
                self.repo_branches[repo_id].clear()
            else:
                self.repo_branches[repo_id] = set()
            
            # Analyze based on repository type
            if repository.repo_type == RepositoryType.GIT:
                self._analyze_git_history(repo_id)
            elif repository.repo_type == RepositoryType.SVN:
                self._analyze_svn_history(repo_id)
            elif repository.repo_type == RepositoryType.MERCURIAL:
                self._analyze_mercurial_history(repo_id)
            
            # Update status
            repository.current_operation = None
            self._save_repository(repository)
            
            self.logger.info(f"Analyzed history of repository {repo_id}")
        
        except Exception as e:
            # Update repository status on error
            repository.error = str(e)
            repository.current_operation = None
            
            # Save metadata
            self._save_repository(repository)
            
            self.logger.error(f"Error analyzing history of repository {repo_id}: {str(e)}")
    
    def _analyze_git_history(self, repo_id: str) -> None:
        """
        Analyze the commit history of a Git repository.
        
        Args:
            repo_id: ID of the repository to analyze
        """
        repository = self.repositories[repo_id]
        repo_path = repository.local_path
        
        # Get branches
        branches_cmd = ['git', '-C', repo_path, 'branch', '-a', '--format=%(refname:short)']
        branches_result = subprocess.run(branches_cmd, capture_output=True, text=True)
        
        if branches_result.returncode != 0:
            raise Exception(f"Failed to get branches: {branches_result.stderr}")
        
        branches = [b.strip() for b in branches_result.stdout.split('\n') if b.strip()]
        
        # Process each branch
        for branch_name in branches:
            # Skip remote branches
            if branch_name.startswith('remotes/'):
                continue
            
            # Create branch ID
            branch_id = str(uuid.uuid4())
            
            # Get head commit of branch
            head_cmd = ['git', '-C', repo_path, 'rev-parse', branch_name]
            head_result = subprocess.run(head_cmd, capture_output=True, text=True)
            
            if head_result.returncode != 0:
                self.logger.warning(f"Failed to get head of branch {branch_name}: {head_result.stderr}")
                continue
            
            head_commit_hash = head_result.stdout.strip()
            
            # Get branch last updated
            last_updated_cmd = ['git', '-C', repo_path, 'log', '-1', '--format=%at', branch_name]
            last_updated_result = subprocess.run(last_updated_cmd, capture_output=True, text=True)
            
            if last_updated_result.returncode != 0:
                self.logger.warning(f"Failed to get last updated time of branch {branch_name}: {last_updated_result.stderr}")
                last_updated = time.time()
            else:
                try:
                    last_updated = float(last_updated_result.stdout.strip())
                except:
                    last_updated = time.time()
            
            # Create branch info
            branch_info = BranchInfo(
                branch_id=branch_id,
                repository_id=repo_id,
                name=branch_name,
                head_commit=head_commit_hash,
                last_updated=last_updated
            )
            
            # Store branch info
            self.branches[branch_id] = branch_info
            self.repo_branches[repo_id].add(branch_id)
            
            # Save branch metadata
            self._save_branch(branch_info)
            
            # Get commits in this branch
            # Format: hash|parent_hashes|author|timestamp|message
            commits_cmd = [
                'git', '-C', repo_path, 'log', branch_name,
                '--format=%H|%P|%an|%at|%s'
            ]
            commits_result = subprocess.run(commits_cmd, capture_output=True, text=True)
            
            if commits_result.returncode != 0:
                self.logger.warning(f"Failed to get commits of branch {branch_name}: {commits_result.stderr}")
                continue
            
            commits = [c.strip() for c in commits_result.stdout.split('\n') if c.strip()]
            
            # Process each commit
            for commit_line in commits:
                parts = commit_line.split('|', 4)
                
                if len(parts) != 5:
                    continue
                
                commit_hash, parent_hashes_str, author, timestamp_str, message = parts
                
                try:
                    timestamp = float(timestamp_str)
                except:
                    timestamp = time.time()
                
                parent_hashes = parent_hashes_str.split() if parent_hashes_str else []
                
                # Get changed files in this commit
                files_cmd = ['git', '-C', repo_path, 'show', '--name-only', '--pretty=format:', commit_hash]
                files_result = subprocess.run(files_cmd, capture_output=True, text=True)
                
                if files_result.returncode != 0:
                    self.logger.warning(f"Failed to get changed files in commit {commit_hash}: {files_result.stderr}")
                    changed_files = []
                else:
                    changed_files = [f.strip() for f in files_result.stdout.split('\n') if f.strip()]
                
                # Create commit ID
                commit_id = str(uuid.uuid4())
                
                # Create commit info
                commit_info = CommitInfo(
                    commit_id=commit_id,
                    repository_id=repo_id,
                    hash=commit_hash,
                    message=message,
                    author=author,
                    timestamp=timestamp,
                    branch=branch_name,
                    parent_hashes=parent_hashes,
                    changed_files=changed_files
                )
                
                # Store commit info
                self.commits[commit_id] = commit_info
                self.repo_commits[repo_id].add(commit_id)
                
                # Save commit metadata
                self._save_commit(commit_info)
    
    def _analyze_svn_history(self, repo_id: str) -> None:
        """
        Analyze the commit history of an SVN repository.
        
        Args:
            repo_id: ID of the repository to analyze
        """
        # Not implemented in this example - would parse SVN log
        pass
    
    def _analyze_mercurial_history(self, repo_id: str) -> None:
        """
        Analyze the commit history of a Mercurial repository.
        
        Args:
            repo_id: ID of the repository to analyze
        """
        # Not implemented in this example - would parse Mercurial log
        pass
    
    def get_repository_files(self, repo_id: str, 
                           language: Optional[str] = None,
                           path_pattern: Optional[str] = None) -> List[CodeFile]:
        """
        Get files in a repository.
        
        Args:
            repo_id: ID of the repository
            language: Optional filter by language
            path_pattern: Optional regex pattern to match file paths
            
        Returns:
            List of code files
        """
        if repo_id not in self.repositories:
            return []
        
        repository = self.repositories[repo_id]
        
        # Compile regex pattern if provided
        pattern = None
        if path_pattern:
            try:
                pattern = re.compile(path_pattern)
            except:
                self.logger.warning(f"Invalid regex pattern: {path_pattern}")
        
        # Filter files
        results = []
        for file in repository.files.values():
            # Apply language filter
            if language and file.language != language:
                continue
            
            # Apply path pattern filter
            if pattern and not pattern.search(file.path):
                continue
            
            results.append(file)
        
        return results
    
    def get_file_content(self, repo_id: str, file_path: str) -> Optional[str]:
        """
        Get the content of a file in a repository.
        
        Args:
            repo_id: ID of the repository
            file_path: Path to the file within the repository
            
        Returns:
            File content or None if not found
        """
        if repo_id not in self.repositories:
            return None
        
        repository = self.repositories[repo_id]
        
        # Get the full path
        full_path = os.path.join(repository.local_path, file_path)
        
        # Check if file exists
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            return None
        
        try:
            with open(full_path, 'r', encoding='utf-8') as f:
                return f.read()
        except UnicodeDecodeError:
            # Try binary mode for non-text files
            try:
                with open(full_path, 'rb') as f:
                    return f.read().hex()
            except:
                return None
        except Exception as e:
            self.logger.error(f"Error reading file {file_path} in repository {repo_id}: {str(e)}")
            return None
    
    def get_file_history(self, repo_id: str, file_path: str, 
                        max_entries: int = 10) -> List[Dict[str, Any]]:
        """
        Get the commit history of a file in a repository.
        
        Args:
            repo_id: ID of the repository
            file_path: Path to the file within the repository
            max_entries: Maximum number of history entries to return
            
        Returns:
            List of history entries
        """
        if repo_id not in self.repositories:
            return []
        
        repository = self.repositories[repo_id]
        
        if repository.repo_type != RepositoryType.GIT:
            # Currently only supported for Git
            return []
        
        repo_path = repository.local_path
        
        # Run git log command for the file
        cmd = [
            'git', '-C', repo_path, 'log',
            f'--max-count={max_entries}',
            '--format=%H|%an|%at|%s',
            file_path
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                raise Exception(f"Failed to get file history: {result.stderr}")
            
            entries = []
            for line in result.stdout.strip().split('\n'):
                if not line:
                    continue
                
                parts = line.split('|', 3)
                if len(parts) != 4:
                    continue
                
                commit_hash, author, timestamp_str, message = parts
                
                try:
                    timestamp = float(timestamp_str)
                except:
                    timestamp = 0
                
                entries.append({
                    'hash': commit_hash,
                    'author': author,
                    'timestamp': timestamp,
                    'date': datetime.fromtimestamp(timestamp).isoformat(),
                    'message': message
                })
            
            return entries
        
        except Exception as e:
            self.logger.error(f"Error getting history of file {file_path} in repository {repo_id}: {str(e)}")
            return []
    
    def get_file_at_commit(self, repo_id: str, file_path: str, 
                         commit_hash: str) -> Optional[str]:
        """
        Get the content of a file at a specific commit.
        
        Args:
            repo_id: ID of the repository
            file_path: Path to the file within the repository
            commit_hash: Hash of the commit
            
        Returns:
            File content or None if not found
        """
        if repo_id not in self.repositories:
            return None
        
        repository = self.repositories[repo_id]
        
        if repository.repo_type != RepositoryType.GIT:
            # Currently only supported for Git
            return None
        
        repo_path = repository.local_path
        
        # Run git show command for the file at the commit
        cmd = ['git', '-C', repo_path, 'show', f'{commit_hash}:{file_path}']
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                return None
            
            return result.stdout
        
        except Exception as e:
            self.logger.error(f"Error getting file {file_path} at commit {commit_hash} in repository {repo_id}: {str(e)}")
            return None
    
    def compare_file_versions(self, repo_id: str, file_path: str, 
                            old_commit: str, new_commit: str) -> Dict[str, Any]:
        """
        Compare file versions between two commits.
        
        Args:
            repo_id: ID of the repository
            file_path: Path to the file within the repository
            old_commit: Hash of the old commit
            new_commit: Hash of the new commit
            
        Returns:
            Comparison results
        """
        if repo_id not in self.repositories:
            return {'error': 'Repository not found'}
        
        repository = self.repositories[repo_id]
        
        if repository.repo_type != RepositoryType.GIT:
            # Currently only supported for Git
            return {'error': 'Only supported for Git repositories'}
        
        repo_path = repository.local_path
        
        # Run git diff command to compare the file between commits
        cmd = ['git', '-C', repo_path, 'diff', f'{old_commit}:{file_path}', f'{new_commit}:{file_path}']
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                return {'error': f"Failed to compare file versions: {result.stderr}"}
            
            # Get old and new content
            old_content = self.get_file_at_commit(repo_id, file_path, old_commit) or ""
            new_content = self.get_file_at_commit(repo_id, file_path, new_commit) or ""
            
            # Return comparison results
            return {
                'diff': result.stdout,
                'old_content': old_content,
                'new_content': new_content,
                'old_commit': old_commit,
                'new_commit': new_commit,
                'file_path': file_path
            }
        
        except Exception as e:
            self.logger.error(f"Error comparing file {file_path} between commits in repository {repo_id}: {str(e)}")
            return {'error': str(e)}
    
    def get_repository_commits(self, repo_id: str, 
                             branch: Optional[str] = None,
                             since: Optional[float] = None,
                             max_entries: int = 100) -> List[CommitInfo]:
        """
        Get commits in a repository.
        
        Args:
            repo_id: ID of the repository
            branch: Optional filter by branch
            since: Optional timestamp to get commits since
            max_entries: Maximum number of commits to return
            
        Returns:
            List of commits
        """
        if repo_id not in self.repositories or repo_id not in self.repo_commits:
            return []
        
        commit_ids = self.repo_commits[repo_id]
        commits = []
        
        for commit_id in commit_ids:
            if commit_id in self.commits:
                commit = self.commits[commit_id]
                
                # Apply branch filter
                if branch and commit.branch != branch:
                    continue
                
                # Apply since filter
                if since and commit.timestamp < since:
                    continue
                
                commits.append(commit)
        
        # Sort by timestamp (newest first)
        commits.sort(key=lambda c: c.timestamp, reverse=True)
        
        # Apply limit
        return commits[:max_entries]
    
    def get_repository_branches(self, repo_id: str) -> List[BranchInfo]:
        """
        Get branches in a repository.
        
        Args:
            repo_id: ID of the repository
            
        Returns:
            List of branches
        """
        if repo_id not in self.repositories or repo_id not in self.repo_branches:
            return []
        
        branch_ids = self.repo_branches[repo_id]
        branches = []
        
        for branch_id in branch_ids:
            if branch_id in self.branches:
                branches.append(self.branches[branch_id])
        
        # Sort by last updated (newest first)
        branches.sort(key=lambda b: b.last_updated, reverse=True)
        
        return branches
    
    def analyze_code_evolution(self, repo_id: str, file_path: str,
                             num_versions: int = 5) -> Dict[str, Any]:
        """
        Analyze the evolution of a file over time.
        
        Args:
            repo_id: ID of the repository
            file_path: Path to the file within the repository
            num_versions: Number of versions to analyze
            
        Returns:
            Analysis results
        """
        # Get file history
        history = self.get_file_history(repo_id, file_path, num_versions)
        
        if not history:
            return {'error': 'No history found for file'}
        
        # Get file content at each version
        versions = []
        for entry in history:
            content = self.get_file_at_commit(repo_id, file_path, entry['hash'])
            if content is not None:
                versions.append({
                    'commit': entry['hash'],
                    'author': entry['author'],
                    'timestamp': entry['timestamp'],
                    'date': entry['date'],
                    'message': entry['message'],
                    'content': content,
                    'size': len(content)
                })
        
        # Analyze size evolution
        sizes = [v['size'] for v in versions]
        size_changes = []
        for i in range(1, len(sizes)):
            size_changes.append(sizes[i] - sizes[i-1])
        
        # Simple analysis of complexity evolution
        complexity_measures = []
        for version in versions:
            content = version['content']
            
            # Count lines
            lines = content.count('\n') + 1
            
            # Count function/method definitions (very basic approximation)
            function_count = len(re.findall(r'def\s+\w+\s*\(', content)) + len(re.findall(r'function\s+\w+\s*\(', content))
            
            # Count class definitions (very basic approximation)
            class_count = len(re.findall(r'class\s+\w+', content))
            
            # Count conditional statements (very basic approximation)
            conditional_count = (
                content.count('if ') +
                content.count('else ') +
                content.count('elif ') +
                content.count('switch ') +
                content.count('case ')
            )
            
            complexity_measures.append({
                'lines': lines,
                'function_count': function_count,
                'class_count': class_count,
                'conditional_count': conditional_count,
                'approximate_complexity': function_count + class_count + conditional_count
            })
        
        return {
            'file_path': file_path,
            'versions': versions,
            'version_count': len(versions),
            'size_evolution': sizes,
            'size_changes': size_changes,
            'complexity_evolution': complexity_measures,
            'authors': list(set(v['author'] for v in versions)),
            'oldest_date': versions[-1]['date'] if versions else None,
            'newest_date': versions[0]['date'] if versions else None
        }
    
    def search_repository(self, repo_id: str, search_query: str,
                        case_sensitive: bool = False,
                        file_patterns: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """
        Search for a string within a repository.
        
        Args:
            repo_id: ID of the repository
            search_query: String to search for
            case_sensitive: Whether the search is case-sensitive
            file_patterns: Optional list of file patterns to search in
            
        Returns:
            List of search results
        """
        if repo_id not in self.repositories:
            return []
        
        repository = self.repositories[repo_id]
        repo_path = repository.local_path
        
        # Build the grep command
        if repository.repo_type == RepositoryType.GIT:
            cmd = ['git', '-C', repo_path, 'grep']
            
            if not case_sensitive:
                cmd.append('-i')
            
            cmd.append('-n')  # Show line numbers
            
            # Add file patterns if provided
            if file_patterns:
                cmd.append('--')
                cmd.append(search_query)
                cmd.extend(file_patterns)
            else:
                cmd.append(search_query)
        else:
            # For non-git repositories, use standard grep
            cmd = ['grep', '-r']
            
            if not case_sensitive:
                cmd.append('-i')
            
            cmd.append('-n')  # Show line numbers
            
            # Add file patterns if provided
            if file_patterns:
                cmd.append('--include=' + ','.join(file_patterns))
            
            cmd.append(search_query)
            cmd.append(repo_path)
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            # Grep returns 0 if matches found, 1 if no matches, >1 on error
            if result.returncode > 1:
                raise Exception(f"Search failed: {result.stderr}")
            
            if result.returncode == 1:
                # No matches
                return []
            
            # Parse results
            results = []
            for line in result.stdout.split('\n'):
                if not line:
                    continue
                
                # Parse the result line
                if repository.repo_type == RepositoryType.GIT:
                    # Format: file:line_number:content
                    parts = line.split(':', 2)
                    if len(parts) >= 3:
                        file_path, line_number, content = parts
                        results.append({
                            'file': file_path,
                            'line': int(line_number),
                            'content': content
                        })
                else:
                    # Format: /path/to/repo/file:line_number:content
                    parts = line.split(':', 2)
                    if len(parts) >= 3:
                        full_path, line_number, content = parts
                        file_path = os.path.relpath(full_path, repo_path)
                        results.append({
                            'file': file_path,
                            'line': int(line_number),
                            'content': content
                        })
            
            return results
        
        except Exception as e:
            self.logger.error(f"Error searching repository {repo_id}: {str(e)}")
            return []