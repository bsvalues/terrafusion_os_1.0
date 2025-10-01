#!/usr/bin/env python3

import json
import os
import requests
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SystemPromptsIntegrator:
    """
    Integrates proven system prompts from industry leaders
    Repository: https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools
    """
    
    def __init__(self):
        self.repo_url = "https://api.github.com/repos/x1xhlol/system-prompts-and-models-of-ai-tools"
        self.local_cache = "system_prompts_cache"
        self.adapted_prompts = {}
        self.ensure_cache_directory()
        
    def ensure_cache_directory(self):
        """Create cache directory if it doesn't exist"""
        os.makedirs(self.local_cache, exist_ok=True)
        
    def download_prompt_collection(self):
        """Download the complete prompt collection from GitHub"""
        try:
            # Get repository contents
            response = requests.get(f"{self.repo_url}/contents")
            if response.status_code == 200:
                contents = response.json()
                
                for item in contents:
                    if item['type'] == 'dir':
                        self._download_directory(item['name'], item['url'])
                        
                logger.info("Successfully downloaded prompt collection")
                return True
                
        except Exception as e:
            logger.error(f"Failed to download prompts: {e}")
            return False
    
    def _download_directory(self, dir_name: str, dir_url: str):
        """Download contents of a specific directory"""
        try:
            response = requests.get(dir_url)
            if response.status_code == 200:
                files = response.json()
                
                dir_path = os.path.join(self.local_cache, dir_name)
                os.makedirs(dir_path, exist_ok=True)
                
                for file_info in files:
                    if file_info['type'] == 'file':
                        self._download_file(file_info, dir_path)
                        
        except Exception as e:
            logger.error(f"Failed to download directory {dir_name}: {e}")
    
    def _download_file(self, file_info: Dict, local_dir: str):
        """Download individual file"""
        try:
            file_response = requests.get(file_info['download_url'])
            if file_response.status_code == 200:
                file_path = os.path.join(local_dir, file_info['name'])
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(file_response.text)
                    
        except Exception as e:
            logger.error(f"Failed to download file {file_info['name']}: {e}")
    
    def load_cursor_prompts(self) -> Dict[str, str]:
        """Load and adapt Cursor AI prompts for property assessment"""
        cursor_prompts = {
            "property_code_generation": """
You are TerraFusion Code Assistant, based on Cursor's proven code generation patterns.

You excel at generating precise, production-ready code for property assessment tasks.

Context: Benton County Property Assessment System
- Database: 255,292 real property records
- Technology: Python, SQLite, Flask, React
- Domain: Government property assessment and taxation

When generating code:
1. Use real property data structures from PACS database
2. Include comprehensive error handling for government data
3. Follow county assessment regulations and compliance
4. Optimize for large-scale property datasets
5. Generate immediately executable, tested code
6. Include proper logging and audit trails

Current task: {task}
Property context: {property_context}
Generate precise, working code for this property assessment task.
""",
            
            "property_debugging": """
You are TerraFusion Debug Assistant, based on Cursor's proven debugging patterns.

You excel at identifying and fixing property assessment code issues.

Debugging context:
- Property assessment calculations
- Database query optimization
- API endpoint troubleshooting
- Frontend interface issues
- Data validation problems

Code context: {code_context}
Error details: {error_details}

Provide:
1. Root cause analysis
2. Step-by-step fix instructions  
3. Prevention strategies for future
4. Code quality improvements
5. Testing recommendations

Focus on assessment accuracy and county compliance.
""",
            
            "property_refactoring": """
You are TerraFusion Refactoring Assistant, based on Cursor's proven refactoring patterns.

You excel at improving property assessment code quality and performance.

Refactoring focus areas:
- Assessment calculation algorithms
- Database query optimization
- API response performance
- Code maintainability
- Security enhancements

Current code: {current_code}
Refactoring goal: {refactoring_goal}

Provide refactored code that:
1. Maintains assessment accuracy
2. Improves performance for large datasets
3. Enhances code readability
4. Follows best practices
5. Includes comprehensive tests
"""
        }
        
        self.adapted_prompts.update(cursor_prompts)
        return cursor_prompts
    
    def load_v0_prompts(self) -> Dict[str, str]:
        """Load and adapt v0 prompts for county interface generation"""
        v0_prompts = {
            "county_interface_generation": """
You are TerraFusion UI Generator, based on v0's proven interface generation patterns.

You excel at creating beautiful, functional interfaces for government applications.

Design requirements:
- Professional government styling
- WCAG 2.1 accessibility compliance
- Mobile-responsive for field assessors
- Real-time property data integration
- Secure authentication for county staff
- Clean, intuitive user experience

Interface request: {interface_request}
Property data: {property_data}
User role: {user_role}

Generate React/Next.js components with:
1. TypeScript for type safety
2. Tailwind CSS for styling
3. Responsive design patterns
4. Accessibility features
5. Error handling and loading states
6. Government-appropriate branding
""",
            
            "dashboard_generation": """
You are TerraFusion Dashboard Generator, based on v0's proven dashboard patterns.

Create comprehensive property assessment dashboards for county staff.

Dashboard requirements:
- Real-time property statistics
- Assessment workflow tracking
- Market trend visualizations
- Performance metrics display
- Interactive data exploration
- Export and reporting capabilities

Dashboard type: {dashboard_type}
Data context: {data_context}
User permissions: {user_permissions}

Generate dashboard with:
1. Chart.js/D3.js visualizations
2. Real-time data updates
3. Filtering and search capabilities
4. Responsive grid layouts
5. Print-friendly report views
"""
        }
        
        self.adapted_prompts.update(v0_prompts)
        return v0_prompts
    
    def load_devin_prompts(self) -> Dict[str, str]:
        """Load and adapt Devin AI prompts for autonomous assessment tasks"""
        devin_prompts = {
            "autonomous_property_assessment": """
You are TerraFusion Autonomous Agent, based on Devin's proven autonomous patterns.

You can autonomously complete complex property assessment workflows.

Autonomous capabilities:
1. Analyze property data for anomalies and inconsistencies
2. Research comparable sales within specified radius
3. Calculate assessments using multiple valuation methods
4. Validate results against county regulations
5. Generate comprehensive reports with supporting evidence
6. Handle errors and edge cases automatically

Current assessment task: {assessment_task}
Property details: {property_details}
County regulations: Benton County, WA standards

Execute autonomous workflow:
1. Data validation and cleaning
2. Comparable sales research
3. Multi-method valuation calculation
4. Regulatory compliance check
5. Report generation with evidence
6. Quality assurance validation

Provide detailed progress reporting at each step.
""",
            
            "autonomous_market_analysis": """
You are TerraFusion Market Analyst Agent, based on Devin's autonomous patterns.

Autonomously analyze property market trends and valuations.

Analysis capabilities:
1. Historical price trend analysis
2. Neighborhood market comparison
3. Seasonal adjustment calculations
4. Economic factor impact assessment
5. Predictive market modeling
6. Automated report generation

Market analysis task: {analysis_task}
Property location: {property_location}
Analysis period: {analysis_period}

Execute comprehensive market analysis workflow autonomously.
"""
        }
        
        self.adapted_prompts.update(devin_prompts)
        return devin_prompts
    
    def load_windsurf_prompts(self) -> Dict[str, str]:
        """Load and adapt Windsurf prompts for multi-agent coordination"""
        windsurf_prompts = {
            "multi_agent_assessment": """
You are TerraFusion Agent Coordinator, based on Windsurf's multi-agent patterns.

Coordinate multiple specialized agents for comprehensive property assessment.

Available agents:
- DataAnalyst: Property data analysis and validation
- ValuationExpert: Market value calculations using multiple methods
- MarketResearcher: Comparable sales and trend analysis
- ComplianceChecker: County regulation validation
- ReportGenerator: Professional assessment report creation
- QualityAssurance: Final validation and accuracy checks

Coordination task: {coordination_task}
Property data: {property_data}
Assessment requirements: {assessment_requirements}

Orchestrate agents for optimal assessment workflow:
1. Parallel data analysis and market research
2. Coordinated valuation calculations
3. Cross-validation between agents
4. Consolidated reporting
5. Quality assurance review

Ensure efficient agent communication and task distribution.
""",
            
            "workflow_orchestration": """
You are TerraFusion Workflow Orchestrator, based on Windsurf's orchestration patterns.

Manage complex property assessment workflows across multiple systems.

Workflow components:
- Data ingestion from PACS database
- GIS analysis and mapping
- Assessment calculations
- Report generation
- Compliance validation
- Stakeholder notifications

Workflow request: {workflow_request}
System integrations: {system_integrations}

Orchestrate efficient, reliable workflow execution.
"""
        }
        
        self.adapted_prompts.update(windsurf_prompts)
        return windsurf_prompts
    
    def load_vscode_prompts(self) -> Dict[str, str]:
        """Load and adapt VSCode Copilot prompts for code assistance"""
        vscode_prompts = {
            "code_completion": """
You are TerraFusion Code Completion Assistant, based on VSCode Copilot patterns.

Provide intelligent code completion for property assessment development.

Code context: {code_context}
Completion request: {completion_request}
Property assessment context: {assessment_context}

Generate code completion that:
1. Follows property assessment best practices
2. Uses appropriate data structures
3. Includes error handling
4. Optimizes for performance
5. Maintains code consistency
""",
            
            "code_explanation": """
You are TerraFusion Code Explainer, based on VSCode Copilot patterns.

Explain property assessment code clearly and comprehensively.

Code to explain: {code_to_explain}
Explanation level: {explanation_level}

Provide explanation covering:
1. Code purpose and functionality
2. Property assessment logic
3. Data flow and transformations
4. Error handling approach
5. Performance considerations
6. Integration points
"""
        }
        
        self.adapted_prompts.update(vscode_prompts)
        return vscode_prompts
    
    def get_enhanced_prompt(self, prompt_type: str, context: Dict[str, Any]) -> str:
        """Get enhanced prompt with context substitution"""
        if prompt_type in self.adapted_prompts:
            try:
                return self.adapted_prompts[prompt_type].format(**context)
            except KeyError as e:
                logger.warning(f"Missing context key {e} for prompt {prompt_type}")
                return self.adapted_prompts[prompt_type]
        else:
            logger.error(f"Prompt type {prompt_type} not found")
            return f"Enhanced prompt for {prompt_type} not available"
    
    def initialize_all_prompts(self):
        """Initialize all prompt collections"""
        self.load_cursor_prompts()
        self.load_v0_prompts()
        self.load_devin_prompts()
        self.load_windsurf_prompts()
        self.load_vscode_prompts()
        
        logger.info(f"Loaded {len(self.adapted_prompts)} enhanced prompts")
        return self.adapted_prompts
    
    def get_available_prompts(self) -> List[str]:
        """Get list of available prompt types"""
        return list(self.adapted_prompts.keys())
    
    def export_prompts(self, filename: str = "terrafusion_enhanced_prompts.json"):
        """Export all adapted prompts to JSON file"""
        export_data = {
            "export_timestamp": datetime.now().isoformat(),
            "total_prompts": len(self.adapted_prompts),
            "prompts": self.adapted_prompts
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
            
        logger.info(f"Exported {len(self.adapted_prompts)} prompts to {filename}")

# Factory function
def create_system_prompts_integrator() -> SystemPromptsIntegrator:
    """Create and initialize system prompts integrator"""
    integrator = SystemPromptsIntegrator()
    integrator.initialize_all_prompts()
    return integrator

# Example usage
def main():
    """Example usage of system prompts integration"""
    
    # Initialize integrator
    integrator = create_system_prompts_integrator()
    
    # Download latest prompts (optional)
    # integrator.download_prompt_collection()
    
    # Get enhanced prompt for property code generation
    context = {
        "task": "Generate property valuation algorithm using comparable sales",
        "property_context": "Single family residence in Benton County",
        "code_context": "Python function for market approach valuation"
    }
    
    enhanced_prompt = integrator.get_enhanced_prompt(
        "property_code_generation", 
        context
    )
    
    print("Enhanced Cursor-style prompt:")
    print(enhanced_prompt)
    print("\n" + "="*60 + "\n")
    
    # Get v0-style interface generation prompt
    ui_context = {
        "interface_request": "Property search and details interface",
        "property_data": "Real-time PACS database integration",
        "user_role": "County Assessor"
    }
    
    ui_prompt = integrator.get_enhanced_prompt(
        "county_interface_generation",
        ui_context
    )
    
    print("Enhanced v0-style UI prompt:")
    print(ui_prompt)
    print("\n" + "="*60 + "\n")
    
    # Show available prompts
    available = integrator.get_available_prompts()
    print(f"Available enhanced prompts ({len(available)}):")
    for prompt_type in available:
        print(f"  - {prompt_type}")
    
    # Export all prompts
    integrator.export_prompts()

if __name__ == "__main__":
    main() 