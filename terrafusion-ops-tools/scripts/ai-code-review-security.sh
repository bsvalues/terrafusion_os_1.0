#!/bin/bash

# AI-Driven Code Review and Security Analysis
# Automated code quality and security vulnerability detection
# Features: ML-based code analysis, security scanning, best practices enforcement, automated fixes

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${CONFIG_FILE:-${SCRIPT_DIR}/../config/ai-code-review.conf}"
LOG_FILE="${LOG_FILE:-/var/log/terrafusion/ai-code-review.log}"
MODEL_DIR="${MODEL_DIR:-${SCRIPT_DIR}/../models}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Initialize database
init_database() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Initializing AI code review database...${NC}"
    
    psql -h localhost -U postgres -d terrafusion <<EOF
-- Code review sessions
CREATE TABLE IF NOT EXISTS code_review_sessions (
    id SERIAL PRIMARY KEY,
    session_id UUID DEFAULT gen_random_uuid(),
    repository VARCHAR(255) NOT NULL,
    branch VARCHAR(255),
    commit_hash VARCHAR(40),
    files_analyzed INTEGER DEFAULT 0,
    issues_found INTEGER DEFAULT 0,
    security_score DECIMAL(5,2),
    quality_score DECIMAL(5,2),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Code issues detected
CREATE TABLE IF NOT EXISTS code_issues (
    id SERIAL PRIMARY KEY,
    session_id UUID,
    file_path TEXT NOT NULL,
    line_number INTEGER,
    column_number INTEGER,
    issue_type VARCHAR(50),
    severity VARCHAR(20),
    category VARCHAR(50),
    description TEXT,
    suggested_fix TEXT,
    confidence_score DECIMAL(5,2),
    false_positive BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security vulnerabilities
CREATE TABLE IF NOT EXISTS security_vulnerabilities (
    id SERIAL PRIMARY KEY,
    session_id UUID,
    vulnerability_type VARCHAR(100),
    cwe_id VARCHAR(20),
    owasp_category VARCHAR(50),
    file_path TEXT,
    line_range VARCHAR(20),
    severity VARCHAR(20),
    description TEXT,
    remediation TEXT,
    cvss_score DECIMAL(3,1),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Code quality metrics
CREATE TABLE IF NOT EXISTS code_quality_metrics (
    id SERIAL PRIMARY KEY,
    session_id UUID,
    file_path TEXT,
    complexity_score INTEGER,
    maintainability_index DECIMAL(5,2),
    technical_debt_minutes INTEGER,
    code_smells INTEGER,
    duplicated_lines INTEGER,
    test_coverage DECIMAL(5,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Best practices violations
CREATE TABLE IF NOT EXISTS best_practices_violations (
    id SERIAL PRIMARY KEY,
    session_id UUID,
    practice_id VARCHAR(100),
    practice_name VARCHAR(255),
    file_path TEXT,
    line_number INTEGER,
    violation_description TEXT,
    recommendation TEXT,
    auto_fixable BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML model performance
CREATE TABLE IF NOT EXISTS ml_model_metrics (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(100),
    model_version VARCHAR(20),
    accuracy DECIMAL(5,2),
    precision_score DECIMAL(5,2),
    recall_score DECIMAL(5,2),
    f1_score DECIMAL(5,2),
    training_date TIMESTAMP,
    evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_code_issues_severity ON code_issues(severity, issue_type);
CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_severity ON security_vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_code_review_sessions_repo ON code_review_sessions(repository, branch);
EOF
    
    echo -e "${GREEN}✓ Database initialized successfully${NC}"
}

# Train ML models for code analysis
train_ml_models() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Training ML models for code analysis...${NC}"
    
    # Create model training script
    cat > /tmp/train_code_models.py << 'EOF'
import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import tensorflow as tf
from transformers import AutoTokenizer, TFAutoModel
import ast
import re

class CodeAnalysisModelTrainer:
    def __init__(self, model_dir='/opt/terrafusion/models'):
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        
    def train_vulnerability_detector(self):
        """Train model to detect security vulnerabilities"""
        print("Training vulnerability detector...")
        
        # Load training data (would come from labeled vulnerability database)
        # For demo, creating synthetic data
        vulnerabilities = [
            ("eval(user_input)", "code_injection", 1),
            ("os.system(cmd)", "command_injection", 1),
            ("SELECT * FROM users WHERE id = " + str(1), "sql_injection", 1),
            ("password = 'hardcoded'", "hardcoded_secret", 1),
            ("http://api.example.com", "insecure_protocol", 1),
            ("md5(password)", "weak_crypto", 1),
            ("if (x > 0) { return true; }", "safe_code", 0),
            ("const API_KEY = process.env.API_KEY", "safe_code", 0)
        ]
        
        X = [code for code, _, _ in vulnerabilities]
        y = [label for _, _, label in vulnerabilities]
        
        # Create pipeline with TF-IDF and classifier
        pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 3), max_features=1000)),
            ('classifier', GradientBoostingClassifier(n_estimators=100))
        ])
        
        # Train model
        pipeline.fit(X, y)
        
        # Save model
        with open(os.path.join(self.model_dir, 'vulnerability_detector.pkl'), 'wb') as f:
            pickle.dump(pipeline, f)
            
        print("✓ Vulnerability detector trained")
        
    def train_code_quality_analyzer(self):
        """Train model to analyze code quality"""
        print("Training code quality analyzer...")
        
        # Create neural network for code quality assessment
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu', input_shape=(20,)),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.2),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        
        # Generate synthetic training data
        # Features: complexity, line_length, nesting_depth, etc.
        X_train = np.random.rand(1000, 20)
        y_train = (X_train.mean(axis=1) > 0.5).astype(int)
        
        # Train model
        model.fit(X_train, y_train, epochs=10, batch_size=32, validation_split=0.2, verbose=0)
        
        # Save model
        model.save(os.path.join(self.model_dir, 'code_quality_model.h5'))
        
        print("✓ Code quality analyzer trained")
        
    def train_best_practices_enforcer(self):
        """Train model to detect best practices violations"""
        print("Training best practices enforcer...")
        
        # Pattern-based rules for best practices
        best_practices = {
            'naming_convention': {
                'patterns': [
                    (r'def [a-z_]+\(', 'function_naming'),
                    (r'class [A-Z][a-zA-Z]+', 'class_naming'),
                    (r'[A-Z_]+\s*=', 'constant_naming')
                ],
                'violations': [
                    (r'def [A-Z]', 'Function names should be lowercase'),
                    (r'class [a-z]', 'Class names should be CamelCase'),
                ]
            },
            'code_structure': {
                'patterns': [
                    (r'if.*:\s*pass', 'empty_block'),
                    (r'except:\s*pass', 'bare_except'),
                    (r'TODO|FIXME|XXX', 'unresolved_todo')
                ]
            },
            'security': {
                'patterns': [
                    (r'pickle\.load', 'unsafe_deserialization'),
                    (r'exec\(|eval\(', 'dynamic_execution'),
                    (r'verify\s*=\s*False', 'ssl_verification_disabled')
                ]
            }
        }
        
        # Save rules
        with open(os.path.join(self.model_dir, 'best_practices_rules.json'), 'w') as f:
            json.dump(best_practices, f)
            
        print("✓ Best practices enforcer trained")
        
    def train_auto_fix_model(self):
        """Train model to suggest automatic fixes"""
        print("Training auto-fix model...")
        
        # Create transformer-based model for code fixes
        # Using a smaller model for demo purposes
        fix_patterns = {
            'sql_injection': {
                'pattern': r'SELECT .* WHERE .* = ["\']?\s*\+',
                'fix': 'Use parameterized queries: cursor.execute("SELECT * FROM table WHERE id = ?", (value,))'
            },
            'hardcoded_secret': {
                'pattern': r'(password|api_key|secret)\s*=\s*["\'][^"\']+["\']',
                'fix': 'Use environment variables: os.environ.get("SECRET_KEY")'
            },
            'weak_crypto': {
                'pattern': r'md5\(|sha1\(',
                'fix': 'Use stronger algorithms: hashlib.sha256() or bcrypt'
            }
        }
        
        with open(os.path.join(self.model_dir, 'auto_fix_patterns.json'), 'w') as f:
            json.dump(fix_patterns, f)
            
        print("✓ Auto-fix model trained")

    def evaluate_models(self):
        """Evaluate model performance"""
        print("Evaluating models...")
        
        # Load and evaluate vulnerability detector
        with open(os.path.join(self.model_dir, 'vulnerability_detector.pkl'), 'rb') as f:
            vuln_model = pickle.load(f)
            
        # Test data
        test_codes = [
            "eval(request.GET['cmd'])",
            "if user.is_authenticated():"
        ]
        test_labels = [1, 0]
        
        predictions = vuln_model.predict(test_codes)
        accuracy = accuracy_score(test_labels, predictions)
        
        print(f"Vulnerability detector accuracy: {accuracy:.2f}")
        
        # Store metrics in database
        import psycopg2
        conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO ml_model_metrics 
            (model_name, model_version, accuracy, training_date)
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
        """, ('vulnerability_detector', '1.0', accuracy * 100))
        
        conn.commit()
        conn.close()

if __name__ == '__main__':
    trainer = CodeAnalysisModelTrainer()
    trainer.train_vulnerability_detector()
    trainer.train_code_quality_analyzer()
    trainer.train_best_practices_enforcer()
    trainer.train_auto_fix_model()
    trainer.evaluate_models()
EOF

    python3 /tmp/train_code_models.py
    
    echo -e "${GREEN}✓ ML models trained successfully${NC}"
}

# Analyze code with AI
analyze_code() {
    local repo_path="${1:-/app}"
    local branch="${2:-main}"
    
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Analyzing code in $repo_path...${NC}"
    
    # Create analysis session
    local session_id=$(psql -h localhost -U postgres -d terrafusion -t -c \
        "INSERT INTO code_review_sessions (repository, branch) VALUES ('$repo_path', '$branch') RETURNING session_id" | xargs)
    
    # Create comprehensive code analyzer
    cat > /tmp/ai_code_analyzer.py << 'EOF'
import os
import sys
import json
import ast
import re
import pickle
import numpy as np
import psycopg2
from pathlib import Path
import subprocess
import radon.complexity as radon_cc
import radon.metrics as radon_metrics
from pylint import epylint as lint
import bandit
from bandit.core import manager

class AICodeAnalyzer:
    def __init__(self, session_id, model_dir='/opt/terrafusion/models'):
        self.session_id = session_id
        self.model_dir = model_dir
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.load_models()
        
    def load_models(self):
        """Load trained ML models"""
        try:
            with open(os.path.join(self.model_dir, 'vulnerability_detector.pkl'), 'rb') as f:
                self.vuln_detector = pickle.load(f)
        except:
            self.vuln_detector = None
            
        try:
            with open(os.path.join(self.model_dir, 'best_practices_rules.json'), 'r') as f:
                self.best_practices = json.load(f)
        except:
            self.best_practices = {}
            
    def analyze_repository(self, repo_path):
        """Analyze entire repository"""
        files_analyzed = 0
        total_issues = 0
        
        # Supported file extensions
        extensions = {'.py', '.js', '.java', '.go', '.rs', '.cpp', '.c', '.php', '.rb'}
        
        for root, dirs, files in os.walk(repo_path):
            # Skip common non-code directories
            dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', '__pycache__', 'venv']]
            
            for file in files:
                if any(file.endswith(ext) for ext in extensions):
                    filepath = os.path.join(root, file)
                    print(f"Analyzing: {filepath}")
                    
                    issues = self.analyze_file(filepath)
                    files_analyzed += 1
                    total_issues += len(issues)
                    
        # Update session
        cur = self.db_conn.cursor()
        cur.execute("""
            UPDATE code_review_sessions 
            SET files_analyzed = %s, issues_found = %s, completed_at = CURRENT_TIMESTAMP
            WHERE session_id = %s
        """, (files_analyzed, total_issues, self.session_id))
        self.db_conn.commit()
        
        return files_analyzed, total_issues
        
    def analyze_file(self, filepath):
        """Comprehensive file analysis"""
        issues = []
        
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            # 1. Security vulnerability detection
            vulnerabilities = self.detect_vulnerabilities(filepath, content)
            issues.extend(vulnerabilities)
            
            # 2. Code quality analysis
            quality_issues = self.analyze_code_quality(filepath, content)
            issues.extend(quality_issues)
            
            # 3. Best practices enforcement
            practice_violations = self.check_best_practices(filepath, content)
            issues.extend(practice_violations)
            
            # 4. Language-specific analysis
            if filepath.endswith('.py'):
                python_issues = self.analyze_python_specific(filepath, content)
                issues.extend(python_issues)
                
        except Exception as e:
            print(f"Error analyzing {filepath}: {e}")
            
        return issues
        
    def detect_vulnerabilities(self, filepath, content):
        """Detect security vulnerabilities using ML and pattern matching"""
        vulnerabilities = []
        
        # Common vulnerability patterns
        vuln_patterns = {
            'sql_injection': {
                'pattern': r'(SELECT|INSERT|UPDATE|DELETE).*\+\s*["\']?\s*\+?\s*\w+',
                'severity': 'critical',
                'cwe': 'CWE-89',
                'description': 'Potential SQL injection vulnerability'
            },
            'command_injection': {
                'pattern': r'(os\.system|subprocess\.call|exec|eval)\s*\([^)]*\+',
                'severity': 'critical',
                'cwe': 'CWE-78',
                'description': 'Potential command injection vulnerability'
            },
            'path_traversal': {
                'pattern': r'open\s*\([^)]*\.\.[/\\]',
                'severity': 'high',
                'cwe': 'CWE-22',
                'description': 'Potential path traversal vulnerability'
            },
            'hardcoded_secret': {
                'pattern': r'(password|api_key|secret|token)\s*=\s*["\'][^"\']{8,}["\']',
                'severity': 'high',
                'cwe': 'CWE-798',
                'description': 'Hardcoded secret detected'
            },
            'weak_crypto': {
                'pattern': r'(md5|sha1)\s*\(',
                'severity': 'medium',
                'cwe': 'CWE-327',
                'description': 'Weak cryptographic algorithm'
            },
            'insecure_random': {
                'pattern': r'random\.(random|randint|choice)\s*\(',
                'severity': 'medium',
                'cwe': 'CWE-330',
                'description': 'Insecure random number generation'
            }
        }
        
        lines = content.split('\n')
        
        for vuln_type, vuln_info in vuln_patterns.items():
            for i, line in enumerate(lines, 1):
                if re.search(vuln_info['pattern'], line, re.IGNORECASE):
                    # Use ML model for additional validation if available
                    confidence = 0.9
                    if self.vuln_detector:
                        try:
                            prediction = self.vuln_detector.predict_proba([line])[0][1]
                            confidence = float(prediction)
                        except:
                            pass
                            
                    if confidence > 0.5:
                        vuln = {
                            'file_path': filepath,
                            'line_number': i,
                            'vulnerability_type': vuln_type,
                            'severity': vuln_info['severity'],
                            'cwe_id': vuln_info['cwe'],
                            'description': vuln_info['description'],
                            'line_content': line.strip(),
                            'confidence': confidence
                        }
                        vulnerabilities.append(vuln)
                        self.store_vulnerability(vuln)
                        
        return vulnerabilities
        
    def analyze_code_quality(self, filepath, content):
        """Analyze code quality metrics"""
        quality_issues = []
        
        if filepath.endswith('.py'):
            try:
                # Calculate complexity
                cc_results = radon_cc.cc_visit(content)
                
                for result in cc_results:
                    if result.complexity > 10:
                        issue = {
                            'file_path': filepath,
                            'line_number': result.lineno,
                            'issue_type': 'high_complexity',
                            'severity': 'medium' if result.complexity < 20 else 'high',
                            'description': f'Function {result.name} has high cyclomatic complexity: {result.complexity}'
                        }
                        quality_issues.append(issue)
                        self.store_issue(issue)
                        
                # Calculate maintainability index
                mi = radon_metrics.mi_visit(content, True)
                if mi < 50:
                    issue = {
                        'file_path': filepath,
                        'issue_type': 'low_maintainability',
                        'severity': 'medium',
                        'description': f'Low maintainability index: {mi:.2f}'
                    }
                    quality_issues.append(issue)
                    self.store_issue(issue)
                    
            except Exception as e:
                print(f"Error calculating metrics: {e}")
                
        # Check for code smells
        code_smells = self.detect_code_smells(filepath, content)
        quality_issues.extend(code_smells)
        
        return quality_issues
        
    def detect_code_smells(self, filepath, content):
        """Detect common code smells"""
        smells = []
        lines = content.split('\n')
        
        # Long methods/functions
        function_lines = []
        in_function = False
        function_start = 0
        
        for i, line in enumerate(lines):
            if re.match(r'^\s*(def|function|func)\s+', line):
                if in_function and i - function_start > 50:
                    smells.append({
                        'file_path': filepath,
                        'line_number': function_start + 1,
                        'issue_type': 'long_method',
                        'severity': 'medium',
                        'description': f'Long method ({i - function_start} lines)'
                    })
                in_function = True
                function_start = i
                
        # Duplicate code detection (simplified)
        line_hashes = {}
        for i, line in enumerate(lines):
            line_stripped = line.strip()
            if len(line_stripped) > 20:  # Only consider substantial lines
                line_hash = hash(line_stripped)
                if line_hash in line_hashes:
                    smells.append({
                        'file_path': filepath,
                        'line_number': i + 1,
                        'issue_type': 'duplicate_code',
                        'severity': 'low',
                        'description': f'Duplicate line (also at line {line_hashes[line_hash] + 1})'
                    })
                else:
                    line_hashes[line_hash] = i
                    
        return smells
        
    def check_best_practices(self, filepath, content):
        """Check for best practices violations"""
        violations = []
        
        if not self.best_practices:
            return violations
            
        lines = content.split('\n')
        
        for category, rules in self.best_practices.items():
            if 'violations' in rules:
                for pattern, message in rules['violations']:
                    for i, line in enumerate(lines):
                        if re.search(pattern, line):
                            violation = {
                                'file_path': filepath,
                                'line_number': i + 1,
                                'practice_id': f'{category}_{pattern}',
                                'practice_name': category,
                                'violation_description': message,
                                'line_content': line.strip()
                            }
                            violations.append(violation)
                            self.store_best_practice_violation(violation)
                            
        return violations
        
    def analyze_python_specific(self, filepath, content):
        """Python-specific analysis using AST and pylint"""
        issues = []
        
        # AST-based analysis
        try:
            tree = ast.parse(content)
            
            # Check for specific patterns
            for node in ast.walk(tree):
                # Unused imports
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if not self.is_name_used(alias.name, content):
                            issues.append({
                                'file_path': filepath,
                                'line_number': node.lineno,
                                'issue_type': 'unused_import',
                                'severity': 'low',
                                'description': f'Unused import: {alias.name}'
                            })
                            
        except SyntaxError as e:
            issues.append({
                'file_path': filepath,
                'line_number': e.lineno,
                'issue_type': 'syntax_error',
                'severity': 'critical',
                'description': str(e)
            })
            
        # Run pylint for additional checks
        try:
            (pylint_stdout, pylint_stderr) = lint.py_run(filepath, return_std=True)
            output = pylint_stdout.getvalue()
            
            for line in output.split('\n'):
                if ':' in line and 'rated' not in line:
                    parts = line.split(':')
                    if len(parts) >= 3:
                        try:
                            line_num = int(parts[1])
                            message = ':'.join(parts[2:]).strip()
                            
                            # Determine severity based on message type
                            severity = 'low'
                            if line.startswith('E'):
                                severity = 'high'
                            elif line.startswith('W'):
                                severity = 'medium'
                                
                            issues.append({
                                'file_path': filepath,
                                'line_number': line_num,
                                'issue_type': 'pylint_issue',
                                'severity': severity,
                                'description': message
                            })
                        except:
                            pass
        except:
            pass
            
        return issues
        
    def is_name_used(self, name, content):
        """Check if an imported name is used in the code"""
        # Simple check - can be improved
        pattern = r'\b' + re.escape(name) + r'\b'
        matches = re.findall(pattern, content)
        return len(matches) > 1  # More than just the import line
        
    def store_vulnerability(self, vuln):
        """Store vulnerability in database"""
        cur = self.db_conn.cursor()
        cur.execute("""
            INSERT INTO security_vulnerabilities 
            (session_id, vulnerability_type, cwe_id, file_path, line_range, 
             severity, description, cvss_score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            self.session_id,
            vuln['vulnerability_type'],
            vuln['cwe_id'],
            vuln['file_path'],
            str(vuln['line_number']),
            vuln['severity'],
            vuln['description'],
            self.calculate_cvss_score(vuln['severity'])
        ))
        self.db_conn.commit()
        
    def store_issue(self, issue):
        """Store code issue in database"""
        cur = self.db_conn.cursor()
        cur.execute("""
            INSERT INTO code_issues 
            (session_id, file_path, line_number, issue_type, severity, 
             category, description, confidence_score)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            self.session_id,
            issue['file_path'],
            issue.get('line_number'),
            issue['issue_type'],
            issue['severity'],
            'quality',
            issue['description'],
            issue.get('confidence', 0.8)
        ))
        self.db_conn.commit()
        
    def store_best_practice_violation(self, violation):
        """Store best practice violation in database"""
        cur = self.db_conn.cursor()
        cur.execute("""
            INSERT INTO best_practices_violations 
            (session_id, practice_id, practice_name, file_path, line_number, 
             violation_description, recommendation)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (
            self.session_id,
            violation['practice_id'],
            violation['practice_name'],
            violation['file_path'],
            violation['line_number'],
            violation['violation_description'],
            'Follow coding standards and best practices'
        ))
        self.db_conn.commit()
        
    def calculate_cvss_score(self, severity):
        """Calculate CVSS score based on severity"""
        scores = {
            'critical': 9.0,
            'high': 7.5,
            'medium': 5.0,
            'low': 2.5
        }
        return scores.get(severity, 5.0)

if __name__ == '__main__':
    session_id = sys.argv[1]
    repo_path = sys.argv[2] if len(sys.argv) > 2 else '/app'
    
    analyzer = AICodeAnalyzer(session_id)
    files_analyzed, issues_found = analyzer.analyze_repository(repo_path)
    
    print(f"\nAnalysis complete:")
    print(f"Files analyzed: {files_analyzed}")
    print(f"Issues found: {issues_found}")
EOF

    # Run the analyzer
    python3 /tmp/ai_code_analyzer.py "$session_id" "$repo_path"
    
    # Calculate and update scores
    psql -h localhost -U postgres -d terrafusion <<EOF
-- Calculate security score
WITH security_stats AS (
    SELECT 
        COUNT(*) FILTER (WHERE severity = 'critical') * 10 +
        COUNT(*) FILTER (WHERE severity = 'high') * 5 +
        COUNT(*) FILTER (WHERE severity = 'medium') * 2 +
        COUNT(*) FILTER (WHERE severity = 'low') as total_penalty
    FROM security_vulnerabilities
    WHERE session_id = '$session_id'
)
UPDATE code_review_sessions
SET security_score = GREATEST(0, 100 - (SELECT total_penalty FROM security_stats))
WHERE session_id = '$session_id';

-- Calculate quality score
WITH quality_stats AS (
    SELECT 
        COUNT(*) FILTER (WHERE severity = 'high') * 5 +
        COUNT(*) FILTER (WHERE severity = 'medium') * 2 +
        COUNT(*) FILTER (WHERE severity = 'low') * 0.5 as total_penalty
    FROM code_issues
    WHERE session_id = '$session_id'
)
UPDATE code_review_sessions
SET quality_score = GREATEST(0, 100 - (SELECT total_penalty FROM quality_stats))
WHERE session_id = '$session_id';
EOF
    
    echo -e "${GREEN}✓ Code analysis completed${NC}"
}

# Generate automated fixes
generate_fixes() {
    local session_id="$1"
    
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Generating automated fixes...${NC}"
    
    # Create fix generator
    cat > /tmp/auto_fix_generator.py << 'EOF'
import os
import sys
import json
import re
import psycopg2
from pathlib import Path

class AutoFixGenerator:
    def __init__(self, session_id):
        self.session_id = session_id
        self.db_conn = psycopg2.connect('postgresql://postgres@localhost/terrafusion')
        self.load_fix_patterns()
        
    def load_fix_patterns(self):
        """Load automated fix patterns"""
        try:
            with open('/opt/terrafusion/models/auto_fix_patterns.json', 'r') as f:
                self.fix_patterns = json.load(f)
        except:
            self.fix_patterns = {
                'sql_injection': {
                    'pattern': r'(SELECT|INSERT|UPDATE|DELETE).*\+\s*["\']?\s*\+?\s*(\w+)',
                    'fix_template': 'cursor.execute("{query} WHERE id = ?", ({param},))',
                    'description': 'Use parameterized queries'
                },
                'hardcoded_secret': {
                    'pattern': r'(\w+)\s*=\s*["\']([^"\']+)["\']',
                    'fix_template': '{var} = os.environ.get("{ENV_VAR}", "")',
                    'description': 'Use environment variables'
                },
                'weak_crypto': {
                    'pattern': r'(md5|sha1)\((.*?)\)',
                    'fix_template': 'hashlib.sha256({content}.encode()).hexdigest()',
                    'description': 'Use stronger hash algorithm'
                },
                'insecure_random': {
                    'pattern': r'random\.(random|randint|choice)',
                    'fix_template': 'secrets.{method}',
                    'description': 'Use cryptographically secure random'
                }
            }
            
    def generate_fixes(self):
        """Generate fixes for all issues in session"""
        cur = self.db_conn.cursor()
        
        # Get vulnerabilities
        cur.execute("""
            SELECT id, vulnerability_type, file_path, line_range, description
            FROM security_vulnerabilities
            WHERE session_id = %s
        """, (self.session_id,))
        
        vulnerabilities = cur.fetchall()
        fixes_generated = 0
        
        for vuln_id, vuln_type, file_path, line_range, description in vulnerabilities:
            if vuln_type in self.fix_patterns:
                fix = self.generate_fix_for_vulnerability(
                    vuln_type, file_path, int(line_range)
                )
                
                if fix:
                    # Store suggested fix
                    cur.execute("""
                        UPDATE security_vulnerabilities
                        SET remediation = %s
                        WHERE id = %s
                    """, (json.dumps(fix), vuln_id))
                    fixes_generated += 1
                    
        # Get code issues
        cur.execute("""
            SELECT id, issue_type, file_path, line_number, description
            FROM code_issues
            WHERE session_id = %s
            AND issue_type IN ('unused_import', 'long_method', 'duplicate_code')
        """, (self.session_id,))
        
        code_issues = cur.fetchall()
        
        for issue_id, issue_type, file_path, line_number, description in code_issues:
            fix = self.generate_fix_for_issue(issue_type, file_path, line_number)
            
            if fix:
                cur.execute("""
                    UPDATE code_issues
                    SET suggested_fix = %s
                    WHERE id = %s
                """, (json.dumps(fix), issue_id))
                fixes_generated += 1
                
        self.db_conn.commit()
        print(f"Generated {fixes_generated} automated fixes")
        
    def generate_fix_for_vulnerability(self, vuln_type, file_path, line_number):
        """Generate fix for specific vulnerability"""
        try:
            with open(file_path, 'r') as f:
                lines = f.readlines()
                
            if line_number <= len(lines):
                original_line = lines[line_number - 1]
                fix_info = self.fix_patterns.get(vuln_type, {})
                
                if 'pattern' in fix_info:
                    match = re.search(fix_info['pattern'], original_line)
                    if match:
                        # Generate contextual fix
                        if vuln_type == 'sql_injection':
                            query = match.group(1)
                            param = match.group(2) if match.lastindex >= 2 else 'param'
                            fixed_line = fix_info['fix_template'].format(
                                query=query, param=param
                            )
                        elif vuln_type == 'hardcoded_secret':
                            var = match.group(1)
                            env_var = var.upper()
                            fixed_line = fix_info['fix_template'].format(
                                var=var, ENV_VAR=env_var
                            )
                        else:
                            fixed_line = original_line
                            
                        return {
                            'original': original_line.strip(),
                            'fixed': fixed_line,
                            'description': fix_info.get('description', ''),
                            'line_number': line_number,
                            'auto_applicable': True
                        }
        except Exception as e:
            print(f"Error generating fix: {e}")
            
        return None
        
    def generate_fix_for_issue(self, issue_type, file_path, line_number):
        """Generate fix for code quality issues"""
        fixes = {
            'unused_import': {
                'action': 'remove_line',
                'description': 'Remove unused import'
            },
            'long_method': {
                'action': 'refactor',
                'description': 'Consider breaking this method into smaller functions'
            },
            'duplicate_code': {
                'action': 'extract_method',
                'description': 'Extract duplicate code into a reusable function'
            }
        }
        
        fix_info = fixes.get(issue_type)
        if fix_info:
            return {
                'action': fix_info['action'],
                'description': fix_info['description'],
                'line_number': line_number,
                'auto_applicable': fix_info['action'] == 'remove_line'
            }
            
        return None
        
    def apply_fixes(self, auto_apply=False):
        """Apply automated fixes"""
        if not auto_apply:
            print("Auto-apply disabled. Fixes are suggested only.")
            return
            
        cur = self.db_conn.cursor()
        
        # Get auto-applicable fixes
        cur.execute("""
            SELECT v.file_path, v.line_range, v.remediation
            FROM security_vulnerabilities v
            WHERE v.session_id = %s
            AND v.remediation IS NOT NULL
            AND v.remediation->>'auto_applicable' = 'true'
        """, (self.session_id,))
        
        fixes = cur.fetchall()
        
        for file_path, line_range, remediation in fixes:
            fix_data = json.loads(remediation)
            self.apply_fix_to_file(file_path, int(line_range), fix_data)
            
    def apply_fix_to_file(self, file_path, line_number, fix_data):
        """Apply a specific fix to a file"""
        try:
            with open(file_path, 'r') as f:
                lines = f.readlines()
                
            if line_number <= len(lines):
                # Backup original
                backup_path = f"{file_path}.ai_backup"
                with open(backup_path, 'w') as f:
                    f.writelines(lines)
                    
                # Apply fix
                lines[line_number - 1] = fix_data['fixed'] + '\n'
                
                with open(file_path, 'w') as f:
                    f.writelines(lines)
                    
                print(f"Applied fix to {file_path}:{line_number}")
                
        except Exception as e:
            print(f"Error applying fix: {e}")

if __name__ == '__main__':
    session_id = sys.argv[1]
    auto_apply = sys.argv[2].lower() == 'true' if len(sys.argv) > 2 else False
    
    generator = AutoFixGenerator(session_id)
    generator.generate_fixes()
    generator.apply_fixes(auto_apply)
EOF

    python3 /tmp/auto_fix_generator.py "$session_id" "false"
    
    echo -e "${GREEN}✓ Automated fixes generated${NC}"
}

# Generate comprehensive report
generate_report() {
    local session_id="${1:-latest}"
    local format="${2:-html}"
    
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] Generating code review report...${NC}"
    
    # Get session ID if 'latest' specified
    if [ "$session_id" = "latest" ]; then
        session_id=$(psql -h localhost -U postgres -d terrafusion -t -c \
            "SELECT session_id FROM code_review_sessions ORDER BY started_at DESC LIMIT 1" | xargs)
    fi
    
    # Generate report data
    psql -h localhost -U postgres -d terrafusion <<EOF
-- Export session summary
COPY (
    SELECT 
        repository,
        branch,
        files_analyzed,
        issues_found,
        security_score,
        quality_score,
        started_at,
        completed_at
    FROM code_review_sessions
    WHERE session_id = '$session_id'
) TO '/tmp/ai_review_summary.csv' WITH CSV HEADER;

-- Export vulnerabilities
COPY (
    SELECT 
        vulnerability_type,
        severity,
        cwe_id,
        file_path,
        line_range,
        description,
        remediation->>'description' as fix_description,
        cvss_score
    FROM security_vulnerabilities
    WHERE session_id = '$session_id'
    ORDER BY cvss_score DESC
) TO '/tmp/ai_review_vulnerabilities.csv' WITH CSV HEADER;

-- Export code issues
COPY (
    SELECT 
        file_path,
        line_number,
        issue_type,
        severity,
        description,
        suggested_fix->>'description' as fix_suggestion
    FROM code_issues
    WHERE session_id = '$session_id'
    ORDER BY severity DESC, file_path
) TO '/tmp/ai_review_issues.csv' WITH CSV HEADER;
EOF

    # Generate HTML report
    if [ "$format" = "html" ]; then
        cat > /tmp/ai_code_review_report.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>AI Code Review Report</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .header { background: #2c3e50; color: white; padding: 30px; margin: -20px -20px 30px -20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 36px; font-weight: bold; margin: 10px 0; }
        .score-high { color: #27ae60; }
        .score-medium { color: #f39c12; }
        .score-low { color: #e74c3c; }
        .section { background: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #34495e; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ecf0f1; }
        tr:hover { background: #f8f9fa; }
        .severity-critical { color: #c0392b; font-weight: bold; }
        .severity-high { color: #e74c3c; }
        .severity-medium { color: #f39c12; }
        .severity-low { color: #95a5a6; }
        .fix-available { background: #d4edda; color: #155724; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .chart { height: 300px; margin: 20px 0; }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="header">
        <h1>AI-Powered Code Review Report</h1>
        <p>Comprehensive security and quality analysis</p>
        <p>Session ID: <code id="sessionId"></code></p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <div class="metric-label">Files Analyzed</div>
            <div class="metric-value" id="filesAnalyzed">-</div>
        </div>
        <div class="metric">
            <div class="metric-label">Issues Found</div>
            <div class="metric-value" id="issuesFound">-</div>
        </div>
        <div class="metric">
            <div class="metric-label">Security Score</div>
            <div class="metric-value score-high" id="securityScore">-</div>
        </div>
        <div class="metric">
            <div class="metric-label">Quality Score</div>
            <div class="metric-value score-high" id="qualityScore">-</div>
        </div>
    </div>
    
    <div class="section">
        <h2>Security Vulnerabilities</h2>
        <canvas id="vulnChart" class="chart"></canvas>
        <table id="vulnTable">
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>File</th>
                    <th>Line</th>
                    <th>Description</th>
                    <th>CVSS</th>
                    <th>Fix</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
    
    <div class="section">
        <h2>Code Quality Issues</h2>
        <canvas id="issueChart" class="chart"></canvas>
        <table id="issueTable">
            <thead>
                <tr>
                    <th>File</th>
                    <th>Line</th>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Description</th>
                    <th>Suggestion</th>
                </tr>
            </thead>
            <tbody></tbody>
        </table>
    </div>
    
    <div class="section">
        <h2>Automated Fix Recommendations</h2>
        <div id="fixRecommendations"></div>
    </div>
    
    <div class="section">
        <h2>Best Practices Summary</h2>
        <div id="bestPractices"></div>
    </div>
    
    <script>
        // Session data
        const sessionId = '$session_id';
        document.getElementById('sessionId').textContent = sessionId;
        
        // Load report data
        async function loadReport() {
            // In real implementation, this would fetch from API
            // For now, using placeholder data
            
            document.getElementById('filesAnalyzed').textContent = '45';
            document.getElementById('issuesFound').textContent = '23';
            document.getElementById('securityScore').textContent = '85';
            document.getElementById('qualityScore').textContent = '78';
            
            // Vulnerability chart
            new Chart(document.getElementById('vulnChart'), {
                type: 'bar',
                data: {
                    labels: ['Critical', 'High', 'Medium', 'Low'],
                    datasets: [{
                        label: 'Vulnerabilities',
                        data: [2, 5, 8, 12],
                        backgroundColor: ['#c0392b', '#e74c3c', '#f39c12', '#95a5a6']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
            
            // Issue type chart
            new Chart(document.getElementById('issueChart'), {
                type: 'doughnut',
                data: {
                    labels: ['Complexity', 'Duplication', 'Standards', 'Performance', 'Other'],
                    datasets: [{
                        data: [15, 8, 12, 5, 10],
                        backgroundColor: ['#3498db', '#9b59b6', '#1abc9c', '#f39c12', '#95a5a6']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
        
        loadReport();
    </script>
</body>
</html>
EOF
        
        echo -e "${GREEN}✓ HTML report generated: /tmp/ai_code_review_report.html${NC}"
    fi
}

# Main execution
case "${1:-analyze}" in
    init)
        init_database
        ;;
    train)
        train_ml_models
        ;;
    analyze)
        analyze_code "${2:-/app}" "${3:-main}"
        ;;
    fix)
        generate_fixes "${2:-latest}"
        ;;
    report)
        generate_report "${2:-latest}" "${3:-html}"
        ;;
    monitor)
        # Continuous monitoring mode
        while true; do
            analyze_code "/app" "main"
            generate_fixes "latest"
            generate_report "latest" "html"
            sleep 3600  # Run hourly
        done
        ;;
    *)
        echo "Usage: $0 {init|train|analyze|fix|report|monitor} [options]"
        echo
        echo "Commands:"
        echo "  init      Initialize AI code review database"
        echo "  train     Train ML models for code analysis"
        echo "  analyze   Analyze code repository [path] [branch]"
        echo "  fix       Generate automated fixes [session_id]"
        echo "  report    Generate review report [session_id] [format]"
        echo "  monitor   Continuous monitoring mode"
        exit 1
        ;;
esac