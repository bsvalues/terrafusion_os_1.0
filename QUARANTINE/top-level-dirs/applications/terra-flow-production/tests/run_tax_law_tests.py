"""Run tax law compliance tests with minimal output"""
import sys
import os
import unittest
import logging

# Turn off logging completely to ensure clean test output
logging.basicConfig(level=logging.CRITICAL)

# Disable any other logging to keep the output clean
for logger_name in logging.Logger.manager.loggerDict:
    logging.getLogger(logger_name).setLevel(logging.CRITICAL)

# Suppress warnings
import warnings
warnings.filterwarnings("ignore")

# Add the project root to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import the test case
from test_tax_law_compliance import TestTaxLawComplianceChecks

if __name__ == '__main__':
    # Create a test suite with all tests from TestTaxLawComplianceChecks
    suite = unittest.TestLoader().loadTestsFromTestCase(TestTaxLawComplianceChecks)
    
    print("\n\n" + "="*80)
    print("RUNNING TAX LAW COMPLIANCE TESTS")
    print("="*80 + "\n")
    
    # Run the tests with verbosity=2 for detailed output
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    
    print("\n" + "="*80)
    print(f"COMPLETED: {result.testsRun} tests run")
    print(f"PASSED: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"FAILED: {len(result.failures)}")
    print(f"ERRORS: {len(result.errors)}")
    print("="*80 + "\n")
    
    # Exit with non-zero code if tests failed
    if not result.wasSuccessful():
        sys.exit(1)