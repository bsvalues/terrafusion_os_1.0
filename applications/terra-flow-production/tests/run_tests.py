#!/usr/bin/env python
import unittest
import sys
import os

# Add the parent directory to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Import test modules
from test_system_architecture import TestSystemArchitecture
from test_file_operations import TestFileOperations
from test_authentication import TestAuthentication
from test_gis_utils import TestGISUtils
from test_rag import TestRAG

if __name__ == '__main__':
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add test cases
    test_suite.addTest(unittest.makeSuite(TestSystemArchitecture))
    test_suite.addTest(unittest.makeSuite(TestFileOperations))
    test_suite.addTest(unittest.makeSuite(TestAuthentication))
    test_suite.addTest(unittest.makeSuite(TestGISUtils))
    test_suite.addTest(unittest.makeSuite(TestRAG))
    
    # Run tests
    result = unittest.TextTestRunner(verbosity=2).run(test_suite)
    
    # Exit with appropriate status code
    sys.exit(not result.wasSuccessful())