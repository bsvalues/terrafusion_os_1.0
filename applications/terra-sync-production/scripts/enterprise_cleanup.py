#!/usr/bin/env python3
import os
import shutil
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set, Any

class EnterpriseCleanup:
    def __init__(self, project_root: str = "."):
        self.project_root = Path(project_root)
        self.setup_logging()
        self.production_files = {
            "app.py", "main.py", "models.py", "requirements.txt", "pyproject.toml",
            "bulletproof_pacs_converter.py", "data_transformation_engine.py",
            "legacy_migration_engine.py", "narrator_ai_plugin.py",
            "pacs_conversion_orchestrator.py", "rbac_manager.py", "rbac_auth.py",
            "security_config.py", "maintenance_schedule.py", "syncservice_wrapper.py",
            "run_syncservice_workflow_8080.py", "enterprise_setup.py"
        }
        self.production_dirs = {
            "templates", "static", "core", "services", "config", "utils",
            "county_configs", "project_data", "api", "docs", "scripts"
        }
        
    def setup_logging(self):
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('enterprise_cleanup.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)
        
    def analyze_codebase(self) -> Dict[str, Any]:
        analysis = {
            "total_files": 0,
            "python_files": 0,
            "template_files": 0,
            "static_files": 0,
            "config_files": 0,
            "unused_files": [],
            "duplicate_files": [],
            "large_files": [],
            "directories_to_clean": []
        }
        
        for root, dirs, files in os.walk(self.project_root):
            if "archive" in root or "__pycache__" in root or ".git" in root:
                continue
                
            for file in files:
                file_path = Path(root) / file
                file_size = file_path.stat().st_size
                analysis["total_files"] += 1
                
                if file.endswith('.py'):
                    analysis["python_files"] += 1
                elif file.endswith('.html'):
                    analysis["template_files"] += 1
                elif file.endswith(('.css', '.js', '.svg', '.png', '.jpg')):
                    analysis["static_files"] += 1
                elif file.endswith(('.json', '.yml', '.yaml', '.toml')):
                    analysis["config_files"] += 1
                    
                if file_size > 1024 * 1024:
                    analysis["large_files"].append(str(file_path))
                    
        return analysis
        
    def clean_unused_files(self):
        self.logger.info("Starting unused file cleanup...")
        
        unused_patterns = [
            "test_*.py", "*_test.py", "debug_*.py", "demo_*.py",
            "quick_*.py", "isolated_*.py", "fix_*.py", "run_*.py"
        ]
        
        moved_count = 0
        for root, dirs, files in os.walk(self.project_root):
            if "archive" in root or "__pycache__" in root:
                continue
                
            for file in files:
                file_path = Path(root) / file
                relative_path = file_path.relative_to(self.project_root)
                
                should_archive = False
                for pattern in unused_patterns:
                    if file_path.match(pattern) and file not in self.production_files:
                        should_archive = True
                        break
                        
                if should_archive:
                    archive_path = self.project_root / "archive" / relative_path
                    archive_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(file_path), str(archive_path))
                    moved_count += 1
                    self.logger.info(f"Archived: {relative_path}")
                    
        self.logger.info(f"Archived {moved_count} unused files")
        
    def clean_duplicate_templates(self):
        self.logger.info("Cleaning duplicate templates...")
        
        templates_dir = self.project_root / "templates"
        if not templates_dir.exists():
            return
            
        duplicate_patterns = [
            "*_old.html", "*_backup.html", "*_v0.html", "*_working.html",
            "*_branded.html", "*_new.html", "*_improved.html"
        ]
        
        moved_count = 0
        for template_file in templates_dir.rglob("*.html"):
            for pattern in duplicate_patterns:
                if template_file.match(pattern):
                    archive_path = self.project_root / "archive" / "templates" / template_file.name
                    archive_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(template_file), str(archive_path))
                    moved_count += 1
                    self.logger.info(f"Archived template: {template_file.name}")
                    break
                    
        self.logger.info(f"Archived {moved_count} duplicate templates")
        
    def clean_pycache(self):
        self.logger.info("Cleaning __pycache__ directories...")
        
        removed_count = 0
        for root, dirs, files in os.walk(self.project_root):
            if "__pycache__" in dirs:
                pycache_path = Path(root) / "__pycache__"
                shutil.rmtree(pycache_path)
                dirs.remove("__pycache__")
                removed_count += 1
                
        self.logger.info(f"Removed {removed_count} __pycache__ directories")
        
    def organize_documentation(self):
        self.logger.info("Organizing documentation...")
        
        doc_files = [
            "README.md", "DEPLOYMENT_SUMMARY.md", "USER_GUIDE_COMPLETE.md",
            "COMPREHENSIVE_PROJECT_REPORT.md", "ENTERPRISE_STATUS_REPORT.md",
            "BACKEND_IMPROVEMENT_ANALYSIS.md", "RECOMMENDATIONS.md"
        ]
        
        docs_dir = self.project_root / "docs"
        docs_dir.mkdir(exist_ok=True)
        
        moved_count = 0
        for doc_file in doc_files:
            source_path = self.project_root / doc_file
            if source_path.exists():
                target_path = docs_dir / doc_file
                shutil.move(str(source_path), str(target_path))
                moved_count += 1
                
        self.logger.info(f"Organized {moved_count} documentation files")
        
    def create_production_structure(self):
        self.logger.info("Creating production directory structure...")
        
        production_dirs = [
            "src/core", "src/services", "src/api", "src/utils",
            "config/environments", "config/security", "config/database",
            "deployment/docker", "deployment/kubernetes", "deployment/terraform",
            "monitoring/logs", "monitoring/metrics", "monitoring/alerts",
            "backup/scripts", "backup/schedules", "backup/restore",
            "security/certificates", "security/policies", "security/audit"
        ]
        
        for dir_path in production_dirs:
            full_path = self.project_root / dir_path
            full_path.mkdir(parents=True, exist_ok=True)
            
        self.logger.info("Created production directory structure")
        
    def generate_cleanup_report(self) -> Dict[str, Any]:
        report = {
            "cleanup_timestamp": datetime.now().isoformat(),
            "analysis": self.analyze_codebase(),
            "actions_performed": [
                "Archived unused test and debug files",
                "Cleaned duplicate templates",
                "Removed __pycache__ directories",
                "Organized documentation",
                "Created production directory structure"
            ],
            "production_files_count": len(self.production_files),
            "production_dirs_count": len(self.production_dirs)
        }
        
        report_path = self.project_root / "enterprise_cleanup_report.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
            
        return report
        
    def run_full_cleanup(self):
        self.logger.info("Starting enterprise cleanup process...")
        
        try:
            self.clean_unused_files()
            self.clean_duplicate_templates()
            self.clean_pycache()
            self.organize_documentation()
            self.create_production_structure()
            
            report = self.generate_cleanup_report()
            self.logger.info("Enterprise cleanup completed successfully")
            return report
            
        except Exception as e:
            self.logger.error(f"Cleanup failed: {str(e)}")
            raise

def main():
    cleanup = EnterpriseCleanup()
    return cleanup.run_full_cleanup()

if __name__ == "__main__":
    main()