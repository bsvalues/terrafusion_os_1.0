import logging
from collections import defaultdict

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_summary_report(analysis_results):
    """
    Generate a comprehensive summary report based on all analysis results
    
    Parameters:
    - analysis_results: Dict containing all analysis results
    
    Returns:
    - dict: Summary report with key findings and recommendations
    """
    logger.info("Generating summary report...")
    
    # Initialize summary structure
    summary = {
        'key_findings': {},
        'recommendations': {}
    }
    
    # Extract repo structure findings
    if 'repository_structure' in analysis_results:
        repo_structure = analysis_results['repository_structure']
        structure_findings = []
        
        file_count = repo_structure.get('file_count', 0)
        directory_count = repo_structure.get('directory_count', 0)
        file_types = repo_structure.get('file_types', [])
        
        if file_count > 0:
            structure_findings.append(f"Repository contains {file_count} files in {directory_count} directories")
        
        # Identify main file types
        if file_types:
            main_types = []
            for file_type in file_types[:5]:  # Top 5 file types
                ext = file_type.get('extension', 'unknown')
                count = file_type.get('count', 0)
                if count > 0:
                    main_types.append(f"{ext.lstrip('.')} ({count} files)")
            
            if main_types:
                structure_findings.append(f"Main file types: {', '.join(main_types)}")
        
        if structure_findings:
            summary['key_findings']['Repository Structure'] = structure_findings
    
    # Extract code review findings
    if 'code_review' in analysis_results:
        code_review = analysis_results['code_review']
        code_findings = []
        
        metrics = code_review.get('metrics', {})
        if metrics:
            if 'total_loc' in metrics:
                code_findings.append(f"Total lines of code: {metrics['total_loc']}")
            
            if 'average_complexity' in metrics:
                avg_complexity = metrics['average_complexity']
                complexity_assessment = "low"
                if avg_complexity > 7:
                    complexity_assessment = "high"
                elif avg_complexity > 4:
                    complexity_assessment = "moderate"
                
                code_findings.append(f"Average code complexity: {avg_complexity} ({complexity_assessment})")
            
            if 'issue_density' in metrics:
                issue_density = metrics['issue_density']
                quality_assessment = "high"
                if issue_density > 5:
                    quality_assessment = "low"
                elif issue_density > 2:
                    quality_assessment = "moderate"
                
                code_findings.append(f"Code quality is {quality_assessment} ({issue_density:.1f} issues per 1000 lines)")
        
        # Extract top issues
        files_with_issues = code_review.get('files_with_issues', [])
        if files_with_issues:
            # Group by issue type
            issue_counts = defaultdict(int)
            for file_issue in files_with_issues:
                for detail in file_issue.get('details', []):
                    if 'long method' in detail.lower():
                        issue_counts['long_methods'] += 1
                    elif 'complex method' in detail.lower():
                        issue_counts['complex_methods'] += 1
                    elif 'nested conditional' in detail.lower():
                        issue_counts['nested_conditionals'] += 1
                    elif 'commented code' in detail.lower():
                        issue_counts['commented_code'] += 1
                    elif 'too many parameters' in detail.lower():
                        issue_counts['too_many_parameters'] += 1
            
            # Report top issues
            top_issues = []
            for issue_type, count in issue_counts.items():
                if count > 0:
                    issue_name = issue_type.replace('_', ' ').title()
                    top_issues.append(f"{issue_name}: {count}")
            
            if top_issues:
                code_findings.append(f"Main code issues: {', '.join(top_issues[:3])}")
        
        if code_findings:
            summary['key_findings']['Code Quality'] = code_findings
        
        # Add code improvement recommendations
        code_recommendations = []
        for category, opportunities in code_review.get('improvement_opportunities', {}).items():
            for opportunity in opportunities[:2]:  # Top 2 recommendations per category
                code_recommendations.append(opportunity)
        
        if code_recommendations:
            summary['recommendations']['Code Improvements'] = code_recommendations
    
    # Extract database analysis findings
    if 'database_analysis' in analysis_results:
        db_analysis = analysis_results['database_analysis']
        db_findings = []
        
        db_files = db_analysis.get('database_files', [])
        if db_files:
            db_findings.append(f"Found {len(db_files)} database-related files")
        
        models = db_analysis.get('database_models', {})
        if models:
            db_findings.append(f"Identified {len(models)} database models")
            
            # Extract ORM frameworks
            orm_types = db_analysis.get('orm_types', [])
            if orm_types:
                db_findings.append(f"Database ORM frameworks: {', '.join(orm_types)}")
        
        raw_sql = db_analysis.get('raw_sql_queries', [])
        if raw_sql:
            db_findings.append(f"Found {len(raw_sql)} raw SQL queries in the codebase")
        
        redundancies = db_analysis.get('redundancies', [])
        if redundancies:
            similar_models = len([r for r in redundancies if r.get('type') == 'similar_models'])
            inconsistent_fields = len([r for r in redundancies if r.get('type') == 'inconsistent_field_types'])
            
            if similar_models > 0:
                db_findings.append(f"Detected {similar_models} potentially redundant models")
            
            if inconsistent_fields > 0:
                db_findings.append(f"Found {inconsistent_fields} inconsistent field types across models")
        
        if db_findings:
            summary['key_findings']['Database Structure'] = db_findings
        
        # Add database recommendations
        db_recommendations = db_analysis.get('consolidation_recommendations', [])
        if db_recommendations:
            summary['recommendations']['Database Improvements'] = db_recommendations[:5]  # Top 5 recommendations
    
    # Extract modularization findings
    if 'modularization' in analysis_results:
        modularization = analysis_results['modularization']
        mod_findings = []
        
        modules = modularization.get('current_modules', [])
        if modules:
            mod_findings.append(f"Identified {len(modules)} natural modules in the codebase")
        
        high_coupling = modularization.get('highly_coupled_files', [])
        if high_coupling:
            mod_findings.append(f"Found {len(high_coupling)} files with high coupling")
        
        cycles = modularization.get('circular_dependencies', [])
        if cycles:
            mod_findings.append(f"Detected {len(cycles)} circular dependency cycles")
        
        if mod_findings:
            summary['key_findings']['Code Modularization'] = mod_findings
        
        # Add modularization recommendations
        mod_recommendations = modularization.get('recommendations', [])
        if mod_recommendations:
            summary['recommendations']['Modularization Improvements'] = mod_recommendations[:5]  # Top 5 recommendations
    
    # Extract agent readiness findings
    if 'agent_readiness' in analysis_results:
        agent_readiness = analysis_results['agent_readiness']
        agent_findings = []
        
        ml_components = agent_readiness.get('ml_components', [])
        if ml_components:
            agent_findings.append(f"Found {len(ml_components)} machine learning components")
            
            # Extract ML libraries used
            all_libraries = set()
            for component in ml_components:
                all_libraries.update(component.get('ml_libraries', []))
                all_libraries.update(component.get('agent_libraries', []))
            
            if all_libraries:
                top_libraries = list(all_libraries)[:5]  # Top 5 libraries
                agent_findings.append(f"ML/AI libraries used: {', '.join(top_libraries)}")
        
        assessment = agent_readiness.get('assessment', [])
        if assessment:
            scores = [item.get('score', 0) for item in assessment]
            avg_score = sum(scores) / len(scores) if scores else 0
            
            readiness_level = "low"
            if avg_score > 7:
                readiness_level = "high"
            elif avg_score > 4:
                readiness_level = "moderate"
            
            agent_findings.append(f"Agent-readiness level: {readiness_level} (score: {avg_score:.1f}/10)")
        
        if agent_findings:
            summary['key_findings']['Agent Readiness'] = agent_findings
        
        # Add agent readiness recommendations
        agent_recommendations = agent_readiness.get('recommendations', [])
        if agent_recommendations:
            summary['recommendations']['Agent Integration'] = agent_recommendations[:5]  # Top 5 recommendations
    
    # Extract workflow patterns findings
    if 'workflow_patterns' in analysis_results:
        workflow = analysis_results['workflow_patterns']
        workflow_findings = []
        
        workflows = workflow.get('workflows', [])
        if workflows:
            # Extract unique workflow patterns
            all_patterns = set()
            for wf in workflows:
                all_patterns.update(wf.get('patterns', []))
            
            if all_patterns:
                workflow_findings.append(f"Identified workflow patterns: {', '.join(all_patterns)}")
            else:
                workflow_findings.append(f"Found {len(workflows)} files with workflow components")
        
        entry_points = workflow.get('entry_points', [])
        if entry_points:
            entry_types = defaultdict(int)
            for entry in entry_points:
                entry_types[entry.get('type', 'unknown')] += 1
            
            entry_summary = []
            for entry_type, count in entry_types.items():
                entry_name = entry_type.replace('_', ' ').title()
                entry_summary.append(f"{entry_name}: {count}")
            
            if entry_summary:
                workflow_findings.append(f"Workflow entry points: {', '.join(entry_summary)}")
        
        if workflow_findings:
            summary['key_findings']['Workflow Patterns'] = workflow_findings
        
        # Add workflow recommendations
        workflow_recommendations = workflow.get('standardization_recommendations', [])
        if workflow_recommendations:
            summary['recommendations']['Workflow Standardization'] = workflow_recommendations[:5]  # Top 5 recommendations
    
    # Add general recommendations if needed
    if not summary['recommendations']:
        summary['recommendations']['General'] = [
            "Start by addressing high-complexity code areas to improve maintainability",
            "Document architecture and module boundaries",
            "Implement consistent coding standards across the codebase",
            "Add automated tests to ensure code quality"
        ]
    
    logger.info("Summary report generation complete")
    return summary