"""
TerraFusion Configuration Validator

This module provides robust configuration validation with fallback defaults
and clear error messages for county IT staff deployment.
"""

import os
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ConfigValidationResult:
    """Results from configuration validation."""
    valid: bool
    errors: List[str]
    warnings: List[str]
    config: Dict[str, Any]
    fallbacks_used: List[str]

class TerraFusionConfigValidator:
    """
    Validates TerraFusion configuration with intelligent fallbacks
    and user-friendly error messages.
    """
    
    def __init__(self):
        self.required_configs = {
            'DATABASE_URL': {
                'description': 'PostgreSQL database connection string',
                'example': 'postgresql://user:password@localhost:5432/terrafusion',
                'fallback': None,
                'validation': self._validate_database_url
            },
            'SESSION_SECRET': {
                'description': 'Secret key for Flask sessions',
                'example': 'your-secure-random-string-here',
                'fallback': 'terrafusion-dev-key-change-in-production',
                'validation': self._validate_session_secret
            }
        }
        
        self.optional_configs = {
            'NARRATOR_AI_MODEL': {
                'description': 'AI model name for NarratorAI service',
                'example': 'llama3.2:3b',
                'fallback': 'llama3.2:3b',
                'validation': None
            },
            'NARRATOR_AI_URL': {
                'description': 'NarratorAI service URL',
                'example': 'http://localhost:11434',
                'fallback': 'http://localhost:11434',
                'validation': self._validate_url
            },
            'GRAFANA_URL': {
                'description': 'Grafana dashboard URL',
                'example': 'http://localhost:3000',
                'fallback': 'http://localhost:3000',
                'validation': self._validate_url
            },
            'PROMETHEUS_URL': {
                'description': 'Prometheus metrics URL',
                'example': 'http://localhost:9090',
                'fallback': 'http://localhost:9090',
                'validation': self._validate_url
            },
            'LOG_LEVEL': {
                'description': 'Logging level (DEBUG, INFO, WARNING, ERROR)',
                'example': 'INFO',
                'fallback': 'INFO',
                'validation': self._validate_log_level
            },
            'BACKUP_ENABLED': {
                'description': 'Enable automatic database backups',
                'example': 'true',
                'fallback': 'true',
                'validation': self._validate_boolean
            },
            'BACKUP_RETENTION_DAYS': {
                'description': 'Number of days to retain backup files',
                'example': '7',
                'fallback': '7',
                'validation': self._validate_positive_integer
            }
        }
    
    def validate_configuration(self) -> ConfigValidationResult:
        """
        Validate the complete TerraFusion configuration.
        
        Returns:
            ConfigValidationResult with validation status and processed config
        """
        errors = []
        warnings = []
        config = {}
        fallbacks_used = []
        
        logger.info("🔍 Validating TerraFusion configuration...")
        
        # Check required configurations
        for key, spec in self.required_configs.items():
            value = os.environ.get(key)
            
            if not value:
                if spec['fallback']:
                    config[key] = spec['fallback']
                    fallbacks_used.append(f"{key} (using fallback)")
                    warnings.append(f"Missing {key}, using fallback value")
                else:
                    errors.append(f"Required configuration {key} is missing")
                    continue
            else:
                config[key] = value
            
            # Run validation if specified
            if spec['validation'] and key in config:
                validation_error = spec['validation'](config[key])
                if validation_error:
                    errors.append(f"{key}: {validation_error}")
        
        # Check optional configurations
        for key, spec in self.optional_configs.items():
            value = os.environ.get(key)
            
            if not value:
                config[key] = spec['fallback']
                fallbacks_used.append(f"{key} (using default)")
            else:
                config[key] = value
            
            # Run validation if specified
            if spec['validation'] and key in config:
                validation_error = spec['validation'](config[key])
                if validation_error:
                    warnings.append(f"{key}: {validation_error}")
                    config[key] = spec['fallback']
                    fallbacks_used.append(f"{key} (validation failed, using default)")
        
        # Check for deprecated or unknown environment variables
        self._check_deprecated_configs(warnings)
        
        is_valid = len(errors) == 0
        
        result = ConfigValidationResult(
            valid=is_valid,
            errors=errors,
            warnings=warnings,
            config=config,
            fallbacks_used=fallbacks_used
        )
        
        self._log_validation_result(result)
        return result
    
    def generate_config_template(self, output_path: str = ".env.template") -> None:
        """
        Generate a configuration template file for county IT staff.
        
        Args:
            output_path: Path to write the template file
        """
        template_content = """# TerraFusion Platform Configuration Template
# Copy this file to .env and update the values for your environment

# === REQUIRED CONFIGURATION ===
"""
        
        for key, spec in self.required_configs.items():
            template_content += f"\n# {spec['description']}\n"
            template_content += f"# Example: {spec['example']}\n"
            if spec['fallback']:
                template_content += f"{key}={spec['fallback']}\n"
            else:
                template_content += f"#{key}=your-value-here\n"
        
        template_content += "\n# === OPTIONAL CONFIGURATION ===\n"
        
        for key, spec in self.optional_configs.items():
            template_content += f"\n# {spec['description']}\n"
            template_content += f"# Example: {spec['example']}\n"
            template_content += f"#{key}={spec['fallback']}\n"
        
        template_content += """
# === DEPLOYMENT NOTES ===
# 1. Ensure PostgreSQL database is running and accessible
# 2. Update DATABASE_URL with your actual database credentials
# 3. Change SESSION_SECRET to a secure random string in production
# 4. Configure AI services if using NarratorAI features
# 5. Set up monitoring URLs for Grafana and Prometheus

# === SUPPORT ===
# For configuration help, see README.md or contact your system administrator
"""
        
        with open(output_path, 'w') as f:
            f.write(template_content)
        
        logger.info(f"📝 Configuration template created: {output_path}")
    
    def create_startup_report(self, config_result: ConfigValidationResult) -> str:
        """
        Create a user-friendly startup report for county IT staff.
        
        Args:
            config_result: Result from configuration validation
            
        Returns:
            Formatted startup report
        """
        report = "🚀 TerraFusion Platform Startup Report\n"
        report += "=" * 50 + "\n\n"
        
        if config_result.valid:
            report += "✅ Configuration Status: VALID\n"
            report += "🟢 System is ready to start\n\n"
        else:
            report += "❌ Configuration Status: INVALID\n"
            report += "🔴 System cannot start with current configuration\n\n"
        
        if config_result.errors:
            report += "🚨 ERRORS (Must be fixed):\n"
            for error in config_result.errors:
                report += f"   • {error}\n"
            report += "\n"
        
        if config_result.warnings:
            report += "⚠️  WARNINGS (Recommended to review):\n"
            for warning in config_result.warnings:
                report += f"   • {warning}\n"
            report += "\n"
        
        if config_result.fallbacks_used:
            report += "🔄 FALLBACK VALUES USED:\n"
            for fallback in config_result.fallbacks_used:
                report += f"   • {fallback}\n"
            report += "\n"
        
        report += "📋 ACTIVE CONFIGURATION:\n"
        for key, value in config_result.config.items():
            # Mask sensitive values
            display_value = self._mask_sensitive_value(key, value)
            report += f"   • {key}: {display_value}\n"
        
        report += "\n📞 SUPPORT:\n"
        report += "   • Documentation: README.md files in project directory\n"
        report += "   • Health Check: /api/status endpoint\n"
        report += "   • Configuration Help: /api/help endpoint\n"
        
        return report
    
    def _validate_database_url(self, url: str) -> Optional[str]:
        """Validate database URL format."""
        if not url.startswith(('postgresql://', 'postgres://')):
            return "Database URL must start with postgresql:// or postgres://"
        
        if '@' not in url or '/' not in url:
            return "Database URL appears to be malformed"
        
        return None
    
    def _validate_session_secret(self, secret: str) -> Optional[str]:
        """Validate session secret strength."""
        if len(secret) < 16:
            return "Session secret should be at least 16 characters long"
        
        if secret == 'terrafusion-dev-key-change-in-production':
            return "Please change the default session secret for production"
        
        return None
    
    def _validate_url(self, url: str) -> Optional[str]:
        """Validate URL format."""
        if not url.startswith(('http://', 'https://')):
            return "URL must start with http:// or https://"
        
        return None
    
    def _validate_log_level(self, level: str) -> Optional[str]:
        """Validate logging level."""
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if level.upper() not in valid_levels:
            return f"Log level must be one of: {', '.join(valid_levels)}"
        
        return None
    
    def _validate_boolean(self, value: str) -> Optional[str]:
        """Validate boolean string."""
        if value.lower() not in ['true', 'false', '1', '0', 'yes', 'no']:
            return "Boolean value must be true/false, 1/0, or yes/no"
        
        return None
    
    def _validate_positive_integer(self, value: str) -> Optional[str]:
        """Validate positive integer."""
        try:
            int_value = int(value)
            if int_value <= 0:
                return "Value must be a positive integer"
        except ValueError:
            return "Value must be a valid integer"
        
        return None
    
    def _check_deprecated_configs(self, warnings: List[str]) -> None:
        """Check for deprecated configuration variables."""
        deprecated_vars = {
            'FLASK_ENV': 'Use LOG_LEVEL instead',
            'DEBUG': 'Use LOG_LEVEL=DEBUG instead',
            'AI_SERVICE_URL': 'Use NARRATOR_AI_URL instead'
        }
        
        for deprecated, replacement in deprecated_vars.items():
            if os.environ.get(deprecated):
                warnings.append(f"Deprecated config {deprecated} found. {replacement}")
    
    def _mask_sensitive_value(self, key: str, value: str) -> str:
        """Mask sensitive configuration values for display."""
        sensitive_keys = ['DATABASE_URL', 'SESSION_SECRET', 'PASSWORD', 'TOKEN', 'KEY']
        
        if any(sensitive in key.upper() for sensitive in sensitive_keys):
            if len(value) > 8:
                return value[:4] + "*" * (len(value) - 8) + value[-4:]
            else:
                return "*" * len(value)
        
        return value
    
    def _log_validation_result(self, result: ConfigValidationResult) -> None:
        """Log validation results with appropriate levels."""
        if result.valid:
            logger.info("✅ Configuration validation passed")
            if result.warnings:
                logger.warning(f"⚠️  {len(result.warnings)} warnings found")
            if result.fallbacks_used:
                logger.info(f"🔄 Using {len(result.fallbacks_used)} fallback values")
        else:
            logger.error(f"❌ Configuration validation failed with {len(result.errors)} errors")
            for error in result.errors:
                logger.error(f"   • {error}")

def validate_and_configure() -> ConfigValidationResult:
    """
    Main function to validate configuration and set up environment.
    
    Returns:
        Configuration validation result
    """
    validator = TerraFusionConfigValidator()
    result = validator.validate_configuration()
    
    # Generate template if no .env file exists
    if not Path('.env').exists():
        validator.generate_config_template()
        logger.info("📝 Created .env.template - copy and customize for your environment")
    
    # Print startup report
    report = validator.create_startup_report(result)
    
    return result

if __name__ == "__main__":
    # CLI interface for configuration validation
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == '--template':
        validator = TerraFusionConfigValidator()
        validator.generate_config_template()
    else:
        result = validate_and_configure()
        sys.exit(0 if result.valid else 1)