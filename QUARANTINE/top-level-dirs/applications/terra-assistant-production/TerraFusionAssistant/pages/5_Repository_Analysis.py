import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import plotly.express as px
import matplotlib.pyplot as plt
import networkx as nx
import json
import os
import re
import time
import random
from datetime import datetime
import uuid

# Set page configuration
st.set_page_config(page_title="Repository Analysis", page_icon="📂", layout="wide")

# Initialize session state variables if not already set
if "selected_repository" not in st.session_state:
    st.session_state.selected_repository = None

if "repository_files" not in st.session_state:
    st.session_state.repository_files = []

if "repository_name" not in st.session_state:
    st.session_state.repository_name = ""

if "repository_language" not in st.session_state:
    st.session_state.repository_language = ""

if "file_contents" not in st.session_state:
    st.session_state.file_contents = {}

if "current_file" not in st.session_state:
    st.session_state.current_file = None

if "analysis_results" not in st.session_state:
    st.session_state.analysis_results = None

if "file_analysis" not in st.session_state:
    st.session_state.file_analysis = {}

if "repository_metrics" not in st.session_state:
    st.session_state.repository_metrics = None

# Helper functions for repository analysis
def generate_repository_analysis(files, primary_language):
    """Generate analysis results for a repository"""
    
    # In a real implementation, this would perform actual code analysis
    # For demonstration purposes, we're using simulated data
    
    analysis = {
        "strengths": [
            {
                "title": "Well-structured code organization",
                "description": "The code is organized into clear, logical components with good separation of concerns."
            },
            {
                "title": "Consistent naming conventions",
                "description": "The codebase follows consistent naming conventions, making it more readable and maintainable."
            },
            {
                "title": "Comprehensive test coverage",
                "description": "The codebase includes tests for core functionality, reducing the risk of regressions."
            }
        ],
        "weaknesses": [
            {
                "title": "High complexity in some modules",
                "description": "Several modules have high cyclomatic complexity, making them harder to understand and test."
            },
            {
                "title": "Limited documentation",
                "description": "Some parts of the codebase lack sufficient documentation, which may impede understanding and maintenance."
            },
            {
                "title": "Inconsistent error handling",
                "description": "Error handling approaches vary across the codebase, potentially leading to unpredictable behavior."
            }
        ],
        "issues": [
            {
                "title": "Potential security vulnerability",
                "description": "Possible SQL injection vulnerability in database queries",
                "severity": "critical",
                "file_path": "src/controllers/userController.js",
                "line": 42
            },
            {
                "title": "Performance concern",
                "description": "Inefficient data processing could lead to performance issues with large datasets",
                "severity": "high",
                "file_path": "src/services/dataService.js",
                "line": 78
            },
            {
                "title": "Code duplication",
                "description": "Similar code patterns repeated across multiple modules",
                "severity": "medium"
            },
            {
                "title": "Unused variables",
                "description": "Several unused variables found throughout the codebase",
                "severity": "low"
            }
        ],
        "architecture_score": 75,
        "recommendations": [
            {
                "title": "Refactor high-complexity modules",
                "description": "Break down complex modules into smaller, more manageable components to improve readability and testability.",
                "priority": "High"
            },
            {
                "title": "Implement consistent error handling",
                "description": "Establish and follow a consistent error handling pattern throughout the codebase.",
                "priority": "Medium"
            },
            {
                "title": "Add missing documentation",
                "description": "Improve documentation, especially for core modules and public APIs.",
                "priority": "Medium"
            },
            {
                "title": "Address security vulnerabilities",
                "description": "Fix identified security vulnerabilities, particularly in data handling and authentication.",
                "priority": "Critical"
            }
        ]
    }
    
    return analysis

def generate_repository_metrics(files):
    """Generate metrics for a repository"""
    
    # Calculate quality score based on complexity
    total_loc = sum(f["loc"] for f in files)
    avg_complexity = sum(f["complexity"] * f["loc"] for f in files) / total_loc if total_loc > 0 else 0
    
    # Simplified quality score calculation
    quality_score = max(0, min(100, int(100 - avg_complexity * 8)))
    
    # Calculate other metrics
    high_complexity_files = sum(1 for f in files if f["complexity"] > 7)
    high_complexity_percentage = (high_complexity_files / len(files)) * 100 if files else 0
    
    # Calculate maintainability
    maintainability = max(0, min(100, int(quality_score * 0.7 + (100 - high_complexity_percentage) * 0.3)))
    
    # Calculate testability
    testability = max(0, min(100, int(maintainability * 0.9)))
    
    # Calculate security score (simplified)
    security_score = max(0, min(100, int(quality_score * 0.8)))
    
    return {
        "quality_score": quality_score,
        "maintainability": maintainability,
        "testability": testability,
        "security_score": security_score,
        "high_complexity_files": high_complexity_files,
        "high_complexity_percentage": high_complexity_percentage
    }

def generate_file_analysis(file_path, file_info, content, primary_language):
    """Generate analysis for a specific file"""
    
    # In a real implementation, this would perform actual code analysis
    # For demonstration purposes, we're using simulated data based on file info
    
    loc = file_info["loc"]
    complexity = file_info["complexity"]
    language = file_info["language"]
    
    # Calculate a quality score for the file
    quality_score = 100 - (complexity * 10) if complexity < 10 else 0
    quality_score = max(0, min(100, quality_score))
    
    # Generate issues based on complexity and other factors
    issues = []
    
    if complexity > 7:
        issues.append({
            "title": "High cyclomatic complexity",
            "description": "This file has high complexity, making it harder to understand and maintain.",
            "severity": "high",
            "line": "N/A"
        })
    
    # Generate best practices analysis
    best_practices = []
    
    # Add language-specific best practices
    if language == "JavaScript":
        best_practices.extend([
            {
                "title": "Use strict equality",
                "description": "Always use === instead of == for equality comparisons",
                "status": True
            },
            {
                "title": "Use const/let instead of var",
                "description": "Prefer const and let over var for variable declarations",
                "status": True
            },
            {
                "title": "Error handling",
                "description": "Implement proper error handling with try/catch blocks",
                "status": True
            }
        ])
    elif language == "Python":
        best_practices.extend([
            {
                "title": "Use meaningful variable names",
                "description": "Variables should have descriptive names",
                "status": True  # Simplified check, would need more sophisticated analysis
            },
            {
                "title": "Proper exception handling",
                "description": "Use specific exception types instead of bare except clauses",
                "status": True
            },
            {
                "title": "Follow PEP 8 style guide",
                "description": "Code should follow the PEP 8 style guide for Python code",
                "status": True  # Simplified check
            }
        ])
    
    # Add generic best practices
    best_practices.extend([
        {
            "title": "Code is modular",
            "description": "Code is divided into manageable, focused modules/functions",
            "status": loc < 300
        },
        {
            "title": "Comment quality",
            "description": "Comments explain 'why' not 'what' and are kept updated",
            "status": True  # Simplified check
        }
    ])
    
    return {
        "quality_score": quality_score,
        "issues": issues,
        "best_practices": best_practices
    }

# Define sample repositories with basic structure
sample_repositories = {
    "nodejs-express-api": {
        "name": "Node.js Express API",
        "description": "A RESTful API built with Express.js and Node.js",
        "language": "JavaScript",
        "files": 12,
        "loc": 1450,
        "structure": {
            "src": {
                "controllers": {
                    "userController.js": {
                        "language": "JavaScript",
                        "loc": 120,
                        "complexity": 8
                    }
                },
                "models": {
                    "userModel.js": {
                        "language": "JavaScript",
                        "loc": 85,
                        "complexity": 5
                    }
                },
                "routes": {
                    "userRoutes.js": {
                        "language": "JavaScript",
                        "loc": 45,
                        "complexity": 4
                    }
                },
                "app.js": {
                    "language": "JavaScript",
                    "loc": 95,
                    "complexity": 6
                }
            }
        }
    },
    "python-django-app": {
        "name": "Python Django Application",
        "description": "A web application built with Django framework",
        "language": "Python",
        "files": 15,
        "loc": 1800,
        "structure": {
            "app": {
                "models.py": {
                    "language": "Python",
                    "loc": 120,
                    "complexity": 6
                },
                "views.py": {
                    "language": "Python",
                    "loc": 180,
                    "complexity": 8
                }
            }
        }
    }
}

# Function to flatten a nested directory structure
def flatten_directory_structure(structure, prefix=""):
    files = []
    for name, value in structure.items():
        path = f"{prefix}/{name}" if prefix else name
        if isinstance(value, dict) and not all(k in ["language", "loc", "complexity"] for k in value.keys()):
            # This is a directory
            files.extend(flatten_directory_structure(value, path))
        else:
            # This is a file
            files.append({
                "path": path,
                "language": value.get("language", "Unknown"),
                "loc": value.get("loc", 0),
                "complexity": value.get("complexity", 0)
            })
    return files

# Sidebar - Repository selector
st.sidebar.title("Repository Analysis")

# Option to select sample repositories or upload your own
repository_source = st.sidebar.radio(
    "Repository Source",
    ["Sample Repositories", "Upload Repository"]
)

if repository_source == "Sample Repositories":
    selected_repo_key = st.sidebar.selectbox(
        "Select Repository",
        list(sample_repositories.keys()),
        format_func=lambda x: sample_repositories[x]["name"]
    )
    
    if st.sidebar.button("Analyze Repository"):
        # Set the selected repository
        st.session_state.selected_repository = selected_repo_key
        st.session_state.repository_name = sample_repositories[selected_repo_key]["name"]
        st.session_state.repository_language = sample_repositories[selected_repo_key]["language"]
        
        # Flatten the directory structure
        repo_structure = sample_repositories[selected_repo_key]["structure"]
        st.session_state.repository_files = flatten_directory_structure(repo_structure)
        
        # Reset current file selection
        st.session_state.current_file = None
        
        # Generate analysis results
        st.session_state.analysis_results = generate_repository_analysis(
            st.session_state.repository_files,
            st.session_state.repository_language
        )
        
        # Generate repository metrics
        st.session_state.repository_metrics = generate_repository_metrics(
            st.session_state.repository_files
        )

else:  # Upload Repository
    uploaded_files = st.sidebar.file_uploader(
        "Upload repository files",
        accept_multiple_files=True,
        type=["py", "js", "java", "html", "css"]
    )
    
    if uploaded_files and st.sidebar.button("Analyze Uploaded Files"):
        # Process uploaded files
        repository_files = []
        file_contents = {}
        
        for uploaded_file in uploaded_files:
            file_path = uploaded_file.name
            contents = uploaded_file.getvalue().decode("utf-8")
            
            # Determine language from file extension
            extension = file_path.split(".")[-1].lower()
            language = {
                "py": "Python",
                "js": "JavaScript",
                "java": "Java",
                "html": "HTML",
                "css": "CSS"
            }.get(extension, "Other")
            
            # Count lines of code
            loc = len(contents.split("\n"))
            
            # Simplified complexity estimation
            complexity = min(10, max(1, loc // 20))
            
            repository_files.append({
                "path": file_path,
                "language": language,
                "loc": loc,
                "complexity": complexity
            })
            
            file_contents[file_path] = contents
        
        # Set session state
        st.session_state.repository_files = repository_files
        st.session_state.file_contents = file_contents
        st.session_state.selected_repository = "uploaded"
        st.session_state.repository_name = "Uploaded Repository"
        
        # Determine primary language
        language_counts = {}
        for file in repository_files:
            lang = file["language"]
            language_counts[lang] = language_counts.get(lang, 0) + file["loc"]
        
        if language_counts:
            primary_language = max(language_counts.items(), key=lambda x: x[1])[0]
            st.session_state.repository_language = primary_language
        else:
            st.session_state.repository_language = "Unknown"
        
        # Reset current file selection
        st.session_state.current_file = None
        
        # Generate analysis results
        st.session_state.analysis_results = generate_repository_analysis(
            st.session_state.repository_files,
            st.session_state.repository_language
        )
        
        # Generate repository metrics
        st.session_state.repository_metrics = generate_repository_metrics(
            st.session_state.repository_files
        )

# Main content area
if st.session_state.selected_repository:
    # Display repository information
    st.title(st.session_state.repository_name)
    
    col1, col2, col3, col4 = st.columns(4)
    
    # Get metrics from repository metrics
    metrics = st.session_state.repository_metrics or {
        "quality_score": 0,
        "maintainability": 0,
        "testability": 0,
        "security_score": 0
    }
    
    quality_score = metrics.get("quality_score", 0)
    maintainability = metrics.get("maintainability", 0)
    testability = metrics.get("testability", 0)
    security_score = metrics.get("security_score", 0)
    
    # Display metrics
    with col1:
        st.metric("Quality Score", f"{quality_score}/100")
    
    with col2:
        st.metric("Maintainability", f"{maintainability}/100")
    
    with col3:
        st.metric("Testability", f"{testability}/100")
    
    with col4:
        st.metric("Security", f"{security_score}/100")
    
    # Create tabs for different analysis views
    tab1, tab2, tab3, tab4 = st.tabs(["Overview", "Files", "Issues", "Recommendations"])
    
    with tab1:  # Overview tab
        # Display repository summary
        st.subheader("Repository Summary")
        st.write(f"Language: {st.session_state.repository_language}")
        st.write(f"Files: {len(st.session_state.repository_files)}")
        st.write(f"Lines of Code: {sum(f['loc'] for f in st.session_state.repository_files)}")
        
        # Display language distribution
        st.subheader("Language Distribution")
        
        language_counts = {}
        for file in st.session_state.repository_files:
            lang = file["language"]
            loc = file["loc"]
            language_counts[lang] = language_counts.get(lang, 0) + loc
        
        # Create data for visualization
        if language_counts:
            languages = list(language_counts.keys())
            loc_counts = list(language_counts.values())
            
            # Create bar chart
            fig = px.bar(x=languages, y=loc_counts, title="Code Distribution by Language")
            st.plotly_chart(fig, use_container_width=True)
        
        # Display code quality strengths and weaknesses
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Strengths")
            strengths = st.session_state.analysis_results.get("strengths", []) if st.session_state.analysis_results else []
            
            if strengths:
                for strength in strengths[:3]:  # Show top 3 strengths
                    st.success(f"**{strength['title']}**: {strength['description']}")
            else:
                st.info("No strengths identified")
        
        with col2:
            st.subheader("Weaknesses")
            weaknesses = st.session_state.analysis_results.get("weaknesses", []) if st.session_state.analysis_results else []
            
            if weaknesses:
                for weakness in weaknesses[:3]:  # Show top 3 weaknesses
                    st.warning(f"**{weakness['title']}**: {weakness['description']}")
            else:
                st.info("No weaknesses identified")
    
    with tab2:  # Files tab
        # File metrics and details
        st.subheader("File Metrics")
        
        # Create data for table
        file_data = []
        for file in st.session_state.repository_files:
            path = file["path"]
            language = file["language"]
            loc = file["loc"]
            complexity = file["complexity"]
            
            file_data.append({
                "File": path,
                "Language": language,
                "LOC": loc,
                "Complexity": complexity
            })
        
        # Display file table
        st.dataframe(pd.DataFrame(file_data))
    
    with tab3:  # Issues tab
        # Display issues found in the repository
        st.subheader("Issues")
        
        issues = st.session_state.analysis_results.get("issues", []) if st.session_state.analysis_results else []
        
        if issues:
            # Add filtering by severity
            severity_options = ["All", "Critical", "High", "Medium", "Low"]
            selected_severity = st.radio("Filter by Severity", severity_options, horizontal=True)
            
            # Filter issues by severity
            if selected_severity != "All":
                filtered_issues = [issue for issue in issues if issue["severity"].lower() == selected_severity.lower()]
            else:
                filtered_issues = issues
            
            # Display filtered issues
            for issue in filtered_issues:
                severity = issue["severity"]
                title = issue["title"]
                description = issue["description"]
                
                if severity.lower() == "critical":
                    st.error(f"**{title}**: {description}")
                elif severity.lower() == "high":
                    st.warning(f"**{title}**: {description}")
                elif severity.lower() == "medium":
                    st.info(f"**{title}**: {description}")
                else:
                    st.success(f"**{title}**: {description}")
        else:
            st.info("No issues identified")
        
    with tab4:  # Recommendations tab
        # Display recommendations for improving the codebase
        st.subheader("Recommendations")
        
        recommendations = st.session_state.analysis_results.get("recommendations", []) if st.session_state.analysis_results else []
        
        if recommendations:
            for recommendation in recommendations:
                priority = recommendation.get("priority", "Medium")
                title = recommendation.get("title", "")
                description = recommendation.get("description", "")
                
                if priority.lower() == "critical":
                    st.error(f"**{title}** (Critical): {description}")
                elif priority.lower() == "high":
                    st.warning(f"**{title}** (High): {description}")
                elif priority.lower() == "medium":
                    st.info(f"**{title}** (Medium): {description}")
                else:
                    st.success(f"**{title}** (Low): {description}")
        else:
            st.info("No recommendations provided")

else:
    # Welcome message
    st.info("""
    ### Repository Analysis Tool
    
    This tool analyzes code repositories to provide insights on:
    - Overall code quality and architecture
    - Code organization and structure
    - Potential issues and improvement opportunities
    - Best practices implementation
    
    To get started:
    1. Select a sample repository or upload your own files
    2. Click "Analyze Repository" to generate insights
    3. Select a specific file for detailed analysis
    
    The analysis will provide you with quality scores, architecture evaluation,
    identified issues, and improvement recommendations.
    """)
    
    # Sample preview
    st.image("https://miro.medium.com/max/1400/1*RIrV8tSF-L-Gnh9G1qUjYQ.png", 
             caption="Example repository analysis", 
             use_column_width=True)
