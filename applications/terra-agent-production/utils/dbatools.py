import subprocess
import shlex
import logging
from langchain_core.tools import BaseTool

# Get logger
logger = logging.getLogger("pacs_assistant")

def run_dbatools(command: str):
    """
    Execute a dbatools.ai PowerShell command.
    
    Args:
        command (str): The dbatools.ai PowerShell command to execute
        
    Returns:
        str: Output from the PowerShell command
    """
    logger.info(f"Running dbatools command: {command}")
    
    try:
        # Construct the PowerShell command
        ps_command = f"pwsh -Command \"Import-Module dbatools.ai; {command}\""
        
        # Run the command as a subprocess
        proc = subprocess.run(
            shlex.split(ps_command),
            capture_output=True, 
            text=True,
            timeout=60  # 60 second timeout
        )
        
        # Check for errors
        if proc.returncode != 0 and proc.stderr:
            logger.error(f"dbatools command failed: {proc.stderr}")
            raise Exception(f"PowerShell error: {proc.stderr}")
            
        # Return output or stderr if no output
        output = proc.stdout.strip() or proc.stderr.strip() or "Command executed successfully (no output)"
        logger.info("dbatools command executed successfully")
        return output
        
    except subprocess.TimeoutExpired:
        logger.error("dbatools command timed out after 60 seconds")
        raise Exception("Command timed out after 60 seconds")
        
    except Exception as e:
        logger.error(f"Error running dbatools command: {str(e)}")
        raise

class DbatoolsTool(BaseTool):
    """Tool for running dbatools.ai PowerShell commands."""
    
    name: str = "dbatools"
    description: str = (
        "Run dbatools.ai PowerShell commands to manage and query SQL Server. "
        "Useful for database administration tasks like listing tables, "
        "checking server status, or examining database properties. "
        "Example commands: 'Get-DbaDatabase -SqlInstance jcharrispacs', "
        "'Get-DbaDbTable -SqlInstance jcharrispacs -Database pacs_training'"
    )
    
    def _run(self, command: str) -> str:
        """Execute the tool with the given command."""
        return run_dbatools(command)
    
    async def _arun(self, command: str) -> str:
        """Async implementation of _run."""
        # For async compatibility, but still runs synchronously
        return self._run(command)
