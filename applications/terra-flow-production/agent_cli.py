#!/usr/bin/env python
"""
Agent Management CLI

This script provides a command-line interface for managing AI agents,
including enabling/disabling agents and configuring timeout settings.
"""

import os
import sys
import argparse
import logging
from typing import List, Dict, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('agent_cli')

# Try to import agent configuration, with fallback for standalone mode
try:
    from ai_agents.agent_config import get_agent_config_manager
    from ai_agents.agent_manager import AgentManager, get_agent_manager
    HAS_AGENT_MODULES = True
except ImportError:
    logger.warning("Agent modules not available, running in standalone mode")
    HAS_AGENT_MODULES = False

def parse_args():
    """Parse command-line arguments"""
    parser = argparse.ArgumentParser(
        description='AI Agent Management CLI',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  Show agent status:
    python agent_cli.py status
  
  List available agent types:
    python agent_cli.py list
  
  Enable/disable specific agent:
    python agent_cli.py enable property_valuation
    python agent_cli.py disable data_recovery
  
  Configure agent settings:
    python agent_cli.py config --timeout 900 --warning-interval 300 --warnings enable --auto-restart disable
"""
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to execute')
    
    # Status command
    status_parser = subparsers.add_parser('status', help='Show status of all agents')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List available agent types')
    
    # Enable command
    enable_parser = subparsers.add_parser('enable', help='Enable a specific agent type')
    enable_parser.add_argument('agent_type', help='Agent type to enable')
    
    # Disable command
    disable_parser = subparsers.add_parser('disable', help='Disable a specific agent type')
    disable_parser.add_argument('agent_type', help='Agent type to disable')
    
    # Config command
    config_parser = subparsers.add_parser('config', help='Configure agent settings')
    config_parser.add_argument('--timeout', type=int, help='Agent inactivity timeout in seconds')
    config_parser.add_argument('--warning-interval', type=int, help='Warning interval in seconds')
    config_parser.add_argument('--warnings', choices=['enable', 'disable'], 
                              help='Enable or disable timeout warnings')
    config_parser.add_argument('--auto-restart', choices=['enable', 'disable'], 
                              help='Enable or disable auto-restart of inactive agents')
    
    # Save command
    save_parser = subparsers.add_parser('save', help='Save current configuration to file')
    save_parser.add_argument('--file', help='Configuration file path (default: agent_config.json)')
    
    return parser.parse_args()

def show_status():
    """Show status of all agents"""
    if not HAS_AGENT_MODULES:
        print("Agent modules not available, cannot show status")
        return False
    
    manager = get_agent_manager()
    config = get_agent_config_manager()
    
    print("\n=== Agent Status ===")
    print(f"Active agents: {len(manager.active_agents)}")
    print(f"Timeout: {config.get_timeout_seconds()} seconds")
    print(f"Warning interval: {config.get_warning_interval()} seconds")
    print(f"Timeout warnings: {'Enabled' if config.is_timeout_warning_enabled() else 'Disabled'}")
    print(f"Auto-restart: {'Enabled' if config.should_auto_restart() else 'Disabled'}")
    
    print("\n--- Active Agents ---")
    for agent_id, agent in manager.active_agents.items():
        inactive_time = manager.get_agent_inactive_time(agent_id)
        status = "OK" if inactive_time < config.get_timeout_seconds() else "INACTIVE"
        print(f"{agent.__class__.__name__} (ID: {agent_id})")
        print(f"  Type: {agent.agent_type if hasattr(agent, 'agent_type') else 'Unknown'}")
        print(f"  Inactive for: {inactive_time:.1f} seconds")
        print(f"  Status: {status}")
        print("")
    
    return True

def list_agent_types():
    """List available agent types"""
    if not HAS_AGENT_MODULES:
        print("Agent modules not available, cannot list agent types")
        return False
    
    manager = get_agent_manager()
    config = get_agent_config_manager()
    
    print("\n=== Available Agent Types ===")
    enabled_types = config.config.get("enabled_agents", ["*"])
    
    for agent_type in manager.registered_agent_types:
        status = "Enabled" if "*" in enabled_types or agent_type in enabled_types else "Disabled"
        print(f"{agent_type}: {status}")
    
    return True

def enable_agent(agent_type: str):
    """Enable a specific agent type"""
    if not HAS_AGENT_MODULES:
        print("Agent modules not available, cannot enable agent")
        return False
    
    config = get_agent_config_manager()
    
    if config.enable_agent(agent_type):
        print(f"Agent type '{agent_type}' has been enabled")
        return True
    else:
        print(f"Failed to enable agent type '{agent_type}'")
        return False

def disable_agent(agent_type: str):
    """Disable a specific agent type"""
    if not HAS_AGENT_MODULES:
        print("Agent modules not available, cannot disable agent")
        return False
    
    config = get_agent_config_manager()
    
    if config.disable_agent(agent_type):
        print(f"Agent type '{agent_type}' has been disabled")
        return True
    else:
        print(f"Failed to disable agent type '{agent_type}'")
        return False

def configure_settings(timeout: Optional[int] = None, 
                      warning_interval: Optional[int] = None,
                      warnings: Optional[str] = None,
                      auto_restart: Optional[str] = None):
    """Configure agent settings"""
    if not HAS_AGENT_MODULES:
        print("Agent modules not available, cannot configure settings")
        return False
    
    config = get_agent_config_manager()
    changed = False
    
    if timeout is not None:
        config.config["timeout_seconds"] = timeout
        print(f"Timeout set to {timeout} seconds")
        changed = True
    
    if warning_interval is not None:
        config.config["warning_interval"] = warning_interval
        print(f"Warning interval set to {warning_interval} seconds")
        changed = True
    
    if warnings is not None:
        disable_warnings = warnings.lower() == 'disable'
        config.config["disable_timeout_warnings"] = disable_warnings
        print(f"Timeout warnings {'disabled' if disable_warnings else 'enabled'}")
        changed = True
    
    if auto_restart is not None:
        auto_restart_enabled = auto_restart.lower() == 'enable'
        config.config["auto_restart_on_timeout"] = auto_restart_enabled
        print(f"Auto-restart {'enabled' if auto_restart_enabled else 'disabled'}")
        changed = True
    
    if changed:
        if config.save_config():
            print("Configuration saved successfully")
            return True
        else:
            print("Failed to save configuration")
            return False
    else:
        print("No changes to configuration")
        return True

def save_configuration(file_path: Optional[str] = None):
    """Save current configuration to file"""
    if not HAS_AGENT_MODULES:
        print("Agent modules not available, cannot save configuration")
        return False
    
    config = get_agent_config_manager()
    
    if file_path is not None:
        old_file = config.config_file
        config.config_file = file_path
        
        if config.save_config():
            print(f"Configuration saved to {file_path}")
            config.config_file = old_file  # Restore original file path
            return True
        else:
            print(f"Failed to save configuration to {file_path}")
            config.config_file = old_file  # Restore original file path
            return False
    else:
        if config.save_config():
            print(f"Configuration saved to {config.config_file}")
            return True
        else:
            print(f"Failed to save configuration")
            return False

def handle_standalone_mode(args):
    """Handle standalone mode with basic functionality"""
    print("Running in standalone mode with limited functionality")
    
    if args.command == 'save':
        # Implement basic config file save
        config = {
            "timeout_seconds": 600,
            "enabled_agents": ["*"],
            "disable_timeout_warnings": False,
            "warning_interval": 300,
            "auto_restart_on_timeout": False
        }
        
        # Update config based on command-line arguments
        if args.command == 'config':
            if args.timeout is not None:
                config["timeout_seconds"] = args.timeout
            
            if args.warning_interval is not None:
                config["warning_interval"] = args.warning_interval
            
            if args.warnings is not None:
                config["disable_timeout_warnings"] = args.warnings.lower() == 'disable'
            
            if args.auto_restart is not None:
                config["auto_restart_on_timeout"] = args.auto_restart.lower() == 'enable'
        
        # Save configuration to file
        import json
        file_path = args.file if args.file else os.environ.get("AGENT_CONFIG_FILE", "agent_config.json")
        
        try:
            with open(file_path, "w") as f:
                json.dump(config, f, indent=2)
            print(f"Configuration saved to {file_path}")
            return True
        except Exception as e:
            print(f"Failed to save configuration: {str(e)}")
            return False
    
    elif args.command == 'status' or args.command == 'list':
        print("This command requires the agent modules to be available")
        return False
    
    elif args.command in ['enable', 'disable']:
        print(f"Cannot {args.command} agent '{args.agent_type}' in standalone mode")
        return False
    
    elif args.command == 'config':
        print("Configuration changes will not be applied in standalone mode")
        print("Use 'save' command to create a configuration file")
        return False
    
    else:
        print("Command not supported in standalone mode")
        return False

def main():
    """Main function for the CLI"""
    args = parse_args()
    
    if not args.command:
        print("No command specified. Use --help for usage information.")
        return 1
    
    # Handle commands that don't require agent modules
    if args.command == 'help':
        parse_args(['--help'])
        return 0
    
    # Check if we need to run in standalone mode
    if not HAS_AGENT_MODULES:
        return 0 if handle_standalone_mode(args) else 1
    
    # Handle commands that require agent modules
    if args.command == 'status':
        return 0 if show_status() else 1
    
    elif args.command == 'list':
        return 0 if list_agent_types() else 1
    
    elif args.command == 'enable':
        return 0 if enable_agent(args.agent_type) else 1
    
    elif args.command == 'disable':
        return 0 if disable_agent(args.agent_type) else 1
    
    elif args.command == 'config':
        return 0 if configure_settings(
            timeout=args.timeout,
            warning_interval=args.warning_interval,
            warnings=args.warnings,
            auto_restart=args.auto_restart
        ) else 1
    
    elif args.command == 'save':
        return 0 if save_configuration(args.file) else 1
    
    else:
        print(f"Unknown command: {args.command}")
        return 1

if __name__ == "__main__":
    sys.exit(main())