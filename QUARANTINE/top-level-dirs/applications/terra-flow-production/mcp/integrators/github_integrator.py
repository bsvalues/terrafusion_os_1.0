"""
GitHub Integrator Module

This module provides integration with the GitHub API to process events,
pull requests, and issues from GitHub repositories.
"""

import os
import json
import logging
import requests
import time
from typing import Dict, List, Any, Optional, Union, Tuple, cast

logger = logging.getLogger(__name__)

class GitHubAPIClient:
    """
    Client for interacting with the GitHub API
    """
    
    def __init__(self, token: Optional[str] = None, base_url: str = "https://api.github.com"):
        """
        Initialize the GitHub API client
        
        Args:
            token: GitHub API token (optional)
            base_url: GitHub API base URL
        """
        self.base_url = base_url
        self.token = token or os.environ.get("GITHUB_API_TOKEN")
        self.session = requests.Session()
        
        # Set up headers
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "GeoAssessmentPro-Integration/1.0"
        }
        
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"
        
        # Add headers to session
        self.session.headers.update(self.headers)
        
        logger.info("GitHub API client initialized")
    
    def _make_request(self, method: str, endpoint: str, params: Optional[Dict[str, Any]] = None, 
                     data: Optional[Dict[str, Any]] = None, json_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Make a request to the GitHub API
        
        Args:
            method: HTTP method (GET, POST, etc.)
            endpoint: API endpoint (without base URL)
            params: Query parameters
            data: Form data
            json_data: JSON data
        
        Returns:
            Response data as a dictionary
        """
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                data=data,
                json=json_data,
                timeout=30
            )
            
            # Handle rate limiting
            if response.status_code == 429:
                reset_time = int(response.headers.get('X-RateLimit-Reset', 0))
                wait_time = max(reset_time - int(time.time()), 1)
                logger.warning(f"Rate limited by GitHub API, waiting {wait_time} seconds")
                time.sleep(wait_time)
                return self._make_request(method, endpoint, params, data, json_data)
            
            # Raise exception for other error codes
            response.raise_for_status()
            
            # Return JSON response or empty dict if no content
            if response.status_code == 204:
                return {}
                
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"GitHub API request error: {str(e)}")
            raise
    
    def get_repository(self, owner: str, repo: str) -> Dict[str, Any]:
        """
        Get repository information
        
        Args:
            owner: Repository owner
            repo: Repository name
        
        Returns:
            Repository information
        """
        endpoint = f"repos/{owner}/{repo}"
        return self._make_request("GET", endpoint)
    
    def get_pull_request(self, owner: str, repo: str, pr_number: int) -> Dict[str, Any]:
        """
        Get pull request information
        
        Args:
            owner: Repository owner
            repo: Repository name
            pr_number: Pull request number
        
        Returns:
            Pull request information
        """
        endpoint = f"repos/{owner}/{repo}/pulls/{pr_number}"
        return self._make_request("GET", endpoint)
    
    def get_pull_request_files(self, owner: str, repo: str, pr_number: int) -> List[Dict[str, Any]]:
        """
        Get files changed in a pull request
        
        Args:
            owner: Repository owner
            repo: Repository name
            pr_number: Pull request number
        
        Returns:
            List of files changed in the pull request
        """
        endpoint = f"repos/{owner}/{repo}/pulls/{pr_number}/files"
        response = self._make_request("GET", endpoint)
        # GitHub returns a list for this endpoint
        if isinstance(response, list):
            return response
        # If not a list (shouldn't happen), return empty list
        logger.warning(f"Unexpected response type from get_pull_request_files: {type(response)}")
        return []
    
    def get_pull_request_commits(self, owner: str, repo: str, pr_number: int) -> List[Dict[str, Any]]:
        """
        Get commits in a pull request
        
        Args:
            owner: Repository owner
            repo: Repository name
            pr_number: Pull request number
        
        Returns:
            List of commits in the pull request
        """
        endpoint = f"repos/{owner}/{repo}/pulls/{pr_number}/commits"
        response = self._make_request("GET", endpoint)
        # GitHub returns a list for this endpoint
        if isinstance(response, list):
            return response
        # If not a list (shouldn't happen), return empty list
        logger.warning(f"Unexpected response type from get_pull_request_commits: {type(response)}")
        return []
    
    def create_pull_request_comment(self, owner: str, repo: str, pr_number: int, 
                                   body: str) -> Dict:
        """
        Create a comment on a pull request
        
        Args:
            owner: Repository owner
            repo: Repository name
            pr_number: Pull request number
            body: Comment body
        
        Returns:
            Comment information
        """
        endpoint = f"repos/{owner}/{repo}/issues/{pr_number}/comments"
        return self._make_request("POST", endpoint, json_data={"body": body})
    
    def create_commit_comment(self, owner: str, repo: str, commit_sha: str, 
                             body: str, path: str = None, 
                             position: int = None) -> Dict:
        """
        Create a comment on a commit
        
        Args:
            owner: Repository owner
            repo: Repository name
            commit_sha: Commit SHA
            body: Comment body
            path: File path (optional)
            position: Line position (optional)
        
        Returns:
            Comment information
        """
        endpoint = f"repos/{owner}/{repo}/commits/{commit_sha}/comments"
        
        comment_data = {"body": body}
        if path:
            comment_data["path"] = path
        if position is not None:
            comment_data["position"] = position
            
        return self._make_request("POST", endpoint, json_data=comment_data)
    
    def update_pull_request_status(self, owner: str, repo: str, pr_number: int,
                                  state: str) -> Dict:
        """
        Update pull request state (open/closed)
        
        Args:
            owner: Repository owner
            repo: Repository name
            pr_number: Pull request number
            state: New state ('open' or 'closed')
        
        Returns:
            Updated pull request information
        """
        endpoint = f"repos/{owner}/{repo}/pulls/{pr_number}"
        return self._make_request("PATCH", endpoint, json_data={"state": state})
    
    def create_deployment(self, owner: str, repo: str, ref: str, 
                         environment: str = "production", 
                         description: str = None) -> Dict:
        """
        Create a deployment
        
        Args:
            owner: Repository owner
            repo: Repository name
            ref: Git reference (branch, SHA, tag)
            environment: Deployment environment
            description: Deployment description
        
        Returns:
            Deployment information
        """
        endpoint = f"repos/{owner}/{repo}/deployments"
        
        deployment_data = {
            "ref": ref,
            "environment": environment,
            "auto_merge": False
        }
        
        if description:
            deployment_data["description"] = description
            
        return self._make_request("POST", endpoint, json_data=deployment_data)
    
    def create_deployment_status(self, owner: str, repo: str, deployment_id: int,
                                state: str, description: str = None,
                                environment_url: str = None) -> Dict:
        """
        Create a deployment status
        
        Args:
            owner: Repository owner
            repo: Repository name
            deployment_id: Deployment ID
            state: Deployment state (pending, success, failure, error)
            description: Status description
            environment_url: URL to view the deployed environment
        
        Returns:
            Deployment status information
        """
        endpoint = f"repos/{owner}/{repo}/deployments/{deployment_id}/statuses"
        
        status_data = {"state": state}
        
        if description:
            status_data["description"] = description
        if environment_url:
            status_data["environment_url"] = environment_url
            
        return self._make_request("POST", endpoint, json_data=status_data)
    
    def get_content(self, owner: str, repo: str, path: str, ref: str = None) -> Dict:
        """
        Get content of a file or directory
        
        Args:
            owner: Repository owner
            repo: Repository name
            path: File or directory path
            ref: Git reference (branch, SHA, tag)
        
        Returns:
            Content information
        """
        endpoint = f"repos/{owner}/{repo}/contents/{path}"
        params = {}
        if ref:
            params["ref"] = ref
            
        return self._make_request("GET", endpoint, params=params)
    
    def parse_repository_name(self, full_name: str) -> tuple:
        """
        Parse full repository name into owner and repo
        
        Args:
            full_name: Full repository name (owner/repo)
        
        Returns:
            Tuple of (owner, repo)
        """
        parts = full_name.split('/')
        if len(parts) != 2:
            raise ValueError(f"Invalid repository name: {full_name}")
        
        return parts[0], parts[1]

class GitHubIntegrator:
    """
    Integrator for GitHub webhooks and API
    """
    
    def __init__(self, token: Optional[str] = None):
        """
        Initialize the GitHub integrator
        
        Args:
            token: GitHub API token (optional)
        """
        self.client = GitHubAPIClient(token)
        self.logger = logging.getLogger(__name__)
        self.logger.info("GitHub integrator initialized")
    
    def process_pull_request(self, webhook_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a pull request webhook
        
        Args:
            webhook_data: Pull request webhook data
        
        Returns:
            Processing result
        """
        try:
            # Extract pull request data
            action = webhook_data.get("action", "")
            pr_data = webhook_data.get("pull_request", {})
            repository = webhook_data.get("repository", {})
            repository_name = repository.get("full_name", "")
            pr_number = webhook_data.get("number", 0)
            
            self.logger.info(f"Processing PR #{pr_number} in {repository_name} ({action})")
            
            # Parse repository name
            owner, repo = self.client.parse_repository_name(repository_name)
            
            # Get additional pull request information
            pr_details = self.client.get_pull_request(owner, repo, pr_number)
            pr_files = self.client.get_pull_request_files(owner, repo, pr_number)
            pr_commits = self.client.get_pull_request_commits(owner, repo, pr_number)
            
            # Process based on action
            result = {
                "status": "success",
                "message": f"Processed {action} event for PR #{pr_number}",
                "details": {
                    "repository": repository_name,
                    "pr_number": pr_number,
                    "action": action,
                    "title": pr_details.get("title", ""),
                    "description": pr_details.get("body", ""),
                    "state": pr_details.get("state", ""),
                    "user": pr_details.get("user", {}).get("login", ""),
                    "commits": len(pr_commits),
                    "files_changed": len(pr_files),
                    "additions": sum(f.get("additions", 0) for f in pr_files),
                    "deletions": sum(f.get("deletions", 0) for f in pr_files),
                }
            }
            
            # Perform action-specific processing
            if action == "opened":
                self._handle_opened_pr(owner, repo, pr_number, pr_details, pr_files, pr_commits)
            elif action == "closed":
                merged = pr_details.get("merged", False)
                if merged:
                    self._handle_merged_pr(owner, repo, pr_number, pr_details, pr_files, pr_commits)
                else:
                    self._handle_closed_pr(owner, repo, pr_number, pr_details)
            elif action == "synchronize":
                self._handle_updated_pr(owner, repo, pr_number, pr_details, pr_files, pr_commits)
            elif action == "reopened":
                self._handle_reopened_pr(owner, repo, pr_number, pr_details)
            
            return result
            
        except Exception as e:
            self.logger.error(f"Error processing pull request: {str(e)}")
            return {"error": f"Failed to process pull request: {str(e)}"}
    
    def _handle_opened_pr(self, owner, repo, pr_number, pr_details, pr_files, pr_commits):
        """Handle newly opened pull request"""
        # Analyze PR content and trigger appropriate actions
        file_types = self._categorize_files(pr_files)
        
        # Post welcome comment with analysis
        comment_body = f"## PR Analysis\n\n"
        comment_body += f"Thank you for your contribution to GeoAssessmentPro!\n\n"
        
        comment_body += "### Files Overview\n"
        for file_type, count in file_types.items():
            comment_body += f"- {file_type}: {count} files\n"
        
        comment_body += "\n### Next Steps\n"
        comment_body += "- Automated tests will be initiated\n"
        comment_body += "- Code quality checks will be performed\n"
        
        # Add specific instructions based on file types
        if "database" in file_types and file_types["database"] > 0:
            comment_body += "- Database changes detected - migration validation will be performed\n"
        
        if "api" in file_types and file_types["api"] > 0:
            comment_body += "- API changes detected - endpoint testing will be performed\n"
        
        # Post the comment
        self.client.create_pull_request_comment(owner, repo, pr_number, comment_body)
        
        # TODO: Trigger CI/CD pipeline for PR verification
        self.logger.info(f"Processed new PR #{pr_number} in {owner}/{repo}")
    
    def _handle_merged_pr(self, owner, repo, pr_number, pr_details, pr_files, pr_commits):
        """Handle merged pull request"""
        # Identify deployment needs based on files changed
        self.logger.info(f"PR #{pr_number} in {owner}/{repo} was merged")
        
        # Analyze what components were affected
        affected_components = self._identify_affected_components(pr_files)
        
        # Post merge confirmation comment
        comment_body = f"## PR Merged Successfully\n\n"
        comment_body += f"The changes have been merged into the `{pr_details['base']['ref']}` branch.\n\n"
        
        comment_body += "### Affected Components\n"
        for component in affected_components:
            comment_body += f"- {component}\n"
        
        comment_body += "\n### Post-Merge Actions\n"
        comment_body += "- Database migrations will be applied if needed\n"
        comment_body += "- Deployment to staging environment will be initiated\n"
        
        # Post the comment
        self.client.create_pull_request_comment(owner, repo, pr_number, comment_body)
        
        # TODO: Trigger deployment workflow
        self.logger.info(f"Processing merged PR #{pr_number} deployment steps")
    
    def _handle_closed_pr(self, owner, repo, pr_number, pr_details):
        """Handle closed (without merge) pull request"""
        self.logger.info(f"PR #{pr_number} in {owner}/{repo} was closed without merging")
        
        # Post closure comment
        comment_body = f"## PR Closed\n\n"
        comment_body += f"This pull request has been closed without merging.\n\n"
        comment_body += "If you wish to continue working on these changes, you can reopen this PR."
        
        # Post the comment
        self.client.create_pull_request_comment(owner, repo, pr_number, comment_body)
    
    def _handle_updated_pr(self, owner, repo, pr_number, pr_details, pr_files, pr_commits):
        """Handle updated pull request"""
        self.logger.info(f"PR #{pr_number} in {owner}/{repo} was updated")
        
        # Post update comment
        comment_body = f"## PR Updated\n\n"
        comment_body += f"New changes have been pushed to this pull request.\n\n"
        
        # Analyze latest commit
        if pr_commits:
            latest_commit = pr_commits[-1]
            comment_body += f"Latest commit: {latest_commit.get('sha', '')[:8]} - {latest_commit.get('commit', {}).get('message', '')}\n\n"
        
        comment_body += "Automated tests will be re-run to verify the changes."
        
        # Post the comment
        self.client.create_pull_request_comment(owner, repo, pr_number, comment_body)
        
        # TODO: Trigger CI/CD pipeline for updated PR
    
    def _handle_reopened_pr(self, owner, repo, pr_number, pr_details):
        """Handle reopened pull request"""
        self.logger.info(f"PR #{pr_number} in {owner}/{repo} was reopened")
        
        # Post reopen comment
        comment_body = f"## PR Reopened\n\n"
        comment_body += f"This pull request has been reopened.\n\n"
        comment_body += "Automated tests will be re-run to verify the changes."
        
        # Post the comment
        self.client.create_pull_request_comment(owner, repo, pr_number, comment_body)
        
        # TODO: Trigger CI/CD pipeline for reopened PR
    
    def _categorize_files(self, files) -> Dict[str, int]:
        """Categorize files by type"""
        categories = {
            "python": 0,
            "javascript": 0,
            "html": 0,
            "css": 0,
            "database": 0,
            "api": 0,
            "documentation": 0,
            "configuration": 0,
            "other": 0
        }
        
        for file in files:
            filename = file.get("filename", "")
            
            if filename.endswith('.py'):
                categories["python"] += 1
                # Check if it's an API file
                if '/api/' in filename or 'api_' in filename:
                    categories["api"] += 1
            elif filename.endswith('.js'):
                categories["javascript"] += 1
            elif filename.endswith('.html'):
                categories["html"] += 1
            elif filename.endswith('.css'):
                categories["css"] += 1
            elif filename.endswith('.sql') or 'migration' in filename.lower():
                categories["database"] += 1
            elif filename.endswith('.md') or filename.endswith('.rst'):
                categories["documentation"] += 1
            elif filename.endswith('.json') or filename.endswith('.yml') or filename.endswith('.yaml'):
                categories["configuration"] += 1
            else:
                categories["other"] += 1
                
        return categories
    
    def _identify_affected_components(self, files) -> List[str]:
        """Identify components affected by the changes"""
        components = set()
        
        for file in files:
            filename = file.get("filename", "")
            
            if '/api/' in filename:
                components.add("API")
            elif '/templates/' in filename:
                components.add("UI Templates")
            elif '/static/' in filename:
                components.add("Static Assets")
            elif '/mcp/' in filename:
                components.add("Multi-Agent Coordination Platform")
            elif '/ai_agents/' in filename:
                components.add("AI Agents")
            elif 'migration' in filename.lower() or filename.endswith('.sql'):
                components.add("Database")
            elif '/data_quality/' in filename:
                components.add("Data Quality Framework")
            elif '/integrators/' in filename:
                components.add("Integration Services")
                
        return list(components)