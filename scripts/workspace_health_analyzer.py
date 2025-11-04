#!/usr/bin/env python3
"""
TerraFusion Workspace Health Analyzer
Analyzes all 57 workspaces for development readiness
"""

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class WorkspaceAnalyzer:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path)
        self.workspaces_path = self.root_path / "workspaces"
        self.results = {
            "analyzed_at": None,
            "total_workspaces": 0,
            "healthy_workspaces": 0,
            "workspaces_needing_attention": 0,
            "critical_issues": 0,
            "workspace_details": {},
            "categories": {
                "frontend": {"count": 0, "healthy": 0, "issues": []},
                "marketplace": {"count": 0, "healthy": 0, "issues": []},
                "platform": {"count": 0, "healthy": 0, "issues": []},
                "core": {"count": 0, "healthy": 0, "issues": []}
            }
        }

    def find_workspace_files(self) -> List[Path]:
        """Find all .code-workspace files"""
        workspace_files = list(self.workspaces_path.rglob("*.code-workspace"))
        logger.info(f"Found {len(workspace_files)} workspace files")
        return workspace_files

    def analyze_workspace_config(self, workspace_file: Path) -> Dict:
        """Analyze a single workspace configuration"""
        try:
            with open(workspace_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            analysis = {
                "name": workspace_file.stem,
                "path": str(workspace_file.relative_to(self.root_path)),
                "category": self.determine_category(workspace_file),
                "status": "unknown",
                "issues": [],
                "strengths": [],
                "folders": len(config.get("folders", [])),
                "launch_configs": len(config.get("launch", {}).get("configurations", [])),
                "settings": bool(config.get("settings")),
                "extensions": len(config.get("extensions", {}).get("recommendations", []))
            }

            # Check folder paths exist
            missing_folders = []
            existing_folders = []
            for folder in config.get("folders", []):
                folder_path = self.root_path / folder["path"].lstrip("../")
                if folder_path.exists():
                    existing_folders.append(folder["path"])
                else:
                    missing_folders.append(folder["path"])

            analysis["existing_folders"] = len(existing_folders)
            analysis["missing_folders"] = missing_folders

            # Check for package.json in folders
            package_json_folders = []
            for folder in config.get("folders", []):
                folder_path = self.root_path / folder["path"].lstrip("../")
                if (folder_path / "package.json").exists():
                    package_json_folders.append(folder["path"])

            analysis["package_json_folders"] = package_json_folders

            # Determine health status
            if missing_folders:
                analysis["status"] = "critical"
                analysis["issues"].append(f"Missing folders: {', '.join(missing_folders)}")
            elif len(existing_folders) == 0:
                analysis["status"] = "critical"
                analysis["issues"].append("No valid folders found")
            elif len(package_json_folders) == 0 and analysis["category"] in ["frontend", "marketplace"]:
                analysis["status"] = "needs_attention"
                analysis["issues"].append("No package.json files found in expected locations")
            else:
                analysis["status"] = "healthy"
                analysis["strengths"].append(f"{len(existing_folders)} valid folders")
                if package_json_folders:
                    analysis["strengths"].append(f"{len(package_json_folders)} Node.js projects")

            return analysis

        except Exception as e:
            logger.error(f"Error analyzing {workspace_file}: {e}")
            return {
                "name": workspace_file.stem,
                "path": str(workspace_file.relative_to(self.root_path)),
                "category": "unknown",
                "status": "error",
                "issues": [f"Configuration error: {str(e)}"],
                "strengths": []
            }

    def determine_category(self, workspace_file: Path) -> str:
        """Determine workspace category based on path"""
        path_str = str(workspace_file.relative_to(self.workspaces_path))
        
        if path_str.startswith("frontend/"):
            return "frontend"
        elif path_str.startswith("marketplace/"):
            return "marketplace"
        elif path_str.startswith("platform/"):
            return "platform"
        else:
            return "core"

    def check_development_environment(self, workspace_analysis: Dict) -> Dict:
        """Check if development environment is ready for this workspace"""
        env_status = {
            "node_js": False,
            "python": False,
            "rust": False,
            "docker": False,
            "git": False
        }

        try:
            # Check Node.js
            result = subprocess.run(["node", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                env_status["node_js"] = result.stdout.strip()

            # Check Python
            result = subprocess.run(["python", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                env_status["python"] = result.stdout.strip()

            # Check Rust
            result = subprocess.run(["rustc", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                env_status["rust"] = result.stdout.strip()

            # Check Docker
            result = subprocess.run(["docker", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                env_status["docker"] = result.stdout.strip()

            # Check Git
            result = subprocess.run(["git", "--version"], capture_output=True, text=True)
            if result.returncode == 0:
                env_status["git"] = result.stdout.strip()

        except Exception as e:
            logger.warning(f"Environment check failed: {e}")

        return env_status

    def analyze_all_workspaces(self) -> Dict:
        """Analyze all workspaces and generate comprehensive report"""
        from datetime import datetime
        
        logger.info("Starting workspace analysis...")
        workspace_files = self.find_workspace_files()
        
        self.results["analyzed_at"] = datetime.now().isoformat()
        self.results["total_workspaces"] = len(workspace_files)

        for workspace_file in workspace_files:
            logger.info(f"Analyzing {workspace_file.name}")
            analysis = self.analyze_workspace_config(workspace_file)
            
            # Add to category counts
            category = analysis["category"]
            self.results["categories"][category]["count"] += 1
            
            if analysis["status"] == "healthy":
                self.results["healthy_workspaces"] += 1
                self.results["categories"][category]["healthy"] += 1
            elif analysis["status"] == "critical":
                self.results["critical_issues"] += 1
                self.results["categories"][category]["issues"].extend(analysis["issues"])
            else:
                self.results["workspaces_needing_attention"] += 1
                self.results["categories"][category]["issues"].extend(analysis["issues"])

            self.results["workspace_details"][analysis["name"]] = analysis

        # Add environment check
        self.results["development_environment"] = self.check_development_environment({})
        
        logger.info("Analysis complete!")
        return self.results

    def generate_report(self) -> str:
        """Generate human-readable report"""
        report = []
        report.append("🌍 TERRAFUSION WORKSPACE HEALTH REPORT")
        report.append("=" * 50)
        report.append(f"📊 Total Workspaces: {self.results['total_workspaces']}")
        report.append(f"✅ Healthy: {self.results['healthy_workspaces']}")
        report.append(f"⚠️  Need Attention: {self.results['workspaces_needing_attention']}")
        report.append(f"🔴 Critical Issues: {self.results['critical_issues']}")
        report.append("")

        # Category breakdown
        report.append("📋 CATEGORY BREAKDOWN:")
        for category, data in self.results["categories"].items():
            if data["count"] > 0:
                health_pct = (data["healthy"] / data["count"]) * 100 if data["count"] > 0 else 0
                report.append(f"  {category.upper()}: {data['healthy']}/{data['count']} healthy ({health_pct:.1f}%)")

        report.append("")

        # Environment status
        report.append("🛠️  DEVELOPMENT ENVIRONMENT:")
        for tool, status in self.results["development_environment"].items():
            status_icon = "✅" if status else "❌"
            report.append(f"  {status_icon} {tool.replace('_', ' ').title()}: {status if status else 'Not found'}")

        return "\n".join(report)

    def save_results(self, output_file: str = "workspace_analysis_results.json"):
        """Save results to JSON file"""
        output_path = self.root_path / output_file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2)
        logger.info(f"Results saved to {output_path}")

def main():
    if len(sys.argv) > 1:
        root_path = sys.argv[1]
    else:
        root_path = r"C:\Users\bsval\terrafusion_os_1.0"

    analyzer = WorkspaceAnalyzer(root_path)
    results = analyzer.analyze_all_workspaces()
    
    # Generate and display report
    report = analyzer.generate_report()
    print(report)
    
    # Save detailed results
    analyzer.save_results()
    
    return 0 if results["critical_issues"] == 0 else 1

if __name__ == "__main__":
    sys.exit(main())