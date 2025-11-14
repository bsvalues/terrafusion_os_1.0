#!/usr/bin/env python3
"""
TerraFusion OS Anti-Hardcode Validation System
Prevents hardcoded values, fictional domains, and static assumptions from being committed
Run this as a pre-commit hook or CI/CD validation step
"""

import os
import re
import sys
import json
from pathlib import Path
from typing import List, Dict, Tuple

# Try to import yaml, but don't fail if not available
try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False
    print("⚠️  Warning: PyYAML not available - YAML validation will be limited")

class HardcodeValidator:
    def __init__(self, repo_root: str):
        self.repo_root = Path(repo_root)
        self.errors = []
        self.warnings = []

        # Patterns to detect hardcoded values
        self.forbidden_patterns = {
            # Fictional domains
            r'assessor\.bentoncounty\.gov': "Fictional domain - use real domain or localhost",
            r'\.bentoncounty\.gov': "Fictional county domain - we don't own bentoncounty.gov",
            r'pacs\.bentoncounty\w+\.gov': "Fictional PACS domain",

            # Hardcoded property counts
            r'\b89447\b': "Hardcoded Benton County property count - use dynamic query",
            r'\b45000\b': "Hardcoded demo property count - use dynamic query",
            r'property_count:\s*\d{4,}': "Hardcoded property count in config - use dynamic counting",
            r'ParcelCount\":\s*\d{4,}': "Hardcoded parcel count in JSON - use dynamic counting",
            r'parcels\":\s*\d{4,}': "Hardcoded parcel count - use dynamic counting",

            # Hardcoded agent counts
            r'QuantumAgentsActive\s*=\s*\d{4,}': "Hardcoded agent count - should be dynamic based on property count",
            r'AI_SWARM_SIZE=\d{4,}': "Hardcoded AI swarm size - should be dynamic",

            # Fictional data
            r'compliance@bentoncounty\.wa\.gov': "Fictional email address",
            r'noreply@bentoncounty\.wa\.gov': "Fictional email address",
        }

        # Allowed real domains
        self.allowed_domains = [
            'localhost',
            '127.0.0.1',
            'terrafusionmarket.io',
            'terrafusionmarket.com',
            'terrafusionmarket.net',
            '*.terrafusionmarket.io',
            '*.terrafusionmarket.com',
            '*.terrafusionmarket.net'
        ]

        # Files to exclude from validation
        self.excluded_files = {
            '.git',
            'node_modules',
            '.vscode',
            '__pycache__',
            '.pytest_cache',
            'bin',
            'obj',
            'dist',
            'build'
        }

        # File extensions to validate
        self.validated_extensions = {
            '.cs', '.ts', '.tsx', '.js', '.jsx', '.py', '.yaml', '.yml',
            '.json', '.toml', '.md', '.txt', '.env', '.template'
        }

    def _should_validate_file(self, file_path: Path) -> bool:
        """Determine if a file should be validated."""
        # Skip files in excluded directories
        for part in file_path.parts:
            if part in self.excluded_files:
                return False

        # Only validate files with specific extensions
        if file_path.suffix not in self.validated_extensions:
            return False

        # Skip very large files (>1MB) to avoid hanging
        try:
            if file_path.stat().st_size > 1024 * 1024:  # 1MB
                return False
        except (OSError, PermissionError):
            return False

        return True

    def validate_file(self, file_path: Path) -> bool:
        """Validate a single file for hardcoded values"""
        if not self._should_validate_file(file_path):
            return True

        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            relative_path = file_path.relative_to(self.repo_root)

            # Check for forbidden patterns
            for pattern, message in self.forbidden_patterns.items():
                matches = re.finditer(pattern, content, re.IGNORECASE)
                for match in matches:
                    line_num = content[:match.start()].count('\n') + 1
                    self.errors.append(f"{relative_path}:{line_num} - {message}")
                    self.errors.append(f"  Found: {match.group()}")

            # Check for domain usage
            self._validate_domains(content, relative_path)

            # Check for suspicious numeric patterns
            self._validate_numeric_patterns(content, relative_path)

            return len(self.errors) == 0

        except Exception as e:
            self.warnings.append(f"Error validating {file_path}: {str(e)}")
            return True

    def _should_validate_file(self, file_path: Path) -> bool:
        """Check if file should be validated"""
        # Skip excluded directories
        for part in file_path.parts:
            if part in self.excluded_files:
                return False

        # Only validate specific extensions
        if file_path.suffix not in self.validated_extensions:
            return False

        return True

    def _validate_domains(self, content: str, file_path: Path):
        """Validate domain usage in content"""
        # Look for domain patterns
        domain_pattern = r'https?://([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})'
        matches = re.finditer(domain_pattern, content)

        for match in matches:
            domain = match.group(1)
            if not self._is_allowed_domain(domain):
                line_num = content[:match.start()].count('\n') + 1
                self.errors.append(f"{file_path}:{line_num} - Unverified domain: {domain}")
                self.errors.append("  Use terrafusionmarket.* domains or localhost only")

    def _is_allowed_domain(self, domain: str) -> bool:
        """Check if domain is in allowed list"""
        domain = domain.lower()

        for allowed in self.allowed_domains:
            if allowed.startswith('*'):
                # Wildcard domain
                suffix = allowed[1:]  # Remove *
                if domain.endswith(suffix):
                    return True
            elif domain == allowed:
                return True

        return False

    def _validate_numeric_patterns(self, content: str, file_path: Path):
        """Look for suspicious hardcoded numbers"""
        # Large numbers that might be property counts
        large_number_pattern = r'\b([1-9]\d{4,6})\b'
        matches = re.finditer(large_number_pattern, content)

        for match in matches:
            number = int(match.group(1))
            # Flag potential property counts (10,000 - 200,000 range)
            if 10000 <= number <= 200000:
                line_num = content[:match.start()].count('\n') + 1
                self.warnings.append(f"{file_path}:{line_num} - Large number detected: {number}")
                self.warnings.append("  Verify this isn't a hardcoded property/parcel count")

    def validate_repository(self) -> bool:
        """Validate entire repository"""
        print("🔍 TerraFusion Anti-Hardcode Validation System")
        print("=" * 50)

        validated_count = 0
        total_files = 0

        # Count files first for progress tracking
        print("📂 Collecting files to scan...")
        files_to_scan = []
        for file_path in self.repo_root.rglob('*'):
            if file_path.is_file() and self._should_validate_file(file_path):
                files_to_scan.append(file_path)

        total_files = len(files_to_scan)
        print(f"📁 Found {total_files} files to validate")

        if total_files == 0:
            print("⚠️  No files found to validate")
            return True

        for i, file_path in enumerate(files_to_scan):
            try:
                # Progress indicator every 25 files or at the end
                if (i + 1) % 25 == 0 or (i + 1) == total_files:
                    progress_percent = ((i + 1) / total_files) * 100
                    print(f"⏳ Progress: {i + 1}/{total_files} ({progress_percent:.1f}%) - {file_path.name}")

                if self.validate_file(file_path):
                    validated_count += 1
            except (OSError, PermissionError) as e:
                # Skip files that can't be accessed (Windows symlinks, etc.)
                continue
            except KeyboardInterrupt:
                print(f"\n⚠️  Validation interrupted by user at file {i + 1}/{total_files}")
                break

        # Print results
        print(f"\n📊 Validation Results:")
        print(f"   ✅ Files validated: {validated_count}/{total_files}")
        print(f"   ⚠️  Warnings found: {len(self.warnings)}")
        print(f"   ❌ Errors found: {len(self.errors)}")

        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)} found):")
            for warning in self.warnings[:10]:  # Limit display to first 10
                print(f"  {warning}")
            if len(self.warnings) > 10:
                print(f"  ... and {len(self.warnings) - 10} more warnings")

        if self.errors:
            print(f"\n❌ CRITICAL ERRORS ({len(self.errors)} found):")
            for error in self.errors[:10]:  # Limit display to first 10
                print(f"  {error}")
            if len(self.errors) > 10:
                print(f"  ... and {len(self.errors) - 10} more errors")
            print("\n🚫 VALIDATION FAILED - Fix errors before committing")
            return False

        print("\n🎉 VALIDATION PASSED - No hardcoded values detected")
        return True

    def validate_critical_files(self) -> bool:
        """Validate only the most critical files for faster feedback."""
        print("🎯 TerraFusion FOCUSED Anti-Hardcode Validation")
        print("=" * 50)

        # Priority file patterns
        critical_patterns = [
            "**/config/**/*.yaml",
            "**/config/**/*.yml",
            "**/config/**/*.json",
            "**/*config*.cs",
            "**/*service*.cs",
            "**/controllers/**/*.cs",
            "**/backend/**/*.cs",
            "**/src/**/*.ts",
            "**/src/**/*.tsx",
            "**/*.env*",
            "**/appsettings*.json"
        ]

        critical_files = []
        for pattern in critical_patterns:
            critical_files.extend(self.repo_root.glob(pattern))

        # Remove duplicates and filter
        critical_files = list(set(f for f in critical_files if self._should_validate_file(f)))

        print(f"🔍 Found {len(critical_files)} critical files to validate")

        if len(critical_files) == 0:
            print("⚠️ No critical files found to validate")
            return True

        validated_count = 0
        for i, file_path in enumerate(critical_files):
            try:
                print(f"⏳ [{i+1}/{len(critical_files)}] Checking: {file_path.relative_to(self.repo_root)}")
                if self.validate_file(file_path):
                    validated_count += 1
            except (OSError, PermissionError):
                continue
            except KeyboardInterrupt:
                print(f"\n⚠️ Validation interrupted at file {i + 1}/{len(critical_files)}")
                break

        # Print results
        print(f"\n📊 Critical File Validation Results:")
        print(f"   ✅ Files validated: {validated_count}/{len(critical_files)}")
        print(f"   ⚠️ Warnings found: {len(self.warnings)}")
        print(f"   ❌ Errors found: {len(self.errors)}")

        if self.warnings:
            print(f"\n⚠️ WARNINGS ({len(self.warnings)} found):")
            for warning in self.warnings:
                print(f"  {warning}")

        if self.errors:
            print(f"\n❌ CRITICAL ERRORS ({len(self.errors)} found):")
            for error in self.errors:
                print(f"  {error}")
            print("\n🚫 VALIDATION FAILED - Fix errors before committing")
            return False

        print("\n🎉 CRITICAL FILES VALIDATION PASSED")
        return True

def main():
    """Main entry point"""
    if len(sys.argv) > 1 and sys.argv[1] == '--focused':
        # Focused mode - only scan critical files
        focused_mode = True
        repo_root = sys.argv[2] if len(sys.argv) > 2 else os.getcwd()
    else:
        focused_mode = False
        repo_root = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()

    validator = HardcodeValidator(repo_root)

    if focused_mode:
        print("🎯 Running in FOCUSED mode - scanning critical files only")
        success = validator.validate_critical_files()
    else:
        success = validator.validate_repository()

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
