import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import json
import requests
import time
import random
from datetime import datetime, timedelta
import os
import re

# Set page configuration
st.set_page_config(page_title="Security Dashboard", page_icon="🔒", layout="wide")

# Apply custom CSS
st.markdown("""
<style>
    .security-header {
        color: #0f6cbd;
        padding-bottom: 15px;
    }
    
    .summary-card {
        background-color: #f0f2f6;
        border-radius: 10px;
        padding: 20px;
        margin-bottom: 20px;
    }
    
    .vuln-card {
        border-left: 4px solid #ff4b4b;
        padding: 10px;
        margin-bottom: 10px;
        background-color: #fafafa;
    }
    
    .vuln-card.high {
        border-left-color: #ff4b4b;
    }
    
    .vuln-card.medium {
        border-left-color: #ffa500;
    }
    
    .vuln-card.low {
        border-left-color: #02b2e7;
    }
    
    .code-block {
        background-color: #272822;
        color: #f8f8f2;
        padding: 10px;
        border-radius: 5px;
        font-family: 'Courier New', monospace;
        overflow-x: auto;
        margin: 10px 0;
    }
    
    .file-meta {
        color: #666;
        font-size: 0.9em;
        margin-top: 5px;
    }
    
    .metric-card {
        text-align: center;
        padding: 15px;
        border-radius: 10px;
        margin: 5px;
    }
    
    .metric-card h3 {
        margin: 0;
        font-size: 1.5em;
    }
    
    .metric-card p {
        margin: 0;
        font-size: 0.9em;
        color: #666;
    }
    
    .security-score-container {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
    }
    
    .security-score {
        font-size: 3em;
        font-weight: bold;
        padding: 10px;
    }
    
    .score-label {
        font-size: 1.2em;
        color: #666;
    }
    
    .high-severity {
        color: #ff4b4b;
    }
    
    .medium-severity {
        color: #ffa500;
    }
    
    .low-severity {
        color: #02b2e7;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state variables if not already set
if "scan_results" not in st.session_state:
    st.session_state.scan_results = None

if "scan_history" not in st.session_state:
    st.session_state.scan_history = []

if "selected_project" not in st.session_state:
    st.session_state.selected_project = None

if "scanning" not in st.session_state:
    st.session_state.scanning = False

if "scan_progress" not in st.session_state:
    st.session_state.scan_progress = 0

if "scan_log" not in st.session_state:
    st.session_state.scan_log = []

if "last_scan_time" not in st.session_state:
    st.session_state.last_scan_time = None

if "dependencies" not in st.session_state:
    st.session_state.dependencies = []

# Helper functions
def run_security_scan(project, scan_type="full"):
    """
    Simulate running a security scan on a project
    """
    st.session_state.scanning = True
    st.session_state.scan_progress = 0
    st.session_state.scan_log = []
    
    # Clear previous results
    st.session_state.scan_results = None
    
    # Simulate scanning phases
    scan_phases = [
        {"name": "Initializing scanner", "duration": 1},
        {"name": "Setting up analysis environment", "duration": 1},
        {"name": "Scanning project files", "duration": 2},
        {"name": "Analyzing dependencies", "duration": 2},
        {"name": "Running vulnerability detectors", "duration": 3},
        {"name": "Checking for common security issues", "duration": 2},
        {"name": "Analyzing results", "duration": 1},
        {"name": "Generating report", "duration": 1}
    ]
    
    # Generate simulated scan logs
    total_duration = sum(phase["duration"] for phase in scan_phases)
    progress_increment = 100 / total_duration
    
    # Simulate scan progress
    for phase in scan_phases:
        phase_name = phase["name"]
        phase_duration = phase["duration"]
        
        # Add log entry
        log_entry = f"{datetime.now().strftime('%H:%M:%S')} - {phase_name}..."
        st.session_state.scan_log.append(log_entry)
        
        # Update progress in smaller increments
        for _ in range(phase_duration):
            time.sleep(0.2)  # Reduced sleep time
            st.session_state.scan_progress += progress_increment / phase_duration
            st.session_state.scan_progress = min(99, st.session_state.scan_progress)
            
            # Force a rerun to update the progress bar
            st.experimental_rerun()
    
    # Generate simulated scan results
    results = generate_scan_results(project, scan_type)
    
    # Complete the scan
    st.session_state.scan_progress = 100
    st.session_state.scan_results = results
    st.session_state.scanning = False
    st.session_state.last_scan_time = datetime.now()
    
    # Add to scan history
    scan_summary = {
        "id": len(st.session_state.scan_history) + 1,
        "project": project,
        "timestamp": st.session_state.last_scan_time,
        "vulnerabilities": {
            "critical": results["summary"]["vulnerabilities"]["critical"],
            "high": results["summary"]["vulnerabilities"]["high"],
            "medium": results["summary"]["vulnerabilities"]["medium"],
            "low": results["summary"]["vulnerabilities"]["low"]
        },
        "score": results["summary"]["score"]
    }
    st.session_state.scan_history.append(scan_summary)
    
    # Force a rerun to update the UI
    time.sleep(0.5)
    st.experimental_rerun()

def generate_scan_results(project, scan_type):
    """
    Generate simulated security scan results
    """
    # Define possible vulnerability types
    vuln_types = [
        {
            "name": "SQL Injection",
            "description": "SQL injection vulnerabilities allow attackers to manipulate database queries, potentially exposing or modifying sensitive data.",
            "remediation": "Use parameterized queries or prepared statements instead of string concatenation for SQL queries.",
            "cwe": "CWE-89",
            "references": ["https://owasp.org/www-community/attacks/SQL_Injection"]
        },
        {
            "name": "Cross-Site Scripting (XSS)",
            "description": "XSS vulnerabilities allow attackers to inject malicious scripts into web pages viewed by other users.",
            "remediation": "Properly sanitize and escape user input before rendering it in HTML, using context-appropriate encoding.",
            "cwe": "CWE-79",
            "references": ["https://owasp.org/www-community/attacks/xss/"]
        },
        {
            "name": "Insecure Deserialization",
            "description": "Insecure deserialization can allow attackers to execute arbitrary code when untrusted data is deserialized.",
            "remediation": "Avoid deserializing data from untrusted sources, or use safer serialization formats.",
            "cwe": "CWE-502",
            "references": ["https://owasp.org/www-project-top-ten/2017/A8_2017-Insecure_Deserialization"]
        },
        {
            "name": "Improper Authentication",
            "description": "Weaknesses in authentication mechanisms that could allow unauthorized access.",
            "remediation": "Implement strong authentication mechanisms and proper session management.",
            "cwe": "CWE-287",
            "references": ["https://owasp.org/www-project-top-ten/2017/A2_2017-Broken_Authentication"]
        },
        {
            "name": "Sensitive Data Exposure",
            "description": "Inadequate protection of sensitive information such as financial data, credentials, or personal information.",
            "remediation": "Encrypt sensitive data at rest and in transit, and minimize exposure.",
            "cwe": "CWE-200",
            "references": ["https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure"]
        },
        {
            "name": "Security Misconfiguration",
            "description": "Improperly configured servers, frameworks, or applications that expose vulnerabilities.",
            "remediation": "Implement a secure configuration process and maintain properly configured systems.",
            "cwe": "CWE-1008",
            "references": ["https://owasp.org/www-project-top-ten/2017/A6_2017-Security_Misconfiguration"]
        },
        {
            "name": "Outdated Dependencies",
            "description": "Using components with known vulnerabilities due to outdated dependencies.",
            "remediation": "Regularly update dependencies and implement a process for tracking and resolving vulnerabilities.",
            "cwe": "CWE-1026",
            "references": ["https://owasp.org/www-project-top-ten/2017/A9_2017-Using_Components_with_Known_Vulnerabilities"]
        },
        {
            "name": "Insecure File Handling",
            "description": "Improper validation or handling of file operations that could lead to security issues.",
            "remediation": "Validate file types, implement proper access controls, and sanitize filenames.",
            "cwe": "CWE-73",
            "references": ["https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload"]
        }
    ]
    
    # Generate a random security score (higher is better)
    score = random.randint(50, 95)
    
    # Determine the number of vulnerabilities based on the security score
    # Lower score means more vulnerabilities
    total_vulns = max(1, int((100 - score) / 5))
    
    # Distribute vulnerabilities by severity
    critical_count = max(0, int(total_vulns * 0.1))
    high_count = max(0, int(total_vulns * 0.3))
    medium_count = max(0, int(total_vulns * 0.4))
    low_count = max(0, int(total_vulns * 0.2))
    
    # Generate vulnerabilities
    vulnerabilities = []
    
    # Sample file paths for the selected project
    file_paths = [
        "src/controllers/UserController.js",
        "src/models/User.js",
        "src/routes/api.js",
        "src/middleware/auth.js",
        "src/utils/validation.js",
        "src/config/database.js",
        "src/services/dataService.js",
        "src/helpers/formatter.js",
        "src/app.js",
        "public/js/main.js"
    ]
    
    # Generate critical vulnerabilities
    for i in range(critical_count):
        vuln_type = random.choice(vuln_types)
        file_path = random.choice(file_paths)
        line = random.randint(10, 200)
        
        vulnerabilities.append({
            "id": f"VUL-{len(vulnerabilities) + 1}",
            "type": vuln_type["name"],
            "severity": "critical",
            "description": f"{vuln_type['description']} Found in {file_path}.",
            "file": file_path,
            "line": line,
            "remediation": vuln_type["remediation"],
            "cwe": vuln_type["cwe"],
            "references": vuln_type["references"],
            "code_snippet": "function authenticateUser(username, password) {\n  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;\n  return db.query(query);\n}"
        })
    
    # Generate high severity vulnerabilities
    for i in range(high_count):
        vuln_type = random.choice(vuln_types)
        file_path = random.choice(file_paths)
        line = random.randint(10, 200)
        
        vulnerabilities.append({
            "id": f"VUL-{len(vulnerabilities) + 1}",
            "type": vuln_type["name"],
            "severity": "high",
            "description": f"{vuln_type['description']} Found in {file_path}.",
            "file": file_path,
            "line": line,
            "remediation": vuln_type["remediation"],
            "cwe": vuln_type["cwe"],
            "references": vuln_type["references"],
            "code_snippet": "const userInput = req.body.userInput;\nres.send(`<div>${userInput}</div>`);"
        })
    
    # Generate medium severity vulnerabilities
    for i in range(medium_count):
        vuln_type = random.choice(vuln_types)
        file_path = random.choice(file_paths)
        line = random.randint(10, 200)
        
        vulnerabilities.append({
            "id": f"VUL-{len(vulnerabilities) + 1}",
            "type": vuln_type["name"],
            "severity": "medium",
            "description": f"{vuln_type['description']} Found in {file_path}.",
            "file": file_path,
            "line": line,
            "remediation": vuln_type["remediation"],
            "cwe": vuln_type["cwe"],
            "references": vuln_type["references"],
            "code_snippet": "app.use(session({\n  secret: 'hardcoded-secret-key',\n  resave: false,\n  saveUninitialized: true\n}));"
        })
    
    # Generate low severity vulnerabilities
    for i in range(low_count):
        vuln_type = random.choice(vuln_types)
        file_path = random.choice(file_paths)
        line = random.randint(10, 200)
        
        vulnerabilities.append({
            "id": f"VUL-{len(vulnerabilities) + 1}",
            "type": vuln_type["name"],
            "severity": "low",
            "description": f"{vuln_type['description']} Found in {file_path}.",
            "file": file_path,
            "line": line,
            "remediation": vuln_type["remediation"],
            "cwe": vuln_type["cwe"],
            "references": vuln_type["references"],
            "code_snippet": "// TODO: Implement proper error handling\nconsole.log('Error occurred');"
        })
    
    # Generate dependency vulnerabilities
    dependencies = [
        {"name": "express", "version": "4.17.1", "vulnerabilities": []},
        {"name": "mongoose", "version": "5.12.3", "vulnerabilities": []},
        {"name": "jsonwebtoken", "version": "8.5.1", "vulnerabilities": []},
        {"name": "lodash", "version": "4.17.20", "vulnerabilities": [
            {"id": "CVE-2021-23337", "severity": "high", "description": "Command injection vulnerability in lodash before 4.17.21"}
        ]},
        {"name": "axios", "version": "0.21.0", "vulnerabilities": [
            {"id": "CVE-2020-28168", "severity": "medium", "description": "Server-side request forgery vulnerability in axios before 0.21.1"}
        ]},
        {"name": "moment", "version": "2.29.1", "vulnerabilities": []},
        {"name": "react", "version": "17.0.1", "vulnerabilities": []},
        {"name": "react-dom", "version": "17.0.1", "vulnerabilities": []}
    ]
    
    # Save dependencies for the dependency scanning tab
    st.session_state.dependencies = dependencies
    
    # Generate pass/fail checks for the compliance section
    compliance_checks = [
        {"id": "SEC-1", "name": "Input Validation", "status": random.choice(["pass", "fail", "warning"])},
        {"id": "SEC-2", "name": "Output Encoding", "status": random.choice(["pass", "fail", "warning"])},
        {"id": "SEC-3", "name": "Authentication", "status": random.choice(["pass", "fail", "warning"])},
        {"id": "SEC-4", "name": "Session Management", "status": random.choice(["pass", "fail", "warning"])},
        {"id": "SEC-5", "name": "Access Control", "status": random.choice(["pass", "fail", "warning"])},
        {"id": "SEC-6", "name": "Cryptographic Practices", "status": random.choice(["pass", "fail", "warning"])},
        {"id": "SEC-7", "name": "Error Handling", "status": random.choice(["pass", "fail", "warning"])},
        {"id": "SEC-8", "name": "Data Protection", "status": random.choice(["pass", "fail", "warning"])},
        {"id": "SEC-9", "name": "Communication Security", "status": random.choice(["pass", "fail", "warning"])},
        {"id": "SEC-10", "name": "System Configuration", "status": random.choice(["pass", "fail", "warning"])}
    ]
    
    # Create the full scan results
    results = {
        "summary": {
            "project": project,
            "scan_type": scan_type,
            "scan_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "score": score,
            "vulnerabilities": {
                "critical": critical_count,
                "high": high_count,
                "medium": medium_count,
                "low": low_count,
                "total": total_vulns
            }
        },
        "vulnerabilities": vulnerabilities,
        "dependencies": dependencies,
        "compliance": compliance_checks
    }
    
    return results

# Sidebar - Project selector and scan controls
st.sidebar.title("Security Dashboard")

# Project selector
projects = ["E-commerce API", "User Management System", "Payment Gateway", "Inventory Management", "Analytics Dashboard"]
selected_project = st.sidebar.selectbox("Select Project", projects)

# Store selected project in session state
st.session_state.selected_project = selected_project

# Scan controls
st.sidebar.subheader("Scan Controls")

scan_type = st.sidebar.selectbox(
    "Scan Type",
    ["Full Scan", "Quick Scan", "Dependency Scan", "Compliance Check"],
    help="Full Scan: Complete security analysis\nQuick Scan: Focuses on critical vulnerabilities\nDependency Scan: Checks for vulnerable dependencies\nCompliance Check: Verifies security compliance"
)

# Start scan button
if st.sidebar.button("Start Security Scan"):
    # Run the scan
    scan_type_map = {
        "Full Scan": "full",
        "Quick Scan": "quick",
        "Dependency Scan": "dependencies",
        "Compliance Check": "compliance"
    }
    run_security_scan(selected_project, scan_type_map[scan_type])

# Show scan history
st.sidebar.subheader("Scan History")

if st.session_state.scan_history:
    for i, scan in enumerate(st.session_state.scan_history[-5:]):  # Show last 5 scans
        vuln_count = sum(scan["vulnerabilities"].values())
        
        st.sidebar.markdown(
            f"""
            <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                <span style="color: #666; font-size: 0.8em;">{scan["timestamp"].strftime("%Y-%m-%d %H:%M")}</span>
                <div><strong>{scan["project"]}</strong></div>
                <div>Score: {scan["score"]}/100</div>
                <div>Vulnerabilities: {vuln_count}</div>
            </div>
            """,
            unsafe_allow_html=True
        )

# Main content area
st.title("Security Dashboard")

# Show scanning progress if a scan is in progress
if st.session_state.scanning:
    st.info("Security scan in progress...")
    
    # Show progress bar
    st.progress(st.session_state.scan_progress / 100)
    
    # Show scan log
    st.subheader("Scan Log")
    
    scan_log_text = "\n".join(st.session_state.scan_log)
    st.text_area("Log Output", scan_log_text, height=200)

# Show scan results if available
elif st.session_state.scan_results:
    # Get scan results
    results = st.session_state.scan_results
    summary = results["summary"]
    vulnerabilities = results["vulnerabilities"]
    dependencies = results["dependencies"]
    compliance_checks = results["compliance"]
    
    # Display scan info and security score
    col1, col2, col3 = st.columns([2, 3, 2])
    
    with col1:
        st.subheader("Scan Information")
        st.write(f"**Project:** {summary['project']}")
        st.write(f"**Scan Type:** {summary['scan_type'].capitalize()}")
        st.write(f"**Scan Time:** {summary['scan_time']}")
    
    with col2:
        # Security score gauge and metrics
        st.subheader("Security Score")
        
        score = summary["score"]
        
        # Determine score color
        if score >= 80:
            score_color = "green"
        elif score >= 60:
            score_color = "orange"
        else:
            score_color = "red"
        
        # Create gauge chart
        fig = go.Figure(go.Indicator(
            mode="gauge+number",
            value=score,
            domain={"x": [0, 1], "y": [0, 1]},
            title={"text": "Security Score"},
            gauge={
                "axis": {"range": [0, 100]},
                "bar": {"color": score_color},
                "steps": [
                    {"range": [0, 50], "color": "lightgray"},
                    {"range": [50, 75], "color": "lightgray"},
                    {"range": [75, 100], "color": "lightgray"}
                ],
                "threshold": {
                    "line": {"color": "red", "width": 4},
                    "thickness": 0.75,
                    "value": 90
                }
            }
        ))
        
        fig.update_layout(height=250, margin=dict(l=20, r=20, t=50, b=20))
        st.plotly_chart(fig, use_container_width=True)
    
    with col3:
        st.subheader("Vulnerability Summary")
        
        vuln_data = {
            "Severity": ["Critical", "High", "Medium", "Low"],
            "Count": [
                summary["vulnerabilities"]["critical"],
                summary["vulnerabilities"]["high"],
                summary["vulnerabilities"]["medium"],
                summary["vulnerabilities"]["low"]
            ]
        }
        
        vuln_df = pd.DataFrame(vuln_data)
        
        # Set colors for each severity level
        colors = ["#ff4b4b", "#ffa500", "#ffdf00", "#02b2e7"]
        
        # Create horizontal bar chart
        fig = px.bar(
            vuln_df,
            x="Count",
            y="Severity",
            orientation="h",
            color="Severity",
            color_discrete_map={
                "Critical": "#ff4b4b",
                "High": "#ffa500",
                "Medium": "#ffdf00",
                "Low": "#02b2e7"
            }
        )
        
        fig.update_layout(height=250, margin=dict(l=20, r=20, t=30, b=20))
        st.plotly_chart(fig, use_container_width=True)
    
    # Create tabs for different sections of the report
    tab1, tab2, tab3, tab4 = st.tabs(["Vulnerabilities", "Dependencies", "Compliance", "Recommendations"])
    
    with tab1:  # Vulnerabilities tab
        st.subheader("Detected Vulnerabilities")
        
        # Filter controls
        severity_filter = st.multiselect(
            "Filter by Severity",
            ["Critical", "High", "Medium", "Low"],
            default=["Critical", "High", "Medium", "Low"]
        )
        
        # Convert selections to lowercase for filtering
        severity_filter_lower = [s.lower() for s in severity_filter]
        
        # Filter vulnerabilities
        filtered_vulns = [v for v in vulnerabilities if v["severity"].lower() in severity_filter_lower]
        
        if filtered_vulns:
            # Display vulnerabilities in a scrollable container
            vuln_container = st.container()
            
            with vuln_container:
                # Display each vulnerability
                for vuln in filtered_vulns:
                    vuln_id = vuln["id"]
                    vuln_type = vuln["type"]
                    severity = vuln["severity"]
                    description = vuln["description"]
                    file = vuln["file"]
                    line = vuln["line"]
                    
                    # Create an expander for each vulnerability
                    with st.expander(f"{vuln_id}: {vuln_type} ({severity.upper()})"):
                        # Display vulnerability details
                        st.markdown(f"**Description:** {description}")
                        st.markdown(f"**File:** `{file}`")
                        st.markdown(f"**Line:** {line}")
                        
                        # Add a separator
                        st.markdown("---")
                        
                        # Show code snippet if available
                        if "code_snippet" in vuln:
                            st.markdown("**Code Snippet:**")
                            
                            # Style the code snippet with HTML/CSS
                            snippet = vuln["code_snippet"].replace("\\n", "<br>").replace(" ", "&nbsp;")
                            st.markdown(
                                f"""
                                <div style="background-color: #272822; color: #f8f8f2; padding: 10px; border-radius: 5px; font-family: 'Courier New', monospace; overflow-x: auto; margin: 10px 0;">
                                {snippet}
                                </div>
                                """, 
                                unsafe_allow_html=True
                            )
                        
                        # Display remediation
                        st.markdown(f"**Remediation:** {vuln['remediation']}")
                        
                        # Display CWE reference
                        st.markdown(f"**CWE:** {vuln['cwe']}")
                        
                        # Display references
                        if vuln.get("references"):
                            st.markdown("**References:**")
                            for ref in vuln["references"]:
                                st.markdown(f"- [{ref}]({ref})")
        else:
            st.info("No vulnerabilities found matching the selected filters.")
    
    with tab2:  # Dependencies tab
        st.subheader("Dependency Analysis")
        
        # Create a table of dependencies
        dependency_data = []
        
        for dep in dependencies:
            name = dep["name"]
            version = dep["version"]
            vuln_count = len(dep["vulnerabilities"])
            highest_severity = "none"
            
            if vuln_count > 0:
                # Determine highest severity
                if any(v["severity"] == "critical" for v in dep["vulnerabilities"]):
                    highest_severity = "critical"
                elif any(v["severity"] == "high" for v in dep["vulnerabilities"]):
                    highest_severity = "high"
                elif any(v["severity"] == "medium" for v in dep["vulnerabilities"]):
                    highest_severity = "medium"
                else:
                    highest_severity = "low"
            
            dependency_data.append({
                "Name": name,
                "Version": version,
                "Vulnerabilities": vuln_count,
                "Highest Severity": highest_severity.capitalize()
            })
        
        # Convert to DataFrame for display
        dep_df = pd.DataFrame(dependency_data)
        
        # Apply conditional formatting to the table
        styled_df = dep_df.style.apply(lambda x: [
            f"background-color: {'#ffebee' if val == 'Critical' else '#fff8e1' if val == 'High' else '#e3f2fd' if val == 'Medium' else 'white'}"
            if col == "Highest Severity" and val != "None" else ""
            for col, val in zip(dep_df.columns, x)
        ], axis=1)
        
        # Display the table
        st.dataframe(styled_df)
        
        # Show details for vulnerable dependencies
        vulnerable_deps = [d for d in dependencies if d["vulnerabilities"]]
        
        if vulnerable_deps:
            st.subheader("Vulnerable Dependencies")
            
            for dep in vulnerable_deps:
                name = dep["name"]
                version = dep["version"]
                vulns = dep["vulnerabilities"]
                
                st.markdown(f"### {name} ({version})")
                
                for vuln in vulns:
                    vuln_id = vuln["id"]
                    severity = vuln["severity"]
                    description = vuln["description"]
                    
                    st.markdown(
                        f"""
                        <div style="border-left: 4px solid {'#ff4b4b' if severity == 'critical' else '#ffa500' if severity == 'high' else '#ffdf00' if severity == 'medium' else '#02b2e7'}; padding: 10px; margin-bottom: 10px; background-color: #fafafa;">
                            <strong>{vuln_id}</strong> ({severity.upper()})
                            <div style="margin-top: 5px;">{description}</div>
                        </div>
                        """,
                        unsafe_allow_html=True
                    )
                
                # Recommended action
                st.markdown(f"**Recommended Action:** Update {name} to the latest version")
                st.markdown("---")
        else:
            st.success("No vulnerabilities found in dependencies.")
    
    with tab3:  # Compliance tab
        st.subheader("Security Compliance Checks")
        
        # Count results by status
        pass_count = sum(1 for check in compliance_checks if check["status"] == "pass")
        fail_count = sum(1 for check in compliance_checks if check["status"] == "fail")
        warning_count = sum(1 for check in compliance_checks if check["status"] == "warning")
        total_count = len(compliance_checks)
        
        # Calculate compliance percentage
        compliance_percentage = int((pass_count / total_count) * 100)
        
        # Display compliance score
        col1, col2 = st.columns([1, 2])
        
        with col1:
            # Create gauge chart for compliance score
            fig = go.Figure(go.Indicator(
                mode="gauge+number",
                value=compliance_percentage,
                domain={"x": [0, 1], "y": [0, 1]},
                title={"text": "Compliance Score"},
                gauge={
                    "axis": {"range": [0, 100]},
                    "bar": {"color": "green" if compliance_percentage >= 80 else "orange" if compliance_percentage >= 60 else "red"},
                    "steps": [
                        {"range": [0, 50], "color": "lightgray"},
                        {"range": [50, 75], "color": "lightgray"},
                        {"range": [75, 100], "color": "lightgray"}
                    ],
                    "threshold": {
                        "line": {"color": "red", "width": 4},
                        "thickness": 0.75,
                        "value": 90
                    }
                }
            ))
            
            fig.update_layout(height=300, margin=dict(l=20, r=20, t=50, b=20))
            st.plotly_chart(fig, use_container_width=True)
        
        with col2:
            # Create pie chart for compliance status distribution
            status_data = {
                "Status": ["Pass", "Warning", "Fail"],
                "Count": [pass_count, warning_count, fail_count]
            }
            
            status_df = pd.DataFrame(status_data)
            
            fig = px.pie(
                status_df,
                values="Count",
                names="Status",
                color="Status",
                color_discrete_map={
                    "Pass": "#4CAF50",
                    "Warning": "#FFC107",
                    "Fail": "#F44336"
                },
                hole=0.3
            )
            
            fig.update_layout(height=300, margin=dict(l=20, r=20, t=50, b=20))
            st.plotly_chart(fig, use_container_width=True)
        
        # Display compliance checks
        st.subheader("Compliance Check Results")
        
        for check in compliance_checks:
            check_id = check["id"]
            name = check["name"]
            status = check["status"]
            
            # Determine status color and icon
            if status == "pass":
                status_color = "#4CAF50"
                status_icon = "✓"
            elif status == "warning":
                status_color = "#FFC107"
                status_icon = "⚠"
            else:  # fail
                status_color = "#F44336"
                status_icon = "✗"
            
            # Display check with formatted status
            st.markdown(
                f"""
                <div style="display: flex; justify-content: space-between; padding: 10px; margin-bottom: 5px; background-color: #f9f9f9; border-radius: 5px;">
                    <div>
                        <strong>{check_id}:</strong> {name}
                    </div>
                    <div style="background-color: {status_color}; color: white; padding: 2px 10px; border-radius: 3px;">
                        {status_icon} {status.upper()}
                    </div>
                </div>
                """,
                unsafe_allow_html=True
            )
    
    with tab4:  # Recommendations tab
        st.subheader("Security Recommendations")
        
        # Generate recommendations based on scan results
        recommendations = []
        
        # Add recommendation for critical vulnerabilities
        if summary["vulnerabilities"]["critical"] > 0:
            recommendations.append({
                "priority": "critical",
                "title": "Fix Critical Vulnerabilities",
                "description": f"Address the {summary['vulnerabilities']['critical']} critical vulnerabilities immediately to prevent potential security breaches."
            })
        
        # Add recommendation for high vulnerabilities
        if summary["vulnerabilities"]["high"] > 0:
            recommendations.append({
                "priority": "high",
                "title": "Address High Severity Issues",
                "description": f"Resolve the {summary['vulnerabilities']['high']} high severity vulnerabilities to significantly improve application security."
            })
        
        # Add recommendation for vulnerable dependencies
        vulnerable_deps = [d for d in dependencies if d["vulnerabilities"]]
        if vulnerable_deps:
            recommendations.append({
                "priority": "high",
                "title": "Update Vulnerable Dependencies",
                "description": f"Update the {len(vulnerable_deps)} dependencies with known vulnerabilities to their latest secure versions."
            })
        
        # Add recommendation for failed compliance checks
        failed_checks = [c for c in compliance_checks if c["status"] == "fail"]
        if failed_checks:
            recommendations.append({
                "priority": "medium",
                "title": "Resolve Compliance Issues",
                "description": f"Address the {len(failed_checks)} failed compliance checks to improve overall security posture."
            })
        
        # Add general recommendations
        recommendations.extend([
            {
                "priority": "medium",
                "title": "Implement Input Validation",
                "description": "Add comprehensive input validation to all user-facing interfaces to prevent injection attacks."
            },
            {
                "priority": "medium",
                "title": "Enhance Error Handling",
                "description": "Implement consistent error handling that doesn't expose sensitive information."
            },
            {
                "priority": "medium",
                "title": "Implement Proper Authentication",
                "description": "Ensure strong authentication mechanisms are in place with proper password policies."
            },
            {
                "priority": "low",
                "title": "Enable Security Headers",
                "description": "Add security headers to HTTP responses to enhance browser-side protection."
            },
            {
                "priority": "low",
                "title": "Regular Security Scans",
                "description": "Implement regular automated security scans in your CI/CD pipeline."
            }
        ])
        
        # Sort recommendations by priority
        priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        recommendations.sort(key=lambda x: priority_order[x["priority"]])
        
        # Display recommendations
        for i, rec in enumerate(recommendations):
            priority = rec["priority"]
            title = rec["title"]
            description = rec["description"]
            
            # Determine priority color
            if priority == "critical":
                priority_color = "#ff4b4b"
            elif priority == "high":
                priority_color = "#ffa500"
            elif priority == "medium":
                priority_color = "#ffdf00"
            else:  # low
                priority_color = "#02b2e7"
            
            # Display recommendation
            st.markdown(
                f"""
                <div style="border-left: 4px solid {priority_color}; padding: 15px; margin-bottom: 15px; background-color: #f9f9f9; border-radius: 5px;">
                    <h3 style="margin-top: 0;">{i+1}. {title}</h3>
                    <div style="background-color: {priority_color}; color: white; display: inline-block; padding: 2px 10px; border-radius: 3px; margin-bottom: 10px; text-transform: uppercase; font-size: 0.8em;">{priority}</div>
                    <p style="margin-bottom: 0;">{description}</p>
                </div>
                """,
                unsafe_allow_html=True
            )
else:
    # Welcome message
    st.info("""
    ### Security Dashboard
    
    This dashboard provides comprehensive security analysis for your projects, including:
    - Vulnerability detection and assessment
    - Dependency security analysis
    - Compliance checking against security standards
    - Actionable security recommendations
    
    To get started:
    1. Select a project from the sidebar
    2. Choose a scan type
    3. Click "Start Security Scan" to analyze your project
    
    The security scan will identify vulnerabilities, assess dependencies,
    check compliance, and provide recommendations to improve your security posture.
    """)
    
    # Example security metrics visualization
    st.subheader("Example Security Insights")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Security Score", "85/100", "+12")
    
    with col2:
        st.metric("Critical Issues", "0", "0")
    
    with col3:
        st.metric("High Issues", "2", "-5")
    
    with col4:
        st.metric("Compliance", "92%", "+8%")
    
    # Sample visualization
    st.image("https://miro.medium.com/max/1400/1*RIrV8tSF-L-Gnh9G1qUjYQ.png", 
             caption="Example security dashboard visualization", 
             use_column_width=True)
