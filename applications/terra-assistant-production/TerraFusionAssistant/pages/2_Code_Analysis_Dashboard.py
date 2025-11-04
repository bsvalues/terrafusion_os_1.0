import streamlit as st
import time
import pandas as pd
import numpy as np
import plotly.express as px
from model_interface import ModelInterface
import os
import json

# Set page configuration
st.set_page_config(
    page_title="Code Analysis Dashboard",
    page_icon="📊",
    layout="wide"
)

# Define TerraFusion-specific CSS
st.markdown("""
<style>
    /* TerraFusion color palette and theme */
    :root {
        --tf-primary: #00e5ff;
        --tf-primary-dark: #00b8d4;
        --tf-background: #001529;
        --tf-card-bg: #0a2540;
        --tf-text: #ffffff;
        --tf-text-secondary: rgba(0, 229, 255, 0.7);
        --tf-text-tertiary: rgba(0, 229, 255, 0.5);
        --tf-border: rgba(0, 229, 255, 0.2);
        --tf-success: #00c853;
        --tf-warning: #ffd600;
        --tf-error: #ff1744;
    }
    
    /* Title styling */
    .dashboard-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--tf-primary);
        margin-bottom: 0.5rem;
    }
    
    .dashboard-subtitle {
        font-size: 1rem;
        color: var(--tf-text-secondary);
        margin-bottom: 2rem;
    }
    
    /* Analysis card */
    .analysis-card {
        background-color: var(--tf-card-bg);
        border: 1px solid var(--tf-border);
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        position: relative;
        overflow: hidden;
    }
    
    .analysis-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background-color: var(--tf-primary);
        opacity: 0.7;
    }
    
    .analysis-header {
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--tf-primary);
        margin-bottom: 1rem;
    }
    
    /* Issue cards */
    .issue-card {
        background-color: var(--tf-card-bg);
        border: 1px solid var(--tf-border);
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 0.75rem;
        position: relative;
    }
    
    .issue-high {
        border-left: 4px solid var(--tf-error);
    }
    
    .issue-medium {
        border-left: 4px solid var(--tf-warning);
    }
    
    .issue-low {
        border-left: 4px solid var(--tf-primary);
    }
    
    .issue-title {
        font-weight: 600;
        color: var(--tf-primary);
        margin-bottom: 0.5rem;
    }
    
    /* Score circle */
    .score-circle {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--tf-text);
        border: 2px solid var(--tf-border);
    }
    
    /* Code block */
    .code-block {
        background-color: rgba(0, 0, 0, 0.3);
        border: 1px solid var(--tf-border);
        border-radius: 0.375rem;
        padding: 1rem;
        font-family: monospace;
        color: var(--tf-text);
        margin-bottom: 1rem;
        overflow-x: auto;
        white-space: pre-wrap;
    }
    
    /* Insights panel */
    .insights-panel {
        background-color: rgba(0, 229, 255, 0.05);
        border: 1px solid var(--tf-border);
        border-radius: 0.75rem;
        padding: 1.25rem;
        margin-bottom: 1.5rem;
        position: relative;
    }
    
    .insights-panel::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background-color: var(--tf-primary);
        opacity: 0.7;
    }
    
    /* Tab styling override */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        border-bottom: 1px solid var(--tf-border);
    }
    
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        white-space: pre-wrap;
        background-color: transparent;
        border-radius: 4px 4px 0px 0px;
        color: var(--tf-text-secondary);
        border-bottom: 3px solid transparent;
    }
    
    .stTabs [aria-selected="true"] {
        background-color: rgba(0, 229, 255, 0.05) !important;
        color: var(--tf-primary) !important;
        border-bottom: 3px solid var(--tf-primary) !important;
        font-weight: 600;
    }
    
    /* Metric cards */
    .metric-card {
        background-color: var(--tf-card-bg);
        border: 1px solid var(--tf-border);
        border-radius: 0.75rem;
        padding: 1.25rem;
        text-align: center;
        height: 100%;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .metric-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 30px rgba(0, 229, 255, 0.15);
    }
    
    /* Recommendation cards */
    .recommendation-card {
        background-color: var(--tf-card-bg);
        border: 1px solid var(--tf-border);
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 0.75rem;
        position: relative;
        border-left: 4px solid var(--tf-success);
    }
    
    .recommendation-title {
        font-weight: 600;
        color: var(--tf-primary);
        margin-bottom: 0.5rem;
    }
    
    /* Expander styling override */
    .streamlit-expanderHeader {
        color: var(--tf-primary);
        font-weight: 600;
    }
    
    .streamlit-expanderContent {
        background-color: rgba(0, 229, 255, 0.05);
        border-radius: 0.375rem;
        padding: 0.5rem;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'model_interface' not in st.session_state:
    st.session_state.model_interface = ModelInterface()
    
if 'code_analysis_history' not in st.session_state:
    st.session_state.code_analysis_history = []
    
if 'current_analysis' not in st.session_state:
    st.session_state.current_analysis = None

# Helper function to get a color for quality scores
def get_score_color(score):
    """Get color for quality score"""
    if score >= 8:
        return "#4caf50"  # Green
    elif score >= 6:
        return "#ffc107"  # Yellow
    elif score >= 4:
        return "#ff9800"  # Orange
    else:
        return "#f44336"  # Red

# Sidebar
st.sidebar.title("Code Analysis Controls")

# Analysis Type
analysis_type = st.sidebar.selectbox(
    "Analysis Type",
    ["Code Quality", "Architecture", "Performance", "Security"]
)

# Sample code or upload
code_source = st.sidebar.radio(
    "Code Source",
    ["Sample Code", "Custom Code"]
)

language_options = [
    "Python", "JavaScript", "TypeScript", "Java", 
    "C#", "Go", "Ruby", "PHP", "Swift", "SQL"
]

selected_language = st.sidebar.selectbox("Programming Language", language_options)

# Sample code for different languages
sample_code = {
    "Python": """def calculate_factorial(n):
    \"\"\"Calculate the factorial of a number.\"\"\"
    if n < 0:
        return None
    if n == 0:
        return 1
    result = 1
    for i in range(1, n + 1):
        result *= i
    return result

def find_fibonacci(n):
    \"\"\"Return the nth Fibonacci number.\"\"\"
    if n <= 0:
        return 0
    if n == 1:
        return 1
    return find_fibonacci(n - 1) + find_fibonacci(n - 2)
""",
    "JavaScript": """function calculateFactorial(n) {
  // Calculate the factorial of a number
  if (n < 0) {
    return null;
  }
  if (n === 0) {
    return 1;
  }
  let result = 1;
  for (let i = 1; i <= n; i++) {
    result *= i;
  }
  return result;
}

function findFibonacci(n) {
  // Return the nth Fibonacci number
  if (n <= 0) {
    return 0;
  }
  if (n === 1) {
    return 1;
  }
  return findFibonacci(n - 1) + findFibonacci(n - 2);
}""",
    "TypeScript": """function calculateFactorial(n: number): number | null {
  // Calculate the factorial of a number
  if (n < 0) {
    return null;
  }
  if (n === 0) {
    return 1;
  }
  let result = 1;
  for (let i = 1; i <= n; i++) {
    result *= i;
  }
  return result;
}

function findFibonacci(n: number): number {
  // Return the nth Fibonacci number
  if (n <= 0) {
    return 0;
  }
  if (n === 1) {
    return 1;
  }
  return findFibonacci(n - 1) + findFibonacci(n - 2);
}""",
    "Java": """public class MathFunctions {
    /**
     * Calculate the factorial of a number.
     */
    public static Long calculateFactorial(int n) {
        if (n < 0) {
            return null;
        }
        if (n == 0) {
            return 1L;
        }
        long result = 1;
        for (int i = 1; i <= n; i++) {
            result *= i;
        }
        return result;
    }

    /**
     * Return the nth Fibonacci number.
     */
    public static int findFibonacci(int n) {
        if (n <= 0) {
            return 0;
        }
        if (n == 1) {
            return 1;
        }
        return findFibonacci(n - 1) + findFibonacci(n - 2);
    }
}""",
    "C#": """public class MathFunctions 
{
    /// <summary>
    /// Calculate the factorial of a number.
    /// </summary>
    public static long? CalculateFactorial(int n) 
    {
        if (n < 0)
        {
            return null;
        }
        if (n == 0)
        {
            return 1;
        }
        long result = 1;
        for (int i = 1; i <= n; i++)
        {
            result *= i;
        }
        return result;
    }

    /// <summary>
    /// Return the nth Fibonacci number.
    /// </summary>
    public static int FindFibonacci(int n)
    {
        if (n <= 0)
        {
            return 0;
        }
        if (n == 1)
        {
            return 1;
        }
        return FindFibonacci(n - 1) + FindFibonacci(n - 2);
    }
}""",
    "Go": """package mathfunctions

// CalculateFactorial calculates the factorial of a number.
func CalculateFactorial(n int) int {
    if n < 0 {
        return -1 // Go doesn't have null, using -1 to indicate error
    }
    if n == 0 {
        return 1
    }
    result := 1
    for i := 1; i <= n; i++ {
        result *= i
    }
    return result
}

// FindFibonacci returns the nth Fibonacci number.
func FindFibonacci(n int) int {
    if n <= 0 {
        return 0
    }
    if n == 1 {
        return 1
    }
    return FindFibonacci(n-1) + FindFibonacci(n-2)
}""",
    "Ruby": """# Calculate the factorial of a number.
def calculate_factorial(n)
  if n < 0
    return nil
  end
  if n == 0
    return 1
  end
  result = 1
  (1..n).each do |i|
    result *= i
  end
  return result
end

# Return the nth Fibonacci number.
def find_fibonacci(n)
  if n <= 0
    return 0
  end
  if n == 1
    return 1
  end
  return find_fibonacci(n - 1) + find_fibonacci(n - 2)
end""",
    "PHP": """<?php
/**
 * Calculate the factorial of a number.
 */
function calculateFactorial($n) {
    if ($n < 0) {
        return null;
    }
    if ($n == 0) {
        return 1;
    }
    $result = 1;
    for ($i = 1; $i <= $n; $i++) {
        $result *= $i;
    }
    return $result;
}

/**
 * Return the nth Fibonacci number.
 */
function findFibonacci($n) {
    if ($n <= 0) {
        return 0;
    }
    if ($n == 1) {
        return 1;
    }
    return findFibonacci($n - 1) + findFibonacci($n - 2);
}
?>""",
    "Swift": """// Calculate the factorial of a number.
func calculateFactorial(n: Int) -> Int? {
    if n < 0 {
        return nil
    }
    if n == 0 {
        return 1
    }
    var result = 1
    for i in 1...n {
        result *= i
    }
    return result
}

// Return the nth Fibonacci number.
func findFibonacci(n: Int) -> Int {
    if n <= 0 {
        return 0
    }
    if n == 1 {
        return 1
    }
    return findFibonacci(n: n - 1) + findFibonacci(n: n - 2)
}""",
    "SQL": """-- Create a table for employee data
CREATE TABLE employees (
    employee_id INT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    hire_date DATE,
    salary DECIMAL(10, 2),
    department_id INT
);

-- Function to calculate years of service
CREATE OR REPLACE FUNCTION calculate_years_of_service(hire_date DATE) 
RETURNS INT AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date));
END;
$$ LANGUAGE plpgsql;

-- Query to find employees with high salaries by department
SELECT 
    department_id,
    AVG(salary) as avg_salary,
    MAX(salary) as max_salary,
    COUNT(*) as employee_count
FROM 
    employees
GROUP BY 
    department_id
HAVING 
    AVG(salary) > 50000
ORDER BY 
    avg_salary DESC;"""
}

# Custom code area
if code_source == "Sample Code":
    code_to_analyze = sample_code.get(selected_language, "# Sample code not available for this language")
    st.sidebar.text_area("Sample Code", code_to_analyze, height=200, disabled=True)
    custom_code = False
else:
    code_to_analyze = st.sidebar.text_area("Enter Code to Analyze", "", height=300)
    custom_code = True

# Analysis focus
if analysis_type == "Code Quality":
    analysis_focus = st.sidebar.selectbox(
        "Analysis Focus",
        ["Overall Quality", "Readability", "Maintainability", "Complexity", "Documentation"]
    )
    
    query_templates = {
        "Overall Quality": "Provide a comprehensive quality analysis of this code, focusing on readability, maintainability, and best practices.",
        "Readability": "Analyze the readability of this code. How easy is it to understand? What could improve its clarity?",
        "Maintainability": "Assess the maintainability of this code. How easy would it be to modify or extend?",
        "Complexity": "Evaluate the complexity of this code. Are there overly complex parts that could be simplified?",
        "Documentation": "Review the documentation of this code. Is it well-documented? What's missing?"
    }
    
    query = query_templates.get(analysis_focus, query_templates["Overall Quality"])
    
elif analysis_type == "Architecture":
    analysis_focus = st.sidebar.selectbox(
        "Analysis Focus",
        ["Design Patterns", "Component Structure", "Dependencies", "Architectural Quality"]
    )
    
    query_templates = {
        "Design Patterns": "Identify any design patterns used in this code. Are they implemented correctly? Suggest improvements.",
        "Component Structure": "Analyze the component structure of this code. Is it well-organized?",
        "Dependencies": "Evaluate the dependencies in this code. Are there tight couplings or circular dependencies?",
        "Architectural Quality": "Assess the overall architectural quality of this code. What are its strengths and weaknesses?"
    }
    
    query = query_templates.get(analysis_focus, query_templates["Architectural Quality"])
    
elif analysis_type == "Performance":
    analysis_focus = st.sidebar.selectbox(
        "Analysis Focus",
        ["Efficiency", "Resource Usage", "Optimization Opportunities", "Bottlenecks"]
    )
    
    query_templates = {
        "Efficiency": "Analyze the efficiency of this code. Are there any inefficient algorithms or operations?",
        "Resource Usage": "Evaluate the resource usage of this code. Could it use less memory or CPU?",
        "Optimization Opportunities": "Identify optimization opportunities in this code. How could it be made faster?",
        "Bottlenecks": "Find potential bottlenecks in this code. What parts might cause performance issues?"
    }
    
    query = query_templates.get(analysis_focus, query_templates["Optimization Opportunities"])
    
else:  # Security
    analysis_focus = st.sidebar.selectbox(
        "Analysis Focus",
        ["Vulnerabilities", "Input Validation", "Error Handling", "Secure Coding Practices"]
    )
    
    query_templates = {
        "Vulnerabilities": "Identify any security vulnerabilities in this code. How could they be exploited and fixed?",
        "Input Validation": "Analyze the input validation in this code. Is it sufficient to prevent attacks?",
        "Error Handling": "Evaluate the error handling in this code. Could errors expose sensitive information?",
        "Secure Coding Practices": "Assess this code against secure coding practices. What improvements are needed?"
    }
    
    query = query_templates.get(analysis_focus, query_templates["Vulnerabilities"])

# Custom query option
custom_query = st.sidebar.checkbox("Custom Analysis Query")
if custom_query:
    query = st.sidebar.text_area("Enter your analysis query", query, height=100)

# Run analysis button
if st.sidebar.button("Run Analysis"):
    if not code_to_analyze.strip():
        st.sidebar.error("Please enter code to analyze")
    else:
        with st.spinner("Analyzing code..."):
            try:
                # Get model availability
                openai_available = st.session_state.model_interface.check_openai_status()
                anthropic_available = st.session_state.model_interface.check_anthropic_status()
                
                if not (openai_available or anthropic_available):
                    st.sidebar.error("No AI models available. Please check API keys.")
                else:
                    # Run analysis using available model
                    provider = "openai" if openai_available else "anthropic"
                    analysis_result = st.session_state.model_interface.analyze_code(
                        code=code_to_analyze,
                        language=selected_language.lower(),
                        query=query
                    )
                    
                    # Store the analysis result
                    st.session_state.current_analysis = {
                        "code": code_to_analyze,
                        "language": selected_language,
                        "query": query,
                        "result": analysis_result,
                        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                        "type": analysis_type,
                        "focus": analysis_focus
                    }
                    
                    # Add to history
                    st.session_state.code_analysis_history.append(st.session_state.current_analysis)
                    
                    st.sidebar.success("Analysis completed successfully!")
            except Exception as e:
                st.sidebar.error(f"Error analyzing code: {str(e)}")

# Add navigation back to homepage
if st.sidebar.button("Back to Home"):
    st.switch_page("app.py")

# Main content
st.markdown('<h1 class="dashboard-title">Code Analysis & Optimization</h1>', unsafe_allow_html=True)
st.markdown('<p class="dashboard-subtitle">Analyze code quality, architecture, performance, and security using AI-powered insights</p>', unsafe_allow_html=True)

if st.session_state.current_analysis:
    analysis = st.session_state.current_analysis
    result = analysis["result"]
    
    # Analysis overview
    st.header("Analysis Overview")
    
    col1, col2, col3 = st.columns([2, 1, 1])
    
    with col1:
        st.markdown(f"**Analysis Type:** {analysis['type']} - {analysis['focus']}")
        st.markdown(f"**Language:** {analysis['language']}")
        st.markdown(f"**Timestamp:** {analysis['timestamp']}")
    
    with col2:
        quality_score = result.get("quality_score", 0)
        st.markdown("<div style='text-align: center'>Quality Score</div>", unsafe_allow_html=True)
        score_color = get_score_color(quality_score)
        st.markdown(
            f"<div class='score-circle' style='background-color: {score_color}'>{quality_score}/10</div>",
            unsafe_allow_html=True
        )
    
    with col3:
        if "issues" in result:
            issue_count = len(result["issues"])
            st.metric("Issues Identified", issue_count)
    
    # Code summary
    st.subheader("Code Summary")
    st.markdown(f"<div class='insights-panel'>{result.get('summary', 'No summary available')}</div>", unsafe_allow_html=True)
    
    # Tabs for different analysis aspects
    tab1, tab2, tab3 = st.tabs(["Detailed Analysis", "Issues & Recommendations", "Original Code"])
    
    with tab1:
        st.markdown("### Detailed Analysis")
        st.markdown(f"<div class='analysis-card'>{result.get('query_response', 'No detailed analysis available')}</div>", unsafe_allow_html=True)
    
    with tab2:
        st.markdown("### Issues & Recommendations")
        
        if "issues" in result and result["issues"]:
            for i, issue in enumerate(result["issues"]):
                severity = "high" if i % 3 == 0 else "medium" if i % 3 == 1 else "low"
                st.markdown(
                    f"<div class='issue-card issue-{severity}'>"
                    f"<div class='issue-title'>Issue {i+1}</div>"
                    f"<p style='color: var(--tf-text-secondary);'>{issue}</p>"
                    f"</div>",
                    unsafe_allow_html=True
                )
        else:
            st.markdown(
                "<div style='background-color: rgba(0, 229, 255, 0.05); border: 1px solid var(--tf-border); border-radius: 0.5rem; padding: 1rem;'>"
                "<div style='display: flex; align-items: center;'>"
                "<span style='color: var(--tf-success); font-size: 1.5rem; margin-right: 0.5rem;'>✓</span>"
                "<span style='color: var(--tf-text-secondary);'>No issues identified. Great job!</span>"
                "</div>"
                "</div>",
                unsafe_allow_html=True
            )
    
    with tab3:
        st.markdown("### Original Code")
        st.markdown(f"```{analysis['language'].lower()}\n{analysis['code']}\n```")
    
else:
    # Welcome message when no analysis has been run
    st.markdown(
        "<div class='tf-card'>"
        "<div class='card-title'>Welcome to Code Analysis Dashboard</div>"
        "<p style='color: var(--tf-text-secondary);'>Use the sidebar to configure and run an AI-powered code analysis</p>"
        "</div>",
        unsafe_allow_html=True
    )
    
    # Getting started card
    st.markdown(
        "<div class='tf-card'>"
        "<div class='card-title'>Getting Started</div>"
        "<ol style='color: var(--tf-text-secondary);'>"
        "<li>Select an <strong style='color: var(--tf-primary);'>Analysis Type</strong> from the sidebar</li>"
        "<li>Choose a <strong style='color: var(--tf-primary);'>Code Source</strong> (sample or custom)</li>"
        "<li>Select the <strong style='color: var(--tf-primary);'>Programming Language</strong></li>"
        "<li>Choose an <strong style='color: var(--tf-primary);'>Analysis Focus</strong> area</li>"
        "<li>Click <strong style='color: var(--tf-primary);'>Run Analysis</strong> to start</li>"
        "</ol>"
        "<p style='color: var(--tf-text-secondary); margin-top: 1rem;'>"
        "The AI-powered analysis engine will evaluate your code and provide insights, recommendations, and quality metrics."
        "</p>"
        "</div>",
        unsafe_allow_html=True
    )
    
    # Features showcase
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown(
            "<div class='feature-card'>"
            "<div style='font-size: 2rem; color: var(--tf-primary); text-align: center; margin-bottom: 1rem;'>🔍</div>"
            "<div style='font-size: 1.25rem; font-weight: 600; color: var(--tf-primary); margin-bottom: 0.75rem; text-align: center;'>Code Quality</div>"
            "<p style='color: var(--tf-text-secondary); text-align: center;'>Analyze code for readability, maintainability, and adherence to best practices</p>"
            "</div>",
            unsafe_allow_html=True
        )
    
    with col2:
        st.markdown(
            "<div class='feature-card'>"
            "<div style='font-size: 2rem; color: var(--tf-primary); text-align: center; margin-bottom: 1rem;'>⚡</div>"
            "<div style='font-size: 1.25rem; font-weight: 600; color: var(--tf-primary); margin-bottom: 0.75rem; text-align: center;'>Performance</div>"
            "<p style='color: var(--tf-text-secondary); text-align: center;'>Identify bottlenecks and optimization opportunities in your code</p>"
            "</div>",
            unsafe_allow_html=True
        )
    
    with col3:
        st.markdown(
            "<div class='feature-card'>"
            "<div style='font-size: 2rem; color: var(--tf-primary); text-align: center; margin-bottom: 1rem;'>🛡️</div>"
            "<div style='font-size: 1.25rem; font-weight: 600; color: var(--tf-primary); margin-bottom: 0.75rem; text-align: center;'>Security</div>"
            "<p style='color: var(--tf-text-secondary); text-align: center;'>Detect vulnerabilities and security issues in your codebase</p>"
            "</div>",
            unsafe_allow_html=True
        )