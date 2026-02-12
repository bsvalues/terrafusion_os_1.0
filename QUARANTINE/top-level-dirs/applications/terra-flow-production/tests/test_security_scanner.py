"""
Test Security Scanner

This module tests the security scanner functionality.
"""

import os
import sys
import unittest
import tempfile
import json
from unittest.mock import patch, MagicMock

# Add parent directory to path to import modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from security.security_scanner import SecurityScanner


class TestSecurityScanner(unittest.TestCase):
    """Test cases for the security scanner"""

    def setUp(self):
        """Set up test environment"""
        self.test_config = {
            "scan_paths": ["."],
            "exclude_paths": ["node_modules", "venv", ".git", "__pycache__"],
            "file_extensions": [".py", ".js", ".html"],
            "checks_enabled": {
                "vulnerability_scan": True,
                "configuration_audit": True,
                "dependency_check": True,
                "secret_detection": True,
                "permission_audit": False  # Disable for testing
            }
        }
        self.scanner = SecurityScanner()
        self.scanner.config = self.test_config

    def test_scanner_initialization(self):
        """Test scanner initialization"""
        self.assertIsInstance(self.scanner, SecurityScanner)
        self.assertEqual(self.scanner.config["scan_paths"], ["."])
        self.assertIn("exclude_paths", self.scanner.config)
        self.assertIn("file_extensions", self.scanner.config)

    @patch('security.security_scanner.os.walk')
    def test_vulnerability_scan(self, mock_walk):
        """Test vulnerability scanning functionality"""
        # Prepare mock data
        mock_walk.return_value = [
            ('.', [], ['test.py']),
        ]
        
        # Create a mock file with a vulnerability
        test_content = """
        def fetch_data(user_input):
            query = "SELECT * FROM users WHERE id = " + user_input
            return db.execute(query)
        """
        
        with patch('builtins.open', unittest.mock.mock_open(read_data=test_content)):
            # Run the scan
            with patch.object(self.scanner, '_scan_file_for_vulnerabilities') as mock_scan_file:
                self.scanner._perform_vulnerability_scan()
                mock_scan_file.assert_called()

    def test_calculate_severity(self):
        """Test severity calculation"""
        self.assertEqual(self.scanner._calculate_severity("sql_injection"), "critical")
        self.assertEqual(self.scanner._calculate_severity("xss"), "high")
        self.assertEqual(self.scanner._calculate_severity("insecure_storage"), "medium")
        self.assertEqual(self.scanner._calculate_severity("unknown"), "medium")

    def test_get_remediation_advice(self):
        """Test remediation advice retrieval"""
        self.assertIn("parameterized queries", self.scanner._get_remediation_advice("sql_injection"))
        self.assertIn("validate", self.scanner._get_remediation_advice("command_injection"))
        self.assertIn("environment variables", self.scanner._get_remediation_advice("insecure_storage"))

    @patch('security.security_scanner.time.time')
    def test_export_results(self, mock_time):
        """Test exporting scan results to a file"""
        mock_time.return_value = 1600000000
        
        # Create sample results
        self.scanner.results = {
            "scan_start_time": "2024-04-18T10:00:00",
            "scan_end_time": "2024-04-18T10:01:00",
            "vulnerability_count": 2,
            "findings": [
                {
                    "type": "vulnerability",
                    "subtype": "sql_injection",
                    "severity": "critical",
                    "file": "test.py",
                    "line": 3,
                    "description": "Potential SQL injection vulnerability found",
                    "evidence": "query = \"SELECT * FROM users WHERE id = \" + user_input",
                    "remediation": "Use parameterized queries or an ORM to prevent SQL injection."
                },
                {
                    "type": "secret",
                    "subtype": "api_key_variable",
                    "severity": "high",
                    "file": "config.py",
                    "line": 10,
                    "description": "Potential hardcoded API key found",
                    "evidence": "API_KEY = \"A***********Z\"",
                    "remediation": "Use environment variables or a secure vault solution instead of hardcoding secrets."
                }
            ],
            "overall_status": "fail"
        }
        
        # Export to a temporary file
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as temp_file:
            try:
                filename = temp_file.name
                result = self.scanner.export_results_to_json(filename)
                
                # Verify export was successful
                self.assertTrue(result)
                
                # Verify file content
                with open(filename, 'r') as f:
                    loaded_data = json.load(f)
                    self.assertEqual(loaded_data["vulnerability_count"], 2)
                    self.assertEqual(loaded_data["overall_status"], "fail")
                    self.assertEqual(len(loaded_data["findings"]), 2)
                    self.assertEqual(loaded_data["findings"][0]["severity"], "critical")
            finally:
                # Clean up
                os.unlink(filename)

    @patch('security.security_scanner.re.search')
    def test_scan_file_for_secrets(self, mock_re_search):
        """Test scanning files for secrets"""
        # Mock regex finding a match
        mock_re_search.return_value = MagicMock()
        mock_re_search.return_value.group.return_value = "API_KEY='abcdef123456'"
        
        # Set up test patterns
        patterns = {
            "api_key": r"API_KEY\s*=\s*['\"]([^'\"]+)['\"]"
        }
        
        # Create a test file
        test_content = """
        # Configuration
        API_KEY='abcdef123456'
        DEBUG=True
        """
        
        with patch('builtins.open', unittest.mock.mock_open(read_data=test_content)):
            # Initial count
            initial_count = len(self.scanner.results.get("findings", []))
            
            # Mock validation to return True
            with patch.object(self.scanner, '_validate_secret_finding', return_value=True):
                self.scanner._scan_file_for_secrets("config.py", patterns)
                
                # Verify a finding was added
                self.assertGreater(len(self.scanner.results.get("findings", [])), initial_count)

    def test_is_version_vulnerable(self):
        """Test version vulnerability checking"""
        # Less than condition
        self.assertTrue(self.scanner._is_version_vulnerable("1.2.3", "<1.2.4"))
        self.assertFalse(self.scanner._is_version_vulnerable("1.2.4", "<1.2.4"))
        self.assertFalse(self.scanner._is_version_vulnerable("1.2.5", "<1.2.4"))
        
        # Less than or equal condition
        self.assertTrue(self.scanner._is_version_vulnerable("1.2.3", "<=1.2.3"))
        self.assertTrue(self.scanner._is_version_vulnerable("1.2.2", "<=1.2.3"))
        self.assertFalse(self.scanner._is_version_vulnerable("1.2.4", "<=1.2.3"))
        
        # Greater than condition
        self.assertTrue(self.scanner._is_version_vulnerable("1.2.5", ">1.2.4"))
        self.assertFalse(self.scanner._is_version_vulnerable("1.2.4", ">1.2.4"))
        self.assertFalse(self.scanner._is_version_vulnerable("1.2.3", ">1.2.4"))
        
        # Exact version match
        self.assertTrue(self.scanner._is_version_vulnerable("1.2.3", "1.2.3"))
        self.assertFalse(self.scanner._is_version_vulnerable("1.2.4", "1.2.3"))

    def test_compare_versions(self):
        """Test version comparison"""
        self.assertEqual(self.scanner._compare_versions("1.2.3", "1.2.3"), 0)
        self.assertEqual(self.scanner._compare_versions("1.2.3", "1.2.4"), -1)
        self.assertEqual(self.scanner._compare_versions("1.2.4", "1.2.3"), 1)
        self.assertEqual(self.scanner._compare_versions("1.10.0", "1.2.0"), 1)
        self.assertEqual(self.scanner._compare_versions("1.0.0", "1.0"), 0)
        self.assertEqual(self.scanner._compare_versions("1", "1.0.0"), 0)

    def test_redact_secret(self):
        """Test secret redaction"""
        # Short string
        self.assertEqual(self.scanner._redact_secret("key=ab", "ab"), "key=****")
        
        # Normal string
        original = "API_KEY='abcdef123456'"
        secret = "abcdef123456"
        redacted = self.scanner._redact_secret(original, secret)
        self.assertIn("API_KEY='a", redacted)
        self.assertIn("6'", redacted)
        self.assertNotIn("bcdef12345", redacted)
        
        # Ensure original text structure is maintained
        self.assertEqual(len(redacted), len(original))

    def test_run_security_scan(self):
        """Test running a complete security scan"""
        # Mock all the scan methods to prevent actual scanning
        with patch.object(self.scanner, '_perform_vulnerability_scan'), \
             patch.object(self.scanner, '_perform_configuration_audit'), \
             patch.object(self.scanner, '_perform_dependency_check'), \
             patch.object(self.scanner, '_perform_secret_detection'), \
             patch.object(self.scanner, '_perform_permission_audit'), \
             patch.object(self.scanner, '_calculate_overall_status'):
            
            # Run the scan
            results = self.scanner.run_security_scan()
            
            # Verify result structure
            self.assertIn("scan_start_time", results)
            self.assertIn("scan_end_time", results)
            self.assertIn("vulnerability_count", results)
            self.assertIn("findings", results)
            self.assertIn("overall_status", results)
            
            # Verify times
            self.assertIsNotNone(results["scan_start_time"])
            self.assertIsNotNone(results["scan_end_time"])
            self.assertIn("scan_duration_seconds", results)
            
    def test_calculate_overall_status(self):
        """Test calculating the overall status based on findings"""
        # No findings
        self.scanner.results = {"findings": []}
        self.scanner._calculate_overall_status()
        self.assertEqual(self.scanner.results["overall_status"], "pass")
        
        # Low severity findings only
        self.scanner.results = {"findings": [
            {"severity": "low"},
            {"severity": "low"}
        ]}
        self.scanner._calculate_overall_status()
        self.assertEqual(self.scanner.results["overall_status"], "pass")
        
        # Medium severity findings
        self.scanner.results = {"findings": [
            {"severity": "medium"},
            {"severity": "medium"},
            {"severity": "medium"},
            {"severity": "medium"},
            {"severity": "medium"},
            {"severity": "medium"}
        ]}
        self.scanner._calculate_overall_status()
        self.assertEqual(self.scanner.results["overall_status"], "warn")
        
        # High severity findings
        self.scanner.results = {"findings": [
            {"severity": "high"},
            {"severity": "high"},
            {"severity": "high"},
            {"severity": "high"}
        ]}
        self.scanner._calculate_overall_status()
        self.assertEqual(self.scanner.results["overall_status"], "fail")
        
        # Critical severity findings
        self.scanner.results = {"findings": [
            {"severity": "critical"}
        ]}
        self.scanner._calculate_overall_status()
        self.assertEqual(self.scanner.results["overall_status"], "fail")


if __name__ == '__main__':
    unittest.main()